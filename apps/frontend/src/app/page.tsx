'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Redirect based on user role
        switch (user.role) {
          case 'TENANT':
            router.push('/tenant');
            break;
          case 'OWNER':
            router.push('/owner');
            break;
          case 'MANAGER':
          case 'ADMIN':
            router.push('/manager');
            break;
          default:
            // Fallback to login if role is not recognized
            router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </main>
  );
}