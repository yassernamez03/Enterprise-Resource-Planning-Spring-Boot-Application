package com.secureops.controller;

import com.secureops.dto.PasswordChangeDto;
import com.secureops.dto.UserDto;
import com.secureops.dto.UserProfileUpdateDto;
import com.secureops.entity.User;
import com.secureops.service.UserService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @GetMapping("/pending")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getPendingApprovals() {
        List<UserDto> pendingUsers = userService.getPendingApprovals().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(pendingUsers);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> approveUser(@PathVariable Long id) {
        User user = userService.approveUser(id);
        return ResponseEntity.ok(mapToDto(user));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> rejectUser(@PathVariable Long id) {
        User user = userService.rejectUser(id);
        return ResponseEntity.ok(mapToDto(user));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    private UserDto mapToDto(User user) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setFullName(user.getFullName());
        userDto.setEmail(user.getEmail());
        userDto.setActive(user.isActive());
        userDto.setRole(user.getRole());
        userDto.setApprovalStatus(user.getApprovalStatus());
        return userDto;
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody PasswordChangeDto passwordChangeDto) {
        boolean changed = userService.changePassword(
                passwordChangeDto.getCurrentPassword(),
                passwordChangeDto.getNewPassword());

        if (changed) {
            return ResponseEntity.ok().body(
                    Map.of("message", "Password changed successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    Map.of("message", "Current password is incorrect"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserDtoById(id));
    }

    @PostMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(@RequestBody UserProfileUpdateDto profileUpdateDto) {
        return ResponseEntity.ok(userService.updateProfile(profileUpdateDto));
    }

    @PostMapping("/avatar")
    public ResponseEntity<UserDto> updateAvatar(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userService.updateAvatar(file));
    }
}