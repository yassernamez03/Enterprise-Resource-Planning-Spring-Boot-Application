import apiService from './apiInterceptor';

const accountService = {
  // Get current user profile
  getProfile: async () => {
    try {
      return await apiService.get('/users/me');
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },
  
  // Update user profile
  updateProfile: async (profileData) => {
    try {
      return await apiService.post('/users/profile', profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  
  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      return await apiService.post('/users/change-password', {
        currentPassword,
        newPassword
      });
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },
  
  // Upload avatar
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      return await apiService.upload('/users/avatar', formData);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },
  
  // Get user tasks (this would need to be implemented on your backend)
  getTasks: async () => {
    try {
      // This is a placeholder - you would need to implement this endpoint
      return await apiService.get('/tasks');
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Return mock data for now
      return {
        data: [
          { 
            id: 1, 
            title: 'Review Q1 performance reports', 
            deadline: '2025-04-10', 
            priority: 'High',
            status: 'pending',
            category: 'Finance',
            description: 'Review the Q1 performance reports and provide feedback on the financial metrics.'
          },
          { 
            id: 2, 
            title: 'Approve new legal contract', 
            deadline: '2025-04-15', 
            priority: 'Medium',
            status: 'pending',
            category: 'Legal',
            description: 'Review and approve the new client contract for the software development project.'
          },
          { 
            id: 3, 
            title: 'Complete HR training module', 
            deadline: '2025-04-20', 
            priority: 'Low',
            status: 'pending',
            category: 'HR',
            description: 'Complete the required annual HR compliance training module.' 
          }
        ]
      };
    }
  },
  
  // Get user events (this would need to be implemented on your backend)
  getEvents: async () => {
    try {
      // This is a placeholder - you would need to implement this endpoint
      return await apiService.get('/events');
    } catch (error) {
      console.error('Error fetching events:', error);
      // Return mock data for now
      return {
        data: [
          {
            id: 1,
            title: 'Team Meeting',
            date: '2025-04-09',
            time: '10:00 AM',
            type: 'meeting'
          },
          {
            id: 2,
            title: 'Client Presentation',
            date: '2025-04-12',
            time: '2:30 PM',
            type: 'presentation'
          },
          {
            id: 3,
            title: 'Quarterly Review',
            date: '2025-04-15',
            time: '9:00 AM',
            type: 'review'
          }
        ]
      };
    }
  },
  
  // Update task status (this would need to be implemented on your backend)
  updateTaskStatus: async (taskId, status) => {
    try {
      // This is a placeholder - you would need to implement this endpoint
      return await apiService.put(`/tasks/${taskId}/status`, { status });
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }
};

export default accountService;