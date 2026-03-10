package com.secureops.hr.controller;

import com.secureops.hr.dto.HRTaskDTO;
import com.secureops.hr.service.HRTaskService;
import com.secureops.service.LogService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/hr/tasks")
public class HRTaskController {

    private static final Logger logger = LoggerFactory.getLogger(HRTaskController.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final HRTaskService taskService;
    private final LogService logService;
    private final UserService userService;

    @Autowired
    public HRTaskController(HRTaskService taskService, LogService logService, UserService userService) {
        this.taskService = taskService;
        this.logService = logService;
        this.userService = userService;
        logger.info("HRTaskController initialized");
    }    @PostMapping("/create")
    public ResponseEntity<HRTaskDTO> createTask(@Valid @RequestBody HRTaskDTO taskDTO, BindingResult bindingResult) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("HR task creation request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        // Security logging for HR task creation
        securityLogger.info("HR_TASK_CREATE_ATTEMPT - User: {} (ID: {}), IP: {}, Action: CREATE_HR_TASK", 
                currentUsername, currentUserId, clientIp);
        
        try {
            // Input validation
            if (bindingResult.hasErrors()) {
                logger.warn("Invalid input data for HR task creation - userId: {}, ip: {}", 
                        currentUserId, clientIp);
                securityLogger.warn("HR_TASK_CREATE_VALIDATION_ERROR - User: {} (ID: {}), IP: {}", 
                        currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_CREATE,
                        "HR task creation failed - validation errors",
                        clientIp,
                        AppConstants.LOG_TYPE_USER,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Security validation
            validateTaskInput(taskDTO, clientIp);
            
            // Sanitize input
            sanitizeTaskDTO(taskDTO);
            
            logger.debug("Creating HR task with sanitized data - userId: {}", currentUserId);
            HRTaskDTO createdTask = taskService.createTask(taskDTO);
            
            logger.info("HR task created successfully - taskId: {}, createdBy: {}, ip: {}", 
                    createdTask.getId(), currentUserId, clientIp);
            
            securityLogger.info("HR_TASK_CREATE_SUCCESS - User: {} (ID: {}), IP: {}, TaskId: {}", 
                    currentUsername, currentUserId, clientIp, createdTask.getId());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "HR task created successfully - " + maskTaskTitle(createdTask.getTitle()),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return new ResponseEntity<>(createdTask, HttpStatus.CREATED);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Security validation failed for HR task creation - userId: {}, ip: {}, error: {}", 
                    currentUserId, clientIp, e.getMessage());
            securityLogger.warn("HR_TASK_CREATE_SECURITY_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "HR task creation failed - security validation: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            
        } catch (Exception e) {
            logger.error("Error creating HR task - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_TASK_CREATE_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Failed to create HR task: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<HRTaskDTO>> getTasksByEmployeeId(@PathVariable Long employeeId) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("HR tasks by employee retrieval request - employeeId: {}, userId: {}, username: {}, ip: {}", 
                employeeId, currentUserId, currentUsername, clientIp);
        
        // Security logging for HR tasks by employee access
        securityLogger.info("HR_TASKS_BY_EMPLOYEE_ACCESS - User: {} (ID: {}), IP: {}, EmployeeId: {}", 
                currentUsername, currentUserId, clientIp, employeeId);
        
        try {
            List<HRTaskDTO> tasks = taskService.getTasksByEmployeeId(employeeId);
            
            logger.info("HR tasks by employee retrieved successfully - employeeId: {}, count: {}, userId: {}, ip: {}", 
                    employeeId, tasks.size(), currentUserId, clientIp);
            
            securityLogger.info("HR_TASKS_BY_EMPLOYEE_SUCCESS - User: {} (ID: {}), IP: {}, EmployeeId: {}, Count: {}", 
                    currentUsername, currentUserId, clientIp, employeeId, tasks.size());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved HR tasks by employee (" + employeeId + ") - count: " + tasks.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return ResponseEntity.ok(tasks);
            
        } catch (Exception e) {
            logger.error("Error retrieving HR tasks by employee - employeeId: {}, userId: {}, username: {}, ip: {}", 
                    employeeId, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_TASKS_BY_EMPLOYEE_ERROR - User: {} (ID: {}), IP: {}, EmployeeId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, employeeId, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve HR tasks by employee (" + employeeId + "): " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    @PutMapping("/update/{id}")
    public ResponseEntity<HRTaskDTO> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody HRTaskDTO taskDTO,
            BindingResult bindingResult) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("HR task update request - taskId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        // Security logging for HR task update
        securityLogger.info("HR_TASK_UPDATE_ATTEMPT - User: {} (ID: {}), IP: {}, TaskId: {}", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Input validation
            if (bindingResult.hasErrors()) {
                logger.warn("Invalid input data for HR task update - taskId: {}, userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("HR_TASK_UPDATE_VALIDATION_ERROR - User: {} (ID: {}), IP: {}, TaskId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "HR task update failed - validation errors for ID: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_USER,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Security validation
            validateTaskInput(taskDTO, clientIp);
            
            // Sanitize input
            sanitizeTaskDTO(taskDTO);
            
            logger.debug("Updating HR task with sanitized data - taskId: {}, userId: {}", id, currentUserId);
            HRTaskDTO updatedTask = taskService.updateTask(id, taskDTO);
            
            logger.info("HR task updated successfully - taskId: {}, updatedBy: {}, ip: {}", 
                    id, currentUserId, clientIp);
            
            securityLogger.info("HR_TASK_UPDATE_SUCCESS - User: {} (ID: {}), IP: {}, TaskId: {}", 
                    currentUsername, currentUserId, clientIp, id);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "HR task updated successfully - " + maskTaskTitle(updatedTask.getTitle()),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return ResponseEntity.ok(updatedTask);
            
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                logger.warn("HR task not found for update - taskId: {}, userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("HR_TASK_NOT_FOUND_FOR_UPDATE - User: {} (ID: {}), IP: {}, TaskId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "HR task not found for update: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_USER,
                        currentUserId);
                        
                return ResponseEntity.notFound().build();
            }
            throw e;
        } catch (Exception e) {
            logger.error("Error updating HR task - taskId: {}, userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_TASK_UPDATE_ERROR - User: {} (ID: {}), IP: {}, TaskId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to update HR task (" + id + "): " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("HR task deletion request - taskId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        // Security logging for HR task deletion
        securityLogger.info("HR_TASK_DELETE_ATTEMPT - User: {} (ID: {}), IP: {}, TaskId: {}", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Get task info before deletion for logging
            HRTaskDTO taskToDelete = taskService.getTaskById(id);
            String maskedTitle = maskTaskTitle(taskToDelete.getTitle());
            
            taskService.deleteTask(id);
            
            logger.info("HR task deleted successfully - taskId: {}, deletedBy: {}, ip: {}", 
                    id, currentUserId, clientIp);
            
            securityLogger.info("HR_TASK_DELETE_SUCCESS - User: {} (ID: {}), IP: {}, TaskId: {}", 
                    currentUsername, currentUserId, clientIp, id);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "HR task deleted successfully - " + maskedTitle,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return ResponseEntity.noContent().build();
            
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                logger.warn("HR task not found for deletion - taskId: {}, userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("HR_TASK_NOT_FOUND_FOR_DELETE - User: {} (ID: {}), IP: {}, TaskId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_DELETE,
                        "HR task not found for deletion: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_USER,
                        currentUserId);
                        
                return ResponseEntity.notFound().build();
            }
            throw e;
        } catch (Exception e) {
            logger.error("Error deleting HR task - taskId: {}, userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_TASK_DELETE_ERROR - User: {} (ID: {}), IP: {}, TaskId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Failed to delete HR task (" + id + "): " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    @GetMapping("/overdue")
    public ResponseEntity<List<HRTaskDTO>> getOverdueTasks() {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Overdue HR tasks retrieval request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        // Security logging for overdue tasks access
        securityLogger.info("HR_OVERDUE_TASKS_ACCESS - User: {} (ID: {}), IP: {}, Action: VIEW_OVERDUE_TASKS", 
                currentUsername, currentUserId, clientIp);
        
        try {
            List<HRTaskDTO> tasks = taskService.getOverdueTasks();
            
            logger.info("Overdue HR tasks retrieved successfully - count: {}, userId: {}, ip: {}", 
                    tasks.size(), currentUserId, clientIp);
            
            securityLogger.info("HR_OVERDUE_TASKS_SUCCESS - User: {} (ID: {}), IP: {}, Count: {}", 
                    currentUsername, currentUserId, clientIp, tasks.size());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved overdue HR tasks - count: " + tasks.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return ResponseEntity.ok(tasks);
            
        } catch (Exception e) {
            logger.error("Error retrieving overdue HR tasks - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_OVERDUE_TASKS_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve overdue HR tasks: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    // Helper methods
    private String getHeaderValue(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        return (value != null && !value.isEmpty() && !"unknown".equalsIgnoreCase(value)) ? value : null;
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
    }    /**
     * Validates HR task input for security vulnerabilities
     */
    private void validateTaskInput(HRTaskDTO taskDTO, String clientIp) {
        if (taskDTO == null) {
            securityLogger.warn("NULL_HR_TASK_DTO - IP: {}", clientIp);
            throw new IllegalArgumentException("HR task data is required");
        }

        // Validate string fields for security threats
        validateStringForSecurity(taskDTO.getTitle(), "title", clientIp);
        validateStringForSecurity(taskDTO.getDescription(), "description", clientIp);
        validateStringForSecurity(taskDTO.getStatus(), "status", clientIp);
        
        // Validate priority range for potential tampering
        if (taskDTO.getPriority() != null && (taskDTO.getPriority() < 1 || taskDTO.getPriority() > 5)) {
            securityLogger.warn("INVALID_PRIORITY_VALUE - Priority: {}, IP: {}", taskDTO.getPriority(), clientIp);
            throw new IllegalArgumentException("Priority must be between 1 and 5");
        }
    }

    /**
     * Validates a string for security threats
     */
    private void validateStringForSecurity(String input, String fieldName, String clientIp) {
        if (input == null) return;

        if (containsSqlInjectionPatterns(input)) {
            securityLogger.warn("SQL_INJECTION_ATTEMPT - Field: {}, IP: {}, Value: {}", fieldName, clientIp, input);
            throw new IllegalArgumentException("Potential SQL injection detected in " + fieldName);
        }

        if (containsXssPatterns(input)) {
            securityLogger.warn("XSS_ATTEMPT - Field: {}, IP: {}, Value: {}", fieldName, clientIp, input);
            throw new IllegalArgumentException("Potential XSS attack detected in " + fieldName);
        }

        if (containsPathTraversalPatterns(input)) {
            securityLogger.warn("PATH_TRAVERSAL_ATTEMPT - Field: {}, IP: {}, Value: {}", fieldName, clientIp, input);
            throw new IllegalArgumentException("Potential path traversal attack detected in " + fieldName);
        }
    }

    /**
     * Checks for SQL injection patterns
     */
    private boolean containsSqlInjectionPatterns(String input) {
        if (input == null) return false;
        
        String lowerInput = input.toLowerCase();
        String[] sqlPatterns = {
            "select", "insert", "update", "delete", "drop", "create", "alter",
            "union", "join", "where", "having", "group by", "order by",
            "--", "/*", "*/", ";", "'", "\"", "\\", "exec", "execute",
            "sp_", "xp_", "script", "javascript", "vbscript"
        };
        
        for (String pattern : sqlPatterns) {
            if (lowerInput.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks for XSS patterns
     */
    private boolean containsXssPatterns(String input) {
        if (input == null) return false;
        
        String lowerInput = input.toLowerCase();
        String[] xssPatterns = {
            "<script", "</script>", "javascript:", "vbscript:", "onload=", "onerror=",
            "onclick=", "onmouseover=", "onfocus=", "onblur=", "onchange=", "onsubmit=",
            "alert(", "confirm(", "prompt(", "eval(", "expression(", "url(",
            "import(", "document.cookie", "document.write", "window.location"
        };
        
        for (String pattern : xssPatterns) {
            if (lowerInput.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks for path traversal patterns
     */
    private boolean containsPathTraversalPatterns(String input) {
        if (input == null) return false;
        
        String[] traversalPatterns = {
            "../", "..\\", "..", "%2e%2e", "%252e%252e", "..%2f", "..%5c",
            "%2e%2e%2f", "%2e%2e%5c", "....//", "....\\\\", "%c0%ae",
            "%c1%9c", "..%c0%af", "..%c1%9c"
        };
        
        for (String pattern : traversalPatterns) {
            if (input.contains(pattern)) {
                return true;
            }
        }
        return false;
    }    /**
     * Sanitizes HR task DTO input
     */
    private void sanitizeTaskDTO(HRTaskDTO taskDTO) {
        if (taskDTO.getTitle() != null) {
            taskDTO.setTitle(sanitizeString(taskDTO.getTitle()));
        }
        if (taskDTO.getDescription() != null) {
            taskDTO.setDescription(sanitizeString(taskDTO.getDescription()));
        }
        if (taskDTO.getStatus() != null) {
            taskDTO.setStatus(sanitizeString(taskDTO.getStatus()));
        }
        // Priority is Integer, no sanitization needed - just validation
    }

    /**
     * Sanitizes a string input
     */
    private String sanitizeString(String input) {
        if (input == null) return null;
        
        return input.replaceAll("[\\r\\n\\t]", " ")
                   .replaceAll("\\s+", " ")
                   .trim();
    }

    /**
     * Masks task title for privacy in logs
     */
    private String maskTaskTitle(String title) {
        if (title == null || title.isEmpty()) {
            return title;
        }
        
        if (title.length() <= 3) {
            return "***";
        }
        
        return title.substring(0, 3) + "***";
    }
}