"use client";

import React from 'react';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useTranslation } from '../context/LocaleContext';

export default function AboutPage() {
  const t = useTranslation();
  return (
    <AuthGuard>
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-main">
          <Topbar />
          <div id="main" className="dashboard-content">
            <div className="about-page">
              <div className="about-hero">
                <h1 className="about-title">{t('aboutPage.heroTitle')}</h1>
                <p className="about-intro">{t('aboutPage.heroIntro1')}</p>
                <p className="about-intro">{t('aboutPage.heroIntro2')}</p>
              </div>

              <div className="about-section">
                <h2 className="about-section-title">{t('aboutPage.sectionGoal')}</h2>
                <div className="about-grid">
                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                      </svg>
                    </div>
                    <h3 className="about-card-title">{t('aboutPage.goalCard1Title')}</h3>
                    <p className="about-card-description">{t('aboutPage.goalCard1Desc')}</p>
                  </div>
                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <h3 className="about-card-title">{t('aboutPage.goalCard2Title')}</h3>
                    <p className="about-card-description">{t('aboutPage.goalCard2Desc')}</p>
                  </div>
                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <h3 className="about-card-title">{t('aboutPage.goalCard3Title')}</h3>
                    <p className="about-card-description">{t('aboutPage.goalCard3Desc')}</p>
                  </div>
                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                      </svg>
                    </div>
                    <h3 className="about-card-title">{t('aboutPage.goalCard4Title')}</h3>
                    <p className="about-card-description">{t('aboutPage.goalCard4Desc')}</p>
                  </div>
                </div>
              </div>

              <div className="about-section">
                <h2 className="about-section-title">{t('aboutPage.sectionWhoFor')}</h2>
                <div className="about-list">
                  <div className="about-list-item">
                    <div className="about-list-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <div className="about-list-content">
                      <h3 className="about-list-title">{t('aboutPage.whoFor1Title')}</h3>
                      <p className="about-list-description">{t('aboutPage.whoFor1Desc')}</p>
                    </div>
                  </div>
                  <div className="about-list-item">
                    <div className="about-list-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <div className="about-list-content">
                      <h3 className="about-list-title">{t('aboutPage.whoFor2Title')}</h3>
                      <p className="about-list-description">{t('aboutPage.whoFor2Desc')}</p>
                    </div>
                  </div>
                  <div className="about-list-item">
                    <div className="about-list-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                      </svg>
                    </div>
                    <div className="about-list-content">
                      <h3 className="about-list-title">{t('aboutPage.whoFor3Title')}</h3>
                      <p className="about-list-description">{t('aboutPage.whoFor3Desc')}</p>
                    </div>
                  </div>
                  <div className="about-list-item">
                    <div className="about-list-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                      </svg>
                    </div>
                    <div className="about-list-content">
                      <h3 className="about-list-title">{t('aboutPage.whoFor4Title')}</h3>
                      <p className="about-list-description">{t('aboutPage.whoFor4Desc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="about-section">
                <h2 className="about-section-title">{t('aboutPage.sectionHow')}</h2>
                <div className="about-process">
                  <div className="about-process-step">
                    <div className="about-process-number">1</div>
                    <div className="about-process-content">
                      <h3 className="about-process-title">{t('aboutPage.how1Title')}</h3>
                      <p className="about-process-description">{t('aboutPage.how1Desc')}</p>
                    </div>
                  </div>
                  <div className="about-process-step">
                    <div className="about-process-number">2</div>
                    <div className="about-process-content">
                      <h3 className="about-process-title">{t('aboutPage.how2Title')}</h3>
                      <p className="about-process-description">{t('aboutPage.how2Desc')}</p>
                    </div>
                  </div>
                  <div className="about-process-step">
                    <div className="about-process-number">3</div>
                    <div className="about-process-content">
                      <h3 className="about-process-title">{t('aboutPage.how3Title')}</h3>
                      <p className="about-process-description">{t('aboutPage.how3Desc')}</p>
                    </div>
                  </div>
                  <div className="about-process-step">
                    <div className="about-process-number">4</div>
                    <div className="about-process-content">
                      <h3 className="about-process-title">{t('aboutPage.how4Title')}</h3>
                      <p className="about-process-description">{t('aboutPage.how4Desc')}</p>
                    </div>
                  </div>
                  <div className="about-process-step">
                    <div className="about-process-number">5</div>
                    <div className="about-process-content">
                      <h3 className="about-process-title">{t('aboutPage.how5Title')}</h3>
                      <p className="about-process-description">{t('aboutPage.how5Desc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="about-section">
                <h2 className="about-section-title">{t('aboutPage.sectionBenefits')}</h2>
                <div className="about-grid">
                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                    <h3 className="about-card-title">{t('aboutPage.benefit1Title')}</h3>
                    <p className="about-card-description">{t('aboutPage.benefit1Desc')}</p>
                  </div>
                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <h3 className="about-card-title">{t('aboutPage.benefit2Title')}</h3>
                    <p className="about-card-description">{t('aboutPage.benefit2Desc')}</p>
                  </div>
                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    </div>
                    <h3 className="about-card-title">{t('aboutPage.benefit3Title')}</h3>
                    <p className="about-card-description">{t('aboutPage.benefit3Desc')}</p>
                  </div>
                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                      </svg>
                    </div>
                    <h3 className="about-card-title">{t('aboutPage.benefit4Title')}</h3>
                    <p className="about-card-description">{t('aboutPage.benefit4Desc')}</p>
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
