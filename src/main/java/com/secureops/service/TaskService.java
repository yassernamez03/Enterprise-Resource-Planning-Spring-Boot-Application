package com.secureops.service;

import com.secureops.dto.TaskDto;
import com.secureops.entity.Task;

import java.util.Date;
import java.util.List;

public interface TaskService {
    // Admin only methods
    Task createTask(TaskDto taskDto);
    Task updateTask(Long id, TaskDto taskDto);
    void deleteTask(Long id);
    List<Task> getAllTasks();
    List<Task> getAllTasksByDateRange(Date start, Date end);
    
    // User available methods
    List<Task> getUserAssignedTasks(Long userId);
    List<Task> getUserAssignedTasksByDateRange(Long userId, Date start, Date end);
    List<Task> getAllVisibleTasks(Long userId);
    List<Task> getAllVisibleTasksByDateRange(Long userId, Date start, Date end);
    Task getTaskById(Long id);
    Task toggleTaskCompletion(Long id);
}