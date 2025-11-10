import React from 'react';

const ModernButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  onClick,
  ...props 
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent',
    secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-transparent',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-transparent',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-transparent',
    outline: 'bg-transparent text-white border border-white/20 hover:bg-white/10'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  return (
    <button
      className={`
        ${variants[variant]}
        ${sizes[size]}
        font-medium rounded-xl transition-all duration-200
        hover:shadow-lg hover:-translate-y-0.5
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent
        ${className}
      `}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default ModernButton;