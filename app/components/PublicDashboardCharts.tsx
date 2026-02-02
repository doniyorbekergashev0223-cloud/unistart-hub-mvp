'use client';

import React from 'react';
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

interface PublicDashboardChartsProps {
  userGrowthData: { month: string; count: number; year: number }[];
  pieData: { name: string; value: number; color: string }[];
}

export default function PublicDashboardCharts({
  userGrowthData,
  pieData,
}: PublicDashboardChartsProps) {
  const t = useTranslation();
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
