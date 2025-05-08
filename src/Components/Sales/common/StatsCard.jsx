import React from "react"

const StatsCard = ({ title, value, icon, change, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-lg p-6 shadow-card hover:shadow-cardHover transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="text-primary-600 bg-primary-50 p-2 rounded-md">
          {icon}
        </div>
      </div>

      <div className="flex items-end">
        <p className="text-2xl font-bold text-gray-800">
          {typeof value === "number" && !isNaN(value)
            ? value.toLocaleString()
            : value}
        </p>

        {change && (
          <div
            className={`ml-2 flex items-center text-sm ${
              change.isPositive ? "text-success-600" : "text-error-600"
            }`}
          >
            <span className="mr-1">{change.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default StatsCard
