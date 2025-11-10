import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

const AlertItem = ({ alert, onClick }) => {
  const severityConfig = {
    high: {
      gradient: 'from-red-500/20 to-red-600/10',
      border: 'border-red-500/30',
      badge: 'bg-red-500/20 text-red-200',
      icon: 'text-red-400'
    },
    medium: {
      gradient: 'from-yellow-500/20 to-yellow-600/10',
      border: 'border-yellow-500/30',
      badge: 'bg-yellow-500/20 text-yellow-200',
      icon: 'text-yellow-400'
    },
    low: {
      gradient: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/30',
      badge: 'bg-blue-500/20 text-blue-200',
      icon: 'text-blue-400'
    }
  };

  const config = severityConfig[alert.severity] || severityConfig.medium;

  return (
    <div 
      className={`
        bg-gradient-to-r ${config.gradient} border ${config.border} rounded-xl p-4 mb-3
        hover:shadow-lg transition-all duration-200 cursor-pointer group transform hover:-translate-y-0.5
      `} 
      onClick={() => onClick && onClick(alert)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${config.badge}`}>
              {alert.type}
            </span>
            <div className="flex items-center space-x-1 text-white/40 text-xs">
              <Clock className="w-3 h-3" />
              <span>{alert.time}</span>
            </div>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">{alert.message}</p>
        </div>
        <AlertTriangle className={`w-5 h-5 ml-3 ${config.icon} group-hover:scale-110 transition-transform duration-200`} />
      </div>
    </div>
  );
};

export default AlertItem;