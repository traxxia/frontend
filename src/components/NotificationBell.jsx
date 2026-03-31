import React, { useState, useEffect } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${REACT_APP_BACKEND_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        const token = sessionStorage.getItem('token');
        await fetch(`${REACT_APP_BACKEND_URL}/api/notifications/${notif._id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      if (notif.action_data && notif.action_data.project_id) {
        navigate(`/projects/${notif.action_data.project_id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error marking as read', err);
    }
  };

  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation();
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${REACT_APP_BACKEND_URL}/api/notifications/${notifId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const notif = notifications.find(n => n._id === notifId);
        setNotifications(prev => prev.filter(n => n._id !== notifId));
        if (notif && !notif.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  };

  const handleMarkAllRead = async (e) => {
    if (e) e.stopPropagation();
    try {
      const token = sessionStorage.getItem('token');
      await fetch(`${REACT_APP_BACKEND_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read', err);
    }
  };

  return (
    <Dropdown className="me-3">
      <Dropdown.Toggle variant="link" id="dropdown-notifications" className="notification-menu p-0 border-0 shadow-none d-flex align-items-center" style={{ pointerEvents: 'auto' }}>
        <div className="position-relative d-inline-block">
          <Bell size={20} className="navbar_icon text-dark" />
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.55rem', padding: '0.25em 0.4em' }}>
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
                className={`d-flex flex-column align-items-start py-2 px-3 border-bottom text-wrap ${!notif.is_read ? 'bg-light' : ''}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="d-flex justify-content-between align-items-start w-100 mb-1">
                  <strong style={{ fontSize: '0.85rem', paddingRight: '20px' }}>{notif.title}</strong>
                  <div className="d-flex align-items-center">
                    {!notif.is_read && <span className="badge bg-primary rounded-circle me-2" style={{ width: '8px', height: '8px', padding: 0 }}></span>}
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
                <small className="text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.2', whiteSpace: 'normal', paddingRight: '15px' }}>{notif.message}</small>
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
