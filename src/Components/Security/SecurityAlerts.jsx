import React, { useState, useEffect } from "react";
import { Bell, AlertTriangle, ShieldAlert, Search, X } from "lucide-react";
import EmptyState from "../../Components/Common/EmptyState";
import LoadingSpinner from "../../Components/Common/LoadingSpinner";
import securityService from "../../services/securityService";

const SecurityAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        // In a real application, this would fetch actual security alerts
        const data = await securityService.getSecurityAlerts();
        setAlerts(data);
      } catch (err) {
        console.error("Error fetching security alerts:", err);
        setError("Failed to load security alerts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      activeFilter === "all" || 
      (activeFilter === "critical" && alert.severity === "critical") ||
      (activeFilter === "high" && alert.severity === "high") ||
      (activeFilter === "medium" && alert.severity === "medium") ||
      (activeFilter === "low" && alert.severity === "low");
    
    return matchesSearch && matchesFilter;
  });

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      // Mark alert as resolved
      await securityService.resolveAlert(alertId);
      
      // Update the alerts list
      setAlerts(
        alerts.map((alert) =>
          alert.id === alertId ? { ...alert, status: "resolved" } : alert
        )
      );
      
      // Close the detail view if the resolved alert was selected
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert({ ...selectedAlert, status: "resolved" });
      }
    } catch (err) {
      console.error("Error resolving alert:", err);
    }
  };

  const handleIgnoreAlert = async (alertId) => {
    try {
      // Mark alert as ignored
      await securityService.ignoreAlert(alertId);
      
      // Update the alerts list
      setAlerts(
        alerts.map((alert) =>
          alert.id === alertId ? { ...alert, status: "ignored" } : alert
        )
      );
      
      // Close the detail view if the ignored alert was selected
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert({ ...selectedAlert, status: "ignored" });
      }
    } catch (err) {
      console.error("Error ignoring alert:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" text="Loading security alerts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden animate-fadeIn">
      <div className="px-6 py-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center">
          <Bell className="h-6 w-6 text-indigo-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Security Alerts</h3>
          <span className="ml-2 px-2.5 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {filteredAlerts.filter(a => a.status === "pending").length} pending
          </span>
        </div>

        <div className="relative flex-grow md:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white 
                      placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search alerts"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-3">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-indigo-100 text-indigo-800"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("critical")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === "critical"
                ? "bg-red-100 text-red-800"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setActiveFilter("high")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === "high"
                ? "bg-orange-100 text-orange-800"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            High
          </button>
          <button
            onClick={() => setActiveFilter("medium")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === "medium"
                ? "bg-amber-100 text-amber-800"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => setActiveFilter("low")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === "low"
                ? "bg-blue-100 text-blue-800"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            Low
          </button>
        </div>
      </div>

      {filteredAlerts.length > 0 ? (
        <div className="flex flex-col md:flex-row">
          {/* Alerts List */}
          <div className={`${selectedAlert ? "hidden md:block md:w-1/2 lg:w-2/5" : "w-full"} border-r border-gray-200`}>
            <ul className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredAlerts.map((alert) => (
                <li 
                  key={alert.id} 
                  onClick={() => setSelectedAlert(alert)}
                  className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedAlert && selectedAlert.id === alert.id ? "bg-indigo-50" : ""
                  } ${alert.status === "resolved" ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <span 
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${
                          alert.severity === "critical" ? "bg-red-100" :
                          alert.severity === "high" ? "bg-orange-100" :
                          alert.severity === "medium" ? "bg-amber-100" :
                          "bg-blue-100"
                        }`}
                      >
                        <ShieldAlert className={`h-5 w-5 ${
                          alert.severity === "critical" ? "text-red-600" :
                          alert.severity === "high" ? "text-orange-600" :
                          alert.severity === "medium" ? "text-amber-600" :
                          "text-blue-600"
                        }`} />
                      </span>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityStyles(alert.severity)}`}>
                          {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.status === "pending" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : alert.status === "resolved" 
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Alert Details */}
          {selectedAlert ? (
            <div className="md:w-1/2 lg:w-3/5 p-6 animate-fadeIn">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span 
                    className={`inline-flex items-center justify-center h-10 w-10 rounded-full mr-3 ${
                      selectedAlert.severity === "critical" ? "bg-red-100" :
                      selectedAlert.severity === "high" ? "bg-orange-100" :
                      selectedAlert.severity === "medium" ? "bg-amber-100" :
                      "bg-blue-100"
                    }`}
                  >
                    <ShieldAlert className={`h-6 w-6 ${
                      selectedAlert.severity === "critical" ? "text-red-600" :
                      selectedAlert.severity === "high" ? "text-orange-600" :
                      selectedAlert.severity === "medium" ? "text-amber-600" :
                      "text-blue-600"
                    }`} />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedAlert.title}</h2>
                    <div className="flex items-center mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityStyles(selectedAlert.severity)}`}>
                        {selectedAlert.severity.charAt(0).toUpperCase() + selectedAlert.severity.slice(1)}
                      </span>
                      <span className="mx-2 text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {new Date(selectedAlert.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Description</h3>
                  <p className="mt-2 text-sm text-gray-600">{selectedAlert.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">Source</h3>
                  <p className="mt-2 text-sm text-gray-600">{selectedAlert.source}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">Affected Users/Systems</h3>
                  <p className="mt-2 text-sm text-gray-600">{selectedAlert.affectedSystems}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">Recommended Action</h3>
                  <p className="mt-2 text-sm text-gray-600">{selectedAlert.recommendedAction}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">Technical Details</h3>
                  <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
                    {selectedAlert.technicalDetails}
                  </pre>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button 
                  onClick={() => handleIgnoreAlert(selectedAlert.id)}
                  disabled={selectedAlert.status !== "pending"}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ignore Alert
                </button>
                <button 
                  onClick={() => handleResolveAlert(selectedAlert.id)}
                  disabled={selectedAlert.status !== "pending"}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex md:w-1/2 lg:w-3/5 items-center justify-center p-6">
              <div className="text-center">
                <ShieldAlert className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Alert Selected</h3>
                <p className="mt-1 text-sm text-gray-500">Select an alert from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="h-12 w-12 text-gray-400" />}
          title="No alerts found"
          message="There are no security alerts matching your criteria."
        />
      )}
    </div>
  );
};

export default SecurityAlerts;