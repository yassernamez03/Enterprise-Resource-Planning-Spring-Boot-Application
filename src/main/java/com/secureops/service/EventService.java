package com.secureops.service;

import com.secureops.dto.EventDto;
import com.secureops.entity.Event;

import java.util.Date;
import java.util.List;

public interface EventService {
    // Admin only methods
    Event createEvent(EventDto eventDto);
    Event updateEvent(Long id, EventDto eventDto);
    void deleteEvent(Long id);
    List<Event> getAllEvents();
    List<Event> getAllEventsByDateRange(Date start, Date end);
    
    // User available methods
    List<Event> getUserAssignedEvents(Long userId);
    List<Event> getUserAssignedEventsByDateRange(Long userId, Date start, Date end);
    List<Event> getAllVisibleEvents(Long userId);
    List<Event> getAllVisibleEventsByDateRange(Long userId, Date start, Date end);
    Event getEventById(Long id);
}