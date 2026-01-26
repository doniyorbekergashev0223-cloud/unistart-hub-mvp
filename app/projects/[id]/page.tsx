'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AuthGuard from '../../components/AuthGuard'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import { useAuth } from '../../context/AuthContext'

interface ProjectDetail {
  id: string
  title: string
  description: string
  contact: string
  status: string
  statusEnum: string
  fileUrl: string | null
  createdAt: string
  owner: {
    id: string
    name: string
    email: string
  }
  reviews: Array<{
    id: string
    reviewerId: string
    reviewerName: string
    reviewerRole: string
    status: string
    statusEnum: string
    comment: string
    createdAt: string
  }>
}

interface ReviewFormData {
  status: string
  comment: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewModal, setReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    status: 'Jarayonda',
    comment: '',
  })
  const [submittingReview, setSubmittingReview] = useState(false)

  const projectId = params.id as string

  useEffect(() => {
    if (!user || !projectId) return

    const loadProject = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          headers: {
            'x-user-id': user.id,
            'x-user-role': user.role,
          },
        })

        if (response.ok) {
          const result = await response.json()
          if (result.ok) {
            setProject(result.data.project)
          } else {
            setError(result.error?.message || 'Loyiha yuklanmadi')
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          setError(errorData.error?.message || 'Loyiha yuklanmadi')
        }
      } catch (err) {
        console.error('Failed to load project:', err)
        setError('Loyiha yuklanmadi')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [user, projectId])

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !projectId) return

    setSubmittingReview(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        body: JSON.stringify(reviewForm),
      })

      if (response.ok) {
        setReviewModal(false)
        setReviewForm({ status: 'Jarayonda', comment: '' })
        // Reload project data
        window.location.reload()
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error?.message || 'Ko\'rib chiqishda xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Review submission error:', error)
      alert('Ko\'rib chiqishda xatolik yuz berdi')
    } finally {
      setSubmittingReview(false)
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Qabul qilindi':
        return 'status-accepted'
      case 'Jarayonda':
        return 'status-progress'
      case 'Rad etildi':
        return 'status-rejected'
      default:
        return ''
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'expert':
        return 'Ekspert'
      default:
        return ''
    }
  }

  const canReview = user && (user.role === 'admin' || user.role === 'expert')
  const canDownloadFile = project && (
    project.owner.id === user?.id ||
    user?.role === 'admin' ||
    user?.role === 'expert'
  )

  const getFileName = (url: string) => {
    try {
      const parts = url.split('/')
      return parts[parts.length - 1] || 'Fayl'
    } catch {
      return 'Fayl'
    }
  }

  return (
    <AuthGuard>
      <div className="dashboard">
        <Sidebar />
        <div className="dashboard-main">
          <Topbar />
          <div className="dashboard-content">
            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Yuklanmoqda...</p>
              </div>
            )}

            {error && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
                <p>{error}</p>
                <button
                  onClick={() => router.push('/projects')}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    background: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Loyihalar ro'yxatiga qaytish
                </button>
              </div>
            )}

            {project && !loading && !error && (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <button
                    onClick={() => router.push('/projects')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      marginBottom: '1rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    ← Loyihalar ro'yxatiga qaytish
                  </button>
                  <h2 className="stats-title">{project.title}</h2>
                </div>

                {/* Project Details Section */}
                <div className="project-detail-section">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Loyiha ma'lumotlari
                  </h3>
                  <div className="project-detail-card">
                    <div className="project-detail-row">
                      <span className="project-detail-label">Holat:</span>
                      <span className={`status-badge ${getStatusClass(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="project-detail-row">
                      <span className="project-detail-label">Tavsif:</span>
                      <span className="project-detail-value">{project.description}</span>
                    </div>
                    <div className="project-detail-row">
                      <span className="project-detail-label">Aloqa:</span>
                      <span className="project-detail-value">{project.contact}</span>
                    </div>
                    <div className="project-detail-row">
                      <span className="project-detail-label">Muallif:</span>
                      <span className="project-detail-value">
                        {project.owner.name} ({project.owner.email})
                      </span>
                    </div>
                    <div className="project-detail-row">
                      <span className="project-detail-label">Yaratilgan sana:</span>
                      <span className="project-detail-value">
                        {new Date(project.createdAt).toLocaleDateString('uz-UZ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* File Attachment Section */}
                {project.fileUrl && (
                  <div className="project-detail-section">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                      Fayl
                    </h3>
                    <div className="project-detail-card">
                      <div className="project-detail-row">
                        <span className="project-detail-label">Fayl nomi:</span>
                        <span className="project-detail-value">{getFileName(project.fileUrl)}</span>
                      </div>
                      {canDownloadFile && (
                        <div style={{ marginTop: '1rem' }}>
                          <a
                            href={project.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              padding: '0.75rem 1.5rem',
                              background: '#f97316',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '6px',
                              fontWeight: 500,
                            }}
                          >
                            Yuklab olish
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Review Timeline Section */}
                <div className="project-detail-section">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Ko'rib chiqish tarixi
                  </h3>
                  <div className="timeline-container">
                    {/* Project Created Event */}
                    <div className="timeline-item">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-title">Loyiha yaratildi</span>
                          <span className="timeline-date">
                            {new Date(project.createdAt).toLocaleDateString('uz-UZ', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="timeline-description">
                          {project.owner.name} tomonidan yuborildi
                        </div>
                      </div>
                    </div>

                    {/* Review Events */}
                    {(!project.reviews || project.reviews.length === 0) ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        Hozircha ko'rib chiqilmagan
                      </div>
                    ) : (
                      project.reviews.map((review) => (
                        <div key={review.id} className="timeline-item">
                          <div className="timeline-marker"></div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span className="timeline-title">
                                {getRoleLabel(review.reviewerRole)} tomonidan ko'rib chiqildi
                              </span>
                              <span className="timeline-date">
                                {new Date(review.createdAt).toLocaleDateString('uz-UZ', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                              <span className={`status-badge ${getStatusClass(review.status)}`}>
                                {review.status}
                              </span>
                            </div>
                            <div className="timeline-description">{review.comment}</div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                              {review.reviewerName}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Review Action Button */}
                {canReview && (
                  <div style={{ marginTop: '2rem' }}>
                    <button
                      onClick={() => setReviewModal(true)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Ko'rib chiqish
                    </button>
                  </div>
                )}

                {/* Review Modal */}
                {reviewModal && (
                  <div className="modal-overlay" onClick={() => setReviewModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header">
                        <h3>Loyihani ko'rib chiqish</h3>
                        <button onClick={() => setReviewModal(false)} className="modal-close">
                          ×
                        </button>
                      </div>

                      <form onSubmit={handleReviewSubmit} className="review-form">
                        <div className="form-group">
                          <label htmlFor="review-status" className="form-label">
                            Status *
                          </label>
                          <select
                            id="review-status"
                            value={reviewForm.status}
                            onChange={(e) =>
                              setReviewForm((prev) => ({ ...prev, status: e.target.value }))
                            }
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
                            onChange={(e) =>
                              setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
                            }
                            className="form-textarea"
                            placeholder="Loyiha haqida fikringizni yozing..."
                            rows={4}
                            required
                          />
                        </div>

                        <div className="modal-actions">
                          <button
                            type="button"
                            onClick={() => setReviewModal(false)}
                            className="cancel-button"
                          >
                            Bekor qilish
                          </button>
                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="submit-button"
                          >
                            {submittingReview ? 'Yuborilmoqda...' : 'Yuborish'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}