"use client";

import React, { useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [statusNotifications, setStatusNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  return (
    <AuthGuard>
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-main">
          <Topbar />
          <div className="dashboard-content">
            <div className="settings-page">
              <h1 className="settings-page-title">Sozlamalar</h1>
              
              {/* Interface Settings */}
              <div className="settings-card">
                <h2 className="settings-section-title">Interfeys sozlamalari</h2>
                
                <div className="settings-item">
                  <div className="settings-item-content">
                    <label className="settings-label">Mavzu</label>
                    <p className="settings-description">Sayt mavzusini tanlang</p>
                  </div>
                  <div className="settings-control">
                    <select
                      className="settings-select"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                    >
                      <option value="light">Yorug'</option>
                      <option value="dark">Qorong'u</option>
                    </select>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-item-content">
                    <label className="settings-label">Til</label>
                    <p className="settings-description">Sayt tili</p>
                  </div>
                  <div className="settings-control">
                    <select className="settings-select" disabled>
                      <option value="uz">O'zbek</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="settings-card">
                <h2 className="settings-section-title">Bildirishnoma sozlamalari</h2>
                
                <div className="settings-item">
                  <div className="settings-item-content">
                    <label className="settings-label">Status o'zgarganda xabar berish</label>
                    <p className="settings-description">Loyiha holati o'zgarganda bildirishnoma oling</p>
                  </div>
                  <div className="settings-control">
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={statusNotifications}
                        onChange={(e) => setStatusNotifications(e.target.checked)}
                      />
                      <span className="settings-toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-item-content">
                    <label className="settings-label">Email orqali xabarlar</label>
                    <p className="settings-description">Email orqali bildirishnomalar oling</p>
                  </div>
                  <div className="settings-control">
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        disabled
                      />
                      <span className="settings-toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="settings-card">
                <h2 className="settings-section-title">Xavfsizlik</h2>
                
                <div className="settings-item">
                  <div className="settings-item-content">
                    <label className="settings-label">Parolni o'zgartirish</label>
                    <p className="settings-description">Hisobingiz parolini yangilang</p>
                  </div>
                  <div className="settings-control">
                    <button className="settings-button" disabled>
                      Parolni o'zgartirish
                    </button>
                  </div>
                </div>

                <p className="settings-hint">
                  Keyingi bosqichda yoqiladi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
