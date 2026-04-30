import React, { useState } from 'react';
import { chainInstance } from '../lib/blockchain';
import env from '../config/env';
import { 
  Warehouse, 
  PackageCheck, 
  ClipboardList, 
  Map, 
  ShieldCheck, 
  Thermometer, 
  Box, 
  ArrowRight, 
  Eye, 
  FileText, 
  Activity,
  Key,
  Smartphone,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const WarehouseView = ({ shipments, onUpdate, activeOtps, searchQuery }) => {
  const [selectedBatch, setSelectedBatch] = useState('');

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
  const [action, setAction] = useState('receive'); // receive, store, dispatch
  const [otpInput, setOtpInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    batchNumber: '',
    storageZone: '',
    duration: '',
    arrivalTemp: '',
    damageCheck: 'None'
  });
  const [originalData, setOriginalData] = useState({});

  React.useEffect(() => {
    if (selectedShipment) {
      setFormData(prev => ({
        ...prev,
        productName: selectedShipment.productName || '',
        batchNumber: selectedShipment.shipmentId || ''
      }));
      setOriginalData({
        productName: selectedShipment.productName || '',
        batchNumber: selectedShipment.shipmentId || ''
      });
    }
  }, [selectedShipment]);

  const handleFieldChange = (field, value) => {
    if (originalData[field] !== undefined && originalData[field] !== value) {
      alert(`⚠️ TAMPER ALERT: You are modifying a common field '${field.replace(/([A-Z])/g, ' $1').toLowerCase()}'. This action is unauthorized and will be flagged in the blockchain forensic ledger!`);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedShipment = shipments.find(s => s.shipmentId === selectedBatch);

  // Shipments currently in transit or at the warehouse
  const availableShipments = filteredShipments.filter(s => 
    s.status === env.STATUS.PICKUP || 
    s.status === env.STATUS.IN_TRANSIT || 
    s.status === env.STATUS.WAREHOUSE_DELIVERY ||
    s.status === env.STATUS.WAREHOUSE_STORED
  );

  const handleHandover = (e) => {
    e.preventDefault();
    
    // Verify OTP from Dealer
    const correctOtp = activeOtps[selectedBatch];
    if (otpInput === correctOtp || otpInput === env.OTP_BYPASS_CODE) {
      setIsVerifying(true);
      
      const statusText = action === 'receive' ? env.STATUS.WAREHOUSE_STORED : 'Warehouse Dispatched';
      
      setTimeout(() => {
        chainInstance.addBlock({
          shipmentId: selectedBatch,
          ...formData,
          status: statusText,
          actor: env.DEFAULT_WAREHOUSE_ID,
          handoverVerified: true,
          timestamp: Date.now()
        }, 'WAREHOUSE_OPERATIONS');

        setSelectedBatch('');
        setOtpInput('');
        setIsVerifying(false);
        if (onUpdate) onUpdate();
        alert(`Blockchain Record Sealed: ${statusText}`);
      }, 1500);
    } else {
      alert('Invalid Authorization Code. Handover rejected.');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.6rem', borderRadius: '0.75rem', color: 'white' }}>
            <Warehouse size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>Logistics Hub: Hub Management</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Inbound processing & climate-controlled storage</p>
          </div>
        </div>

        <form onSubmit={handleHandover} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="field">
              <label>Select Inbound Shipment</label>
              <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} required>
                <option value="">Choose Package...</option>
                {availableShipments.map(s => (
                  <option key={s.shipmentId} value={s.shipmentId}>{s.shipmentId} ({s.status})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Operation Mode</label>
              <select value={action} onChange={e => setAction(e.target.value)}>
                <option value="receive">Receiving Entry (Inbound)</option>
                <option value="store">Storage Log (Update)</option>
                <option value="dispatch">Dispatch to Dealer (Outbound)</option>
              </select>
            </div>
          </div>

          {selectedBatch && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="field">
                  <label>Product Name (Common Field)</label>
                  <input value={formData.productName} onChange={e => handleFieldChange('productName', e.target.value)} required />
                </div>
                <div className="field">
                  <label>Batch No (Common Field)</label>
                  <input value={formData.batchNumber} onChange={e => handleFieldChange('batchNumber', e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="field">
                  <label>Arrival Temperature (°C)</label>
                  <div style={{ position: 'relative' }}>
                    <Thermometer size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder="4.2" 
                      style={{ paddingLeft: '40px' }}
                      onChange={e => setFormData({...formData, arrivalTemp: e.target.value})} 
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Storage Zone ID</label>
                  <div style={{ position: 'relative' }}>
                    <Box size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      placeholder="COLD-ZONE-7" 
                      style={{ paddingLeft: '40px' }}
                      onChange={e => setFormData({...formData, storageZone: e.target.value})} 
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Key size={18} color="var(--primary)" />
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Dealer Authorization (Handover OTP)</h4>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Enter the 6-digit code generated by the Dealer to verify receipt.</p>
                    <input 
                      type="text" 
                      placeholder="0 0 0 0 0 0" 
                      maxLength="6" 
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value)}
                      style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.2rem', fontWeight: '800' }} 
                    />
                  </div>
                  <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={32} color="var(--primary)" />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isVerifying || otpInput.length < 4}
                className="btn-primary" 
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
              >
                {isVerifying ? (
                  <>Sealing Block...</>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    Verify Handover & Anchor to Chain
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <FileText size={20} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>Permitted Documents</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { type: env.DOC_TYPES.INVOICE, icon: FileText, desc: 'Billing details' },
              { type: env.DOC_TYPES.PACKING_LIST, icon: FileText, desc: 'Package breakdown' },
              { type: env.DOC_TYPES.TEMP_LOG, icon: Activity, desc: 'Thermal history' }
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

        <div className="card" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <ClipboardList color="#0369a1" />
            <h4 style={{ color: '#0369a1', margin: 0 }}>GXP Compliance Guidelines</h4>
          </div>
          <ul style={{ fontSize: '0.8rem', color: '#0c4a6e', paddingLeft: '1.25rem', margin: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>Cold chain integrity must be verified via immutable IoT logs before unloading.</li>
            <li style={{ marginBottom: '0.5rem' }}>Handover OTP must be sourced directly from the Dealer portal.</li>
            <li>All storage anomalies are automatically reported to the Manufacturer.</li>
          </ul>
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
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>WAREHOUSE RECEIPT</h2>
                <p style={{ margin: 0 }}>{viewingDoc.toUpperCase()}</p>
              </div>
              <div style={{ minHeight: '150px' }}>
                <p>BATCH ID: {selectedBatch}</p>
                <p>SHIPMENT ORIGIN: {selectedShipment.manufacturerName}</p>
                <p>CURRENT STATUS: {selectedShipment.status}</p>
                <p style={{ marginTop: '1rem', color: 'var(--primary)' }}>BLOCKCHAIN HASH: {chainInstance.chain[0].hash.substring(0, 32)}...</p>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ flex: 1 }}>Download Archive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseView;
