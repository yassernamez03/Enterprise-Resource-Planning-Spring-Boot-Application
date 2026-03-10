package com.secureops.controller;

import com.secureops.service.AlertsService;
import com.secureops.dto.AlertResponse;
import com.secureops.dto.AlertSummaryResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
public class AlertsController {

    @Autowired
    private AlertsService alertsService;

    @GetMapping
    public ResponseEntity<List<AlertResponse>> getAllAlerts() {
        List<AlertResponse> alerts = alertsService.getAllAlerts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/today")
    public ResponseEntity<List<AlertResponse>> getTodayAlerts() {
        List<AlertResponse> alerts = alertsService.analyzeTodayLogs();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/historical")
    public ResponseEntity<List<AlertResponse>> getHistoricalAlerts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AlertResponse> alerts = alertsService.analyzeHistoricalLogs(startDate, endDate);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/summary")
    public ResponseEntity<AlertSummaryResponse> getAlertSummary() {
        AlertSummaryResponse summary = alertsService.getAlertSummary();
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/bruteforce")
    public ResponseEntity<List<AlertResponse>> getBruteForceAlerts() {
        List<AlertResponse> alerts = alertsService.detectBruteForceAttempts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/data-exfiltration")
    public ResponseEntity<List<AlertResponse>> getDataExfiltrationAlerts() {
        List<AlertResponse> alerts = alertsService.detectDataExfiltration();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/path-traversal")
    public ResponseEntity<List<AlertResponse>> getPathTraversalAlerts() {
        List<AlertResponse> alerts = alertsService.detectPathTraversal();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/rce")
    public ResponseEntity<List<AlertResponse>> getRceAlerts() {
        List<AlertResponse> alerts = alertsService.detectRemoteCodeExecution();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/lfi")
    public ResponseEntity<List<AlertResponse>> getLfiAlerts() {
        List<AlertResponse> alerts = alertsService.detectLocalFileInclusion();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/sql-injection")
    public ResponseEntity<List<AlertResponse>> getSqlInjectionAlerts() {
        List<AlertResponse> alerts = alertsService.detectSqlInjection();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/xss")
    public ResponseEntity<List<AlertResponse>> getXssAlerts() {
        List<AlertResponse> alerts = alertsService.detectXssAttempts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/malware")
    public ResponseEntity<List<AlertResponse>> getMalwareAlerts() {
        List<AlertResponse> alerts = alertsService.detectMalware();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/ddos")
    public ResponseEntity<List<AlertResponse>> getDdosAlerts() {
        List<AlertResponse> alerts = alertsService.detectDdosAttempts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/privilege-escalation")
    public ResponseEntity<List<AlertResponse>> getPrivilegeEscalationAlerts() {
        List<AlertResponse> alerts = alertsService.detectPrivilegeEscalation();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/unauthorized-access")
    public ResponseEntity<List<AlertResponse>> getUnauthorizedAccessAlerts() {
        List<AlertResponse> alerts = alertsService.detectUnauthorizedAccess();
        return ResponseEntity.ok(alerts);
    }

    @PostMapping("/comprehensive-scan")
    public ResponseEntity<List<AlertResponse>> runComprehensiveThreatScan() {
        List<AlertResponse> alerts = alertsService.runComprehensiveThreatScan();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/threat-statistics")
    public ResponseEntity<Map<String, Integer>> getThreatStatistics() {
        Map<String, Integer> stats = alertsService.getThreatStatistics();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/high-severity")
    public ResponseEntity<List<AlertResponse>> getHighSeverityAlerts() {
        List<AlertResponse> alerts = alertsService.getHighSeverityAlerts();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/top-attacking-ips")
    public ResponseEntity<List<String>> getTopAttackingIPs() {
        List<String> topIPs = alertsService.getTopAttackingIPs();
        return ResponseEntity.ok(topIPs);
    }

    @PostMapping("/generate-threat-report")
    public ResponseEntity<String> generateThreatReport() {
        alertsService.generateThreatReport();
        return ResponseEntity.ok("Threat report generated successfully");
    }
}