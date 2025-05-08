import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { 
  getUpcomingEvents, 
  getAllUpcomingEvents, 
  formatDate, 
  formatTime 
} from '../../utils/dateUtils';

const UpcomingEvents = () => {
  const { 
    events, 
    navigateToDay, 
    showAllUpcoming, 
    setShowAllUpcoming 
  } = useCalendar();
  
  const upcomingEvents = showAllUpcoming 
    ? getAllUpcomingEvents(events)
    : getUpcomingEvents(events);
  
  const handleEventClick = (event) => {
    navigateToDay(new Date(event.start));
  };
  
  const renderEventCard = (event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    return (
      <div 
        key={event.id}
        onClick={() => handleEventClick(event)}
        className="p-3 border rounded-lg mb-2 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-2" 
            style={{ backgroundColor: event.color }}
          ></div>
          <div className="font-medium">{event.title}</div>
        </div>
        
        <div className="mt-1 text-sm text-gray-600">
          {formatDate(start)}
        </div>
        
        <div className="mt-1 text-sm text-gray-600">
          {formatTime(start)} - {formatTime(end)}
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 border-l border-gray-300 overflow-y-auto h-[calc(100vh-192px)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Upcoming</h3>
        <button
          onClick={() => setShowAllUpcoming(!showAllUpcoming)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showAllUpcoming ? 'See Less' : 'See All'}
        </button>
      </div>
      
      {upcomingEvents.length > 0 ? (
        <div>
          {upcomingEvents.map(event => renderEventCard(event))}
        </div>
      ) : (
        <div className="text-gray-500 text-center py-8">
          No upcoming events
        </div>
      )}
      
      <div className="flex justify-between mt-4">
        <button 
          onClick={() => setShowAllUpcoming(false)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button 
          onClick={() => setShowAllUpcoming(true)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default UpcomingEvents;