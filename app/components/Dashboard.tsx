"use client";

import React, { useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import StatisticsCards from './StatisticsCards';
import DashboardCharts from './DashboardCharts';
import OrganizationAnalytics from './OrganizationAnalytics';
import ProjectTable from './ProjectTable';
import AdminProjectsTable from './AdminProjectsTable';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LocaleContext';
import type { UserRole } from '../context/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const t = useTranslation();
  const role: UserRole | undefined = user?.role;

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const sections = content.querySelectorAll('.dashboard-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
      },
      { rootMargin: '0px 0px -24px 0px', threshold: 0.05 }
    );
    sections.forEach((el) => observer.observe(el));
    return () => sections.forEach((el) => observer.unobserve(el));
  }, []);

  const isAdmin = role === 'admin';
  const isExpert = role === 'expert';
  const isUser = role === 'user';

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar />
        <div id="main" className="dashboard-content" ref={contentRef}>
          {/* ——— User: loyihalar statistikasi ——— */}
          {isUser && (
            <div className="dashboard-section">
              <OrganizationAnalytics />
            </div>
          )}

          {/* ——— EXPERT: Boshqaruv paneli (stat cards) + charts + loyihalarni ko'rib chiqish ——— */}
          {isExpert && (
            <>
              <StatisticsCards />
              <div className="dashboard-section">
                <DashboardCharts />
              </div>
              <div className="dashboard-section">
                <ProjectTable showAdminControls={true} sectionTitle={t('dashboard.reviewProjects')} />
              </div>
            </>
          )}

          {/* ——— ADMIN: Org statistics + charts + read-only org projects table ——— */}
          {isAdmin && (
            <>
              <StatisticsCards />
              <div className="dashboard-section">
                <DashboardCharts />
              </div>
              <div className="dashboard-section">
                <AdminProjectsTable />
              </div>
            </>
          )}

          {/* Fallback: role missing (e.g. loading) — org stats above are already shown */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;