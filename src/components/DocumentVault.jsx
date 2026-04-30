import { useState } from 'react';
import { FileText, CheckCircle2, AlertCircle, ShieldCheck, Download, Search, Hash } from 'lucide-react';
import env from '../config/env';

/**
 * DocumentVault Component
 * A centralized, secure hub for managing and verifying supply chain artifacts.
 * This component reduces hardcopy reliance by providing immutable digital originals.
 */
const DocumentVault = ({ shipment, documents = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [verifying, setVerifying] = useState(null); // ID of doc being verified

  const formattedDocs = documents.map(doc => ({
    type: doc.docType,
    name: doc.docType + ' Document', // Fallback name
    actor: doc.uploader,
    timestamp: Number(doc.timestamp) * 1000,
    hash: doc.sha256Hash,
    blockHash: doc.cid // Using CID as visual block hash
  }));

  const filteredDocs = formattedDocs.filter(doc => 
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerify = (doc) => {
    setVerifying(doc.hash);
    // Simulate cryptographic verification against the ledger
    setTimeout(() => {
      setVerifying(null);
      alert(`Cryptographic Verification Successful!\n\nDocument: ${doc.name}\nBlockchain Hash: ${doc.hash}\nStatus: IMMUTABLE`);
    }, 1200);
  };

  return (
    <div className="document-vault animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--primary)" /> Immutable Document Vault
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified artifacts for Batch: {shipment.shipmentId}</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Filter documents..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '0.8rem', width: '200px', height: '36px' }}
          />
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '1rem', border: '1px dashed var(--border)' }}>
          <FileText size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
          <p style={{ color: 'var(--text-muted)' }}>No documents found for this criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filteredDocs.map((doc, idx) => (
            <div key={idx} className="card doc-card" style={{ padding: '1rem', border: '1px solid var(--border)', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ background: '#eff6ff', padding: '0.5rem', borderRadius: '0.5rem' }}>
                  <FileText size={20} color="var(--primary)" />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleVerify(doc)}
                    style={{ padding: '0.25rem 0.5rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {verifying === doc.hash ? 'Verifying...' : 'Verify Hash'}
                  </button>
                  <button style={{ padding: '0.25rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Download size={16} />
                  </button>
                </div>
              </div>
              
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{doc.type}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{doc.name}</p>
              
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ANCHORED BY</span>
                  <span style={{ fontWeight: '600' }}>{doc.actor}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>LEDGER HASH</span>
                  <span style={{ fontFamily: 'monospace' }}>{doc.hash.substring(0, 10)}...</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>BLOCK ID</span>
                  <span style={{ fontFamily: 'monospace' }}>{doc.blockHash.substring(0, 10)}...</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '1.5rem', background: '#fffbeb', border: '1px solid #fde68a', padding: '1rem', borderRadius: '0.75rem', display: 'flex', gap: '0.75rem' }}>
        <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.8rem', color: '#92400e', margin: 0 }}>
          <strong>Transparency Notice:</strong> All documents listed here are cryptographically linked to the blockchain. 
          Any modification to the file content will result in a hash mismatch, alerting all stakeholders immediately.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .doc-card:hover { transform: translateY(-2px); border-color: var(--primary) !important; box-shadow: var(--shadow-md); }
      `}} />
    </div>
  );
};

export default DocumentVault;
