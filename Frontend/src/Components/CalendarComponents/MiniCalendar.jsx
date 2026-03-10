import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { 
  getMonthDays, 
  isSameMonth, 
  isSameDay
} from '../../utils/dateUtils';

const MiniCalendar = () => {
  const { 
    currentDate, 
    selectedDate, 
    setSelectedDate, 
    setDate,         
    navigateToDay,
    events // Assuming you have a list of events available in context
  } = useCalendar();
  
  const prevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setDate(newDate); 
  };
  
  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setDate(newDate); 
  };
  
  const handleDateClick = (date) => {
    setSelectedDate(date);
    navigateToDay(date);
  };

  const goToToday = () => {
    const today = new Date();
    setDate(today);
    setSelectedDate(today);
  };
  
  const days = getMonthDays(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  // Function to check if there's an event on a given date
  const hasEventOnDate = (date) => {
    return events.some(event => isSameDay(event.start, date));
  };
  
  return (
    <div className="p-3 border-b border-gray-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-lg">
          {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
        </h3>
        <div className="flex items-center">
          <button
            onClick={prevMonth}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors ml-1"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded-full hover:bg-blue-100 transition-colors"
          >
            Today
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-xs text-center">
        {/* Header row with day names */}
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <div key={index} className="font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
        
        {/* Calendar grid */}
        {days.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isToday = isSameDay(date, new Date());
          const isSelected = isSameDay(date, selectedDate);
          const hasEvent = hasEventOnDate(date); // Check if there's an event

          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                relative w-10 h-10 flex items-center justify-center rounded-full cursor-pointer mx-auto
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isSelected ? 'bg-blue-600 text-white' : ''}
                ${isToday && !isSelected ? 'bg-blue-100 text-blue-600' : ''}
                ${hasEvent ? 'bg-green-100 border-2 border-green-500' : ''} // Green background for events
                transition-all duration-300 ease-in-out
              `}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
