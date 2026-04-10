// src/store/languageStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { staticTranslations, initializeTranslations } from '../utils/translations';

export const useLanguageStore = create(
  persist(
    (set, get) => ({
      currentLanguage: 'en',
      translations: staticTranslations['en'] || {},

      setLanguage: async (lang) => {
        if (!window.appTranslations) {
          initializeTranslations();
        }
        const translations = window.appTranslations?.[lang] || staticTranslations[lang] || {};
        set({ currentLanguage: lang, translations });
        window.dispatchEvent(new CustomEvent('languageChanged', {
          detail: { language: lang }
        }));
      },

      t: (key, params = {}) => {
        const state = get();
        let text = state.translations[key] || key;
        Object.keys(params).forEach(pKey => {
          text = text.replace(new RegExp('{{' + pKey + '}}', 'g'), params[pKey]);
        });
        return text;
      },

      loadTranslations: (lang) => {
        if (!window.appTranslations) {
          initializeTranslations();
        }
        const translations = window.appTranslations?.[lang] || staticTranslations[lang] || {};
        set({ translations });
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentLanguage: state.currentLanguage }),
    }
  )
);
