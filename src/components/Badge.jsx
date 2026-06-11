import React from 'react';

export const Badge = ({
  children,
  variant = 'info',
  className = '',
  ...props
}) => {
  const styles = {
    // Attendance specific
    present: 'bg-green-50 text-green-700 border border-green-150',
    absent: 'bg-red-50 text-red-700 border border-red-150',
    leave: 'bg-yellow-50 text-yellow-700 border border-yellow-150',
    
    // User status
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-150',
    inactive: 'bg-slate-100 text-slate-600 border border-slate-200',
    
    // Generic
    success: 'bg-green-50 text-green-700 border border-green-150',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-150',
    danger: 'bg-red-50 text-red-700 border border-red-150',
    info: 'bg-blue-50 text-blue-700 border border-blue-150'
  };

  const currentStyle = styles[variant.toLowerCase()] || styles.info;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${currentStyle} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
