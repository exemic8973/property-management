import axios, { AxiosInstance, AxiosError } from 'axios';
import type { User, Organization, AuthResponse } from '@property-os/types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Storage Keys
const ACCESS_TOKEN_KEY = 'propertyos_access_token';
const REFRESH_TOKEN_KEY = 'propertyos_refresh_token';
const USER_KEY = 'propertyos_user';
const ORGANIZATION_KEY = 'propertyos_organization';

// Token Management
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  hasValidToken: (): boolean => {
    const token = tokenStorage.getAccessToken();
    if (!token) return false;

    try {
      const payload = parseJWT(token);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  },

  isTokenExpiringSoon: (secondsThreshold: number = 300): boolean => {
    const token = tokenStorage.getAccessToken();
    if (!token) return true;

    try {
      const payload = parseJWT(token);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp - now < secondsThreshold;
    } catch {
      return true;
    }
  },
};

// User Session Management
export const userStorage = {
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser: (user: User): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getOrganization: (): Organization | null => {
    if (typeof window === 'undefined') return null;
    const orgStr = localStorage.getItem(ORGANIZATION_KEY);
    return orgStr ? JSON.parse(orgStr) : null;
  },

  setOrganization: (organization: Organization): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ORGANIZATION_KEY, JSON.stringify(organization));
  },

  clearSession: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORGANIZATION_KEY);
    tokenStorage.clearTokens();
  },
};

// JWT Utilities
function parseJWT(token: string): any {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

// API Client
class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = tokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // If error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for the refresh to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newTokens = await this.refreshAccessToken();
            this.onRefreshed(newTokens.accessToken);
            this.refreshSubscribers = [];

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear session
            userStorage.clearSession();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
  }

  private async refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post<{ token: string; refresh_token: string }>(
      `${API_BASE_URL}/api/auth/refresh`,
      { refresh_token: refreshToken }
    );

    const { token, refresh_token } = response.data;
    tokenStorage.setTokens(token, refresh_token);

    return { accessToken: token, refreshToken: refresh_token };
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getClient();

// Authentication Functions
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  tenant_name: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface VerifyEmailData {
  token: string;
}

export const authApi = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
    const { user, accessToken, refreshToken, organization } = response.data;

    // Store tokens and user
    tokenStorage.setTokens(accessToken, refreshToken);
    userStorage.setUser(user);

    // Store organization if present
    if (organization) {
      userStorage.setOrganization(organization);
    }

    return response.data;
  },

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
    const { user, accessToken, refreshToken, organization } = response.data;

    // Store tokens and user
    tokenStorage.setTokens(accessToken, refreshToken);
    userStorage.setUser(user);

    // Store organization if present
    if (organization) {
      userStorage.setOrganization(organization);
    }

    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      // Always clear session, even if API call fails
      userStorage.clearSession();
    }
  },

  // Forgot Password
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    await apiClient.post('/api/auth/forgot-password', data);
  },

  // Reset Password
  async resetPassword(data: ResetPasswordData): Promise<void> {
    await apiClient.post('/api/auth/reset-password', data);
  },

  // Verify Email
  async verifyEmail(data: VerifyEmailData): Promise<void> {
    await apiClient.post('/api/auth/verify-email', data);
  },

  // Refresh Token
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ token: string; refresh_token: string }>(
      '/api/auth/refresh',
      { refresh_token: refreshToken }
    );

    const { token, refresh_token } = response.data;
    tokenStorage.setTokens(token, refresh_token);

    return { accessToken: token, refreshToken: refresh_token };
  },

  // Get Current User
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/api/auth/me');
    userStorage.setUser(response.data);
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return tokenStorage.hasValidToken();
  },

  // Get stored user
  getStoredUser(): User | null {
    return userStorage.getUser();
  },

  // Get stored organization
  getStoredOrganization(): Organization | null {
    return userStorage.getOrganization();
  },
};

// Auto-refresh token utility
export function setupTokenRefresh(): () => void {
  const REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes

  const intervalId = setInterval(async () => {
    if (tokenStorage.isTokenExpiringSoon(300)) {
      try {
        await authApi.refreshToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        userStorage.clearSession();
        window.location.href = '/login';
      }
    }
  }, REFRESH_INTERVAL);

  // Cleanup function
  return () => clearInterval(intervalId);
}