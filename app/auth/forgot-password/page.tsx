'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email majburiy');
      return;
    }

    if (!email.includes('@')) {
      setError("To'g'ri email kiriting");
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
        setError(result.error?.message || 'Xatolik yuz berdi');
      }
    } catch (err) {
      setError('Tarmoq xatoligi. Iltimos, qayta urinib ko\'ring.');
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
            <h2>Kod yuborildi</h2>
            <p>Email manzilingizga tasdiqlash kodi yuborildi</p>
          </div>

          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>Tasdiqlash kodi muvaffaqiyatli yuborildi. Iltimos, email xabaringizni tekshiring.</p>
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              Kod 15 daqiqa davomida amal qiladi.
            </p>
          </div>

          <div className="auth-footer">
            <Link href="/auth/login" className="auth-link">
              Kirish sahifasiga qaytish
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
            <h2>Parolni tiklash</h2>
            <p>Email manzilingizni kiriting</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
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
            {isLoading ? 'Yuborilmoqda...' : 'Tasdiqlash kodi yuborish'}
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

export default ForgotPasswordPage;