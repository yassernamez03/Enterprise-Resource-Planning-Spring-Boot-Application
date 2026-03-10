import React, { useState } from 'react';
import { useCalendar } from '../../../context/CalendarContext';
import {
  DAYS_OF_WEEK,
  getTimeSlots,
  startOfWeek,
  addDays,
  isSameDay,
  formatTime,
  getEventsForDay
} from '../../../utils/dateUtils';
import EventModal from '../EventModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WeekView = () => {
  const { currentDate, selectedDate, navigateToDay, getFilteredEvents, navigateToWeek } = useCalendar();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const events = getFilteredEvents();

  const weekStart = startOfWeek(selectedDate);
  const timeSlots = getTimeSlots();
  const days = DAYS_OF_WEEK.map((_, index) => addDays(weekStart, index));

  const prevWeek = () => {
    const previousWeek = addDays(selectedDate, -7);
    navigateToWeek(previousWeek);
  };

  const nextWeek = () => {
    const nextWeek = addDays(selectedDate, 7);
    navigateToWeek(nextWeek);
  };

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



  const renderTimeSlot = (day, slot) => {
    const slotDate = new Date(day);
    slotDate.setHours(slot.hour, slot.minute, 0, 0);

    const dayEvents = getEventsForDay(events, day);

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
      <div className="relative h-12 border-t border-gray-200">
        {slotEvents.map(event => {
          if (!event || !event.type) return null;

          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);

          const startHour = eventStart.getHours() + (eventStart.getMinutes() / 60);
          const endHour = eventEnd.getHours() + (eventEnd.getMinutes() / 60);

          const durationHours = endHour - startHour;
          const heightPercent = Math.max(durationHours * 100, 25); // Minimum height
          const eventColor = getEventColor(event);

          return (
            <div
              key={`${event.id}-${slot.hour}-${slot.minute}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(event);
              }}
              className="absolute left-0 right-0 mx-1 rounded px-2 py-1 overflow-hidden cursor-pointer"
              style={{
                top: `${(startHour - slot.hour) * 100}%`,
                height: `${heightPercent}%`,
                backgroundColor: eventColor,
                color: '#fff',
                zIndex: 10
              }}
            >
              <div className="text-xs font-medium truncate">{event.title}</div>
              <div className="text-xs truncate">
                {formatTime(eventStart)} - {formatTime(eventEnd)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const startHour = 0;
  const endHour = 23;
  const filteredTimeSlots = timeSlots.filter(slot => slot.hour >= startHour && slot.hour <= endHour);

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden h-[calc(100vh-192px)] flex flex-col">
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={prevWeek}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextWeek}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors ml-1"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="text-sm font-medium">
            {`${weekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - 
             ${addDays(weekStart, 6).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </div>
        </div>

        <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-gray-300">
          <div className="border-r border-gray-200"></div>
          {days.map((day, index) => {
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div
                key={index}
                onClick={() => navigateToDay(day)}
                className={`text-center py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <div className="text-sm text-gray-500">{DAYS_OF_WEEK[index]}</div>
                <div
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full mt-1 ${
                    isToday ? 'bg-blue-600 text-white' : 'text-gray-900'
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr]">
            <div className="border-r border-gray-300">
              {filteredTimeSlots.map((slot, index) => (
                <div key={index} className="h-12 text-xs text-gray-500 text-right pr-2">
                  {slot.hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="relative">
                {filteredTimeSlots.map((slot, slotIndex) => (
                  <React.Fragment key={slotIndex}>
                    {renderTimeSlot(day, slot)}
                  </React.Fragment>
                ))}
              </div>
            ))}
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

export default WeekView;
