import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  AlertTriangle,
  Activity,
  TrendingUp,
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings,
  BarChart3,
  Users,
  Globe,
  Clock,
  ArrowLeft,
} from "lucide-react";

import LoadingSpinner from "../Components/Security/ui/LoadingSpinner";
import StatusBadge from "../Components/Security/ui/StatusBadge";
import StatCard from "../Components/Security/dashboard/StatCard";
import AlertsList from "../Components/Security/dashboard/AlertsList";
import ThreatChart from "../Components/Security/charts/ThreatChart";
import MetricsChart from "../Components/Security/charts/MetricsChart";
import alertsService from "../services/alertsService";
import { useAuth } from "../context/AuthContext";
import logService from "../services/logService";

const SecurityDashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [threatIntel, setThreatIntel] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Auth and navigation
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filters and settings
  const [filters, setFilters] = useState({
    severity: "ALL",
    alertType: "ALL",
    dateRange: 7,
  });
  const [searchIP, setSearchIP] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [exportLoading, setExportLoading] = useState(false);

  // Access Denied Component
  const AccessDenied = ({ user }) => {
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

  // If the user is not an admin, show an access denied message
  if (user?.role !== "ADMIN") {
    return <AccessDenied user={user} />;
  }

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        dashboard,
        allAlerts,
        intelligence,
        securityMetrics,
      ] = await Promise.all([
        alertsService.getSecurityDashboard(),
        alertsService.getAllAlerts(),
        alertsService.getThreatIntelligence(),
        alertsService.getSecurityMetrics(filters.dateRange),
      ]);

      setDashboardData(dashboard);

      // Filter alerts by date range based on the selected filter
      const now = new Date();
      const filterDate = new Date();
      filterDate.setDate(now.getDate() - filters.dateRange);

      // Filter alerts by date range and sort by timestamp (newest first)
      const filteredAlerts = allAlerts.filter((alert) => {
        const alertDate = new Date(alert.timestamp);
        return alertDate >= filterDate;
      });

      const sortedAlerts = filteredAlerts.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB - dateA; // Descending order (newest first)
      });

      setAlerts(sortedAlerts);
      setThreatIntel(intelligence);
      setMetrics(securityMetrics);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setError("Failed to load security information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange]);

  // Auto-refresh setup
  useEffect(() => {
    loadDashboardData();

    let cleanup;
    if (autoRefresh) {
      cleanup = alertsService.startAlertPolling(async (newAlerts) => {
        // Apply date filtering to new alerts from polling
        const now = new Date();
        const filterDate = new Date();
        filterDate.setDate(now.getDate() - filters.dateRange);

        const filteredNewAlerts = newAlerts.filter((alert) => {
          const alertDate = new Date(alert.timestamp);
          return alertDate >= filterDate;
        });

        // Sort new alerts by timestamp (newest first)
        const sortedNewAlerts = filteredNewAlerts.sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB - dateA; // Descending order (newest first)
        });

        setAlerts(sortedNewAlerts);
        setLastRefresh(new Date());
        console.log("New alerts from polling (filtered):", sortedNewAlerts);

        // Refresh all dashboard data periodically
        try {
          const [dashboard, intelligence, securityMetrics] =
            await Promise.all([
              alertsService.getSecurityDashboard(),
              alertsService.getThreatIntelligence(),
              alertsService.getSecurityMetrics(filters.dateRange),
            ]);

          setDashboardData(dashboard);
          setThreatIntel(intelligence);
          setMetrics(securityMetrics);

        } catch (error) {
          console.error("Failed to refresh dashboard data:", error);
          // Don't set error state here to avoid disrupting the UI during auto-refresh
        }
      }, refreshInterval * 1000);
    }

    console.log(
      `Auto-refresh is ${
        autoRefresh ? "enabled" : "disabled"
      } with interval ${refreshInterval} seconds`
    );

    console.log(`Last refresh at: ${lastRefresh.toLocaleTimeString()}`);

    return () => {
      if (cleanup) cleanup();
    };
  }, [loadDashboardData, autoRefresh, refreshInterval, filters.dateRange]);

  // Filter alerts by severity and type
  const filteredAlerts = alerts.filter((alert) => {
    const severityMatch =
      filters.severity === "ALL" || alert.severity === filters.severity;
    const typeMatch =
      filters.alertType === "ALL" || alert.alertType === filters.alertType;
    return severityMatch && typeMatch;
  });

  // Handle IP search
  const handleIPSearch = async () => {
    if (!searchIP.trim()) return;
    try {
      const ipAlerts = await alertsService.searchAlertsByIP(searchIP);

      // Sort search results by timestamp (newest first)
      const sortedIpAlerts = ipAlerts.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB - dateA; // Descending order (newest first)
      });

      setAlerts(sortedIpAlerts);
    } catch (error) {
      console.error("Failed to search by IP:", error);
    }
  };

  // Handle export
  const handleExport = async (format) => {
    try {
      setExportLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - filters.dateRange);

      const data = await alertsService.exportAlertsData(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
        format
      );

      if (format === "csv") {
        const blob = new Blob([data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `security-alerts-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `security-alerts-${
          new Date().toISOString().split("T")[0]
        }.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export data:", error);
    } finally {
      setExportLoading(false);
    }
  };

  // Severity color mapping
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-600 bg-red-100";
      case "HIGH":
        return "text-orange-600 bg-orange-100";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-100";
      case "LOW":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case "CRITICAL":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Prepare chart data
  const threatChartData = threatIntel?.attackTypes
    ? Object.entries(threatIntel.attackTypes).map(([name, value]) => ({
        name: name.replace("_", " "),
        value,
      }))
    : [];

  const metricsChartData = metrics?.alertsByDay
    ? Object.entries(metrics.alertsByDay)
        .map(([date, alerts]) => ({
          date,
          alerts,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort chronologically instead of reversing
    : [];

  const tabs = [
    { id: "overview", name: "Security Overview", icon: Shield },
    { id: "alerts", name: "Alerts", icon: AlertTriangle },
    { id: "intelligence", name: "Threat Intel", icon: Globe },
    { id: "analytics", name: "Analytics", icon: BarChart3 },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header with back button */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Security Command Center
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div
                  className={`w-2 h-2 rounded-full ${
                    autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                />
                <span>{autoRefresh ? "Live" : "Paused"}</span>
                <span>•</span>
                <Clock className="w-4 h-4" />
                <span>{lastRefresh.toLocaleTimeString()}</span>
              </div>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                <RefreshCw
                  className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`}
                />
                <span>{autoRefresh ? "Live" : "Paused"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page description */}
        <div className="mb-6">
          <p className="text-gray-600">
            Monitor and analyze security threats
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg"
            >
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" text="Loading security data..." />
          </div>
        )}

        {/* Tab Content */}
        {!loading && !error && (
          <AnimatePresence mode="wait">
            {/* Overview Tab - Enhanced with comprehensive data */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Summary Cards - Enhanced with all alerts data */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="All Alerts"
                    value={dashboardData?.summary?.totalAlertsAllTime || alerts.length}
                    icon={AlertTriangle}
                    color="blue"
                    isLoading={!dashboardData}
                  />
                  <StatCard
                    title="Today's Alerts"
                    value={dashboardData?.summary?.todaysAlerts || 0}
                    icon={Clock}
                    color="purple"
                    isLoading={!dashboardData}
                  />
                  <StatCard
                    title="Critical Today"
                    value={dashboardData?.summary?.criticalAlertsToday || 0}
                    icon={Shield}
                    color="red"
                    isLoading={!dashboardData}
                  />
                  <StatCard
                    title="Risk Level"
                    value={threatIntel?.riskLevel || "Unknown"}
                    icon={TrendingUp}
                    color={
                      threatIntel?.riskLevel === "CRITICAL"
                        ? "red"
                        : threatIntel?.riskLevel === "HIGH"
                        ? "orange"
                        : threatIntel?.riskLevel === "MEDIUM"
                        ? "yellow"
                        : "green"
                    }
                    isLoading={!threatIntel}
                  />
                </div>

                {/* Enhanced Threat Intelligence Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Alerts - same as before */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Recent Security Alerts
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {dashboardData?.recentAlerts
                          ?.slice(0, 5)
                          .map((alert) => (
                            <div
                              key={alert.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                            >
                              <div className="flex items-center space-x-3">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(
                                    alert.severity
                                  )}`}
                                >
                                  {alert.severity}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {alert.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(alert.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              {alert.sourceIp && (
                                <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                                  {alert.sourceIp}
                                </span>
                              )}
                            </div>
                          ))}
                        {(!dashboardData?.recentAlerts ||
                          dashboardData.recentAlerts.length === 0) && (
                          <div className="text-center py-8">
                            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              No Recent Alerts
                            </h3>
                            <p className="text-gray-500">
                              Your system is secure and running smoothly.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Threat Intelligence Summary */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Enhanced Threat Intelligence
                      </h3>
                    </div>
                    <div className="p-6">
                      {threatIntel ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                              <div className="text-2xl font-bold text-indigo-600">
                                {threatIntel.uniqueThreatSources}
                              </div>
                              <div className="text-sm text-gray-600">
                                Threat Sources
                              </div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">
                                {threatIntel.totalThreats}
                              </div>
                              <div className="text-sm text-gray-600">
                                Total Threats
                              </div>
                            </div>
                          </div>

                          {/* Weekly Trends */}
                          {threatIntel.recentTrends && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Weekly Trends
                              </h4>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  This Week: {threatIntel.recentTrends.thisWeek}
                                </span>
                                <span
                                  className={`text-sm font-medium ${
                                    threatIntel.recentTrends.weeklyChange > 0
                                      ? "text-red-600"
                                      : threatIntel.recentTrends.weeklyChange < 0
                                      ? "text-green-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {threatIntel.recentTrends.weeklyChange > 0
                                    ? "+"
                                    : ""}
                                  {threatIntel.recentTrends.weeklyChange}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Emerging Threats */}
                          {threatIntel.emergingThreats &&
                            threatIntel.emergingThreats.length > 0 && (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                                  ⚠️ Emerging Threats ({threatIntel.emergingThreats.length})
                                </h4>
                                <div className="space-y-1">
                                  {threatIntel.emergingThreats
                                    .slice(0, 3)
                                    .map((threat, index) => (
                                      <div
                                        key={index}
                                        className="text-xs text-yellow-700"
                                      >
                                        {threat.type.replace("_", " ")}:{" "}
                                        {threat.recentCount} alerts
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                          <div className="text-center">
                            <StatusBadge status={threatIntel.riskLevel} />
                            <p className="text-sm text-gray-600 mt-2">
                              Current Risk Level
                            </p>
                          </div>

                          {threatChartData.length > 0 && (
                            <ThreatChart data={threatChartData} height={200} />
                          )}
                        </div>
                      ) : (
                        <LoadingSpinner />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Alerts Tab */}
            {activeTab === "alerts" && (
              <motion.div
                key="alerts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Enhanced Filters Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Filter & Search Options
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setFilters({
                          severity: "ALL",
                          alertType: "ALL",
                          dateRange: 7,
                        });
                        setSearchIP("");
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 underline self-start sm:self-center"
                    >
                      Reset Filters
                    </button>
                  </div>

                  {/* Filter Controls - 2 Row Layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* First Row */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <Shield className="w-4 h-4 mr-2" />
                        Severity Level
                      </label>
                      <select
                        value={filters.severity}
                        onChange={(e) =>
                          setFilters({ ...filters, severity: e.target.value })
                        }
                        className="w-full py-2.5 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                      >
                        <option value="ALL">🔍 All Severities</option>
                        <option value="CRITICAL">🔴 Critical</option>
                        <option value="HIGH">🟠 High</option>
                        <option value="MEDIUM">🟡 Medium</option>
                        <option value="LOW">🔵 Low</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Alert Type
                      </label>
                      <select
                        value={filters.alertType}
                        onChange={(e) =>
                          setFilters({ ...filters, alertType: e.target.value })
                        }
                        className="w-full py-2.5 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                      >
                        <option value="ALL">📋 All Types</option>
                        <option value="BRUTE_FORCE">🔨 Brute Force</option>
                        <option value="DATA_EXFILTRATION">
                          📤 Data Exfiltration
                        </option>
                        <option value="MALICIOUS_FILE">
                          🦠 Malicious File
                        </option>
                        <option value="PATH_TRAVERSAL">
                          📁 Path Traversal
                        </option>
                        <option value="UNAUTHORIZED_ACCESS">
                          🚫 Unauthorized Access
                        </option>
                        <option value="SUSPICIOUS_LOGIN">
                          🔐 Suspicious Login
                        </option>
                        <option value="NETWORK_INTRUSION">
                          🌐 Network Intrusion
                        </option>
                        <option value="MALWARE_DETECTED">
                          🛡️ Malware Detected
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <Search className="w-4 h-4 mr-2" />
                        Search by IP
                      </label>
                      <div className="flex rounded-lg shadow-sm">
                        <input
                          type="text"
                          value={searchIP}
                          onChange={(e) => setSearchIP(e.target.value)}
                          placeholder="192.168.1.1"
                          className="flex-1 py-2 rounded-l-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleIPSearch()
                          }
                        />
                        <button
                          onClick={handleIPSearch}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          title="Search alerts by IP address"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Second Row */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <Clock className="w-4 h-4 mr-2" />
                        Time Range
                      </label>
                      <select
                        value={filters.dateRange}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            dateRange: parseInt(e.target.value),
                          })
                        }
                        className="w-full py-2.5 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                      >
                        <option value={1}>📅 Last 24 hours</option>
                        <option value={7}>📊 Last 7 days</option>
                        <option value={30}>📈 Last 30 days</option>
                        <option value={90}>📉 Last 90 days</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleExport("json")}
                          disabled={exportLoading}
                          className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          title="Export as JSON format"
                        >
                          {exportLoading ? "..." : "JSON"}
                        </button>
                        <button
                          onClick={() => handleExport("csv")}
                          disabled={exportLoading}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          title="Export as CSV format"
                        >
                          {exportLoading ? "..." : "CSV"}
                        </button>
                      </div>
                    </div>

                    {/* Empty div to maintain grid alignment if needed */}
                    <div className="hidden lg:block"></div>
                  </div>

                  {/* Filter Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      <span className="text-sm font-medium text-gray-700">
                        Active filters:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {filters.severity !== "ALL" && (
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full border border-indigo-200">
                            Severity: {filters.severity}
                          </span>
                        )}
                        {filters.alertType !== "ALL" && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full border border-purple-200">
                            Type: {filters.alertType.replace("_", " ")}
                          </span>
                        )}
                        {searchIP && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full border border-orange-200">
                            IP: {searchIP}
                          </span>
                        )}
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full border border-gray-200">
                          Range: {filters.dateRange} days
                        </span>
                        {(filters.severity !== "ALL" ||
                          filters.alertType !== "ALL" ||
                          searchIP) && (
                          <button
                            onClick={() => {
                              setFilters({
                                severity: "ALL",
                                alertType: "ALL",
                                dateRange: filters.dateRange,
                              });
                              setSearchIP("");
                            }}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full border border-red-200 transition-colors"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alerts List */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Security Alerts ({filteredAlerts.length})
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Filtered</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {filteredAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(
                                    alert.severity
                                  )}`}
                                >
                                  {alert.severity}
                                </span>
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  {alert.alertType}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(alert.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <h4 className="text-lg font-medium text-gray-900 mb-1">
                                {alert.title}
                              </h4>
                              <p className="text-gray-600 mb-2">
                                {alert.description}
                              </p>
                              {alert.sourceIp && (
                                <p className="text-sm text-gray-500">
                                  Source IP:{" "}
                                  <span className="font-mono">
                                    {alert.sourceIp}
                                  </span>
                                </p>
                              )}
                              {alert.details && (
                                <details className="mt-2">
                                  <summary className="text-sm text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors">
                                    View Details
                                  </summary>
                                  <div className="mt-2 text-xs bg-gray-100 p-3 rounded-lg overflow-hidden">
                                    <pre className="whitespace-pre-wrap break-words overflow-x-auto max-w-full">
                                      {alert.details}
                                    </pre>
                                  </div>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredAlerts.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500">
                            No alerts match the current filters.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Intelligence Tab */}
            {activeTab === "intelligence" && (
              <motion.div
                key="intelligence"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Intelligence Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Threat Sources"
                    value={threatIntel?.uniqueThreatSources || 0}
                    icon={Globe}
                    color="orange"
                    isLoading={!threatIntel}
                  />
                  <StatCard
                    title="Total Threats"
                    value={threatIntel?.totalThreats || 0}
                    icon={AlertTriangle}
                    color="red"
                    isLoading={!threatIntel}
                  />
                  <StatCard
                    title="Risk Level"
                    value={threatIntel?.riskLevel || "Unknown"}
                    icon={Shield}
                    color="purple"
                    isLoading={!threatIntel}
                  />
                </div>

                {/* Threat Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Attack Types Distribution
                      </h3>
                    </div>
                    <div className="p-6">
                      {threatIntel && threatChartData.length > 0 ? (
                        <ThreatChart data={threatChartData} height={300} />
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No threat data available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Attack Types Breakdown
                      </h3>
                    </div>
                    <div className="p-6">
                      {threatIntel ? (
                        <div className="space-y-4">
                          {Object.entries(threatIntel.attackTypes || {}).map(
                            ([type, count]) => (
                              <div
                                key={type}
                                className="flex items-center justify-between"
                              >
                                <span className="text-sm font-medium text-gray-700">
                                  {type.replace("_", " ")}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-red-500 h-2 rounded-full"
                                      style={{
                                        width: `${
                                          (count / threatIntel.totalThreats) *
                                          100
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {count}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <LoadingSpinner />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Metrics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Alerts"
                    value={metrics?.totalAlerts || 0}
                    icon={AlertTriangle}
                    color="blue"
                    isLoading={!metrics}
                  />
                  <StatCard
                    title="Daily Average"
                    value={metrics?.averageAlertsPerDay?.toFixed(1) || "0.0"}
                    icon={TrendingUp}
                    color="green"
                    isLoading={!metrics}
                  />
                  <StatCard
                    title="Critical Count"
                    value={metrics?.alertsBySeverity?.CRITICAL || 0}
                    icon={Shield}
                    color="red"
                    isLoading={!metrics}
                  />
                  <StatCard
                    title="Threat Sources"
                    value={metrics?.topThreatSources?.length || 0}
                    icon={Globe}
                    color="orange"
                    isLoading={!metrics}
                  />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Alert Trends
                      </h3>
                    </div>
                    <div className="p-6">
                      {metrics && metricsChartData.length > 0 ? (
                        <MetricsChart data={metricsChartData} height={300} />
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">
                            No metrics data available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Alerts by Severity
                      </h3>
                    </div>
                    <div className="p-6">
                      {metrics ? (
                        <div className="space-y-4">
                          {Object.entries(metrics.alertsBySeverity || {}).map(
                            ([severity, count]) => (
                              <div
                                key={severity}
                                className="flex items-center justify-between"
                              >
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(
                                    severity
                                  )}`}
                                >
                                  {severity}
                                </span>
                                <span className="text-sm font-medium">
                                  {count}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <LoadingSpinner />
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Threat Sources */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Top Threat Sources
                    </h3>
                  </div>
                  <div className="p-6">
                    {metrics && metrics.topThreatSources?.length > 0 ? (
                      <div className="space-y-4">
                        {metrics.topThreatSources.map((source, index) => (
                          <div
                            key={source.ip}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <span className="text-lg font-bold text-gray-400">
                                #{index + 1}
                              </span>
                              <div>
                                <p className="font-mono text-sm font-medium">
                                  {source.ip}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-red-600">
                                {source.count}
                              </p>
                              <p className="text-xs text-gray-500">attacks</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          No threat source data available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Settings Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed bottom-6 right-6 bg-white shadow-xl rounded-xl border border-gray-200 p-4 z-30"
      >
        <div className="flex items-center space-x-2 mb-3">
          <Settings className="w-4 h-4 text-gray-600" />
          <h4 className="text-sm font-medium text-gray-900">Auto-Refresh</h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label className="text-sm text-gray-700">Enable auto-refresh</label>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Interval</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="w-full text-sm rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              disabled={!autoRefresh}
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SecurityDashboard;
