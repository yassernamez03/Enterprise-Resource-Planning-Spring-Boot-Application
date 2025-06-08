import React from "react"
import StatsCard from "../../../../Components/Sales/common/StatsCard"
import { DollarSign, FileText, FileCheck, TrendingUp } from "lucide-react"
import { format } from "date-fns"

const SummaryCards = ({ data, loading = false }) => {  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-card animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-md"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  // Provide default values if data is null or missing properties
  const summaryData = {
    totalSales: data?.totalSales || 0,
    pendingQuotes: data?.pendingQuotes || 0,
    outstandingInvoices: data?.outstandingInvoices || 0,
    revenueThisMonth: data?.revenueThisMonth || 0,
    percentChange: data?.percentChange || 0
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Sales"
        value={`$${summaryData.totalSales.toLocaleString()}`}
        icon={<DollarSign size={24} />}
        change={{
          value: summaryData.percentChange,
          isPositive: summaryData.percentChange > 0
        }}
      />

      <StatsCard
        title="Pending Quotes"
        value={summaryData.pendingQuotes}
        icon={<FileText size={24} />}
      />

      <StatsCard
        title="Outstanding Invoices"
        value={summaryData.outstandingInvoices}
        icon={<FileCheck size={24} />}
      />

      <StatsCard
        title={`Revenue (${format(new Date(), "MMM yyyy")})`}
        value={`$${summaryData.revenueThisMonth.toLocaleString()}`}
        icon={<TrendingUp size={24} />}
        change={{
          value: summaryData.percentChange,
          isPositive: summaryData.percentChange > 0
        }}
      />
    </div>
  )
}

export default SummaryCards
