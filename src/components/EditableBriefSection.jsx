import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X, Loader } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";

const EditableBriefSection = ({
  questions = [],
  userAnswers = {},
  onAnswerUpdate,
  onBusinessDataUpdate,
  onAnalysisRegenerate,
  isEssentialPhaseGenerating = false,
  isAnalysisRegenerating = false,
  selectedBusinessId,
}) => {
  const [editingField, setEditingField] = useState(null);
  const [briefFields, setBriefFields] = useState([]);
  const [editedFields, setEditedFields] = useState(new Set());
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef({});
  const { t } = useTranslation();

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  // Generate brief fields when questions or answers change
  useEffect(() => {
    if (questions.length > 0 && Object.keys(userAnswers).length > 0) {
      generateBriefFields();
    }
  }, [questions, userAnswers]);

  const generateBriefFields = () => {
    const fields = [];
    const sortedQuestions = [...questions].sort((a, b) => (a.order || 0) - (b.order || 0));

    sortedQuestions.forEach(question => {
      const qId = question._id || question.question_id;
      const answer = userAnswers[qId];

      if (answer && answer.trim()) {
        fields.push({
          key: `question_${qId}`,
          label: question.question_text,
          value: answer,
          questionId: qId,
          phase: question.phase,
          severity: question.severity
        });
      }
    });

    setBriefFields(fields);
  };

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const updateConversationAnswer = async (field, newAnswer) => {
    try {
      setIsSaving(true);
      const token = getAuthToken();

      const question = questions.find(q => {
        const qId = q._id || q.question_id;
        return String(qId) === String(field.questionId);
      });

      if (!question) throw new Error('Question not found');

      // Use the existing POST endpoint with edit metadata
      const response = await fetch(`${API_BASE_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: question._id || question.question_id,
          answer_text: newAnswer.trim(),
          is_followup: false,
          business_id: selectedBusinessId || null,
          is_complete: true,
          metadata: {
            from_editable_brief: true,
            timestamp: new Date().toISOString(),
            is_edit: true
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update answer');
      }

      return await response.json();
    } catch (error) {
      console.error('Update conversation error:', error);
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
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 50);
  };

  const handleSave = async (field) => {
    const input = inputRefs.current[field.key];
    const newValue = input?.value || '';

    if (newValue.trim()) {
      try {
        // Update the conversation in backend
        await updateConversationAnswer(field, newValue.trim());

        // Update local state immediately
        if (onAnswerUpdate) {
          onAnswerUpdate(field.questionId, newValue.trim());
        }

        setEditedFields(prev => new Set([...prev, field.key]));
        showToastMessage('Answer updated and saved!', 'success');

        // Trigger analysis regeneration with the updated answer - PASS THE UPDATED ANSWER
        if (onAnalysisRegenerate) {
          setTimeout(() => {
            onAnalysisRegenerate(field.questionId, newValue.trim()); // Pass questionId and updated answer
          }, 300);
        }

      } catch (error) {
        showToastMessage('Failed to update answer', 'error');
        console.error('Save error:', error);
      }
    }

    setEditingField(null);
  };

  const handleCancel = () => setEditingField(null);

  const EditableField = ({ field }) => {
  const isEditing = editingField === field.key;
  const isEdited = editedFields.has(field.key);

  return (
    <div className={`brief-item ${isEdited ? 'edited' : ''}`}>
      <div className="item-row">
        <span className="item-label">
          {field.label}
          {field.phase === 'initial' && field.severity === 'mandatory' && (
            <span className="required-indicator" title="Required for analysis">*</span>
          )}
        </span>
        {!isEditing && (
          <button
            className="edit-button"
            onClick={() => handleEdit(field)}
            type="button"
            disabled={isAnalysisRegenerating || isSaving || isEssentialPhaseGenerating} // FIX: Add isEssentialPhaseGenerating
            title="Edit answer"
          >
            <Edit3 size={14} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="edit-container">
          <textarea
            ref={el => inputRefs.current[field.key] = el}
            className="edit-textarea"
            defaultValue={field.value}
            disabled={isAnalysisRegenerating || isSaving || isEssentialPhaseGenerating} // FIX: Add isEssentialPhaseGenerating
            style={{ minHeight: '100px', resize: 'vertical' }}
            placeholder={`Enter your answer for: ${field.label}`}
          />
          <div className="edit-actions">
            <button
              onClick={() => handleSave(field)}
              disabled={isAnalysisRegenerating || isSaving || isEssentialPhaseGenerating} // FIX: Add isEssentialPhaseGenerating
              className="save-button"
              title="Save changes"
            >
              {isSaving ? <Loader size={14} className="spinner" /> : <Check size={14} />}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving || isEssentialPhaseGenerating} // FIX: Add isEssentialPhaseGenerating
              className="cancel-button"
              title="Cancel changes"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className="item-text"
          onClick={() => !(isSaving || isEssentialPhaseGenerating) && handleEdit(field)} // FIX: Add isEssentialPhaseGenerating
          style={{ cursor: (isSaving || isEssentialPhaseGenerating) ? 'not-allowed' : 'pointer' }} // FIX: Add isEssentialPhaseGenerating
        >
          {field.value || `Add ${field.label.toLowerCase()}...`}
          {isEdited && <span className="edited-indicator" title="Modified"> ✏️</span>}
        </div>
      )}
    </div>
  );
};

  // Calculate completion stats
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(userAnswers).filter(key => userAnswers[key] && userAnswers[key].trim()).length;

  const initialQuestions = questions.filter(q => q.phase === 'initial' && q.severity === 'mandatory');
  const essentialQuestions = questions.filter(q => q.phase === 'essential'); // All essential questions

  const completedInitialQuestions = initialQuestions.filter(q => {
    const qId = q._id || q.question_id;
    return userAnswers[qId] && userAnswers[qId].trim();
  });

  const completedEssentialQuestions = essentialQuestions.filter(q => {
    const qId = q._id || q.question_id;
    return userAnswers[qId] && userAnswers[qId].trim();
  });

  const isInitialPhaseComplete = completedInitialQuestions.length === initialQuestions.length && initialQuestions.length > 0;
  const isEssentialPhaseComplete = completedEssentialQuestions.length === essentialQuestions.length && essentialQuestions.length > 0;

  return (
    <div className="brief-section">
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      {(isAnalysisRegenerating || isSaving || isEssentialPhaseGenerating) && (
        <div className="analysis-regenerating-banner">
          <Loader size={16} className="spinner" />
          <span>
            {isSaving && 'Saving changes...'}
            {isAnalysisRegenerating && 'Regenerating analysis...'}
            {isEssentialPhaseGenerating && 'Generating essential phase analysis...'}
          </span>
        </div>
      )}

      {/* Progress indicator */}
      <div className="brief-progress">
        <div className="progress-info">
          {isLoading ? (
            <span className="progress-text">
              <Loader size={16} className="spinner" style={{ display: 'inline', marginRight: '8px' }} />
              Loading progress...
            </span>
          ) : (
            <>
              <span className="progress-text">
                Progress: {answeredQuestions}/{totalQuestions} questions completed
              </span>

              {/* Initial Phase Status */}
              {isInitialPhaseComplete && (
                <>
                  <br />
                  <span className="phase-complete-badge">
                    ✅ Initial Phase Complete - Analysis Available
                  </span>
                </>
              )}

              {/* Essential Phase Status */}
              {isEssentialPhaseComplete && (
                <>
                  <br />
                  <span className="phase-complete-badge">
                    ✅ Essential Phase Complete - Advanced Analysis Available
                  </span>
                </>
              )}
 

              {/* Show essential phase progress */}
              {essentialQuestions.length > 0 && !isEssentialPhaseComplete && (
                <>
                  <br />
                  <span className="essential-progress-text" style={{ fontSize: '12px', color: '#6b7280' }}>
                    Essential Phase: {completedEssentialQuestions.length}/{essentialQuestions.length} questions
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {/* Progress bar */}
        {!isLoading && totalQuestions > 0 && (
          <div className="progress-bar-container" style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${(answeredQuestions / totalQuestions) * 100}%`,
                height: '100%',
                backgroundColor: isInitialPhaseComplete ? '#10b981' : '#3b82f6',
                borderRadius: '4px',
                transition: 'width 0.3s ease-in-out'
              }}
            />
          </div>
        )} 
      </div>

      <div className="brief-content">
        <div className="brief-list">
          {isLoading ? (
            <div className="loading-state" style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader size={24} className="spinner" />
              <p>Loading your business information...</p>
            </div>
          ) : briefFields.length > 0 ? (
            briefFields.map(field => <EditableField key={field.key} field={field} />)
          ) : (
            <div className="no-data">
              <p>{t('businessInfoMessage') || 'Your business info will show here once you answer questions.'}</p>
              {questions.length > 0 && Object.keys(userAnswers).length === 0 && (
                <p className="help-text">
                  Complete questions in the Assistant tab to see your business information here.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditableBriefSection;