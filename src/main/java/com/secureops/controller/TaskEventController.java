package com.secureops.controller;

import com.secureops.dto.TaskEventDto;
import com.secureops.entity.TaskEvent;
import com.secureops.entity.User;
import com.secureops.service.LogService;
import com.secureops.service.TaskEventService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/task-events")
public class TaskEventController {

    private static final Logger logger = LoggerFactory.getLogger(TaskEventController.class);
    
    // For security-specific logging, create a separate logger
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final TaskEventService taskEventService;
    private final UserService userService;
    private final LogService logService;

    public TaskEventController(TaskEventService taskEventService, UserService userService, LogService logService) {
        this.taskEventService = taskEventService;
        this.userService = userService;
        this.logService = logService;
        logger.info("TaskEventController initialized");
    }

    // Generic endpoints
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskEventDto> createTaskEvent(@Valid @RequestBody TaskEventDto taskEventDto) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Task event creation request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        securityLogger.info("TASK_EVENT_CREATION - User: {} (ID: {}), IP: {}, Action: CREATE_TASK_EVENT", 
                currentUsername, currentUserId, clientIp);
        
        try {
            // Input validation
            if (taskEventDto == null) {
                logger.warn("Null task event data in creation request - userId: {}, ip: {}", 
                        currentUserId, clientIp);
                securityLogger.warn("NULL_TASK_EVENT_DATA - User: {} (ID: {}), IP: {}", 
                        currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_CREATE,
                        "Null task event data in creation request",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Sanitize input data
            sanitizeTaskEventDto(taskEventDto);
            
            logger.debug("Creating task event - title: {}, type: {}, global: {}, assignedUsers: {}", 
                    taskEventDto.getTitle(), taskEventDto.getType(), taskEventDto.isGlobal(), 
                    taskEventDto.getAssignedUserIds() != null ? taskEventDto.getAssignedUserIds().size() : 0);
            
            TaskEvent taskEvent = taskEventService.createTaskEvent(taskEventDto);
            
            logger.info("Task event created successfully - eventId: {}, title: {}, createdBy: {}", 
                    taskEvent.getId(), taskEvent.getTitle(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Task event created: " + taskEvent.getTitle() + " (ID: " + taskEvent.getId() + ")",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return new ResponseEntity<>(mapToDto(taskEvent), HttpStatus.CREATED);
            
        } catch (Exception e) {
            logger.error("Error creating task event - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("TASK_EVENT_CREATION_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Failed to create task event: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskEventDto> getTaskEventById(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Task event retrieval request - userId: {}, username: {}, eventId: {}, ip: {}", 
                currentUserId, currentUsername, id, clientIp);
        
        // Input validation
        if (id == null || id <= 0) {
            logger.warn("Invalid task event ID parameter: {} - userId: {}, ip: {}", 
                    id, currentUserId, clientIp);
            securityLogger.warn("INVALID_TASK_EVENT_ID - User: {} (ID: {}), IP: {}, InvalidId: {}", 
                    currentUsername, currentUserId, clientIp, id);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Invalid task event ID parameter: " + id,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
                    
            return ResponseEntity.badRequest().build();
        }
        
        try {
            TaskEvent taskEvent = taskEventService.getTaskEventById(id);
            
            logger.info("Task event retrieved successfully - eventId: {}, title: {}, userId: {}", 
                    taskEvent.getId(), taskEvent.getTitle(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Task event accessed: " + taskEvent.getTitle() + " (ID: " + id + ")",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(mapToDto(taskEvent));
            
        } catch (Exception e) {
            logger.error("Error retrieving task event {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("TASK_EVENT_RETRIEVAL_ERROR - User: {} (ID: {}), IP: {}, EventId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve task event ID: " + id + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskEventDto> updateTaskEvent(
            @PathVariable Long id,
            @Valid @RequestBody TaskEventDto taskEventDto) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Task event update request - userId: {}, username: {}, eventId: {}, ip: {}", 
                currentUserId, currentUsername, id, clientIp);
        
        securityLogger.info("TASK_EVENT_UPDATE - User: {} (ID: {}), IP: {}, EventId: {}, Action: UPDATE_TASK_EVENT", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Input validation
            if (id == null || id <= 0) {
                logger.warn("Invalid task event ID for update: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_UPDATE_TASK_EVENT_ID - User: {} (ID: {}), IP: {}, InvalidId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid task event ID for update: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            if (taskEventDto == null) {
                logger.warn("Null task event data in update request - eventId: {}, userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("NULL_UPDATE_TASK_EVENT_DATA - User: {} (ID: {}), IP: {}, EventId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Null task event data in update request for ID: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Sanitize input data
            sanitizeTaskEventDto(taskEventDto);
            
            logger.debug("Updating task event {} - title: {}, type: {}", 
                    id, taskEventDto.getTitle(), taskEventDto.getType());
            
            TaskEvent updatedTaskEvent = taskEventService.updateTaskEvent(id, taskEventDto);
            
            logger.info("Task event updated successfully - eventId: {}, title: {}, updatedBy: {}", 
                    updatedTaskEvent.getId(), updatedTaskEvent.getTitle(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Task event updated: " + updatedTaskEvent.getTitle() + " (ID: " + id + ")",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return ResponseEntity.ok(mapToDto(updatedTaskEvent));
            
        } catch (Exception e) {
            logger.error("Error updating task event {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("TASK_EVENT_UPDATE_ERROR - User: {} (ID: {}), IP: {}, EventId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to update task event ID: " + id + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTaskEvent(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Task event deletion request - userId: {}, username: {}, eventId: {}, ip: {}", 
                currentUserId, currentUsername, id, clientIp);
        
        securityLogger.info("TASK_EVENT_DELETION - User: {} (ID: {}), IP: {}, EventId: {}, Action: DELETE_TASK_EVENT", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Input validation
            if (id == null || id <= 0) {
                logger.warn("Invalid task event ID for deletion: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_DELETE_TASK_EVENT_ID - User: {} (ID: {}), IP: {}, InvalidId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_DELETE,
                        "Invalid task event ID for deletion: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            logger.debug("Deleting task event: {}", id);
            
            taskEventService.deleteTaskEvent(id);
            
            logger.info("Task event deleted successfully - eventId: {}, deletedBy: {}", 
                    id, currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Task event deleted (ID: " + id + ")",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            
        } catch (Exception e) {
            logger.error("Error deleting task event {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("TASK_EVENT_DELETION_ERROR - User: {} (ID: {}), IP: {}, EventId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Failed to delete task event ID: " + id + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    // Task specific endpoints
    @GetMapping("/tasks")
    public ResponseEntity<List<TaskEventDto>> getAllVisibleTasks() {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Visible tasks retrieval request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        try {
            if (currentUserId == null) {
                logger.warn("Unauthenticated access to visible tasks - ip: {}", clientIp);
                securityLogger.warn("UNAUTHENTICATED_TASKS_ACCESS - IP: {}", clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Unauthenticated access to visible tasks",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        null);
                        
                return ResponseEntity.status(401).build();
            }
            
            List<TaskEventDto> tasks = taskEventService.getAllVisibleTasks(currentUserId).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} visible tasks for user {}", tasks.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "User accessed visible tasks (" + tasks.size() + " tasks)",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(tasks);
            
        } catch (Exception e) {
            logger.error("Error retrieving visible tasks - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve visible tasks: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping("/tasks/range")
    public ResponseEntity<List<TaskEventDto>> getAllVisibleTasksByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Visible tasks by date range request - userId: {}, username: {}, startDate: {}, endDate: {}, ip: {}", 
                currentUserId, currentUsername, startDate, endDate, clientIp);
        
        try {
            // Input validation
            if (!validateDateRange(startDate, endDate, currentUserId, clientIp)) {
                return ResponseEntity.badRequest().build();
            }
            
            if (currentUserId == null) {
                logger.warn("Unauthenticated access to visible tasks by date range - ip: {}", clientIp);
                securityLogger.warn("UNAUTHENTICATED_TASKS_DATE_RANGE_ACCESS - IP: {}", clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Unauthenticated access to visible tasks by date range",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        null);
                        
                return ResponseEntity.status(401).build();
            }
            
            List<TaskEventDto> tasks = taskEventService.getAllVisibleTasksByDateRange(currentUserId, startDate, endDate)
                    .stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} visible tasks by date range for user {}", tasks.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "User accessed visible tasks by date range (" + tasks.size() + " tasks)",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(tasks);
            
        } catch (Exception e) {
            logger.error("Error retrieving visible tasks by date range - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve visible tasks by date range: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping("/tasks/assigned")
    public ResponseEntity<List<TaskEventDto>> getCurrentUserAssignedTasks() {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Current user assigned tasks request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        try {
            if (currentUserId == null) {
                logger.warn("Unauthenticated access to assigned tasks - ip: {}", clientIp);
                securityLogger.warn("UNAUTHENTICATED_ASSIGNED_TASKS_ACCESS - IP: {}", clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Unauthenticated access to assigned tasks",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        null);
                        
                return ResponseEntity.status(401).build();
            }
            
            List<TaskEventDto> tasks = taskEventService.getUserAssignedTasks(currentUserId).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} assigned tasks for user {}", tasks.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "User accessed assigned tasks (" + tasks.size() + " tasks)",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(tasks);
            
        } catch (Exception e) {
            logger.error("Error retrieving assigned tasks - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve assigned tasks: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping("/tasks/assigned/range")
    public ResponseEntity<List<TaskEventDto>> getCurrentUserAssignedTasksByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Current user assigned tasks by date range request - userId: {}, username: {}, startDate: {}, endDate: {}, ip: {}", 
                currentUserId, currentUsername, startDate, endDate, clientIp);
        
        try {
            // Input validation
            if (!validateDateRange(startDate, endDate, currentUserId, clientIp)) {
                return ResponseEntity.badRequest().build();
            }
            
            if (currentUserId == null) {
                logger.warn("Unauthenticated access to assigned tasks by date range - ip: {}", clientIp);
                securityLogger.warn("UNAUTHENTICATED_ASSIGNED_TASKS_DATE_RANGE_ACCESS - IP: {}", clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Unauthenticated access to assigned tasks by date range",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        null);
                        
                return ResponseEntity.status(401).build();
            }
            
            List<TaskEventDto> tasks = taskEventService.getUserAssignedTasksByDateRange(currentUserId, startDate, endDate)
                    .stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} assigned tasks by date range for user {}", tasks.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "User accessed assigned tasks by date range (" + tasks.size() + " tasks)",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(tasks);
            
        } catch (Exception e) {
            logger.error("Error retrieving assigned tasks by date range - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve assigned tasks by date range: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @PatchMapping("/tasks/{id}/toggle-completion")
    public ResponseEntity<TaskEventDto> toggleTaskCompletion(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Task completion toggle request - userId: {}, username: {}, taskId: {}, ip: {}", 
                currentUserId, currentUsername, id, clientIp);
        
        securityLogger.info("TASK_COMPLETION_TOGGLE - User: {} (ID: {}), IP: {}, TaskId: {}, Action: TOGGLE_COMPLETION", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Input validation
            if (id == null || id <= 0) {
                logger.warn("Invalid task ID for completion toggle: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_TOGGLE_TASK_ID - User: {} (ID: {}), IP: {}, InvalidId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid task ID for completion toggle: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            TaskEvent updatedTask = taskEventService.toggleTaskCompletion(id);
            
            logger.info("Task completion toggled successfully - taskId: {}, newStatus: {}, userId: {}", 
                    updatedTask.getId(), updatedTask.getStatus(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Task completion toggled: " + updatedTask.getTitle() + " (ID: " + id + ", Status: " + updatedTask.getStatus() + ")",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(mapToDto(updatedTask));
            
        } catch (Exception e) {
            logger.error("Error toggling task completion {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("TASK_COMPLETION_TOGGLE_ERROR - User: {} (ID: {}), IP: {}, TaskId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to toggle task completion ID: " + id + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping("/admin/users/{userId}/tasks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskEventDto>> getTasksForUser(@PathVariable Long userId) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Admin tasks for user request - adminUserId: {}, adminUsername: {}, targetUserId: {}, ip: {}", 
                currentUserId, currentUsername, userId, clientIp);
        
        securityLogger.info("ADMIN_USER_TASKS_ACCESS - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Action: VIEW_USER_TASKS", 
                currentUsername, currentUserId, clientIp, userId);
        
        try {
            // Input validation
            if (userId == null || userId <= 0) {
                logger.warn("Invalid userId for tasks retrieval: {} - adminUserId: {}, ip: {}", 
                        userId, currentUserId, clientIp);
                securityLogger.warn("INVALID_USER_TASKS_USER_ID - Admin: {} (ID: {}), IP: {}, InvalidUserId: {}", 
                        currentUsername, currentUserId, clientIp, userId);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Invalid userId for tasks retrieval: " + userId,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            List<TaskEventDto> tasks = taskEventService.getTasksForUser(userId).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} tasks for user {} by admin {}", tasks.size(), userId, currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Admin accessed tasks for userId: " + userId + " (" + tasks.size() + " tasks)",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return ResponseEntity.ok(tasks);
            
        } catch (Exception e) {
            logger.error("Error retrieving tasks for user {} - adminUserId: {}, adminUsername: {}, ip: {}", 
                    userId, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("ADMIN_USER_TASKS_ACCESS_ERROR - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, userId, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve tasks for userId: " + userId + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    // Event specific endpoints (similar pattern)
    @GetMapping("/events")
    public ResponseEntity<List<TaskEventDto>> getAllVisibleEvents() {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Visible events retrieval request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        try {
            if (currentUserId == null) {
                logger.warn("Unauthenticated access to visible events - ip: {}", clientIp);
                securityLogger.warn("UNAUTHENTICATED_EVENTS_ACCESS - IP: {}", clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Unauthenticated access to visible events",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        null);
                        
                return ResponseEntity.status(401).build();
            }
            
            List<TaskEventDto> events = taskEventService.getAllVisibleEvents(currentUserId).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} visible events for user {}", events.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "User accessed visible events (" + events.size() + " events)",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(events);
            
        } catch (Exception e) {
            logger.error("Error retrieving visible events - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve visible events: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    // Continue with similar patterns for other endpoints...
    @GetMapping("/events/range")
    public ResponseEntity<List<TaskEventDto>> getAllVisibleEventsByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Visible events by date range request - userId: {}, username: {}, startDate: {}, endDate: {}, ip: {}", 
                currentUserId, currentUsername, startDate, endDate, clientIp);
        
        try {
            if (!validateDateRange(startDate, endDate, currentUserId, clientIp)) {
                return ResponseEntity.badRequest().build();
            }
            
            if (currentUserId == null) {
                logger.warn("Unauthenticated access to visible events by date range - ip: {}", clientIp);
                securityLogger.warn("UNAUTHENTICATED_EVENTS_DATE_RANGE_ACCESS - IP: {}", clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Unauthenticated access to visible events by date range",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        null);
                        
                return ResponseEntity.status(401).build();
            }
            
            List<TaskEventDto> events = taskEventService.getAllVisibleEventsByDateRange(currentUserId, startDate, endDate)
                    .stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} visible events by date range for user {}", events.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "User accessed visible events by date range (" + events.size() + " events)",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(events);
            
        } catch (Exception e) {
            logger.error("Error retrieving visible events by date range - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve visible events by date range: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping("/events/assigned")
    public ResponseEntity<List<TaskEventDto>> getCurrentUserAssignedEvents() {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Current user assigned events request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        try {
            if (currentUserId == null) {
                logger.warn("Unauthenticated access to assigned events - ip: {}", clientIp);
                securityLogger.warn("UNAUTHENTICATED_ASSIGNED_EVENTS_ACCESS - IP: {}", clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Unauthenticated access to assigned events",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        null);
                        
                return ResponseEntity.status(401).build();
            }
            
            List<TaskEventDto> events = taskEventService.getUserAssignedEvents(currentUserId).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} assigned events for user {}", events.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "User accessed assigned events (" + events.size() + " events)",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(events);
            
        } catch (Exception e) {
            logger.error("Error retrieving assigned events - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve assigned events: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping("/events/assigned/range")
    public ResponseEntity<List<TaskEventDto>> getCurrentUserAssignedEventsByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Current user assigned events by date range request - userId: {}, username: {}, startDate: {}, endDate: {}, ip: {}", 
                currentUserId, currentUsername, startDate, endDate, clientIp);
        
        try {
            if (!validateDateRange(startDate, endDate, currentUserId, clientIp)) {
                return ResponseEntity.badRequest().build();
            }
            
            if (currentUserId == null) {
                logger.warn("Unauthenticated access to assigned events by date range - ip: {}", clientIp);
                securityLogger.warn("UNAUTHENTICATED_ASSIGNED_EVENTS_DATE_RANGE_ACCESS - IP: {}", clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Unauthenticated access to assigned events by date range",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        null);
                        
                return ResponseEntity.status(401).build();
            }
            
            List<TaskEventDto> events = taskEventService.getUserAssignedEventsByDateRange(currentUserId, startDate, endDate)
                    .stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} assigned events by date range for user {}", events.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "User accessed assigned events by date range (" + events.size() + " events)",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(events);
            
        } catch (Exception e) {
            logger.error("Error retrieving assigned events by date range - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve assigned events by date range: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping("/admin/users/{userId}/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskEventDto>> getEventsForUser(@PathVariable Long userId) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Admin events for user request - adminUserId: {}, adminUsername: {}, targetUserId: {}, ip: {}", 
                currentUserId, currentUsername, userId, clientIp);
        
        securityLogger.info("ADMIN_USER_EVENTS_ACCESS - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Action: VIEW_USER_EVENTS", 
                currentUsername, currentUserId, clientIp, userId);
        
        try {
            if (userId == null || userId <= 0) {
                logger.warn("Invalid userId for events retrieval: {} - adminUserId: {}, ip: {}", 
                        userId, currentUserId, clientIp);
                securityLogger.warn("INVALID_USER_EVENTS_USER_ID - Admin: {} (ID: {}), IP: {}, InvalidUserId: {}", 
                        currentUsername, currentUserId, clientIp, userId);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Invalid userId for events retrieval: " + userId,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            List<TaskEventDto> events = taskEventService.getEventsForUser(userId).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} events for user {} by admin {}", events.size(), userId, currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Admin accessed events for userId: " + userId + " (" + events.size() + " events)",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return ResponseEntity.ok(events);
            
        } catch (Exception e) {
            logger.error("Error retrieving events for user {} - adminUserId: {}, adminUsername: {}, ip: {}", 
                    userId, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("ADMIN_USER_EVENTS_ACCESS_ERROR - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, userId, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve events for userId: " + userId + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    // Admin only endpoints
    @GetMapping("/admin/tasks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskEventDto>> getAllTasks() {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Admin all tasks request - adminUserId: {}, adminUsername: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        securityLogger.info("ADMIN_ALL_TASKS_ACCESS - Admin: {} (ID: {}), IP: {}, Action: VIEW_ALL_TASKS", 
                currentUsername, currentUserId, clientIp);
        
        try {
            List<TaskEventDto> tasks = taskEventService.getAllTasks().stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} tasks for admin {}", tasks.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Admin accessed all tasks (" + tasks.size() + " tasks)",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return ResponseEntity.ok(tasks);
            
        } catch (Exception e) {
            logger.error("Error retrieving all tasks - adminUserId: {}, adminUsername: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("ADMIN_ALL_TASKS_ACCESS_ERROR - Admin: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve all tasks: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping("/admin/tasks/range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskEventDto>> getAllTasksByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Admin all tasks by date range request - adminUserId: {}, adminUsername: {}, startDate: {}, endDate: {}, ip: {}", 
                currentUserId, currentUsername, startDate, endDate, clientIp);
        
        securityLogger.info("ADMIN_ALL_TASKS_DATE_RANGE_ACCESS - Admin: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}, Action: VIEW_ALL_TASKS_RANGE", 
                currentUsername, currentUserId, clientIp, startDate, endDate);
        
        try {
            if (!validateDateRange(startDate, endDate, currentUserId, clientIp)) {
                return ResponseEntity.badRequest().build();
            }
            
            List<TaskEventDto> tasks = taskEventService.getAllTasksByDateRange(startDate, endDate).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} tasks by date range for admin {}", tasks.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Admin accessed all tasks by date range (" + tasks.size() + " tasks)",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return ResponseEntity.ok(tasks);
            
        } catch (Exception e) {
            logger.error("Error retrieving all tasks by date range - adminUserId: {}, adminUsername: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("ADMIN_ALL_TASKS_DATE_RANGE_ACCESS_ERROR - Admin: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve all tasks by date range: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping("/admin/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskEventDto>> getAllEvents() {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Admin all events request - adminUserId: {}, adminUsername: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        securityLogger.info("ADMIN_ALL_EVENTS_ACCESS - Admin: {} (ID: {}), IP: {}, Action: VIEW_ALL_EVENTS", 
                currentUsername, currentUserId, clientIp);
        
        try {
            List<TaskEventDto> events = taskEventService.getAllEvents().stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} events for admin {}", events.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Admin accessed all events (" + events.size() + " events)",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return ResponseEntity.ok(events);
            
        } catch (Exception e) {
            logger.error("Error retrieving all events - adminUserId: {}, adminUsername: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("ADMIN_ALL_EVENTS_ACCESS_ERROR - Admin: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve all events: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping("/admin/events/range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskEventDto>> getAllEventsByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Admin all events by date range request - adminUserId: {}, adminUsername: {}, startDate: {}, endDate: {}, ip: {}", 
                currentUserId, currentUsername, startDate, endDate, clientIp);
        
        securityLogger.info("ADMIN_ALL_EVENTS_DATE_RANGE_ACCESS - Admin: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}, Action: VIEW_ALL_EVENTS_RANGE", 
                currentUsername, currentUserId, clientIp, startDate, endDate);
        
        try {
            if (!validateDateRange(startDate, endDate, currentUserId, clientIp)) {
                return ResponseEntity.badRequest().build();
            }
            
            List<TaskEventDto> events = taskEventService.getAllEventsByDateRange(startDate, endDate).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} events by date range for admin {}", events.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Admin accessed all events by date range (" + events.size() + " events)",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return ResponseEntity.ok(events);
            
        } catch (Exception e) {
            logger.error("Error retrieving all events by date range - adminUserId: {}, adminUsername: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("ADMIN_ALL_EVENTS_DATE_RANGE_ACCESS_ERROR - Admin: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve all events by date range: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    // Helper methods
    private boolean validateDateRange(Date startDate, Date endDate, Long userId, String clientIp) {
        if (startDate == null || endDate == null) {
            logger.warn("Null date parameters in date range request - userId: {}, ip: {}", userId, clientIp);
            securityLogger.warn("NULL_DATE_PARAMETERS - User: {} (ID: {}), IP: {}", 
                    getCurrentUsernameSafely(), userId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Null date parameters in date range request",
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    userId);
            
            return false;
        }
        
        if (startDate.after(endDate)) {
            logger.warn("Invalid date range (start after end) - userId: {}, startDate: {}, endDate: {}, ip: {}", 
                    userId, startDate, endDate, clientIp);
            securityLogger.warn("INVALID_DATE_RANGE - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}", 
                    getCurrentUsernameSafely(), userId, clientIp, startDate, endDate);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Invalid date range: start date after end date",
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    userId);
            
            return false;
        }
        
        // Check for suspiciously wide date ranges (e.g., more than 2 years)
        long diffInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffInDays > 730) { // 2 years
            logger.warn("Suspiciously wide date range ({} days) - userId: {}, ip: {}", 
                    diffInDays, userId, clientIp);
            securityLogger.warn("WIDE_DATE_RANGE - User: {} (ID: {}), IP: {}, DaysDiff: {}", 
                    getCurrentUsernameSafely(), userId, clientIp, diffInDays);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Wide date range request: " + diffInDays + " days",
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    userId);
        }
        
        return true;
    }
    
    private void sanitizeTaskEventDto(TaskEventDto dto) {
        if (dto.getTitle() != null) {
            dto.setTitle(sanitizeString(dto.getTitle()));
        }
        if (dto.getDescription() != null) {
            dto.setDescription(sanitizeString(dto.getDescription()));
        }
        if (dto.getLocation() != null) {
            dto.setLocation(sanitizeString(dto.getLocation()));
        }
    }
    
    private String sanitizeString(String input) {
        if (input == null) return null;
        
        return input.replaceAll("[\\r\\n\\t]", " ")
                   .replaceAll("\\s+", " ")
                   .trim();
    }

    private TaskEventDto mapToDto(TaskEvent taskEvent) {
        try {
            TaskEventDto dto = new TaskEventDto();
            dto.setId(taskEvent.getId());
            dto.setTitle(sanitizeString(taskEvent.getTitle()));
            dto.setDescription(sanitizeString(taskEvent.getDescription()));
            dto.setStatus(taskEvent.getStatus());
            dto.setType(taskEvent.getType());
            dto.setStartTime(taskEvent.getStartTime());
            dto.setDueDate(taskEvent.getDueDate());
            dto.setLocation(sanitizeString(taskEvent.getLocation()));
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
            
        } catch (Exception e) {
            logger.error("Error mapping task event to DTO - eventId: {}", 
                    taskEvent != null ? taskEvent.getId() : "null", e);
            throw e;
        }
    }
    
    private Long getCurrentUserIdSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    !authentication.getPrincipal().toString().equals("anonymousUser")) {
                return userService.getCurrentUser().getId();
            }
        } catch (Exception e) {
            logger.debug("Could not get current user ID: {}", e.getMessage());
        }
        return null;
    }

    private String getCurrentUsernameSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    !authentication.getPrincipal().toString().equals("anonymousUser")) {
                return authentication.getName();
            }
        } catch (Exception e) {
            logger.debug("Could not get current username: {}", e.getMessage());
        }
        return "unknown";
    }
    
    private String getClientIpSafely() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                    .getRequest();
            String ipAddress = getHeaderValue(request, "X-Forwarded-For");
            if (ipAddress == null) {
                ipAddress = getHeaderValue(request, "Proxy-Client-IP");
            }
            if (ipAddress == null) {
                ipAddress = getHeaderValue(request, "WL-Proxy-Client-IP");
            }
            if (ipAddress == null) {
                ipAddress = request.getRemoteAddr();
            }
            if (ipAddress != null && ipAddress.contains(",")) {
                ipAddress = ipAddress.split(",")[0].trim();
            }
            return ipAddress != null ? ipAddress : "unknown";
        } catch (Exception e) {
            logger.debug("Could not get client IP: {}", e.getMessage());
            return "unknown";
        }
    }
    
    private String getHeaderValue(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        if (value == null || value.isEmpty() || "unknown".equalsIgnoreCase(value)) {
            return null;
        }
        if (value.length() > 100) {
            value = value.substring(0, 100);
        }
        return value;
    }
}