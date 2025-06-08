package com.secureops.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.secureops.entity.Log;
import com.secureops.service.LogService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/security/logs")
public class LogSecurityController {

    private static final Logger logger = LoggerFactory.getLogger(LogSecurityController.class);

    // For security-specific logging, create a separate logger
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final LogService logService;
    private final UserService userService;

    public LogSecurityController(LogService logService, UserService userService) {
        this.logService = logService;
        this.userService = userService;
        logger.info("LogSecurityController initialized");
    }

    @PostMapping()
    public ResponseEntity<?> logSecurityEvent(@RequestBody Map<String, Object> logRequest) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();

        logger.info("Security log creation request - userId: {}, username: {}, ip: {}",
                currentUserId, currentUsername, clientIp);

        // Security logging for security event creation
        // securityLogger.info("SECURITY_LOG_CREATION - User: {} (ID: {}), IP: {},
        // Action: CREATE_SECURITY_LOG",
        // currentUsername, currentUserId, clientIp);

        try {
            // Input validation
            if (logRequest == null || logRequest.isEmpty()) {
                logger.warn("Empty security log request - userId: {}, ip: {}", currentUserId, clientIp);
                securityLogger.warn("EMPTY_SECURITY_LOG_REQUEST - User: {} (ID: {}), IP: {}",
                        currentUsername, currentUserId, clientIp);

                logService.createLog(
                        AppConstants.LOG_ACTION_CREATE,
                        "Empty security log request received",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);

                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Invalid request - empty log data"));
            }

            // Extract and validate required fields
            String action = validateAndExtractString(logRequest, "action", "action", currentUserId, clientIp);
            String details = validateAndExtractString(logRequest, "details", "details", currentUserId, clientIp);
            String logType = validateAndExtractString(logRequest, "logType", "logType", currentUserId, clientIp);

            if (action == null || details == null || logType == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Missing required fields: action, details, logType"));
            }

            // Validate and extract userId if provided
            Long targetUserId = null;
            if (logRequest.get("userId") != null) {
                try {
                    targetUserId = Long.valueOf(logRequest.get("userId").toString());
                    if (targetUserId <= 0) {
                        logger.warn("Invalid userId in security log request: {} - requestingUserId: {}, ip: {}",
                                targetUserId, currentUserId, clientIp);
                        securityLogger.warn(
                                "INVALID_USER_ID_IN_SECURITY_LOG - User: {} (ID: {}), IP: {}, InvalidUserId: {}",
                                currentUsername, currentUserId, clientIp, targetUserId);

                        logService.createLog(
                                AppConstants.LOG_ACTION_CREATE,
                                "Invalid userId in security log request: " + targetUserId,
                                clientIp,
                                AppConstants.LOG_TYPE_SECURITY,
                                currentUserId);

                        return ResponseEntity.badRequest().body(Map.of(
                                "success", false,
                                "message", "Invalid user ID"));
                    }

                    // Check if target user exists (if userId is provided)
                    if (userService.getUserById(targetUserId) == null) {
                        logger.warn(
                                "Attempt to create security log for non-existent user - requestingUserId: {}, targetUserId: {}, ip: {}",
                                currentUserId, targetUserId, clientIp);
                        securityLogger.warn(
                                "NON_EXISTENT_USER_SECURITY_LOG - User: {} (ID: {}), IP: {}, TargetUserId: {}",
                                currentUsername, currentUserId, clientIp, targetUserId);

                        logService.createLog(
                                AppConstants.LOG_ACTION_CREATE,
                                "Attempted to create security log for non-existent userId: " + targetUserId,
                                clientIp,
                                AppConstants.LOG_TYPE_SECURITY,
                                currentUserId);

                        return ResponseEntity.badRequest().body(Map.of(
                                "success", false,
                                "message", "Target user not found"));
                    }
                } catch (NumberFormatException e) {
                    logger.warn("Invalid userId format in security log request: {} - requestingUserId: {}, ip: {}",
                            logRequest.get("userId"), currentUserId, clientIp);
                    securityLogger.warn(
                            "INVALID_USER_ID_FORMAT_SECURITY_LOG - User: {} (ID: {}), IP: {}, InvalidUserId: {}",
                            currentUsername, currentUserId, clientIp, logRequest.get("userId"));

                    logService.createLog(
                            AppConstants.LOG_ACTION_CREATE,
                            "Invalid userId format in security log request: " + logRequest.get("userId"),
                            clientIp,
                            AppConstants.LOG_TYPE_SECURITY,
                            currentUserId);

                    return ResponseEntity.badRequest().body(Map.of(
                            "success", false,
                            "message", "Invalid user ID format"));
                }
            }

            // Sanitize input data
            action = sanitizeLogInput(action);
            details = sanitizeLogInput(details);
            logType = sanitizeLogInput(logType);

            logger.debug("Creating security log - action: {}, logType: {}, targetUserId: {}, requestingUserId: {}",
                    action, logType, targetUserId, currentUserId);

            // Security logging for the actual log creation
            // securityLogger.info(
            //         "CREATING_SECURITY_LOG - User: {} (ID: {}), IP: {}, Action: {}, LogType: {}, TargetUserId: {}",
            //         currentUsername, currentUserId, clientIp, action, logType, targetUserId);

            // Create the security log
            Log createdLog = logService.createLog(action, details, clientIp, logType, targetUserId);

            if ("UNAUTHORIZED_ACCESS_ATTEMPT".equals(action)) {
                securityLogger.error(
                        "UNAUTHORIZED_ACCESS_ATTEMPT - User: {} (ID: {}), IP: {}, Details: {}, LogId: {}, Timestamp: {}",
                        currentUsername != null ? currentUsername : "UNKNOWN",
                        targetUserId != null ? targetUserId : currentUserId,
                        clientIp,
                        details,
                        createdLog.getId(),
                        createdLog.getTimestamp());

                // Additional security alert for critical unauthorized access attempts
                securityLogger.warn(
                        "SECURITY_ALERT - Unauthorized access attempt detected - IP: {}, User: {} (ID: {}), Action: {}",
                        clientIp, currentUsername, currentUserId, details);
            }

            // logger.info("Security event logged successfully - logId: {},
            // requestingUserId: {}, targetUserId: {}",
            // createdLog.getId(), currentUserId, targetUserId);

            // Log the security log creation action itself
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Security event logged: " + action + " (LogId: " + createdLog.getId() + ")",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Security event logged successfully",
                    "logId", createdLog.getId(),
                    "timestamp", createdLog.getTimestamp()));

        } catch (Exception e) {
            logger.error("Error logging security event - userId: {}, username: {}, ip: {}",
                    currentUserId, currentUsername, clientIp, e);

            securityLogger.error("SECURITY_LOG_CREATION_ERROR - User: {} (ID: {}), IP: {}, Error: {}",
                    currentUsername, currentUserId, clientIp, e.getMessage());

            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Failed to create security log: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);

            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "An error occurred while logging security event"));
        }
    }

    private String validateAndExtractString(Map<String, Object> request, String fieldName,
            String displayName, Long userId, String clientIp) {
        Object value = request.get(fieldName);
        if (value == null) {
            logger.warn("Missing {} field in security log request - userId: {}, ip: {}",
                    displayName, userId, clientIp);
            securityLogger.warn("MISSING_FIELD_SECURITY_LOG - User: {} (ID: {}), IP: {}, MissingField: {}",
                    getCurrentUsernameSafely(), userId, clientIp, displayName);
            return null;
        }

        String stringValue = value.toString().trim();
        if (stringValue.isEmpty()) {
            logger.warn("Empty {} field in security log request - userId: {}, ip: {}",
                    displayName, userId, clientIp);
            securityLogger.warn("EMPTY_FIELD_SECURITY_LOG - User: {} (ID: {}), IP: {}, EmptyField: {}",
                    getCurrentUsernameSafely(), userId, clientIp, displayName);
            return null;
        }

        if (stringValue.length() > 1000) {
            logger.warn("Oversized {} field in security log request (length: {}) - userId: {}, ip: {}",
                    displayName, stringValue.length(), userId, clientIp);
            securityLogger.warn("OVERSIZED_FIELD_SECURITY_LOG - User: {} (ID: {}), IP: {}, Field: {}, Length: {}",
                    getCurrentUsernameSafely(), userId, clientIp, displayName, stringValue.length());
            stringValue = stringValue.substring(0, 1000);
        }

        return stringValue;
    }

    private String sanitizeLogInput(String input) {
        if (input == null)
            return null;

        // Remove potentially dangerous characters
        return input.replaceAll("[\\r\\n\\t]", " ")
                .replaceAll("\\s+", " ")
                .trim();
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
