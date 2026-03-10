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
    <div className="relative" ref={filterContainerRef}>
      <div 
        className={`p-2 mx-3 my-2 flex items-center justify-between ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} rounded-lg cursor-pointer`}
        onClick={() => setFilterOpen(!filterOpen)}
      >
        <div className="flex items-center">
          <Filter size={18} className="mr-2" />
          <span>
            {filterOptions.unread ? "Unread" : 
             filterOptions.recent ? "Recent" : 
             filterOptions.archived ? "Archived" : 
             filterOptions.closed ? "Closed" : "All"}
          </span>
        </div>
        <ChevronDown size={18} />
      </div>
      
      {filterOpen && (
        <div 
          className={`absolute left-0 right-0 mx-3 mt-1 z-10 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'} overflow-hidden`}
          ref={filterMenuRef}
        >
          <div 
            className={`p-3 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer`}
            onClick={() => handleApplyFilter('unread')}
          >
            <div className="flex items-center">
              <span>Unread</span>
            </div>
            {filterOptions.unread && <Check size={18} className="text-teal-500" />}
          </div>
          
          <div 
            className={`p-3 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer`}
            onClick={() => handleApplyFilter('recent')}
          >
            <div className="flex items-center">
              <span>Recent</span>
            </div>
            {filterOptions.recent && <Check size={18} className="text-teal-500" />}
          </div>
          
          <div 
            className={`p-3 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer`}
            onClick={() => handleApplyFilter('closed')}
          >
            <div className="flex items-center">
              <span>Closed</span>
            </div>
            {filterOptions.closed && <Check size={18} className="text-teal-500" />}
          </div>
          
          <div 
            className={`p-3 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer`}
            onClick={() => handleApplyFilter('archived')}
          >
            <div className="flex items-center">
              <span>Archived</span>
            </div>
            {filterOptions.archived && <Check size={18} className="text-teal-500" />}
          </div>
          
          <div 
            className={`p-3 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer`}
            onClick={() => handleApplyFilter('all')}
          >
            <div className="flex items-center">
              <span>All</span>
            </div>
            {filterOptions.all && <Check size={18} className="text-teal-500" />}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterMenu;