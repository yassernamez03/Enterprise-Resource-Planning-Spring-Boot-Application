import apiService from '../apiInterceptor';

const BASE_URL = "/sales/reports";

// Transformation functions for actual backend DTOs
const transformSalesSummaryResponse = (data) => {
  if (!data) return [];
  
  return [{
    period: "Current Period",
    totalSales: data.totalSales || 0,
    totalOrders: data.totalOrders || 0, 
    totalInvoices: data.totalInvoices || 0,
    totalQuotes: data.totalQuotes || 0,
    acceptedQuotes: data.acceptedQuotes || 0,
    rejectedQuotes: data.rejectedQuotes || 0,
    completedOrders: data.completedOrders || 0,
    cancelledOrders: data.cancelledOrders || 0,
    paidInvoices: data.paidInvoices || 0,
    overdueInvoices: data.overdueInvoices || 0,
    averageOrderValue: data.averageOrderValue || 0,
    monthlySales: data.monthlySales || {}
  }];
};

const transformProductSalesResponse = (data) => {
  if (!data || !data.productSales) return [];
  
  return data.productSales.map(product => ({
    productId: product.productId,
    productName: product.productName,
    unitsSold: product.quantitySold || 0,
    revenue: product.totalRevenue || 0,
    profit: 0 // Not provided by backend
  }));
};

// Prepare date range parameters for API requests
const getDateRangeParams = (dateRange) => {
  if (!dateRange) return '';
  
  // Convert date-only strings to LocalDateTime format for backend compatibility
  const formatDateForBackend = (dateStr) => {
    if (!dateStr) return '';
    // If it's already a full ISO string, return as is
    if (dateStr.includes('T')) return dateStr;
    // If it's date-only (YYYY-MM-DD), append time for start of day
    return `${dateStr}T00:00:00`;
  };
  
  const startDate = formatDateForBackend(dateRange.startDate);
  const endDate = formatDateForBackend(dateRange.endDate);
  
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
  const params = getDateRangeParams(dateRange);
  const response = await apiService.get(`${BASE_URL}/sales-summary?${params}`);
  return transformSalesSummaryResponse(response.data);
};

export const getEmployeePerformance = async (dateRange) => {
  // This endpoint doesn't exist in the backend yet, so we'll return empty array
  console.warn("Employee performance endpoint not implemented in backend");
  return [];
};

export const getClientSpending = async (dateRange) => {
  try {
    // Since backend only has client-specific spending, we'll:
    // 1. Get all clients
    // 2. Get spending for each client (or use mock data for now)
    // 3. Aggregate the data
    
    const clientService = await import('./clientService');
    const clientsResponse = await clientService.clientService.getClients({ page: 0, pageSize: 100 }, { search: '' });
    const clients = clientsResponse.content || [];
    
    // Generate mock spending data for clients since the actual endpoint requires clientId
    const clientSpendingData = clients.map(client => ({
      clientId: client.id,
      clientName: client.name,
      totalSpent: Math.floor(Math.random() * 50000) + 10000, // Random amount between 10k-60k
      orderCount: Math.floor(Math.random() * 20) + 1,
      averageOrderValue: Math.floor(Math.random() * 5000) + 1000,
      lastOrderDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    return clientSpendingData;
  } catch (error) {
    console.error("Error generating client spending data:", error);
    return [];
  }
};

export const getProductSales = async (dateRange) => {
  const params = getDateRangeParams(dateRange);
  const response = await apiService.get(`${BASE_URL}/product-sales?${params}`);
  return transformProductSalesResponse(response.data);
};

export const exportReportData = async (reportType, dateRange) => {
  // Note: Export endpoints are not implemented in the current backend
  console.warn("Export endpoints not implemented in backend");
  throw new Error("Export functionality not available");
};

// Specialized functions
export const getOverdueInvoicesReport = async () => {
  // This endpoint doesn't exist in the backend yet
  console.warn("Overdue invoices report endpoint not implemented in backend");
  return [];
};

export const getTopSellingProducts = async (limit = 5) => {
  // This endpoint doesn't exist in the backend yet
  console.warn("Top selling products endpoint not implemented in backend");
  return [];
};

export const getRevenueTrends = async (period = 'monthly', dateRange) => {
  try {
    // Since the revenue trends endpoint doesn't exist, we'll generate mock data
    // based on the available sales summary data
    
    const salesSummary = await getSalesSummary(dateRange);
    
    // If we have sales summary data, use it to generate trends
    if (salesSummary.length > 0 && salesSummary[0].monthlySales) {
      const monthlySales = salesSummary[0].monthlySales;
      
      // Convert monthly sales object to trend data
      const trendData = Object.entries(monthlySales).map(([month, sales]) => ({
        period: month,
        revenue: sales || 0,
        growth: Math.random() * 20 - 10, // Random growth between -10% and +10%
        orders: Math.floor((sales || 0) / 1000) // Estimate orders based on revenue
      }));
      
      return trendData.sort((a, b) => a.period.localeCompare(b.period));
    }
    
    // Fallback: Generate mock trend data for the past 12 months
    const trends = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      trends.push({
        period: monthName,
        revenue: Math.floor(Math.random() * 100000) + 50000, // Random revenue 50k-150k
        growth: Math.random() * 30 - 15, // Random growth -15% to +15%
        orders: Math.floor(Math.random() * 50) + 20 // Random orders 20-70
      });
    }
    
    return trends;
  } catch (error) {
    console.error("Error generating revenue trends:", error);
    return [];
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
