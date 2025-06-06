import apiService from './apiInterceptor';

class AlertsService {
  
  // Get today's security alerts
  async getTodayAlerts() {
    try {
      const response = await apiService.get('/alerts/today');
      return response;
    } catch (error) {
      console.error('Error fetching today\'s alerts:', error);
      throw new Error('Failed to fetch today\'s alerts');
    }
  }

  // Get historical alerts within date range
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

  // Get active security incidents
  async getActiveIncidents() {
    try {
      const response = await apiService.get('/alerts/incidents');
      return response;
    } catch (error) {
      console.error('Error fetching active incidents:', error);
      throw new Error('Failed to fetch active incidents');
    }
  }

  // Get alerts summary for dashboard
  async getAlertsSummary() {
    try {
      const response = await apiService.get('/alerts/summary');
      return response;
    } catch (error) {
      console.error('Error fetching alerts summary:', error);
      throw new Error('Failed to fetch alerts summary');
    }
  }

  // Resolve a specific incident
  async resolveIncident(incidentId) {
    try {
      const response = await apiService.post(`/alerts/incidents/${incidentId}/resolve`);
      return response;
    } catch (error) {
      console.error('Error resolving incident:', error);
      throw new Error('Failed to resolve incident');
    }
  }

  // Get brute force specific alerts
  async getBruteForceAlerts() {
    try {
      const response = await apiService.get('/alerts/bruteforce');
      return response;
    } catch (error) {
      console.error('Error fetching brute force alerts:', error);
      throw new Error('Failed to fetch brute force alerts');
    }
  }

  // Get data exfiltration alerts
  async getDataExfiltrationAlerts() {
    try {
      const response = await apiService.get('/alerts/data-exfiltration');
      return response;
    } catch (error) {
      console.error('Error fetching data exfiltration alerts:', error);
      throw new Error('Failed to fetch data exfiltration alerts');
    }
  }

  // Get alerts by severity level
  async getAlertsBySeverity(severity) {
    try {
      const allAlerts = await this.getTodayAlerts();
      return allAlerts.filter(alert => alert.severity === severity.toUpperCase());
    } catch (error) {
      console.error('Error filtering alerts by severity:', error);
      throw new Error('Failed to filter alerts by severity');
    }
  }

  // Get alerts by type
  async getAlertsByType(alertType) {
    try {
      const allAlerts = await this.getTodayAlerts();
      return allAlerts.filter(alert => alert.alertType === alertType.toUpperCase());
    } catch (error) {
      console.error('Error filtering alerts by type:', error);
      throw new Error('Failed to filter alerts by type');
    }
  }

  // Get recent alerts (last N alerts)
  async getRecentAlerts(limit = 10) {
    try {
      const allAlerts = await this.getTodayAlerts();
      return allAlerts
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      throw new Error('Failed to fetch recent alerts');
    }
  }

  // Search alerts by IP address
  async searchAlertsByIP(ipAddress) {
    try {
      const allAlerts = await this.getTodayAlerts();
      return allAlerts.filter(alert => 
        alert.sourceIp && alert.sourceIp.includes(ipAddress)
      );
    } catch (error) {
      console.error('Error searching alerts by IP:', error);
      throw new Error('Failed to search alerts by IP');
    }
  }

  // Get security dashboard data
  async getSecurityDashboard() {
    try {
      const [summary, incidents, recentAlerts] = await Promise.all([
        this.getAlertsSummary(),
        this.getActiveIncidents(),
        this.getRecentAlerts(5)
      ]);

      return {
        summary,
        incidents,
        recentAlerts,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching security dashboard:', error);
      throw new Error('Failed to fetch security dashboard data');
    }
  }

  // Poll for real-time alerts (for dashboard auto-refresh)
  startAlertPolling(callback, interval = 30000) { // 30 seconds default
    const pollAlerts = async () => {
      try {
        const alerts = await this.getTodayAlerts();
        callback(alerts);
      } catch (error) {
        console.error('Error polling alerts:', error);
      }
    };

    // Initial call
    pollAlerts();
    
    // Set up interval
    const intervalId = setInterval(pollAlerts, interval);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // Get threat intelligence summary
  async getThreatIntelligence() {
    try {
      const [bruteForce, dataExfiltration, summary] = await Promise.all([
        this.getBruteForceAlerts(),
        this.getDataExfiltrationAlerts(),
        this.getAlertsSummary()
      ]);

      const threatSources = new Set();
      const attackTypes = new Map();

      // Analyze brute force attacks
      bruteForce.forEach(alert => {
        if (alert.sourceIp) threatSources.add(alert.sourceIp);
        attackTypes.set('BRUTE_FORCE', (attackTypes.get('BRUTE_FORCE') || 0) + 1);
      });

      // Analyze data exfiltration
      dataExfiltration.forEach(alert => {
        if (alert.sourceIp) threatSources.add(alert.sourceIp);
        attackTypes.set('DATA_EXFILTRATION', (attackTypes.get('DATA_EXFILTRATION') || 0) + 1);
      });

      return {
        uniqueThreatSources: threatSources.size,
        attackTypes: Object.fromEntries(attackTypes),
        totalThreats: bruteForce.length + dataExfiltration.length,
        riskLevel: this.calculateRiskLevel(summary),
        lastAnalyzed: new Date()
      };
    } catch (error) {
      console.error('Error getting threat intelligence:', error);
      throw new Error('Failed to get threat intelligence');
    }
  }

  // Calculate overall risk level based on alerts
  calculateRiskLevel(summary) {
    if (!summary) return 'LOW';
    
    const { criticalAlerts, highAlerts, mediumAlerts, activeIncidents } = summary;
    
    if (criticalAlerts > 0 || activeIncidents > 2) return 'CRITICAL';
    if (highAlerts > 3 || activeIncidents > 0) return 'HIGH';
    if (mediumAlerts > 5) return 'MEDIUM';
    
    return 'LOW';
  }

  // Export alerts data for reporting
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

  // Convert alerts to CSV format
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

  // Get security metrics for reporting
  async getSecurityMetrics(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const historicalAlerts = await this.getHistoricalAlerts(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      const metrics = {
        totalAlerts: historicalAlerts.length,
        alertsByDay: this.groupAlertsByDay(historicalAlerts),
        alertsBySeverity: this.groupAlertsBySeverity(historicalAlerts),
        alertsByType: this.groupAlertsByType(historicalAlerts),
        topThreatSources: this.getTopThreatSources(historicalAlerts),
        averageAlertsPerDay: historicalAlerts.length / days
      };
      
      return metrics;
    } catch (error) {
      console.error('Error getting security metrics:', error);
      throw new Error('Failed to get security metrics');
    }
  }

  // Helper methods for metrics
  groupAlertsByDay(alerts) {
    const groups = {};
    alerts.forEach(alert => {
      const day = alert.timestamp.split('T')[0];
      groups[day] = (groups[day] || 0) + 1;
    });
    return groups;
  }

  groupAlertsBySeverity(alerts) {
    const groups = {};
    alerts.forEach(alert => {
      groups[alert.severity] = (groups[alert.severity] || 0) + 1;
    });
    return groups;
  }

  groupAlertsByType(alerts) {
    const groups = {};
    alerts.forEach(alert => {
      groups[alert.alertType] = (groups[alert.alertType] || 0) + 1;
    });
    return groups;
  }

  getTopThreatSources(alerts, limit = 5) {
    const sources = {};
    alerts.forEach(alert => {
      if (alert.sourceIp) {
        sources[alert.sourceIp] = (sources[alert.sourceIp] || 0) + 1;
      }
    });
    
    return Object.entries(sources)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([ip, count]) => ({ ip, count }));
  }
}

// Create and export singleton instance
const alertsService = new AlertsService();
export default alertsService;