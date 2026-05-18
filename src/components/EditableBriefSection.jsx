import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X, Loader, AlertCircle, Sparkles, Wand2, Upload, FileText, Database, RefreshCw } from 'lucide-react';
import { AnalysisApiService } from '../services/analysisApiService';
import { answerService } from '../services/answerService';
import { useTranslation } from "../hooks/useTranslation";
import FinancialTemplatesPopup from './FinancialTemplatesPopup';
import { detectTemplateType, validateAgainstTemplate } from '../utils/templateValidator';
import '../styles/CompanyManagement.css';
import { useAuthStore } from '../store/authStore';
const EditableField = ({
  field,
  editingField,
  editedFields,
  isQuestionHighlighted,
  canEdit,
  handleEdit,
  isAnalysisRegenerating,
  isStrategicRegenerating,
  isFinancialRegeneratingProp,
  isSaving,
  isEssentialPhaseGenerating,
  isEnriching,
  isApplyingEnrichment,
  isLaunchedStatus,
  inputRefs,
  fieldRefs,
  handleSave,
  handleCancel,
  handleAutoSave,
  isLastField
}) => {
  const {
    t
  } = useTranslation();
  const isEditing = editingField === field.key;
  const isEdited = editedFields.has(field.key);
  const isHighlighted = isQuestionHighlighted(field.questionId);
  return <div ref={el => fieldRefs.current[field.key] = el} className={`brief-item ${isEdited ? 'edited' : ''} editable-brief-section--s1`} data-component="advanced-brief" style={{
    border: isHighlighted ? '2px solid #f59e0b' : '1px solid #e5e7eb',
    backgroundColor: isHighlighted ? '#fef3c7' : 'white',
    padding: isHighlighted ? '12px' : '8px',
    margin: isEditing && isLastField ? '8px 0 80px 0' : '8px 0'
  }}>
      {isHighlighted && <div className="editable-brief-section--s2">
          <AlertCircle size={16} className="editable-brief-section--s3" />
        </div>}

      <div className="item-row">
        <div className="item-label editable-brief-section--s4" style={{
        color: isHighlighted ? '#92400e' : 'inherit',
        fontWeight: isHighlighted ? '600' : '500'
      }}>
          <span className="editable-brief-section--s5">
            {field.sequentialNumber}.
          </span>
          <span className="editable-brief-section--s6">
            {field.label}
          </span>

          {field.phase && <span className="edit-batch editable-brief-section--s7" style={{
          backgroundColor: field.phase.toLowerCase() === 'initial' ? '#dbeafe' : field.phase.toLowerCase() === 'essential' ? '#dcfce7' : field.phase.toLowerCase() === 'advanced' ? '#f3e8ff' : '#f3f4f6',
          color: field.phase.toLowerCase() === 'initial' ? '#1e40af' : field.phase.toLowerCase() === 'essential' ? '#166534' : field.phase.toLowerCase() === 'advanced' ? '#6b21a8' : '#374151'
        }}>
             {t(field.phase)}
            </span>}

          {isHighlighted && <span className="editable-brief-section--s8">
              (Required for analysis)
            </span>}
        </div>
        {!isEditing && canEdit && <button className="edit-button prominent editable-brief-section--s9" onClick={() => handleEdit(field)} type="button" disabled={isAnalysisRegenerating || isStrategicRegenerating || isSaving || isEssentialPhaseGenerating || isEnriching || isApplyingEnrichment} title="Edit answer">
            <Edit3 size={14} />
            {t('Edit') || 'Edit'}
          </button>}
      </div>

      {isEditing && canEdit ? <div className="edit-container editable-brief-section--s10">

          <textarea ref={el => inputRefs.current[field.key] = el} className="edit-textarea editable-brief-section--s11" defaultValue={field.value === '[Question Skipped]' ? '' : field.value} disabled={isAnalysisRegenerating || isStrategicRegenerating || isSaving || isEssentialPhaseGenerating || isEnriching || isApplyingEnrichment} placeholder={`Enter your answer for: ${field.label}`} onChange={e => handleAutoSave(field, e.target.value)} />
          <div className="edit-actions editable-brief-section--s12">
            <div className="auto-save-status editable-brief-section--s13">
              {isSaving ? <>
                  <Loader size={12} className="antigravity-rotating" />
                  Saving...
                </> : isEdited ? <span className="editable-brief-section--s14">
                  <Check size={12} />
                  Changes saved
                </span> : null}
            </div>
            <div className="editable-brief-section--s15">
              <button onClick={handleCancel} disabled={isSaving || isEssentialPhaseGenerating || isEnriching || isApplyingEnrichment} className="cancel-button enhanced editable-brief-section--s16" title="Cancel changes" style={{
            cursor: isSaving || isEssentialPhaseGenerating || isEnriching || isApplyingEnrichment ? 'not-allowed' : 'pointer'
          }} onMouseEnter={e => {
            if (!e.target.disabled) {
              e.target.style.backgroundColor = '#f9fafb';
              e.target.style.borderColor = '#9ca3af';
            }
          }} onMouseLeave={e => {
            if (!e.target.disabled) {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#d1d5db';
            }
          }}>
                <X size={14} />
                {t("Cancel")}
              </button>
              <button onClick={() => handleSave(field)} disabled={isSaving || isEssentialPhaseGenerating || isEnriching || isApplyingEnrichment} className="save-button enhanced editable-brief-section--s17" title="Save changes" style={{
            cursor: isSaving ? 'not-allowed' : 'pointer'
          }} onMouseEnter={e => {
            if (!e.target.disabled) {
              e.target.style.backgroundColor = '#1d4ed8';
            }
          }} onMouseLeave={e => {
            if (!e.target.disabled) {
              e.target.style.backgroundColor = '#2563eb';
            }
          }}>
                {isSaving ? <Loader size={14} className="antigravity-rotating" /> : <Check size={14} />}
                {t("Save")}
              </button>
            </div>
          </div>

        </div> : <div className="item-text" onClick={() => canEdit && !(isSaving || isEssentialPhaseGenerating || isEnriching || isApplyingEnrichment) && handleEdit(field)} style={{
      cursor: !canEdit || isSaving || isEssentialPhaseGenerating || isEnriching || isApplyingEnrichment ? 'default' : 'pointer',
      color: !field.value ? '#9ca3af' : '#302d2d',
      fontStyle: !field.value ? 'italic' : 'normal'
    }}>
          {field.value || t('No specific data available') || 'No specific data available'}
        </div>}
    </div>;
};
const FinancialUploadBlock = ({
  hasUploadedDocument,
  uploadedFileInfo,
  onOpenManagement,
  canEdit,
  isAnalysisRegenerating,
  isStrategicRegenerating
}) => {
  const {
    t
  } = useTranslation();
  const styles = {
    container: {
      flex: 1,
      padding: '16px 20px', 
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
    fileIcon: {
      color: '#059669'
    },
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
      cursor: isAnalysisRegenerating || isStrategicRegenerating ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'all 0.2s',
      opacity: isAnalysisRegenerating || isStrategicRegenerating ? 0.7 : 1
    },
    uploadBtn: {
      backgroundColor: '#059669',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: isAnalysisRegenerating || isStrategicRegenerating ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)',
      marginTop: 'auto',
      opacity: isAnalysisRegenerating || isStrategicRegenerating ? 0.7 : 1
    }
  };
  return <div className="financial-upload-block feature-card" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.iconWrapper}>
          <Database size={24} />
        </div>
        <div>
          <h3 style={styles.title}>{t("financial_data")}</h3>
          <p style={styles.subtitle}>{t("report_templates_statements")}</p>
        </div>
      </div>

      {hasUploadedDocument && uploadedFileInfo ? <div style={styles.card}>
          <div className="editable-brief-section--s18">
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
          {canEdit && <button onClick={onOpenManagement} style={styles.actionBtn} disabled={isAnalysisRegenerating || isStrategicRegenerating}>
              <RefreshCw size={12} className={isAnalysisRegenerating || isStrategicRegenerating ? "antigravity-rotating" : ""} />
              {t("Replace") || "Replace"}
            </button>}
        </div> : <div className="editable-brief-section--s19">
          {canEdit && <button onClick={onOpenManagement} style={styles.uploadBtn} disabled={isAnalysisRegenerating || isStrategicRegenerating} onMouseEnter={e => {
        if (!isAnalysisRegenerating && !isStrategicRegenerating) {
          e.currentTarget.style.backgroundColor = '#047857';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }} onMouseLeave={e => {
        if (!isAnalysisRegenerating && !isStrategicRegenerating) {
          e.currentTarget.style.backgroundColor = '#059669';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}>
              <Upload size={16} />
              {t("get_started")}
            </button>}
        </div>}
    </div>;
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
  const {
    t
  } = useTranslation();
  const styles = {
    container: {
      flex: 1,
      padding: '16px 20px', 
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
      alignItems: 'flex-start',
      gap: '12px',
      marginBottom: '12px'
    },
    iconWrapper: {
      backgroundColor: '#ede9fe',
      padding: '10px',
      borderRadius: '12px',
      color: '#7c3aed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
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
      cursor: isEnriching || !canEnrich || isAnalysisRegenerating || isStrategicRegenerating ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      opacity: !canEnrich || isAnalysisRegenerating || isStrategicRegenerating ? 0.6 : 1,
      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
      marginTop: '8px'
    }
  };
  return <div className="ai-support-block feature-card" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.iconWrapper}>
          <Sparkles size={24} />
        </div>
        <div>
          <div className="editable-brief-section--s20">
            <h3 style={styles.title}>{t("ai_answer_support")}</h3>
            <p style={styles.subtitle}>
             {t("professional_answers_based_on_onboarding")}
            </p>
          </div>
        </div>
      </div>

      <div className="editable-brief-section--s21">
        {t("ai_refinement_helper") || "Traxxia will start from your INITIAL answers, propose refined versions, and label them AI‑REFINED. You can edit or revert to INITIAL at any time."}
      </div>

      <button onClick={onGenerateEnrichment} disabled={isEnriching || isApplyingEnrichment || isAnalysisRegenerating || isStrategicRegenerating || isSaving || !canEnrich} style={styles.enrichBtn} onMouseEnter={e => {
      if (!e.currentTarget.disabled) {
        e.currentTarget.style.backgroundColor = '#6d28d9';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }
    }} onMouseLeave={e => {
      if (!e.currentTarget.disabled) {
        e.currentTarget.style.backgroundColor = '#7c3aed';
        e.currentTarget.style.transform = 'translateY(0)';
      }
    }}>
        {isEnriching ? <Loader size={18} className="antigravity-rotating" /> : <Wand2 size={18} />}
       {isEnriching ? t("generating_suggestions") : t("generate_ai_answers")}
      </button>

      {isEnriching && <div className="editable-brief-section--s22">
          {t("estimated_time_30_60") || "Estimated time: 30 - 60 sec"}
        </div>}
    </div>;
};
const EditableBriefSection = ({
  questions = [],
  userAnswers = {},
  onAnswerUpdate,
  onBusinessDataUpdate,
  onAnalysisRegenerate,
  onUploadedFileUpdate,
  isEssentialPhaseGenerating = false,
  isAnalysisRegenerating = false,
  isStrategicRegenerating = false,
  selectedBusinessId,
  highlightedMissingQuestions,
  onClearHighlight,
  isLaunchedStatus = false,
  documentInfo = null,
  isFinancialRegeneratingProp = false,
  answerIds = {},
  setAnswerIds,
  isLoading = false,
  hasPmfAccess = false
}) => {
  const [editingField, setEditingField] = useState(null);
  const [briefFields, setBriefFields] = useState([]);
  const [editedFields, setEditedFields] = useState(new Set());
  const [showToast, setShowToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedAnswers, setEnrichedAnswers] = useState(null);
  const [isApplyingEnrichment, setIsApplyingEnrichment] = useState(false);
  const [showTemplatesPopup, setShowTemplatesPopup] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  const [isFinancialRegenerating, setIsFinancialRegenerating] = useState(false);
  useEffect(() => {
    if (isFinancialRegeneratingProp) {
      setIsFinancialRegenerating(true);
    } else if (!isAnalysisRegenerating && !isStrategicRegenerating) {
      setIsFinancialRegenerating(false);
    }
  }, [isFinancialRegeneratingProp, isAnalysisRegenerating, isStrategicRegenerating]);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const getAuthToken = () => useAuthStore.getState().token;
  const ML_API_BASE_URL = import.meta.env.VITE_ML_BACKEND_URL;
  const analysisService = useRef(new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken)).current;
  const inputRefs = useRef({});
  const fieldRefs = useRef({});
  const autoSaveTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const {
    t
  } = useTranslation();
  const [userRole, setUserRole] = useState("");
  useEffect(() => {
    const role = (useAuthStore.getState().userRole || useAuthStore.getState().userRole || "").toLowerCase();
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
    if (documentInfo) {
      if (documentInfo.filename || documentInfo.id || documentInfo.has_document || documentInfo.file_size) {
        setHasUploadedDocument(true);
        setUploadedFileInfo({
          name: documentInfo.filename || 'Financial Document',
          size: documentInfo.file_size || documentInfo.size || 0,
          uploadDate: documentInfo.upload_date ? new Date(documentInfo.upload_date).toLocaleDateString() : 'Previously uploaded'
        });
      } else {
        setHasUploadedDocument(false);
        setUploadedFileInfo(null);
      }
    } else if (documentInfo === null && !selectedBusinessId) {
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
          uploadDate: doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Previously uploaded'
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
  const isQuestionHighlighted = questionId => {
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
    return <div className="editable-brief-section--s23">
        <div className="editable-brief-section--s24">
          <AlertCircle size={16} />
          {isExtendedHighlight ? 'Answers Need More Detail' : 'Analysis Requires Additional Information'}
          {onClearHighlight && <button onClick={onClearHighlight} className="editable-brief-section--s25">
              <X size={14} />
            </button>}
        </div>
        <div>
          {highlightedMissingQuestions.message || `To generate <strong>${highlightedMissingQuestions.analysis_type}</strong> analysis,
            please answer the highlighted questions below.`}
        </div>
        <div className="editable-brief-section--s26">
          Questions highlighted: {highlightedMissingQuestions.missing_questions.map(q => q.order).join(', ')}
        </div>
      </div>;
  };
  const generateBriefFields = () => {
    const fields = [];
    const phaseOrderMap = {
      'initial': 1,
      'essential': 2,
      'advanced': 3
    };
    const filteredQuestions = questions.filter(q => q.phase && !['good'].includes(q.phase.toLowerCase()));
    const sortedQuestions = [...filteredQuestions].sort((a, b) => {
      const phaseA = phaseOrderMap[a.phase?.toLowerCase()] || 4;
      const phaseB = phaseOrderMap[b.phase?.toLowerCase()] || 4;
      if (phaseA !== phaseB) {
        return phaseA - phaseB;
      }
      return (a.order || 0) - (b.order || 0);
    });
    let sequentialNumber = 1;
    sortedQuestions.forEach(question => {
      const qId = question._id || question.question_id;
      const answer = userAnswers[qId] || '';
      fields.push({
        key: `question_${qId}`,
        label: question.question_text,
        value: answer,
        questionId: qId,
        phase: question.phase,
        severity: question.severity,
        order: question.order,
        sequentialNumber: sequentialNumber++
      });
    });
    setBriefFields(fields);
  };
  const showToastMessage = (message, type = 'success') => {
    setShowToast({
      show: true,
      message,
      type
    });
    setTimeout(() => setShowToast({
      show: false,
      message: '',
      type: 'success'
    }), 5000);
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
      const questionId = String(question._id || question.question_id);
      const existingAnswerId = answerIds[questionId];
      let response;
      if (existingAnswerId) {
        response = await answerService.updateAnswer(existingAnswerId, newAnswer);
      } else {
        response = await answerService.createAnswer(selectedBusinessId, questionId, newAnswer);
        if (response && response.data && response.data._id) {
          if (setAnswerIds) {
            setAnswerIds(prev => ({
              ...prev,
              [questionId]: response.data._id
            }));
          }
        }
      }
      return response;
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
    }, 3000);
  };
  const handleEdit = field => {
    setEditingField(field.key);
    setTimeout(() => {
      const fieldElement = fieldRefs.current[field.key];
      if (fieldElement) {
        const yOffset = -250;
        const y = fieldElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({
          top: y,
          behavior: "smooth"
        });
      }
      const input = inputRefs.current[field.key];
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 120);
  };
  const handleSave = async field => {
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
  const progressPercentage = totalQuestions > 0 ? Math.round(answeredQuestions / totalQuestions * 100) : 0;
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
      let onboardingData = null;
      try {
        const analysisResult = await analysisService.getPMFAnalysis(selectedBusinessId);
        onboardingData = analysisResult?.analysis?.onboarding_data || analysisResult?.onboarding_data;
      } catch (err) {
        console.warn("Could not fetch onboarding data:", err);
      }
      if (!onboardingData || Object.keys(onboardingData).length === 0) {
        showToastMessage(t("completeOnboardingPrompt") || "Please complete the PMF Onboarding to see answers here.", 'error');
        setIsEnriching(false);
        return;
      }
      const companyNameField = briefFields.find(f => f.label.toLowerCase().includes('company') || f.label.toLowerCase().includes('name'));
      const companyName = onboardingData?.companyName || companyNameField?.value || "";
      const rawPayload = {
        company: {
          name: companyName || "N/A",
          website: onboardingData?.website || "N/A",
          location: {
            city: onboardingData?.city || "N/A",
            country: onboardingData?.country || "N/A"
          },
          industry: onboardingData?.primaryIndustry || "N/A",
          geographies: [onboardingData?.geography1, onboardingData?.geography2, onboardingData?.geography3].filter(Boolean),
          profits: {
            source: {
              [t("Segments")]: [onboardingData?.customerSegment1, onboardingData?.customerSegment2, onboardingData?.customerSegment3].filter(Boolean),
              [t("Products")]: [onboardingData?.productService1, onboardingData?.productService2, onboardingData?.productService3].filter(Boolean),
              [t("Channels")]: [onboardingData?.channel1, onboardingData?.channel2, onboardingData?.channel3].filter(Boolean)
            }
          },
          objective: onboardingData?.strategicObjective === "Other" ? onboardingData?.strategicObjectiveOther : onboardingData?.strategicObjective || "N/A",
          constraint: {
            primary: onboardingData?.keyChallenge === "Other" ? onboardingData?.keyChallengeOther : onboardingData?.keyChallenge || "N/A"
          },
          usp: onboardingData?.differentiation ? [...onboardingData.differentiation.filter(d => d !== 'Other'), onboardingData.differentiationOther].filter(Boolean) : []
        }
      };
      const result = await analysisService.makeAPICall('answer-questions-with-enrichment', null, null, selectedBusinessId, null, null, null, companyName, rawPayload);
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
        headers: {
          'Authorization': `Bearer ${token}`
        },
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
  const handleFileUpload = async event => {
    const file = event.target.files[0];
    if (!file) return;
    const allowedTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
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
      if (onUploadedFileUpdate) {
        onUploadedFileUpdate(file);
      }
      if (onAnalysisRegenerate) {
        setIsFinancialRegenerating(true);
        onAnalysisRegenerate({
          onlyFinancial: true,
          uploadedFile: file,
          skipConfirmation: true
        });
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
      const updatedQuestionIds = [];
      const answersToSave = enrichedAnswers.map(enriched => {
        const field = briefFields.find(f => f.label === enriched.question);
        if (field) {
          updatedQuestionIds.push(field.questionId);
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
      const newAnswerIds = {
        ...answerIds
      };
      let idsUpdated = false;
      const toCreate = [];
      const toUpdate = [];
      answersToSave.forEach(item => {
        const qIdStr = String(item.question_id);
        const existingId = answerIds[qIdStr];
        if (existingId) {
          toUpdate.push({
            id: existingId,
            ...item
          });
        } else {
          toCreate.push(item);
        }
      });
      if (toCreate.length > 0) {
        try {
          const bulkRes = await answerService.bulkCreateAnswers(selectedBusinessId, toCreate.map(item => ({
            question_id: item.question_id,
            answer: item.answer_text
          })));
          if (bulkRes && bulkRes.data && bulkRes.data.insertedIds) {
            toCreate.forEach((item, index) => {
              const newId = bulkRes.data.insertedIds[index];
              if (newId) {
                newAnswerIds[String(item.question_id)] = newId;
                idsUpdated = true;
              }
            });
          }
        } catch (err) {
          console.error('Failed to bulk create answers:', err);
        }
      }
      if (toUpdate.length > 0) {
        try {
          await answerService.bulkUpdateAnswers(selectedBusinessId, toUpdate.map(item => ({
            answer_id: item.id,
            answer: item.answer_text
          })));
        } catch (err) {
          console.error('Failed to bulk update answers:', err);
        }
      }
      if (idsUpdated && setAnswerIds) {
        setAnswerIds(newAnswerIds);
      }
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
      if (onAnalysisRegenerate) {
        onAnalysisRegenerate({
          updatedQuestionIds,
          alsoRegenerateStrategic: true,
          skipConfirmation: true,
          skipFinancial: true
        });
      }
    } catch (error) {
      console.error('Apply enrichment error:', error);
      showToastMessage('Failed to apply enriched answers', 'error');
    } finally {
      setIsApplyingEnrichment(false);
    }
  };
  return <div className="editable-brief-section">
      {showToast.show && <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>}

      {renderMissingQuestionsBanner()}

      {enrichedAnswers && <div className="enrichment-preview editable-brief-section--s27">
          <div className="editable-brief-section--s28">
            <h5 className="editable-brief-section--s29">
              AI Enrichment Suggestions
            </h5>
            <div className="editable-brief-section--s30">
              <button onClick={() => setEnrichedAnswers(null)} className="editable-brief-section--s31">
                Discard
              </button>
              <button onClick={handleApplyEnrichedAnswers} disabled={isApplyingEnrichment} style={{
            cursor: isApplyingEnrichment ? 'not-allowed' : 'pointer'
          }} className="editable-brief-section--s32">
                {isApplyingEnrichment ? <Loader size={14} className="antigravity-rotating" /> : <Check size={14} />}
                Apply All Answers
              </button>
            </div>
          </div>
          <div className="editable-brief-section--s33">
            {enrichedAnswers.map((item, idx) => <div key={idx} className="editable-brief-section--s34">
                <div className="editable-brief-section--s35">
                  {item.question}
                </div>
                <div className="editable-brief-section--s36">
                  {item.answer}
                </div>
              </div>)}
          </div>
        </div>}

      {(isAnalysisRegenerating || isStrategicRegenerating || isSaving || isEssentialPhaseGenerating || isApplyingEnrichment || isFileUploading) && <div className="analysis-regenerating-banner">
          <Loader size={16} className="antigravity-rotating" />
          <span>
            {isApplyingEnrichment ? 'Generating AI answers and regenerating insights...' : isFileUploading || isFinancialRegenerating ? 'Regenerating financial insights like profitability, growth tracker, liquidity, investment performance, leverage and risk insight...' : isSaving ? 'Saving changes...' : isAnalysisRegenerating || isStrategicRegenerating ? 'Generating all Insights & STRATEGIC analysis...' : isEssentialPhaseGenerating ? 'Generating Insight...' : ''}
          </span>
        </div>}

      {}

      <div className="brief-content">
        <div className="brief-list">
          {isLoading ? <div className="loading-state editable-brief-section--s37">
              <Loader size={24} className="antigravity-rotating" />
              <p>Loading your business information...</p>
            </div> : briefFields.length > 0 ? (() => {
          const rows = [];
          rows.push(<div key="feature-blocks-row" className="editable-brief-section--s38">
                  {hasPmfAccess && <AIAnswerSupportBlock onGenerateEnrichment={handleGenerateEnrichment} isEnriching={isEnriching} isApplyingEnrichment={isApplyingEnrichment} isAnalysisRegenerating={isAnalysisRegenerating} isStrategicRegenerating={isStrategicRegenerating} isSaving={isSaving} canEnrich={canEnrich} />}

                  <FinancialUploadBlock hasUploadedDocument={hasUploadedDocument} uploadedFileInfo={uploadedFileInfo} onOpenManagement={() => setShowTemplatesPopup(true)} canEdit={canEdit} isAnalysisRegenerating={isAnalysisRegenerating} isStrategicRegenerating={isStrategicRegenerating} />
                </div>);
          briefFields.forEach((field, index) => {
            rows.push(<EditableField key={field.key} field={field} editingField={editingField} editedFields={editedFields} isQuestionHighlighted={isQuestionHighlighted} canEdit={canEdit} handleEdit={handleEdit} isAnalysisRegenerating={isAnalysisRegenerating} isStrategicRegenerating={isStrategicRegenerating} isSaving={isSaving} isEssentialPhaseGenerating={isEssentialPhaseGenerating} isEnriching={isEnriching} isApplyingEnrichment={isApplyingEnrichment} isLaunchedStatus={isLaunchedStatus} inputRefs={inputRefs} fieldRefs={fieldRefs} handleSave={handleSave} handleCancel={handleCancel} handleAutoSave={handleAutoSave} isLastField={index === briefFields.length - 1} />);
          });
          return rows;
        })() : <div className="no-data">
              <p>{t('businessInfoMessage') || 'Your business info will show here once you answer questions.'}</p>
              {questions.length > 0 && Object.keys(userAnswers).length === 0 && <p className="help-text">
                  Complete questions in the Assistant tab to see your business information here.
                </p>}
            </div>}
        </div>
      </div>
      {showTemplatesPopup && <FinancialTemplatesPopup isOpen={showTemplatesPopup} onClose={() => setShowTemplatesPopup(false)} isFileUploading={isFileUploading} onFileUploaded={(file, validation) => {
      const mockEvent = {
        target: {
          files: [file]
        }
      };
      handleFileUpload(mockEvent);
      setShowTemplatesPopup(false);
    }} />}
    </div>;
};
export default EditableBriefSection;
