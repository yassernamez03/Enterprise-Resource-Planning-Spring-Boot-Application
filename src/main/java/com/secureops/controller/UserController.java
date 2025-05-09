package com.secureops.controller;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.secureops.dto.PasswordChangeDto;
import com.secureops.dto.UserDto;
import com.secureops.dto.UserProfileUpdateDto;
import com.secureops.entity.User;
import com.secureops.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    private static final List<String> ALLOWED_AVATAR_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif");
    private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
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
    // @PreAuthorize("hasRole('ADMIN')")
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

    // Add this endpoint to the UserController class

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> changeUserRole(@PathVariable Long id, @RequestBody Map<String, String> roleData) {
        String role = roleData.get("role");
        if (role == null || role.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role cannot be empty"));
        }

        try {
            User.UserRole userRole = User.UserRole.valueOf(role);
            User user = userService.changeUserRole(id, userRole);
            return ResponseEntity.ok(mapToDto(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role specified"));
        }
    }

    // Update the reset password endpoint to accept a specified password
@PostMapping("/{id}/reset-password")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> resetUserPassword(
        @PathVariable Long id,
        @RequestBody Map<String, String> passwordData) {
    
    String newPassword = passwordData.get("newPassword");
    if (newPassword == null || newPassword.isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("message", "New password cannot be empty"));
    }
    
    boolean success = userService.adminResetPassword(id, newPassword);
    if (success) {
        return ResponseEntity.ok().body(Map.of("message", "Password reset successfully"));
    } else {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to reset password"));
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
    public ResponseEntity<?> updateAvatar(@RequestParam("file") MultipartFile file) {
        try {
            // Check if file is empty
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Empty file"));
            }

            // Validate declared content type (from HTTP headers)
            String declaredContentType = file.getContentType();
            if (declaredContentType == null || !ALLOWED_AVATAR_TYPES.contains(declaredContentType.toLowerCase())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Only JPEG, PNG, and GIF images are allowed"));
            }

            // Validate file size
            if (file.getSize() > MAX_AVATAR_SIZE) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "File size exceeds the maximum limit of 2MB"));
            }

            // Validate actual file content by checking file signature/magic bytes
            byte[] fileBytes = file.getBytes();
            if (!isValidImageFile(fileBytes)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Invalid image file content detected"));
            }

            // Process valid file
            // file deepcode ignore PT: <i already fixed this>
            UserDto updatedUser = userService.updateAvatar(file);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to upload avatar: " + e.getMessage()));
        }
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
}