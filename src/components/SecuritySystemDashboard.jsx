// ============================================================================
// SecuritySystemDashboard.jsx - Complete Implementation
// ============================================================================
// This is the main dashboard component that handles:
// - Real-time data generation and polling every 5 seconds
// - User session tracking (active users count)
// - Network usage monitoring
// - Latency simulation (low/medium/high)
// - Traffic monitoring, security alerts, and blocked attempts
// - Data archiving after 3 hours
// ============================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ref, push, onValue, get, remove, set, onDisconnect, query, limitToLast } from 'firebase/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertCircle } from "lucide-react";
import Modal from './Modal';
import ReportModal from './ReportModal';
import AdminView from './AdminView';
import ManagerView from './ManagerView';
import SecurityAnalystView from './SecurityAnalystView';
import ReportPreviewModal from "./ReportPreviewModal";
import { db, rtdb } from './firebase'; // Adjust path if needed

// ============================================================================
// SVG ICON COMPONENTS
// ============================================================================
// Reusable SVG icons used throughout the dashboard

const ShieldIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const LogOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

// *** NEW ICONS FOR TOP BAR ***
const PrinterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// ============================================================================
// ANIMATED BACKGROUND COMPONENT
// ============================================================================
// Creates the dark blue gradient background with floating particles

const AnimatedBackground = ({ children }) => (
  <div className="min-h-screen bg-gradient-main relative overflow-hidden">
    {/* Gradient background blobs */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="bg-element bg-element-1 animate-pulse"></div>
      <div className="bg-element bg-element-2 animate-pulse delay-1000"></div>
      <div className="bg-element bg-element-3 animate-pulse delay-500"></div>
      <div className="bg-element bg-element-4 animate-pulse delay-2000"></div>
      <div className="bg-element bg-element-5 animate-pulse delay-3000"></div>
    </div>
    
    {/* Floating particles */}
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
          }}
        />
      ))}
    </div>
    
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const SecuritySystemDashboard = ({ user, onLogout }) => {
  
  // ============================================================================
  // STATE VARIABLES
  // ============================================================================
  
  // Time tracking
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Data arrays for charts and tables
  const [trafficData, setTrafficData] = useState([]);
  const [networkUsageData, setNetworkUsageData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [blockedAttempts, setBlockedAttempts] = useState([]);
  const [userBehaviorData, setUserBehaviorData] = useState([]);
  const [dnsFilteringData, setDnsFilteringData] = useState([]);
  const [userLatencies, setUserLatencies] = useState([]);        // Latency data for each user
  
  // System statistics
  const [systemStats, setSystemStats] = useState({
    totalUsers: 1247,           // Total registered users
    activeConnections: 0,        // Currently connected users (updated in real-time)
    blockedAttempts: 0,          // Total blocked login attempts
    alertsToday: 0,              // Total alerts generated today
  });
  
  const [renderTrafficData, setRenderTrafficData] = useState([]);
  const [renderNetworkUsage, setRenderNetworkUsage] = useState([]);
  
  // Modal states
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedBlockedAttempt, setSelectedBlockedAttempt] = useState(null);
  
  // Report generation states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportStartDate, setReportStartDate] = useState(null);
  const [reportEndDate, setReportEndDate] = useState(null);
  
  // Connection state
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs for maintaining data between renders
  const trafficDataRef = useRef([]);
  const pollingIntervalRef = useRef(null);
  const lastNarrativeUpdateRef = useRef(Date.now());

  // KPI Metrics
  const [kpiMetrics, setKpiMetrics] = useState({
    threatReduction: 0,
    policyCompliance: 0,
    falsePositiveRate: 0,
    weeklyAttackGrowth: 0
  });

  // Executive summary
  const [weeklyAttackSummary, setWeeklyAttackSummary] = useState([]);
  const [execNarrative, setExecNarrative] = useState("");

  // ============================================================================
  // FIREBASE REFERENCES
  // ============================================================================
  // References to Firebase Realtime Database paths (matching your structure)
  
  const activeTrafficRef = ref(rtdb, 'active_traffic');        // Real-time traffic data
  const archivedTrafficRef = ref(rtdb, 'archive');    // Archived traffic (>3 hours old)
  const alertsRef = ref(rtdb, 'alerts');                       // Security alerts
  const blockedAttemptsRef = ref(rtdb, 'blocked_attempts');    // Blocked login attempts
  const userBehaviorRef = ref(rtdb, 'user_behavior');          // Static user behavior data
  const dnsFilteringRef = ref(rtdb, 'dns_filtering');          // Static DNS filtering data
  const systemStatsRef = ref(rtdb, 'system_stats');            // System statistics
  const networkUsageRef = ref(rtdb, 'network_usage');          // Network usage data
  const userLatenciesRef = ref(rtdb, 'user_latencies');        // User latency data
  const activeSessionsRef = ref(rtdb, 'active_sessions');      // Active user sessions
  const connectedUsersRef = ref(rtdb, 'connected_users_count'); // Count of connected users
  const kpiMetricsRef = ref(rtdb, "security_stats/kpi_metrics");
  const weeklyAttackSummaryRef = ref(rtdb, "security_stats/weekly_attack_summary");
  const execNarrativeRef = ref(rtdb, "security_stats/exec_narrative");


  const LIMITS = {
    active_traffic: 40,
    network_usage: 30,
    alerts: 20,
    blocked_attempts: 20,
    dns_filtering: 20,
    user_behavior: 25,
    user_latencies: 200, // keep latencies (per-user) reasonably high
  };

  // ============================================================================
  // INITIALIZATION - Firebase Static Data Setup
  // ============================================================================
  // Runs once when component mounts to initialize static data in Firebase
  
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('Initializing Firebase data...');
        
        // Static data for charts that don't change frequently
        const staticData = {
          user_behavior: [
          {
            behavior: "Normal Activity",
            value: 61,
            risk: "low",
            trend: -4,
            examples: ["Regular login", "Normal browsing"]
          },
          {
            behavior: "Suspicious Activity",
            value: 26,
            risk: "medium",
            trend: +3,
            examples: ["Unusual access hours", "Repeated retries"]
          },
          {
            behavior: "Blocked Attempts",
            value: 13,
            risk: "high",
            trend: +5,
            examples: ["Threat domains", "Privilege escalation attempts"]
          }
        ],
          dns_filtering: [
        {
          category: 'Malware',
          blocked: 142,
          allowed: 480,
          severity: 'high',
          trend: +5,
          topDomains: ['malicious-download.net', 'payload-dropper.io']
        },
        {
          category: 'Phishing',
          blocked: 89,
          allowed: 392,
          severity: 'medium',
          trend: +3,
          topDomains: ['login-verify-mail.com', 'secure-bank-check.net']
        },
        {
          category: 'Adult',
          blocked: 234,
          allowed: 556,
          severity: 'low',
          trend: -4,
          topDomains: ['content-stream.xyz', 'mediahub-direct.net']
        },
        {
          category: 'Social',
          blocked: 67,
          allowed: 390,
          severity: 'low',
          trend: -1,
          topDomains: ['chatspot.social', 'friendcircle.link']
        },
        {
          category: 'Ads',
          blocked: 156,
          allowed: 612,
          severity: 'medium',
          trend: +3,
          topDomains: ['ads-banner.tech', 'tracker-ads.io']
        }
      ],
          system_stats: {
            totalUsers: 1247,
            activeConnections: 0,
            blockedAttempts: 0,
            alertsToday: 0,
          }
        };

        // Write static data to Firebase
        await set(userBehaviorRef, staticData.user_behavior);
        await set(dnsFilteringRef, staticData.dns_filtering);
        await set(systemStatsRef, staticData.system_stats);
        
        setIsConnected(true);
        console.log('✓ Firebase initialized successfully');
      } catch (error) {
        console.error('Firebase initialization error:', error);
        setError('Failed to connect to Firebase: ' + error.message);
      }
    };

    initializeData();
  }, [userBehaviorRef, dnsFilteringRef, systemStatsRef]);

  // ---------------------------
  // Utility: safe number parse
  // ---------------------------
  const safeNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  // ============================================================================
  // USER SESSION TRACKING
  // ============================================================================
  // Tracks when users log in/out and updates active connections count
  
  useEffect(() => {
    if (!isConnected || !user) return;

    const userSessionRef = ref(rtdb, `active_sessions/${user.uid}`);

    const initializeUserSession = async () => {
      try {
        // Create session data for this user
        const sessionData = {
          userId: user.uid,
          username: user.username,
          email: user.email,
          role: user.role,
          loginTime: Date.now(),
          lastActive: Date.now(),
          status: 'online',
          // Generate random IP for demo purposes
          ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          deviceInfo: navigator.userAgent.split(' ')[0],
        };

        // Write session to Firebase
        await set(userSessionRef, sessionData);

        // IMPORTANT: Set up disconnect handler
        // This automatically removes the user's session when they disconnect
        onDisconnect(userSessionRef).remove();

        // Update the total connected users count
        const sessionsSnapshot = await get(activeSessionsRef);
        const sessionsCount = sessionsSnapshot.exists() ? Object.keys(sessionsSnapshot.val()).length : 1;
        await set(connectedUsersRef, sessionsCount);

        console.log('✓ User session initialized:', user.username);

        // Heartbeat: Update last active timestamp every 30 seconds
        const heartbeatInterval = setInterval(async () => {
          await set(ref(rtdb, `active_sessions/${user.uid}/lastActive`), Date.now());
        }, 30000);

        return () => clearInterval(heartbeatInterval);
      } catch (error) {
        console.error('Error initializing user session:', error);
      }
    };

    initializeUserSession();

    // Listen for changes in connected users count
    const connectedUsersListener = onValue(connectedUsersRef, (snapshot) => {
      const count = snapshot.val() || 0;
      setSystemStats(prev => ({
        ...prev,
        activeConnections: count  // Update the active connections in real-time
      }));
      console.log('Active users:', count);
    });

    // Cleanup: Remove session when component unmounts
    return () => {
      connectedUsersListener();
      remove(userSessionRef);
    };
  }, [isConnected, user, rtdb]);

  
  // ============================================================================
  // DATA GENERATION FUNCTIONS
  // ============================================================================

  // ----------------------------------------------------------------------------
  // FUNCTION: Generate Random Traffic Data
  // ----------------------------------------------------------------------------
  // Generates realistic network traffic data with:
  // - Time-based patterns (peak hours vs off-hours)
  // - Random spikes (10% chance)
  // - Various network metrics
  
  const generateRandomTrafficData = useCallback(async () => {
    if (!isConnected) return;

    try {
      const now = new Date();
      const hour = now.getHours();
      
      // Business hours (9 AM - 5 PM) have higher traffic
      const isPeakHours = (hour >= 9 && hour <= 17);
      const baseInbound = isPeakHours ? 150 : 50;
      const baseOutbound = isPeakHours ? 100 : 40;
      
      // 10% chance of traffic spike
      const hasSpike = Math.random() < 0.1;
      const spikeMultiplier = hasSpike ? (Math.random() * 2 + 1.5) : 1;
      
      const newTrafficPoint = {
        time: now.toISOString(),
        timestamp: now.getTime(),
        inbound: Math.floor((baseInbound + Math.random() * 100) * spikeMultiplier),
        outbound: Math.floor((baseOutbound + Math.random() * 80) * spikeMultiplier),
        threats: Math.floor(Math.random() * (hasSpike ? 10 : 5)),
        dns_blocked: Math.floor(Math.random() * 5),
        cpu_usage: Math.floor(Math.random() * 60) + 20,
        memory_usage: Math.floor(Math.random() * 50) + 30,
        network_latency: Math.floor(Math.random() * 100) + 5,
        packet_loss: parseFloat((Math.random() * 2).toFixed(2)),
        bandwidth_usage: Math.floor((Math.random() * 80 + 20) * spikeMultiplier),
      };

      // Upload to Firebase
      await push(activeTrafficRef, newTrafficPoint);
      // console.log('✓ Traffic data updated');
    } catch (error) {
      console.error('Error generating traffic data:', error);
    }
  }, [isConnected, activeTrafficRef]);

  // ----------------------------------------------------------------------------
  // FUNCTION: Generate Random Security Alert
  // ----------------------------------------------------------------------------
  // Creates security alerts with varying severity levels
  // Distribution: 15% high, 45% medium, 40% low
  
  const generateRandomAlert = useCallback(async () => {
    if (!isConnected) return;
    try {
    const alertTypes = [
      'Intrusion Attempt', 'DDoS Attack', 'Malware Detected', 'Suspicious Login',
      'Data Breach Attempt', 'Port Scanning', 'SQL Injection', 'XSS Attack',
      'Brute Force Attack', 'Unauthorized Access', 'Phishing Attempt', 'Ransomware Alert'
    ];
    
    const messages = [
      'Multiple failed login attempts from suspicious IP address',
      'Unusual data access pattern detected in user behavior analytics',
      'Malicious domain access successfully blocked by DNS filtering',
      'Suspicious file download attempt from untrusted source',
      'Network anomaly detected - investigating potential security breach',
      'Unauthorized API access attempt blocked by firewall',
      'Suspicious database query patterns detected and logged',
      'Potential data exfiltration attempt identified and prevented',
      'Abnormal traffic spike detected from single source IP',
      'Cross-site scripting attempt blocked on web application'
    ];

    // Determine severity with weighted randomness
    const rnd = Math.random();
      let severity = 'low';
      if (rnd < 0.15) severity = 'high';
      else if (rnd < 0.60) severity = 'medium';

    
      const newAlert = {
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        time: new Date().toISOString(),
        severity,
        timestamp: Date.now(),
        source_ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        affected_systems: Math.floor(Math.random() * 8) + 1,
        risk_level: severity === 'high' ? Math.floor(Math.random() * 25) + 75 : severity === 'medium' ? Math.floor(Math.random() * 40) + 35 : Math.floor(Math.random() * 35) + 10,
        status: 'Active',
        detection_method: ['IDS', 'Firewall', 'SIEM', 'Antivirus'][Math.floor(Math.random() * 4)]
      };

      await push(alertsRef, newAlert);
      
      // Update alert count in system stats
      const statsSnapshot = await get(systemStatsRef);
      if (statsSnapshot.exists()) {
        const currentStats = statsSnapshot.val();
        await set(systemStatsRef, { 
          ...currentStats, 
          alertsToday: currentStats.alertsToday + 1 
        });
      }

      console.log('✓ Alert generated:', newAlert.type, '-', newAlert.severity);
    } catch (error) {
      console.error('Error generating alert:', error);
    }
  }, [isConnected, alertsRef, systemStatsRef]);

  // ----------------------------------------------------------------------------
  // FUNCTION: Generate Random Blocked Attempt
  // ----------------------------------------------------------------------------
  // Simulates blocked login attempts from various sources
  
  const generateRandomBlockedAttempt = useCallback(async () => {
    if (!isConnected) return;
    try {
    const usernames = [
      'admin', 'administrator', 'root', 'user', 'test', 'guest', 'service',
      'operator', 'manager', 'support', 'system', 'backup', 'postgres', 'mysql'
    ];
    
    const reasons = [
      'Invalid credentials', 'Multiple failed attempts', 'Suspicious behavior pattern',
      'Account locked', 'IP blacklisted', 'Geo-location blocked', 'Time-based restriction',
      'Brute force detection', 'Password complexity failure', 'Account disabled'
    ];

    const countries = ['CN', 'RU', 'KP', 'IR', 'US', 'UK', 'BR', 'IN', 'Unknown'];
    const methods = ['Web Interface', 'SSH', 'FTP', 'API', 'Database', 'VPN'];

    
      const newAttempt = {
        username: usernames[Math.floor(Math.random() * usernames.length)] + (Math.random() > 0.5 ? '***' : Math.floor(Math.random() * 999)),
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        time: new Date().toISOString(),
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        timestamp: Date.now(),
        country: countries[Math.floor(Math.random() * countries.length)],
        attempt_count: Math.floor(Math.random() * 15) + 1,
        method: methods[Math.floor(Math.random() * methods.length)],
        user_agent: Math.random() > 0.5 ? 'Automated Script' : 'Browser',
        blocked_duration: Math.floor(Math.random() * 7200) + 300,
        threat_score: Math.floor(Math.random() * 100)
      };

      await push(blockedAttemptsRef, newAttempt);

      // Update blocked attempts count
      const statsSnapshot = await get(systemStatsRef);
      if (statsSnapshot.exists()) {
        const currentStats = statsSnapshot.val();
        await set(systemStatsRef, { 
          ...currentStats, 
          blockedAttempts: currentStats.blockedAttempts + 1 
        });
      }

      console.log('✓ Blocked attempt logged');
    } catch (error) {
      console.error('Error generating blocked attempt:', error);
    }
  }, [isConnected, blockedAttemptsRef, systemStatsRef]);

  // ----------------------------------------------------------------------------
  // FUNCTION: Generate Network Usage Data
  // ----------------------------------------------------------------------------
  // Calculates network usage based on number of active users
  // Base: 2.5 MB per user + random variation
  let previousUsage = 35; // starting assumption
  let previousUpload = 40;
  let previousDownload = 90;

  const generateNetworkUsageData = useCallback(async () => {
    if (!isConnected) return;

    try {
      const now = new Date();

      // Smooth random walk
      const variation = (Math.random() * 2) - 1; // -1 to +1
      previousUsage = Math.max(10, Math.min(100, previousUsage + variation));

      // Smooth upload / download
      previousUpload += (Math.random() * 4 - 2);   // -2 to +2 Mbps drift
      previousDownload += (Math.random() * 4 - 2); // drift

      // clamp extremes
      previousUpload = Math.max(5, Math.min(60, previousUpload));
      previousDownload = Math.max(40, Math.min(150, previousDownload));

      const sessionsSnapshot = await get(activeSessionsRef);
      const activeUsers = sessionsSnapshot.exists()
        ? Object.keys(sessionsSnapshot.val()).length
        : 1;

      const newNetworkUsage = {
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: now.getTime(),
        totalUsage: parseFloat(previousUsage.toFixed(2)),
        activeUsers,
        uploadSpeed: parseFloat(previousUpload.toFixed(2)),
        downloadSpeed: parseFloat(previousDownload.toFixed(2)),
        packetsPerSecond: Math.floor(Math.random() * 50 + 10), // more stable
        bytesTransferred: Math.floor(previousUsage * activeUsers * 9000),
      };

      await push(networkUsageRef, newNetworkUsage);

    } catch (error) {
      console.error('Error generating network usage:', error);
    }
  }, [isConnected, rtdb, networkUsageRef, activeSessionsRef]);

  // ----------------------------------------------------------------------------
  // FUNCTION: Simulate User Latencies
  // ----------------------------------------------------------------------------
  // Simulates connection latency for all active users
  // Distribution: 70% low, 20% medium, 10% high latency
  // Generates alerts for high latency users
  
  const simulateUserLatencies = useCallback(async () => {
    if (!isConnected) return;

    try {
      const sessionsSnapshot = await get(activeSessionsRef);
      if (!sessionsSnapshot.exists()) return;

      const activeSessions = sessionsSnapshot.val();
      const latencyData = [];
      const now = Date.now();

      // Generate latency data for each active user
      for (const [userId, session] of Object.entries(activeSessions)) {
        const latencyType = Math.random();
        let latency, status, quality;

        if (latencyType < 0.70) {
          // 70% Low latency (good connection)
          latency = Math.floor(Math.random() * 30) + 5; // 5-35ms
          status = 'Excellent';
          quality = 'low';
        } else if (latencyType < 0.90) {
          // 20% Medium latency (moderate connection)
          latency = Math.floor(Math.random() * 70) + 35; // 35-105ms
          status = 'Good';
          quality = 'medium';
        } else {
          // 10% High latency (poor connection)
          latency = Math.floor(Math.random() * 150) + 100; // 100-250ms
          status = 'Poor';
          quality = 'high';
          
          // Generate alert for high latency
          const highLatencyAlert = {
            type: 'High Latency Warning',
            message: `User ${session.username} experiencing high latency (${latency}ms)`,
            time: new Date().toLocaleTimeString(),
            severity: 'medium',
            timestamp: now,
            userId: userId,
            latency: latency
          };
          
          await push(alertsRef, highLatencyAlert);
        }

        const userLatencyData = {
          userId,
          username: session.username,
          role: session.role,
          latency,
          status,
          quality,
          jitter: Math.floor(Math.random() * 10) + 1, // 1-10ms jitter
          packetLoss: parseFloat((Math.random() * (quality === 'high' ? 5 : 1)).toFixed(2)),
          timestamp: now,
          location: session.ipAddress,
        };

        latencyData.push(userLatencyData);
      }

      // Update Firebase with all user latencies
      await set(userLatenciesRef, latencyData.reduce((acc, item) => {
        acc[item.userId] = item;
        return acc;
      }, {}));

      // console.log('✓ User latencies updated:', latencyData.length, 'users');
    } catch (error) {
      console.error('Error simulating latencies:', error);
    }
  }, [isConnected, rtdb, userLatenciesRef, alertsRef, activeSessionsRef]);

  
  // ============================================================================
  // FIREBASE LISTENERS
  // ============================================================================
  // Real-time listeners that update UI when data changes in Firebase
  
  useEffect(() => {
    if (!isConnected) return;
    const unsubs = [];

    // active_traffic -> limit
    const trafficQ = query(activeTrafficRef, limitToLast(LIMITS.active_traffic));
    const trafficUnsub = onValue(trafficQ, (snap) => {
      const data = snap.val();
      if (!data) {
        setTrafficData([]);
        return;
      }
      const arr = Object.entries(data).map(([key, value]) => ({
        id: key,
        time: value.time || new Date().toISOString(),
        inbound: safeNumber(value.inbound, 0),
        outbound: safeNumber(value.outbound, 0),
        threats: safeNumber(value.threats, 0),
        timestamp: safeNumber(value.timestamp, Date.now())
      }));
      // ascending sort + then slice last N (should already be limited)
      const sorted = arr.sort((a, b) => a.timestamp - b.timestamp).slice(-LIMITS.active_traffic);
      setTrafficData(sorted);
    });
    unsubs.push(trafficUnsub);

    // network_usage
    const usageQ = query(networkUsageRef, limitToLast(25));
    const usageUnsub = onValue(usageQ, (snap) => {
      const data = snap.val();
      if (!data) { setNetworkUsageData([]); return; }
      const arr = Object.entries(data).map(([key, value]) => ({
        id: key,
        time: value.time || new Date().toISOString(),
        totalUsage: safeNumber(value.totalUsage, 0),
        activeUsers: safeNumber(value.activeUsers, 0),
        uploadSpeed: safeNumber(value.uploadSpeed, 0),
        downloadSpeed: safeNumber(value.downloadSpeed, 0),
        timestamp: safeNumber(value.timestamp, Date.now())
      }));
      const sorted = arr.sort((a, b) => a.timestamp - b.timestamp).slice(-LIMITS.network_usage);
      setNetworkUsageData(sorted);
    });
    unsubs.push(usageUnsub);

    // alerts
    const alertsQ = query(alertsRef, limitToLast(LIMITS.alerts));
    const alertsUnsub = onValue(alertsQ, (snap) => {
      const data = snap.val();
      if (!data) { setAlerts([]); return; }
      const arr = Object.entries(data).map(([key, value]) => ({ id: key, ...value, timestamp: safeNumber(value.timestamp, Date.now()) }));
      setAlerts(arr.sort((a, b) => b.timestamp - a.timestamp).slice(0, LIMITS.alerts));
    });
    unsubs.push(alertsUnsub);

    // blocked attempts
    const blockedQ = query(blockedAttemptsRef, limitToLast(LIMITS.blocked_attempts));
    const blockedUnsub = onValue(blockedQ, (snap) => {
      const data = snap.val();
      if (!data) { setBlockedAttempts([]); return; }
      const arr = Object.entries(data).map(([key, value]) => ({ id: key, ...value, timestamp: safeNumber(value.timestamp, Date.now()) }));
      setBlockedAttempts(arr.sort((a, b) => b.timestamp - a.timestamp).slice(0, LIMITS.blocked_attempts));
    });
    unsubs.push(blockedUnsub);

    // user_behavior (not huge)
    const behaviorQ = query(userBehaviorRef, limitToLast(LIMITS.user_behavior));
    const behaviorUnsub = onValue(behaviorQ, (snap) => {
      const data = snap.val();
      setUserBehaviorData(Array.isArray(data) ? data : Object.values(data || {}));
    });
    unsubs.push(behaviorUnsub);

    // dns filtering
    const dnsQ = query(dnsFilteringRef, limitToLast(LIMITS.dns_filtering));
    const dnsUnsub = onValue(dnsQ, (snap) => {
      const data = snap.val();
      setDnsFilteringData(Array.isArray(data) ? data : Object.values(data || {}));
    });
    unsubs.push(dnsUnsub);

    // user latencies (keep as map)
    const latUnsub = onValue(userLatenciesRef, (snap) => {
      const data = snap.val();
      setUserLatencies(data ? Object.values(data) : []);
    });
    unsubs.push(latUnsub);

    // KPI Metrics
    const kpiUnsub = onValue(kpiMetricsRef, (snap) => {
      const data = snap.val();
      if (data) {
        setKpiMetrics(data);
      }
    });
    unsubs.push(kpiUnsub);

    // Weekly Attack Summary
    const weeklySummaryUnsub = onValue(weeklyAttackSummaryRef, (snap) => {
      const data = snap.val();
      setWeeklyAttackSummary(Array.isArray(data) ? data : Object.values(data || {}));
    });
    unsubs.push(weeklySummaryUnsub);

    // Executive Narrative
    const narrativeUnsub = onValue(ref(rtdb, "exec_narrative"), (snap) => {
      const data = snap.val();
      if (data?.text) {
        setExecNarrative(data.text);
      }
    });
    unsubs.push(narrativeUnsub);

    // system stats (single object, no limit)
    const statsUnsub = onValue(systemStatsRef, (snap) => {
      const data = snap.val();
      setSystemStats(data || { totalUsers: 1247, activeConnections: 0, blockedAttempts: 0, alertsToday: 0 });
    });
    unsubs.push(statsUnsub);

    // connected users count
    const connUnsub = onValue(connectedUsersRef, (snap) => {
      const val = snap.val() || 0;
      setSystemStats(prev => ({ ...prev, activeConnections: val }));
    });
    unsubs.push(connUnsub);

    // Ensure manager intelligence nodes exist (schema guard)
    const managerBaseRef = ref(rtdb, "security_stats");
    const managerUnsub = onValue(managerBaseRef, async (snap) => {
      const val = snap.val() || {};

      // Create only if missing (NEVER overwrite)
      if (!val.kpi_metrics) {
        await set(ref(rtdb, "security_stats/kpi_metrics"), {});
      }

      if (!val.weekly_attack_summary) {
        await set(ref(rtdb, "security_stats/weekly_attack_summary"), []);
      }

      if (!val.exec_narrative) {
        await set(ref(rtdb, "security_stats/exec_narrative"), { text: "" });
      }
    });
    unsubs.push(managerUnsub);

    // cleanup
    return () => {
      unsubs.forEach(fn => { try { fn(); } catch(e) { /* ignore */ } });
    };
  }, [isConnected]); // only depends on connectivity

  // ---------------------------
  // Debounce rendered arrays (avoid UI thrash)
  // ---------------------------
  const [renderTraffic, setRenderTraffic] = useState([]);

  useEffect(() => {
    const id = setTimeout(() => setRenderTrafficData(trafficData), 200);
    return () => clearTimeout(id);
  }, [trafficData]);

  const [renderUsage, setRenderUsage] = useState([]);

  useEffect(() => {
    const id = setTimeout(() => setRenderNetworkUsage(networkUsageData), 200);
    return () => clearTimeout(id);
  }, [networkUsageData]);

  // Memoized chart inputs
  const memoTraffic = useMemo(() => renderTrafficData, [renderTrafficData]);
  const memoNetworkUsage = useMemo(() => renderNetworkUsage, [renderNetworkUsage]);

  // ============================================================================
  // MAIN POLLING LOOP
  // ============================================================================
  // Runs every 5 seconds to generate new data
  // - Traffic data: every poll
  // - Network usage: every poll
  // - User latencies: every poll
  // - Alerts: 12% chance per poll (~1-2 per minute)
  // - Blocked attempts: 18% chance per poll (~2-3 per minute)
  
  useEffect(() => {
    if (!isConnected) return;
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    let tick = 0;

    // initial seed
    generateRandomTrafficData();
    generateNetworkUsageData();

    pollingIntervalRef.current = setInterval(async () => {
      try {
        tick++;

        // traffic every 3 seconds
        if (tick % 5 === 0) {
          await generateRandomTrafficData();
        }

        // usage trends every 5 seconds
        if (tick % 5 === 0) {
          await generateNetworkUsageData();
        }

        // user latency every 6 seconds
        if (tick % 6 === 0) {
          await simulateUserLatencies();
        }

        // alerts occasionally (visual sanity)
        if (tick % 9 === 0 && Math.random() < 0.2) {
          await generateRandomAlert();
        }

        // blocked attempts occasionally
        if (tick % 12 === 0 && Math.random() < 0.3) {
          await generateRandomBlockedAttempt();
        }

        // Executive narrative auto-update every ~60 seconds
        if (tick % 45 === 0) {
          await set(ref(rtdb, "exec_narrative"), {
            text: generateNarrativeSummary(),
            updatedAt: Date.now()
          });
        }

        // slowly grow stats every ~20s
        if (tick % 20 === 0) {
          const statsSnapshot = await get(systemStatsRef);
          if (statsSnapshot.exists()) {
            const currentStats = statsSnapshot.val();
            await set(systemStatsRef, {
              ...currentStats,
              totalUsers: (currentStats.totalUsers || 1247) + (Math.random() > 0.95 ? 1 : 0)
            });
          }
        }

        // prevent overflow — reset cycle
        if (tick > 100000) tick = 0;

      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1000); // base interval = 1 second tick
    
    return () => clearInterval(pollingIntervalRef.current);
  }, [
    isConnected
  ]);

  // ============================================================================
  // DATA ARCHIVING
  // ============================================================================
  // Moves traffic data older than 3 hours to archived_traffic
  // Runs every 5 minutes to keep active data fresh
  
  useEffect(() => {
    if (!isConnected) return;
    const archiveOldData = async () => {
      try {
        const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
        const activeSnapshot = await get(activeTrafficRef);
        if (!activeSnapshot.exists()) return;
        const activeData = activeSnapshot.val();
        const activeArray = Object.entries(activeData).map(([key, value]) => ({ key, ...value, timestamp: safeNumber(value.timestamp, 0) }));
        const oldData = activeArray.filter(item => item.timestamp > 0 && item.timestamp < threeHoursAgo);
        // batch move (non-blocking)
        for (const item of oldData) {
          try {
            await set(ref(rtdb, `archive/${item.key}`), item); // use 'archive' node from your screenshot
            await remove(ref(rtdb, `active_traffic/${item.key}`));
          } catch (err) {
            console.error('Archive item error', err);
          }
        }
        if (oldData.length > 0) console.log(`Archived ${oldData.length} records`);
      } catch (err) {
        console.error('Archiver error', err);
      }
    };

    const id = setInterval(archiveOldData, 300000); // 5 min
    return () => clearInterval(id);
  }, [isConnected]);

  // ============================================================================
  // REPORT GENERATION
  // ============================================================================
  // Generates false positive reports for weekly, monthly, yearly, or custom periods
  
  const generateFalsePositiveReport = async (period, startDate, endDate) => {
    try {
      let startTime, endTime;
      const now = Date.now();
      
      if (period === 'custom') {
        if (!startDate || !endDate) {
          setError('Please select a valid date range');
          return;
        }
        startTime = startDate.getTime();
        endTime = endDate.getTime();
      } else {
        endTime = now;
        switch (period) {
          case 'weekly':
            startTime = now - 7 * 24 * 60 * 60 * 1000;
            break;
          case 'monthly':
            startTime = now - 30 * 24 * 60 * 60 * 1000;
            break;
          case 'yearly':
            startTime = now - 365 * 24 * 60 * 60 * 1000;
            break;
          default:
            return;
        }
      }

      const report = {
        period,
        startTime: new Date(startTime).toLocaleString(),
        endTime: new Date(endTime).toLocaleString(),
        falsePositiveAlerts: Math.floor(Math.random() * 20) + 5,
        falsePositiveBlocked: Math.floor(Math.random() * 30) + 10,
        falsePositiveTraffic: Math.floor(Math.random() * 50) + 15,
        details: {
          alerts: alerts.slice(0, 50),
          blocked: blockedAttempts.slice(0, 50),
          traffic: trafficData.slice(0, 50),
        },
      };

      setReportTitle(`${period.charAt(0).toUpperCase() + period.slice(1)} Security Report`);
      setReportData(report);
      setReportModalOpen(true);
    } catch (error) {
      setError('Failed to generate report: ' + error.message);
    }
  };


  // ============================================================================
  // EXPORT FUNCTIONS
  // ============================================================================
  
  // Export report data to CSV file
  const exportCSV = (reportData) => {
    if (!reportData) return;

    const headers = ['Type,Time,Details'];
    const rows = [];

    reportData.details.alerts.forEach((alert) => {
      rows.push(`Alert,${alert.time},"${alert.message} (${alert.severity})"`);
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_${reportData.period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export report data to PDF (placeholder)
  const exportPDF = () => {
    alert('PDF export functionality would use a library like jsPDF');
  };

  const handlePrint = () => {
    window.print();
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  // Get gradient color based on user role
  const getRoleColor = (role) => {
    switch (role) {
      case 'Administrator': return 'bg-gradient-red';
      case 'Manager': return 'bg-gradient-blue';
      case 'Security Analyst': return 'bg-gradient-green';
      default: return 'bg-gradient-blue';
    }
  };

  // Get icon emoji based on user role
  const getRoleIcon = (role) => {
    switch (role) {
      case 'Administrator': return '👑';
      case 'Manager': return '👨‍💼';
      case 'Security Analyst': return '🛡️';
      default: return '👤';
    }
  };

  // ============================================================================
  // DASHBOARD VIEW SELECTION
  // ============================================================================
  // Determines which view to show based on user role
  // All roles currently get AdminView (can be customized per role)
  
  let dashboardView;
switch (user.role) {
  case 'Administrator':
    dashboardView = (
      <AdminView
        alerts={alerts}
        blockedAttempts={blockedAttempts}
        trafficData={trafficData}
        userBehaviorData={userBehaviorData}
        dnsFilteringData={dnsFilteringData}
        networkUsageData={networkUsageData}
        userLatencies={userLatencies}
        systemStats={systemStats}
        generateFalsePositiveReport={generateFalsePositiveReport}
        reportStartDate={reportStartDate}
        setReportStartDate={setReportStartDate}
        reportEndDate={reportEndDate}
        setReportEndDate={setReportEndDate}
      />
    );
    break;
    
  case 'Security Analyst':
    dashboardView = (
      <SecurityAnalystView
        systemStats={systemStats}
        alerts={alerts}
        blockedAttempts={blockedAttempts}
        trafficData={trafficData}
        userBehaviorData={userBehaviorData}
        dnsFilteringData={dnsFilteringData}
        generateFalsePositiveReport={generateFalsePositiveReport}
        reportStartDate={reportStartDate}
        setReportStartDate={setReportStartDate}
        reportEndDate={reportEndDate}
        setReportEndDate={setReportEndDate}
      />
    );
    break;
    
  case 'Manager':
    dashboardView = (
      <ManagerView
        systemStats={systemStats}
        trafficData={trafficData}
        alerts={alerts}
        blockedAttempts={blockedAttempts}
        generateFalsePositiveReport={generateFalsePositiveReport}
        reportStartDate={reportStartDate}
        setReportStartDate={setReportStartDate}
        reportEndDate={reportEndDate}
        setReportEndDate={setReportEndDate}
        execNarrative={execNarrative}
      />
    );
    break;
    
  default:
    dashboardView = (
      <div className="glass-card-gradient text-center py-12">
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-white-60 mt-2">Invalid user role detected</p>
      </div>
    );
}

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================
  
  return (
    <AnimatedBackground>
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="fixed top-4 right-4 z-50 p-4 glass-card">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="text-sm text-white">Connecting to Firebase...</span>
          </div>
        </div>
      )}

      {/* Live Polling Indicator */}
      {isConnected && (
        <div className="fixed bottom-4 right-4 z-50 p-3 glass-card flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-white-60">Live • Polling every 5s</span>
        </div>
      )}

      {/* ====================================================================== */}
      {/* NEW TOP BAR DESIGN - REPLACING OLD HEADER */}
      {/* Includes: Logo, System Title, Time, Print, Reports, Notifications, User Info, Logout */}
      {/* ====================================================================== */}
      <header className="relative z-10" style={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(0, 0, 0, 0.2)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            
            {/* LEFT SIDE: Logo and Title - DYNAMIC BASED ON USER ROLE */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className={`stat-icon-bg ${getRoleColor(user.role)}`}></div>
                <div className={`stat-icon ${getRoleColor(user.role)} text-white p-3 rounded-xl`}>
                  <ShieldIcon />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {user.role === 'Administrator' && 'Administrator Dashboard'}
                  {user.role === 'Manager' && 'Manager Dashboard'}
                  {user.role === 'Security Analyst' && 'Security Analyst Dashboard'}
                  {!['Administrator', 'Manager', 'Security Analyst'].includes(user.role) && 'CIMB Security Command'}
                </h1>
                <p className="text-white-60 text-sm">
                  {user.role === 'Administrator' && 'Full System Control & Advanced Security Monitoring'}
                  {user.role === 'Manager' && 'Team Oversight & Performance Analytics'}
                  {user.role === 'Security Analyst' && 'Threat Detection & Security Analysis'}
                  {!['Administrator', 'Manager', 'Security Analyst'].includes(user.role) && 'Real-time Monitoring & Response Platform'}
                </p>
              </div>
            </div>
            
            {/* RIGHT SIDE: Actions, Time, User Info */}
            <div className="flex items-center space-x-4 flex-wrap gap-2">
              
              {/* System Time Display */}
              <div className="hidden lg:flex items-center space-x-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="text-white-60">
                  <ClockIcon />
                </div>
                <div className="text-left">
                  <p className="text-white-60 text-xs">System Time</p>
                  <p className="text-white font-mono text-sm">
                    {currentTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Print Button */}
              <button 
                onClick={() => setReportModalOpen(true)}
                className="p-2 rounded-lg transition-colors text-white hover:bg-white/10"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                title="Print Dashboard"
              >
                <PrinterIcon />
              </button>

              <ReportPreviewModal
                open={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                rtdb={rtdb}
              />

              {/* Reports Button */}
              <button 
                onClick={() => setReportModalOpen(true)}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-white hover:bg-blue-500/20"
                style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                title="Generate Reports"
              >
                <FileTextIcon />
                <span className="text-sm font-medium">Reports</span>
              </button>

              {/* Status Badges */}
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">Active</span>
              </div>

              {/* Alerts Counter */}
              <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <span className="text-white-60 text-xs">Alerts: </span>
                <span className="text-white font-bold">{alerts.length}</span>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button className="p-2 rounded-lg transition-colors text-white-60 hover:text-white hover:bg-white/10"
                        style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                        title="Notifications">
                  <BellIcon />
                  {alerts.filter(a => a.severity === 'high').length > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center space-x-3 pl-3 border-l border-white-10">
                <div className={`w-10 h-10 ${getRoleColor(user.role)} rounded-xl flex items-center justify-center text-lg shadow-lg`}>
                  {getRoleIcon(user.role)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-white font-medium text-sm">{user.username || 'User'}</p>
                  <p className="text-white-60 text-xs">{user.role || 'Unknown Role'}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={onLogout}
                className="p-2 rounded-lg transition-colors text-red-400 hover:bg-red-500/20"
                style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                title="Logout"
              >
                <LogOutIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center justify-between"
               style={{ 
                 background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.15) 0%, rgba(71, 85, 105, 0.1) 100%)',
                 border: '1px solid rgba(100, 116, 139, 0.25)'
               }}>
            <div className="flex items-center space-x-3">
              <div className="text-slate-300">
                <BellIcon />
              </div>
              <p className="text-slate-200 text-sm">{error}</p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard View (AdminView or role-specific view) */}
        {dashboardView}
      </main>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={reportTitle}
        reportData={reportData}
        exportCSV={exportCSV}
        exportPDF={exportPDF}
      />

      {/* Alert Details Modal */}
      <Modal isOpen={!!selectedAlert} onClose={() => setSelectedAlert(null)} title="Security Alert Details">
        {selectedAlert && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white-60">Alert Type</p>
                <p className="text-white font-semibold">{selectedAlert.type}</p>
              </div>
              <div>
                <p className="text-white-60">Severity Level</p>
                <p className={`font-semibold ${
                  selectedAlert.severity === 'high' ? 'text-slate-300' :
                  selectedAlert.severity === 'medium' ? 'text-blue-300' :
                  'text-cyan-300'
                }`}>{selectedAlert.severity?.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-white-60">Detection Time</p>
                <p className="text-white font-semibold">{selectedAlert.time}</p>
              </div>
              <div>
                <p className="text-white-60">Source IP</p>
                <p className="text-white-80 font-mono text-xs">{selectedAlert.source_ip}</p>
              </div>
            </div>
            <div>
              <p className="text-white-60 text-sm mb-2">Alert Description</p>
              <p className="text-white p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                {selectedAlert.message}
              </p>
            </div>
            <div className="flex space-x-3 pt-2">
              <button className="btn btn-primary btn-md flex-1" onClick={() => setSelectedAlert(null)}>
                Acknowledge
              </button>
              <button className="btn btn-danger btn-md flex-1" onClick={() => setSelectedAlert(null)}>
                Escalate
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Blocked Attempt Details Modal */}
      <Modal isOpen={!!selectedBlockedAttempt} onClose={() => setSelectedBlockedAttempt(null)} title="Blocked Login Attempt">
        {selectedBlockedAttempt && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white-60">Username</p>
                <p className="text-white font-mono">{selectedBlockedAttempt.username}</p>
              </div>
              <div>
                <p className="text-white-60">Source IP</p>
                <p className="text-white font-mono">{selectedBlockedAttempt.ip}</p>
              </div>
              <div>
                <p className="text-white-60">Attempt Time</p>
                <p className="text-white font-semibold">{selectedBlockedAttempt.time}</p>
              </div>
              <div>
                <p className="text-white-60">Country</p>
                <p className="text-white font-semibold">{selectedBlockedAttempt.country}</p>
              </div>
            </div>
            <div>
              <p className="text-white-60 text-sm mb-2">Block Reason</p>
              <p className="text-white p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                {selectedBlockedAttempt.reason}
              </p>
            </div>
            <div className="flex space-x-3 pt-2">
              <button className="btn btn-primary btn-md flex-1" onClick={() => setSelectedBlockedAttempt(null)}>
                Whitelist
              </button>
              <button className="btn btn-danger btn-md flex-1" onClick={() => setSelectedBlockedAttempt(null)}>
                Block Range
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AnimatedBackground>
  );
};

function generateNarrativeSummary() {
  const changes = Math.floor(Math.random() * 20) + 5;
  const dept = ["Finance", "R&D", "Marketing", "Engineering"][Math.floor(Math.random()*4)];
  const riskShift = ["increased", "spiked", "stabilized", "decreased"][Math.floor(Math.random()*4)];
  const day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][Math.floor(Math.random()*5)];
  
  return `Alert volume ${riskShift} by ${changes}% compared to last week. Most suspicious activity originated from VLAN-${dept}. Predicted threat spike on ${day} based on current velocity.`;
}

export default SecuritySystemDashboard;