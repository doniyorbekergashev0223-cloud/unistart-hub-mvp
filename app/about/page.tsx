"use client";

import React from 'react';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function AboutPage() {
  return (
    <AuthGuard>
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-main">
          <Topbar />
          <div id="main" className="dashboard-content">
            <div className="about-page">
              {/* Hero Section */}
              <div className="about-hero">
                <h1 className="about-title">UniStart Hub — innovatsion startap platformasi</h1>
                <p className="about-intro">
                  UniStart Hub — bu oliy ta'lim muassasalarida ta'lim olayotgan iqtidorli talabalar, Texnikum va maktablardagi iqtidorli o'quvchilar hamda chekka qishloqlarda yashovchi uyushmagan yoshlarning innovatsion startap tashabbuslarini aniqlash, rivojlantirish va ularni MVP darajasidagi real raqamli mahsulotlarga aylantirishga qaratilgan markazlashtirilgan raqamli platformadir.
                </p>
                <p className="about-intro">
                  Loyiha yoshlarning salohiyatini yuzaga chiqarish, teng imkoniyatlar yaratish va innovatsion ekotizimni kengaytirishni maqsad qilgan.
                </p>
              </div>

              {/* Platforma maqsadi */}
              <div className="about-section">
                <h2 className="about-section-title">Platforma maqsadi</h2>
                <div className="about-grid">
                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                      </svg>
                    </div>
                    <h3 className="about-card-title">Yoshlarning startap g'oyalarini qo'llab-quvvatlash</h3>
                    <p className="about-card-description">
                      Iqtidorli yoshlarning innovatsion g'oyalarini aniqlash va ularga professional yordam ko'rsatish.
                    </p>
                  </div>

                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <h3 className="about-card-title">MVP darajasigacha olib chiqish</h3>
                    <p className="about-card-description">
                      Startap g'oyalarini MVP (Minimum Viable Product) darajasidagi real raqamli mahsulotlarga aylantirish.
                    </p>
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
                    <h3 className="about-card-title">Ekspertlar orqali baholash</h3>
                    <p className="about-card-description">
                      Professional ekspertlar tomonidan loyihalarni baholash va tahlil qilish.
                    </p>
                  </div>

                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                      </svg>
                    </div>
                    <h3 className="about-card-title">Shaffof va raqamli jarayon</h3>
                    <p className="about-card-description">
                      Barcha jarayonlar raqamlashtirilgan va shaffof, har bir qadam kuzatiladi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Kimlar uchun */}
              <div className="about-section">
                <h2 className="about-section-title">Kimlar uchun?</h2>
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
                      <h3 className="about-list-title">Universitet talabalari, Texnikum va maktab o'quvchilari</h3>
                      <p className="about-list-description">
                        Oliy ta'lim muassasalarida ta'lim olayotgan iqtidorli talabalar, Texnikum va maktablardagi iqtidorli o'quvchilar.
                      </p>
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
                      <h3 className="about-list-title">Chekka hududlardagi yoshlar</h3>
                      <p className="about-list-description">
                        Chekka qishloqlarda yashovchi uyushmagan yoshlar.
                      </p>
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
                      <h3 className="about-list-title">Ekspertlar</h3>
                      <p className="about-list-description">
                        Startap va innovatsiya sohasidagi professional ekspertlar.
                      </p>
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
                      <h3 className="about-list-title">Innovatsion hamkorlar</h3>
                      <p className="about-list-description">
                        Startap ekotizimini rivojlantirishga qiziqqan tashkilotlar va hamkorlar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Qanday ishlaydi */}
              <div className="about-section">
                <h2 className="about-section-title">Qanday ishlaydi?</h2>
                <div className="about-process">
                  <div className="about-process-step">
                    <div className="about-process-number">1</div>
                    <div className="about-process-content">
                      <h3 className="about-process-title">Loyiha yuborish</h3>
                      <p className="about-process-description">
                        Foydalanuvchilar o'z startap g'oyalarini platformaga yuboradi.
                      </p>
                    </div>
                  </div>

                  <div className="about-process-step">
                    <div className="about-process-number">2</div>
                    <div className="about-process-content">
                      <h3 className="about-process-title">Ko'rib chiqish</h3>
                      <p className="about-process-description">
                        Ekspertlar va adminlar loyihalarni batafsil ko'rib chiqadi.
                      </p>
                    </div>
                  </div>

                  <div className="about-process-step">
                    <div className="about-process-number">3</div>
                    <div className="about-process-content">
                      <h3 className="about-process-title">Status berish</h3>
                      <p className="about-process-description">
                        Har bir loyiha uchun aniq status belgilanadi (Qabul qilindi, Jarayonda, Rad etildi).
                      </p>
                    </div>
                  </div>

                  <div className="about-process-step">
                    <div className="about-process-number">4</div>
                    <div className="about-process-content">
                      <h3 className="about-process-title">Fikr-mulohaza</h3>
                      <p className="about-process-description">
                        Ekspertlar loyiha haqida batafsil fikr-mulohaza qoldiradi.
                      </p>
                    </div>
                  </div>

                  <div className="about-process-step">
                    <div className="about-process-number">5</div>
                    <div className="about-process-content">
                      <h3 className="about-process-title">Natija</h3>
                      <p className="about-process-description">
                        Qabul qilingan loyihalar MVP darajasigacha olib chiqiladi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Afzalliklar */}
              <div className="about-section">
                <h2 className="about-section-title">Afzalliklar</h2>
                <div className="about-grid">
                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                    <h3 className="about-card-title">Shaffoflik</h3>
                    <p className="about-card-description">
                      Barcha jarayonlar shaffof va kuzatiladi, har bir qadam hujjatlashtiriladi.
                    </p>
                  </div>

                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <h3 className="about-card-title">Xavfsizlik</h3>
                    <p className="about-card-description">
                      Ma'lumotlar xavfsiz saqlanadi va faqat ruxsat etilgan foydalanuvchilar kirish huquqiga ega.
                    </p>
                  </div>

                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    </div>
                    <h3 className="about-card-title">Real vaqt bildirishnomalari</h3>
                    <p className="about-card-description">
                      Loyiha holati o'zgarganda darhol bildirishnoma olasiz.
                    </p>
                  </div>

                  <div className="about-card">
                    <div className="about-card-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                      </svg>
                    </div>
                    <h3 className="about-card-title">Professional boshqaruv</h3>
                    <p className="about-card-description">
                      Barcha loyihalar professional darajada boshqariladi va kuzatiladi.
                    </p>
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
