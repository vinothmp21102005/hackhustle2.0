import React, { useState } from 'react';
import { chainInstance } from '../lib/blockchain';
import env from '../config/env';
import { 
  ShieldCheck, 
  FileCheck, 
  Eye, 
  FileText, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  FileSearch,
  Lock,
  Globe
} from 'lucide-react';

const CustomsBrokerView = ({ shipments, onUpdate, searchQuery }) => {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  const filteredShipments = searchQuery 
    ? shipments.filter(s => 
        (s.shipmentId || s.id || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : shipments;

  // Auto-select if search query matches exactly
  React.useEffect(() => {
    if (searchQuery) {
      const match = shipments.find(s => 
        (s.shipmentId || s.id || '').toLowerCase() === searchQuery.toLowerCase()
      );
      if (match) {
        setSelectedBatch(match.shipmentId || match.id);
      }
    }
  }, [searchQuery, shipments]);

  const selectedShipment = shipments.find(s => s.shipmentId === selectedBatch);

  // Shipments that need customs clearance
  const pendingShipments = filteredShipments.filter(s => 
    s.status !== env.STATUS.CUSTOMS_VERIFIED && 
    s.status !== env.STATUS.DEALER_ACCEPTED
  );

  const handleVerify = () => {
    if (!selectedBatch) return;
    setIsVerifying(true);
    
    setTimeout(() => {
      chainInstance.addBlock({
        shipmentId: selectedBatch,
        status: env.STATUS.CUSTOMS_VERIFIED,
        actor: 'CUSTOMS_OFFICER_08',
        verificationType: 'FULL_DOCUMENT_AUDIT',
        complianceStatus: 'PASS',
        timestamp: Date.now()
      }, 'CUSTOMS_CLEARANCE');

      setIsVerifying(false);
      setSelectedBatch('');
      if (onUpdate) onUpdate();
      alert('Customs verification anchored to blockchain. Shipment cleared for next phase.');
    }, 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#0f172a', padding: '0.6rem', borderRadius: '0.75rem', color: 'white' }}>
            <Globe size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>Customs Regulatory Portal</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>International compliance & document verification</p>
          </div>
        </div>

        <div className="field" style={{ marginBottom: '2rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '0.75rem' }}>
            Select Shipment for Audit
          </label>
          <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
            <option value="">Choose Shipment...</option>
            {pendingShipments.map(s => (
              <option key={s.shipmentId} value={s.shipmentId}>{s.shipmentId} - {s.productName}</option>
            ))}
          </select>
        </div>

        {selectedShipment && (
          <div className="animate-fade">
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>Compliance Checklist</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: '600' }}>
                  <Lock size={14} /> Blockchain Verified
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'Certificate of Analysis (COA) Match',
                  'Batch/Lot ID Synchronization',
                  'Handling Instructions Compliance',
                  'Producer Digital Signature Validity',
                  'Packing List Verification'
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <CheckCircle2 size={16} color="var(--success)" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleVerify}
              disabled={isVerifying}
              className="btn-primary"
              style={{ width: '100%', background: '#0f172a', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
            >
              {isVerifying ? (
                <>Auditing Ledger...</>
              ) : (
                <>
                  <FileCheck size={20} />
                  Approve Customs Clearance
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <FileSearch size={20} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>Regulatory Documents</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { type: env.DOC_TYPES.COA, icon: FileText, desc: 'Quality certificates' },
              { type: env.DOC_TYPES.INVOICE, icon: FileText, desc: 'Commercial invoice' },
              { type: env.DOC_TYPES.PACKING_LIST, icon: FileText, desc: 'Shipping manifest' },
              { type: env.DOC_TYPES.HANDLING, icon: Activity, desc: 'Storage requirements' }
            ].map(doc => (
              <div 
                key={doc.type}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  padding: '1rem', 
                  background: 'white', 
                  borderRadius: '1rem', 
                  border: '1px solid var(--border)',
                  cursor: selectedBatch ? 'pointer' : 'not-allowed',
                  opacity: selectedBatch ? 1 : 0.6
                }}
                onClick={() => selectedBatch && setViewingDoc(doc.type)}
              >
                <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '0.5rem' }}>
                  <doc.icon size={18} color="var(--text-main)" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>{doc.type}</p>
                </div>
                <Eye size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <AlertTriangle color="#dc2626" />
            <h4 style={{ color: '#991b1b', margin: 0 }}>Enforcement Alert</h4>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#991b1b', margin: 0 }}>
            Any discrepancy between physical batch numbers and blockchain anchors must be reported immediately. The ledger is the single source of truth for cross-border audits.
          </p>
        </div>
      </div>

      {viewingDoc && (
        <div className="modal-overlay" onClick={() => setViewingDoc(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card animate-scale" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>{viewingDoc}</h3>
              <button onClick={() => setViewingDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><XCircle /></button>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>OFFICIAL CUSTOMS AUDIT</h2>
                <p style={{ margin: 0 }}>{viewingDoc.toUpperCase()}</p>
              </div>
              <div style={{ minHeight: '150px' }}>
                <p>BATCH ID: {selectedBatch}</p>
                <p>ORIGIN COUNTRY: INDIA</p>
                <p>PRODUCER ID: {selectedShipment.actor}</p>
                <p style={{ marginTop: '1rem', color: 'var(--primary)' }}>BLOCKCHAIN SIGNATURE VALID</p>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ flex: 1, background: '#0f172a' }}>Export for Audit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomsBrokerView;
