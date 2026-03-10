import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { hasTimeConflict } from '../utils/dateUtils';
import calendarService from '../services/calanderService';
import { useAuth } from './AuthContext';

// Constants for action types
const SET_DATE = 'SET_DATE';
const SET_VIEW = 'SET_VIEW';
const SET_SELECTED_DATE = 'SET_SELECTED_DATE';
const SET_EVENTS = 'SET_EVENTS';
const ADD_EVENT = 'ADD_EVENT';
const UPDATE_EVENT = 'UPDATE_EVENT';
const DELETE_EVENT = 'DELETE_EVENT';
const SET_SEARCH_TERM = 'SET_SEARCH_TERM';
const SET_SHOW_ALL_UPCOMING = 'SET_SHOW_ALL_UPCOMING';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';

// Initial calendar state
const initialState = {
  currentDate: new Date(),
  selectedDate: new Date(),
  view: 'month',
  events: [],
  searchTerm: '',
  showAllUpcoming: false,
  loading: false,
  error: null
};

// Reducer to handle calendar actions
const calendarReducer = (state, action) => {
  switch (action.type) {
    case SET_DATE:
      return { ...state, currentDate: action.payload };
    case SET_VIEW:
      return { ...state, view: action.payload };
    case SET_SELECTED_DATE:
      return { ...state, selectedDate: action.payload };
    case SET_EVENTS:
      return {
        ...state,
        events: action.payload,
        loading: false,
        error: null
      };
    case ADD_EVENT:
      if (hasTimeConflict(state.events, action.payload)) {
        alert('Cannot add event due to a time conflict!');
        return state;
      }
      return { ...state, events: [...state.events, action.payload] };
    case UPDATE_EVENT: {
      const filteredEvents = state.events.filter(event => event.id !== action.payload.id);
      if (hasTimeConflict(filteredEvents, action.payload)) {
        alert('Cannot update event due to a time conflict!');
        return state;
      }
      return {
        ...state,
        events: [...filteredEvents, action.payload]
      };
    }
    case DELETE_EVENT:
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
      };
    case SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };
    case SET_SHOW_ALL_UPCOMING:
      return { ...state, showAllUpcoming: action.payload };
    case SET_LOADING:
      return { ...state, loading: action.payload };
    case SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

// Create the calendar context
const CalendarContext = createContext();

// Calendar provider component
export const CalendarProvider = ({ children }) => {
  const [state, dispatch] = useReducer(calendarReducer, initialState);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  
  const fetchAllCalendarItems = async () => {
    try {
      dispatch({ type: SET_LOADING, payload: true });
      
      // Use different endpoints based on admin status
      const [events, tasks] = await Promise.all([
        isAdmin ? calendarService.getAllEvents() : calendarService.getAllVisibleEvents(),
        isAdmin ? calendarService.getAllTasks() : calendarService.getAllVisibleTasks()
      ]);

      const allItems = [...events, ...tasks].map(item => ({
        ...item,
        start: new Date(item.startTime),
        end: new Date(item.dueDate)
      }));
      
      dispatch({ type: SET_EVENTS, payload: allItems });
    } catch (error) {
      console.error('Failed to fetch calendar items:', error);
      dispatch({ type: SET_ERROR, payload: 'Failed to load calendar items. Please try again.' });
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  };

  useEffect(() => {
    fetchAllCalendarItems();
  }, [isAdmin]);

  const setDate = (date) => dispatch({ type: SET_DATE, payload: date });
  const setView = (view) => dispatch({ type: SET_VIEW, payload: view });
  const setSelectedDate = (date) => dispatch({ type: SET_SELECTED_DATE, payload: date });
  
  const navigateToDay = (date) => {
    setSelectedDate(date);
    setView('day');
  };
  
  const navigateToWeek = (date) => {
    setSelectedDate(date);
    setView('week');
    setDate(date);
  };
  
  const addEvent = async (event) => {
    try {
      dispatch({ type: SET_LOADING, payload: true });
      const savedEvent = await calendarService.createEvent({
        ...event,
        startTime: event.start.toISOString(),
        dueDate: event.end.toISOString()
      });
      
      dispatch({ type: ADD_EVENT, payload: {
        ...savedEvent,
        start: new Date(savedEvent.startTime),
        end: new Date(savedEvent.dueDate)
      }});
      return savedEvent;
    } catch (error) {
      console.error('Failed to add event:', error);
      dispatch({ type: SET_ERROR, payload: 'Failed to create event. Please try again.' });
      throw error;
    }
  };
  
  const updateEvent = async (event) => {
    try {
      dispatch({ type: SET_LOADING, payload: true });
      const updatedEvent = await calendarService.updateEvent(event.id, {
        ...event,
        startTime: event.start.toISOString(),
        dueDate: event.end.toISOString()
      });
      
      dispatch({ type: UPDATE_EVENT, payload: {
        ...updatedEvent,
        start: new Date(updatedEvent.startTime),
        end: new Date(updatedEvent.dueDate)
      }});
      return updatedEvent;
    } catch (error) {
      console.error('Failed to update event:', error);
      dispatch({ type: SET_ERROR, payload: 'Failed to update event. Please try again.' });
      throw error;
    }
  };
  
  const deleteEvent = async (eventId) => {
    try {
      dispatch({ type: SET_LOADING, payload: true });
      await calendarService.deleteEvent(eventId);
      dispatch({ type: DELETE_EVENT, payload: eventId });
      await fetchAllCalendarItems();
    } catch (error) {
      console.error('Failed to delete event:', error);
      dispatch({ type: SET_ERROR, payload: 'Failed to delete event. Please try again.' });
      throw error;
    }
  };
  
  const setSearchTerm = (term) => dispatch({ type: SET_SEARCH_TERM, payload: term });
  const setShowAllUpcoming = (show) => dispatch({ type: SET_SHOW_ALL_UPCOMING, payload: show });
  
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
        setShowAllUpcoming,
        refreshEvents: fetchAllCalendarItems
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};