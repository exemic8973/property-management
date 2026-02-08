'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, Organization } from '@property-os/types';
import { authApi, userStorage, setupTokenRefresh, type LoginCredentials, type RegisterData } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we have stored user data
        const storedUser = userStorage.getUser();
        const storedOrganization = userStorage.getOrganization();

        if (storedUser) {
          setUser(storedUser);
          setOrganization(storedOrganization);

          // Try to fetch fresh user data if authenticated
          if (authApi.isAuthenticated()) {
            try {
              const freshUser = await authApi.getCurrentUser();
              setUser(freshUser);
            } catch (error) {
              console.error('Failed to fetch fresh user data:', error);
              // Keep using stored data if fetch fails
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Setup token refresh interval
  useEffect(() => {
    if (isAuthenticated) {
      const cleanup = setupTokenRefresh();
      return cleanup;
    }
  }, [isAuthenticated]);

  // Protected route handling
  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
      const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

      if (!isAuthenticated && !isPublicPath) {
        router.push('/login');
      } else if (isAuthenticated && isPublicPath && pathname !== '/verify-email') {
        // Redirect authenticated users away from auth pages (except email verification)
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      setUser(response.user);
      if ('organization' in response) {
        setOrganization((response as any).organization);
      }
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      setUser(response.user);
      if ('organization' in response) {
        setOrganization((response as any).organization);
      }
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Logout client-side even if API call fails
    } finally {
      setUser(null);
      setOrganization(null);
      setIsLoading(false);
      router.push('/login');
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const freshUser = await authApi.getCurrentUser();
      setUser(freshUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // Don't logout here - let the interceptor handle auth errors
    }
  }, [isAuthenticated]);

  const value: AuthContextType = {
    user,
    organization,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}