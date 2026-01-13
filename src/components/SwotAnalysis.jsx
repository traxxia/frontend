import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';
import '../styles/analysis-components.css';
import '../styles/EssentialPhase.css';
import { Target, Loader, TrendingUp, TrendingDown, AlertTriangle, Zap, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const SwotAnalysis = ({
  analysisResult: initialAnalysisResult,
  businessName,
  onRegenerate, // Add this prop for regenerate functionality
  isRegenerating = false, // Add this prop to handle external regeneration state
  canRegenerate = true,
  questions,
  userAnswers,
  onDataGenerated,
  saveAnalysisToBackend,
  selectedBusinessId,
  onRedirectToBrief,
  hideImproveButton = false,

}) => {
  const { t } = useTranslation();
  const [analysisResult, setAnalysisResult] = useState(initialAnalysisResult);
  const [internalRegenerating, setInternalRegenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    swotAnalysis: true
  });

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.swot;

    await checkMissingQuestionsAndRedirect(
      'swot',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Handle regenerate - this is the key function
  const handleRegenerate = async () => {
    if (onRegenerate) {
      try {
        await onRegenerate();
      } catch (error) {
        console.error('Error in SWOT regeneration:', error);
        setErrorMessage(error.message || 'Failed to regenerate analysis');
      }
    } else {
      // Fallback to internal generation if no external handler
      await generateSwotAnalysis();
    }
  };

  // Handle retry for error state
  const handleRetry = () => {
    setErrorMessage('');
    if (onRegenerate) {
      onRegenerate();
    } else {
      generateSwotAnalysis();
    }
  };

  // Check if the SWOT data is empty/incomplete - only for truly empty responses
  const isSwotDataIncomplete = (data) => {
    // Only return true if data is null, undefined, or empty string
    return !data || data === '' || (typeof data === 'string' && data.trim() === '');
  };

  useEffect(() => {
    // Only update if initialAnalysisResult is different from current state
    if (initialAnalysisResult !== analysisResult) {
      setAnalysisResult(initialAnalysisResult);
      setErrorMessage(''); // Clear any previous errors when new data is loaded
    }
  }, [initialAnalysisResult]);

  useEffect(() => {
    // On component mount, if we have initial data, make sure it's set
    if (initialAnalysisResult && !analysisResult) {
      setAnalysisResult(initialAnalysisResult);
    }
  }, []);

  const parseAnalysisResult = (result) => {
    if (!result) {
      throw new Error('No analysis result provided');
    }

    if (typeof result === 'object' && result !== null) {
      return result;
    }

    if (typeof result !== 'string') {
      throw new Error('Analysis result must be a string or object');
    }

    // Clean the result string first - remove markdown code blocks and extra formatting
    let cleanedResult = result.trim();

    // Remove markdown code blocks if present
    if (cleanedResult.startsWith('```json') || cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }

    // Remove any leading/trailing backticks that might remain
    cleanedResult = cleanedResult.replace(/^`+|`+$/g, '').trim();

    try {
      let parsed = JSON.parse(cleanedResult);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const hasSwotField = parsed.strengths || parsed.weaknesses || parsed.opportunities || parsed.threats;
        if (hasSwotField) {
          return parsed;
        } else {
          throw new Error('No SWOT fields found in parsed object');
        }
      } else {
        throw new Error(`Parsed result is not an object (type: ${typeof parsed})`);
      }
    } catch (parseError) {
      console.error('JSON parse failed, trying fallback method:', parseError.message);
      try {
        const extractedResult = {};
        const patterns = {
          strengths: /"strengths":\s*"([^"]*(?:\\.[^"]*)*?)"/s,
          weaknesses: /"weaknesses":\s*"([^"]*(?:\\.[^"]*)*?)"/s,
          opportunities: /"opportunities":\s*"([^"]*(?:\\.[^"]*)*?)"/s,
          threats: /"threats":\s*"([^"]*(?:\\.[^"]*)*?)"/s
        };

        // Use the cleaned result for pattern matching
        for (const [key, pattern] of Object.entries(patterns)) {
          const match = cleanedResult.match(pattern);
          if (match) {
            extractedResult[key] = match[1]
              .replace(/\\"/g, '"')
              .replace(/\s+/g, ' ')
              .trim();
          }
        }

        if (Object.keys(extractedResult).length > 0) {
          return extractedResult;
        } else {
          throw new Error('Fallback extraction failed - no SWOT data found');
        }
      } catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError.message);
        throw new Error(`Failed to parse SWOT analysis: ${parseError.message}`);
      }
    }
  };

  // Save analysis to backend using the API endpoint
  const saveToBackend = async (analysisData) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/conversations/phase-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phase: 'initial',
          analysis_type: 'swot',
          analysis_name: 'SWOT Analysis',
          analysis_data: analysisData,
          business_id: selectedBusinessId,
          metadata: {
            generated_at: new Date().toISOString(),
            business_name: businessName
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save SWOT analysis');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving SWOT analysis to backend:', error);
      throw error;
    }
  };

  const generateSwotAnalysis = async () => {
    if (internalRegenerating || isRegenerating) return;

    try {
      setInternalRegenerating(true);
      setErrorMessage('');
      setAnalysisResult('');

      const questionsArray = [];
      const answersArray = [];

      const sortedQuestions = [...questions].sort((a, b) => (a.order || 0) - (b.order || 0));

      sortedQuestions.forEach(question => {
        const questionId = question._id || question.question_id;
        if (userAnswers[questionId]) {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[questionId])
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          questionsArray.push(cleanQuestion);
          answersArray.push(cleanAnswer);
        }
      });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for SWOT analysis');
      }

      const payload = {
        questions: questionsArray,
        answers: answersArray
      };

      const response = await fetch(`${ML_API_BASE_URL}/find`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`SWOT API returned ${response.status}: ${response.statusText}`);
      }

      const rawText = await response.text();
      let dataToSave = null;

      try {
        const cleanedText = rawText
          .replace(/\\n/g, '\n')
          .replace(/\\\"/g, '"')
          .trim();

        const parsed = JSON.parse(cleanedText);

        if (parsed && typeof parsed === 'object' &&
          (parsed.strengths || parsed.weaknesses || parsed.opportunities || parsed.threats)) {
          dataToSave = cleanedText;
        } else {
          console.warn('SWOT response structure is invalid:', parsed);
          dataToSave = rawText;
        }
      } catch (e) {
        console.warn('SWOT response was not valid JSON, using raw text:', e.message);
        dataToSave = rawText;
      }

      if (dataToSave) {
        // Update local state
        setAnalysisResult(dataToSave);

        // Notify parent component
        if (onDataGenerated) {
          onDataGenerated(dataToSave);
        }

        // Save to backend using the new API
        await saveToBackend(dataToSave);
      }

    } catch (error) {
      console.error('Error generating SWOT analysis:', error);
      setErrorMessage(`Failed to generate analysis: ${error.message}`);
    } finally {
      setInternalRegenerating(false);
    }
  };

  let swotData = null;
  if (analysisResult) {
    try {
      swotData = parseAnalysisResult(analysisResult);
    } catch (error) {
      console.error('Error parsing analysis result:', error);
      setErrorMessage(`Failed to parse analysis data: ${error.message}`);
    }
  }

  // Parse SWOT content into items for table display
  const parseSwotItems = (content) => {
    if (!content) return [];

    const contentStr = String(content).trim();
    const items = contentStr
      .split(/(?<=[.!?])\s+/)
      .filter(item => item.trim().length > 10)
      .map((item, index) => ({
        item: item.trim(),
        id: index + 1
      }));

    return items.length > 0 ? items : [{ item: contentStr, id: 1 }];
  };

  // Get SWOT icon based on type
  const getSwotIcon = (type) => {
    switch (type) {
      case 'strengths': return <TrendingUp size={16} />;
      case 'weaknesses': return <TrendingDown size={16} />;
      case 'opportunities': return <Target size={16} />;
      case 'threats': return <AlertTriangle size={16} />;
      default: return <Zap size={16} />;
    }
  };

  // Get SWOT type color
  const getSwotTypeColor = (type) => {
    switch (type) {
      case 'strengths': return 'high-intensity';
      case 'weaknesses': return 'medium-intensity';
      case 'opportunities': return 'high-intensity';
      case 'threats': return 'low-intensity';
      default: return 'medium-intensity';
    }
  };

  // Determine if we're currently regenerating (either internally or externally)
  const currentlyRegenerating = isRegenerating || internalRegenerating;

  // Loading state
  if (currentlyRegenerating) {
    return (
      <div className="porters-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Regenerating SWOT Analysis...</span>
        </div>
      </div>
    );
  }

  // Error state - using AnalysisError component
  if (errorMessage) {
    return (
      <div className="porters-container">
        <AnalysisError 
          error={errorMessage}
          onRetry={handleRetry}
          title="SWOT Analysis Error"
        />
      </div>
    );
  }

  // Check if data is incomplete and show missing questions checker - only for truly empty data
  if (isSwotDataIncomplete(analysisResult)) {
    return (
      <div className="porters-container">
        <AnalysisEmptyState
          analysisType="swot"
          analysisDisplayName="SWOT Analysis"
          icon={Target}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={currentlyRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          showImproveButton={!hideImproveButton}
        />
      </div>
    );
  }

  // Prepare SWOT data for single table display
  const prepareSwotTableData = () => {
    const tableData = [];

    if (swotData) {
      const swotTypes = [
        { key: 'strengths', label: 'Strengths', data: swotData.strengths },
        { key: 'weaknesses', label: 'Weaknesses', data: swotData.weaknesses },
        { key: 'opportunities', label: 'Opportunities', data: swotData.opportunities },
        { key: 'threats', label: 'Threats', data: swotData.threats }
      ];

      swotTypes.forEach(type => {
        if (type.data) {
          const items = parseSwotItems(type.data);
          items.forEach(item => {
            tableData.push({
              type: type.key,
              label: type.label,
              item: item.item,
              id: item.id
            });
          });
        }
      });
    }

    return tableData;
  };

  const swotTableData = prepareSwotTableData();

  return (
    <div className="porters-container"
      data-analysis-type="swot"
      data-analysis-name="SWOT Analysis"
      data-analysis-order="1">

      {swotData && swotTableData.length > 0 && (
        <div className="section-container">
          {expandedSections.swotAnalysis !== false && (
            <div className="table-container">
              <table className="data-table forces-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {swotTableData.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <div className="force-name">
                          {getSwotIcon(row.type)}
                          <span>{row.label}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getSwotTypeColor(row.type)}`}>
                          {row.label}
                        </span>
                      </td>

                      <td className="implications-cell">
                        {row.item}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SwotAnalysis;