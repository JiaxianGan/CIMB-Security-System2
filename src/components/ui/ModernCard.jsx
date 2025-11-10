import React from 'react';

const ModernCard = ({ 
  children, 
  className = '', 
  gradient = false, 
  glow = false,
  onClick
}) => (
  <div 
    className={`
      relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6
      shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)]
      transition-all duration-300 hover:-translate-y-1
      ${gradient ? 'bg-gradient-to-br from-white/20 to-white/5' : ''}
      ${glow ? 'hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
    onClick={onClick}
  >
    {children}
  </div>
);

export default ModernCard;