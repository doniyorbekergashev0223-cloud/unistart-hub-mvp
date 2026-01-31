import React from 'react'
import AuthGuard from '../components/AuthGuard'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import ProjectTable from '../components/ProjectTable'

export default function ProjectsPage() {
  return (
    <AuthGuard>
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-main">
          <Topbar />
          <div id="main" className="dashboard-content">
            <h2 className="stats-title">Loyihalar</h2>
            <div style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Loyihalar ro‘yxati real ma’lumotlar bazasidan olinadi (DB sozlanmagan bo‘lsa, mock ko‘rsatiladi).
            </div>
            <ProjectTable showAdminControls />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

