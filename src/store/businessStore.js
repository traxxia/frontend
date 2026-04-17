// src/store/businessStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import { useAuthStore } from './authStore';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const useBusinessStore = create(
  persist(
    (set, get) => ({
      businesses: [],
      collaboratingBusinesses: [],
      deletedBusinesses: [],
      selectedBusiness: null,
      selectedBusinessId: null,
      isLoading: false,
      isCreating: false,
      isDeleting: false,
      error: null,
      createError: null,
      deleteError: null,

      fetchBusinesses: async () => {
        if (get().isLoading) return;
        const token = useAuthStore.getState().token;
        if (!token) { set({ error: 'No authentication token', isLoading: false }); return; }
        set({ isLoading: true, error: null });
        try {
          const response = await axios.get(API_BASE_URL + '/api/businesses', {
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
          });
          set({
            businesses: response.data.businesses || [],
            collaboratingBusinesses: response.data.collaboratingBusinesses || response.data.collaborating_businesses || [],
            deletedBusinesses: response.data.deleted_businesses || [],
            isLoading: false, error: null,
          });
        } catch (err) {
          set({ error: err.response?.data?.error || err.message, isLoading: false });
        }
      },

      fetchBusiness: async (businessId) => {
        const token = useAuthStore.getState().token;
        if (!token) { set({ error: 'No authentication token' }); return; }
        set({ isLoading: true, error: null });
        try {
          const response = await axios.get(API_BASE_URL + '/api/businesses/' + businessId, {
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
          });
          const business = response.data.business || response.data;
          set({
            selectedBusiness: business,
            selectedBusinessId: businessId,
            isLoading: false
          });
          return business;
        } catch (err) {
          set({ error: err.response?.data?.error || err.message, isLoading: false });
          throw err;
        }
      },

      createBusiness: async (businessData) => {
        const token = useAuthStore.getState().token;
        if (!token) { set({ createError: 'No authentication token', isCreating: false }); return; }
        set({ isCreating: true, createError: null });
        try {
          const response = await axios.post(API_BASE_URL + '/api/businesses', businessData, {
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
          });
          set((state) => ({
            businesses: [...state.businesses, response.data.business],
            isCreating: false, createError: null,
          }));
          return response.data;
        } catch (err) {
          set({ createError: err.response?.data?.error || err.message, isCreating: false });
          throw err;
        }
      },

      deleteBusiness: async (businessId) => {
        const token = useAuthStore.getState().token;
        if (!token) { set({ deleteError: 'No authentication token', isDeleting: false }); return; }
        set({ isDeleting: true, deleteError: null });
        try {
          const response = await axios.delete(API_BASE_URL + '/api/businesses/' + businessId, {
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
          });
          set((state) => ({
            businesses: state.businesses.filter(b => b._id !== businessId && b.id !== businessId),
            selectedBusinessId: state.selectedBusinessId === businessId ? null : state.selectedBusinessId,
            selectedBusiness: state.selectedBusinessId === businessId ? null : state.selectedBusiness,
            isDeleting: false, deleteError: null,
          }));
          return response.data;
        } catch (err) {
          set({ deleteError: err.response?.data?.error || err.message, isDeleting: false });
          throw err;
        }
      },

      selectBusiness: (business) => set({
        selectedBusiness: business,
        selectedBusinessId: business?._id || business?.id || null,
      }),

      selectBusinessById: (businessId) => {
        const business = get().businesses.find(b => b._id === businessId || b.id === businessId);
        set({ selectedBusiness: business || null, selectedBusinessId: businessId });
      },

      setSelectedBusinessId: (selectedBusinessId) => {
        const business = [...get().businesses, ...get().collaboratingBusinesses].find(b => b._id === selectedBusinessId || b.id === selectedBusinessId);
        set({ selectedBusinessId, selectedBusiness: business || null });
      },

      clearSelection: () => set({ selectedBusiness: null, selectedBusinessId: null }),

      myBusinesses: () => get().businesses.filter(b => b.status === 'active' || b.status === 'draft'),
      businessCount: () => get().businesses.length,
      getBusinessById: (id) => get().businesses.find(b => b._id === id || b.id === id),

      clearErrors: () => set({ error: null, createError: null, deleteError: null }),
    }),
    {
      name: 'business-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        selectedBusiness: state.selectedBusiness,
        selectedBusinessId: state.selectedBusinessId,
      }),
    }
  )
);
