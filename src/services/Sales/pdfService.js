import axios from "axios"
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiService } from '../apiInterceptor';

const API_URL = "/api"

// Company information
const COMPANY_INFO = {
  name: "SecureOps Solutions",
  address: "1234 Security Boulevard", 
  city: "Tech City, CA 90210",
  phone: "(555) 123-4567",
  email: "info@secureops.com",
  website: "www.secureops.com"
};

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

const formatDate = (date) => {
  if (!date) return '';
  const dateObj = new Date(date);
  return isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('en-US');
};

// Generate Quote PDF
export const generateQuotePdf = async (id) => {
  try {
    // Fetch the actual quote data from your backend
    const quoteData = await apiService.get(`/sales/quotes/${id}`);
    console.log('Quote data for PDF:', quoteData);
    
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(COMPANY_INFO.name, 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.text(COMPANY_INFO.address, 20, yPosition);
    yPosition += 5;
    doc.text(COMPANY_INFO.city, 20, yPosition);
    yPosition += 5;
    doc.text(`Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, 20, yPosition);

    // Quote title
    yPosition += 20;
    doc.setFontSize(24);
    doc.setTextColor(0, 100, 200);
    doc.text('QUOTE', 20, yPosition);

    // Quote details
    yPosition += 15;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Quote #: ${quoteData.quoteNumber || 'N/A'}`, 20, yPosition);
    doc.text(`Date: ${formatDate(quoteData.createdDate)}`, 120, yPosition);
    
    yPosition += 7;
    doc.text(`Valid Until: ${formatDate(quoteData.expiryDate)}`, 20, yPosition);
    doc.text(`Status: ${(quoteData.status || 'PENDING').toUpperCase()}`, 120, yPosition);

    // Client information
    yPosition += 20;
    doc.setFontSize(14);
    doc.text('Bill To:', 20, yPosition);
    yPosition += 8;
    doc.setFontSize(12);
    doc.text(quoteData.clientName || 'N/A', 20, yPosition);

    // Items table
    yPosition += 20;
    const items = quoteData.items || [];
    const tableData = items.map(item => [
      item.productName || 'N/A',
      item.description || '',
      (item.quantity || 0).toString(),
      formatCurrency(item.unitPrice || 0),
      formatCurrency(item.subtotal || (item.unitPrice * item.quantity))
    ]);

    if (tableData.length === 0) {
      tableData.push(['No items', '', '0', '$0.00', '$0.00']);
    }

    autoTable(doc, {
      startY: yPosition,
      head: [['Product', 'Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 100, 200] },
      margin: { left: 20, right: 20 }
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    const totalsX = 140;
    
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || (item.unitPrice * item.quantity)), 0);
    const discount = quoteData.discount || 0;
    const tax = quoteData.tax || 0;
    const total = quoteData.totalAmount || (subtotal - discount + tax);
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Subtotal: ${formatCurrency(subtotal)}`, totalsX, finalY);
    
    let currentY = finalY;
    if (discount > 0) {
      currentY += 7;
      doc.text(`Discount: ${formatCurrency(discount)}`, totalsX, currentY);
    }
    if (tax > 0) {
      currentY += 7;
      doc.text(`Tax: ${formatCurrency(tax)}`, totalsX, currentY);
    }
    
    currentY += 7;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: ${formatCurrency(total)}`, totalsX, currentY);

    // Notes
    if (quoteData.notes) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('Notes:', 20, currentY + 20);
      const splitNotes = doc.splitTextToSize(quoteData.notes, 170);
      doc.text(splitNotes, 20, currentY + 27);
    }

    return doc.output('blob');
  } catch (error) {
    console.error('Error generating quote PDF:', error);
    throw error;
  }
};

// Generate Order PDF
export const generateOrderPdf = async (id) => {
  try {
    // Fetch the actual order data from your backend
    const orderData = await apiService.get(`/sales/orders/${id}`);
    console.log('Order data for PDF:', orderData);
    
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(COMPANY_INFO.name, 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.text(COMPANY_INFO.address, 20, yPosition);
    yPosition += 5;
    doc.text(COMPANY_INFO.city, 20, yPosition);
    yPosition += 5;
    doc.text(`Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, 20, yPosition);

    // Order title
    yPosition += 20;
    doc.setFontSize(24);
    doc.setTextColor(0, 150, 0);
    doc.text('SALES ORDER', 20, yPosition);

    // Order details
    yPosition += 15;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Order #: ${orderData.orderNumber || 'N/A'}`, 20, yPosition);
    doc.text(`Date: ${formatDate(orderData.createdDate)}`, 120, yPosition);
    
    yPosition += 7;
    doc.text(`Status: ${(orderData.status || 'PENDING').toUpperCase()}`, 20, yPosition);
    if (orderData.quoteNumber) {
      doc.text(`Quote #: ${orderData.quoteNumber}`, 120, yPosition);
    }

    // Client information
    yPosition += 20;
    doc.setFontSize(14);
    doc.text('Customer:', 20, yPosition);
    yPosition += 8;
    doc.setFontSize(12);
    doc.text(orderData.clientName || 'N/A', 20, yPosition);

    // Items table
    yPosition += 20;
    const items = orderData.items || [];
    const tableData = items.map(item => [
      item.productName || 'N/A',
      item.description || '',
      (item.quantity || 0).toString(),
      formatCurrency(item.unitPrice || 0),
      formatCurrency(item.subtotal || (item.unitPrice * item.quantity))
    ]);

    if (tableData.length === 0) {
      tableData.push(['No items', '', '0', '$0.00', '$0.00']);
    }

    autoTable(doc, {
      startY: yPosition,
      head: [['Product', 'Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 150, 0] },
      margin: { left: 20, right: 20 }
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    const totalsX = 140;
    
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || (item.unitPrice * item.quantity)), 0);
    const total = orderData.totalAmount || subtotal;
    
    doc.setFontSize(12);
    doc.text(`Subtotal: ${formatCurrency(subtotal)}`, totalsX, finalY);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: ${formatCurrency(total)}`, totalsX, finalY + 7);

    // Notes
    if (orderData.notes) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('Notes:', 20, finalY + 25);
      const splitNotes = doc.splitTextToSize(orderData.notes, 170);
      doc.text(splitNotes, 20, finalY + 32);
    }

    return doc.output('blob');
  } catch (error) {
    console.error('Error generating order PDF:', error);
    throw error;
  }
};

// Generate Invoice PDF
export const generateInvoicePdf = async (id) => {
  try {
    // Fetch the actual invoice data from your backend
    const invoiceData = await apiService.get(`/sales/invoices/${id}`);
    console.log('Invoice data for PDF:', invoiceData);
    
    // If invoice doesn't have items but has an orderId, fetch the order data
    let items = invoiceData.orderItems || invoiceData.items || [];
    if (items.length === 0 && invoiceData.orderId) {
      try {
        console.log('Fetching order data for invoice items...');
        const orderData = await apiService.get(`/sales/orders/${invoiceData.orderId}`);
        items = orderData.items || [];
        console.log('Order items for invoice:', items);
      } catch (orderError) {
        console.warn('Could not fetch order data for invoice:', orderError);
        // Continue with empty items if order fetch fails
      }
    }
    
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(COMPANY_INFO.name, 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.text(COMPANY_INFO.address, 20, yPosition);
    yPosition += 5;
    doc.text(COMPANY_INFO.city, 20, yPosition);
    yPosition += 5;
    doc.text(`Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, 20, yPosition);

    // Invoice title
    yPosition += 20;
    doc.setFontSize(24);
    doc.setTextColor(200, 0, 0);
    doc.text('INVOICE', 20, yPosition);

    // Invoice details
    yPosition += 15;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Invoice #: ${invoiceData.invoiceNumber || 'N/A'}`, 20, yPosition);
    doc.text(`Date: ${formatDate(invoiceData.createdDate)}`, 120, yPosition);
    
    yPosition += 7;
    doc.text(`Due Date: ${formatDate(invoiceData.paymentDueDate)}`, 20, yPosition);
    doc.text(`Status: ${(invoiceData.status || 'PENDING').toUpperCase()}`, 120, yPosition);

    if (invoiceData.orderNumber) {
      yPosition += 7;
      doc.text(`Order #: ${invoiceData.orderNumber}`, 20, yPosition);
    }

    // Client information
    yPosition += 20;
    doc.setFontSize(14);
    doc.text('Bill To:', 20, yPosition);
    yPosition += 8;
    doc.setFontSize(12);
    doc.text(invoiceData.clientName || 'N/A', 20, yPosition);

    // Items table
    yPosition += 20;
    const tableData = items.map(item => [
      item.productName || item.name || 'N/A',
      item.description || '',
      (item.quantity || 0).toString(),
      formatCurrency(item.unitPrice || 0),
      formatCurrency(item.subtotal || (item.unitPrice * item.quantity))
    ]);

    if (tableData.length === 0) {
      // Calculate items from total if no items available
      const totalAmount = invoiceData.totalAmount || 0;
      if (totalAmount > 0) {
        tableData.push(['Service/Product', 'Invoice Total', '1', formatCurrency(totalAmount), formatCurrency(totalAmount)]);
      } else {
        tableData.push(['No items available', '', '0', '$0.00', '$0.00']);
      }
    }

    autoTable(doc, {
      startY: yPosition,
      head: [['Product', 'Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [200, 0, 0] },
      margin: { left: 20, right: 20 }
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    const totalsX = 140;
    
    const total = invoiceData.totalAmount || 0;
    const amountPaid = invoiceData.status === 'PAID' || invoiceData.status === 'paid' ? total : 0;
    const amountDue = total - amountPaid;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Amount: ${formatCurrency(total)}`, totalsX, finalY);
    
    let currentY = finalY;
    if (amountPaid > 0) {
      currentY += 7;
      doc.text(`Amount Paid: ${formatCurrency(amountPaid)}`, totalsX, currentY);
      currentY += 7;
      doc.text(`Amount Due: ${formatCurrency(amountDue)}`, totalsX, currentY);
    }

    // Payment info
    if (invoiceData.paymentMethod && invoiceData.paymentDate) {
      currentY += 20;
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Payment Method: ${invoiceData.paymentMethod}`, 20, currentY);
      currentY += 7;
      doc.text(`Payment Date: ${formatDate(invoiceData.paymentDate)}`, 20, currentY);
    }

    // Notes
    if (invoiceData.notes) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal'); 
      doc.text('Notes:', 20, currentY + 15);
      const splitNotes = doc.splitTextToSize(invoiceData.notes, 170);
      doc.text(splitNotes, 20, currentY + 22);
    }

    return doc.output('blob');
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw error;
  }
};

// Enhanced download function
export const downloadPdf = (blob, filename) => {
  try {
    if (!blob) {
      throw new Error('No PDF document provided');
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};
