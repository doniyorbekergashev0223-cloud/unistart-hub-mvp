"use client";

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Load theme from localStorage first (for instant load)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }

    // Then load from database if authenticated
    if (isAuthenticated && user) {
      loadThemeFromDB();
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isAuthenticated, user]);

  const loadThemeFromDB = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/settings/appearance', {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });

      const result = await response.json();
      if (result.ok && result.data.theme) {
        setTheme(result.data.theme);
        applyTheme(result.data.theme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (selectedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', selectedTheme);
    }
  };

  return <>{children}</>;
}
