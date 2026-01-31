'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation, useLocale, type Locale } from '../context/LocaleContext';
import '../styles/PublicDashboard.css';

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'uz', label: 'UZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];

function PublicChartsLoading() {
  const t = useTranslation();
  return (
    <>
      <div className="public-chart-card" style={{ minHeight: 320 }} aria-hidden>
        <div className="public-chart-empty">{t('public.loading')}</div>
      </div>
      <div className="public-chart-card" style={{ minHeight: 320 }} aria-hidden>
        <div className="public-chart-empty">{t('public.loading')}</div>
      </div>
    </>
  );
}

const PublicDashboardCharts = dynamic(
  () => import('./PublicDashboardCharts'),
  {
    ssr: false,
    loading: () => <PublicChartsLoading />,
  }
);

/* Hamkor logolar — public papkasidagi lokal fayllar */
const PARTNER_ORGANIZATIONS = [
  { name: 'Sambhram Universiteti', slug: 'sambhram', logoUrl: '/sambhram.png' },
  { name: 'Kazan Universiteti', slug: 'kazan', logoUrl: '/kazan.png' },
  { name: "O'zbekiston Milliy Universiteti (Jizzax filiali)", slug: 'uzmu-jizzakh', logoUrl: '/uzmu-jizzakh.png' },
  { name: 'Jizzax Pedagogika Universiteti', slug: 'jizzakh-pedagogical', logoUrl: '/jizzakh-pedagogika.png' },
  { name: 'Jizzax Politexnika Universiteti', slug: 'jizzakh-polytechnic', logoUrl: '/jizzakh-politexnika.png' },
  { name: 'Yoshlar ishlari agentligi', slug: 'youth-agency', logoUrl: '/youth-agency.png' },
];

interface PublicStats {
  usersCount: number;
  totalProjects: number;
  organizationsCount: number;
  universitiesCount: number;
  youthAgencyUsersCount: number;
  userGrowthByMonth: { month: string; count: number; year: number }[];
  projectsByStatus: { jarayonda: number; qabulQilindi: number; radEtildi: number };
}

function normalizeStats(raw: unknown): PublicStats {
  if (!raw || typeof raw !== 'object') {
    return {
      usersCount: 0,
      totalProjects: 0,
      organizationsCount: 0,
      universitiesCount: 0,
      youthAgencyUsersCount: 0,
      userGrowthByMonth: [],
      projectsByStatus: { jarayonda: 0, qabulQilindi: 0, radEtildi: 0 },
    };
  }
  const o = raw as Record<string, unknown>;
  const num = (v: unknown, def: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : def;
  const arr = (v: unknown): { month: string; count: number; year: number }[] =>
    Array.isArray(v)
      ? v
          .filter(
            (i): i is { month: string; count: number; year: number } =>
              i != null &&
              typeof i === 'object' &&
              typeof (i as Record<string, unknown>).month === 'string' &&
              typeof (i as Record<string, unknown>).count === 'number' &&
              typeof (i as Record<string, unknown>).year === 'number'
          )
          .map((i) => ({ month: i.month, count: i.count, year: i.year }))
      : [];
  const status = o.projectsByStatus as Record<string, unknown> | undefined;
  return {
    usersCount: num(o.usersCount, 0),
    totalProjects: num(o.totalProjects, 0),
    organizationsCount: num(o.organizationsCount, 0),
    universitiesCount: num(o.universitiesCount, 0),
    youthAgencyUsersCount: num(o.youthAgencyUsersCount, 0),
    userGrowthByMonth: arr(o.userGrowthByMonth),
    projectsByStatus: {
      jarayonda: status ? num(status.jarayonda, 0) : 0,
      qabulQilindi: status ? num(status.qabulQilindi, 0) : 0,
      radEtildi: status ? num(status.radEtildi, 0) : 0,
    },
  };
}

/* Same palette as internal DashboardCharts: orange, green, red */
const CHART_COLORS = ['#f97316', '#10b981', '#ef4444'];

const DURATION_MS = 1000;

function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(m.matches);
    const handler = () => setReduce(m.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);
  return reduce;
}

function useCountUp(value: number | undefined, enabled: boolean, skipAnimation: boolean): number {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || value === undefined || typeof value !== 'number') {
      setDisplay(value ?? 0);
      return;
    }
    if (skipAnimation) {
      setDisplay(value);
      return;
    }
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const easeOut = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(easeOut * value));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, enabled, skipAnimation]);

  return display;
}

export default function PublicDashboard() {
  const t = useTranslation();
  const { locale, setLocale } = useLocale();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    let retrying = false;
    const load = (retry = false) => {
      fetch('/api/public/stats', {
        cache: 'default',
        headers: { Accept: 'application/json' },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Network error');
          return res.json();
        })
        .then((result) => {
          if (cancelled) return;
          if (result?.ok && result.data != null) {
            setStats(normalizeStats(result.data));
            setError(null);
            if (retry) setLoading(false);
          } else {
            setStats(normalizeStats(null));
            if (!retry) setError('public.statsUnavailable');
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (retry) {
            setStats(normalizeStats(null));
            setError('dashboard.statsLoadError');
            setLoading(false);
          } else {
            retrying = true;
            load(true);
          }
        })
        .finally(() => {
          if (!cancelled && !retrying) setLoading(false);
        });
    };
    load();
    return () => { cancelled = true; };
  }, []);

  /* Section fade-in on scroll */
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const sections = main.querySelectorAll('.public-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.05 }
    );
    sections.forEach((el) => observer.observe(el));
    return () => sections.forEach((el) => observer.unobserve(el));
  }, []);

  const showCountUp = !loading && stats != null;
  const displayUsers = useCountUp(stats?.usersCount, showCountUp, reduceMotion);
  const displayProjects = useCountUp(stats?.totalProjects, showCountUp, reduceMotion);
  const displayOrganizations = useCountUp(stats?.organizationsCount, showCountUp, reduceMotion);
  const displayUnis = useCountUp(stats?.universitiesCount, showCountUp, reduceMotion);
  const displayYouth = useCountUp(stats?.youthAgencyUsersCount, showCountUp, reduceMotion);

  const userGrowthData = useMemo(
    () => stats?.userGrowthByMonth ?? [],
    [stats?.userGrowthByMonth]
  );
  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: t('status.pending'), value: stats.projectsByStatus.jarayonda, color: CHART_COLORS[0] },
      { name: t('status.accepted'), value: stats.projectsByStatus.qabulQilindi, color: CHART_COLORS[1] },
      { name: t('status.rejected'), value: stats.projectsByStatus.radEtildi, color: CHART_COLORS[2] },
    ].filter((d) => d.value > 0);
  }, [stats?.projectsByStatus, t]);

  return (
    <div className="public-dashboard">
      <header className="public-header">
        <div className="public-header-inner">
          <Link href="/" className="public-logo">
            UniStart <span className="logo-orange">Hub</span>
          </Link>
          <div className="public-header-actions">
            <div className="locale-switcher" role="group" aria-label={t('public.languageLabel')}>
              {LOCALES.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  className={`locale-btn ${locale === code ? 'active' : ''}`}
                  onClick={() => setLocale(code)}
                  aria-pressed={locale === code}
                  aria-label={label}
                >
                  {label}
                </button>
              ))}
            </div>
            <Link href="/auth/login" className="public-btn public-btn-outline">
              {t('public.login')}
            </Link>
            <Link href="/auth/register" className="public-btn public-btn-primary">
              {t('public.register')}
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="public-main" ref={mainRef}>
        {/* 1) PLATFORM STATISTICS — first visible section */}
        <section className="public-section public-stats-section" aria-labelledby="stats-heading">
          <h1 id="stats-heading" className="public-section-title public-section-title-large">
            {t('public.platformStats')}
          </h1>
          {error && (
            <p className="public-stats-error" role="alert">
              {t(error)}
            </p>
          )}
          {loading ? (
            <div className="public-stats-loading">{t('public.loading')}</div>
          ) : (
            <div className="public-stats-grid">
              <div className="public-stat-card">
                <div className="public-stat-content">
                  <h3 className="public-stat-label">{t('public.totalUsers')}</h3>
                  <div className="public-stat-value">{displayUsers}</div>
                </div>
                <div className="public-stat-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 2l-4.5 4.5"></path>
                    <path d="M21 3l-5.5 5.5"></path>
                  </svg>
                </div>
              </div>
              <div className="public-stat-card">
                <div className="public-stat-content">
                  <h3 className="public-stat-label">{t('public.totalProjects')}</h3>
                  <div className="public-stat-value">{displayProjects}</div>
                </div>
                <div className="public-stat-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                </div>
              </div>
              <div className="public-stat-card">
                <div className="public-stat-content">
                  <h3 className="public-stat-label">{t('public.totalOrgs')}</h3>
                  <div className="public-stat-value">{displayOrganizations}</div>
                </div>
                <div className="public-stat-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2L2 8v14h20V8L12 2z"></path>
                    <line x1="7" y1="8" x2="7" y2="22"></line>
                    <line x1="17" y1="8" x2="17" y2="22"></line>
                  </svg>
                </div>
              </div>
              <div className="public-stat-card">
                <div className="public-stat-content">
                  <h3 className="public-stat-label">{t('public.youthAgencyUsers')}</h3>
                  <div className="public-stat-value">{displayYouth}</div>
                </div>
                <div className="public-stat-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2) HAMKOR TASHKILOTLAR — logos, immediately after statistics */}
        <section className="public-section public-logos-section" aria-labelledby="partners-heading">
          <h2 id="partners-heading" className="public-section-title">
            {t('public.organizations')}
          </h2>
          <div className="public-logos-grid">
            {PARTNER_ORGANIZATIONS.map((org) => (
              <div key={org.slug} className={`public-logo-item ${org.slug === 'jizzakh-pedagogical' ? 'public-logo-item--larger' : ''}`}>
                <div className="public-logo-img-wrap">
                  <Image
                    src={org.logoUrl}
                    alt={org.name}
                    width={200}
                    height={80}
                    className="public-logo-img"
                    loading="lazy"
                    sizes="(max-width: 767px) 100vw, 200px"
                  />
                </div>
                <span className="public-logo-name">{org.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3) TAHLIL VA KO'RSATKICHLAR — charts, after partner logos */}
        <section className="public-section public-charts-section" aria-labelledby="analytics-heading">
          <h2 id="analytics-heading" className="public-section-title">
            {t('public.analytics')}
          </h2>
          <div className="public-charts-grid">
            <PublicDashboardCharts
              userGrowthData={userGrowthData}
              pieData={pieData}
            />
          </div>
        </section>

        {/* 4) UNISTART HUB HAQIDA — after analytics */}
        <section className="public-section public-about-section" aria-labelledby="about-heading">
          <h2 id="about-heading" className="public-section-title">
            {t('public.aboutTitle')}
          </h2>
          <div className="public-about-content">
            <p>{t('public.aboutP1')}</p>
            <p>{t('public.aboutP2')}</p>
            <p>{t('public.aboutP3')}</p>
            <p>{t('public.aboutP4')}</p>
          </div>
        </section>

        {/* 5) BIZ BILAN BOG'LANISH — last section */}
        <section className="public-section public-contact-section" aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="public-section-title">
            {t('public.contact')}
          </h2>
          <div className="public-contact-content">
            <p className="public-contact-item">
              <span className="public-contact-label">{t('public.contactEmail')}:</span> unistart.hub@gmail.com
              <span className="public-contact-value"></span>
            </p>
            <p className="public-contact-item">
              <span className="public-contact-label">{t('public.contactPhone')}:</span>{' '}
              <span className="public-contact-value">—</span>
            </p>
            <p className="public-contact-item">
              <span className="public-contact-label">{t('public.contactTelegram')}:</span> @dn_ergashev
              <span className="public-contact-value"></span>
            </p>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <p>{t('public.footerText')}</p>
      </footer>
    </div>
  );
}
