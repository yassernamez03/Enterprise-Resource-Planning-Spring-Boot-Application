import apiService from './apiInterceptor';

class AlertsService {
  
  // ===========================================
  // CORE ALERT METHODS (Updated with new endpoint)
  // ===========================================
  
  // NEW: Get all alerts endpoint
  async getAllAlerts() {
    try {
      const response = await apiService.get('/alerts');
      return response;
    } catch (error) {
      console.error('Error fetching all alerts:', error);
      throw new Error('Failed to fetch all alerts');
    }
  }

  async getTodayAlerts() {
    try {
      const response = await apiService.get('/alerts/today');
      return response;
    } catch (error) {
      console.error('Error fetching today\'s alerts:', error);
      throw new Error('Failed to fetch today\'s alerts');
    }
  }

  async getHistoricalAlerts(startDate, endDate) {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      });
      const response = await apiService.get(`/alerts/historical?${params}`);
      return response;
    } catch (error) {
      console.error('Error fetching historical alerts:', error);
      throw new Error('Failed to fetch historical alerts');
    }
  }

  async getActiveIncidents() {
    try {
      const response = await apiService.get('/alerts/incidents');
      return response;
    } catch (error) {
      console.error('Error fetching active incidents:', error);
      throw new Error('Failed to fetch active incidents');
    }
  }

  async getAlertsSummary() {
    try {
      const response = await apiService.get('/alerts/summary');
      return response;
    } catch (error) {
      console.error('Error fetching alerts summary:', error);
      throw new Error('Failed to fetch alerts summary');
    }
  }

  async resolveIncident(incidentId) {
    try {
      const response = await apiService.post(`/alerts/incidents/${incidentId}/resolve`);
      return response;
    } catch (error) {
      console.error('Error resolving incident:', error);
      throw new Error('Failed to resolve incident');
    }
  }

  // ===========================================
  // MISSING THREAT DETECTION ENDPOINTS
  // (You need to add these to your AlertsController)
  // ===========================================

  async getBruteForceAlerts() {
    try {
      const response = await apiService.get('/alerts/bruteforce');
      return response;
    } catch (error) {
      console.error('Error fetching brute force alerts:', error);
      throw new Error('Failed to fetch brute force alerts');
    }
  }

  async getDataExfiltrationAlerts() {
    try {
      const response = await apiService.get('/alerts/data-exfiltration');
      return response;
    } catch (error) {
      console.error('Error fetching data exfiltration alerts:', error);
      throw new Error('Failed to fetch data exfiltration alerts');
    }
  }

  // NEW: Path Traversal Detection
  async getPathTraversalAlerts() {
    try {
      const response = await apiService.get('/alerts/path-traversal');
      return response;
    } catch (error) {
      console.error('Error fetching path traversal alerts:', error);
      throw new Error('Failed to fetch path traversal alerts');
    }
  }

  // NEW: Remote Code Execution Detection
  async getRceAlerts() {
    try {
      const response = await apiService.get('/alerts/rce');
      return response;
    } catch (error) {
      console.error('Error fetching RCE alerts:', error);
      throw new Error('Failed to fetch RCE alerts');
    }
  }

  // NEW: Local File Inclusion Detection
  async getLfiAlerts() {
    try {
      const response = await apiService.get('/alerts/lfi');
      return response;
    } catch (error) {
      console.error('Error fetching LFI alerts:', error);
      throw new Error('Failed to fetch LFI alerts');
    }
  }

  // NEW: SQL Injection Detection
  async getSqlInjectionAlerts() {
    try {
      const response = await apiService.get('/alerts/sql-injection');
      return response;
    } catch (error) {
      console.error('Error fetching SQL injection alerts:', error);
      throw new Error('Failed to fetch SQL injection alerts');
    }
  }

  // NEW: XSS Detection
  async getXssAlerts() {
    try {
      const response = await apiService.get('/alerts/xss');
      return response;
    } catch (error) {
      console.error('Error fetching XSS alerts:', error);
      throw new Error('Failed to fetch XSS alerts');
    }
  }

  // NEW: Malware Detection
  async getMalwareAlerts() {
    try {
      const response = await apiService.get('/alerts/malware');
      return response;
    } catch (error) {
      console.error('Error fetching malware alerts:', error);
      throw new Error('Failed to fetch malware alerts');
    }
  }

  // NEW: DDoS Detection
  async getDdosAlerts() {
    try {
      const response = await apiService.get('/alerts/ddos');
      return response;
    } catch (error) {
      console.error('Error fetching DDoS alerts:', error);
      throw new Error('Failed to fetch DDoS alerts');
    }
  }

  // NEW: Privilege Escalation Detection
  async getPrivilegeEscalationAlerts() {
    try {
      const response = await apiService.get('/alerts/privilege-escalation');
      return response;
    } catch (error) {
      console.error('Error fetching privilege escalation alerts:', error);
      throw new Error('Failed to fetch privilege escalation alerts');
    }
  }

  // NEW: Unauthorized Access Detection
  async getUnauthorizedAccessAlerts() {
    try {
      const response = await apiService.get('/alerts/unauthorized-access');
      return response;
    } catch (error) {
      console.error('Error fetching unauthorized access alerts:', error);
      throw new Error('Failed to fetch unauthorized access alerts');
    }
  }

  // NEW: Comprehensive Threat Scan
  async runComprehensiveThreatScan() {
    try {
      const response = await apiService.post('/alerts/comprehensive-scan');
      return response;
    } catch (error) {
      console.error('Error running comprehensive threat scan:', error);
      throw new Error('Failed to run comprehensive threat scan');
    }
  }

  // NEW: Threat Statistics
  async getThreatStatistics() {
    try {
      const response = await apiService.get('/alerts/threat-statistics');
      return response;
    } catch (error) {
      console.error('Error fetching threat statistics:', error);
      throw new Error('Failed to fetch threat statistics');
    }
  }

  // NEW: High Severity Alerts
  async getHighSeverityAlerts() {
    try {
      const response = await apiService.get('/alerts/high-severity');
      return response;
    } catch (error) {
      console.error('Error fetching high severity alerts:', error);
      throw new Error('Failed to fetch high severity alerts');
    }
  }

  // NEW: Top Attacking IPs
  async getTopAttackingIPs() {
    try {
      const response = await apiService.get('/alerts/top-attacking-ips');
      return response;
    } catch (error) {
      console.error('Error fetching top attacking IPs:', error);
      throw new Error('Failed to fetch top attacking IPs');
    }
  }

  // NEW: Generate Threat Report
  async generateThreatReport() {
    try {
      const response = await apiService.post('/alerts/generate-threat-report');
      return response;
    } catch (error) {
      console.error('Error generating threat report:', error);
      throw new Error('Failed to generate threat report');
    }
  }

  // ===========================================
  // ENHANCED METHODS USING ALL DETECTIONS
  // ===========================================

  // Get all threat types with their specific alerts
  async getAllThreatTypes() {
    try {
      const [
        bruteForce,
        dataExfiltration,
        pathTraversal,
        rce,
        lfi,
        sqlInjection,
        xss,
        malware,
        ddos,
        privilegeEscalation,
        unauthorizedAccess
      ] = await Promise.all([
        this.getBruteForceAlerts(),
        this.getDataExfiltrationAlerts(),
        this.getPathTraversalAlerts(),
        this.getRceAlerts(),
        this.getLfiAlerts(),
        this.getSqlInjectionAlerts(),
        this.getXssAlerts(),
        this.getMalwareAlerts(),
        this.getDdosAlerts(),
        this.getPrivilegeEscalationAlerts(),
        this.getUnauthorizedAccessAlerts()
      ]);

      return {
        BRUTE_FORCE: bruteForce,
        DATA_EXFILTRATION: dataExfiltration,
        PATH_TRAVERSAL: pathTraversal,
        RCE: rce,
        LFI: lfi,
        SQL_INJECTION: sqlInjection,
        XSS: xss,
        MALWARE: malware,
        DDOS: ddos,
        PRIVILEGE_ESCALATION: privilegeEscalation,
        UNAUTHORIZED_ACCESS: unauthorizedAccess
      };
    } catch (error) {
      console.error('Error fetching all threat types:', error);
      throw new Error('Failed to fetch all threat types');
    }
  }

  // Enhanced Security Dashboard with all capabilities
  async getEnhancedSecurityDashboard() {
    try {
      const [
        summary,
        incidents,
        recentAlerts,
        threatStats,
        highSeverityAlerts,
        topAttackingIPs
      ] = await Promise.all([
        this.getAlertsSummary(),
        this.getActiveIncidents(),
        this.getRecentAlerts(10),
        this.getThreatStatistics(),
        this.getHighSeverityAlerts(),
        this.getTopAttackingIPs()
      ]);

      return {
        summary,
        incidents,
        recentAlerts,
        threatStatistics: threatStats,
        highSeverityAlerts,
        topAttackingIPs,
        riskLevel: this.calculateRiskLevel(summary),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching enhanced security dashboard:', error);
      throw new Error('Failed to fetch enhanced security dashboard data');
    }
  }

  // Enhanced Threat Intelligence with all threat types
  async getEnhancedThreatIntelligence() {
    try {
      const [allThreats, threatStats, topIPs] = await Promise.all([
        this.getAllThreatTypes(),
        this.getThreatStatistics(),
        this.getTopAttackingIPs()
      ]);

      const threatSources = new Set();
      let totalThreats = 0;

      // Analyze all threat types
      Object.values(allThreats).forEach(threatArray => {
        threatArray.forEach(alert => {
          if (alert.sourceIp && alert.sourceIp !== 'unknown') {
            threatSources.add(alert.sourceIp);
          }
          totalThreats++;
        });
      });

      return {
        allThreats,
        threatStatistics: threatStats,
        uniqueThreatSources: threatSources.size,
        totalThreats,
        topAttackingIPs: topIPs,
        riskLevel: this.calculateEnhancedRiskLevel(threatStats),
        lastAnalyzed: new Date()
      };
    } catch (error) {
      console.error('Error getting enhanced threat intelligence:', error);
      throw new Error('Failed to get enhanced threat intelligence');
    }
  }

  // Enhanced risk calculation based on all threat types
  calculateEnhancedRiskLevel(data) {
    if (!data) return 'LOW';
    
    const { allAlerts, severityDistribution, attackTypes, threatSources } = data;
    
    const criticalCount = severityDistribution.CRITICAL || 0;
    const highCount = severityDistribution.HIGH || 0;
    const mediumCount = severityDistribution.MEDIUM || 0;
    
    // Calculate recent activity (last 24 hours)
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    const recentAlerts = allAlerts.filter(alert => 
      new Date(alert.timestamp) > last24Hours
    );
    
    const recentCritical = recentAlerts.filter(alert => 
      alert.severity === 'CRITICAL'
    ).length;
    
    const recentHigh = recentAlerts.filter(alert => 
      alert.severity === 'HIGH'
    ).length;
    
    // Enhanced risk calculation
    if (recentCritical > 0 || criticalCount > 2) return 'CRITICAL';
    if (recentHigh > 2 || highCount > 5 || threatSources > 10) return 'HIGH';
    if (recentHigh > 0 || highCount > 0 || mediumCount > 3) return 'MEDIUM';
    
    return 'LOW';
  }

  // Existing methods remain the same...
  async getAlertsBySeverity(severity) {
    try {
      // Use new /alerts endpoint instead of getTodayAlerts
      const allAlerts = await this.getAllAlerts();
      return allAlerts.filter(alert => alert.severity === severity.toUpperCase());
    } catch (error) {
      console.error('Error filtering alerts by severity:', error);
      throw new Error('Failed to filter alerts by severity');
    }
  }

  async getAlertsByType(alertType) {
    try {
      // Use new /alerts endpoint instead of getTodayAlerts
      const allAlerts = await this.getAllAlerts();
      return allAlerts.filter(alert => alert.alertType === alertType.toUpperCase());
    } catch (error) {
      console.error('Error filtering alerts by type:', error);
      throw new Error('Failed to filter alerts by type');
    }
  }

  async getRecentAlerts(limit = 10) {
    try {
      // Use new /alerts endpoint instead of getTodayAlerts
      const allAlerts = await this.getAllAlerts();
      return allAlerts
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      throw new Error('Failed to fetch recent alerts');
    }
  }

  async searchAlertsByIP(ipAddress) {
    try {
      // Use new /alerts endpoint instead of getTodayAlerts
      const allAlerts = await this.getAllAlerts();
      return allAlerts.filter(alert => 
        alert.sourceIp && alert.sourceIp.includes(ipAddress)
      );
    } catch (error) {
      console.error('Error searching alerts by IP:', error);
      throw new Error('Failed to search alerts by IP');
    }
  }

  // Real-time monitoring with enhanced capabilities
  startEnhancedAlertPolling(callback, interval = 30000) {
    const pollAlerts = async () => {
      try {
        const dashboardData = await this.getEnhancedSecurityDashboard();
        callback(dashboardData);
      } catch (error) {
        console.error('Error polling enhanced alerts:', error);
      }
    };

    pollAlerts();
    const intervalId = setInterval(pollAlerts, interval);
    return () => clearInterval(intervalId);
  }

  // Remaining utility methods...
  calculateRiskLevel(summary) {
    if (!summary) return 'LOW';
    
    const { criticalAlerts, highAlerts, mediumAlerts, activeIncidents } = summary;
    
    if (criticalAlerts > 0 || activeIncidents > 2) return 'CRITICAL';
    if (highAlerts > 3 || activeIncidents > 0) return 'HIGH';
    if (mediumAlerts > 5) return 'MEDIUM';
    
    return 'LOW';
  }

  async exportAlertsData(startDate, endDate, format = 'json') {
    try {
      const alerts = await this.getHistoricalAlerts(startDate, endDate);
      
      if (format === 'csv') {
        return this.convertToCSV(alerts);
      }
      
      return {
        alerts,
        exportDate: new Date(),
        dateRange: { startDate, endDate },
        totalAlerts: alerts.length
      };
    } catch (error) {
      console.error('Error exporting alerts data:', error);
      throw new Error('Failed to export alerts data');
    }
  }

  convertToCSV(alerts) {
    if (!alerts || alerts.length === 0) return '';
    
    const headers = [
      'ID', 'Title', 'Description', 'Severity', 'Alert Type', 
      'Source IP', 'Timestamp', 'Details'
    ];
    
    const csvContent = [
      headers.join(','),
      ...alerts.map(alert => [
        alert.id,
        `"${alert.title}"`,
        `"${alert.description}"`,
        alert.severity,
        alert.alertType,
        alert.sourceIp || '',
        alert.timestamp,
        `"${alert.details || ''}"`
      ].join(','))
    ].join('\n');
    
    return csvContent;
  }
  // Add these missing methods to your existing alertsService.js:

  // Main dashboard method that the SecurityDashboard calls - Updated to use new endpoint
  async getSecurityDashboard() {
    try {
      // Build dashboard data from existing endpoints using all alerts
      const [summary, allAlerts, recentAlerts] = await Promise.all([
        this.getAlertsSummary(),
        this.getAllAlerts(), // Use new /alerts endpoint
        this.getRecentAlerts(10)
      ]);

      // Calculate additional dashboard metrics from all alerts
      const todaysAlerts = allAlerts.filter(alert => {
        const alertDate = new Date(alert.timestamp);
        const today = new Date();
        return alertDate.toDateString() === today.toDateString();
      });

      const criticalAlertsToday = todaysAlerts.filter(alert => 
        alert.severity === 'CRITICAL'
      ).length;

      const highAlertsToday = todaysAlerts.filter(alert => 
        alert.severity === 'HIGH'
      ).length;

      // Enhanced summary with real-time data
      const enhancedSummary = {
        ...summary,
        todaysAlerts: todaysAlerts.length,
        criticalAlertsToday,
        highAlertsToday,
        totalAlertsAllTime: allAlerts.length,
        alertTypes: this.groupAlertsByType(allAlerts),
        threatSources: this.getTopThreatSources(allAlerts, 10)
      };

      return {
        summary: enhancedSummary,
        recentAlerts,
        todaysAlerts,
        allAlerts, // Include all alerts for comprehensive analysis
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error building security dashboard:', error);
      throw new Error('Failed to build security dashboard');
    }
  }

  // Threat intelligence method that the dashboard calls - Updated to use new endpoint
  async getThreatIntelligence() {
    try {
      // Use new /alerts endpoint for comprehensive analysis
      const [allAlerts, summary] = await Promise.all([
        this.getAllAlerts(),
        this.getAlertsSummary()
      ]);

      // Analyze all alerts to build comprehensive threat intelligence
      const threatSources = new Set();
      const attackTypes = {};
      const severityDistribution = {};
      const timeBasedPatterns = {};
      let totalThreats = 0;

      allAlerts.forEach(alert => {
        // Count unique threat sources
        if (alert.sourceIp && alert.sourceIp !== 'unknown') {
          threatSources.add(alert.sourceIp);
        }

        // Count attack types
        if (alert.alertType) {
          attackTypes[alert.alertType] = (attackTypes[alert.alertType] || 0) + 1;
          totalThreats++;
        }

        // Count severity distribution
        if (alert.severity) {
          severityDistribution[alert.severity] = (severityDistribution[alert.severity] || 0) + 1;
        }

        // Analyze time patterns (hour of day)
        if (alert.timestamp) {
          const hour = new Date(alert.timestamp).getHours();
          timeBasedPatterns[hour] = (timeBasedPatterns[hour] || 0) + 1;
        }
      });

      // Calculate risk level based on recent alerts and patterns
      const riskLevel = this.calculateEnhancedRiskLevel({
        allAlerts,
        severityDistribution,
        attackTypes,
        threatSources: threatSources.size
      });

      // Identify emerging threats (new attack types in last 24 hours)
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);
      
      const recentAlerts = allAlerts.filter(alert => 
        new Date(alert.timestamp) > last24Hours
      );

      const emergingThreats = this.identifyEmergingThreats(recentAlerts, allAlerts);

      return {
        uniqueThreatSources: threatSources.size,
        totalThreats,
        attackTypes,
        severityDistribution,
        timeBasedPatterns,
        emergingThreats,
        riskLevel,
        topThreatSources: this.getTopThreatSources(allAlerts, 10),
        recentTrends: this.calculateThreatTrends(allAlerts),
        lastAnalyzed: new Date()
      };
    } catch (error) {
      console.error('Error building threat intelligence:', error);
      throw new Error('Failed to build threat intelligence');
    }
  }

  // Enhanced startAlertPolling method that matches dashboard expectations - Updated to use new endpoint
  startAlertPolling(callback, interval = 30000) {
    const pollAlerts = async () => {
      try {
        // Dashboard expects just the alerts array - Use new /alerts endpoint
        const alerts = await this.getAllAlerts();
        callback(alerts);
      } catch (error) {
        console.error('Error polling alerts:', error);
      }
    };

    // Start polling immediately
    pollAlerts();
    
    // Set up interval
    const intervalId = setInterval(pollAlerts, interval);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // Enhanced getSecurityMetrics method that uses existing endpoints
  async getSecurityMetrics(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      // Use only getAllAlerts() and filter by date range, no need to combine with historical
      const [allAlerts, summary] = await Promise.all([
        this.getAllAlerts(), // Get all alerts from new endpoint
        this.getAlertsSummary()
      ]);
      
      // Filter alerts within the date range only
      const filteredAlerts = allAlerts.filter(alert => {
        const alertDate = new Date(alert.timestamp);
        return alertDate >= startDate && alertDate <= endDate;
      });
      
      const metrics = {
        totalAlerts: filteredAlerts.length,
        alertsByDay: this.groupAlertsByDay(filteredAlerts, days),
        alertsBySeverity: this.groupAlertsBySeverity(filteredAlerts),
        alertsByType: this.groupAlertsByType(filteredAlerts),
        topThreatSources: this.getTopThreatSources(filteredAlerts),
        averageAlertsPerDay: filteredAlerts.length / days,
        summary,
        // Additional metrics using filtered alerts only
        recentTrends: this.calculateTrends(filteredAlerts),
        hourlyDistribution: this.groupAlertsByHour(filteredAlerts),
        weeklyPattern: this.groupAlertsByDayOfWeek(filteredAlerts)
      };
      
      return metrics;
    } catch (error) {
      console.error('Error getting security metrics:', error);
      throw new Error('Failed to get security metrics');
    }
  }

  calculateTrends(alerts) {
    const trends = {};
    const sortedAlerts = alerts.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Calculate daily trends
    const dailyGroups = this.groupAlertsByDay(sortedAlerts);
    const dates = Object.keys(dailyGroups).sort();
    
    if (dates.length >= 2) {
      const recent = dailyGroups[dates[dates.length - 1]] || 0;
      const previous = dailyGroups[dates[dates.length - 2]] || 0;
      trends.dailyChange = recent - previous;
      trends.dailyChangePercent = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
    }
    
    return trends;
  }

  groupAlertsByHour(alerts) {
    const hours = {};
    for (let i = 0; i < 24; i++) {
      hours[i] = 0;
    }
    
    alerts.forEach(alert => {
      if (alert.timestamp) {
        const hour = new Date(alert.timestamp).getHours();
        hours[hour] = (hours[hour] || 0) + 1;
      }
    });
    
    return hours;
  }

  groupAlertsByDayOfWeek(alerts) {
    const days = {
      0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
      4: 'Thursday', 5: 'Friday', 6: 'Saturday'
    };
    
    const dayGroups = {};
    Object.values(days).forEach(day => {
      dayGroups[day] = 0;
    });
    
    alerts.forEach(alert => {
      if (alert.timestamp) {
        const dayOfWeek = new Date(alert.timestamp).getDay();
        const dayName = days[dayOfWeek];
        dayGroups[dayName] = (dayGroups[dayName] || 0) + 1;
      }
    });
    
    return dayGroups;
  }

  identifyEmergingThreats(recentAlerts, allAlerts) {
    const recentTypes = this.groupAlertsByType(recentAlerts);
    const historicalTypes = this.groupAlertsByType(allAlerts);
    
    const emergingThreats = [];
    
    Object.entries(recentTypes).forEach(([type, recentCount]) => {
      const historicalCount = historicalTypes[type] || 0;
      const historicalAverage = historicalCount / 30; // Average over 30 days
      
      // Flag as emerging if recent activity is significantly higher than average
      if (recentCount > historicalAverage * 2) {
        emergingThreats.push({
          type,
          recentCount,
          historicalAverage: historicalAverage.toFixed(1),
          riskLevel: recentCount > historicalAverage * 5 ? 'HIGH' : 'MEDIUM'
        });
      }
    });
    
    return emergingThreats;
  }

  calculateThreatTrends(alerts) {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const last14Days = new Date();
    last14Days.setDate(last14Days.getDate() - 14);
    
    const week1Alerts = alerts.filter(alert => 
      new Date(alert.timestamp) > last7Days
    ).length;
    
    const week2Alerts = alerts.filter(alert => {
      const alertDate = new Date(alert.timestamp);
      return alertDate > last14Days && alertDate <= last7Days;
    }).length;
    
    return {
      thisWeek: week1Alerts,
      lastWeek: week2Alerts,
      weeklyChange: week1Alerts - week2Alerts,
      weeklyChangePercent: week2Alerts > 0 ? ((week1Alerts - week2Alerts) / week2Alerts) * 100 : 0
    };
  }

  // Enhanced utility methods
  groupAlertsByDay(alerts, days = 7) {
    const groups = {};
    
    // Initialize all days in range with 0
    const endDate = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(endDate.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      groups[dateStr] = 0;
    }
    
    // Count alerts for each day
    alerts.forEach(alert => {
      if (alert.timestamp) {
        const day = alert.timestamp.split('T')[0];
        if (groups.hasOwnProperty(day)) {
          groups[day]++;
        }
      }
    });
    
    return groups;
  }

  groupAlertsBySeverity(alerts) {
    const groups = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    alerts.forEach(alert => {
      if (alert.severity) {
        groups[alert.severity] = (groups[alert.severity] || 0) + 1;
      }
    });
    return groups;
  }

  groupAlertsByType(alerts) {
    const groups = {};
    alerts.forEach(alert => {
      if (alert.alertType) {
        groups[alert.alertType] = (groups[alert.alertType] || 0) + 1;
      }
    });
    return groups;
  }

  getTopThreatSources(alerts, limit = 5) {
    const sources = {};
    alerts.forEach(alert => {
      if (alert.sourceIp && alert.sourceIp !== 'unknown') {
        sources[alert.sourceIp] = (sources[alert.sourceIp] || 0) + 1;
      }
    });
    
    return Object.entries(sources)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([ip, count]) => ({ ip, count }));
  }

  // Enhanced calculateRiskLevel method
  calculateRiskLevel(summary) {
    if (!summary) return 'LOW';
    
    const { criticalAlerts = 0, highAlerts = 0, mediumAlerts = 0 } = summary;
    
    if (criticalAlerts > 0) return 'CRITICAL';
    if (highAlerts > 3) return 'HIGH';
    if (highAlerts > 0 || mediumAlerts > 5) return 'MEDIUM';
    
    return 'LOW';
  }

  // Enhanced export method
  async exportAlertsData(startDate, endDate, format = 'json') {
    try {
      const alerts = await this.getHistoricalAlerts(startDate, endDate);
      
      if (format === 'csv') {
        return this.convertToCSV(alerts);
      }
      
      return {
        alerts,
        exportDate: new Date(),
        dateRange: { startDate, endDate },
        totalAlerts: alerts.length,
        summary: await this.getAlertsSummary()
      };
    } catch (error) {
      console.error('Error exporting alerts data:', error);
      throw new Error('Failed to export alerts data');
    }
  }

  // Enhanced CSV conversion
  convertToCSV(alerts) {
    if (!alerts || alerts.length === 0) return 'No data available';
    
    const headers = [
      'ID', 'Title', 'Description', 'Severity', 'Alert Type', 
      'Source IP', 'Timestamp', 'Details'
    ];
    
    const csvContent = [
      headers.join(','),
      ...alerts.map(alert => [
        alert.id || '',
        `"${(alert.title || '').replace(/"/g, '""')}"`,
        `"${(alert.description || '').replace(/"/g, '""')}"`,
        alert.severity || '',
        alert.alertType || '',
        alert.sourceIp || '',
        alert.timestamp || '',
        `"${(alert.details || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    return csvContent;
  }

  // Enhanced search method - Updated to use new endpoint
  async searchAlertsByIP(ipAddress) {
    try {
      // Use new /alerts endpoint instead of getTodayAlerts
      const allAlerts = await this.getAllAlerts();
      return allAlerts.filter(alert => 
        alert.sourceIp && alert.sourceIp.toLowerCase().includes(ipAddress.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching alerts by IP:', error);
      throw new Error('Failed to search alerts by IP');
    }
  }
}

const alertsService = new AlertsService();
export default alertsService;