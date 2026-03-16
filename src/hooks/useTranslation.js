// src/hooks/useTranslation.js

import { useState, useEffect } from 'react';
import { academyTranslations } from '../utils/academyTranslations';

export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translations, setTranslations] = useState({});

  const t = (key, params = {}) => {
  let text = key;

  // First check local translations (academy or merged)
  if (translations && translations[key]) {
    text = translations[key];
  }
  // Always prioritize the global translation function if available
  else if (window.getTranslation) {
    text = window.getTranslation(key, params);
  } 
  else {
    // Fallback to local state
    text = translations[key] || key;
  }

  // Basic interpolation: replace {{key}} with params[key]
  Object.keys(params).forEach(pKey => {
    text = text.replace(new RegExp(`{{${pKey}}}`, 'g'), params[pKey]);
  });
  
  return text;
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

  const currentTranslations = {
    ...(window.appTranslations?.[currentLang] || {}),
    ...(academyTranslations?.[currentLang] || {})
  };

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