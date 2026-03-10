import apiService from './apiInterceptor';

const accountService = {
  // Get current user profile
  getProfile: async () => {
    try {
      const response = await apiService.get('/users/me');
      return response;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiService.put('/users/profile', profileData);
      return response;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await apiService.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      return response;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await apiService.upload('/users/avatar', formData);
      return response;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  // Get user's tasks (delegating to calendar service)
  getTasks: async () => {
    try {
      // Import calendar service dynamically to avoid circular imports
      const { default: calendarService } = await import('./calanderService');
      return await calendarService.getAllVisibleTasks();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  // Get user's events (delegating to calendar service)
  getEvents: async () => {
    try {
      // Import calendar service dynamically to avoid circular imports
      const { default: calendarService } = await import('./calanderService');
      return await calendarService.getAllVisibleEvents();
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Update task status (delegating to calendar service)
  updateTaskStatus: async (taskId, status) => {
    try {
      // Import calendar service dynamically to avoid circular imports
      const { default: calendarService } = await import('./calanderService');
      
      if (status === 'completed') {
        return await calendarService.toggleTaskCompletion(taskId);
      } else {
        // If marking as pending, we might need a different method
        // For now, toggle it (assuming it's currently completed)
        return await calendarService.toggleTaskCompletion(taskId);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      const response = await apiService.get('/users/stats');
      return response;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  // Get user notifications
  getNotifications: async () => {
    try {
      const response = await apiService.get('/users/notifications');
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }
};

export default accountService;