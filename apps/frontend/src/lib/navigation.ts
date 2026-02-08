'use client';

import { usePathname } from 'next/navigation';
import type { UserRole } from '@property-os/types';

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  badge?: number;
  children?: NavigationItem[];
  roles?: UserRole[];
}

// Helper function to create navigation items with base path
function createItems(basePath: string): NavigationItem[] {
  return [
    {
      label: 'Dashboard',
      href: basePath,
      icon: 'LayoutDashboard',
    },
    {
      label: 'Properties',
      href: `${basePath}/properties`,
      icon: 'Building2',
    },
    {
      label: 'Tenants',
      href: `${basePath}/tenants`,
      icon: 'Users',
    },
    {
      label: 'Leases',
      href: `${basePath}/leases`,
      icon: 'FileText',
    },
    {
      label: 'Payments',
      href: `${basePath}/payments`,
      icon: 'CreditCard',
    },
    {
      label: 'Maintenance',
      href: `${basePath}/maintenance`,
      icon: 'Wrench',
    },
    {
      label: 'Documents',
      href: `${basePath}/documents`,
      icon: 'FolderOpen',
    },
    {
      label: 'Settings',
      href: `${basePath}/settings`,
      icon: 'Settings',
    },
  ];
}

// Navigation items for different roles
export const navigationItems: Record<UserRole, NavigationItem[]> = {
  ADMIN: [
    {
      label: 'Dashboard',
      href: '/manager',
      icon: 'LayoutDashboard',
    },
    {
      label: 'Properties',
      href: '/manager/properties',
      icon: 'Building2',
    },
    {
      label: 'Units',
      href: '/manager/units',
      icon: 'Home',
    },
    {
      label: 'Tenants',
      href: '/manager/tenants',
      icon: 'Users',
    },
    {
      label: 'Leases',
      href: '/manager/leases',
      icon: 'FileText',
    },
    {
      label: 'Payments',
      href: '/manager/payments',
      icon: 'CreditCard',
    },
    {
      label: 'Maintenance',
      href: '/manager/maintenance',
      icon: 'Wrench',
    },
    {
      label: 'Vendors',
      href: '/manager/vendors',
      icon: 'Truck',
    },
    {
      label: 'Documents',
      href: '/manager/documents',
      icon: 'FolderOpen',
    },
    {
      label: 'Financials',
      href: '/manager/financials',
      icon: 'BarChart3',
    },
    {
      label: 'Reports',
      href: '/manager/reports',
      icon: 'PieChart',
    },
    {
      label: 'Users',
      href: '/manager/users',
      icon: 'UserCog',
    },
    {
      label: 'Settings',
      href: '/manager/settings',
      icon: 'Settings',
    },
    {
      label: 'Audit Logs',
      href: '/manager/audit-logs',
      icon: 'ScrollText',
    },
  ],
  MANAGER: [
    {
      label: 'Dashboard',
      href: '/manager',
      icon: 'LayoutDashboard',
    },
    {
      label: 'Properties',
      href: '/manager/properties',
      icon: 'Building2',
    },
    {
      label: 'Units',
      href: '/manager/units',
      icon: 'Home',
    },
    {
      label: 'Tenants',
      href: '/manager/tenants',
      icon: 'Users',
    },
    {
      label: 'Leases',
      href: '/manager/leases',
      icon: 'FileText',
    },
    {
      label: 'Payments',
      href: '/manager/payments',
      icon: 'CreditCard',
    },
    {
      label: 'Maintenance',
      href: '/manager/maintenance',
      icon: 'Wrench',
    },
    {
      label: 'Vendors',
      href: '/manager/vendors',
      icon: 'Truck',
    },
    {
      label: 'Documents',
      href: '/manager/documents',
      icon: 'FolderOpen',
    },
    {
      label: 'Financials',
      href: '/manager/financials',
      icon: 'BarChart3',
    },
    {
      label: 'Reports',
      href: '/manager/reports',
      icon: 'PieChart',
    },
    {
      label: 'Settings',
      href: '/manager/settings',
      icon: 'Settings',
    },
  ],
  MEMBER: createItems('/owner'),
  TENANT: [
    {
      label: 'Dashboard',
      href: '/tenant',
      icon: 'LayoutDashboard',
    },
    {
      label: 'Payments',
      href: '/tenant/payments',
      icon: 'CreditCard',
    },
    {
      label: 'Maintenance',
      href: '/tenant/maintenance',
      icon: 'Wrench',
    },
    {
      label: 'Documents',
      href: '/tenant/documents',
      icon: 'FolderOpen',
    },
    {
      label: 'Lease',
      href: '/tenant/lease',
      icon: 'FileText',
    },
    {
      label: 'Profile',
      href: '/tenant/profile',
      icon: 'User',
    },
  ],
  OWNER: createItems('/owner'),
  VENDOR: [],
  ACCOUNTANT: [],
};

// Filter navigation items based on user role
export function getNavigationItemsForRole(role: UserRole): NavigationItem[] {
  const items = navigationItems[role] || [];
  return items.filter((item) => !item.roles || item.roles.includes(role));
}

// Get the current active navigation item
export function useActiveNavigation(items: NavigationItem[]): NavigationItem | null {
  const pathname = usePathname();

  // Check if any item matches the current path
  for (const item of items) {
    if (item.href === pathname) {
      return item;
    }

    // Check if current path starts with item's href (for nested routes)
    if (pathname.startsWith(item.href + '/')) {
      return item;
    }

    // Check children
    if (item.children) {
      for (const child of item.children) {
        if (child.href === pathname || pathname.startsWith(child.href + '/')) {
          return item;
        }
      }
    }
  }

  return null;
}

// Check if a specific route is active
export function isRouteActive(href: string, pathname: string): boolean {
  return href === pathname || pathname.startsWith(href + '/');
}

// Get breadcrumb items for a given path
export function getBreadcrumbItems(pathname: string): Array<{ label: string; href: string }> {
  const segments = pathname.split('/').filter(Boolean);
  const items: Array<{ label: string; href: string }> = [];

  if (segments.length === 0) return items;

  // Determine base path and home label based on first segment
  const basePath = `/${segments[0]}`;
  const homeLabels: Record<string, string> = {
    tenant: 'Dashboard',
    owner: 'Dashboard',
    manager: 'Dashboard',
    dashboard: 'Dashboard',
  };

  items.push({ label: homeLabels[segments[0]] || 'Dashboard', href: basePath });

  // Add subsequent segments
  let accumulatedPath = basePath;
  for (let i = 1; i < segments.length; i++) {
    accumulatedPath += '/' + segments[i];
    const label = formatBreadcrumbLabel(segments[i]);
    items.push({ label, href: accumulatedPath });
  }

  return items;
}

// Format URL segment to readable label
function formatBreadcrumbLabel(segment: string): string {
  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get navigation item by href
export function getNavigationItemByHref(href: string, items: NavigationItem[]): NavigationItem | undefined {
  for (const item of items) {
    if (item.href === href) {
      return item;
    }

    if (item.children) {
      const found = getNavigationItemByHref(href, item.children);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

// Icon name to Lucide icon component mapping (to be used with dynamic imports)
export const iconNames = [
  'LayoutDashboard',
  'Building2',
  'Home',
  'Users',
  'FileText',
  'CreditCard',
  'Wrench',
  'Truck',
  'FolderOpen',
  'BarChart3',
  'PieChart',
  'UserCog',
  'Settings',
  'ScrollText',
  'Bell',
  'Search',
  'Menu',
  'X',
  'ChevronRight',
  'ChevronLeft',
  'User',
  'LogOut',
  'Moon',
  'Sun',
  'MoreHorizontal',
  'LogIn',
  'Shield',
  'Key',
] as const;

export type IconName = (typeof iconNames)[number];