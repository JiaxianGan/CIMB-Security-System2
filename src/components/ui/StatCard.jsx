import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import ModernCard from './ModernCard';

const StatCard = ({ icon: Icon, title, value, change, trend, gradient }) => {
  const gradientClasses = {
    blue: 'from-blue-500 to-purple-600',
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-pink-600',
    orange: 'from-orange-500 to-red-600',
    purple: 'from-purple-500 to-indigo-600'
  };

  return (
    <ModernCard className="group cursor-pointer" glow>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-white/60 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white mb-2 group-hover:scale-105 transition-transform duration-300">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <div className={`flex items-center space-x-1 text-sm ${
              trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className="relative ml-4">
          <div className={`absolute inset-0 bg-gradient-to-r ${
            gradientClasses[gradient] || gradientClasses.blue
          } rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
          <div className={`relative p-4 bg-gradient-to-r ${
            gradientClasses[gradient] || gradientClasses.blue
          } rounded-2xl`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </ModernCard>
  );
};

export default StatCard;