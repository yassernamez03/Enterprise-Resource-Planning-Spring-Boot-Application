package com.secureops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertResponse {
    private String id;
    private String title;
    private String description;
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW
    private String alertType; // BRUTE_FORCE, DATA_EXFILTRATION, MALICIOUS_FILE, etc.
    private String sourceIp;
    private LocalDateTime timestamp;
    private String details;
    private boolean acknowledged;
}