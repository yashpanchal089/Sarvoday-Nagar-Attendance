import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import AuthLayout from '../layouts/AuthLayout';

export const Login = () => {
  const { login, registerAdmin } = useApp();
  const { navigateTo } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Forms for Login and Signup
  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: errorsLogin } } = useForm({
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const { register: registerSignup, handleSubmit: handleSubmitSignup, reset: resetSignup, formState: { errors: errorsSignup } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      secretKey: ''
    }
  });

  const onSubmitLogin = async (data) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const result = await login(data.email, data.password);
      setIsLoading(false);
      if (result.success) {
        navigateTo('dashboard');
      } else {
        setErrorMessage(result.message || 'Invalid email or password.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  const onSignupSubmit = async (data) => {
    if (data.secretKey !== '1921') {
      setErrorMessage('Invalid Secret Key. You are not authorized to create an account.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await registerAdmin({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password
      });
      setIsLoading(false);
      if (result.success) {
        alert('Account created successfully! You can now log in.');
        setIsRegistering(false);
        resetSignup();
      } else {
        setErrorMessage(result.message || 'Registration failed.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('An unexpected registration error occurred. Please try again.');
    }
  };

  return (
    <AuthLayout>
      {/* Logo and Header above the Card */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="h-28 w-28 rounded-full overflow-hidden mb-5 flex items-center justify-center bg-white border border-[#E5E0D8] shadow-xs">
          <img 
            src="/logo.png?v=1" 
            alt="Sarvoday Nagar Yuvak Mandal Logo" 
            className="h-full w-full object-cover scale-[1.12]" 
          />
        </div>
        <h2 className="text-3xl font-bold text-[#2C1F16] font-serif leading-tight">
          Sarvoday Nagar Yuvak Mandal
        </h2>
        <p className="text-[#8C8276] text-sm mt-3 font-medium">
          Attendance Management for our weekly sabhas
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-[28px] shadow-[0_16px_40px_rgba(223,215,202,0.4)] p-8 sm:p-10 mb-6 border border-[#F2ECE4]/30">
        
        {/* Custom Pill Tab Switcher */}
        <div className="bg-[#F3EEE7] p-1 rounded-full flex mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setErrorMessage('');
            }}
            className={`flex-1 text-center py-2.5 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
              !isRegistering
                ? 'bg-white text-[#2C1F16] shadow-sm'
                : 'text-[#8C8276] hover:text-[#2C1F16]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setErrorMessage('');
            }}
            className={`flex-1 text-center py-2.5 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
              isRegistering
                ? 'bg-white text-[#2C1F16] shadow-sm'
                : 'text-[#8C8276] hover:text-[#2C1F16]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-150 text-xs text-red-600 font-medium leading-relaxed">
            {errorMessage}
          </div>
        )}

        {!isRegistering ? (
          <form onSubmit={handleSubmitLogin(onSubmitLogin)} className="space-y-5">
            {/* Email ID Field */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Email ID
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`w-full px-4.5 py-3 rounded-2xl border bg-white text-sm text-[#2C1F16] placeholder-[#B0A89E] transition-all duration-200 outline-none
                  ${errorsLogin.email ? 'border-red-400 focus:border-red-500' : 'border-[#E5E0D8] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C]'}
                `}
                {...registerLogin('email', { 
                  required: 'Email ID is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errorsLogin.email && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errorsLogin.email.message}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full px-4.5 py-3 rounded-2xl border bg-white text-sm text-[#2C1F16] placeholder-[#B0A89E] transition-all duration-200 outline-none
                  ${errorsLogin.password ? 'border-red-400 focus:border-red-500' : 'border-[#E5E0D8] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C]'}
                `}
                {...registerLogin('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
              {errorsLogin.password && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errorsLogin.password.message}
                </span>
              )}
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#FF7A3C] hover:bg-[#E66327] active:scale-[0.98] transition-all text-white font-semibold rounded-2xl text-base shadow-sm focus:outline-none cursor-pointer flex justify-center items-center"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="space-y-4">
            {/* First Name Field */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                First Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ketan"
                className={`w-full px-4.5 py-3 rounded-2xl border bg-white text-sm text-[#2C1F16] placeholder-[#B0A89E] transition-all duration-200 outline-none
                  ${errorsSignup.firstName ? 'border-red-400 focus:border-red-500' : 'border-[#E5E0D8] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C]'}
                `}
                {...registerSignup('firstName', { 
                  required: 'First name is required'
                })}
              />
              {errorsSignup.firstName && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errorsSignup.firstName.message}
                </span>
              )}
            </div>

            {/* Last Name Field */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                placeholder="e.g. Vyas"
                className={`w-full px-4.5 py-3 rounded-2xl border bg-white text-sm text-[#2C1F16] placeholder-[#B0A89E] transition-all duration-200 outline-none
                  ${errorsSignup.lastName ? 'border-red-400 focus:border-red-500' : 'border-[#E5E0D8] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C]'}
                `}
                {...registerSignup('lastName', { 
                  required: 'Last name is required'
                })}
              />
              {errorsSignup.lastName && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errorsSignup.lastName.message}
                </span>
              )}
            </div>

            {/* Email ID Field */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Email ID
              </label>
              <input
                type="email"
                placeholder="coordinator@sarvoday.org"
                className={`w-full px-4.5 py-3 rounded-2xl border bg-white text-sm text-[#2C1F16] placeholder-[#B0A89E] transition-all duration-200 outline-none
                  ${errorsSignup.email ? 'border-red-400 focus:border-red-500' : 'border-[#E5E0D8] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C]'}
                `}
                {...registerSignup('email', { 
                  required: 'Email ID is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errorsSignup.email && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errorsSignup.email.message}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full px-4.5 py-3 rounded-2xl border bg-white text-sm text-[#2C1F16] placeholder-[#B0A89E] transition-all duration-200 outline-none
                  ${errorsSignup.password ? 'border-red-400 focus:border-red-500' : 'border-[#E5E0D8] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C]'}
                `}
                {...registerSignup('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
              {errorsSignup.password && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errorsSignup.password.message}
                </span>
              )}
            </div>

            {/* Secret Key Field */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Secret Key
              </label>
              <input
                type="password"
                placeholder="Enter organization secret key"
                className={`w-full px-4.5 py-3 rounded-2xl border bg-white text-sm text-[#2C1F16] placeholder-[#B0A89E] transition-all duration-200 outline-none
                  ${errorsSignup.secretKey ? 'border-red-400 focus:border-red-500' : 'border-[#E5E0D8] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C]'}
                `}
                {...registerSignup('secretKey', { 
                  required: 'Secret Key is required'
                })}
              />
              {errorsSignup.secretKey && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errorsSignup.secretKey.message}
                </span>
              )}
            </div>

            {/* Sign Up Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#FF7A3C] hover:bg-[#E66327] active:scale-[0.98] transition-all text-white font-semibold rounded-2xl text-base shadow-sm focus:outline-none cursor-pointer flex justify-center items-center"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Text */}
      <div className="text-center text-xs text-[#8C8276] font-medium tracking-wide">
        Jay Swaminarayan 🙏 — for Mandal volunteers only.
      </div>
    </AuthLayout>
  );
};

export default Login;
