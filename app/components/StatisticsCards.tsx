"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/StatisticsCards.css';

interface DashboardStats {
  usersCount: number;
  totalProjects: number;
  activeProjects: number;
  rejectedProjects: number;
}

const StatisticsCards = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchStats = useCallback(async (showLoading = false) => {
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
      const response = await fetch('/api/dashboard/stats', {
        cache: 'no-store', // Prevent caching
        signal: abortControllerRef.current.signal, // Add abort signal to prevent race conditions
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
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
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
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
  }, [fetchStats]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('uz-UZ');
  };

  const statsData = [
    {
      title: "Ro'yxatdan o'tgan foydalanuvchilar",
      value: stats ? formatNumber(stats.usersCount) : '—',
      iconIndex: 0,
    },
    {
      title: 'Jami loyihalar',
      value: stats ? formatNumber(stats.totalProjects) : '—',
      iconIndex: 1,
    },
    {
      title: 'Faol loyihalar',
      value: stats ? formatNumber(stats.activeProjects) : '—',
      iconIndex: 2,
    },
    {
      title: 'Rad etilgan loyihalar',
      value: stats ? formatNumber(stats.rejectedProjects) : '—',
      iconIndex: 3,
    }
  ];

  return (
    <div className="stats-container">
      <h2 className="stats-title">Boshqaruv paneli</h2>
      {error && (
        <div className="stats-error">
          <p>{error}</p>
        </div>
      )}
      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-content">
              <h3 className="stat-title">{stat.title}</h3>
              <div className="stat-value">
                {loading ? (
                  <div className="stat-loading">Yuklanmoqda...</div>
                ) : (
                  stat.value
                )}
              </div>
              {!loading && stats && (
                <div className="stat-trend">
                  <span>↑</span>
                  <span>+12%</span>
                </div>
              )}
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
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
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