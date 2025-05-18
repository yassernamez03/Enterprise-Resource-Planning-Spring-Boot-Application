package com.secureops.controller;

import com.secureops.dto.TaskEventDto;
import com.secureops.entity.TaskEvent;
import com.secureops.entity.User;
import com.secureops.service.TaskEventService;
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
@RequestMapping("/api/task-events")
public class TaskEventController {

    private final TaskEventService taskEventService;
    private final UserService userService;

    public TaskEventController(TaskEventService taskEventService, UserService userService) {
        this.taskEventService = taskEventService;
        this.userService = userService;
    }

    // Generic endpoints
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskEventDto> createTaskEvent(@Valid @RequestBody TaskEventDto taskEventDto) {
        TaskEvent taskEvent = taskEventService.createTaskEvent(taskEventDto);
        return new ResponseEntity<>(mapToDto(taskEvent), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskEventDto> getTaskEventById(@PathVariable Long id) {
        TaskEvent taskEvent = taskEventService.getTaskEventById(id);
        return ResponseEntity.ok(mapToDto(taskEvent));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskEventDto> updateTaskEvent(
            @PathVariable Long id,
            @Valid @RequestBody TaskEventDto taskEventDto) {
        TaskEvent updatedTaskEvent = taskEventService.updateTaskEvent(id, taskEventDto);
        return ResponseEntity.ok(mapToDto(updatedTaskEvent));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTaskEvent(@PathVariable Long id) {
        taskEventService.deleteTaskEvent(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    // Task specific endpoints
    @GetMapping("/tasks")
    public ResponseEntity<List<TaskEventDto>> getAllVisibleTasks() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<TaskEventDto> tasks = taskEventService.getAllVisibleTasks(currentUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/tasks/range")
    public ResponseEntity<List<TaskEventDto>> getAllVisibleTasksByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        Long currentUserId = userService.getCurrentUser().getId();
        List<TaskEventDto> tasks = taskEventService.getAllVisibleTasksByDateRange(currentUserId, startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/tasks/assigned")
    public ResponseEntity<List<TaskEventDto>> getCurrentUserAssignedTasks() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<TaskEventDto> tasks = taskEventService.getUserAssignedTasks(currentUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/tasks/assigned/range")
    public ResponseEntity<List<TaskEventDto>> getCurrentUserAssignedTasksByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        Long currentUserId = userService.getCurrentUser().getId();
        List<TaskEventDto> tasks = taskEventService.getUserAssignedTasksByDateRange(currentUserId, startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @PatchMapping("/tasks/{id}/toggle-completion")
    public ResponseEntity<TaskEventDto> toggleTaskCompletion(@PathVariable Long id) {
        TaskEvent updatedTask = taskEventService.toggleTaskCompletion(id);
        return ResponseEntity.ok(mapToDto(updatedTask));
    }

    // Event specific endpoints
    @GetMapping("/events")
    public ResponseEntity<List<TaskEventDto>> getAllVisibleEvents() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<TaskEventDto> events = taskEventService.getAllVisibleEvents(currentUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/events/range")
    public ResponseEntity<List<TaskEventDto>> getAllVisibleEventsByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        Long currentUserId = userService.getCurrentUser().getId();
        List<TaskEventDto> events = taskEventService.getAllVisibleEventsByDateRange(currentUserId, startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/events/assigned")
    public ResponseEntity<List<TaskEventDto>> getCurrentUserAssignedEvents() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<TaskEventDto> events = taskEventService.getUserAssignedEvents(currentUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/events/assigned/range")
    public ResponseEntity<List<TaskEventDto>> getCurrentUserAssignedEventsByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        Long currentUserId = userService.getCurrentUser().getId();
        List<TaskEventDto> events = taskEventService.getUserAssignedEventsByDateRange(currentUserId, startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    // Admin only endpoints
    @GetMapping("/admin/tasks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskEventDto>> getAllTasks() {
        List<TaskEventDto> tasks = taskEventService.getAllTasks().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/admin/tasks/range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskEventDto>> getAllTasksByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        List<TaskEventDto> tasks = taskEventService.getAllTasksByDateRange(startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/admin/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskEventDto>> getAllEvents() {
        List<TaskEventDto> events = taskEventService.getAllEvents().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/admin/events/range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskEventDto>> getAllEventsByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        List<TaskEventDto> events = taskEventService.getAllEventsByDateRange(startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    private TaskEventDto mapToDto(TaskEvent taskEvent) {
        TaskEventDto dto = new TaskEventDto();
        dto.setId(taskEvent.getId());
        dto.setTitle(taskEvent.getTitle());
        dto.setDescription(taskEvent.getDescription());
        dto.setStatus(taskEvent.getStatus());
        dto.setType(taskEvent.getType());
        dto.setStartTime(taskEvent.getStartTime());
        dto.setDueDate(taskEvent.getDueDate());
        dto.setLocation(taskEvent.getLocation());
        dto.setGlobal(taskEvent.isGlobal());
        dto.setCompletedDate(taskEvent.getCompletedDate());
        
        // Map assigned users' IDs
        if (taskEvent.getAssignedUsers() != null && !taskEvent.getAssignedUsers().isEmpty()) {
            Set<Long> assignedUserIds = taskEvent.getAssignedUsers().stream()
                    .map(User::getId)
                    .collect(Collectors.toSet());
            dto.setAssignedUserIds(assignedUserIds);
        }
        
        return dto;
    }
}