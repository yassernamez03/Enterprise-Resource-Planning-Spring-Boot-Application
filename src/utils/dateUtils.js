export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
};

export const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const addWeeks = (date, weeks) => {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);  // Ajouter ou soustraire le nombre de semaines (7 jours par semaine)
  return result;
};


export const isSameMonth = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const startOfWeek = (date) => {
  const result = new Date(date);
  const day = result.getDay() || 7; // Convert Sunday (0) to 7
  if (day !== 1) { // If not Monday
    result.setDate(result.getDate() - (day - 1)); // Go back to Monday
  }
  return startOfDay(result);
};

export const endOfWeek = (date) => {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  return endOfDay(result);
};

export const startOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

export const getMonthDays = (year, month) => {
  const result = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Add days from previous month to start from Monday
  const firstDayOfWeek = firstDay.getDay() || 7; // Convert Sunday (0) to 7
  if (firstDayOfWeek > 1) {
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
      const date = new Date(year, month, 1 - i);
      result.push(date);
    }
  }
  
  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    result.push(new Date(year, month, i));
  }
  
  // Add days from next month to complete the grid
  const remainingDays = 42 - result.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    result.push(new Date(year, month + 1, i));
  }
  
  return result;
};

export const getEventsForDay = (events, date) => {
  const start = startOfDay(date);
  const end = endOfDay(date);
  
  return events.filter(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (eventStart <= end && eventEnd >= start);
  });
};

export const getEventsForWeek = (events, date) => {
  const start = startOfWeek(date);
  const end = endOfWeek(date);
  
  return events.filter(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (eventStart <= end && eventEnd >= start);
  });
};

export const getEventsForMonth = (events, date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  return events.filter(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (eventStart <= end && eventEnd >= start);
  });
};

export const getUpcomingEvents = (events, limit = 5) => {
  const now = new Date();
  const thirtyDaysLater = addDays(now, 30);
  
  return events
    .filter(event => {
      const eventStart = new Date(event.start);
      return eventStart >= now && eventStart <= thirtyDaysLater;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, limit);
};

export const getAllUpcomingEvents = (events) => {
  const now = new Date();
  const thirtyDaysLater = addDays(now, 30);
  
  return events
    .filter(event => {
      const eventStart = new Date(event.start);
      return eventStart >= now && eventStart <= thirtyDaysLater;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};

export const hasTimeConflict = (events, newEvent) => {
  const newStart = new Date(newEvent.start).getTime();
  const newEnd = new Date(newEvent.end).getTime();
  
  return events.some(event => {
    if (event.id === newEvent.id) return false; // Skip the event itself when checking
    
    const eventStart = new Date(event.start).getTime();
    const eventEnd = new Date(event.end).getTime();
    
    // Check if there's an overlap
    return (
      (newStart >= eventStart && newStart < eventEnd) || // New event starts during existing event
      (newEnd > eventStart && newEnd <= eventEnd) || // New event ends during existing event
      (newStart <= eventStart && newEnd >= eventEnd) // New event completely covers existing event
    );
  });
};

export const getDurationInHours = (start, end) => {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
};

export const getTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    slots.push({
      hour,
      minute: 0
    });
  }
  return slots;
};

export const getMonthName = (date) => {
  return date.toLocaleString('default', { month: 'long' });
};

export const getYearMonths = (year) => {
  const months = [];
  for (let month = 0; month < 12; month++) {
    months.push(new Date(year, month, 1));
  }
  return months;
};