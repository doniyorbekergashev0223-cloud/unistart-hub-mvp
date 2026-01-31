"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function NotificationsSettingsPage() {
  const { user } = useAuth();
  const [emailStatusChange, setEmailStatusChange] = useState(true);
  const [emailAdminComment, setEmailAdminComment] = useState(true);
  const [emailPlatformUpdates, setEmailPlatformUpdates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Try to load from localStorage first
      const stored = localStorage.getItem(`notifications_prefs_${user.id}`);
      if (stored) {
        const prefs = JSON.parse(stored);
        setEmailStatusChange(prefs.emailStatusChange ?? true);
        setEmailAdminComment(prefs.emailAdminComment ?? true);
        setEmailPlatformUpdates(prefs.emailPlatformUpdates ?? false);
        setLoading(false);
        return;
      }

      // Fallback to API (returns defaults)
      const response = await fetch('/api/settings/notifications', {
        credentials: 'include',
      });

      const result = await response.json();
      if (result.ok) {
        setEmailStatusChange(result.data.emailStatusChange);
        setEmailAdminComment(result.data.emailAdminComment);
        setEmailPlatformUpdates(result.data.emailPlatformUpdates);
        // Store in localStorage
        localStorage.setItem(`notifications_prefs_${user.id}`, JSON.stringify(result.data));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field: 'emailStatusChange' | 'emailAdminComment' | 'emailPlatformUpdates', value: boolean) => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ [field]: value }),
      });

      const result = await response.json();
      if (result.ok) {
        setMessage({ type: 'success', text: 'Sozlamalar saqlandi' });
        setTimeout(() => setMessage(null), 2000);
        
        // Update local state
        if (field === 'emailStatusChange') setEmailStatusChange(value);
        if (field === 'emailAdminComment') setEmailAdminComment(value);
        if (field === 'emailPlatformUpdates') setEmailPlatformUpdates(value);

        // Save to localStorage
        const updatedPrefs = {
          emailStatusChange: field === 'emailStatusChange' ? value : emailStatusChange,
          emailAdminComment: field === 'emailAdminComment' ? value : emailAdminComment,
          emailPlatformUpdates: field === 'emailPlatformUpdates' ? value : emailPlatformUpdates,
        };
        localStorage.setItem(`notifications_prefs_${user.id}`, JSON.stringify(updatedPrefs));
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
      <h2 className="settings-page-content-title">Bildirishnomalar</h2>

      {message && (
        <div className={`notifications-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="notifications-list">
        <div className="notifications-item">
          <div className="notifications-item-content">
            <label className="notifications-item-label">Loyiha status o'zgarganda email yuborish</label>
            <p className="notifications-item-description">
              Loyiha holati o'zgarganda email orqali xabar oling
            </p>
          </div>
          <label className="notifications-toggle">
            <input
              type="checkbox"
              checked={emailStatusChange}
              onChange={(e) => handleToggle('emailStatusChange', e.target.checked)}
              disabled={saving}
            />
            <span className="notifications-toggle-slider"></span>
          </label>
        </div>

        <div className="notifications-item">
          <div className="notifications-item-content">
            <label className="notifications-item-label">Admin izoh qoldirganda email yuborish</label>
            <p className="notifications-item-description">
              Admin yoki ekspert izoh qoldirganda email orqali xabar oling
            </p>
          </div>
          <label className="notifications-toggle">
            <input
              type="checkbox"
              checked={emailAdminComment}
              onChange={(e) => handleToggle('emailAdminComment', e.target.checked)}
              disabled={saving}
            />
            <span className="notifications-toggle-slider"></span>
          </label>
        </div>

        <div className="notifications-item">
          <div className="notifications-item-content">
            <label className="notifications-item-label">Platforma yangiliklari</label>
            <p className="notifications-item-description">
              Platforma yangiliklari va e'lonlar haqida email oling
            </p>
          </div>
          <label className="notifications-toggle">
            <input
              type="checkbox"
              checked={emailPlatformUpdates}
              onChange={(e) => handleToggle('emailPlatformUpdates', e.target.checked)}
              disabled={saving}
            />
            <span className="notifications-toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}
