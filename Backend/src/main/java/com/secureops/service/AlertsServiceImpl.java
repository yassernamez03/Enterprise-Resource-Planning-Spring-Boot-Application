package com.secureops.service;

import com.secureops.dto.AlertResponse;
import com.secureops.dto.AlertSummaryResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AlertsServiceImpl implements AlertsService {

    private static final Logger logger = LoggerFactory.getLogger(AlertsServiceImpl.class);

    // BRUTE FORCE ATTACK PATTERNS
    private static final Pattern[] BRUTE_FORCE_PATTERNS = {
            Pattern.compile("ERROR.*Account locked.*User: ([^\\s]+).*IP: ([\\d.:]+).*Reason: Too many failed attempts",
                    Pattern.CASE_INSENSITIVE),
    };

    // DATA EXFILTRATION PATTERNS
    private static final Pattern[] DATA_EXFILTRATION_PATTERNS = {
            Pattern.compile("INFO.*File download.*Size: ([\\d]+).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Large data transfer.*Size: ([\\d]+) bytes.*User: ([^\\s]+).*Destination: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("INFO.*Database export.*Table: ([^\\s]+).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Unauthorized file access.*File: ([^\\s]+).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Bulk download detected.*Files: ([\\d]+).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("INFO.*FTP upload.*Size: ([\\d]+).*User: ([^\\s]+).*Destination: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Sensitive data access.*Document: ([^\\s]+).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Unusual data pattern.*Query: ([^\\n]+).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE)
    };

    // PATH TRAVERSAL PATTERNS
    private static final Pattern[] PATH_TRAVERSAL_PATTERNS = {
            Pattern.compile("WARN.*Path traversal attempt.*URL: ([^\\s]+).*IP: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Directory traversal.*Path: ([^\\s]+).*Client: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("INFO.*Suspicious file access.*File: ([^\\s]*\\.\\./[^\\s]*).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Invalid path detected.*Request: ([^\\s]*\\.\\./[^\\s]*).*Source: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile(
                    "ERROR.*File system access violation.*Path: ([^\\s]*\\.\\./[^\\s]*).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*../ pattern detected.*URI: ([^\\s]+).*Client: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile(
                    "ERROR.*Normalized path violation.*Original: ([^\\s]+).*Normalized: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE)
    };

    // REMOTE CODE EXECUTION (RCE) PATTERNS
    private static final Pattern[] RCE_PATTERNS = {
            Pattern.compile("ERROR.*Code injection attempt.*Payload: ([^\\n]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Command execution detected.*Command: ([^\\n]+).*Source: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Shell command in request.*Request: ([^\\n]+).*Client: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Eval function detected.*Code: ([^\\n]+).*IP: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*System command execution.*Command: ([^\\n]+).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Script execution attempt.*Script: ([^\\n]+).*Source: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Deserialization attack.*Payload: ([^\\n]+).*Client: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Template injection.*Template: ([^\\n]+).*IP: ([\\d.:]+)", Pattern.CASE_INSENSITIVE)
    };

    // LOCAL FILE INCLUSION (LFI) PATTERNS
    private static final Pattern[] LFI_PATTERNS = {
            Pattern.compile("WARN.*Local file inclusion.*File: ([^\\s]+).*IP: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*LFI attempt detected.*Path: ([^\\s]+).*Client: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*File inclusion vulnerability.*Include: ([^\\s]+).*Source: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Unauthorized file read.*File: ([^\\s]+).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*PHP wrapper detected.*Wrapper: ([^\\s]+).*IP: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Config file access.*File: ([^\\s]*config[^\\s]*).*Client: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*System file access.*File: ([^\\s]*/etc/[^\\s]*).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE)
    };

    // SQL INJECTION PATTERNS
    private static final Pattern[] SQL_INJECTION_PATTERNS = {
            Pattern.compile("ERROR.*SQL injection attempt.*Query: ([^\\n]+).*IP: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Malicious SQL detected.*Statement: ([^\\n]+).*Client: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Database error.*Invalid query: ([^\\n]+).*Source: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*SQL metacharacters.*Input: ([^\\n]+).*IP: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Union select detected.*Query: ([^\\n]+).*Client: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*SQL comment injection.*Parameter: ([^\\n]+).*Source: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Time-based SQL injection.*Query: ([^\\n]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE)
    };

    // XSS PATTERNS
    private static final Pattern[] XSS_PATTERNS = {
            Pattern.compile("WARN.*XSS attempt detected.*Payload: ([^\\n]+).*IP: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Script injection.*Content: ([^\\n]+).*Client: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*JavaScript in parameter.*Input: ([^\\n]+).*Source: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*HTML injection.*Payload: ([^\\n]+).*IP: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Event handler injection.*Handler: ([^\\n]+).*Client: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*DOM manipulation attempt.*Script: ([^\\n]+).*Source: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE)
    };

    // MALWARE PATTERNS
    private static final Pattern[] MALWARE_PATTERNS = {
            Pattern.compile("ERROR.*Malware detected.*File: ([^\\s]+).*Signature: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Suspicious file upload.*Filename: ([^\\s]+).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Virus scan failed.*File: ([^\\s]+).*Threat: ([^\\s]+).*Source: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Executable upload blocked.*File: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Trojan detected.*Process: ([^\\s]+).*Host: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Ransomware activity.*Files: ([^\\s]+).*System: ([\\d.:]+)", Pattern.CASE_INSENSITIVE)
    };

    // DDOS PATTERNS
    private static final Pattern[] DDOS_PATTERNS = {
            Pattern.compile("WARN.*High request rate.*Rate: ([\\d]+) req/sec.*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Request flooding.*Count: ([\\d]+).*Source: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Bandwidth exceeded.*Usage: ([\\d]+) MB.*Client: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Connection limit reached.*Connections: ([\\d]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Suspicious traffic pattern.*Volume: ([\\d]+).*Source: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Server overload.*Requests: ([\\d]+).*From: ([\\d.:]+)", Pattern.CASE_INSENSITIVE)
    };

    // PRIVILEGE ESCALATION PATTERNS
    private static final Pattern[] PRIVILEGE_ESCALATION_PATTERNS = {
            Pattern.compile("ERROR.*UNAUTHORIZED_ADMIN_ACCESS.*User: ([^,]+).*IP: ([^,]+).*Details:",
                    Pattern.CASE_INSENSITIVE),
    };

    // UNAUTHORIZED ACCESS PATTERNS
    private static final Pattern[] UNAUTHORIZED_ACCESS_PATTERNS = {
            Pattern.compile("ERROR.*UNAUTHORIZED_ACCESS_ATTEMPT.*IP: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Access denied.*Resource: ([^\\s]+).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Forbidden access.*URL: ([^\\s]+).*Client: ([\\d.:]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Permission violation.*Action: ([^\\s]+).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("WARN.*Unauthorized API call.*Endpoint: ([^\\s]+).*Source: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Invalid token access.*Token: ([^\\s]+).*IP: ([\\d.:]+)", Pattern.CASE_INSENSITIVE)
    };

    // Fixed getAllAlerts to include both today's and historical alerts without
    // duplicates
    @Override
    public List<AlertResponse> getAllAlerts() {
        Set<AlertResponse> uniqueAlerts = new HashSet<>();

        // Get today's alerts (without duplicates from runComprehensiveThreatScan)
        List<AlertResponse> todayAlerts = analyzeLogs(getTodayLogFiles());
        uniqueAlerts.addAll(todayAlerts);

        // Get recent historical alerts (last 7 days)
        LocalDate sevenDaysAgo = LocalDate.now().minusDays(7);
        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<AlertResponse> historicalAlerts = analyzeHistoricalLogs(sevenDaysAgo, yesterday);
        uniqueAlerts.addAll(historicalAlerts);

        // Sort by timestamp (newest first) and return
        return uniqueAlerts.stream()
                .sorted((a1, a2) -> a2.getTimestamp().compareTo(a1.getTimestamp()))
                .collect(Collectors.toList());
    }

    // Fixed analyzeTodayLogs to avoid duplicate processing
    @Override
    public List<AlertResponse> analyzeTodayLogs() {
        // Only analyze logs once, don't call runComprehensiveThreatScan separately
        return analyzeLogs(getTodayLogFiles());
    }

    @Override
    public List<AlertResponse> analyzeHistoricalLogs(LocalDate startDate, LocalDate endDate) {
        return analyzeLogs(getHistoricalLogFiles(startDate, endDate));
    }

    @Override
    public AlertSummaryResponse getAlertSummary() {
        List<AlertResponse> todayAlerts = analyzeTodayLogs();

        Map<String, Long> alertCounts = todayAlerts.stream()
                .collect(Collectors.groupingBy(AlertResponse::getSeverity, Collectors.counting()));

        return AlertSummaryResponse.builder()
                .totalAlerts(todayAlerts.size())
                .criticalAlerts(alertCounts.getOrDefault("CRITICAL", 0L).intValue())
                .highAlerts(alertCounts.getOrDefault("HIGH", 0L).intValue())
                .mediumAlerts(alertCounts.getOrDefault("MEDIUM", 0L).intValue())
                .lowAlerts(alertCounts.getOrDefault("LOW", 0L).intValue())
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    // Individual threat detection methods now use the centralized logic
    @Override
    public List<AlertResponse> detectBruteForceAttempts() {
        return detectThreatPattern("BRUTE_FORCE", BRUTE_FORCE_PATTERNS, 3, "CRITICAL",
                "Brute Force Attack Detected", "Multiple failed login attempts detected");
    }

    @Override
    public List<AlertResponse> detectDataExfiltration() {
        return detectThreatPattern("DATA_EXFILTRATION", DATA_EXFILTRATION_PATTERNS, 5, "HIGH",
                "Potential Data Exfiltration", "Suspicious data transfer activity detected");
    }

    public List<AlertResponse> detectPathTraversal() {
        return detectThreatPattern("PATH_TRAVERSAL", PATH_TRAVERSAL_PATTERNS, 2, "HIGH",
                "Path Traversal Attack", "Directory traversal attempts detected");
    }

    public List<AlertResponse> detectRemoteCodeExecution() {
        return detectThreatPattern("RCE", RCE_PATTERNS, 1, "CRITICAL",
                "Remote Code Execution Attempt", "Code injection attempts detected");
    }

    public List<AlertResponse> detectLocalFileInclusion() {
        return detectThreatPattern("LFI", LFI_PATTERNS, 2, "HIGH",
                "Local File Inclusion Attack", "File inclusion attempts detected");
    }

    public List<AlertResponse> detectSqlInjection() {
        return detectThreatPattern("SQL_INJECTION", SQL_INJECTION_PATTERNS, 1, "CRITICAL",
                "SQL Injection Attack", "Database injection attempts detected");
    }

    public List<AlertResponse> detectXssAttempts() {
        return detectThreatPattern("XSS", XSS_PATTERNS, 2, "HIGH",
                "Cross-Site Scripting Attack", "Script injection attempts detected");
    }

    public List<AlertResponse> detectMalware() {
        return detectThreatPattern("MALWARE", MALWARE_PATTERNS, 1, "CRITICAL",
                "Malware Detected", "Malicious software activity detected");
    }

    public List<AlertResponse> detectDdosAttempts() {
        return detectThreatPattern("DDOS", DDOS_PATTERNS, 10, "HIGH",
                "DDoS Attack Detected", "Distributed denial of service activity detected");
    }

    public List<AlertResponse> detectPrivilegeEscalation() {
        return detectThreatPattern("PRIVILEGE_ESCALATION", PRIVILEGE_ESCALATION_PATTERNS, 1, "CRITICAL",
                "Privilege Escalation Attempt", "Unauthorized privilege elevation detected");
    }

    public List<AlertResponse> detectUnauthorizedAccess() {
        return detectThreatPattern("UNAUTHORIZED_ACCESS", UNAUTHORIZED_ACCESS_PATTERNS, 3, "HIGH",
                "Unauthorized Access Attempt", "Unauthorized resource access attempts detected");
    }

    // Centralized threat detection logic - creates alerts AND incidents when
    // threshold is met
    private List<AlertResponse> detectThreatPattern(String threatType, Pattern[] patterns, int threshold,
            String severity, String title, String description) {

        List<String> logFiles = getTodayLogFiles();
        List<AlertResponse> threatAlerts = new ArrayList<>();

        for (String logFile : logFiles) {
            for (Pattern pattern : patterns) {
                threatAlerts.addAll(analyzeLogFile(logFile, pattern, threatType));
            }
        }

        return threatAlerts;
    }

    // Core log analysis method - processes logs once and creates all alerts
    private List<AlertResponse> analyzeLogs(List<String> logFiles) {
        List<AlertResponse> allAlerts = new ArrayList<>();

        for (String logFile : logFiles) {
            // Analyze all threat patterns for each file
            allAlerts.addAll(analyzeFileForAllPatterns(logFile, BRUTE_FORCE_PATTERNS, "BRUTE_FORCE"));
            allAlerts.addAll(analyzeFileForAllPatterns(logFile, DATA_EXFILTRATION_PATTERNS, "DATA_EXFILTRATION"));
            allAlerts.addAll(analyzeFileForAllPatterns(logFile, PATH_TRAVERSAL_PATTERNS, "PATH_TRAVERSAL"));
            allAlerts.addAll(analyzeFileForAllPatterns(logFile, RCE_PATTERNS, "RCE"));
            allAlerts.addAll(analyzeFileForAllPatterns(logFile, LFI_PATTERNS, "LFI"));
            allAlerts.addAll(analyzeFileForAllPatterns(logFile, SQL_INJECTION_PATTERNS, "SQL_INJECTION"));
            allAlerts.addAll(analyzeFileForAllPatterns(logFile, XSS_PATTERNS, "XSS"));
            allAlerts.addAll(analyzeFileForAllPatterns(logFile, MALWARE_PATTERNS, "MALWARE"));
            allAlerts.addAll(analyzeFileForAllPatterns(logFile, DDOS_PATTERNS, "DDOS"));
            allAlerts.addAll(analyzeFileForAllPatterns(logFile, PRIVILEGE_ESCALATION_PATTERNS, "PRIVILEGE_ESCALATION"));
            allAlerts.addAll(analyzeFileForAllPatterns(logFile, UNAUTHORIZED_ACCESS_PATTERNS, "UNAUTHORIZED_ACCESS"));
        }

        return allAlerts;
    }

    private List<AlertResponse> analyzeFileForAllPatterns(String logFile, Pattern[] patterns, String alertType) {
        List<AlertResponse> alerts = new ArrayList<>();
        for (Pattern pattern : patterns) {
            alerts.addAll(analyzeLogFile(logFile, pattern, alertType));
        }
        return alerts;
    }

    private List<AlertResponse> analyzeLogFile(String logFilePath, Pattern pattern, String alertType) {
        List<AlertResponse> alerts = new ArrayList<>();

        try (BufferedReader reader = Files.newBufferedReader(Paths.get(logFilePath))) {
            String line;
            int lineNumber = 0;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                Matcher matcher = pattern.matcher(line);
                if (matcher.find()) {
                    AlertResponse alert = createAlertFromLogLine(line, matcher, alertType);
                    if (alert != null) {
                        // Extract additional details if not already captured by matcher
                        String finalIp = alert.getSourceIp();
                        String finalUser = "unknown";

                        // If IP is still unknown, try extracting from alert details
                        if ("unknown".equals(finalIp) || finalIp == null || finalIp.isEmpty()) {
                            finalIp = extractIpFromAlert(alert);
                        }

                        // Extract user from alert details as fallback
                        finalUser = extractUserFromAlert(alert);

                        // Update the alert with final extracted values
                        alert = AlertResponse.builder()
                                .id(alert.getId())
                                .title(alert.getTitle())
                                .description(alert.getDescription())
                                .severity(alert.getSeverity())
                                .sourceIp(finalIp)
                                .timestamp(alert.getTimestamp())
                                .alertType(alert.getAlertType())
                                .details(alert.getDetails())
                                .build();

                        alerts.add(alert);
                    }
                }
            }
        } catch (IOException e) {
            logger.error("ERROR_READING_LOG_FILE - File: {}, Error: {}", logFilePath, e.getMessage());
        }

        return alerts;
    }

    private AlertResponse createAlertFromLogLine(String logLine, Matcher matcher, String alertType) {
        try {
            String timestamp = extractTimestamp(logLine);
            LocalDateTime alertTime = LocalDateTime.parse(timestamp,
                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

            // Extract IP and User from matcher first, then fallback to log line parsing
            String extractedIp = extractIpFromMatcher(matcher, logLine);
            String extractedUser = extractUserFromMatcher(matcher, logLine);

            AlertResponse.AlertResponseBuilder builder = AlertResponse.builder()
                    .id(UUID.randomUUID().toString())
                    .timestamp(alertTime)
                    .alertType(alertType)
                    .details(logLine)
                    .sourceIp(extractedIp);

            switch (alertType) {
                case "BRUTE_FORCE":
                    return builder
                            .title("Brute Force Attack Detected")
                            .description("Multiple failed authentication attempts detected from user: " + extractedUser)
                            .severity("CRITICAL")
                            .build();

                case "DATA_EXFILTRATION":
                    return builder
                            .title("Data Exfiltration Attempt")
                            .description("Suspicious data transfer or file access detected by user: " + extractedUser)
                            .severity("HIGH")
                            .build();

                case "PATH_TRAVERSAL":
                    return builder
                            .title("Path Traversal Attack")
                            .description("Directory traversal attempt detected from user: " + extractedUser)
                            .severity("HIGH")
                            .build();

                case "RCE":
                    return builder
                            .title("Remote Code Execution Attempt")
                            .description(
                                    "Code injection or command execution attempt detected from user: " + extractedUser)
                            .severity("CRITICAL")
                            .build();

                case "LFI":
                    return builder
                            .title("Local File Inclusion Attack")
                            .description(
                                    "File inclusion vulnerability exploitation detected from user: " + extractedUser)
                            .severity("HIGH")
                            .build();

                case "SQL_INJECTION":
                    return builder
                            .title("SQL Injection Attack")
                            .description("Database injection attempt detected from user: " + extractedUser)
                            .severity("CRITICAL")
                            .build();

                case "XSS":
                    return builder
                            .title("Cross-Site Scripting Attack")
                            .description("Script injection attempt detected from user: " + extractedUser)
                            .severity("HIGH")
                            .build();

                case "MALWARE":
                    return builder
                            .title("Malware Detected")
                            .description("Malicious software activity detected from user: " + extractedUser)
                            .severity("CRITICAL")
                            .build();

                case "DDOS":
                    return builder
                            .title("DDoS Attack Detected")
                            .description("Distributed denial of service activity detected")
                            .severity("HIGH")
                            .build();

                case "PRIVILEGE_ESCALATION":
                    return builder
                            .title("Privilege Escalation Attempt")
                            .description("Unauthorized privilege elevation detected from user: " + extractedUser)
                            .severity("CRITICAL")
                            .build();

                case "UNAUTHORIZED_ACCESS":
                    return builder
                            .title("Unauthorized Access Attempt")
                            .description("Attempt to access protected resource without authorization by user: "
                                    + extractedUser)
                            .severity("HIGH")
                            .build();

                case "SYSTEM_ERROR":
                    return builder
                            .title("System Error")
                            .description("Critical system error detected")
                            .severity("MEDIUM")
                            .build();

                default:
                    return builder
                            .title("Security Alert")
                            .description("Security event detected from user: " + extractedUser)
                            .severity("LOW")
                            .build();
            }
        } catch (Exception e) {
            logger.error("ERROR_CREATING_ALERT - LogLine: {}, Error: {}", logLine, e.getMessage());
            return null;
        }
    }

    private String extractTimestamp(String logLine) {
        Pattern timestampPattern = Pattern.compile("(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})");
        Matcher matcher = timestampPattern.matcher(logLine);
        return matcher.find() ? matcher.group(1)
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private String extractIpFromAlert(AlertResponse alert) {
        if (alert.getSourceIp() != null && !alert.getSourceIp().isEmpty() && !"unknown".equals(alert.getSourceIp())) {
            return alert.getSourceIp();
        }

        String details = alert.getDetails();
        if (details == null || details.isEmpty()) {
            return "unknown";
        }

        Pattern ipPattern = Pattern.compile("IP: ([^,\\s]+)");
        Matcher matcher = ipPattern.matcher(details);
        if (matcher.find()) {
            String ip = matcher.group(1).trim();
            if (isValidIpAddress(ip)) {
                return ip;
            }
        }

        return "unknown";
    }

    private String extractUserFromAlert(AlertResponse alert) {
        String details = alert.getDetails();
        if (details == null || details.isEmpty()) {
            return "unknown";
        }

        Pattern[] userPatterns = {
                Pattern.compile("User: ([^\\s\\(,]+)"),
                Pattern.compile("user=([^\\s,]+)"),
                Pattern.compile("user: ([^\\s,]+)"),
                Pattern.compile("Username: ([^\\s,]+)"),
                Pattern.compile("username=([^\\s,]+)"),
                Pattern.compile("email: ([^\\s,]+)"),
                Pattern.compile("Email: ([^\\s,]+)"),
                Pattern.compile("login attempt for user '([^']+)'"),
                Pattern.compile("Authentication failed for user: ([^\\s,]+)"),
                Pattern.compile("user '([^']+)'"),
                Pattern.compile("User '([^']+)'")
        };

        for (Pattern userPattern : userPatterns) {
            Matcher matcher = userPattern.matcher(details);
            if (matcher.find()) {
                String user = matcher.group(1).trim();
                if (!user.isEmpty() && !"null".equals(user) && !"(ID:".equals(user)) {
                    return user;
                }
            }
        }

        return "unknown";
    }

    private String extractIpFromMatcher(Matcher matcher, String logLine) {
        try {
            for (int i = 1; i <= matcher.groupCount(); i++) {
                String group = matcher.group(i);
                if (group != null && isValidIpAddress(group)) {
                    return group.trim();
                }
            }
        } catch (Exception e) {
            // Continue to fallback extraction
        }

        Pattern ipPattern = Pattern.compile("IP: ([^,\\s]+)");
        Matcher ipMatcher = ipPattern.matcher(logLine);
        if (ipMatcher.find()) {
            String ip = ipMatcher.group(1).trim();
            if (isValidIpAddress(ip)) {
                return ip;
            }
        }

        return "unknown";
    }

    private String extractUserFromMatcher(Matcher matcher, String logLine) {
        try {
            for (int i = 1; i <= matcher.groupCount(); i++) {
                String group = matcher.group(i);
                if (group != null && !group.trim().isEmpty() &&
                        !isValidIpAddress(group) && !group.matches("\\d+") &&
                        !group.contains("req/sec") && !group.contains("MB") &&
                        !group.toLowerCase().contains("error") && !group.toLowerCase().contains("bad")) {
                    if (isLikelyUsername(group.trim())) {
                        return group.trim();
                    }
                }
            }
        } catch (Exception e) {
            // Continue to fallback extraction
        }

        Pattern[] userPatterns = {
                Pattern.compile("User: ([^\\s\\(,]+)"),
                Pattern.compile("user=([^\\s,]+)"),
                Pattern.compile("user: ([^\\s,]+)"),
                Pattern.compile("Username: ([^\\s,]+)"),
                Pattern.compile("username=([^\\s,]+)"),
                Pattern.compile("email: ([^\\s,]+)"),
                Pattern.compile("Email: ([^\\s,]+)"),
                Pattern.compile("login attempt for user '([^']+)'"),
                Pattern.compile("Authentication failed for user: ([^\\s,]+)"),
                Pattern.compile("user '([^']+)'"),
                Pattern.compile("User '([^']+)'")
        };

        for (Pattern userPattern : userPatterns) {
            Matcher userMatcher = userPattern.matcher(logLine);
            if (userMatcher.find()) {
                String user = userMatcher.group(1).trim();
                if (!user.isEmpty() && !"null".equals(user) && isLikelyUsername(user)) {
                    return user;
                }
            }
        }

        return "unknown";
    }

    private boolean isValidIpAddress(String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return false;
        }

        String trimmedIp = ip.trim();

        if (trimmedIp.contains(":")) {
            return isValidIPv6(trimmedIp);
        }

        String[] parts = trimmedIp.split("\\.");
        if (parts.length != 4) {
            return false;
        }

        try {
            for (String part : parts) {
                int num = Integer.parseInt(part);
                if (num < 0 || num > 255) {
                    return false;
                }
            }
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private boolean isValidIPv6(String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return false;
        }

        String trimmedIp = ip.trim();

        // Handle special cases
        if ("::1".equals(trimmedIp) || "::".equals(trimmedIp)) {
            return true;
        }

        // Handle full IPv6 addresses like 0:0:0:0:0:0:0:1
        if (trimmedIp.matches("^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$")) {
            return true;
        }

        // Handle compressed IPv6 addresses
        if (trimmedIp.matches("^([0-9a-fA-F]{0,4}:){1,7}:$") ||
                trimmedIp.matches("^:([0-9a-fA-F]{0,4}:){1,7}$") ||
                trimmedIp.matches("^([0-9a-fA-F]{0,4}:){1,6}:[0-9a-fA-F]{0,4}$")) {
            return true;
        }

        // Basic validation for most common IPv6 patterns
        String[] parts = trimmedIp.split(":");
        if (parts.length > 8) {
            return false;
        }

        for (String part : parts) {
            if (!part.isEmpty() && !part.matches("^[0-9a-fA-F]{0,4}$")) {
                return false;
            }
        }

        return true;
    }

    private boolean isLikelyUsername(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }

        String trimmed = input.trim();

        // Exclude if it looks like an IP address
        if (isValidIpAddress(trimmed)) {
            return false;
        }

        // Exclude if it's purely numeric
        if (trimmed.matches("^\\d+$")) {
            return false;
        }

        // Exclude common non-username patterns
        if (trimmed.matches(".*\\.(exe|dll|bat|sh|log|txt|conf|config)$") ||
                trimmed.toLowerCase().contains("error") ||
                trimmed.toLowerCase().contains("failed") ||
                trimmed.toLowerCase().contains("bad") ||
                trimmed.toLowerCase().contains("req/sec") ||
                trimmed.toLowerCase().contains("mb") ||
                trimmed.toLowerCase().contains("gb") ||
                trimmed.length() > 50) {
            return false;
        }

        // Basic username pattern validation
        return trimmed.matches("^[a-zA-Z0-9._@-]+$") && trimmed.length() >= 2;
    }

    private List<String> getTodayLogFiles() {
        List<String> logFiles = new ArrayList<>();
        Path logsDir = Paths.get("logs");

        try {
            if (Files.exists(logsDir)) {
                Files.list(logsDir)
                        .filter(Files::isRegularFile)
                        .filter(path -> path.toString().endsWith(".log"))
                        .filter(path -> path.getFileName().toString().startsWith("security"))
                        .map(Path::toString)
                        .forEach(logFiles::add);
            }
        } catch (IOException e) {
            logger.error("ERROR_READING_LOG_DIRECTORY - Directory: {}, Error: {}", logsDir, e.getMessage());
        }

        return logFiles;
    }

    private List<String> getHistoricalLogFiles(LocalDate startDate, LocalDate endDate) {
        List<String> logFiles = new ArrayList<>();
        Path archivedDir = Paths.get("logs", "archived");

        try {
            if (Files.exists(archivedDir)) {
                Files.walk(archivedDir)
                        .filter(Files::isRegularFile)
                        .filter(path -> path.toString().endsWith(".log"))
                        .filter(path -> path.getFileName().toString().startsWith("security"))
                        .filter(path -> isDateInRange(path, startDate, endDate))
                        .map(Path::toString)
                        .forEach(logFiles::add);
            }
        } catch (IOException e) {
            logger.error("ERROR_READING_ARCHIVED_LOG_DIRECTORY - Directory: {}, Error: {}", archivedDir,
                    e.getMessage());
        }

        return logFiles;
    }

    private boolean isDateInRange(Path path, LocalDate startDate, LocalDate endDate) {
        String fileName = path.getFileName().toString();
        Pattern datePattern = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");
        Matcher matcher = datePattern.matcher(fileName);

        if (matcher.find()) {
            try {
                LocalDate fileDate = LocalDate.parse(matcher.group());
                return !fileDate.isBefore(startDate) && !fileDate.isAfter(endDate);
            } catch (Exception e) {
                logger.warn("DATE_PARSE_ERROR - Filename: {}, Error: {}", fileName, e.getMessage());
            }
        }

        return false;
    }

    // Comprehensive threat scan - now just calls individual detection methods
    public List<AlertResponse> runComprehensiveThreatScan() {
        return analyzeLogs(getTodayLogFiles());
    }

    public Map<String, Integer> getThreatStatistics() {
        List<AlertResponse> allAlerts = analyzeTodayLogs();

        return allAlerts.stream()
                .collect(Collectors.groupingBy(
                        AlertResponse::getAlertType,
                        Collectors.collectingAndThen(Collectors.counting(), Math::toIntExact)));
    }

    public List<AlertResponse> getHighSeverityAlerts() {
        List<AlertResponse> allAlerts = analyzeTodayLogs();

        return allAlerts.stream()
                .filter(alert -> "CRITICAL".equals(alert.getSeverity()) || "HIGH".equals(alert.getSeverity()))
                .sorted((a1, a2) -> {
                    int severityCompare = getSeverityWeight(a2.getSeverity()) - getSeverityWeight(a1.getSeverity());
                    if (severityCompare != 0) {
                        return severityCompare;
                    }
                    return a2.getTimestamp().compareTo(a1.getTimestamp());
                })
                .collect(Collectors.toList());
    }

    private int getSeverityWeight(String severity) {
        switch (severity) {
            case "CRITICAL":
                return 4;
            case "HIGH":
                return 3;
            case "MEDIUM":
                return 2;
            case "LOW":
                return 1;
            default:
                return 0;
        }
    }

    public List<String> getTopAttackingIPs() {
        List<AlertResponse> allAlerts = analyzeTodayLogs();

        Map<String, Long> ipCounts = allAlerts.stream()
                .filter(alert -> alert.getSourceIp() != null && !"unknown".equals(alert.getSourceIp()))
                .collect(Collectors.groupingBy(AlertResponse::getSourceIp, Collectors.counting()));

        return ipCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(entry -> entry.getKey() + " (" + entry.getValue() + " attacks)")
                .collect(Collectors.toList());
    }

    public void generateThreatReport() {
        Map<String, Integer> threatStats = getThreatStatistics();
        List<AlertResponse> highSeverityAlerts = getHighSeverityAlerts();
        List<String> topAttackingIPs = getTopAttackingIPs();

        logger.info(
                "THREAT_REPORT_GENERATED - ThreatTypes: {}, HighSeverityAlerts: {}, TopIPs: {}",
                threatStats.size(), highSeverityAlerts.size(), topAttackingIPs.size());
    }
}