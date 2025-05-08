import React, { createContext, useContext, useState } from "react"

const AppContext = createContext(undefined)

export const AppProvider = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

  // Simple notification function (would be replaced by actual toast implementation)
  const showNotification = (message, type) => {
    console.log(`[${type}] ${message}`)
    // In a real implementation, this would show a toast notification
  }

  return (
    <AppContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar,
        showNotification
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
