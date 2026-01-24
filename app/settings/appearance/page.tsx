"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

type Theme = 'light' | 'dark' | 'system';

export default function AppearanceSettingsPage() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('system');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadTheme();
    }
  }, [user]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const loadTheme = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/settings/appearance', {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });

      const result = await response.json();
      if (result.ok) {
        setTheme(result.data.theme as Theme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (selectedTheme: Theme) => {
    const root = document.documentElement;
    
    if (selectedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', selectedTheme);
    }

    // Save to localStorage for instant load
    localStorage.setItem('theme', selectedTheme);
  };

  const handleThemeChange = async (newTheme: Theme) => {
    if (!user) return;

    setTheme(newTheme);
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/appearance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        body: JSON.stringify({ theme: newTheme }),
      });

      const result = await response.json();
      if (result.ok) {
        setMessage({ type: 'success', text: 'Mavzu saqlandi' });
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: result.error?.message || 'Xatolik yuz berdi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Xatolik yuz berdi' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings-loading">Yuklanmoqda...</div>;
  }

  return (
    <div className="settings-page-content">
      <h2 className="settings-page-content-title">Ko'rinish</h2>

      {message && (
        <div className={`appearance-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="appearance-themes">
        <div
          className={`appearance-theme-card ${theme === 'light' ? 'active' : ''}`}
          onClick={() => handleThemeChange('light')}
        >
          <div className="appearance-theme-preview light">
            <div className="appearance-theme-preview-header"></div>
            <div className="appearance-theme-preview-content">
              <div className="appearance-theme-preview-sidebar"></div>
              <div className="appearance-theme-preview-main"></div>
            </div>
          </div>
          <h3 className="appearance-theme-label">Yorug'</h3>
        </div>

        <div
          className={`appearance-theme-card ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => handleThemeChange('dark')}
        >
          <div className="appearance-theme-preview dark">
            <div className="appearance-theme-preview-header"></div>
            <div className="appearance-theme-preview-content">
              <div className="appearance-theme-preview-sidebar"></div>
              <div className="appearance-theme-preview-main"></div>
            </div>
          </div>
          <h3 className="appearance-theme-label">Qorong'u</h3>
        </div>

        <div
          className={`appearance-theme-card ${theme === 'system' ? 'active' : ''}`}
          onClick={() => handleThemeChange('system')}
        >
          <div className="appearance-theme-preview system">
            <div className="appearance-theme-preview-header"></div>
            <div className="appearance-theme-preview-content">
              <div className="appearance-theme-preview-sidebar"></div>
              <div className="appearance-theme-preview-main"></div>
            </div>
          </div>
          <h3 className="appearance-theme-label">Tizim</h3>
        </div>
      </div>
    </div>
  );
}
