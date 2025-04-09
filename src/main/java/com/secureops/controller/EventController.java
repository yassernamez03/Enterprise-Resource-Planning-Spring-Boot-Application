package com.secureops.controller;

import com.secureops.dto.EventDto;
import com.secureops.entity.Event;
import com.secureops.service.EventService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    public ResponseEntity<EventDto> createEvent(
            @Valid @RequestBody EventDto eventDto,
            @RequestParam Long calendarId) {
        Event event = eventService.createEvent(eventDto, calendarId);
        return new ResponseEntity<>(mapToDto(event), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<EventDto>> getCalendarEvents(@RequestParam Long calendarId) {
        List<EventDto> events = eventService.getCalendarEvents(calendarId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/range")
    public ResponseEntity<List<EventDto>> getCalendarEventsByDateRange(
            @RequestParam Long calendarId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        List<EventDto> events = eventService.getCalendarEventsByDateRange(calendarId, startDate, endDate).stream()
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
    public ResponseEntity<EventDto> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventDto eventDto) {
        Event updatedEvent = eventService.updateEvent(id, eventDto);
        return ResponseEntity.ok(mapToDto(updatedEvent));
    }

    @DeleteMapping("/{id}")
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
        eventDto.setCalendarId(event.getCalendar().getId());
        return eventDto;
    }
}