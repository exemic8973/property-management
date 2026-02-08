'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label } from '@property-os/ui';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import {
  Building2,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

// Form validation schema
const registerSchema = z
  .object({
    // Organization fields
    tenant_name: z
      .string()
      .min(2, 'Organization name must be at least 2 characters')
      .max(100, 'Organization name must be less than 100 characters'),

    // User fields
    first_name: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters'),
    last_name: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
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

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const password = watch('password');
  const confirmPassword = watch('confirm_password');

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const { confirm_password, ...registerData } = data;
      await registerUser(registerData);
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
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

      {/* Organization Name */}
      <div className="space-y-2">
        <Label htmlFor="tenant_name" className="text-sm font-medium">
          Organization Name
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="tenant_name"
            type="text"
            placeholder="Acme Properties"
            autoComplete="organization"
            className={`pl-10 ${errors.tenant_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('tenant_name')}
            disabled={isSubmitting}
          />
        </div>
        {errors.tenant_name && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.tenant_name.message}
          </p>
        )}
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name" className="text-sm font-medium">
            First Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="first_name"
              type="text"
              placeholder="John"
              autoComplete="given-name"
              className={`pl-10 ${errors.first_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              {...register('first_name')}
              disabled={isSubmitting}
            />
          </div>
          {errors.first_name && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.first_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name" className="text-sm font-medium">
            Last Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="last_name"
              type="text"
              placeholder="Doe"
              autoComplete="family-name"
              className={`pl-10 ${errors.last_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              {...register('last_name')}
              disabled={isSubmitting}
            />
          </div>
          {errors.last_name && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.last_name.message}
            </p>
          )}
        </div>
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

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
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
          Confirm Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="confirm_password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
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
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      {/* Login Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}