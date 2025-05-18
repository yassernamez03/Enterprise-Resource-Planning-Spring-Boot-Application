package com.secureops.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.secureops.entity.Log;
import com.secureops.service.LogService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;


@RestController
@RequestMapping("/api/security/logs")
@Slf4j
public class LogSecurityController {
    
    private final LogService logService;

    public LogSecurityController(LogService logService) {
        this.logService = logService;
    }


    @PostMapping()
    public ResponseEntity<?> logSecurityEvent(@RequestBody Map<String, Object> logRequest) {
        try {
            Long userId = null;
            if (logRequest.get("userId") != null) {
                userId = Long.valueOf(logRequest.get("userId").toString());
            }
            
            String action = (String) logRequest.get("action");
            String details = (String) logRequest.get("details");
            String logType = (String) logRequest.get("logType");
            String ipAddress = getClientIp();
            
            Log createdLog = logService.createLog(action, details, ipAddress, logType, userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Security event logged successfully",
                "logId", createdLog.getId(),
                "timestamp", createdLog.getTimestamp()
            ));
        } catch (Exception e) {
            log.error("Error logging security event", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "An error occurred while logging security event"
            ));
        }
    }
    
    private String getClientIp() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                .getRequest();
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress;
    }
}
