package com.secureops.service;

import com.secureops.dto.UserDto;
import com.secureops.dto.UserProfileUpdateDto;
import com.secureops.dto.UserRegistrationDto;
import com.secureops.entity.User;
import com.secureops.exception.BadRequestException;
import com.secureops.exception.ResourceNotFoundException;
import com.secureops.repository.UserRepository;
import com.secureops.util.AppConstants;
import com.secureops.util.PasswordGenerator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LogService logService;
    private final EmailService emailService;
    private final FileStorageService fileStorageService;

    public UserServiceImpl(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            LogService logService,
            EmailService emailService,
            FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.logService = logService;
        this.emailService = emailService;
        this.fileStorageService = fileStorageService;
        logger.info("UserServiceImpl initialized");
    }

    @Override
    @Transactional
    public User register(UserRegistrationDto registrationDto) {
        String clientIp = getClientIp();
        String maskedEmail = maskEmail(registrationDto.getEmail());
        logger.debug("Attempting to register user with email: {} from IP: {}", maskedEmail, clientIp);

        try {
            if (userRepository.existsByEmail(registrationDto.getEmail())) {
                logger.warn("Email already taken: {} from IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Registration attempt with existing email: {} from IP: {}", maskedEmail, clientIp);
                throw new BadRequestException("Email is already taken!");
            }

            User user = new User();
            user.setFullName(registrationDto.getFullName());
            user.setEmail(registrationDto.getEmail());
            user.setPassword(passwordEncoder.encode("TEMPORARY_PASSWORD_TO_BE_CHANGED"));
            user.setApprovalStatus(User.ApprovalStatus.PENDING);
            user.setActive(false);
            user.setRole(User.UserRole.USER);

            User savedUser = userRepository.save(user);
            logger.info("User registered successfully: {} (ID: {}) from IP: {}", maskedEmail, savedUser.getId(), clientIp);

            logService.createLog(
                    AppConstants.LOG_ACTION_REGISTER,
                    "User registered: " + maskedEmail,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    null);

            return savedUser;

        } catch (BadRequestException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error registering user with email: {} from IP: {}", maskedEmail, clientIp, ex);
            securityLogger.error("Error registering user - email: {}, IP: {}, Error: {}", maskedEmail, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public User approveUser(Long userId) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Attempting to approve user ID: {} by admin ID: {} from IP: {}", userId, currentUserId, clientIp);

        try {
            User user = getUserById(userId);
            String maskedEmail = maskEmail(user.getEmail());

            if (user.getApprovalStatus() == User.ApprovalStatus.APPROVED) {
                logger.warn("User already approved: {} (ID: {}) by admin ID: {}", maskedEmail, userId, currentUserId);
                throw new BadRequestException("User is already approved");
            }

            String rawPassword = PasswordGenerator.generateRandomPassword(12);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setApprovalStatus(User.ApprovalStatus.APPROVED);
            user.setActive(true);

            User savedUser = userRepository.save(user);
            logger.info("User approved successfully: {} (ID: {}) by admin ID: {}", maskedEmail, userId, currentUserId);

            emailService.sendPasswordEmail(savedUser.getEmail(), savedUser.getFullName(), rawPassword);

            logService.createLog(
                    AppConstants.LOG_ACTION_APPROVE,
                    "User approved: " + maskedEmail,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);

            return savedUser;

        } catch (BadRequestException | ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error approving user ID: {} by admin ID: {}", userId, currentUserId, ex);
            securityLogger.error("Error approving user - userId: {}, adminId: {}, IP: {}, Error: {}", 
                    userId, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public User rejectUser(Long userId) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Attempting to reject user ID: {} by admin ID: {} from IP: {}", userId, currentUserId, clientIp);

        try {
            User user = getUserById(userId);
            String maskedEmail = maskEmail(user.getEmail());

            if (user.getApprovalStatus() == User.ApprovalStatus.REJECTED) {
                logger.warn("User already rejected: {} (ID: {}) by admin ID: {}", maskedEmail, userId, currentUserId);
                throw new BadRequestException("User is already rejected");
            }

            user.setApprovalStatus(User.ApprovalStatus.REJECTED);
            user.setActive(false);

            User savedUser = userRepository.save(user);
            logger.info("User rejected successfully: {} (ID: {}) by admin ID: {}", maskedEmail, userId, currentUserId);

            logService.createLog(
                    AppConstants.LOG_ACTION_REJECT,
                    "User rejected: " + maskedEmail,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);

            return savedUser;

        } catch (BadRequestException | ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error rejecting user ID: {} by admin ID: {}", userId, currentUserId, ex);
            securityLogger.error("Error rejecting user - userId: {}, adminId: {}, IP: {}, Error: {}", 
                    userId, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<User> getPendingApprovals() {
        logger.debug("Retrieving pending user approvals");
        try {
            List<User> pendingUsers = userRepository.findByApprovalStatus(User.ApprovalStatus.PENDING);
            logger.info("Retrieved {} pending user approvals", pendingUsers.size());
            return pendingUsers;
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving pending approvals", ex);
            securityLogger.error("Error retrieving pending approvals - IP: {}, Error: {}", getClientIp(), ex.getMessage());
            throw ex;
        }
    }

    @Override
    public User getUserById(Long id) {
        logger.debug("Retrieving user by ID: {}", id);
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> {
                        logger.warn("User not found: {}", id);
                        securityLogger.warn("Attempt to retrieve non-existent user ID: {} from IP: {}", id, getClientIp());
                        return new ResourceNotFoundException("User", "id", id);
                    });
            logger.debug("User retrieved: {} (ID: {})", maskEmail(user.getEmail()), id);
            return user;
        } catch (ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving user ID: {}", id, ex);
            securityLogger.error("Error retrieving user - ID: {}, IP: {}, Error: {}", id, getClientIp(), ex.getMessage());
            throw ex;
        }
    }

    @Override
    public User getUserByEmail(String email) {
        String maskedEmail = maskEmail(email);
        logger.debug("Retrieving user by email: {}", maskedEmail);
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        logger.warn("User not found: {}", maskedEmail);
                        securityLogger.warn("Attempt to retrieve non-existent user email: {} from IP: {}", maskedEmail, getClientIp());
                        return new ResourceNotFoundException("User", "email", maskedEmail);
                    });
            logger.debug("User retrieved: {}", maskedEmail);
            return user;
        } catch (ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving user email: {}", maskedEmail, ex);
            securityLogger.error("Error retrieving user - email: {}, IP: {}, Error: {}", maskedEmail, getClientIp(), ex.getMessage());
            throw ex;
        }
    }

    @Override
    public UserDto getUserDtoById(Long id) {
        logger.debug("Retrieving user DTO by ID: {}", id);
        try {
            User user = getUserById(id);
            UserDto userDto = mapToDto(user);
            logger.debug("User DTO retrieved: {} (ID: {})", maskEmail(user.getEmail()), id);
            return userDto;
        } catch (ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving user DTO ID: {}", id, ex);
            securityLogger.error("Error retrieving user DTO - ID: {}, IP: {}, Error: {}", id, getClientIp(), ex.getMessage());
            throw ex;
        }
    }

    @Override
    public UserDto getCurrentUser() {
        String clientIp = getClientIp();
        logger.debug("Retrieving current user from IP: {}", clientIp);
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            String maskedEmail = maskEmail(email);
            User user = getUserByEmail(email);
            UserDto userDto = mapToDto(user);
            logger.debug("Current user retrieved: {} from IP: {}", maskedEmail, clientIp);
            return userDto;
        } catch (ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving current user", ex);
            securityLogger.error("Error retrieving current user - IP: {}, Error: {}", clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<UserDto> getAllUsers() {
        String clientIp = getClientIp();
        logger.debug("Retrieving all users from IP: {}", clientIp);
        try {
            List<UserDto> users = userRepository.findAll().stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            logger.info("Retrieved {} users from IP: {}", users.size(), clientIp);
            return users;
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving all users", ex);
            securityLogger.error("Error retrieving all users - IP: {}, Error: {}", clientIp, ex.getMessage());
            throw ex;
        }
    }

    private UserDto mapToDto(User user) {
        String maskedEmail = maskEmail(user.getEmail());
        logger.debug("Mapping user to DTO: {}", maskedEmail);
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setFullName(user.getFullName());
        userDto.setEmail(user.getEmail());
        userDto.setActive(user.isActive());
        userDto.setRole(user.getRole());
        userDto.setApprovalStatus(user.getApprovalStatus());

        if (user.getAvatarFileName() != null) {
            userDto.setAvatarUrl(getUserAvatarUrl(user.getAvatarFileName()));
            logger.debug("Avatar URL set for user: {}", maskedEmail);
        }

        return userDto;
    }

    private Long getCurrentUserId() {
        logger.debug("Retrieving current user ID");
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();
                String maskedEmail = maskEmail(email);
                User user = getUserByEmail(email);
                logger.debug("Current user ID retrieved: {} for email: {}", user.getId(), maskedEmail);
                return user.getId();
            }
            logger.warn("No authenticated user found");
            securityLogger.warn("No authenticated user - IP: {}", getClientIp());
            return null;
        } catch (ResourceNotFoundException ex) {
            logger.warn("Authenticated user not found");
            securityLogger.warn("Authenticated user not found - IP: {}", getClientIp());
            return null;
        } catch (Exception ex) {
            logger.error("Error retrieving current user ID", ex);
            securityLogger.error("Error retrieving current user ID - IP: {}, Error: {}", getClientIp(), ex.getMessage());
            return null;
        }
    }

    private String getClientIp() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                    .getRequest();
            String ipAddress = request.getHeader("X-Forwarded-For");
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getHeader("Proxy-Client-IP");
            }
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getHeader("WL-Proxy-Client-IP");
            }
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getRemoteAddr();
            }
            logger.debug("Client IP retrieved: {}", ipAddress);
            return ipAddress;
        } catch (IllegalStateException e) {
            logger.debug("No HTTP request context available, returning unknown IP");
            return "unknown";
        } catch (Exception ex) {
            logger.error("Error retrieving client IP", ex);
            return "unknown";
        }
    }

    @Override
    @Transactional
    public boolean changePassword(String currentPassword, String newPassword) {
        String clientIp = getClientIp();
        Long userId = getCurrentUserId();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        String maskedEmail = maskEmail(email);
        logger.debug("Attempting to change password for user: {} (ID: {}) from IP: {}", maskedEmail, userId, clientIp);

        try {
            User user = getUserByEmail(email);

            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                logger.warn("Invalid current password for user: {} (ID: {}) from IP: {}", maskedEmail, userId, clientIp);
                securityLogger.warn("Failed password change attempt for user: {} (ID: {}) from IP: {}", 
                        maskedEmail, userId, clientIp);
                return false;
            }

            if (!isPasswordValid(newPassword)) {
                logger.warn("Invalid new password format for user: {} (ID: {}) from IP: {}", maskedEmail, userId, clientIp);
                return false;
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            logger.info("Password changed successfully for user: {} (ID: {}) from IP: {}", maskedEmail, userId, clientIp);

            logService.createLog(
                    "CHANGE_PASSWORD",
                    "Password changed for user: " + maskedEmail,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    userId);

            return true;

        } catch (ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error changing password for user: {} (ID: {})", maskedEmail, userId, ex);
            securityLogger.error("Error changing password - userId: {}, IP: {}, Error: {}", userId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public boolean sendPasswordResetCode(String email) {
        String clientIp = getClientIp();
        String maskedEmail = maskEmail(email);
        logger.debug("Attempting to send password reset code for email: {} from IP: {}", maskedEmail, clientIp);

        try {
            User user = userRepository.findByEmail(email)
                    .orElse(null);

            if (user == null) {
                logger.debug("User not found for password reset: {} from IP: {}", maskedEmail, clientIp);
                // Return true to prevent email enumeration
                return true;
            }

            if (!user.isActive() || user.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
                logger.warn("Password reset attempted for inactive/unapproved user: {} from IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Password reset attempt for inactive/unapproved user: {} from IP: {}", maskedEmail, clientIp);
                return false;
            }

            String verificationCode = String.format("%06d", new Random().nextInt(999999));
            user.setResetCode(verificationCode);
            user.setResetCodeExpiry(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);
            logger.debug("Generated verification code for user: {} (ID: {})", maskedEmail, user.getId());

            emailService.sendPasswordResetVerificationEmail(user.getEmail(), user.getFullName(), verificationCode);
            logger.info("Password reset code sent successfully for user: {} (ID: {}) from IP: {}", 
                    maskedEmail, user.getId(), clientIp);

            logService.createLog(
                    "PASSWORD_RESET_REQUEST",
                    "Password reset verification code sent for user: " + maskedEmail,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    user.getId());

            return true;

        } catch (Exception ex) {
            logger.error("Unexpected error sending password reset code for email: {}", maskedEmail, ex);
            securityLogger.error("Error sending password reset code - email: {}, IP: {}, Error: {}", 
                    maskedEmail, clientIp, ex.getMessage());
            return false; // Return false for unexpected errors to indicate failure
        }
    }

    @Override
    @Transactional
    public boolean verifyAndResetPassword(String email, String verificationCode) {
        String clientIp = getClientIp();
        String maskedEmail = maskEmail(email);
        logger.debug("Attempting to verify and reset password for email: {} with code from IP: {}", maskedEmail, clientIp);

        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        logger.warn("User not found for password reset verification: {}", maskedEmail);
                        securityLogger.warn("Password reset verification attempt for non-existent email: {} from IP: {}", 
                                maskedEmail, clientIp);
                        return new ResourceNotFoundException("User", "email", maskedEmail);
                    });

            if (user.getResetCode() == null ||
                    !user.getResetCode().equals(verificationCode) ||
                    LocalDateTime.now().isAfter(user.getResetCodeExpiry())) {
                logger.warn("Invalid or expired verification code for user: {} (ID: {}) from IP: {}", 
                        maskedEmail, user.getId(), clientIp);
                securityLogger.warn("Failed password reset verification for user: {} (ID: {}) from IP: {}", 
                        maskedEmail, user.getId(), clientIp);
                return false;
            }

            String rawPassword = PasswordGenerator.generateRandomPassword(12);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setResetCode(null);
            user.setResetCodeExpiry(null);

            userRepository.save(user);
            logger.debug("Password reset completed for user: {} (ID: {})", maskedEmail, user.getId());

            emailService.sendNewPasswordEmail(user.getEmail(), user.getFullName(), rawPassword);
            logger.info("Password reset completed successfully for user: {} (ID: {}) from IP: {}", 
                    maskedEmail, user.getId(), clientIp);

            logService.createLog(
                    "PASSWORD_RESET_COMPLETE",
                    "Password reset completed for user: " + maskedEmail,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    user.getId());

            return true;

        } catch (ResourceNotFoundException ex) {
            return false; // Return false for non-existent users
        } catch (Exception ex) {
            logger.error("Unexpected error verifying and resetting password for email: {}", maskedEmail, ex);
            securityLogger.error("Error verifying and resetting password - email: {}, IP: {}, Error: {}", 
                    maskedEmail, clientIp, ex.getMessage());
            return false;
        }
    }

    @Override
    @Transactional
    public boolean resetPassword(String email) {
        String maskedEmail = maskEmail(email);
        logger.debug("Initiating legacy password reset for email: {}", maskedEmail);
        try {
            boolean result = sendPasswordResetCode(email);
            logger.debug("Legacy password reset result for email: {}: {}", maskedEmail, result);
            return result;
        } catch (Exception ex) {
            logger.error("Unexpected error in legacy password reset for email: {}", maskedEmail, ex);
            securityLogger.error("Error in legacy password reset - email: {}, IP: {}, Error: {}", 
                    maskedEmail, getClientIp(), ex.getMessage());
            return false;
        }
    }

    @Override
    @Transactional
    public UserDto updateProfile(UserProfileUpdateDto profileUpdateDto) {
        String clientIp = getClientIp();
        Long userId = getCurrentUserId();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        String maskedEmail = maskEmail(email);
        logger.debug("Attempting to update profile for user: {} (ID: {}) from IP: {}", maskedEmail, userId, clientIp);

        try {
            User user = getUserByEmail(email);

            if (profileUpdateDto.getFullName() != null && !profileUpdateDto.getFullName().isBlank()) {
                logger.debug("Updating full name for user: {} to: {}", maskedEmail, profileUpdateDto.getFullName());
                user.setFullName(profileUpdateDto.getFullName());
            }

            if (profileUpdateDto.getEmail() != null && !profileUpdateDto.getEmail().isBlank()
                    && !profileUpdateDto.getEmail().equals(user.getEmail())) {
                String newMaskedEmail = maskEmail(profileUpdateDto.getEmail());
                if (userRepository.existsByEmail(profileUpdateDto.getEmail())) {
                    logger.warn("Email already taken: {} for user: {} (ID: {})", newMaskedEmail, maskedEmail, userId);
                    throw new BadRequestException("Email is already taken!");
                }
                logger.debug("Updating email for user: {} to: {}", maskedEmail, newMaskedEmail);
                user.setEmail(profileUpdateDto.getEmail());
            }

            User savedUser = userRepository.save(user);
            logger.info("Profile updated successfully for user: {} (ID: {}) from IP: {}", maskedEmail, userId, clientIp);

            logService.createLog(
                    "PROFILE_UPDATE",
                    "Profile updated for user: " + maskedEmail,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    userId);

            return mapToDto(savedUser);

        } catch (BadRequestException | ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error updating profile for user: {} (ID: {})", maskedEmail, userId, ex);
            securityLogger.error("Error updating profile - userId: {}, IP: {}, Error: {}", userId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public UserDto updateAvatar(MultipartFile avatarFile) {
        String clientIp = getClientIp();
        Long userId = getCurrentUserId();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        String maskedEmail = maskEmail(email);
        logger.debug("Attempting to update avatar for user: {} (ID: {}) from IP: {}", maskedEmail, userId, clientIp);

        try {
            if (avatarFile == null || avatarFile.isEmpty()) {
                logger.warn("Empty avatar file for user: {} (ID: {}) from IP: {}", maskedEmail, userId, clientIp);
                throw new BadRequestException("Avatar file cannot be empty");
            }

            User user = getUserByEmail(email);

            if (user.getAvatarFileName() != null && !user.getAvatarFileName().equals("default-avatar.png")) {
                try {
                    fileStorageService.deleteFile(user.getAvatarFileName());
                    logger.debug("Deleted old avatar for user: {} (ID: {})", maskedEmail, userId);
                } catch (Exception e) {
                    logger.error("Failed to delete old avatar for user: {} (ID: {}): {}", maskedEmail, userId, e.getMessage());
                }
            }

            String fileName = fileStorageService.storeFile(avatarFile);
            user.setAvatarFileName(fileName);
            logger.debug("Stored new avatar: {} for user: {} (ID: {})", fileName, maskedEmail, userId);

            User savedUser = userRepository.save(user);
            logger.info("Avatar updated successfully for user: {} (ID: {}) from IP: {}", maskedEmail, userId, clientIp);

            logService.createLog(
                    "AVATAR_UPDATE",
                    "Avatar updated for user: " + maskedEmail,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    userId);

            return mapToDto(savedUser);

        } catch (BadRequestException | ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error updating avatar for user: {} (ID: {})", maskedEmail, userId, ex);
            securityLogger.error("Error updating avatar - userId: {}, IP: {}, Error: {}", userId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public String getUserAvatarUrl(String fileName) {
        logger.debug("Generating avatar URL for file: {}", fileName);
        try {
            String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/files/download/")
                    .path(fileName)
                    .toUriString();
            logger.debug("Generated avatar URL: {}", url);
            return url;
        } catch (Exception ex) {
            logger.error("Error generating avatar URL for file: {}", fileName, ex);
            throw ex;
        }
    }

    @Override
    @Transactional
    public User changeUserRole(Long userId, User.UserRole newRole) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Attempting to change role for user ID: {} to {} by admin ID: {} from IP: {}", 
                userId, newRole, currentUserId, clientIp);

        try {
            if (currentUserId == null || currentUserId.equals(userId)) {
                logger.warn("Admin attempted to change own role or no admin authenticated: userId: {}, adminId: {}", 
                        userId, currentUserId);
                securityLogger.warn("Invalid role change attempt - userId: {}, adminId: {}, IP: {}", 
                        userId, currentUserId, clientIp);
                throw new BadRequestException("Administrators cannot change their own role");
            }

            User user = getUserById(userId);
            String maskedEmail = maskEmail(user.getEmail());

            user.setRole(newRole);
            User savedUser = userRepository.save(user);
            logger.info("Role changed to {} for user: {} (ID: {}) by admin ID: {} from IP: {}", 
                    newRole, maskedEmail, userId, currentUserId, clientIp);

            logService.createLog(
                    "ROLE_CHANGE",
                    "Role changed to " + newRole + " for user: " + maskedEmail,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);

            return savedUser;

        } catch (BadRequestException | ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error changing role for user ID: {} by admin ID: {}", userId, currentUserId, ex);
            securityLogger.error("Error changing role - userId: {}, adminId: {}, IP: {}, Error: {}", 
                    userId, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public boolean adminResetPassword(Long userId, String newPassword) {
        String clientIp = getClientIp();
        Long currentUserId = getCurrentUserId();
        logger.debug("Attempting admin password reset for user ID: {} by admin ID: {} from IP: {}", 
                userId, currentUserId, clientIp);

        try {
            User user = getUserById(userId);
            String maskedEmail = maskEmail(user.getEmail());

            if (!user.isActive() || user.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
                logger.warn("Admin password reset attempted for inactive/unapproved user: {} (ID: {})", 
                        maskedEmail, userId);
                securityLogger.warn("Admin password reset attempt for inactive/unapproved user: {} (ID: {}) from IP: {}", 
                        maskedEmail, userId, clientIp);
                return false;
            }

            if (!isPasswordValid(newPassword)) {
                logger.warn("Invalid new password format for admin reset: user ID: {}", userId);
                return false;
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            logger.debug("Password reset by admin for user: {} (ID: {})", maskedEmail, userId);

            emailService.sendPasswordChangedNotificationEmail(user.getEmail(), user.getFullName());
            logger.info("Admin password reset completed for user: {} (ID: {}) by admin ID: {} from IP: {}", 
                    maskedEmail, userId, currentUserId, clientIp);

            logService.createLog(
                    "ADMIN_PASSWORD_RESET",
                    "Password manually reset by admin for user: " + maskedEmail,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);

            return true;

        } catch (ResourceNotFoundException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error in admin password reset for user ID: {}", userId, ex);
            securityLogger.error("Error in admin password reset - userId: {}, adminId: {}, IP: {}, Error: {}", 
                    userId, currentUserId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    private boolean isPasswordValid(String password) {
        logger.debug("Validating password strength");
        try {
            if (password.length() < 8) {
                logger.debug("Password validation failed: too short");
                return false;
            }
            if (!password.matches(".*\\d.*")) {
                logger.debug("Password validation failed: no digit");
                return false;
            }
            if (!password.matches(".*[a-z].*")) {
                logger.debug("Password validation failed: no lowercase");
                return false;
            }
            if (!password.matches(".*[A-Z].*")) {
                logger.debug("Password validation failed: no uppercase");
                return false;
            }
            if (!password.matches(".*[^A-Za-z0-9].*")) {
                logger.debug("Password validation failed: no special character");
                return false;
            }
            logger.debug("Password validation passed");
            return true;
        } catch (Exception ex) {
            logger.error("Error validating password", ex);
            return false;
        }
    }

    private String maskEmail(String email) {
        if (email == null || email.isEmpty() || !email.contains("@")) {
            return email;
        }

        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];

        String maskedUsername = username.substring(0, 1) + "***";

        String[] domainParts = domain.split("\\.");
        String domainName = domainParts[0];
        String tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : "";

        String maskedDomain = domainName.substring(0, 1) + "***";

        return maskedUsername + "@" + maskedDomain + "." + tld;
    }
}