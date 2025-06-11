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
    // Get all clients first
    const clientService = await import('./clientService');
    const clientsResponse = await clientService.clientService.getClients({ page: 0, pageSize: 100 }, { search: '' });
    const clients = extractResponseData(clientsResponse);
    
    if (!clients || clients.length === 0) {
      console.warn("No clients found for spending report");
      return [];
    }

    // Fetch real spending data for each client using the backend endpoint
    const clientSpendingPromises = clients.map(async (client) => {
      try {
        const params = getDateRangeParams(dateRange);
        const response = await apiService.get(`${BASE_URL}/client-spending/${client.id}?${params}`);
        
        // Transform the backend response to match frontend expectations
        const spendingData = response.data || response;
        
        return {
          clientId: client.id,
          clientName: client.name,
          totalSpent: spendingData.totalSpent || 0,
          orderCount: spendingData.orderCount || 0,
          averageOrderValue: spendingData.averageOrderValue || 0,
          lastOrderDate: spendingData.lastOrderDate || null
        };
      } catch (error) {
        console.warn(`Failed to fetch spending data for client ${client.id}:`, error);
        // Return zero data for clients that fail instead of failing the whole request
        return {
          clientId: client.id,
          clientName: client.name,
          totalSpent: 0,
          orderCount: 0,
          averageOrderValue: 0,
          lastOrderDate: null
        };
      }
    });

    const clientSpendingData = await Promise.all(clientSpendingPromises);
    
    // Filter out clients with no spending data if desired
    return clientSpendingData.filter(client => client.totalSpent > 0 || client.orderCount > 0);
    
  } catch (error) {
    console.error("Error fetching client spending data:", error);
    
    // Fallback: if the API calls fail completely, return empty array
    // You could also return mock data here as a last resort
    return [];
  }
};

export const getProductSales = async (dateRange) => {
  const params = getDateRangeParams(dateRange);
  const response = await apiService.get(`${BASE_URL}/product-sales?${params}`);
  return transformProductSalesResponse(response.data);
};

export const exportReportData = async (reportType, dateRange) => {
  try {
    let data = [];
    let filename = '';
    let headers = [];

    // Get the appropriate data based on report type
    switch (reportType) {
      case 'sales-summary':
        data = await getSalesSummary(dateRange);
        filename = 'sales-summary-report.csv';
        headers = ['Period', 'Total Sales', 'Total Orders', 'Total Invoices', 'Total Quotes', 'Accepted Quotes', 'Rejected Quotes', 'Completed Orders', 'Cancelled Orders', 'Paid Invoices', 'Overdue Invoices', 'Average Order Value'];
        break;
        
      case 'client-spending':
        data = await getClientSpending(dateRange);
        filename = 'client-spending-report.csv';
        headers = ['Client ID', 'Client Name', 'Total Spent', 'Order Count', 'Average Order Value', 'Last Order Date'];
        break;
        
      case 'product-sales':
        data = await getProductSales(dateRange);
        filename = 'product-sales-report.csv';
        headers = ['Product ID', 'Product Name', 'Units Sold', 'Revenue', 'Profit'];
        break;
        
      case 'top-selling-products':
        data = await getTopSellingProducts(10); // Get top 10 for export
        filename = 'top-selling-products-report.csv';
        headers = ['Product ID', 'Product Name', 'Units Sold', 'Revenue'];
        break;
        
      case 'overdue-invoices':
        data = await getOverdueInvoicesReport();
        filename = 'overdue-invoices-report.csv';
        headers = ['Invoice ID', 'Invoice Number', 'Client Name', 'Total Amount', 'Amount Due', 'Due Date', 'Days Past Due'];
        break;
        
      case 'revenue-trends':
        data = await getRevenueTrends('monthly', dateRange);
        filename = 'revenue-trends-report.csv';
        headers = ['Period', 'Revenue', 'Growth %', 'Order Count'];
        break;
        
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No data available to export');
    }

    // Convert data to CSV format
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
      let csvRow = [];
      
      switch (reportType) {
        case 'sales-summary':
          csvRow = [
            row.period,
            row.totalSales,
            row.totalOrders,
            row.totalInvoices,
            row.totalQuotes,
            row.acceptedQuotes,
            row.rejectedQuotes,
            row.completedOrders,
            row.cancelledOrders,
            row.paidInvoices,
            row.overdueInvoices,
            row.averageOrderValue
          ];
          break;
          
        case 'client-spending':
          csvRow = [
            row.clientId,
            `"${row.clientName}"`, // Wrap in quotes to handle commas in names
            row.totalSpent,
            row.orderCount,
            row.averageOrderValue,
            row.lastOrderDate || 'N/A'
          ];
          break;
          
        case 'product-sales':
        case 'top-selling-products':
          csvRow = [
            row.productId,
            `"${row.productName}"`,
            row.unitsSold,
            row.revenue,
            ...(reportType === 'product-sales' ? [row.profit] : [])
          ];
          break;
          
        case 'overdue-invoices':
          csvRow = [
            row.invoiceId,
            row.invoiceNumber,
            `"${row.clientName}"`,
            row.totalAmount,
            row.amountDue,
            row.dueDate,
            row.daysPastDue
          ];
          break;
          
        case 'revenue-trends':
          csvRow = [
            row.period,
            row.revenue,
            row.growth || 0,
            row.orderCount || row.orders || 0
          ];
          break;
      }
      
      csvContent += csvRow.join(',') + '\n';
    });

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return { success: true, message: `Report exported successfully as ${filename}` };
    
  } catch (error) {
    console.error("Error exporting report data:", error);
    throw new Error(`Export failed: ${error.message}`);
  }
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
    const trends = [];
    const endDate = new Date(dateRange.endDate);
    const startDate = new Date(dateRange.startDate);
    
    let periodRanges = [];
    
    // Generate date ranges based on the selected period
    switch (period) {
      case 'weekly':
        periodRanges = generateWeeklyRanges(startDate, endDate);
        break;
      case 'monthly':
        periodRanges = generateMonthlyRanges(startDate, endDate);
        break;
      case 'quarterly':
        periodRanges = generateQuarterlyRanges(startDate, endDate);
        break;
      case 'yearly':
        periodRanges = generateYearlyRanges(startDate, endDate);
        break;
      default:
        periodRanges = generateMonthlyRanges(startDate, endDate);
    }
    
    // Fetch sales summary for each period
    const trendPromises = periodRanges.map(async (range, index) => {
      try {
        const periodDateRange = {
          startDate: range.start.toISOString().split('T')[0],
          endDate: range.end.toISOString().split('T')[0]
        };
        
        const salesData = await getSalesSummary(periodDateRange);
        const currentData = salesData[0] || {};
        
        // Calculate growth rate compared to previous period (if available)
        let growth = 0;
        if (index > 0 && trends.length > 0) {
          const previousRevenue = trends[trends.length - 1].revenue;
          if (previousRevenue > 0) {
            growth = ((currentData.totalSales - previousRevenue) / previousRevenue) * 100;
          }
        }
        
        return {
          period: range.label,
          revenue: currentData.totalSales || 0,
          growth: Math.round(growth * 100) / 100, // Round to 2 decimal places
          orderCount: currentData.totalOrders || 0
        };
      } catch (error) {
        console.warn(`Failed to fetch data for period ${range.label}:`, error);
        return {
          period: range.label,
          revenue: 0,
          growth: 0,
          orderCount: 0
        };
      }
    });
    
    const trendResults = await Promise.all(trendPromises);
    
    // Calculate growth rates after all data is fetched
    const trendsWithGrowth = trendResults.map((trend, index) => {
      if (index === 0) {
        return { ...trend, growth: 0 }; // First period has no growth baseline
      }
      
      const previousRevenue = trendResults[index - 1].revenue;
      let growth = 0;
      
      if (previousRevenue > 0) {
        growth = ((trend.revenue - previousRevenue) / previousRevenue) * 100;
      }
      
      return {
        ...trend,
        growth: Math.round(growth * 100) / 100
      };
    });
    
    return trendsWithGrowth;
    
  } catch (error) {
    console.error("Error fetching revenue trends:", error);
    return [];
  }
};

// Helper functions to generate date ranges
const generateWeeklyRanges = (startDate, endDate) => {
  const ranges = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (weekEnd > endDate) {
      weekEnd.setTime(endDate.getTime());
    }
    
    ranges.push({
      start: new Date(weekStart),
      end: new Date(weekEnd),
      label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    });
    
    current.setDate(current.getDate() + 7);
  }
  
  return ranges;
};

const generateMonthlyRanges = (startDate, endDate) => {
  const ranges = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  
  while (current <= endDate) {
    const monthStart = new Date(current);
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    
    if (monthEnd > endDate) {
      monthEnd.setTime(endDate.getTime());
    }
    
    ranges.push({
      start: new Date(monthStart),
      end: new Date(monthEnd),
      label: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    });
    
    current.setMonth(current.getMonth() + 1);
  }
  
  return ranges;
};

const generateQuarterlyRanges = (startDate, endDate) => {
  const ranges = [];
  const current = new Date(startDate.getFullYear(), Math.floor(startDate.getMonth() / 3) * 3, 1);
  
  while (current <= endDate) {
    const quarterStart = new Date(current);
    const quarterEnd = new Date(current.getFullYear(), current.getMonth() + 3, 0);
    
    if (quarterEnd > endDate) {
      quarterEnd.setTime(endDate.getTime());
    }
    
    const quarterNumber = Math.floor(current.getMonth() / 3) + 1;
    
    ranges.push({
      start: new Date(quarterStart),
      end: new Date(quarterEnd),
      label: `Q${quarterNumber} ${current.getFullYear()}`
    });
    
    current.setMonth(current.getMonth() + 3);
  }
  
  return ranges;
};

const generateYearlyRanges = (startDate, endDate) => {
  const ranges = [];
  const current = new Date(startDate.getFullYear(), 0, 1);
  
  while (current <= endDate) {
    const yearStart = new Date(current);
    const yearEnd = new Date(current.getFullYear(), 11, 31);
    
    if (yearEnd > endDate) {
      yearEnd.setTime(endDate.getTime());
    }
    
    ranges.push({
      start: new Date(yearStart),
      end: new Date(yearEnd),
      label: current.getFullYear().toString()
    });
    
    current.setFullYear(current.getFullYear() + 1);
  }
  
  return ranges;
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
