package com.secureops.controller;

import com.secureops.service.AlertsService;
import com.secureops.dto.AlertResponse;
import com.secureops.dto.IncidentResponse;
import com.secureops.dto.AlertSummaryResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertsController {

    @Autowired
    private AlertsService alertsService;

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

    @GetMapping("/incidents")
    public ResponseEntity<List<IncidentResponse>> getActiveIncidents() {
        List<IncidentResponse> incidents = alertsService.getActiveIncidents();
        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/summary")
    public ResponseEntity<AlertSummaryResponse> getAlertSummary() {
        AlertSummaryResponse summary = alertsService.getAlertSummary();
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/incidents/{incidentId}/resolve")
    public ResponseEntity<String> resolveIncident(@PathVariable String incidentId) {
        alertsService.resolveIncident(incidentId);
        return ResponseEntity.ok("Incident resolved successfully");
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
}