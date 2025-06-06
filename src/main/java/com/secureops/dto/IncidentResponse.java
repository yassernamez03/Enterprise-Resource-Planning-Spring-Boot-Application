package com.secureops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentResponse {
    private String id;
    private String title;
    private String description;
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW
    private String status; // ACTIVE, INVESTIGATING, RESOLVED
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private List<String> affectedSystems;
    private List<String> recommendedActions;
    private String assignedTo;
}