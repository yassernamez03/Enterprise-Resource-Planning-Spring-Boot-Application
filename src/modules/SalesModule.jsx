// src/modules/sales/SalesModule.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppProvider } from "../context/Sales/AppContext";
import SalesRoutes from './SalesRoutes';
import { useAuth } from '../context/AuthContext';
import logService from '../services/logService';
import '../styles/sales.css';

export default function SalesModule() {
  const { user } = useAuth();

  // Access Denied Component
  const AccessDenied = ({ user }) => {
    useEffect(() => {
      // Log the unauthorized access attempt
      const logUnauthorizedAccess = async () => {
        // Get the current path the user tried to access
        const currentPath = window.location.pathname;

        await logService.logSecurityEvent(
          user?.id,
          "UNAUTHORIZED_ACCESS",
          `User attempted to access restricted page: ${currentPath}`,
          "SECURITY"
        );
      };

      if (user?.id) {
        logUnauthorizedAccess();
      }
    }, [user]);

    return (
      <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center text-4xl mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 text-center mb-6">
            You don't have permission to access this page.
          </p>
          <Link
            to="/"
            className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  };

  // If the user is not Sales or Admin, show access denied message
  if (user?.role !== "SALES" && user?.role !== "ADMIN") {
    return <AccessDenied user={user} />;
  }

  return (
    <div className="sales-module">
      <AppProvider>
        <SalesRoutes />
      </AppProvider>
    </div>
  );
}