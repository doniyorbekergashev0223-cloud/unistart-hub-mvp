"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; text: string } => {
    if (password.length === 0) {
      return { strength: 'weak', text: '' };
    }
    if (password.length < 8) {
      return { strength: 'weak', text: 'Zaif (kamida 8 ta belgi)' };
    }
    if (password.length < 12) {
      return { strength: 'medium', text: 'O\'rtacha' };
    }
    return { strength: 'strong', text: 'Kuchli' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Yangi parollar mos kelmaydi' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();
      if (result.ok) {
        setMessage({ type: 'success', text: result.data.message || 'Parol muvaffaqiyatli o\'zgartirildi' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const errorMessage = result.error?.details?.fieldErrors
          ? Object.values(result.error.details.fieldErrors)[0] as string
          : result.error?.message || 'Xatolik yuz berdi';
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Xatolik yuz berdi' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page-content">
      <h2 className="settings-page-content-title">Xavfsizlik</h2>

      <form onSubmit={handleSubmit} className="security-form">
        <div className="security-form-group">
          <label className="security-form-label">Joriy parol</label>
          <div className="security-form-input-wrapper">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              className="security-form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="security-form-toggle"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? 'Yashirish' : 'Ko\'rsatish'}
            </button>
          </div>
        </div>

        <div className="security-form-group">
          <label className="security-form-label">Yangi parol</label>
          <div className="security-form-input-wrapper">
            <input
              type={showNewPassword ? 'text' : 'password'}
              className="security-form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              className="security-form-toggle"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? 'Yashirish' : 'Ko\'rsatish'}
            </button>
          </div>
          {newPassword && (
            <div className={`password-strength ${passwordStrength.strength}`}>
              {passwordStrength.text}
            </div>
          )}
        </div>

        <div className="security-form-group">
          <label className="security-form-label">Yangi parolni tasdiqlash</label>
          <div className="security-form-input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className="security-form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              className="security-form-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? 'Yashirish' : 'Ko\'rsatish'}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <div className="password-error">Parollar mos kelmaydi</div>
          )}
        </div>

        {message && (
          <div className={`security-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          className="security-form-submit"
          disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
        >
          {loading ? 'O\'zgartirilmoqda...' : 'Parolni o\'zgartirish'}
        </button>
      </form>
    </div>
  );
}
