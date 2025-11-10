// ============================================================================
// AIAnalysisPanel.jsx - Enhanced AI Network Analysis Component
// ============================================================================

import React, { useState } from 'react';

const AIAnalysisPanel = ({ trafficData, alerts, blockedAttempts, systemStats }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisType, setAnalysisType] = useState('');

  const API_URL = 'http://localhost:5000/api/analyze';

  // SVG Icons
  const BrainIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
    </svg>
  );

  const TrendingUpIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );

  const AlertIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );

  const ShieldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );

  const LightbulbIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="9" y1="18" x2="15" y2="18"/>
      <line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  );

  const analyzeTrafficTrend = async () => {
    setLoading(true);
    setError('');
    setAnalysisType('trend');
    try {
      const response = await fetch(`${API_URL}/traffic-trend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trafficData: trafficData.slice(-20),
          timeRange: '1h'
        })
      });
      
      if (!response.ok) throw new Error('Analysis failed');
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError('Failed to analyze traffic trend. Please ensure the AI service is running.');
      console.error('Analysis error:', err);
    }
    setLoading(false);
  };

  const detectAnomalies = async () => {
    setLoading(true);
    setError('');
    setAnalysisType('anomaly');
    try {
      const response = await fetch(`${API_URL}/anomaly-detection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trafficData: trafficData.slice(-20),
          sensitivity: 'medium'
        })
      });
      
      if (!response.ok) throw new Error('Detection failed');
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError('Failed to detect anomalies. Please ensure the AI service is running.');
      console.error('Anomaly detection error:', err);
    }
    setLoading(false);
  };

  const assessThreats = async () => {
    setLoading(true);
    setError('');
    setAnalysisType('threat');
    try {
      const response = await fetch(`${API_URL}/threat-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alerts: alerts.slice(-50),
          trafficData: trafficData.slice(-20),
          blockedAttempts: blockedAttempts.slice(-50)
        })
      });
      
      if (!response.ok) throw new Error('Assessment failed');
      
      const data = await response.json();
      setAnalysis(data.assessment);
    } catch (err) {
      setError('Failed to assess threats. Please ensure the AI service is running.');
      console.error('Threat assessment error:', err);
    }
    setLoading(false);
  };

  const getRecommendations = async () => {
    setLoading(true);
    setError('');
    setAnalysisType('recommendations');
    try {
      const response = await fetch(`${API_URL}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemStats: systemStats,
          alerts: alerts.slice(-50),
          trafficData: trafficData.slice(-20)
        })
      });
      
      if (!response.ok) throw new Error('Failed to get recommendations');
      
      const data = await response.json();
      setAnalysis(data.recommendations);
    } catch (err) {
      setError('Failed to generate recommendations. Please ensure the AI service is running.');
      console.error('Recommendations error:', err);
    }
    setLoading(false);
  };

  const renderTrendAnalysis = (data) => (
    <div className="space-y-4">
      <div className="p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
        <h4 className="text-white font-bold mb-2">Analysis Summary</h4>
        <p className="text-white-80">{data.summary}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <p className="text-white-60 text-sm">Avg Inbound</p>
          <p className="text-white text-xl font-bold">{data.average_inbound} Mbps</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <p className="text-white-60 text-sm">Avg Outbound</p>
          <p className="text-white text-xl font-bold">{data.average_outbound} Mbps</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <p className="text-white-60 text-sm">Total Threats</p>
          <p className="text-white text-xl font-bold">{data.total_threats}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <p className="text-white-60 text-sm">Trend</p>
          <p className={`text-xl font-bold ${data.trend_direction === 'increasing' ? 'text-red-400' : 'text-green-400'}`}>
            {data.trend_direction}
          </p>
        </div>
      </div>

      {data.insights && data.insights.length > 0 && (
        <div className="p-4 rounded-lg" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
          <h4 className="text-white font-bold mb-2">Insights</h4>
          <ul className="space-y-2">
            {data.insights.map((insight, idx) => (
              <li key={idx} className="text-white-80 text-sm flex items-start">
                <span className="text-cyan-400 mr-2">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderAnomalies = (data) => (
    <div className="space-y-4">
      <div className="p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
        <h4 className="text-white font-bold mb-2">Anomalies Detected</h4>
        <p className="text-white-80">Found {data.anomaly_count} anomalous data points</p>
      </div>

      {data.anomalies && data.anomalies.length > 0 ? (
        <div className="space-y-3">
          {data.anomalies.slice(0, 5).map((anomaly, idx) => (
            <div key={idx} className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-white font-semibold">Anomaly #{idx + 1}</p>
                <span className="px-2 py-1 rounded text-xs font-semibold bg-red-400 text-white">
                  Score: {anomaly.anomaly_score}
                </span>
              </div>
              <p className="text-white-60 text-sm">{anomaly.reason}</p>
              <p className="text-white-40 text-xs mt-1">Time: {anomaly.time}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-white-60">No anomalies detected in current data</p>
        </div>
      )}
    </div>
  );

  const renderThreatAssessment = (data) => (
    <div className="space-y-4">
      <div className="p-6 rounded-lg text-center" style={{ 
        background: data.color === 'red' ? 'rgba(239, 68, 68, 0.2)' :
                   data.color === 'orange' ? 'rgba(249, 115, 22, 0.2)' :
                   data.color === 'yellow' ? 'rgba(234, 179, 8, 0.2)' :
                   'rgba(34, 197, 94, 0.2)'
      }}>
        <h4 className="text-white text-xl font-bold mb-2">Threat Level: {data.level}</h4>
        <p className="text-white text-4xl font-bold mb-2">{data.score}</p>
        <p className="text-white-80 text-sm">Threat Score</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <p className="text-white-60 text-sm">High Severity</p>
          <p className="text-white text-xl font-bold">{data.high_severity_count}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <p className="text-white-60 text-sm">Medium Severity</p>
          <p className="text-white text-xl font-bold">{data.medium_severity_count}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <p className="text-white-60 text-sm">Low Severity</p>
          <p className="text-white text-xl font-bold">{data.low_severity_count}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <p className="text-white-60 text-sm">Blocked</p>
          <p className="text-white text-xl font-bold">{data.blocked_attempts_count}</p>
        </div>
      </div>

      <div className="p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
        <h4 className="text-white font-bold mb-2">Recommendation</h4>
        <p className="text-white-80">{data.recommendation}</p>
      </div>
    </div>
  );

  const renderRecommendations = (data) => (
    <div className="space-y-4">
      {data.priority && data.priority.length > 0 && (
        <div>
          <h4 className="text-white font-bold mb-3">Priority Actions</h4>
          <div className="space-y-3">
            {data.priority.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <h5 className="text-white font-semibold mb-1">{rec.title}</h5>
                <p className="text-white-80 text-sm mb-2">{rec.description}</p>
                <p className="text-white-60 text-xs">Action: {rec.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.general && data.general.length > 0 && (
        <div>
          <h4 className="text-white font-bold mb-3">General Recommendations</h4>
          <div className="space-y-3">
            {data.general.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <h5 className="text-white font-semibold mb-1">{rec.title}</h5>
                <p className="text-white-80 text-sm mb-2">{rec.description}</p>
                <p className="text-white-60 text-xs">Action: {rec.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.preventive && data.preventive.length > 0 && (
        <div>
          <h4 className="text-white font-bold mb-3">Preventive Measures</h4>
          <div className="space-y-3">
            {data.preventive.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                <h5 className="text-white font-semibold mb-1">{rec.title}</h5>
                <p className="text-white-80 text-sm mb-2">{rec.description}</p>
                <p className="text-white-60 text-xs">Action: {rec.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="glass-card">
      <div className="flex items-center mb-6">
        <div className="p-2 rounded-lg mr-3" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
          <BrainIcon />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">AI Network Analysis</h3>
          <p className="text-white-60 text-sm">Machine learning-powered insights</p>
        </div>
      </div>

      {/* Analysis Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <button 
          onClick={analyzeTrafficTrend} 
          disabled={loading}
          className="btn btn-primary btn-md flex items-center justify-center"
        >
          <TrendingUpIcon />
          <span className="ml-2">Traffic Trend</span>
        </button>
        <button 
          onClick={detectAnomalies} 
          disabled={loading}
          className="btn btn-warning btn-md flex items-center justify-center"
        >
          <AlertIcon />
          <span className="ml-2">Anomalies</span>
        </button>
        <button 
          onClick={assessThreats} 
          disabled={loading}
          className="btn btn-danger btn-md flex items-center justify-center"
        >
          <ShieldIcon />
          <span className="ml-2">Threats</span>
        </button>
        <button 
          onClick={getRecommendations} 
          disabled={loading}
          className="btn btn-success btn-md flex items-center justify-center"
        >
          <LightbulbIcon />
          <span className="ml-2">Recommendations</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white-60">Analyzing network data...</p>
          <p className="text-white-40 text-sm mt-2">This may take a few seconds</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <div className="border-t border-white-10 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-bold">Analysis Results</h4>
            <button 
              onClick={() => setAnalysis(null)}
              className="text-white-60 hover:text-white text-sm"
            >
              Clear
            </button>
          </div>
          
          {analysisType === 'trend' && renderTrendAnalysis(analysis)}
          {analysisType === 'anomaly' && renderAnomalies(analysis)}
          {analysisType === 'threat' && renderThreatAssessment(analysis)}
          {analysisType === 'recommendations' && renderRecommendations(analysis)}
        </div>
      )}

      {/* Initial State */}
      {!analysis && !loading && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
            <BrainIcon />
          </div>
          <p className="text-white-60">Select an analysis type to begin</p>
          <p className="text-white-40 text-sm mt-2">AI-powered insights at your fingertips</p>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;