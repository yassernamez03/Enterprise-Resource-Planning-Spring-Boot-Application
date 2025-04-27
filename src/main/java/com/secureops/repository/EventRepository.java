package com.secureops.repository;

import com.secureops.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByCreatedById(Long createdById);
    List<Event> findByCreatedByIdAndStartTimeBetween(Long createdById, Date start, Date end);
    
    // Find all events assigned to a specific user
    @Query("SELECT e FROM Event e JOIN e.assignedUsers u WHERE u.id = :userId")
    List<Event> findByAssignedUserId(Long userId);
    
    // Find all events assigned to a specific user in date range
    @Query("SELECT e FROM Event e JOIN e.assignedUsers u WHERE u.id = :userId AND e.startTime >= :start AND e.startTime <= :end")
    List<Event> findByAssignedUserIdAndDateRange(Long userId, Date start, Date end);
    
    // Find all global events
    List<Event> findByIsGlobalTrue();
    
    // Find all global events in date range
    List<Event> findByIsGlobalTrueAndStartTimeBetween(Date start, Date end);
    
    // Find all events visible to a user (either global or assigned to them)
    @Query("SELECT e FROM Event e WHERE e.isGlobal = true OR EXISTS (SELECT u FROM e.assignedUsers u WHERE u.id = :userId)")
    List<Event> findAllVisibleEvents(Long userId);
    
    // Find all events visible to a user within a date range
    @Query("SELECT e FROM Event e WHERE (e.isGlobal = true OR EXISTS (SELECT u FROM e.assignedUsers u WHERE u.id = :userId)) AND e.startTime >= :start AND e.startTime <= :end")
    List<Event> findAllVisibleEventsBetween(Long userId, Date start, Date end);
    
    // Find all events (for admin)
    List<Event> findByStartTimeBetween(Date start, Date end);
}