import React from 'react';
import { useLanguageStore } from '../store/languageStore';
import '../styles/LanguageTranslator.css';

/**
 * LanguageTranslator - Dropdown component for switching application language
 * Uses the Zustand languageStore for reactive updates across the entire app.
 */
const LanguageTranslator = () => {
  const currentLanguage = useLanguageStore(state => state.currentLanguage);
  const setLanguage = useLanguageStore(state => state.setLanguage);

  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value;
    setLanguage(selectedLanguage);
  };

  return (
    <div className="language-translator">
      <select 
        value={currentLanguage} 
        onChange={handleLanguageChange}
        className="language-dropdown"
        aria-label="Select Language"
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </div>
  );
};

export default LanguageTranslator;