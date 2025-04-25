// Updated authService.js with verification code methods

import { apiService } from './apiInterceptor';

const authService = {
  login: async (email, password, rememberMe = false) => {
    try {
      const data = await apiService.post('/auth/login', { 
        email, 
        password,
        rememberMe 
      });
      
      // If rememberMe is true, store token in localStorage, otherwise in sessionStorage
      const storage = rememberMe ? localStorage : sessionStorage;
      
      storage.setItem('token', data.accessToken);
      storage.setItem('user', JSON.stringify(data.user || {}));
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (fullName, email) => {
    try {
      return await apiService.post('/auth/register', { fullName, email });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Step 1: Request verification code for password reset
  forgotPassword: async (email) => {
    try {
      return await apiService.post('/auth/forgot-password', { email });
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  // Step 2: Verify code and complete password reset
  verifyResetCode: async (email, verificationCode) => {
    try {
      return await apiService.post('/auth/verify-reset-code', { 
        email, 
        verificationCode 
      });
    } catch (error) {
      console.error('Verification error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userFromLocal = localStorage.getItem('user');
    const userFromSession = sessionStorage.getItem('user');
    const user = userFromLocal || userFromSession;
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },

  isAuthenticated: () => {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  },
};

export default authService;