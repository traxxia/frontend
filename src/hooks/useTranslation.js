// src/hooks/useTranslation.js
import { useLanguageStore } from '../store/languageStore';

/**
 * useTranslation - Hook for consuming the global language store
 * Replaces the legacy window-based and local-state-based translation logic.
 */
export const useTranslation = () => {
  const currentLanguage = useLanguageStore(state => state.currentLanguage);
  const translations = useLanguageStore(state => state.translations);
  const t = useLanguageStore(state => state.t);
  const setLanguage = useLanguageStore(state => state.setLanguage);

  return {
    t,
    currentLanguage,
    translations, // Provided for cases where raw translation object is needed
    changeLanguage: setLanguage,
  };
};