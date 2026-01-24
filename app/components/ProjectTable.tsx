"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '../context/ProjectsContext';
import { useAuth } from '../context/AuthContext';
import '../styles/ProjectTable.css';

interface ReviewFormData {
  status: string;
  comment: string;
}

interface ProjectTableProps {
  showAdminControls?: boolean;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ showAdminControls = false }) => {
  const { projects, addProject, searchQuery, isSearching } = useProjects();
  const { user } = useAuth();
  const router = useRouter();
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; projectId: string | null }>({
    isOpen: false,
    projectId: null,
  });
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    status: 'Jarayonda',
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleStatusChange = (projectId: string | number, newStatus: string) => {
    // Simple refresh to show updated data from API
    // In a real app, this would trigger a refetch from the API
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const openReviewModal = (projectId: string) => {
    setReviewModal({ isOpen: true, projectId });
    setReviewForm({ status: 'Jarayonda', comment: '' });
  };

  const closeReviewModal = () => {
    setReviewModal({ isOpen: false, projectId: null });
    setReviewForm({ status: 'Jarayonda', comment: '' });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewModal.projectId) return;

    setSubmittingReview(true);
    try {
      const response = await fetch(`/api/projects/${reviewModal.projectId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        body: JSON.stringify(reviewForm),
      });

      if (response.ok) {
        closeReviewModal();
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error?.message || 'Ko\'rib chiqishda xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Ko\'rib chiqishda xatolik yuz berdi');
    } finally {
      setSubmittingReview(false);
    }
  };

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


  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Loyihalar ro'yxati</h3>
        {showAdminControls && user?.role === 'admin' && (
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
            Admin: Statusni o'zgartirish va izoh qoldirish uchun loyihani bosing
          </p>
        )}
      </div>

      <div className="projects-list">
        {projects.map((project) => (
            <div key={project.id} className="project-item">
              <div
                className="project-row"
                onClick={() => router.push(`/projects/${project.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="project-info">
                  <div className="project-name">{project.name}</div>
                  <div className="project-meta">
                    <span className="project-user">{project.user}</span>
                    <span className="project-date">{project.date}</span>
                  </div>
                </div>
                <div className="project-status">
                  <span className={`status-badge ${getStatusClass(project.status)}`}>
                    {project.status}
                  </span>
                  <div className="project-actions">
                    {showAdminControls && user && (user.role === 'admin' || user.role === 'expert') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openReviewModal(String(project.id));
                        }}
                        className="review-button"
                      >
                        Ko'rib chiqish
                      </button>
                    )}
                  </div>
                </div>
              </div>
          </div>
        ))}

        {projects.length === 0 && !isSearching && (
          <div className="no-projects">
            <p>{searchQuery ? 'Mos loyiha topilmadi' : "Hali loyihalar yo'q"}</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Loyihani ko'rib chiqish</h3>
              <button onClick={closeReviewModal} className="modal-close">×</button>
            </div>

            <form onSubmit={handleReviewSubmit} className="review-form">
              <div className="form-group">
                <label htmlFor="review-status" className="form-label">
                  Status *
                </label>
                <select
                  id="review-status"
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value }))}
                  className="form-select"
                  required
                >
                  <option value="Jarayonda">Jarayonda</option>
                  <option value="Qabul qilindi">Qabul qilindi</option>
                  <option value="Rad etildi">Rad etildi</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="review-comment" className="form-label">
                  Izoh *
                </label>
                <textarea
                  id="review-comment"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="form-textarea"
                  placeholder="Loyiha haqida fikringizni yozing..."
                  rows={4}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeReviewModal} className="cancel-button">
                  Bekor qilish
                </button>
                <button type="submit" disabled={submittingReview} className="submit-button">
                  {submittingReview ? 'Yuborilmoqda...' : 'Yuborish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTable;