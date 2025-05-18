import React from "react";
import { Shield, AlertTriangle, Users, Lock, Zap, CheckCircle } from "lucide-react";

const SecurityOverview = ({ data = null }) => {
  // Use mock data if no real data is provided
  const securityData = data || {
    securityScore: 87,
    activeSessions: 42,
    pendingAlerts: 3,
    vulnerabilities: {
      critical: 1,
      high: 2,
      medium: 5,
      low: 8,
    },
    lastScan: "2025-05-12T15:30:00Z",
    complianceStatus: {
      passed: 18,
      failed: 2,
      warning: 3,
    },
    twoFactorStatus: {
      enabled: 38,
      disabled: 12,
      percentage: 76,
    },
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Security Score Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Security Score</h3>
            <Shield className="h-6 w-6 text-indigo-500" />
          </div>
          <div className="px-6 py-8 flex flex-col items-center">
            <div className={`text-5xl font-bold ${getScoreColor(securityData.securityScore)}`}>
              {securityData.securityScore}
            </div>
            <div className="mt-2 text-sm text-gray-500">out of 100</div>
            <div className="w-full mt-4 bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  securityData.securityScore >= 90
                    ? "bg-green-500"
                    : securityData.securityScore >= 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${securityData.securityScore}%` }}
              ></div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Last updated: {formatDate(securityData.lastScan)}
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <div className="px-6 py-8 flex flex-col items-center">
            <div className="text-5xl font-bold text-blue-600">{securityData.activeSessions}</div>
            <div className="mt-2 text-sm text-gray-500">current users</div>
            <div className="mt-4 flex justify-between w-full">
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">
                  {securityData.twoFactorStatus.enabled}
                </div>
                <div className="text-xs text-gray-500">2FA Enabled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-red-600">
                  {securityData.twoFactorStatus.disabled}
                </div>
                <div className="text-xs text-gray-500">2FA Disabled</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Alerts */}
        <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Pending Alerts</h3>
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div className="px-6 py-8 flex flex-col items-center">
            <div
              className={`text-5xl font-bold ${
                securityData.pendingAlerts > 0 ? "text-amber-600" : "text-green-600"
              }`}
            >
              {securityData.pendingAlerts}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {securityData.pendingAlerts === 0
                ? "No pending alerts"
                : securityData.pendingAlerts === 1
                ? "Alert requires attention"
                : "Alerts require attention"}
            </div>
            
            {securityData.pendingAlerts > 0 && (
              <button className="mt-4 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md text-sm font-medium transition-colors flex items-center">
                <Zap className="h-4 w-4 mr-2" /> View Alerts
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vulnerabilities Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Vulnerabilities</h3>
            <Lock className="h-6 w-6 text-gray-500" />
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-red-50">
                <div className="text-2xl font-bold text-red-600">{securityData.vulnerabilities.critical}</div>
                <div className="text-xs text-red-600 font-medium">Critical</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-50">
                <div className="text-2xl font-bold text-orange-600">{securityData.vulnerabilities.high}</div>
                <div className="text-xs text-orange-600 font-medium">High</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-amber-50">
                <div className="text-2xl font-bold text-amber-600">{securityData.vulnerabilities.medium}</div>
                <div className="text-xs text-amber-600 font-medium">Medium</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">{securityData.vulnerabilities.low}</div>
                <div className="text-xs text-blue-600 font-medium">Low</div>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="text-sm font-medium mb-2 text-gray-700">Vulnerability Trend</div>
              <div className="h-16 bg-gray-100 rounded flex items-end">
                {/* Simple mock chart bars */}
                <div className="h-4/6 w-1/7 bg-red-400 mx-1"></div>
                <div className="h-5/6 w-1/7 bg-red-400 mx-1"></div>
                <div className="h-3/6 w-1/7 bg-red-400 mx-1"></div>
                <div className="h-4/6 w-1/7 bg-red-400 mx-1"></div>
                <div className="h-2/6 w-1/7 bg-red-400 mx-1"></div>
                <div className="h-1/6 w-1/7 bg-red-400 mx-1"></div>
                <div className="h-1/6 w-1/7 bg-red-400 mx-1"></div>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex justify-between">
                <span>7 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Compliance Status</h3>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative h-32 w-32">
                <svg className="h-32 w-32" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-green-500"
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    strokeDasharray={`${
                      ((securityData.complianceStatus.passed /
                        (securityData.complianceStatus.passed +
                          securityData.complianceStatus.failed +
                          securityData.complianceStatus.warning)) *
                        251.2) 
                    } 251.2`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-gray-700">
                  {Math.round(
                    (securityData.complianceStatus.passed /
                      (securityData.complianceStatus.passed +
                        securityData.complianceStatus.failed +
                        securityData.complianceStatus.warning)) *
                      100
                  )}%
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-green-600">
                  {securityData.complianceStatus.passed}
                </div>
                <div className="text-xs text-gray-600">Passed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-amber-600">
                  {securityData.complianceStatus.warning}
                </div>
                <div className="text-xs text-gray-600">Warning</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">
                  {securityData.complianceStatus.failed}
                </div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
            </div>
            
            <div className="mt-6 text-right">
              <button className="px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors">
                View Compliance Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Status Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-6 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication Status</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0 md:mr-8">
              <div className="relative h-32 w-32">
                <svg className="h-32 w-32" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-indigo-500"
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    strokeDasharray={`${(securityData.twoFactorStatus.percentage * 251.2) / 100} 251.2`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-gray-700">
                  {securityData.twoFactorStatus.percentage}%
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Users with 2FA enabled</span>
                    <span className="text-sm font-medium text-gray-700">
                      {securityData.twoFactorStatus.enabled}/{securityData.twoFactorStatus.enabled + securityData.twoFactorStatus.disabled}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${securityData.twoFactorStatus.percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Admin users with 2FA</span>
                    <span className="text-sm font-medium text-gray-700">5/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Regular users with 2FA</span>
                    <span className="text-sm font-medium text-gray-700">
                      {securityData.twoFactorStatus.enabled - 5}/{securityData.twoFactorStatus.enabled + securityData.twoFactorStatus.disabled - 5}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full" 
                      style={{ 
                        width: `${((securityData.twoFactorStatus.enabled - 5) / 
                                 (securityData.twoFactorStatus.enabled + 
                                  securityData.twoFactorStatus.disabled - 5)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Enforce 2FA for All Users
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                  View Detailed Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityOverview;