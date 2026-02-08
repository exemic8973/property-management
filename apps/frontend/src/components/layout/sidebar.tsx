'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getNavigationItemsForRole, isRouteActive } from '@/lib/navigation';
import { cn } from '@property-os/ui';
import * as Icons from 'lucide-react';

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ className, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigationItems = user?.role ? getNavigationItemsForRole(user.role) : [];

  const getIconComponent = (iconName: string) => {
    const icon = Icons[iconName as keyof typeof Icons];
    if (icon && typeof icon === 'function') {
      return icon as React.ComponentType<{ className?: string }>;
    }
    return null;
  };

  const handleNavItemClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'P';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 z-30 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
          isMobile
            ? isOpen
              ? 'w-64 translate-x-0'
              : '-translate-x-full w-64'
            : isCollapsed
            ? 'w-16'
            : 'w-64',
          className
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = isRouteActive(item.href, pathname);
              const IconComponent = getIconComponent(item.icon || '');

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleNavItemClick}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative group',
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                      isCollapsed && !isMobile && 'justify-center px-2'
                    )}
                  >
                    {IconComponent && (
                      <span
                        className={cn(
                          'flex-shrink-0',
                          isCollapsed && !isMobile && 'w-5 h-5',
                          !isCollapsed && 'w-5 h-5'
                        )}
                      >
                        {React.createElement(IconComponent, { className: 'w-5 h-5' })}
                      </span>
                    )}
                    {!isCollapsed && !isMobile && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="flex-shrink-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full dark:bg-red-900/30 dark:text-red-400">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && !isMobile && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {item.label}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          {!isCollapsed || isMobile ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
            </div>
          )}
        </div>

        {/* Collapse Toggle (Desktop only) */}
        {!isMobile && (
          <div className="p-4 pt-0">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                isCollapsed ? '' : 'justify-start'
              )}
            >
              <Icons.ChevronLeft className={cn('w-4 h-4 transition-transform', isCollapsed && 'rotate-180')} />
              {!isCollapsed && <span>Collapse</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

interface SidebarGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function SidebarGroup({ label, children, className }: SidebarGroupProps) {
  return (
    <div className={cn('mb-6', className)}>
      <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </h3>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

interface SidebarNavItemProps {
  href: string;
  icon?: React.ReactNode;
  label: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
  className?: string;
}

export function SidebarNavItem({
  href,
  icon,
  label,
  isActive = false,
  badge,
  onClick,
  className,
}: SidebarNavItemProps) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative group',
          isActive
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
          className
        )}
      >
        {icon && <span className="flex-shrink-0 w-5 h-5">{icon}</span>}
        <span className="flex-1">{label}</span>
        {badge && badge > 0 && (
          <span className="flex-shrink-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full dark:bg-red-900/30 dark:text-red-400">
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}