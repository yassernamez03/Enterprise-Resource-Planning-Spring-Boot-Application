import { apiService } from "../apiInterceptor"

const BASE_URL = "/sales"
const REPORTS_URL = "/sales/reports"

export const getSalesSummary = async () => {
  try {
    // Get current month date range
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endDate = now.toISOString()
      const response = await apiService.get(`${REPORTS_URL}/sales-summary?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`)
    
    const data = response.data || response || {}
    
    // Transform backend data to match frontend expected format
    return {
      totalSales: data.totalSales || 0,
      pendingQuotes: data.totalQuotes - (data.acceptedQuotes + data.rejectedQuotes) || 0,
      outstandingInvoices: data.totalInvoices - data.paidInvoices || 0,
      revenueThisMonth: data.totalSales || 0,
      revenueLastMonth: 0, // Will need separate call for comparison
      percentChange: 0, // Will calculate when we have last month data
      totalQuotes: data.totalQuotes || 0,
      totalOrders: data.totalOrders || 0,
      totalInvoices: data.totalInvoices || 0,
      averageOrderValue: data.averageOrderValue || 0
    }
  } catch (error) {
    console.error("Error fetching sales summary:", error)
    throw error
  }
}

export const getRecentActivities = async (limit = 10) => {
  try {
    // Get recent invoices, orders, and quotes to build activity feed
    const [invoicesResponse, ordersResponse, quotesResponse] = await Promise.all([
      apiService.get(`/sales/invoices?size=${limit}`),
      apiService.get(`/sales/orders?size=${limit}`),  
      apiService.get(`/sales/quotes?size=${limit}`)
    ])
      const activities = []
    
    // Add invoice activities
    if (invoicesResponse.data?.content || invoicesResponse?.content) {
      const invoices = invoicesResponse.data?.content || invoicesResponse?.content || []
      invoices.forEach(invoice => {        activities.push({
          id: `invoice-${invoice.id}`,
          type: "invoice",
          action: invoice.status === "PAID" ? "paid" : "created",
          entityId: invoice.id,
          entityName: invoice.invoiceNumber,
          timestamp: invoice.createdAt || invoice.updatedAt || new Date().toISOString(),
          user: invoice.employeeName || "System"
        })
      })
    }
      // Add order activities  
    if (ordersResponse.data?.content || ordersResponse?.content) {
      const orders = ordersResponse.data?.content || ordersResponse?.content || []
      orders.forEach(order => {        activities.push({
          id: `order-${order.id}`,
          type: "order", 
          action: order.status === "COMPLETED" ? "completed" : "updated",
          entityId: order.id,
          entityName: order.orderNumber,
          timestamp: order.createdAt || order.updatedAt || new Date().toISOString(),
          user: order.employeeName || "System"
        })
      })
    }
      // Add quote activities
    if (quotesResponse.data?.content || quotesResponse?.content) {
      const quotes = quotesResponse.data?.content || quotesResponse?.content || []
      quotes.forEach(quote => {        activities.push({
          id: `quote-${quote.id}`,
          type: "quote",
          action: quote.status === "ACCEPTED" ? "accepted" : "created", 
          entityId: quote.id,
          entityName: quote.quoteNumber,
          timestamp: quote.createdAt || quote.updatedAt || new Date().toISOString(),
          user: quote.employeeName || "System"
        })
      })
    }
      // Sort by timestamp and limit results
    return activities
      .filter(activity => activity.timestamp) // Filter out activities without timestamps
      .sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        // Handle invalid dates by treating them as very old dates
        const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
        const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
        return timeB - timeA;
      })
      .slice(0, limit)
      
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    throw error
  }
}

export const getSalesPerformance = async (period = "month") => {
  try {
    // Calculate date range based on period
    const now = new Date()
    let startDate, endDate = now.toISOString()
      if (period === "month") {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString() // Start of year for monthly data
    } else if (period === "quarter") {
      startDate = new Date(now.getFullYear() - 1, 0, 1).toISOString() // Last year for quarterly
    } else {
      startDate = new Date(now.getFullYear() - 2, 0, 1).toISOString() // 2 years for yearly
    }
      const response = await apiService.get(`${REPORTS_URL}/sales-summary?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`)
    
    const data = response.data || response || {}
    
    // Transform monthly sales data for chart
    const monthlySales = data.monthlySales || {}
    const months = Object.keys(monthlySales).sort()
    
    return {
      labels: months.map(month => {
        const date = new Date(month)
        return date.toLocaleDateString('en-US', { month: 'short' })
      }),
      datasets: [
        {
          label: "Sales",
          data: months.map(month => monthlySales[month] || 0)
        }
      ]
    }
  } catch (error) {
    console.error("Error fetching sales performance:", error)
    throw error
  }
}

// Export as service object
const dashboardService = {
  getSalesSummary,
  getRecentActivities,
  getSalesPerformance
};

export default dashboardService;
