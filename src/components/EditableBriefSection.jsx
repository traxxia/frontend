import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X, Loader } from 'lucide-react';

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
      const question = questions.find(q => q.id === parseInt(questionId));
      const answer = userAnswers[questionId];
      
      if (question && answer && answer.trim()) {
        fields.push({
          key: `question_${questionId}`,
          label: question.question,
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

  // Auto-save updated answer to conversation
  const autoSaveUpdatedAnswer = async (questionId, newAnswer) => {
    try {
      setIsSaving(true);
      const token = getAuthToken();

      // Get current conversation session
      const currentResponse = await fetch(`${API_BASE_URL}/api/conversation/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!currentResponse.ok) {
        throw new Error('Failed to get current conversation');
      }

      const conversation = await currentResponse.json();
      const sessionId = conversation.sessionId;

      if (!sessionId) {
        throw new Error('No active conversation session found');
      }

      // Finalize the updated answer
      const response = await fetch(`${API_BASE_URL}/api/conversation/finalize-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          questionId: questionId,
          finalAnswer: newAnswer.trim(),
          attemptCount: 1 // This is an edit, so reset attempt count
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
        throw new Error('Failed to save updated answer');
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
        // Auto-save to conversation
        await autoSaveUpdatedAnswer(field.questionId, newValue.trim());

        // Update parent component with new answer
        if (onAnswerUpdate) {
          onAnswerUpdate(field.questionId, newValue.trim());
        }

        setEditedFields(prev => new Set([...prev, field.key]));
        
        // Show success message
        showToastMessage('Answer updated and auto-saved successfully!', 'success');

        // Check if initial phase is completed and trigger analysis regeneration
        if (completedPhases.has('initial') && onAnalysisRegenerate) {
          showToastMessage('Regenerating analysis with updated answers...', 'info');
          
          // Trigger analysis regeneration
          setTimeout(() => {
            onAnalysisRegenerate();
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
              <p>Your business information will appear here as you answer questions in the chat.</p>
            </div>
          )}
        </div>
        
        {briefFields.length > 0 && (
          <div className="brief-footer">
            <p className="brief-note">
              💡 Fields are automatically generated from your chat responses. Click any field to edit.
              {completedPhases.has('initial') && (
                <>
                  <br />
                  <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                    ⚡ Changes are auto-saved and analysis will regenerate automatically.
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