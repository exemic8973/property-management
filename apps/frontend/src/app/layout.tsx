import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/contexts/query-client-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { ToastProvider } from '@/contexts/toast-context';
import { ErrorBoundary } from '@/components/layout/error-boundary';
import SkipToContent from '@/components/layout/skip-to-content';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PropertyOS - Property Management System',
  description: 'Multi-tenant property management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider>
            <ErrorBoundary>
              <ToastProvider>
                <AuthProvider>
                  <SkipToContent />
                  {children}
                </AuthProvider>
              </ToastProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}