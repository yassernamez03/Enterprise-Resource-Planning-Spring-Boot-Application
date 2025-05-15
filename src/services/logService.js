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
};

export default logService;
