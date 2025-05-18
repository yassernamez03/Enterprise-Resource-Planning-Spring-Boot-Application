package com.secureops.repository;

import com.secureops.entity.TaskEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface TaskEventRepository extends JpaRepository<TaskEvent, Long> {
    List<TaskEvent> findByUserId(Long userId);
    
    // For tasks
    List<TaskEvent> findByUserIdAndTypeAndDueDateBetween(Long userId, TaskEvent.TaskEventType type, Date start, Date end);
    
    // For events
    List<TaskEvent> findByUserIdAndTypeAndStartTimeBetween(Long userId, TaskEvent.TaskEventType type, Date start, Date end);
    
    // Find all assigned to a specific user
    @Query("SELECT te FROM TaskEvent te JOIN te.assignedUsers u WHERE u.id = :userId")
    List<TaskEvent> findByAssignedUserId(Long userId);
    
    // Find all assigned to a user in date range (for tasks)
    @Query("SELECT te FROM TaskEvent te JOIN te.assignedUsers u WHERE u.id = :userId AND te.type = com.secureops.entity.TaskEvent$TaskEventType.TASK AND te.dueDate >= :start AND te.dueDate <= :end")
    List<TaskEvent> findAssignedTasksByUserIdAndDateRange(Long userId, Date start, Date end);
    
    // Find all assigned to a user in date range (for events)
    @Query("SELECT te FROM TaskEvent te JOIN te.assignedUsers u WHERE u.id = :userId AND te.type = com.secureops.entity.TaskEvent$TaskEventType.EVENT AND te.startTime >= :start AND te.startTime <= :end")
    List<TaskEvent> findAssignedEventsByUserIdAndDateRange(Long userId, Date start, Date end);
    
    // Find all global items
    List<TaskEvent> findByIsGlobalTrue();
    
    // Find all global items in date range (for tasks)
    List<TaskEvent> findByIsGlobalTrueAndTypeAndDueDateBetween(TaskEvent.TaskEventType type, Date start, Date end);
    
    // Find all global items in date range (for events)
    List<TaskEvent> findByIsGlobalTrueAndTypeAndStartTimeBetween(TaskEvent.TaskEventType type, Date start, Date end);
    
    // Find all items visible to a user (either global or assigned to them)
    @Query("SELECT te FROM TaskEvent te WHERE te.isGlobal = true OR EXISTS (SELECT u FROM te.assignedUsers u WHERE u.id = :userId)")
    List<TaskEvent> findAllVisibleToUser(Long userId);
    
    // Find all items visible to a user within a date range (for tasks)
    @Query("SELECT te FROM TaskEvent te WHERE (te.isGlobal = true OR EXISTS (SELECT u FROM te.assignedUsers u WHERE u.id = :userId)) AND te.type = com.secureops.entity.TaskEvent$TaskEventType.TASK AND te.dueDate >= :start AND te.dueDate <= :end")
    List<TaskEvent> findAllVisibleTasksBetween(Long userId, Date start, Date end);
    
    // Find all items visible to a user within a date range (for events)
    @Query("SELECT te FROM TaskEvent te WHERE (te.isGlobal = true OR EXISTS (SELECT u FROM te.assignedUsers u WHERE u.id = :userId)) AND te.type = com.secureops.entity.TaskEvent$TaskEventType.EVENT AND te.startTime >= :start AND te.startTime <= :end")
    List<TaskEvent> findAllVisibleEventsBetween(Long userId, Date start, Date end);
    
    // Find all items (for admin)
    List<TaskEvent> findByTypeAndDueDateBetween(TaskEvent.TaskEventType type, Date start, Date end);
    List<TaskEvent> findByTypeAndStartTimeBetween(TaskEvent.TaskEventType type, Date start, Date end);

    
    List<TaskEvent> findByType(TaskEvent.TaskEventType type);

}