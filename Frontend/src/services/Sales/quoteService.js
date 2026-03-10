// src/services/Sales/quoteService.js
import { apiService } from "../apiInterceptor";

const BASE_URL = "/sales/quotes";


// Main service functions
export const getQuotes = async (pagination = { page: 0, pageSize: 10 }, filters = {}) => {
  try {
    // Build params for requests that support pagination
    const params = new URLSearchParams({
      page: pagination.page,
      size: pagination.pageSize,
      ...filters
    });
    
    // Fetch all quotes with possible filtering
    const response = await apiService.get(`${BASE_URL}?${params.toString()}`);
    
    // Handle different response structures (page object or array)
    let quotes = [];
    let total = 0;
    
    if (response.content) {
      // Spring Data pagination response
      quotes = response.content;
      total = response.totalElements;
    } else if (Array.isArray(response)) {
      // Direct array response
      quotes = response;
      total = response.length;
    } else if (response.data) {
      // Generic wrapped response
      quotes = response.data;
      total = response.total || quotes.length;
    }
    
    // Transform backend response to match frontend property names
    const transformedQuotes = quotes.map(transformQuoteResponse);
    
    return {
      data: transformedQuotes,
      total: total,
      page: response.number || response.page || pagination.page,
      pageSize: response.size || response.pageSize || pagination.pageSize
    };
  } catch (error) {
    console.error("Error fetching quotes:", error);
    throw error;
  }
};

export const getQuote = async (id) => {
  try {
    const quote = await apiService.get(`${BASE_URL}/${id}`);
    return transformQuoteResponse(quote);
  } catch (error) {
    console.error(`Error fetching quote ${id}:`, error);
    throw error;
  }
};

export const getQuoteByNumber = async (quoteNumber) => {
  try {
    const quote = await apiService.get(`${BASE_URL}/number/${quoteNumber}`);
    return transformQuoteResponse(quote);
  } catch (error) {
    console.error(`Error fetching quote by number ${quoteNumber}:`, error);
    throw error;
  }
};

export const createQuote = async (quoteData) => {
  // Transform frontend data to match backend expected properties
  const backendQuote = transformQuoteRequest(quoteData);
  
  try {
    const response = await apiService.post(`${BASE_URL}/create`, backendQuote);
    return transformQuoteResponse(response);
  } catch (error) {
    console.error("Error creating quote:", error);
    throw error;
  }
};

export const updateQuote = async (id, updateData) => {
  try {
    // For status-only updates
    if (updateData.status && Object.keys(updateData).length === 1) {
      // Change this to use a query parameter instead of request body
      const response = await apiService.put(`${BASE_URL}/${id}/status?status=${updateData.status}`);
      return transformQuoteResponse(response);
    }
    
    // Normal update for other cases
    const backendData = transformQuoteRequest(updateData);
    const response = await apiService.put(`${BASE_URL}/update/${id}`, backendData);
    return transformQuoteResponse(response);
  } catch (error) {
    console.error(`Error updating quote ${id}:`, error);
    throw new Error(error.response?.data?.message || 'Failed to update quote');
  }
};

export const deleteQuote = async (id) => {
  try {
    return await apiService.delete(`${BASE_URL}/delete/${id}`);
  } catch (error) {
    console.error(`Error deleting quote ${id}:`, error);
    throw error;
  }
};

export const getQuotesByClient = async (clientId) => {
  try {
    const quotes = await apiService.get(`${BASE_URL}/client/${clientId}`);
    return Array.isArray(quotes) ? quotes.map(transformQuoteResponse) : [];
  } catch (error) {
    console.error(`Error fetching quotes for client ${clientId}:`, error);
    throw error;
  }
};


export const getQuotesByStatus = async (status) => {
  try {
    const quotes = await apiService.get(`${BASE_URL}/status/${status}`);
    return Array.isArray(quotes) ? quotes.map(transformQuoteResponse) : [];
  } catch (error) {
    console.error(`Error fetching quotes with status ${status}:`, error);
    throw error;
  }
};

export const getQuotesByDateRange = async (startDate, endDate) => {
  try {
    // Format dates to ISO string format as expected by the backend
    const formattedStartDate = startDate.toISOString();
    const formattedEndDate = endDate.toISOString();
    
    const quotes = await apiService.get(
      `${BASE_URL}/date-range?startDate=${encodeURIComponent(formattedStartDate)}&endDate=${encodeURIComponent(formattedEndDate)}`
    );
    
    return Array.isArray(quotes) ? quotes.map(transformQuoteResponse) : [];
  } catch (error) {
    console.error(`Error fetching quotes by date range:`, error);
    throw error;
  }
};

export const convertQuoteToOrder = async (id) => {
  try {
    const response = await apiService.post(`${BASE_URL}/${id}/convert`);
    return {
      orderId: response.id,
      orderNumber: response.orderNumber,
      success: true
    };
  } catch (error) {
    console.error(`Error converting quote ${id} to order:`, error);
    throw error;
  }
};

export const searchQuotes = async (query) => {
  try {
    const quotes = await apiService.get(`${BASE_URL}/search?query=${encodeURIComponent(query)}`);
    return Array.isArray(quotes) ? quotes.map(transformQuoteResponse) : [];
  } catch (error) {
    console.error(`Error searching quotes:`, error);
    throw error;
  }
};

// Helper functions
const transformQuoteResponse = (quote) => {
  if (!quote) return null;
  
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    clientId: quote.clientId,
    clientName: quote.clientName,
    status: quote.status,
    items: (quote.items || []).map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal || calculateItemTotal(item),
      description: item.description
    })),
    subtotal: calculateSubtotal(quote.items || []),
    discount: quote.discount || 0,
    tax: quote.tax || 0,
    total: quote.totalAmount,
    notes: quote.notes,
    terms: quote.terms,
    createdAt: quote.createdDate,
    updatedAt: quote.updatedDate || quote.lastModifiedDate,
    validUntil: quote.expiryDate,
    convertedToOrder: quote.convertedToOrder
  };
};

const transformQuoteRequest = (quoteData) => {
  return {
    clientId: quoteData.clientId, // Make sure this is always included
    items: (quoteData.items || []).map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      description: item.description || ""
    })),
    // Include all other required fields
    totalAmount: quoteData.total || 0,
    notes: quoteData.notes || "",
    terms: quoteData.terms || "",
    status: quoteData.status,
    discount: quoteData.discount || 0,
    tax: quoteData.tax || 0,
    expiryDate: quoteData.validUntil
  };
};

const calculateItemTotal = (item) => {
  if (item.subtotal) return item.subtotal;
  
  const baseAmount = item.unitPrice * item.quantity;
  if (!item.discount) return baseAmount;
  
  return baseAmount - (baseAmount * (item.discount / 100));
};

const calculateSubtotal = (items) => {
  return items.reduce((total, item) => {
    const itemTotal = item.subtotal || (item.unitPrice * item.quantity);
    return total + itemTotal;
  }, 0);
};

// Export all functions as a service object for compatibility
const quoteService = {
  getQuotes,
  getQuote,
  getQuoteByNumber,
  createQuote,
  updateQuote,
  deleteQuote, 
  getQuotesByClient,
  getQuotesByStatus,
  getQuotesByDateRange,
  convertQuoteToOrder,
  searchQuotes
};

export default quoteService;