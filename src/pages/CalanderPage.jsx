import React from 'react';
import Header from '../Components/CalendarComponents/Header';
import MonthView from '../Components/CalendarComponents/Calendar/MonthView';
import WeekView from '../Components/CalendarComponents/Calendar/WeekView';
import DayView from '../Components/CalendarComponents/Calendar/DayView';
import YearView from '../Components/CalendarComponents/Calendar/YearView';
import MiniCalendar from '../Components/CalendarComponents/MiniCalendar';
import UpcomingEvents from '../Components/CalendarComponents/UpcomingEvents';
import CreateEventButton from '../Components/CalendarComponents/CreateEventButton';
import { useCalendar } from '../context/CalendarContext';

function CalendarPage() {
const { view, searchTerm } = useCalendar();

const renderCalendarView = () => {
    switch (view) {
    case 'day':
        return <DayView />;
    case 'week':
        return <WeekView />;
    case 'month':
        return <MonthView />;
    case 'year':
        return <YearView />;
    default:
        return <MonthView />;
    }
};

return (
    <div className="min-h-screen bg-gray-100">
    <Header />
    
    {searchTerm && (
        <div className="max-w-7xl mx-auto px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-center">
        <p className="text-yellow-700">
            Showing results for: <strong>"{searchTerm}"</strong>
        </p>
        </div>
    )}
    
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-3/4">
            {renderCalendarView()}
        </div>
        
        <div className="md:w-1/4">
            <div className="bg-white rounded-lg shadow overflow-hidden">
            <MiniCalendar />
            <UpcomingEvents />
            </div>
        </div>
        </div>
    </main>
    
    <CreateEventButton />
    </div>
);
}

export default CalendarPage;