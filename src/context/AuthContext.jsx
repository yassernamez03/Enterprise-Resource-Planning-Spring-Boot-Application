import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import userService from '../services/userService';
import { useToast } from './ToastContext';

// Create the authentication context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast, showInfoToast } = useToast();

  // Load user from API on initial render
  useEffect(() => {
    const loadUser = async () => {
      // Check if we have a token
      if (authService.isAuthenticated()) {
        try {
          // Get fresh user data from API
          const userData = await userService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // If API call fails, try to use cached user data
          const cachedUser = authService.getCurrentUser();
          if (cachedUser) {
            setUser(cachedUser);
          } else {
            // If no cached data, logout
            authService.logout();
            showErrorToast('Session expired. Please log in again.');
          }
        }
      }
      
      setLoading(false);
    };
    
    loadUser();
  }, [showErrorToast]);

  // Login method
  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password, rememberMe);
      setUser(data.user || {});
      setLoading(false);
      
      // Show welcome toast only after successful login
      showInfoToast(`Welcome, ${data.user?.fullName || 'User'}!`);
      
      return true;
    } catch (error) {
      setLoading(false);
      showErrorToast('Login failed. Please check your credentials.');
      throw error;
    }
  };

  // Register method
  const register = async (fullName, email) => {
    setLoading(true);
    try {
      const data = await authService.register(fullName, email);
      setLoading(false);
      showSuccessToast('Registration successful! Please check your email for further instructions.');
      return data;
    } catch (error) {
      setLoading(false);
      showErrorToast('Registration failed. Please try again.');
      throw error;
    }
  };

  // Forgot password method
  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      setLoading(false);
      showSuccessToast('Password reset email sent. Please check your inbox.');
      return data;
    } catch (error) {
      setLoading(false);
      showErrorToast('Failed to send password reset email. Please try again.');
      throw error;
    }
  };

  // Logout method
  const logout = () => {
    authService.logout();
    setUser(null);
    showSuccessToast('You have been successfully logged out.');
    navigate('/login');
  };

  // Check if user is authenticated
  const isAuthenticated = () => authService.isAuthenticated();

  const value = {
    user,
    loading,
    login,
    register,
    forgotPassword,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;