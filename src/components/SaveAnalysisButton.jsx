import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { Save } from 'lucide-react';
import SaveAnalysisModal from './SaveAnalysisModal';

const SaveAnalysisButton = ({
  analysisData,           // The generated analysis result
  analysisType,           // e.g., 'swot', 'porter', 'pestle'
  analysisFramework,      // e.g., 'SWOT Analysis', 'Porter's Five Forces'
  category,              // e.g., 'analysis' or 'strategic'
  businessName,          // Business name from survey
  surveyData,           // Survey data with questions and answers
  disabled = false,     // Whether save button should be disabled
  className = "",       // Additional CSS classes
  variant = "success",  // Bootstrap button variant
  size = "sm",         // Button size
  t                    // Translation function
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Get translation function
  const translate = (key) => {
    if (t) return t(key);
    if (window.getTranslation) return window.getTranslation(key);
    return key;
  };

  // Validate required props
  const isValidToSave = () => {
    return analysisData && 
           analysisType && 
           analysisFramework && 
           category && 
           businessName && 
           surveyData;
  };

  const handleSaveClick = () => {
    if (isValidToSave()) {
      setShowSaveModal(true);
    } else {
      console.error('SaveAnalysisButton: Missing required props for saving analysis');
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleSaveClick}
        disabled={disabled || !isValidToSave()}
        className={`d-flex align-items-center ${className}`}
        title={!isValidToSave() ? 'Generate analysis first' : 'Save this analysis'}
      >
        <Save size={14} className="me-1" />
        {translate('save_analysis') || 'Save Analysis'}
      </Button>

      <SaveAnalysisModal
        show={showSaveModal}
        onHide={() => setShowSaveModal(false)}
        analysisData={analysisData}
        surveyData={surveyData}
        businessName={businessName}
        analysisType={analysisType}
        analysisFramework={analysisFramework}
        category={category}
        t={translate}
      />
    </>
  );
};

export default SaveAnalysisButton;