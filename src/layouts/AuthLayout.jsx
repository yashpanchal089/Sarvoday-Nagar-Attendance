import React from 'react';

export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 sm:p-12">
      <div className="w-full max-w-md page-enter">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
