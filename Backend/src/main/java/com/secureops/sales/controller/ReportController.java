package com.secureops.sales.controller;

import com.secureops.sales.dto.response.ClientSpendingReport;
import com.secureops.sales.dto.response.ProductSalesReport;
import com.secureops.sales.dto.response.SalesSummaryReport;
import com.secureops.sales.service.ReportService;
import com.secureops.service.LogService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/sales/reports")
public class ReportController {

    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final ReportService reportService;
    private final LogService logService;
    private final UserService userService;

    @Autowired
    public ReportController(ReportService reportService, LogService logService, UserService userService) {
        this.reportService = reportService;
        this.logService = logService;
        this.userService = userService;
        logger.info("ReportController initialized");
    }    @GetMapping("/sales-summary")
    public ResponseEntity<SalesSummaryReport> getSalesSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Sales summary report request - startDate: {}, endDate: {}, userId: {}, username: {}, ip: {}", 
                startDate, endDate, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_SUMMARY_REPORT_ACCESS - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}, Action: VIEW_SALES_SUMMARY", 
                currentUsername, currentUserId, clientIp, startDate, endDate);
        
        try {
            // Validate input parameters
            if (startDate == null || endDate == null) {
                logger.warn("Invalid date parameters - startDate: {}, endDate: {}, userId: {}, ip: {}", 
                        startDate, endDate, currentUserId, clientIp);
                securityLogger.warn("INVALID_DATE_PARAMETERS - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}", 
                        currentUsername, currentUserId, clientIp, startDate, endDate);
                return ResponseEntity.badRequest().build();
            }
            
            if (startDate.isAfter(endDate)) {
                logger.warn("Invalid date range - startDate after endDate: {} > {}, userId: {}, ip: {}", 
                        startDate, endDate, currentUserId, clientIp);
                securityLogger.warn("INVALID_DATE_RANGE - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}", 
                        currentUsername, currentUserId, clientIp, startDate, endDate);
                return ResponseEntity.badRequest().build();
            }
            
            SalesSummaryReport report = reportService.getSalesSummary(startDate, endDate);
            
            logger.info("Sales summary report generated successfully - startDate: {}, endDate: {}, userId: {}, ip: {}", 
                    startDate, endDate, currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Generated sales summary report - StartDate: " + startDate + ", EndDate: " + endDate,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(report);
            
        } catch (Exception e) {
            logger.error("Error generating sales summary report - startDate: {}, endDate: {}, userId: {}, username: {}, ip: {}", 
                    startDate, endDate, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_SUMMARY_REPORT_ERROR - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, startDate, endDate, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to generate sales summary report " + startDate + " to " + endDate + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/client-spending/{clientId}")
    public ResponseEntity<ClientSpendingReport> getClientSpendingReport(
            @PathVariable Long clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Client spending report request - clientId: {}, startDate: {}, endDate: {}, userId: {}, username: {}, ip: {}", 
                clientId, startDate, endDate, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_CLIENT_SPENDING_REPORT_ACCESS - User: {} (ID: {}), IP: {}, ClientId: {}, StartDate: {}, EndDate: {}, Action: VIEW_CLIENT_SPENDING", 
                currentUsername, currentUserId, clientIp, clientId, startDate, endDate);
        
        try {
            // Validate input parameters
            if (clientId == null || clientId <= 0) {
                logger.warn("Invalid client ID parameter: {} - userId: {}, ip: {}", 
                        clientId, currentUserId, clientIp);
                securityLogger.warn("INVALID_CLIENT_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidClientId: {}", 
                        currentUsername, currentUserId, clientIp, clientId);
                return ResponseEntity.badRequest().build();
            }
            
            if (startDate == null || endDate == null) {
                logger.warn("Invalid date parameters - startDate: {}, endDate: {}, userId: {}, ip: {}", 
                        startDate, endDate, currentUserId, clientIp);
                securityLogger.warn("INVALID_DATE_PARAMETERS - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}", 
                        currentUsername, currentUserId, clientIp, startDate, endDate);
                return ResponseEntity.badRequest().build();
            }
            
            if (startDate.isAfter(endDate)) {
                logger.warn("Invalid date range - startDate after endDate: {} > {}, userId: {}, ip: {}", 
                        startDate, endDate, currentUserId, clientIp);
                securityLogger.warn("INVALID_DATE_RANGE - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}", 
                        currentUsername, currentUserId, clientIp, startDate, endDate);
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(clientId), clientIp);
            
            ClientSpendingReport report = reportService.getClientSpendingReport(clientId, startDate, endDate);
            
            logger.info("Client spending report generated successfully - clientId: {}, startDate: {}, endDate: {}, userId: {}, ip: {}", 
                    clientId, startDate, endDate, currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Generated client spending report - ClientId: " + clientId + ", StartDate: " + startDate + ", EndDate: " + endDate,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(report);
            
        } catch (Exception e) {
            logger.error("Error generating client spending report - clientId: {}, startDate: {}, endDate: {}, userId: {}, username: {}, ip: {}", 
                    clientId, startDate, endDate, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_CLIENT_SPENDING_REPORT_ERROR - User: {} (ID: {}), IP: {}, ClientId: {}, StartDate: {}, EndDate: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, clientId, startDate, endDate, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to generate client spending report for client " + clientId + " from " + startDate + " to " + endDate + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/product-sales")
    public ResponseEntity<ProductSalesReport> getProductSalesReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Product sales report request - startDate: {}, endDate: {}, userId: {}, username: {}, ip: {}", 
                startDate, endDate, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_PRODUCT_SALES_REPORT_ACCESS - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}, Action: VIEW_PRODUCT_SALES", 
                currentUsername, currentUserId, clientIp, startDate, endDate);
        
        try {
            // Validate input parameters
            if (startDate == null || endDate == null) {
                logger.warn("Invalid date parameters - startDate: {}, endDate: {}, userId: {}, ip: {}", 
                        startDate, endDate, currentUserId, clientIp);
                securityLogger.warn("INVALID_DATE_PARAMETERS - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}", 
                        currentUsername, currentUserId, clientIp, startDate, endDate);
                return ResponseEntity.badRequest().build();
            }
            
            if (startDate.isAfter(endDate)) {
                logger.warn("Invalid date range - startDate after endDate: {} > {}, userId: {}, ip: {}", 
                        startDate, endDate, currentUserId, clientIp);
                securityLogger.warn("INVALID_DATE_RANGE - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}", 
                        currentUsername, currentUserId, clientIp, startDate, endDate);
                return ResponseEntity.badRequest().build();
            }
            
            ProductSalesReport report = reportService.getProductSalesReport(startDate, endDate);
            
            logger.info("Product sales report generated successfully - startDate: {}, endDate: {}, userId: {}, ip: {}", 
                    startDate, endDate, currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Generated product sales report - StartDate: " + startDate + ", EndDate: " + endDate,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(report);
            
        } catch (Exception e) {
            logger.error("Error generating product sales report - startDate: {}, endDate: {}, userId: {}, username: {}, ip: {}", 
                    startDate, endDate, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_PRODUCT_SALES_REPORT_ERROR - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, startDate, endDate, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to generate product sales report " + startDate + " to " + endDate + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Security and utility helper methods
    
    private Long getCurrentUserIdSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !authentication.getName().equals("anonymousUser")) {
                return userService.getUserByEmail(authentication.getName()).getId();
            }
        } catch (Exception e) {
            logger.warn("Error getting current user ID: {}", e.getMessage());
        }
        return null;
    }
    
    private String getCurrentUsernameSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !authentication.getName().equals("anonymousUser")) {
                return authentication.getName();
            }
        } catch (Exception e) {
            logger.warn("Error getting current username: {}", e.getMessage());
        }
        return "unknown";
    }
    
    private String getClientIpSafely() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attributes.getRequest();
            
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp.trim();
            }
            
            return request.getRemoteAddr();
        } catch (Exception e) {
            logger.warn("Error getting client IP: {}", e.getMessage());
            return "unknown";
        }
    }
    
    private void validateInputSecurity(String input, String clientIp) {
        if (input == null) return;
        
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        // Check for SQL injection patterns
        if (containsSqlInjectionPattern(input)) {
            securityLogger.error("SQL_INJECTION_ATTEMPT - User: {} (ID: {}), IP: {}, Input: {}", 
                    currentUsername, currentUserId, clientIp, sanitizeForLogging(input));
            
            logService.createLog(
                    AppConstants.LOG_ACTION_SECURITY,
                    "SQL injection attempt detected: " + sanitizeForLogging(input),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            
            throw new SecurityException("Invalid input detected");
        }
        
        // Check for XSS patterns
        if (containsXssPattern(input)) {
            securityLogger.error("XSS_ATTEMPT - User: {} (ID: {}), IP: {}, Input: {}", 
                    currentUsername, currentUserId, clientIp, sanitizeForLogging(input));
            
            logService.createLog(
                    AppConstants.LOG_ACTION_SECURITY,
                    "XSS attempt detected: " + sanitizeForLogging(input),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            
            throw new SecurityException("Invalid input detected");
        }
        
        // Check for path traversal patterns
        if (containsPathTraversalPattern(input)) {
            securityLogger.error("PATH_TRAVERSAL_ATTEMPT - User: {} (ID: {}), IP: {}, Input: {}", 
                    currentUsername, currentUserId, clientIp, sanitizeForLogging(input));
            
            logService.createLog(
                    AppConstants.LOG_ACTION_SECURITY,
                    "Path traversal attempt detected: " + sanitizeForLogging(input),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            
            throw new SecurityException("Invalid input detected");
        }
    }
    
    private boolean containsSqlInjectionPattern(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase();
        String[] sqlPatterns = {
            "union select", "drop table", "delete from", "insert into", 
            "update set", "create table", "alter table", "exec ", "execute",
            "--", "/*", "*/", "xp_", "sp_", "waitfor delay"
        };
        
        for (String pattern : sqlPatterns) {
            if (lowerInput.contains(pattern)) {
                return true;
            }
        }
        return false;
    }
    
    private boolean containsXssPattern(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase();
        String[] xssPatterns = {
            "<script", "</script>", "javascript:", "onload=", "onerror=", 
            "onclick=", "onmouseover=", "onfocus=", "onblur=", "onchange=",
            "eval(", "expression(", "vbscript:", "data:text/html"
        };
        
        for (String pattern : xssPatterns) {
            if (lowerInput.contains(pattern)) {
                return true;
            }
        }
        return false;
    }
    
    private boolean containsPathTraversalPattern(String input) {
        if (input == null) return false;
        String[] pathPatterns = {
            "../", "..\\", "..%2f", "..%5c", "%2e%2e%2f", "%2e%2e%5c",
            "....//", "....\\\\", "/etc/passwd", "\\windows\\system32"
        };
        
        String lowerInput = input.toLowerCase();
        for (String pattern : pathPatterns) {
            if (lowerInput.contains(pattern)) {
                return true;
            }
        }
        return false;
    }
    
    private String sanitizeForLogging(String input) {
        if (input == null) return "null";
        return input.replaceAll("[\r\n\t]", "_")
                   .replaceAll("[<>\"'&]", "*")
                   .substring(0, Math.min(input.length(), 100));
    }
}