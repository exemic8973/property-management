'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { getNavigationItemsForRole, isRouteActive } from '@/lib/navigation';
import { cn } from '@property-os/ui';
import * as Icons from 'lucide-react';

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const getIconComponent = (iconName: string) => {
    const icon = Icons[iconName as keyof typeof Icons];
    if (icon && typeof icon === 'function') {
      return icon as React.ComponentType<{ className?: string }>;
    }
    return null;
  };

  // Get role-based navigation items for mobile (first 4 items)
  const roleBasedItems = user?.role ? getNavigationItemsForRole(user.role).slice(0, 4) : [];

  // Get base path for bottom bar filtering
  const basePath = user?.role === 'TENANT' ? '/tenant' : 
                   user?.role === 'OWNER' ? '/owner' : 
                   '/manager';

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 lg:hidden',
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {roleBasedItems.map((item) => {
          const isActive = isRouteActive(item.href, pathname);
          const IconComponent = getIconComponent(item.icon || '');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-colors relative',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {IconComponent && (
                <span className="mb-1">
                  {React.createElement(IconComponent, {
                    className: cn('w-5 h-5', isActive && 'fill-current'),
                  })}
                </span>
              )}
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-600 rounded-full dark:bg-red-900/30 dark:text-red-400 min-w-[16px]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Icons.Sun className="w-5 h-5 mb-1" />
          ) : (
            <Icons.Moon className="w-5 h-5 mb-1" />
          )}
          <span className="text-xs font-medium">Theme</span>
        </button>
      </div>
    </nav>
  );
}

interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMoreMenu({ isOpen, onClose }: MobileMoreMenuProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const getIconComponent = (iconName: string) => {
    const icon = Icons[iconName as keyof typeof Icons];
    if (icon && typeof icon === 'function') {
      return icon as React.ComponentType<{ className?: string }>;
    }
    return null;
  };

  // Get all navigation items excluding the ones shown in bottom bar
  const allItems = user?.role ? getNavigationItemsForRole(user.role) : [];
  const bottomBarItems = allItems.slice(0, 4);
  const moreItems = allItems.slice(4);

  if (moreItems.length === 0) return null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'fixed bottom-16 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 lg:hidden transition-transform duration-200',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            More
          </h3>
          <ul className="space-y-1">
            {moreItems.map((item) => {
              const isActive = isRouteActive(item.href, pathname);
              const IconComponent = getIconComponent(item.icon || '');

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    {IconComponent && (
                      <span className="flex-shrink-0 w-5 h-5">
                        {React.createElement(IconComponent, { className: 'w-5 h-5' })}
                      </span>
                    )}
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="flex-shrink-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full dark:bg-red-900/30 dark:text-red-400">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}

interface MobileHeaderProps {
  title: string;
  onMenuClick?: () => void;
  showBack?: boolean;
  onBackClick?: () => void;
  rightAction?: React.ReactNode;
}

export function MobileHeader({
  title,
  onMenuClick,
  showBack,
  onBackClick,
  rightAction,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 lg:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={onBackClick}
              className="p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Go back"
            >
              <Icons.ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open menu"
            >
              <Icons.Menu className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h1>
        </div>
        {rightAction}
      </div>
    </header>
  );
}