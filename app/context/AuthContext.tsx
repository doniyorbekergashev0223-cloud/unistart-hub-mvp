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
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedUser = JSON.parse(stored) as User;
          // Verify session is still valid by checking with API
          const isValid = await verifySession(parsedUser);
          if (isValid) {
            setUser(parsedUser);
          } else {
            // Session invalid - clear storage
            localStorage.removeItem(STORAGE_KEY);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    void restoreSession();
  }, []);

  // Verify session with backend
  const verifySession = async (user: User): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        cache: 'no-store', // Prevent caching
      });
      
      if (!response.ok) {
        return false;
      }
      
      const result = await response.json().catch(() => null);
      if (!result || !result.ok) {
        return false;
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
    } catch (error) {
      console.error('Session verification error:', error);
      return false;
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