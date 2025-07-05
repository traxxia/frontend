import React, { useState, useEffect } from 'react';
import { Button, ProgressBar, Modal } from 'react-bootstrap';
import { Eye } from 'lucide-react';
import PreviewContent from './PreviewContent';

const ProgressSection = ({ 
  progressData, 
  saveAnswers, 
  isSaving, 
  businessData = {}, 
  onManualSave, // New prop for manual save
  t // Translation function
}) => {
  const [translations, setTranslations] = useState({});

  // Get translation function
  const getTranslation = (key) => {
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

  const {
    answeredQuestions,
    totalQuestions,
    progress,
  } = progressData;

  const [categories, setCategories] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = () => {
    setCategories(businessData?.categories || []);
    setAnswers(businessData?.answers || []);
    setShowPreview(true);
  };

  const handleManualSave = () => {
    if (onManualSave) {
      onManualSave();
    }
  };

  return (
    <div className="progress-section">
      {/* Action Buttons Row */}
      <div className="progress-header d-flex justify-content-between align-items-center mb-3">
        <h6 className="progress-section-title mb-0">
          {getTranslation('information') || t('information') || 'Information'}
        </h6>
        <Button className="preview-button" variant="primary" onClick={handlePreview}>
          <Eye size={16} className="me-1" />
          {getTranslation('preview') || t('preview') || 'Preview'}
        </Button>
      </div>

      {/* Preview Modal */}
      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        centered
        className="preview-modal"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="w-100 text-center">
            {getTranslation('response_summary') || t('response_summary') || 'Summary'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PreviewContent 
            categories={businessData.categories}
            answers={businessData.answers}
            t={t || getTranslation}
          />
        </Modal.Body>
      </Modal>

      {/* Progress Information Section */}
      <div className="progress-label">
        {getTranslation('progress_label') || t('progress_label') || 'Progress'}: {progress}% – {answeredQuestions} {getTranslation('of') || t('of') || 'of'} {totalQuestions} {getTranslation('questions_answered_label') || t('questions_answered_label') || 'questions answered'}.
      </div>

      <ProgressBar now={progress} className="progress-bar-custom" />

      <p className="progress-help-text">
        {getTranslation('complete_remaining_questions') || t('complete_remaining_questions') || 'Please complete the remaining questions to continue. The more questions you answer, the more accurate and personalized your results will be.'}
      </p>
    </div>
  );
};

export default ProgressSection;