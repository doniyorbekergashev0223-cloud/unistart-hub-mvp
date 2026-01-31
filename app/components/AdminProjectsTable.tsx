'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '../context/ProjectsContext';
import { useLocale } from '../context/LocaleContext';
import '../styles/AdminProjectsTable.css';

const STATUS_TO_KEY: Record<string, string> = {
  'Qabul qilindi': 'status.accepted',
  'Jarayonda': 'status.pending',
  'Rad etildi': 'status.rejected',
};

/** Admin-only read-only projects table. 5 columns: name, author, date, status, assigned expert. */
const AdminProjectsTable = () => {
  const { projects, isSearching } = useProjects();
  const { t } = useLocale();
  const router = useRouter();

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Qabul qilindi':
        return 'status-accepted';
      case 'Jarayonda':
        return 'status-progress';
      case 'Rad etildi':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const handleRowClick = (id: string | number) => {
    router.push(`/projects/${id}`);
  };

  return (
    <div className="table-container admin-projects-table-container">
      <div className="table-header">
        <h3>Barcha loyihalar</h3>
        <p className="admin-projects-table-description">
          Tashkilotdagi barcha loyihalar. Batafsil ko&apos;rish uchun qatorni bosing.
        </p>
      </div>

      {projects.length > 0 ? (
        <div className="admin-projects-table-wrapper">
          <table className="admin-projects-table" role="grid">
            <thead className="admin-projects-thead">
              <tr>
                <th scope="col">Loyiha nomi</th>
                <th scope="col">Muallif</th>
                <th scope="col">Sana</th>
                <th scope="col">Holat</th>
                <th scope="col">Tayinlangan ekspert</th>
              </tr>
            </thead>
            <tbody className="admin-projects-tbody">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => handleRowClick(project.id)}
                  className="admin-projects-row"
                >
                  <td data-label="Loyiha nomi" className="admin-projects-cell admin-projects-cell-name">
                    {project.name}
                  </td>
                  <td data-label="Muallif" className="admin-projects-cell">
                    {project.user}
                  </td>
                  <td data-label="Sana" className="admin-projects-cell">
                    {project.date}
                  </td>
                  <td data-label="Holat" className="admin-projects-cell">
                    <span className={`status-badge ${getStatusClass(project.status)}`}>
                      {t(STATUS_TO_KEY[project.status] ?? 'status.pending')}
                    </span>
                  </td>
                  <td data-label="Tayinlangan ekspert" className="admin-projects-cell">
                    —
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : isSearching ? (
        <div className="no-projects admin-projects-empty">
          <p>Yuklanmoqda...</p>
        </div>
      ) : (
        <div className="no-projects admin-projects-empty">
          <p>Tashkilotda hali hech qanday loyiha yuborilmagan.</p>
        </div>
      )}
    </div>
  );
};

export default AdminProjectsTable;
