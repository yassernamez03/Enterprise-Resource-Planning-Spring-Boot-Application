package com.secureops.dto;

import com.secureops.entity.User.ApprovalStatus;
import com.secureops.entity.User.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String fullName;
    private String email;
    private boolean isActive;
    private UserRole role;
    private ApprovalStatus approvalStatus;
    private String avatarUrl;
}