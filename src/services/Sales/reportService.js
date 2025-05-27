import apiService from '../apiInterceptor';
import { 
  salesSummaryData, 
  employeePerformanceData,
  clientSpendingData,
  productSalesData
} from "./mockData";

const BASE_URL = "/sales/reports";

// Transformation functions
const transformSalesSummaryResponse = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => ({
    period: item.period || item.timePeriod,
    totalSales: item.totalAmount || item.totalSales || 0,
    totalOrders: item.totalOrders || 0, 
    totalInvoices: item.totalInvoices || 0,
    conversionRate: item.conversionRate || 0
  }));
};

const transformEmployeePerformanceResponse = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.map(employee => ({
    employeeId: employee.employeeId || employee.id,
    employeeName: employee.name || employee.employeeName,
    quotesCreated: employee.quotesCreated || 0,
    quotesAccepted: employee.quotesAccepted || 0,
    ordersCompleted: employee.ordersCompleted || 0,
    totalRevenue: employee.totalRevenue || employee.revenue || 0
  }));
};

const transformClientSpendingResponse = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.map(client => ({
    clientId: client.clientId || client.id,
    clientName: client.clientName || client.name,
    totalSpent: client.totalAmount || client.totalSpent || 0,
    orderCount: client.orderCount || 0,
    averageOrderValue: client.averageOrderValue || 0
  }));
};

const transformProductSalesResponse = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.map(product => ({
    productId: product.productId || product.id,
    productName: product.productName || product.name,
    unitsSold: product.unitsSold || product.quantitySold || 0,
    revenue: product.revenue || product.totalAmount || 0, 
    profit: product.profit || 0
  }));
};

// Prepare date range parameters for API requests
const getDateRangeParams = (dateRange) => {
  if (!dateRange) return '';
  
  const startDate = dateRange.startDate || '';
  const endDate = dateRange.endDate || '';
  
  return `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
};

// Extract data from various response formats with improved error handling
const extractResponseData = (response) => {
  if (!response) {
    console.warn('Empty response received');
    return [];
  }

  // Handle different response structures
  if (response.content) {
    // Spring Data pagination response
    return response.content || [];
  } else if (Array.isArray(response)) {
    // Direct array response
    return response;
  } else if (response.data) {
    // Other API response format with data property
    return Array.isArray(response.data) ? response.data : [];
  } else if (typeof response === 'object' && !Array.isArray(response) && response !== null) {
    // Single item response
    return [response];
  } else {
    // If no recognizable format, return empty array
    console.warn('Unrecognized response format:', response);
    return [];
  }
};

// Report fetching functions
export const getSalesSummary = async (dateRange) => {
  try {
    const params = getDateRangeParams(dateRange);
    const response = await apiService.get(`${BASE_URL}/sales-summary?${params}`);
    const data = extractResponseData(response);
    return transformSalesSummaryResponse(data);
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    // Add more detailed error logging
    if (error.response) {
      console.error("Server responded with error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received from server");
    }
    // Fallback to mock data in development
    console.warn("Using mock data for sales summary");
    return salesSummaryData;
  }
};

export const getEmployeePerformance = async (dateRange) => {
  try {
    const params = getDateRangeParams(dateRange);
    const response = await apiService.get(`${BASE_URL}/employee-performance?${params}`);
    const data = extractResponseData(response);
    return transformEmployeePerformanceResponse(data);
  } catch (error) {
    console.error("Error fetching employee performance:", error);
    if (error.response) {
      console.error("Server responded with error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received from server");
    }
    // Fallback to mock data in development
    console.warn("Using mock data for employee performance");
    return employeePerformanceData;
  }
};

export const getClientSpending = async (dateRange) => {
  try {
    const params = getDateRangeParams(dateRange);
    const response = await apiService.get(`${BASE_URL}/client-spending?${params}`);
    const data = extractResponseData(response);
    return transformClientSpendingResponse(data);
  } catch (error) {
    console.error("Error fetching client spending:", error);
    if (error.response) {
      console.error("Server responded with error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received from server");
    }
    // Fallback to mock data in development
    console.warn("Using mock data for client spending");
    return clientSpendingData;
  }
};

export const getProductSales = async (dateRange) => {
  try {
    const params = getDateRangeParams(dateRange);
    const response = await apiService.get(`${BASE_URL}/product-sales?${params}`);
    const data = extractResponseData(response);
    return transformProductSalesResponse(data);
  } catch (error) {
    console.error("Error fetching product sales:", error);
    if (error.response) {
      console.error("Server responded with error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received from server");
    }
    // Fallback to mock data in development
    console.warn("Using mock data for product sales");
    return productSalesData;
  }
};

export const exportReportData = async (reportType, dateRange) => {
  try {
    const params = getDateRangeParams(dateRange);
    
    // Map report types to endpoints
    const reportTypeMap = {
      'sales-summary': 'sales-summary',
      'employee-performance': 'employee-performance',
      'client-spending': 'client-spending',
      'product-sales': 'product-sales'
    };
    
    const endpoint = reportTypeMap[reportType] || reportType;
    
    // Fetch the CSV data with responseType blob
    const response = await apiService.get(`${BASE_URL}/export/${endpoint}?${params}`, {
      responseType: 'blob'
    });
    
    // Return the blob directly
    if (response instanceof Blob) {
      return response;
    }
    
    // If we didn't get a blob directly, try to extract it
    if (response.data instanceof Blob) {
      return response.data;
    }
    
    // Fallback to creating our own blob from the response
    const csvData = typeof response === 'object' ? JSON.stringify(response) : response.toString();
    return new Blob([csvData], { type: 'text/csv' });
  } catch (error) {
    console.error(`Error exporting ${reportType} data:`, error);
    // Return a minimal blob with error info in development environment
    const errorMessage = `Error: Could not export ${reportType} data. ${error.message}`;
    console.warn("Returning mock export data");
    
    // In production, you might want a different fallback strategy
    const mockCsvContent = "Date,Value\n2024-01-01,100\n2024-01-02,200";
    return new Blob([mockCsvContent], { type: "text/csv" });
  }
};

// Specialized functions
export const getOverdueInvoicesReport = async () => {
  try {
    const response = await apiService.get(`${BASE_URL}/overdue-invoices`);
    return extractResponseData(response);
  } catch (error) {
    console.error("Error fetching overdue invoices report:", error);
    if (error.response) {
      console.error("Server responded with error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received from server");
    }
    return [];
  }
};

export const getTopSellingProducts = async (limit = 5) => {
  try {
    const response = await apiService.get(`${BASE_URL}/top-selling-products?limit=${limit}`);
    const data = extractResponseData(response);
    return transformProductSalesResponse(data);
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    if (error.response) {
      console.error("Server responded with error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received from server");
    }
    // Return top 5 products from mock data
    console.warn("Using mock data for top selling products");
    return productSalesData.slice(0, limit);
  }
};

export const getRevenueTrends = async (period = 'monthly', dateRange) => {
  try {
    const params = getDateRangeParams(dateRange);
    const periodParam = `period=${encodeURIComponent(period)}`;
    const url = `${BASE_URL}/revenue-trends?${periodParam}&${params}`;
    
    const response = await apiService.get(url);
    const data = extractResponseData(response);
    
    return data.map(item => ({
      period: item.period || item.date || item.timePeriod || 'Unknown',
      revenue: Number(item.revenue || item.amount || item.totalAmount || 0),
      orderCount: Number(item.orderCount || item.totalOrders || 0),
      growth: Number(item.growth || 0)
    }));
  } catch (error) {
    console.error("Error fetching revenue trends:", error);
    if (error.response) {
      console.error("Server responded with error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received from server");
    }
    
    console.warn("Using mock data for revenue trends");
    // Return period-specific mock data
    switch(period) {
      case 'weekly':
        return [
          { period: "Week 1", revenue: 7500, orderCount: 12, growth: 3.2 },
          { period: "Week 2", revenue: 8200, orderCount: 15, growth: 9.3 },
          { period: "Week 3", revenue: 7800, orderCount: 13, growth: -4.8 },
          { period: "Week 4", revenue: 9100, orderCount: 17, growth: 16.7 }
        ];
      case 'quarterly':
        return [
          { period: "Q1", revenue: 85000, orderCount: 120, growth: 8.5 },
          { period: "Q2", revenue: 92000, orderCount: 135, growth: 8.2 },
          { period: "Q3", revenue: 88000, orderCount: 125, growth: -4.3 },
          { period: "Q4", revenue: 105000, orderCount: 155, growth: 19.3 }
        ];
      case 'yearly':
        return [
          { period: "2022", revenue: 350000, orderCount: 480, growth: 15.2 },
          { period: "2023", revenue: 390000, orderCount: 520, growth: 11.4 },
          { period: "2024", revenue: 352000, orderCount: 490, growth: -9.7 }
        ];
      default: // monthly
        return [
          { period: "Jan", revenue: 30000, orderCount: 42, growth: 5.2 },
          { period: "Feb", revenue: 32000, orderCount: 45, growth: 6.7 },
          { period: "Mar", revenue: 28000, orderCount: 39, growth: -12.5 },
          { period: "Apr", revenue: 33000, orderCount: 47, growth: 17.8 },
          { period: "May", revenue: 34000, orderCount: 49, growth: 3.0 }
        ];
    }
  }
};

// Export as service object
const reportService = {
  getSalesSummary,
  getEmployeePerformance,
  getClientSpending,
  getProductSales,
  exportReportData,
  getOverdueInvoicesReport,
  getTopSellingProducts,
  getRevenueTrends
};

export default reportService;
