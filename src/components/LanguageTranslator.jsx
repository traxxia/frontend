import React from 'react';
import { useLanguageStore } from '../store/languageStore';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/LanguageTranslator.css';

const LanguageTranslator = ({ disabled }) => {
  const currentLanguage = useLanguageStore(state => state.currentLanguage);
  const setLanguage = useLanguageStore(state => state.setLanguage);

  const { changeLanguage } = useTranslation();

  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value;
    setLanguage(selectedLanguage);
    changeLanguage(selectedLanguage);
    
    setTimeout(() => {
      const selectField = document.querySelector('.goog-te-combo');
      if (selectField) {
        selectField.value = selectedLanguage;
        selectField.dispatchEvent(new Event('change'));
      }
    }, 100);
  };

  return (
    <div className="language-translator">
      <select
        value={currentLanguage}
        onChange={handleLanguageChange}
        className="language-dropdown notranslate"
        aria-label="Select Language"
        disabled={disabled}
      >
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
    </div>
  );
};

export default LanguageTranslator;
