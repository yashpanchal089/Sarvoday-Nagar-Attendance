import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  type = 'text',
  name,
  className = '',
  icon: Icon = null,
  rightIcon = null,
  onRightIconClick = null,
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-slate-400" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          name={name}
          id={name}
          className={`
            block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-800 placeholder-slate-400
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-orange-300 focus:border-brand-orange-400
            ${Icon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}
          `}
          {...props}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${onRightIconClick ? 'cursor-pointer hover:text-slate-600' : 'pointer-events-none'} text-slate-400`}
          >
            {rightIcon}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-medium tracking-wide flex items-center">
          <span className="mr-1">●</span> {error.message || error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
