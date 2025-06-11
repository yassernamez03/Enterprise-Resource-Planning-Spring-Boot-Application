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