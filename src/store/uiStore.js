// src/store/uiStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      toasts: [],
      modals: {},
      loadingStates: {},

      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),

      setTheme: (theme) => set({ theme }),

      addToast: (toast) => {
        const id = Date.now() + Math.random();
        const newToast = { id, duration: 3000, ...toast };
        set((state) => ({ toasts: [...state.toasts, newToast] }));
        if (newToast.duration > 0) {
          setTimeout(() => { get().removeToast(id); }, newToast.duration);
        }
        return id;
      },

      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),

      clearToasts: () => set({ toasts: [] }),

      openModal: (name, data = {}) => set((state) => ({
        modals: { ...state.modals, [name]: { open: true, data } }
      })),

      closeModal: (name) => set((state) => ({
        modals: {
          ...state.modals,
          [name]: state.modals[name] ? { ...state.modals[name], open: false } : { open: false, data: null }
        }
      })),

      isModalOpen: (name) => get().modals[name]?.open || false,
      getModalData: (name) => get().modals[name]?.data || null,

      setLoading: (key, isLoading) => set((state) => ({
        loadingStates: { ...state.loadingStates, [key]: isLoading }
      })),

      isLoading: (key) => get().loadingStates[key] || false,

      businessSettings: {},
      setBusinessSetting: (businessId, key, value) => set((state) => ({
        businessSettings: {
          ...state.businessSettings,
          [businessId]: {
            ...(state.businessSettings[businessId] || {}),
            [key]: value
          }
        }
      })),
      getBusinessSetting: (businessId, key) => get().businessSettings[businessId]?.[key] || null,
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        theme: state.theme,
        businessSettings: state.businessSettings 
      }),
    }
  )
);
