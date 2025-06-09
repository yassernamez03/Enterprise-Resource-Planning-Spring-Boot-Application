package com.secureops.hr.controller;

import com.secureops.hr.dto.EmployeeDTO;
import com.secureops.hr.entity.EmployeeStatus;
import com.secureops.hr.service.EmployeeService;
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
@RequestMapping("/api/hr/employees")
public class EmployeeController {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeController.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final EmployeeService employeeService;
    private final LogService logService;
    private final UserService userService;

    @Autowired
    public EmployeeController(EmployeeService employeeService, LogService logService, UserService userService) {
        this.employeeService = employeeService;
        this.logService = logService;
        this.userService = userService;
        logger.info("EmployeeController initialized");
    }    @PostMapping("/create")
    public ResponseEntity<EmployeeDTO> createEmployee(@Valid @RequestBody EmployeeDTO employeeDTO, BindingResult bindingResult) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Employee creation request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        // Security logging for employee creation
        securityLogger.info("HR_EMPLOYEE_CREATE_ATTEMPT - User: {} (ID: {}), IP: {}, Action: CREATE_EMPLOYEE", 
                currentUsername, currentUserId, clientIp);
        
        try {
            // Input validation
            if (bindingResult.hasErrors()) {
                logger.warn("Invalid input data for employee creation - userId: {}, ip: {}", 
                        currentUserId, clientIp);
                securityLogger.warn("HR_EMPLOYEE_CREATE_VALIDATION_ERROR - User: {} (ID: {}), IP: {}", 
                        currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_CREATE,
                        "Employee creation failed - validation errors",
                        clientIp,
                        AppConstants.LOG_TYPE_USER,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Security validation
            validateEmployeeInput(employeeDTO, clientIp);
            
            // Sanitize input
            sanitizeEmployeeDTO(employeeDTO);
            
            logger.debug("Creating employee with sanitized data - userId: {}", currentUserId);
            EmployeeDTO createdEmployee = employeeService.createEmployee(employeeDTO);
            
            logger.info("Employee created successfully - employeeId: {}, createdBy: {}, ip: {}", 
                    createdEmployee.getId(), currentUserId, clientIp);
            
            securityLogger.info("HR_EMPLOYEE_CREATE_SUCCESS - User: {} (ID: {}), IP: {}, EmployeeId: {}", 
                    currentUsername, currentUserId, clientIp, createdEmployee.getId());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Employee created successfully - " + maskEmployeeName(createdEmployee.getFirstName(), createdEmployee.getLastName()),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return new ResponseEntity<>(createdEmployee, HttpStatus.CREATED);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Security validation failed for employee creation - userId: {}, ip: {}, error: {}", 
                    currentUserId, clientIp, e.getMessage());
            securityLogger.warn("HR_EMPLOYEE_CREATE_SECURITY_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Employee creation failed - security validation: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            
        } catch (Exception e) {
            logger.error("Error creating employee - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_EMPLOYEE_CREATE_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Failed to create employee: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    @PutMapping("/update/{id}")
    public ResponseEntity<EmployeeDTO> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeDTO employeeDTO,
            BindingResult bindingResult) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Employee update request - employeeId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        // Security logging for employee update
        securityLogger.info("HR_EMPLOYEE_UPDATE_ATTEMPT - User: {} (ID: {}), IP: {}, EmployeeId: {}", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Input validation
            if (bindingResult.hasErrors()) {
                logger.warn("Invalid input data for employee update - employeeId: {}, userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("HR_EMPLOYEE_UPDATE_VALIDATION_ERROR - User: {} (ID: {}), IP: {}, EmployeeId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Employee update failed - validation errors for ID: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_USER,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Security validation
            validateEmployeeInput(employeeDTO, clientIp);
            
            // Sanitize input
            sanitizeEmployeeDTO(employeeDTO);
            
            logger.debug("Updating employee with sanitized data - employeeId: {}, userId: {}", id, currentUserId);
            EmployeeDTO updatedEmployee = employeeService.updateEmployee(id, employeeDTO);
            
            logger.info("Employee updated successfully - employeeId: {}, updatedBy: {}, ip: {}", 
                    id, currentUserId, clientIp);
            
            securityLogger.info("HR_EMPLOYEE_UPDATE_SUCCESS - User: {} (ID: {}), IP: {}, EmployeeId: {}", 
                    currentUsername, currentUserId, clientIp, id);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Employee updated successfully - " + maskEmployeeName(updatedEmployee.getFirstName(), updatedEmployee.getLastName()),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return ResponseEntity.ok(updatedEmployee);
            
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                logger.warn("Employee not found for update - employeeId: {}, userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("HR_EMPLOYEE_NOT_FOUND_FOR_UPDATE - User: {} (ID: {}), IP: {}, EmployeeId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Employee not found for update: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_USER,
                        currentUserId);
                        
                return ResponseEntity.notFound().build();
            }
            throw e;
        } catch (Exception e) {
            logger.error("Error updating employee - employeeId: {}, userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_EMPLOYEE_UPDATE_ERROR - User: {} (ID: {}), IP: {}, EmployeeId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to update employee (" + id + "): " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    @GetMapping
    public ResponseEntity<List<EmployeeDTO>> getAllEmployees() {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("All employees retrieval request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        // Security logging for employees list access
        securityLogger.info("HR_EMPLOYEES_LIST_ACCESS - User: {} (ID: {}), IP: {}, Action: VIEW_ALL_EMPLOYEES", 
                currentUsername, currentUserId, clientIp);
        
        try {
            List<EmployeeDTO> employees = employeeService.getAllEmployees();
            
            logger.info("All employees retrieved successfully - count: {}, userId: {}, ip: {}", 
                    employees.size(), currentUserId, clientIp);
            
            securityLogger.info("HR_EMPLOYEES_LIST_SUCCESS - User: {} (ID: {}), IP: {}, Count: {}", 
                    currentUsername, currentUserId, clientIp, employees.size());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved all employees - count: " + employees.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return ResponseEntity.ok(employees);
            
        } catch (Exception e) {
            logger.error("Error retrieving all employees - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_EMPLOYEES_LIST_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve all employees: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Employee retrieval by ID request - employeeId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        // Security logging for employee access
        securityLogger.info("HR_EMPLOYEE_ACCESS_BY_ID - User: {} (ID: {}), IP: {}, EmployeeId: {}", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            EmployeeDTO employee = employeeService.getEmployeeById(id);
            
            logger.info("Employee retrieved successfully - employeeId: {}, userId: {}, ip: {}", 
                    id, currentUserId, clientIp);
            
            securityLogger.info("HR_EMPLOYEE_ACCESS_SUCCESS - User: {} (ID: {}), IP: {}, EmployeeId: {}", 
                    currentUsername, currentUserId, clientIp, id);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved employee - " + maskEmployeeName(employee.getFirstName(), employee.getLastName()),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return ResponseEntity.ok(employee);
            
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                logger.warn("Employee not found - employeeId: {}, userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("HR_EMPLOYEE_NOT_FOUND - User: {} (ID: {}), IP: {}, EmployeeId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Employee not found: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_USER,
                        currentUserId);
                        
                return ResponseEntity.notFound().build();
            }
            throw e;
        } catch (Exception e) {
            logger.error("Error retrieving employee by ID - employeeId: {}, userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_EMPLOYEE_ACCESS_ERROR - User: {} (ID: {}), IP: {}, EmployeeId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve employee (" + id + "): " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Employee deletion request - employeeId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        // Security logging for employee deletion
        securityLogger.info("HR_EMPLOYEE_DELETE_ATTEMPT - User: {} (ID: {}), IP: {}, EmployeeId: {}", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Get employee info before deletion for logging
            EmployeeDTO employeeToDelete = employeeService.getEmployeeById(id);
            String maskedName = maskEmployeeName(employeeToDelete.getFirstName(), employeeToDelete.getLastName());
            
            employeeService.deleteEmployee(id);
            
            logger.info("Employee deleted successfully - employeeId: {}, deletedBy: {}, ip: {}", 
                    id, currentUserId, clientIp);
            
            securityLogger.info("HR_EMPLOYEE_DELETE_SUCCESS - User: {} (ID: {}), IP: {}, EmployeeId: {}", 
                    currentUsername, currentUserId, clientIp, id);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Employee deleted successfully - " + maskedName,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return ResponseEntity.noContent().build();
            
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                logger.warn("Employee not found for deletion - employeeId: {}, userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("HR_EMPLOYEE_NOT_FOUND_FOR_DELETE - User: {} (ID: {}), IP: {}, EmployeeId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_DELETE,
                        "Employee not found for deletion: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_USER,
                        currentUserId);
                        
                return ResponseEntity.notFound().build();
            }
            throw e;
        } catch (Exception e) {
            logger.error("Error deleting employee - employeeId: {}, userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_EMPLOYEE_DELETE_ERROR - User: {} (ID: {}), IP: {}, EmployeeId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Failed to delete employee (" + id + "): " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    @GetMapping("/status/{status}")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesByStatus(
            @PathVariable EmployeeStatus status) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Employees by status retrieval request - status: {}, userId: {}, username: {}, ip: {}", 
                status, currentUserId, currentUsername, clientIp);
        
        // Security logging for employees by status access
        securityLogger.info("HR_EMPLOYEES_BY_STATUS_ACCESS - User: {} (ID: {}), IP: {}, Status: {}", 
                currentUsername, currentUserId, clientIp, status);
        
        try {
            List<EmployeeDTO> employees = employeeService.getEmployeesByStatus(status);
            
            logger.info("Employees by status retrieved successfully - status: {}, count: {}, userId: {}, ip: {}", 
                    status, employees.size(), currentUserId, clientIp);
            
            securityLogger.info("HR_EMPLOYEES_BY_STATUS_SUCCESS - User: {} (ID: {}), IP: {}, Status: {}, Count: {}", 
                    currentUsername, currentUserId, clientIp, status, employees.size());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved employees by status (" + status + ") - count: " + employees.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return ResponseEntity.ok(employees);
            
        } catch (Exception e) {
            logger.error("Error retrieving employees by status - status: {}, userId: {}, username: {}, ip: {}", 
                    status, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_EMPLOYEES_BY_STATUS_ERROR - User: {} (ID: {}), IP: {}, Status: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, status, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve employees by status (" + status + "): " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    @GetMapping("/role/{role}")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesByRole(
            @PathVariable String role) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Employees by role retrieval request - role: {}, userId: {}, username: {}, ip: {}", 
                role, currentUserId, currentUsername, clientIp);
        
        // Security logging for employees by role access
        securityLogger.info("HR_EMPLOYEES_BY_ROLE_ACCESS - User: {} (ID: {}), IP: {}, Role: {}", 
                currentUsername, currentUserId, clientIp, role);
        
        try {
            // Validate role parameter for security
            validateStringForSecurity(role, "role", clientIp);
            
            List<EmployeeDTO> employees = employeeService.getEmployeesByRole(role);
            
            logger.info("Employees by role retrieved successfully - role: {}, count: {}, userId: {}, ip: {}", 
                    role, employees.size(), currentUserId, clientIp);
            
            securityLogger.info("HR_EMPLOYEES_BY_ROLE_SUCCESS - User: {} (ID: {}), IP: {}, Role: {}, Count: {}", 
                    currentUsername, currentUserId, clientIp, role, employees.size());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved employees by role (" + role + ") - count: " + employees.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return ResponseEntity.ok(employees);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid role parameter - role: {}, userId: {}, ip: {}, error: {}", 
                    role, currentUserId, clientIp, e.getMessage());
            securityLogger.warn("HR_EMPLOYEES_BY_ROLE_INVALID_PARAM - User: {} (ID: {}), IP: {}, Role: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, role, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Invalid role parameter (" + role + "): " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.badRequest().build();
            
        } catch (Exception e) {
            logger.error("Error retrieving employees by role - role: {}, userId: {}, username: {}, ip: {}", 
                    role, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_EMPLOYEES_BY_ROLE_ERROR - User: {} (ID: {}), IP: {}, Role: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, role, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve employees by role (" + role + "): " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    // Bullshit method to find employee by userId
    @GetMapping("/user/{userId}")
    public ResponseEntity<EmployeeDTO> getEmployeeByUserId(@PathVariable Long userId) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Employee lookup by userId request - targetUserId: {}, requestingUserId: {}, username: {}, ip: {}", 
                userId, currentUserId, currentUsername, clientIp);
        
        // Security logging for employee lookup by userId
        securityLogger.info("HR_EMPLOYEE_LOOKUP_BY_USER_ID - User: {} (ID: {}), IP: {}, TargetUserId: {}", 
                currentUsername, currentUserId, clientIp, userId);
        
        try {
            EmployeeDTO employee = employeeService.getEmployeeByUserId(userId);
            
            logger.info("Employee lookup by userId successful - targetUserId: {}, requestingUserId: {}, ip: {}", 
                    userId, currentUserId, clientIp);
            
            securityLogger.info("HR_EMPLOYEE_LOOKUP_BY_USER_ID_SUCCESS - User: {} (ID: {}), IP: {}, TargetUserId: {}", 
                    currentUsername, currentUserId, clientIp, userId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Employee lookup by userId successful - " + maskEmployeeName(employee.getFirstName(), employee.getLastName()),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
                    
            return ResponseEntity.ok(employee);
            
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                logger.warn("Employee not found for userId - targetUserId: {}, requestingUserId: {}, ip: {}", 
                        userId, currentUserId, clientIp);
                securityLogger.warn("HR_EMPLOYEE_NOT_FOUND_FOR_USER_ID - User: {} (ID: {}), IP: {}, TargetUserId: {}", 
                        currentUsername, currentUserId, clientIp, userId);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Employee not found for userId: " + userId,
                        clientIp,
                        AppConstants.LOG_TYPE_USER,
                        currentUserId);
                        
                return ResponseEntity.notFound().build();
            }
            throw e;
        } catch (Exception e) {
            logger.error("Error looking up employee by userId - targetUserId: {}, requestingUserId: {}, username: {}, ip: {}", 
                    userId, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("HR_EMPLOYEE_LOOKUP_BY_USER_ID_ERROR - User: {} (ID: {}), IP: {}, TargetUserId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, userId, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to lookup employee by userId (" + userId + "): " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }    }
    // End of bullshit

    // ============== HELPER METHODS ==============

    /**
     * Validates employee input for security vulnerabilities
     */
    private void validateEmployeeInput(EmployeeDTO employeeDTO, String clientIp) {
        if (employeeDTO == null) {
            securityLogger.warn("NULL_EMPLOYEE_DTO - IP: {}", clientIp);
            throw new IllegalArgumentException("Employee data is required");
        }

        // Validate string fields for security threats
        validateStringForSecurity(employeeDTO.getFirstName(), "firstName", clientIp);
        validateStringForSecurity(employeeDTO.getLastName(), "lastName", clientIp);
        validateStringForSecurity(employeeDTO.getEmail(), "email", clientIp);
        validateStringForSecurity(employeeDTO.getRole(), "role", clientIp);
        validateStringForSecurity(employeeDTO.getPosition(), "position", clientIp);
        validateStringForSecurity(employeeDTO.getPhone(), "phone", clientIp);
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
     * Sanitizes employee DTO input
     */
    private void sanitizeEmployeeDTO(EmployeeDTO employeeDTO) {
        if (employeeDTO == null) return;

        employeeDTO.setFirstName(sanitizeString(employeeDTO.getFirstName()));
        employeeDTO.setLastName(sanitizeString(employeeDTO.getLastName()));
        employeeDTO.setEmail(sanitizeString(employeeDTO.getEmail()));
        employeeDTO.setRole(sanitizeString(employeeDTO.getRole()));
        employeeDTO.setPosition(sanitizeString(employeeDTO.getPosition()));
        employeeDTO.setPhone(sanitizeString(employeeDTO.getPhone()));
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
     * Masks employee name for privacy in logs
     */
    private String maskEmployeeName(String firstName, String lastName) {
        StringBuilder masked = new StringBuilder();
        
        if (firstName != null && !firstName.isEmpty()) {
            masked.append(firstName.length() <= 2 ? "***" : firstName.substring(0, 2) + "***");
        }
        
        if (lastName != null && !lastName.isEmpty()) {
            if (masked.length() > 0) masked.append(" ");
            masked.append(lastName.length() <= 1 ? "***" : lastName.substring(0, 1) + "***");
        }
        
        return masked.length() > 0 ? masked.toString() : "***";
    }    /**
     * Gets current user ID safely
     */
    private Long getCurrentUserIdSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !"anonymousUser".equals(authentication.getPrincipal())) {
                return userService.getCurrentUser().getId();
            }
        } catch (Exception e) {
            logger.debug("Error getting current user ID: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Gets current username safely
     */
    private String getCurrentUsernameSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !"anonymousUser".equals(authentication.getPrincipal())) {
                return authentication.getName();
            }
        } catch (Exception e) {
            logger.debug("Error getting current username: {}", e.getMessage());
        }
        return "unknown";
    }

    /**
     * Gets client IP address safely
     */
    private String getClientIpSafely() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            
            String ip = getHeaderValue(request, "X-Forwarded-For");
            if (ip != null) return ip;
            
            ip = getHeaderValue(request, "X-Real-IP");
            if (ip != null) return ip;
            
            ip = getHeaderValue(request, "X-Original-Forwarded-For");
            if (ip != null) return ip;
            
            ip = request.getRemoteAddr();
            return ip != null ? ip : "unknown";
            
        } catch (Exception e) {
            logger.debug("Error getting client IP: {}", e.getMessage());
            return "unknown";
        }
    }

    /**
     * Gets header value safely
     */
    private String getHeaderValue(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        if (value == null || value.isEmpty() || "unknown".equalsIgnoreCase(value)) {
            return null;
        }
        if (value.length() > 100) {
            return value.substring(0, 100);
        }
        return value;
    }

    /**
     * Checks for SQL injection patterns
     */
    private boolean containsSqlInjectionPatterns(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase();
        String[] sqlPatterns = {"'", "\"", ";", "/*", "*/", "xp_", "sp_", "union", "select", "insert", 
                               "update", "delete", "drop", "create", "alter", "exec", "execute", "--", "#"};

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
        String[] xssPatterns = {"<script", "</script>", "javascript:", "onload=", "onclick=", "onerror=",
                               "onmouseover=", "eval(", "alert(", "confirm(", "prompt(", "document.cookie"};

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
        return input.contains("../") || input.contains("..\\") || input.contains("/etc/") 
               || input.contains("\\windows\\") || input.contains("\\windows\\") || input.contains("%2e%2e");
    }
}