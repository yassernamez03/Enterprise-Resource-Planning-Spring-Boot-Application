package com.secureops.service;

import com.secureops.dto.EventDto;
import com.secureops.entity.Calendar;
import com.secureops.entity.Event;
import com.secureops.exception.BadRequestException;
import com.secureops.exception.ResourceNotFoundException;
import com.secureops.exception.UnauthorizedException;
import com.secureops.repository.CalendarRepository;
import com.secureops.repository.EventRepository;
import com.secureops.util.AppConstants;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.List;

@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final CalendarRepository calendarRepository;
    private final LogService logService;

    public EventServiceImpl(EventRepository eventRepository,
                           CalendarRepository calendarRepository,
                           LogService logService) {
        this.eventRepository = eventRepository;
        this.calendarRepository = calendarRepository;
        this.logService = logService;
    }

    @Override
    @Transactional
    public Event createEvent(EventDto eventDto, Long calendarId) {
        // Verify calendar exists and user has access
        Calendar calendar = calendarRepository.findById(calendarId)
                .orElseThrow(() -> new ResourceNotFoundException("Calendar", "id", calendarId));
        
        // Verify user has access to this calendar
        String currentUserEmail = getCurrentUserEmail();
        if (!calendar.getOwner().getEmail().equals(currentUserEmail)) {
            throw new UnauthorizedException("You don't have permission to add events to this calendar");
        }
        
        // Validate event dates
        if (eventDto.getEndTime().before(eventDto.getStartTime())) {
            throw new BadRequestException("Event end time cannot be before start time");
        }
        
        Event event = new Event();
        event.setTitle(eventDto.getTitle());
        event.setDescription(eventDto.getDescription());
        event.setStartTime(eventDto.getStartTime());
        event.setEndTime(eventDto.getEndTime());
        event.setAllDay(eventDto.isAllDay());
        event.setLocation(eventDto.getLocation());
        event.setRecurrencePattern(eventDto.getRecurrencePattern());
        event.setCalendar(calendar);
        
        Event savedEvent = eventRepository.save(event);
        
        // Log event creation
        logService.createLog(
                AppConstants.LOG_ACTION_CREATE,
                "Event created: " + event.getTitle(),
                getClientIp(),
                AppConstants.LOG_TYPE_EVENT,
                calendar.getOwner().getId()
        );
        
        return savedEvent;
    }

    @Override
    public List<Event> getCalendarEvents(Long calendarId) {
        // Verify calendar exists and user has access
        Calendar calendar = calendarRepository.findById(calendarId)
                .orElseThrow(() -> new ResourceNotFoundException("Calendar", "id", calendarId));
        
        // Verify user has access to this calendar
        String currentUserEmail = getCurrentUserEmail();
        if (!calendar.getOwner().getEmail().equals(currentUserEmail)) {
            throw new UnauthorizedException("You don't have permission to view events in this calendar");
        }
        
        return eventRepository.findByCalendarId(calendarId);
    }

    @Override
    public List<Event> getCalendarEventsByDateRange(Long calendarId, Date start, Date end) {
        // Verify calendar exists and user has access
        Calendar calendar = calendarRepository.findById(calendarId)
                .orElseThrow(() -> new ResourceNotFoundException("Calendar", "id", calendarId));
        
        // Verify user has access to this calendar
        String currentUserEmail = getCurrentUserEmail();
        if (!calendar.getOwner().getEmail().equals(currentUserEmail)) {
            throw new UnauthorizedException("You don't have permission to view events in this calendar");
        }
        
        return eventRepository.findByCalendarIdAndStartTimeBetween(calendarId, start, end);
    }

    @Override
    public Event getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
        
        // Verify user has access to this event's calendar
        String currentUserEmail = getCurrentUserEmail();
        if (!event.getCalendar().getOwner().getEmail().equals(currentUserEmail)) {
            throw new UnauthorizedException("You don't have permission to view this event");
        }
        
        return event;
    }
    
    @Override
    @Transactional
    public Event updateEvent(Long id, EventDto eventDto) {
        Event event = getEventById(id);
        
        // Validate event dates
        if (eventDto.getEndTime().before(eventDto.getStartTime())) {
            throw new BadRequestException("Event end time cannot be before start time");
        }
        
        event.setTitle(eventDto.getTitle());
        event.setDescription(eventDto.getDescription());
        event.setStartTime(eventDto.getStartTime());
        event.setEndTime(eventDto.getEndTime());
        event.setAllDay(eventDto.isAllDay());
        event.setLocation(eventDto.getLocation());
        event.setRecurrencePattern(eventDto.getRecurrencePattern());
        
        Event updatedEvent = eventRepository.save(event);
        
        // Log event update
        logService.createLog(
                AppConstants.LOG_ACTION_UPDATE,
                "Event updated: " + event.getTitle(),
                getClientIp(),
                AppConstants.LOG_TYPE_EVENT,
                event.getCalendar().getOwner().getId()
        );
        
        return updatedEvent;
    }

    @Override
    @Transactional
    public void deleteEvent(Long id) {
        Event event = getEventById(id);
        
        Long ownerId = event.getCalendar().getOwner().getId();
        String eventTitle = event.getTitle();
        
        eventRepository.delete(event);
        
        // Log event deletion
        logService.createLog(
                AppConstants.LOG_ACTION_DELETE,
                "Event deleted: " + eventTitle,
                getClientIp(),
                AppConstants.LOG_TYPE_EVENT,
                ownerId
        );
    }
    
    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        throw new UnauthorizedException("Not authenticated");
    }
    
    private String getClientIp() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress;
    }
}