'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label } from '@property-os/ui';
import { authApi } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// Form validation schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    confirm_password: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
}

export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  });

  const password = watch('password');
  const confirmPassword = watch('confirm_password');

  // Validate token on mount
  useEffect(() => {
    // We'll validate the token when the form is submitted
    // For now, assume it's valid and show the form
    setIsTokenValid(true);
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await authApi.resetPassword({
        token,
        password: data.password,
      });
      onSuccess?.();
      router.push('/login?reset=success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reset password. The link may have expired.';
      setError(errorMessage);
      setIsTokenValid(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = {
    hasMinLength: password?.length >= 8,
    hasUppercase: /[A-Z]/.test(password || ''),
    hasLowercase: /[a-z]/.test(password || ''),
    hasNumber: /\d/.test(password || ''),
  };

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

  if (isTokenValid === false) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Invalid or expired link
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This password reset link is no longer valid. Please request a new one.
          </p>
          <Link href="/forgot-password">
            <Button variant="outline">
              Request new reset link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          Enter your new password below. Make sure it's strong and memorable.
        </p>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a new password"
            autoComplete="new-password"
            className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('password')}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-1.5 ${passwordStrength.hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                {passwordStrength.hasMinLength ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-400" />
                )}
                At least 8 characters
              </div>
              <div className={`flex items-center gap-1.5 ${passwordStrength.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                {passwordStrength.hasUppercase ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-400" />
                )}
                Uppercase letter
              </div>
              <div className={`flex items-center gap-1.5 ${passwordStrength.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                {passwordStrength.hasLowercase ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-400" />
                )}
                Lowercase letter
              </div>
              <div className={`flex items-center gap-1.5 ${passwordStrength.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                {passwordStrength.hasNumber ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-400" />
                )}
                Number
              </div>
            </div>
          </div>
        )}

        {errors.password && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirm_password" className="text-sm font-medium">
          Confirm New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="confirm_password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your new password"
            autoComplete="new-password"
            className={`pl-10 pr-10 ${errors.confirm_password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('confirm_password')}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Password Match Indicator */}
        {confirmPassword && (
          <div className={`flex items-center gap-1.5 text-xs ${
            confirmPassword === password
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-500'
          }`}>
            {confirmPassword === password ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-gray-400" />
            )}
            Passwords match
          </div>
        )}

        {errors.confirm_password && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.confirm_password.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-11 text-base font-medium"
        disabled={isSubmitting || !isDirty || !isPasswordStrong || confirmPassword !== password}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Resetting password...
          </>
        ) : (
          'Reset Password'
        )}
      </Button>

      {/* Back to Login Link */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Back to login
        </Link>
      </div>
    </form>
  );
}