import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Loader } from 'lucide-react';
import '../styles/goodPhase.css'; 
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const InvestmentPerformance = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  investmentData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [analysisData, setAnalysisData] = useState(investmentData);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

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
    const analysisConfig = ANALYSIS_TYPES.investmentPerformance || {
      displayName: 'Investment Performance',
      customMessage: 'Answer more questions to unlock detailed investment analysis'
    };

    await checkMissingQuestionsAndRedirect(
      'investmentPerformance',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const isInvestmentDataIncomplete = (data) => {
    if (!data || !data.investment) return true;
    
    const { investment } = data;
    return !investment.roa && !investment.roe && !investment.roic;
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setAnalysisData(null);
      setError(null);
    }
  };

  useEffect(() => {
    if (investmentData && investmentData !== analysisData) {      
      setAnalysisData(investmentData);
      if (onDataGenerated) {
        onDataGenerated(investmentData);
      }
    }
  }, [investmentData]);

  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (investmentData) { setAnalysisData(investmentData);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (analysisData && onDataGenerated) {onDataGenerated(analysisData);
    }
  }, [analysisData]);

  const handleFileUpload = (file) => {
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (allowedTypes.includes(file.type)) {
        setUploadedFile(file);
        setError(null);
      } else {
        setError('Please upload an Excel or CSV file.');
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  const getRatioColor = (value) => {
    if (value === null || value === undefined) return 'ratio-unavailable';
    return 'ratio-available';
  }; 
 

  if (isRegenerating) {
    return (
      <div className="investment-container">
        <div className="investment-loading-state">
          <Loader size={24} className="investment-loading-spinner" />
          <span>Generating investment performance analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="investment-container">
        <div className="investment-error-state">
          <div className="investment-error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              if (onRegenerate) {
                onRegenerate();
              }
            }} 
            className="investment-retry-button"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!analysisData || isInvestmentDataIncomplete(analysisData)) {
    return (
      <div className="investment-container">
        <AnalysisEmptyState
          analysisType="investmentPerformance"
          analysisDisplayName="Investment Performance"
          icon={TrendingUp}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          onGenerateWithFile={() => {}}
          onGenerateWithoutFile={() => {}}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          isUploading={false}
          fileUploadMessage="Upload Excel files for detailed investment analysis"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      </div>
    );
  }

  const { investment } = analysisData;

  return (
    <div 
      className="investment-container" 
      data-analysis-type="investment-performance"
      data-analysis-name="Investment Performance"
      data-analysis-order="4"
    >
      <table className="data-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th> 
          </tr>
        </thead>
        <tbody>
          {investment.roa !== null && investment.roa !== undefined && (
            <tr>
              <td><strong>ROA (Return on Assets)</strong></td>
              <td>{formatPercentage(investment.roa)}</td> 
            </tr>
          )}
          {investment.roe !== null && investment.roe !== undefined && (
            <tr>
              <td><strong>ROE (Return on Equity)</strong></td>
              <td>{formatPercentage(investment.roe)}</td> 
            </tr>
          )}
          {investment.roic !== null && investment.roic !== undefined && (
            <tr>
              <td><strong>ROIC (Return on Invested Capital)</strong></td>
              <td>{formatPercentage(investment.roic)}</td> 
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvestmentPerformance;