import React from "react"
import { useLocation } from "react-router-dom"
import { Bell, User, Search } from "lucide-react"

const Header = () => {
  const location = useLocation()

  // Generate breadcrumbs based on location
  const getBreadcrumbs = () => {
    const pathParts = location.pathname.split("/").filter(Boolean)

    const breadcrumbs = [{ title: "Home", path: "/" }]

    let currentPath = ""

    pathParts.forEach((part, index) => {
      currentPath += `/${part}`

      // Get title based on path part
      let title = part.charAt(0).toUpperCase() + part.slice(1)

      // Handle detail pages
      if (!isNaN(Number(part)) && index > 0) {
        const parentPart = pathParts[index - 1]
        // Remove trailing 's' from plural and capitalize
        title = `${parentPart
          .slice(0, -1)
          .charAt(0)
          .toUpperCase()}${parentPart.slice(1, -1)} ${part}`
      }

      breadcrumbs.push({
        title,
        path: currentPath
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center justify-between w-full">
        {/* Breadcrumbs */}
        <nav className="text-sm">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.path}>
                {index > 0 && (
                  <li className="text-gray-400">
                    <span>/</span>
                  </li>
                )}
                <li>
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-800 font-medium">
                      {item.title}
                    </span>
                  ) : (
                    <a
                      href={item.path}
                      className="text-gray-600 hover:text-primary-700 transition-colors"
                    >
                      {item.title}
                    </a>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ol>
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all w-60"
            />
            <Search
              size={18}
              className="absolute top-2.5 left-3 text-gray-500"
            />
          </div>

          {/* Notifications */}
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-0 right-0 bg-error-500 w-2 h-2 rounded-full"></span>
          </button>

          {/* User profile */}
          <div className="flex items-center cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center mr-2">
              <User size={20} className="text-primary-700" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
