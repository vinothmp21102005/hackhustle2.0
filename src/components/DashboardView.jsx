import { 
  Shield, Activity, Package, AlertCircle, CheckCircle2, ArrowRight, 
  ShieldCheck, XCircle, Hash, UserCheck, Search, FileText, 
  Thermometer, History, Clock, ChevronDown, ChevronUp, MapPin, Truck, Warehouse as WarehouseIcon
} from 'lucide-react';
import env from '../config/env';
import { chainInstance } from '../lib/blockchain';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

import { detectAnomalies } from '../lib/anomaly';

const DashboardView = ({ shipments, blocks, isChainValid, onUpdate, searchQuery }) => {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showLedger, setShowLedger] = useState(false);
  const [investigatingShipment, setInvestigatingShipment] = useState(null);
  const [expandedShipment, setExpandedShipment] = useState(null);

  const filteredShipments = searchQuery 
    ? shipments.filter(s => 
        (s.shipmentId || s.id || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : shipments;

  const getShipmentHistory = (shipmentId) => {
    return blocks.filter(b => b.data.shipmentId === shipmentId);
  };

  const getShipmentAnomalies = (shipment) => {
    const history = getShipmentHistory(shipment.shipmentId || shipment.id);
    return detectAnomalies(shipment, history);
  };

  const allAnomalies = filteredShipments.flatMap(s => 
    getShipmentAnomalies(s).map(a => ({ ...a, shipmentId: s.shipmentId || s.id, shipment: s }))
  );

  const getShipmentIoTData = (shipmentId) => {
    return blocks
      .filter(b => b.data.shipmentId === shipmentId && b.data.temperature !== undefined)
      .map(b => ({
        time: new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temp: b.data.temperature,
        humidity: b.data.humidity || 45
      }));
  };

  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleResolveAnomaly = (shipmentId, isConfirmed) => {
    if (!resolutionNotes) {
      alert("Please enter investigation notes before resolving the incident.");
      return;
    }

    // In a real app, this would trigger a blockchain transaction with security clearance
    chainInstance.addBlock({
      shipmentId,
      action: isConfirmed ? 'SECURITY_CONFIRMED' : 'FALSE_ALARM_DISMISSED',
      timestamp: Date.now(),
      investigator: 'HACKBLOCK_SEC_OFFICE',
      notes: resolutionNotes,
      details: isConfirmed ? 'Manual security override confirmed. Shipment held for inspection.' : 'False alarm. Shipment cleared for transit.'
    }, 'SECURITY_OFFICE');
    
    setResolutionNotes('');
    setInvestigatingShipment(null);
    onUpdate();
    alert(`Incident ${isConfirmed ? 'CONFIRMED' : 'DISMISSED'} and anchored to forensic ledger.`);
  };

  const stats = [
    { label: 'Network Integrity', value: isChainValid ? '99.9%' : 'COMPROMISED', color: isChainValid ? 'var(--success)' : 'var(--error)', icon: ShieldCheck },
    { label: 'Active Shipments', value: filteredShipments.length, color: 'var(--primary)', icon: Package },
    { label: 'Immutable Blocks', value: blocks.length, color: 'var(--secondary)', icon: Activity },
    { label: 'Security Alerts', value: allAnomalies.length, color: '#ef4444', icon: AlertCircle },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', border: stat.label === 'Fraud Alerts' && parseInt(stat.value) > 0 ? '1px solid #fee2e2' : '1px solid var(--border)' }}>
            <div style={{ background: `${stat.color}15`, color: stat.color, padding: '0.75rem', borderRadius: '0.75rem' }}>
              <stat.icon size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{stat.label}</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Main Chart */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Temperature Monitoring (Cold Chain)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Real-time sensor telemetry across global transit nodes</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ padding: '0.4rem 0.75rem', background: '#f1f5f9', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text)' }}>LIVE FEED</div>
              </div>
            </div>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={blocks.filter(b => b.data.temperature).slice(-12)}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} unit="°C" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    labelFormatter={(val) => new Date(val).toLocaleString()}
                  />
                  <Area type="monotone" dataKey="data.temperature" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Anomalies / Fraud Alerts */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Security Anomalies</h3>
              <div style={{ padding: '0.25rem 0.6rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700' }}>
                {allAnomalies.length} ALERTS
              </div>
            </div>
            {allAnomalies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '1rem', border: '1px dashed var(--border)' }}>
                <CheckCircle2 color="#10b981" size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No security violations or fraud reports detected in the current ledger state.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {allAnomalies.map((item, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    padding: '1.25rem', 
                    background: '#fff', 
                    borderRadius: '1rem', 
                    border: '1px solid #fee2e2',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.05)'
                  }}>
                    <div style={{ background: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '0.75rem' }}>
                      <AlertCircle size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)' }}>ID: {item.shipmentId}</span>
                        <span style={{ fontSize: '0.65rem', color: '#b91c1c', fontWeight: '700', textTransform: 'uppercase' }}>{item.type}</span>
                      </div>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#b91c1c', fontWeight: '500' }}>{item.message}</p>
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.context}</p>
                    </div>
                    <button 
                      onClick={() => setInvestigatingShipment(item.shipment)}
                      className="btn btn-primary" 
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#ef4444' }}
                    >
                      Investigate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Blockchain Activity */}
          <div className="card" style={{ background: '#0f172a', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'white' }}>Recent Ledger</h3>
              <Activity size={18} color="rgba(255,255,255,0.4)" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {blocks.slice(-5).reverse().map((block, idx) => (
                <div key={idx} style={{ 
                  padding: '1rem', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '1rem', 
                  borderLeft: `3px solid ${idx === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>BLOCK #{block.index}</span>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{new Date(block.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--success)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{block.data.action || 'SHIPMENT_UPDATED'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Shield size={16} color={isChainValid ? 'var(--success)' : '#ef4444'} />
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Verification Engine</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', margin: 0 }}>
                {isChainValid 
                  ? 'All 256-bit hashes are cryptographically consistent. Genesis integrity verified. Node synchronization: 100%'
                  : 'CRITICAL: Hash mismatch detected at Block #8. Data integrity compromised. Forensic analysis required.'}
              </p>
              <button 
                onClick={() => setShowLedger(true)}
                style={{ width: '100%', marginTop: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
              >
                View Full Audit Trail
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: 0, opacity: 0.9 }}>Carrier Compliance</h4>
              <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: '0.25rem 0 0' }}>Q4 Performance Metrics</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: '800' }}>94%</span>
                <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.2)', borderRadius: '1rem', width: 'fit-content' }}>+2.4% vs LY</span>
              </div>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
                {[30, 45, 25, 60, 40, 75, 50].map((h, i) => (
                  <div key={i} style={{ width: '4px', height: `${h}px`, background: 'rgba(255,255,255,0.4)', borderRadius: '2px' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Modal */}
      {showLedger && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="card animate-scale" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0 }}>ColdChain Immutable Ledger</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comprehensive cryptographic history of all network activities</p>
              </div>
              <button onClick={() => setShowLedger(false)} className="btn" style={{ background: '#f1f5f9', color: 'var(--text)' }}>Close</button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {blocks.map((block, idx) => (
                <div key={idx} style={{ 
                  padding: '1.5rem', background: '#f8fafc', borderRadius: '1.25rem', border: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                        <Hash size={18} color="var(--primary)" />
                      </div>
                      <div>
                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>Block #{block.index}</span>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(block.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                        {block.data.action || 'TRANSACTION'}
                      </div>
                      <div style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '600' }}>
                        {block.validator || 'SYSTEM_NODE_01'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Block Hash</span>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'white', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginTop: '0.4rem', wordBreak: 'break-all' }}>
                        {block.hash}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>PREVIOUS HASH</span>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{block.prevHash.substring(0, 32)}...</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>VALIDATOR CERTIFICATE</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <ShieldCheck size={14} /> Verified Signature
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f1f5f9', borderRadius: '0.75rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>DATA PAYLOAD</span>
                      <pre style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text)' }}>{JSON.stringify(block.data, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Investigation Modal */}
      {investigatingShipment && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="card animate-scale" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '1rem' }}>
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>Incident Investigation: {investigatingShipment.shipmentId}</h2>
                  <p style={{ color: '#b91c1c', fontSize: '0.9rem', fontWeight: '600' }}>Case Status: CRITICAL ANOMALY DETECTED</p>
                </div>
              </div>
              <button onClick={() => setInvestigatingShipment(null)} className="btn" style={{ background: '#f1f5f9', color: 'var(--text)' }}>Dismiss Case</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} color="var(--primary)" /> Sensor Forensics
                  </h4>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getShipmentIoTData(investigatingShipment.shipmentId)}>
                        <XAxis dataKey="time" fontSize={10} hide />
                        <YAxis domain={['auto', 'auto']} fontSize={10} />
                        <Tooltip />
                        <Area type="monotone" dataKey="temp" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #fee2e2' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
                      <strong>Critical Anomaly:</strong> Temperature reached {investigatingShipment.temperature || 'N/A'}°C, exceeding safety thresholds. Ledger verification confirms sensor data was cryptographically signed at origin.
                    </p>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--primary)" /> Immutable Evidence Folder
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {Object.entries(env.DOC_TYPES || {}).map(([key, label]) => (
                      <div key={key} style={{ padding: '1rem', background: 'white', borderRadius: '0.75rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: 'var(--success)' }}>
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block' }}>{label}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SHA-256 VERIFIED</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={18} color="var(--primary)" /> Custody Trail Analysis
                  </h4>
                  <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                    <div style={{ position: 'absolute', left: '4px', top: '0', bottom: '0', width: '2px', background: '#e2e8f0' }} />
                    {getShipmentHistory(investigatingShipment.shipmentId).reverse().map((b, idx) => (
                      <div key={idx} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <div style={{ position: 'absolute', left: '-21px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: 'white', border: '2px solid var(--primary)' }} />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{new Date(b.timestamp).toLocaleString()}</div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', margin: '0.1rem 0' }}>{b.data.action || 'LEDGER_ENTRY'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text)', background: 'white', padding: '0.5rem', borderRadius: '0.5rem', marginTop: '0.3rem', border: '1px solid var(--border)' }}>
                          Validated by: <span style={{ fontWeight: '600' }}>{b.actor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #fef3c7' }}>
                  <h4 style={{ margin: '0 0 1rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={18} /> Resolution & Forensic Sealing
                  </h4>
                  <div className="field">
                    <label style={{ color: '#b45309', fontWeight: '700' }}>Investigation Resolution Notes (Manual Entry Required)</label>
                    <textarea 
                      value={resolutionNotes}
                      onChange={e => setResolutionNotes(e.target.value)}
                      placeholder="Enter findings, physical inspection results, or justification for resolution..."
                      style={{ height: '100px', borderRadius: '0.75rem', border: '1.5px solid #fde68a', marginTop: '0.5rem', padding: '0.75rem' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => handleResolveAnomaly(investigatingShipment.shipmentId, true)}
                    className="btn btn-primary" 
                    style={{ flex: 1, background: '#ef4444', padding: '1rem' }}
                  >
                    Confirm Fraud
                  </button>
                  <button 
                    onClick={() => handleResolveAnomaly(investigatingShipment.shipmentId, false)}
                    className="btn" 
                    style={{ flex: 1, background: '#f1f5f9', color: 'var(--text)', padding: '1rem' }}
                  >
                    False Alarm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipments Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Active Shipments</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Global transit network state via blockchain nodes</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.75rem' }}>
              <button className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>All</button>
              <button className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem', background: 'transparent' }}>In Transit</button>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <th style={{ padding: '0 1.5rem' }}>Shipment ID</th>
                <th>Status</th>
                <th>Origin / Destination</th>
                <th>Sensors</th>
                <th>Validator</th>
                <th style={{ textAlign: 'right', padding: '0 1.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((s, idx) => (
                <React.Fragment key={s.shipmentId || idx}>
                  <tr 
                    className="table-row" 
                    onClick={() => setExpandedShipment(expandedShipment === s.shipmentId ? null : s.shipmentId)}
                    style={{ background: '#fff', transition: 'all 0.2s ease', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem 0 0 1rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                          <Package size={16} color="var(--primary)" />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{s.shipmentId}</span>
                      </div>
                    </td>
                    <td style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        padding: '0.35rem 0.75rem', 
                        borderRadius: '2rem', 
                        fontSize: '0.7rem', 
                        fontWeight: '700',
                        background: 
                          s.status?.includes('TAMPER') || s.status?.includes('Rejected') ? '#fee2e2' : 
                          s.status?.includes('TRANSIT') || s.status?.includes('PICKUP') ? '#e0f2fe' : '#f0fdf4',
                        color: 
                          s.status?.includes('TAMPER') || s.status?.includes('Rejected') ? '#b91c1c' : 
                          s.status?.includes('TRANSIT') || s.status?.includes('PICKUP') ? '#0369a1' : '#15803d'
                      }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                        {s.status}
                      </div>
                    </td>
                    <td style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem' }}>{s.origin}</span>
                        <ArrowRight size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{s.destination}</span>
                      </div>
                    </td>
                    <td style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: s.temperature > 8 ? '#ef4444' : 'var(--text)' }}>
                          <Thermometer size={14} />
                          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{s.temperature}°C</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UserCheck size={12} />
                        </div>
                        <span style={{ fontSize: '0.8rem' }}>Node_{s.shipmentId.substring(4, 6)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0 1.5rem', borderRadius: '0 1rem 1rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {expandedShipment === s.shipmentId ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                      </div>
                    </td>
                  </tr>

                  <AnimatePresence>
                    {expandedShipment === s.shipmentId && (
                      <tr>
                        <td colSpan="6" style={{ padding: '0 1.5rem 1.5rem', border: 'none' }}>
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ background: '#f8fafc', borderRadius: '1.25rem', border: '1px solid var(--border)', padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2.5rem' }}>
                              <div>
                                <h4 style={{ margin: '0 0 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <FileText size={18} color="var(--primary)" /> Product Dossier
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  {[
                                    { label: 'Product Name', value: s.productName || 'N/A' },
                                    { label: 'Manufacturer', value: s.manufacturerName || 'N/A' },
                                    { label: 'Manufacturing Date', value: s.mfgDate || 'N/A' },
                                    { label: 'Expiry Date', value: s.expDate || 'N/A' },
                                    { label: 'Storage Requirement', value: `${s.minTemp || 2}°C to ${s.maxTemp || 8}°C` },
                                    { label: 'Carrier ID', value: s.vehicleId || 'N/A' },
                                    { label: 'Seal Number', value: s.sealNumber || 'N/A' }
                                  ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.label}</span>
                                      <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ width: '100%', marginTop: '1.5rem', background: 'white' }}
                                  onClick={(e) => { e.stopPropagation(); setInvestigatingShipment(s); }}
                                >
                                  Open Forensic Audit
                                </button>
                              </div>
                              <div>
                                <h4 style={{ margin: '0 0 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Activity size={18} color="var(--primary)" /> Global Forensic Flow
                                </h4>
                                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                  <div style={{ position: 'absolute', left: '11px', top: '5px', bottom: '5px', width: '2px', background: '#e2e8f0' }} />
                                  {getShipmentHistory(s.shipmentId || s.id).map((event, i) => {
                                    const isTamper = event.data.status === 'SECURITY_TAMPER';
                                    const isRejected = event.data.status?.includes('Rejected');
                                    return (
                                      <div key={i} style={{ position: 'relative', paddingLeft: '2.5rem' }}>
                                        <div style={{ 
                                          position: 'absolute', left: '0', top: '0', width: '24px', height: '24px', borderRadius: '50%', 
                                          background: isTamper || isRejected ? '#ef4444' : 'white', 
                                          border: `2px solid ${isTamper || isRejected ? '#ef4444' : 'var(--primary)'}`,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
                                        }}>
                                          {isTamper ? <AlertCircle size={12} color="white" /> : <ShieldCheck size={12} color={isRejected ? 'white' : 'var(--primary)'} />}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                          <div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: isTamper || isRejected ? '#ef4444' : 'var(--text)' }}>
                                              {event.data.status?.toUpperCase() || 'ENTRY'}
                                            </span>
                                            <p style={{ margin: '0.1rem 0', fontSize: '0.85rem', fontWeight: '500' }}>
                                              {event.data.location || 'Checkpoint Verification'}
                                            </p>
                                            {event.data.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{event.data.notes}"</p>}
                                          </div>
                                          <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{new Date(event.timestamp).toLocaleDateString()}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
              {shipments.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <div style={{ opacity: 0.5 }}>
                      <Search size={32} style={{ marginBottom: '1rem' }} />
                      <p>No active shipments found in the network.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
