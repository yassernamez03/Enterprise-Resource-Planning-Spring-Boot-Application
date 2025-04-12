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
    boolean resetPassword(String email);

    UserDto updateProfile(UserProfileUpdateDto profileUpdateDto);
    UserDto updateAvatar(MultipartFile avatarFile);
    String getUserAvatarUrl(String fileName);
}