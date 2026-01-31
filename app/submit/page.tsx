"use client";

import React from 'react';
import ProjectForm from '../components/ProjectForm';
import AuthGuard from '../components/AuthGuard';
import { useTranslation } from '../context/LocaleContext';

export default function SubmitPage() {
  const t = useTranslation();
  return (
    <AuthGuard>
      <div className="submit-page">
        <div className="submit-container">
          <div className="submit-header">
            <h1>{t('submitPage.title')}</h1>
            <p>{t('submitPage.subtitle')}</p>
          </div>
          <ProjectForm />
        </div>
      </div>
    </AuthGuard>
  );
}