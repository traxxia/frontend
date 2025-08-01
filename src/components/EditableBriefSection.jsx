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
  
  // NEW: Add refs to prevent multiple API calls
  const isRegeneratingRef = useRef(false);
  const pendingRegenerationRef = useRef(false);
  const regenerationTimeoutRef = useRef(null);
  
  const { t } = useTranslation();
  
  const inputRefs = useRef({});
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  useEffect(() => {
    if (questions.length > 0 && Object.keys(userAnswers).length > 0) {
      generateBriefFields();
    }
  }, [questions, userAnswers]);

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

  // FIXED: Debounced analysis regeneration to prevent multiple calls
  const debouncedAnalysisRegeneration = () => {
    // Clear any existing timeout
    if (regenerationTimeoutRef.current) {
      clearTimeout(regenerationTimeoutRef.current);
    }
    
    // Set pending flag
    pendingRegenerationRef.current = true;
    
    // Set new timeout for regeneration
    regenerationTimeoutRef.current = setTimeout(() => {
      if (pendingRegenerationRef.current && !isRegeneratingRef.current && completedPhases.has('initial')) {
        triggerAnalysisRegeneration();
      }
      pendingRegenerationRef.current = false;
    }, 1000); // Wait 1 second after the last edit before regenerating
  };

  // FIXED: Single analysis regeneration function
  const triggerAnalysisRegeneration = async () => {
    if (isRegeneratingRef.current) {
      console.log('📊 [EditableBriefSection] Analysis regeneration already in progress, skipping');
      return;
    }

    try {
      isRegeneratingRef.current = true;
      console.log('📊 [EditableBriefSection] Triggering analysis regeneration');
      
      showToastMessage('Regenerating analysis with updated answers...', 'info');
      
      // Use parent's regeneration callback instead of doing it here
      if (onAnalysisRegenerate) {
        await onAnalysisRegenerate();
      }
      
      showToastMessage('Analysis regenerated successfully!', 'success');
      
    } catch (error) {
      console.error('📊 [EditableBriefSection] Error regenerating analysis:', error);
      showToastMessage('Failed to regenerate analysis. Please try again.', 'error');
    } finally {
      isRegeneratingRef.current = false;
      pendingRegenerationRef.current = false;
    }
  };

  // Auto-save updated answer using simplified backend API
  const autoSaveUpdatedAnswer = async (questionId, newAnswer) => {
    try {
      setIsSaving(true);
      const token = getAuthToken();

      // Find the question text
      const question = questions.find(q => q.question_id === questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      // Use the save-answer endpoint from the simplified backend
      const response = await fetch(`${API_BASE_URL}/api/user/save-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: questionId,
          question_text: question.question_text,
          answer_text: newAnswer.trim(),
          is_followup: false,
          followup_parent_id: null
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 [EditableBriefSection] Answer updated successfully:', result);
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save updated answer');
      }
    } catch (error) {
      console.error('📊 [EditableBriefSection] Auto-save updated answer error:', error);
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
        // Auto-save to backend using simplified API
        await autoSaveUpdatedAnswer(field.questionId, newValue.trim());

        // Update parent component with new answer
        if (onAnswerUpdate) {
          onAnswerUpdate(field.questionId, newValue.trim());
        }

        setEditedFields(prev => new Set([...prev, field.key]));
        
        showToastMessage('Answer updated and auto-saved successfully!', 'success');

        // FIXED: Use debounced regeneration instead of immediate call
        if (completedPhases.has('initial')) {
          debouncedAnalysisRegeneration();
        }

      } catch (error) {
        console.error('📊 [EditableBriefSection] Error updating answer:', error);
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (regenerationTimeoutRef.current) {
        clearTimeout(regenerationTimeoutRef.current);
      }
    };
  }, []);

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

      {(isAnalysisRegenerating || isSaving || pendingRegenerationRef.current) && (
        <div className="analysis-regenerating-banner">
          <Loader size={16} className="spinner" />
          <span>
            {isAnalysisRegenerating && 'Regenerating analysis with updated answers...'}
            {isSaving && 'Auto-saving changes...'}
            {pendingRegenerationRef.current && !isAnalysisRegenerating && 'Preparing to regenerate analysis...'}
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