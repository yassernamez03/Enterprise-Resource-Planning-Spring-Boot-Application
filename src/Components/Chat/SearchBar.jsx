// components/SearchBar.js
import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ darkMode, searchQuery, setSearchQuery, renderSearchResults }) => {
  const [showResults, setShowResults] = useState(false);
  
  // Show results when query is entered
  useEffect(() => {
    if (searchQuery) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={`p-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} relative`}>
      <div className={`flex items-center ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg px-3 py-1`}>
        <Search className={darkMode ? 'text-gray-400' : 'text-gray-500'} size={16} />
        <input
          type="text"
          placeholder="Search or start new chat"
          className={`bg-transparent flex-1 outline-none text-sm py-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <X size={16} />
          </button>
        )}
      </div>
      {showResults && searchQuery && renderSearchResults && (
        <div>
          {renderSearchResults()}
        </div>
      )}
    </div>
  );
};

export default SearchBar;