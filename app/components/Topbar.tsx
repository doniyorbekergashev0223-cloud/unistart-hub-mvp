"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTranslation, useLocale, type Locale } from '../context/LocaleContext';
import '../styles/Topbar.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface UserWithAvatar {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'uz', label: 'UZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];

/** Maps backend notification title to translation key (notifications.*). */
const NOTIFICATION_TITLE_TO_KEY: Record<string, string> = {
  'Yangi loyiha': 'newProject',
  'Loyiha qabul qilindi': 'projectAccepted',
  'Loyiha rad etildi': 'projectRejected',
  "Loyihangiz ko'rib chiqildi": 'projectReviewed',
};

const Topbar = () => {
  const { user, organization, logout, isAuthenticated } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return t('roles.admin');
    if (role === 'expert') return t('roles.expert');
    return t('roles.user');
  };

  const loadNotifications = async () => {
    if (!user) return;

    setLoadingNotifications(true);
    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          setNotifications(result.data.notifications || []);
          setUnreadCount(result.data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setShowNotifications(false);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 15000);
      const handleRefetch = () => loadNotifications();
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') loadNotifications();
      };
      window.addEventListener('notifications-refetch', handleRefetch);
      document.addEventListener('visibilitychange', handleVisibility);
      return () => {
        clearInterval(interval);
        window.removeEventListener('notifications-refetch', handleRefetch);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }
  }, [isAuthenticated, user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-container') && !target.closest('.profile-container')) {
        setShowNotifications(false);
        setShowDropdown(false);
      }
    };

    if (showNotifications || showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications, showDropdown]);

  if (!isAuthenticated) {
    return null;
  }

  const handleProfileClick = () => {
    router.push('/settings/profile');
    setShowDropdown(false);
  };

  const handleSettingsClick = () => {
    router.push('/settings/profile');
    setShowDropdown(false);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const dropdownItems = [
    { label: user?.name || t('common.user'), type: 'info', initials: user?.name ? getUserInitials(user.name) : 'U' },
    { label: getRoleLabel(user?.role || 'user'), type: 'role' },
    { label: t('topbar.personalInfo'), type: 'link', action: handleProfileClick },
    { label: t('topbar.settings'), type: 'link', action: handleSettingsClick },
    { label: t('topbar.logout'), type: 'action', action: handleLogout }
  ];

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    // Update sidebar class via DOM (clean approach)
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar && overlay) {
      if (newState) {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  };

  // Close sidebar when clicking overlay
  useEffect(() => {
    if (!sidebarOpen) return;
    
    const handleOverlayClick = () => {
      const sidebar = document.querySelector('.sidebar');
      const overlay = document.querySelector('.sidebar-overlay');
      if (sidebar && overlay) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        setSidebarOpen(false);
      }
    };
    
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', handleOverlayClick);
      return () => overlay.removeEventListener('click', handleOverlayClick);
    }
  }, [sidebarOpen]);

  return (
    <>
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}></div>
      <div className="topbar">
        <button className="mobile-menu-button" onClick={toggleSidebar} aria-label={t('topbar.menu')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="topbar-left">
        {organization && (
          <div className="topbar-org" aria-label={organization.name}>
            {organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt=""
                className="topbar-org-logo"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="topbar-org-fallback"
              style={{ display: organization.logoUrl ? 'none' : 'flex' }}
              aria-hidden
            >
              {organization.name.charAt(0).toUpperCase()}
            </div>
            <span className="topbar-org-name">{organization.name}</span>
          </div>
        )}
      </div>

      <div className="topbar-right">
        <div className="locale-switcher" role="group" aria-label="Language">
          {LOCALES.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              className={`locale-btn ${locale === code ? 'active' : ''}`}
              onClick={() => setLocale(code)}
              aria-pressed={locale === code}
              aria-label={label}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="notification-container">
          <button
            className="notification-button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowDropdown(false);
              if (!showNotifications) {
                loadNotifications();
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h4>{t('topbar.notifications')}</h4>
                  {loadingNotifications && <span className="loading-text">{t('common.loading')}</span>}
                </div>
                <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    {t('topbar.notificationsEmpty')}
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const notifKey = NOTIFICATION_TITLE_TO_KEY[notification.title];
                    const titleText = notifKey ? t(`notifications.${notifKey}`) : notification.title;
                    const messageText = notifKey ? t(`notifications.${notifKey}Message`) : notification.message;
                    return (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-content">
                        <div className="notification-title">{titleText}</div>
                        <div className="notification-message">{messageText}</div>
                        <div className="notification-date">
                          {new Date(notification.createdAt).toLocaleDateString(
                            locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US',
                            { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                          )}
                        </div>
                      </div>
                    </div>
                  );
                  })
                )}
                </div>
              </div>
          )}
        </div>

        <div className="profile-container">
          <button
            className="profile-button"
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowNotifications(false);
            }}
            aria-label="Profile menu"
          >
            {(user as UserWithAvatar)?.avatarUrl ? (
              <img
                src={(user as UserWithAvatar).avatarUrl}
                alt={user?.name || 'User'}
                className="profile-avatar"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="profile-avatar" 
              style={{ 
                display: (user as UserWithAvatar)?.avatarUrl ? 'none' : 'flex',
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                maxWidth: '32px',
                maxHeight: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.75rem',
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="profile-info">
              <span className="user-name">{user?.name || t('common.user')}</span>
              <span className="user-role">{getRoleLabel(user?.role || 'user')}</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>

          {showDropdown && (
              <div className="profile-dropdown">
                {dropdownItems.map((item, index) =>
                  item.type === 'action' ? (
                    <button
                      key={index}
                      onClick={item.action}
                      className="dropdown-item logout-button"
                    >
                      {item.label}
                    </button>
                  ) : item.type === 'link' && item.action ? (
                    <button
                      key={index}
                      onClick={item.action}
                      className="dropdown-item link-button"
                    >
                      {item.label}
                    </button>
                  ) : item.type === 'info' ? (
                    <div key={index} className={`dropdown-item ${item.type}`}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: (user as any)?.avatarUrl
                            ? `url(${(user as any).avatarUrl})`
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '1.125rem',
                          flexShrink: 0,
                          border: '3px solid rgba(255, 255, 255, 0.3)',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        }}
                      >
                        {!(user as any)?.avatarUrl && ((item as any).initials || 'U')}
                      </div>
                      <span>{item.label}</span>
                    </div>
                  ) : (
                    <div key={index} className={`dropdown-item ${item.type}`}>
                      {item.label}
                    </div>
                  )
                )}
              </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Topbar;