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

const ReportsDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0]
  })

  const [activeReport, setActiveReport] = useState("sales-summary")
  const [salesData, setSalesData] = useState([])
  const [employeeData, setEmployeeData] = useState([])
  const [clientData, setClientData] = useState([])
  const [productData, setProductData] = useState([])
  const [revenueTrends, setRevenueTrends] = useState([])
  const [periodFilter, setPeriodFilter] = useState("monthly")
  
  // Individual loading states for each report type
  const [loadingStates, setLoadingStates] = useState({
    "sales-summary": false,
    "employee-performance": false,
    "client-spending": false,
    "product-sales": false,
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
        case "sales-summary":
          const salesSummary = await reportService.getSalesSummary(dateRange)
          setSalesData(salesSummary)
          break
        case "employee-performance":
          const employeePerformance = await reportService.getEmployeePerformance(dateRange)
          setEmployeeData(employeePerformance)
          break
        case "client-spending":
          const clientSpending = await reportService.getClientSpending(dateRange)
          setClientData(clientSpending)
          break
        case "product-sales":
          const productSales = await reportService.getProductSales(dateRange)
          setProductData(productSales)
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
      const blob = await reportService.exportReportData(activeReport, dateRange)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute(
        "download",
        `${activeReport}-${dateRange.startDate}-to-${dateRange.endDate}.csv`
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url) // Clean up to avoid memory leaks
    } catch (err) {
      console.error(err)
      setError("Failed to export data")
    } finally {
      setLoadingStates(prev => ({ ...prev, exporting: false }))
    }
  }

  const handlePeriodFilterChange = (period) => {
    setPeriodFilter(period)
  }

  const renderSalesSummary = () => {
    if (salesData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No sales data available for the selected period.
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Sales Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalSales"
                name="Total Sales ($)"
                fill="#2563EB"
                stroke="#1E40AF"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Order Count
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalOrders" name="Orders" fill="#0D9488" />
              <Bar dataKey="totalInvoices" name="Invoices" fill="#EAB308" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Quote to Order Conversion Rate
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={value => [`${value}%`, "Conversion Rate"]} />
              <Legend />
              <Line
                type="monotone"
                dataKey="conversionRate"
                name="Conversion Rate (%)"
                stroke="#8B5CF6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  const renderEmployeePerformance = () => {
    if (employeeData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No employee data available for the selected period.
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Revenue by Employee
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={employeeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="employeeName" type="category" width={100} />
              <Tooltip formatter={value => [`$${value}`, "Revenue"]} />
              <Legend />
              <Bar dataKey="totalRevenue" name="Revenue ($)" fill="#2563EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Quote Acceptance Rate
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={employeeData}
                nameKey="employeeName"
                dataKey="quotesAccepted"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {employeeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={value => [value, "Quotes Accepted"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Orders Completed
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotes Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotes Accepted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employeeData.map(employee => (
                  <tr key={employee.employeeId}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {employee.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {employee.quotesCreated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {employee.quotesAccepted} (
                      {employee.quotesCreated > 0
                        ? (
                            (employee.quotesAccepted / employee.quotesCreated) *
                            100
                          ).toFixed(1)
                        : 0}
                      %)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {employee.ordersCompleted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      ${employee.totalRevenue.toFixed(2)}
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
    )
  }

  const renderProductSales = () => {
    if (productData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No product data available for the selected period.
        </div>
      )
    }

    // Sort by revenue
    const sortedProductData = [...productData].sort(
      (a, b) => b.revenue - a.revenue
    )
    const topProducts = sortedProductData.slice(0, 5)

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Top Products by Revenue
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="productName" />
              <YAxis />
              <Tooltip formatter={value => [`$${value}`, "Revenue"]} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue ($)" fill="#2563EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Top Products by Units Sold
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="productName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="unitsSold" name="Units Sold" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Product Performance Overview
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit Margin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProductData.map(product => (
                  <tr key={product.productId}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                      {product.unitsSold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      ${product.revenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      ${product.profit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      {((product.profit / product.revenue) * 100).toFixed(1)}%
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

  const renderActiveReport = () => {
    switch (activeReport) {
      case "sales-summary":
        return renderSalesSummary()
      case "employee-performance":
        return renderEmployeePerformance()
      case "client-spending":
        return renderClientSpending()
      case "product-sales":
        return renderProductSales()
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
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveReport("sales-summary")}
            className={`px-4 py-2 rounded-md ${
              activeReport === "sales-summary"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            Sales Summary
          </button>
          <button
            onClick={() => setActiveReport("employee-performance")}
            className={`px-4 py-2 rounded-md ${
              activeReport === "employee-performance"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            Employee Performance
          </button>
          <button
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
            onClick={() => setActiveReport("product-sales")}
            className={`px-4 py-2 rounded-md ${
              activeReport === "product-sales"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            Product Sales
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
