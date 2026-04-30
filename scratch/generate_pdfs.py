import datetime
from fpdf import FPDF
import os

# Forensic Document Generator for ColdChain Blockchain
# This script creates actual PDF artifacts that stakeholders would upload to the system.
# Each file will have a unique SHA-256 hash when uploaded.

def create_coa():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, text="CERTIFICATE OF ANALYSIS (CoA)", ln=1, align='C')
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, text=f"Batch ID: BATCH-49281", ln=1)
    pdf.cell(200, 10, text=f"Product: Premium Insulin (Vial)", ln=1)
    pdf.cell(200, 10, text=f"Manufacturing Date: {datetime.date.today()}", ln=1)
    pdf.ln(10)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(200, 10, text="Quality Control Parameters:", ln=1)
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, text="- Purity: 99.98%", ln=1)
    pdf.cell(200, 10, text="- PH Level: 7.4 (Target)", ln=1)
    pdf.cell(200, 10, text="- Microbiological Test: NEGATIVE", ln=1)
    pdf.ln(10)
    pdf.set_font("Arial", 'I', 10)
    pdf.cell(200, 10, text="PASSED - All biochemical markers within safety range.", ln=1)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(200, 10, text="Signed: Chief Quality Officer", ln=1)
    pdf.output("certificate_of_analysis.pdf")

def create_temp_log():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, text="COLD CHAIN TEMPERATURE LOG", ln=1, align='C')
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, text=f"Reporting Period: {datetime.date.today()}", ln=1, align='L')
    pdf.ln(10)
    
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(60, 10, "Timestamp", 1)
    pdf.cell(60, 10, "Temperature", 1)
    pdf.cell(60, 10, "Status", 1)
    pdf.ln()
    
    pdf.set_font("Arial", size=12)
    data = [
        ("08:00 AM", "4.2 C", "OK"),
        ("10:00 AM", "4.5 C", "OK"),
        ("12:00 PM", "5.1 C", "OK"),
        ("02:00 PM", "4.8 C", "OK"),
        ("04:00 PM", "4.3 C", "OK"),
    ]
    for ts, temp, status in data:
        pdf.cell(60, 10, ts, 1)
        pdf.cell(60, 10, temp, 1)
        pdf.cell(60, 10, status, 1)
        pdf.ln()
        
    pdf.ln(10)
    pdf.cell(200, 10, text="Device ID: SENSOR-TX-700", ln=1)
    pdf.output("temperature_log.pdf")

def create_inspection_report():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, text="WAREHOUSE INSPECTION REPORT", ln=1, align='C')
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, text=f"Facility: Global Storage Hub (Node-02)", ln=1)
    pdf.ln(10)
    
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(200, 10, text="Inspection Checklist:", ln=1)
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, text="[X] Packaging Integrity Verified", ln=1)
    pdf.cell(200, 10, text="[X] Seal Not Tampered", ln=1)
    pdf.cell(200, 10, text="[X] Correct Quantity Received", ln=1)
    pdf.ln(10)
    
    pdf.cell(200, 10, text="Comments: Shipment received in excellent condition. No visible damage.", ln=1)
    pdf.output("inspection_report.pdf")

def create_invoice():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, text="COMMERCIAL INVOICE", ln=1, align='C')
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, text=f"Invoice #: INV-2024-001", ln=1)
    pdf.cell(200, 10, text=f"Date: {datetime.date.today()}", ln=1)
    pdf.ln(10)
    pdf.cell(200, 10, text="Seller: BioPharma Global Inc.", ln=1)
    pdf.cell(200, 10, text="Buyer: Global Health Distributors", ln=1)
    pdf.ln(10)
    pdf.cell(200, 10, text="Description: Premium Vaccine Batch A-42", ln=1)
    pdf.cell(200, 10, text="Total Amount: $50,000.00", ln=1)
    pdf.output("invoice.pdf")

def create_packing_list():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, text="PACKING LIST", ln=1, align='C')
    pdf.set_font("Arial", size=12)
    pdf.ln(10)
    pdf.cell(200, 10, text="Package ID: PK-9921", ln=1)
    pdf.cell(200, 10, text="Total Pallets: 12", ln=1)
    pdf.cell(200, 10, text="Gross Weight: 1200kg", ln=1)
    pdf.output("packing_list.pdf")

def create_challan():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, text="DELIVERY CHALLAN", ln=1, align='C')
    pdf.set_font("Arial", size=12)
    pdf.ln(10)
    pdf.cell(200, 10, text="Challan #: CH-2024-88", ln=1)
    pdf.cell(200, 10, text="Vehicle #: TN-01-AB-1234", ln=1)
    pdf.cell(200, 10, text="Driver: Rajesh Kumar", ln=1)
    pdf.output("delivery_challan.pdf")

def create_handling():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, text="HANDLING INSTRUCTIONS", ln=1, align='C')
    pdf.set_font("Arial", size=12)
    pdf.ln(10)
    pdf.cell(200, 10, text="Storage: 2-8 Degrees Celsius", ln=1)
    pdf.cell(200, 10, text="FRAGILE - DO NOT STACK", ln=1)
    pdf.output("handling_instructions.pdf")

def create_batch_record():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, text="BATCH PRODUCTION RECORD", ln=1, align='C')
    pdf.set_font("Arial", size=12)
    pdf.ln(10)
    pdf.cell(200, 10, text="Batch #: BATCH-49281", ln=1)
    pdf.cell(200, 10, text="Yield: 98.5%", ln=1)
    pdf.cell(200, 10, text="QA Status: RELEASED", ln=1)
    pdf.output("batch_record.pdf")

def create_pod():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, text="PROOF OF DELIVERY (POD)", ln=1, align='C')
    pdf.set_font("Arial", size=12)
    pdf.ln(10)
    pdf.cell(200, 10, text="Recipient: Central Hospital", ln=1)
    pdf.cell(200, 10, text="Signature: RECEIVED IN GOOD CONDITION", ln=1)
    pdf.output("proof_of_delivery.pdf")

if __name__ == "__main__":
    create_coa()
    create_temp_log()
    create_inspection_report()
    create_invoice()
    create_packing_list()
    create_challan()
    create_handling()
    create_batch_record()
    create_pod()
    print("All 9 Forensic PDFs generated successfully.")
