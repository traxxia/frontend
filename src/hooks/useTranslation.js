import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = useCallback((lang) => {
    i18n.changeLanguage(lang);
  }, [i18n]);

  return {
    t,
    currentLanguage: i18n.language,
    changeLanguage,
  };
};
