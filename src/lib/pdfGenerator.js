import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateCOA = (batchData, chainHistory) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(0, 51, 102);
  doc.text('ColdChain Certificate of Analysis', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
  
  // Line
  doc.setDrawColor(0, 51, 102);
  doc.line(20, 35, 190, 35);
  
  // Batch Info
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Batch Information', 20, 45);
  
  doc.setFontSize(11);
  const batchInfo = [
    ['Product Name', batchData.productName || 'N/A'],
    ['Batch ID', batchData.shipmentId || 'N/A'],
    ['Manufacturer', batchData.manufacturerName || 'N/A'],
    ['Current Status', batchData.status || 'N/A'],
    ['Last Recorded Temp', `${batchData.temperature}°C` || 'N/A']
  ];
  
  doc.autoTable({
    startY: 50,
    head: [['Field', 'Value']],
    body: batchInfo,
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] }
  });
  
  // Blockchain Audit Trail
  const finalY = doc.lastAutoTable.finalY || 100;
  doc.setFontSize(14);
  doc.text('Blockchain Audit Trail', 20, finalY + 15);
  
  const historyData = chainHistory.map(block => [
    new Date(block.timestamp).toLocaleString(),
    block.actor,
    block.data.status || 'Data Update',
    `${block.data.temperature || '--'}°C`,
    block.hash.substring(0, 16) + '...'
  ]);
  
  doc.autoTable({
    startY: finalY + 20,
    head: [['Timestamp', 'Actor', 'Event', 'Temp', 'Block Hash']],
    body: historyData,
    theme: 'grid',
    headStyles: { fillColor: [51, 153, 102] },
    styles: { fontSize: 8 }
  });
  
  // QR Code Placeholder / Verification URL
  const bottomY = doc.lastAutoTable.finalY || 200;
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('This document is cryptographically verified on the ColdChain Immutable Ledger.', 105, bottomY + 20, { align: 'center' });
  doc.text(`Verification ID: ${batchData.shipmentId}`, 105, bottomY + 25, { align: 'center' });
  
  // Save
  doc.save(`COA_${batchData.shipmentId}.pdf`);
};
