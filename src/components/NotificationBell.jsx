import React, { useEffect } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore, useBusinessStore, useNotificationStore, useProjectStore, useUIStore } from '../store';
import { useQueryClient } from '@tanstack/react-query';
const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    markAllAsRead
  } = useNotificationStore();
  const {
    setSelectedBusinessId
  } = useBusinessStore();
  const { theme } = useUIStore();
  const isDark = theme === 'dark';
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    t
  } = useTranslation();
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  const handleNotificationClick = async notif => {
    if (!notif.is_read) {
      markAsRead(notif._id);
    }
    try {
      const isStaleProject = notif.type === 'stale_bet' || notif.type === 'stale_project' || notif.type === 'review_reminder' || notif.type === 'review-reminder' || notif.title && (notif.title.toLowerCase().includes('stale') || notif.title.toLowerCase().includes('atrasada') || notif.title.toLowerCase().includes('reminder'));
      const isRankingNotif = notif.type === 'admin_ranked_projects' || notif.type === 'collaborator_ranked_projects' || notif.type === 'ranking_status_change' || notif.type === 'project_ranking' || notif.type === 'time_to_rank_projects' || notif.type?.includes('rank') || notif.title && (notif.title.toLowerCase().includes('rank') || notif.title.toLowerCase().includes('clasific'));
      let targetBusinessId = null;
      if (notif.action_link) {
        try {
          const url = new URL(notif.action_link, window.location.origin);
          targetBusinessId = url.searchParams.get('business_id') || url.searchParams.get('businessId');
        } catch (e) {}
      }
      if (!targetBusinessId) {
        targetBusinessId = notif.business_id || notif.action_data?.business_id || notif.metadata?.business_id || notif.project?.business_id || !notif.type?.includes('project') && notif.reference_id;
      }
      const hasTargetBusinessId = !!targetBusinessId;
      if (hasTargetBusinessId) {} else if (isStaleProject && notif.message) {
        const nameMatch = notif.message.match(/under\s+"([^"]+)"/i) || notif.message.match(/project.*under\s+([^ ]+)/i);
        if (nameMatch && nameMatch[1]) {
          const businessName = nameMatch[1].trim();
          try {
            const token = useAuthStore.getState().token;
            const res = await fetch(`${VITE_BACKEND_URL}/api/businesses`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (res.ok) {
              const data = await res.json();
              const ownedBusinesses = data.businesses || [];
              const collabBusinesses = data.collaboratingBusinesses || data.collaborating_businesses || [];
              const allBusinesses = [...ownedBusinesses, ...collabBusinesses];
              const found = allBusinesses.find(b => b.business_name === businessName);
              if (found) {
                const foundId = found._id || found.id;
                targetBusinessId = foundId;
              }  
            }
          } catch (e) {
            console.error("Failed to resolve business name to ID", e);
          }
        }
      }
      if (notif.action_link) {
        try {
          const url = new URL(notif.action_link, window.location.origin);
          const bId = url.searchParams.get('business_id') || url.searchParams.get('businessId');
          if (bId) {
            targetBusinessId = bId;
          }
        } catch (e) {
          console.error("URL parsing error:", e);
        }
      }
      let navPath = notif.action_link || '/dashboard';
      let navOptions = {};
      if (isStaleProject) {
        if (!navPath.includes('/businesspage')) {
          navPath = '/businesspage';
        }
        navOptions = {
          state: {
            initialTab: 'bets'
          }
        };
      } else if (isRankingNotif) {
        if (!navPath.includes('/businesspage')) {
          navPath = '/businesspage';
        }
        navOptions = {
          state: {
            ...navOptions.state,
            initialTab: 'ranking'
          }
        };
      }
      if (targetBusinessId) {
        navOptions.state = {
          ...navOptions.state,
          businessId: targetBusinessId
        };
      }
      try {
        const urlObj = new URL(navPath, window.location.origin);
        let tab = urlObj.searchParams.get('tab');
        if (isStaleProject) {
          tab = 'bets';
        } else if (isRankingNotif) {
          tab = 'ranking';
        }
        if (tab) {
          urlObj.searchParams.set('tab', tab);
          navOptions = {
            state: {
              ...navOptions.state,
              initialTab: tab
            }
          };
          window.__businessPageNavState = navOptions.state;
        }
        if (targetBusinessId && !urlObj.searchParams.has('business_id') && !urlObj.searchParams.has('businessId')) {
          urlObj.searchParams.set('business_id', targetBusinessId);
        }
        navPath = urlObj.pathname + urlObj.search;
      } catch (e) {
        console.error("Path construction error:", e);
      }
      if (navOptions.state?.initialTab) {
        window.__businessPageNavState = navOptions.state;
      }
      if (targetBusinessId) {
        useProjectStore.getState().clearCache(targetBusinessId);
        queryClient.invalidateQueries({
          queryKey: ["projects", targetBusinessId]
        });
        queryClient.invalidateQueries({
          queryKey: ["teamRankings", targetBusinessId]
        });
        queryClient.invalidateQueries({
          queryKey: ["rankingsSummary", targetBusinessId]
        });
      }
      navigate(navPath, navOptions);
    } catch (routeErr) {
      console.error("Routing error:", routeErr);
      navigate('/dashboard');
    }
  };
  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation();
    deleteNotification(notifId);
  };
  const handleMarkAllRead = async e => {
    if (e) e.stopPropagation();
    markAllAsRead();
  };
  return <Dropdown className="me-3">
      <Dropdown.Toggle variant="link" id="dropdown-notifications" className="notification-menu p-0 border-0 shadow-none d-flex align-items-center notification-bell--s1">
        <div className={`position-relative notification-bell-container ${unreadCount > 0 ? 'notification-bell-active' : ''}`}>
          <Bell size={22} className={`navbar_icon ${isDark ? 'text-light' : 'text-dark'}`} />
          {unreadCount > 0 && <span className="position-absolute badge rounded-pill bg-danger border border-white border-2 notification-badge-blink notification-bell--s2">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>}
        </div>
      </Dropdown.Toggle>
      <Dropdown.Menu align="end" className="traxia-dropdown shadow notification-bell--s3">
        <Dropdown.Header className="d-flex justify-content-between align-items-center">
          <span className={`fw-bold notif-dropdown-title ${isDark ? 'text-white' : 'text-dark'}`}>{t('notifications') || 'Notifications'}</span>
          {unreadCount > 0 && <span className="text-primary small notification-bell--s4" onClick={handleMarkAllRead}>
              {t('mark_all_read') || 'Mark all as read'}
            </span>}
        </Dropdown.Header>
        <Dropdown.Divider className="my-1" />
        <div className="notification-bell--s5">
          {notifications.length > 0 ? notifications.map(notif => <Dropdown.Item key={notif._id} className={`d-flex flex-column align-items-start py-2 px-3 border-bottom text-wrap notification-item ${!notif.is_read ? 'unread' : 'read'} notification-bell--s6`} style={{
          opacity: notif.is_read ? 0.85 : 1
        }} onClick={() => handleNotificationClick(notif)}>
                <div className="d-flex justify-content-between align-items-start w-100 mb-1">
                  <strong className="notification-title notification-bell--s7">{notif.title}</strong>
                  <div className="d-flex align-items-center">
                    {!notif.is_read && <span className="badge bg-primary rounded-pill me-2 px-2 py-1 notification-bell--s8">New</span>}
                    <div className="text-muted opacity-50 pe-auto notification-bell--s9" onClick={e => handleDeleteNotification(e, notif._id)} onMouseOver={e => {
                e.currentTarget.classList.remove('opacity-50');
                e.currentTarget.classList.add('text-danger');
              }} onMouseOut={e => {
                e.currentTarget.classList.add('opacity-50');
                e.currentTarget.classList.remove('text-danger');
              }}>
                      <X size={14} />
                    </div>
                  </div>
                </div>
                <small className="notification-msg notification-bell--s10">{notif.message}</small>
                <small className="text-muted mt-1 notification-bell--s8">{new Date(notif.created_at).toLocaleDateString()}</small>
              </Dropdown.Item>) : <div className="p-4 d-flex flex-column align-items-center justify-content-center text-muted">
              <div className="notification-empty-bell mb-2 p-3 rounded-circle d-flex align-items-center justify-content-center notification-bell--s11">
                <BellOff size={28} className="notification-empty-icon" />
              </div>
            </div>}
        </div>
      </Dropdown.Menu>
    </Dropdown>;
};
export default NotificationBell;
