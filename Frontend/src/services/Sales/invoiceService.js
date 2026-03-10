import apiService from '../apiInterceptor';

const BASE_URL = "/sales/invoices";

// Main service functions
export const getInvoices = async (pagination = { page: 0, pageSize: 10 }, filters = {}) => {
  try {
    // Build params for requests that support pagination
    const params = new URLSearchParams({
      page: pagination.page,
      size: pagination.pageSize,
      ...filters
    });
    
    // Fetch all invoices with possible filtering
    const response = await apiService.get(`${BASE_URL}?${params.toString()}`);
    
    // Handle different response structures (page object or array)
    let invoices = [];
    let total = 0;
    
    if (response.content) {
      // Spring Data pagination response
      invoices = response.content;
      total = response.totalElements;
    } else if (Array.isArray(response)) {
      // Direct array response
      invoices = response;
      total = response.length;
    } else if (response.data) {
      // Other API response format
      invoices = response.data;
      total = response.total || invoices.length;
    }
    
    // Transform backend response to match frontend property names
    const transformedInvoices = invoices.map(transformInvoiceResponse);
    
    return {
      data: transformedInvoices,
      total: total,
      page: response.number || response.page || pagination.page,
      pageSize: response.size || response.pageSize || pagination.pageSize
    };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

export const getInvoice = async (id) => {
  try {
    const invoice = await apiService.get(`${BASE_URL}/${id}`);
    return transformInvoiceResponse(invoice);
  } catch (error) {
    console.error(`Error fetching invoice ${id}:`, error);
    throw error;
  }
};

export const getInvoiceByNumber = async (invoiceNumber) => {
  try {
    const invoice = await apiService.get(`${BASE_URL}/number/${invoiceNumber}`);
    return transformInvoiceResponse(invoice);
  } catch (error) {
    console.error(`Error fetching invoice by number ${invoiceNumber}:`, error);
    throw error;
  }
};

export const createInvoice = async (invoiceData) => {
  // Transform frontend data to match backend expected properties
  const backendInvoice = transformInvoiceRequest(invoiceData);
  
  try {
    const response = await apiService.post(`${BASE_URL}/create`, backendInvoice);
    return transformInvoiceResponse(response);
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
};

export const updateInvoice = async (id, updateData) => {
  try {
    const backendData = transformInvoiceRequest(updateData);
    const response = await apiService.put(`${BASE_URL}/update/${id}`, backendData);
    return transformInvoiceResponse(response);
  } catch (error) {
    console.error(`Error updating invoice ${id}:`, error);
    throw new Error(error.response?.data?.message || 'Failed to update invoice');
  }
};

export const deleteInvoice = async (id) => {
  try {
    return await apiService.delete(`${BASE_URL}/delete/${id}`);
  } catch (error) {
    console.error(`Error deleting invoice ${id}:`, error);
    throw error;
  }
};

export const getInvoicesByClient = async (clientId) => {
  try {
    const invoices = await apiService.get(`${BASE_URL}/client/${clientId}`);
    return Array.isArray(invoices) ? invoices.map(transformInvoiceResponse) : [];
  } catch (error) {
    console.error(`Error fetching invoices for client ${clientId}:`, error);
    throw error;
  }
};

export const getInvoicesByStatus = async (status) => {
  try {
    const invoices = await apiService.get(`${BASE_URL}/status/${status}`);
    return Array.isArray(invoices) ? invoices.map(transformInvoiceResponse) : [];
  } catch (error) {
    console.error(`Error fetching invoices with status ${status}:`, error);
    throw error;
  }
};

export const getInvoicesByDateRange = async (startDate, endDate) => {
  try {
    // Format dates to ISO string format as expected by the backend
    const formattedStartDate = startDate instanceof Date ? startDate.toISOString() : startDate;
    const formattedEndDate = endDate instanceof Date ? endDate.toISOString() : endDate;
    
    const invoices = await apiService.get(
      `${BASE_URL}/date-range?startDate=${encodeURIComponent(formattedStartDate)}&endDate=${encodeURIComponent(formattedEndDate)}`
    );
    
    return Array.isArray(invoices) ? invoices.map(transformInvoiceResponse) : [];
  } catch (error) {
    console.error(`Error fetching invoices by date range:`, error);
    throw error;
  }
};

export const recordPayment = async (id, paymentMethod) => {
  try {
    const response = await apiService.post(`${BASE_URL}/${id}/mark-as-paid?paymentMethod=${encodeURIComponent(paymentMethod)}`);
    return transformInvoiceResponse(response);
  } catch (error) {
    console.error(`Error recording payment for invoice ${id}:`, error);
    throw error;
  }
};

export const searchInvoices = async (query) => {
  try {
    const invoices = await apiService.get(`${BASE_URL}/search?query=${encodeURIComponent(query)}`);
    return Array.isArray(invoices) ? invoices.map(transformInvoiceResponse) : [];
  } catch (error) {
    console.error(`Error searching invoices:`, error);
    throw error;
  }
};

export const getOverdueInvoices = async () => {
  try {
    // Assuming the backend has a specific endpoint for overdue invoices
    // If not, we can filter by status PENDING and compare the dates
    const invoices = await apiService.get(`${BASE_URL}/status/PENDING`);
    const now = new Date();
    const overdue = Array.isArray(invoices) 
      ? invoices.filter(invoice => new Date(invoice.paymentDueDate) < now)
      : [];
    
    return overdue.map(transformInvoiceResponse);
  } catch (error) {
    console.error(`Error fetching overdue invoices:`, error);
    throw error;
  }
};

// Helper functions
const transformInvoiceResponse = (invoice) => {
  if (!invoice) return null;
  
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clientId: invoice.clientId,
    clientName: invoice.clientName,
    orderId: invoice.orderId,
    orderNumber: invoice.orderNumber,
    total: invoice.totalAmount,
    status: invoice.status ? invoice.status.toLowerCase() : 'pending', // Convert from PENDING to pending for frontend
    createdAt: invoice.createdDate,
    dueDate: invoice.paymentDueDate,
    paymentDate: invoice.paymentDate,
    paymentMethod: invoice.paymentMethod,    notes: invoice.notes,    // Derived fields for the frontend
    amountPaid: invoice.status === 'PAID' ? invoice.totalAmount : 0,
    amountDue: invoice.status === 'PAID' ? 0 : invoice.totalAmount,
    payments: [],  // The backend might not expose individual payments
    
    // If the backend provides orderItems or items, use them, otherwise initialize with empty array
    items: invoice.orderItems || invoice.items || []
  };
};

const transformInvoiceRequest = (invoiceData) => {
  return {
    orderId: invoiceData.orderId,
    paymentDueDate: invoiceData.dueDate || invoiceData.paymentDueDate,
    notes: invoiceData.notes || ""
  };
};

// Export all functions as a service object for compatibility
const invoiceService = {
  getInvoices,
  getInvoice,
  getInvoiceByNumber,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicesByClient,
  getInvoicesByStatus,
  getInvoicesByDateRange,
  recordPayment,
  searchInvoices,
  getOverdueInvoices
};

export default invoiceService;
