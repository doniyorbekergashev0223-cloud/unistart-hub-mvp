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

export interface OrganizationInfo {
  name: string;
  logoUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  organization: OrganizationInfo | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    organizationSlug: string
  ) => Promise<boolean>;
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

type ApiError = { code: string; message: string; details?: unknown };
type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiError };

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return !!value && typeof value === 'object' && 'ok' in value;
}

async function postJson<T>(url: string, body: unknown, credentials: RequestCredentials = 'include'): Promise<ApiResponse<T> | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials,
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
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from httpOnly cookie via /api/auth/verify (no client identity sent)
  useEffect(() => {
    let cancelled = false;
    const restoreSession = async (retry = 0) => {
      let willRetry = false;
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (cancelled) return;
        if (!response.ok) {
          setUser(null);
          setOrganization(null);
          return;
        }

        const result = await response.json().catch(() => null);
        if (cancelled) return;
        if (result?.ok && result.data?.user) {
          setUser(result.data.user);
          setOrganization(result.data?.organization ?? null);
        } else {
          setUser(null);
          setOrganization(null);
        }
      } catch {
        if (cancelled) return;
        if (retry < 1) {
          willRetry = true;
          setTimeout(() => restoreSession(retry + 1), 1500);
          return;
        }
        setUser(null);
        setOrganization(null);
      } finally {
        if (!cancelled && !willRetry) setIsLoading(false);
      }
    };

    void restoreSession();
    return () => { cancelled = true; };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await postJson<{ user: { id: string; name: string; email: string; role: UserRole; avatarUrl?: string | null } }>(
        '/api/auth/login',
        { email, password }
      );

      if (response?.ok && response.data?.user) {
        setUser(response.data.user);
        // Refetch verify to get organization so Topbar shows org immediately
        const verifyRes = await fetch('/api/auth/verify', { method: 'GET', credentials: 'include', cache: 'no-store' });
        const verifyJson = await verifyRes.json().catch(() => null);
        if (verifyJson?.ok && verifyJson.data?.organization) {
          setOrganization(verifyJson.data.organization);
        } else {
          setOrganization(null);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    _role: UserRole,
    organizationSlug: string
  ): Promise<boolean> => {
    try {
      const response =
        await postJson<{ user: { id: string; name: string; email: string; role: UserRole; avatarUrl?: string | null }; organization?: { name: string; logoUrl?: string | null } }>(
          '/api/auth/register',
          { name, email, password, organizationSlug }
        );

      if (response?.ok && response.data?.user) {
        setUser(response.data.user);
        if (response.data?.organization) {
          setOrganization(response.data.organization);
        } else {
          const verifyRes = await fetch('/api/auth/verify', { method: 'GET', credentials: 'include', cache: 'no-store' });
          const verifyJson = await verifyRes.json().catch(() => null);
          if (verifyJson?.ok && verifyJson.data?.organization) {
            setOrganization(verifyJson.data.organization);
          } else {
            setOrganization(null);
          }
        }
        window.dispatchEvent(new CustomEvent('stats-refetch'));
        return true;
      }

      if (response && !response.ok && response.error?.message) {
        const details = response.error?.details as { raw?: string } | undefined;
        const fullMessage = details?.raw
          ? `${response.error.message}\n${details.raw}`
          : response.error.message;
        throw new Error(fullMessage);
      }

      return false;
    } catch (error) {
      console.error('Register error:', error);
      if (error instanceof Error) throw error;
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    setUser(null);
    setOrganization(null);
  };

  const value: AuthContextType = {
    user,
    organization,
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
