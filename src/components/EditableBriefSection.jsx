import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X, Loader, AlertCircle, Sparkles, Wand2, Upload, FileText, Database, RefreshCw } from 'lucide-react';
import { AnalysisApiService } from '../services/analysisApiService';
import { useTranslation } from "../hooks/useTranslation";
import FinancialTemplatesPopup from './FinancialTemplatesPopup';
import { detectTemplateType, validateAgainstTemplate } from '../utils/templateValidator';
import '../styles/CompanyManagement.css';



const EditableField = ({
  field,
  editingField,
  editedFields,
  isQuestionHighlighted,
  canEdit,
  handleEdit,
  isAnalysisRegenerating,
  isStrategicRegenerating,
  isSaving,
  isEssentialPhaseGenerating,
  isLaunchedStatus,
  inputRefs,
  fieldRefs,
  handleSave,
  handleCancel,
  handleAutoSave
}) => {
  const { t } = useTranslation();
  const isEditing = editingField === field.key;
  const isEdited = editedFields.has(field.key);
  const isHighlighted = isQuestionHighlighted(field.questionId);


  return (
    <div
      ref={el => fieldRefs.current[field.key] = el}
      className={`brief-item ${isEdited ? 'edited' : ''}`}
      style={{
        border: isHighlighted ? '2px solid #f59e0b' : '1px solid #e5e7eb',
        backgroundColor: isHighlighted ? '#fef3c7' : 'white',
        borderRadius: '8px',
        padding: isHighlighted ? '12px' : '8px',
        margin: '8px 0',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
    >
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
          fontWeight: isHighlighted ? '600' : '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: '#f3f4f6',
            color: '#374151'
          }}>
            {field.sequentialNumber}.
          </span>
          {field.label}

          {field.phase && (
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              textTransform: 'uppercase',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor:
                field.phase.toLowerCase() === 'initial' ? '#dbeafe' :
                  field.phase.toLowerCase() === 'essential' ? '#dcfce7' :
                    field.phase.toLowerCase() === 'advanced' ? '#f3e8ff' : '#f3f4f6',
              color:
                field.phase.toLowerCase() === 'initial' ? '#1e40af' :
                  field.phase.toLowerCase() === 'essential' ? '#166534' :
                    field.phase.toLowerCase() === 'advanced' ? '#6b21a8' : '#374151',
              letterSpacing: '0.025em'
            }}>
              {field.phase}
            </span>
          )}

          {isHighlighted && (
            <span style={{
              fontSize: '12px',
              color: '#dc2626',
              fontWeight: '500'
            }}>
              (Required for analysis)
            </span>
          )}
        </span>
        {!isEditing && canEdit && (
          <button
            className="edit-button prominent"
            onClick={() => handleEdit(field)}
            type="button"
            disabled={isAnalysisRegenerating || isStrategicRegenerating || isSaving || isEssentialPhaseGenerating}
            title="Edit answer"
            style={{
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
              color: '#374151',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            <Edit3 size={14} />
            {t('Edit') || 'Edit'}
          </button>
        )}
      </div>

      {isEditing && canEdit ? (
        <div className="edit-container" style={{
          marginTop: '10px',
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>

          <textarea
            ref={el => inputRefs.current[field.key] = el}
            className="edit-textarea"
            defaultValue={field.value === '[Question Skipped]' ? '' : field.value}
            disabled={isAnalysisRegenerating || isStrategicRegenerating || isSaving || isEssentialPhaseGenerating}
            style={{ minHeight: '100px', resize: 'vertical' }}
            placeholder={`Enter your answer for: ${field.label}`}
            onChange={(e) => handleAutoSave(field, e.target.value)}
          />
          <div className="edit-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
            <div className="auto-save-status" style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isSaving ? (
                <>
                  <Loader size={12} className="spinner" />
                  Saving...
                </>
              ) : isEdited ? (
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} />
                  Changes saved
                </span>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCancel}
                disabled={isSaving || isEssentialPhaseGenerating}
                className="cancel-button enhanced"
                title="Cancel changes"
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: (isSaving || isEssentialPhaseGenerating) ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#d1d5db';
                  }
                }}
              >
                <X size={14} />
                Cancel
              </button>
              <button
                onClick={() => handleSave(field)}
                disabled={isSaving || isEssentialPhaseGenerating}
                className="save-button enhanced"
                title="Save changes"
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#1d4ed8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#2563eb';
                  }
                }}
              >
                {isSaving ? <Loader size={14} className="spinner" /> : <Check size={14} />}
                Save
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div
          className="item-text"
          onClick={() => canEdit && !(isSaving || isEssentialPhaseGenerating) && handleEdit(field)}
          style={{
            cursor: (!canEdit || isSaving || isEssentialPhaseGenerating) ? 'default' : 'pointer',
            color: !field.value ? '#9ca3af' : 'inherit',
            fontStyle: !field.value ? 'italic' : 'normal'
          }}
        >
          {field.value || t('Not Answered') || 'Not Answered'}
        </div>
      )}
    </div>
  );
};

const FinancialUploadBlock = ({
  hasUploadedDocument,
  uploadedFileInfo,
  onOpenManagement,
  canEdit,
  isAnalysisRegenerating,
  isStrategicRegenerating
}) => {
  const { t } = useTranslation();
  const styles = {
    container: {
      flex: 1,
      padding: '16px 20px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e1faf1 100%)',
      borderRadius: '16px',
      border: '1px solid #bbf7d0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '120px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px'
    },
    iconWrapper: {
      backgroundColor: '#dcfce7',
      padding: '10px',
      borderRadius: '12px',
      color: '#059669'
    },
    title: {
      margin: 0,
      fontSize: '17px',
      fontWeight: '700',
      color: '#064e3b'
    },
    subtitle: {
      margin: '4px 0 0 0',
      fontSize: '12px',
      color: '#065f46',
      lineHeight: '1.4'
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(4px)',
      border: '1px solid #bbf7d0',
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 'auto'
    },
    fileIcon: { color: '#059669' },
    fileName: {
      fontWeight: '600',
      fontSize: '13px',
      color: '#064e3b',
      wordBreak: 'break-all'
    },
    fileMeta: {
      fontSize: '10px',
      color: '#065f46'
    },
    actionBtn: {
      fontSize: '12px',
      color: '#059669',
      fontWeight: '600',
      background: 'white',
      border: '1px solid #bbf7d0',
      padding: '4px 10px',
      borderRadius: '6px',
      cursor: (isAnalysisRegenerating || isStrategicRegenerating) ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'all 0.2s',
      opacity: (isAnalysisRegenerating || isStrategicRegenerating) ? 0.7 : 1
    },
    uploadBtn: {
      backgroundColor: '#059669',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: (isAnalysisRegenerating || isStrategicRegenerating) ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)',
      marginTop: 'auto',
      opacity: (isAnalysisRegenerating || isStrategicRegenerating) ? 0.7 : 1
    }
  };

  return (
    <div className="financial-upload-block feature-card" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.iconWrapper}>
          <Database size={24} />
        </div>
        <div>
          <h3 style={styles.title}>Financial Data</h3>
          <p style={styles.subtitle}>Report templates & statements</p>
        </div>
      </div>

      {hasUploadedDocument && uploadedFileInfo ? (
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={styles.fileIcon}>
              <FileText size={20} />
            </div>
            <div>
              <div style={styles.fileName}>{uploadedFileInfo.name}</div>
              <div style={styles.fileMeta}>
                {(uploadedFileInfo.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={onOpenManagement}
              style={styles.actionBtn}
              disabled={isAnalysisRegenerating || isStrategicRegenerating}
            >
              <RefreshCw size={12} className={isAnalysisRegenerating || isStrategicRegenerating ? "animate-spin" : ""} />
              {t("Replace") || "Replace"}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {canEdit && (
            <button
              onClick={onOpenManagement}
              style={styles.uploadBtn}
              disabled={isAnalysisRegenerating || isStrategicRegenerating}
              onMouseEnter={(e) => {
                if (!isAnalysisRegenerating && !isStrategicRegenerating) {
                  e.currentTarget.style.backgroundColor = '#047857';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isAnalysisRegenerating && !isStrategicRegenerating) {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <Upload size={16} />
              Get Started
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const AIAnswerSupportBlock = ({
  onGenerateEnrichment,
  isEnriching,
  isApplyingEnrichment,
  isAnalysisRegenerating,
  isStrategicRegenerating,
  isSaving,
  canEnrich
}) => {
  const styles = {
    container: {
      flex: 1,
      padding: '16px 20px',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      borderRadius: '16px',
      border: '1px solid #ddd6fe',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '120px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px'
    },
    iconWrapper: {
      backgroundColor: '#ede9fe',
      padding: '10px',
      borderRadius: '12px',
      color: '#7c3aed'
    },
    title: {
      margin: 0,
      fontSize: '17px',
      fontWeight: '700',
      color: '#4c1d95'
    },
    subtitle: {
      margin: '4px 0 0 0',
      fontSize: '12px',
      color: '#5b21b6',
      lineHeight: '1.4'
    },
    enrichBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      padding: '10px 20px',
      backgroundColor: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: (isEnriching || !canEnrich || isAnalysisRegenerating || isStrategicRegenerating) ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      opacity: (!canEnrich || isAnalysisRegenerating || isStrategicRegenerating) ? 0.6 : 1,
      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
      marginTop: '8px'
    }
  };

  return (
    <div className="ai-support-block feature-card" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.iconWrapper}>
          <Sparkles size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h3 style={styles.title}>AI Answer Support</h3>
          </div>
          <p style={styles.subtitle}>Professional answers based on your onboarding</p>
        </div>
      </div>

      <button
        onClick={onGenerateEnrichment}
        disabled={isEnriching || isApplyingEnrichment || isAnalysisRegenerating || isStrategicRegenerating || isSaving || !canEnrich}
        style={styles.enrichBtn}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = '#6d28d9';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = '#7c3aed';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {isEnriching ? <Loader size={18} className="spinner" /> : <Wand2 size={18} />}
        {isEnriching ? 'Generating Suggestions...' : 'Generate AI Answers'}
      </button>
    </div>
  );
};


const EditableBriefSection = ({
  questions = [],
  userAnswers = {},
  onAnswerUpdate,
  onBusinessDataUpdate,
  onAnalysisRegenerate,
  isEssentialPhaseGenerating = false,
  isAnalysisRegenerating = false,
  isStrategicRegenerating = false,
  selectedBusinessId,
  highlightedMissingQuestions,
  onClearHighlight,
  isLaunchedStatus = false,
  documentInfo = null
}) => {
  const [editingField, setEditingField] = useState(null);
  const [briefFields, setBriefFields] = useState([]);
  const [editedFields, setEditedFields] = useState(new Set());
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedAnswers, setEnrichedAnswers] = useState(null);
  const [isApplyingEnrichment, setIsApplyingEnrichment] = useState(false);
  const [showTemplatesPopup, setShowTemplatesPopup] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL;
  const analysisService = useRef(new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken)).current;

  const inputRefs = useRef({});
  const fieldRefs = useRef({});
  const autoSaveTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = (sessionStorage.getItem("role") || sessionStorage.getItem("userRole") || "").toLowerCase();
    setUserRole(role);
  }, []);

  const isViewer = userRole === "viewer";
  const canEdit = !isViewer;
  const canEnrich = !isViewer;

  useEffect(() => {
    if (questions && questions.length > 0) {
      generateBriefFields();
    }
  }, [questions, userAnswers]);

  useEffect(() => {
    if (selectedBusinessId && !documentInfo) {
      loadDocumentInfo();
    }
  }, [selectedBusinessId, documentInfo]);

  useEffect(() => {
    if (documentInfo) {
      if (documentInfo.filename || documentInfo.id || documentInfo.has_document || documentInfo.file_size) {
        setHasUploadedDocument(true);
        setUploadedFileInfo({
          name: documentInfo.filename || 'Financial Document',
          size: documentInfo.file_size || documentInfo.size || 0,
          uploadDate: documentInfo.upload_date ?
            new Date(documentInfo.upload_date).toLocaleDateString() :
            'Previously uploaded'
        });
      } else {
        setHasUploadedDocument(false);
        setUploadedFileInfo(null);
      }
    } else if (documentInfo === null && !selectedBusinessId) {
      // Clear if both are null
      setHasUploadedDocument(false);
      setUploadedFileInfo(null);
    }
  }, [documentInfo, selectedBusinessId]);

  const loadDocumentInfo = async () => {
    try {
      const doc = await analysisService.fetchFinancialDocument(selectedBusinessId);
      if (doc) {
        setHasUploadedDocument(true);
        setUploadedFileInfo({
          name: doc.filename || 'Financial Document',
          size: doc.file_size || 0,
          uploadDate: doc.upload_date ?
            new Date(doc.upload_date).toLocaleDateString() :
            'Previously uploaded'
        });
      } else {
        setHasUploadedDocument(false);
        setUploadedFileInfo(null);
      }
    } catch (error) {
      console.error('Error loading document info:', error);
    }
  };


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
      const answer = userAnswers[qId] || ''; // Include even if empty

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
    }, 3000); // Auto-save after 3 seconds of no typing
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

  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(userAnswers).filter(key => userAnswers[key] && userAnswers[key].trim()).length;
  const progressPercentage = totalQuestions > 0
    ? Math.round((answeredQuestions / totalQuestions) * 100)
    : 0;

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

  const handleGenerateEnrichment = async () => {
    try {
      setIsEnriching(true);
      setEnrichedAnswers(null);

      // 1. Fetch real onboarding data for this business
      let onboardingData = null;
      try {
        const analysisResult = await analysisService.getPMFAnalysis(selectedBusinessId);
        onboardingData = analysisResult?.analysis?.onboarding_data || analysisResult?.onboarding_data;
      } catch (err) {
        console.warn("Could not fetch onboarding data:", err);
      }

      // Check if onboarding data is missing
      if (!onboardingData || Object.keys(onboardingData).length === 0) {
        showToastMessage(t("completeOnboardingPrompt") || "Please complete the PMF Onboarding to see answers here.", 'error');
        setIsEnriching(false);
        return;
      }

      // Find company name from current brief fields/user answers as backup
      const companyNameField = briefFields.find(f => f.label.toLowerCase().includes('company') || f.label.toLowerCase().includes('name'));
      const companyName = onboardingData?.companyName || companyNameField?.value || "";

      // 2. Construct the rich payload for the ML enrichment API
      // We follow the same structure as the executive summary payload in PMFOnboardingModal
      const rawPayload = {
        company: {
          name: companyName || "N/A",
          website: onboardingData?.website || "N/A",
          location: {
            city: onboardingData?.city || "N/A",
            country: onboardingData?.country || "N/A",
          },
          industry: onboardingData?.primaryIndustry || "N/A",
          geographies: [onboardingData?.geography1, onboardingData?.geography2, onboardingData?.geography3].filter(Boolean),
          profits: {
            source: {
              [t("Segments")]: [onboardingData?.customerSegment1, onboardingData?.customerSegment2, onboardingData?.customerSegment3].filter(Boolean),
              [t("Products")]: [onboardingData?.productService1, onboardingData?.productService2, onboardingData?.productService3].filter(Boolean),
              [t("Channels")]: [onboardingData?.channel1, onboardingData?.channel2, onboardingData?.channel3].filter(Boolean),
            }
          },
          objective: onboardingData?.strategicObjective === "Other" ? onboardingData?.strategicObjectiveOther : onboardingData?.strategicObjective || "N/A",
          constraint: {
            primary: onboardingData?.keyChallenge === "Other" ? onboardingData?.keyChallengeOther : onboardingData?.keyChallenge || "N/A",
          },
          usp: onboardingData?.differentiation ? [...onboardingData.differentiation.filter(d => d !== 'Other'), onboardingData.differentiationOther].filter(Boolean) : [],
        },
      };

      const result = await analysisService.makeAPICall(
        'answer-questions-with-enrichment',
        null,
        null,
        selectedBusinessId,
        null,
        null,
        null,
        companyName,
        rawPayload
      );

      if (Array.isArray(result)) {
        setEnrichedAnswers(result);
        showToastMessage('Enrichment suggestions generated!', 'success');
      } else {
        throw new Error('Invalid response format from enrichment API');
      }
    } catch (error) {
      console.error('Enrichment error:', error);
      showToastMessage('Failed to generate enrichment', 'error');
    } finally {
      setIsEnriching(false);
    }
  };

  const saveFileToDatabase = async (file, validationResult) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');
      if (!selectedBusinessId) throw new Error('No business selected');

      const formData = new FormData();
      formData.append('document', file);

      const templateComplexityMap = {
        'simplified': 'simple',
        'standard': 'medium',
        'detailed': 'medium'
      };

      const backendTemplateType = templateComplexityMap[validationResult.templateType] || 'simple';
      formData.append('template_type', backendTemplateType);
      formData.append('template_name', validationResult.templateName || '');
      formData.append('validation_confidence', validationResult.confidence || 'high');
      formData.append('upload_mode', validationResult.uploadMode || 'auto-detect');

      const response = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/financial-document`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save file to database');

      return result;
    } catch (error) {
      console.error('Database save error:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      showToastMessage('Please upload Excel (.xlsx, .xls) or CSV files only.', 'error');
      return;
    }

    try {
      setIsFileUploading(true);
      const detection = await detectTemplateType(file);

      if (detection.confidence === 'none' || detection.score < 0.3) {
        throw new Error(`Unable to identify template type. Please ensure your file is based on one of our template files.`);
      }

      const validation = await validateAgainstTemplate(file, detection.type);
      if (!validation.isValid) {
        let errorMessage = `Your file doesn't match the ${validation.templateName} format:\n\n`;
        validation.errors.forEach(error => errorMessage += `• ${error}\n`);
        throw new Error(errorMessage);
      }

      const validationResult = {
        templateType: detection.type,
        templateName: validation.templateName,
        validation: validation,
        confidence: detection.confidence,
        uploadMode: 'auto-detect'
      };

      await saveFileToDatabase(file, validationResult);

      setHasUploadedDocument(true);
      setUploadedFileInfo({
        name: file.name,
        size: file.size,
        uploadDate: new Date().toLocaleDateString()
      });

      showToastMessage(`✅ File uploaded successfully! Detected as ${validation.templateName}. Running financial analysis...`, 'success');

      // Trigger financial analysis via excel-analysis endpoint
      const financialMetrics = ['profitability', 'growth_trends', 'liquidity', 'investment', 'leverage'];
      for (const metricType of financialMetrics) {
        try {
          await analysisService.makeAPICall(
            'excel-analysis',
            [],
            [],
            selectedBusinessId,
            null,
            metricType
          );
        } catch (err) {
          console.warn(`Financial analysis failed for metric: ${metricType}`, err);
        }
      }

      showToastMessage('✅ Financial analysis complete!', 'success');

      // Also notify parent to refresh display
      if (onAnalysisRegenerate) {
        onAnalysisRegenerate({ onlyFinancial: true });
      }
    } catch (error) {
      console.error('File upload/validation error:', error);
      showToastMessage(error.message || 'Failed to process file. Please try again.', 'error');
    } finally {
      setIsFileUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyEnrichedAnswers = async () => {
    if (!enrichedAnswers || enrichedAnswers.length === 0) return;

    try {
      setIsApplyingEnrichment(true);

      // Map enriched answers back to question IDs
      const answersToSave = enrichedAnswers.map(enriched => {
        const field = briefFields.find(f => f.label === enriched.question);
        if (field) {
          return {
            question_id: field.questionId,
            answer_text: enriched.answer
          };
        }
        return null;
      }).filter(Boolean);

      if (answersToSave.length === 0) {
        showToastMessage('No matching questions found to apply', 'warning');
        return;
      }

      await analysisService.bulkUpdateConversations(selectedBusinessId, answersToSave);

      // Update local state for immediate UI feedback
      const newlyEdited = new Set(editedFields);
      answersToSave.forEach(item => {
        if (onAnswerUpdate) {
          onAnswerUpdate(item.question_id, item.answer_text);
        }
        newlyEdited.add(`question_${item.question_id}`);
      });
      setEditedFields(newlyEdited);

      setEnrichedAnswers(null);
      showToastMessage('Enriched answers applied and saved!', 'success');

      // Trigger auto-regeneration of Insights 6'Cs and Strategic Tab
      if (onAnalysisRegenerate) {
        onAnalysisRegenerate();
      }
    } catch (error) {
      console.error('Apply enrichment error:', error);
      showToastMessage('Failed to apply enriched answers', 'error');
    } finally {
      setIsApplyingEnrichment(false);
    }
  };

  return (
    <div className="editable-brief-section">
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      {renderMissingQuestionsBanner()}


      {enrichedAnswers && (
        <div className="enrichment-preview" style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          animation: 'fadeIn 0.3s ease-in'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h5 style={{ margin: 0, color: '#0369a1', fontSize: '15px', fontWeight: '600' }}>
              AI Enrichment Suggestions 
            </h5>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setEnrichedAnswers(null)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #bae6fd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                Discard
              </button>
              <button
                onClick={handleApplyEnrichedAnswers}
                disabled={isApplyingEnrichment}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 16px',
                  backgroundColor: '#0284c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: isApplyingEnrichment ? 'not-allowed' : 'pointer'
                }}
              >
                {isApplyingEnrichment ? <Loader size={14} className="spinner" /> : <Check size={14} />}
                Apply All Answers
              </button>
            </div>
          </div>
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            {enrichedAnswers.map((item, idx) => (
              <div key={idx} style={{
                backgroundColor: 'white',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '10px',
                border: '1px solid #e0f2fe'
              }}>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#0c4a6e', marginBottom: '4px' }}>
                  {item.question}
                </div>
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                  {item.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(isAnalysisRegenerating || isStrategicRegenerating || isSaving || isEssentialPhaseGenerating || isApplyingEnrichment) && (
        <div className="analysis-regenerating-banner">
          <Loader size={16} className="spinner" />
          <span>
            {isSaving && 'Saving changes...'}
            {isApplyingEnrichment && 'Applying enriched answers...'}
            {(isAnalysisRegenerating || isStrategicRegenerating) && 'Regenerating Insight & STRATEGIC...'}
            {isEssentialPhaseGenerating && 'Generating essential phase analysis...'}
          </span>
        </div>
      )}

      {/* <div className="brief-progress">
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
                  Progress: {progressPercentage}% completed
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
      </div> */}

      <div className="brief-content">
        <div className="brief-list">
          {isLoading ? (
            <div className="loading-state" style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader size={24} className="spinner" />
              <p>Loading your business information...</p>
            </div>
          ) : briefFields.length > 0 ? (
            (() => {
              const rows = [];

              // Insert Feature Row at the top
              rows.push(
                <div key="feature-blocks-row" style={{
                  display: 'flex',
                  gap: '20px',
                  marginBottom: '28px',
                  flexWrap: 'wrap'
                }}>
                  <AIAnswerSupportBlock
                    onGenerateEnrichment={handleGenerateEnrichment}
                    isEnriching={isEnriching}
                    isApplyingEnrichment={isApplyingEnrichment}
                    isAnalysisRegenerating={isAnalysisRegenerating}
                    isStrategicRegenerating={isStrategicRegenerating}
                    isSaving={isSaving}
                    canEnrich={canEnrich}
                  />

                  <FinancialUploadBlock
                    hasUploadedDocument={hasUploadedDocument}
                    uploadedFileInfo={uploadedFileInfo}
                    onOpenManagement={() => setShowTemplatesPopup(true)}
                    canEdit={canEdit}
                    isAnalysisRegenerating={isAnalysisRegenerating}
                    isStrategicRegenerating={isStrategicRegenerating}
                  />
                </div>
              );

              briefFields.forEach((field, index) => {
                rows.push(
                  <EditableField
                    key={field.key}
                    field={field}
                    editingField={editingField}
                    editedFields={editedFields}
                    isQuestionHighlighted={isQuestionHighlighted}
                    canEdit={canEdit}
                    handleEdit={handleEdit}
                    isAnalysisRegenerating={isAnalysisRegenerating}
                    isStrategicRegenerating={isStrategicRegenerating}
                    isSaving={isSaving}
                    isEssentialPhaseGenerating={isEssentialPhaseGenerating}
                    isLaunchedStatus={isLaunchedStatus}
                    inputRefs={inputRefs}
                    fieldRefs={fieldRefs}
                    handleSave={handleSave}
                    handleCancel={handleCancel}
                    handleAutoSave={handleAutoSave}
                  />
                );
              });

              return rows;
            })()
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
      {showTemplatesPopup && (
        <FinancialTemplatesPopup
          isOpen={showTemplatesPopup}
          onClose={() => setShowTemplatesPopup(false)}
          isFileUploading={isFileUploading}
          onFileUploaded={(file, validation) => {
            const mockEvent = { target: { files: [file] } };
            handleFileUpload(mockEvent);
            setShowTemplatesPopup(false);
          }}
        />
      )}
    </div>
  );
};

export default EditableBriefSection;
