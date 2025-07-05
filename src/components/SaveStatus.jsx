import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Spinner } from 'react-bootstrap';

const SaveStatus = ({ 
  saveStatus,
  isSaving,
  t,
  getTranslation 
}) => {
  const [translations, setTranslations] = useState({});

  // Get translation function
  const getTranslationFunc = (key) => {
    if (getTranslation && typeof getTranslation === 'function') {
      return getTranslation(key);
    }
    if (window.getTranslation) {
      return window.getTranslation(key);
    }
    return translations[key] || key;
  };

  // Update translations when language changes
  useEffect(() => {
    const updateTranslations = () => {
      const currentLang = window.currentAppLanguage || 'en';
      const currentTranslations = window.appTranslations?.[currentLang] || {};
      setTranslations(currentTranslations);
    };

    updateTranslations();
    window.addEventListener('languageChanged', updateTranslations);

    return () => {
      window.removeEventListener('languageChanged', updateTranslations);
    };
  }, []);

  // Status icon and message logic
  let statusIcon = null;
  let statusMessage = saveStatus;
  let statusColor = '';

  // Translate status messages
  if (saveStatus === 'Save successful!' || saveStatus === '¡Guardado exitoso!' || getTranslationFunc('save_successful') === saveStatus) {
    statusIcon = <CheckCircle size={16} className="text-success me-1" />;
    statusColor = 'text-success';
    statusMessage = getTranslationFunc('save_successful') || t('save_successful') || 'Save successful!';
  } else if (saveStatus === 'Saving...' || saveStatus === 'Guardando...' || getTranslationFunc('saving') === saveStatus) {
    statusIcon = <Spinner size="sm" className="me-1 text-primary" />;
    statusColor = 'text-primary';
    statusMessage = getTranslationFunc('saving') || t('saving') || 'Saving...';
  } else if (saveStatus === 'Save failed' || saveStatus === 'Error al guardar' || getTranslationFunc('save_failed') === saveStatus) {
    statusIcon = <XCircle size={16} className="text-danger me-1" />;
    statusColor = 'text-danger';
    statusMessage = getTranslationFunc('save_failed') || t('save_failed') || 'Save failed';
  }

  // Only render if there's a save status
  if (!saveStatus) return null;

  return (
    <div className={`save-status-section mt-3 p-2 mb-3 rounded ${statusColor === 'text-success' ? 'bg-success bg-opacity-10' : statusColor === 'text-danger' ? 'bg-danger bg-opacity-10' : 'bg-info bg-opacity-10'}`}>
      <div className={`save-status d-flex align-items-center ${statusColor}`}>
        {statusIcon}
        <span className="ms-1">{statusMessage}</span>
      </div>
      {statusColor === 'text-success' && (
        <small className="text-muted d-block mt-1">
          {getTranslationFunc('auto_save_enabled') || t('auto_save_enabled') || 'Auto-save is enabled. Your progress is saved automatically.'}
        </small>
      )}
    </div>
  );
};

export default SaveStatus;