// src/AppRoutes.js
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import { ToastProvider } from '../context/ToastContext';
import ProtectedRoute from '../Components/ProtectedRoute';
import PublicRoute from '../Components/PublicRoute';
import SalesModule from '../modules/SalesModule'; // Adjust the import path as necessary

// Pages
import LoginPage from '../pages/Login';
import CreateAccountPage from '../pages/CreateAccountPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import AccountPage from '../pages/AccountApp';
import Home_Page from '../pages/Home_page';
import WeeklyCalendar from '../pages/CalandrePage';
import ChatApp from '../pages/ChatApp';
import AdminDashboard from '../pages/AdminDashboard';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ChatProvider>
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
                <Route path="/calander_page" element={<WeeklyCalendar />} />
                <Route path="/chat_page" element={<ChatApp />} />
                <Route path="/sales/*" element={<SalesModule />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </ChatProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;