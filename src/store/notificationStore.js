// src/store/notificationStore.js
import { create } from 'zustand';
import { useAuthStore } from './authStore';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    const { isLoading } = get();
    if (isLoading) return;

    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({
          notifications: data.notifications || [],
          unreadCount: data.unread_count || 0,
          isLoading: false,
          error: null
        });
      } else {
        set({ isLoading: false, error: 'Failed to fetch notifications' });
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      set({ isLoading: false, error: err.message });
    }
  },

  markAsRead: async (notifId) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      // Optimistic update
      const { notifications, unreadCount } = get();
      const notif = notifications.find(n => n._id === notifId);
      
      if (notif && !notif.is_read) {
        set({
          notifications: notifications.map(n => n._id === notifId ? { ...n, is_read: true } : n),
          unreadCount: Math.max(0, unreadCount - 1)
        });
      }

      await fetch(`${API_BASE_URL}/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error marking as read', err);
    }
  },

  deleteNotification: async (notifId) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const { notifications, unreadCount } = get();
      const notif = notifications.find(n => n._id === notifId);

      const res = await fetch(`${API_BASE_URL}/api/notifications/${notifId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        set({
          notifications: notifications.filter(n => n._id !== notifId),
          unreadCount: (notif && !notif.is_read) ? Math.max(0, unreadCount - 1) : unreadCount
        });
      }
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  },

  markAllAsRead: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      // Optimistic update
      set({
        notifications: get().notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      });

      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error marking all as read', err);
      // Optional: rollback if needed, but usually not necessary for mark all read
    }
  }
}));
