// src/services/salesApiService.js

import apiService from '../apiInterceptor';

// Client API services
export const clientService = {
  getClients: async (pagination = {}, filters = {}) => {
    // Build query string with pagination and filters
    const params = new URLSearchParams();
    
    // Add pagination params if provided
    if (pagination.page) params.append('page', pagination.page - 1); // Spring Boot typically uses 0-based indexing
    if (pagination.pageSize) params.append('size', pagination.pageSize);
    
    // Add sorting params if provided
    if (filters.sortBy) {
      const direction = filters.sortOrder?.toUpperCase() || 'ASC';
      params.append('sort', `${filters.sortBy},${direction}`);
    }
    
    // Add search param if provided
    if (filters.search) params.append('search', filters.search);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    // Make API call
    const response = await apiService.get(`/sales/clients${queryString}`);
    
    // Transform the response to match the expected structure
    // This assumes Spring Data REST pagination response with content, totalElements, etc.

    console.log('Client API response:', response); // Debugging line
    return {
      data: response.content || response,
      total: response.totalElements || response.length,
      page: (response.number || 0) + 1,
      pageSize: response.size || response.length
    };
  },
  
  getClient: async (id) => {
    const response = await apiService.get(`/sales/clients/${id}`);
    return response;
  },
  
  createClient: async (clientData) => {
    const response = await apiService.post('/sales/clients/create', clientData);
    return response;
  },
  
  updateClient: async (id, clientData) => {
    const response = await apiService.put(`/sales/clients/${id}`, clientData);
    return response;
  },
  
  deleteClient: async (id) => {
    await apiService.delete(`/sales/clients/${id}`);
  },
  
  searchClients: async (query) => {
    const params = new URLSearchParams({ query });
    const response = await apiService.get(`/sales/clients?${params.toString()}`);
    return {
      data: response.content || response,
      total: response.totalElements || response.length
    };
  }
};

// Product API services
export const productService = {
  getProducts: async (pagination = {}, filters = {}) => {
    // Build query string with pagination and filters
    const params = new URLSearchParams();
    
    // Add pagination params if provided
    if (pagination.page) params.append('page', pagination.page - 1);
    if (pagination.pageSize) params.append('size', pagination.pageSize);
    
    // Add sorting params if provided
    if (filters.sortBy) {
      const direction = filters.sortOrder?.toUpperCase() || 'ASC';
      params.append('sort', `${filters.sortBy},${direction}`);
    }
    
    // Add category filter if provided
    if (filters.category) params.append('category', filters.category);
    
    // Add search param if provided
    if (filters.search) params.append('search', filters.search);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    // Make API call
    const response = await apiService.get(`/api/sales/products${queryString}`);
    
    return {
      data: response.content || response,
      total: response.totalElements || response.length,
      page: (response.number || 0) + 1,
      pageSize: response.size || response.length
    };
  },
  
  getProduct: async (id) => {
    const response = await apiService.get(`/api/sales/products/${id}`);
    return response;
  },
  
  createProduct: async (productData) => {
    const response = await apiService.post('/api/sales/products', productData);
    return response;
  },
  
  updateProduct: async (id, productData) => {
    const response = await apiService.put(`/api/sales/products/${id}`, productData);
    return response;
  },
  
  deleteProduct: async (id) => {
    await apiService.delete(`/api/sales/products/${id}`);
  }
};

// Quote API services
export const quoteService = {
  getQuotes: async (pagination = {}, filters = {}) => {
    // Build query string with pagination and filters
    const params = new URLSearchParams();
    
    // Add pagination params if provided
    if (pagination.page) params.append('page', pagination.page - 1);
    if (pagination.pageSize) params.append('size', pagination.pageSize);
    
    // Add sorting params if provided
    if (filters.sortBy) {
      const direction = filters.sortOrder?.toUpperCase() || 'ASC';
      params.append('sort', `${filters.sortBy},${direction}`);
    }
    
    // Add status filter if provided
    if (filters.status) params.append('status', filters.status);
    
    // Add client filter if provided
    if (filters.clientId) params.append('clientId', filters.clientId);
    
    // Add employee filter if provided
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    
    // Add date range filters if provided
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    // Make API call
    const response = await apiService.get(`/api/sales/quotes${queryString}`);
    
    return {
      data: response.content || response,
      total: response.totalElements || response.length,
      page: (response.number || 0) + 1,
      pageSize: response.size || response.length
    };
  },
  
  getQuote: async (id) => {
    const response = await apiService.get(`/api/sales/quotes/${id}`);
    return response;
  },
  
  createQuote: async (quoteData) => {
    const response = await apiService.post('/api/sales/quotes', quoteData);
    return response;
  },
  
  updateQuote: async (id, quoteData) => {
    const response = await apiService.put(`/api/sales/quotes/${id}`, quoteData);
    return response;
  },
  
  deleteQuote: async (id) => {
    await apiService.delete(`/api/quotes/${id}`);
  },
  
  convertToOrder: async (id) => {
    const response = await apiService.post(`/api/quotes/${id}/convert`);
    return response;
  }
};

// Order API services
export const orderService = {
  getOrders: async (pagination = {}, filters = {}) => {
    // Build query string with pagination and filters
    const params = new URLSearchParams();
    
    // Add pagination params if provided
    if (pagination.page) params.append('page', pagination.page - 1);
    if (pagination.pageSize) params.append('size', pagination.pageSize);
    
    // Add sorting params if provided
    if (filters.sortBy) {
      const direction = filters.sortOrder?.toUpperCase() || 'ASC';
      params.append('sort', `${filters.sortBy},${direction}`);
    }
    
    // Add status filter if provided
    if (filters.status) params.append('status', filters.status);
    
    // Add client filter if provided
    if (filters.clientId) params.append('clientId', filters.clientId);
    
    // Add employee filter if provided
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    
    // Add date range filters if provided
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    // Make API call
    const response = await apiService.get(`/api/orders${queryString}`);
    
    return {
      data: response.content || response,
      total: response.totalElements || response.length,
      page: (response.number || 0) + 1,
      pageSize: response.size || response.length
    };
  },
  
  getOrder: async (id) => {
    const response = await apiService.get(`/api/orders/${id}`);
    return response;
  },
  
  createOrder: async (orderData) => {
    const response = await apiService.post('/api/orders', orderData);
    return response;
  },
  
  updateOrder: async (id, orderData) => {
    const response = await apiService.put(`/api/orders/${id}`, orderData);
    return response;
  },
  
  deleteOrder: async (id) => {
    await apiService.delete(`/api/orders/${id}`);
  },
  
  generateInvoice: async (id) => {
    const response = await apiService.post(`/api/orders/${id}/invoice`);
    return response;
  }
};

// Invoice API services
export const invoiceService = {
  getInvoices: async (pagination = {}, filters = {}) => {
    // Build query string with pagination and filters
    const params = new URLSearchParams();
    
    // Add pagination params if provided
    if (pagination.page) params.append('page', pagination.page - 1);
    if (pagination.pageSize) params.append('size', pagination.pageSize);
    
    // Add sorting params if provided
    if (filters.sortBy) {
      const direction = filters.sortOrder?.toUpperCase() || 'ASC';
      params.append('sort', `${filters.sortBy},${direction}`);
    }
    
    // Add status filter if provided
    if (filters.status) params.append('status', filters.status);
    
    // Add client filter if provided
    if (filters.clientId) params.append('clientId', filters.clientId);
    
    // Add date range filters if provided
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    // Make API call
    const response = await apiService.get(`/api/invoices${queryString}`);
    
    return {
      data: response.content || response,
      total: response.totalElements || response.length,
      page: (response.number || 0) + 1,
      pageSize: response.size || response.length
    };
  },
  
  getInvoice: async (id) => {
    const response = await apiService.get(`/api/invoices/${id}`);
    return response;
  },
  
  updateInvoice: async (id, invoiceData) => {
    const response = await apiService.put(`/api/invoices/${id}`, invoiceData);
    return response;
  },
  
  markAsPaid: async (id, paymentMethod) => {
    const response = await apiService.put(`/api/invoices/${id}`, {
      status: 'PAID',
      paymentMethod,
      paymentDate: new Date()
    });
    return response;
  }
};

// Export all services
export default {
  clientService,
  productService,
  quoteService,
  orderService,
  invoiceService
};