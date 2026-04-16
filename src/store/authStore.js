// src/store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      userName: null,
      userEmail: null,
      userRole: null,
      userPlan: null,
      userCompany: null,
      companyId: null,
      companyName: null,
      companyLogo: null,
      companyIndustry: null,
      tourCompleted: null,
      userLimits: {},
      isAdmin: false,
      isAuthenticated: false,

      setAuth: (data) => {
        const newState = {
          token: data.token || null,
          userId: data.user?.id || data.userId || null,
          userName: data.user?.name || data.userName || null,
          userEmail: data.user?.email || data.userEmail || null,
          userRole: data.user?.role || data.userRole || null,
          userPlan: data.user?.plan_name || data.userPlan || null,
          userCompany: data.user?.company?.name || data.userCompany || null,
          companyId: data.user?.company?.id || data.companyId || null,
          companyName: data.user?.company?.name || data.companyName || null,
          companyLogo: data.user?.company?.logo || data.companyLogo || null,
          companyIndustry: data.user?.company?.industry || data.companyIndustry || null,
          tourCompleted: data.user?.tour_completed ?? data.tourCompleted ?? null,
          userLimits: data.user?.limits || data.userLimits || {},
          isAdmin: ['super_admin', 'company_admin'].includes(data.user?.role) || data.isAdmin === true,
          isAuthenticated: true,
        };
        set(newState);
      },

      updateUser: (updates) => {
        set((state) => ({ ...state, ...updates }));
      },

      logout: () => {
        set({
          token: null, userId: null, userName: null, userEmail: null,
          userRole: null, userPlan: null, userCompany: null, companyId: null,
          companyName: null, companyLogo: null, companyIndustry: null,
          tourCompleted: null,
          userLimits: {}, isAdmin: false, isAuthenticated: false,
        });
      },

      isSuperAdmin: () => get().userRole === 'super_admin',
      isCompanyAdmin: () => get().userRole === 'company_admin',
      isViewer: () => get().userRole === 'viewer',
      hasLimit: (key) => get().userLimits[key] || null,
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        token: state.token, userId: state.userId, userName: state.userName,
        userEmail: state.userEmail, userRole: state.userRole, userPlan: state.userPlan,
        userCompany: state.userCompany, companyId: state.companyId,
        companyName: state.companyName, companyLogo: state.companyLogo,
        companyIndustry: state.companyIndustry, tourCompleted: state.tourCompleted, userLimits: state.userLimits,
        isAdmin: state.isAdmin, isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
