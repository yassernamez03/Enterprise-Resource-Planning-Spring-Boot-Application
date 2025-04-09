package com.secureops.service;

import com.secureops.dto.EventDto;
import com.secureops.entity.Event;

import java.util.Date;
import java.util.List;

public interface EventService {
    Event createEvent(EventDto eventDto, Long calendarId);
    List<Event> getCalendarEvents(Long calendarId);
    List<Event> getCalendarEventsByDateRange(Long calendarId, Date start, Date end);
    Event getEventById(Long id);
    Event updateEvent(Long id, EventDto eventDto);
    void deleteEvent(Long id);
}