"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useProjects } from '../context/ProjectsContext';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import '../styles/ProjectTable.css';

interface ReviewFormData {
  status: string;
  comment: string;
}

interface ProjectTableProps {
  showAdminControls?: boolean;
  /** Section title (e.g. "Mening loyihalarim", "Loyihalarni ko'rib chiqish"). Default: "Loyihalar ro'yxati" */
  sectionTitle?: string;
}

type StatusFilterValue = 'Barchasi' | 'Jarayonda' | 'Qabul qilindi' | 'Rad etildi';

interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  contact: string;
  status: string;
  createdAt: string;
  fileUrl?: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

const LOCALE_MAP = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' } as const;
const STATUS_TO_KEY: Record<string, string> = {
  'Qabul qilindi': 'status.accepted',
  Jarayonda: 'status.pending',
  'Rad etildi': 'status.rejected',
};

const ProjectTable: React.FC<ProjectTableProps> = ({ showAdminControls = false, sectionTitle }) => {
  const { projects, addProject, searchQuery, isSearching, isLoading } = useProjects();
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const sectionTitleResolved = sectionTitle ?? t('nav.projectsList');
  const dateLocale = LOCALE_MAP[locale] ?? 'uz-UZ';
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('Jarayonda');
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; projectId: string | null }>({
    isOpen: false,
    projectId: null,
  });
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    status: 'Jarayonda',
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [mounted, setMounted] = useState(false);

  const filteredProjects =
    showAdminControls && user?.role === 'expert'
      ? statusFilter === 'Barchasi'
        ? projects
        : projects.filter((p) => p.status === statusFilter)
      : projects;

  useEffect(() => {
    setMounted(true);
  }, []);

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
    setSubmitSuccess(false);
    setLoadingProject(true);
    
    // Fetch project details for desktop layout
    if (user) {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          credentials: 'include',
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
    setSubmitSuccess(false);
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

    if (!window.confirm(t('projectTable.confirmReview'))) return;

    setSubmittingReview(true);
    setSubmitSuccess(false);
    try {
      const response = await fetch(`/api/projects/${reviewModal.projectId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(reviewForm),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        window.dispatchEvent(new CustomEvent('notifications-refetch'));
        window.dispatchEvent(new CustomEvent('stats-refetch'));
        setTimeout(() => {
          closeReviewModal();
          window.location.reload();
        }, 1500);
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


  const mobileReviewModal = reviewModal.isOpen ? (
    <div className="admin-review-mobile">
      <div className="modal-overlay" onClick={closeReviewModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{t('projectTable.reviewTitle')}</h3>
            <button onClick={closeReviewModal} className="modal-close" aria-label={t('projectTable.close')}>
              ×
            </button>
          </div>

          <div className="modal-body">
            {submitSuccess ? (
              <div className="admin-review-success" role="status" aria-live="polite">
                <p>{t('projectTable.reviewSuccess')}</p>
              </div>
            ) : (
            <form id="review-form-mobile" onSubmit={handleReviewSubmit} className="review-form">
              <div className="form-group">
                <label htmlFor="review-status-mobile" className="form-label">
                  {t('projectTable.status')} *
                </label>
                <select
                  id="review-status-mobile"
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value }))}
                  className="form-select"
                  required
                >
                  <option value="Jarayonda">{t('status.pending')}</option>
                  <option value="Qabul qilindi">{t('status.accepted')}</option>
                  <option value="Rad etildi">{t('status.rejected')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="review-comment-mobile" className="form-label">
                  {t('projectTable.comment')} *
                </label>
                <textarea
                  id="review-comment-mobile"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="form-textarea"
                  placeholder={t('projectTable.commentPlaceholder')}
                  rows={4}
                  required
                />
              </div>
            </form>
            )}
          </div>

          {!submitSuccess && (
          <div className="modal-footer">
            <button type="button" onClick={closeReviewModal} className="cancel-button">
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              form="review-form-mobile"
              disabled={submittingReview} 
              className="submit-button"
            >
              {submittingReview ? t('projectTable.saving') : t('projectTable.save')}
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="table-container">
      {/* Projects List - Hidden on desktop when review is open */}
      <div className={`projects-list-container ${reviewModal.isOpen ? 'desktop-hidden' : ''}`}>
        <div className="table-header">
          <h3>{sectionTitleResolved}</h3>
          {showAdminControls && (user?.role === 'admin' || user?.role === 'expert') && (
            <p className="expert-review-hint">
              {t('projectTable.expertHint')}
            </p>
          )}
        </div>

        {showAdminControls && user?.role === 'expert' && (
          <div className="expert-status-filter" role="tablist" aria-label={t('projectTable.filterByStatus')}>
            {[
              { value: 'Jarayonda' as const, labelKey: 'status.pending' },
              { value: 'Qabul qilindi' as const, labelKey: 'status.accepted' },
              { value: 'Rad etildi' as const, labelKey: 'status.rejected' },
              { value: 'Barchasi' as const, labelKey: 'status.all' },
            ].map(({ value, labelKey }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={statusFilter === value}
                className={`expert-filter-tab ${statusFilter === value ? 'expert-filter-tab-active' : ''}`}
                onClick={() => setStatusFilter(value)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        )}

        <div className="projects-list">
        {isLoading ? (
          <div className="no-projects" style={{ padding: '2rem', textAlign: 'center' }}>
            <p>{t('projectTable.loading')}</p>
          </div>
        ) : (
        <>
        {filteredProjects.map((project) => (
            <div key={project.id} className="project-item">
              <div
                className="project-row"
                onClick={() => router.push(`/projects/${project.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="project-info">
                  <div className="project-name">{project.name}</div>
                  <div className="project-meta">
                    {showAdminControls && <span className="project-user">{project.user}</span>}
                    <span className="project-date">{project.date}</span>
                  </div>
                </div>
                <div className="project-status">
                  <span className={`status-badge ${getStatusClass(project.status)}`}>
                    {t(STATUS_TO_KEY[project.status] ?? 'status.pending')}
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
                        {t('projectTable.review')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
          </div>
        ))}

        {filteredProjects.length === 0 && !isSearching && (
          <div className="no-projects">
            <p>
              {searchQuery
                ? t('projectTable.noMatch')
                : showAdminControls && user?.role === 'expert'
                  ? statusFilter === 'Barchasi'
                    ? t('projectTable.noProjectsYet')
                    : t('projectTable.noProjectsInStatus')
                  : t('projectTable.noProjectsHint')}
            </p>
          </div>
        )}
        </>
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
                ← {t('projectTable.backToList')}
              </button>
            </div>
            <div className="admin-review-desktop-content">
              <div className="admin-review-left">
                {loadingProject ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>{t('projectTable.loading')}</div>
                ) : selectedProject ? (
                  <div className="admin-review-project-info">
                    <div className="admin-review-project-header">
                      <h3>{selectedProject.title}</h3>
                    </div>
                    <div className="admin-review-project-details">
                      <div className="admin-review-detail-row">
                        <span className="admin-review-label">{t('projectTable.statusLabel')}:</span>
                        <span className={`status-badge ${getStatusClass(selectedProject.status)}`}>
                          {STATUS_TO_KEY[selectedProject.status] ? t(STATUS_TO_KEY[selectedProject.status]) : selectedProject.status}
                        </span>
                      </div>
                      <div className="admin-review-detail-row">
                        <span className="admin-review-label">{t('projectTable.description')}:</span>
                        <span className="admin-review-value">{selectedProject.description}</span>
                      </div>
                      <div className="admin-review-detail-row">
                        <span className="admin-review-label">{t('projectTable.contact')}:</span>
                        <span className="admin-review-value">{selectedProject.contact}</span>
                      </div>
                      <div className="admin-review-detail-row">
                        <span className="admin-review-label">{t('projectTable.authorLabel')}:</span>
                        <span className="admin-review-value">
                          {selectedProject.owner.name} ({selectedProject.owner.email})
                        </span>
                      </div>
                      <div className="admin-review-detail-row">
                        <span className="admin-review-label">{t('projectTable.createdAt')}:</span>
                        <span className="admin-review-value">
                          {new Date(selectedProject.createdAt).toLocaleDateString(dateLocale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {selectedProject.fileUrl && (
                        <div className="admin-review-detail-row">
                          <span className="admin-review-label">{t('projectTable.attachment')}:</span>
                          <span className="admin-review-value">
                            <a
                              href={selectedProject.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-review-attachment-link"
                            >
                              {t('projectTable.downloadFile')}
                            </a>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>{t('projectTable.projectLoadError')}</div>
                )}
              </div>
              <div className="admin-review-right">
                <div className="admin-review-form-card">
                  <div className="admin-review-form-header">
                    <h3>{t('projectTable.reviewTitle')}</h3>
                  </div>
                  {submitSuccess ? (
                    <div className="admin-review-success" role="status" aria-live="polite">
                      <p>{t('projectTable.reviewSuccess')}</p>
                    </div>
                  ) : (
                  <div className="admin-review-form-body">
                    <form id="review-form" onSubmit={handleReviewSubmit} className="review-form">
                      <div className="form-group">
                        <label htmlFor="review-status" className="form-label">
                          {t('projectTable.status')} *
                        </label>
                        <select
                          id="review-status"
                          value={reviewForm.status}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value }))}
                          className="form-select"
                          required
                        >
                          <option value="Jarayonda">{t('status.pending')}</option>
                          <option value="Qabul qilindi">{t('status.accepted')}</option>
                          <option value="Rad etildi">{t('status.rejected')}</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="review-comment" className="form-label">
                          {t('projectTable.comment')} *
                        </label>
                        <textarea
                          id="review-comment"
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                          className="form-textarea"
                          placeholder={t('projectTable.commentPlaceholder')}
                          rows={6}
                          required
                        />
                      </div>
                    </form>
                  </div>
                  )}
                  {!submitSuccess && (
                  <div className="admin-review-form-footer">
                    <button type="button" onClick={closeReviewModal} className="cancel-button">
                      {t('common.cancel')}
                    </button>
                    <button 
                      type="submit" 
                      form="review-form"
                      disabled={submittingReview} 
                      className="submit-button"
                    >
                      {submittingReview ? t('projectTable.saving') : t('projectTable.save')}
                    </button>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
      {/* Mobile modal via portal to keep it above all layout */}
      {mounted && createPortal(mobileReviewModal, document.body)}
    </div>
  );
};

export default ProjectTable;