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
  const checkMissingQuestions = async () => {
    if (!analysisType || !selectedBusinessId) return;
    try {
      setIsChecking(true);
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/questions/missing-for-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysis_type: analysisType,
          business_id: selectedBusinessId
        })
      });
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
  const handleRedirectToBrief = () => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestions);
    }
  };
  const isAnalysisEmpty = () => {
    if (!analysisData) return true;
    if (typeof analysisData === 'string') {
      return analysisData.trim() === '';
    }
    if (typeof analysisData === 'object') {
      return Object.keys(analysisData).length === 0;
    }
    return false;
  };
  React.useEffect(() => {
    if (isAnalysisEmpty() && !missingQuestions && !isChecking) {
      checkMissingQuestions();
    }
  }, [analysisData, analysisType, selectedBusinessId]);
  if (!isAnalysisEmpty()) {
    return null;
  }
  return <div className="missing-questions-checker missing-questions-checker--s1">
      <div className="missing-questions-checker--s2">
        <AlertCircle size={20} className="missing-questions-checker--s3" />

        <div className="missing-questions-checker--s4">
          <h4 className="missing-questions-checker--s5">
            {analysisType ? `${analysisType.toUpperCase()} Analysis Unavailable` : 'Analysis Unavailable'}
          </h4>

          {isChecking ? <p className="missing-questions-checker--s6">
              Checking required questions...
            </p> : missingQuestions ? <div>
              <p className="missing-questions-checker--s7">
                {missingQuestions.missing_count > 0 ? `Please answer ${missingQuestions.missing_count} more question${missingQuestions.missing_count > 1 ? 's' : ''} to generate this analysis.` : 'All required questions are answered. Please try regenerating the analysis.'}
              </p>

              {missingQuestions.missing_count > 0 && <div className="missing-questions-checker--s8">
                  <div className="missing-questions-checker--s9">
                    Missing Questions:
                  </div>
                  <div className="missing-questions-checker--s10">
                    Questions {missingQuestions.missing_questions.map(q => q.order).join(', ')}
                  </div>
                </div>}

              <button onClick={handleRedirectToBrief} className="missing-questions-checker--s11">
                Go to Questions
                <ChevronRight size={14} />
              </button>
            </div> : <div>
              <p className="missing-questions-checker--s7">
                This analysis requires more information to generate results.
              </p>

              <button onClick={checkMissingQuestions} className="missing-questions-checker--s12">
                Check Required Questions
              </button>
            </div>}
        </div>
      </div>
    </div>;
};
export default MissingQuestionsChecker;