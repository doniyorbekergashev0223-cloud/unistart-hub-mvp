"use client";

import React, { useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'UniStart Hub nima?',
    answer: 'UniStart Hub — bu yoshlarning innovatsion startap g\'oyalarini aniqlash, rivojlantirish va ularni MVP darajasidagi real raqamli mahsulotlarga aylantirishga qaratilgan markazlashtirilgan raqamli platforma. Platforma orqali siz o\'z loyihangizni yuborishingiz, ekspertlar tomonidan ko\'rib chiqilishini va rivojlantirishni kuzatishingiz mumkin.'
  },
  {
    question: 'Loyiha qanday yuboriladi?',
    answer: 'Loyiha yuborish juda oson! Sidebar\'dagi "Loyiha yuborish" tugmasini bosing, so\'ng loyiha nomi, g\'oya tavsifi va aloqa ma\'lumotlarini to\'ldiring. Ixtiyoriy ravishda loyiha bilan bog\'liq fayl yuklashingiz mumkin. Ma\'lumotlarni to\'ldirib, "Yuborish" tugmasini bosing.'
  },
  {
    question: 'Loyiha qachon ko\'rib chiqiladi?',
    answer: 'Yuborilgan loyihalar admin va ekspertlar tomonidan tez orada ko\'rib chiqiladi. Har bir loyiha uchun status belgilanadi: "Jarayonda" (ko\'rib chiqilmoqda), "Qabul qilindi" (tasdiqlandi) yoki "Rad etildi" (rad etildi). Sizga real vaqtda bildirishnoma yuboriladi.'
  },
  {
    question: 'Loyiha rad etilsa nima bo\'ladi?',
    answer: 'Agar loyiha rad etilsa, sizga bildirishnoma yuboriladi va ekspertlar o\'z fikr-mulohazalarini qoldiradi. Rad etilgan loyihani qayta ko\'rib chiqish uchun yangi loyiha sifatida yuborishingiz mumkin, yoki ekspertlar tavsiyalariga asosan loyihani yaxshilab, qayta yuborishingiz mumkin.'
  },
  {
    question: 'Admin va ekspertlar qanday ishlaydi?',
    answer: 'Admin va ekspertlar yuborilgan loyihalarni ko\'rib chiqadi, baholaydi va status belgilaydi. Ular har bir loyiha uchun batafsil fikr-mulohaza qoldiradi va loyihani rivojlantirish bo\'yicha tavsiyalar beradi. Bu jarayon shaffof va raqamli tarzda amalga oshiriladi.'
  },
  {
    question: 'Bildirishnomalar qachon keladi?',
    answer: 'Bildirishnomalar loyiha holati o\'zgarganda darhol yuboriladi. Masalan, loyiha ko\'rib chiqilganda, status o\'zgarganda yoki ekspertlar fikr-mulohaza qoldirganda. Topbar\'dagi qo\'ng\'iroq belgisi orqali barcha bildirishnomalarni ko\'rishingiz mumkin.'
  },
  {
    question: 'Profil va sozlamalarni qayerdan o\'zgartiraman?',
    answer: 'Profil va sozlamalarni o\'zgartirish uchun Topbar\'dagi profil menyusini oching va "Shaxsiy ma\'lumotlar" yoki "Sozlamalar" bo\'limiga o\'ting. U yerda siz o\'z ma\'lumotlaringizni yangilashingiz mumkin.'
  }
];

const guideSteps = [
  {
    number: 1,
    title: 'Ro\'yxatdan o\'tish',
    description: 'Platformaga kirish uchun avval ro\'yxatdan o\'ting. "Ro\'yxatdan o\'tish" sahifasida ism, email va parol kiriting.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <line x1="20" y1="8" x2="20" y2="14"></line>
        <line x1="23" y1="11" x2="17" y2="11"></line>
      </svg>
    )
  },
  {
    number: 2,
    title: 'Profilni to\'ldirish',
    description: 'Ro\'yxatdan o\'tgandan so\'ng, profil ma\'lumotlaringizni to\'ldiring. Bu ma\'lumotlar loyiha yuborishda ishlatiladi.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    )
  },
  {
    number: 3,
    title: 'Loyiha yuborish',
    description: 'Sidebar\'dagi "Loyiha yuborish" tugmasini bosing va loyiha haqida batafsil ma\'lumot kiriting. Ixtiyoriy fayl yuklashingiz mumkin.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
    )
  },
  {
    number: 4,
    title: 'Ko\'rib chiqish jarayoni',
    description: 'Yuborilgan loyiha admin va ekspertlar tomonidan ko\'rib chiqiladi. Bu jarayon bir necha kun davom etishi mumkin.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    )
  },
  {
    number: 5,
    title: 'Status va bildirishnomalar',
    description: 'Loyiha holati o\'zgarganda sizga bildirishnoma yuboriladi. Topbar\'dagi qo\'ng\'iroq belgisidan barcha yangilanishlarni ko\'rishingiz mumkin.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    )
  },
  {
    number: 6,
    title: 'Natija',
    description: 'Qabul qilingan loyihalar MVP darajasigacha olib chiqiladi va siz natijalarni kuzatishingiz mumkin.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    )
  }
];

export default function HelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <AuthGuard>
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-main">
          <Topbar />
          <div className="dashboard-content">
            <div className="help-page">
              {/* Hero Section */}
              <div className="help-hero">
                <h1 className="help-title">Yordam markazi</h1>
                <p className="help-subtitle">
                  UniStart Hub platformasidan foydalanish bo'yicha qo'llanma va savollarga javoblar
                </p>
              </div>

              {/* FAQ Section */}
              <div className="help-section">
                <h2 className="help-section-title">Tez-tez so'raladigan savollar</h2>
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

              {/* Guide Section */}
              <div className="help-section">
                <h2 className="help-section-title">Foydalanish bo'yicha qo'llanma</h2>
                <div className="guide-container">
                  {guideSteps.map((step) => (
                    <div key={step.number} className="guide-step">
                      <div className="guide-step-number">
                        <div className="guide-step-icon">{step.icon}</div>
                        <span className="guide-step-badge">{step.number}</span>
                      </div>
                      <div className="guide-step-content">
                        <h3 className="guide-step-title">{step.title}</h3>
                        <p className="guide-step-description">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Section */}
              <div className="help-section">
                <div className="contact-card">
                  <h2 className="contact-title">Biz bilan bog'laning</h2>
                  <p className="contact-description">
                    Agar savollaringiz bo'lsa yoki muammo yuzaga kelsa, quyidagi aloqa kanallari orqali biz bilan bog'lanishingiz mumkin.
                  </p>
                  <div className="contact-info">
                    <div className="contact-item">
                      <div className="contact-item-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </div>
                      <div className="contact-item-content">
                        <div className="contact-item-label">Email</div>
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
                        <div className="contact-item-label">Telegram</div>
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
                        <div className="contact-item-label">Ish vaqti</div>
                        <div className="contact-item-value">Dushanba – Juma, 09:00 – 18:00</div>
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
