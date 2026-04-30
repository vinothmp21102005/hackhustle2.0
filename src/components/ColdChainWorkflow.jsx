import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, AlertTriangle, Clock, ChevronRight, 
  Thermometer, Hash, ShieldCheck, Factory, Truck, 
  Warehouse, Store, Pill, AlertCircle, FileText,
  Activity, XCircle, ArrowRight, UserCircle, LogOut
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

const generateTempData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: `1${i % 10}:00`,
    temp: 2 + Math.random() * 6 + (Math.random() > 0.9 ? 4 : 0), 
  }));
};

const WORKFLOW_NODES = [
  { id: 'manufacturer', label: 'Manufacturer', icon: Factory, role: 'manufacturer' },
  { id: 'carrier_pickup', label: 'Carrier Pickup', icon: Truck, role: 'carrier' },
  { id: 'warehouse_receipt', label: 'Warehouse Receipt', icon: Warehouse, role: 'warehouse' },
  { id: 'warehouse_dispatch', label: 'Warehouse Dispatch', icon: Warehouse, role: 'warehouse' },
  { id: 'carrier_delivery', label: 'Carrier Delivery', icon: Truck, role: 'carrier' },
  { id: 'dealer', label: 'Dealer', icon: Store, role: 'dealer' },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill, role: 'pharmacy' }
];

const COMMON_FIELDS = [
  { id: 'batchId', label: 'Batch ID', type: 'text' },
  { id: 'productName', label: 'Product Name', type: 'text' },
  { id: 'quantity', label: 'Quantity', type: 'number' },
  { id: 'unit', label: 'Unit', type: 'text' },
  { id: 'dispatchDateTime', label: 'Dispatch Date & Time', type: 'datetime-local' },
  { id: 'expectedDelivery', label: 'Expected Delivery Date', type: 'date' },
  { id: 'senderId', label: 'Sender ID', type: 'text' },
  { id: 'receiverId', label: 'Receiver ID', type: 'text' },
  { id: 'transportId', label: 'Transport ID', type: 'text' },
  { id: 'sealNumber', label: 'Seal Number', type: 'text' },
  { id: 'packageCount', label: 'Package Count', type: 'number' },
  { id: 'storageRequirement', label: 'Storage Requirement', type: 'text' }
];

const ROLE_FIELDS = {
  manufacturer: [
    { id: 'mfgDate', label: 'Manufacturing Date', type: 'date' },
    { id: 'expDate', label: 'Expiry Date', type: 'date' },
    { id: 'coaHash', label: 'COA Hash', type: 'text' },
    { id: 'invoiceNum', label: 'Invoice Number', type: 'text' },
    { id: 'packingListHash', label: 'Packing List Hash', type: 'text' }
  ],
  carrier: [
    { id: 'pickupTime', label: 'Pickup/Delivery Time', type: 'datetime-local' },
    { id: 'vehicleNum', label: 'Vehicle Number', type: 'text' },
    { id: 'driverId', label: 'Driver ID', type: 'text' },
    { id: 'temp', label: 'Temperature', type: 'number' },
    { id: 'sealVerified', label: 'Seal Verified', type: 'checkbox' },
    { id: 'podHash', label: 'Proof of Delivery (Hash)', type: 'text' }
  ],
  warehouse: [
    { id: 'time', label: 'Time (Receipt/Dispatch)', type: 'datetime-local' },
    { id: 'temp', label: 'Temperature', type: 'number' },
    { id: 'damageStatus', label: 'Damage Status', type: 'text' },
    { id: 'storageLocation', label: 'Storage Location', type: 'text' },
    { id: 'newSealNum', label: 'New Seal Number', type: 'text' }
  ],
  dealer: [
    { id: 'stockEntryId', label: 'Stock Entry ID', type: 'text' },
    { id: 'invoiceNum', label: 'Invoice Number', type: 'text' }
  ],
  pharmacy: [
    { id: 'receivedTime', label: 'Received Time', type: 'datetime-local' },
    { id: 'conditionCheck', label: 'Condition Check', type: 'text' },
    { id: 'status', label: 'Status', type: 'select', options: ['Accepted', 'Rejected'] }
  ]
};

// Initial Mock Data
const initialCommonData = {
  batchId: 'BTH-90210',
  productName: 'Covid-19 MRNA Vaccine',
  quantity: 5000,
  unit: 'Vials',
  dispatchDateTime: '2026-05-01T08:00',
  expectedDelivery: '2026-05-05',
  senderId: 'MFG-001',
  receiverId: 'PHR-992',
  transportId: 'TRN-4421',
  sealNumber: 'SL-884920',
  packageCount: 10,
  storageRequirement: '2°C to 8°C'
};

export default function ColdChainWorkflow({ userRole = 'carrier', userWallet = '0x7099...79c8', onLogout }) {
  const [currentNodeIdx, setCurrentNodeIdx] = useState(1); // 0=mfg done, 1=carrier pending
  const [selectedNodeIdx, setSelectedNodeIdx] = useState(1);
  const [tempData, setTempData] = useState([]);
  
  // Data States
  const [commonData, setCommonData] = useState(initialCommonData);
  const [originalCommonData, setOriginalCommonData] = useState(initialCommonData);
  const [roleData, setRoleData] = useState({});
  const [mismatches, setMismatches] = useState([]);
  const [submittedMismatches, setSubmittedMismatches] = useState([]);

  useEffect(() => {
    setTempData(generateTempData());
    const interval = setInterval(() => {
      setTempData(generateTempData());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCommonFieldChange = (key, val) => {
    setCommonData(prev => ({ ...prev, [key]: val }));
    
    // Check mismatch
    if (originalCommonData[key] !== val) {
      if (!mismatches.includes(key)) {
        setMismatches(prev => [...prev, key]);
      }
    } else {
      setMismatches(prev => prev.filter(k => k !== key));
    }
  };

  const handleRoleFieldChange = (key, val) => {
    setRoleData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = () => {
    alert("Data hashed and submitted to Blockchain/IPFS!");
    setCurrentNodeIdx(prev => Math.min(prev + 1, WORKFLOW_NODES.length - 1));
    setSelectedNodeIdx(prev => Math.min(prev + 1, WORKFLOW_NODES.length - 1));
    setOriginalCommonData(commonData);
    if (mismatches.length > 0) {
      setSubmittedMismatches(prev => [...new Set([...prev, ...mismatches])]);
      setMismatches([]);
    }
  };

  const selectedNode = WORKFLOW_NODES[selectedNodeIdx];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800 font-sans">
      
      {/* LEFT SIDE - WORKFLOW GRAPH (60%) */}
      <div className="w-[60%] h-full p-8 overflow-y-auto border-r border-slate-200 bg-white relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Supply Chain Provenance</h1>
            <p className="text-slate-500 mt-1">Batch {commonData.batchId} • Visual Pipeline Tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-100 flex items-center gap-2">
              <Activity size={16} /> Live Tracking
            </div>
            {onLogout && (
              <button onClick={onLogout} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" title="Disconnect Wallet">
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Workflow Nodes */}
        <div className="relative pl-8 pb-20">
          {/* Vertical Line */}
          <div className="absolute left-[39px] top-8 bottom-0 w-1 bg-slate-200 rounded-full" />
          
          {WORKFLOW_NODES.map((node, idx) => {
            const isCompleted = idx < currentNodeIdx;
            const isPending = idx === currentNodeIdx;
            const isFuture = idx > currentNodeIdx;
            const isSelected = idx === selectedNodeIdx;
            
            // Generate visual styles based on state
            let dotColor = 'bg-slate-300 border-slate-300';
            let cardStyle = 'border-slate-200 bg-white opacity-60';
            let statusBadge = '';
            
            if (isCompleted) {
              dotColor = 'bg-emerald-500 border-emerald-200';
              cardStyle = 'border-emerald-200 bg-white shadow-sm';
              statusBadge = <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md flex items-center gap-1"><CheckCircle2 size={12}/> Completed</span>;
            } else if (isPending) {
              dotColor = 'bg-amber-500 border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
              cardStyle = 'border-amber-400 bg-gradient-to-r from-amber-50 to-white shadow-md ring-2 ring-amber-100';
              statusBadge = <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-700 rounded-md flex items-center gap-1"><Clock size={12}/> Pending Action</span>;
            }

            if (isSelected) {
              cardStyle += ' ring-2 ring-blue-500 shadow-lg scale-[1.02] transition-transform';
            }

            return (
              <div 
                key={node.id} 
                className="relative mb-12 cursor-pointer group"
                onClick={() => setSelectedNodeIdx(idx)}
              >
                {/* Node Timeline Dot */}
                <div className={`absolute -left-10 top-6 w-5 h-5 rounded-full border-4 z-10 transition-colors duration-300 ${dotColor}`} />
                
                {/* Connecting Path Animation for active */}
                {isCompleted && (
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: '100%' }} 
                    className="absolute -left-[39px] top-11 w-1 bg-emerald-500 z-0" 
                    style={{ left: '-39px' }}
                  />
                )}

                <motion.div 
                  layout
                  className={`p-5 rounded-2xl border ${cardStyle} transition-all duration-300`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isPending ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                        <node.icon size={24} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${isFuture ? 'text-slate-400' : 'text-slate-800'}`}>
                          {node.label}
                        </h3>
                        <p className="text-sm text-slate-500 font-mono mt-1">
                          Role: <span className="uppercase">{node.role}</span> | Wallet: {isFuture ? '---' : userWallet}
                        </p>
                        {!isFuture && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Clock size={12} /> {isCompleted ? '2026-05-01 10:30 AM' : 'Awaiting Action'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {statusBadge}
                    </div>
                  </div>
                  
                  {/* Alert for mismatches in previous nodes shown to next node */}
                  {isPending && submittedMismatches.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                    >
                      <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                      <div>
                        <h4 className="text-sm font-semibold text-red-800">Data Mismatch Detected in Previous Step</h4>
                        <p className="text-xs text-red-600 mt-1">Hash verification failed for {submittedMismatches.length} fields.</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE - FORM & STATUS (40%) */}
      <div className="w-[40%] h-full flex flex-col bg-slate-50 border-l border-slate-200 shadow-[-10px_0_30px_rgba(0,0,0,0.03)] z-10">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <selectedNode.icon size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{selectedNode.label}</h2>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Data Entry & Verification</p>
            </div>
          </div>
          {selectedNodeIdx === currentNodeIdx && (
             <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-md">
               <UserCircle size={16} /> Your Task
             </div>
          )}
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Mismatch Warning Banner */}
          <AnimatePresence>
            {mismatches.length > 0 && selectedNodeIdx === currentNodeIdx && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm"
              >
                <div className="flex items-center gap-2 text-red-800 font-bold mb-1">
                  <ShieldAlert size={18} /> You are modifying previously submitted data
                </div>
                <p className="text-sm text-red-600">
                  Modifying these fields will break the blockchain hash chain and flag this shipment for review.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Split */}
          <div className="grid grid-cols-2 gap-8">
            {/* Left: Common Fields */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-2">
                <FileText size={16} className="text-slate-400" /> Shipment Details
              </div>
              {COMMON_FIELDS.map(field => {
                const isModified = mismatches.includes(field.id);
                const isEditable = selectedNodeIdx === currentNodeIdx;
                
                return (
                  <div key={field.id} className="relative">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      value={commonData[field.id] || ''}
                      onChange={(e) => handleCommonFieldChange(field.id, e.target.value)}
                      disabled={!isEditable}
                      className={`w-full px-3 py-2 text-sm rounded-lg border transition-all ${
                        !isEditable ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' :
                        isModified ? 'bg-red-50 border-red-300 text-red-900 focus:ring-2 focus:ring-red-200' :
                        'bg-white border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                    {isModified && isEditable && (
                      <span className="absolute right-2 top-7 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">MODIFIED</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Right: Role Specific Fields */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-2">
                <ShieldCheck size={16} className="text-slate-400" /> Role Specific
              </div>
              
              {(ROLE_FIELDS[selectedNode.role] || []).map(field => {
                const isEditable = selectedNodeIdx === currentNodeIdx;
                
                if (field.type === 'select') {
                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{field.label}</label>
                      <select
                        disabled={!isEditable}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                        onChange={(e) => handleRoleFieldChange(field.id, e.target.value)}
                      >
                        <option value="">Select...</option>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  );
                }

                if (field.type === 'checkbox') {
                  return (
                    <div key={field.id} className="flex items-center gap-3 pt-2">
                      <input 
                        type="checkbox" 
                        disabled={!isEditable}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                        onChange={(e) => handleRoleFieldChange(field.id, e.target.checked)}
                      />
                      <label className="text-sm font-medium text-slate-700">{field.label}</label>
                    </div>
                  );
                }

                return (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      disabled={!isEditable}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      onChange={(e) => handleRoleFieldChange(field.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                )
              })}

              {/* Temperature Graph Component for specific roles that need it */}
              {(selectedNode.role === 'carrier' || selectedNode.role === 'warehouse') && (
                <div className="mt-8 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Thermometer size={16} className="text-blue-500" />
                      <span className="text-sm font-bold text-slate-700">Live Temperature</span>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                      IPFS Stream
                    </span>
                  </div>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tempData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="time" tick={{fontSize: 10}} stroke="#94a3b8" />
                        <YAxis tick={{fontSize: 10}} stroke="#94a3b8" domain={[0, 15]} />
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                        <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="3 3" />
                        <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="3 3" />
                        <Line 
                          type="monotone" 
                          dataKey="temp" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status / Comparison Footer Section */}
        <div className="bg-white border-t border-slate-200 p-6 shrink-0">
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Hash size={16} className="text-slate-400" /> Data Validation
            </h3>
            
            {(submittedMismatches.length === 0 && mismatches.length === 0) ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                <CheckCircle2 size={14} /> Hash Matched
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                <XCircle size={14} /> Mismatch Detected
              </div>
            )}
          </div>

          {/* Field Comparison Table for mismatches */}
          {(submittedMismatches.length > 0 || mismatches.length > 0) && (
            <div className="mb-4 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Field</th>
                    <th className="p-2">Previous Value</th>
                    <th className="p-2">Current Value</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...new Set([...submittedMismatches, ...mismatches])].map(key => {
                    const isNewMismatch = mismatches.includes(key);
                    return (
                      <tr key={key} className="border-b border-slate-100 last:border-0 bg-red-50/30">
                        <td className="p-2 font-medium text-slate-700">{COMMON_FIELDS.find(f => f.id === key)?.label || key}</td>
                        <td className="p-2 text-slate-500 line-through">{isNewMismatch ? originalCommonData[key] : 'Mismatch'}</td>
                        <td className="p-2 text-red-600 font-bold">{commonData[key]}</td>
                        <td className="p-2 text-amber-600 font-semibold flex items-center gap-1"><AlertTriangle size={12}/> {isNewMismatch ? 'Changed' : 'Failed Hash'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedNodeIdx === currentNodeIdx && (
            <button 
              onClick={handleSubmit}
              className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              Sign & Submit to Blockchain
            </button>
          )}
          {selectedNodeIdx < currentNodeIdx && (
            <div className="w-full py-3 text-center text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> Step Completed & Verified
            </div>
          )}
          {selectedNodeIdx > currentNodeIdx && (
            <div className="w-full py-3 text-center text-sm font-semibold text-slate-400 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
              <Clock size={18} /> Awaiting Previous Steps
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
