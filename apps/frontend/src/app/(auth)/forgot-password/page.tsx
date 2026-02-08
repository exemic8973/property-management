'use client';

import React from 'react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email to receive a password reset link"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}