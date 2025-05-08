import React from "react"
import { Outlet } from "react-router-dom"
import Header from "./Header"
import Sidebar from "./Sidebar"
import { useAppContext } from "../../../context/Sales/AppContext"

const AppLayout = () => {
  const { sidebarCollapsed } = useAppContext()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>

        <footer className="py-4 px-6 text-center text-gray-500 text-sm border-t">
          <p>
            © {new Date().getFullYear()} ERP Sales Module. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}

export default AppLayout
