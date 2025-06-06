import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "../Components/Common/LoadingSpinner";
import alertsService from '../services/alertsService';

const SecurityDashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [threatIntel, setThreatIntel] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    severity: 'ALL',
    alertType: 'ALL',
    dateRange: 7
  });
  const [searchIP, setSearchIP] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [exportLoading, setExportLoading] = useState(false);

  const { user } = useAuth();
  const { showErrorToast } = useToast();
  const navigate = useNavigate();

  // Load initial data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboard, todayAlerts, activeIncidents, intelligence, securityMetrics] = await Promise.all([
        alertsService.getSecurityDashboard(),
        alertsService.getTodayAlerts(),
        alertsService.getActiveIncidents(),
        alertsService.getThreatIntelligence(),
        alertsService.getSecurityMetrics(filters.dateRange)
      ]);

      setDashboardData(dashboard);
      setAlerts(todayAlerts);
      setIncidents(activeIncidents);
      setThreatIntel(intelligence);
      setMetrics(securityMetrics);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError("Failed to load security information. Please try again.");
      showErrorToast("Failed to load security information");
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange, showErrorToast]);

  // Initial load and auto-refresh setup
  useEffect(() => {
    loadDashboardData();

    let cleanup;
    if (autoRefresh) {
      cleanup = alertsService.startAlertPolling((newAlerts) => {
        setAlerts(newAlerts);
        setLastRefresh(new Date());
      }, refreshInterval * 1000);
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [loadDashboardData, autoRefresh, refreshInterval]);

  // Filter alerts based on current filters
  const filteredAlerts = alerts.filter(alert => {
    const severityMatch = filters.severity === 'ALL' || alert.severity === filters.severity;
    const typeMatch = filters.alertType === 'ALL' || alert.alertType === filters.alertType;
    return severityMatch && typeMatch;
  });

  // Handle incident resolution
  const handleResolveIncident = async (incidentId) => {
    try {
      await alertsService.resolveIncident(incidentId);
      setIncidents(prev => prev.filter(incident => incident.id !== incidentId));
    } catch (error) {
      console.error('Failed to resolve incident:', error);
    }
  };

  // Handle IP search
  const handleIPSearch = async () => {
    if (!searchIP.trim()) return;
    try {
      const ipAlerts = await alertsService.searchAlertsByIP(searchIP);
      setAlerts(ipAlerts);
    } catch (error) {
      console.error('Failed to search by IP:', error);
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
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        format
      );

      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-alerts-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-alerts-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setExportLoading(false);
    }
  };

  // Severity color mapping
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/")}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Security Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {autoRefresh ? 'Live' : 'Paused'} • Last: {lastRefresh.toLocaleTimeString()}
                </span>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  autoRefresh ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {autoRefresh ? 'Pause' : 'Resume'}
              </button>
            </div>
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
              {[
                { id: 'overview', name: 'Security Overview' },
                { id: 'alerts', name: 'Alerts & Incidents' },
                { id: 'incidents', name: 'Active Incidents' },
                { id: 'intelligence', name: 'Threat Intelligence' },
                { id: 'analytics', name: 'Analytics' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.name}
                </button>
              ))}
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
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                            <span className="text-white text-sm font-bold">📊</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Alerts</dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {dashboardData?.summary?.totalAlerts || 0}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                            <span className="text-white text-sm font-bold">🚨</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Critical Alerts</dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {dashboardData?.summary?.criticalAlerts || 0}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                            <span className="text-white text-sm font-bold">🔥</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Active Incidents</dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {incidents.length}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 ${getRiskLevelColor(threatIntel?.riskLevel)} rounded-md flex items-center justify-center`}>
                            <span className="text-white text-sm font-bold">⚡</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Risk Level</dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {threatIntel?.riskLevel || 'Unknown'}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Alerts */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Security Alerts</h3>
                    <div className="space-y-3">
                      {dashboardData?.recentAlerts?.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                              <p className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          {alert.sourceIp && (
                            <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                              {alert.sourceIp}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Severity</label>
                      <select
                        value={filters.severity}
                        onChange={(e) => setFilters({...filters, severity: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="ALL">All Severities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Alert Type</label>
                      <select
                        value={filters.alertType}
                        onChange={(e) => setFilters({...filters, alertType: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="ALL">All Types</option>
                        <option value="BRUTE_FORCE">Brute Force</option>
                        <option value="DATA_EXFILTRATION">Data Exfiltration</option>
                        <option value="MALICIOUS_FILE">Malicious File</option>
                        <option value="PATH_TRAVERSAL">Path Traversal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Search by IP</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          value={searchIP}
                          onChange={(e) => setSearchIP(e.target.value)}
                          placeholder="192.168.1.1"
                          className="flex-1 rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleIPSearch}
                          className="relative -ml-px inline-flex items-center px-4 py-2 border border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-r-md"
                        >
                          🔍
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Actions</label>
                      <div className="mt-1 flex space-x-2">
                        <button
                          onClick={() => handleExport('json')}
                          disabled={exportLoading}
                          className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Export JSON
                        </button>
                        <button
                          onClick={() => handleExport('csv')}
                          disabled={exportLoading}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          Export CSV
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alerts List */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Security Alerts ({filteredAlerts.length})
                    </h3>
                    <div className="space-y-4">
                      {filteredAlerts.map((alert) => (
                        <div key={alert.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                                  {alert.severity}
                                </span>
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  {alert.alertType}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(alert.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <h4 className="text-lg font-medium text-gray-900 mb-1">{alert.title}</h4>
                              <p className="text-gray-600 mb-2">{alert.description}</p>
                              {alert.sourceIp && (
                                <p className="text-sm text-gray-500">Source IP: <span className="font-mono">{alert.sourceIp}</span></p>
                              )}
                              {alert.details && (
                                <details className="mt-2">
                                  <summary className="text-sm text-indigo-600 cursor-pointer">View Details</summary>
                                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">{alert.details}</pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredAlerts.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No alerts match the current filters.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Incidents Tab */}
            {activeTab === 'incidents' && (
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Active Security Incidents ({incidents.length})
                    </h3>
                    <div className="space-y-6">
                      {incidents.map((incident) => (
                        <div key={incident.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSeverityColor(incident.severity)}`}>
                                  {incident.severity}
                                </span>
                                <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                  {incident.status}
                                </span>
                              </div>
                              <h4 className="text-xl font-semibold text-gray-900">{incident.title}</h4>
                              <p className="text-gray-600 mt-1">{incident.description}</p>
                            </div>
                            <button
                              onClick={() => handleResolveIncident(incident.id)}
                              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                            >
                              Resolve
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Affected Systems</h5>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {incident.affectedSystems?.map((system, index) => (
                                  <li key={index} className="flex items-center">
                                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                                    {system}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Recommended Actions</h5>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {incident.recommendedActions?.map((action, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 mt-1.5"></span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                              Created: {new Date(incident.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {incidents.length === 0 && (
                        <div className="text-center py-8">
                          <div className="text-6xl mb-4">✅</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Incidents</h3>
                          <p className="text-gray-500">All security incidents have been resolved.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Threat Intelligence Tab */}
            {activeTab === 'intelligence' && threatIntel && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Threat Sources</h3>
                    <div className="text-3xl font-bold text-indigo-600">{threatIntel.uniqueThreatSources}</div>
                    <p className="text-sm text-gray-600">Unique IP addresses</p>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Total Threats</h3>
                    <div className="text-3xl font-bold text-red-600">{threatIntel.totalThreats}</div>
                    <p className="text-sm text-gray-600">Security events detected</p>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Level</h3>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(threatIntel.riskLevel)}`}>
                      {threatIntel.riskLevel}
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Attack Types Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(threatIntel.attackTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{type.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{width: `${(count / threatIntel.totalThreats) * 100}%`}}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && metrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500">Total Alerts</h3>
                    <div className="text-2xl font-bold text-gray-900">{metrics.totalAlerts}</div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500">Daily Average</h3>
                    <div className="text-2xl font-bold text-gray-900">{metrics.averageAlertsPerDay?.toFixed(1)}</div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500">Critical Alerts</h3>
                    <div className="text-2xl font-bold text-red-600">{metrics.alertsBySeverity?.CRITICAL || 0}</div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500">High Alerts</h3>
                    <div className="text-2xl font-bold text-orange-600">{metrics.alertsBySeverity?.HIGH || 0}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Alerts by Severity</h3>
                    <div className="space-y-3">
                      {Object.entries(metrics.alertsBySeverity || {}).map(([severity, count]) => (
                        <div key={severity} className="flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(severity)}`}>
                            {severity}
                          </span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Top Threat Sources</h3>
                    <div className="space-y-3">
                      {metrics.topThreatSources?.map((source, index) => (
                        <div key={source.ip} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">#{index + 1}</span>
                            <span className="font-mono text-sm">{source.ip}</span>
                          </div>
                          <span className="text-sm font-medium text-red-600">{source.count} attacks</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Alert Trend</h3>
                  <div className="space-y-2">
                    {Object.entries(metrics.alertsByDay || {}).map(([date, count]) => (
                      <div key={date} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{date}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{width: `${(count / Math.max(...Object.values(metrics.alertsByDay))) * 100}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Settings Panel */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-white shadow-lg rounded-lg p-4 border">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Auto-Refresh Settings</h4>
          <div className="space-y-2">
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
              <label className="block text-xs text-gray-500">Interval (seconds)</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="mt-1 block w-full text-sm rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                disabled={!autoRefresh}
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;