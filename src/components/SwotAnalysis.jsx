import React, { useState, useEffect } from 'react';
import RegenerateButton from './RegenerateButton';
import MissingQuestionsChecker from './MissingQuestionsChecker';
import '../styles/dashboard.css';
import '../styles/analysis-components.css';
import { Target, Loader } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';

const SwotAnalysis = ({
  analysisResult: initialAnalysisResult,
  businessName,
  canRegenerate = true,
  questions,
  userAnswers,
  onDataGenerated,
  saveAnalysisToBackend,
  selectedBusinessId,
  onRedirectToBrief // Add this prop
}) => {
  const { t } = useTranslation();
  const [analysisResult, setAnalysisResult] = useState(initialAnalysisResult);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  // Function to check missing questions and redirect
  const checkMissingQuestionsAndRedirect = async () => {
    try {
      const token = getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/questions/missing-for-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            analysis_type: 'swot',
            business_id: selectedBusinessId
          })
        }
      );

      if (response.ok) {
        const result = await response.json();

        // If there are missing questions, redirect with highlighting
        if (result.missing_count > 0) {
          handleRedirectToBrief(result);
        } else {
          // No missing questions but data is incomplete - user needs to improve their answers
          // Create a custom result to highlight the SWOT question(s)
          const swotQuestions = await fetch(
            `${API_BASE_URL}/api/questions`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          ).then(res => res.json()).then(data =>
            data.questions.filter(q => q.used_for && q.used_for.includes('swot'))
          );

          handleRedirectToBrief({
            missing_count: swotQuestions.length,
            missing_questions: swotQuestions.map(q => ({
              _id: q._id,
              order: q.order,
              question_text: q.question_text,
              objective: q.objective,
              required_info: q.required_info,
              used_for: q.used_for
            })),
            analysis_type: 'swot',
            message: `Please provide more detailed answers for SWOT analysis. The current answers are insufficient to generate meaningful analysis.`,
            is_complete: false,
            keepHighlightLonger: true // Flag to keep highlighting longer
          });
        }
      } else {
        // If API call fails, redirect to review answers
        handleRedirectToBrief({
          missing_count: 0,
          missing_questions: [],
          analysis_type: 'swot',
          message: 'Please review and improve your answers for SWOT analysis.'
        });
      }
    } catch (error) {
      console.error('Error checking missing questions:', error);
      // If error occurs, redirect to review answers
      handleRedirectToBrief({
        missing_count: 0,
        missing_questions: [],
        analysis_type: 'swot',
        message: 'Please review and improve your answers for SWOT analysis.'
      });
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

    try {
      let parsed = JSON.parse(result);
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

        for (const [key, pattern] of Object.entries(patterns)) {
          const match = result.match(pattern);
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
    if (isRegenerating) return;

    try {
      setIsRegenerating(true);
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
      setIsRegenerating(false);
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

  const renderSwotContent = (content, category) => {
    if (!content) {
      return (
        <div className={`analysis-box ${category}-bg`}>
          <em>No {category} identified</em>
        </div>
      );
    }

    const contentStr = String(content).trim();
    const items = contentStr
      .split(/(?<=[.!?])\s+/)
      .filter(item => item.trim().length > 10)
      .map(item => item.trim());

    if (items.length <= 1) {
      return (
        <div className={`analysis-box ${category}-bg`}>
          {contentStr}
        </div>
      );
    }

    return items.map((item, index) => (
      <div key={index} className={`analysis-box ${category}-bg`} style={{ marginBottom: '0.5rem' }}>
        {item}
      </div>
    ));
  };

  // Check if data is incomplete and show missing questions checker - only for truly empty data
  if (!isRegenerating && isSwotDataIncomplete(analysisResult)) {
    return (
      <div className="swot-analysis-container">
        <div className="ln-header">
          <div className="ln-title-section">
            <Target className="ln-icon" size={24} />
            <h2 className="ln-title">{t("SWOT Analysis")}</h2>
          </div>
        </div>
        <AnalysisEmptyState
          analysisType="swot"
          analysisDisplayName="SWOT Analysis"
          icon={Target}
          onImproveAnswers={checkMissingQuestionsAndRedirect}
          onRegenerate={generateSwotAnalysis}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
        />

        <MissingQuestionsChecker
          analysisType="swot"
          analysisData={analysisResult}
          selectedBusinessId={selectedBusinessId}
          onRedirectToBrief={handleRedirectToBrief}
          API_BASE_URL={API_BASE_URL}
          getAuthToken={getAuthToken}
        />
      </div>
    );
  }

  return (
    <div className="swot-analysis-container swot-analysis"
      data-analysis-type="swot"
      data-analysis-name="SWOT Analysis"
      data-analysis-order="1" >
      <div className="ln-header">
        <div className="ln-title-section">
          <Target className="ln-icon" size={24} />
          <h2 className="ln-title">{t("SWOT Analysis")}</h2>
        </div>
        <RegenerateButton
          onRegenerate={generateSwotAnalysis}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="SWOT Analysis"
          size="medium"
        />
      </div>

      {isRegenerating && (
        <div style={{ position: 'relative' }}>
          <div className="table-responsive">
            <table className="table table-bordered table-striped swot-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead className="table-light">
                <tr>
                  <th className="swot-header strengths-bg" style={{ width: '25%' }}>
                    <div className="swot-title">
                      <strong>S</strong>trengths
                    </div>
                  </th>
                  <th className="swot-header weaknesses-bg" style={{ width: '25%' }}>
                    <div className="swot-title">
                      <strong>W</strong>eaknesses
                    </div>
                  </th>
                  <th className="swot-header opportunities-bg" style={{ width: '25%' }}>
                    <div className="swot-title">
                      <strong>O</strong>pportunities
                    </div>
                  </th>
                  <th className="swot-header threats-bg" style={{ width: '25%' }}>
                    <div className="swot-title">
                      <strong>T</strong>hreats
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="swot-cell" style={{ height: '300px', verticalAlign: 'top', opacity: 0.3 }}></td>
                  <td className="swot-cell" style={{ height: '300px', verticalAlign: 'top', opacity: 0.3 }}></td>
                  <td className="swot-cell" style={{ height: '300px', verticalAlign: 'top', opacity: 0.3 }}></td>
                  <td className="swot-cell" style={{ height: '300px', verticalAlign: 'top', opacity: 0.3 }}></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            zIndex: 10,
            minWidth: '300px'
          }}>
            <Loader size={24} className="loading-spinner" style={{
              animation: 'spin 1s linear infinite',
              color: '#4F46E5'
            }} />
            <span style={{
              fontSize: '14px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              {t("Regenerating SWOT analysis...")}
            </span>
          </div>
        </div>
      )}

      {!isRegenerating && swotData && (swotData.strengths || swotData.weaknesses || swotData.opportunities || swotData.threats) ? (
        <div className="table-responsive">
          <table className="table table-bordered table-striped swot-table">
            <thead className="table-light">
              <tr>
                <th className="swot-header strengths-bg">
                  <div className="swot-title">
                    <strong>S</strong>trengths
                  </div>
                </th>
                <th className="swot-header weaknesses-bg">
                  <div className="swot-title">
                    <strong>W</strong>eaknesses
                  </div>
                </th>
                <th className="swot-header opportunities-bg">
                  <div className="swot-title">
                    <strong>O</strong>pportunities
                  </div>
                </th>
                <th className="swot-header threats-bg">
                  <div className="swot-title">
                    <strong>T</strong>hreats
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="swot-cell">
                  {renderSwotContent(swotData.strengths, 'strengths')}
                </td>
                <td className="swot-cell">
                  {renderSwotContent(swotData.weaknesses, 'weaknesses')}
                </td>
                <td className="swot-cell">
                  {renderSwotContent(swotData.opportunities, 'opportunities')}
                </td>
                <td className="swot-cell">
                  {renderSwotContent(swotData.threats, 'threats')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : !isRegenerating && errorMessage ? (
        <div className="alert alert-danger" style={{ margin: '1rem', padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '8px' }}>
          <h6>Error Parsing SWOT Data</h6>
          <p>{errorMessage}</p>
          <details style={{ marginTop: '0.5rem' }}>
            <summary style={{ cursor: 'pointer' }}>Show raw data</summary>
            <pre style={{
              background: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              fontSize: '12px',
              maxHeight: '200px',
              overflow: 'auto',
              marginTop: '0.5rem'
            }}>
              {typeof analysisResult === 'string' ? analysisResult : JSON.stringify(analysisResult, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}
    </div>
  );
};

export default SwotAnalysis;