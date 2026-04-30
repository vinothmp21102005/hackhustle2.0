import React, { useState } from 'react';
import { chainInstance } from '../lib/blockchain';
import { connectWallet, getContract } from '../lib/web3';
import env from '../config/env';
import { uploadToIPFS } from '../lib/ipfs';
import { Package, ShieldCheck, FileText, Activity, CheckCircle2, ChevronRight, Hash, ArrowLeft, Plus, Download, Eye } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { CONTRACT_ADDRESS } from '../lib/web3';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ProducerView = ({ onUpdate }) => {
  const [formData, setFormData] = useState({
    // Product Details
    productName: '',
    genericName: '',
    dosageForm: 'Tablet',
    strength: '',
    batchNumber: 'BATCH-' + Math.floor(Math.random() * 90000 + 10000),
    carrierAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    dealerAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    
    // Manufacturing Details
    manufacturingLicense: '',
    manufacturerName: 'BioPharma Global Inc.',
    manufacturerAddress: '122 Innovation Drive, Hyderabad, India',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    productionLineId: 'LINE-A4',
    quantity: '',
    storageCondition: env.DEFAULT_STORAGE_COND,

    // Compliance
    qaId: '',
    regulatoryApprovalNo: '',
    stabilityDataRef: '',
    
    // Generated Documents (Hashes)
    documents: []
  });

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [finalGenesisHash, setFinalGenesisHash] = useState('');

  // Document Forms state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [currentDocForm, setCurrentDocForm] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [isHashing, setIsHashing] = useState(false);

  const requiredDocs = [
    env.DOC_TYPES.COA,
    env.DOC_TYPES.INVOICE,
    env.DOC_TYPES.PACKING_LIST,
    env.DOC_TYPES.CHALLAN,
    env.DOC_TYPES.TEMP_LOG,
    env.DOC_TYPES.HANDLING,
    env.DOC_TYPES.BATCH_LOT,
    env.DOC_TYPES.POD
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDocFormChange = (e) => {
    setCurrentDocForm({ ...currentDocForm, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCurrentFile(e.target.files[0]);
    }
  };

  const generateDigitalDocument = (docType, data) => {
    const doc = new jsPDF();
    const batchNo = formData.batchNumber;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102);
    doc.text("HACKBLOCK COLD CHAIN", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text(docType, 105, 30, { align: "center" });
    
    doc.setDrawColor(0, 51, 102);
    doc.line(20, 35, 190, 35);
    
    // Basic Details
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Batch Number: ${batchNo}`, 20, 45);
    doc.text(`Product: ${formData.productName}`, 20, 52);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 59);
    doc.text(`Manufacturer: ${formData.manufacturerName}`, 20, 66);
    
    // Table of Specific Data
    const tableRows = Object.entries(data).map(([key, value]) => [
      key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Field', 'Value']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] }
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("This document was digitally generated and cryptographically anchored to the blockchain.", 105, 285, { align: "center" });
    
    return doc.output('blob');
  };

  const saveDocument = async (e) => {
    e.preventDefault();
    setIsHashing(true);

    try {
      let fileToUpload;
      let fileName;

      if (currentFile) {
        fileToUpload = currentFile;
        fileName = currentFile.name;
      } else {
        // Generate digital document
        const blob = generateDigitalDocument(selectedDoc, currentDocForm);
        fileToUpload = new File([blob], `${selectedDoc.replace(/\s+/g, '_')}_${formData.batchNumber}.pdf`, { type: 'application/pdf' });
        fileName = fileToUpload.name;
      }

      // 1. Compute true SHA-256 and upload to IPFS
      const { hash, cid } = await uploadToIPFS(fileToUpload);

      const newDoc = {
        type: selectedDoc,
        hash: hash,
        cid: cid,
        name: fileName,
        details: currentDocForm,
        isGenerated: !currentFile
      };

      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents.filter(d => d.type !== selectedDoc), newDoc]
      }));
      
      setSelectedDoc(null);
      setCurrentDocForm({});
      setCurrentFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to hash or upload document: " + err.message);
    } finally {
      setIsHashing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.documents.length < requiredDocs.length) {
      alert("Please fill all mandatory documents first.");
      return;
    }
    setIsLoading(true);
    
    try {
      const { provider, signer } = await connectWallet();
      const contract = await getContract(signer);

      // Parse temperatures (assume 2 and 8 based on env.DEFAULT_STORAGE_COND)
      const minTemp = 2;
      const maxTemp = 8;

      console.log("Creating shipment...");
      const tx = await contract.createShipment(
        formData.batchNumber,
        formData.productName,
        formData.carrierAddress,
        formData.dealerAddress,
        minTemp,
        maxTemp
      );
      
      await tx.wait(); // Wait for confirmation
      console.log("Shipment created!");

      const genesisBlock = chainInstance.addBlock({
        shipmentId: formData.batchNumber,
        productName: formData.productName,
        status: env.STATUS.GENESIS,
        minTemp,
        maxTemp,
        manufacturer: signer.address
      }, signer.address);
      
      setFinalGenesisHash(genesisBlock.hash);
      
      if (onUpdate) onUpdate(); // Trigger global refresh

      // 3. Upload documents to contract (Sequence)
      for (const doc of formData.documents) {
        console.log(`Uploading document: ${doc.type}...`);
        try {
          const docTx = await contract.uploadDocument(
            formData.batchNumber,
            doc.type,
            doc.cid || doc.hash,
            doc.hash
          );
          await docTx.wait();
          
          // Record doc upload in local ledger
          chainInstance.addBlock({
            shipmentId: formData.batchNumber,
            action: 'DOCUMENT_UPLOAD',
            docType: doc.type,
            hash: doc.hash
          }, signer.address);
        } catch (docErr) {
          console.warn(`Doc ${doc.type} upload failed, skipping...`, docErr);
        }
      }

      setIsLoading(false);
      setIsSuccess(true);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      alert("Transaction failed: " + (error.reason || error.message));
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="card animate-fade" style={{ textAlign: 'center', padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ background: '#ecfdf5', color: '#10b981', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', margin: '0 auto 1.5rem', justifyContent: 'center' }}>
          <ShieldCheck size={32} />
        </div>
        <h2 style={{ color: '#064e3b', marginBottom: '0.5rem' }}>Genesis Block Anchored</h2>
        <p style={{ color: '#374151', marginBottom: '2rem' }}>
          Forensic identity for Batch <strong>{formData.batchNumber}</strong> has been committed to the immutable ledger.
        </p>

        {/* Forensic Certificate Preview */}
        <div className="document-preview-paper" style={{ margin: '0 auto 2rem', textAlign: 'left', width: '100%', maxWidth: '600px', border: '2px solid #e2e8f0' }}>
          <div className="preview-watermark">AUTHENTIC</div>
          <div className="preview-header" style={{ background: '#0f172a', color: 'white', padding: '1.5rem' }}>
            <h4 style={{ margin: 0, letterSpacing: '2px' }}>GENESIS FORENSIC REPORT</h4>
            <p style={{ margin: 0, fontSize: '0.6rem', opacity: 0.8 }}>HACKBLOCK SECURE PROTOCOL v1.0</p>
          </div>
          
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.6rem', color: '#64748b', margin: 0 }}>BATCH IDENTIFIER</p>
                <p style={{ fontWeight: '800', margin: 0 }}>{formData.batchNumber}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', color: '#64748b', margin: 0 }}>PRODUCT NAME</p>
                <p style={{ fontWeight: '800', margin: 0 }}>{formData.productName}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', color: '#64748b', margin: 0 }}>TIMESTAMP</p>
                <p style={{ fontWeight: '600', margin: 0 }}>{new Date().toLocaleString()}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', color: '#64748b', margin: 0 }}>STATUS</p>
                <p style={{ fontWeight: '800', color: '#10b981', margin: 0 }}>ANCHORED</p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '0.5rem' }}>CRYPTO-PROOF (BLOCK HASH)</p>
              <code style={{ fontSize: '0.7rem', color: 'var(--primary)', wordBreak: 'break-all', fontFamily: 'monospace', fontWeight: '800' }}>
                {finalGenesisHash || 'GENERATING_ANCHOR...'}
              </code>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: '800', marginBottom: '0.5rem' }}>VERIFIED ARTIFACTS (8/8)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  {formData.documents.map(d => (
                    <div key={d.type} style={{ fontSize: '0.55rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ShieldCheck size={10} /> {d.type}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${formData.batchNumber}`} 
                  alt="Batch QR Code"
                  style={{ width: '80px', height: '80px', border: '4px solid white', borderRadius: '0.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                />
                <p style={{ fontSize: '0.5rem', color: '#64748b', marginTop: '0.25rem', fontWeight: '700' }}>SCAN TO VERIFY</p>
              </div>
            </div>
          </div>

          <div className="preview-footer" style={{ borderTop: '1px solid #e2e8f0' }}>
            <div>SECURED BY HACKBLOCK SMART CONTRACTS</div>
            <div>VERIFY ON-CHAIN: {CONTRACT_ADDRESS.slice(0,10)}...</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => { 
              setIsSuccess(false); 
              setStep(1); 
              setFormData(prev => ({...prev, batchNumber: 'BATCH-' + Math.floor(Math.random() * 90000 + 10000), documents: []}));
            }}
            className="btn-secondary"
            style={{ padding: '0.75rem 2rem' }}
          >
            Register New Batch
          </button>
          <button 
            onClick={() => window.print()}
            className="btn-primary"
            style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={18} /> Download Genesis Report
          </button>
        </div>
      </div>
    );
  }

  const renderDocFormFields = () => {
    switch (selectedDoc) {
      case env.DOC_TYPES.COA:
        return (
          <>
            <div className="field">
              <label>Testing Laboratory Name</label>
              <input name="labName" placeholder="e.g. Apex Quality Labs" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Lead Analyst</label>
              <input name="analyst" placeholder="Dr. S. Kumar" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Overall Result</label>
              <select name="result" onChange={handleDocFormChange} required>
                <option value="">Select...</option>
                <option value="Pass">Pass - Standard Compliance</option>
                <option value="Fail">Fail - Out of Spec</option>
              </select>
            </div>
            <div className="field">
              <label>Date of Testing</label>
              <input type="date" name="testDate" onChange={handleDocFormChange} required />
            </div>
          </>
        );
      case env.DOC_TYPES.INVOICE:
        return (
          <>
            <div className="field">
              <label>Invoice Number</label>
              <input name="invoiceNo" placeholder="INV-2024-001" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Buyer Name</label>
              <input name="buyer" placeholder="Global Distributors LLC" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Total Amount (USD)</label>
              <input type="number" name="amount" placeholder="50000" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Tax ID / GSTIN</label>
              <input name="taxId" placeholder="22AAAAA0000A1Z5" onChange={handleDocFormChange} required />
            </div>
          </>
        );
      case env.DOC_TYPES.PACKING_LIST:
        return (
          <>
            <div className="field">
              <label>Container Number</label>
              <input name="containerNo" placeholder="CONT-40FT-88" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Gross Weight (kg)</label>
              <input type="number" name="grossWeight" placeholder="1200" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Net Weight (kg)</label>
              <input type="number" name="netWeight" placeholder="1100" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Number of Pallets</label>
              <input type="number" name="pallets" placeholder="12" onChange={handleDocFormChange} required />
            </div>
          </>
        );
      case env.DOC_TYPES.CHALLAN:
        return (
          <>
            <div className="field">
              <label>Transport Mode</label>
              <select name="transportMode" onChange={handleDocFormChange} required>
                <option value="">Select...</option>
                <option value="Road">Roadway (Reefer Truck)</option>
                <option value="Air">Airway (Cold Chain Air Freight)</option>
                <option value="Sea">Seaway (Reefer Container)</option>
              </select>
            </div>
            <div className="field">
              <label>Vehicle / Flight Number</label>
              <input name="vehicleNo" placeholder="TN-01-AB-1234" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Driver / Captain Name</label>
              <input name="driverName" placeholder="Rajesh Kumar" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Departure Date</label>
              <input type="date" name="departureDate" onChange={handleDocFormChange} required />
            </div>
          </>
        );
      case env.DOC_TYPES.TEMP_LOG:
        return (
          <>
            <div className="field">
              <label>Sensor / Logger ID</label>
              <input name="sensorId" placeholder="SENS-88492" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Initial Temperature (°C)</label>
              <input type="number" step="0.1" name="initTemp" placeholder="4.2" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Last Calibrated Date</label>
              <input type="date" name="calibratedDate" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Logging Interval (Minutes)</label>
              <input type="number" name="logInterval" placeholder="15" onChange={handleDocFormChange} required />
            </div>
          </>
        );
      case env.DOC_TYPES.HANDLING:
        return (
          <>
            <div className="field">
              <label>Required Storage Condition</label>
              <input name="storageCond" placeholder="2°C to 8°C" defaultValue={env.DEFAULT_STORAGE_COND} onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Fragile Cargo?</label>
              <select name="fragile" onChange={handleDocFormChange} required>
                <option value="">Select...</option>
                <option value="Yes">Yes - Handle with Care</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="field">
              <label>Hazmat Class</label>
              <input name="hazmat" placeholder="Class 9 (If Applicable)" onChange={handleDocFormChange} />
            </div>
            <div className="field">
              <label>Max Stacking Limit (Cartons)</label>
              <input type="number" name="stacking" placeholder="5" onChange={handleDocFormChange} required />
            </div>
          </>
        );
      case env.DOC_TYPES.BATCH_LOT:
        return (
          <>
            <div className="field">
              <label>Production Supervisor</label>
              <input name="supervisor" placeholder="A. Sharma" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Line Cleared By (QA)</label>
              <input name="lineClearance" placeholder="M. Singh" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Total Usable Yield</label>
              <input type="number" name="yield" placeholder="9850" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Rejected Units</label>
              <input type="number" name="rejects" placeholder="150" onChange={handleDocFormChange} required />
            </div>
          </>
        );
      case env.DOC_TYPES.POD:
        return (
          <>
            <div className="field">
              <label>Carrier Assigned</label>
              <input name="carrier" placeholder="FastTrack Cold Logistics" onChange={handleDocFormChange} required />
            </div>
            <div className="field">
              <label>Expected Delivery Date</label>
              <input type="date" name="expectedDate" onChange={handleDocFormChange} required />
            </div>
            <div className="field" style={{ gridColumn: 'span 2' }}>
              <label>Destination Contact Person</label>
              <input name="contact" placeholder="Warehouse Manager, Hub 1" onChange={handleDocFormChange} required />
            </div>
          </>
        );
      default:
        return <p>Select a document type to proceed.</p>;
    }
  };

  return (
    <div className="card animate-fade">
      <div className="stepper" style={{ marginBottom: '2.5rem' }}>
        {[
          { n: 1, l: 'Product' },
          { n: 2, l: 'Factory' },
          { n: 3, l: 'Quality' },
          { n: 4, l: 'Artifacts' }
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div 
              className={`step ${step >= s.n ? 'active' : ''}`} 
              onClick={() => { setSelectedDoc(null); setStep(s.n); }}
              style={{ cursor: 'pointer' }}
            >
              <div className="step-circle">{step > s.n ? <CheckCircle2 size={16} /> : s.n}</div>
              <span>{s.l}</span>
            </div>
            {i < 3 && <div className={`step-line ${step > s.n ? 'active' : ''}`}></div>}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }}>
        {step === 1 && (
          <div className="grid-form animate-slide-in">
            <h3 style={{ gridColumn: 'span 2', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={20} color="var(--primary)" /> Product Specifications
            </h3>
            <div className="field">
              <label>Product Name</label>
              <input name="productName" placeholder="e.g. Epinephrine Injection" value={formData.productName} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Generic Name (Active Ingredient)</label>
              <input name="genericName" placeholder="e.g. Adrenaline Tartrate" value={formData.genericName} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Dosage Form</label>
              <select name="dosageForm" value={formData.dosageForm} onChange={handleChange}>
                <option>Tablet</option>
                <option>Injection / Vaccine</option>
                <option>Liquid Oral</option>
                <option>Ophthalmic Solution</option>
              </select>
            </div>
            <div className="field">
              <label>Strength</label>
              <input name="strength" placeholder="e.g. 1mg / ml" value={formData.strength} onChange={handleChange} required />
            </div>
            <div className="field" style={{ gridColumn: 'span 2' }}>
              <label>Batch / Lot Number (System Generated)</label>
              <div style={{ position: 'relative' }}>
                <input name="batchNumber" value={formData.batchNumber} readOnly style={{ background: '#f8fafc', fontWeight: '600', paddingLeft: '2.5rem' }} />
                <Hash size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid-form animate-slide-in">
            <h3 style={{ gridColumn: 'span 2', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="var(--primary)" /> Manufacturing Intelligence
            </h3>
            <div className="field">
              <label>Manufacturing Date</label>
              <input type="date" name="manufacturingDate" value={formData.manufacturingDate} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Expiry Date</label>
              <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Production Line ID</label>
              <input name="productionLineId" value={formData.productionLineId} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Quantity Produced (Units)</label>
              <input type="number" name="quantity" placeholder="e.g. 10000" value={formData.quantity} onChange={handleChange} required />
            </div>
            <div className="field" style={{ gridColumn: 'span 2' }}>
              <label>Manufacturer License No.</label>
              <input name="manufacturingLicense" placeholder="ML/PHARMA/2024/001" value={formData.manufacturingLicense} onChange={handleChange} required />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid-form animate-slide-in">
            <h3 style={{ gridColumn: 'span 2', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--primary)" /> Quality & Compliance
            </h3>
            <div className="field">
              <label>QA Approval ID</label>
              <input name="qaId" placeholder="QA-REL-9921" value={formData.qaId} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Regulatory Approval No.</label>
              <input name="regulatoryApprovalNo" placeholder="FDA-IND-2024-X" value={formData.regulatoryApprovalNo} onChange={handleChange} required />
            </div>
            <div className="field" style={{ gridColumn: 'span 2' }}>
              <label>Stability Data Reference</label>
              <input name="stabilityDataRef" placeholder="STB-2024-PHASE-3-RESULTS" value={formData.stabilityDataRef} onChange={handleChange} required />
            </div>
            <div className="field" style={{ gridColumn: 'span 2' }}>
              <label>Storage Condition</label>
              <input name="storageCondition" value={formData.storageCondition} onChange={handleChange} required />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-slide-in">
            {selectedDoc ? (
              <div className="workshop-container">
                <div style={{ background: 'white', border: '1px solid var(--border)', padding: '2rem', borderRadius: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button type="button" onClick={() => setSelectedDoc(null)} style={{ padding: '0.5rem', background: 'white', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowLeft size={16} />
                    </button>
                    <h3 style={{ margin: 0 }}>
                      Building: {selectedDoc}
                    </h3>
                  </div>
                  
                  <div className="grid-form">
                    {renderDocFormFields()}
                    
                    <div style={{ gridColumn: 'span 2', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                      <button 
                        type="button" 
                        onClick={saveDocument} 
                        disabled={isHashing} 
                        className={!isHashing ? "pulse-btn" : ""}
                        style={{ 
                          background: isHashing ? 'var(--text-muted)' : 'var(--primary)', 
                          color: 'white', 
                          padding: '1rem 2rem', 
                          borderRadius: '0.5rem', 
                          fontWeight: '700', 
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.75rem'
                        }}
                      >
                        {isHashing ? <Activity className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                        {isHashing ? 'Hashing & Anchoring...' : 'Sign & Anchor to Ledger'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="document-preview-container">
                  <div style={{ marginBottom: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Eye size={14} /> LIVE LEDGER PREVIEW
                  </div>
                  <div className="document-preview-paper">
                    <div className="preview-watermark">HACKBLOCK</div>
                    <div className="preview-header">
                      <h4 style={{ margin: 0, letterSpacing: '0.1rem' }}>COLDCHAIN LEDGER</h4>
                      <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--primary)' }}>{selectedDoc.toUpperCase()}</p>
                    </div>
                    
                    <div className="preview-content">
                      <div className="preview-field">
                        <span className="preview-label">Batch No:</span>
                        <span>{formData.batchNumber}</span>
                      </div>
                      <div className="preview-field">
                        <span className="preview-label">Product:</span>
                        <span>{formData.productName}</span>
                      </div>
                      <div className="preview-field">
                        <span className="preview-label">Manufacturer:</span>
                        <span>{formData.manufacturerName}</span>
                      </div>
                      <div style={{ margin: '0.5rem 0', borderBottom: '1px solid #334155' }}></div>
                      
                      {Object.entries(currentDocForm).map(([key, value]) => (
                        <div key={key} className="preview-field">
                          <span className="preview-label">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span style={{ fontWeight: '500' }}>{value || '---'}</span>
                        </div>
                      ))}
                    </div>

                    <div className="preview-footer">
                      <div style={{ marginBottom: '0.2rem' }}>GENESIS ANCHOR: {CryptoJS.SHA256(formData.batchNumber).toString().substring(0, 16).toUpperCase()}</div>
                      <div>PRODUCED ON HACKBLOCK SECURE NETWORK • {new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                  <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                    * This is a visual representation of the PDF that will be cryptographically hashed.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '2.5rem', borderRadius: '1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Artifact Generation Workshop</h3>
                  <p>All required pharmaceutical documents must be generated in-app to ensure cryptographic integrity.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {requiredDocs.map(docType => {
                    const isCompleted = formData.documents.find(d => d.type === docType);
                    return (
                      <div 
                        key={docType}
                        onClick={() => !isCompleted && setSelectedDoc(docType)}
                        style={{ 
                          background: isCompleted ? '#ecfdf5' : 'white', 
                          padding: '1.25rem', 
                          borderRadius: '1rem', 
                          border: `1px solid ${isCompleted ? '#a7f3d0' : 'var(--border)'}`, 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '1rem',
                          cursor: isCompleted ? 'default' : 'pointer',
                          boxShadow: isCompleted ? 'none' : 'var(--shadow-sm)',
                          transition: 'all 0.2s',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {isCompleted && (
                          <div style={{ position: 'absolute', top: 0, right: 0, background: '#10b981', color: 'white', padding: '0.25rem 0.75rem', fontSize: '0.65rem', fontWeight: '700', borderBottomLeftRadius: '0.75rem' }}>
                            ANCHORED
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ background: isCompleted ? '#d1fae5' : '#f1f5f9', padding: '0.5rem', borderRadius: '0.5rem' }}>
                            <FileText size={20} color={isCompleted ? '#059669' : 'var(--primary)'} />
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: isCompleted ? '#065f46' : 'var(--text-main)' }}>
                            {docType}
                          </span>
                        </div>

                        {isCompleted ? (
                          <div style={{ fontSize: '0.65rem', color: '#059669', background: 'white', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1fae5', fontFamily: 'monospace' }}>
                            HASH: {isCompleted.hash.substring(0, 24)}...
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600' }}>
                            <Plus size={16} /> Create Document
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginTop: '2rem', background: '#eff6ff', padding: '1.5rem', borderRadius: '1rem', display: 'flex', gap: '1.25rem', border: '1px solid #bfdbfe' }}>
              <div style={{ background: '#dbeafe', padding: '0.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'fit-content' }}>
                <ShieldCheck color="#2563eb" size={24} />
              </div>
              <div>
                <strong style={{ display: 'block', color: '#1e40af', marginBottom: '0.4rem', fontSize: '1rem' }}>Zero-Knowledge Document Proofs</strong>
                <p style={{ color: '#1e40af', fontSize: '0.85rem', margin: 0, lineHeight: 1.6, opacity: 0.9 }}>
                  Documents generated here are converted to PDF and hashed locally using SHA-256 before being pinned to IPFS. 
                  The blockchain only stores the immutable hash, ensuring document authenticity without exposing sensitive data publicly.
                </p>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          {step > 1 && (
            <button type="button" onClick={() => { setSelectedDoc(null); setStep(step - 1); }} style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>
              Back
            </button>
          )}
          {step < 4 ? (
            <button 
              type="submit" 
              style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem 2.5rem', borderRadius: '0.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={isLoading || formData.documents.length < requiredDocs.length}
              style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem 2.5rem', borderRadius: '0.5rem', fontWeight: '600', opacity: (isLoading || formData.documents.length < requiredDocs.length) ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isLoading ? <Activity className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              {isLoading ? 'Anchoring Block...' : 'Finalize & Publish Genesis'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProducerView;
