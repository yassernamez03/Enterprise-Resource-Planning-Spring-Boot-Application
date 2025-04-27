package com.secureops.controller;

import com.secureops.dto.TaskDto;
import com.secureops.entity.Task;
import com.secureops.entity.User;
import com.secureops.service.TaskService;
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
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;
    private final UserService userService;

    public TaskController(TaskService taskService, UserService userService) {
        this.taskService = taskService;
        this.userService = userService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody TaskDto taskDto) {
        Task task = taskService.createTask(taskDto);
        return new ResponseEntity<>(mapToDto(task), HttpStatus.CREATED);
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<TaskDto>> getCurrentUserAssignedTasks() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<TaskDto> tasks = taskService.getUserAssignedTasks(currentUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/assigned/range")
    public ResponseEntity<List<TaskDto>> getCurrentUserAssignedTasksByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        Long currentUserId = userService.getCurrentUser().getId();
        List<TaskDto> tasks = taskService.getUserAssignedTasksByDateRange(currentUserId, startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/assigned/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskDto>> getUserAssignedTasks(@PathVariable Long userId) {
        List<TaskDto> tasks = taskService.getUserAssignedTasks(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/assigned/{userId}/range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskDto>> getUserAssignedTasksByDateRange(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        List<TaskDto> tasks = taskService.getUserAssignedTasksByDateRange(userId, startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/visible")
    public ResponseEntity<List<TaskDto>> getAllVisibleTasks() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<TaskDto> tasks = taskService.getAllVisibleTasks(currentUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/visible/range")
    public ResponseEntity<List<TaskDto>> getAllVisibleTasksByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        Long currentUserId = userService.getCurrentUser().getId();
        List<TaskDto> tasks = taskService.getAllVisibleTasksByDateRange(currentUserId, startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskDto>> getAllTasks() {
        List<TaskDto> tasks = taskService.getAllTasks().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/all/range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskDto>> getAllTasksByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        List<TaskDto> tasks = taskService.getAllTasksByDateRange(startDate, endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")    
    public ResponseEntity<TaskDto> getTaskById(@PathVariable Long id) {
        Task task = taskService.getTaskById(id);
        return ResponseEntity.ok(mapToDto(task));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskDto> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskDto taskDto) {
        Task updatedTask = taskService.updateTask(id, taskDto);
        return ResponseEntity.ok(mapToDto(updatedTask));
    }

    @PatchMapping("/{id}/toggle-completion")
    public ResponseEntity<TaskDto> toggleTaskCompletion(@PathVariable Long id) {
        Task updatedTask = taskService.toggleTaskCompletion(id);
        return ResponseEntity.ok(mapToDto(updatedTask));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    private TaskDto mapToDto(Task task) {
        TaskDto taskDto = new TaskDto();
        taskDto.setId(task.getId());
        taskDto.setTitle(task.getTitle());
        taskDto.setDescription(task.getDescription());
        taskDto.setDueDate(task.getDueDate());
        taskDto.setCompleted(task.isCompleted());
        taskDto.setPriority(task.getPriority());
        taskDto.setColor(task.getColor());
        taskDto.setGlobal(task.isGlobal());
        
        // Map assigned users' IDs
        if (task.getAssignedUsers() != null && !task.getAssignedUsers().isEmpty()) {
            Set<Long> assignedUserIds = task.getAssignedUsers().stream()
                    .map(User::getId)
                    .collect(Collectors.toSet());
            taskDto.setAssignedUserIds(assignedUserIds);
        }
        
        return taskDto;
    }
}