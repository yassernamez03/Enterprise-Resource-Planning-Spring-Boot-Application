package com.secureops.service;

import com.secureops.dto.UserDto;
import com.secureops.dto.UserProfileUpdateDto;
import com.secureops.dto.UserRegistrationDto;
import com.secureops.entity.User;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    User register(UserRegistrationDto registrationDto);

    User approveUser(Long userId);

    User rejectUser(Long userId);

    List<User> getPendingApprovals();

    User getUserById(Long id);

    User getUserByEmail(String email);

    UserDto getUserDtoById(Long id);

    UserDto getCurrentUser();

    List<UserDto> getAllUsers();

    boolean changePassword(String currentPassword, String newPassword);

    // Legacy method - can be kept for backward compatibility
    boolean resetPassword(String email);

    // New methods for verification code flow
    boolean sendPasswordResetCode(String email);

    boolean verifyAndResetPassword(String email, String verificationCode);

    UserDto updateProfile(UserProfileUpdateDto profileUpdateDto);

    UserDto updateAvatar(MultipartFile avatarFile);

    String getUserAvatarUrl(String fileName);

    User changeUserRole(Long userId, User.UserRole newRole);

    boolean adminResetPassword(Long userId, String newPassword);

    List<UserDto> getActiveApprovedUsers();
}