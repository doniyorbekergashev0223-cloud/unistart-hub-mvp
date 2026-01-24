"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AuditLog {
  id: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const actionLabels: Record<string, string> = {
  LOGIN: 'Kirish',
  LOGOUT: 'Chiqish',
  PASSWORD_CHANGE: 'Parol o\'zgartirildi',
  PROFILE_UPDATE: 'Profil yangilandi',
  AVATAR_UPDATE: 'Avatar yangilandi',
};

export default function ActivitySettingsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadActivity();
    }
  }, [user]);

  const loadActivity = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/settings/activity?limit=20', {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });

      const result = await response.json();
      if (result.ok) {
        setLogs(result.data.logs);
      }
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Noma\'lum';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Boshqa';
  };

  if (loading) {
    return <div className="settings-loading">Yuklanmoqda...</div>;
  }

  return (
    <div className="settings-page-content">
      <h2 className="settings-page-content-title">Faollik tarixi</h2>

      {logs.length === 0 ? (
        <div className="activity-empty">
          <p>Hozircha faollik tarixi yo'q</p>
        </div>
      ) : (
        <div className="activity-table-container">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Harakat</th>
                <th>IP manzil</th>
                <th>Brauzer</th>
                <th>Sana va vaqt</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className="activity-action">{actionLabels[log.action] || log.action}</span>
                  </td>
                  <td>{log.ipAddress || '—'}</td>
                  <td>{getBrowserInfo(log.userAgent)}</td>
                  <td>{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
