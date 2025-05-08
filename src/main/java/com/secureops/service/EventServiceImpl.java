package com.secureops.service;

import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.secureops.dto.EventDto;
import com.secureops.entity.Event;
import com.secureops.entity.User;
import com.secureops.exception.BadRequestException;
import com.secureops.exception.ResourceNotFoundException;
import com.secureops.exception.UnauthorizedException;
import com.secureops.repository.EventRepository;
import com.secureops.repository.UserRepository;
import com.secureops.util.AppConstants;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final LogService logService;

    public EventServiceImpl(EventRepository eventRepository,
                           UserRepository userRepository,
                           LogService logService) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.logService = logService;
    }

    @Override
    @Transactional
    public Event createEvent(EventDto eventDto) {
        // Only admin can create events
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Only administrators can create events");
        }
        
        // Get current user (admin)
        Long currentUserId = getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        
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
        event.setColor(eventDto.getColor());
        event.setGlobal(eventDto.isGlobal());
        event.setCreatedBy(currentUser);
        
        // If not global, add assigned users
        if (!event.isGlobal() && eventDto.getAssignedUserIds() != null && !eventDto.getAssignedUserIds().isEmpty()) {
            Set<User> assignedUsers = eventDto.getAssignedUserIds().stream()
                    .map(userId -> userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId)))
                    .collect(Collectors.toSet());
            event.setAssignedUsers(assignedUsers);
        }
        
        Event savedEvent = eventRepository.save(event);
        
        // Log event creation
        logService.createLog(
                AppConstants.LOG_ACTION_CREATE,
                "Event created: " + event.getTitle(),
                getClientIp(),
                AppConstants.LOG_TYPE_EVENT,
                currentUserId
        );
        
        return savedEvent;
    }

    @Override
    public List<Event> getAllEvents() {
        // Only admins can see all events
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Admin privileges required to view all events");
        }
        
        return eventRepository.findAll();
    }

    @Override
    public List<Event> getAllEventsByDateRange(Date start, Date end) {
        // Only admins can see all events
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Admin privileges required to view all events");
        }
        
        return eventRepository.findByStartTimeBetween(start, end);
    }

    @Override
    public List<Event> getUserAssignedEvents(Long userId) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Check permissions
        Long currentUserId = getCurrentUserId();
        boolean isAdmin = checkIfAdmin();
        
        if (!currentUserId.equals(userId) && !isAdmin) {
            throw new UnauthorizedException("You don't have permission to view these events");
        }
        
        return eventRepository.findByAssignedUserId(userId);
    }

    @Override
    public List<Event> getUserAssignedEventsByDateRange(Long userId, Date start, Date end) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Check permissions
        Long currentUserId = getCurrentUserId();
        boolean isAdmin = checkIfAdmin();
        
        if (!currentUserId.equals(userId) && !isAdmin) {
            throw new UnauthorizedException("You don't have permission to view these events");
        }
        
        return eventRepository.findByAssignedUserIdAndDateRange(userId, start, end);
    }

    @Override
    public List<Event> getAllVisibleEvents(Long userId) {
        // Return all global events and events assigned to the user
        return eventRepository.findAllVisibleEvents(userId);
    }

    @Override
    public List<Event> getAllVisibleEventsByDateRange(Long userId, Date start, Date end) {
        // Return all global events and events assigned to the user within the date range
        return eventRepository.findAllVisibleEventsBetween(userId, start, end);
    }

    @Override
    public Event getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
        
        // Check if user can view this event
        Long currentUserId = getCurrentUserId();
        boolean isAdmin = checkIfAdmin();
        
        // Check if the user has access to this event
        boolean hasAccess = event.isGlobal() || 
                            isAdmin || 
                            event.getAssignedUsers().stream()
                                .anyMatch(user -> user.getId().equals(currentUserId));
        
        if (!hasAccess) {
            throw new UnauthorizedException("You don't have permission to view this event");
        }
        
        return event;
    }
    
    @Override
    @Transactional
    public Event updateEvent(Long id, EventDto eventDto) {
        // Only admin can update events
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Only administrators can update events");
        }
        
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
        
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
        event.setColor(eventDto.getColor());
        event.setGlobal(eventDto.isGlobal());
        
        // Update assigned users if not global
        if (!event.isGlobal()) {
            // Clear existing assignments
            event.getAssignedUsers().clear();
            
            // Add new assignments if provided
            if (eventDto.getAssignedUserIds() != null && !eventDto.getAssignedUserIds().isEmpty()) {
                Set<User> assignedUsers = eventDto.getAssignedUserIds().stream()
                        .map(userId -> userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId)))
                        .collect(Collectors.toSet());
                event.setAssignedUsers(assignedUsers);
            }
        } else {
            // If global, clear assigned users
            event.getAssignedUsers().clear();
        }
        
        Event updatedEvent = eventRepository.save(event);
        
        // Log event update
        logService.createLog(
                AppConstants.LOG_ACTION_UPDATE,
                "Event updated: " + event.getTitle(),
                getClientIp(),
                AppConstants.LOG_TYPE_EVENT,
                getCurrentUserId()
        );
        
        return updatedEvent;
    }

    @Override
    @Transactional
    public void deleteEvent(Long id) {
        // Only admin can delete events
        if (!checkIfAdmin()) {
            throw new UnauthorizedException("Only administrators can delete events");
        }
        
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
        
        eventRepository.delete(event);
        
        // Log event deletion
        logService.createLog(
                AppConstants.LOG_ACTION_DELETE,
                "Event deleted: " + event.getTitle(),
                getClientIp(),
                AppConstants.LOG_TYPE_EVENT,
                getCurrentUserId()
        );
    }
    
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            return userRepository.findByEmail(email)
                    .map(User::getId)
                    .orElseThrow(() -> new UnauthorizedException("User not found"));
        }
        throw new UnauthorizedException("Not authenticated");
    }
    
    private boolean checkIfAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
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