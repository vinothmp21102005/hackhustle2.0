import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Building, User, ChevronRight } from 'lucide-react';
import { connectWallet } from '../lib/web3';

const LoginView = ({ onLogin }) => {
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Manufacturer');
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkWallet = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        }
      } catch (err) {
        console.error("Wallet check failed:", err);
      }
    };
    checkWallet();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { address } = await connectWallet();
      setWalletAddress(address);
    } catch (err) {
      alert("Failed to connect wallet: " + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!walletAddress) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }
    // Simple validation (password bypass '1234' as in previous sessions)
    if (password === '1234' || password.length > 0) {
      onLogin({ companyName, role, walletAddress });
    } else {
      alert("Invalid credentials.");
    }
  };

  return (
    <div style={{ 
      position: 'fixed', inset: 0, 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div className="animate-scale" style={{ 
        background: 'white', padding: '3rem', borderRadius: '2rem', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        width: '100%', maxWidth: '450px', border: '1px solid white'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            background: 'var(--primary)', width: '64px', height: '64px', 
            borderRadius: '1.25rem', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 1.5rem',
            color: 'white', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)'
          }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Company Portal</h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.9rem' }}>Secure Cold Chain Logistics Management</p>
        </div>

        <div style={{ 
          background: walletAddress ? '#f0fdf4' : '#fef2f2', 
          padding: '1rem', borderRadius: '1rem', marginBottom: '2rem',
          border: `1px solid ${walletAddress ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <div style={{ 
            width: '8px', height: '8px', borderRadius: '50%', 
            background: walletAddress ? '#10b981' : '#dc2626' 
          }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: walletAddress ? '#166534' : '#991b1b' }}>
            {walletAddress 
              ? `Wallet Connected: ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` 
              : 'Web3 Wallet Required'}
          </span>
          {!walletAddress && (
            <button 
              onClick={handleConnect}
              disabled={isConnecting}
              style={{ 
                marginLeft: 'auto', background: 'white', border: '1px solid #fecaca', 
                padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem',
                fontWeight: '700', color: '#991b1b', cursor: 'pointer'
              }}
            >
              {isConnecting ? '...' : 'Connect'}
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="field">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>COMPANY NAME</label>
            <div style={{ position: 'relative' }}>
              <Building size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                style={{ paddingLeft: '2.75rem' }} 
                placeholder="e.g. BioPharma Solutions" 
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="field">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>SECURITY ACCESS KEY</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="password"
                style={{ paddingLeft: '2.75rem' }} 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="field">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>ASSIGNED ROLE</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <select 
                style={{ paddingLeft: '2.75rem' }}
                value={role}
                onChange={e => setRole(e.target.value)}
                required
              >
                <option value="Manufacturer">Manufacturer</option>
                <option value="Carrier">Carrier</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Dealer">Dealer</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ 
              padding: '1rem', marginTop: '1rem', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none', fontSize: '1rem'
            }}
          >
            Authenticate & Enter <ChevronRight size={18} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: '#94a3b8' }}>
          By entering, you agree to anchor all logistics events to the immutable ledger.
        </p>
      </div>
    </div>
  );
};

export default LoginView;
