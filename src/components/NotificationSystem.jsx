// ============================================================================
// NotificationSystem.jsx - Notification Badge and Panel
// ============================================================================
// Displays non-critical alerts as notifications similar to phone messages
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';

const NotificationSystem = ({ notifications, onMarkAsRead, onClearAll, onViewDetails }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    // Count unread notifications
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    // Close panel when clicking outside
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // SVG Icons
  const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );

  const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  );

  const InfoIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl transition-colors text-white-60 hover:text-white"
        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
      >
        <BellIcon />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <div 
            className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white animate-pulse"
            style={{ 
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              padding: '0 0.25rem',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 rounded-xl overflow-hidden shadow-2xl z-50"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            backdropFilter: 'blur(16px)',
            maxHeight: '600px',
            animation: 'slideDown 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-white-10 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold">Notifications</h3>
              <p className="text-white-60 text-xs mt-1">
                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    notifications.forEach(n => {
                      if (!n.read) onMarkAsRead(n.id);
                    });
                  }}
                  className="p-2 rounded-lg hover:bg-white-10 transition-colors text-white-60 hover:text-white"
                  title="Mark all as read"
                >
                  <CheckIcon />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="p-2 rounded-lg hover:bg-white-10 transition-colors text-white-60 hover:text-white"
                  title="Clear all"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '500px' }}>
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                     style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <BellIcon />
                </div>
                <p className="text-white-60">No notifications</p>
                <p className="text-white-40 text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-white-10 hover:bg-white-5 transition-colors cursor-pointer"
                  onClick={() => onViewDetails(notification)}
                  style={{
                    background: notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)'
                  }}
                >
                  <div className="flex items-start space-x-3">
                    {/* Priority indicator */}
                    <div
                      className="w-1 h-full rounded-full mt-1"
                      style={{ 
                        background: getPriorityColor(notification.analysis?.priority),
                        minHeight: '60px'
                      }}
                    />

                    {/* Notification content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-white font-semibold text-sm truncate pr-2">
                          {notification.type}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-white-80 text-sm line-clamp-2 mb-2">
                        {notification.message}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className="px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              background: `${getPriorityColor(notification.analysis?.priority)}20`,
                              color: getPriorityColor(notification.analysis?.priority)
                            }}
                          >
                            {notification.analysis?.priority?.toUpperCase() || 'INFO'}
                          </span>
                          {notification.analysis?.riskScore && (
                            <span className="text-white-60 text-xs">
                              Risk: {notification.analysis.riskScore}
                            </span>
                          )}
                        </div>
                        <span className="text-white-40 text-xs">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white-10 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page if needed
                }}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default NotificationSystem;