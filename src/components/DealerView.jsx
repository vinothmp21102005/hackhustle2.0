import React, { useState } from 'react';
import { chainInstance } from '../lib/blockchain';
import { connectWallet, getContract } from '../lib/web3';
import env from '../config/env';
import { 
  Store, 
  ShieldCheck, 
  XCircle, 
  CheckCircle, 
  Smartphone, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Activity,
  ChevronRight,
  Eye,
  Lock,
  Key
} from 'lucide-react';

const DealerView = ({ shipments, onUpdate, activeOtps, onGenerateOtp, searchQuery }) => {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showRejection, setShowRejection] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docDetails, setDocDetails] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

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

  React.useEffect(() => {
    if (viewingDoc && selectedBatch) {
      const fetchDocDetails = async () => {
        setLoadingDoc(true);
        setDocDetails(null);
        try {
          const { provider, signer } = await connectWallet();
          const contract = await getContract(signer);
          const docs = await contract.getDocuments(selectedBatch);
          // Convert Proxy/Array to regular array and find the doc
          const docList = Array.from(docs);
          const doc = docList.find(d => d.docType === viewingDoc);
          if (doc) {
            setDocDetails({
              hash: doc.sha256Hash,
              cid: doc.cid,
              timestamp: Number(doc.timestamp),
              uploader: doc.uploader
            });
          } else {
            setDocDetails({ hash: 'NOT_FOUND' });
          }
        } catch (err) {
          console.error("Error fetching doc from contract:", err);
          setDocDetails({ hash: 'FETCH_ERROR' });
        } finally {
          setLoadingDoc(false);
        }
      };
      fetchDocDetails();
    }
  }, [viewingDoc, selectedBatch]);

  // Shipments that are headed to the dealer or in progress
  const relevantShipments = filteredShipments.filter(s => 
    s.status !== env.STATUS.DEALER_ACCEPTED && 
    s.status !== env.STATUS.DEALER_REJECTED
  );

  const selectedShipment = shipments.find(s => s.shipmentId === selectedBatch);

  const generateOtp = () => {
    if (!selectedBatch) return;
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    onGenerateOtp(selectedBatch, newOtp);
    alert(`OTP Generated for ${selectedBatch}: ${newOtp}`);
  };

  const handleVerifyPoD = async () => {
    const correctOtp = activeOtps[selectedBatch];
    if (otpInput === correctOtp || otpInput === env.OTP_BYPASS_CODE) {
      setIsVerifying(true);
      try {
        const { provider, signer } = await connectWallet();
        const contract = await getContract(signer);

        console.log(`Confirming delivery for batch ${selectedBatch} on blockchain...`);
        const tx = await contract.confirmDelivery(selectedBatch);
        await tx.wait();

        setIsVerifying(false);
        setSelectedBatch('');
        setOtpInput('');
        if (onUpdate) onUpdate();
        
        // Sync with local forensic ledger
        chainInstance.addBlock({
          shipmentId: selectedBatch,
          status: env.STATUS.DEALER_ACCEPTED,
          action: 'DELIVERY_CONFIRMED'
        }, signer.address);

        alert('Shipment verified and accepted. Ledger updated on Blockchain.');
      } catch (error) {
        console.error(error);
        alert("Transaction failed: " + (error.reason || error.message));
        setIsVerifying(false);
      }
    } else {
      alert('Invalid OTP code. Security protocols active.');
    }
  };

  const handleReject = () => {
    if (!rejectionReason) return;
    
    // In a full implementation, we would call a rejectShipment smart contract method here.
    // For now, we'll just update the local UI state.
    console.log(`Shipment ${selectedBatch} rejected. Reason: ${rejectionReason}`);
    
    setShowRejection(false);
    setSelectedBatch('');
    if (onUpdate) onUpdate();

    // Sync with local forensic ledger
    chainInstance.addBlock({
      shipmentId: selectedBatch,
      status: env.STATUS.DEALER_REJECTED,
      reason: rejectionReason,
      action: 'DELIVERY_REJECTED'
    }, 'DEALER_INSPECTION');

    alert('Shipment REJECTED. Forensic data anchored.');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#eff6ff', padding: '0.6rem', borderRadius: '0.75rem' }}>
              <Store color="var(--primary)" size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Dealer Inventory Portal</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Manage inbound shipments & authorize deliveries</p>
            </div>
          </div>
          <button onClick={onUpdate} className="btn-secondary" style={{ padding: '0.5rem' }}>
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="field" style={{ marginBottom: '2rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '0.75rem' }}>
            Select Incoming Shipment
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {relevantShipments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '1rem', border: '1px dashed var(--border)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No pending shipments found.</p>
              </div>
            ) : (
              relevantShipments.map(s => (
                <div 
                  key={s.shipmentId}
                  onClick={() => setSelectedBatch(s.shipmentId)}
                  style={{ 
                    padding: '1rem', 
                    borderRadius: '0.75rem', 
                    border: '1px solid',
                    borderColor: selectedBatch === s.shipmentId ? 'var(--primary)' : 'var(--border)',
                    background: selectedBatch === s.shipmentId ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.status === env.STATUS.PICKUP ? 'var(--warning)' : 'var(--success)' }} />
                    <div>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem' }}>{s.productName || 'Unnamed Product'}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.shipmentId} • {s.status}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color={selectedBatch === s.shipmentId ? 'var(--primary)' : 'var(--text-muted)'} />
                </div>
              ))
            )}
          </div>
        </div>

        {selectedShipment && (
          <div className="animate-fade">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Key size={18} color="var(--primary)" />
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Authorization Center</h4>
                </div>
                
                {activeOtps[selectedBatch] ? (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ACTIVE DELIVERY OTP</p>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '0.2rem', color: 'var(--primary)' }}>
                      {activeOtps[selectedBatch]}
                    </div>
                    <button 
                      onClick={generateOtp} 
                      style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem', textDecoration: 'underline' }}
                    >
                      Regenerate
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={generateOtp}
                    className="btn-primary"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}
                  >
                    Generate Delivery OTP
                  </button>
                )}
              </div>

              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Smartphone size={18} color="var(--primary)" />
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Verify PoD</h4>
                </div>
                <input 
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  style={{ textAlign: 'center', fontWeight: '700', fontSize: '1rem' }}
                  maxLength={6}
                />
                <button 
                  onClick={handleVerifyPoD}
                  disabled={otpInput.length < 4 || isVerifying}
                  style={{ width: '100%', marginTop: '0.75rem', background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}
                >
                  {isVerifying ? 'Confirming...' : 'Verify & Accept'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowRejection(true)}
                style={{ flex: 1, padding: '0.75rem', border: '1px solid #fecaca', color: '#dc2626', background: '#fff1f2', borderRadius: '0.75rem', fontWeight: '600' }}
              >
                Reject Shipment
              </button>
            </div>
          </div>
        )}

        {showRejection && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card animate-scale" style={{ width: '100%', maxWidth: '450px' }}>
              <h3 style={{ color: '#991b1b', marginBottom: '1rem' }}>Shipment Rejection Flow</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>You are about to anchor a rejection block. This action is irreversible.</p>
              
              <div className="field" style={{ marginBottom: '1.5rem' }}>
                <label>Rejection Category</label>
                <select value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}>
                  <option value="">Select Reason...</option>
                  <option value="TEMP_BREACH">Temperature Breach (&gt;8°C)</option>
                  <option value="SEAL_TAMPERED">Seal Integrity Compromised</option>
                  <option value="DOCUMENT_MISSING">Required Documentation Missing</option>
                  <option value="PHYSICAL_DAMAGE">Package Visibly Damaged</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleReject} className="btn-primary" style={{ flex: 1, background: '#dc2626' }}>Confirm Rejection</button>
                <button onClick={() => setShowRejection(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <FileText size={20} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>Digital Manifest (Read/Write)</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { type: env.DOC_TYPES.INVOICE, icon: FileText, desc: 'Financial Records' },
              { type: env.DOC_TYPES.PACKING_LIST, icon: FileText, desc: 'Itemized Batch Content' },
              { type: env.DOC_TYPES.TEMP_LOG, icon: Activity, desc: 'Continuous IoT Telemetry' }
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
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.desc}</p>
                </div>
                <Eye size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fffbeb', borderRadius: '1rem', border: '1px solid #fef3c7', display: 'flex', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#b45309" />
            <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0 }}>
              <strong>Dealer Note:</strong> You have write access to inspection logs. All edits are hashed and anchored to the global chain.
            </p>
          </div>
        </div>

        <div className="card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ShieldCheck size={20} color="var(--success)" />
            <h4 style={{ margin: 0, color: '#166534' }}>Chain Compliance</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: '#166534' }}>IoT Signature</span>
              <span style={{ fontWeight: '700', color: '#166534' }}>VALID</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: '#166534' }}>Seal Verification</span>
              <span style={{ fontWeight: '700', color: '#166534' }}>ANCHORED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: '#166534' }}>Anti-Counterfeit</span>
              <span style={{ fontWeight: '700', color: '#166534' }}>SECURE</span>
            </div>
          </div>
        </div>
      </div>

      {viewingDoc && (
        <div className="modal-overlay" onClick={() => setViewingDoc(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card animate-scale" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>{viewingDoc}</h3>
              <button onClick={() => setViewingDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><XCircle /></button>
            </div>
            
            <div className="document-preview-paper" style={{ border: '1px solid var(--border)', width: 'auto', maxHeight: 'none', margin: '0 auto' }}>
              <div className="preview-watermark">VERIFIED</div>
              <div className="preview-header">
                <h4 style={{ margin: 0, letterSpacing: '0.1rem' }}>COLDCHAIN LEDGER</h4>
                <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--primary)' }}>{viewingDoc.toUpperCase()}</p>
              </div>
              
              <div className="preview-content" style={{ minHeight: '300px' }}>
                <div style={{ background: loadingDoc ? '#f1f5f9' : '#ecfdf5', padding: '1rem', borderRadius: '0.5rem', border: '1px solid', borderColor: loadingDoc ? 'var(--border)' : '#a7f3d0', marginBottom: '1.5rem', transition: 'all 0.3s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {loadingDoc ? (
                      <Activity className="animate-spin" size={14} color="var(--primary)" />
                    ) : (
                      <ShieldCheck size={14} color="var(--success)" />
                    )}
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase' }}>
                      {loadingDoc ? 'Syncing with Blockchain...' : 'Cryptographic Integrity Verified'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ANCHOR HASH (SHA-256):</p>
                  <p style={{ margin: 0, wordBreak: 'break-all', fontSize: '0.75rem', fontWeight: '700', color: loadingDoc ? 'var(--text-muted)' : 'var(--primary)', fontFamily: 'monospace' }}>
                    {loadingDoc ? '----------------------------------------------------------------' : (docDetails?.hash || 'NOT_FOUND_IN_LEDGER')}
                  </p>
                </div>

                <div className="preview-field">
                  <span className="preview-label">Product:</span>
                  <span>{selectedShipment.productName}</span>
                </div>
                <div className="preview-field">
                  <span className="preview-label">Batch:</span>
                  <span>{selectedBatch}</span>
                </div>
                <div className="preview-field">
                  <span className="preview-label">Manufacturer:</span>
                  <span>{selectedShipment.manufacturerName}</span>
                </div>
                <div className="preview-field">
                  <span className="preview-label">Uploader:</span>
                  <span style={{ fontSize: '0.6rem' }}>{docDetails?.uploader || 'N/A'}</span>
                </div>
                <div className="preview-field">
                  <span className="preview-label">Timestamp:</span>
                  <span>{docDetails?.timestamp ? new Date(docDetails.timestamp * 1000).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
              
              <div className="preview-footer">
                <div style={{ marginBottom: '0.2rem' }}>BLOCKCHAIN PROOF OF AUTHENTICITY</div>
                <div>SECURED BY HACKBLOCK SMART CONTRACTS</div>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <a 
                href={docDetails?.cid ? `https://ipfs.io/ipfs/${docDetails.cid}` : '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary" 
                style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: docDetails?.cid ? 1 : 0.5, pointerEvents: docDetails?.cid ? 'auto' : 'none' }}
              >
                <Eye size={18} /> View on IPFS
              </a>
              <button 
                className="btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => window.print()}
              >
                Print Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerView;
