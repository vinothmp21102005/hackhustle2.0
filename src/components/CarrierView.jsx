import React, { useState, useEffect } from 'react';
import { connectWallet, getContract } from '../lib/web3';
import { iotRegistry } from '../lib/iotRegistry';
import env from '../config/env';
import { 
  Truck, 
  MapPin, 
  Thermometer, 
  ShieldAlert, 
  CheckCircle, 
  Smartphone, 
  FileText, 
  Lock, 
  Eye, 
  CheckCircle2,
  AlertCircle,
  Activity,
  XCircle,
  ShieldCheck,
  Hash,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const CarrierView = ({ shipments, onUpdate, activeOtps, searchQuery }) => {
  const [selectedBatch, setSelectedBatch] = useState('');
  
  const filteredShipments = searchQuery 
    ? shipments.filter(s => 
        (s.shipmentId || s.id || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : shipments;

  // Auto-select if search query matches exactly
  useEffect(() => {
    if (searchQuery) {
      const match = shipments.find(s => 
        (s.shipmentId || s.id || '').toLowerCase() === searchQuery.toLowerCase()
      );
      if (match) {
        setSelectedBatch(match.shipmentId || match.id);
      }
    }
  }, [searchQuery, shipments]);
  const [logType, setLogType] = useState('pickup'); // pickup, transit, delivery
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docDetails, setDocDetails] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    batchNumber: '',
    vehicleId: 'TRUCK-DELTA-401',
    driverId: 'DRV-772',
    sealNumber: 'SEAL-4491',
    temperature: '4.5',
    location: 'In-Transit',
    packageCondition: 'OK'
  });
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (activeBatchData) {
      const data = {
        productName: activeBatchData.productName || '',
        batchNumber: activeBatchData.shipmentId || '',
        vehicleId: 'TRUCK-DELTA-401',
        driverId: 'DRV-772',
        sealNumber: 'SEAL-4491',
        temperature: '4.5',
        location: 'In-Transit',
        packageCondition: 'OK'
      };
      setFormData(data);
      setOriginalData({
        productName: activeBatchData.productName || '',
        batchNumber: activeBatchData.shipmentId || ''
      });
    }
  }, [activeBatchData]);

  const handleFieldChange = (field, value) => {
    if (originalData[field] !== undefined && originalData[field] !== value) {
      alert(`⚠️ TAMPER ALERT: You are modifying a common field '${field.replace(/([A-Z])/g, ' $1').toLowerCase()}'. This action is unauthorized and will be flagged in the blockchain forensic ledger!`);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [isAutoLogging, setIsAutoLogging] = useState(false);
  const [autoLogInterval, setAutoLogInterval] = useState(null);
  const [liveSensors, setLiveSensors] = useState({});
  const [lastHash, setLastHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [isWorkshopOpen, setIsWorkshopOpen] = useState(false);
  const [workshopType, setWorkshopType] = useState(env.DOC_TYPES.INVOICE);
  const [workshopItems, setWorkshopItems] = useState([
    { desc: 'Medical Consignments', qty: '1', unit: 'Lot' }
  ]);
  const [workshopData, setWorkshopData] = useState({
    docId: `DOC-${Math.floor(Math.random() * 10000)}`,
    date: new Date().toISOString().split('T')[0],
    issuer: env.DEFAULT_CARRIER_ID,
    receiver: '',
    vehicleNo: 'TRUCK-DELTA-401',
    sealNo: 'SEAL-4491',
    notes: 'Authenticated via HackBlock Ledger Protocol.'
  });
  const [isAnchoring, setIsAnchoring] = useState(false);

  const activeBatchData = shipments.find(s => s.shipmentId === selectedBatch);

  useEffect(() => {
    const unsubscribe = iotRegistry.subscribe(sensors => {
      setLiveSensors(sensors);
      if (logType === 'transit' && sensors[env.IOT_SENSORS.ALPHA]) {
        setFormData(prev => ({ ...prev, temperature: sensors[env.IOT_SENSORS.ALPHA].temp.toString() }));
      }
    });
    return unsubscribe;
  }, [logType]);

  useEffect(() => {
    if (viewingDoc && selectedBatch) {
      const fetchDocDetails = async () => {
        setLoadingDoc(true);
        setDocDetails(null);
        try {
          const { provider, signer } = await connectWallet();
          const contract = await getContract(signer);
          const docs = await contract.getDocuments(selectedBatch);
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

  const activeShipments = filteredShipments.filter(s => s.status !== env.STATUS.DEALER_ACCEPTED);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (logType === 'delivery') {
      const correctOtp = activeOtps[selectedBatch];
      if (otp !== correctOtp && otp !== env.OTP_BYPASS_CODE) {
        alert("Invalid Delivery OTP. Recipient must authorize via Dealer portal.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const { provider, signer } = await connectWallet();
      const contract = await getContract(signer);

      const actionText = 
        logType === 'pickup' ? env.STATUS.PICKUP : 
        logType === 'transit' ? env.STATUS.IN_TRANSIT : 
        env.STATUS.WAREHOUSE_DELIVERY;

      // Smart contract expects integer for temperature
      const tempInt = Math.round(parseFloat(formData.temperature));
      const locationString = `${formData.location} [${actionText}]`;

      console.log(`Logging temperature ${tempInt}°C at ${locationString} for batch ${selectedBatch}...`);
      const tx = await contract.logTemperature(selectedBatch, tempInt, locationString);
      await tx.wait(); // Wait for block confirmation
      
      // Sync with local forensic ledger
      chainInstance.addBlock({
        shipmentId: selectedBatch,
        productName: formData.productName,
        status: actionText,
        temperature: formData.temperature,
        location: locationString,
        vehicleId: formData.vehicleId,
        sealNumber: formData.sealNumber
      }, signer.address);

      setIsLoading(false);
      setSelectedBatch('');
      setOtp('');
      if (onUpdate) onUpdate();
      alert(`Blockchain entry recorded: ${actionText}`);
    } catch (error) {
      console.error(error);
      alert("Transaction failed: " + (error.reason || error.message));
      setIsLoading(false);
    }
  };

  // Autonomous IoT Logging Logic
  useEffect(() => {
    if (isAutoLogging && selectedBatch) {
      console.log("Starting Autonomous IoT Logging...");
      const interval = setInterval(async () => {
        const currentTemp = parseFloat(liveSensors[env.IOT_SENSORS.ALPHA]?.temp || formData.temperature);
        const location = `Autonomous Checkpoint [${formData.vehicleId}]`;
        
        try {
          const { signer } = await connectWallet();
          const contract = await getContract(signer);
          
          console.log(`[IoT Auto-Log] Batch ${selectedBatch}: ${currentTemp}°C`);
          
          // Visual Hashing Effect
          setIsHashing(true);
          const dataToHash = `${selectedBatch}${Math.round(currentTemp)}${location}${Date.now()}`;
          // Simulate hash generation
          const mockHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
          setLastHash(mockHash);
          
          const tx = await contract.logTemperature(selectedBatch, Math.round(currentTemp), location);
          await tx.wait();
          
          setTimeout(() => setIsHashing(false), 2000); // Keep visual for 2s
          
          // Sync with local forensic ledger
          chainInstance.addBlock({
            shipmentId: selectedBatch,
            status: 'Autonomous IoT Log',
            temperature: currentTemp,
            location: location,
            vehicleId: formData.vehicleId,
            sensorId: env.IOT_SENSORS.ALPHA
          }, signer.address);
          
          if (onUpdate) onUpdate();
        } catch (err) {
          console.error("Auto-Log Failed:", err);
          setIsAutoLogging(false);
        }
      }, 15000); // Log every 15 seconds
      
      setAutoLogInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (autoLogInterval) {
        clearInterval(autoLogInterval);
        setAutoLogInterval(null);
      }
    }
  }, [isAutoLogging, selectedBatch]);

  const generateCarrierDocument = (type, data, items) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("COLDCHAIN LOGISTICS LEDGER", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text(type.toUpperCase(), 105, 30, { align: "center" });
    
    doc.setDrawColor(37, 99, 235);
    doc.line(20, 35, 190, 35);
    
    // Summary Info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Document ID: ${data.docId}`, 20, 45);
    doc.text(`Date: ${data.date}`, 20, 50);
    doc.text(`Batch ID: ${selectedBatch}`, 20, 55);
    
    doc.text(`Issuer: ${data.issuer}`, 120, 45);
    doc.text(`Receiver: ${data.receiver}`, 120, 50);
    doc.text(`Vehicle: ${data.vehicleNo}`, 120, 55);

    // Items Table
    const tableRows = items.map(item => [item.desc, item.qty, item.unit]);
    autoTable(doc, {
      startY: 65,
      head: [['Description', 'Quantity', 'Unit']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 9 }
    });

    const finalY = doc.lastAutoTable.finalY || 150;

    // Notes
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Logistics Notes:", 20, finalY + 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(data.notes || 'No additional notes.', 20, finalY + 22, { maxWidth: 170 });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("This document was digitally generated and cryptographically anchored to the blockchain.", 105, 285, { align: "center" });
    doc.text("HACKBLOCK SECURE PROTOCOL - VERIFY AT HACKBLOCK.IO", 105, 290, { align: "center" });
    
    return doc.output('blob');
  };

  const handleWorkshopSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) {
      alert("Please select a batch first.");
      return;
    }

    setIsAnchoring(true);
    try {
      const { provider, signer } = await connectWallet();
      const contract = await getContract(signer);

      // 1. Generate PDF Blob
      const pdfBlob = generateCarrierDocument(workshopType, workshopData, workshopItems);
      const file = new File([pdfBlob], `${workshopType.replace(/\s+/g, '_')}_${selectedBatch}.pdf`, { type: 'application/pdf' });

      // 2. Upload to IPFS
      const { uploadToIPFS } = await import('../lib/ipfs');
      const { cid, hash } = await uploadToIPFS(file);

      // 3. Anchor on Blockchain
      console.log(`Anchoring document ${workshopType} for batch ${selectedBatch}...`);
      const tx = await contract.uploadDocument(selectedBatch, workshopType, cid, hash);
      await tx.wait();
      
      // Sync with local forensic ledger
      chainInstance.addBlock({
        shipmentId: selectedBatch,
        action: 'DOCUMENT_UPLOAD',
        docType: workshopType,
        hash: hash,
        cid: cid
      }, signer.address);

      alert("Document successfully anchored to the blockchain ledger!");
      setIsWorkshopOpen(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert("Workshop Error: " + (err.reason || err.message));
    } finally {
      setIsAnchoring(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
      <div className="card animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '0.5rem' }}>
            <Truck color="white" size={20} />
          </div>
          <h3 style={{ margin: 0 }}>Carrier Logistics Hub</h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="field">
            <label>Active Consignment (Batch ID)</label>
            <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} required>
              <option value="">Select Batch...</option>
              {activeShipments.map(s => (
                <option key={s.shipmentId} value={s.shipmentId}>{s.shipmentId} - {s.productName}</option>
              ))}
            </select>
          </div>

          {selectedBatch && (
            <div className="animate-slide-in">
              <div style={{ display: 'flex', gap: '0.5rem', background: '#f8fafc', padding: '0.25rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                {['pickup', 'transit', 'delivery'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setLogType(t); setOtp(''); }}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: '0.4rem',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      background: logType === t ? 'white' : 'transparent',
                      color: logType === t ? 'var(--primary)' : 'var(--text-muted)',
                      boxShadow: logType === t ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="field">
                  <label>Product Name (Common Field)</label>
                  <input value={formData.productName} onChange={e => handleFieldChange('productName', e.target.value)} required />
                </div>
                <div className="field">
                  <label>Batch No (Common Field)</label>
                  <input value={formData.batchNumber} onChange={e => handleFieldChange('batchNumber', e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="field">
                  <label>Vehicle ID</label>
                  <input value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})} required />
                </div>
                <div className="field">
                  <label>Seal Integrity</label>
                  <input value={formData.sealNumber} onChange={e => setFormData({...formData, sealNumber: e.target.value})} required />
                </div>
              </div>

              <div className="field" style={{ marginBottom: '1.25rem' }}>
                <label>Current Location</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                  <input style={{ paddingLeft: '2.5rem' }} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                </div>
              </div>

              {logType === 'delivery' && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                     <Smartphone size={20} color="var(--primary)" />
                     <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Recipient Verification</h4>
                   </div>
                   <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                     Enter the 6-digit Delivery OTP provided by the Dealer to verify the final handover.
                   </p>
                   <input 
                     placeholder="0 0 0 0 0 0" 
                     value={otp} 
                     onChange={e => setOtp(e.target.value)}
                     style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}
                   />
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading || (logType === 'delivery' && otp.length < 4)} 
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
              >
                {isLoading ? <Activity className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                {isLoading ? 'Anchoring Transaction...' : 'Record to Blockchain'}
              </button>
            </div>
          )}
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <FileText size={20} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>Cargo Documents</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { type: env.DOC_TYPES.INVOICE, icon: FileText },
              { type: env.DOC_TYPES.PACKING_LIST, icon: FileText },
              { type: env.DOC_TYPES.TEMP_LOG, icon: Activity }
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
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{doc.type}</span>
                </div>
                <Eye size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>

          <button 
            className="btn-primary pulse-btn" 
            style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#0f172a' }}
            onClick={() => selectedBatch ? setIsWorkshopOpen(true) : alert("Select a batch to open the workshop")}
          >
            <Activity size={18} /> Open Document Workshop
          </button>
        </div>

        <div className="card" style={{ background: '#0f172a', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <ShieldAlert color="#f59e0b" />
            <h4 style={{ color: 'white', margin: 0 }}>IoT Sensor Feed</h4>
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Gateway Status</span>
              <span style={{ color: '#10b981' }}>ENCRYPTED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Temp Precision</span>
              <span style={{ color: '#10b981' }}>±0.1°C</span>
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={16} color={isAutoLogging ? '#10b981' : '#64748b'} className={isAutoLogging ? 'animate-pulse' : ''} />
                  <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>AUTO-PILOT LOGGING</span>
                </div>
                <button 
                  onClick={() => selectedBatch ? setIsAutoLogging(!isAutoLogging) : alert("Select a batch to start Auto-Pilot")}
                  style={{ 
                    background: isAutoLogging ? '#dc2626' : '#10b981', 
                    color: 'white', 
                    fontSize: '0.6rem', 
                    fontWeight: '800', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '1rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {isAutoLogging ? 'DISABLE' : 'ENABLE'}
                </button>
              </div>

              {isAutoLogging && (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Lock size={10} /> {isHashing ? 'HASHING DATA...' : 'STANDBY: BROADCASTING'}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', wordBreak: 'break-all', color: isHashing ? '#10b981' : '#64748b', opacity: isHashing ? 1 : 0.6, transition: 'all 0.3s' }}>
                    {lastHash || '0x0000000000000000000000000000000000000000000000000000000000000000'}
                  </div>
                  {isHashing && (
                    <div style={{ height: '2px', background: '#10b981', width: '100%', marginTop: '0.5rem', borderRadius: '1px', animation: 'progress 2s linear' }}></div>
                  )}
                </div>
              )}

              <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>
                {isAutoLogging 
                  ? "System is autonomously logging Alpha-Sensor data to the ledger every 15s." 
                  : "Enable to simulate a live IoT device streaming data directly to the blockchain."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {viewingDoc && (
        <div className="modal-overlay" onClick={() => setViewingDoc(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card animate-scale" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#eff6ff', padding: '0.5rem', borderRadius: '0.5rem' }}>
                  <FileText color="var(--primary)" size={20} />
                </div>
                <h3 style={{ margin: 0 }}>{viewingDoc}</h3>
              </div>
              <button onClick={() => setViewingDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><XCircle /></button>
            </div>

            <div className="document-preview-paper" style={{ border: '1px solid var(--border)', width: 'auto', maxHeight: 'none', margin: '0 auto' }}>
              <div className="preview-watermark">AUTHENTIC</div>
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
                      {loadingDoc ? 'Verifying Chain Integrity...' : 'Cryptographic Proof Verified'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>LEDGER ANCHOR (SHA-256):</p>
                  <p style={{ margin: 0, wordBreak: 'break-all', fontSize: '0.75rem', fontWeight: '700', color: loadingDoc ? 'var(--text-muted)' : 'var(--primary)', fontFamily: 'monospace' }}>
                    {loadingDoc ? '----------------------------------------------------------------' : (docDetails?.hash || 'NOT_FOUND_IN_LEDGER')}
                  </p>
                </div>

                <div className="preview-field">
                  <span className="preview-label">Product:</span>
                  <span>{activeBatchData?.productName || 'N/A'}</span>
                </div>
                <div className="preview-field">
                  <span className="preview-label">Batch ID:</span>
                  <span>{selectedBatch}</span>
                </div>
                <div className="preview-field">
                  <span className="preview-label">Uploader:</span>
                  <span style={{ fontSize: '0.6rem' }}>{docDetails?.uploader || 'N/A'}</span>
                </div>
                <div className="preview-field">
                  <span className="preview-label">Timestamp:</span>
                  <span>{docDetails?.timestamp ? new Date(docDetails.timestamp * 1000).toLocaleString() : 'N/A'}</span>
                </div>
                
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Hash size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)' }}>BLOCKCHAIN METADATA</span>
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>Status: ANCHORED</div>
                    <div>Network: HACKBLOCK SECURE</div>
                  </div>
                </div>
              </div>
              
              <div className="preview-footer">
                <div style={{ marginBottom: '0.2rem' }}>OFFICIAL LOGISTICS RECORD</div>
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
                <Eye size={18} /> View Source
              </a>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={() => window.print()}
              >
                <Download size={18} /> Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {isWorkshopOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card animate-scale" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflow: 'hidden', padding: 0 }}>
            <div className="workshop-container">
              <div style={{ padding: '2rem', overflowY: 'auto', maxHeight: '90vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ margin: 0 }}>Document Workshop</h2>
                  <button onClick={() => setIsWorkshopOpen(false)} style={{ color: 'var(--text-muted)' }}><XCircle /></button>
                </div>

                <form onSubmit={handleWorkshopSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="field">
                    <label>Document Type</label>
                    <select value={workshopType} onChange={e => setWorkshopType(e.target.value)}>
                      {Object.values(env.DOC_TYPES).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid-form">
                    <div className="field">
                      <label>Document ID</label>
                      <input value={workshopData.docId} onChange={e => setWorkshopData({...workshopData, docId: e.target.value})} required />
                    </div>
                    <div className="field">
                      <label>Effective Date</label>
                      <input type="date" value={workshopData.date} onChange={e => setWorkshopData({...workshopData, date: e.target.value})} required />
                    </div>
                  </div>

                  <div className="grid-form">
                    <div className="field">
                      <label>Recipient / Consignee</label>
                      <input 
                        placeholder="e.g. Apollo Pharmacy Hub" 
                        value={workshopData.receiver} 
                        onChange={e => setWorkshopData({...workshopData, receiver: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="field">
                      <label>Vehicle Number</label>
                      <input 
                        value={workshopData.vehicleNo} 
                        onChange={e => setWorkshopData({...workshopData, vehicleNo: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Cargo Items Details
                      <button 
                        type="button" 
                        onClick={() => setWorkshopItems([...workshopItems, { desc: '', qty: '', unit: '' }])}
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--primary)', color: 'white', borderRadius: '0.25rem' }}
                      >
                        + Add Item
                      </button>
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {workshopItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 40px', gap: '0.5rem' }}>
                          <input 
                            placeholder="Description" 
                            value={item.desc} 
                            onChange={e => {
                              const newItems = [...workshopItems];
                              newItems[idx].desc = e.target.value;
                              setWorkshopItems(newItems);
                            }} 
                            required 
                          />
                          <input 
                            placeholder="Qty" 
                            type="number"
                            value={item.qty} 
                            onChange={e => {
                              const newItems = [...workshopItems];
                              newItems[idx].qty = e.target.value;
                              setWorkshopItems(newItems);
                            }} 
                            required 
                          />
                          <input 
                            placeholder="Unit" 
                            value={item.unit} 
                            onChange={e => {
                              const newItems = [...workshopItems];
                              newItems[idx].unit = e.target.value;
                              setWorkshopItems(newItems);
                            }} 
                            required 
                          />
                          {workshopItems.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => setWorkshopItems(workshopItems.filter((_, i) => i !== idx))}
                              style={{ color: '#ef4444' }}
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <label>Special Logistics Notes</label>
                    <textarea 
                      rows={2} 
                      value={workshopData.notes} 
                      onChange={e => setWorkshopData({...workshopData, notes: e.target.value})} 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={isAnchoring}
                    style={{ padding: '1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                  >
                    {isAnchoring ? <Activity className="animate-spin" /> : <ShieldCheck />}
                    {isAnchoring ? 'Hashing & Anchoring...' : 'Sign & Anchor to Ledger'}
                  </button>
                </form>
              </div>

              <div className="document-preview-container" style={{ borderRadius: 0, border: 'none', borderLeft: '1px solid var(--border)' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span className="immutable-tag"><Lock size={12}/> LIVE LEDGER PREVIEW</span>
                </div>
                
                <div className="document-preview-paper">
                  <div className="preview-watermark">DRAFT</div>
                  <div className="preview-header">
                    <h4 style={{ margin: 0 }}>OFFICIAL COLDCHAIN LEDGER</h4>
                    <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 700 }}>{workshopType.toUpperCase()}</p>
                  </div>
                  
                  <div className="preview-content">
                    <div className="preview-field">
                      <span className="preview-label">Document ID:</span>
                      <span>{workshopData.docId}</span>
                    </div>
                    <div className="preview-field">
                      <span className="preview-label">Date:</span>
                      <span>{workshopData.date}</span>
                    </div>
                    <div className="preview-field">
                      <span className="preview-label">Batch ID:</span>
                      <span>{selectedBatch}</span>
                    </div>
                    <div className="preview-field">
                      <span className="preview-label">Issuer:</span>
                      <span>{workshopData.issuer}</span>
                    </div>
                    <div className="preview-field">
                      <span className="preview-label">Receiver:</span>
                      <span>{workshopData.receiver || '_________________'}</span>
                    </div>
                    <div className="preview-field">
                      <span className="preview-label">Vehicle No:</span>
                      <span>{workshopData.vehicleNo}</span>
                    </div>
                    
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.65rem', marginBottom: '0.25rem' }}>CARGO DESCRIPTION:</p>
                      <table style={{ width: '100%', fontSize: '0.6rem', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ border: '1px solid #cbd5e1', padding: '0.25rem', textAlign: 'left' }}>Item</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '0.25rem' }}>Qty</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '0.25rem' }}>Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workshopItems.map((item, i) => (
                            <tr key={i}>
                              <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem' }}>{item.desc || '---'}</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem', textAlign: 'center' }}>{item.qty || '0'}</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '0.25rem', textAlign: 'center' }}>{item.unit || '---'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.65rem', marginBottom: '0.25rem' }}>LOGISTICS NOTES:</p>
                      <p style={{ fontSize: '0.6rem', fontStyle: 'italic' }}>{workshopData.notes}</p>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <div style={{ width: '100px', height: '1px', background: 'black', marginBottom: '0.25rem' }}></div>
                          <div style={{ fontSize: '0.5rem' }}>AUTHORIZED SIGNATORY</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>BLOCKCHAIN ANCHOR</div>
                          <div style={{ fontSize: '0.5rem', fontWeight: 700 }}>PENDING SIGNATURE</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="preview-footer">
                    <div>THIS IS A CRYPTOGRAPHICALLY SECURED DOCUMENT</div>
                    <div>VERIFY AT HACKBLOCK.IO/VERIFY</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CarrierView;
