import React, { useState, useEffect } from "react";
import { CheckCircle, Shield, AlertTriangle, Download } from "lucide-react";
import LoadingSpinner from "../../Components/Common/LoadingSpinner";
import securityService from "../../services/securityService";

const ComplianceDashboard = () => {
  const [complianceData, setComplianceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFramework, setActiveFramework] = useState("gdpr");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchComplianceData = async () => {
      setLoading(true);
      try {
        // In a real application, this would fetch actual compliance data
        const data = await securityService.getComplianceData();
        setComplianceData(data);
      } catch (err) {
        console.error("Error fetching compliance data:", err);
        setError("Failed to load compliance information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchComplianceData();
  }, []);

  const handleGenerateReport = () => {
    // In a real implementation, this would generate a compliance report
    setSelectedReport({
      id: "rep-" + Date.now(),
      name: `${activeFramework.toUpperCase()} Compliance Report`,
      date: new Date().toISOString(),
      format: "PDF",
      size: "2.4 MB"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" text="Loading compliance data..." />
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

  // Use mock data if no real data is provided
  const data = complianceData || {
    frameworks: {
      gdpr: {
        score: 92,
        lastAssessment: "2025-05-10T14:30:00Z",
        passingControls: 45,
        totalControls: 49,
        categories: [
          { name: "Data Protection", compliance: 95 },
          { name: "User Consent", compliance: 90 },
          { name: "Data Access", compliance: 85 },
          { name: "Data Retention", compliance: 95 },
          { name: "Breach Notification", compliance: 100 },
          { name: "Data Processing", compliance: 92 },
        ],
      },
      hipaa: {
        score: 88,
        lastAssessment: "2025-05-05T10:15:00Z",
        passingControls: 62,
        totalControls: 70,
        categories: [
          { name: "Privacy Rule", compliance: 90 },
          { name: "Security Rule", compliance: 85 },
          { name: "Breach Notification", compliance: 100 },
          { name: "Access Controls", compliance: 80 },
          { name: "Risk Assessment", compliance: 90 },
          { name: "Data Encryption", compliance: 85 },
        ],
      },
      soc2: {
        score: 94,
        lastAssessment: "2025-04-28T09:45:00Z",
        passingControls: 112,
        totalControls: 118,
        categories: [
          { name: "Security", compliance: 95 },
          { name: "Availability", compliance: 92 },
          { name: "Processing Integrity", compliance: 96 },
          { name: "Confidentiality", compliance: 94 },
          { name: "Privacy", compliance: 90 },
        ],
      },
    },
    recentReports: [
      {
        id: "rep-001",
        name: "GDPR Quarterly Audit",
        date: "2025-04-15T10:30:00Z",
        format: "PDF",
        size: "3.2 MB"
      },
      {
        id: "rep-002",
        name: "HIPAA Compliance Check",
        date: "2025-03-22T14:15:00Z",
        format: "PDF",
        size: "2.8 MB"
      },
      {
        id: "rep-003",
        name: "SOC2 Annual Assessment",
        date: "2025-01-10T09:45:00Z",
        format: "PDF",
        size: "5.1 MB"
      }
    ]
  };

  const activeData = data.frameworks[activeFramework];
  const complianceScore = activeData.score;
  
  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };
  
  const getScoreBgColor = (score) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Framework Selection */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Compliance Frameworks</h3>
          <Shield className="h-6 w-6 text-indigo-500" />
        </div>
        <div className="p-6">
          <div className="flex overflow-x-auto space-x-4 pb-2">
            <button
              onClick={() => setActiveFramework("gdpr")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0 ${
                activeFramework === "gdpr"
                  ? "bg-indigo-100 text-indigo-800 border-2 border-indigo-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
              }`}
            >
              GDPR
            </button>
            <button
              onClick={() => setActiveFramework("hipaa")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0 ${
                activeFramework === "hipaa"
                  ? "bg-indigo-100 text-indigo-800 border-2 border-indigo-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
              }`}
            >
              HIPAA
            </button>
            <button
              onClick={() => setActiveFramework("soc2")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0 ${
                activeFramework === "soc2"
                  ? "bg-indigo-100 text-indigo-800 border-2 border-indigo-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
              }`}
            >
              SOC2
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0 bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent`}
            >
              ISO 27001
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0 bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent`}
            >
              PCI DSS
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Compliance Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Score */}
        <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {activeFramework.toUpperCase()} Compliance
            </h3>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <div className="px-6 py-8 flex flex-col items-center justify-center">
            <div className="relative h-40 w-40">
              <svg className="h-40 w-40 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className={getScoreBgColor(complianceScore)}
                  strokeWidth="10"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                  strokeDasharray={`${complianceScore * 2.51} 251.2`}
                  strokeDashoffset="0"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className={`text-4xl font-bold ${getScoreColor(complianceScore)}`}>
                  {complianceScore}%
                </div>
                <div className="text-sm text-gray-500">compliant</div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {activeData.passingControls} of {activeData.totalControls} controls passing
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Last assessment: {new Date(activeData.lastAssessment).toLocaleDateString()}
              </p>
            </div>
            
            <button
              onClick={handleGenerateReport}
              className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <CheckCircle className="h-4 w-4 mr-2" /> 
              Generate Compliance Report
            </button>
          </div>
        </div>
        
        {/* Compliance Categories */}
        <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow col-span-1 lg:col-span-2">
          <div className="px-6 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Control Categories
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {activeData.categories.map((category, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {category.name}
                    </span>
                    <span className={`text-sm font-medium ${getScoreColor(category.compliance)}`}>
                      {category.compliance}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`${getScoreBgColor(category.compliance)} h-2.5 rounded-full`}
                      style={{ width: `${category.compliance}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Actions Needed</h4>
              <ul className="space-y-3">
                {complianceScore < 100 && (
                  <>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      </div>
                      <p className="ml-2 text-sm text-gray-600">
                        Update data retention policies to comply with {activeFramework.toUpperCase()} requirements
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      </div>
                      <p className="ml-2 text-sm text-gray-600">
                        Complete documentation for user consent procedures
                      </p>
                    </li>
                  </>
                )}
                {complianceScore === 100 && (
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="ml-2 text-sm text-gray-600">
                      All compliance requirements are currently being met
                    </p>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reports Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-6 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Compliance Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Format
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedReport && (
                <tr className="bg-green-50 animate-fadeIn">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {selectedReport.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(selectedReport.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {selectedReport.format}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {selectedReport.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              )}
              {data.recentReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {report.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(report.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.format}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;