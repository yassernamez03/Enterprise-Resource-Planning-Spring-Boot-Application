package com.secureops.controller;

import com.secureops.entity.Log;
import com.secureops.service.LogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/logs")
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class LogAdminController {

    private final LogService logService;

    public LogAdminController(LogService logService) {
        this.logService = logService;
    }

    @GetMapping
    public ResponseEntity<?> getAllLogs() {
        try {
            List<Log> logs = logService.getAllLogs();
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            log.error("Error retrieving all logs", e);
            return ResponseEntity.internalServerError().body("An error occurred while retrieving logs.");
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserLogs(@PathVariable Long userId) {
        try {
            List<Log> logs = logService.getUserLogs(userId);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            log.error("Error retrieving logs for user with ID {}", userId, e);
            return ResponseEntity.internalServerError().body("An error occurred while retrieving user logs.");
        }
    }
}
