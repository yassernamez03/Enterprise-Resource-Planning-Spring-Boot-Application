import { get } from "./api"

const BASE_URL = "/sales"

export const getSalesSummary = async () => {
  const response = await get(`${BASE_URL}/sales-summary`)
  return response.data.data
}

export const getRecentActivities = async (limit = 10) => {
  const response = await get(`${BASE_URL}/recent-activities`, { limit })
  return response.data.data
}

export const getSalesPerformance = async (period = "month") => {
  const response = await get(`${BASE_URL}/sales-performance`, { period })
  return response.data.data
}

// Mock data for development
export const getMockSalesSummary = () => {
  return {
    totalSales: 125000,
    pendingQuotes: 12,
    outstandingInvoices: 8,
    revenueThisMonth: 45000,
    revenueLastMonth: 42000,
    percentChange: 7.14
  }
}

export const getMockRecentActivities = () => {
  return [
    {
      id: 1,
      type: "invoice",
      action: "paid",
      entityId: 1001,
      entityName: "INV-1001",
      timestamp: new Date().toISOString(),
      user: "John Smith"
    },
    {
      id: 2,
      type: "quote",
      action: "created",
      entityId: 2001,
      entityName: "Q-2001",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: "Jane Doe"
    },
    {
      id: 3,
      type: "order",
      action: "updated",
      entityId: 3001,
      entityName: "ORD-3001",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: "Alice Cooper"
    },
    {
      id: 4,
      type: "client",
      action: "created",
      entityId: 101,
      entityName: "Acme Inc.",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      user: "Bob Johnson"
    },
    {
      id: 5,
      type: "product",
      action: "updated",
      entityId: 201,
      entityName: "Premium Widget",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      user: "Jane Doe"
    }
  ]
}

export const getMockSalesPerformance = () => {
  return {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Sales",
        data: [30000, 35000, 28000, 32000, 42000, 45000]
      }
    ]
  }
}
