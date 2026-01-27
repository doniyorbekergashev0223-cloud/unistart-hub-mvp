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

      {/* Topbar ko'rinishi preview: Bildirishnoma + Light/Dark toggle */}
      <div className="appearance-topbar-preview">
        <div className="appearance-topbar-left">
          <span className="appearance-topbar-label">
            Boshqaruv paneli ko'rinishi
          </span>
          <span className="appearance-topbar-subtitle">
            Bildirishnoma yonida mavzu (yorug&apos;/qorong&apos;u) almashtirish
          </span>
        </div>
        <div className="appearance-topbar-right">
          <button
            type="button"
            className="appearance-notification-button"
            aria-label="Bildirishnomalar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <div className="appearance-theme-toggle">
            <button
              type="button"
              className={`appearance-toggle-icon ${
                theme === 'light' ? 'active' : ''
              }`}
              onClick={() => handleThemeChange('light')}
              aria-label="Yorug' rejim"
            >
              {/* Sun icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
                <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
                <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
              </svg>
            </button>
            <button
              type="button"
              className={`appearance-toggle-icon ${
                theme === 'dark' ? 'active' : ''
              }`}
              onClick={() => handleThemeChange('dark')}
              aria-label="Qorong'u rejim"
            >
              {/* Moon icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 0 1 12.21 3 7 7 0 1 0 21 12.79z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

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
