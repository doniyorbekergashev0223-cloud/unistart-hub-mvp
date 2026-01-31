"use client";

import React, { useMemo, useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useTranslation } from '../context/LocaleContext';

const GUIDE_ICONS = [
  <svg key="1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <line x1="20" y1="8" x2="20" y2="14"></line>
    <line x1="23" y1="11" x2="17" y2="11"></line>
  </svg>,
  <svg key="2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>,
  <svg key="3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>,
  <svg key="4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>,
  <svg key="5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>,
  <svg key="6" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>,
];

export default function HelpPage() {
  const t = useTranslation();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqItems = useMemo(
    () => [
      { question: t('helpPage.faq1Q'), answer: t('helpPage.faq1A') },
      { question: t('helpPage.faq2Q'), answer: t('helpPage.faq2A') },
      { question: t('helpPage.faq3Q'), answer: t('helpPage.faq3A') },
      { question: t('helpPage.faq4Q'), answer: t('helpPage.faq4A') },
      { question: t('helpPage.faq5Q'), answer: t('helpPage.faq5A') },
      { question: t('helpPage.faq6Q'), answer: t('helpPage.faq6A') },
      { question: t('helpPage.faq7Q'), answer: t('helpPage.faq7A') },
    ],
    [t]
  );

  const guideSteps = useMemo(
    () => [
      { number: 1, titleKey: 'helpPage.guide1Title', descKey: 'helpPage.guide1Desc' },
      { number: 2, titleKey: 'helpPage.guide2Title', descKey: 'helpPage.guide2Desc' },
      { number: 3, titleKey: 'helpPage.guide3Title', descKey: 'helpPage.guide3Desc' },
      { number: 4, titleKey: 'helpPage.guide4Title', descKey: 'helpPage.guide4Desc' },
      { number: 5, titleKey: 'helpPage.guide5Title', descKey: 'helpPage.guide5Desc' },
      { number: 6, titleKey: 'helpPage.guide6Title', descKey: 'helpPage.guide6Desc' },
    ],
    []
  );

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <AuthGuard>
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-main">
          <Topbar />
          <div id="main" className="dashboard-content">
            <div className="help-page">
              <div className="help-hero">
                <h1 className="help-title">{t('helpPage.heroTitle')}</h1>
                <p className="help-subtitle">{t('helpPage.heroSubtitle')}</p>
              </div>

              <div className="help-section">
                <h2 className="help-section-title">{t('helpPage.faqTitle')}</h2>
                <div className="faq-container">
                  {faqItems.map((item, index) => (
                    <div key={index} className="faq-item">
                      <button
                        className={`faq-question ${openFAQ === index ? 'open' : ''}`}
                        onClick={() => toggleFAQ(index)}
                      >
                        <span>{item.question}</span>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`faq-icon ${openFAQ === index ? 'rotated' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      <div className={`faq-answer ${openFAQ === index ? 'open' : ''}`}>
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="help-section">
                <h2 className="help-section-title">{t('helpPage.guideTitle')}</h2>
                <div className="guide-container">
                  {guideSteps.map((step, idx) => (
                    <div key={step.number} className="guide-step">
                      <div className="guide-step-number">
                        <div className="guide-step-icon">{GUIDE_ICONS[idx]}</div>
                        <span className="guide-step-badge">{step.number}</span>
                      </div>
                      <div className="guide-step-content">
                        <h3 className="guide-step-title">{t(step.titleKey)}</h3>
                        <p className="guide-step-description">{t(step.descKey)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="help-section">
                <div className="contact-card">
                  <h2 className="contact-title">{t('helpPage.contactTitle')}</h2>
                  <p className="contact-description">{t('helpPage.contactDesc')}</p>
                  <div className="contact-info">
                    <div className="contact-item">
                      <div className="contact-item-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </div>
                      <div className="contact-item-content">
                        <div className="contact-item-label">{t('helpPage.contactEmail')}</div>
                        <div className="contact-item-value">unistart.hub@gmail.com</div>
                      </div>
                    </div>
                    <div className="contact-item">
                      <div className="contact-item-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                      </div>
                      <div className="contact-item-content">
                        <div className="contact-item-label">{t('helpPage.contactTelegram')}</div>
                        <div className="contact-item-value">@dn_ergashev</div>
                      </div>
                    </div>
                    <div className="contact-item">
                      <div className="contact-item-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div className="contact-item-content">
                        <div className="contact-item-label">{t('helpPage.contactHours')}</div>
                        <div className="contact-item-value">{t('helpPage.contactHoursValue')}</div>
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
