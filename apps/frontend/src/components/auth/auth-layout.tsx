import React, { ReactNode } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  footer?: ReactNode;
}

export function AuthLayout({ children, title, description, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
              <Building2 className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            PropertyOS
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Modern Property Management Made Simple
          </p>
          <div className="grid grid-cols-2 gap-6 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">10k+</div>
              <div className="text-blue-200 text-sm">Properties Managed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-blue-200 text-sm">Uptime</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-blue-200 text-sm">Support</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">150+</div>
              <div className="text-blue-200 text-sm">Countries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary">PropertyOS</span>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {description}
              </p>
            </div>

            {children}

            {footer && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                {footer}
              </div>
            )}
          </div>

          {/* Copyright */}
          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            © 2026 PropertyOS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

// Footer component for auth pages
export function AuthFooter({
  linkText,
  linkHref,
  description,
}: {
  linkText: string;
  linkHref: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        {description}{' '}
        <Link
          href={linkHref}
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          {linkText}
        </Link>
      </p>
    </div>
  );
}