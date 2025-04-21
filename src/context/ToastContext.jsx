import React, { createContext, useState, useContext } from 'react';
import Toast from '../Components/Common/Toast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Generate unique ID for toast
  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Show a toast
  const showToast = (message, type = 'success', duration = 3000) => {
    const id = generateId();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    return id;
  };

  // Remove a toast by ID
  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  // Convenience methods
  const showSuccessToast = (message, duration) => showToast(message, 'success', duration);
  const showErrorToast = (message, duration) => showToast(message, 'error', duration);
  const showInfoToast = (message, duration) => showToast(message, 'info', duration);

  return (
    <ToastContext.Provider 
      value={{ 
        showToast, 
        removeToast, 
        showSuccessToast, 
        showErrorToast, 
        showInfoToast 
      }}
    >
      {children}
      
      {/* Render toasts */}
      <div className="toast-container fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Custom hook for using the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;