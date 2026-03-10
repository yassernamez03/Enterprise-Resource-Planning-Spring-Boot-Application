import React, { useState } from 'react';
import { useCalendar } from '../../../context/CalendarContext';
import { 
  getTimeSlots, 
  formatTime,
  getEventsForDay
} from '../../../utils/dateUtils';
import EventModal from '../EventModal';

const DayView = () => {
  const { selectedDate, getFilteredEvents } = useCalendar();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const events = getFilteredEvents();
  
  const timeSlots = getTimeSlots();
  const dayEvents = getEventsForDay(events, selectedDate);
  
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
  
  const renderTimeSlot = (slot) => {
    const slotDate = new Date(selectedDate);
    slotDate.setHours(slot.hour, slot.minute, 0, 0);
    
    const slotEvents = dayEvents.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      const slotStart = new Date(slotDate);
      const slotEnd = new Date(slotDate);
      slotEnd.setHours(slotStart.getHours() + 1);
      
      return (
        (eventStart >= slotStart && eventStart < slotEnd) ||
        (eventEnd > slotStart && eventEnd <= slotEnd) ||
        (eventStart <= slotStart && eventEnd >= slotEnd)
      );
    });
    
    return (
      <div className="relative h-16 border-t border-gray-300">
        {slotEvents.map(event => {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          
          const startHour = eventStart.getHours() + eventStart.getMinutes() / 60;
          const endHour = eventEnd.getHours() + eventEnd.getMinutes() / 60;
          
          if (Math.floor(startHour) === slot.hour) {
            const durationHours = endHour - startHour;
            const heightPercent = durationHours * 100;
            
            // Use the new getEventColor function
            const eventColor = getEventColor(event);
            
            return (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
                className="absolute left-0 right-0 mx-1 rounded px-3 py-2 overflow-hidden cursor-pointer"
                style={{
                  top: `${(startHour - Math.floor(startHour)) * 100}%`,
                  height: `${heightPercent}%`,
                  backgroundColor: eventColor,
                  color: '#fff',
                  zIndex: 10
                }}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-sm">
                  {formatTime(eventStart)} - {formatTime(eventEnd)}
                </div>
                {event.description && (
                  <div className="text-sm mt-1 truncate">{event.description}</div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };
  
  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden h-[calc(100vh-192px)] flex flex-col">
        <div className="border-b border-gray-300 py-3 text-center">
          <h2 className="text-lg font-medium">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[80px_1fr]">
            <div className="border-r border-gray-300">
              {timeSlots.map((slot, index) => (
                <div key={index} className="h-16 text-gray-500 text-right pr-2 py-1">
                  {slot.hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
            
            <div className="relative">
              {timeSlots.map((slot, slotIndex) => (
                <React.Fragment key={slotIndex}>
                  {renderTimeSlot(slot)}
                </React.Fragment>
              ))}
            </div>
          </div>
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

export default DayView;