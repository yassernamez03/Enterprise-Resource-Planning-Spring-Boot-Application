import React, { useEffect, useState } from "react"
import PageHeader from "../../../Components/Sales/common/PageHeader"
import SummaryCards from "./components/SummaryCards"
import RecentActivitiesList from "./components/RecentActivitiesList"
import SalesChart from "./components/SalesChart"
import QuickActions from "./components/QuickActions"
import {
  getMockSalesSummary,
  getMockRecentActivities,
  getMockSalesPerformance
} from "../../../services/Sales/dashboardService"

const Dashboard = () => {
  const [salesSummary, setSalesSummary] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [salesPerformance, setSalesPerformance] = useState(null)
  const [loading, setLoading] = useState({
    summary: true,
    activities: true,
    performance: true
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, use the API services
        // const summaryData = await getSalesSummary();
        // const activitiesData = await getRecentActivities(5);
        // const performanceData = await getSalesPerformance('month');

        // Using mock data for development
        const summaryData = getMockSalesSummary()
        const activitiesData = getMockRecentActivities()
        const performanceData = getMockSalesPerformance()

        setSalesSummary(summaryData)
        setRecentActivities(activitiesData)
        setSalesPerformance(performanceData)

        // Simulate loading states for development
        setTimeout(() => {
          setLoading(prev => ({ ...prev, summary: false }))
        }, 500)

        setTimeout(() => {
          setLoading(prev => ({ ...prev, activities: false }))
        }, 800)

        setTimeout(() => {
          setLoading(prev => ({ ...prev, performance: false }))
        }, 1200)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        // In a real app, handle error properly
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to the Sales Module dashboard"
      />

      <div className="grid grid-cols-1 gap-6 mb-6">
        <SummaryCards
          data={salesSummary || getMockSalesSummary()}
          loading={loading.summary}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart
            data={salesPerformance || getMockSalesPerformance()}
            loading={loading.performance}
          />
        </div>

        <div>
          <RecentActivitiesList
            activities={recentActivities}
            loading={loading.activities}
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
