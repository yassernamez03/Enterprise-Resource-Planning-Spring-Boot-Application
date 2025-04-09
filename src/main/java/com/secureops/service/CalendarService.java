package com.secureops.service;

import com.secureops.dto.CalendarDto;
import com.secureops.entity.Calendar;

import java.util.List;

public interface CalendarService {
    Calendar createCalendar(CalendarDto calendarDto, Long userId);
    List<Calendar> getUserCalendars(Long userId);
    Calendar getCalendarById(Long id);
    Calendar updateCalendar(Long id, CalendarDto calendarDto);
    void deleteCalendar(Long id);
}