"use client";

import React from 'react';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function DevelopersPage() {
  return (
    <AuthGuard>
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-main">
          <Topbar />
          <div id="main" className="dashboard-content">
            <div className="founder-page">
              {/* Hero Section */}
              <div className="founder-hero">
                <div className="founder-avatar-placeholder">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <h1 className="founder-title">Loyiha asoschisi</h1>
                <h2 className="founder-name">Doniyor Ergashev</h2>
                <p className="founder-subtitle">
                  UniStart Hub platformasi asoschisi va loyiha rahbari
                </p>
              </div>

              {/* Men haqimda Section */}
              <div className="founder-section">
                <h2 className="founder-section-title">Men haqimda</h2>
                <div className="founder-card">
                  <p className="founder-text">
                    Men — Doniyor Ergashev, UniStart Hub platformasi asoschisi va loyiha rahbariman.
                    Ushbu platforma universitetlarda tahsil olayotgan iqtidorli talabalar hamda
                    chekka hududlarda yashovchi uyushmagan yoshlarning startap g'oyalarini
                    real ishlaydigan MVP mahsulotlarga aylantirish maqsadida yaratilgan.
                  </p>
                  <p className="founder-text">
                    Loyiha orqali yoshlarning salohiyatini yuzaga chiqarish,
                    ular uchun teng imkoniyatlar yaratish va innovatsion muhitni
                    kengaytirish asosiy maqsadim hisoblanadi.
                  </p>
                </div>
              </div>

              {/* Motivation Section */}
              <div className="founder-section">
                <h2 className="founder-section-title">Nega UniStart Hub?</h2>
                <div className="founder-card">
                  <ul className="founder-list">
                    <li className="founder-list-item">
                      <div className="founder-list-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <span>Yoshlar g'oyalari ko'pincha e'tiborsiz qolib ketadi</span>
                    </li>
                    <li className="founder-list-item">
                      <div className="founder-list-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <span>Chekka hududlarda imkoniyatlar yetishmaydi</span>
                    </li>
                    <li className="founder-list-item">
                      <div className="founder-list-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <span>Tajribali yo'l-yo'riq va ekspert fikri zarur</span>
                    </li>
                    <li className="founder-list-item">
                      <div className="founder-list-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <span>UniStart Hub bu bo'shliqni to'ldirish uchun yaratilgan</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Role Section */}
              <div className="founder-section">
                <h2 className="founder-section-title">Rolim va mas'uliyatim</h2>
                <div className="founder-grid">
                  <div className="founder-grid-item">
                    <div className="founder-grid-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                      </svg>
                    </div>
                    <h3 className="founder-grid-title">Platforma konsepsiyasini ishlab chiqish</h3>
                  </div>
                  <div className="founder-grid-item">
                    <div className="founder-grid-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                      </svg>
                    </div>
                    <h3 className="founder-grid-title">Jarayonlarni boshqarish</h3>
                  </div>
                  <div className="founder-grid-item">
                    <div className="founder-grid-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <h3 className="founder-grid-title">Ekspertlar bilan ishlash</h3>
                  </div>
                  <div className="founder-grid-item">
                    <div className="founder-grid-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <h3 className="founder-grid-title">Loyiha rivojini nazorat qilish</h3>
                  </div>
                </div>
              </div>

              {/* Future Goals Section */}
              <div className="founder-section">
                <h2 className="founder-section-title">Kelajak rejalar</h2>
                <div className="founder-card">
                  <div className="founder-goals">
                    <div className="founder-goal-item">
                      <div className="founder-goal-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <span>UniStart Hub'ni respublika miqyosida kengaytirish</span>
                    </div>
                    <div className="founder-goal-item">
                      <div className="founder-goal-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                          <path d="M2 17l10 5 10-5"></path>
                          <path d="M2 12l10 5 10-5"></path>
                        </svg>
                      </div>
                      <span>Universitetlar bilan hamkorlik</span>
                    </div>
                    <div className="founder-goal-item">
                      <div className="founder-goal-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="2" x2="12" y2="22"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                      </div>
                      <span>Startaplarni real bozorga olib chiqish</span>
                    </div>
                    <div className="founder-goal-item">
                      <div className="founder-goal-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                          <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                      </div>
                      <span>Yoshlar uchun barqaror innovatsion ekotizim yaratish</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="founder-section">
                <div className="founder-contact-card">
                  <h2 className="founder-contact-title">Aloqa</h2>
                  <div className="founder-contact-info">
                    <div className="founder-contact-item">
                      <div className="founder-contact-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </div>
                      <div className="founder-contact-content">
                        <div className="founder-contact-label">Email</div>
                        <div className="founder-contact-value">unistart.hub@gmail.com</div>
                      </div>
                    </div>
                    <div className="founder-contact-item">
                      <div className="founder-contact-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                      </div>
                      <div className="founder-contact-content">
                        <div className="founder-contact-label">Telegram</div>
                        <div className="founder-contact-value">@dn_ergashev</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
