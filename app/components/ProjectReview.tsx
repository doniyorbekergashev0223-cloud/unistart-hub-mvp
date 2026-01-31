'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

const STATUS_TO_KEY: Record<string, string> = {
  'Qabul qilindi': 'status.accepted',
  'Jarayonda': 'status.pending',
  'Rad etildi': 'status.rejected',
};

interface Project {
  id: string | number;
  name: string;
  user: string;
  date: string;
  status: string;
}

interface Comment {
  id: string;
  content: string;
  authorRole: string;
  createdAt: string;
}

interface ProjectReviewProps {
  project: Project;
  onStatusChange?: (projectId: string, newStatus: string) => void;
}

interface Review {
  id: string;
  reviewerName: string;
  reviewerRole: string;
  status: string;
  comment: string;
  createdAt: string;
}

const ProjectReview: React.FC<ProjectReviewProps> = ({ project, onStatusChange }) => {
  const { user } = useAuth();
  const { t } = useLocale();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  const loadReviews = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/projects/${project.id}/reviews`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setReviews(result.data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  useEffect(() => {
    if (showReviews) {
      loadReviews();
    }
  }, [showReviews, user]);



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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'expert':
        return 'Ekspert';
      default:
        return '';
    }
  };

  return (
    <div className="project-review">
      <div className="project-header">
        <div className="project-info">
          <h3 className="project-title">{project.name}</h3>
          <div className="project-meta">
            <span className="project-user">{project.user}</span>
            <span className="project-date">{project.date}</span>
          </div>
        </div>

      </div>

      <div className="project-actions">
        <button
          onClick={() => setShowReviews(!showReviews)}
          className="comments-toggle"
        >
          Ko'rib chiqish tarixi ({reviews.length}) {showReviews ? '▼' : '▶'}
        </button>
      </div>

      {showReviews && (
        <div className="comments-section">
          <div className="comments-list">
            {reviews.length === 0 ? (
              <p className="no-comments">Hozircha ko'rib chiqilmagan</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{review.reviewerName} ({getRoleLabel(review.reviewerRole)})</span>
                    <span className="comment-date">
                      {new Date(review.createdAt).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>
                  <div className="review-status">
                    <span className={`status-badge ${getStatusClass(review.status)}`}>
                      {t(STATUS_TO_KEY[review.status] ?? 'status.pending')}
                    </span>
                  </div>
                  <p className="comment-content">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectReview;