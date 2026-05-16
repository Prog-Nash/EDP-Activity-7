import React from 'react';

const GlassCard = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
