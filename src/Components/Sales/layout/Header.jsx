import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, User, Search, Settings, LogOut, FileText, Home } from "lucide-react";
import { useAuth } from "../../../context/AuthContext"; // Import the same auth context

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Get user data and logout function
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  const handleReturnHome = () => {
    navigate('/');
  };
  
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 sticky top-0 z-20 shadow-sm">
      {/* Return Home Button */}
      <button
        onClick={handleReturnHome}
        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        title="Return to Home"
      >
        <Home size={20} />
        <span className="hidden sm:inline text-sm font-medium">Home</span>
      </button>

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