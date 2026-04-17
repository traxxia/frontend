import React, { useEffect } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

import { useAuthStore, useBusinessStore, useNotificationStore } from '../store';

const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    deleteNotification, 
    markAllAsRead 
  } = useNotificationStore();
  
  const { setSelectedBusinessId } = useBusinessStore();
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (notif) => {
    console.log("Notification clicked:", notif);
    
    // 1. Mark as read in the background asynchronously, don't block navigation
    if (!notif.is_read) {
      markAsRead(notif._id);
    }

    try {
      const isStaleProject = notif.type === 'stale_bet' || notif.type === 'stale_project' || notif.type === 'review_reminder' || notif.type === 'review-reminder' || 
                             (notif.title && (notif.title.toLowerCase().includes('stale') || notif.title.toLowerCase().includes('atrasada') || notif.title.toLowerCase().includes('reminder')));

      const isRankingNotif = notif.type === 'admin_ranked_projects' || notif.type === 'collaborator_ranked_projects' || notif.type === 'ranking_status_change' || notif.type === 'project_ranking' || notif.type === 'time_to_rank_projects' ||
                             (notif.title && (notif.title.toLowerCase().includes('rank')));

      console.log("Is stale project?", isStaleProject);

      // Extract explicit business ID if available to set the correct business context
      // Ranking notifications often store business_id in metadata or action_data
      const targetBusinessId = notif.business_id || 
                               notif.action_data?.business_id || 
                               notif.metadata?.business_id || 
                               notif.project?.business_id || 
                               notif.reference_id;
      
      if (targetBusinessId) {
         console.log("Setting active business:", targetBusinessId);
         setSelectedBusinessId(targetBusinessId);
      } else if (isStaleProject && notif.message) {
         // Attempt to extract the business name from the message to aid the user
         const nameMatch = notif.message.match(/under\s+"([^"]+)"/i) || notif.message.match(/project.*under\s+([^ ]+)/i);
         if (nameMatch && nameMatch[1]) {
             const businessName = nameMatch[1].trim();
             console.log("Extracted business name from message:", businessName);
             try {
                // We must map this name to a business ID because the backend payload lacks it
                const token = useAuthStore.getState().token;
                const res = await fetch(`${REACT_APP_BACKEND_URL}/api/businesses`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                   const data = await res.json();
                   const ownedBusinesses = data.businesses || [];
                   const collabBusinesses = data.collaboratingBusinesses || data.collaborating_businesses || [];
                   const allBusinesses = [...ownedBusinesses, ...collabBusinesses];
                   
                   const found = allBusinesses.find(b => b.business_name === businessName);
                   if (found) {
                       const foundId = found._id || found.id;
                       console.log("Matched business name to ID:", foundId);
                       setSelectedBusinessId(foundId);
                    } else {
                       console.log("Could not find a business matching the name:", businessName);
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
               console.log("Setting active business from URL:", bId);
               setSelectedBusinessId(bId);
            }
         } catch (e) {
           console.error("URL parsing error:", e);
         }
      }

      let navPath = notif.action_link || '/dashboard';
      let navOptions = {};

      if (isStaleProject) {
        // Force routing to the business page -> projects tab for stale project alerts
        if (!navPath.includes('/businesspage')) {
           navPath = '/businesspage';
        }
        navOptions = { state: { initialTab: 'projects' } };
      } else if (isRankingNotif) {
        if (!navPath.includes('/businesspage')) {
           navPath = '/businesspage';
        }
        navOptions = { state: { ...navOptions.state, initialTab: 'ranking' } };
      }

      // Add business ID to navigation state to ensure target page handles the context switch
      if (targetBusinessId) {
        navOptions.state = { ...navOptions.state, businessId: targetBusinessId };
      }

      // If action link explicitly requests a tab via query params, use it
      if (navPath.includes('tab=')) {
          try {
             const url = new URL(navPath, window.location.origin);
             const tab = url.searchParams.get('tab');
             if (tab) {
                navOptions = { state: { ...navOptions.state, initialTab: tab } };
                // Sync with global hook state for immediate pickup
                window.__businessPageNavState = navOptions.state;
             }
             navPath = url.pathname;
          } catch(e) {}
      }

      // Ensure state is globally accessible for component initializers
      if (navOptions.state?.initialTab) {
        window.__businessPageNavState = navOptions.state;
      }

      console.log("Navigating to:", navPath, navOptions);
      navigate(navPath, navOptions);
    } catch (routeErr) {
      console.error("Routing error:", routeErr);
      navigate('/dashboard'); // Fallback
    }
  };

  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation();
    deleteNotification(notifId);
  };

  const handleMarkAllRead = async (e) => {
    if (e) e.stopPropagation();
    markAllAsRead();
  };

  return (
    <Dropdown className="me-3">
      <Dropdown.Toggle variant="link" id="dropdown-notifications" className="notification-menu p-0 border-0 shadow-none d-flex align-items-center" style={{ pointerEvents: 'auto' }}>
        <div className={`position-relative notification-bell-container ${unreadCount > 0 ? 'notification-bell-active' : ''}`}>
          <Bell size={22} className="navbar_icon text-dark" />
          {unreadCount > 0 && (
            <span 
              className="position-absolute badge rounded-pill bg-danger border border-white border-2 notification-badge-blink"
              style={{ top: '4px', right: '4px', fontSize: '0.6rem', padding: '0.25em 0.4em' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </Dropdown.Toggle>
      <Dropdown.Menu align="end" className="traxia-dropdown shadow" style={{ width: '320px' }}>
        <Dropdown.Header className="d-flex justify-content-between align-items-center">
          <span className="fw-bold text-dark">{t('notifications') || 'Notifications'}</span>
          {unreadCount > 0 && (
            <span
              className="text-primary small"
              style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              onClick={handleMarkAllRead}
            >
              {t('mark_all_read') || 'Mark all as read'}
            </span>
          )}
        </Dropdown.Header>
        <Dropdown.Divider className="my-1" />
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <Dropdown.Item
                key={notif._id}
                className={`d-flex flex-column align-items-start py-2 px-3 border-bottom text-wrap ${!notif.is_read ? 'bg-white' : 'bg-light'}`}
                style={{ transition: 'all 0.2s ease', opacity: notif.is_read ? 0.85 : 1 }}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="d-flex justify-content-between align-items-start w-100 mb-1">
                  <strong style={{ fontSize: '0.85rem', paddingRight: '20px', fontWeight: !notif.is_read ? '700' : '500', color: !notif.is_read ? '#212529' : '#6c757d' }}>{notif.title}</strong>
                  <div className="d-flex align-items-center">
                    {!notif.is_read && <span className="badge bg-primary rounded-pill me-2 px-2 py-1" style={{ fontSize: '0.65rem' }}>New</span>}
                    <div
                      className="text-muted opacity-50 pe-auto"
                      style={{ padding: '4px', margin: '-4px', cursor: 'pointer' }}
                      onClick={(e) => handleDeleteNotification(e, notif._id)}
                      onMouseOver={(e) => { e.currentTarget.classList.remove('opacity-50'); e.currentTarget.classList.add('text-danger'); }}
                      onMouseOut={(e) => { e.currentTarget.classList.add('opacity-50'); e.currentTarget.classList.remove('text-danger'); }}
                    >
                      <X size={14} />
                    </div>
                  </div>
                </div>
                <small className={!notif.is_read ? "text-dark" : "text-muted"} style={{ fontSize: '0.75rem', lineHeight: '1.2', whiteSpace: 'normal', paddingRight: '15px' }}>{notif.message}</small>
                <small className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>{new Date(notif.created_at).toLocaleDateString()}</small>
              </Dropdown.Item>
            ))
          ) : (
            <div className="p-4 d-flex flex-column align-items-center justify-content-center text-muted">
              <div className="notification-empty-bell mb-2 p-3 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <BellOff size={28} className="text-secondary opacity-75" />
              </div>
            </div>
          )}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell;
