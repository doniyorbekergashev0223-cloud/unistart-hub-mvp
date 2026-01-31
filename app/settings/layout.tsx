"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const settingsMenu = [
  { label: 'Shaxsiy ma\'lumotlar', href: '/settings/profile' },
  { label: 'Xavfsizlik', href: '/settings/security' },
  { label: 'Bildirishnomalar', href: '/settings/notifications' },
  { label: 'Faollik', href: '/settings/activity' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-main">
          <Topbar />
          <div id="main" className="dashboard-content">
            <div className="settings-layout">
              <h1 className="settings-layout-title">Sozlamalar</h1>
              
              <div className="settings-layout-container">
                <nav className="settings-nav">
                  <ul>
                    {settingsMenu.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={pathname === item.href ? 'active' : ''}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className="settings-content">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
