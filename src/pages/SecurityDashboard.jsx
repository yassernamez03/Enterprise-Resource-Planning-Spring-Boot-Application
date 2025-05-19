import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import SecurityOverview from "../components/Security/SecurityOverview";
import SecurityAlerts from "../components/Security/SecurityAlerts";
import ActivityMonitoring from "../components/Security/ActivityMonitoring";
import ComplianceDashboard from "../components/Security/ComplianceDashboard";
import VulnerabilityMetrics from "../components/Security/VulnerabilityMetrics";
import LoadingSpinner from "../Components/Common/LoadingSpinner";
import EmptyState from "../Components/Common/EmptyState";
import securityService from "../services/securityService";

const SecurityDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [securityData, setSecurityData] = useState(null);
  const { user } = useAuth();
  const { showErrorToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSecurityData = async () => {
      setLoading(true);
      setError(null);

      try {
        // In a real application, this would fetch actual security data
        const data = await securityService.getSecurityOverview();
        setSecurityData(data);
      } catch (err) {
        console.error("Error fetching security data:", err);
        setError("Failed to load security information. Please try again.");
        showErrorToast("Failed to load security information");
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();
  }, [showErrorToast]);

  // If the user is not an admin, show an access denied message
  if (user?.role !== "ADMIN") {
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
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with back button */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate("/")}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Security Dashboard
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">Monitor and manage system security</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`${
                  activeTab === "overview"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Security Overview
              </button>
              <button
                onClick={() => setActiveTab("alerts")}
                className={`${
                  activeTab === "alerts"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Alerts & Incidents
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`${
                  activeTab === "activity"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                User Activity
              </button>
              <button
                onClick={() => setActiveTab("compliance")}
                className={`${
                  activeTab === "compliance"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Compliance
              </button>
              <button
                onClick={() => setActiveTab("vulnerabilities")}
                className={`${
                  activeTab === "vulnerabilities"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Vulnerabilities
              </button>
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" text="Loading security data..." />
          </div>
        )}

        {/* Tab Content */}
        {!loading && !error && (
          <>
            {activeTab === "overview" && <SecurityOverview data={securityData} />}
            {activeTab === "alerts" && <SecurityAlerts />}
            {activeTab === "activity" && <ActivityMonitoring />}
            {activeTab === "compliance" && <ComplianceDashboard />}
            {activeTab === "vulnerabilities" && <VulnerabilityMetrics />}
          </>
        )}
      </main>
    </div>
  );
};

export default SecurityDashboard;