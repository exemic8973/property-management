'use client';

import React from 'react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Start managing properties with PropertyOS"
      footer={
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          By creating an account, you agree to our{' '}
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
      <RegisterForm />
    </AuthLayout>
  );
}