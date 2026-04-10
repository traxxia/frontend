// src/store/subscriptionStore.js
import { create } from 'zustand';
import { useAuthStore } from './authStore';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const useSubscriptionStore = create((set, get) => ({
  usage: null,
  isLoading: false,
  error: null,

  fetchPlanDetails: async () => {
    const { isLoading } = get();
    if (isLoading) return;

    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/plan-details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        set({
          usage: data.usage || null,
          isLoading: false,
          error: null
        });
      } else {
        set({
          isLoading: false,
          error: 'Failed to fetch plan details'
        });
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
      set({
        isLoading: false,
        error: error.message
      });
    }
  },

  setUsage: (usage) => set({ usage })
}));
