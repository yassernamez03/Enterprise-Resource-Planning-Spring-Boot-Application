// src/services/Sales/clientService.js
import { apiService } from "../apiInterceptor";

const BASE_URL = "/sales/clients";

const clientService = {
  getClients: async (pagination, filters) => {
    // Ensure we have all filter parameters
    const params = new URLSearchParams({
      page: pagination.page, // Spring uses 0-based indexing
      size: pagination.pageSize,
      sortBy: filters.sortBy || "name",
      sortOrder: filters.sortOrder || "asc"
    });
    
    // Only add search param if it exists
    if (filters.search && filters.search.trim()) {
      params.append("search", filters.search.trim());
    }
    
    return apiService.get(`${BASE_URL}?${params.toString()}`);
  },

  getClient: async (id) => {
    return apiService.get(`${BASE_URL}/${id}`);
  },

  createClient: async (clientData) => {
    return apiService.post(`${BASE_URL}/create`, clientData);
  },

  updateClient: async (id, clientData) => {
    return apiService.put(`${BASE_URL}/update/${id}`, clientData);
  },

  deleteClient: async (id) => {
    return apiService.delete(`${BASE_URL}/delete/${id}`);
  },

  checkClientHasQuotes: async (clientId) => {
    const response = await apiService.get(`/api/sales/quotes?clientId=${clientId}`);
    return response.length > 0; // or adjust based on your API response
  },
  
  searchClients: async (query) => {
    return apiService.get(`${BASE_URL}/search?query=${encodeURIComponent(query)}`);
  }
};

export { clientService };