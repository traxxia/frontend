import React, { useState } from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';

const MissingQuestionsChecker = ({
  analysisType,
  analysisData,
  selectedBusinessId,
  onRedirectToBrief,
  API_BASE_URL,
  getAuthToken
}) => {
  const [missingQuestions, setMissingQuestions] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // Check for missing questions when analysis data is null/empty
  const checkMissingQuestions = async () => {
    if (!analysisType || !selectedBusinessId) return;

    try {
      setIsChecking(true);
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
            analysis_type: analysisType,
            business_id: selectedBusinessId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check missing questions');
      }

      const result = await response.json();
      setMissingQuestions(result);
    } catch (error) {
      console.error('Error checking missing questions:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Handle redirect to brief section
  const handleRedirectToBrief = () => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestions);
    }
  };

  // Check if analysis data is empty or null
  const isAnalysisEmpty = () => {
    if (!analysisData) return true;
    
    // Handle different data structures
    if (typeof analysisData === 'string') {
      return analysisData.trim() === '';
    }
    
    if (typeof analysisData === 'object') {
      return Object.keys(analysisData).length === 0;
    }
    
    return false;
  };

  // Auto-check when component mounts and analysis is empty
  React.useEffect(() => {
    if (isAnalysisEmpty() && !missingQuestions && !isChecking) {
      checkMissingQuestions();
    }
  }, [analysisData, analysisType, selectedBusinessId]);

  // Don't render if analysis has data
  if (!isAnalysisEmpty()) {
    return null;
  }

  return (
    <div className="missing-questions-checker" style={{
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <AlertCircle 
          size={20} 
          style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }} 
        />
        
        <div style={{ flex: 1 }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            color: '#92400e',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {analysisType ? `${analysisType.toUpperCase()} Analysis Unavailable` : 'Analysis Unavailable'}
          </h4>
          
          {isChecking ? (
            <p style={{ margin: '0', color: '#92400e', fontSize: '13px' }}>
              Checking required questions...
            </p>
          ) : missingQuestions ? (
            <div>
              <p style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: '13px' }}>
                {missingQuestions.missing_count > 0 
                  ? `Please answer ${missingQuestions.missing_count} more question${missingQuestions.missing_count > 1 ? 's' : ''} to generate this analysis.`
                  : 'All required questions are answered. Please try regenerating the analysis.'
                }
              </p>
              
              {missingQuestions.missing_count > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#92400e',
                    fontWeight: '500',
                    marginBottom: '6px'
                  }}>
                    Missing Questions:
                  </div>
                  <div style={{ fontSize: '12px', color: '#92400e' }}>
                    Questions {missingQuestions.missing_questions.map(q => q.order).join(', ')}
                  </div>
                </div>
              )}
              
              <button
                onClick={handleRedirectToBrief}
                style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Go to Questions
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: '13px' }}>
                This analysis requires more information to generate results.
              </p>
              
              <button
                onClick={checkMissingQuestions}
                style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Check Required Questions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MissingQuestionsChecker;