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
    }

    @Override
    @Transactional
    public User register(UserRegistrationDto registrationDto) {
        // Check if email already exists
        if (userRepository.existsByEmail(registrationDto.getEmail())) {
            throw new BadRequestException("Email is already taken!");
        }

        // Create new user
        User user = new User();
        user.setFullName(registrationDto.getFullName());
        user.setEmail(registrationDto.getEmail());
        // Set a placeholder password that will be replaced later
        user.setPassword(passwordEncoder.encode("TEMPORARY_PASSWORD_TO_BE_CHANGED"));
        user.setApprovalStatus(User.ApprovalStatus.PENDING);
        user.setActive(false);
        user.setRole(User.UserRole.USER);

        User savedUser = userRepository.save(user);

        // Log the registration
        logService.createLog(
                AppConstants.LOG_ACTION_REGISTER,
                "User registered: " + user.getEmail(),
                getClientIp(),
                AppConstants.LOG_TYPE_USER,
                null);

        return savedUser;
    }

    @Override
    @Transactional
    public User approveUser(Long userId) {
        User user = getUserById(userId);

        if (user.getApprovalStatus() == User.ApprovalStatus.APPROVED) {
            throw new BadRequestException("User is already approved");
        }

        // Generate a random password
        String rawPassword = PasswordGenerator.generateRandomPassword(12);

        // Set the user's password
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setApprovalStatus(User.ApprovalStatus.APPROVED);
        user.setActive(true);

        User savedUser = userRepository.save(user);

        // Send the password email
        emailService.sendPasswordEmail(savedUser.getEmail(), savedUser.getFullName(), rawPassword);

        // Log the approval
        logService.createLog(
                AppConstants.LOG_ACTION_APPROVE,
                "User approved: " + user.getEmail(),
                getClientIp(),
                AppConstants.LOG_TYPE_USER,
                getCurrentUserId());

        return savedUser;
    }

    @Override
    @Transactional
    public User rejectUser(Long userId) {
        User user = getUserById(userId);

        if (user.getApprovalStatus() == User.ApprovalStatus.REJECTED) {
            throw new BadRequestException("User is already rejected");
        }

        user.setApprovalStatus(User.ApprovalStatus.REJECTED);
        user.setActive(false);

        User savedUser = userRepository.save(user);

        // Log the rejection
        logService.createLog(
                AppConstants.LOG_ACTION_REJECT,
                "User rejected: " + user.getEmail(),
                getClientIp(),
                AppConstants.LOG_TYPE_USER,
                getCurrentUserId());

        return savedUser;
    }

    @Override
    public List<User> getPendingApprovals() {
        return userRepository.findByApprovalStatus(User.ApprovalStatus.PENDING);
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @Override
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    @Override
    public UserDto getUserDtoById(Long id) {
        User user = getUserById(id);
        return mapToDto(user);
    }

    @Override
    public UserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = getUserByEmail(email);
        return mapToDto(user);
    }

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private UserDto mapToDto(User user) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setFullName(user.getFullName());
        userDto.setEmail(user.getEmail());
        userDto.setActive(user.isActive());
        userDto.setRole(user.getRole());
        userDto.setApprovalStatus(user.getApprovalStatus());

        // Add avatar URL
        if (user.getAvatarFileName() != null) {
            userDto.setAvatarUrl(getUserAvatarUrl(user.getAvatarFileName()));
        }

        return userDto;
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            try {
                User user = getUserByEmail(email);
                return user.getId();
            } catch (ResourceNotFoundException e) {
                return null;
            }
        }
        return null;
    }

    private String getClientIp() {
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
        return ipAddress;
    }

    @Override
    @Transactional
    public boolean changePassword(String currentPassword, String newPassword) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = getUserByEmail(email);

        // Check if current password matches
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return false;
        }

        if (!isPasswordValid(newPassword)) {
            return false;
        }

        // Update with new password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Log the password change
        logService.createLog(
                "CHANGE_PASSWORD",
                "Password changed for user: " + user.getEmail(),
                getClientIp(),
                AppConstants.LOG_TYPE_USER,
                user.getId());

        return true;
    }

    @Override
    @Transactional
    public boolean sendPasswordResetCode(String email) {
        try {
            // Find the user
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

            // Check if user is active and approved
            if (!user.isActive() || user.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
                return false;
            }

            // Generate a verification code (6 digits)
            String verificationCode = String.format("%06d", new Random().nextInt(999999));

            // Store the code with expiration time (15 minutes from now)
            user.setResetCode(verificationCode);
            user.setResetCodeExpiry(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);

            // Send the verification code email
            emailService.sendPasswordResetVerificationEmail(user.getEmail(), user.getFullName(), verificationCode);

            // Log the password reset request
            logService.createLog(
                    "PASSWORD_RESET_REQUEST",
                    "Password reset verification code sent for user: " + user.getEmail(),
                    getClientIp(),
                    AppConstants.LOG_TYPE_USER,
                    user.getId());

            return true;
        } catch (ResourceNotFoundException e) {
            // We return true even if the email doesn't exist for security reasons
            // This prevents email enumeration attacks
            return true;
        }
    }

    @Override
    @Transactional
    public boolean verifyAndResetPassword(String email, String verificationCode) {
        try {
            // Find the user
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

            // Check if the verification code is valid and not expired
            if (user.getResetCode() == null ||
                    !user.getResetCode().equals(verificationCode) ||
                    LocalDateTime.now().isAfter(user.getResetCodeExpiry())) {
                return false;
            }

            // Generate a new random password
            String rawPassword = PasswordGenerator.generateRandomPassword(12);

            // Update the user's password
            user.setPassword(passwordEncoder.encode(rawPassword));

            // Clear the verification code
            user.setResetCode(null);
            user.setResetCodeExpiry(null);

            userRepository.save(user);

            // Send the new password email
            emailService.sendNewPasswordEmail(user.getEmail(), user.getFullName(), rawPassword);

            // Log the password reset
            logService.createLog(
                    "PASSWORD_RESET_COMPLETE",
                    "Password reset completed for user: " + user.getEmail(),
                    getClientIp(),
                    AppConstants.LOG_TYPE_USER,
                    user.getId());

            return true;
        } catch (ResourceNotFoundException e) {
            return false;
        }
    }

    // Update the existing resetPassword method to use the new flow
    @Override
    @Transactional
    public boolean resetPassword(String email) {
        // For backward compatibility, we'll just call the first step
        // of our new two-step process
        return sendPasswordResetCode(email);
    }

    @Override
    @Transactional
    public UserDto updateProfile(UserProfileUpdateDto profileUpdateDto) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = getUserByEmail(email);

        // Update user information
        if (profileUpdateDto.getFullName() != null && !profileUpdateDto.getFullName().isBlank()) {
            user.setFullName(profileUpdateDto.getFullName());
        }

        // Handle email change carefully
        if (profileUpdateDto.getEmail() != null && !profileUpdateDto.getEmail().isBlank()
                && !profileUpdateDto.getEmail().equals(user.getEmail())) {
            // Check if email is already taken
            if (userRepository.existsByEmail(profileUpdateDto.getEmail())) {
                throw new BadRequestException("Email is already taken!");
            }
            user.setEmail(profileUpdateDto.getEmail());
        }

        User savedUser = userRepository.save(user);

        // Log the profile update
        logService.createLog(
                "PROFILE_UPDATE",
                "Profile updated for user: " + user.getEmail(),
                getClientIp(),
                AppConstants.LOG_TYPE_USER,
                user.getId());

        return mapToDto(savedUser);
    }

    @Override
    @Transactional
    public UserDto updateAvatar(MultipartFile avatarFile) {
        if (avatarFile == null || avatarFile.isEmpty()) {
            throw new BadRequestException("Avatar file cannot be empty");
        }

        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = getUserByEmail(email);

        // Check if user already has a custom avatar and delete it
        if (user.getAvatarFileName() != null && !user.getAvatarFileName().equals("default-avatar.png")) {
            try {
                fileStorageService.deleteFile(user.getAvatarFileName());
            } catch (Exception e) {
                // Log the error but continue with the update
                System.err.println("Failed to delete old avatar: " + e.getMessage());
            }
        }

        // Store the new avatar
        String fileName = fileStorageService.storeFile(avatarFile);
        user.setAvatarFileName(fileName);

        User savedUser = userRepository.save(user);

        // Log the avatar update
        logService.createLog(
                "AVATAR_UPDATE",
                "Avatar updated for user: " + user.getEmail(),
                getClientIp(),
                AppConstants.LOG_TYPE_USER,
                user.getId());

        return mapToDto(savedUser);
    }

    @Override
    public String getUserAvatarUrl(String fileName) {
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/download/")
                .path(fileName)
                .toUriString();
    }

    @Override
    @Transactional
    public User changeUserRole(Long userId, User.UserRole newRole) {
        User user = getUserById(userId);

        // Log who is making the change
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null || currentUserId.equals(userId)) {
            throw new BadRequestException("Administrators cannot change their own role");
        }

        user.setRole(newRole);
        User savedUser = userRepository.save(user);

        // Log the role change
        logService.createLog(
                "ROLE_CHANGE",
                "Role changed to " + newRole + " for user: " + user.getEmail(),
                getClientIp(),
                AppConstants.LOG_TYPE_USER,
                currentUserId);

        return savedUser;
    }

    @Override
    @Transactional
    public boolean adminResetPassword(Long userId, String newPassword) {
        User user = getUserById(userId);

        // Check if user is active and approved
        if (!user.isActive() || user.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
            return false;
        }

        if (!isPasswordValid(newPassword)) {
            return false;
        }

        // Update the user's password with the admin-specified password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Send notification email to the user (optional - you can modify this based on
        // requirements)
        emailService.sendPasswordChangedNotificationEmail(user.getEmail(), user.getFullName());

        // Log the password reset by admin
        logService.createLog(
                "ADMIN_PASSWORD_RESET",
                "Password manually reset by admin for user: " + user.getEmail(),
                getClientIp(),
                AppConstants.LOG_TYPE_USER,
                getCurrentUserId());

        return true;
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
}