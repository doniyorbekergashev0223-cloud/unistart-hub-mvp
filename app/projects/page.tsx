"use client";

import React from 'react';
import AuthGuard from '../components/AuthGuard';
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import ProjectTable from '../components/ProjectTable';
import { useTranslation } from '../context/LocaleContext';

export default function ProjectsPage() {
  const t = useTranslation();
  return (
    <AuthGuard>
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-main">
          <Topbar />
          <div id="main" className="dashboard-content">
            <h2 className="stats-title">{t('projectsPage.title')}</h2>
            <div style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              {t('projectsPage.description')}
            </div>
            <ProjectTable showAdminControls />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
