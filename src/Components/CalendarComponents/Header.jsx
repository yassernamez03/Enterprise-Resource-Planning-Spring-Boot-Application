import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { MONTHS } from '../../utils/dateUtils';

const Header = () => {
  const { 
    currentDate, 
    setDate, 
    view, 
    setView, 
    searchTerm, 
    setSearchTerm 
  } = useCalendar();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'year') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    
    setDate(newDate);
  };
  
  const navigateNext = () => {
    const newDate = new Date(currentDate);
    
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'year') {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    
    setDate(newDate);
  };
  
  const getHeaderTitle = () => {
    const year = currentDate.getFullYear();
    const month = MONTHS[currentDate.getMonth()];
    const date = currentDate.getDate();
    
    if (view === 'day') {
      return `${month} ${date}, ${year}`;
    } else if (view === 'week') {
      return `${month} ${year}`;
    } else if (view === 'month') {
      return `${month} ${year}`;
    } else {
      return year;
    }
  };
  
  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center">
            <button onClick={() => setDate(new Date())} className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
              <Calendar className="h-6 w-6 mr-2" />
              <span className="text-xl font-semibold">Calendar App</span>
            </button>
          </div>
          
          {/* Navigation and date display */}
          <div className="flex items-center">
            <button 
              onClick={navigatePrev}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <h2 className="mx-4 text-lg font-medium w-36 text-center">
              {getHeaderTitle()}
            </h2>
            
            <button 
              onClick={navigateNext}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          {/* View options and search */}
          <div className="flex items-center space-x-2">
            {isSearchOpen ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-64 rounded-md border-0 py-1.5 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
            
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('day')}
                className={`px-3 py-1 text-sm ${
                  view === 'day' 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1 text-sm ${
                  view === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1 text-sm ${
                  view === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('year')}
                className={`px-3 py-1 text-sm ${
                  view === 'year' 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                Year
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;