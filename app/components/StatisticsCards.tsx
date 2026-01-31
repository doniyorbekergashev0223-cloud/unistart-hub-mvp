"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LocaleContext';
import '../styles/StatisticsCards.css';

const COUNT_UP_DURATION_MS = 800;

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
      const progress = Math.min(elapsed / COUNT_UP_DURATION_MS, 1);
      const easeOut = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(easeOut * value));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, enabled, skipAnimation]);

  return display;
}

interface DashboardStats {
  usersCount: number;
  totalProjects: number;
  activeProjects: number;
  rejectedProjects: number;
}

const StatisticsCards = () => {
  const { user } = useAuth();
  const t = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const reduceMotion = useReducedMotion();

  const fetchStats = useCallback(async (showLoading = false) => {
    if (!user) return;

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      };

      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
        cache: 'no-store',
        signal: abortControllerRef.current.signal,
        headers,
      });
      
      const result = await response.json().catch(() => null);

      if (!isMountedRef.current || abortControllerRef.current.signal.aborted) return;

      if (!response.ok || !result || !result.ok) {
        throw new Error(result?.error?.message || 'Statistika yuklanmadi');
      }

      if (result.data) {
        setStats(result.data);
        setError(null);
      } else {
        throw new Error('Statistika ma\'lumotlari topilmadi');
      }
    } catch (err: any) {
      if (!isMountedRef.current || abortControllerRef.current.signal.aborted) return;
      
      // Ignore abort errors
      if (err.name === 'AbortError') return;
      
      console.error('Failed to fetch dashboard stats:', err);
      setError('Statistika yuklanmadi');
      // Set default values for graceful degradation
      setStats({
        usersCount: 0,
        totalProjects: 0,
        activeProjects: 0,
        rejectedProjects: 0,
      });
    } finally {
      if (isMountedRef.current && !abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!user) {
      setLoading(false);
      return;
    }
    // Initial fetch
    void fetchStats(true);
    
    // Set up polling: refetch stats every 10 seconds
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        void fetchStats(false); // Don't show loading spinner on polling
      }
    }, 10000); // 10 seconds
    
    // Listen for custom events to trigger immediate refetch
    const handleStatsRefetch = () => {
      if (isMountedRef.current) {
        void fetchStats(false);
      }
    };
    
    window.addEventListener('stats-refetch', handleStatsRefetch);
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      window.removeEventListener('stats-refetch', handleStatsRefetch);
    };
  }, [fetchStats, user]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('uz-UZ');
  };

  // Accepted = Qabul qilindi (derived from API counts; backend may add this field later)
  const acceptedCount = stats
    ? Math.max(0, stats.totalProjects - stats.activeProjects - stats.rejectedProjects)
    : 0;

  const showCountUp = !loading && stats != null;
  const displayUsers = useCountUp(stats?.usersCount, showCountUp, reduceMotion);
  const displayProjects = useCountUp(stats?.totalProjects, showCountUp, reduceMotion);
  const displayRejected = useCountUp(stats?.rejectedProjects, showCountUp, reduceMotion);
  const displayAccepted = useCountUp(acceptedCount, showCountUp, reduceMotion);

  const statsData = [
    { titleKey: 'statsCards.totalUsers', value: stats ? formatNumber(displayUsers) : '—', iconIndex: 0 },
    { titleKey: 'statsCards.totalProjects', value: stats ? formatNumber(displayProjects) : '—', iconIndex: 1 },
    { titleKey: 'statsCards.rejectedProjects', value: stats ? formatNumber(displayRejected) : '—', iconIndex: 3 },
    { titleKey: 'statsCards.acceptedProjects', value: stats ? formatNumber(displayAccepted) : '—', iconIndex: 2 },
  ];

  return (
    <div className="stats-container dashboard-section">
      <h2 className="stats-title">{t('statsCards.title')}</h2>
      {error && (
        <div className="stats-error">
          <p>{error}</p>
        </div>
      )}
      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-content">
              <h3 className="stat-title">{t(stat.titleKey)}</h3>
              <div className="stat-value">
                {loading ? (
                  <div className="stat-loading">{t('common.loading')}</div>
                ) : (
                  stat.value
                )}
              </div>
            </div>
            <div className="stat-icon">
              {stat.iconIndex === 0 && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 2l-4.5 4.5"></path>
                  <path d="M21 3l-5.5 5.5"></path>
                </svg>
              )}
              {stat.iconIndex === 1 && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="9"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              )}
              {stat.iconIndex === 2 && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              )}
              {stat.iconIndex === 3 && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatisticsCards;