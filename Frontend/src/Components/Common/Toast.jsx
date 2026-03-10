import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const Toast = ({ 
  message, 
  type = 'success', // 'success', 'error', 'info'
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration !== 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) setTimeout(onClose, 300); // Allow animation to complete
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) setTimeout(onClose, 300); // Allow animation to complete
  };

  // Determine toast styles based on type
  const bgColor = type === 'success' ? 'bg-green-50' : 
                  type === 'error' ? 'bg-red-50' : 'bg-blue-50';
  
  const borderColor = type === 'success' ? 'border-green-500' : 
                      type === 'error' ? 'border-red-500' : 'border-blue-500';
  
  const textColor = type === 'success' ? 'text-green-800' : 
                    type === 'error' ? 'text-red-800' : 'text-blue-800';

  const Icon = type === 'success' ? CheckCircle : 
               type === 'error' ? AlertCircle : Info;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 max-w-sm transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className={`flex items-center p-4 rounded-lg shadow-lg ${bgColor} border-l-4 ${borderColor}`}>
        <Icon className={`mr-3 h-5 w-5 ${textColor}`} />
        <div className={`flex-1 ${textColor}`}>{message}</div>
        <button 
          onClick={handleClose}
          className="ml-3 p-1 rounded-full hover:bg-white/20 focus:outline-none"
        >
          <X className={`h-4 w-4 ${textColor}`} />
        </button>
      </div>
    </div>
  );
};

export default Toast;