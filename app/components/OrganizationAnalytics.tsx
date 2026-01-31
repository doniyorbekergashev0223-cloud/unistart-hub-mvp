'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LocaleContext';

const CHART_COLORS = ['#10b981', '#ef4444', '#f97316']; // accepted, rejected, pending

interface OrgStatsData {
  usersCount?: number;
  totalProjects: number;
  byStatus: { accepted: number; rejected: number; pending: number };
  byMonth: { month: string; count: number }[];
}

function emptyStats(): OrgStatsData {
  return {
    totalProjects: 0,
    byStatus: { accepted: 0, rejected: 0, pending: 0 },
    byMonth: [],
  };
}

function normalizeStats(raw: unknown): OrgStatsData {
  if (!raw || typeof raw !== 'object') return emptyStats();
  const o = raw as Record<string, unknown>;
  const num = (v: unknown, def: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : def;
  const statusObj = (v: unknown): { accepted: number; rejected: number; pending: number } => {
    if (!v || typeof v !== 'object') return { accepted: 0, rejected: 0, pending: 0 };
    const s = v as Record<string, unknown>;
    return {
      accepted: num(s.accepted, 0),
      rejected: num(s.rejected, 0),
      pending: num(s.pending, 0),
    };
  };
  const monthArr = (v: unknown): { month: string; count: number }[] =>
    Array.isArray(v)
      ? (v as { month: string; count: number }[]).filter(
          (i) =>
            i != null &&
            typeof i === 'object' &&
            typeof (i as { month: string }).month === 'string' &&
            typeof (i as { count: number }).count === 'number'
        )
      : [];
  const data: OrgStatsData = {
    totalProjects: num(o.totalProjects, 0),
    byStatus: statusObj(o.byStatus),
    byMonth: monthArr(o.byMonth),
  };
  if (typeof o.usersCount === 'number' && Number.isFinite(o.usersCount)) {
    data.usersCount = o.usersCount;
  }
  return data;
}

const OrganizationAnalytics = () => {
  const { user } = useAuth();
  const t = useTranslation();
  const isUserRole = user?.role === 'user';
  const STATUS_BAR_LABELS = [
    { key: 'accepted' as const, label: t('status.accepted') },
    { key: 'rejected' as const, label: t('status.rejected') },
    { key: 'pending' as const, label: t('status.pending') },
  ];
  const [stats, setStats] = useState<OrgStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchStats = React.useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/organization/stats?t=${Date.now()}`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      signal: abortRef.current.signal,
      headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error(t('dashboard.loginRequired'));
          throw new Error(t('dashboard.statsLoadError'));
        }
        return res.json();
      })
      .then((json) => {
        if (json?.ok && json?.data) {
          setStats(normalizeStats(json.data));
        } else {
          setStats(emptyStats());
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message || t('dashboard.statsLoadError'));
        setStats(emptyStats());
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [t]);

  useEffect(() => {
    setLoading(true);
    const cleanup = fetchStats();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [fetchStats]);

  useEffect(() => {
    const handleRefetch = () => {
      setLoading(true);
      fetchStats();
    };
    window.addEventListener('stats-refetch', handleRefetch);
    return () => window.removeEventListener('stats-refetch', handleRefetch);
  }, [fetchStats]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setLoading(true);
        fetchStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchStats]);

  const sectionTitle = isUserRole ? t('dashboard.myProjects') : t('dashboard.orgStats');

  const displayStats = stats ?? emptyStats();
  const statusChartData = displayStats
    ? STATUS_BAR_LABELS.map(({ key, label }) => ({
        name: label,
        count: displayStats.byStatus[key],
      }))
    : [];

  const monthChartData = displayStats.byMonth ?? [];

  return (
    <div className="organization-analytics dashboard-section">
      <h2 className="charts-section-title">{sectionTitle}</h2>

      {error && (
        <div className="stats-error" style={{ marginBottom: '1rem' }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="chart-card" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>{t('common.loading')}</p>
        </div>
      ) : (
        <>
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            {typeof displayStats.usersCount === 'number' && (
              <div className="stat-card">
                <div className="stat-content">
                  <h3 className="stat-title">{t('dashboard.statsUsers')}</h3>
                  <div className="stat-value">{displayStats.usersCount.toLocaleString('uz-UZ')}</div>
                </div>
              </div>
            )}
            <div className="stat-card">
              <div className="stat-content">
                <h3 className="stat-title">{isUserRole ? t('dashboard.statsMyTotal') : t('dashboard.statsTotalProjects')}</h3>
                <div className="stat-value">{displayStats.totalProjects.toLocaleString('uz-UZ')}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3 className="stat-title">{isUserRole ? t('dashboard.statsMyAccepted') : t('dashboard.statsAccepted')}</h3>
                <div className="stat-value">{displayStats.byStatus.accepted.toLocaleString('uz-UZ')}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3 className="stat-title">{isUserRole ? t('dashboard.statsMyRejected') : t('dashboard.statsRejected')}</h3>
                <div className="stat-value">{displayStats.byStatus.rejected.toLocaleString('uz-UZ')}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3 className="stat-title">{isUserRole ? t('dashboard.statsMyPending') : t('dashboard.statsPending')}</h3>
                <div className="stat-value">{displayStats.byStatus.pending.toLocaleString('uz-UZ')}</div>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">{isUserRole ? t('dashboard.chartMyByStatus') : t('dashboard.chartByStatus')}</h3>
              {statusChartData.every((d) => d.count === 0) ? (
                <div style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  {t('dashboard.noData')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(226, 232, 240, 0.4)',
                        borderRadius: '12px',
                        padding: '12px',
                      }}
                    />
                    <Bar dataKey="count" name={t('dashboard.projectsLabel')} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={400}>
                      {statusChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-card">
              <h3 className="chart-title">{isUserRole ? t('dashboard.chartMyByMonth') : t('dashboard.chartByMonth')}</h3>
              {monthChartData.length === 0 ? (
                <div style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  {t('dashboard.noData')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(226, 232, 240, 0.4)',
                        borderRadius: '12px',
                        padding: '12px',
                      }}
                    />
                    <Bar dataKey="count" name={t('dashboard.projectsLabel')} fill="#f97316" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={400} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrganizationAnalytics;
