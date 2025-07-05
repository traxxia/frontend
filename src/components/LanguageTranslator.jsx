import React, { useState, useEffect } from 'react';
import '../styles/LanguageTranslator.css';

const LanguageTranslator = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    // Get saved language
    const savedLanguage = localStorage.getItem('appLanguage') || 'en';
    setCurrentLanguage(savedLanguage);
    
    // Listen for language changes
    const handleLanguageChange = (event) => {
      setCurrentLanguage(event.detail.language);
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value;
    
    if (window.translateApp) {
      window.translateApp(selectedLanguage);
    }
  };

  return (
    <div className="language-translator">
      <select 
        value={currentLanguage} 
        onChange={handleLanguageChange}
        className="language-dropdown"
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </div>
  );
};

export default LanguageTranslator;