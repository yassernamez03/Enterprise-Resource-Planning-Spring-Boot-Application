// src/pages/NotFoundPage.js
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logService from '../services/logService';
import { useAuth } from '../context/AuthContext';

const NotFoundPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    logService.logSecurityEvent(
      isAuthenticated() ? user?.id : 'anonymous',
      'PAGE_NOT_FOUND',
      `Attempted to access: ${location.pathname}`,
      'NAVIGATION',
      {
        path: location.pathname,
        referrer: document.referrer
      }
    ).catch(console.error);
  }, [location.pathname, user, isAuthenticated]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-gray-600 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Go to Home
      </button>
    </div>
  );
};

export default NotFoundPage;