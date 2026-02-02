'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useTranslation } from '../context/LocaleContext';

const CHART_COLORS = ['#f97316', '#10b981', '#ef4444'];
const MOBILE_BREAKPOINT = 768;
const MOBILE_USER_GROWTH_ITEMS = 6;

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    setIsMobile(m.matches);
    const fn = () => setIsMobile(window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches);
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, []);
  return isMobile;
}

interface PublicDashboardChartsProps {
  userGrowthData: { month: string; count: number; year: number }[];
  pieData: { name: string; value: number; color: string }[];
}

export default function PublicDashboardCharts({
  userGrowthData,
  pieData,
}: PublicDashboardChartsProps) {
  const t = useTranslation();
  const isMobile = useIsMobile();

  const mobileUserGrowthData = userGrowthData.slice(-MOBILE_USER_GROWTH_ITEMS);
  const statusTotal = pieData.reduce((s, d) => s + d.value, 0);

  if (isMobile) {
    return (
      <>
        <div className="public-chart-card public-chart-card--mobile">
          <h3 className="public-chart-title">{t('public.usersGrowth')}</h3>
          {mobileUserGrowthData.length > 0 ? (
            <div className="public-chart-inner public-chart-inner--mobile-hbar">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={mobileUserGrowthData}
                  margin={{ top: 8, right: 12, left: 44, bottom: 8 }}
                  barCategoryGap="16%"
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" style={{ fontSize: 11 }} tickLine={false} />
                  <YAxis type="category" dataKey="month" width={42} stroke="#64748b" style={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '1px solid rgba(226, 232, 240, 0.6)',
                      borderRadius: 8,
                      padding: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [value, t('public.registered')]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#f97316"
                    radius={[0, 4, 4, 0]}
                    name={t('public.registered')}
                    isAnimationActive
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="public-chart-empty">{t('public.noDataYet')}</div>
          )}
        </div>
        <div className="public-chart-card public-chart-card--mobile">
          <h3 className="public-chart-title">{t('dashboard.chartByStatus')}</h3>
          {pieData.length > 0 ? (
            <ul className="public-chart-status-list" aria-label={t('dashboard.chartByStatus')}>
              {pieData.map((entry, i) => {
                const pct = statusTotal > 0 ? Math.round((entry.value / statusTotal) * 100) : 0;
                return (
                  <li key={i} className="public-chart-status-item">
                    <span className="public-chart-status-dot" style={{ backgroundColor: entry.color }} aria-hidden />
                    <span className="public-chart-status-label">{entry.name}</span>
                    <span className="public-chart-status-value">{entry.value}</span>
                    <span className="public-chart-status-pct">{pct}%</span>
                    <div className="public-chart-status-bar-wrap">
                      <div
                        className="public-chart-status-bar"
                        style={{ width: `${pct}%`, backgroundColor: entry.color }}
                        role="presentation"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="public-chart-empty">{t('public.noDataYet')}</div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="public-chart-card">
        <h3 className="public-chart-title">{t('public.usersGrowth')}</h3>
        {userGrowthData.length > 0 ? (
          <div className="public-chart-inner">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userGrowthData}
                margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(226, 232, 240, 0.4)',
                    borderRadius: 12,
                    padding: 12,
                  }}
                  labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                  cursor={{ fill: 'rgba(249, 115, 22, 0.08)' }}
                />
                <Bar
                  dataKey="count"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                  name={t('public.registered')}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="public-chart-empty">{t('public.noDataYet')}</div>
        )}
      </div>
      <div className="public-chart-card">
        <h3 className="public-chart-title">{t('dashboard.chartByStatus')}</h3>
        {pieData.length > 0 ? (
          <div className="public-chart-inner">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={92}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive
                  animationDuration={700}
                  animationEasing="ease-out"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(226, 232, 240, 0.4)',
                    borderRadius: 12,
                    padding: 12,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 14, color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="public-chart-empty">{t('public.noDataYet')}</div>
        )}
      </div>
    </>
  );
}
