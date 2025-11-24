// ============================================================================
// ManagerView.jsx - Enhanced Manager Dashboard View with Alert Monitoring
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import DatePicker from 'react-datepicker';
import AIAnalysisPanel from './AIAnalysisPanel';
import AlertAnalyzer from './AlertAnalyzer';
import CriticalAlertModal from './CriticalAlertModal';
import NotificationSystem from './NotificationSystem';
import 'react-datepicker/dist/react-datepicker.css';

const kpiBoxStyle = {
  background: 'rgba(255,255,255,0.05)',
  padding: '10px 16px',
  borderRadius: '10px',
  color: 'white',
  fontSize: '0.85rem'
};

// ============================================================================
// ALERT MONITORING HOOK (Read-only for Manager)
// ============================================================================
const useAlertMonitoring = (alerts, trafficData, blockedAttempts, systemStats) => {
  const [notifications, setNotifications] = useState([]);
  const [processedAlertIds, setProcessedAlertIds] = useState(new Set());
  const analyzerRef = useRef(new AlertAnalyzer());

  useEffect(() => {
    if (alerts.length === 0) return;

    const latestAlert = alerts[0];
    if (processedAlertIds.has(latestAlert.id)) return;

    const analyzer = analyzerRef.current;
    const recentAlerts = alerts.slice(0, 20);
    const recentTraffic = trafficData.slice(0, 20);
    const recentBlocked = blockedAttempts.slice(0, 50);

    const analysis = analyzer.analyzeAlert(
      latestAlert,
      recentAlerts,
      systemStats,
      recentTraffic,
      recentBlocked
    );

    const formattedAlert = analyzer.formatAlertForDisplay(latestAlert, analysis);
    setProcessedAlertIds(prev => new Set([...prev, latestAlert.id]));

    // Manager only receives notifications (no critical alert popups)
    setNotifications(prev => [
      { ...formattedAlert, read: false },
      ...prev
    ].slice(0, 50));

  }, [alerts, trafficData, blockedAttempts, systemStats, processedAlertIds]);

  useEffect(() => {
    if (processedAlertIds.size > 100) {
      const idsArray = Array.from(processedAlertIds);
      setProcessedAlertIds(new Set(idsArray.slice(-100)));
    }
  }, [processedAlertIds]);

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
    }
  };

  const handleViewDetails = (notification) => {
    handleMarkAsRead(notification.id);
  };

  return {
    notifications,
    handleMarkAsRead,
    handleClearAll,
    handleViewDetails
  };
};

const ManagerView = ({
  systemStats = { totalUsers: 0, activeConnections: 0, alertsToday: 0, blockedAttempts: 0 },
  alerts = [],
  blockedAttempts = [],
  trafficData = [],
  userBehaviorData,
  dnsFilteringData,
  generateFalsePositiveReport,
  reportStartDate,
  setReportStartDate,
  reportEndDate,
  setReportEndDate,
  execNarrative,
  kpiMetrics,
  weeklyAttackSummary
}) => {
  
  // Alert Monitoring Hook (Read-only for Manager)
  const {
    criticalAlert,
    notifications,
    handleAcknowledge,
    handleEscalate,
    handleDismiss,
    handleMarkAsRead,
    handleClearAll,
    handleViewDetails
  } = useAlertMonitoring(alerts, trafficData, blockedAttempts, systemStats);

  // SVG Icons
  const UsersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );

  const ActivityIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );

  const ShieldOffIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"/>
      <path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.3 20.3 0 0 0 5.62-4.38"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  const AlertTriangleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );

  const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );

  const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* Critical Alert Modal */}
      <CriticalAlertModal
        alert={criticalAlert}
        onClose={handleDismiss}
        onAcknowledge={handleAcknowledge}
        onEscalate={handleEscalate}
      />
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',  // two equal columns
        gap: '1.5rem',
        width: '100%',
        alignItems: 'start'              // aligns items vertically top
      }}>
      </div>

      {/* ====================================================================== */}
      {/* SYSTEM STATISTICS CARDS */}
      {/* ====================================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {[
          { label: 'Total Users', value: systemStats.totalUsers, icon: <UsersIcon />, gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', shadow: 'rgba(59, 130, 246, 0.3)' },
          { label: 'Active Connections', value: systemStats.activeConnections, icon: <ActivityIcon />, gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', shadow: 'rgba(16, 185, 129, 0.3)' },
          { label: 'Alerts Today', value: systemStats.alertsToday, icon: <AlertTriangleIcon />, gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', shadow: 'rgba(245, 158, 11, 0.3)' },
          { label: 'Blocked Attempts', value: systemStats.blockedAttempts, icon: <ShieldOffIcon />, gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', shadow: 'rgba(239, 68, 68, 0.3)' }
        ].map((stat, idx) => (
          <div key={idx} style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: `0 10px 40px ${stat.shadow}`,
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = `0 15px 50px ${stat.shadow}`;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 10px 40px ${stat.shadow}`;
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', lineHeight: '1', marginBottom: '0.5rem' }}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                background: stat.gradient,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 25px ${stat.shadow}`
              }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ====================================================================== */}
      {/* NETWORK TRAFFIC FLOW */}
      {/* ====================================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '4px',
            height: '28px',
            background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '4px'
          }} />
          <h3 className="text-xl font-bold text-white">Network Traffic Flow</h3>
        </div>

        {/* Network Traffic Flow - Full Width */}
                <div style={{ marginBottom: '2rem' , height:500}}>
                  {trafficData && trafficData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        key={trafficData[0]?.timestamp}
                        data={trafficData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="threatsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="time" 
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                          label={{ value: 'Traffic (Mbps)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.6)' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px',
                            padding: '12px'
                          }}
                          labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}
                          itemStyle={{ color: '#fff', padding: '4px 0' }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="line"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="inbound" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          name="Inbound Traffic"
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, fill: '#3b82f6' }}
                          animationDuration={500}
                          isAnimationActive={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="outbound" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          name="Outbound Traffic"
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, fill: '#10b981' }}
                          animationDuration={500}
                          isAnimationActive={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="threats" 
                          stroke="#ef4444" 
                          strokeWidth={3}
                          name="Threats Detected"
                          dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, fill: '#ef4444' }}
                          animationDuration={500}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ 
                      height: '520px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '12px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          width: '48px', 
                          height: '48px', 
                          border: '4px solid rgba(59, 130, 246, 0.3)',
                          borderTopColor: '#3b82f6',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          margin: '0 auto 16px'
                        }}></div>
                        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading traffic data...</p>
                      </div>
                    </div>
                  )}
                </div>
      </div>

            {/* ====================================================================== */}
            {/* USER BEHAVIOR & DNS ANALYTICS - NEW SECTION WITH TWO COLUMNS */}
            {/* ====================================================================== */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',  // two equal columns
              gap: '1.5rem',
              width: '100%',
              alignItems: 'start'              // aligns items vertically top
            }}>
              {/* USER BEHAVIOR ANALYSIS */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "24px",
                  padding: "2rem",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "4px",
                      height: "28px",
                      background: "linear-gradient(180deg, #3b82f6 0%, #06b6d4 100%)",
                      borderRadius: "4px",
                    }}
                  />
                  <h3 className="text-xl font-bold text-white">User Behavior Analysis</h3>
                </div>
      
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Tooltip
                      formatter={(value, name, entry) => [
                        `${value}%`,
                        `${entry.payload.behavior} (${entry.payload.risk} risk)`,
                      ]}
                      contentStyle={{
                        background: "rgba(8,12,20,0.95)",
                        border: "1px solid rgba(59,130,246,0.6)",
                        borderRadius: "12px",
                        color: "#f9fafb",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        padding: "8px 12px",
                        boxShadow: "0 0 10px rgba(59,130,246,0.4)",
                      }}
                      cursor={{ fill: "rgba(59,130,246,0.1)" }}
                    />
      
                    <Pie
                      data={userBehaviorData}
                      dataKey="value"
                      nameKey="behavior"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      label={(entry) => `${entry.behavior}: ${entry.value}%`}
                    >
                      {userBehaviorData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.risk === "high"
                              ? "#ef4444"
                              : entry.risk === "medium"
                              ? "#f59e0b"
                              : "#10b981"
                          }
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
      
                {/* CENTER KPI */}
                <div
                  style={{
                    textAlign: "left",
                    color: "white",
                    marginTop: "0.5rem",
                    marginBottom: "0.5rem",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    lineHeight: "1.4",
                  }}
                >
                  Risk Level:{" "}
                  {userBehaviorData.some((i) => i.risk === "high")
                    ? "Elevated"
                    : "Normal"}
                </div>
      
                {/* BEHAVIOR DETAILS */}
                <div style={{ marginTop: "1rem", color: "white" }}>
                  <strong>Behavior Indicators:</strong>
                  <ul style={{
                    fontSize: "0.85rem",
                    marginTop: "0.5rem",
                    color: "white",
                    opacity: 1.0,
                    lineHeight: "1.4",
                  }}>
                    {userBehaviorData
                      .flatMap((item) => item.examples)
                      .slice(0, 5)
                      .map((ex, idx) => (
                        <li key={idx}>• {ex}</li>
                      ))}
                  </ul>
                </div>
      
                {/* TRENDS */}
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "1rem",
                    flexWrap: "wrap",
                    justifyContent: "flex-start",
                  }}
                >
                  {userBehaviorData.map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.05)",
                        fontSize: "0.75rem",
                        color: "white",
                        marginRight: "6px",
                        marginBottom: "6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.behavior} {item.trend > 0 ? "↑" : "↓"}
                    </span>
                  ))}
                </div>
              </div>
      
              {/* DNS Protection - RIGHT */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '2rem',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '4px',
                    height: '28px',
                    background: 'linear-gradient(180deg, #3b82f6 0%, #06b6d4 100%)',
                    borderRadius: '4px'
                  }} />
                  <h3 className="text-xl font-bold text-white">DNS Protection Statistics</h3>
                </div>
      
                {/* KPI SUMMARY */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
      
                  <div style={kpiBoxStyle}>
                    Total Blocked: {
                      dnsFilteringData
                        .filter(item => item && item.blocked)
                        .reduce((a,b)=> a + b.blocked, 0)
                    }
                  </div>
      
                  <div style={kpiBoxStyle}>
                    Highest Threat: {
                      dnsFilteringData
                        .filter(item => item && item.category)
                        .sort((a,b)=> b.blocked - a.blocked)[0]?.category ?? "N/A"
                    }
                  </div>
      
                  <div style={kpiBoxStyle}>
                    Rising Threat Categories: {
                      dnsFilteringData
                        .filter(item => item && typeof item.trend === "number" && item.trend > 0)
                        .length
                    }
                  </div>
      
                </div>
      
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={[...dnsFilteringData].sort((a,b)=> b.blocked - a.blocked)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="category"
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        name === "blocked" ? "Blocked Requests" : "Allowed Requests"
                      ]}
                      contentStyle={{
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: '12px',
                        color: 'white',
                        width: '240px'
                      }}
                      cursor={{ fill: 'rgba(59,130,246,0.1)' }}
                    />
      
                    {/* Allowed Requests */}
                    <Bar
                      dataKey="allowed"
                      fill="#10b981"
                      stackId="dns"
                      radius={[8, 8, 0, 0]}
                      name="Allowed Requests"
                    />
      
                    {/* Blocked Requests */}
                    <Bar
                      dataKey="blocked"
                      stackId="dns"
                      name="Blocked Requests"
                    >
                      {dnsFilteringData
                      .filter(entry => entry && entry.category)
                      .map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            entry.trend > 0
                              ? "#ef4444"   // threat trending up
                              : "#3b82f6"   // stable / normal
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
      
                {/* BLOCK RATE SUMMARY */}
                <div style={{ marginTop:'1rem', color:'white' }}>
                  <p>
                    <strong>Average Block Rate:</strong>{" "}
                    {(
                      dnsFilteringData.reduce((a,b)=> a + b.blocked,0) /
                      dnsFilteringData.reduce((a,b)=> a + b.allowed,0) * 100
                    ).toFixed(2)}%
                  </p>
                </div>
      
                {/* THREAT SEVERITY */}
                <div style={{ display:'flex', gap:'0.5rem', marginTop:'1rem', flexWrap:"wrap" }}>
                  {dnsFilteringData
                    ?.filter(item => item && item.category)
                    .map((item, idx) => (
                    <span key={idx} style={{
                      padding:"4px 10px",
                      borderRadius:"6px",
                      fontSize:"0.75rem",
                      fontWeight:"600",
                      background: item.severity === "high"
                        ? "rgba(239,68,68,0.2)"
                        : item.severity === "medium"
                        ? "rgba(245,158,11,0.2)"
                        : "rgba(16,185,129,0.2)",
                      color: item.severity === "high"
                        ? "#ef4444"
                        : item.severity === "medium"
                        ? "#f59e0b"
                        : "#10b981"
                    }}>
                      {item.category}: {item.severity}
                    </span>
                  ))}
                </div>
      
                {/* TOP THREAT DOMAINS */}
                <div style={{ marginTop:'1rem', color:'white' }}>
                  <strong>Top Threat Domains:</strong>
                  <ul style={{ fontSize:'0.85rem', marginTop:'0.5rem', opacity:0.8 }}>
                    {dnsFilteringData
                      .flatMap(item => item?.topDomains ?? [])
                      .slice(0, 5)
                      .map((domain, idx)=>(
                        <li key={idx}>• {domain}</li>
                    ))}
                  </ul>
                </div>
      
              </div>
            </div>

      {/* ====================================================================== */}
      {/* AI ANALYSIS PANEL */}
      {/* ====================================================================== */}
      <AIAnalysisPanel
        trafficData={trafficData}
        alerts={alerts}
        blockedAttempts={blockedAttempts}
        systemStats={systemStats}
      />

      {/* ====================================================================== */}
      {/* REPORT GENERATION SECTION */}
      {/* ====================================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '4px',
            height: '28px',
            background: 'linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%)',
            borderRadius: '4px'
          }} />
          <h3 className="text-xl font-bold text-white">Generate Security Report</h3>
        </div>
        
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Export historical data for analysis and compliance reporting
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {['weekly', 'monthly', 'yearly'].map((period) => (
            <button
              key={period}
              onClick={() => generateFalsePositiveReport(period)}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                color: 'white',
                border: 'none',
                padding: '1rem',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)';
              }}
            >
              <DownloadIcon />
              <span>{period.charAt(0).toUpperCase() + period.slice(1)} Report</span>
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
          <h4 style={{ color: 'white', fontWeight: '600', marginBottom: '1rem' }}>Custom Date Range</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                Start Date
              </label>
              <DatePicker
                selected={reportStartDate}
                onChange={(date) => setReportStartDate(date)}
                className="form-input"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select start date"
                maxDate={new Date()}
              />
            </div>
            <div>
              <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                End Date
              </label>
              <DatePicker
                selected={reportEndDate}
                onChange={(date) => setReportEndDate(date)}
                className="form-input"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select end date"
                maxDate={new Date()}
              />
            </div>
          </div>
          <button
            onClick={() => generateFalsePositiveReport('custom', reportStartDate, reportEndDate)}
            disabled={!reportStartDate || !reportEndDate}
            style={{
              width: '100%',
              marginTop: '1rem',
              background: !reportStartDate || !reportEndDate ? 'rgba(100, 116, 139, 0.3)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: !reportStartDate || !reportEndDate ? 'not-allowed' : 'pointer',
              boxShadow: !reportStartDate || !reportEndDate ? 'none' : '0 8px 20px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => {
              if (reportStartDate && reportEndDate) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (reportStartDate && reportEndDate) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)';
              }
            }}
          >
            <DownloadIcon />
            <span>Generate Custom Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerView;