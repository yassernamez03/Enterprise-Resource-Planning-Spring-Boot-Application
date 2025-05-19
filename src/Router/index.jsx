// src/AppRoutes.js
import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider , useAuth } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import { ToastProvider } from '../context/ToastContext';
import ProtectedRoute from '../Components/ProtectedRoute';
import PublicRoute from '../Components/PublicRoute';
import SalesModule from '../modules/SalesModule';
import logService from '../services/logService';

// Pages
import LoginPage from '../pages/Login';
import CreateAccountPage from '../pages/CreateAccountPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import AccountPage from '../pages/AccountApp';
import Home_Page from '../pages/Home_page';
import ChatApp from '../pages/ChatApp';
import AdminDashboard from '../pages/AdminDashboard';
import SecurityDashboard from '../pages/SecurityDashboard';
import EmployeeManagement from '../pages/EmployePage';
import TaskManagement from '../pages/TaskManagementPage';
import { CalendarProvider } from '../context/CalendarContext';
import CalendarPage from '../pages/CalanderPage';
import NotFoundPage from '../pages/NotFoundPage';

const RouteLogger = ({ children }) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const logNavigation = async () => {
      try {
        await logService.logSecurityEvent(
          isAuthenticated() ? user?.id : null,
          'PAGE_VIEW',
          `Navigated to: ${location.pathname}`,
          'NAVIGATION',
          {
            path: location.pathname,
            search: location.search,
            hash: location.hash
          }
        );
      } catch (error) {
        console.error('Navigation logging failed:', error);
      }
    };

    logNavigation();
  }, [location, user, isAuthenticated]);

  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ChatProvider>
            <RouteLogger>
              <Routes>
                {/* Public routes - redirect to home if authenticated */}
                <Route element={<PublicRoute />}>
                  <Route path="/signup" element={<CreateAccountPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>

                {/* Protected routes - redirect to login if not authenticated */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Home_Page />} />
                  <Route path="/account_details" element={<AccountPage />} />
                  <Route path="/calander_page" element={
                    <CalendarProvider>
                      <CalendarPage />
                    </CalendarProvider>
                  } />
                  <Route path="/chat_page" element={<ChatApp />} />
                  <Route path="/sales/*" element={<SalesModule />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/security" element={<SecurityDashboard />} />
                  <Route path="/Employee" element={<EmployeeManagement />} />
                  <Route path="/TaskManagement/:id" element={<TaskManagement />} />
                </Route>

                {/* 404 Page - catches all undefined routes */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </RouteLogger>
          </ChatProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;