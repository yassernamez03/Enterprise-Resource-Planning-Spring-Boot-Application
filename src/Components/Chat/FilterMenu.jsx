// components/FilterMenu.js
import React, { useRef } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';
import useOutsideClick from '../../hooks/useOutsideClick';

const FilterMenu = ({ darkMode, filterOpen, setFilterOpen, filterOptions, handleApplyFilter }) => {
  const filterContainerRef = useRef();
  const filterMenuRef = useOutsideClick(() => {
    if (filterOpen) setFilterOpen(false);
  });
  
  return (
    <div 
      ref={filterContainerRef}
      className={`p-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-center relative`}
    >
      <button 
        className={`flex items-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
        onClick={() => setFilterOpen(!filterOpen)}
      >
        <Filter className={darkMode ? 'text-gray-400' : 'text-gray-500'} size={14} />
        <span>
          {filterOptions.unread ? "Unread" : filterOptions.recent ? "Recent" : filterOptions.archived ? "Archived" : "All"}
        </span>
        <ChevronDown className={darkMode ? 'text-gray-400' : 'text-gray-500'} size={14} />
      </button>
      
      {filterOpen && (
        <div 
          ref={filterMenuRef}
          className={`absolute top-full left-0 right-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg z-10 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} mt-1`}>
          <div 
            className={`p-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer ${filterOptions.unread ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
            onClick={() => handleApplyFilter('unread')}
          >
            <div className="flex items-center">
              <span>Unread</span>
              {filterOptions.unread && <Check size={16} className="ml-2" />}
            </div>
          </div>
          <div 
            className={`p-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer ${filterOptions.recent ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
            onClick={() => handleApplyFilter('recent')}
          >
            <div className="flex items-center">
              <span>Recent</span>
              {filterOptions.recent && <Check size={16} className="ml-2" />}
            </div>
          </div>
          <div 
            className={`p-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer ${filterOptions.archived ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
            onClick={() => handleApplyFilter('archived')}
          >
            <div className="flex items-center">
              <span>Archived</span>
              {filterOptions.archived && <Check size={16} className="ml-2" />}
            </div>
          </div>
          <div 
            className={`p-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer ${filterOptions.all ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
            onClick={() => handleApplyFilter('all')}
          >
            <div className="flex items-center">
              <span>All</span>
              {filterOptions.all && <Check size={16} className="ml-2" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterMenu;