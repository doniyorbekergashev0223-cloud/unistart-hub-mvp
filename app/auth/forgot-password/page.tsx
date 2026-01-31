'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../context/LocaleContext';

const ForgotPasswordPage = () => {
  const t = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError(t('auth.emailRequired'));
      return;
    }

    if (!email.includes('@')) {
      setError(t('auth.emailInvalid'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.ok) {
        setIsSuccess(true);
      } else {
        setError(result.error?.message || t('common.error'));
      }
    } catch (err) {
      setError(t('auth.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>{t('public.heroTitle')} <span className="logo-orange">Hub</span></h1>
            <h2>{t('auth.codeSent')}</h2>
            <p>{t('auth.codeSentSubtitle')}</p>
          </div>

          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>{t('auth.codeSentSubtitle')}</p>
          </div>

          <div className="auth-footer">
            <Link href="/auth/login" className="auth-link">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('public.heroTitle')} <span className="logo-orange">Hub</span></h1>
          <h2>{t('auth.resetPassword')}</h2>
          <p>{t('auth.email')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('auth.email')} *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`form-input ${error ? 'error' : ''}`}
              placeholder="email@example.com"
              disabled={isLoading}
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : t('auth.sendResetLink')}
          </button>
        </form>

        <div className="auth-footer">
          <Link href="/auth/login" className="auth-link">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;