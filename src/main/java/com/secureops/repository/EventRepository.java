package com.secureops.repository;

import com.secureops.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByCalendarId(Long calendarId);
    List<Event> findByCalendarIdAndStartTimeBetween(Long calendarId, Date start, Date end);
}