'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const ForgotPasswordPage = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailOrPhone.trim()) {
      setError('Email yoki telefon raqam majburiy');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      setIsSuccess(true);
      setIsLoading(false);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>UniStart <span className="logo-orange">Hub</span></h1>
            <h2>Kod yuborildi</h2>
            <p>Email yoki telefoningizga tasdiqlash kodi yuborildi</p>
          </div>

          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>Tasdiqlash kodi muvaffaqiyatli yuborildi. Iltimos, email yoki SMS-ni tekshiring.</p>
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
          <p>Email yoki telefon raqamingizni kiriting</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="emailOrPhone" className="form-label">
              Email yoki Telefon *
            </label>
            <input
              type="text"
              id="emailOrPhone"
              name="emailOrPhone"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className={`form-input ${error ? 'error' : ''}`}
              placeholder="email@example.com yoki +998901234567"
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