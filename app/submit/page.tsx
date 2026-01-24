import React from 'react';
import ProjectForm from '../components/ProjectForm';
import AuthGuard from '../components/AuthGuard';

export default function SubmitPage() {
  return (
    <AuthGuard>
      <div className="submit-page">
        <div className="submit-container">
          <div className="submit-header">
            <h1>Loyiha yuborish</h1>
            <p>Startap g'oyangizni yuboring va uni hayotga tatbiq etishda yordam oling</p>
          </div>
          <ProjectForm />
        </div>
      </div>
    </AuthGuard>
  );
}