'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '../../context/LocaleContext';

const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const codeParam = searchParams.get('token');
    if (emailParam) setEmail(decodeURIComponent(emailParam));
    if (codeParam) setCode(codeParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fieldErrors: Record<string, string> = {};

    if (!email || !email.includes('@')) {
      fieldErrors.email = t('auth.emailInvalid');
    }
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      fieldErrors.code = t('auth.resetPassword.error');
    }
    if (!newPassword) {
      fieldErrors.newPassword = t('auth.passwordRequired');
    } else if (newPassword.length < 8) {
      fieldErrors.newPassword = t('auth.resetPassword.password');
    }
    if (newPassword !== confirmPassword) {
      fieldErrors.confirmPassword = t('auth.resetPassword.passwordMismatch');
    }

    if (Object.keys(fieldErrors).length > 0) {
      setError(fieldErrors);
      return;
    }

    setIsLoading(true);
    setError({});

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        if (result.error?.details?.fieldErrors) {
          setError(result.error.details.fieldErrors);
        } else {
          setError({ general: result.error?.message || t('auth.resetPassword.error') });
        }
      }
    } catch (err) {
      setError({ general: t('auth.networkError') });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>{t('nav.logoPart1')} <span className="auth-logo-accent">{t('nav.logoPart2')}</span></h1>
            <h2>{t('auth.resetPassword.success')}</h2>
            <p>{t('auth.resetPassword.success')}</p>
          </div>

          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>{t('auth.resetPassword.success')}</p>
          </div>

          <div className="auth-footer">
            <Link href="/auth/login" className="auth-link">
              {t('auth.resetPassword.backToLogin')}
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
          <h1>{t('nav.logoPart1')} <span className="auth-logo-accent">{t('nav.logoPart2')}</span></h1>
          <h2>{t('auth.resetPassword.title')}</h2>
          <p>{t('auth.resetPassword.description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error.general && (
            <div className="error-message" style={{ marginBottom: '15px' }}>
              {error.general}
            </div>
          )}

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
              className={`form-input ${error.email ? 'error' : ''}`}
              placeholder="email@example.com"
              disabled={isLoading}
            />
            {error.email && <span className="error-message">{error.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="code" className="form-label">
              {t('auth.resetPassword.description')} *
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={`form-input ${error.code ? 'error' : ''}`}
              placeholder="123456"
              maxLength={6}
              disabled={isLoading}
            />
            {error.code && <span className="error-message">{error.code}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">
              {t('auth.password')} *
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`form-input ${error.newPassword ? 'error' : ''}`}
              placeholder={t('auth.resetPassword.password')}
              disabled={isLoading}
            />
            {error.newPassword && <span className="error-message">{error.newPassword}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              {t('auth.confirmPassword')} *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`form-input ${error.confirmPassword ? 'error' : ''}`}
              placeholder={t('auth.resetPassword.confirmPassword')}
              disabled={isLoading}
            />
            {error.confirmPassword && <span className="error-message">{error.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? t('auth.resetPassword.loading') : t('auth.resetPassword.submit')}
          </button>
        </form>

        <div className="auth-footer">
          <Link href="/auth/login" className="auth-link">
            {t('auth.resetPassword.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
};

const ResetPasswordPage = () => {
  const t = useTranslation();
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>{t('nav.logoPart1')} <span className="auth-logo-accent">{t('nav.logoPart2')}</span></h1>
            <h2>{t('auth.resetPassword.loading')}</h2>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
