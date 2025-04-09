package com.secureops.service;

import com.secureops.dto.UserDto;
import com.secureops.dto.UserRegistrationDto;
import com.secureops.entity.User;

import java.util.List;

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
}