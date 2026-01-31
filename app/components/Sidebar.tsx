"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LocaleContext';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const { user, isAuthenticated } = useAuth();
  const t = useTranslation();
  const pathname = usePathname();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar && overlay) {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }, [pathname]);

  const items = [
    { label: t('nav.dashboard'), href: '/dashboard' },
    { label: t('nav.about'), href: '/about' },
    { label: t('nav.projects'), href: '/projects' },
    { label: t('nav.developers'), href: '/developers' },
    { label: t('nav.help'), href: '/help' },
  ];

  // Role-based visibility is kept (currently all provided items are visible for all roles).
  // If admin-only items are added later, they should be filtered here.
  const visibleItems = items.filter(() => {
    void user;
    return true;
  });

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Link href="/dashboard" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
          UniStart <span className="logo-orange">Hub</span>
        </Link>
      </div>

      <div className="sidebar-content">
        <Link href="/submit" className="primary-button-link">
          <span className="primary-button">{t('nav.submitProject')}</span>
        </Link>

        <nav className="sidebar-nav">
          <ul>
            {visibleItems.map((item) => (
              <li key={item.href} className={isActive(item.href) ? 'active' : ''}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;