import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./invoiceUtils";

// Define types for invoice, customer and items
interface Invoice {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  vatAmount: number;
  total: number;
}

interface Customer {
  name: string;
  email: string;
  address?: string;
  phoneNumber?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

/**
 * Generate a PDF for an invoice
 */
export const generateInvoicePDF = (
  invoice: Invoice,
  customer: Customer,
  items: InvoiceItem[]
): Blob => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Add document title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("FACTUUR", 20, 20);

  // Add company info (right aligned)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("FactuurPro", 190, 20, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Voorbeeldstraat 123", 190, 25, { align: "right" });
  doc.text("1234 AB Amsterdam", 190, 30, { align: "right" });
  doc.text("info@factuurpro.nl", 190, 35, { align: "right" });
  doc.text("BTW: NL123456789B01", 190, 40, { align: "right" });
  doc.text("KVK: 12345678", 190, 45, { align: "right" });

  // Add invoice details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Factuurnummer: ${invoice.invoiceNumber}`, 20, 35);
  doc.text(`Datum: ${new Date(invoice.issueDate).toLocaleDateString('nl-NL')}`, 20, 40);
  doc.text(`Vervaldatum: ${new Date(invoice.dueDate).toLocaleDateString('nl-NL')}`, 20, 45);

  // Add customer info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Factuuradres:", 20, 60);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(customer.name, 20, 65);
  if (customer.address) doc.text(customer.address, 20, 70);
  doc.text(customer.email, 20, 75);
  if (customer.phoneNumber) doc.text(customer.phoneNumber, 20, 80);

  // Add invoice items table
  autoTable(doc, {
    startY: 90,
    head: [['Omschrijving', 'Aantal', 'Prijs', 'BTW %', 'Totaal']],
    body: items.map(item => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      `${item.vatRate}%`,
      formatCurrency(item.total)
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 10,
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Add totals
  doc.setFontSize(10);
  doc.text("Subtotaal:", 140, finalY + 10);
  doc.text(formatCurrency(invoice.subtotal), 190, finalY + 10, { align: "right" });
  
  doc.text("BTW:", 140, finalY + 15);
  doc.text(formatCurrency(invoice.vatAmount), 190, finalY + 15, { align: "right" });
  
  doc.setFont("helvetica", "bold");
  doc.text("Totaal:", 140, finalY + 25);
  doc.text(formatCurrency(invoice.total), 190, finalY + 25, { align: "right" });

  // Add payment instructions
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Betaling graag binnen 14 dagen na factuurdatum.", 20, finalY + 40);
  doc.text("Bankgegevens: NL02 ABNA 0123 4567 89 t.n.v. FactuurPro", 20, finalY + 45);

  // Get the PDF as a blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
};

/**
 * Generate a PDF for a report or overview
 */
export const generateReportPDF = (
  title: string,
  subtitle: string,
  headers: string[],
  rows: any[][],
  summary?: { label: string; value: string }[]
): Blob => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Add document title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 20, 20);

  // Add subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(subtitle, 20, 30);

  // Add company info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("FactuurPro", 190, 20, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString('nl-NL'), 190, 25, { align: "right" });

  // Add data table
  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 10,
    },
  });

  // If there's summary data, add it
  if (summary && summary.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(10);
    
    let currentY = finalY + 10;
    summary.forEach(item => {
      doc.setFont("helvetica", item === summary[summary.length - 1] ? "bold" : "normal");
      doc.text(item.label, 140, currentY);
      doc.text(item.value, 190, currentY, { align: "right" });
      currentY += 5;
    });
  }

  // Get the PDF as a blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
};

/**
 * Save a PDF to the user's device
 */
export const savePDF = (pdfBlob: Blob, filename: string): void => {
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
