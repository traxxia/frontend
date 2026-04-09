// src/store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Helper to sync auth data to individual sessionStorage keys for backward compatibility
// during migration. Components that still use sessionStorage.getItem('token') will work.
const syncToSessionStorage = (state) => {
  try {
    if (state.token) sessionStorage.setItem('token', state.token);
    else sessionStorage.removeItem('token');

    if (state.userId) sessionStorage.setItem('userId', state.userId);
    else sessionStorage.removeItem('userId');

    if (state.userName) sessionStorage.setItem('userName', state.userName);
    else sessionStorage.removeItem('userName');

    if (state.userEmail) sessionStorage.setItem('userEmail', state.userEmail);
    else sessionStorage.removeItem('userEmail');

    if (state.userRole) sessionStorage.setItem('userRole', state.userRole);
    else sessionStorage.removeItem('userRole');

    if (state.userPlan) sessionStorage.setItem('userPlan', state.userPlan);
    else sessionStorage.removeItem('userPlan');

    if (state.userCompany) sessionStorage.setItem('userCompany', state.userCompany);
    else sessionStorage.removeItem('userCompany');

    if (state.companyId) sessionStorage.setItem('companyId', state.companyId);
    else sessionStorage.removeItem('companyId');

    if (state.companyName) sessionStorage.setItem('companyName', state.companyName);
    else sessionStorage.removeItem('companyName');

    if (state.companyLogo) sessionStorage.setItem('companyLogo', state.companyLogo);
    else sessionStorage.removeItem('companyLogo');

    if (state.companyIndustry) sessionStorage.setItem('companyIndustry', state.companyIndustry);
    else sessionStorage.removeItem('companyIndustry');

    sessionStorage.setItem('userLimits', JSON.stringify(state.userLimits || {}));
    sessionStorage.setItem('isAdmin', String(state.isAdmin));
  } catch (e) {
    console.error('Error syncing auth state to sessionStorage:', e);
  }
};

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
          userLimits: data.user?.limits || data.userLimits || {},
          isAdmin: ['super_admin', 'company_admin'].includes(data.user?.role) || data.isAdmin === true,
          isAuthenticated: true,
        };
        set(newState);
        syncToSessionStorage(newState);
      },

      updateUser: (updates) => {
        const newState = { ...get(), ...updates };
        set(newState);
        syncToSessionStorage(newState);
      },

      logout: () => {
        set({
          token: null, userId: null, userName: null, userEmail: null,
          userRole: null, userPlan: null, userCompany: null, companyId: null,
          companyName: null, companyLogo: null, companyIndustry: null,
          userLimits: {}, isAdmin: false, isAuthenticated: false,
        });
        // Clear individual sessionStorage keys for backward compatibility
        try {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('userId');
          sessionStorage.removeItem('userName');
          sessionStorage.removeItem('userEmail');
          sessionStorage.removeItem('userRole');
          sessionStorage.removeItem('userPlan');
          sessionStorage.removeItem('userCompany');
          sessionStorage.removeItem('companyId');
          sessionStorage.removeItem('companyName');
          sessionStorage.removeItem('companyLogo');
          sessionStorage.removeItem('companyIndustry');
          sessionStorage.removeItem('userLimits');
          sessionStorage.removeItem('isAdmin');
        } catch (e) {
          console.error('Error clearing sessionStorage on logout:', e);
        }
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
        companyIndustry: state.companyIndustry, userLimits: state.userLimits,
        isAdmin: state.isAdmin, isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
