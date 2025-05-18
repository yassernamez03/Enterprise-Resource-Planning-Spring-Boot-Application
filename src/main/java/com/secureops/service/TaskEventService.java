package com.secureops.service;

import com.secureops.dto.TaskEventDto;
import com.secureops.entity.TaskEvent;

import java.util.Date;
import java.util.List;

public interface TaskEventService {
    // Admin only methods
    TaskEvent createTaskEvent(TaskEventDto taskEventDto);
    TaskEvent updateTaskEvent(Long id, TaskEventDto taskEventDto);
    void deleteTaskEvent(Long id);
    List<TaskEvent> getAllTaskEvents();
    
    // Task specific methods
    List<TaskEvent> getAllTasks();
    List<TaskEvent> getAllTasksByDateRange(Date start, Date end);
    List<TaskEvent> getUserAssignedTasks(Long userId);
    List<TaskEvent> getUserAssignedTasksByDateRange(Long userId, Date start, Date end);
    List<TaskEvent> getAllVisibleTasks(Long userId);
    List<TaskEvent> getAllVisibleTasksByDateRange(Long userId, Date start, Date end);
    TaskEvent getTaskById(Long id);
    TaskEvent toggleTaskCompletion(Long id);
    
    // Event specific methods
    List<TaskEvent> getAllEvents();
    List<TaskEvent> getAllEventsByDateRange(Date start, Date end);
    List<TaskEvent> getUserAssignedEvents(Long userId);
    List<TaskEvent> getUserAssignedEventsByDateRange(Long userId, Date start, Date end);
    List<TaskEvent> getAllVisibleEvents(Long userId);
    List<TaskEvent> getAllVisibleEventsByDateRange(Long userId, Date start, Date end);
    TaskEvent getEventById(Long id);

    TaskEvent getTaskEventById(Long id);

}