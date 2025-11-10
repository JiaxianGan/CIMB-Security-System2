// ============================================================================
// CriticalAlertModal.jsx - Critical System Alert Popup
// ============================================================================
// Displays high-priority alerts that require immediate admin attention
// ============================================================================

import React, { useEffect, useRef } from 'react';

const CriticalAlertModal = ({ alert, onClose, onAcknowledge, onEscalate }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    // Play alert sound when modal opens
    if (audioRef.current && alert) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [alert]);

  if (!alert) return null;

  const analysis = alert.analysis || {};
  const priorityColor = {
    'critical': '#ef4444',
    'high': '#f97316',
    'medium': '#eab308',
    'low': '#10b981'
  };

  const impactColor = {
    'critical': 'rgba(239, 68, 68, 0.2)',
    'high': 'rgba(249, 115, 22, 0.2)',
    'medium': 'rgba(234, 179, 8, 0.2)',
    'low': 'rgba(16, 185, 129, 0.2)'
  };

  // SVG Icons
  const AlertOctagonIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );

  const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  );

  const ServerIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/>
      <line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
  );

  return (
    <>
      {/* Audio alert */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAo=" />

      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      >
        {/* Modal container */}
        <div 
          className="relative w-full max-w-2xl"
          style={{ animation: 'slideDown 0.3s ease-out' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pulsing border effect for critical alerts */}
          {analysis.priority === 'critical' && (
            <div 
              className="absolute inset-0 rounded-2xl animate-pulse"
              style={{
                border: '3px solid #ef4444',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)',
              }}
            />
          )}

          {/* Main modal content */}
          <div 
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
              border: `2px solid ${priorityColor[analysis.priority] || '#3b82f6'}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header with priority indicator */}
            <div 
              className="p-6 border-b border-white-10"
              style={{ background: impactColor[analysis.impactLevel] || 'rgba(59, 130, 246, 0.1)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div 
                    className="p-3 rounded-xl animate-pulse"
                    style={{ 
                      background: priorityColor[analysis.priority] || '#3b82f6',
                      boxShadow: `0 0 20px ${priorityColor[analysis.priority]}80`
                    }}
                  >
                    <AlertOctagonIcon />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span 
                        className="px-3 py-1 rounded-lg text-xs font-bold text-white uppercase"
                        style={{ background: priorityColor[analysis.priority] || '#3b82f6' }}
                      >
                        {analysis.priority || 'ALERT'}
                      </span>
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white-10 text-white-80">
                        Risk Score: {analysis.riskScore}/100
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{alert.type}</h3>
                    <div className="flex items-center space-x-4 text-white-60 text-sm">
                      <div className="flex items-center space-x-1">
                        <ClockIcon />
                        <span>{alert.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ServerIcon />
                        <span>{alert.source_ip || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white-10 transition-colors text-white-60 hover:text-white"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Alert message */}
            <div className="p-6 border-b border-white-10">
              <h4 className="text-white font-semibold mb-2">Alert Description</h4>
              <p className="text-white-80 text-lg leading-relaxed">{alert.message}</p>
            </div>

            {/* Analysis details */}
            <div className="p-6 space-y-4">
              {/* Impact assessment */}
              <div>
                <h4 className="text-white font-semibold mb-3">Impact Assessment</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <p className="text-white-60 text-sm mb-1">Impact Level</p>
                    <p className="text-white text-xl font-bold capitalize">{analysis.impactLevel}</p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <p className="text-white-60 text-sm mb-1">Downtime Risk</p>
                    <p className="text-white text-xl font-bold">{analysis.estimatedDowntimeRisk}%</p>
                  </div>
                </div>
              </div>

              {/* Affected systems */}
              {analysis.affectedSystems && analysis.affectedSystems.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Affected Systems</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.affectedSystems.map((system, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 rounded-lg text-sm font-medium"
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
                      >
                        {system}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis reasons */}
              {analysis.reasons && analysis.reasons.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Why This Alert is Critical</h4>
                  <ul className="space-y-2">
                    {analysis.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-white-80 text-sm">
                        <span className="text-red-400 mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation */}
              <div 
                className="p-4 rounded-lg border-l-4"
                style={{ 
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderColor: '#3b82f6'
                }}
              >
                <h4 className="text-white font-semibold mb-2">Recommended Action</h4>
                <p className="text-white-80 text-sm">{analysis.recommendation}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-6 border-t border-white-10 flex space-x-3">
              <button
                onClick={onAcknowledge}
                className="flex-1 btn btn-primary btn-lg"
              >
                Acknowledge & Investigate
              </button>
              <button
                onClick={onEscalate}
                className="flex-1 btn btn-danger btn-lg"
              >
                Escalate to Team
              </button>
              <button
                onClick={onClose}
                className="btn btn-outline btn-lg"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default CriticalAlertModal;