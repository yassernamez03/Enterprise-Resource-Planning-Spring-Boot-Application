// components/ChatSearch.js
import React from 'react';
import { Search, X, ChevronLeft, ChevronDown } from 'lucide-react';

const ChatSearch = ({ 
  darkMode, 
  chatSearchQuery, 
  setChatSearchQuery, 
  searchResults, 
  currentSearchIndex, 
  navigateSearchResults, 
  setShowSearchInChat,
  searchError
}) => {
  return (
    <div className={`p-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b flex items-center`}>
      <div className={`flex-1 flex items-center ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg px-3 py-1 ${searchError ? 'ring-1 ring-red-500' : ''}`}>
        <Search className={searchError ? 'text-red-500' : (darkMode ? 'text-gray-400' : 'text-gray-500')} size={16} />
        <input
          type="text"
          placeholder="Search in conversation"
          className={`bg-transparent flex-1 outline-none text-sm py-1 mx-2 ${searchError ? 'text-red-500' : (darkMode ? 'text-gray-200' : 'text-gray-800')}`}
          value={chatSearchQuery}
          onChange={(e) => setChatSearchQuery(e.target.value)}
        />
        {chatSearchQuery && (
          <button
            className={searchError ? 'text-red-500' : 'text-gray-500'}
            onClick={() => setChatSearchQuery('')}
          >
            <X size={16} />
          </button>
        )}
      </div>
      {searchResults.length > 0 && (
        <div className="ml-2 flex items-center">
          <button
            className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            onClick={() => navigateSearchResults('prev')}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="mx-1 text-sm">
            {currentSearchIndex + 1}/{searchResults.length}
          </span>
          <button
            className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            onClick={() => navigateSearchResults('next')}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      )}
      {searchError && (
        <div className="ml-2">
          <span className="text-sm text-red-500">No results</span>
        </div>
      )}
      <button
        className={`ml-2 p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        onClick={() => setShowSearchInChat(false)}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ChatSearch;