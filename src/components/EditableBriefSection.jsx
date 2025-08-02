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
  const [allAnswers, setAllAnswers] = useState({}); // Store both main and follow-up answers
  
  // Add refs to prevent multiple API calls
  const isRegeneratingRef = useRef(false);
  const pendingRegenerationRef = useRef(false);
  const regenerationTimeoutRef = useRef(null);
  
  const { t } = useTranslation();
  
  const inputRefs = useRef({});
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  // FIXED: Load both main answers and follow-up answers
  useEffect(() => {
    loadAllAnswers();
  }, [userAnswers]);

  useEffect(() => { 
    if (questions.length > 0 && Object.keys(allAnswers).length > 0) {
      generateBriefFields();
    }
  }, [questions, allAnswers]);

  // FIXED: Fetch all user progress including follow-ups
  const loadAllAnswers = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/user/conversation-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Combine main answers with follow-up answers
        const combinedAnswers = { ...userAnswers };
        
        // Process conversation history to extract follow-up answers
        if (data.conversation_history) {
          data.conversation_history.forEach(conversation => {
            const questionId = String(conversation.question_id);
            
            // Add main answer if exists
            if (conversation.main_answer) {
              combinedAnswers[questionId] = conversation.main_answer.answer_text;
            }
            
            // Add follow-up answers if they exist
            if (conversation.followup_answers && conversation.followup_answers.length > 0) {
              conversation.followup_answers.forEach((followup, index) => {
                const followupKey = `${questionId}_followup_${index + 1}`;
                combinedAnswers[followupKey] = followup.answer_text;
              });
            }
          });
        } 
        setAllAnswers(combinedAnswers);
        
      } else {
        console.error('Failed to load conversation history');
        // Fallback to just userAnswers
        setAllAnswers(userAnswers);
      }
    } catch (error) {
      console.error('Error loading all answers:', error);
      // Fallback to just userAnswers
      setAllAnswers(userAnswers);
    }
  };

  // FIXED: Combine main answers with follow-up answers under the same question
  const generateBriefFields = () => { 
    const fields = [];
    const questionAnswers = {}; // Group answers by question
 
    // First, group all answers by question ID
    Object.keys(allAnswers).forEach(answerKey => { 
      let questionId = answerKey;
      let isFollowUp = false;
      let followupNumber = null;
      
      // Check if this is a follow-up answer
      if (answerKey.includes('_followup_')) {
        const parts = answerKey.split('_followup_');
        questionId = parts[0];
        followupNumber = parseInt(parts[1]);
        isFollowUp = true;
      }
      
      if (!questionAnswers[questionId]) {
        questionAnswers[questionId] = {
          mainAnswer: null,
          followupAnswers: [],
          originalKeys: {}
        };
      }
      
      const answer = allAnswers[answerKey];
      if (answer && answer.trim()) {
        if (isFollowUp) {
          questionAnswers[questionId].followupAnswers.push({
            text: answer,
            number: followupNumber,
            originalKey: answerKey
          });
        } else {
          questionAnswers[questionId].mainAnswer = answer;
          questionAnswers[questionId].originalKeys.main = answerKey;
        }
      }
    });

    // Now create fields with combined answers
    Object.keys(questionAnswers).forEach(questionId => {
      const questionData = questionAnswers[questionId];
      
      // Skip if no main answer
      if (!questionData.mainAnswer) return;
      
      // FIXED: Handle both MongoDB ObjectIds and integer IDs
      const question = questions.find(q => {
        const qId = q._id || q.question_id;
        const qIdStr = String(qId);
        const questionIdStr = String(questionId);
        
        // Try exact string match first (for MongoDB ObjectIds)
        if (qIdStr === questionIdStr) {
          return true;
        }
        
        // Try integer match (for backward compatibility)
        if (q.question_id && q.question_id === parseInt(questionId)) {
          return true;
        }
        
        // Try partial match for shortened IDs
        if (questionIdStr.length >= 3 && qIdStr.startsWith(questionIdStr)) {
          return true;
        }
        
        return false;
      });
      
      if (question) {
        const actualQuestionId = question._id || question.question_id;
        
        // Combine main answer with follow-up answers
        let combinedAnswer = questionData.mainAnswer;
        
        if (questionData.followupAnswers.length > 0) {
          // Sort follow-ups by number
          questionData.followupAnswers.sort((a, b) => (a.number || 0) - (b.number || 0));
          
          // Append follow-ups to main answer
          questionData.followupAnswers.forEach(followup => {
            combinedAnswer += `. ${followup.text}`;
          });
        }
        
        fields.push({
          key: `question_${questionId}`,
          label: question.question_text,
          value: combinedAnswer,
          questionId: actualQuestionId,
          originalAnswerKey: questionData.originalKeys.main, // Main answer key for updates
          isFollowUp: false, // This is now a combined field, not a follow-up
          originalQuestionText: question.question_text,
          hasFollowups: questionData.followupAnswers.length > 0,
          followupCount: questionData.followupAnswers.length
        });
      }
    });

    // Sort by question order
    fields.sort((a, b) => {
      const aIndex = questions.findIndex(q => (q._id || q.question_id) === a.questionId);
      const bIndex = questions.findIndex(q => (q._id || q.question_id) === b.questionId);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // Fallback to string comparison
      return String(a.questionId).localeCompare(String(b.questionId));
    });                   
    
    setBriefFields(fields);
  };

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };
  
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

  // Single analysis regeneration function
  const triggerAnalysisRegeneration = async () => {
    if (isRegeneratingRef.current) { 
      return;
    }

    try {
      isRegeneratingRef.current = true; 
      
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

  // FIXED: Auto-save updated answer with proper ID handling for both main and follow-up answers
  const autoSaveUpdatedAnswer = async (field, newAnswer) => {
    try {
      setIsSaving(true);
      const token = getAuthToken();

      // Find the question using both MongoDB ObjectId and integer ID
      const question = questions.find(q => {
        const qId = q._id || q.question_id;
        const qIdStr = String(qId);
        const questionIdStr = String(field.questionId);
        
        return qIdStr === questionIdStr || (q.question_id && q.question_id === parseInt(field.questionId));
      });
      
      if (!question) {
        console.error('Question not found for ID:', field.questionId); 
        throw new Error('Question not found');
      }

      // Use the actual question ID from the found question (prefer _id for MongoDB)
      const actualQuestionId = question._id || question.question_id;
      
      // For follow-ups, we need to save with the follow-up question text, not the original
      // But for now, we'll use the original question text and mark it as follow-up
      const questionText = field.isFollowUp ? 
        `${question.question_text} (Follow-up ${field.followupNumber})` : 
        question.question_text;

      // Use the save-answer endpoint
      const response = await fetch(`${API_BASE_URL}/api/user/save-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: actualQuestionId,
          question_text: questionText,
          answer_text: newAnswer.trim(),
          is_followup: field.isFollowUp || false,
          followup_parent_id: field.isFollowUp ? actualQuestionId : null
        })
      });

      if (response.ok) {
        const result = await response.json(); 
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
        // Auto-save to backend
        await autoSaveUpdatedAnswer(field, newValue.trim());

        // Update local state
        setAllAnswers(prev => ({
          ...prev,
          [field.originalAnswerKey]: newValue.trim()
        }));

        // Update parent component with new answer for main answers only
        if (onAnswerUpdate && !field.isFollowUp) {
          onAnswerUpdate(field.originalAnswerKey, newValue.trim());
        }

        setEditedFields(prev => new Set([...prev, field.key]));
        
        const messageType = field.isFollowUp ? 'Follow-up answer' : 'Answer';
        showToastMessage(`${messageType} updated and auto-saved successfully!`, 'success');

        // Use debounced regeneration instead of immediate call
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
      <div className={`brief-item ${isEdited ? 'edited' : ''} ${field.hasFollowups ? 'has-followups' : ''}`}>
        <div className="item-row">
          <span className="item-label">
            {field.label}             
          </span>
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
                minHeight: field.hasFollowups ? '150px' : '100px',
                maxHeight: '300px',
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
          <div 
            className={`item-text ${isEmpty ? 'placeholder' : ''}`}
            onClick={() => !(isAnalysisRegenerating || isSaving) && handleEdit(field)}
            style={{ cursor: (isAnalysisRegenerating || isSaving) ? 'not-allowed' : 'pointer' }}
          >
            {field.value ? (
              <div className="answer-content">
                {field.value.split('\n\nAdditional details: ').map((part, index) => (
                  <div key={index} className={index === 0 ? 'main-answer' : 'followup-detail'}>
                    {index > 0 && <strong className="detail-label">Additional details: </strong>}
                    {part}
                  </div>
                ))}
              </div>
            ) : (
              `Add ${field.label.toLowerCase()}...`
            )}
            {isEdited && <span className="edited-indicator"> ✏️</span>}
          </div>
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
              <p>{t('businessInfoMessage') || 'Your business information will appear here as you answer questions in the chat.'}</p>
              
              {/* DEBUG: Show debug info only if there are answers but no fields generated */}
              {process.env.NODE_ENV === 'development' && Object.keys(allAnswers).length > 0 && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  backgroundColor: '#f5f5f5', 
                  fontSize: '12px',
                  borderRadius: '4px'
                }}>
                  <strong>Debug Info (answers exist but no fields generated):</strong>
                  <br />Questions: {questions.length}
                  <br />All Answers: {Object.keys(allAnswers).length}
                  <br />User Answers: {Object.keys(userAnswers).length}
                  <br />Questions IDs: {questions.map(q => q._id || q.question_id).join(', ')}
                  <br />All Answer Keys: {Object.keys(allAnswers).join(', ')}
                  <br />User Answer Keys: {Object.keys(userAnswers).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
        
        {briefFields.length > 0 && (
          <div className="brief-footer">
            <p className="brief-note">
              {t('briefNote') || 'Click on any field to edit your business information.'}
              {completedPhases.has('initial') && (
                <>
                  <br />
                  <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                    {t('briefNoteRegenerate') || 'Analysis will be automatically regenerated when you update answers.'}
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