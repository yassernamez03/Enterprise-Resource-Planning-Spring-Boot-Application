import apiService from './apiInterceptor';

// Base endpoint for calendar operations
const CALENDAR_ENDPOINT = '/task-events';

/**
 * Service for handling calendar events operations
 */
const calendarService = {
  /**
   * Get all calendar events
   */
  
  getAllEvents: async () => {
      try {
        return await apiService.get(`${CALENDAR_ENDPOINT}/admin/events`);
      } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
    },

  /**
   * Get all calendar Tasks
   */
  
  getAllTasks: async () => {
      try {
        return await apiService.get(`${CALENDAR_ENDPOINT}/admin/tasks`);
      } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
    },
  
    /**
   * Get all visible tasks for current user
   */
  
  getAllVisibleTasks: async () => {
      try {
        return await apiService.get(`${CALENDAR_ENDPOINT}/tasks`);
      } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
    },

    /**
   *  Get all visible Events for current user
   */
  
  getAllVisibleEvents: async () => {
      try {
        return await apiService.get(`${CALENDAR_ENDPOINT}/events`);
      } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
    },
  /**
   * Create a new calendar event
   * @param {Object} eventData - The event data to create
   * @returns {Promise<Object>} - Promise resolving to the created event
   */
    createEvent: async (eventData) => {
      console.log('Creating event with data:', eventData);
      // Ensure eventData is an object 
      if (typeof eventData !== 'object' || eventData === null) {
        throw new Error('Invalid event data');
      }
      
    return apiService.post(CALENDAR_ENDPOINT, eventData);
    },
  
  /**
   * Update an existing calendar event
   * @param {string|number} eventId - The ID of the event to update
   * @param {Object} eventData - The updated event data
   * @returns {Promise<Object>} - Promise resolving to the updated event
   */
  updateEvent: async (eventId, eventData) => {
    console.log('Updating event with ID:', eventId, 'and data:', eventData);
    // Ensure eventId is a valid string or number
    if (typeof eventId !== 'string' && typeof eventId !== 'number') {
      throw new Error('Invalid event ID');
    }
    return apiService.put(`${CALENDAR_ENDPOINT}/${eventId}`, eventData);
  },
  
  /**
   * Delete a calendar event
   * @param {string|number} eventId - The ID of the event to delete
   * @returns {Promise<Object>} - Promise resolving to deletion confirmation
   */
  deleteEvent: async (eventId) => {
    return apiService.delete(`${CALENDAR_ENDPOINT}/${eventId}`);
  },
  
  /**
   * Make event/Task as done
   */
  
  toggleTaskCompletion: async (taskId) => {
    try {
        return await apiService.patch(`${CALENDAR_ENDPOINT}/tasks/${taskId}/toggle-completion`);
    } catch (error) {
        console.error('Failed to toggle task completion:', error);
        throw error;
    }
},
};

export default calendarService;