import React, { useState } from 'react';
import { Package, Calendar, Tag, ShieldCheck, Key, Activity, ArrowRight } from 'lucide-react';

const WorkflowsCard = ({ companyName, role, onJoinWorkflow }) => {
  const [workflows] = useState([
    { id: 'WF-8239', name: 'Primary Cold Chain Route', date: 'Oct 20, 2023', product: 'Pfizer Vaccines (Batch A)' },
    { id: 'WF-8240', name: 'Secondary Backup Route', date: 'Oct 22, 2023', product: 'Moderna Booster (Batch B)' },
    { id: 'WF-8255', name: 'Regional Distribution #4', date: 'Oct 23, 2023', product: 'Insulin Vials' },
  ]);

  const [activeOtps, setActiveOtps] = useState(() => {
    const saved = localStorage.getItem('HACKBLOCK_OTPS');
    return saved ? JSON.parse(saved) : {};
  });

  const generateOtp = (wfId) => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const newOtps = { ...activeOtps, [wfId]: otp };
    setActiveOtps(newOtps);
    localStorage.setItem('HACKBLOCK_OTPS', JSON.stringify(newOtps));
    alert(`🔑 GENERATED HANDOFF OTP: ${otp}\n\nPlease provide this 4-digit code to the next person in the workflow. They will need it to accept the product!`);
  };

  const handleJoin = (wf) => {
    const storedOtp = activeOtps[wf.id];
    if (storedOtp) {
      const userOtp = prompt(`🔒 Security Check: A secure handoff has been initiated for ${wf.id}.\n\nPlease enter the 4-digit OTP provided by the previous person in the flow:`);
      if (userOtp !== storedOtp) {
        alert('❌ Invalid OTP! Cryptographic handoff failed. Access denied to this workflow.');
        return;
      }
      alert('✅ Match Verified! Handoff successful. Product integrity confirmed on the timeline.');
      
      const newOtps = { ...activeOtps };
      delete newOtps[wf.id];
      setActiveOtps(newOtps);
      localStorage.setItem('HACKBLOCK_OTPS', JSON.stringify(newOtps));
    }
    onJoinWorkflow(wf);
  };

  return (
    <div className="card" style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity color="var(--primary)" size={22} />
            Active Company Workflows
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Logged in as <strong>{companyName}</strong> ({role})
          </p>
        </div>
        <div style={{ background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
          {workflows.length} ACTIVE ROUTES
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <th style={{ padding: '0 1rem' }}>ID</th>
              <th>Route Name</th>
              <th>Created</th>
              <th>Product</th>
              <th style={{ textAlign: 'right', padding: '0 1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((wf) => (
              <tr key={wf.id} style={{ background: '#f8fafc', borderRadius: '1rem' }}>
                <td style={{ padding: '1rem', borderRadius: '0.75rem 0 0 0.75rem', fontWeight: '700', fontFamily: 'monospace', color: 'var(--primary)' }}>
                  {wf.id}
                </td>
                <td style={{ fontWeight: '600' }}>{wf.name}</td>
                <td style={{ fontSize: '0.85rem' }}>{wf.date}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <Package size={14} color="#64748b" />
                    {wf.product}
                  </div>
                </td>
                <td style={{ padding: '1rem', borderRadius: '0 0.75rem 0.75rem 0', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => generateOtp(wf.id)}
                      style={{ 
                        padding: '0.4rem 0.8rem', background: '#f59e0b', color: 'white', 
                        border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', 
                        fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' 
                      }}
                    >
                      <Key size={14} /> OTP
                    </button>
                    <button 
                      onClick={() => handleJoin(wf)}
                      style={{ 
                        padding: '0.4rem 0.8rem', background: '#10b981', color: 'white', 
                        border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', 
                        fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' 
                      }}
                    >
                      Join <ArrowRight size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkflowsCard;
