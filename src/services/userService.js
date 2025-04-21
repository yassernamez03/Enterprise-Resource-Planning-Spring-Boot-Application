// src/services/userService.js

import apiService from './apiInterceptor';

const userService = {
  // Get current user profile
  getCurrentUser: async () => {
    try {
      return await apiService.get('/users/me');
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    try {
      return await apiService.put('/users/profile', userData);
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
  
  // For admin users: get pending approvals
  getPendingApprovals: async () => {
    try {
      return await apiService.get('/users/pending');
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw error;
    }
  },
  
  // For admin users: approve a user
  approveUser: async (userId) => {
    try {
      return await apiService.put(`/users/${userId}/approve`);
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  },
  
  // For admin users: reject a user
  rejectUser: async (userId) => {
    try {
      return await apiService.put(`/users/${userId}/reject`);
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  },
  
  // For admin users: get all users
  getAllUsers: async () => {
    try {
      return await apiService.get('/users');
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  },
  
  // For admin users: change user role
  changeUserRole: async (userId, newRole) => {
    try {
      return await apiService.put(`/users/${userId}/role`, { role: newRole });
    } catch (error) {
      console.error('Error changing user role:', error);
      throw error;
    }
  }
};

export default userService;