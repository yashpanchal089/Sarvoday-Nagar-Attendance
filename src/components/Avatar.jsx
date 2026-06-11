import React, { useState } from 'react';

export const Avatar = ({
  src,
  name = '',
  size = 'md',
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm font-semibold',
    lg: 'h-14 w-14 text-lg font-semibold',
    xl: 'h-20 w-20 text-2xl font-bold',
    '2xl': 'h-28 w-28 text-4xl font-bold'
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div
      className={`
        relative inline-flex items-center justify-center rounded-full overflow-hidden select-none border border-slate-100/50 bg-slate-100 flex-shrink-0
        ${currentSize} ${className}
      `}
      {...props}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={name}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-brand-orange-300 to-amber-200 text-brand-orange-800 font-medium tracking-wider">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
