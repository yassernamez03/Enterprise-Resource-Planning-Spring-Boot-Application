// src/services/logService.js
import apiService from './apiInterceptor';

const logService = {
  getAllLogs: async () => {
    try {
      const response = await apiService.get('/admin/logs');
      console.log('Raw response:', response); // Add this line
      console.log('Service response data:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching all logs:', error);
      throw error;
    }
  },

  getUserLogs: async (userId) => {
    try {
      const response = await apiService.get(`/admin/logs/user/${userId}`);
      console.log(`Fetched logs for user ID ${userId}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching logs for user ID ${userId}:`, error);
      throw error;
    }
  },

  // New method for logging security events
  logSecurityEvent: async (userId, action, details, logType) => {
    try {
      const logData = {
        userId: userId,
        action: action,
        details: details,
        logType: logType
      };
      
      const response = await apiService.post('/security/logs', logData);
      console.log('Security event logged:', response);
      return response;
    } catch (error) {
      console.error('Error logging security event:', error);
      // Don't rethrow the error - we don't want to interrupt the user flow
      // Just log it to the console
      return { success: false, error: error.message };
    }
  }
};

export default logService;
