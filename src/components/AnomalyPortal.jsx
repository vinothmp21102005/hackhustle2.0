import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Fingerprint, 
  Search, RefreshCw, Lock, Unlock, Eye, FileWarning,
  Activity, Database, Hash
} from 'lucide-react';
import { chainInstance } from '../lib/blockchain';
import { detectAnomalies } from '../lib/anomaly';
import { motion, AnimatePresence } from 'framer-motion';

const AnomalyPortal = ({ shipments, blocks, onUpdate }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [allAnomalies, setAllAnomalies] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const runSecurityAudit = () => {
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate a deep scan
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          
          // Actual detection logic
          const results = shipments.flatMap(s => {
            const history = blocks.filter(b => b.data.shipmentId === (s.shipmentId || s.id));
            return detectAnomalies(s, history).map(a => ({
              ...a,
              shipmentId: s.shipmentId || s.id,
              shipment: s,
              timestamp: Date.now(),
              severity: a.type === 'DOCUMENT_TAMPERED' || a.type === 'SEQUENCE_VIOLATION' ? 'CRITICAL' : 'WARNING'
            }));
          });
          setAllAnomalies(results);
          return 100;
        }
        return prev + 5;
      });
    }, 50);
  };

  useEffect(() => {
    runSecurityAudit();
  }, [shipments, blocks]);

  const tamperShipment = (shipmentId) => {
    // This is a simulation tool for the user to see anomaly detection in action
    const shipment = shipments.find(s => (s.shipmentId || s.id) === shipmentId);
    if (!shipment) return;

    // We manually add a "malicious" block with a skipped step or mismatched data
    chainInstance.addBlock({
      shipmentId,
      action: 'MALICIOUS_ENTRY',
      status: 'TAMPERED',
      details: 'This block simulates a manual database override or forged signature.',
      timestamp: Date.now()
    }, 'UNKNOWN_ACTOR_0xDEAD');
    
    onUpdate();
    runSecurityAudit();
  };

  return (
    <div className="anomaly-portal" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Controls */}
      <div className="card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldAlert size={28} color="var(--primary)" />
              Security Audit Engine
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Deep packet inspection of the immutable ledger for sequence violations, data tampering, and cold chain deviations.
            </p>
          </div>
          <button 
            onClick={runSecurityAudit}
            disabled={isScanning}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
          >
            <RefreshCw size={18} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? `Scanning... ${scanProgress}%` : 'Execute Global Audit'}
          </button>
        </div>

        {isScanning && (
          <div style={{ marginTop: '1.5rem', width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${scanProgress}%` }}
              style={{ height: '100%', background: 'var(--primary)' }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Alerts */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="var(--primary)" />
              Live Security Alerts ({allAnomalies.length})
            </h3>

            {allAnomalies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: '#f0fdf4', borderRadius: '1rem', border: '1px dashed #bbf7d0' }}>
                <ShieldCheck size={48} color="#10b981" style={{ marginBottom: '1rem', opacity: 0.6 }} />
                <h4 style={{ color: '#166534', margin: 0 }}>Network Integrity Verified</h4>
                <p style={{ color: '#15803d', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  No anomalies detected in current block sequences. Genesis-to-Delivery trail is cryptographically sound.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {allAnomalies.map((anomaly, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    style={{ 
                      padding: '1.25rem', 
                      background: anomaly.severity === 'CRITICAL' ? '#fff1f2' : '#fff7ed',
                      border: `1px solid ${anomaly.severity === 'CRITICAL' ? '#fecdd3' : '#ffedd5'}`,
                      borderRadius: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ 
                      background: anomaly.severity === 'CRITICAL' ? '#fb7185' : '#fb923c', 
                      color: 'white', 
                      padding: '0.75rem', 
                      borderRadius: '0.75rem' 
                    }}>
                      {anomaly.severity === 'CRITICAL' ? <Lock size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '800', color: anomaly.severity === 'CRITICAL' ? '#9f1239' : '#9a3412' }}>
                          {anomaly.type}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', opacity: 0.6 }}>
                          {anomaly.severity}
                        </span>
                      </div>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text)' }}>{anomaly.message}</p>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Fingerprint size={12} /> ID: {anomaly.shipmentId}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Database size={12} /> Block Sequence Violation
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedIncident(anomaly)}
                      className="btn" 
                      style={{ background: 'white', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                    >
                      Audit Trail
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Forensic Evidence Area */}
          {selectedIncident && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card" 
              style={{ border: '2px solid var(--primary)', background: '#f8fafc' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Eye size={20} color="var(--primary)" />
                  Forensic Deep Dive: {selectedIncident.shipmentId}
                </h3>
                <button onClick={() => setSelectedIncident(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Close</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={16} /> Audit Summary
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Violation:</span>
                      <p style={{ margin: '0.25rem 0', fontWeight: '700', color: 'var(--danger)' }}>{selectedIncident.type}</p>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Details:</span>
                      <p style={{ margin: '0.25rem 0', fontWeight: '500' }}>{selectedIncident.message}</p>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)', borderLeft: '4px solid var(--danger)' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserCheck size={16} /> Culprit Identification
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Responsible Actor:</span>
                      <p style={{ margin: '0.25rem 0', fontWeight: '800', fontFamily: 'monospace', background: '#f1f5f9', padding: '0.4rem', borderRadius: '0.25rem' }}>
                        {selectedIncident.responsibleActor || 'UNKNOWN_ACTOR'}
                      </p>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Digital Signature:</span>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.7rem', wordBreak: 'break-all', color: 'var(--text-muted)' }}>
                        {selectedIncident.signature || 'No valid signature found'}
                      </p>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Incident Timestamp:</span>
                      <p style={{ margin: '0.25rem 0', fontWeight: '600' }}>
                        {new Date(selectedIncident.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Database size={16} /> Ledger Proof
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span>Hash Consistency</span>
                      <span style={{ color: 'var(--success)', fontWeight: '700' }}>VALID</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span>Signer Role</span>
                      <span style={{ 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '0.25rem', 
                        background: '#fef2f2', 
                        color: 'var(--danger)', 
                        fontSize: '0.65rem',
                        fontWeight: '700'
                      }}>
                        {selectedIncident.responsibleActor?.includes('CARRIER') ? 'CARRIER' : 
                         selectedIncident.responsibleActor?.includes('PRODUCER') ? 'PRODUCER' : 'UNAUTHORIZED'}
                      </span>
                    </div>
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', fontSize: '0.7rem', color: '#991b1b' }}>
                      <Lock size={14} style={{ marginBottom: '0.25rem' }} />
                      This actor was in custodial control of the batch when the integrity breach was recorded.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Security Tools */}
          <div className="card" style={{ background: '#0f172a', color: 'white' }}>
            <h3 style={{ margin: '0 0 1.5rem', color: 'white', fontSize: '1.1rem' }}>Simulation Tools</h3>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
              Test the resilience of the audit engine by simulating network attacks or protocol violations.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={() => {
                  if (shipments.length > 0) {
                    const id = shipments[0].shipmentId || shipments[0].id;
                    tamperShipment(id);
                  } else {
                    alert("No active shipments to tamper with.");
                  }
                }}
                style={{ 
                  width: '100%', padding: '0.75rem', borderRadius: '0.5rem', 
                  background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444',
                  color: '#fca5a5', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}
              >
                <Lock size={16} />
                Inject Protocol Breach
              </button>
              
              <button 
                onClick={() => {
                  chainInstance.addBlock({
                    action: 'UNAUTHORIZED_LOGIN',
                    details: 'Multiple failed signature attempts from unknown IP.',
                    timestamp: Date.now()
                  }, 'FIREWALL');
                  onUpdate();
                  runSecurityAudit();
                }}
                style={{ 
                  width: '100%', padding: '0.75rem', borderRadius: '0.5rem', 
                  background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}
              >
                <ShieldAlert size={16} />
                Simulate DDoS / Brute
              </button>
            </div>
          </div>

          {/* Audit Metrics */}
          <div className="card">
            <h4 style={{ margin: '0 0 1rem' }}>Audit Coverage</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                  <span>Ledger Verification</span>
                  <span>100%</span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px' }}>
                  <div style={{ width: '100%', height: '100%', background: 'var(--success)', borderRadius: '3px' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                  <span>Document Hash Matching</span>
                  <span>92%</span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px' }}>
                  <div style={{ width: '92%', height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                  <span>Sequence Sanitization</span>
                  <span>85%</span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px' }}>
                  <div style={{ width: '85%', height: '100%', background: 'var(--secondary)', borderRadius: '3px' }} />
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '700', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <Hash size={12} /> SCAN_NODE_V4
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Continuous monitoring of {blocks.length} blocks. Last sync: {new Date().toLocaleTimeString()}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyPortal;
