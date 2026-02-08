'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label } from '@property-os/ui';
import { authApi } from '@/lib/auth';
import Link from 'next/link';
import { Mail, AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await authApi.forgotPassword(data);
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Check your email
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Didn't receive the email?
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSuccess(false);
              setError(null);
            }}
            disabled={isSubmitting}
          >
            Try again
          </Button>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Info Message */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('email')}
            disabled={isSubmitting}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-11 text-base font-medium"
        disabled={isSubmitting || !isDirty}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Sending reset link...
          </>
        ) : (
          'Send Reset Link'
        )}
      </Button>

      {/* Back to Login Link */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to login
        </Link>
      </div>
    </form>
  );
}