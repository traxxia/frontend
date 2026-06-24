import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import i18n from '../i18n';

export const useLanguageStore = create(
  persist(
    (set) => ({
      currentLanguage: 'en',

      setLanguage: async (lang) => {
        await i18n.changeLanguage(lang);
        set({ currentLanguage: lang });
      },

      t: (key, params = {}) => {
        return i18n.t(key, params);
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ currentLanguage: state.currentLanguage }),
    }
  )
);
