import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Bell, User, Search, Settings, LogOut, FileText } from "lucide-react";
import { useAuth } from "../../../context/AuthContext"; // Import the same auth context

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth(); // Get user data and logout function
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Generate breadcrumbs based on location
  const getBreadcrumbs = () => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    
    const breadcrumbs = [{ title: "Home", path: "/" }];
    
    let currentPath = "";
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;
      
      // Get title based on path part
      let title = part.charAt(0).toUpperCase() + part.slice(1);
      
      // Handle detail pages
      if (!Number.isNaN(Number(part)) && index > 0) {
        const parentPart = pathParts[index - 1];
        // Remove trailing 's' from plural and capitalize
        title = `${parentPart
          .slice(0, -1)
          .charAt(0)
          .toUpperCase()}${parentPart.slice(1, -1)} ${part}`;
      }
      
      breadcrumbs.push({
        title,
        path: currentPath
      });
    });
    
    return breadcrumbs;
  };

  // Handle clicks outside the menu to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    
    // Add event listener when menu is open
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
  };
  
  const breadcrumbs = getBreadcrumbs();
  
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center justify-between w-full">
        {/* Breadcrumbs */}
        <nav className="text-sm">
          <ol className="flex items-center space-x-2">
            
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
            <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full"></span>
          </button>
          
          {/* User profile */}
          <div className="relative">
            <div 
              className="flex items-center cursor-pointer"
              onClick={toggleMenu}
            >
              <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center mr-2">
                {user?.fullName?.charAt(0) || "U"}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-800">{user?.fullName || "User"}</p>
                <p className="text-xs text-gray-500">{user?.role || "User"}</p>
              </div>
            </div>

            {/* Profile Dropdown Menu */}
            {isMenuOpen && (
              <div 
                ref={menuRef}
                className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-10 animate-fadeIn"
                style={{
                  animation: 'fadeIn 0.2s ease-in-out',
                  transformOrigin: 'top right',
                }}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-xl">
                        {user?.fullName?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">{user?.fullName || 'User'}</div>
                      <div className="text-sm font-medium text-gray-500">{user?.email || '@bizagi.com'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-1 border-t border-gray-200">
                  <a href="/account_details" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-150">
                    <User className="mr-2 h-5 w-5 text-gray-500" />
                    Account details
                  </a>
                  <a href="/settings" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-150">
                    <Settings className="mr-2 h-5 w-5 text-gray-500" />
                    Settings
                  </a>
                  {user?.role === 'ADMIN' && (
                    <a href="/admin" className="px-4 py-2 text-sm text-indigo-700 hover:bg-gray-100 flex items-center transition-colors duration-150">
                      <FileText className="mr-2 h-5 w-5 text-indigo-500" />
                      Admin Dashboard
                    </a>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center border-t border-gray-200 mt-1 transition-colors duration-150"
                  >
                    <LogOut className="mr-2 h-5 w-5 text-gray-500" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-in-out;
          }
        `}
      </style>
    </header>
  );
};

export default Header;