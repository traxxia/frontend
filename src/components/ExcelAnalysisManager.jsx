import React, { useState, useEffect, useRef } from 'react';
import { Loader, Upload, X } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import { ExcelAnalysisService } from '../services/excelAnalysisService';

// Import individual analysis components
import ProfitabilityAnalysis from './ProfitabilityAnalysis';
import GrowthTracker from './GrowthTracker';
import LiquidityEfficiency from './LiquidityEfficiency';
import InvestmentPerformance from './InvestmentPerformance';
import LeverageRisk from './LeverageRisk';

const ExcelAnalysisManager = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  excelAnalysisData = null,
  selectedBusinessId,
  onRedirectToBrief,
  uploadedFile
}) => {
  const [analysisData, setAnalysisData] = useState(excelAnalysisData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localUploadedFile, setLocalUploadedFile] = useState(uploadedFile);

  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  // Initialize Excel Analysis Service
  const excelAnalysisService = new ExcelAnalysisService(
    ML_API_BASE_URL,
    getAuthToken,
    (endpoint, loading) => {
      if (endpoint === 'excel-analysis') {
        setIsLoading(loading);
      }
    }
  );

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.excelAnalysis || {
      displayName: 'Financial Analysis Suite',
      customMessage: 'Answer more questions to unlock detailed financial analysis'
    };

    await checkMissingQuestionsAndRedirect(
      'excelAnalysis',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const isExcelAnalysisDataIncomplete = (data) => {
    if (!data) return true;
    
    // Check if we have data for at least one analysis component
    return !data.profitability && 
           !data.growth_trends && 
           !data.liquidity && 
           !data.investment && 
           !data.leverage;
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setAnalysisData(null);
      setError(null);
      await generateExcelAnalysis();
    }
  };

  useEffect(() => {
    if (excelAnalysisData && excelAnalysisData !== analysisData) {
      setAnalysisData(excelAnalysisData);
      if (onDataGenerated) {
        onDataGenerated(excelAnalysisData);
      }
    }
  }, [excelAnalysisData]);

  useEffect(() => {
    if (uploadedFile && uploadedFile !== localUploadedFile) {
      setLocalUploadedFile(uploadedFile);
    }
  }, [uploadedFile]);

  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (excelAnalysisData) {
      setAnalysisData(excelAnalysisData);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (analysisData && onDataGenerated) {
      onDataGenerated(analysisData);
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
        setLocalUploadedFile(file);
        setError(null);
      } else {
        setError('Please upload an Excel or CSV file.');
      }
    }
  };

  const removeFile = () => {
    setLocalUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateExcelAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all metrics at once (no metric_type parameter)
      const result = await excelAnalysisService.generateExcelAnalysis(
        localUploadedFile,
        questions,
        userAnswers
      );

      // The API now returns the structured data directly
      const transformedData = {
        profitability: result.profitability,
        growth_trends: result.growth_trends,
        liquidity: result.liquidity,
        investment: result.investment,
        leverage: result.leverage
      };

      setAnalysisData(transformedData);

      // Save to backend
      await saveAnalysisToBackend(transformedData);

      if (onDataGenerated) {
        onDataGenerated(transformedData);
      }

    } catch (error) {
      console.error('Error generating excel analysis:', error);
      setError(`Failed to generate analysis: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate specific metric types
  const generateSpecificAnalysis = async (metricType) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await excelAnalysisService.generateExcelAnalysis(
        localUploadedFile,
        questions,
        userAnswers,
        metricType
      );

      // Update only the specific metric in analysisData
      setAnalysisData(prevData => ({
        ...prevData,
        ...result
      }));

    } catch (error) {
      console.error(`Error generating ${metricType} analysis:`, error);
      setError(`Failed to generate ${metricType} analysis: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnalysisToBackend = async (analysisData) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/conversations/phase-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phase: 'good',
          analysis_type: 'excelAnalysis',
          analysis_name: 'Financial Analysis Suite',
          analysis_data: analysisData,
          business_id: selectedBusinessId,
          metadata: {
            generated_at: new Date().toISOString(),
            business_name: businessName,
            has_uploaded_file: !!localUploadedFile
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save Financial Analysis Suite');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving Financial Analysis Suite to backend:', error);
      throw error;
    }
  };

  if (isLoading || isRegenerating) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? "Regenerating financial analysis suite..."
              : "Generating comprehensive financial analysis..."
            }
          </span>
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
          <button onClick={() => {
            setError(null);
            generateExcelAnalysis();
          }} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!analysisData || isExcelAnalysisDataIncomplete(analysisData)) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisEmptyState
          analysisType="excelAnalysis"
          analysisDisplayName="Financial Analysis Suite"
          icon={Upload}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          onGenerateWithFile={() => generateExcelAnalysis()}
          onGenerateWithoutFile={() => generateExcelAnalysis()}
          uploadedFile={localUploadedFile}
          onRemoveFile={removeFile}
          isUploading={isLoading}
          fileUploadMessage="Upload Excel files for comprehensive financial analysis including profitability, growth, liquidity, investment performance, and risk metrics"
          acceptedFileTypes=".xlsx,.xls,.csv"
        />
      </div>
    );
  }

  // Render all 5 analysis components
  return (
    <div className="excel-analysis-manager">
      <div className="analysis-suite-header" style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '20px',
        margin: '0 0 30px 0',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#1f2937',
          margin: '0 0 8px 0'
        }}>
          Financial Analysis Suite
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: 0
        }}>
          Comprehensive financial analysis across 5 key areas: Profitability, Growth, Liquidity, Investment Performance, and Risk Assessment
        </p>
      </div>

      {/* Profitability Analysis */}
      {analysisData.profitability && (
        <div style={{ marginBottom: '40px' }}>
          <ProfitabilityAnalysis
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessName}
            profitabilityData={{ profitability: analysisData.profitability }}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
            onRegenerate={() => generateSpecificAnalysis('profitability')}
            isRegenerating={isLoading}
            canRegenerate={canRegenerate}
          />
        </div>
      )}

      {/* Growth Tracker */}
      {analysisData.growth_trends && (
        <div style={{ marginBottom: '40px' }}>
          <GrowthTracker
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessName}
            growthData={{ growth_trends: analysisData.growth_trends }}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
            onRegenerate={() => generateSpecificAnalysis('growth_trends')}
            isRegenerating={isLoading}
            canRegenerate={canRegenerate}
          />
        </div>
      )}

      {/* Liquidity & Efficiency */}
      {analysisData.liquidity && (
        <div style={{ marginBottom: '40px' }}>
          <LiquidityEfficiency
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessName}
            liquidityData={{ liquidity: analysisData.liquidity }}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
            onRegenerate={() => generateSpecificAnalysis('liquidity')}
            isRegenerating={isLoading}
            canRegenerate={canRegenerate}
          />
        </div>
      )}

      {/* Investment Performance */}
      {analysisData.investment && (
        <div style={{ marginBottom: '40px' }}>
          <InvestmentPerformance
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessName}
            investmentData={{ investment: analysisData.investment }}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
            onRegenerate={() => generateSpecificAnalysis('investment')}
            isRegenerating={isLoading}
            canRegenerate={canRegenerate}
          />
        </div>
      )}

      {/* Leverage & Risk */}
      {analysisData.leverage && (
        <div style={{ marginBottom: '40px' }}>
          <LeverageRisk
            questions={questions}
            userAnswers={userAnswers}
            businessName={businessName}
            leverageData={{ leverage: analysisData.leverage }}
            selectedBusinessId={selectedBusinessId}
            onRedirectToBrief={handleRedirectToBrief}
            onRegenerate={() => generateSpecificAnalysis('leverage')}
            isRegenerating={isLoading}
            canRegenerate={canRegenerate}
          />
        </div>
      )}
    </div>
  );
};

export default ExcelAnalysisManager;