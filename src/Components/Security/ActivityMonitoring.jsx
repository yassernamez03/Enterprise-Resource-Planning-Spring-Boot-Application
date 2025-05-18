import React, { useState, useEffect } from "react";
import { Activity, Filter, UserX, AlertTriangle, Search, Clock } from "lucide-react";
import EmptyState from "../../Components/Common/EmptyState";
import LoadingSpinner from "../../Components/Common/LoadingSpinner";
import securityService from "../../services/securityService";

const ActivityMonitoring = () => {
  const [userActivities, setUserActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });
  const [suspiciousCount, setSuspiciousCount] = useState(0);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        // In a real implementation this would fetch real user activity data
        const data = await securityService.getUserActivities();
        setUserActivities(data);
        
        // Count suspicious activities
        const suspiciousActivities = data.filter(
          (activity) => activity.riskLevel === "high" || activity.flags?.length > 0
        );
        setSuspiciousCount(suspiciousActivities.length);
      } catch (err) {
        console.error("Error fetching user activities:", err);
        setError("Failed to load user activities. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const filteredActivities = userActivities.filter((activity) => {
    // Filter by search term
    const matchesSearch = 
      (activity.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.userAgent?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by category
    const matchesCategory = 
      activeFilter === "all" || 
      (activeFilter === "suspicious" && 
        (activity.riskLevel === "high" || activity.flags?.length > 0)) ||
      (activeFilter === "auth" && activity.category === "auth") ||
      (activeFilter === "data" && activity.category === "data");
    
    // Filter by date range
    let matchesDateRange = true;
    const activityDate = new Date(activity.timestamp);
    
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      matchesDateRange = matchesDateRange && activityDate >= fromDate;
    }
    
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      matchesDateRange = matchesDateRange && activityDate <= toDate;
    }
    
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  const getRiskBadgeStyle = (riskLevel) => {
    switch (riskLevel) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleInvestigate = (activityId) => {
    // In a real implementation, this would open a detailed investigation view
    console.log("Investigating activity:", activityId);
  };

  const handleBlock = (activityId, userName) => {
    // In a real implementation, this would block the user or IP
    console.log("Blocking user/IP for activity:", activityId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" text="Loading user activities..." />
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
          <Activity className="h-6 w-6 text-indigo-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">User Activity Monitoring</h3>
          {suspiciousCount > 0 && (
            <span className="ml-2 px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium animate-pulse">
              {suspiciousCount} suspicious
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white 
                        placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search activities"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Activities</option>
              <option value="suspicious">Suspicious Only</option>
              <option value="auth">Authentication</option>
              <option value="data">Data Access</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
        </div>
      )}

      {/* Activity Tabs */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
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
            onClick={() => setActiveFilter("suspicious")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === "suspicious"
                ? "bg-red-100 text-red-800"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            Suspicious
          </button>
          <button
            onClick={() => setActiveFilter("auth")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === "auth"
                ? "bg-blue-100 text-blue-800"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            Authentication
          </button>
          <button
            onClick={() => setActiveFilter("data")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === "data"
                ? "bg-green-100 text-green-800"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            Data Access
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      {filteredActivities.length > 0 ? (
        <div className="divide-y divide-gray-200 max-h-[calc(100vh-350px)] overflow-y-auto">
          {filteredActivities.map((activity) => (
            <div 
              key={activity.id} 
              className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                activity.riskLevel === "high" ? "bg-red-50" : ""
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-1">
                  {activity.category === "auth" ? (
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                      <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{activity.userName}</p>
                    <div className="flex items-center">
                      {activity.riskLevel && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeStyle(activity.riskLevel)}`}>
                          {activity.riskLevel.charAt(0).toUpperCase() + activity.riskLevel.slice(1)} Risk
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {activity.action}
                  </p>
                  <div className="mt-2 flex items-center justify-between flex-wrap gap-y-2">
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                      <span>IP: {activity.ipAddress}</span>
                    </div>
                    
                    {(activity.riskLevel === "high" || activity.flags?.length > 0) && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleInvestigate(activity.id)}
                          className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium hover:bg-indigo-200 transition-colors"
                        >
                          Investigate
                        </button>
                        <button
                          onClick={() => handleBlock(activity.id, activity.userName)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                        >
                          Block User
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {activity.flags?.length > 0 && (
                    <div className="mt-2 bg-red-50 px-3 py-2 rounded-md">
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-red-800">Suspicious Activity Flags:</p>
                          <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
                            {activity.flags.map((flag, index) => (
                              <li key={index}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<UserX className="h-12 w-12 text-gray-400" />}
          title="No activities found"
          message="There are no user activities matching your criteria."
        />
      )}
    </div>
  );
};

export default ActivityMonitoring;