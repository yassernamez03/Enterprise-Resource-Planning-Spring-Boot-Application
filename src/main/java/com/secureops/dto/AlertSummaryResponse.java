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
public class AlertSummaryResponse {
    private int totalAlerts;
    private int criticalAlerts;
    private int highAlerts;
    private int mediumAlerts;
    private int lowAlerts;
    private int activeIncidents;
    private LocalDateTime lastUpdated;
}