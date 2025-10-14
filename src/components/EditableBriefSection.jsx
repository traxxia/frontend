import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X, Loader, AlertCircle } from 'lucide-react';
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
  highlightedMissingQuestions,
  onClearHighlight
}) => {
  const [editingField, setEditingField] = useState(null);
  const [briefFields, setBriefFields] = useState([]);
  const [editedFields, setEditedFields] = useState(new Set());
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef({});
  const autoSaveTimeoutRef = useRef(null);
  const { t } = useTranslation();

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  useEffect(() => {
    if (questions.length > 0 && Object.keys(userAnswers).length > 0) {
      generateBriefFields();
    }
  }, [questions, userAnswers]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const isQuestionHighlighted = (questionId) => {
    if (!highlightedMissingQuestions?.missing_questions) return false;

    const question = questions.find(q => (q._id || q.question_id) === questionId);
    if (!question) return false;

    return highlightedMissingQuestions.missing_questions.some(q => q.order === question.order);
  };

  const renderMissingQuestionsBanner = () => {
    if (!highlightedMissingQuestions || highlightedMissingQuestions.missing_count === 0) {
      return null;
    }

    const isExtendedHighlight = highlightedMissingQuestions.keepHighlightLonger;

    return (
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '12px',
        margin: '16px 0',
        fontSize: '13px',
        color: '#92400e'
      }}>
        <div style={{
          fontWeight: '600',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          {isExtendedHighlight ? 'Answers Need More Detail' : 'Analysis Requires Additional Information'}
          {onClearHighlight && (
            <button
              onClick={onClearHighlight}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginLeft: 'auto',
                padding: '2px',
                color: '#92400e'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div>
          {highlightedMissingQuestions.message ||
            `To generate <strong>${highlightedMissingQuestions.analysis_type}</strong> analysis, 
        please answer the highlighted questions below.`}
        </div>
        <div style={{ fontSize: '12px', color: '#78350f', marginTop: '4px' }}>
          Questions highlighted: {highlightedMissingQuestions.missing_questions.map(q => q.order).join(', ')}
        </div>
      </div>
    );
  };

  const generateBriefFields = () => {
    const fields = [];
    const sortedQuestions = [...questions].sort((a, b) => (a.order || 0) - (b.order || 0));

    let sequentialNumber = 1; // Add sequential counter

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
          severity: question.severity,
          order: question.order,
          sequentialNumber: sequentialNumber++ // Use sequential number instead of question.order
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
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSave = (field, value) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (value.trim() && value.trim() !== field.value) {
        try {
          await updateConversationAnswer(field, value.trim());
          if (onAnswerUpdate) {
            onAnswerUpdate(field.questionId, value.trim());
          }
          setEditedFields(prev => new Set([...prev, field.key]));
          showToastMessage('Auto-saved!', 'success');
        } catch (error) {
          showToastMessage('Auto-save failed', 'error');
        }
      }
    }, 5000); // Auto-save after 5 seconds of no typing
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

    try {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }

      await updateConversationAnswer(field, newValue.trim());

      if (onAnswerUpdate) {
        onAnswerUpdate(field.questionId, newValue.trim());
      }

      setEditedFields(prev => new Set([...prev, field.key]));

      if (newValue.trim()) {
        showToastMessage('Answer updated and saved!', 'success');
      } else {
        showToastMessage('Answer cleared and saved!', 'success');
      }

    } catch (error) {
      showToastMessage('Failed to update answer', 'error');
    }

    setEditingField(null);
  };

  const handleCancel = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    setEditingField(null);
  };

  const EditableField = ({ field }) => {
    const isEditing = editingField === field.key;
    const isEdited = editedFields.has(field.key);
    const isHighlighted = isQuestionHighlighted(field.questionId);

    return (
      <div className={`brief-item ${isEdited ? 'edited' : ''}`} style={{
        border: isHighlighted ? '2px solid #f59e0b' : '1px solid #e5e7eb',
        backgroundColor: isHighlighted ? '#fef3c7' : 'white',
        borderRadius: '8px',
        padding: isHighlighted ? '12px' : '8px',
        margin: '8px 0',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}>
        {isHighlighted && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px'
          }}>
            <AlertCircle size={16} style={{ color: '#f59e0b' }} />
          </div>
        )}

        <div className="item-row">
          <span className="item-label" style={{
            color: isHighlighted ? '#92400e' : 'inherit',
            fontWeight: isHighlighted ? '600' : '500'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '4px',
            }}>
              {field.sequentialNumber}.
            </span>
            {field.label}

            {isHighlighted && (
              <span style={{
                fontSize: '12px',
                color: '#dc2626',
                fontWeight: '500',
                marginLeft: '8px'
              }}>
                (Required for analysis)
              </span>
            )}
          </span>
          {!isEditing && (
            <button
              className="edit-button"
              onClick={() => handleEdit(field)}
              type="button"
              disabled={isAnalysisRegenerating || isSaving || isEssentialPhaseGenerating}
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
              disabled={isAnalysisRegenerating || isSaving || isEssentialPhaseGenerating}
              style={{ minHeight: '100px', resize: 'vertical' }}
              placeholder={`Enter your answer for: ${field.label}`}
              onChange={(e) => handleAutoSave(field, e.target.value)}
            />
            <div className="edit-actions">
              <button
                onClick={() => handleSave(field)}
                disabled={isAnalysisRegenerating || isSaving || isEssentialPhaseGenerating}
                className="save-button enhanced"
                title="Save changes"
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  minWidth: '70px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#10b981';
                  }
                }}
              >
                {isSaving ? <Loader size={16} className="spinner" /> : <Check size={16} />}
                Save
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving || isEssentialPhaseGenerating}
                className="cancel-button enhanced"
                title="Cancel changes"
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  minWidth: '70px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (isSaving || isEssentialPhaseGenerating) ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#4b5563';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#6b7280';
                  }
                }}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="item-text"
            onClick={() => !(isSaving || isEssentialPhaseGenerating) && handleEdit(field)}
            style={{ cursor: (isSaving || isEssentialPhaseGenerating) ? 'not-allowed' : 'pointer' }}
          >
            {field.value || `Add ${field.label.toLowerCase()}...`}
            {isEdited && <span className="edited-indicator" title="Modified"> ✏️</span>}
          </div>
        )}
      </div>
    );
  };

  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(userAnswers).filter(key => userAnswers[key] && userAnswers[key].trim()).length;

  const initialQuestions = questions.filter(q => q.phase === 'initial' && q.severity === 'mandatory');
  const essentialQuestions = questions.filter(q => q.phase === 'essential');

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
    <div className="editable-brief-section">
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      {renderMissingQuestionsBanner()}

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

      <div className="brief-progress">
        <div className="progress-info">
          {isLoading ? (
            <span className="progress-text">
              <Loader size={16} className="spinner" style={{ display: 'inline', marginRight: '8px' }} />
              Loading progress...
            </span>
          ) : (
            <>
              {answeredQuestions > 0 && (
                <span className="progress-text">
                  Progress: {answeredQuestions}/{totalQuestions} questions completed
                </span>
              )}
            </>
          )}
        </div>

        {!isLoading && answeredQuestions > 0 && (
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