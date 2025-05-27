import React, { useState } from 'react';
import { useCalendar } from '../../../context/CalendarContext';
import { getMonthDays, isSameMonth, isSameDay, getEventsForDay } from '../../../utils/dateUtils';
import EventModal from '../EventModal';

const MonthView = () => {
  const { 
    currentDate, 
    selectedDate, 
    navigateToWeek, 
    getFilteredEvents 
  } = useCalendar();
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const events = getFilteredEvents();
  const days = getMonthDays(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );
  
  // Function to determine event color based on type
  const getEventColor = (event) => {
  const type = (event?.type || '').toString().toLowerCase();
  switch (type) {
    case 'event':
      return '#10b981'; // Green
    case 'task':
      return '#3b82f6'; // Blue
    default:
      return '#9ca3af'; // Gray if undefined or unknown
  }
};
  
  const handleDayClick = (date) => {
    navigateToWeek(date);
  };
  
  const renderDayEvents = (date) => {
    const dayEvents = getEventsForDay(events, date);
    
    if (dayEvents.length === 0) return null;
    
    const displayedEvents = dayEvents.slice(0, 2);
    const hasMoreEvents = dayEvents.length > 2;
    
    return (
      <div>
        {displayedEvents.map((event) => (
          <div 
            key={event.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEvent(event);
            }}
            className="text-xs truncate mb-1 p-1 rounded cursor-pointer"
            style={{ backgroundColor: getEventColor(event), color: '#fff' }}
          >
            {event.title}
          </div>
        ))}
        
        {hasMoreEvents && (
          <div className="text-xs text-gray-500 font-medium">
            + {dayEvents.length - 2} more
          </div>
        )}
      </div>
    );
  };
  
  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-0 border-b border-gray-300">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-0">
          {days.map((date, index) => {
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isToday = isSameDay(date, new Date());
            const isSelected = isSameDay(date, selectedDate);
            
            return (
              <div
                key={index}
                onClick={() => handleDayClick(date)}
                className={`min-h-[100px] border-b border-r border-gray-300 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex justify-end">
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : isSelected
                        ? 'bg-blue-100 text-blue-600'
                        : !isCurrentMonth 
                        ? 'text-gray-400' 
                        : 'text-gray-900'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>
                
                <div className="mt-1 overflow-y-auto max-h-[70px]">
                  {renderDayEvents(date)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </>
  );
};

export default MonthView;