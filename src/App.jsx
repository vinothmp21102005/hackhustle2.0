import { useState, useEffect, Fragment } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Truck, 
  Warehouse, 
  Store, 
  UserCheck, 
  ShieldCheck, 
  History, 
  QrCode,
  Lock,
  Search,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  X,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chainInstance } from './lib/blockchain';
import { connectWallet } from './lib/web3';
import env from './config/env';
import ProducerView from './components/ProducerView';
import CarrierView from './components/CarrierView';
import WarehouseView from './components/WarehouseView';
import DealerView from './components/DealerView';
import EndUserView from './components/EndUserView';
import DashboardView from './components/DashboardView';
import CustomsBrokerView from './components/CustomsBrokerView';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [shipments, setShipments] = useState([]);
  const [blocks, setBlocks] = useState(chainInstance.chain);
  const [isChainValid, setIsChainValid] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeOtps, setActiveOtps] = useState({}); // { shipmentId: otp }
  const [walletAddress, setWalletAddress] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'Manufacturer', 'Carrier', 'Warehouse', 'Dealer'
  const [companyName, setCompanyName] = useState('');

  const handleConnectWallet = async () => {
    try {
      const { address, type } = await connectWallet();
      setWalletAddress(address);
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const role = formData.get('role');
    const company = formData.get('company');
    const password = formData.get('password');
    
    // Simple check for demo: allow any password that matches env bypass or is 'admin123'
    if (password === env.OTP_BYPASS_CODE || password === 'admin123' || !password) {
      setUserRole(role);
      setCompanyName(company);
      
      // Auto-select first allowed tab
      if (role === 'Manufacturer') setActiveTab('producer');
      else if (role === 'Carrier') setActiveTab('carrier');
      else if (role === 'Warehouse') setActiveTab('warehouse');
      else if (role === 'Dealer') setActiveTab('dealer');
    } else {
      alert("Invalid Access Credentials. Please check your password.");
    }
  };

  // Sync with blockchain instance
  const refreshChain = () => {
    setBlocks([...chainInstance.chain]);
    setIsChainValid(chainInstance.verifyChain().isValid);
    
    // Extract unique shipments from chain
    const shipmentMap = {};
    chainInstance.chain.forEach(block => {
      if (block.data.shipmentId) {
        shipmentMap[block.data.shipmentId] = {
          ...shipmentMap[block.data.shipmentId],
          ...block.data,
          lastUpdated: block.timestamp,
          status: block.data.status || shipmentMap[block.data.shipmentId]?.status || 'Created'
        };
      }
    });
    setShipments(Object.values(shipmentMap));
  };

  const handleGenerateOtp = (shipmentId, otp) => {
    setActiveOtps(prev => ({ ...prev, [shipmentId]: otp }));
  };

  useEffect(() => {
    handleConnectWallet();
    refreshChain();
    // Auto-refresh every 5 seconds to ensure ledger parity
    const interval = setInterval(refreshChain, 5000);
    return () => clearInterval(interval);
  }, []);

  const allMenuItems = [
    { id: 'dashboard', label: 'Network State', icon: LayoutDashboard, roles: ['any'] },
    { id: 'producer', label: 'Manufacturer', icon: PlusCircle, roles: ['Manufacturer'] },
    { id: 'carrier', label: 'Carrier', icon: Truck, roles: ['Carrier'] },
    { id: 'warehouse', label: 'Warehouse', icon: Warehouse, roles: ['Warehouse'] },
    { id: 'dealer', label: 'Dealer', icon: Store, roles: ['Dealer'] },
    { id: 'enduser', label: 'Consumer Verify', icon: UserCheck, roles: ['any'] },
  ];

  const menuItems = allMenuItems.filter(item => 
    item.roles.includes('any') || item.roles.includes(userRole)
  );

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView shipments={shipments} blocks={blocks} isChainValid={isChainValid} onUpdate={refreshChain} searchQuery={searchQuery} />;
      case 'producer': return <ProducerView onUpdate={refreshChain} />;
      case 'carrier': return <CarrierView shipments={shipments} onUpdate={refreshChain} activeOtps={activeOtps} searchQuery={searchQuery} />;
      case 'warehouse': return <WarehouseView shipments={shipments} onUpdate={refreshChain} activeOtps={activeOtps} searchQuery={searchQuery} />;
      case 'dealer': return <DealerView shipments={shipments} onUpdate={refreshChain} activeOtps={activeOtps} onGenerateOtp={handleGenerateOtp} searchQuery={searchQuery} />;
      case 'enduser': return <EndUserView shipments={shipments} searchQuery={searchQuery} />;
      default: return <DashboardView shipments={shipments} blocks={blocks} isChainValid={isChainValid} onUpdate={refreshChain} searchQuery={searchQuery} />;
    }
  };

  if (!userRole) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', padding: '3rem', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px', border: '1px solid #e2e8f0' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ background: 'var(--primary)', color: 'white', width: '56px', height: '56px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)' }}>
              <Lock size={28} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Company Access</h2>
            <p style={{ color: '#64748b', fontWeight: '500' }}>Secure Logistics Gateway</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569' }}>Company Name</label>
              <input name="company" required placeholder="e.g. BioPharma Global" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #e2e8f0', outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569' }}>Access Credentials</label>
              <input name="password" type="password" required placeholder="••••••••" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #e2e8f0', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569' }}>Select Operational Role</label>
              <select name="role" required style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #e2e8f0', outline: 'none', background: 'white', width: '100%', boxSizing: 'border-box' }}>
                <option value="Manufacturer">Manufacturer / Producer</option>
                <option value="Carrier">Logistics Carrier</option>
                <option value="Warehouse">Warehouse Hub</option>
                <option value="Dealer">Authorized Dealer</option>
              </select>
            </div>

            <button type="submit" style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '0.75rem', border: 'none', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '1rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
              Authorize & Enter
            </button>
          </form>
          
          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={14} /> Cryptographically Secured Session
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Top Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.5rem 3rem',
        background: 'white',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: 'var(--primary)', 
            padding: '0.5rem', 
            borderRadius: '0.5rem', 
            color: 'white',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>{env.APP_TITLE}</h1>
            <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-muted)', fontWeight: '500' }}>Supply Chain Ledger</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="status-badge" style={{ 
            padding: '0.4rem 0.8rem', 
            background: isChainValid ? '#f0fdf4' : '#fef2f2',
            borderRadius: '2rem',
            border: `1px solid ${isChainValid ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: isChainValid ? 'var(--success)' : 'var(--danger)' 
            }} />
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: isChainValid ? '#166534' : '#991b1b' }}>
              {isChainValid ? 'CHAIN VALID' : 'TAMPERED'}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {walletAddress ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                background: '#f3f4f6', color: 'var(--text-main)',
                border: '1px solid var(--border)', fontWeight: '500', fontSize: '0.875rem'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            ) : (
              <button 
                onClick={handleConnectWallet}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                  padding: '0.5rem 1rem', borderRadius: '0.5rem',
                  background: 'var(--primary)', color: 'white',
                  border: '1px solid var(--primary)', fontWeight: '600'
                }}
              >
                <span style={{ fontSize: '0.875rem' }}>Connect Wallet</span>
              </button>
            )}

            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                background: activeTab === 'dashboard' ? '#eff6ff' : 'transparent',
                color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-main)',
                border: activeTab === 'dashboard' ? '1px solid #bfdbfe' : '1px solid var(--border)',
                fontWeight: activeTab === 'dashboard' ? '600' : '500'
              }}
            >
              <LayoutDashboard size={18} />
              <span style={{ fontSize: '0.875rem' }}>Dashboard</span>
            </button>
            <button 
              onClick={() => {
                if(window.confirm("This will clear all local forensic data and resync with the current blockchain address. Continue?")) {
                  chainInstance.clearChain();
                }
              }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                background: 'white', color: 'var(--text-main)',
                border: '1px solid var(--border)', fontWeight: '600'
              }}
              title="Resync Ledger with Blockchain"
            >
              <RefreshCw size={18} />
              <span style={{ fontSize: '0.875rem' }}>Resync</span>
            </button>

            <button 
              onClick={() => {
                if(window.confirm("Are you sure you want to log out? Your operational session will end.")) {
                  setUserRole(null);
                  setCompanyName('');
                  setActiveTab('dashboard');
                }
              }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                background: '#fff1f2', color: '#e11d48',
                border: '1px solid #fecaca', fontWeight: '700'
              }}
            >
              <LogOut size={18} />
              <span style={{ fontSize: '0.875rem' }}>Logout</span>
            </button>
            <button 
              onClick={() => setActiveTab('producer')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                background: activeTab !== 'dashboard' ? 'var(--primary)' : 'transparent',
                color: activeTab !== 'dashboard' ? 'white' : 'var(--text-main)',
                border: activeTab !== 'dashboard' ? '1px solid var(--primary)' : '1px solid var(--border)',
                fontWeight: activeTab !== 'dashboard' ? '600' : '500'
              }}
            >
              <PlusCircle size={18} />
              <span style={{ fontSize: '0.875rem' }}>Start Operations</span>
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {!isChainValid ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
            <div style={{ background: '#fef2f2', padding: '2rem', borderRadius: '50%', marginBottom: '2rem' }}>
              <ShieldCheck size={80} color="#dc2626" />
            </div>
            <h1 style={{ fontSize: '2.5rem', color: '#991b1b', marginBottom: '1rem' }}>SYSTEM LOCKED</h1>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Data Tampering Detected</h2>
            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '1rem', border: '1px solid #fecaca', marginBottom: '2.5rem', textAlign: 'left', maxWidth: '600px' }}>
              <h4 style={{ margin: '0 0 1rem', color: '#991b1b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Forensic Report</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Culprit Address:</span>
                  <span style={{ fontWeight: '800', fontFamily: 'monospace', color: '#dc2626' }}>
                    {chainInstance.verifyChain().actor || 'Unknown External Actor'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Block Index:</span>
                  <span style={{ fontWeight: '700' }}>#{chainInstance.verifyChain().blockIndex}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Breach Type:</span>
                  <span style={{ fontWeight: '700' }}>{chainInstance.verifyChain().reason}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                  <span style={{ fontWeight: '600' }}>{new Date(chainInstance.verifyChain().timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                * This entity attempted to modify the immutable ledger directly without a valid protocol signature.
              </div>
            </div>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '600px', marginBottom: '2rem' }}>
              The cryptographic integrity of the blockchain has been compromised. All supply chain operations have been halted to prevent the distribution of potentially unsafe pharmaceuticals.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => window.location.reload()}
                className="btn-secondary"
                style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
              >
                Re-Scan Network
              </button>
              <button 
                onClick={() => chainInstance.clearChain()}
                className="btn-primary"
                style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: '#dc2626', borderColor: '#dc2626' }}
              >
                Purge & Reset Ledger
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Stepper Workflow */}
        {activeTab !== 'dashboard' && (
          <div className="stepper" style={{ 
            marginBottom: '2.5rem', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            justifyContent: 'space-between'
          }}>
            {menuItems.filter(item => item.id !== 'dashboard').map((item, index, array) => {
              const isActive = activeTab === item.id;
              const isPast = array.findIndex(i => i.id === activeTab) > index;
              
              return (
                <Fragment key={item.id}>
                  <div 
                    className={`step ${isActive || isPast ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                    style={{ 
                      cursor: 'pointer', 
                      flexDirection: 'column', 
                      gap: '0.75rem',
                      width: '120px',
                      textAlign: 'center',
                      opacity: isActive ? 1 : isPast ? 0.8 : 0.5,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div className="step-circle" style={{ 
                      width: '48px', height: '48px', 
                      background: isActive ? 'var(--primary)' : isPast ? '#eff6ff' : '#f8fafc',
                      borderColor: isActive ? 'var(--primary)' : isPast ? '#bfdbfe' : 'var(--border)',
                      color: isActive ? 'white' : isPast ? 'var(--primary)' : 'var(--text-muted)',
                      margin: '0 auto',
                      boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}>
                      <item.icon size={22} />
                    </div>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: isActive ? '700' : '600',
                      color: isActive ? 'var(--primary)' : isPast ? 'var(--text-main)' : 'var(--text-muted)'
                    }}>
                      {item.label}
                    </span>
                  </div>
                  
                  {index < array.length - 1 && (
                    <div className="step-line" style={{ 
                      background: isPast ? 'var(--primary)' : 'var(--border)',
                      opacity: isPast ? 0.3 : 0.5,
                      alignSelf: 'flex-start',
                      marginTop: '24px',
                      height: '3px',
                      borderRadius: '2px',
                      transition: 'all 0.3s'
                    }} />
                  )}
                </Fragment>
              );
            })}
          </div>
        )}

        {activeTab !== 'dashboard' && (
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ marginBottom: '0.25rem' }}>{menuItems.find(i => i.id === activeTab)?.label}</h2>
              <p>Active Workspace & Operations</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="search-bar" style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: isSearching ? 'var(--primary)' : 'var(--text-muted)', transition: 'color 0.2s' }} />
                <input 
                  type="text" 
                  placeholder="Search Shipment ID..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearching(!!e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery) {
                      // If searching, maybe we should jump to a specific view or filter
                      console.log("Searching for:", searchQuery);
                    }
                  }}
                  style={{ 
                    paddingLeft: '2.5rem', 
                    width: '300px',
                    borderColor: isSearching ? 'var(--primary)' : 'var(--border)',
                    boxShadow: isSearching ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none'
                  }}
                />
                {searchQuery && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearching(false);
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </header>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation */}
        {activeTab !== 'dashboard' && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '3rem', 
            paddingTop: '2rem', 
            borderTop: '1px solid var(--border)' 
          }}>
            {(() => {
              const workflowSteps = menuItems.filter(item => item.id !== 'dashboard');
              const currentIdx = workflowSteps.findIndex(item => item.id === activeTab);
              const prevStep = currentIdx > 0 ? workflowSteps[currentIdx - 1] : null;
              const nextStep = currentIdx >= 0 && currentIdx < workflowSteps.length - 1 ? workflowSteps[currentIdx + 1] : null;

              return (
                <>
                  <div>
                    {prevStep && (
                      <button 
                        onClick={() => setActiveTab(prevStep.id)}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'white', color: 'var(--text-main)', fontWeight: '600' }}
                      >
                        <ArrowLeft size={18} />
                        Previous: {prevStep.label}
                      </button>
                    )}
                  </div>
                  <div>
                    {nextStep && (
                      <button 
                        onClick={() => setActiveTab(nextStep.id)}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: 'var(--primary)', color: 'white', fontWeight: '600' }}
                      >
                        Next: {nextStep.label}
                        <ArrowRight size={18} />
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
