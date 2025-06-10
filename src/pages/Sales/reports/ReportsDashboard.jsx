import React, { useState, useEffect } from "react"
import reportService from "../../../services/Sales/reportService"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import { Calendar, Download, BarChart2, Loader } from "lucide-react"

const COLORS = [
  "#2563EB",
  "#0D9488",
  "#EAB308",
  "#EF4444",
  "#8B5CF6",
  "#EC4899"
]

const ReportsDashboard = () => {  const [dateRange, setDateRange] = useState({
    startDate: "2025-01-01",
    endDate: "2025-12-31"
  });
  const [activeReport, setActiveReport] = useState("client-spending");
  const [clientData, setClientData] = useState([])
  const [revenueTrends, setRevenueTrends] = useState([])
  const [periodFilter, setPeriodFilter] = useState("monthly")
  
  // Individual loading states for each report type
  const [loadingStates, setLoadingStates] = useState({
    "client-spending": false,
    "revenue-trends": false,
    exporting: false
  })
  const [error, setError] = useState(null)
  useEffect(() => {
    loadReportData()
  }, [dateRange, activeReport, periodFilter])

  const loadReportData = async () => {
    setError(null)
    
    // Set loading state for the active report
    setLoadingStates(prev => ({ ...prev, [activeReport]: true }))
      try {
      switch (activeReport) {
        case "client-spending":
          const clientSpending = await reportService.getClientSpending(dateRange)
          setClientData(clientSpending)
          break
        case "revenue-trends":
          const trends = await reportService.getRevenueTrends(periodFilter, dateRange)
          setRevenueTrends(trends)
          break
      }
    } catch (err) {
      console.error("Error loading report data:", err)
      setError(`Failed to load ${activeReport.replace('-', ' ')} report`)
    } finally {
      setLoadingStates(prev => ({ ...prev, [activeReport]: false }))
    }
  }

  const handleDateChange = e => {
    const { name, value } = e.target
    setDateRange(prev => ({ ...prev, [name]: value }))
  }
  
  const handleExportData = async () => {
    setLoadingStates(prev => ({ ...prev, exporting: true }))
    try {
      // The reportService.exportReportData already handles the download internally
        // It returns a success/error object, not a blob
      const result = await reportService.exportReportData(activeReport, dateRange)
      
      if (result.success) {
        // Success message could be shown here if needed
        console.log(result.message)
      } else {
        throw new Error(result.message || 'Export failed')
      }
      
    } catch (err) {
      console.error(err)
      setError("Failed to export data: " + (err.message || err))
    } finally {
      setLoadingStates(prev => ({ ...prev, exporting: false }))
    }
  }
  const handlePeriodFilterChange = (period) => {
    setPeriodFilter(period)
  }

  const renderClientSpending = () => {
    if (clientData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No client data available for the selected period.
        </div>
      )
    }

    // Sort by total spent
    const sortedClientData = [...clientData].sort(
      (a, b) => b.totalSpent - a.totalSpent
    )
    const topClients = sortedClientData.slice(0, 5)

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Top Clients by Spending
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topClients}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="clientName" />
              <YAxis />
              <Tooltip formatter={value => [`$${value}`, "Total Spent"]} />
              <Legend />
              <Bar dataKey="totalSpent" name="Total Spent ($)" fill="#0D9488" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Average Order Value
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topClients}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="clientName" />
              <YAxis />
              <Tooltip formatter={value => [`$${value}`, "Average Order"]} />
              <Legend />
              <Bar
                dataKey="averageOrderValue"
                name="Avg. Order ($)"
                fill="#EAB308"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Client Spending Overview
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Order Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedClientData.map(client => (
                  <tr key={client.clientId}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {client.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      ${client.totalSpent.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                      {client.orderCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      ${client.averageOrderValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )  }

  const renderRevenueTrends = () => {
    if (revenueTrends.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No revenue trend data available for the selected period.
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-800">
              Revenue Trends
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePeriodFilterChange("weekly")}
                className={`px-3 py-1 rounded-md text-sm ${
                  periodFilter === "weekly"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => handlePeriodFilterChange("monthly")}
                className={`px-3 py-1 rounded-md text-sm ${
                  periodFilter === "monthly"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => handlePeriodFilterChange("quarterly")}
                className={`px-3 py-1 rounded-md text-sm ${
                  periodFilter === "quarterly"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Quarterly
              </button>
              <button
                onClick={() => handlePeriodFilterChange("yearly")}
                className={`px-3 py-1 rounded-md text-sm ${
                  periodFilter === "yearly"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value, name) => {
                if (name === "revenue") return [`$${value.toLocaleString()}`, "Revenue"];
                if (name === "growth") return [`${value}%`, "Growth"];
                return [value, name];
              }} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue ($)"
                stroke="#2563EB"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="growth"
                name="Growth (%)"
                stroke="#10B981"
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Revenue Data
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueTrends.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {item.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      ${item.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                      {item.orderCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span 
                        className={`font-medium ${
                          item.growth >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {item.growth >= 0 ? "+" : ""}{item.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
  
  const renderActiveReport = () => {    switch (activeReport) {
      case "client-spending":
        return renderClientSpending()
      case "revenue-trends":
        return renderRevenueTrends()
      default:
        return null
    }
  }

  // Create a loading indicator component for each report section
  const renderLoadingIndicator = () => (
    <div className="flex justify-center py-10">
      <div className="flex items-center">
        <BarChart2 size={20} className="mr-2 animate-pulse text-blue-600" />
        <span>Loading {activeReport.replace(/-/g, ' ')} data...</span>
      </div>
    </div>
  )

  // Create an export button with loading state
  const renderExportButton = () => (
    <button
      onClick={handleExportData}
      disabled={loadingStates.exporting}
      className="flex items-center px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm disabled:opacity-50"
    >
      {loadingStates.exporting ? (
        <Loader size={16} className="mr-1 animate-spin" />
      ) : (
        <Download size={16} className="mr-1" />
      )}
      {loadingStates.exporting ? "Exporting..." : "Export"}
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>

          <div className="flex flex-wrap items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center space-x-2">
              <Calendar size={18} className="text-gray-600" />
              <div className="flex space-x-2">
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-gray-600">to</span>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {renderExportButton()}
          </div>
        </div>        <div className="flex flex-wrap gap-2 mb-6">          <button
            onClick={() => setActiveReport("client-spending")}
            className={`px-4 py-2 rounded-md ${
              activeReport === "client-spending"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            Client Spending
          </button>
          <button
            onClick={() => setActiveReport("revenue-trends")}
            className={`px-4 py-2 rounded-md ${
              activeReport === "revenue-trends"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            Revenue Trends
          </button>
        </div>

        {loadingStates[activeReport] ? (
          renderLoadingIndicator()
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded-md">{error}</div>
        ) : (
          renderActiveReport()
        )}
      </div>
    </div>
  )
}

export default ReportsDashboard
