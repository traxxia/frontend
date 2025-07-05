// components/AnalysisTypeSelector.jsx
import React from 'react';
import { Button } from 'react-bootstrap';
import { Circle } from 'lucide-react';
import { getIconComponent } from '../utils/iconUtils';
import { ANALYSIS_ICONS } from '../utils/analysisHelpers';

const AnalysisTypeSelector = ({ 
  analysisTypes, 
  selectedType, 
  onTypeSelect, 
  onRegenerateAnalysis,
  isLoading,
  activeAnalysisItem,
  showRegenerateButton = true // New prop to control regenerate button visibility
}) => {
  return (
    <div className="analysis-type-selector mb-4">
      <div className="d-flex justify-content-center align-items-center flex-wrap gap-3">
        {analysisTypes.map((type) => {
          const IconComponent = getIconComponent(ANALYSIS_ICONS[type.id] || 'Circle');
          const isSelected = selectedType === type.id;

          return (
            <div
              key={type.id}
              className={`analysis-type-pill ${isSelected ? 'selected' : ''}`}
              onClick={() => onTypeSelect(type.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex flex-column align-items-center p-3">
                <IconComponent
                  size={24}
                  className={`mb-2 ${isSelected ? 'text-primary' : 'text-muted'}`}
                />
                <span className={`small ${isSelected ? 'text-primary fw-bold' : 'text-muted'}`}>
                  {type.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Conditionally show regenerate button */}
      {selectedType && showRegenerateButton && (
        <div className="text-center mt-3">
          <Button
            variant="outline-primary"
            onClick={() => onRegenerateAnalysis(selectedType, activeAnalysisItem?.id)}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Regenerating...' : 'Regenerate Analysis'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AnalysisTypeSelector;