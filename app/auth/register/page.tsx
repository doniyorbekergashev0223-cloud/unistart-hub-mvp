'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useTranslation } from '../../context/LocaleContext';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  organization: string;
}

type SignupVariant = 'student' | 'non-student' | null;

const RegisterPage = () => {
  const router = useRouter();
  const { register } = useAuth();
  const t = useTranslation();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    organization: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [variant, setVariant] = useState<SignupVariant>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('auth.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!formData.email.includes('@')) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (!formData.password.trim()) {
      newErrors.password = t('auth.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.passwordMinLength');
    }

    if (variant === 'student' && !formData.organization.trim()) {
      (newErrors as any).organization = t('auth.organizationRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !variant) {
      return;
    }

    setIsLoading(true);

    try {
      const organizationSlug =
        variant === 'student' ? formData.organization : 'youth-agency';

      const success = await register(
        formData.name,
        formData.email,
        formData.password,
        'user',
        organizationSlug
      );

      if (success) {
        router.push('/dashboard');
      } else {
        setErrors({ email: t('auth.registerError') });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.registerError');
      setErrors({ email: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };


  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('nav.logoPart1')} <span className="auth-logo-accent">{t('nav.logoPart2')}</span></h1>
          <h2>{t('auth.register')}</h2>
          {!variant && <p>{t('auth.registerSubtitle')}</p>}
          {variant && <p>{t('auth.registerSubtitleForm')}</p>}
        </div>

        {!variant && (
          <div className="auth-form">
            <button
              type="button"
              className="auth-button"
              onClick={() => setVariant('student')}
              disabled={isLoading}
            >
              🎓 {t('auth.iAmStudent')}
            </button>
            <button
              type="button"
              className="auth-button"
              onClick={() => setVariant('non-student')}
              disabled={isLoading}
            >
              🏡 {t('auth.iAmNotStudent')}
            </button>
          </div>
        )}

        {variant && (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              {t('auth.name')} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder={t('auth.namePlaceholder')}
              disabled={isLoading}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('auth.email')} *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="email@example.com"
              disabled={isLoading}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            {t('auth.password')} *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder={t('auth.passwordPlaceholder')}
            disabled={isLoading}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        {variant === 'student' && (
          <div className="form-group">
            <label htmlFor="organization" className="form-label">
              {t('auth.organization')} *
            </label>
            <select
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              className={`form-input ${(errors as any).organization ? 'error' : ''}`}
              disabled={isLoading}
            >
              <option value="">{t('auth.selectOrganization')}</option>
              <option value="sambhram">Sambhram</option>
              <option value="kazan">Kazan</option>
              <option value="uzmu-jizzakh">UzMU Jizzakh</option>
              <option value="jizzakh-pedagogical">Jizzakh Pedagogika</option>
              <option value="jizzakh-polytechnic">Jizzakh Politexnika</option>
            </select>
            {(errors as any).organization && (
              <span className="error-message">{(errors as any).organization}</span>
            )}
          </div>
        )}

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? t('auth.registerLoading') : t('auth.registerButton')}
          </button>
        </form>
        )}

        <div className="auth-footer">
          <p>{t('auth.hasAccount')} <Link href="/auth/login" className="auth-link">{t('auth.login')}</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;