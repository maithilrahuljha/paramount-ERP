/**
 * PMN ERP Platform - Login Page
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Shield, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';

type LoginStep = 'credentials' | '2fa';

interface LoginResponse {
  success: boolean;
  data?: {
    requiresTwoFactor?: boolean;
    tempToken?: string;
    token?: string;
    user?: object;
  };
  error?: {
    message: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Credentials form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2FA form
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data: LoginResponse = await response.json();
      
      if (!data.success) {
        setError(data.error?.message ?? 'Login failed');
        return;
      }
      
      if (data.data?.requiresTwoFactor) {
        setTempToken(data.data.tempToken!);
        setStep('2fa');
      } else {
        // Login successful, redirect to dashboard
        router.push('/crm');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: twoFactorCode }),
      });
      
      const data: LoginResponse = await response.json();
      
      if (!data.success) {
        setError(data.error?.message ?? 'Verification failed');
        return;
      }
      
      // Login successful, redirect to dashboard
      router.push('/crm');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep('credentials');
    setTwoFactorCode('');
    setTempToken('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
            <span className="text-3xl font-bold text-white">P</span>
          </div>
          <h1 className="text-2xl font-bold text-white">PMN ERP Platform</h1>
          <p className="text-blue-200 mt-1">Paramount Merchant Navy</p>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              {step === 'credentials' ? (
                <Lock className="h-6 w-6 text-blue-600" />
              ) : (
                <Shield className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <CardTitle className="text-xl">
              {step === 'credentials' ? 'Sign in to your account' : 'Two-Factor Authentication'}
            </CardTitle>
            <CardDescription>
              {step === 'credentials' 
                ? 'Enter your credentials to access the dashboard' 
                : 'Enter the 6-digit code from your authenticator app'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {step === 'credentials' ? (
              /* Credentials Form */
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  autoFocus
                />
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  Sign In
                </Button>
              </form>
            ) : (
              /* 2FA Form */
              <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                <Input
                  label="Verification Code"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  autoComplete="one-time-code"
                  autoFocus
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
                <p className="text-sm text-gray-500 text-center">
                  Open your authenticator app and enter the 6-digit code, or use a backup code.
                </p>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                  disabled={twoFactorCode.length < 6}
                >
                  Verify
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBackToLogin}
                >
                  Back to login
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-0">
            <div className="w-full border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 text-center">
                Protected by enterprise-grade security. Unauthorized access is prohibited.
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-blue-200 text-sm mt-6">
          © 2024 Paramount Merchant Navy. All rights reserved.
        </p>
      </div>
    </div>
  );
}
