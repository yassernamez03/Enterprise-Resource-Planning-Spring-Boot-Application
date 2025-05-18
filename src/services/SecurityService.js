// This is a mock service that simulates fetching security data from an API
// In a real application, this would connect to your backend services

const SecurityService = {
  // Fetch security overview data
  getSecurityOverview: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return mock data
    return {
      securityScore: 87,
      activeSessions: 42,
      pendingAlerts: 3,
      vulnerabilities: {
        critical: 1,
        high: 2,
        medium: 5,
        low: 8,
      },
      lastScan: new Date().toISOString(),
      complianceStatus: {
        passed: 18,
        failed: 2,
        warning: 3,
      },
      twoFactorStatus: {
        enabled: 38,
        disabled: 12,
        percentage: 76,
      },
    };
  },
  
  // Fetch security alerts
  getSecurityAlerts: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock alerts data
    return [
      {
        id: "alert-001",
        title: "Unusual Login Pattern Detected",
        severity: "high",
        status: "pending",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        source: "Authentication System",
        description: "Multiple failed login attempts followed by a successful login from an unusual location.",
        affectedSystems: "User auth-id:45872",
        recommendedAction: "Verify the account activity with the user and reset password if necessary.",
        technicalDetails: `
{
  "userId": "user-45872",
  "ipAddress": "198.51.100.234",
  "country": "Russia",
  "previousLoginCountry": "United States",
  "failedAttempts": 5,
  "timeSpan": "10 minutes"
}`,
      },
      {
        id: "alert-002",
        title: "Potential Data Exfiltration",
        severity: "critical",
        status: "pending",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        source: "Data Loss Prevention",
        description: "Large amount of sensitive data accessed and downloaded in a short time period.",
        affectedSystems: "Customer Database",
        recommendedAction: "Suspend the user account immediately and investigate the activity.",
        technicalDetails: `
{
  "userId": "user-28456",
  "dataAccessed": "customer_pii_table",
  "recordsAccessed": 1458,
  "downloadSize": "24.7 MB",
  "accessPattern": "sequential, automated",
  "timeFrame": "3 minutes"
}`,
      },
      {
        id: "alert-003",
        title: "Configuration Change Without Approval",
        severity: "medium",
        status: "pending",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        source: "Configuration Management",
        description: "Security-critical configuration was changed without going through the approval process.",
        affectedSystems: "API Gateway",
        recommendedAction: "Review the changes and restore the previous configuration if needed.",
        technicalDetails: `
{
  "userId": "user-12345",
  "configFile": "/etc/api-gateway/security.conf",
  "changes": [
    {
      "type": "modification",
      "line": 124,
      "previous": "rate_limit: 100",
      "new": "rate_limit: 0"
    },
    {
      "type": "deletion",
      "line": 126,
      "previous": "require_auth: true"
    }
  ]
}`,
      },
      {
        id: "alert-004",
        title: "Suspicious File Upload",
        severity: "medium",
        status: "resolved",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        source: "File Upload Scanner",
        description: "Potentially malicious file uploaded to the document storage system.",
        affectedSystems: "Document Repository",
        recommendedAction: "Remove the file and scan the system for any signs of compromise.",
        technicalDetails: `
{
  "userId": "user-39541",
  "fileName": "report_q2_2025.pdf.exe",
  "fileType": "application/x-msdownload",
  "fileSize": "1.2 MB",
  "checksumMatch": "Matches known malware (Trojan.GenericKD.45218356)",
  "uploadIP": "203.0.113.42"
}`,
      },
      {
        id: "alert-005",
        title: "API Rate Limit Exceeded",
        severity: "low",
        status: "resolved",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        source: "API Gateway",
        description: "A user exceeded API rate limits, which could indicate scraping or automated attacks.",
        affectedSystems: "Public API",
        recommendedAction: "Monitor the account for further suspicious activity and adjust rate limits if necessary.",
        technicalDetails: `
{
  "userId": "api-user-5671",
  "endpoint": "/api/v1/products",
  "requestCount": 1245,
  "timeWindow": "5 minutes",
  "normalUsagePattern": "avg 50 requests per 5 minutes"
}`,
      }
    ];
  },
  
  // Resolve a security alert
  resolveAlert: async (alertId) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // Would normally send a request to update alert status
    return { success: true };
  },
  
  // Ignore a security alert
  ignoreAlert: async (alertId) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // Would normally send a request to update alert status
    return { success: true };
  },
  
  // Get user activities for monitoring
  getUserActivities: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Return mock user activity data
    return [
      {
        id: "act-001",
        userName: "john.smith",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        action: "Logged in successfully",
        category: "auth",
        ipAddress: "203.0.113.45", 
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        location: "San Francisco, CA",
        riskLevel: "low",
        flags: []
      },
      {
        id: "act-002",
        userName: "admin.user",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        action: "Exported customer data (1,458 records)",
        category: "data",
        ipAddress: "198.51.100.67",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        location: "New York, NY",
        riskLevel: "high",
        flags: [
          "Unusual data export volume",
          "First time performing this action",
          "Outside of normal business hours"
        ]
      },
      {
        id: "act-003",
        userName: "maria.johnson",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        action: "Changed user role permissions",
        category: "admin",
        ipAddress: "192.0.2.12",
        userAgent: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:95.0)",
        location: "Chicago, IL",
        riskLevel: "medium",
        flags: [
          "Multiple permission changes in short time"
        ]
      },
      {
        id: "act-004",
        userName: "david.wilson",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        action: "Failed login attempt (5 consecutive failures)",
        category: "auth",
        ipAddress: "203.0.113.101",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X)",
        location: "Berlin, Germany",
        riskLevel: "high",
        flags: [
          "Multiple failed login attempts",
          "Login from unusual location",
          "Login from new device"
        ]
      },
      {
        id: "act-005",
        userName: "susan.brown",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        action: "Accessed sensitive financial documents",
        category: "data",
        ipAddress: "192.0.2.87",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        location: "Los Angeles, CA",
        riskLevel: "low",
        flags: []
      }
    ];
  },
  
  // Get compliance data
  getComplianceData: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 900));
    
    // Return mock compliance data
    return {
      frameworks: {
        gdpr: {
          score: 92,
          lastAssessment: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          passingControls: 45,
          totalControls: 49,
          categories: [
            { name: "Data Protection", compliance: 95 },
            { name: "User Consent", compliance: 90 },
            { name: "Data Access", compliance: 85 },
            { name: "Data Retention", compliance: 95 },
            { name: "Breach Notification", compliance: 100 },
            { name: "Data Processing", compliance: 92 },
          ],
        },
        hipaa: {
          score: 88,
          lastAssessment: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          passingControls: 62,
          totalControls: 70,
          categories: [
            { name: "Privacy Rule", compliance: 90 },
            { name: "Security Rule", compliance: 85 },
            { name: "Breach Notification", compliance: 100 },
            { name: "Access Controls", compliance: 80 },
            { name: "Risk Assessment", compliance: 90 },
            { name: "Data Encryption", compliance: 85 },
          ],
        },
        soc2: {
          score: 94,
          lastAssessment: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          passingControls: 112,
          totalControls: 118,
          categories: [
            { name: "Security", compliance: 95 },
            { name: "Availability", compliance: 92 },
            { name: "Processing Integrity", compliance: 96 },
            { name: "Confidentiality", compliance: 94 },
            { name: "Privacy", compliance: 90 },
          ],
        },
      },
      recentReports: [
        {
          id: "rep-001",
          name: "GDPR Quarterly Audit",
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          format: "PDF",
          size: "3.2 MB"
        },
        {
          id: "rep-002",
          name: "HIPAA Compliance Check",
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          format: "PDF",
          size: "2.8 MB"
        },
        {
          id: "rep-003",
          name: "SOC2 Annual Assessment",
          date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          format: "PDF",
          size: "5.1 MB"
        }
      ]
    };
  },
  
  // Get vulnerability data
  getVulnerabilityData: async (timeRange = "30days") => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Return mock vulnerability data
    return {
      summary: {
        total: 16,
        critical: 1,
        high: 2,
        medium: 5,
        low: 8,
        open: 10,
        inProgress: 4,
        resolved: 2,
      },
      lastScan: new Date().toISOString(),
      vulnerabilities: [
        {
          id: "vuln-001",
          title: "Critical SQL Injection Vulnerability",
          severity: "critical",
          cvss: 9.8,
          status: "open",
          discovered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          affected: "API Server",
          description: "A SQL injection vulnerability was discovered in the user authentication endpoint that could allow an attacker to bypass authentication and access sensitive data.",
          remediation: "Update the ORM layer to use parameterized queries and implement input validation on all user-supplied data.",
          references: ["CVE-2025-1234", "OWASP Top 10: A1 - Injection"],
        },
        {
          id: "vuln-002",
          title: "Insecure Direct Object Reference",
          severity: "high",
          cvss: 8.4,
          status: "open",
          discovered: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          affected: "User Profile Module",
          description: "An IDOR vulnerability allows unauthorized users to access profile data of other users by manipulating resource IDs in requests.",
          remediation: "Implement proper authorization checks for all user data access and use indirect reference maps.",
          references: ["OWASP Top 10: A01:2021 – Broken Access Control"],
        },
        {
          id: "vuln-003",
          title: "Cross-Site Scripting (XSS)",
          severity: "high",
          cvss: 7.5,
          status: "in progress",
          discovered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          affected: "Comments Feature",
          description: "A stored XSS vulnerability exists in the comments section allowing attackers to inject malicious scripts that execute when other users view comments.",
          remediation: "Implement proper output encoding and Content Security Policy (CSP) headers.",
          references: ["OWASP Top 10: A07:2021 - Cross-Site Scripting"],
        },
        {
          id: "vuln-004",
          title: "Outdated Cryptographic Standards",
          severity: "medium",
          cvss: 5.3,
          status: "open",
          discovered: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
          affected: "Authentication System",
          description: "The system uses outdated cryptographic algorithms (MD5) for password storage, which are considered insecure by modern standards.",
          remediation: "Update password hashing to use bcrypt or Argon2 with proper salting.",
          references: ["OWASP Top 10: A02:2021 – Cryptographic Failures"],
        },
        {
          id: "vuln-005",
          title: "Insecure Dependency",
          severity: "medium",
          cvss: 6.1,
          status: "open",
          discovered: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          affected: "Frontend Framework",
          description: "One of the frontend dependencies has a known security vulnerability that could lead to data exposure.",
          remediation: "Update the dependency to the latest version or find an alternative solution.",
          references: ["CVE-2025-5678", "OWASP Top 10: A06:2021 – Vulnerable and Outdated Components"],
        },
        {
          id: "vuln-006",
          title: "Missing Rate Limiting",
          severity: "medium",
          cvss: 5.9,
          status: "in progress",
          discovered: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          affected: "Authentication API",
          description: "The login endpoint doesn't implement proper rate limiting, which makes it vulnerable to brute force attacks.",
          remediation: "Implement rate limiting and account lockout policies after multiple failed attempts.",
          references: ["OWASP API Security Top 10: API4:2019 - Lack of Resources & Rate Limiting"],
        },
        {
          id: "vuln-007",
          title: "Improper Error Handling",
          severity: "low",
          cvss: 3.7,
          status: "open",
          discovered: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          affected: "Multiple API Endpoints",
          description: "Detailed error messages are being returned to clients, potentially exposing sensitive information about the application's implementation.",
          remediation: "Implement global error handling that returns generic error messages to clients while logging detailed information server-side.",
          references: ["OWASP Top 10: A10:2021 – Server-Side Request Forgery"],
        }
      ],
      trendData: [
        { 
          date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
          critical: 2, 
          high: 3, 
          medium: 6, 
          low: 10 
        },
        { 
          date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          critical: 2, 
          high: 3, 
          medium: 7, 
          low: 9 
        },
        { 
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          critical: 1, 
          high: 4, 
          medium: 6, 
          low: 8 
        },
        { 
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          critical: 1, 
          high: 2, 
          medium: 5, 
          low: 8 
        },
        { 
          date: new Date().toISOString(),
          critical: 1, 
          high: 2, 
          medium: 5, 
          low: 8 
        },
      ]
    };
  }
};

export default SecurityService;