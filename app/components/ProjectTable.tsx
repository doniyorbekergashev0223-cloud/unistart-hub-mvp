"use client";

import React, { useState, useEffect } from 'react';
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

interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  contact: string;
  status: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
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
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);

  const handleStatusChange = (projectId: string | number, newStatus: string) => {
    // Simple refresh to show updated data from API
    // In a real app, this would trigger a refetch from the API
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const openReviewModal = async (projectId: string) => {
    setReviewModal({ isOpen: true, projectId });
    setReviewForm({ status: 'Jarayonda', comment: '' });
    setSelectedProject(null);
    setLoadingProject(true);
    
    // Fetch project details for desktop layout
    if (user) {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          headers: {
            'x-user-id': user.id,
            'x-user-role': user.role,
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.ok && result.data?.project) {
            setSelectedProject(result.data.project);
          }
        }
      } catch (error) {
        console.error('Failed to load project details:', error);
      } finally {
        setLoadingProject(false);
      }
    }
    
    // Disable body scroll when modal opens (for mobile)
    if (window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeReviewModal = () => {
    setReviewModal({ isOpen: false, projectId: null });
    setReviewForm({ status: 'Jarayonda', comment: '' });
    setSelectedProject(null);
    // Enable body scroll when modal closes
    document.body.style.overflow = '';
  };

  // Cleanup: restore body scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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
        const errorMessage = errorData.error?.message || 'Ko\'rib chiqishda xatolik yuz berdi';
        
        // Show more specific error messages
        if (errorData.error?.code === 'DATABASE_CONNECTION_LIMIT' || 
            errorData.error?.code === 'DATABASE_AUTHENTICATION_ERROR' ||
            errorData.error?.code === 'DATABASE_TENANT_ERROR') {
          alert(`Xatolik: ${errorMessage}\n\nIltimos, Vercel logs'ni tekshiring va tegishli faylni ko'ring.`);
        } else {
          alert(`Xatolik: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Ko\'rib chiqishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
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
      {/* Projects List - Hidden on desktop when review is open */}
      <div className={`projects-list-container ${reviewModal.isOpen ? 'desktop-hidden' : ''}`}>
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
      </div>

      {/* Review Modal/Page - Desktop: Side-by-side, Mobile: Modal */}
      {reviewModal.isOpen && (
        <div className="admin-review-container">
          {/* Desktop: Side-by-side layout */}
          <div className="admin-review-desktop">
            <div className="admin-review-desktop-header">
              <button onClick={closeReviewModal} className="admin-review-back-button">
                ← Loyihalar ro'yxatiga qaytish
              </button>
            </div>
            <div className="admin-review-desktop-content">
              <div className="admin-review-left">
                {loadingProject ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>Yuklanmoqda...</div>
                ) : selectedProject ? (
                  <div className="admin-review-project-info">
                    <div className="admin-review-project-header">
                      <h3>{selectedProject.title}</h3>
                    </div>
                    <div className="admin-review-project-details">
                      <div className="admin-review-detail-row">
                        <span className="admin-review-label">Holat:</span>
                        <span className={`status-badge ${getStatusClass(selectedProject.status)}`}>
                          {selectedProject.status}
                        </span>
                      </div>
                      <div className="admin-review-detail-row">
                        <span className="admin-review-label">Tavsif:</span>
                        <span className="admin-review-value">{selectedProject.description}</span>
                      </div>
                      <div className="admin-review-detail-row">
                        <span className="admin-review-label">Aloqa:</span>
                        <span className="admin-review-value">{selectedProject.contact}</span>
                      </div>
                      <div className="admin-review-detail-row">
                        <span className="admin-review-label">Muallif:</span>
                        <span className="admin-review-value">
                          {selectedProject.owner.name} ({selectedProject.owner.email})
                        </span>
                      </div>
                      <div className="admin-review-detail-row">
                        <span className="admin-review-label">Yaratilgan sana:</span>
                        <span className="admin-review-value">
                          {new Date(selectedProject.createdAt).toLocaleDateString('uz-UZ', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>Loyiha ma'lumotlari yuklanmadi</div>
                )}
              </div>
              <div className="admin-review-right">
                <div className="admin-review-form-card">
                  <div className="admin-review-form-header">
                    <h3>Loyihani ko'rib chiqish</h3>
                  </div>
                  <div className="admin-review-form-body">
                    <form id="review-form" onSubmit={handleReviewSubmit} className="review-form">
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
                          rows={6}
                          required
                        />
                      </div>
                    </form>
                  </div>
                  <div className="admin-review-form-footer">
                    <button type="button" onClick={closeReviewModal} className="cancel-button">
                      Bekor qilish
                    </button>
                    <button 
                      type="submit" 
                      form="review-form"
                      disabled={submittingReview} 
                      className="submit-button"
                    >
                      {submittingReview ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Modal overlay */}
          <div className="admin-review-mobile">
            <div className="modal-overlay" onClick={closeReviewModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Loyihani ko'rib chiqish</h3>
                  <button onClick={closeReviewModal} className="modal-close" aria-label="Yopish">
                    ×
                  </button>
                </div>

                <div className="modal-body">
                  <form id="review-form-mobile" onSubmit={handleReviewSubmit} className="review-form">
                    <div className="form-group">
                      <label htmlFor="review-status-mobile" className="form-label">
                        Status *
                      </label>
                      <select
                        id="review-status-mobile"
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
                      <label htmlFor="review-comment-mobile" className="form-label">
                        Izoh *
                      </label>
                      <textarea
                        id="review-comment-mobile"
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        className="form-textarea"
                        placeholder="Loyiha haqida fikringizni yozing..."
                        rows={4}
                        required
                      />
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={closeReviewModal} className="cancel-button">
                    Bekor qilish
                  </button>
                  <button 
                    type="submit" 
                    form="review-form-mobile"
                    disabled={submittingReview} 
                    className="submit-button"
                  >
                    {submittingReview ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTable;