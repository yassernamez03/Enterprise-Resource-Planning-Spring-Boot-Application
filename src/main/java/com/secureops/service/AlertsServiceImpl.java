package com.secureops.service;

import com.secureops.dto.AlertResponse;
import com.secureops.dto.IncidentResponse;
import com.secureops.dto.AlertSummaryResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private final Map<String, IncidentResponse> activeIncidents = new ConcurrentHashMap<>();

    // BRUTE FORCE ATTACK PATTERNS
    private static final Pattern[] BRUTE_FORCE_PATTERNS = {
            // Pattern.compile("ERROR.*Authentication failed for user: ([^\\s]+).*Bad
            // credentials",
            // Pattern.CASE_INSENSITIVE),
            // Pattern.compile("WARN.*Failed login attempt for user '([^']+)': Bad
            // credentials", Pattern.CASE_INSENSITIVE),
            // Pattern.compile("ERROR.*Login error - email: ([^,]+), IP: ([^,]+), Error:
            // (.+)", Pattern.CASE_INSENSITIVE),
            // Pattern.compile("INFO.*AUTHENTICATION_FAILURE.*user=([^\\s]+).*ip=([\\d.:]+)",
            // Pattern.CASE_INSENSITIVE),
            // Pattern.compile("ERROR.*Invalid username or password.*User: ([^\\s]+).*IP:
            // ([\\d.:]+)",
            // Pattern.CASE_INSENSITIVE),
            // Pattern.compile("WARN.*Multiple failed login attempts.*Username:
            // ([^\\s]+).*Source: ([\\d.:]+)",
            // Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Account locked.*User: ([^\\s]+).*IP: ([\\d.:]+).*Reason: Too many failed attempts",
                    Pattern.CASE_INSENSITIVE),
            // Pattern.compile("INFO.*SSH.*authentication failure.*user=([^\\s]+).*rhost=([\\d.:]+)",
            //         Pattern.CASE_INSENSITIVE),
            // Pattern.compile("ERROR.*LDAP authentication failed.*user=([^\\s]+).*client=([\\d.:]+)",
            //         Pattern.CASE_INSENSITIVE)
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
            Pattern.compile("ERROR.*Privilege escalation attempt.*User: ([^\\s]+).*Target: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            // Updated pattern to match your log format
            Pattern.compile("ERROR.*UNAUTHORIZED_ADMIN_ACCESS.*User: ([^,]+).*IP: ([^,]+).*Details:", 
                    Pattern.CASE_INSENSITIVE),
            // Alternative pattern that's more flexible
            // Pattern.compile("ERROR.*UNAUTHORIZED_ADMIN_ACCESS.*User: ([^\\(]+).*\\(ID: \\d+\\).*IP: ([^,]+)", 
            //         Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Sudo violation.*User: ([^\\s]+).*Command: ([^\\n]+).*Host: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile(
                    "WARN.*Role elevation detected.*From: ([^\\s]+).*To: ([^\\s]+).*User: ([^\\s]+).*IP: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("ERROR.*Root access attempt.*User: ([^\\s]+).*Method: ([^\\s]+).*Source: ([\\d.:]+)",
                    Pattern.CASE_INSENSITIVE)
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

    // Add this method to AlertsServiceImpl class
    @Override
    public List<AlertResponse> getAllAlerts() {
        System.out.println("---------- Starting getAllAlerts ----------");

        // Get today's alerts
        List<AlertResponse> allAlerts = new ArrayList<>(analyzeTodayLogs());

        // Optionally, you can also include recent historical alerts
        LocalDate sevenDaysAgo = LocalDate.now().minusDays(Integer.MAX_VALUE);
        LocalDate yesterday = LocalDate.now().minusDays(1);
        allAlerts.addAll(analyzeHistoricalLogs(sevenDaysAgo, yesterday));

        // Remove duplicates based on alert ID and sort by timestamp (newest first)
        List<AlertResponse> uniqueAlerts = allAlerts.stream()
                .distinct()
                .sorted((a1, a2) -> a2.getTimestamp().compareTo(a1.getTimestamp()))
                .collect(Collectors.toList());

        System.out.println("---------- getAllAlerts completed with " + uniqueAlerts.size() + " alerts ----------");
        return uniqueAlerts;
    }

    @Override
    public List<AlertResponse> analyzeTodayLogs() {
        System.out.println("---------- Starting analyzeTodayLogs ----------");
        List<AlertResponse> alerts = analyzeLogs(getTodayLogFiles());
        System.out.println("---------- analyzeTodayLogs completed with " + alerts.size() + " alerts ----------");
        return alerts;
    }

    @Override
    public List<AlertResponse> analyzeHistoricalLogs(LocalDate startDate, LocalDate endDate) {
        System.out.println(
                "---------- Starting analyzeHistoricalLogs from " + startDate + " to " + endDate + " ----------");
        List<AlertResponse> alerts = analyzeLogs(getHistoricalLogFiles(startDate, endDate));
        System.out.println("---------- analyzeHistoricalLogs completed with " + alerts.size() + " alerts ----------");
        return alerts;
    }

    @Override
    public List<IncidentResponse> getActiveIncidents() {
        System.out.println("---------- Getting active incidents: " + activeIncidents.size() + " ----------");
        return new ArrayList<>(activeIncidents.values());
    }

    @Override
    public AlertSummaryResponse getAlertSummary() {
        System.out.println("---------- Starting getAlertSummary ----------");
        List<AlertResponse> todayAlerts = analyzeTodayLogs();

        Map<String, Long> alertCounts = todayAlerts.stream()
                .collect(Collectors.groupingBy(AlertResponse::getSeverity, Collectors.counting()));

        System.out.println("---------- Alert counts by severity: " + alertCounts + " ----------");

        AlertSummaryResponse summary = AlertSummaryResponse.builder()
                .totalAlerts(todayAlerts.size())
                .criticalAlerts(alertCounts.getOrDefault("CRITICAL", 0L).intValue())
                .highAlerts(alertCounts.getOrDefault("HIGH", 0L).intValue())
                .mediumAlerts(alertCounts.getOrDefault("MEDIUM", 0L).intValue())
                .lowAlerts(alertCounts.getOrDefault("LOW", 0L).intValue())
                .activeIncidents(activeIncidents.size())
                .lastUpdated(LocalDateTime.now())
                .build();

        System.out.println("---------- getAlertSummary completed ----------");
        return summary;
    }

    @Override
    public void resolveIncident(String incidentId) {
        System.out.println("---------- Resolving incident: " + incidentId + " ----------");
        IncidentResponse incident = activeIncidents.remove(incidentId);
        if (incident != null) {
            logger.info("INCIDENT_RESOLVED - IncidentID: {}, Title: {}", incidentId, incident.getTitle());
            System.out.println("---------- Incident resolved successfully: " + incident.getTitle() + " ----------");
        } else {
            System.out.println("---------- Incident not found: " + incidentId + " ----------");
        }
    }

    @Override
    public List<AlertResponse> detectBruteForceAttempts() {
        System.out.println("---------- Starting detectBruteForceAttempts ----------");
        return detectThreatPattern("BRUTE_FORCE", BRUTE_FORCE_PATTERNS, 3, "CRITICAL",
                "Brute Force Attack Detected", "Multiple failed login attempts detected");
    }

    @Override
    public List<AlertResponse> detectDataExfiltration() {
        System.out.println("---------- Starting detectDataExfiltration ----------");
        return detectThreatPattern("DATA_EXFILTRATION", DATA_EXFILTRATION_PATTERNS, 5, "HIGH",
                "Potential Data Exfiltration", "Suspicious data transfer activity detected");
    }

    public List<AlertResponse> detectPathTraversal() {
        System.out.println("---------- Starting detectPathTraversal ----------");
        return detectThreatPattern("PATH_TRAVERSAL", PATH_TRAVERSAL_PATTERNS, 2, "HIGH",
                "Path Traversal Attack", "Directory traversal attempts detected");
    }

    public List<AlertResponse> detectRemoteCodeExecution() {
        System.out.println("---------- Starting detectRemoteCodeExecution ----------");
        return detectThreatPattern("RCE", RCE_PATTERNS, 1, "CRITICAL",
                "Remote Code Execution Attempt", "Code injection attempts detected");
    }

    public List<AlertResponse> detectLocalFileInclusion() {
        System.out.println("---------- Starting detectLocalFileInclusion ----------");
        return detectThreatPattern("LFI", LFI_PATTERNS, 2, "HIGH",
                "Local File Inclusion Attack", "File inclusion attempts detected");
    }

    public List<AlertResponse> detectSqlInjection() {
        System.out.println("---------- Starting detectSqlInjection ----------");
        return detectThreatPattern("SQL_INJECTION", SQL_INJECTION_PATTERNS, 1, "CRITICAL",
                "SQL Injection Attack", "Database injection attempts detected");
    }

    public List<AlertResponse> detectXssAttempts() {
        System.out.println("---------- Starting detectXssAttempts ----------");
        return detectThreatPattern("XSS", XSS_PATTERNS, 2, "HIGH",
                "Cross-Site Scripting Attack", "Script injection attempts detected");
    }

    public List<AlertResponse> detectMalware() {
        System.out.println("---------- Starting detectMalware ----------");
        return detectThreatPattern("MALWARE", MALWARE_PATTERNS, 1, "CRITICAL",
                "Malware Detected", "Malicious software activity detected");
    }

    public List<AlertResponse> detectDdosAttempts() {
        System.out.println("---------- Starting detectDdosAttempts ----------");
        return detectThreatPattern("DDOS", DDOS_PATTERNS, 10, "HIGH",
                "DDoS Attack Detected", "Distributed denial of service activity detected");
    }

    public List<AlertResponse> detectPrivilegeEscalation() {
        System.out.println("---------- Starting detectPrivilegeEscalation ----------");
        return detectThreatPattern("PRIVILEGE_ESCALATION", PRIVILEGE_ESCALATION_PATTERNS, 1, "CRITICAL",
                "Privilege Escalation Attempt", "Unauthorized privilege elevation detected");
    }

    public List<AlertResponse> detectUnauthorizedAccess() {
        System.out.println("---------- Starting detectUnauthorizedAccess ----------");
        return detectThreatPattern("UNAUTHORIZED_ACCESS", UNAUTHORIZED_ACCESS_PATTERNS, 3, "HIGH",
                "Unauthorized Access Attempt", "Unauthorized resource access attempts detected");
    }

    private List<AlertResponse> detectThreatPattern(String threatType, Pattern[] patterns, int threshold,
            String severity, String title, String description) {
        List<String> logFiles = getTodayLogFiles();
        Map<String, List<AlertResponse>> ipAttempts = new HashMap<>();

        for (String logFile : logFiles) {
            System.out.println("---------- Analyzing file for " + threatType + ": " + logFile + " ----------");

            for (Pattern pattern : patterns) {
                List<AlertResponse> alerts = analyzeLogFile(logFile, pattern, threatType);
                for (AlertResponse alert : alerts) {
                    String ip = extractIpFromAlert(alert);
                    ipAttempts.computeIfAbsent(ip, k -> new ArrayList<>()).add(alert);
                }
            }
        }

        List<AlertResponse> threatAlerts = new ArrayList<>();
        for (Map.Entry<String, List<AlertResponse>> entry : ipAttempts.entrySet()) {
            int attemptCount = entry.getValue().size();
            System.out.println("---------- IP " + entry.getKey() + " has " + attemptCount + " " + threatType
                    + " attempts ----------");

            if (attemptCount >= threshold) {
                String incidentId = UUID.randomUUID().toString();
                AlertResponse alert = AlertResponse.builder()
                        .id(UUID.randomUUID().toString())
                        .title(title)
                        .description(description + " from IP: " + entry.getKey())
                        .severity(severity)
                        .sourceIp(entry.getKey())
                        .timestamp(LocalDateTime.now())
                        .alertType(threatType)
                        .details("Attempts: " + attemptCount)
                        .build();

                threatAlerts.add(alert);
                logger.info("{}_DETECTED - IP: {}, Attempts: {}, IncidentID: {}",
                        threatType, entry.getKey(), attemptCount, incidentId);

                // Create incident
                IncidentResponse incident = createIncident(incidentId, title, description,
                        entry.getKey(), severity, threatType, attemptCount);
                activeIncidents.put(incidentId, incident);

                System.out.println(
                        "---------- Created " + threatType + " incident for IP: " + entry.getKey() + " ----------");
            }
        }

        System.out.println(
                "---------- " + threatType + " detection completed with " + threatAlerts.size() + " alerts ----------");
        return threatAlerts;
    }

    private IncidentResponse createIncident(String incidentId, String title, String description,
            String sourceIp, String severity, String threatType, int attemptCount) {
        List<String> recommendedActions = getRecommendedActions(threatType, sourceIp);
        List<String> affectedSystems = getAffectedSystems(threatType);

        System.out
                .println("---------- Creating incident for " + threatType + " with ID: " + incidentId + " ----------");

        return IncidentResponse.builder()
                .id(incidentId)
                .title(title + " - " + sourceIp)
                .description(description + " from IP: " + sourceIp + " with " + attemptCount + " attempts")
                .severity(severity)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .affectedSystems(affectedSystems)
                .recommendedActions(recommendedActions)
                .build();
    }

    private List<String> getRecommendedActions(String threatType, String sourceIp) {
        List<String> actions = new ArrayList<>();
        actions.add("Block IP address: " + sourceIp);

        switch (threatType) {
            case "BRUTE_FORCE":
                actions.addAll(Arrays.asList(
                        "Review authentication logs",
                        "Implement rate limiting",
                        "Enable account lockout policies",
                        "Consider multi-factor authentication"));
                break;
            case "DATA_EXFILTRATION":
                actions.addAll(Arrays.asList(
                        "Review user access permissions",
                        "Audit downloaded files",
                        "Monitor data loss prevention systems",
                        "Contact user for verification"));
                break;
            case "PATH_TRAVERSAL":
                actions.addAll(Arrays.asList(
                        "Review application input validation",
                        "Update web application firewall rules",
                        "Patch application vulnerabilities",
                        "Implement file access controls"));
                break;
            case "RCE":
                actions.addAll(Arrays.asList(
                        "Immediately patch vulnerable applications",
                        "Review server configurations",
                        "Implement input sanitization",
                        "Monitor system processes"));
                break;
            case "SQL_INJECTION":
                actions.addAll(Arrays.asList(
                        "Review database query implementations",
                        "Implement prepared statements",
                        "Update database security policies",
                        "Monitor database access logs"));
                break;
            case "XSS":
                actions.addAll(Arrays.asList(
                        "Review input validation and output encoding",
                        "Update content security policies",
                        "Implement XSS protection headers",
                        "Audit web application code"));
                break;
            case "MALWARE":
                actions.addAll(Arrays.asList(
                        "Quarantine affected systems",
                        "Run full system scan",
                        "Update antivirus signatures",
                        "Restore from clean backup if necessary"));
                break;
            case "DDOS":
                actions.addAll(Arrays.asList(
                        "Implement traffic filtering",
                        "Scale server resources",
                        "Contact ISP for mitigation",
                        "Monitor network capacity"));
                break;
            case "PRIVILEGE_ESCALATION":
                actions.addAll(Arrays.asList(
                        "Review user permissions",
                        "Audit system configurations",
                        "Implement least privilege principle",
                        "Monitor administrative activities"));
                break;
            default:
                actions.addAll(Arrays.asList(
                        "Review security logs",
                        "Update security policies",
                        "Monitor system activities"));
        }
        return actions;
    }

    private List<String> getAffectedSystems(String threatType) {
        switch (threatType) {
            case "BRUTE_FORCE":
                return Arrays.asList("Authentication System", "User Management");
            case "DATA_EXFILTRATION":
                return Arrays.asList("File Management System", "Database", "Network Storage");
            case "PATH_TRAVERSAL":
            case "LFI":
                return Arrays.asList("Web Application", "File System");
            case "RCE":
                return Arrays.asList("Application Server", "Operating System");
            case "SQL_INJECTION":
                return Arrays.asList("Database Server", "Web Application");
            case "XSS":
                return Arrays.asList("Web Application", "User Browser");
            case "MALWARE":
                return Arrays.asList("Endpoints", "File System", "Network");
            case "DDOS":
                return Arrays.asList("Network Infrastructure", "Web Servers");
            case "PRIVILEGE_ESCALATION":
                return Arrays.asList("Operating System", "Access Control");
            case "UNAUTHORIZED_ACCESS":
                return Arrays.asList("Access Control", "Protected Resources");
            default:
                return Arrays.asList("System");
        }
    }

    private List<AlertResponse> analyzeLogs(List<String> logFiles) {
        System.out.println("---------- Starting analyzeLogs with " + logFiles.size() + " files ----------");
        List<AlertResponse> allAlerts = new ArrayList<>();

        for (String logFile : logFiles) {
            System.out.println("---------- Analyzing log file: " + logFile + " ----------");

            // Analyze all threat patterns
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

        System.out.println("---------- analyzeLogs completed with " + allAlerts.size() + " total alerts ----------");
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
                        // Enhanced System.out.println when alert is found
                        System.out.println("ALERT FOUND - Type: " + alertType +
                                ", User: " + finalUser +
                                ", IP: " + finalIp +
                                ", Severity: " + alert.getSeverity() +
                                ", Details: " + alert.getDetails());
                        logger.info("ALERT_CREATED - Type: {}, User: {}, IP: {}, File: {}, Line: {}",
                                alertType, finalUser, finalIp, logFilePath, lineNumber);
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
                    .sourceIp(extractedIp); // Set IP directly from matcher

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
        // Extract timestamp from log line format: "2025-06-06 12:30:06"
        Pattern timestampPattern = Pattern.compile("(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})");
        Matcher matcher = timestampPattern.matcher(logLine);
        return matcher.find() ? matcher.group(1)
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private String extractIpFromAlert(AlertResponse alert) {
        if (alert.getSourceIp() != null && !alert.getSourceIp().isEmpty() && !"unknown".equals(alert.getSourceIp())) {
            return alert.getSourceIp();
        }

        // Extract IP from details string
        String details = alert.getDetails();
        if (details == null || details.isEmpty()) {
            return "unknown";
        }

        // Prioritize the exact format: IP: {ipv4 or ipv6}
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

        // Enhanced user extraction patterns
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
        // Try to extract IP from different group positions first
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

        // Fallback: extract IP from log line using the specific format: IP: {ipv4 or
        // ipv6}
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
        // Try to extract user from different group positions first
        try {
            for (int i = 1; i <= matcher.groupCount(); i++) {
                String group = matcher.group(i);
                if (group != null && !group.trim().isEmpty() &&
                        !isValidIpAddress(group) && !group.matches("\\d+") &&
                        !group.contains("req/sec") && !group.contains("MB") &&
                        !group.toLowerCase().contains("error") && !group.toLowerCase().contains("bad")) {
                    // Additional validation to ensure it's likely a username
                    if (isLikelyUsername(group.trim())) {
                        return group.trim();
                    }
                }
            }
        } catch (Exception e) {
            // Continue to fallback extraction
        }

        // Fallback: extract user from log line using multiple patterns
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

        // Check for IPv6 addresses (including localhost ::1 and 0:0:0:0:0:0:0:1)
        if (trimmedIp.contains(":")) {
            return isValidIPv6(trimmedIp);
        }

        // Check for IPv4 addresses
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
        System.out.println("---------- Getting today's log files ----------");
        List<String> logFiles = new ArrayList<>();
        Path logsDir = Paths.get("logs");

        try {
            if (Files.exists(logsDir)) {
                Files.list(logsDir)
                        .filter(Files::isRegularFile)
                        .filter(path -> path.toString().endsWith(".log"))
                        .filter(path -> path.getFileName().toString().startsWith("security"))
                        .map(Path::toString)
                        .forEach(logFile -> {
                            logFiles.add(logFile);
                            System.out.println("---------- Found log file: " + logFile + " ----------");
                        });
            } else {
                System.out.println("---------- Logs directory does not exist: " + logsDir + " ----------");
            }
        } catch (IOException e) {
            logger.error("ERROR_READING_LOG_DIRECTORY - Directory: {}, Error: {}", logsDir, e.getMessage());
            System.out.println("---------- Error reading log directory: " + e.getMessage() + " ----------");
        }

        System.out.println("---------- Found " + logFiles.size() + " log files ----------");
        return logFiles;
    }

    private List<String> getHistoricalLogFiles(LocalDate startDate, LocalDate endDate) {
        System.out.println(
                "---------- Getting historical log files from " + startDate + " to " + endDate + " ----------");
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
                        .forEach(logFile -> {
                            logFiles.add(logFile);
                            System.out.println("---------- Found historical log file: " + logFile + " ----------");
                        });
            } else {
                System.out.println("---------- Archived logs directory does not exist: " + archivedDir + " ----------");
            }
        } catch (IOException e) {
            logger.error("ERROR_READING_ARCHIVED_LOG_DIRECTORY - Directory: {}, Error: {}", archivedDir,
                    e.getMessage());
            System.out.println("---------- Error reading archived log directory: " + e.getMessage() + " ----------");
        }

        System.out.println("---------- Found " + logFiles.size() + " historical log files ----------");
        return logFiles;
    }

    private boolean isDateInRange(Path path, LocalDate startDate, LocalDate endDate) {
        String fileName = path.getFileName().toString();
        // Assuming log files are named with date pattern like "app-2024-01-01.log"
        Pattern datePattern = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");
        Matcher matcher = datePattern.matcher(fileName);

        if (matcher.find()) {
            try {
                LocalDate fileDate = LocalDate.parse(matcher.group());
                boolean inRange = !fileDate.isBefore(startDate) && !fileDate.isAfter(endDate);
                System.out.println(
                        "---------- File " + fileName + " date " + fileDate + " in range: " + inRange + " ----------");
                return inRange;
            } catch (Exception e) {
                logger.warn("DATE_PARSE_ERROR - Filename: {}, Error: {}", fileName, e.getMessage());
                System.out.println("---------- Could not parse date from filename: " + fileName + " ----------");
            }
        }

        return false;
    }

    // Additional comprehensive threat detection methods
    public List<AlertResponse> runComprehensiveThreatScan() {
        System.out.println("---------- Starting comprehensive threat scan ----------");
        List<AlertResponse> allThreats = new ArrayList<>();

        // Run all threat detection methods
        allThreats.addAll(detectBruteForceAttempts());
        allThreats.addAll(detectDataExfiltration());
        allThreats.addAll(detectPathTraversal());
        allThreats.addAll(detectRemoteCodeExecution());
        allThreats.addAll(detectLocalFileInclusion());
        allThreats.addAll(detectSqlInjection());
        allThreats.addAll(detectXssAttempts());
        allThreats.addAll(detectMalware());
        allThreats.addAll(detectDdosAttempts());
        allThreats.addAll(detectPrivilegeEscalation());
        allThreats.addAll(detectUnauthorizedAccess());

        System.out.println("---------- Comprehensive threat scan completed with " + allThreats.size()
                + " total threats ----------");
        return allThreats;
    }

    public Map<String, Integer> getThreatStatistics() {
        System.out.println("---------- Generating threat statistics ----------");
        List<AlertResponse> allAlerts = analyzeTodayLogs();

        Map<String, Integer> stats = allAlerts.stream()
                .collect(Collectors.groupingBy(
                        AlertResponse::getAlertType,
                        Collectors.collectingAndThen(Collectors.counting(), Math::toIntExact)));

        System.out.println("---------- Threat statistics: " + stats + " ----------");
        return stats;
    }

    public List<AlertResponse> getHighSeverityAlerts() {
        System.out.println("---------- Getting high severity alerts ----------");
        List<AlertResponse> allAlerts = analyzeTodayLogs();

        List<AlertResponse> highSeverityAlerts = allAlerts.stream()
                .filter(alert -> "CRITICAL".equals(alert.getSeverity()) || "HIGH".equals(alert.getSeverity()))
                .sorted((a1, a2) -> {
                    // Sort by severity (CRITICAL first, then HIGH) and then by timestamp
                    int severityCompare = getSeverityWeight(a2.getSeverity()) - getSeverityWeight(a1.getSeverity());
                    if (severityCompare != 0) {
                        return severityCompare;
                    }
                    return a2.getTimestamp().compareTo(a1.getTimestamp());
                })
                .collect(Collectors.toList());

        System.out.println("---------- Found " + highSeverityAlerts.size() + " high severity alerts ----------");
        return highSeverityAlerts;
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
        System.out.println("---------- Getting top attacking IPs ----------");
        List<AlertResponse> allAlerts = analyzeTodayLogs();

        Map<String, Long> ipCounts = allAlerts.stream()
                .filter(alert -> alert.getSourceIp() != null && !"unknown".equals(alert.getSourceIp()))
                .collect(Collectors.groupingBy(AlertResponse::getSourceIp, Collectors.counting()));

        List<String> topIPs = ipCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(entry -> entry.getKey() + " (" + entry.getValue() + " attacks)")
                .collect(Collectors.toList());

        System.out.println("---------- Top attacking IPs: " + topIPs + " ----------");
        return topIPs;
    }

    public void generateThreatReport() {
        System.out.println("---------- Generating comprehensive threat report ----------");

        Map<String, Integer> threatStats = getThreatStatistics();
        List<AlertResponse> highSeverityAlerts = getHighSeverityAlerts();
        List<String> topAttackingIPs = getTopAttackingIPs();
        int activeIncidentCount = activeIncidents.size();

        logger.info(
                "THREAT_REPORT_GENERATED - ThreatTypes: {}, HighSeverityAlerts: {}, TopIPs: {}, ActiveIncidents: {}",
                threatStats.size(), highSeverityAlerts.size(), topAttackingIPs.size(), activeIncidentCount);

        System.out.println("---------- THREAT REPORT ----------");
        System.out.println("Threat Statistics: " + threatStats);
        System.out.println("High Severity Alerts: " + highSeverityAlerts.size());
        System.out.println("Top Attacking IPs: " + topAttackingIPs);
        System.out.println("Active Incidents: " + activeIncidentCount);
        System.out.println("---------- END THREAT REPORT ----------");
    }
}