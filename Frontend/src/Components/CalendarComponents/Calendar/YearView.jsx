import React from 'react';
import { useCalendar } from '../../../context/CalendarContext';
import {
  MONTHS,
  getYearMonths,
  getMonthDays,
  isSameMonth,
  isSameDay
} from '../../../utils/dateUtils';

const YearView = () => {
  const { currentDate, setDate, setView } = useCalendar();
  
  const handleMonthClick = (monthDate) => {
    setDate(monthDate);
    setView('month');
  };
  
  const months = getYearMonths(currentDate.getFullYear());
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {months.map((monthDate, index) => (
          <div
            key={index}
            className="border border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleMonthClick(monthDate)}
          >
            <div className="bg-gray-50 py-2 text-center border-b border-gray-300 font-medium">
              {MONTHS[monthDate.getMonth()]}
            </div>
            
            <div className="grid grid-cols-7 gap-0 text-xs">
              {/* Days of week */}
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, dayIndex) => (
                <div key={dayIndex} className="text-center py-1 text-gray-500">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {getMonthDays(
                monthDate.getFullYear(),
                monthDate.getMonth()
              ).map((date, dateIndex) => {
                const isCurrentMonth = isSameMonth(date, monthDate);
                const isToday = isSameDay(date, new Date());
                
                return (
                  <div
                    key={dateIndex}
                    className={`text-center py-1 ${
                      !isCurrentMonth ? 'text-gray-300' : 
                      isToday ? 'bg-blue-600 text-white rounded-full' : 
                      'text-gray-800'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YearView;