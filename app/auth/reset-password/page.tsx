'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});

  // Get email and code from URL params if present
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
      fieldErrors.email = "To'g'ri email kiriting";
    }
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      fieldErrors.code = "Tasdiqlash kodi 6 ta raqamdan iborat bo'lishi kerak";
    }
    if (!newPassword) {
      fieldErrors.newPassword = 'Yangi parol majburiy';
    } else if (newPassword.length < 8) {
      fieldErrors.newPassword = "Parol kamida 8 ta belgidan iborat bo'lishi kerak";
    }
    if (newPassword !== confirmPassword) {
      fieldErrors.confirmPassword = 'Parollar mos kelmaydi';
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
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        if (result.error?.details?.fieldErrors) {
          setError(result.error.details.fieldErrors);
        } else {
          setError({ general: result.error?.message || 'Xatolik yuz berdi' });
        }
      }
    } catch (err) {
      setError({ general: 'Tarmoq xatoligi. Iltimos, qayta urinib ko\'ring.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>UniStart <span className="logo-orange">Hub</span></h1>
            <h2>Parol o'zgartirildi</h2>
            <p>Parolingiz muvaffaqiyatli o'zgartirildi</p>
          </div>

          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>Parolingiz muvaffaqiyatli o'zgartirildi. Kirish sahifasiga yo'naltirilmoqdasiz...</p>
          </div>

          <div className="auth-footer">
            <Link href="/auth/login" className="auth-link">
              Kirish sahifasiga o'tish
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
          <h1>UniStart <span className="logo-orange">Hub</span></h1>
          <h2>Yangi parol kiriting</h2>
          <p>Tasdiqlash kodini va yangi parolni kiriting</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error.general && (
            <div className="error-message" style={{ marginBottom: '15px' }}>
              {error.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email *
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
              Tasdiqlash kodi *
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
              Yangi parol *
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`form-input ${error.newPassword ? 'error' : ''}`}
              placeholder="Kamida 8 ta belgi"
              disabled={isLoading}
            />
            {error.newPassword && <span className="error-message">{error.newPassword}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Parolni tasdiqlash *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`form-input ${error.confirmPassword ? 'error' : ''}`}
              placeholder="Parolni qayta kiriting"
              disabled={isLoading}
            />
            {error.confirmPassword && <span className="error-message">{error.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'O\'zgartirilmoqda...' : 'Parolni o\'zgartirish'}
          </button>
        </form>

        <div className="auth-footer">
          <Link href="/auth/login" className="auth-link">
            Kirish sahifasiga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
};

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>UniStart <span className="logo-orange">Hub</span></h1>
            <h2>Yuklanmoqda...</h2>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
