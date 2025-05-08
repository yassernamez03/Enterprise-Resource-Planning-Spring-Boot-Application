import React from "react"
import { FileText, ShoppingCart, CreditCard, Users } from "lucide-react"

const QuickActions = () => {
  const actions = [
    {
      title: "New Quote",
      icon: <FileText size={20} />,
      color: "bg-primary-600 hover:bg-primary-700",
      path: "/sales/quotes/new"
    },
    {
      title: "New Order",
      icon: <ShoppingCart size={20} />,
      color: "bg-success-600 hover:bg-success-700",
      path: "/sales/orders/new"
    },
    {
      title: "New Invoice",
      icon: <CreditCard size={20} />,
      color: "bg-warning-600 hover:bg-warning-700",
      path: "/sales/invoices/new"
    },
    {
      title: "New Client",
      icon: <Users size={20} />,
      color: "bg-secondary-600 hover:bg-secondary-700",
      path: "/sales/clients/new"
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">Quick Actions</h3>
      </div>

      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <a
            key={index}
            href={action.path}
            className={`flex flex-col items-center justify-center p-4 rounded-lg ${action.color} text-white transition-all transform hover:scale-105`}
          >
            <div className="bg-white bg-opacity-20 rounded-full p-2 mb-2">
              {action.icon}
            </div>
            <span className="text-sm font-medium">{action.title}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

export default QuickActions
