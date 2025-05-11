import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Export data to Excel
 */
export const exportToExcel = async (
  filename: string,
  sheetName: string,
  headers: string[],
  data: any[][]
): Promise<void> => {
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Add headers
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '3B82F6' }, // primary blue color
  };
  headerRow.color = { argb: 'FFFFFF' }; // white text

  // Add data rows
  data.forEach(row => {
    worksheet.addRow(row);
  });

  // Format cells
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const cellLength = cell.value ? cell.value.toString().length : 10;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, 10), 50);
  });

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};

/**
 * Export invoices to Excel
 */
export const exportInvoicesToExcel = async (invoices: any[], items: any[], customers: any[]): Promise<void> => {
  // Prepare invoice data for Excel
  const invoiceHeaders = ['Factuurnummer', 'Klant', 'Datum', 'Vervaldatum', 'Subtotaal', 'BTW', 'Totaal', 'Status'];
  const invoiceData = invoices.map(invoice => {
    const customer = customers.find(c => c.id === invoice.customerId);
    return [
      invoice.invoiceNumber,
      customer ? customer.name : 'Onbekend',
      new Date(invoice.issueDate).toLocaleDateString('nl-NL'),
      new Date(invoice.dueDate).toLocaleDateString('nl-NL'),
      invoice.subtotal.toFixed(2),
      invoice.vatAmount.toFixed(2),
      invoice.total.toFixed(2),
      invoice.status
    ];
  });

  // Prepare item data for Excel
  const itemHeaders = ['Factuurnummer', 'Klant', 'Omschrijving', 'Aantal', 'Prijs', 'BTW %', 'Subtotaal', 'BTW', 'Totaal'];
  const itemData = items.map(item => {
    const invoice = invoices.find(i => i.id === item.invoiceId);
    const customer = invoice 
      ? customers.find(c => c.id === invoice.customerId) 
      : null;
    
    return [
      invoice ? invoice.invoiceNumber : 'Niet gefactureerd',
      customer ? customer.name : 'Onbekend',
      item.description,
      item.quantity.toString(),
      item.unitPrice.toFixed(2),
      item.vatRate.toString() + '%',
      item.subtotal.toFixed(2),
      item.vatAmount.toFixed(2),
      item.total.toFixed(2)
    ];
  });

  // Create a workbook with multiple sheets
  const workbook = new ExcelJS.Workbook();
  
  // Invoices sheet
  const invoicesSheet = workbook.addWorksheet('Facturen');
  invoicesSheet.addRow(invoiceHeaders).font = { bold: true };
  invoiceData.forEach(row => invoicesSheet.addRow(row));
  
  // Items sheet
  const itemsSheet = workbook.addWorksheet('Factuuritems');
  itemsSheet.addRow(itemHeaders).font = { bold: true };
  itemData.forEach(row => itemsSheet.addRow(row));
  
  // Customers sheet
  const customerHeaders = ['Klantnaam', 'Email', 'Adres', 'Telefoon'];
  const customerData = customers.map(customer => [
    customer.name,
    customer.email,
    customer.address || '',
    customer.phoneNumber || ''
  ]);
  
  const customersSheet = workbook.addWorksheet('Klanten');
  customersSheet.addRow(customerHeaders).font = { bold: true };
  customerData.forEach(row => customersSheet.addRow(row));
  
  // Format all sheets
  [invoicesSheet, itemsSheet, customersSheet].forEach(sheet => {
    // Format header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '3B82F6' },
    };
    headerRow.color = { argb: 'FFFFFF' };
    
    // Auto-fit columns
    sheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const cellLength = cell.value ? cell.value.toString().length : 10;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });
  });
  
  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Current date for filename
  const date = new Date().toISOString().split('T')[0];
  saveAs(blob, `FactuurPro_Export_${date}.xlsx`);
};
