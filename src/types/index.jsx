// Event object structure (for documentation purposes only)
/**
 * @typedef {Object} Event
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {Date} start
 * @property {Date} end
 * @property {string} color
 */

// View types (optional documentation only)
/**
 * @typedef {'day' | 'week' | 'month' | 'year'} ViewType
 */

// CalendarContext shape (for reference or PropTypes)
/**
 * @typedef {Object} CalendarContextType
 * @property {Date} currentDate
 * @property {Date} selectedDate
 * @property {ViewType} view
 * @property {Event[]} events
 * @property {string} searchTerm
 * @property {boolean} showAllUpcoming
 * @property {(date: Date) => void} setDate
 * @property {(view: ViewType) => void} setView
 * @property {(date: Date) => void} setSelectedDate
 * @property {(date: Date) => void} navigateToDay
 * @property {(date: Date) => void} navigateToWeek
 * @property {(event: Omit<Event, 'id'>) => void} addEvent
 * @property {(event: Event) => void} updateEvent
 * @property {(eventId: string) => void} deleteEvent
 * @property {(term: string) => void} setSearchTerm
 * @property {() => Event[]} getFilteredEvents
 * @property {(show: boolean) => void} setShowAllUpcoming
 */

// TimeSlot object structure
/**
 * @typedef {Object} TimeSlot
 * @property {number} hour
 * @property {number} minute
 */

// EventFormProps (for props documentation)
/**
 * @typedef {Object} EventFormProps
 * @property {Event} [event]
 * @property {() => void} onClose
 */
