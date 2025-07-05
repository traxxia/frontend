// src/hooks/useTranslation.js

import { useState, useEffect } from 'react';

export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translations, setTranslations] = useState({});

  const t = (key) => {
    // Always prioritize the global translation function if available
    if (window.getTranslation) {
      return window.getTranslation(key);
    }
    // Fallback to local state
    return translations[key] || key;
  };

  useEffect(() => {
    // Initialize translations if not already done
    if (!window.appTranslations) {
      const { initializeTranslations } = require('../utils/translations');
      initializeTranslations();
    }

    const updateTranslations = () => {
      // Priority: session storage > localStorage > window global > default
      const sessionLang = sessionStorage.getItem('appLanguage');
      const localLang = localStorage.getItem('appLanguage');
      const windowLang = window.currentAppLanguage;
      
      const currentLang = sessionLang || windowLang || localLang || 'en';
      
      // Update window language if needed
      if (window.currentAppLanguage !== currentLang) {
        window.currentAppLanguage = currentLang;
      }

      const currentTranslations = window.appTranslations?.[currentLang] || {};
      setTranslations(currentTranslations);
      setCurrentLanguage(currentLang);
    };

    // Initial update
    updateTranslations();

    // Listen for language changes
    const handleLanguageChange = (event) => {
      updateTranslations();
    };

    window.addEventListener('languageChanged', handleLanguageChange);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  // Helper function to change language (optional - can be used by components if needed)
  const changeLanguage = (language) => {
    if (window.setAppLanguage) {
      window.setAppLanguage(language);
    } else if (window.translateApp) {
      window.translateApp(language);
    }
  };

  return {
    t,
    currentLanguage,
    translations,
    changeLanguage // Optional: expose language change function
  };
};