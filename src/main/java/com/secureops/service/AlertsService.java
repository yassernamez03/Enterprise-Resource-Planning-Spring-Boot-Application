package com.secureops.service;

import com.secureops.dto.AlertResponse;
import com.secureops.dto.IncidentResponse;
import com.secureops.dto.AlertSummaryResponse;

import java.time.LocalDate;
import java.util.List;

public interface AlertsService {
    List<AlertResponse> analyzeTodayLogs();
    List<AlertResponse> analyzeHistoricalLogs(LocalDate startDate, LocalDate endDate);
    List<IncidentResponse> getActiveIncidents();
    AlertSummaryResponse getAlertSummary();
    void resolveIncident(String incidentId);
    List<AlertResponse> detectBruteForceAttempts();
    List<AlertResponse> detectDataExfiltration();
}