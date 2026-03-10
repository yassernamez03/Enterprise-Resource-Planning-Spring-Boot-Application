package com.secureops.service;

import com.secureops.dto.AlertResponse;
import com.secureops.dto.AlertSummaryResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface AlertsService {
    // Existing methods (keep these)
    List<AlertResponse> getAllAlerts();
    List<AlertResponse> analyzeTodayLogs();
    List<AlertResponse> analyzeHistoricalLogs(LocalDate startDate, LocalDate endDate);
    AlertSummaryResponse getAlertSummary();
    
    // Threat Detection Methods
    List<AlertResponse> detectBruteForceAttempts();
    List<AlertResponse> detectDataExfiltration();
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