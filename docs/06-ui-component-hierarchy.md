# UI Component Hierarchy: PropertyOS

## Overview

PropertyOS features a **mobile-first, responsive design system** built with **Next.js 15**, **React Server Components**, **Tailwind CSS 4**, and **Radix UI**. The design system emphasizes accessibility, consistency, and a premium SaaS aesthetic inspired by Material Design principles.

---

## Design System Foundations

### Design Tokens

```typescript
// colors.ts
export const colors = {
  // Primary brand colors
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',  // Primary brand color
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
    950: '#1E1B4B',
  },
  // Secondary brand colors
  secondary: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',  // Secondary brand color
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
    950: '#042F2E',
  },
  // Accent colors
  accent: {
    amber: '#F59E0B',
    rose: '#F43F5E',
    emerald: '#10B981',
  },
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  // Neutral colors
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },
};

// typography.ts
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    display: ['DM Sans', 'Inter', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// spacing.ts
export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};

// border-radius.ts
export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  default: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

// shadows.ts
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

// transitions.ts
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// z-index.ts
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
};

// breakpoints.ts
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large desktop
};
```

### Theme System

```typescript
// themes/light.ts
export const lightTheme = {
  colors: {
    background: colors.neutral[50],
    foreground: colors.neutral[950],
    card: '#FFFFFF',
    'card-foreground': colors.neutral[950],
    primary: colors.primary[600],
    'primary-foreground': '#FFFFFF',
    secondary: colors.secondary[500],
    'secondary-foreground': '#FFFFFF',
    muted: colors.neutral[100],
    'muted-foreground': colors.neutral[500],
    accent: colors.primary[100],
    'accent-foreground': colors.primary[900],
    destructive: colors.error,
    'destructive-foreground': '#FFFFFF',
    border: colors.neutral[200],
    input: colors.neutral[200],
    ring: colors.primary[400],
  },
};

// themes/dark.ts
export const darkTheme = {
  colors: {
    background: colors.neutral[950],
    foreground: colors.neutral[50],
    card: colors.neutral[900],
    'card-foreground': colors.neutral[50],
    primary: colors.primary[500],
    'primary-foreground': '#FFFFFF',
    secondary: colors.secondary[500],
    'secondary-foreground': '#FFFFFF',
    muted: colors.neutral[800],
    'muted-foreground': colors.neutral[400],
    accent: colors.primary[950],
    'accent-foreground': colors.primary[100],
    destructive: colors.error,
    'destructive-foreground': '#FFFFFF',
    border: colors.neutral[800],
    input: colors.neutral[800],
    ring: colors.primary[600],
  },
};
```

---

## Component Library Structure

```
components/
├── ui/                    # Base UI components (Radix UI + custom)
│   ├── button/
│   │   ├── button.tsx
│   │   ├── button.stories.tsx
│   │   └── button.test.tsx
│   ├── input/
│   ├── select/
│   ├── dialog/
│   ├── dropdown-menu/
│   ├── tabs/
│   ├── table/
│   ├── card/
│   ├── badge/
│   ├── avatar/
│   ├── toast/
│   ├── tooltip/
│   └── ...
├── layout/                # Layout components
│   ├── header/
│   ├── sidebar/
│   ├── footer/
│   └── navigation/
├── shared/                # Shared business components
│   ├── data-table/
│   ├── data-card/
│   ├── status-badge/
│   ├── empty-state/
│   ├── loading-skeleton/
│   ├── error-boundary/
│   └── notification/
├── tenant/                # Tenant-specific components
│   ├── payment-methods/
│   ├── maintenance-form/
│   ├── document-viewer/
│   └── ...
├── owner/                 # Owner-specific components
│   ├── portfolio-card/
│   ├── revenue-chart/
│   └── ...
├── manager/               # Manager-specific components
│   ├── property-list/
│   ├── work-order-board/
│   └── ...
└── icons/                 # Icon components
    ├── icon.tsx
    └── icons/
```

---

## Base UI Components

### Button

```typescript
// components/ui/button/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700',
        destructive: 'bg-error text-white hover:bg-error/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-white hover:bg-secondary/90',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Input

```typescript
// components/ui/input/input.tsx
import * as React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus-visible:ring-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && !error && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

### Card

```typescript
// components/ui/card/card.tsx
import * as React from 'react';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

### Badge

```typescript
// components/ui/badge/badge.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-success text-white hover:bg-success/80',
        warning: 'border-transparent bg-warning text-white hover:bg-warning/80',
        info: 'border-transparent bg-info text-white hover:bg-info/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

---

## Page Hierarchy

### Tenant Portal

```
/tenant/
├── /                          # Dashboard
│   ├── dashboard.tsx
│   └── components/
│       ├── payment-summary.tsx
│       ├── upcoming-payment.tsx
│       └── recent-activity.tsx
├── /payments/                 # Payments
│   ├── page.tsx
│   ├── components/
│   │   ├── payment-methods.tsx
│   │   ├── payment-history.tsx
│   │   ├── make-payment.tsx
│   │   └── autopay-settings.tsx
│   └── [paymentId]/
│       └── page.tsx           # Payment details
├── /maintenance/              # Maintenance requests
│   ├── page.tsx
│   ├── components/
│   │   ├── request-list.tsx
│   │   ├── request-form.tsx
│   │   └── request-detail.tsx
│   └── /new/
│       └── page.tsx
├── /documents/                # Documents
│   ├── page.tsx
│   ├── components/
│   │   ├── document-list.tsx
│   │   ├── document-viewer.tsx
│   │   └── lease-agreement.tsx
│   └── /[documentId]/
│       └── page.tsx
├── /lease/                    # Lease information
│   └── page.tsx
├── /notifications/            # Notifications
│   └── page.tsx
├── /profile/                  # Profile settings
│   ├── page.tsx
│   ├── components/
│   │   ├── profile-form.tsx
│   │   ├── emergency-contact.tsx
│   │   └── notification-preferences.tsx
│   └── /security/
│       └── page.tsx
└── /support/                  # AI support chat
    └── page.tsx
```

### Owner Dashboard

```
/owner/
├── /                          # Dashboard
│   ├── dashboard.tsx
│   └── components/
│       ├── portfolio-overview.tsx
│       ├── revenue-chart.tsx
│       ├── occupancy-rate.tsx
│       └── recent-transactions.tsx
├── /portfolio/                # Portfolio management
│   ├── page.tsx
│   ├── components/
│   │   ├── property-grid.tsx
│   │   ├── property-card.tsx
│   │   └── portfolio-filters.tsx
│   └── /[propertyId]/
│       └── page.tsx           # Property details
├── /financials/               # Financial reports
│   ├── page.tsx
│   ├── components/
│   │   ├── income-statement.tsx
│   │   ├── cash-flow.tsx
│   │   └── expense-breakdown.tsx
│   └── /reports/
│       ├── page.tsx
│       └── /[reportId]/
│           └── page.tsx
├── /distributions/            # Owner distributions
│   ├── page.tsx
│   └── components/
│       ├── distribution-history.tsx
│       └── bank-accounts.tsx
├── /analytics/                # Analytics & insights
│   ├── page.tsx
│   ├── components/
│   │   ├── performance-metrics.tsx
│   │   ├── trends-chart.tsx
│   │   └── forecasts.tsx
│   └── /forecasts/
│       └── page.tsx
├── /documents/                # Documents
│   └── page.tsx
└── /settings/                 # Settings
    ├── page.tsx
    └── components/
        ├── profile-settings.tsx
        └── notification-preferences.tsx
```

### Property Manager Console

```
/manager/
├── /                          # Dashboard
│   ├── dashboard.tsx
│   └── components/
│       ├── quick-actions.tsx
│       ├── activity-feed.tsx
│       ├── pending-tasks.tsx
│       └── kpi-cards.tsx
├── /properties/               # Property management
│   ├── page.tsx
│   ├── components/
│   │   ├── property-table.tsx
│   │   ├── property-form.tsx
│   │   └── property-filters.tsx
│   ├── /new/
│   │   └── page.tsx
│   └── /[propertyId]/
│       ├── page.tsx
│       ├── /units/
│       │   ├── page.tsx
│       │   ├── /new/
│       │   │   └── page.tsx
│       │   └── /[unitId]/
│       │       └── page.tsx
│       ├── /leases/
│       │   ├── page.tsx
│       │   ├── /new/
│       │   │   └── page.tsx
│       │   └── /[leaseId]/
│       │       └── page.tsx
│       └── /tenants/
│           └── page.tsx
├── /tenants/                  # Tenant management
│   ├── page.tsx
│   ├── components/
│   │   ├── tenant-table.tsx
│   │   ├── tenant-card.tsx
│   │   └── tenant-activity.tsx
│   └── /[tenantId]/
│       └── page.tsx
├── /maintenance/              # Maintenance management
│   ├── page.tsx
│   ├── components/
│   │   ├── request-kanban.tsx
│   │   ├── request-detail.tsx
│   │   └── vendor-selector.tsx
│   ├── /[requestId]/
│   │   └── page.tsx
│   └── /vendors/
│       ├── page.tsx
│       ├── /new/
│       │   └── page.tsx
│       └── /[vendorId]/
│           └── page.tsx
├── /payments/                 # Payment management
│   ├── page.tsx
│   ├── components/
│   │   ├── payment-table.tsx
│   │   ├── payment-details.tsx
│   │   └── refund-modal.tsx
│   └── /disputes/
│       └── page.tsx
├── /documents/                # Document management
│   ├── page.tsx
│   ├── /upload/
│   │   └── page.tsx
│   └── /[documentId]/
│       └── page.tsx
├── /reports/                  # Reports
│   ├── page.tsx
│   ├── components/
│   │   ├── report-builder.tsx
│   │   └── saved-reports.tsx
│   └── /[reportId]/
│       └── page.tsx
├── /analytics/                # Analytics
│   ├── page.tsx
│   └── components/
│       ├── custom-dashboard.tsx
│       └── trend-analysis.tsx
├── /team/                     # Team management
│   ├── page.tsx
│   ├── /members/
│   │   ├── page.tsx
│   │   ├── /new/
│   │   │   └── page.tsx
│   │   └── /[memberId]/
│   │       └── page.tsx
│   └── /roles/
│       └── page.tsx
└── /settings/                 # Settings
    ├── page.tsx
    ├── /organization/
    │   └── page.tsx
    ├── /billing/
    │   └── page.tsx
    ├── /integrations/
    │   └── page.tsx
    └── /security/
        └── page.tsx
```

---

## Layout Components

### App Shell

```typescript
// components/layout/app-shell.tsx
import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';
import { MobileNavigation } from './mobile-navigation';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  variant?: 'default' | 'full-width';
}

export function AppShell({ children, variant = 'default' }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 border-r bg-card">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 lg:ml-64 min-h-[calc(100vh-4rem)]',
            variant === 'full-width' ? 'p-0' : 'p-4 md:p-6 lg:p-8'
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
}
```

### Header

```typescript
// components/layout/header/header.tsx
import { Bell, Search, Settings, User } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu/dropdown-menu';
import { Input } from '@/components/ui/input/input';
import { Badge } from '@/components/ui/badge/badge';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="font-semibold text-lg hidden sm:block">PropertyOS</span>
        </div>

        {/* Search - Desktop */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search properties, tenants, requests..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {/* Notification items */}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden sm:inline">John Doe</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Help & Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
```

### Sidebar

```typescript
// components/layout/sidebar/sidebar.tsx
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button/button';
import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
} from '@phosphor-icons/react';

const navigation = [
  { name: 'Dashboard', href: '/manager', icon: LayoutDashboard },
  { name: 'Properties', href: '/manager/properties', icon: Building2 },
  { name: 'Tenants', href: '/manager/tenants', icon: Users },
  { name: 'Maintenance', href: '/manager/maintenance', icon: Wrench },
  { name: 'Documents', href: '/manager/documents', icon: FileText },
  { name: 'Payments', href: '/manager/payments', icon: CreditCard },
  { name: 'Analytics', href: '/manager/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/manager/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Button
              key={item.name}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3',
                isActive && 'bg-secondary'
              )}
              asChild
            >
              <a href={item.href}>
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </a>
            </Button>
          );
        })}
      </nav>

      {/* Help & Support */}
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start gap-3">
          <Question className="h-5 w-5" />
          <span>Help & Support</span>
        </Button>
      </div>
    </div>
  );
}
```

---

## Shared Components

### DataTable

```typescript
// components/shared/data-table/data-table.tsx
import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table/table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from '@phosphor-icons/react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumn?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchColumn,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      {searchColumn && (
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### EmptyState

```typescript
// components/shared/empty-state/empty-state.tsx
import { Button } from '@/components/ui/button/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-md">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### StatusBadge

```typescript
// components/shared/status-badge/status-badge.tsx
import { Badge } from '@/components/ui/badge/badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from '@phosphor-icons/react';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'pending' | 'info';
  label?: string;
}

const statusConfig = {
  success: {
    variant: 'success' as const,
    icon: CheckCircle,
  },
  warning: {
    variant: 'warning' as const,
    icon: AlertCircle,
  },
  error: {
    variant: 'destructive' as const,
    icon: XCircle,
  },
  pending: {
    variant: 'info' as const,
    icon: Clock,
  },
  info: {
    variant: 'info' as const,
    icon: AlertCircle,
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon className="h-3 w-3" />
      {label || status}
    </Badge>
  );
}
```

---

## Tenant-Specific Components

### PaymentMethods

```typescript
// components/tenant/payment-methods/payment-methods.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/card';
import { Button } from '@/components/ui/button/button';
import { CreditCard, Bank, Plus } from '@phosphor-icons/react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  isDefault: boolean;
}

export function PaymentMethods() {
  const paymentMethods: PaymentMethod[] = [
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      isDefault: true,
    },
    {
      id: '2',
      type: 'bank',
      last4: '6789',
      isDefault: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Payment Methods</CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Method
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              {method.type === 'card' ? (
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Bank className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {method.type === 'card' ? `${method.brand} ending in ${method.last4}` : `Bank account ending in ${method.last4}`}
                </p>
                {method.isDefault && (
                  <p className="text-sm text-muted-foreground">Default</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

### MaintenanceForm

```typescript
// components/tenant/maintenance-form/maintenance-form.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/card';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select/select';
import { Textarea } from '@/components/ui/textarea/textarea';
import { Camera, Upload } from '@phosphor-icons/react';

export function MaintenanceForm() {
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Maintenance Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="appliances">Appliances</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input placeholder="Brief description of the issue" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Provide detailed information about the issue"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Photos</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop photos here, or click to upload
              </p>
              <Button type="button" variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Choose Files
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Submit Request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## Design System Principles

### 1. Accessibility First
- **WCAG AA+ Compliance**: All components meet or exceed WCAG 2.1 AA standards
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 contrast ratio for text
- **Focus Management**: Logical focus flow in modals and dialogs

### 2. Mobile-First Design
- **Responsive Breakpoints**: Mobile-first approach with progressive enhancement
- **Touch Targets**: Minimum 44x44px touch targets for buttons and interactive elements
- **Thumb Zone**: Place primary actions in easy-to-reach areas
- **Gesture Support**: Swipe, pull-to-refresh, and other mobile gestures

### 3. Consistency & Reusability
- **Component Library**: Reusable components with consistent API
- **Design Tokens**: Centralized design system for colors, spacing, typography
- **Pattern Library**: Documented patterns for common UI scenarios
- **Storybook**: Component documentation and interactive examples

### 4. Performance
- **Code Splitting**: Route-based and component-based code splitting
- **Lazy Loading**: Load components and images on demand
- **Optimization**: Image optimization, font optimization, bundle size optimization
- **Caching**: Aggressive caching strategies for assets and API responses

### 5. Visual Hierarchy
- **Clear Typography**: Establish visual hierarchy with font size, weight, and color
- **Spacing**: Use whitespace to group related elements
- **Color**: Use color strategically to draw attention and convey meaning
- **Motion**: Subtle animations to provide feedback without distraction

---

## Responsive Design Patterns

### Grid System

```typescript
// Grid utility classes
const grid = {
  cols: {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  },
  responsive: {
    // Responsive grid that changes columns based on breakpoint
    '1-2-3-4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    '1-1-2-3': 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '1-2-2-2': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2',
  },
};
```

### Container Queries (Phase 2)

```typescript
// Container-based responsive design
<div className="@container">
  <div className="@lg:grid-cols-2 @xl:grid-cols-3 grid gap-4">
    {/* Content that responds to container size */}
  </div>
</div>
```

---

## Dark Mode Support

```typescript
// hooks/use-theme.ts
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return { theme, setTheme };
}

// components/theme-toggle.tsx
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
```

---

## Internationalization (i18n) Support

```typescript
// lib/i18n.ts
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

export const i18n = createInstance({
  resources: {
    en: {
      translation: {
        common: {
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          search: 'Search',
        },
        tenant: {
          dashboard: 'Dashboard',
          payments: 'Payments',
          maintenance: 'Maintenance',
          documents: 'Documents',
        },
      },
    },
    es: {
      translation: {
        common: {
          save: 'Guardar',
          cancel: 'Cancelar',
          delete: 'Eliminar',
          edit: 'Editar',
          search: 'Buscar',
        },
        tenant: {
          dashboard: 'Panel',
          payments: 'Pagos',
          maintenance: 'Mantenimiento',
          documents: 'Documentos',
        },
      },
    },
  },
  lng: 'en',
  fallbackLng: 'en',
});

i18n.use(initReactI18next).init();

export default i18n;
```

---

## Component Testing Strategy

### Unit Tests (Vitest)

```typescript
// components/ui/button/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-error');
  });

  it('applies size styles', () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByText('Large Button');
    expect(button).toHaveClass('h-11');
  });
});
```

### Integration Tests (Playwright)

```typescript
// e2e/tenant/tenant-dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('tenant dashboard loads correctly', async ({ page }) => {
  await page.goto('/tenant');

  // Check dashboard title
  await expect(page.locator('h1')).toContainText('Dashboard');

  // Check payment summary card
  await expect(page.locator('[data-testid="payment-summary"]')).toBeVisible();

  // Check recent activity
  await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
});

test('tenant can submit maintenance request', async ({ page }) => {
  await page.goto('/tenant/maintenance/new');

  // Fill out form
  await page.selectOption('[name="category"]', 'plumbing');
  await page.fill('[name="title"]', 'Leaking faucet');
  await page.fill('[name="description"]', 'The bathroom faucet is leaking.');

  // Submit form
  await page.click('button[type="submit"]');

  // Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

---

## Performance Optimization

### 1. Code Splitting

```typescript
// Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
  loading: () => <LoadingSkeleton />,
  ssr: false,
});
```

### 2. Image Optimization

```typescript
// Using Next.js Image component
import Image from 'next/image';

<Image
  src="/property-image.jpg"
  alt="Property photo"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>
```

### 3. Virtual Scrolling

```typescript
// Using react-window for large lists
import { FixedSizeList } from 'react-window';

function LargeList({ items }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  );
}
```

---

This UI component hierarchy provides a comprehensive foundation for building a beautiful, accessible, and performant property management platform with a consistent design system across all user interfaces.