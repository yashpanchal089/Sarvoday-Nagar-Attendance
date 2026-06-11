import React from 'react';

export const Card = ({
  children,
  title = '',
  subtitle = '',
  extra = null,
  onClick = null,
  className = '',
  hoverable = false,
  padded = true,
  ...props
}) => {
  const isClickable = typeof onClick === 'function';
  
  const baseStyle = 'bg-white rounded-2xl border border-slate-100 shadow-sm transition-all duration-300';
  const hoverStyle = (hoverable || isClickable) 
    ? 'hover:-translate-y-1 hover:shadow-md hover:border-slate-200/80 cursor-pointer' 
    : '';
  const paddingStyle = padded ? 'p-5 md:p-6' : '';

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`${baseStyle} ${hoverStyle} ${className}`}
      {...props}
    >
      {(title || subtitle || extra) && (
        <div className={`flex items-center justify-between border-b border-slate-50 pb-4 mb-4 ${padded ? 'px-6 pt-5 -mx-6 -mt-5' : ''}`}>
          <div>
            {title && <h3 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {extra && <div className="flex items-center space-x-2">{extra}</div>}
        </div>
      )}
      <div className={paddingStyle}>
        {children}
      </div>
    </div>
  );
};

export default Card;
