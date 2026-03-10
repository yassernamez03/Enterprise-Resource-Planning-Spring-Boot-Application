// src/Components/ProtectedRoute.js
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logService from "../services/logService";

const ProtectedRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated()) {
        // Check if user is trying to access admin routes without admin privileges
        const adminRoutes = ['/security', '/admin', '/sales', '/Employee'];
        const isAdminRoute = adminRoutes.some(route => location.pathname.startsWith(route));
        
        if (isAdminRoute && user?.role !== 'ADMIN') {
          // Log unauthorized admin access attempt
          logService
            .logSecurityEvent(
              user?.id,
              "UNAUTHORIZED_ADMIN_ACCESS",
              `User attempted to access restricted page: ${location.pathname}`,
              "SECURITY"
            )
            .catch(console.error);
        } else {
          // Log successful access to protected route
          logService
            .logSecurityEvent(
              user?.id,
              "PROTECTED_ACCESS",
              `Accessed protected route: ${location.pathname}`,
              "SECURITY"
            )
            .catch(console.error);
        }
      } else {
        // Log unauthorized access attempt
        if (location.pathname !== "/") {
          logService
            .logSecurityEvent(
              null,
              "UNAUTHORIZED_ACCESS_ATTEMPT",
              `Attempted to access protected route: ${location.pathname}`,
              "SECURITY",
              { attemptedPath: location.pathname }
            )
            .catch(console.error);
        }
      }
    }
  }, [loading, isAuthenticated, location.pathname, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
