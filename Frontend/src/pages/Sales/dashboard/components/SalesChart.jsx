import React, { useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const SalesChart = ({ data, loading = false, title = "Sales Performance" }) => {
  const [chartType, setChartType] = useState("line")
  const [timeRange, setTimeRange] = useState("month")

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top"
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return "$" + value.toLocaleString()
          }
        }
      }
    }
  }
  // Provide default values if data is null or missing properties
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: "Sales",
        data: data?.datasets?.[0]?.data || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  }
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
        <div className="p-4">
          <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Show message if no data is available
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        </div>
        <div className="p-4">
          <div className="h-64 flex items-center justify-center text-gray-500">
            No sales data available
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>

        <div className="mt-3 sm:mt-0 flex space-x-2">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setChartType("line")}
              className={`px-3 py-1.5 text-xs font-medium rounded-l-md ${
                chartType === "line"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Line
            </button>
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`px-3 py-1.5 text-xs font-medium rounded-r-md ${
                chartType === "bar"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Bar
            </button>
          </div>

          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className="block w-full pl-3 pr-10 py-1.5 text-xs border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="p-4">
        <div className="h-64">
          {chartType === "line" ? (
            <Line options={chartOptions} data={chartData} />
          ) : (
            <Bar
              options={chartOptions}
              data={{
                ...chartData,
                datasets: [
                  {
                    ...chartData.datasets[0],
                    backgroundColor: "rgba(59, 130, 246, 0.7)"
                  }
                ]
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default SalesChart
