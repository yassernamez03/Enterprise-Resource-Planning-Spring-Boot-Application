package com.secureops.controller;

import com.secureops.dto.CalendarDto;
import com.secureops.entity.Calendar;
import com.secureops.service.CalendarService;
import com.secureops.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calendars")
public class CalendarController {

    private final CalendarService calendarService;
    private final UserService userService;

    public CalendarController(CalendarService calendarService, UserService userService) {
        this.calendarService = calendarService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<CalendarDto> createCalendar(@Valid @RequestBody CalendarDto calendarDto) {
        Long currentUserId = userService.getCurrentUser().getId();
        Calendar calendar = calendarService.createCalendar(calendarDto, currentUserId);
        return new ResponseEntity<>(mapToDto(calendar), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CalendarDto>> getUserCalendars() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<CalendarDto> calendars = calendarService.getUserCalendars(currentUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(calendars);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CalendarDto> getCalendarById(@PathVariable Long id) {
        Calendar calendar = calendarService.getCalendarById(id);
        return ResponseEntity.ok(mapToDto(calendar));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CalendarDto> updateCalendar(
            @PathVariable Long id,
            @Valid @RequestBody CalendarDto calendarDto) {
        Calendar updatedCalendar = calendarService.updateCalendar(id, calendarDto);
        return ResponseEntity.ok(mapToDto(updatedCalendar));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCalendar(@PathVariable Long id) {
        calendarService.deleteCalendar(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    private CalendarDto mapToDto(Calendar calendar) {
        CalendarDto calendarDto = new CalendarDto();
        calendarDto.setId(calendar.getId());
        calendarDto.setName(calendar.getName());
        calendarDto.setColor(calendar.getColor());
        calendarDto.setPrimary(calendar.isPrimary());
        return calendarDto;
    }
}