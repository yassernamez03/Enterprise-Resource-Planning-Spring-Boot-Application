import {
  salesSummaryData,
  employeePerformanceData,
  clientSpendingData,
  productSalesData
} from "./mockData"

export const getSalesSummary = async dateRange => {
  // In a real implementation, we would filter by date range
  return Promise.resolve(salesSummaryData)
}

export const getEmployeePerformance = async dateRange => {
  // In a real implementation, we would filter by date range
  return Promise.resolve(employeePerformanceData)
}

export const getClientSpending = async dateRange => {
  // In a real implementation, we would filter by date range
  return Promise.resolve(clientSpendingData)
}

export const getProductSales = async dateRange => {
  // In a real implementation, we would filter by date range
  return Promise.resolve(productSalesData)
}

export const exportReportData = async (reportType, dateRange) => {
  // In a real implementation, we would generate a CSV file based on the report type and date range
  const mockCsvContent = "Date,Value\n2024-01-01,100\n2024-01-02,200"
  const blob = new Blob([mockCsvContent], { type: "text/csv" })
  return Promise.resolve(blob)
}
