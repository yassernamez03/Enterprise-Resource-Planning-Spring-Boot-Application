package com.secureops.service;

import com.secureops.dto.AlertResponse;
import com.secureops.dto.IncidentResponse;
import com.secureops.dto.AlertSummaryResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface AlertsService {
    // Existing methods (keep these)
    List<AlertResponse> getAllAlerts();
    List<AlertResponse> analyzeTodayLogs();
    List<AlertResponse> analyzeHistoricalLogs(LocalDate startDate, LocalDate endDate);
    List<IncidentResponse> getActiveIncidents();
    AlertSummaryResponse getAlertSummary();
    void resolveIncident(String incidentId);
    List<AlertResponse> detectBruteForceAttempts();
    List<AlertResponse> detectDataExfiltration();
    
    // ADD THESE MISSING METHOD SIGNATURES:
    
    // Threat Detection Methods
    List<AlertResponse> detectPathTraversal();
    List<AlertResponse> detectRemoteCodeExecution();
    List<AlertResponse> detectLocalFileInclusion();
    List<AlertResponse> detectSqlInjection();
    List<AlertResponse> detectXssAttempts();
    List<AlertResponse> detectMalware();
    List<AlertResponse> detectDdosAttempts();
    List<AlertResponse> detectPrivilegeEscalation();
    List<AlertResponse> detectUnauthorizedAccess();
    
    // Advanced Analysis Methods
    List<AlertResponse> runComprehensiveThreatScan();
    Map<String, Integer> getThreatStatistics();
    List<AlertResponse> getHighSeverityAlerts();
    List<String> getTopAttackingIPs();
    void generateThreatReport();
}