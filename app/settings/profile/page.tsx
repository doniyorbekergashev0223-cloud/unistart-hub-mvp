"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/settings/profile', {
        credentials: 'include',
      });

      const result = await response.json();
      if (result.ok) {
        setName(result.data.user.name);
        setEmail(result.data.user.email);
        setAvatarUrl(result.data.user.avatarUrl);
        setAvatarPreview(result.data.user.avatarUrl || null);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Faqat rasm fayllari qabul qilinadi' });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Rasm hajmi 2MB dan katta bo\'lmasligi kerak' });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      if (name.trim() !== user.name) {
        formData.append('name', name.trim());
      }

      const fileInput = fileInputRef.current;
      if (fileInput?.files?.[0]) {
        formData.append('avatar', fileInput.files[0]);
      }

      // If no changes, don't submit
      if (formData.has('name') === false && formData.has('avatar') === false) {
        setSaving(false);
        return;
      }

      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();
      if (result.ok) {
        setMessage({ type: 'success', text: 'Profil muvaffaqiyatli yangilandi' });
        setAvatarUrl(result.data.user.avatarUrl);
        if (fileInput) {
          fileInput.value = '';
        }
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
      <h2 className="settings-page-content-title">Shaxsiy ma'lumotlar</h2>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-avatar-section">
          <div className="profile-avatar-container">
            <img
              src={avatarPreview || '/default-avatar.png'}
              alt="Avatar"
              className="profile-avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Ccircle fill="%23e2e8f0" cx="60" cy="60" r="60"/%3E%3Ctext fill="%2394a3b8" x="60" y="75" font-size="40" text-anchor="middle"%3E' + (name.charAt(0).toUpperCase() || 'U') + '%3C/text%3E%3C/svg%3E';
              }}
            />
            <button
              type="button"
              className="profile-avatar-upload"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Rasm yuklash
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="profile-form-group">
          <label className="profile-form-label">To'liq ism</label>
          <input
            type="text"
            className="profile-form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </div>

        <div className="profile-form-group">
          <label className="profile-form-label">Email manzil</label>
          <input
            type="email"
            className="profile-form-input"
            value={email}
            disabled
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
          <p className="profile-form-hint">Email manzilni o'zgartirib bo'lmaydi</p>
        </div>

        {message && (
          <div className={`profile-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          className="profile-form-submit"
          disabled={saving}
        >
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>
    </div>
  );
}
