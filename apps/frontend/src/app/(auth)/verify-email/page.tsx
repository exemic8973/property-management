'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@property-os/ui';
import { authApi } from '@/lib/auth';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please request a new verification email.');
        return;
      }

      try {
        await authApi.verifyEmail({ token });
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Failed to verify email. The link may have expired.');
      }
    };

    verifyEmail();
  }, [token]);

  const handleContinue = () => {
    router.push('/dashboard');
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  return (
    <AuthLayout
      title="Email Verification"
      description={
        status === 'loading'
          ? 'Verifying your email address...'
          : status === 'success'
          ? 'Email verified successfully'
          : 'Verification failed'
      }
    >
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Please wait while we verify your email address...
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {message}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your account is now active. You can start using PropertyOS.
            </p>
          </div>

          <Button onClick={handleContinue} className="w-full h-11 text-base font-medium">
            Continue to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="text-center">
            <button
              onClick={handleBackToLogin}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Back to login
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <XCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Verification Failed
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  If you're still having trouble, please contact our support team or try requesting a new verification email from your account settings.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleBackToLogin}
            variant="outline"
            className="w-full h-11 text-base font-medium"
          >
            Back to Login
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="Email Verification" description="Verifying...">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Loading...
          </p>
        </div>
      </AuthLayout>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}