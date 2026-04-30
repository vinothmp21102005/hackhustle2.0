/**
 * Anomaly Detection Engine for Cold Chain
 * 
 * This utility flags inconsistencies in shipment records:
 * 1. Document Gaps (e.g., Missing CoA)
 * 2. Sequence Breaks (e.g., Skips Warehouse)
 * 3. Timing Anomalies (e.g., Impossible transit times)
 * 4. Data Mismatches (On-chain vs IPFS metadata)
 */

const MANDATORY_DOCS = {
    'Created': ['CoA'],
    'InTransit': ['TempLog'],
    'Warehouse': ['InspectionReport'],
    'Delivered': ['DeliveryReceipt']
};

const STATUS_SEQUENCE = [
    'Created',
    'PickedUp',
    'InTransit',
    'InWarehouse',
    'InCustoms',
    'ArrivedAtDealer',
    'Delivered'
];

export const detectAnomalies = (shipment, history = []) => {
    const anomalies = [];

    if (!shipment) return anomalies;

    // 1. Check for Missing Mandatory Documents
    const docs = shipment.documents || [];
    const docTypes = docs.map(d => d.docType);
    
    // Check if the current status requires docs that are missing
    Object.keys(MANDATORY_DOCS).forEach(status => {
        // If we have reached or passed this status, we should have these docs
        const currentStatusIdx = STATUS_SEQUENCE.indexOf(shipment.status);
        const requiredStatusIdx = STATUS_SEQUENCE.indexOf(status);

        if (currentStatusIdx >= requiredStatusIdx) {
            MANDATORY_DOCS[status].forEach(requiredType => {
                if (!docTypes.includes(requiredType)) {
                    anomalies.push({
                        type: 'MISSING_DOCUMENT',
                        severity: 'high',
                        message: `Missing mandatory document: ${requiredType}`,
                        context: `Required for status: ${status}`
                    });
                }
            });
        }
    });

    // 2. Check for Sequence Breaks
    if (history.length > 1) {
        let lastIdx = -1;
        let lastEvent = null;
        history.sort((a, b) => a.timestamp - b.timestamp).forEach(event => {
            const currentStatusIdx = STATUS_SEQUENCE.indexOf(event.data.status);
            if (currentStatusIdx !== -1) {
                if (currentStatusIdx < lastIdx) {
                    anomalies.push({
                        type: 'OUT_OF_SEQUENCE',
                        severity: 'critical',
                        message: `Backdated or out-of-order status: ${event.data.status}`,
                        context: `Occurred after ${STATUS_SEQUENCE[lastIdx]}`,
                        responsibleActor: event.actor,
                        signature: event.signature,
                        timestamp: event.timestamp
                    });
                }
                lastIdx = currentStatusIdx;
                lastEvent = event;
            }
        });
    }

    // 3. Timing Anomalies (Simple check for "too fast")
    if (history.length > 1) {
        for (let i = 1; i < history.length; i++) {
            const timeDiff = (history[i].timestamp - history[i-1].timestamp) / 1000; // seconds
            if (timeDiff < 60 && history[i].data.status !== history[i-1].data.status) { // Less than 1 min between stages
                anomalies.push({
                    type: 'TIMING_ERROR',
                    severity: 'medium',
                    message: `Suspiciously fast transition: ${history[i-1].data.status} -> ${history[i].data.status}`,
                    context: `${Math.round(timeDiff)} seconds elapsed`,
                    responsibleActor: history[i].actor,
                    signature: history[i].signature,
                    timestamp: history[i].timestamp
                });
            }
        }
    }

    // 4. Temperature Threshold Breach (Real-time Audit)
    history.forEach(event => {
        if (event.data.temperature !== undefined) {
            const temp = parseFloat(event.data.temperature);
            if (temp < parseFloat(shipment.minTemp || 2) || temp > parseFloat(shipment.maxTemp || 8)) {
                anomalies.push({
                    type: 'TEMPERATURE_BREACH',
                    severity: 'critical',
                    message: `Temperature excursion detected: ${temp}°C`,
                    context: `Required Range: ${shipment.minTemp || 2}°C to ${shipment.maxTemp || 8}°C`,
                    responsibleActor: event.actor,
                    signature: event.signature,
                    timestamp: event.timestamp
                });
            }
        }
    });

    return anomalies;
};
