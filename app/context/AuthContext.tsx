'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'user' | 'admin' | 'expert';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
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

  const login = async (email: string, password: string): Promise<boolean> => {
    // Real API (safe migration). Agar DATABASE_URL yo'q bo'lsa, mock-ga fallback qilamiz.
    const response = await postJson<{ user: { id: string; name: string; email: string; role: UserRole; avatarUrl?: string | null } }>(
      '/api/auth/login',
      { email, password }
    );

    if (response?.ok) {
      setUser(response.data.user);
      return true;
    }

    if (response && !response.ok && response.error?.code === 'DATABASE_NOT_CONFIGURED') {
      // Graceful fallback (DB sozlanmagan bo'lsa ham UI ishlashda davom etadi)
      const fallbackUser: User = {
        id: '1',
        name: 'Test User',
        email: email,
        role: 'user',
      };
      setUser(fallbackUser);
      return true;
    }

    return false;
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    // Real API (safe migration). Agar DATABASE_URL yo'q bo'lsa, mock-ga fallback qilamiz.
    const response = await postJson<{ user: { id: string; name: string; email: string; role: UserRole; avatarUrl?: string | null } }>(
      '/api/auth/register',
      { name, email, password }
    );

    if (response?.ok) {
      setUser(response.data.user);
      return true;
    }

    if (response && !response.ok && response.error?.code === 'DATABASE_NOT_CONFIGURED') {
      // Graceful fallback (DB sozlanmagan bo'lsa ham UI ishlashda davom etadi)
      const fallbackUser: User = {
        id: Date.now().toString(),
        name: name,
        email: email,
        role: role,
      };
      setUser(fallbackUser);
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};