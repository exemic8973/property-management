'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { MobileNavigation } from './mobile-navigation';
import { Breadcrumb } from './breadcrumb';
import { cn } from '@property-os/ui';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  showMobileNav?: boolean;
  showHeader?: boolean;
}

export function AppShell({
  children,
  className,
  showSidebar = true,
  showMobileNav = true,
  showHeader = true,
}: AppShellProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  // Don't render app shell if not authenticated or loading
  if (!isAuthenticated || isLoading) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      {showHeader && (
        <Header
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />
      )}

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={handleSidebarClose}
          />
        )}

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300',
            showSidebar && 'lg:ml-64',
            className
          )}
        >
          <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      {showMobileNav && <MobileNavigation />}
    </div>
  );
}

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: boolean;
  className?: string;
}

export function PageLayout({
  children,
  title,
  subtitle,
  actions,
  breadcrumbs = true,
  className,
}: PageLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          {breadcrumbs && <Breadcrumb />}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {children}
      </div>
    </div>
  );
}

interface ContentWrapperProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ContentWrapper({
  children,
  className,
  size = 'lg',
}: ContentWrapperProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn('mx-auto w-full', sizeClasses[size], className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4', className)}>
      <div className="flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        {subtitle && (
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn('animate-in fade-in slide-in-from-bottom-2 duration-300', className)}>
      {children}
    </div>
  );
}