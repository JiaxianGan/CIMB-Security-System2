// ============================================================================
// AlertAnalyzer.js - Intelligent Alert Classification System
// ============================================================================
// Analyzes alerts and determines if they require immediate admin attention
// based on severity, frequency, impact, and system health indicators
// ============================================================================

class AlertAnalyzer {
  constructor() {
    // Thresholds for critical alert detection
    this.thresholds = {
      highSeverityBurst: 3,        // 3+ high severity alerts in short time
      criticalTimeWindow: 300000,   // 5 minutes window
      systemDownRisk: 0.7,          // 70% risk threshold
      anomalyScoreThreshold: 85,    // Anomaly score > 85
      blockedAttemptsBurst: 10,     // 10+ blocked attempts in 5 min
      trafficSpikeMultiplier: 3,    // Traffic 3x normal
      cpuThreshold: 90,             // CPU usage > 90%
      memoryThreshold: 90,          // Memory usage > 90%
      consecutiveFailures: 5,       // 5 consecutive failures
    };

    // Alert categories requiring immediate attention
    this.criticalTypes = [
      'DDoS Attack',
      'Data Breach Attempt',
      'Ransomware Alert',
      'System Compromise',
      'Unauthorized Root Access',
      'Critical Service Down',
      'Database Connection Lost',
      'Firewall Disabled',
      'Multiple System Failures'
    ];

    // Keywords that indicate system-wide impact
    this.systemImpactKeywords = [
      'system down',
      'service unavailable',
      'complete failure',
      'network outage',
      'database crashed',
      'critical error',
      'all users affected',
      'widespread impact',
      'infrastructure failure',
      'total loss'
    ];
  }

  /**
   * Main analysis function - determines if alert requires immediate popup
   * @param {Object} newAlert - The new alert to analyze
   * @param {Array} recentAlerts - Recent alerts for context analysis
   * @param {Object} systemStats - Current system statistics
   * @param {Array} trafficData - Recent traffic data
   * @param {Array} blockedAttempts - Recent blocked attempts
   * @returns {Object} Analysis result with classification and reasoning
   */
  analyzeAlert(newAlert, recentAlerts, systemStats, trafficData, blockedAttempts) {
    const analysis = {
      requiresPopup: false,
      priority: 'low',
      riskScore: 0,
      impactLevel: 'minimal',
      reasons: [],
      recommendation: '',
      affectedSystems: [],
      estimatedDowntimeRisk: 0
    };

    // Calculate risk score based on multiple factors
    const riskFactors = this.calculateRiskFactors(
      newAlert,
      recentAlerts,
      systemStats,
      trafficData,
      blockedAttempts
    );

    analysis.riskScore = riskFactors.totalScore;

    // Check if alert type is inherently critical
    if (this.isCriticalAlertType(newAlert)) {
      analysis.reasons.push('Alert type classified as critical');
      analysis.riskScore += 30;
    }

    // Check if alert message indicates system-wide impact
    if (this.hasSystemWideImpact(newAlert)) {
      analysis.reasons.push('Indicates potential system-wide impact');
      analysis.riskScore += 25;
      analysis.affectedSystems.push('Core Infrastructure');
    }

    // Check for alert burst (multiple similar alerts in short time)
    const burstAnalysis = this.detectAlertBurst(newAlert, recentAlerts);
    if (burstAnalysis.isBurst) {
      analysis.reasons.push(
        `Alert burst detected: ${burstAnalysis.count} similar alerts in ${burstAnalysis.timeWindow}ms`
      );
      analysis.riskScore += 20;
    }

    // Check system resource status
    const resourceAnalysis = this.analyzeSystemResources(systemStats, trafficData);
    if (resourceAnalysis.critical) {
      analysis.reasons.push(resourceAnalysis.reason);
      analysis.riskScore += resourceAnalysis.riskIncrease;
      analysis.affectedSystems.push(...resourceAnalysis.affectedSystems);
    }

    // Check for coordinated attack patterns
    const attackPattern = this.detectCoordinatedAttack(
      newAlert,
      recentAlerts,
      blockedAttempts
    );
    if (attackPattern.detected) {
      analysis.reasons.push(attackPattern.description);
      analysis.riskScore += 25;
      analysis.affectedSystems.push('Security Perimeter');
    }

    // Calculate impact level and priority
    analysis.impactLevel = this.calculateImpactLevel(analysis.riskScore);
    analysis.priority = this.calculatePriority(analysis.riskScore);
    analysis.estimatedDowntimeRisk = this.calculateDowntimeRisk(
      analysis.riskScore,
      resourceAnalysis
    );

    // Determine if popup is required (risk score > 60 or high priority)
    analysis.requiresPopup = analysis.riskScore >= 60 || analysis.priority === 'critical';

    // Generate recommendation
    analysis.recommendation = this.generateRecommendation(analysis);

    return analysis;
  }

  /**
   * Calculate risk factors from multiple data sources
   */
  calculateRiskFactors(newAlert, recentAlerts, systemStats, trafficData, blockedAttempts) {
    let totalScore = 0;
    const factors = {};

    // Factor 1: Alert severity
    const severityScore = {
      'high': 25,
      'medium': 10,
      'low': 5
    };
    factors.severity = severityScore[newAlert.severity] || 5;
    totalScore += factors.severity;

    // Factor 2: Recent high-severity alerts
    const recentHighSeverity = recentAlerts.filter(
      a => a.severity === 'high' && 
      (Date.now() - a.timestamp) < this.thresholds.criticalTimeWindow
    ).length;
    
    if (recentHighSeverity >= this.thresholds.highSeverityBurst) {
      factors.highSeverityBurst = 20;
      totalScore += 20;
    }

    // Factor 3: System load
    if (systemStats.activeConnections > 500) {
      factors.highLoad = 10;
      totalScore += 10;
    }

    // Factor 4: Recent blocked attempts
    const recentBlocked = blockedAttempts.filter(
      b => (Date.now() - b.timestamp) < this.thresholds.criticalTimeWindow
    ).length;
    
    if (recentBlocked >= this.thresholds.blockedAttemptsBurst) {
      factors.blockedBurst = 15;
      totalScore += 15;
    }

    // Factor 5: Traffic anomalies
    if (trafficData.length > 0) {
      const latest = trafficData[0];
      const average = trafficData.reduce((sum, t) => sum + t.inbound, 0) / trafficData.length;
      
      if (latest.inbound > average * this.thresholds.trafficSpikeMultiplier) {
        factors.trafficSpike = 15;
        totalScore += 15;
      }

      // Check CPU and memory
      if (latest.cpu_usage > this.thresholds.cpuThreshold) {
        factors.highCpu = 10;
        totalScore += 10;
      }
      
      if (latest.memory_usage > this.thresholds.memoryThreshold) {
        factors.highMemory = 10;
        totalScore += 10;
      }
    }

    return { totalScore, factors };
  }

  /**
   * Check if alert type is inherently critical
   */
  isCriticalAlertType(alert) {
    return this.criticalTypes.some(type => 
      alert.type.toLowerCase().includes(type.toLowerCase())
    );
  }

  /**
   * Check if alert message indicates system-wide impact
   */
  hasSystemWideImpact(alert) {
    const message = alert.message.toLowerCase();
    return this.systemImpactKeywords.some(keyword => 
      message.includes(keyword.toLowerCase())
    );
  }

  /**
   * Detect alert burst (multiple similar alerts in short time)
   */
  detectAlertBurst(newAlert, recentAlerts) {
    const timeWindow = this.thresholds.criticalTimeWindow;
    const recentSimilar = recentAlerts.filter(alert => 
      alert.type === newAlert.type &&
      (Date.now() - alert.timestamp) < timeWindow
    );

    return {
      isBurst: recentSimilar.length >= 3,
      count: recentSimilar.length,
      timeWindow: timeWindow
    };
  }

  /**
   * Analyze system resource status
   */
  analyzeSystemResources(systemStats, trafficData) {
    const analysis = {
      critical: false,
      reason: '',
      riskIncrease: 0,
      affectedSystems: []
    };

    if (trafficData.length === 0) return analysis;

    const latest = trafficData[0];

    // Critical CPU usage
    if (latest.cpu_usage > this.thresholds.cpuThreshold) {
      analysis.critical = true;
      analysis.reason = `Critical CPU usage: ${latest.cpu_usage}%`;
      analysis.riskIncrease = 15;
      analysis.affectedSystems.push('CPU Resources');
    }

    // Critical memory usage
    if (latest.memory_usage > this.thresholds.memoryThreshold) {
      analysis.critical = true;
      analysis.reason += (analysis.reason ? ' | ' : '') + 
        `Critical memory usage: ${latest.memory_usage}%`;
      analysis.riskIncrease += 15;
      analysis.affectedSystems.push('Memory Resources');
    }

    // High packet loss
    if (latest.packet_loss > 5) {
      analysis.critical = true;
      analysis.reason += (analysis.reason ? ' | ' : '') +
        `High packet loss: ${latest.packet_loss}%`;
      analysis.riskIncrease += 10;
      analysis.affectedSystems.push('Network');
    }

    return analysis;
  }

  /**
   * Detect coordinated attack patterns
   */
  detectCoordinatedAttack(newAlert, recentAlerts, blockedAttempts) {
    const timeWindow = this.thresholds.criticalTimeWindow;
    const recentTime = Date.now() - timeWindow;

    // Count recent security events
    const recentSecurityAlerts = recentAlerts.filter(a => 
      ['high', 'medium'].includes(a.severity) && a.timestamp > recentTime
    ).length;

    const recentBlocked = blockedAttempts.filter(b => 
      b.timestamp > recentTime
    ).length;

    // If multiple security events happening simultaneously
    const totalEvents = recentSecurityAlerts + Math.floor(recentBlocked / 3);

    if (totalEvents >= 8) {
      return {
        detected: true,
        description: `Coordinated attack pattern detected: ${recentSecurityAlerts} alerts + ${recentBlocked} blocked attempts`,
        confidence: totalEvents > 12 ? 'high' : 'medium'
      };
    }

    return { detected: false };
  }

  /**
   * Calculate impact level based on risk score
   */
  calculateImpactLevel(riskScore) {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Calculate priority based on risk score
   */
  calculatePriority(riskScore) {
    if (riskScore >= 75) return 'critical';
    if (riskScore >= 55) return 'high';
    if (riskScore >= 35) return 'medium';
    return 'low';
  }

  /**
   * Calculate estimated downtime risk percentage
   */
  calculateDowntimeRisk(riskScore, resourceAnalysis) {
    let downtimeRisk = (riskScore / 100) * 0.6; // Base risk from score

    if (resourceAnalysis.critical) {
      downtimeRisk += 0.3; // Add 30% if resources critical
    }

    return Math.min(downtimeRisk * 100, 95); // Cap at 95%
  }

  /**
   * Generate actionable recommendation
   */
  generateRecommendation(analysis) {
    if (analysis.priority === 'critical') {
      return 'IMMEDIATE ACTION REQUIRED: Activate incident response team and investigate immediately.';
    }
    
    if (analysis.priority === 'high') {
      return 'HIGH PRIORITY: Review system status and take preventive measures to avoid escalation.';
    }
    
    if (analysis.priority === 'medium') {
      return 'MONITOR CLOSELY: Keep system under observation and prepare contingency plans.';
    }
    
    return 'STANDARD RESPONSE: Log and monitor as part of routine security operations.';
  }

  /**
   * Format alert for display in popup or notification
   */
  formatAlertForDisplay(alert, analysis) {
    return {
      ...alert,
      analysis: {
        riskScore: Math.round(analysis.riskScore),
        priority: analysis.priority,
        impactLevel: analysis.impactLevel,
        requiresPopup: analysis.requiresPopup,
        reasons: analysis.reasons,
        recommendation: analysis.recommendation,
        affectedSystems: analysis.affectedSystems,
        estimatedDowntimeRisk: Math.round(analysis.estimatedDowntimeRisk),
        analyzedAt: Date.now()
      }
    };
  }
}

export default AlertAnalyzer;