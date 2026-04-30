
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";

// Utility to create a PDF and save it
async function generatePDF(filename, title, content, tableData = null) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(0, 51, 102);
  doc.text("HACKBLOCK COLD CHAIN", 105, 20, { align: "center" });
  
  doc.setFontSize(16);
  doc.setTextColor(100);
  doc.text(title, 105, 30, { align: "center" });
  
  // Separator
  doc.setDrawColor(0, 51, 102);
  doc.line(20, 35, 190, 35);
  
  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Generated Date: ${new Date().toLocaleString()}`, 20, 45);
  doc.text(`Issuer: Authenticated Cold Chain Protocol`, 20, 50);
  doc.text(`Blockchain ID: 0x${Math.random().toString(16).slice(2, 10)}...`, 20, 55);

  // Content
  doc.setFontSize(12);
  let yPos = 70;
  content.forEach(line => {
    doc.text(line, 20, yPos);
    yPos += 7;
  });

  // Table
  if (tableData) {
    autoTable(doc, {
      startY: yPos + 10,
      head: [tableData.headers],
      body: tableData.rows,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] },
      styles: { fontSize: 10 }
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`This document is cryptographically anchored to the HackBlock Ledger.`, 105, 285, { align: "center" });
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
  }

  const pdfData = doc.output("arraybuffer");
  fs.writeFileSync(filename, Buffer.from(pdfData));
  console.log(`Generated: ${filename}`);
}

async function main() {
  console.log("Starting PDF generation...");

  // 1. Temperature Log
  const tempRows = [];
  let currentTemp = -20.5;
  for (let i = 0; i < 24; i++) {
    currentTemp += (Math.random() - 0.5) * 0.4; // Small fluctuations
    tempRows.push([`${i}:00`, `${currentTemp.toFixed(2)}°C`, "Optimal", "Sensor-A1"]);
  }

  await generatePDF(
    "temp_log_shipment_001.pdf",
    "Continuous Temperature Telemetry Log",
    [
      "Shipment ID: SHP-2025-0429-01",
      "Carrier: Global Reefer Logistics Inc.",
      "Cargo: Pfizer-BioNTech Vaccine Batch-99",
      "Standard Range: -18.0°C to -22.0°C",
      "Compliance Status: VERIFIED"
    ],
    {
      headers: ["Timestamp", "Temp Value", "Status", "Source"],
      rows: tempRows
    }
  );

  // 2. Certificate of Origin
  await generatePDF(
    "cert_origin_shipment_001.pdf",
    "Certificate of Authenticity & Origin",
    [
      "Document Ref: CO-449102",
      "Producer: BioPharma Labs Switzerland",
      "Facility ID: BPL-ZURICH-04",
      "Production Date: April 15, 2025",
      "The goods described below are of Swiss origin and conform to international",
      "standards for biologic purity and cold-chain stability."
    ],
    {
      headers: ["Item Description", "SKU", "Quantity", "Batch #"],
      rows: [
        ["mRNA Vaccine Vials", "VAC-99-A", "5,000 Units", "BN-7721"],
        ["Stabilization Buffer", "BUF-10", "10 Liters", "B-441"]
      ]
    }
  );

  // 3. Phytosanitary Certificate
  await generatePDF(
    "phytosanitary_cert_001.pdf",
    "International Phytosanitary Certificate",
    [
      "Certificate #: PH-XYZ-782",
      "Plant Protection Organization of: Switzerland",
      "To: Plant Protection Organization of: USA",
      "",
      "This is to certify that the plants, plant products or other regulated articles",
      "described herein have been inspected and/or tested according to appropriate",
      "official procedures and are considered to be free from the quarantine pests."
    ],
    {
      headers: ["Product Name", "Botanical Name", "Weight", "Declaration"],
      rows: [
        ["Biologic Culture", "N/A (Biologic)", "2.5 KG", "Compliant"],
        ["Organic Substrate", "Zea mays derivative", "1.0 KG", "Sterile"]
      ]
    }
  );

  // 4. Chain of Custody
  await generatePDF(
    "custody_record_001.pdf",
    "Multi-Party Chain of Custody Record",
    [
      "Tracking ID: TRK-9922100",
      "Master Shipment Key: 0x9f1a...c4d3",
      "This document records every handoff event and verifies the integrity",
      "of the physical custody seals at each transition point."
    ],
    {
      headers: ["Action", "Party", "Timestamp", "Seal Status"],
      rows: [
        ["Released", "BioPharma Labs", "2025-04-15 09:00", "Intact"],
        ["Received", "Global Reefer", "2025-04-15 10:30", "Verified"],
        ["Transfer", "Zurich Air Cargo", "2025-04-16 02:00", "Intact"],
        ["Received", "ColdStorage Port", "2025-04-17 14:00", "Verified"]
      ]
    }
  );

  console.log("All PDFs generated successfully.");
}

main().catch(err => {
  console.error("Error generating PDFs:", err);
});
