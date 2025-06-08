import React, { useEffect, useState } from "react"
import PageHeader from "../../../Components/Sales/common/PageHeader"
import SummaryCards from "./components/SummaryCards"
import RecentActivitiesList from "./components/RecentActivitiesList"
import SalesChart from "./components/SalesChart"
import QuickActions from "./components/QuickActions"
import {
  getSalesSummary,
  getRecentActivities,
  getSalesPerformance
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
  const [error, setError] = useState({
    summary: null,
    activities: null,
    performance: null
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Fetch sales summary
      try {
        setLoading(prev => ({ ...prev, summary: true }))
        const summaryData = await getSalesSummary()
        setSalesSummary(summaryData)
        setError(prev => ({ ...prev, summary: null }))
      } catch (err) {
        console.error("Error fetching sales summary:", err)
        setError(prev => ({ ...prev, summary: "Failed to load sales summary" }))
      } finally {
        setLoading(prev => ({ ...prev, summary: false }))
      }

      // Fetch recent activities
      try {
        setLoading(prev => ({ ...prev, activities: true }))
        const activitiesData = await getRecentActivities(5)
        setRecentActivities(activitiesData)
        setError(prev => ({ ...prev, activities: null }))
      } catch (err) {
        console.error("Error fetching recent activities:", err)
        setError(prev => ({ ...prev, activities: "Failed to load recent activities" }))
      } finally {
        setLoading(prev => ({ ...prev, activities: false }))
      }

      // Fetch sales performance
      try {
        setLoading(prev => ({ ...prev, performance: true }))
        const performanceData = await getSalesPerformance('month')
        setSalesPerformance(performanceData)
        setError(prev => ({ ...prev, performance: null }))
      } catch (err) {
        console.error("Error fetching sales performance:", err)
        setError(prev => ({ ...prev, performance: "Failed to load sales performance" }))
      } finally {
        setLoading(prev => ({ ...prev, performance: false }))
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
        {error.summary ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error.summary}
          </div>
        ) : (
          <SummaryCards
            data={salesSummary}
            loading={loading.summary}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {error.performance ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error.performance}
            </div>
          ) : (
            <SalesChart
              data={salesPerformance}
              loading={loading.performance}
            />
          )}
        </div>        <div>
          {error.activities ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error.activities}
            </div>
          ) : (
            <RecentActivitiesList
              activities={recentActivities}
              loading={loading.activities}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
