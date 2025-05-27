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
import { useAuth } from '../context/AuthContext';

function CalendarPage() {
const { view, searchTerm, loading, error, refreshEvents } = useCalendar();
const { user} = useAuth();
const isAdmin = user?.role === 'ADMIN';

// Function to handle refresh when there's an error
const handleRefresh = () => {
    refreshEvents();
};

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
    
    {/* Loading and Error States */}
    {loading && (
        <div className="max-w-7xl mx-auto px-4 py-2 bg-blue-50 border-b border-blue-200 text-center">
        <p className="text-blue-700">
            <svg className="inline-block animate-spin h-4 w-4 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading events...
        </p>
        </div>
    )}
    
    {error && (
        <div className="max-w-7xl mx-auto px-4 py-2 bg-red-50 border-b border-red-200 text-center">
        <p className="text-red-700">
            <span className="font-bold">Error:</span> {error}
            <button 
            onClick={handleRefresh} 
            className="ml-4 px-2 py-1 bg-red-100 hover:bg-red-200 rounded-md text-red-700 text-sm transition-colors"
            >
            Retry
            </button>
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
    {isAdmin && (
    <CreateEventButton />
    )}
    </div>
);
}

export default CalendarPage;