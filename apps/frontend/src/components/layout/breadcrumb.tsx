'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@property-os/ui';
import { getBreadcrumbItems } from '@/lib/navigation';
import { useAuth } from '@/contexts/auth-context';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const breadcrumbItems = items || getBreadcrumbItems(pathname);

  // Determine home link based on user role
  const getHomeLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'TENANT':
        return '/tenant';
      case 'OWNER':
        return '/owner';
      case 'MANAGER':
      case 'ADMIN':
        return '/manager';
      default:
        return '/dashboard';
    }
  };

  if (breadcrumbItems.length === 0) {
    return null;
  }

  const homeLink = getHomeLink();

  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      {showHome && (
        <Link
          href={homeLink}
          className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          aria-label="Go to dashboard"
        >
          <Home className="w-4 h-4" />
        </Link>
      )}

      {(showHome || breadcrumbItems.length > 0) && (
        <ChevronRight className="w-4 h-4 text-gray-400" />
      )}

      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            <li className="flex items-center">
              {index === breadcrumbItems.length - 1 ? (
                <span className="font-medium text-gray-900 dark:text-gray-100" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}

interface BreadcrumbSeparatorProps {
  children?: React.ReactNode;
  className?: string;
}

export function BreadcrumbSeparator({ children, className }: BreadcrumbSeparatorProps) {
  return (
    <span className={cn('flex items-center text-gray-400', className)} aria-hidden="true">
      {children || <ChevronRight className="w-4 h-4" />}
    </span>
  );
}

interface BreadcrumbItemProps {
  children: React.ReactNode;
  href?: string;
  isActive?: boolean;
  className?: string;
}

export function BreadcrumbItem({ children, href, isActive, className }: BreadcrumbItemProps) {
  if (isActive) {
    return (
      <span className={cn('font-medium text-gray-900 dark:text-gray-100', className)} aria-current="page">
        {children}
      </span>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors',
          className
        )}
      >
        {children}
      </Link>
    );
  }

  return (
    <span className={cn('text-gray-500 dark:text-gray-400', className)}>
      {children}
    </span>
  );
}

interface BreadcrumbListProps {
  children: React.ReactNode;
  className?: string;
}

export function BreadcrumbList({ children, className }: BreadcrumbListProps) {
  return (
    <ol className={cn('flex items-center space-x-2', className)}>
      {children}
    </ol>
  );
}

interface BreadcrumbRootProps {
  children: React.ReactNode;
  className?: string;
}

export function BreadcrumbRoot({ children, className }: BreadcrumbRootProps) {
  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      {children}
    </nav>
  );
}