import { useLanguageStore } from '../store/languageStore';

export const useTranslation = () => {
  const currentLanguage = useLanguageStore(state => state.currentLanguage);
  const translations = useLanguageStore(state => state.translations);
  const t = useLanguageStore(state => state.t);
  const setLanguage = useLanguageStore(state => state.setLanguage);

  return {
    t,
    currentLanguage,
    translations,
    changeLanguage: setLanguage,
  };
};
