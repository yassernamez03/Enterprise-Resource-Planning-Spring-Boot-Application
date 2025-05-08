import React, { createContext, useContext, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { hasTimeConflict } from '../utils/dateUtils';

// Constants for action types
const SET_DATE = 'SET_DATE';
const SET_VIEW = 'SET_VIEW';
const SET_SELECTED_DATE = 'SET_SELECTED_DATE';
const ADD_EVENT = 'ADD_EVENT';
const UPDATE_EVENT = 'UPDATE_EVENT';
const DELETE_EVENT = 'DELETE_EVENT';
const SET_SEARCH_TERM = 'SET_SEARCH_TERM';
const SET_SHOW_ALL_UPCOMING = 'SET_SHOW_ALL_UPCOMING';

// Initial calendar state
const initialState = {
  currentDate: new Date(),
  selectedDate: new Date(),
  view: 'month',
  events: [
    {
      id: uuidv4(),
      title: 'Gym Session',
      start: new Date(2025, 3, 21, 7, 0),
      end: new Date(2025, 3, 21, 8, 30),
      color: '#10b981', // green
      description: 'Morning workout routine',
      priority: 'Medium', // New field for priority
      global: false, // New field for global status
      assignedUserIds: [] // New field for assigned users (empty initially)
    },
    {
      id: uuidv4(),
      title: 'Product Meeting',
      start: new Date(2025, 3, 22, 10, 0),
      end: new Date(2025, 3, 22, 11, 30),
      color: '#3b82f6', // blue
      description: 'Weekly product review',
      priority: 'High', // New field for priority
      global: false, // New field for global status
      assignedUserIds: ['user1', 'user2'] // Example assigned users
    },
    {
      id: uuidv4(),
      title: 'Coffee with Sarah',
      start: new Date(2025, 3, 23, 14, 0),
      end: new Date(2025, 3, 23, 15, 0),
      color: '#8b5cf6', // purple
      description: 'Discuss new project ideas',
      priority: 'Low', // New field for priority
      global: false, // New field for global status
      assignedUserIds: ['user3'] // Example assigned user
    },
    {
      id: uuidv4(),
      title: 'Dentist Appointment',
      start: new Date(2025, 3, 26, 9, 0),
      end: new Date(2025, 3, 26, 10, 0),
      color: '#f59e0b', // amber
      description: 'Regular checkup',
      priority: 'Medium', // New field for priority
      global: false, // New field for global status
      assignedUserIds: [] // Empty list for assigned users
    },
    {
      id: uuidv4(),
      title: 'JS Conference',
      start: new Date(2025, 3, 27, 2, 30),
      end: new Date(2025, 3, 27, 13, 30),
      color: '#60a5fa', // light blue
      description: 'Annual JavaScript conference',
      priority: 'High', // New field for priority
      global: true, // Global event set to true
      assignedUserIds: [] // Empty list for assigned users
    },
    // Multi-day event example
    {
      id: uuidv4(),
      title: 'Team Retreat',
      start: new Date(2025, 4, 5, 9, 0),
      end: new Date(2025, 4, 7, 17, 0),
      color: '#ec4899', // pink
      description: 'Annual team building retreat',
      priority: 'High', // New field for priority
      global: false, // New field for global status
      assignedUserIds: ['user1', 'user4'] // Example assigned users
    }
  ]
  ,
  searchTerm: '',
  showAllUpcoming: false
};

// Reducer to handle calendar actions
const calendarReducer = (state, action) => {
  switch (action.type) {
    case SET_DATE:
      return {
        ...state,
        currentDate: action.payload
      };
    case SET_VIEW:
      return {
        ...state,
        view: action.payload
      };
    case SET_SELECTED_DATE:
      return {
        ...state, 
        selectedDate: action.payload
      };
    case ADD_EVENT:
      // Check for time conflicts
      if (hasTimeConflict(state.events, action.payload)) {
        alert('Cannot add event due to a time conflict!');
        return state;
      }
      return {
        ...state,
        events: [...state.events, action.payload]
      };
    case UPDATE_EVENT: {
      // Filter out the event to update
      const filteredEvents = state.events.filter(event => event.id !== action.payload.id);
      
      // Check for time conflicts (excluding the event being updated)
      if (hasTimeConflict(filteredEvents, action.payload)) {
        alert('Cannot update event due to a time conflict!');
        return state;
      }
      
      return {
        ...state,
        events: [
          ...filteredEvents,
          action.payload
        ]
      };
    }
    case DELETE_EVENT:
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
      };
    case SET_SEARCH_TERM:
      return {
        ...state,
        searchTerm: action.payload
      };
    case SET_SHOW_ALL_UPCOMING:
      return {
        ...state,
        showAllUpcoming: action.payload
      };
    default:
      return state;
  }
};

// Create the calendar context
const CalendarContext = createContext();

// Calendar provider component
export const CalendarProvider = ({ children }) => {
  const [state, dispatch] = useReducer(calendarReducer, initialState);
  
  // Set current date
  const setDate = (date) => {
    dispatch({ type: SET_DATE, payload: date });
  };
  
  // Set view mode (day, week, month, year)
  const setView = (view) => {
    dispatch({ type: SET_VIEW, payload: view });
  };
  
  // Set selected date
  const setSelectedDate = (date) => {
    dispatch({ type: SET_SELECTED_DATE, payload: date });
  };
  
  // Navigate to day view from a specific date
  const navigateToDay = (date) => {
    setSelectedDate(date);
    setView('day');
  };
  
  // Navigate to week view from a specific date
  const navigateToWeek = (date) => {
    setSelectedDate(date);
    setView('week');
    setDate(date);
  };
  
  // Add a new event
  const addEvent = (event) => {
    const newEvent = {
      ...event,
      id: uuidv4()
    };
    dispatch({ type: ADD_EVENT, payload: newEvent });
  };
  
  // Update an existing event
  const updateEvent = (event) => {
    dispatch({ type: UPDATE_EVENT, payload: event });
  };
  
  // Delete an event
  const deleteEvent = (eventId) => {
    dispatch({ type: DELETE_EVENT, payload: eventId });
  };
  
  // Set search term
  const setSearchTerm = (term) => {
    dispatch({ type: SET_SEARCH_TERM, payload: term });
  };
  
  // Set show all upcoming events flag
  const setShowAllUpcoming = (show) => {
    dispatch({ type: SET_SHOW_ALL_UPCOMING, payload: show });
  };
  
  // Get filtered events based on search term
  const getFilteredEvents = () => {
    if (!state.searchTerm) return state.events;
    
    return state.events.filter(event => 
      event.title.toLowerCase().includes(state.searchTerm.toLowerCase())
    );
  };
  
  return (
    <CalendarContext.Provider
      value={{
        ...state,
        setDate,
        setView,
        setSelectedDate,
        navigateToDay,
        navigateToWeek,
        addEvent,
        updateEvent,
        deleteEvent,
        setSearchTerm,
        getFilteredEvents,
        setShowAllUpcoming
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

// Custom hook to use the calendar context
export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};