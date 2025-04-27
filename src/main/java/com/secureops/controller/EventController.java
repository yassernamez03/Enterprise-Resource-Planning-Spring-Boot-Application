package com.secureops.controller;

import com.secureops.dto.EventDto;
import com.secureops.entity.Event;
import com.secureops.entity.User;
import com.secureops.service.EventService;
import com.secureops.service.UserService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;
    private final UserService userService;

    public EventController(EventService eventService, UserService userService) {
        this.eventService = eventService;
        this.userService = userService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventDto> createEvent(@Valid @RequestBody EventDto eventDto) {
        Event event = eventService.createEvent(eventDto);
        return new ResponseEntity<>(mapToDto(event), HttpStatus.CREATED);
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<EventDto>> getCurrentUserAssignedEvents() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<EventDto> events = eventService.getUserAssignedEvents(currentUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/assigned/range")
    public ResponseEntity<List<EventDto>> getCurrentUserAssignedEventsByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        Long currentUserId = userService.getCurrentUser().getId();
        List<EventDto> events = eventService.getUserAssignedEventsByDateRange(currentUserId, startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/assigned/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EventDto>> getUserAssignedEvents(@PathVariable Long userId) {
        List<EventDto> events = eventService.getUserAssignedEvents(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/assigned/{userId}/range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EventDto>> getUserAssignedEventsByDateRange(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        List<EventDto> events = eventService.getUserAssignedEventsByDateRange(userId, startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/visible")
    public ResponseEntity<List<EventDto>> getAllVisibleEvents() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<EventDto> events = eventService.getAllVisibleEvents(currentUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/visible/range")
    public ResponseEntity<List<EventDto>> getAllVisibleEventsByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        Long currentUserId = userService.getCurrentUser().getId();
        List<EventDto> events = eventService.getAllVisibleEventsByDateRange(currentUserId, startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EventDto>> getAllEvents() {
        List<EventDto> events = eventService.getAllEvents().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/all/range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EventDto>> getAllEventsByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        List<EventDto> events = eventService.getAllEventsByDateRange(startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDto> getEventById(@PathVariable Long id) {
        Event event = eventService.getEventById(id);
        return ResponseEntity.ok(mapToDto(event));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventDto> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventDto eventDto) {
        Event updatedEvent = eventService.updateEvent(id, eventDto);
        return ResponseEntity.ok(mapToDto(updatedEvent));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    private EventDto mapToDto(Event event) {
        EventDto eventDto = new EventDto();
        eventDto.setId(event.getId());
        eventDto.setTitle(event.getTitle());
        eventDto.setDescription(event.getDescription());
        eventDto.setStartTime(event.getStartTime());
        eventDto.setEndTime(event.getEndTime());
        eventDto.setAllDay(event.isAllDay());
        eventDto.setLocation(event.getLocation());
        eventDto.setRecurrencePattern(event.getRecurrencePattern());
        eventDto.setColor(event.getColor());
        eventDto.setGlobal(event.isGlobal());
        
        // Map assigned users' IDs
        if (event.getAssignedUsers() != null && !event.getAssignedUsers().isEmpty()) {
            Set<Long> assignedUserIds = event.getAssignedUsers().stream()
                    .map(User::getId)
                    .collect(Collectors.toSet());
            eventDto.setAssignedUserIds(assignedUserIds);
        }
        
        return eventDto;
    }
}