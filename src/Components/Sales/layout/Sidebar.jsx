import React from "react"
import { Link, useLocation } from "react-router-dom"
import { useAppContext } from "../../../context/Sales/AppContext"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  ClipboardList,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppContext()
  const location = useLocation()

  const menuItems = [
    {
      title: "Dashboard",
      path: "/sales",
      icon: <LayoutDashboard size={22} />,
      group: "main"
    },
    {
      title: "Clients",
      path: "/sales/clients",
      icon: <Users size={22} />,
      group: "main"
    },
    {
      title: "Products",
      path: "/sales/products",
      icon: <ShoppingCart size={22} />,
      group: "main"
    },
    {
      title: "Quotes",
      path: "/sales/quotes",
      icon: <FileText size={22} />,
      group: "sales"
    },
    {
      title: "Orders",
      path: "/sales/orders",
      icon: <ClipboardList size={22} />,
      group: "sales"
    },
    {
      title: "Invoices",
      path: "/sales/invoices",
      icon: <CreditCard size={22} />,
      group: "sales"
    },
    {
      title: "Reports",
      path: "/sales/reports",
      icon: <LayoutDashboard size={22} />,
      group: "main"
    }
  ]

  // Filter menu items based on Part 1 (only Dashboard, Clients, Products for now)
  const visibleMenuItems = menuItems.filter(item =>
    [
      "/sales",
      "/sales/clients",
      "/sales/products",
      "/sales/quotes",
      "/sales/orders",
      "/sales/invoices",
      "/sales/reports"
    ].includes(item.path)
  )

  return (
    <aside
      className={`bg-white border-r border-gray-200 h-screen transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-64"
      } fixed left-0 top-0 z-30 shadow-sm`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
          <h1 className="text-xl font-bold text-primary-700">ERP Sales</h1>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={20} className="text-gray-600" />
          ) : (
            <ChevronLeft size={20} className="text-gray-600" />
          )}
        </button>
      </div>

      <nav className="py-4">
        <ul>
          {visibleMenuItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <li key={item.path} className="mb-1 px-3">
                <Link
                  to={item.path}
                  className={`flex items-center py-2 px-3 rounded-md transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className={sidebarCollapsed ? "hidden" : "block"}>
                    {item.title}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
