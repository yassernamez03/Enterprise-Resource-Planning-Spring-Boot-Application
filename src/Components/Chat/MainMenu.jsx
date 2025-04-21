// components/MainMenu.js
import React from 'react';
import { Moon, Bell, UserPlus } from 'lucide-react';
import useOutsideClick from '../../hooks/useOutsideClick';

const MainMenu = ({ darkMode, setDarkMode, setShowMainMenu }) => {
  const menuRef = useOutsideClick(() => setShowMainMenu(false));
  
  return (
    <div 
      ref={menuRef}
      className={`absolute right-0 top-full mt-1 w-40 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-10`}>
      <div 
        className={`p-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer flex items-center`}
        onClick={() => {
          setDarkMode(!darkMode);
          setShowMainMenu(false);
        }}
      >
        <Moon size={16} className="mr-2" />
        <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
      </div>
    </div>
  );
};

export default MainMenu;