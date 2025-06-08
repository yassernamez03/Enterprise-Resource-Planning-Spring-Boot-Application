package com.secureops.controller;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import com.secureops.dto.PasswordChangeDto;
import com.secureops.dto.UserDto;
import com.secureops.dto.UserProfileUpdateDto;
import com.secureops.entity.User;
import com.secureops.service.LogService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    // For security-specific logging, create a separate logger
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final UserService userService;
    private final LogService logService;

    private static final List<String> ALLOWED_AVATAR_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif");
    private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024;

    public UserController(UserService userService, LogService logService) {
        this.userService = userService;
        this.logService = logService;
        logger.info("UserController initialized");
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Current user profile request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        try {
            if (currentUserId == null) {
                logger.warn("Unauthenticated access to current user profile - ip: {}", clientIp);
                securityLogger.warn("UNAUTHENTICATED_PROFILE_ACCESS - IP: {}", clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Unauthenticated access to current user profile",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        null);
                        
                return ResponseEntity.status(401).build();
            }
            
            UserDto userDto = userService.getCurrentUser();
            
            logger.info("Current user profile retrieved successfully - userId: {}", currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "User accessed own profile",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(userDto);
            
        } catch (Exception e) {
            logger.error("Error retrieving current user profile - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve current user profile: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getPendingApprovals() {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Pending approvals request - adminUserId: {}, adminUsername: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        // securityLogger.info("ADMIN_PENDING_APPROVALS_ACCESS - Admin: {} (ID: {}), IP: {}, Action: VIEW_PENDING_APPROVALS", 
        //         currentUsername, currentUserId, clientIp);
        
        try {
            List<UserDto> pendingUsers = userService.getPendingApprovals().stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            
            logger.info("Retrieved {} pending approval users by admin {}", pendingUsers.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Admin accessed pending approvals (" + pendingUsers.size() + " users)",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return ResponseEntity.ok(pendingUsers);
            
        } catch (Exception e) {
            logger.error("Error retrieving pending approvals - adminUserId: {}, adminUsername: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("ADMIN_PENDING_APPROVALS_ERROR - Admin: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve pending approvals: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> approveUser(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("User approval request - adminUserId: {}, adminUsername: {}, targetUserId: {}, ip: {}", 
                currentUserId, currentUsername, id, clientIp);
        
        // securityLogger.info("ADMIN_USER_APPROVAL - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Action: APPROVE_USER", 
        //         currentUsername, currentUserId, clientIp, id);
        
        try {
            // Input validation
            if (id == null || id <= 0) {
                logger.warn("Invalid userId for approval: {} - adminUserId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_APPROVAL_USER_ID - Admin: {} (ID: {}), IP: {}, InvalidUserId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid userId for approval: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            User user = userService.approveUser(id);
            
            logger.info("User approved successfully - approvedUserId: {}, approvedUserEmail: {}, adminUserId: {}", 
                    user.getId(), user.getEmail(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Admin approved user: " + user.getEmail() + " (ID: " + id + ")",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return ResponseEntity.ok(mapToDto(user));
            
        } catch (Exception e) {
            logger.error("Error approving user {} - adminUserId: {}, adminUsername: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("ADMIN_USER_APPROVAL_ERROR - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to approve user ID: " + id + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> rejectUser(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("User rejection request - adminUserId: {}, adminUsername: {}, targetUserId: {}, ip: {}", 
                currentUserId, currentUsername, id, clientIp);
        
        // securityLogger.info("ADMIN_USER_REJECTION - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Action: REJECT_USER", 
        //         currentUsername, currentUserId, clientIp, id);
        
        try {
            // Input validation
            if (id == null || id <= 0) {
                logger.warn("Invalid userId for rejection: {} - adminUserId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_REJECTION_USER_ID - Admin: {} (ID: {}), IP: {}, InvalidUserId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid userId for rejection: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            User user = userService.rejectUser(id);
            
            logger.info("User rejected successfully - rejectedUserId: {}, rejectedUserEmail: {}, adminUserId: {}", 
                    user.getId(), user.getEmail(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Admin rejected user: " + user.getEmail() + " (ID: " + id + ")",
                    clientIp,
                    AppConstants.LOG_TYPE_ADMIN,
                    currentUserId);
            
            return ResponseEntity.ok(mapToDto(user));
            
        } catch (Exception e) {
            logger.error("Error rejecting user {} - adminUserId: {}, adminUsername: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("ADMIN_USER_REJECTION_ERROR - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to reject user ID: " + id + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @GetMapping
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("All users request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        // Note: This endpoint is currently not protected by @PreAuthorize, which might be a security concern
        logger.warn("Unprotected all users endpoint accessed - userId: {}, ip: {}", currentUserId, clientIp);
        securityLogger.warn("UNPROTECTED_ALL_USERS_ACCESS - User: {} (ID: {}), IP: {}", 
                currentUsername, currentUserId, clientIp);
        
        try {
            List<UserDto> users = userService.getAllUsers();
            
            logger.info("Retrieved {} users - requestingUserId: {}", users.size(), currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "User accessed all users list (" + users.size() + " users)",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(users);
            
        } catch (Exception e) {
            logger.error("Error retrieving all users - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve all users: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody PasswordChangeDto passwordChangeDto) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Password change request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        // securityLogger.info("PASSWORD_CHANGE_REQUEST - User: {} (ID: {}), IP: {}, Action: CHANGE_PASSWORD", 
        //         currentUsername, currentUserId, clientIp);
        
        try {
            // Input validation
            if (passwordChangeDto == null) {
                logger.warn("Null password change data - userId: {}, ip: {}", currentUserId, clientIp);
                securityLogger.warn("NULL_PASSWORD_CHANGE_DATA - User: {} (ID: {}), IP: {}", 
                        currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Null password change data received",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid request data"));
            }
            
            if (passwordChangeDto.getCurrentPassword() == null || passwordChangeDto.getCurrentPassword().isEmpty() ||
                passwordChangeDto.getNewPassword() == null || passwordChangeDto.getNewPassword().isEmpty()) {
                logger.warn("Empty password fields in change request - userId: {}, ip: {}", currentUserId, clientIp);
                securityLogger.warn("EMPTY_PASSWORD_FIELDS - User: {} (ID: {}), IP: {}", 
                        currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Empty password fields in change request",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().body(Map.of("message", "Current and new passwords are required"));
            }
            
            if (!isPasswordValid(passwordChangeDto.getNewPassword())) {
                logger.warn("Weak password in change request - userId: {}, ip: {}", currentUserId, clientIp);
                securityLogger.warn("WEAK_PASSWORD_CHANGE_ATTEMPT - User: {} (ID: {}), IP: {}", 
                        currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Weak password in change request",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        Map.of("message",
                                "Password must have at least 8 characters, including 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"));
            }

            boolean changed = userService.changePassword(
                    passwordChangeDto.getCurrentPassword(),
                    passwordChangeDto.getNewPassword());

            if (changed) {
                logger.info("Password changed successfully - userId: {}", currentUserId);
                // securityLogger.info("PASSWORD_CHANGED_SUCCESS - User: {} (ID: {}), IP: {}", 
                //         currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "User changed password successfully",
                        clientIp,
                        AppConstants.LOG_TYPE_USER,
                        currentUserId);
                        
                return ResponseEntity.ok().body(Map.of("message", "Password changed successfully"));
            } else {
                logger.warn("Password change failed - incorrect current password - userId: {}, ip: {}", 
                        currentUserId, clientIp);
                securityLogger.warn("PASSWORD_CHANGE_FAILED_INCORRECT - User: {} (ID: {}), IP: {}", 
                        currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Password change failed - incorrect current password",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        Map.of("message", "Current password is incorrect"));
            }
            
        } catch (Exception e) {
            logger.error("Error changing password - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("PASSWORD_CHANGE_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to change password: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of("message", "An error occurred while changing password"));
        }
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> changeUserRole(@PathVariable Long id, @RequestBody Map<String, String> roleData) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("User role change request - adminUserId: {}, adminUsername: {}, targetUserId: {}, ip: {}", 
                currentUserId, currentUsername, id, clientIp);
        
        // securityLogger.info("ADMIN_ROLE_CHANGE - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Action: CHANGE_USER_ROLE", 
        //         currentUsername, currentUserId, clientIp, id);
        
        try {
            // Input validation
            if (id == null || id <= 0) {
                logger.warn("Invalid userId for role change: {} - adminUserId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_ROLE_CHANGE_USER_ID - Admin: {} (ID: {}), IP: {}, InvalidUserId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid userId for role change: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid user ID"));
            }
            
            String role = roleData != null ? roleData.get("role") : null;
            if (role == null || role.isEmpty()) {
                logger.warn("Empty role in role change request - adminUserId: {}, targetUserId: {}, ip: {}", 
                        currentUserId, id, clientIp);
                securityLogger.warn("EMPTY_ROLE_CHANGE_DATA - Admin: {} (ID: {}), IP: {}, TargetUserId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Empty role in role change request for userId: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().body(Map.of("message", "Role cannot be empty"));
            }

            try {
                User.UserRole userRole = User.UserRole.valueOf(role);
                User user = userService.changeUserRole(id, userRole);
                
                logger.info("User role changed successfully - targetUserId: {}, newRole: {}, adminUserId: {}", 
                        user.getId(), userRole, currentUserId);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Admin changed user role: " + user.getEmail() + " to " + userRole + " (ID: " + id + ")",
                        clientIp,
                        AppConstants.LOG_TYPE_ADMIN,
                        currentUserId);
                
                return ResponseEntity.ok(mapToDto(user));
                
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid role specified in role change: {} - adminUserId: {}, targetUserId: {}, ip: {}", 
                        role, currentUserId, id, clientIp);
                securityLogger.warn("INVALID_ROLE_SPECIFIED - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, InvalidRole: {}", 
                        currentUsername, currentUserId, clientIp, id, role);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid role specified in role change: " + role + " for userId: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid role specified"));
            }
            
        } catch (Exception e) {
            logger.error("Error changing user role {} - adminUserId: {}, adminUsername: {}, targetUserId: {}, ip: {}", 
                    roleData != null ? roleData.get("role") : "null", currentUserId, currentUsername, id, clientIp, e);
            
            securityLogger.error("ADMIN_ROLE_CHANGE_ERROR - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to change user role for ID: " + id + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of("message", "An error occurred while changing user role"));
        }
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetUserPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> passwordData) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Admin password reset request - adminUserId: {}, adminUsername: {}, targetUserId: {}, ip: {}", 
                currentUserId, currentUsername, id, clientIp);
        
        // securityLogger.info("ADMIN_PASSWORD_RESET - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Action: RESET_USER_PASSWORD", 
        //         currentUsername, currentUserId, clientIp, id);

        try {
            // Input validation
            if (id == null || id <= 0) {
                logger.warn("Invalid userId for password reset: {} - adminUserId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_PASSWORD_RESET_USER_ID - Admin: {} (ID: {}), IP: {}, InvalidUserId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid userId for password reset: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid user ID"));
            }
            
            String newPassword = passwordData != null ? passwordData.get("newPassword") : null;
            if (newPassword == null || newPassword.isEmpty()) {
                logger.warn("Empty password in reset request - adminUserId: {}, targetUserId: {}, ip: {}", 
                        currentUserId, id, clientIp);
                securityLogger.warn("EMPTY_PASSWORD_RESET_DATA - Admin: {} (ID: {}), IP: {}, TargetUserId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Empty password in reset request for userId: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().body(Map.of("message", "New password cannot be empty"));
            }

            if (!isPasswordValid(newPassword)) {
                logger.warn("Weak password in admin reset request - adminUserId: {}, targetUserId: {}, ip: {}", 
                        currentUserId, id, clientIp);
                securityLogger.warn("WEAK_PASSWORD_ADMIN_RESET - Admin: {} (ID: {}), IP: {}, TargetUserId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Weak password in admin reset request for userId: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().body(Map.of("message",
                        "Password must have at least 8 characters, including 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"));
            }
            
            boolean success = userService.adminResetPassword(id, newPassword);
            if (success) {
                logger.info("Admin password reset successful - adminUserId: {}, targetUserId: {}", currentUserId, id);
                // securityLogger.info("ADMIN_PASSWORD_RESET_SUCCESS - Admin: {} (ID: {}), IP: {}, TargetUserId: {}", 
                //         currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Admin reset password for userId: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_ADMIN,
                        currentUserId);
                        
                return ResponseEntity.ok().body(Map.of("message", "Password reset successfully"));
            } else {
                logger.error("Admin password reset failed - adminUserId: {}, targetUserId: {}, ip: {}", 
                        currentUserId, id, clientIp);
                securityLogger.error("ADMIN_PASSWORD_RESET_FAILED - Admin: {} (ID: {}), IP: {}, TargetUserId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Failed admin password reset for userId: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_ERROR,
                        currentUserId);
                        
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Failed to reset password"));
            }
            
        } catch (Exception e) {
            logger.error("Error in admin password reset - adminUserId: {}, adminUsername: {}, targetUserId: {}, ip: {}", 
                    currentUserId, currentUsername, id, clientIp, e);
            
            securityLogger.error("ADMIN_PASSWORD_RESET_ERROR - Admin: {} (ID: {}), IP: {}, TargetUserId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Error in admin password reset for ID: " + id + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of("message", "An error occurred while resetting password"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("User by ID request - requestingUserId: {}, requestingUsername: {}, targetUserId: {}, ip: {}", 
                currentUserId, currentUsername, id, clientIp);
        
        try {
            // Input validation
            if (id == null || id <= 0) {
                logger.warn("Invalid userId in getUserById: {} - requestingUserId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_GET_USER_BY_ID - User: {} (ID: {}), IP: {}, InvalidUserId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Invalid userId in getUserById: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            UserDto userDto = userService.getUserDtoById(id);
            
            logger.info("User retrieved by ID successfully - requestingUserId: {}, targetUserId: {}", 
                    currentUserId, id);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "User accessed profile by ID: " + id,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(userDto);
            
        } catch (Exception e) {
            logger.error("Error retrieving user by ID {} - requestingUserId: {}, requestingUsername: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve user by ID: " + id + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @PostMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(@RequestBody UserProfileUpdateDto profileUpdateDto) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Profile update request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        try {
            // Input validation
            if (profileUpdateDto == null) {
                logger.warn("Null profile update data - userId: {}, ip: {}", currentUserId, clientIp);
                securityLogger.warn("NULL_PROFILE_UPDATE_DATA - User: {} (ID: {}), IP: {}", 
                        currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Null profile update data received",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Sanitize input data
            sanitizeProfileUpdateDto(profileUpdateDto);
            
            UserDto updatedUser = userService.updateProfile(profileUpdateDto);
            
            logger.info("Profile updated successfully - userId: {}", currentUserId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "User updated profile",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(updatedUser);
            
        } catch (Exception e) {
            logger.error("Error updating profile - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to update profile: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw e;
        }
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> updateAvatar(@RequestParam("file") MultipartFile file) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Avatar update request - userId: {}, username: {}, fileName: {}, fileSize: {}, ip: {}", 
                currentUserId, currentUsername, file.getOriginalFilename(), file.getSize(), clientIp);
        
        // securityLogger.info("AVATAR_UPDATE_REQUEST - User: {} (ID: {}), IP: {}, FileName: {}, FileSize: {}, Action: UPDATE_AVATAR", 
        //         currentUsername, currentUserId, clientIp, file.getOriginalFilename(), file.getSize());
        
        try {
            // Check if file is empty
            if (file.isEmpty()) {
                logger.warn("Empty avatar file upload - userId: {}, ip: {}", currentUserId, clientIp);
                securityLogger.warn("EMPTY_AVATAR_FILE - User: {} (ID: {}), IP: {}", 
                        currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Empty avatar file upload attempt",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().body(Map.of("message", "Empty file"));
            }

            // Validate declared content type (from HTTP headers)
            String declaredContentType = file.getContentType();
            if (declaredContentType == null || !ALLOWED_AVATAR_TYPES.contains(declaredContentType.toLowerCase())) {
                logger.warn("Invalid avatar content type: {} - userId: {}, ip: {}", 
                        declaredContentType, currentUserId, clientIp);
                securityLogger.warn("INVALID_AVATAR_CONTENT_TYPE - User: {} (ID: {}), IP: {}, ContentType: {}", 
                        currentUsername, currentUserId, clientIp, declaredContentType);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid avatar content type: " + declaredContentType,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Only JPEG, PNG, and GIF images are allowed"));
            }

            // Validate file size
            if (file.getSize() > MAX_AVATAR_SIZE) {
                logger.warn("Avatar file size exceeds limit: {} bytes - userId: {}, ip: {}", 
                        file.getSize(), currentUserId, clientIp);
                securityLogger.warn("OVERSIZED_AVATAR_FILE - User: {} (ID: {}), IP: {}, FileSize: {}, MaxSize: {}", 
                        currentUsername, currentUserId, clientIp, file.getSize(), MAX_AVATAR_SIZE);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Avatar file size exceeds limit: " + file.getSize() + " bytes",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "File size exceeds the maximum limit of 2MB"));
            }

            // Validate actual file content by checking file signature/magic bytes
            byte[] fileBytes = file.getBytes();
            if (!isValidImageFile(fileBytes)) {
                logger.warn("Invalid avatar image file content - userId: {}, fileName: {}, ip: {}", 
                        currentUserId, file.getOriginalFilename(), clientIp);
                securityLogger.warn("INVALID_AVATAR_IMAGE_CONTENT - User: {} (ID: {}), IP: {}, FileName: {}", 
                        currentUsername, currentUserId, clientIp, file.getOriginalFilename());
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid avatar image file content detected: " + file.getOriginalFilename(),
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Invalid image file content detected"));
            }

            // Process valid file
            UserDto updatedUser = userService.updateAvatar(file);
            
            logger.info("Avatar updated successfully - userId: {}, fileName: {}", 
                    currentUserId, file.getOriginalFilename());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "User updated avatar: " + file.getOriginalFilename(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(updatedUser);
            
        } catch (Exception e) {
            logger.error("Error updating avatar - userId: {}, username: {}, fileName: {}, ip: {}", 
                    currentUserId, currentUsername, file.getOriginalFilename(), clientIp, e);
            
            securityLogger.error("AVATAR_UPDATE_ERROR - User: {} (ID: {}), IP: {}, FileName: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, file.getOriginalFilename(), e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to update avatar: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to upload avatar: " + e.getMessage()));
        }
    }

    // Helper methods
    private UserDto mapToDto(User user) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setFullName(user.getFullName());
        userDto.setEmail(user.getEmail());
        userDto.setActive(user.isActive());
        userDto.setRole(user.getRole());
        userDto.setApprovalStatus(user.getApprovalStatus());
        userDto.setCreatedAt(user.getCreatedAt());
        return userDto;
    }

    private void sanitizeProfileUpdateDto(UserProfileUpdateDto dto) {
        if (dto.getFullName() != null) {
            dto.setFullName(sanitizeString(dto.getFullName()));
        }
        if (dto.getEmail() != null) {
            dto.setEmail(sanitizeString(dto.getEmail()));
        }
    }
    
    private String sanitizeString(String input) {
        if (input == null) return null;
        
        return input.replaceAll("[\\r\\n\\t]", " ")
                   .replaceAll("\\s+", " ")
                   .trim();
    }

    /**
     * Validates that the file content is actually an image by checking its magic
     * bytes (file signature)
     * 
     * @param fileBytes The bytes of the file to validate
     * @return true if the file is a valid image, false otherwise
     */
    private boolean isValidImageFile(byte[] fileBytes) {
        if (fileBytes == null || fileBytes.length < 8) {
            return false;
        }

        // Check for JPEG signature: SOI marker (FFD8) followed by either
        // JFIF (4A46494600) or Exif (457869660)
        if (fileBytes[0] == (byte) 0xFF && fileBytes[1] == (byte) 0xD8) {
            return true;
        }

        // Check for PNG signature: 89 50 4E 47 0D 0A 1A 0A
        if (fileBytes[0] == (byte) 0x89 && fileBytes[1] == (byte) 0x50 &&
                fileBytes[2] == (byte) 0x4E && fileBytes[3] == (byte) 0x47 &&
                fileBytes[4] == (byte) 0x0D && fileBytes[5] == (byte) 0x0A &&
                fileBytes[6] == (byte) 0x1A && fileBytes[7] == (byte) 0x0A) {
            return true;
        }

        // Check for GIF signature: 'GIF87a' or 'GIF89a'
        if (fileBytes[0] == (byte) 0x47 && fileBytes[1] == (byte) 0x49 && fileBytes[2] == (byte) 0x46 &&
                fileBytes[3] == (byte) 0x38 && (fileBytes[4] == (byte) 0x37 || fileBytes[4] == (byte) 0x39) &&
                fileBytes[5] == (byte) 0x61) {
            return true;
        }

        // Not a valid image type
        return false;
    }

    // Add this method to validate password strength
    private boolean isPasswordValid(String password) {
        // At least 8 characters
        if (password.length() < 8)
            return false;

        // Check for at least one digit
        if (!password.matches(".*\\d.*"))
            return false;

        // Check for at least one lowercase letter
        if (!password.matches(".*[a-z].*"))
            return false;

        // Check for at least one uppercase letter
        if (!password.matches(".*[A-Z].*"))
            return false;

        // Check for at least one special character
        if (!password.matches(".*[^A-Za-z0-9].*"))
            return false;

        return true;
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