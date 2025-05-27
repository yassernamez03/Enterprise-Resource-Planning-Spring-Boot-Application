// src/services/apiInterceptor.js

import authService from './authService';
import { parseErrorResponse, getDefaultErrorMessage } from './apiErrorHandler';

const API_URL = "https://localhost:8443/api";

// Function to handle API requests with automatic token inclusion
export const apiRequest = async (endpoint, options = {}) => {
  // Get the token
  const token = authService.getToken();
  
  // Prepare headers with authentication
  const headers = {
    ...options.headers,
  };

  // Don't set Content-Type for FormData (multipart/form-data)
  // The browser will automatically set the correct Content-Type with boundary
  if (!options.isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Prepare request options
  const requestOptions = {
    ...options,
    headers,
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  requestOptions.signal = controller.signal;

  try {
    // Make the request
    const response = await fetch(`${API_URL}${endpoint}`, requestOptions);
    clearTimeout(timeoutId);
    
    // Handle 401 Unauthorized (token expired or invalid)
    if (response.status === 401) {
      // Clear auth data and reload page to redirect to login
      authService.logout();
      window.location.reload();
      throw new Error('Session expired. Please login again.');
    }
    
    // Return the response or parsed JSON
    if (response.ok) {
      // Try to parse JSON, if not possible, return the raw response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return response;
    }
    
    // Handle API errors
    const errorMessage = await parseErrorResponse(response);
    const defaultMessage = getDefaultErrorMessage(response.status);
    
    throw new Error(errorMessage || defaultMessage);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('API request error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out. Please check your connection and try again.';
    } else if (error.message === 'Failed to fetch') {
      errorMessage = 'Unable to connect to the server. Please check your network connection.';
    } else {
      errorMessage = error.message || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};

// Convenience methods for different HTTP methods
export const apiService = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  
  post: (endpoint, data) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  put: (endpoint, data) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  patch: (endpoint, data) => apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
  
  // Form data upload (for files)
  upload: (endpoint, formData) => {
    return apiRequest(endpoint, {
      method: 'POST',
      isMultipart: true, // Flag to indicate this is a multipart request
      body: formData,
      // Do NOT set Content-Type header here - browser will set it automatically with the boundary
    });
  },
};

export default apiService;