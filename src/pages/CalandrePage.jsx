import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, Search, ChevronLeft, ChevronRight, Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const WeeklyCalendar = () => {
    // Current week dates
    const [currentWeek, setCurrentWeek] = useState(generateWeekDates());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('week');
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showAllUpcoming, setShowAllUpcoming] = useState(false);
    // search for events
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Get current month and year from selected date instead of new Date()
    const currentMonth = selectedDate.toLocaleString('default', { month: 'long' });
    const currentYear = selectedDate.getFullYear();
    
    // Function to handle view change with appropriate display
    const changeView = (view) => {
    setCurrentView(view);
    // Reset current week based on selected date when view changes
    if (view === 'week') {
        setCurrentWeek(generateWeekDates(selectedDate));
    }
    };

    // Navigate to specific month in mini calendar
    const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
    if (currentView === 'week') {
        setCurrentWeek(generateWeekDates(newDate));
    }
    };

    // Select a specific date from mini calendar
    const selectDate = (date) => {
    setSelectedDate(date);
    if (currentView === 'week') {
        setCurrentWeek(generateWeekDates(date));
    }
    };

    // Handle event click to show details
    const handleEventClick = (event) => {
        console.log("Selected event for editing:", event);
        setSelectedEvent(event);
        setShowModal(true);
    };

    // Generate array of dates for the week
    function generateWeekDates(startDate = new Date()) {
    const dates = [];
    const start = new Date(startDate);
    // Adjust to start from Monday of current week
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date);
    }
    return dates;
    }

    // Navigate to next or previous week
    const navigateWeek = (direction) => {
    const firstDay = new Date(currentWeek[0]);
    firstDay.setDate(firstDay.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(generateWeekDates(firstDay));
    // Update selected date to first day of the new week
    setSelectedDate(new Date(firstDay));
    };

    // Format day and date
    const formatDayAndDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
        day: days[date.getDay()],
        date: date.getDate()
    };
    };

    // Check if date is today
    const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
            date.getMonth() === today.getMonth() && 
            date.getFullYear() === today.getFullYear();
    };

    // Check if date is selected
    const isSelected = (date) => {
    return date.getDate() === selectedDate.getDate() && 
            date.getMonth() === selectedDate.getMonth() && 
            date.getFullYear() === selectedDate.getFullYear();
    };

    // Generate time slots
    const timeSlots = [];
    for (let hour = 7; hour < 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 17) {
        timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    }

    // Sample events data
    const [events, setEvents] = useState([
        {
        id: 1,
        title: "Start Design",
        type: "task",
        date: "2025-04-08",
        startTime: "07:00",
        endTime: "08:00",
        participants: [
            { id: 1, avatar: "M", color: "bg-green-500" },
            { id: 2, avatar: "J", color: "bg-blue-500" }
        ],
        badge: "+2"
        },
        {
        id: 2,
        title: "Create Wireframe",
        type: "task",
        date: "2025-04-08",
        startTime: "08:00",
        endTime: "09:00",
        participants: [
            { id: 3, avatar: "K", color: "bg-purple-500" },
            { id: 4, avatar: "S", color: "bg-orange-500" }
        ],
        badge: "+2"
        },
        {
        id: 3,
        title: "Tech Conference 2024",
        type: "event",
        date: "2025-04-07",
        startTime: "10:00",
        endTime: "11:30",
        participants: [
            { id: 5, avatar: "D", color: "bg-red-500" },
            { id: 6, avatar: "T", color: "bg-indigo-500" }
        ],
        badge: "+1K"
        },
        {
        id: 4,
        title: "Learn a New Language",
        type: "goal",
        date: "2025-04-09",
        startTime: "09:00",
        endTime: "10:00",
        participants: [
            { id: 1, avatar: "M", color: "bg-green-500" }
        ]
        },
        {
        id: 5,
        title: "Webinar: Career Development",
        type: "event",
        date: "2025-04-07",
        startTime: "07:30",
        endTime: "09:30",
        participants: [
            { id: 2, avatar: "J", color: "bg-blue-500" }
        ]
        },
        {
        id: 6,
        title: "Complete the task",
        type: "goal",
        date: "2025-04-10",
        startTime: "09:00",
        endTime: "10:00",
        participants: [
            { id: 3, avatar: "K", color: "bg-purple-500" },
            { id: 4, avatar: "S", color: "bg-orange-500" }
        ],
        badge: "+2"
        },
        {
        id: 7,
        title: "Working on Prototyping",
        type: "task",
        date: "2025-04-07",
        startTime: "11:00",
        endTime: "12:00",
        participants: [
            { id: 5, avatar: "D", color: "bg-red-500" }
        ]
        }
    ]);
    

    // Helper to get event background color based on type
    const getEventBgColor = (type) => {
    switch(type) {
        case 'task': return 'bg-amber-50 border-amber-200';
        case 'event': return 'bg-blue-50 border-blue-200';
        case 'goal': return 'bg-red-50 border-red-200';
        default: return 'bg-gray-50 border-gray-200';
    }
    };

    // Helper to get event badge color based on type
    const getEventBadgeColor = (type) => {
    switch(type) {
        case 'task': return 'bg-amber-100 text-amber-800';
        case 'event': return 'bg-blue-100 text-blue-800';
        case 'goal': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
    };

    // Helper to position an event in the grid
    const getEventPosition = (event) => {
        const startHour = parseInt(event.startTime.split(':')[0]);
        const startMinute = parseInt(event.startTime.split(':')[1]);
        const endHour = parseInt(event.endTime.split(':')[0]);
        const endMinute = parseInt(event.endTime.split(':')[1]);
        
        // Calculate row positions
        const startRow = (startHour - 7) * 2 + (startMinute === 30 ? 1 : 0) + 1;
        const endRow = (endHour - 7) * 2 + (endMinute === 30 ? 1 : 0) + 1;
        const duration = endRow - startRow;
        
        // For the week view, we need to calculate the day column based on the date
        let dayColumn = 0;
        if (event.dayIndex !== undefined) {
        // If dayIndex is provided (for the week view)
        dayColumn = event.dayIndex + 2;
        } else {
        // Otherwise calculate it from the date
        const eventDate = new Date(event.date);
        const day = eventDate.getDay();
        // Convert to our format (Monday = 0, ... Sunday = 6)
        const adjustedDay = day === 0 ? 6 : day - 1;
        dayColumn = adjustedDay + 2;
        }
        
        return {
        gridRowStart: startRow,
        gridRowEnd: `span ${duration}`,
        gridColumnStart: dayColumn
        };
    };

    // Generate mini calendar with selectable dates
    const generateMiniCalendar = () => {
    const days = ['M', 'T', 'W', 'Tl', 'F', 'S', 'So'];
    const rows = [];
    
    // Get first day of currently selected month
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Header row with day abbreviations
    rows.push(
        <div key="header" className="grid grid-cols-7 text-center mb-1">
        {days.map(day => (
            <div key={day} className="text-xs font-medium text-gray-600">
            {day}
            </div>
        ))}
        </div>
    );

    // Calculate offset for first day of month
    let firstDayOffset = firstDay.getDay() - 1; // Adjusting for Monday start
    if (firstDayOffset < 0) firstDayOffset = 6; // Sunday becomes last
    
    // Create date grid
    let cells = [];
    
    // Add empty cells for offset
    for (let i = 0; i < firstDayOffset; i++) {
        cells.push(<div key={`empty-${i}`} className="h-6 w-6 text-center"></div>);
    }
    
    // Add date cells
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
        const isCurrentDay = date.getDate() === new Date().getDate() && 
                            date.getMonth() === new Date().getMonth() && 
                            date.getFullYear() === new Date().getFullYear();
        const isSelected = date.getDate() === selectedDate.getDate() && 
                        date.getMonth() === selectedDate.getMonth() && 
                        date.getFullYear() === selectedDate.getFullYear();
        
        const hasEvents = events.some(event => event.date === date.toISOString().split('T')[0]);
        // In the generateMiniCalendar function
        cells.push(
            <div 
            key={`day-${day}`} 
            className="h-6 w-6 flex flex-col items-center justify-center cursor-pointer"
            onClick={() => {
                selectDate(date);
                setCurrentView('week');
                setCurrentWeek(generateWeekDates(date));
            }}
            >
            <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full relative
                        ${isCurrentDay ? 'bg-blue-500 text-white' : ''}
                        ${isSelected && !isCurrentDay ? 'bg-blue-200 text-blue-800' : ''}
                        ${!isCurrentDay && !isSelected ? 'hover:bg-gray-100' : ''}`}>
                {day}
                {hasEvents && <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1 h-1 bg-blue-500 rounded-full"></span>}
            </span>
            </div>
        );
    }
    
    // Create rows with 7 cells each
    const dateRows = [];
    for (let i = 0; i < cells.length; i += 7) {
        dateRows.push(
        <div key={`row-${i}`} className="grid grid-cols-7 gap-0">
            {cells.slice(i, i + 7)}
        </div>
        );
    }
    
    return [...rows, ...dateRows];
    };

    // Modal for creating new events
    const EventModal = ({ isEdit = false }) => {
        const [newEvent, setNewEvent] = useState(() => {
            if (isEdit && selectedEvent) {
                // For editing, use the existing event's data
                return {...selectedEvent};
            } else {
                // For new events, use today's date as default
                const today = new Date();
                const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                
                return {
                    title: "",
                    type: "task",
                    startTime: "09:00",
                    endTime: "10:00",
                    date: formattedDate,
                    participants: []
                };
            }
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            
            console.log("Before update - Selected event:", selectedEvent);
            console.log("Before update - New event data:", newEvent);
            console.log("Before update - All events:", events);
            
            const eventToSave = {
              ...newEvent,
              id: isEdit && selectedEvent ? selectedEvent.id : Date.now(),
              date: newEvent.date || `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
            };
        
            console.log("Event to save:", eventToSave);
        
            if (isEdit && selectedEvent) {
              // Update existing event
              setEvents(prevEvents => {
                const updatedEvents = prevEvents.map(ev => 
                  ev.id === selectedEvent.id ? eventToSave : ev
                );
                console.log("After update - Updated events:", updatedEvents);
                return updatedEvents;
              });
            } else {
              // Add new event
              setEvents(prevEvents => [...prevEvents, eventToSave]);
            }
        
            setShowModal(false);
            setSelectedEvent(null);
            
            if (currentView !== 'week') {
              setCurrentView('week');
            }
            setCurrentWeek(generateWeekDates(new Date(eventToSave.date)));
        };
    

    const handleDelete = () => {
        setEvents(prevEvents => prevEvents.filter(ev => ev.id !== selectedEvent.id));
        setShowModal(false);
        setSelectedEvent(null);
    };
    

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{isEdit ? 'Edit Event' : 'Create New Event'}</h3>
            <button onClick={() => {setShowModal(false); setSelectedEvent(null);}} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            </div>
            
            <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                />
            </div>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                <option value="task">Task</option>
                <option value="event">Event</option>
                <option value="goal">Goal</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="flex items-center">
                <input
  type="date"
  value={newEvent.date}
  onChange={(e) => {
    console.log("Date changed to:", e.target.value);
    console.log("Previous event data:", newEvent);
    setNewEvent({...newEvent, date: e.target.value});
    console.log("Updated event data:", {...newEvent, date: e.target.value});
  }}
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
  required
/>
                    <button
                    type="button"
                    onClick={() => {
                        // Show a date picker or the mini calendar
                        // For simplicity, let's just use today's date
                        const today = new Date();
                        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                        setNewEvent({...newEvent, date: formattedDate});
                    }}
                    className="ml-2 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                    <Calendar className="h-4 w-4 text-gray-600" />
                    </button>
                </div>
                </div>
            </div>

            <div className="flex justify-between">
                {isEdit && (
                <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                    Delete
                </button>
                )}
                <div className="flex space-x-2 ml-auto">
                <button
                    type="button"
                    onClick={() => {setShowModal(false); setSelectedEvent(null);}}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                    {isEdit ? 'Update' : 'Create'}
                </button>
                </div>
            </div>
            </form>
        </div>
        </div>
    );
    };

    // Modified header with view-switching functionality
    const Header = () => (
    <header className="bg-white border-b border-gray-200 py-2">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center w-full md:w-auto mb-4 md:mb-0">
            <Link to="/" className="flex items-center">
                <button className="p-2 rounded-lg hover:bg-gray-100 mr-2">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
            </Link>
            <div className="p-2 rounded-lg bg-blue-500 text-white mr-2">
            <Calendar className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold">Calendar App</h1>
        </div>
        <div className="flex items-center w-full md:w-auto">
        <nav className="flex space-x-4 mr-4 overflow-x-auto whitespace-nowrap">
        <button 
            className={`px-3 py-1.5 text-sm rounded-md ${currentView === 'week' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => changeView('week')}
        >
            Week
        </button>
        <button 
            className={`px-3 py-1.5 text-sm rounded-md ${currentView === 'month' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => changeView('month')}
        >
            Month
        </button>
        <button 
            className={`px-3 py-1.5 text-sm rounded-md ${currentView === 'year' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => changeView('year')}
        >
            Year
        </button>
        </nav>
            <div className="relative">
            <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.trim()) {
                    const results = events.filter(event => 
                    event.title.toLowerCase().includes(e.target.value.toLowerCase())
                    );
                    setSearchResults(results);
                    setShowSearchResults(true);
                } else {
                    setShowSearchResults(false);
                }
                }}
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map(event => (
                    <div 
                    key={event.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0"
                    onClick={() => {
                        // Navigate to the event's week
                        setSelectedDate(new Date(event.date));
                        setCurrentWeek(generateWeekDates(new Date(event.date)));
                        setCurrentView('week');
                        setShowSearchResults(false);
                        setSearchTerm('');
                    }}
                    >
                    <div className="font-medium">{event.title}</div>
                    <div className="text-xs text-gray-500">
                        {new Date(event.date).toLocaleDateString()} • {event.startTime} - {event.endTime}
                    </div>
                    </div>
                ))}
                </div>
            )}
            
            {showSearchResults && searchResults.length === 0 && searchTerm.trim() && (
                <div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg p-3 text-sm text-gray-500">
                No events found
                </div>
            )}
            </div>
        </div>
        </div>
    </header>
    );

    // Different views based on currentView state
    const renderDayView = () => (
    <div className="overflow-x-auto">
        <div className="relative grid grid-cols-2 min-w-max">
        {/* Time column */}
        <div className="border-r border-gray-100">
            {timeSlots.map((time, index) => (
            <div key={index} className="h-12 flex items-center justify-center border-b border-gray-100">
                <span className="text-xs text-gray-500">{time}</span>
            </div>
            ))}
        </div>
    
        {/* Single day column with events */}
        <div className="relative border-r border-gray-100">
            {timeSlots.map((time, index) => (
            <div key={index} className="h-12 border-b border-gray-100"></div>
            ))}
            
            {/* Events for selected day */}
            {events
            .filter(event => {
                // Calculate which day of the week the selected date is (0-6)
                const dayOfWeek = selectedDate.getDay();
                // Adjust to our day numbering (Monday = 0, ... Sunday = 6)
                const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                return event.date === selectedDate.toISOString().split('T')[0];
            })
            .map(event => {
                const position = getEventPosition(event);
                
                return (
                <div 
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className={`absolute w-full px-2 rounded-md border-l-4 cursor-pointer hover:opacity-90
                            ${getEventBgColor(event.type)}
                            ${event.type === 'task' ? 'border-l-amber-500' : 
                                event.type === 'event' ? 'border-l-blue-500' : 'border-l-red-500'}`}
                    style={{
                    gridRowStart: position.gridRowStart,
                    gridRowEnd: position.gridRowEnd,
                    top: `${(position.gridRowStart - 1) * 48}px`, // 48px = height of time slot
                    height: `${(parseInt(position.gridRowEnd.split(' ')[1])) * 48}px`,
                    left: '0',
                    right: '0'
                    }}
                >
                    <div className="text-xs font-medium pt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs ${getEventBadgeColor(event.type)}`}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                    </div>
                    <div className="font-medium text-sm mt-1">{event.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{event.startTime} - {event.endTime}</div>
                    
                    {event.participants && (
                    <div className="flex items-center mt-2">
                        {event.participants.slice(0, 2).map((participant, i) => (
                        <div key={i} className={`${participant.color} w-6 h-6 rounded-full flex items-center justify-center text-white text-xs -ml-1 first:ml-0 border-2 border-white`}>
                            {participant.avatar}
                        </div>
                        ))}
                        {event.badge && (
                        <span className="ml-1 text-xs text-gray-500">{event.badge}</span>
                        )}
                    </div>
                    )}
                </div>
                );
            })
            }
        </div>
        </div>
    </div>
    );

    const renderWeekView = () => (
<div className="overflow-x-auto">
    <div className="relative grid grid-cols-8 min-w-max">
    {/* Time column */}
    <div className="border-r border-gray-100">
        {timeSlots.map((time, index) => (
        <div key={index} className="h-12 flex items-center justify-center border-b border-gray-100">
            <span className="text-xs text-gray-500">{time}</span>
        </div>
        ))}
    </div>

    {/* Day columns */}
    {currentWeek.map((date, dayIndex) => {
        const isoDate = date.toISOString().split('T')[0];
        const isSelectedDay =
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();

        return (
        <div key={dayIndex} className={`relative border-r border-gray-100 ${isSelectedDay ? 'bg-blue-50' : ''}`}>
            {timeSlots.map((_, i) => (
            <div key={i} className="h-12 border-b border-gray-100" />
            ))}

            {/* Events for the current date */}
            {events
            .filter(event => {
                // ISO format: YYYY-MM-DD
                const isoDate = date.toISOString().split('T')[0];
                return event.date === isoDate;
            })
            .map(event => {
                const position = getEventPosition({
                    ...event,
                    dayIndex: dayIndex
                });

                return (
                <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className={`absolute w-full px-2 rounded-md border-l-4 cursor-pointer hover:opacity-90
                    ${getEventBgColor(event.type)}
                    ${event.type === 'task' ? 'border-l-amber-500' :
                        event.type === 'event' ? 'border-l-blue-500' : 'border-l-red-500'}`}
                    style={{
                    gridRowStart: position.gridRowStart,
                    gridRowEnd: position.gridRowEnd,
                    top: `${(position.gridRowStart - 1) * 48}px`,
                    height: `${(parseInt(position.gridRowEnd.split(' ')[1])) * 48}px`
                    }}
                >
                    <div className="text-xs font-medium pt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs ${getEventBadgeColor(event.type)}`}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                    </div>
                    <div className="font-medium text-sm mt-1">{event.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{event.startTime} - {event.endTime}</div>

                    {event.participants && (
                    <div className="flex items-center mt-2">
                        {event.participants.slice(0, 2).map((participant, i) => (
                        <div key={i} className={`${participant.color} w-6 h-6 rounded-full flex items-center justify-center text-white text-xs -ml-1 first:ml-0 border-2 border-white`}>
                            {participant.avatar}
                        </div>
                        ))}
                        {event.badge && (
                        <span className="ml-1 text-xs text-gray-500">{event.badge}</span>
                        )}
                    </div>
                    )}
                </div>
                );
            })}
        </div>
        );
    })}
    </div>
</div>
);


    const renderMonthView = () => (
        <div className="bg-white p-4">
        <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center py-2 font-medium text-gray-500">
                {day}
            </div>
            ))}
            
            {(() => {
            const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            const daysInMonth = lastDay.getDate();
            
            // Calculate offset for first day of month (Monday = 0)
            let firstDayOffset = firstDay.getDay() - 1;
            if (firstDayOffset < 0) firstDayOffset = 6; // Sunday becomes last
            
            const cells = [];
            
            // Add empty cells for offset
            for (let i = 0; i < firstDayOffset; i++) {
                cells.push(<div key={`empty-start-${i}`} className="border rounded-md p-2 min-h-16 bg-white"></div>);
            }
            
            // Add date cells only for current month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                const isCurrentDay = isToday(date);
                
                // Count events for this day
                const isoDate = date.toISOString().split('T')[0];
                const dayEvents = events.filter(event => event.date === isoDate);
                
                cells.push(
                <div 
                    key={`day-${day}`}
                    className="border rounded-md p-2 min-h-16 bg-white"
                    onClick={() => {
                    selectDate(date);
                    setCurrentView('week');
                    setCurrentWeek(generateWeekDates(date));
                    }}
                >
                    <div className={`text-right mb-1 relative ${isCurrentDay ? 'font-bold text-blue-500' : ''}`}>
                    {day}
                    {dayEvents.length > 0 && (
                        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1 h-1 bg-blue-500 rounded-full"></span>
                    )}
                    </div>
                    {dayEvents.length > 0 && (
                    <div className="text-xs">
                        {dayEvents.slice(0, 2).map(event => (
                        <div 
                            key={event.id}
                            onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                            }}
                            className={`mb-1 truncate px-1 py-0.5 rounded cursor-pointer ${
                            event.type === 'task' ? 'bg-amber-100 text-amber-800' : 
                            event.type === 'event' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                            }`}
                        >
                            {event.title}
                        </div>
                        ))}
                        {dayEvents.length > 2 && (
                        <div 
                            className="text-center text-gray-500 cursor-pointer"
                            onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(date);
                            setCurrentView('week');
                            setCurrentWeek(generateWeekDates(date));
                            }}
                        >
                            +{dayEvents.length - 2} more
                        </div>
                        )}
                    </div>
                    )}
                </div>
                );
            }
            
            // Add empty cells at the end to complete the grid if needed
            const totalCells = firstDayOffset + daysInMonth;
            const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
            
            for (let i = 0; i < remainingCells; i++) {
                cells.push(<div key={`empty-end-${i}`} className="border rounded-md p-2 min-h-16 bg-white"></div>);
            }
            
            return cells;
            })()}
        </div>
        </div>
    );

    const renderYearView = () => (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-4 p-4">
        {Array.from({ length: 12 }).map((_, monthIndex) => {
        const monthName = new Date(selectedDate.getFullYear(), monthIndex).toLocaleString('default', { month: 'short' });
        const isCurrentMonth = monthIndex === new Date().getMonth() && 
                                selectedDate.getFullYear() === new Date().getFullYear();
        
        return (
            <div 
            key={monthIndex}
            className={`border rounded-lg p-2 cursor-pointer hover:bg-gray-50 ${
                isCurrentMonth ? 'border-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(monthIndex);
                setSelectedDate(newDate);
                setCurrentView('month');
            }}
            >
            <div className="font-medium text-center">{monthName}</div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs text-gray-400">{day}</div>
                ))}
                
                {/* Mini calendar for the month */}
                {Array.from({ length: 35 }).map((_, day) => {
    const firstDay = new Date(selectedDate.getFullYear(), monthIndex, 1);
    let dayOffset = firstDay.getDay() - 1; // Start from Monday
    if (dayOffset < 0) dayOffset = 6; // Adjust Sunday
    
    const date = new Date(selectedDate.getFullYear(), monthIndex, day - dayOffset + 1);
    const isMonthDay = date.getMonth() === monthIndex;
    
    // Check if this date has any events
    const hasEvents = isMonthDay && events.some(event => 
        event.date === date.toISOString().split('T')[0]
    );
    
    return (
        <div key={day} className="text-center text-xs relative">
        {isMonthDay && day >= dayOffset && date.getDate() <= new Date(selectedDate.getFullYear(), monthIndex + 1, 0).getDate() ? (
            <>
                <span>{date.getDate()}</span>
                {hasEvents && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
            </>
        ) : ''}
        </div>
    );
})}
            </div>
            </div>
        );
        })}
    </div>
    );

    // Function to render the current view based on state
    const renderCurrentView = () => {
    if (currentView === 'day') {
        return (
        <>
            <div className="py-3 text-center border-b border-gray-100">
            <div className="text-lg font-semibold">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            </div>
            {renderDayView()}
        </>
        );
    } else if (currentView === 'week') {
        return (
        <>
            <div className="grid grid-cols-8 border-b border-gray-100 overflow-x-auto">
            <div className="py-3 border-r border-gray-100 min-w-16"></div>
            {currentWeek.map((date, index) => {
                const { day, date: dateNum } = formatDayAndDate(date);
                const today = isToday(date);
                
                return (
                <div 
                    key={index} 
                    className={`py-3 text-center border-r border-gray-100 min-w-16 ${today ? 'font-bold' : ''} cursor-pointer`}
                    onClick={() => setSelectedDate(date)}
                >
                    <div className={`text-lg ${today ? 'text-blue-500' : 'text-gray-700'}`}>
                    {dateNum}
                    </div>
                    <div className="text-sm text-gray-500">
                    {day}
                    </div>
                </div>
                );
            })}
            </div>
            {renderWeekView()}
        </>
        );
    } else if (currentView === 'month') {
        return renderMonthView();
    } else if (currentView === 'year') {
        return renderYearView();
    }
    
    // Default to week view
    return (
        <>
        <div className="grid grid-cols-8 border-b border-gray-100 overflow-x-auto">
            <div className="py-3 border-r border-gray-100 min-w-16"></div>
            {currentWeek.map((date, index) => {
            const { day, date: dateNum } = formatDayAndDate(date);
            return (
                <div key={index} className="py-3 text-center border-r border-gray-100 min-w-16">
                <div className="text-lg text-gray-700">{dateNum}</div>
                <div className="text-sm text-gray-500">{day}</div>
                </div>
            );
            })}
        </div>
        {renderWeekView()}
        </>
    );
    };

    // Set initial focus to current date
    useEffect(() => {
    // Find today's date and highlight it
    const today = new Date();
    // Update selected date to today
    setSelectedDate(today);
    // Generate week dates based on today
    setCurrentWeek(generateWeekDates(today));
    }, []);

    return (
    <div className="bg-gray-50 min-h-screen">
        <Header />

        {/* Main content - Responsive layout */}
        <div className="container mx-auto px-4 py-6">
        {/* View options and navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="p-4 flex flex-col md:flex-row justify-between items-center border-b border-gray-100">
            <div className="text-lg font-semibold mb-4 md:mb-0">
                {currentMonth} {currentYear}
            </div>
            <div className="flex items-center w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center">
                <button onClick={() => {
                    if (currentView === 'week') navigateWeek('prev');
                    else if (currentView === 'month' || currentView === 'day') {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() - 1); 
                    setSelectedDate(newDate);
                    } else if (currentView === 'year') {
                    const newDate = new Date(selectedDate);
                    newDate.setFullYear(newDate.getFullYear() - 1);
                    setSelectedDate(newDate);
                    }
                }} className="mr-2 p-1 rounded-full hover:bg-gray-100">
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <span className="text-sm font-medium hidden md:block">
                    {currentView === 'week' && (
                    <>
                        {currentWeek[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                        {currentWeek[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </>
                    )}
                    {currentView === 'day' && (
                    <>
                        {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </>
                    )}
                    {currentView === 'month' && (
                    <>
                        {selectedDate.toLocaleDateString('en-US', { month: 'long' })}
                    </>
                    )}
                    {currentView === 'year' && (
                    <>
                        {selectedDate.getFullYear()}
                    </>
                    )}
                </span>
                <button onClick={() => {
                    if (currentView === 'week') navigateWeek('next');
                    else if (currentView === 'month' || currentView === 'day') {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
                    } else if (currentView === 'year') {
                    const newDate = new Date(selectedDate);
                    newDate.setFullYear(newDate.getFullYear() + 1);
                    setSelectedDate(newDate);
                    }
                }} className="ml-2 p-1 rounded-full hover:bg-gray-100">
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
                </div>
                <button 
                onClick={() => setShowModal(true)}
                className="ml-4 px-4 py-1.5 bg-blue-500 text-white text-sm rounded-md flex items-center"
                >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Create New</span>
                <span className="md:hidden">New</span>
                </button>
            </div>
            </div>

            {/* Calendar Main View - Responsive */}
            <div className="flex flex-col md:flex-row">
            {/* Main calendar - takes full width on mobile, flex-1 on desktop */}
            <div className="w-full md:flex-1">
                {renderCurrentView()}
            </div>

            {/* Mini Calendar - Only visible on desktop */}
            <div className="hidden md:block w-64 bg-white border-l border-gray-100 p-4">
                <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">{currentMonth} {currentYear}</h3>
                <div className="flex space-x-2">
                    <button 
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-gray-100 rounded-full"
                    >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    <button 
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-gray-100 rounded-full"
                    >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                    </button>
                </div>
                </div>

                {/* Mini calendar with date selection */}
                <div className="mb-6">
                {generateMiniCalendar()}
                </div>

                {/* Upcoming events section with clickable events */}
                {/* Upcoming events section */}
<div>
<div className="flex justify-between items-center mb-4">
    <h3 className="font-medium">Upcoming</h3>
    <button 
    onClick={() => setShowAllUpcoming(!showAllUpcoming)} 
    className="text-xs text-blue-500"
    >
    {showAllUpcoming ? "Show Less" : "See All"}
    </button>  </div>

<div className="space-y-4">
    {(() => {
    // Get today and next 6 days as ISO strings
    const today = new Date();
    const nextSixDays = [];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        nextSixDays.push(date.toISOString().split('T')[0]); // Store as YYYY-MM-DD
    }
    
    // Filter events for these dates
    return events
        .filter(event => nextSixDays.includes(event.date))
        .sort((a, b) => {
        // First sort by date
        if (a.date !== b.date) return nextSixDays.indexOf(a.date) - nextSixDays.indexOf(b.date);
        // Then by start time
        return a.startTime.localeCompare(b.startTime);
        })
        .slice(0, showAllUpcoming ? undefined : 3) // Show only 3 upcoming events
        .map(event => {
        // Convert event date string to Date object
        const eventDate = new Date(event.date);
        
        return (
            <div 
            key={event.id}
            onClick={() => handleEventClick(event)}
            className="p-3 bg-white border border-gray-100 rounded-md hover:shadow-sm transition-shadow cursor-pointer"
            >
            <h4 className="font-medium text-sm">{event.title}</h4>
            <p className="text-xs text-gray-500 mt-1">
                {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} / 
                {event.startTime} - {event.endTime}
            </p>
            {event.participants && (
                <div className="flex items-center mt-2">
                <div className="flex">
                    {event.participants.slice(0, 2).map((participant, i) => (
                    <div key={i} className={`${participant.color} w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${i > 0 ? '-ml-1' : ''} border-2 border-white`}>
                        {participant.avatar}
                    </div>
                    ))}
                </div>
                {event.badge && (
                    <span className="ml-1 text-xs text-gray-500">{event.badge}</span>
                )}
                </div>
            )}
            </div>
        );
        });
    })()}
</div>
</div>
            </div>
            </div>
        </div>
        </div>

        {/* Modal for creating/editing events */}
        {showModal && (
        <EventModal isEdit={selectedEvent !== null} />
        )}
    </div>
    );
};

export default WeeklyCalendar;