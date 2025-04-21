// src/services/apiErrorHandler.js

/**
 * Helper functions to handle API errors consistently across the application
 */

// Parse and format error messages from the backend
export const parseErrorResponse = async (response) => {
  try {
    const contentType = response.headers.get('content-type');
    
    // Try to parse as JSON if content type is JSON
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      
      // Handle various error structures
      if (errorData.message) {
        return errorData.message;
      } else if (errorData.error) {
        return errorData.error;
      } else if (errorData.errors && Array.isArray(errorData.errors)) {
        // Join multiple validation errors
        return errorData.errors.map(err => err.message || err).join(', ');
      }
    }
    
    // If JSON parsing fails or doesn't have expected structure, use status text
    return response.statusText || 'An unexpected error occurred';
  } catch (error) {
    // If JSON parsing fails completely, fallback to status code
    return `Error ${response.status || 'unknown'}: ${response.statusText || 'Unknown error'}`;
  }
};

// Map HTTP status codes to user-friendly messages
export const getDefaultErrorMessage = (status) => {
  const statusMessages = {
    400: 'The request was invalid or cannot be processed.',
    401: 'Authentication required. Please login again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'The request could not be completed due to a conflict.',
    422: 'The request could not be processed due to validation errors.',
    429: 'Too many requests. Please try again later.',
    500: 'An unexpected server error occurred. Please try again later.',
    502: 'Bad gateway. Please try again later.',
    503: 'Service unavailable. Please try again later.',
    504: 'Gateway timeout. Please try again later.',
  };
  
  return statusMessages[status] || 'An unexpected error occurred. Please try again.';
};

// Format validation errors from the backend
export const formatValidationErrors = (errors) => {
  if (!errors) return {};
  
  // Handle array of errors
  if (Array.isArray(errors)) {
    // Convert to object with field names as keys
    return errors.reduce((acc, error) => {
      if (error.field) {
        acc[error.field] = error.message || 'Invalid value';
      }
      return acc;
    }, {});
  }
  
  // Handle object with field names as keys
  return errors;
};

export default {
  parseErrorResponse,
  getDefaultErrorMessage,
  formatValidationErrors
};