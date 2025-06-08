import React from "react"
import { format } from "date-fns"
import { FileText, ShoppingCart, CreditCard, User, Package } from "lucide-react"

const RecentActivitiesList = ({ activities, loading = false }) => {
  const getActivityIcon = type => {
    switch (type) {
      case "quote":
        return <FileText size={18} className="text-primary-500" />
      case "order":
        return <ShoppingCart size={18} className="text-success-500" />
      case "invoice":
        return <CreditCard size={18} className="text-warning-500" />
      case "client":
        return <User size={18} className="text-secondary-500" />
      case "product":
        return <Package size={18} className="text-accent-500" />
      default:
        return <FileText size={18} className="text-gray-500" />
    }
  }

  const getActionText = activity => {
    const { type, action, entityName } = activity

    switch (action) {
      case "created":
        return `created a new ${type} (${entityName})`
      case "updated":
        return `updated ${type} ${entityName}`
      case "deleted":
        return `deleted ${type} ${entityName}`
      case "approved":
        return `approved ${type} ${entityName}`
      case "rejected":
        return `rejected ${type} ${entityName}`
      case "paid":
        return `marked ${type} ${entityName} as paid`
      default:
        return `${action} ${type} ${entityName}`
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">
            Recent Activities
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-4 animate-pulse">
              <div className="flex">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">Recent Activities</h3>
      </div>

      {!activities || activities.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No recent activities to display
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {activities.map(activity => (
            <div
              key={activity.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>

                <div className="ml-4 flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user}
                    </p>                    <p className="text-xs text-gray-500">
                      {(() => {
                        try {
                          const date = new Date(activity.timestamp);
                          return isNaN(date.getTime()) ? 'N/A' : format(date, "MMM d, h:mm a");
                        } catch (error) {
                          return 'N/A';
                        }
                      })()}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600 mt-1">
                    {getActionText(activity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-50 px-4 py-3 text-right">
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View all activities
        </button>
      </div>
    </div>
  )
}

export default RecentActivitiesList
