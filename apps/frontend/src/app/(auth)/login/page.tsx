'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';
import { CheckCircle2 } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const reset = searchParams.get('reset');

  return (
    <>
      {reset === 'success' && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">
              Your password has been reset successfully. Please sign in with your new password.
            </p>
          </div>
        </div>
      )}

      <LoginForm />
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your account to continue"
      footer={
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Privacy Policy
          </a>
        </p>
      }
    >
      <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-lg" />}>
        <LoginContent />
      </Suspense>
    </AuthLayout>
  );
}