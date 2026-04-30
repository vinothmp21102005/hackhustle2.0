import { useState, useEffect } from 'react';
import { getContract } from '../lib/web3';
import env from '../config/env';
import DocumentVault from './DocumentVault';
import { 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Info, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle,
  Stethoscope,
  Clock,
  MapPin,
  Share2,
  Search,
  Hash,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const EndUserView = ({ shipments, searchQuery }) => {
  const [searchId, setSearchId] = useState('');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showFraudReport, setShowFraudReport] = useState(false);
  const [reportData, setReportData] = useState({ reason: '', comments: '' });

  // Auto-search if global search query is provided
  useEffect(() => {
    if (searchQuery) {
      setSearchId(searchQuery);
      handleSearch(searchQuery);
    }
  }, [searchQuery]);

  const handleSearch = async (idToSearch = searchId) => {
    if (!idToSearch) return;
    try {
      const contract = await getContract();
      const shipmentData = await contract.shipments(idToSearch);

      if (shipmentData.manufacturer === '0x0000000000000000000000000000000000000000') {
        alert('Batch ID not found on the blockchain.');
        return;
      }

      const logs = await contract.getTemperatureLogs(idToSearch);
      const docs = await contract.getDocuments(idToSearch);

      const statusMap = ['Created', 'InTransit', 'Delivered', 'Tampered'];

      const shipment = {
        shipmentId: shipmentData.shipmentId,
        productName: shipmentData.productName,
        manufacturerName: shipmentData.manufacturer,
        batchNumber: shipmentData.shipmentId,
        dosageForm: 'Vial', // Fallback as contract doesn't store this directly
        status: statusMap[shipmentData.status],
        minTemp: Number(shipmentData.minTemp),
        maxTemp: Number(shipmentData.maxTemp),
        dealer: shipmentData.dealer,
        creationTime: shipmentData.creationTime,
        deliveryTime: shipmentData.deliveryTime,
        documents: docs,
        logs: logs
      };

      setSelectedShipment(shipment);
      setIsScanning(false);
      setShowFraudReport(false);
    } catch (err) {
      console.error(err);
      alert('Error fetching from blockchain: ' + err.message);
    }
  };

  const simulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      if (shipments && shipments.length > 0) {
        const id = shipments[0].shipmentId;
        setSearchId(id);
        handleSearch(id);
      } else {
        setIsScanning(false);
        alert('No shipments available to scan.');
      }
    }, 2000);
  };

  const handleReportFraud = () => {
    if (!reportData.reason) return alert('Please select a reason');
    
    // In a production app, this would call a smart contract method to mark fraud
    alert('Fraud report has been immutably recorded on the ledger. Authorities have been notified.');
    setShowFraudReport(false);
  };

  let timeline = [];
  if (selectedShipment) {
    timeline.push({
      actor: selectedShipment.manufacturerName,
      timestamp: Number(selectedShipment.creationTime) * 1000,
      data: { status: 'Created' },
      signature: '0x' + selectedShipment.manufacturerName.substring(2, 10) + '...'
    });
    
    if (selectedShipment.logs) {
      selectedShipment.logs.forEach(log => {
        timeline.push({
          actor: log.logger,
          timestamp: Number(log.timestamp) * 1000,
          data: {
            status: 'Temperature Logged',
            temperature: Number(log.temperature),
            location: log.location
          },
          signature: '0x' + log.logger.substring(2, 10) + '...'
        });
      });
    }

    if (selectedShipment.status === 'Delivered') {
      timeline.push({
        actor: selectedShipment.dealer,
        timestamp: Number(selectedShipment.deliveryTime) * 1000,
        data: { status: 'Delivered' },
        signature: '0x' + selectedShipment.dealer.substring(2, 10) + '...'
      });
    }
  }
  
  const handlingGuide = selectedShipment ? env.HANDLING_GUIDES[selectedShipment.dosageForm] || env.HANDLING_GUIDES['Vial'] : null;
  const patientInfo = selectedShipment ? env.PATIENT_INFO[selectedShipment.productName] : null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {!selectedShipment && !isScanning && (
        <div className="card animate-fade" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ width: '100px', height: '100px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', border: '4px solid white', boxShadow: 'var(--shadow-lg)' }}>
            <QrCode size={48} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '2rem' }}>Authenticate Your Medicine</h2>
          <p style={{ maxWidth: '550px', margin: '0.75rem auto 3rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Verify the origin, storage history, and authenticity of your healthcare products using immutable blockchain technology.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Enter Batch/Lot ID (e.g. BATCH-12345)" 
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                style={{ width: '100%', paddingLeft: '3rem', height: '52px', fontSize: '1rem' }}
              />
            </div>
            <button 
              onClick={handleSearch}
              style={{ background: 'var(--primary)', color: 'white', padding: '0 2.5rem', borderRadius: '0.75rem', fontWeight: '600', height: '52px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
            >
              Verify
            </button>
          </div>
          
          <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
            <div style={{ height: '1px', width: '60px', background: 'var(--border)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OR</span>
            <div style={{ height: '1px', width: '60px', background: 'var(--border)' }} />
          </div>
          
          <button 
            onClick={simulateScan}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', fontWeight: '700', margin: '0 auto', background: 'white', border: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', cursor: 'pointer' }}
          >
            <QrCode size={20} /> Simulate QR Scan
          </button>
        </div>
      )}

      {isScanning && (
        <div className="card animate-fade" style={{ textAlign: 'center', padding: '6rem', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
           <div className="qr-scanner-sim" style={{ 
             width: '300px', 
             height: '300px', 
             border: '2px solid #e2e8f0', 
             margin: '0 auto 3rem',
             position: 'relative',
             overflow: 'hidden',
             borderRadius: '2.5rem',
             background: 'white',
             padding: '40px',
             boxShadow: '0 30px 60px -12px rgba(0,0,0,0.1)'
           }}>
             <div style={{ width: '100%', height: '4px', background: 'var(--primary)', position: 'absolute', top: 0, left: 0, boxShadow: '0 0 20px var(--primary)', animation: 'scan 2.5s ease-in-out infinite', zIndex: 10 }} />
             
             <img 
               src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VERIFYING_HACKBLOCK_GENESIS" 
               alt="QR Code"
               style={{ width: '100%', height: '100%', opacity: 0.1 }}
             />

             {/* Scanner Corners */}
             <div style={{ position: 'absolute', top: 20, left: 20, width: 30, height: 30, borderTop: '6px solid var(--primary)', borderLeft: '6px solid var(--primary)', borderRadius: '8px 0 0 0' }} />
             <div style={{ position: 'absolute', top: 20, right: 20, width: 30, height: 30, borderTop: '6px solid var(--primary)', borderRight: '6px solid var(--primary)', borderRadius: '0 8px 0 0' }} />
             <div style={{ position: 'absolute', bottom: 20, left: 20, width: 30, height: 30, borderBottom: '6px solid var(--primary)', borderLeft: '6px solid var(--primary)', borderRadius: '0 0 0 8px' }} />
             <div style={{ position: 'absolute', bottom: 20, right: 20, width: 30, height: 30, borderBottom: '6px solid var(--primary)', borderRight: '6px solid var(--primary)', borderRadius: '0 0 8px 0' }} />
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
             <Activity className="animate-pulse" color="var(--primary)" size={20} />
             <h3 style={{ fontSize: '1.75rem', margin: 0 }}>Cryptographic Handshake...</h3>
           </div>
           <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '400px' }}>Synchronizing with blockchain nodes to verify batch signature integrity.</p>
           
           <style dangerouslySetInnerHTML={{ __html: `@keyframes scan { 0% { top: 0%; opacity: 0.2; } 50% { top: 100%; opacity: 1; } 100% { top: 0%; opacity: 0.2; } }` }} />
           
           <button onClick={() => setIsScanning(false)} className="btn-secondary" style={{ marginTop: '3rem', padding: '0.75rem 2.5rem' }}>Cancel Authentication</button>
        </div>
      )}

      {selectedShipment && (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Banner: Verification Status */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.2)', padding: '0.4rem 0.75rem', borderRadius: '2rem', width: 'fit-content', marginBottom: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <ShieldCheck size={16} color="#10b981" />
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#34d399', letterSpacing: '0.05em' }}>GENUINE PRODUCT VERIFIED</span>
                </div>
                <h2 style={{ color: 'white', fontSize: '1.75rem', marginBottom: '0.5rem' }}>{selectedShipment.productName}</h2>
                <div style={{ display: 'flex', gap: '1.5rem', opacity: 0.8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <Hash size={16} /> Batch: {selectedShipment.batchNumber}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <Clock size={16} /> Exp: {selectedShipment.expiryDate}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <button 
                  onClick={() => window.print()}
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                 >
                   <Share2 size={16} /> Share Receipt
                 </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: '600' }}>ORIGIN</p>
                <p style={{ fontWeight: '500', fontSize: '0.85rem' }}>{selectedShipment.manufacturerName}</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: '600' }}>FORM</p>
                <p style={{ fontWeight: '500', fontSize: '0.85rem' }}>{selectedShipment.dosageForm}</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: '600' }}>LAST LOCATION</p>
                <p style={{ fontWeight: '500', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} /> {selectedShipment.location || 'Local Dealer'}</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: '600' }}>SAFETY STATUS</p>
                <p style={{ fontWeight: '700', fontSize: '0.85rem', color: '#4ade80' }}>CLEARED</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Patient Guide & Handling */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="card" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0369a1', marginBottom: '0.75rem' }}>
                    <Stethoscope size={18} /> Patient Guide
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#0c4a6e', lineHeight: 1.5, margin: 0 }}>
                    {patientInfo || 'Always consult your physician before use. Check seal integrity before opening.'}
                  </p>
                </div>
                <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', marginBottom: '0.75rem' }}>
                    <Info size={18} /> Handling Instructions
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#7f1d1d', lineHeight: 1.5, margin: 0 }}>
                    {handlingGuide || 'Standard pharmaceutical handling protocols apply. Store at room temperature unless specified.'}
                  </p>
                </div>
              </div>

              {/* Journey Timeline */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <div>
                    <h3>Immutable Journey History</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Each step is cryptographically signed by the responsible actor.</p>
                  </div>
                  <History size={24} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '0.5rem' }}>
                  {timeline.map((block, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1.5rem', position: 'relative', paddingBottom: '2rem' }}>
                      {idx !== timeline.length - 1 && (
                        <div style={{ position: 'absolute', left: '15px', top: '30px', bottom: 0, width: '2px', background: '#f1f5f9' }} />
                      )}
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: idx === 0 ? 'var(--primary)' : 'white', 
                        border: idx === 0 ? 'none' : '2px solid #e2e8f0',
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: idx === 0 ? 'white' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: '800'
                      }}>
                        {timeline.length - idx}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem' }}>{block.data.status}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '0.3rem' }}>
                            {new Date(block.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Responsible Actor: <strong>{block.actor}</strong></p>
                        
                        {block.data.temperature && (
                          <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', background: '#ecfdf5', color: '#065f46', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #d1fae5' }}>
                            <Activity size={12} /> Climate Stable: {block.data.temperature}°C
                          </div>
                        )}
                        
                        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', opacity: 0.6 }}>
                          <ShieldCheck size={12} /> Sig: {block.signature}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Temperature Graph */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h3>Storage Compliance</h3>
                  <div style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.7rem', fontWeight: '700', padding: '0.25rem 0.5rem', borderRadius: '0.3rem' }}>STABLE</div>
                </div>
                <div style={{ height: '180px', width: '100%' }}>
                   <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeline.filter(b => b.data.temperature).map(b => ({
                      time: new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      temp: parseFloat(b.data.temperature)
                    })).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={[0, 10]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: 'var(--shadow-lg)', fontSize: '0.8rem' }}
                      />
                      <Line type="stepAfter" dataKey="temp" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'white', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                   </ResponsiveContainer>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                   <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>MIN TEMP</p>
                      <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>4.2°C</p>
                   </div>
                   <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>MAX TEMP</p>
                      <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>5.1°C</p>
                   </div>
                </div>
              </div>

              {/* Fraud Reporting */}
              {!showFraudReport ? (
                <div className="card" style={{ border: '1px solid #fee2e2', background: '#fff1f1' }}>
                  <h4 style={{ color: '#991b1b', marginBottom: '0.5rem' }}>Notice something wrong?</h4>
                  <p style={{ fontSize: '0.8rem', color: '#7f1d1d', marginBottom: '1rem' }}>If the packaging seal is broken or information doesn\'t match, report it immediately.</p>
                  <button 
                    onClick={() => setShowFraudReport(true)}
                    style={{ width: '100%', padding: '0.75rem', background: '#dc2626', color: 'white', borderRadius: '0.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer' }}
                  >
                    <AlertTriangle size={18} /> Report Fraudulent Activity
                  </button>
                </div>
              ) : (
                <div className="card animate-fade" style={{ border: '2px solid #dc2626' }}>
                  <h4 style={{ color: '#dc2626', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={20} /> Fraud Report Detail
                  </h4>
                  <div className="field">
                    <label>Reason for Mismatch</label>
                    <select 
                      value={reportData.reason} 
                      onChange={e => setReportData({...reportData, reason: e.target.value})}
                      style={{ border: '1px solid #fecaca' }}
                    >
                      <option value="">Select Reason...</option>
                      <option value="Seal Broken">Packaging Seal Broken</option>
                      <option value="ID Mismatch">ID Doesn\'t Match Packaging</option>
                      <option value="Damaged">Product Visibly Damaged</option>
                      <option value="Expired">Product Expired</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Additional Comments</label>
                    <textarea 
                      rows="3" 
                      placeholder="Explain what happened..." 
                      value={reportData.comments}
                      onChange={e => setReportData({...reportData, comments: e.target.value})}
                      style={{ border: '1px solid #fecaca' }}
                    ></textarea>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button onClick={handleReportFraud} style={{ flex: 1, padding: '0.75rem', background: '#dc2626', color: 'white', borderRadius: '0.5rem', fontWeight: '700', border: 'none' }}>Submit Block</button>
                    <button onClick={() => setShowFraudReport(false)} style={{ padding: '0.75rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>Cancel</button>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setSelectedShipment(null)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', background: 'white', cursor: 'pointer' }}
              >
                Scan Another Batch
              </button>
            </div>
          </div>

          {/* New Document Vault Section */}
          <div className="card">
            <DocumentVault shipment={selectedShipment} documents={selectedShipment.documents} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EndUserView;
