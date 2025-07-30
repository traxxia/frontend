import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X, Loader } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";

const EditableBriefSection = ({ 
  questions = [], 
  userAnswers = {}, 
  onAnswerUpdate,
  onBusinessDataUpdate,
  onAnalysisRegenerate,
  isAnalysisRegenerating = false,
  completedPhases = new Set() 
}) => {
  const [editingField, setEditingField] = useState(null);
  const [briefFields, setBriefFields] = useState([]);
  const [editedFields, setEditedFields] = useState(new Set());
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const { t } = useTranslation();
  
  const inputRefs = useRef({});
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const getAuthToken = () => sessionStorage.getItem('token');

  useEffect(() => {
    if (questions.length > 0 && Object.keys(userAnswers).length > 0) {
      generateBriefFields();
    }
  }, [questions, userAnswers]);

  // Get current session on component mount
  useEffect(() => {
    getCurrentSession();
  }, []);

  const getCurrentSession = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/user/start-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSessionId(result.session.session_id);
      }
    } catch (error) {
      console.error('Error getting session:', error);
    }
  };

  const generateBriefFields = () => {
    const fields = [];
 
    Object.keys(userAnswers).forEach(questionId => {
      const question = questions.find(q => q.question_id === parseInt(questionId));
      const answer = userAnswers[questionId];
      
      if (question && answer && answer.trim()) {
        fields.push({
          key: `question_${questionId}`,
          label: question.question_text,
          value: answer,
          questionId: parseInt(questionId)
        });
      }
    });

    fields.sort((a, b) => a.questionId - b.questionId);
    setBriefFields(fields);
  };

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Generate new analysis with updated answers
  const regenerateAnalysisWithUpdatedAnswers = async () => {
    try {
      showToastMessage('Regenerating analysis with updated answers...', 'info');

      const questionsArray = [];
      const answersArray = [];

      const sortedQuestions = [...questions].sort((a, b) => a.question_id - b.question_id);

      sortedQuestions.forEach(question => {
        if (userAnswers[question.question_id]) {
          const cleanQuestion = String(question.question_text)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[question.question_id])
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
        throw new Error('No answered questions available for analysis');
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

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `ML API returned ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.detail) {
            errorMessage = `API Error: ${errorData.detail}`;
          }
        } catch (e) {
          errorMessage = `API Error: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = responseText;
      }

      let analysisContent;
      if (typeof result === 'object' && result !== null) {
        analysisContent = JSON.stringify(result);
      } else {
        analysisContent = String(result);
      }

      if (analysisContent) {
        // Save the updated analysis to backend
        await saveAnalysisToBackend(analysisContent, 'swot');
        showToastMessage('Analysis regenerated successfully with updated answers!', 'success');
        
        // Trigger the parent component's regeneration callback if provided
        if (onAnalysisRegenerate) {
          onAnalysisRegenerate();
        }
      } else {
        throw new Error('Empty or invalid response from analysis API');
      }

    } catch (error) {
      console.error('Error regenerating analysis:', error);
      showToastMessage('Failed to regenerate analysis. Please try again.', 'error');
    }
  };

  // Save analysis to backend
  const saveAnalysisToBackend = async (analysisData, analysisType = 'swot') => {
    try {
      const token = getAuthToken();

      if (!sessionId) {
        throw new Error('No active session found');
      }

      // Note: This endpoint might need to be updated based on the new backend structure
      const response = await fetch(`${API_BASE_URL}/api/analysis/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          analysisType: analysisType,
          analysisData: analysisData,
          businessName: 'Updated Business Analysis'
        })
      });

      if (response.ok) {
        console.log(`📊 ${analysisType} analysis saved to backend after update`);
        return true;
      } else {
        console.error(`Failed to save ${analysisType} analysis:`, response.statusText);
        return false;
      }
    } catch (error) {
      console.error(`Error saving ${analysisType} analysis:`, error);
      return false;
    }
  };

  // Auto-save updated answer using new backend API
  const autoSaveUpdatedAnswer = async (questionId, newAnswer) => {
    try {
      setIsSaving(true);
      const token = getAuthToken();

      if (!sessionId) {
        throw new Error('No active session found');
      }

      // Submit answer using the new backend API
      const response = await fetch(`${API_BASE_URL}/api/user/submit-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: questionId,
          answer_text: newAnswer.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update business data if available
        if (result.businessData && onBusinessDataUpdate) {
          onBusinessDataUpdate(result.businessData);
        }

        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save updated answer');
      }
    } catch (error) {
      console.error('Auto-save updated answer error:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (field) => {
    setEditingField(field.key);
    
    setTimeout(() => {
      const input = inputRefs.current[field.key];
      if (input) {
        input.focus({ preventScroll: true });
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 50);
  };

  const handleSave = async (field) => {
    const input = inputRefs.current[field.key];
    const newValue = input?.value || '';
    
    if (newValue.trim()) {
      try {
        // Auto-save to conversation using new backend API
        await autoSaveUpdatedAnswer(field.questionId, newValue.trim());

        // Update parent component with new answer
        if (onAnswerUpdate) {
          onAnswerUpdate(field.questionId, newValue.trim());
        }

        setEditedFields(prev => new Set([...prev, field.key]));
        
        // Show success message
        showToastMessage('Answer updated and auto-saved successfully!', 'success');

        // Check if initial phase is completed and trigger analysis regeneration
        if (completedPhases.has('initial')) {
          // Trigger analysis regeneration with updated answers
          setTimeout(() => {
            regenerateAnalysisWithUpdatedAnswers();
          }, 500);
        }

      } catch (error) {
        console.error('Error updating answer:', error);
        showToastMessage('Failed to update answer. Please try again.', 'error');
      }
    }
    
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  const handleKeyPress = (e, field) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const EditableField = ({ field }) => {
    const isEditing = editingField === field.key;
    const isEmpty = !field.value || field.value.trim() === '';
    const isEdited = editedFields.has(field.key);

    return (
      <div className={`brief-item ${isEdited ? 'edited' : ''}`}>
        <div className="item-row">
          <span className="item-label">{field.label}:</span>
          {!isEditing && (
            <button
              className="edit-button"
              onClick={() => handleEdit(field)}
              type="button"
              disabled={isAnalysisRegenerating || isSaving}
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="edit-container">
            <textarea
              ref={el => {
                if (el) inputRefs.current[field.key] = el;
              }}
              className="edit-textarea"
              defaultValue={field.value || ''}
              onKeyDown={(e) => handleKeyPress(e, field)}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              disabled={isAnalysisRegenerating || isSaving}
              style={{ 
                minHeight: '100px',
                maxHeight: '200px',
                resize: 'vertical'
              }}
            />
            <div className="edit-actions">
              <button
                className="save-button"
                onClick={() => handleSave(field)}
                type="button"
                disabled={isAnalysisRegenerating || isSaving}
              >
                {(isAnalysisRegenerating || isSaving) ? <Loader size={14} className="spinner" /> : <Check size={14} />}
              </button>
              <button
                className="cancel-button"
                onClick={handleCancel}
                type="button"
                disabled={isAnalysisRegenerating || isSaving}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <p 
            className={`item-text ${isEmpty ? 'placeholder' : ''}`}
            onClick={() => !(isAnalysisRegenerating || isSaving) && handleEdit(field)}
            style={{ cursor: (isAnalysisRegenerating || isSaving) ? 'not-allowed' : 'pointer' }}
          >
            {field.value || `Add ${field.label.toLowerCase()}...`}
            {isEdited && <span className="edited-indicator"> ✏️</span>}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="brief-section">
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      {(isAnalysisRegenerating || isSaving) && (
        <div className="analysis-regenerating-banner">
          <Loader size={16} className="spinner" />
          <span>
            {isAnalysisRegenerating && 'Regenerating analysis with updated answers...'}
            {isSaving && 'Auto-saving changes...'}
          </span>
        </div>
      )}

      <div className="brief-content"> 
        <div className="brief-list">
          {briefFields.length > 0 ? (
            briefFields.map((field) => (
              <EditableField key={field.key} field={field} />
            ))
          ) : (
            <div className="no-data">
              <p>{t('businessInfoMessage')}</p>
            </div>
          )}
        </div>
        
        {briefFields.length > 0 && (
          <div className="brief-footer">
            <p className="brief-note">
              {t('briefNote')}
              {completedPhases.has('initial') && (
                <>
                  <br />
                  <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                    {t('briefNoteRegenerate')} Analysis will be automatically regenerated when you update answers.
                  </span>
                </>
              )}
            </p>
          </div>
        )}
      </div> 
    </div>
  );
};

export default EditableBriefSection;