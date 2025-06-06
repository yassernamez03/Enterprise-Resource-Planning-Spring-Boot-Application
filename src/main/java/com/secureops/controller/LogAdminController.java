package com.secureops.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.secureops.entity.Log;
import com.secureops.service.LogService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/admin/logs")
@PreAuthorize("hasRole('ADMIN')")
public class LogAdminController {

    private static final Logger logger = LoggerFactory.getLogger(LogAdminController.class);
    
    // For security-specific logging, create a separate logger
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");
    
    private final LogService logService;
    private final UserService userService;

    public LogAdminController(LogService logService, UserService userService) {
        this.logService = logService;
        this.userService = userService;
        logger.info("LogAdminController initialized");
    }

    @GetMapping
    public ResponseEntity<?> getAllLogs(HttpServletRequest request) {
        String clientIp = getClientIpSafely(request);
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Admin log retrieval request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        // Security logging for admin access
        securityLogger.info("ADMIN_LOG_ACCESS - User: {} (ID: {}), IP: {}, Action: VIEW_ALL_LOGS", 
                currentUsername, currentUserId, clientIp);
        
        try {
            // Validate admin access
            if (!isCurrentUserAdmin()) {
                logger.warn("Unauthorized access attempt to admin logs - userId: {}, username: {}, ip: {}", 
                        currentUserId, currentUsername, clientIp);
                securityLogger.warn("UNAUTHORIZED_ADMIN_ACCESS - User: {} (ID: {}), IP: {}, Action: VIEW_ALL_LOGS", 
                        currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Unauthorized admin log access attempt",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.status(403).body("Access denied");
            }
            
            List<Log> logs = logService.getAllLogs();
            
            logger.info("Successfully retrieved {} logs for admin - userId: {}, username: {}", 
                    logs.size(), currentUserId, currentUsername);
            
            // Log the admin action
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Admin retrieved all logs (" + logs.size() + " records)",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return ResponseEntity.ok(logs);
            
        } catch (Exception e) {
            logger.error("Error retrieving all logs - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("ADMIN_LOG_ACCESS_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve admin logs: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().body("An error occurred while retrieving logs.");
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserLogs(@PathVariable Long userId, HttpServletRequest request) {
        String clientIp = getClientIpSafely(request);
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Admin user log retrieval request - adminUserId: {}, adminUsername: {}, targetUserId: {}, ip: {}", 
                currentUserId, currentUsername, userId, clientIp);
        
        // Input validation
        if (userId == null || userId <= 0) {
            logger.warn("Invalid userId parameter: {} - adminUserId: {}, ip: {}", 
                    userId, currentUserId, clientIp);
            securityLogger.warn("INVALID_USER_ID_PARAMETER - Admin: {} (ID: {}), IP: {}, InvalidUserId: {}", 
                    currentUsername, currentUserId, clientIp, userId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Invalid userId parameter in admin log request: " + userId,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
                    
            return ResponseEntity.badRequest().body("Invalid user ID");
        }
        
        // Security logging for admin access to specific user logs
        securityLogger.info("ADMIN_USER_LOG_ACCESS - Admin: {} (ID: {}), IP: {}, TargetUserId: {}", 
                currentUsername, currentUserId, clientIp, userId);
        
        try {
            // Validate admin access
            if (!isCurrentUserAdmin()) {
                logger.warn("Unauthorized access attempt to user logs - userId: {}, username: {}, targetUserId: {}, ip: {}", 
                        currentUserId, currentUsername, userId, clientIp);
                securityLogger.warn("UNAUTHORIZED_USER_LOG_ACCESS - User: {} (ID: {}), IP: {}, TargetUserId: {}", 
                        currentUsername, currentUserId, clientIp, userId);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Unauthorized user log access attempt for userId: " + userId,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.status(403).body("Access denied");
            }
            
            // Check if target user exists
            try {
                userService.getUserById(userId);
            } catch (Exception e) {
                logger.warn("Attempt to access logs for non-existent user - adminUserId: {}, targetUserId: {}, ip: {}", 
                        currentUserId, userId, clientIp);
                securityLogger.warn("NON_EXISTENT_USER_LOG_ACCESS - Admin: {} (ID: {}), IP: {}, TargetUserId: {}", 
                        currentUsername, currentUserId, clientIp, userId);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Attempted to access logs for non-existent userId: " + userId,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.notFound().build();
            }
            
            List<Log> logs = logService.getUserLogs(userId);
            
            logger.info("Successfully retrieved {} logs for user {} by admin - adminUserId: {}, adminUsername: {}", 
                    logs.size(), userId, currentUserId, currentUsername);
            
            // Log the admin action
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Admin retrieved logs for userId: " + userId + " (" + logs.size() + " records)",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return ResponseEntity.ok(logs);
            
        } catch (Exception e) {
            logger.error("Error retrieving logs for user {} - adminUserId: {}, adminUsername: {}, ip: {}", 
                    userId, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("ADMIN_USER_LOG_ACCESS_ERROR - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, userId, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve logs for userId: " + userId + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().body("An error occurred while retrieving user logs.");
        }
    }

    private boolean isCurrentUserAdmin() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                return authentication.getAuthorities().stream()
                        .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            }
        } catch (Exception e) {
            logger.debug("Error checking admin role: {}", e.getMessage());
        }
        return false;
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

    private String getClientIpSafely(HttpServletRequest request) {
        if (request == null) {
            try {
                request = ((org.springframework.web.context.request.ServletRequestAttributes) 
                        org.springframework.web.context.request.RequestContextHolder
                        .currentRequestAttributes()).getRequest();
            } catch (Exception e) {
                logger.debug("Could not get request from context: {}", e.getMessage());
                return "unknown";
            }
        }
        
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