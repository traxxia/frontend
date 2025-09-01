import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Loader, Info, AlertCircle } from 'lucide-react';
import '../styles/goodPhase.css'; 
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const ProfitabilityAnalysis = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  profitabilityData = null,
  selectedBusinessId,
  onRedirectToBrief,
  uploadedFile = null,
}) => {
  const [analysisData, setAnalysisData] = useState(profitabilityData);
  const [error, setError] = useState(null);

  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    try {
      const analysisConfig = ANALYSIS_TYPES.profitability || {
        displayName: 'Profitability Analysis',
        customMessage: 'Answer more questions to unlock detailed profitability analysis'
      };

      await checkMissingQuestionsAndRedirect(
        'profitability',
        selectedBusinessId,
        handleRedirectToBrief,
        {
          displayName: analysisConfig.displayName,
          customMessage: analysisConfig.customMessage
        }
      );
    } catch (error) {
      console.error('Error checking missing questions:', error);
    }
  };

  // UPDATED: Handle the new backend response structure
  const isProfitabilityDataIncomplete = (data) => { 
    
    if (!data || !data.profitability) { 
      return true;
    }
    
    const profitabilityMetrics = data.profitability; 
    
    if (!profitabilityMetrics || typeof profitabilityMetrics !== 'object') { 
      return true;
    }
     
    const hasValidMetric = Object.entries(profitabilityMetrics).some(([key, value]) => {
      const isValid = value !== null && 
        value !== undefined &&
        value !== '' &&
        !isNaN(parseFloat(value)); 
      return isValid;
    });
     
    return !hasValidMetric;
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      try {
        setError(null);
        await onRegenerate();
      } catch (error) {
        console.error('Error during regeneration:', error);
        setError('Failed to regenerate analysis. Please try again.');
      }
    } else {
      setAnalysisData(null);
      setError(null);
    }
  }; 
  
  useEffect(() => { 
    
    if (profitabilityData && profitabilityData !== analysisData) { 
      setAnalysisData(profitabilityData);
      setError(null);
      
      if (onDataGenerated) {
        onDataGenerated(profitabilityData);
      }
    }
  }, [profitabilityData, analysisData, onDataGenerated]);

  // Initial setup
  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (profitabilityData) {
      setAnalysisData(profitabilityData);
    }

    return () => {
      isMounted.current = false;
    };
  }, [profitabilityData]);

  const handleFileUpload = (file) => { 
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (allowedTypes.includes(file.type)) {
        setError(null);
      } else {
        setError('Please upload an Excel or CSV file.');
      }
    }
  };

  const removeFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle percentage formatting with proper null checks
  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === '') return null;
    
    if (typeof value === 'string') {
      if (value.includes('%')) return value;
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return null;
      return `${(numValue * 100).toFixed(2)}%`;
    }
    
    if (typeof value === 'number') {
      return `${(value * 100).toFixed(2)}%`;
    }
    
    return null;
  };

  // UPDATED: Convert snake_case to display names
  const getDisplayName = (key) => {
    const displayNames = {
      'gross_margin': 'Gross Margin',
      'operating_margin': 'Operating Margin', 
      'ebitda_margin': 'EBITDA Margin',
      'net_margin': 'Net Margin'
    };
    return displayNames[key] || key.replace('_', ' ').toUpperCase();
  };

  if (isRegenerating) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Generating profitability analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={handleRegenerate} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!analysisData || isProfitabilityDataIncomplete(analysisData)) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisEmptyState
          analysisType="profitability"
          analysisDisplayName="Profitability Analysis"
          icon={TrendingUp}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          onGenerateWithFile={() => handleRegenerate()} 
          onGenerateWithoutFile={() => handleRegenerate()} 
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          isUploading={false}
          fileUploadMessage="Upload Excel files for detailed financial analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      </div>
    );
  }

  // UPDATED: Extract data from new backend structure
  const profitabilityMetrics = analysisData.profitability;
  
  if (!profitabilityMetrics || typeof profitabilityMetrics !== 'object') { 
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisEmptyState
          analysisType="profitability"
          analysisDisplayName="Profitability Analysis"
          icon={TrendingUp}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
        />
      </div>
    );
  }

  return (
    <div className="profitability-analysis" 
         data-analysis-type="profitability"
         data-analysis-name="Profitability Analysis"
         data-analysis-order="1">

      {/* Header */}
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll"> 

          {/* Check if all values are null and show warning */}
          {Object.values(profitabilityMetrics).every(value => value === null) && (
            <div className="profitability-warning">
              <AlertCircle size={20} color="#f59e0b" />
              <div>
                <h4 className="profitability-warning-title">
                  No Financial Data Available
                </h4>
                <p className="profitability-warning-text">
                  Upload an Excel file with financial data or ensure your spreadsheet contains the required profitability metrics.
                </p>
              </div>
            </div>
          )}

          {/* Profitability Metrics Table */}
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(profitabilityMetrics).map(([key, value]) => {
                const formattedValue = formatPercentage(value);
                const isNull = value === null || value === undefined || value === '';
                const displayName = getDisplayName(key);
                
                return (
                  <tr key={key}>
                    <td><strong>{displayName}</strong></td>
                    <td>{isNull ? 'No Data' : formattedValue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
 
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityAnalysis;