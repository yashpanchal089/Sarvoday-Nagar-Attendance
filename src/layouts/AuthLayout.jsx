import React from 'react';

export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Column: Branding and Illustration (Large Screens Only) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand-orange-500 via-brand-orange-500 to-amber-500 p-16 text-white flex-col justify-between relative overflow-hidden">
        {/* Soft background light/sun rays pattern */}
        <div className="absolute inset-0 opacity-15">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="sunRays" cx="50%" cy="100%" r="90%">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx="50%" cy="100%" r="70%" fill="url(#sunRays)" />
            {/* Abstract geometric lines */}
            <path d="M 0,1000 L 1000,0 M -200,800 L 800,-200 M 200,1200 L 1200,200" stroke="#ffffff" strokeWidth="2" strokeDasharray="10 15" />
          </svg>
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-white/20 shadow-sm">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-lg font-bold tracking-wider uppercase">Sarvoday Yuvak Mandal</span>
        </div>

        {/* Core Message */}
        <div className="relative z-10 my-auto max-w-lg">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold rounded-full tracking-wider uppercase mb-6">
            Spiritual & Community Portal
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Streamlining Community <br />
            &amp; Attendance Service
          </h1>
          <p className="mt-4 text-orange-50/90 text-base leading-relaxed font-light">
            Welcome to the digital management console for **Sarvoday Yuvak Mandal**. Join us in building a more connected, engaged, and spiritually elevated youth community.
          </p>
        </div>

        {/* Footer/Quote */}
        <div className="relative z-10 border-t border-white/10 pt-6">
          <p className="text-sm italic text-orange-50/80">
            "Universal upliftment (Sarvoday) begins with selfless dedication and individual growth."
          </p>
        </div>
      </div>

      {/* Right Column: Authentication Form Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-md page-enter">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
