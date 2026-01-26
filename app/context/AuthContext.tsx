'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'user' | 'admin' | 'expert';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const STORAGE_KEY = 'unistart_auth_user';

type ApiError = { code: string; message: string; details?: unknown };
type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiError };

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return !!value && typeof value === 'object' && 'ok' in value;
}

async function postJson<T>(url: string, body: unknown): Promise<ApiResponse<T> | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => null)) as unknown;
    if (!isApiResponse<T>(json)) return null;
    return json;
  } catch {
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user from localStorage on mount
  // CRITICAL: Do not logout user on restore errors - only on truly invalid sessions
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsedUser = JSON.parse(stored) as User;
            // Set user immediately to prevent flash of login page
            setUser(parsedUser);
            // Verify session in background (non-blocking)
            const isValid = await verifySession(parsedUser);
            if (!isValid) {
              // Only clear if session is truly invalid (401 response)
              localStorage.removeItem(STORAGE_KEY);
              setUser(null);
            }
          } catch (parseError) {
            // Invalid stored data - clear it
            localStorage.removeItem(STORAGE_KEY);
            setUser(null);
          }
        }
      } catch (error) {
        // Storage errors - don't logout, just log
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to restore session:', error);
        }
        // Don't clear storage on errors - might be temporary
      } finally {
        setIsLoading(false);
      }
    };
    
    void restoreSession();
  }, []);

  // Verify session with backend
  // CRITICAL: Network errors should NOT logout user - only invalid sessions should
  const verifySession = async (user: User): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        cache: 'no-store', // Prevent caching
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      // Network errors or timeouts - keep user logged in (session might still be valid)
      if (!response.ok) {
        // Only logout on 401 (unauthorized) - means session is truly invalid
        if (response.status === 401) {
          return false;
        }
        // For other errors (503, 500, etc.), assume session is still valid
        // This prevents logout on temporary API failures
        return true;
      }
      
      const result = await response.json().catch(() => null);
      if (!result || !result.ok) {
        // Only logout if explicitly told session is invalid
        if (result?.error?.code === 'INVALID_SESSION') {
          return false;
        }
        // Other errors - keep user logged in
        return true;
      }
      
      // Update user data if avatarUrl changed
      if (result.data?.user) {
        const updatedUser = { ...user, ...result.data.user };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        } catch {
          // Ignore storage errors
        }
      }
      
      return true;
    } catch (error: any) {
      // Network errors, timeouts, etc. - DO NOT logout user
      // Session might still be valid, just can't verify right now
      if (process.env.NODE_ENV === 'development') {
        console.warn('Session verification failed (network error):', error?.message || error);
        console.warn('Keeping user logged in to prevent false logout');
      }
      return true; // Keep user logged in on network errors
    }
  };

  // Save user to localStorage
  const saveUser = (userData: User) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to save user to localStorage:', error);
    }
  };

  // Remove user from localStorage
  const removeUser = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Failed to remove user from localStorage:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await postJson<{ user: { id: string; name: string; email: string; role: UserRole; avatarUrl?: string | null } }>(
        '/api/auth/login',
        { email, password }
      );

      if (response?.ok && response.data?.user) {
        saveUser(response.data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const response = await postJson<{ user: { id: string; name: string; email: string; role: UserRole; avatarUrl?: string | null } }>(
        '/api/auth/register',
        { name, email, password }
      );

      if (response?.ok && response.data?.user) {
        saveUser(response.data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = async () => {
    // Call logout API to invalidate session on server
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    removeUser();
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};