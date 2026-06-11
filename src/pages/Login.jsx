import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck } from 'lucide-react';

export const Login = () => {
  const { login, registerAdmin } = useApp();
  const { navigateTo } = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Separate forms for Login and Signup
  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: errorsLogin } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true
    }
  });

  const { register: registerSignup, handleSubmit: handleSubmitSignup, reset: resetSignup, formState: { errors: errorsSignup } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      secretCode: ''
    }
  });

  const onSubmitLogin = async (data) => {
    setIsLoading(true);
    setErrorMessage('');
    
    // Simulate minor network latency for authentic UI feel
    setTimeout(() => {
      const result = login(data.email, data.password);
      setIsLoading(false);
      if (result.success) {
        navigateTo('dashboard');
      } else {
        setErrorMessage(result.message);
      }
    }, 800);
  };

  const onSignupSubmit = async (data) => {
    if (data.secretCode !== '1921') {
      setErrorMessage('Invalid secret code. Account cannot be created.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      const result = registerAdmin({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password
      });
      setIsLoading(false);
      if (result.success) {
        alert('Account created successfully! You can now log in with your email and password.');
        setIsRegistering(false);
        resetSignup();
      } else {
        setErrorMessage(result.message);
      }
    }, 800);
  };

  const handleToggleRegister = () => {
    setIsRegistering(true);
    setErrorMessage('');
    resetSignup();
  };

  const handleCancelRegister = () => {
    setIsRegistering(false);
    setErrorMessage('');
  };

  return (
    <AuthLayout>
      <Card padded={false} className="overflow-hidden border border-slate-100 shadow-xl">
        <div className="p-8 sm:p-10">
          
          {/* Top Form Header with Logo */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-12 w-12 bg-brand-orange-50 rounded-2xl flex items-center justify-center border border-brand-orange-100 shadow-xs mb-3">
              <img src="/logo.png" alt="Sarvoday Logo" className="h-8.5 w-8.5 object-contain" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Sarvoday Yuvak Mandal</h2>
            <p className="text-xs text-slate-500 mt-1">
              {isRegistering ? 'Create a coordinator account to get started' : 'Sign in to manage youth attendance & directory'}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-150 text-xs text-red-600 font-medium tracking-wide">
              {errorMessage}
            </div>
          )}

          {!isRegistering ? (
            <form onSubmit={handleSubmitLogin(onSubmitLogin)} className="space-y-5">
              {/* Email Field */}
              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="e.g. ketan@sarvoday.org"
                icon={Mail}
                error={errorsLogin.email}
                {...registerLogin('email', { 
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />

              {/* Password Field */}
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                icon={Lock}
                rightIcon={showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                onRightIconClick={() => setShowPassword(!showPassword)}
                error={errorsLogin.password}
                {...registerLogin('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />

              {/* Remember & Forgot Row */}
              <div className="flex items-center justify-between">
                <label className="flex items-center text-xs text-slate-600 font-medium select-none cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mr-2 h-4 w-4 rounded-md border-slate-300 text-brand-orange-500 focus:ring-brand-orange-300" 
                    {...registerLogin('rememberMe')}
                  />
                  Remember Me
                </label>
                
                <button 
                  type="button" 
                  className="text-xs font-semibold text-brand-orange-600 hover:text-brand-orange-500 cursor-pointer"
                  onClick={() => alert('Forgot Password simulator triggered. Please contact your coordinator to reset.')}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  className="py-3"
                >
                  Sign In
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={handleToggleRegister}
                  className="py-3"
                >
                  Create Account
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="space-y-4">
              {/* First Name Field */}
              <Input
                label="First Name"
                type="text"
                name="firstName"
                placeholder="e.g. Ketan"
                icon={User}
                error={errorsSignup.firstName}
                {...registerSignup('firstName', { 
                  required: 'First name is required'
                })}
              />

              {/* Last Name Field */}
              <Input
                label="Last Name"
                type="text"
                name="lastName"
                placeholder="e.g. Vyas"
                icon={User}
                error={errorsSignup.lastName}
                {...registerSignup('lastName', { 
                  required: 'Last name is required'
                })}
              />

              {/* Email Field */}
              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="e.g. ketan@sarvoday.org"
                icon={Mail}
                error={errorsSignup.email}
                {...registerSignup('email', { 
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />

              {/* Password Field */}
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="••••••••"
                icon={Lock}
                error={errorsSignup.password}
                {...registerSignup('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />

              {/* Secret Code Field */}
              <Input
                label="Secret Code (Security Verification)"
                type="password"
                name="secretCode"
                placeholder="Ask your administrator for the mandal code"
                icon={ShieldCheck}
                error={errorsSignup.secretCode}
                {...registerSignup('secretCode', { 
                  required: 'Secret code is required'
                })}
              />

              {/* Action Buttons */}
              <div className="space-y-3 mt-5">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  className="py-3"
                >
                  Register Account
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={handleCancelRegister}
                  className="py-3"
                >
                  Back to Sign In
                </Button>
              </div>
            </form>
          )}

        </div>
      </Card>
    </AuthLayout>
  );
};

export default Login;
