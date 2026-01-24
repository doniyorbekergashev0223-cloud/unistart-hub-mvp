"use client";

import React from 'react';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'expert':
        return 'Ekspert';
      case 'user':
      default:
        return 'Foydalanuvchi';
    }
  };

  // Mock creation date (since User model doesn't have createdAt in context)
  // In real implementation, this would come from the database
  const accountCreatedDate = new Date().toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AuthGuard>
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-main">
          <Topbar />
          <div className="dashboard-content">
            <div className="profile-page">
              <h1 className="profile-page-title">Shaxsiy ma'lumotlar</h1>
              
              <div className="profile-card">
                <div className="profile-section">
                  <h2 className="profile-section-title">Asosiy ma'lumotlar</h2>
                  
                  <div className="profile-info-grid">
                    <div className="profile-info-item">
                      <label className="profile-info-label">To'liq ism</label>
                      <div className="profile-info-value">{user?.name || 'Noma\'lum'}</div>
                    </div>
                    
                    <div className="profile-info-item">
                      <label className="profile-info-label">Email manzil</label>
                      <div className="profile-info-value">{user?.email || 'Noma\'lum'}</div>
                    </div>
                    
                    <div className="profile-info-item">
                      <label className="profile-info-label">Rol</label>
                      <div className="profile-info-value">
                        <span className="profile-role-badge">{getRoleLabel(user?.role || 'user')}</span>
                      </div>
                    </div>
                    
                    <div className="profile-info-item">
                      <label className="profile-info-label">Hisob yaratilgan sana</label>
                      <div className="profile-info-value">{accountCreatedDate}</div>
                    </div>
                  </div>
                </div>

                <div className="profile-actions">
                  <button className="profile-edit-button" disabled>
                    Tahrirlash
                  </button>
                  <p className="profile-hint">
                    Keyingi bosqichda tahrirlash yoqiladi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
