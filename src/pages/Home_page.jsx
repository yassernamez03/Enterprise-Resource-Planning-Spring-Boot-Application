import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Home_Page() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuth();
  const { showInfoToast } = useToast();

  // App data with route paths added
  const apps = [
    {
      id: 1,
      name: "Calendar",
      color: "bg-emerald-500",
      icon: "📅",
      path: "/calander_page",
    },
    {
      id: 2,
      name: "Chat",
      color: "bg-indigo-500",
      icon: "💬",
      path: "/chat_page",
    },
    { id: 3, name: "Sales", color: "bg-pink-500", icon: "🏷️", path: "/sales" },
    {
      id: 4,
      name: "Human Resources",
      color: "bg-yellow-500",
      icon: "👥",
      path: "/Employee",
    },
  ];

  // Handle clicks outside the menu to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    // Add event listener when menu is open
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    // Add a small delay for better UX
    setTimeout(() => {
      logout();
      setIsLoggingOut(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold">
                  S
                </div>
                <h1 className="ml-2 text-lg font-semibold text-gray-900">
                  SecureOps
                </h1>
              </div>
            </div>

            {/* User Profile */}
            <div className="relative">
              <div className="flex items-center h-full">
                <button
                  onClick={toggleMenu}
                  className="transform transition-transform duration-200 hover:scale-105"
                >
                  <img
                    src={user?.avatarUrl}
                    alt={`${user?.fullName || "User"}'s profile`}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white"
                  />
                </button>
              </div>

              {/* Profile Dropdown Menu */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-10 animate-fadeIn"
                  style={{
                    animation: "fadeIn 0.2s ease-in-out",
                    transformOrigin: "top right",
                  }}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <img
                          src={user?.avatarUrl}
                          alt={`${user?.fullName || "User"}'s profile`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white"
                        />
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">
                          {user?.fullName || "User"}
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                          {user?.email || "@bizagi.com"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-1 border-t border-gray-200">
                    <Link
                      to="/account_details"
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-150"
                    >
                      <svg
                        className="mr-2 h-5 w-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        ></path>
                      </svg>
                      Account details
                    </Link>
                    <Link
                      to="/settings"
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-150"
                    >
                      <svg
                        className="mr-2 h-5 w-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                      </svg>
                      Settings
                    </Link>
                    {user?.role === "ADMIN" && (
                      <>
                        <Link
                          to="/admin"
                          className="px-4 py-2 text-sm text-indigo-700 hover:bg-gray-100 flex items-center transition-colors duration-150"
                        >
                          <svg
                            className="mr-2 h-5 w-5 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                          </svg>
                          Admin Dashboard
                        </Link>
                        <Link
                          to="/security"
                          className="px-4 py-2 text-sm text-indigo-700 hover:bg-gray-100 flex items-center transition-colors duration-150"
                        >
                          <svg
                            className="mr-2 h-5 w-5 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                          </svg>
                          Security Dashboard
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center border-t border-gray-200 mt-1 transition-colors duration-150 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {isLoggingOut ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-gray-600 rounded-full mr-2"></div>
                          Logging out...
                        </>
                      ) : (
                        <>
                          <svg
                            className="mr-2 h-5 w-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            ></path>
                          </svg>
                          Sign out
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Hello, {user?.fullName?.split(" ")[0] || "User"}!
          </h2>
          <p className="text-gray-600">Explore your apps</p>
        </div>

        {/* App Grid - Mobile App Style with Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {apps.map((app) => (
            <Link
              key={app.id}
              to={app.path}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div
                className={`${app.color} w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white text-3xl shadow-md transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
              >
                <span>{app.icon}</span>
              </div>
              <span className="mt-2 text-center text-sm font-medium text-gray-800">
                {app.name}
              </span>
            </Link>
          ))}
        </div>
      </main>

      {/* CSS Animations - Fixed to use style element without jsx attribute */}
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
    </div>
  );
}
