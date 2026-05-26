import React, { useState, useEffect, useRef } from 'react';
import {
  Edit3, Check, X, Loader, AlertCircle, Sparkles, Wand2, Upload, FileText, Database, RefreshCw,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle, FileSpreadsheet, HelpCircle, Eye, ArrowRight, BookOpen, Trash2
} from 'lucide-react';
import { AnalysisApiService } from '../services/analysisApiService';
import { answerService } from '../services/answerService';
import { useTranslation } from "../hooks/useTranslation";
import FinancialTemplatesPopup from './FinancialTemplatesPopup';
import { detectTemplateType, validateAgainstTemplate } from '../utils/templateValidator';
import '../styles/CompanyManagement.css';
import { useAuthStore } from '../store/authStore';
import { useAnalysisStore } from '../store/analysisStore';
import DOMPurify from 'dompurify';
import RichTextEditor from './RichTextEditor';
import { markdownToHtml } from '../utils/markdownHelper';
import ConfirmationModal from './ConfirmationModal';

const cleanValue = (val) => {
  if (!val || val === '[Question Skipped]') return '';
  return val.replace(/^\[AI Extraction\]\s*/i, '');
};

const stripMarkdown = (md) => {
  if (!md) return '';
  return md
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^-\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
};

// Generates dynamic source citation metadata for each question based on active business & document details
const getQuestionIntelligence = (field, docName, details) => {
  if (!details) {
    return {
      hasCitation: false
    };
  }

  const original = details.ai_answer !== undefined && details.ai_answer !== null && details.ai_answer !== ''
    ? details.ai_answer
    : (field.value && field.value.startsWith('[AI Extraction]')
      ? field.value
      : null);

  if (details.status === 'FOUND') {
    const conf = details.confidence >= 0.7 ? 'High' : details.confidence >= 0.5 ? 'Medium' : 'Low';
    const color = conf === 'High' ? '#10b981' : conf === 'Medium' ? '#f59e0b' : '#ef4444';
    
    let docCitation = docName || 'Strategic Document';
    let excerpt = '';
    
    if (Array.isArray(details.evidence) && details.evidence.length > 0) {
      const firstEv = details.evidence[0];
      const sourceDoc = firstEv.document_name || docName || 'Strategic Document';
      docCitation = `${sourceDoc} (Page ${firstEv.page || 1})`;
      excerpt = firstEv.text ? `"...${firstEv.text}..."` : '';
    }

    return {
      conf,
      color,
      doc: docCitation,
      excerpt,
      original,
      hasCitation: true
    };
  }
  
  if (details.status === 'NOT_FOUND') {
    let docCitation = docName || 'Strategic Document';
    if (Array.isArray(details.evidence) && details.evidence.length > 0) {
      const firstEv = details.evidence[0];
      docCitation = firstEv.document_name || docName || 'Strategic Document';
    }
    const finalOriginal = original || 'Not found';
    return {
      conf: 'None',
      color: '#9ca3af',
      doc: docCitation,
      excerpt: 'No relevant information found in the document.',
      original: finalOriginal,
      hasCitation: true
    };
  }

  return {
    original,
    hasCitation: false
  };
};

const SimpleQuestionCard = ({
  field,
  editingField,
  editedFields,
  isQuestionHighlighted,
  canEdit,
  handleEdit,
  isSaving,
  isAnalysisRegenerating,
  isStrategicRegenerating,
  inputRefs,
  fieldRefs,
  handleSave,
  handleCancel,
  handleAutoSave,
  onOpenReference,
  docName,
  expandAll
}) => {
  const { t } = useTranslation();
  const [showOriginal, setShowOriginal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isEditing = editingField === field.key;
  const isEdited = editedFields.has(field.key);
  const isHighlighted = isQuestionHighlighted(field.questionId);

  // Synchronize local expand state with global expandAll changes
  useEffect(() => {
    setIsExpanded(expandAll);
  }, [expandAll]);

  // effectiveExpanded: local state, synchronized with global actions
  const effectiveExpanded = isExpanded;

  // Retrieve details from Zustand store
  const answersDetails = useAnalysisStore(state => state.answersDetails || {});
  const details = answersDetails[field.questionId];

  const isRefinedAI = !!(details && details.status === 'REFINED');

  // Dynamic citation extraction
  const intel = isRefinedAI ? { hasCitation: false } : getQuestionIntelligence(field, docName, details);

  const isAI = !isRefinedAI && field.value && (field.value.startsWith('[AI Extraction]') || (!details || !details.user_answer));
  const hasValue = field.value && field.value !== '[Question Skipped]';
  const cleanVal = cleanValue(field.value);

  // Compact inline preview (first 90 chars)
  const cleanValPlain = stripMarkdown(cleanVal);
  const previewText = cleanValPlain ? (cleanValPlain.length > 90 ? cleanValPlain.slice(0, 90) + '…' : cleanValPlain) : null;

  // Auto-expand when editing starts
  const handleEditClick = () => {
    if (canEdit && !isSaving) {
      setIsExpanded(true);
      handleEdit(field);
    }
  };

  return (
    <div
      ref={el => fieldRefs.current[field.key] = el}
      className={`sqc-row ${isHighlighted ? 'highlighted' : ''} ${isEditing ? 'sqc-editing' : ''} ${effectiveExpanded ? 'sqc-expanded' : ''}`}
    >
      {/* Compact summary row — always visible */}
      <div className="sqc-summary" onClick={() => !isEditing && setIsExpanded(prev => !prev)}>
        {/* Left: number + status dot */}
        <div className="sqc-left">
          <span className="sqc-num">{field.sequentialNumber}</span>
          {hasValue ? (
            <span className="sqc-status-dot" style={{ backgroundColor: isAI ? '#a855f7' : (isRefinedAI ? '#475569' : '#3b82f6') }} title={isAI ? 'AI Answer' : (isRefinedAI ? 'Refined Answer' : 'Edited')} />
          ) : (
            <span className="sqc-status-dot sqc-dot-empty" title="No answer yet" />
          )}
        </div>

        {/* Center: question label + answer preview */}
        <div className="sqc-center">
          <span className="sqc-question-text">{field.label}</span>
          {hasValue && !effectiveExpanded && !isEditing && (
            <span className={`sqc-answer-preview ${isAI ? 'sqc-preview-ai' : 'sqc-preview-user'}`}>
              {previewText}
            </span>
          )}
          {!hasValue && !effectiveExpanded && (
            <span className="sqc-answer-preview sqc-preview-empty">No answer yet — click to add</span>
          )}
        </div>

        {/* Right: confidence dot + expand chevron */}
        <div className="sqc-right">
          {intel.hasCitation && (
            <span className="sqc-conf-dot" style={{ backgroundColor: intel.color }} title={`${intel.conf} Confidence`} />
          )}
          {isEdited && !isAI && <CheckCircle size={13} style={{ color: '#3b82f6', flexShrink: 0 }} />}
          {!effectiveExpanded && <ChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />}
          {effectiveExpanded && <ChevronUp size={14} style={{ color: '#6366f1', flexShrink: 0 }} />}
        </div>
      </div>

      {/* Expanded content — full answer, edit, actions */}
      {(effectiveExpanded || isEditing) && (
        <div className="sqc-expanded-body">
          {/* Original AI compare view */}
          {showOriginal ? (
            <div className="original-ai-answer-box">
              {intel.original && (
                <div style={{ marginBottom: (details && details.previous_answer) ? '8px' : '0' }}>
                  <strong>Original AI Ingested:</strong> {cleanValue(intel.original)}
                </div>
              )}
              {details && details.previous_answer && cleanValue(details.previous_answer) !== cleanValue(field.value) && (
                <div className="sqc-previous-answer-box" style={{ marginTop: intel.original ? '8px' : '0', paddingTop: intel.original ? '8px' : '0', borderTop: intel.original ? '1px dashed #cbd5e1' : 'none', fontSize: '11px', color: '#64748b' }}>
                  <strong>Previous Version:</strong> {cleanValue(details.previous_answer)}
                </div>
              )}
            </div>
          ) : null}

          {/* Answer box — editing or read mode */}
          {!showOriginal && isEditing && canEdit ? (
            <div>
              <RichTextEditor
                ref={el => inputRefs.current[field.key] = el}
                defaultValue={cleanVal}
                disabled={isSaving || isAnalysisRegenerating}
                placeholder="Write your answer..."
                onChange={value => handleAutoSave(field, value)}
              />
              <div className="save-actions-wrapper">
                <div className="save-status-text">
                  {isSaving ? 'Saving...' : isEdited ? 'Changes saved' : ''}
                </div>
                <div className="save-buttons-group">
                  <button onClick={() => { handleCancel(); setIsExpanded(false); }} disabled={isSaving} className="btn-cancel-action">
                    Cancel
                  </button>
                  <button onClick={() => handleSave(field)} disabled={isSaving} className="btn-save-action">
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : !showOriginal ? (
            <div
              onClick={handleEditClick}
              className={
                !hasValue
                  ? 'brief-answer-empty sqc-full-answer'
                  : isAI
                    ? 'brief-answer-ai sqc-full-answer'
                    : 'brief-answer-user sqc-full-answer'
              }
              style={{ cursor: canEdit ? 'pointer' : 'default' }}
              dangerouslySetInnerHTML={{
                __html: cleanVal 
                  ? DOMPurify.sanitize(markdownToHtml(cleanVal)) 
                  : 'Click here to add your strategic answer...'
              }}
            />
          ) : null}

          {/* Bottom action row */}
          {hasValue && !isEditing && (
            <div className="sqc-action-row">
              <div className="sqc-badges">
                {!isRefinedAI && (
                  isAI ? (
                    <span className="brief-badge-ai"><Sparkles size={10} /> AI</span>
                  ) : (
                    <span className="brief-badge-user"><Check size={10} /> Edited</span>
                  )
                )}
                {intel.hasCitation && !isRefinedAI && (
                  <span className="sqc-conf-badge" style={{ color: intel.color, borderColor: intel.color + '40' }}>
                    <span className="sqc-conf-dot-sm" style={{ backgroundColor: intel.color }} />
                    {intel.conf}
                  </span>
                )}
              </div>
              <div className="card-bottom-actions">
                {((!isAI && !isRefinedAI) || (details && details.previous_answer && cleanValue(details.previous_answer) !== cleanValue(field.value))) && (
                  <button className="simple-text-toggle" onClick={() => setShowOriginal(!showOriginal)}>
                    <Sparkles size={11} />
                    {showOriginal ? (isRefinedAI ? 'Show Refined' : 'Show Current') : 'Compare'}
                  </button>
                )}
                {intel.hasCitation && !isRefinedAI && (
                  <button
                    className="simple-text-toggle citation-trigger"
                    style={{ color: '#2563eb' }}
                    onClick={() => onOpenReference({ title: field.label, ...intel })}
                  >
                    <Eye size={11} /> Citation
                  </button>
                )}
                <button className="simple-text-toggle sqc-edit-btn" onClick={handleEditClick}>
                  <Edit3 size={11} /> Edit
                </button>
              </div>
            </div>
          )}
          {!hasValue && !isEditing && (
            <div className="sqc-action-row">
              <button className="sqc-add-btn" onClick={handleEditClick}>
                <Edit3 size={11} /> Add Answer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
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
  hasPmfAccess = false
}) => {
  const answersDetails = useAnalysisStore(state => state.answersDetails || {});
  const lastFetchedBusinessId = useAnalysisStore(state => state.lastFetchedBusinessId);
  const [editingField, setEditingField] = useState(null);
  const [briefFields, setBriefFields] = useState([]);
  const [editedFields, setEditedFields] = useState(new Set());
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [isSaving, setIsSaving] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isApplyingEnrichment, setIsApplyingEnrichment] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({ title: '', message: '', onConfirm: () => {} });
  const [showTemplatesPopup, setShowTemplatesPopup] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isFinancialRegenerating, setIsFinancialRegenerating] = useState(false);
  const [isAnalyzingDocs, setIsAnalyzingDocs] = useState(false);

  // States for Multiple File Upload System
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [activePhaseTab, setActivePhaseTab] = useState('initial');
  const [leftPanelExpanded, setLeftPanelExpanded] = useState({
    refineAi: true,
    fileUpload: false,
    financialUpload: false
  });

  // Accordions default collapsed by default
  const [expandedSections, setExpandedSections] = useState({
    initial: false,
    essential: false,
    advanced: false,
    ledger: false
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState(null);
  const [expandAll, setExpandAll] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(event.target)) {
        if (!event.target.closest('.citation-trigger')) {
          setDrawerOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [drawerOpen]);

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
  const analyzeBtnRef = useRef(null);
  const { t } = useTranslation();

  const [userRole, setUserRole] = useState("");
  useEffect(() => {
    const role = (useAuthStore.getState().userRole || "").toLowerCase();
    setUserRole(role);
  }, []);

  const isViewer = userRole === "viewer";
  const canEdit = !isViewer;

  const [isPmfCompleted, setIsPmfCompleted] = useState(false);

  useEffect(() => {
    let active = true;
    const checkPmfCompletion = async () => {
      if (!selectedBusinessId) return;
      try {
        const result = await analysisService.getPMFAnalysis(selectedBusinessId);
        if (!active) return;
        const onboardingData = result?.analysis?.onboarding_data || result?.onboarding_data;
        const hasOnboarding = onboardingData && Object.keys(onboardingData).length > 0;
        setIsPmfCompleted(!!hasOnboarding);
      } catch (err) {
        console.warn("Failed to check PMF completion:", err);
        if (active) setIsPmfCompleted(false);
      }
    };
    checkPmfCompletion();

    const handlePmfUpdated = () => {
      checkPmfCompletion();
    };
    window.addEventListener("pmfOnboardingCompleted", handlePmfUpdated);
    window.addEventListener("conversationUpdated", handlePmfUpdated);

    return () => {
      active = false;
      window.removeEventListener("pmfOnboardingCompleted", handlePmfUpdated);
      window.removeEventListener("conversationUpdated", handlePmfUpdated);
    };
  }, [selectedBusinessId, analysisService]);

  useEffect(() => {
    if (questions && questions.length > 0) {
      generateBriefFields();
    }
  }, [questions, userAnswers]);

  // Reset uploaded files state when the business selection changes
  useEffect(() => {
    setUploadedFiles([]);
  }, [selectedBusinessId]);

  // Sync initial loaded financial document into our multi-file library
  useEffect(() => {
    if (documentInfo) {
      if (documentInfo.filename || documentInfo.id || documentInfo.has_document || documentInfo.file_size) {
        const docName = documentInfo.filename || 'Financial_Statement.xlsx';
        setUploadedFiles(prev => {
          if (prev.some(f => f.name === docName)) return prev;
          return [
            ...prev,
            {
              id: documentInfo.id || 'db-financial',
              name: docName,
              size: documentInfo.file_size || documentInfo.size || 240000,
              uploadDate: documentInfo.upload_date ? new Date(documentInfo.upload_date).toLocaleDateString() : 'Active Ingestion',
              status: 'success',
              type: 'spreadsheet',
              progress: 100
            }
          ];
        });
      }
    }
  }, [documentInfo]);

  // Fetch strategic documents from database
  useEffect(() => {
    let active = true;
    const loadStrategicDocs = async () => {
      if (!selectedBusinessId) return;
      try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/strategic-documents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch strategic documents');
        const data = await response.json();
        if (!active) return;

        setUploadedFiles(prev => {
          // Retain only spreadsheets and temporary upload-queue files
          const nonDbStrategic = prev.filter(f => !f.id.startsWith('db-strategic-'));
          const dbStrategic = (data.documents || []).map(doc => ({
            id: `db-strategic-${doc.filename}`,
            name: doc.original_name,
            size: doc.file_size || 512000,
            uploadDate: doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Uploaded',
            status: 'success',
            type: doc.original_name.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
            progress: 100
          }));
          return [...nonDbStrategic, ...dbStrategic];
        });
      } catch (err) {
        console.error('Failed to load strategic documents:', err);
      }
    };

    loadStrategicDocs();
    return () => {
      active = false;
    };
  }, [selectedBusinessId, API_BASE_URL]);



  const isQuestionHighlighted = questionId => {
    if (!highlightedMissingQuestions?.missing_questions) return false;
    const question = questions.find(q => (q._id || q.question_id) === questionId);
    if (!question) return false;
    return highlightedMissingQuestions.missing_questions.some(q => q.order === question.order);
  };

  const generateBriefFields = () => {
    const fields = [];
    const phaseOrderMap = { 'initial': 1, 'essential': 2, 'advanced': 3 };
    const filteredQuestions = questions.filter(q => q.phase && !['good'].includes(q.phase.toLowerCase()));

    const sortedQuestions = [...filteredQuestions].sort((a, b) => {
      const phaseA = phaseOrderMap[a.phase?.toLowerCase()] || 4;
      const phaseB = phaseOrderMap[b.phase?.toLowerCase()] || 4;
      if (phaseA !== phaseB) return phaseA - phaseB;
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
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const updateConversationAnswer = async (field, newAnswer) => {
    try {
      setIsSaving(true);
      const question = questions.find(q => {
        const qId = q._id || q.question_id;
        return String(qId) === String(field.questionId);
      });
      if (!question) throw new Error('Question not found');
      const questionId = String(question._id || question.question_id);
      const existingAnswerId = answerIds[questionId];
      let response;
      if (existingAnswerId) {
        response = await answerService.updateAnswer(existingAnswerId, newAnswer, {
          status: 'EDITED',
          confidence: 0,
          evidence: []
        });
      } else {
        response = await answerService.createAnswer(selectedBusinessId, questionId, newAnswer, {
          status: 'EDITED',
          confidence: 0,
          evidence: []
        });
        if (response && response.data && response.data._id) {
          if (setAnswerIds) {
            setAnswerIds(prev => ({ ...prev, [questionId]: response.data._id }));
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

          // Also update Zustand store directly to keep it in sync instantly!
          const currentDetails = { ...useAnalysisStore.getState().answersDetails };
          const prevDetail = currentDetails[field.questionId] || {};
          currentDetails[field.questionId] = {
            ...prevDetail,
            status: 'EDITED',
            confidence: 0,
            evidence: [],
            user_answer: value.trim(),
            previous_answer: prevDetail.user_answer || prevDetail.previous_answer || null
          };
          useAnalysisStore.setState({ answersDetails: currentDetails });

          showToastMessage('Auto-saved successfully', 'success');
        } catch (error) {
          showToastMessage('Auto-save failed', 'error');
        }
      }
    }, 3000);
  };

  const handleEdit = field => {
    setEditingField(field.key);
    setTimeout(() => {
      const input = inputRefs.current[field.key];
      if (input) input.focus();
    }, 120);
  };

  const handleSave = async field => {
    const input = inputRefs.current[field.key];
    const newValue = input?.value || '';
    try {
      await updateConversationAnswer(field, newValue.trim());
      if (onAnswerUpdate) {
        onAnswerUpdate(field.questionId, newValue.trim());
      }
      setEditedFields(prev => new Set([...prev, field.key]));

      // Also update Zustand store directly to keep it in sync instantly!
      const currentDetails = { ...useAnalysisStore.getState().answersDetails };
      const prevDetail = currentDetails[field.questionId] || {};
      currentDetails[field.questionId] = {
        ...prevDetail,
        status: 'EDITED',
        confidence: 0,
        evidence: [],
        user_answer: newValue.trim(),
        previous_answer: prevDetail.user_answer || prevDetail.previous_answer || null
      };
      useAnalysisStore.setState({ answersDetails: currentDetails });

      showToastMessage('Answer updated successfully!', 'success');
    } catch (error) {
      showToastMessage('Failed to update answer', 'error');
    }
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  // Reusable fully dynamic original database save function
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

  const saveStrategicFileToDatabase = async (file) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');
      if (!selectedBusinessId) throw new Error('No business selected');

      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/strategic-document`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save strategic document to database');
      return result;
    } catch (error) {
      console.error('Strategic database save error:', error);
      throw error;
    }
  };

  // Drag and Drop event handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      processMultipleFiles(files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      processMultipleFiles(files);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Multiple File sequential validation and upload engine
  const processMultipleFiles = async (files) => {
    const maxFilesLimit = parseInt(import.meta.env.VITE_MAX_FILE_UPLOAD_LIMIT, 10) || 5;
    const maxFileSizeMB = parseInt(import.meta.env.VITE_MAX_FILE_SIZE_MB, 10) || 15;
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    const currentFilesCount = uploadedFiles.length;
    if (currentFilesCount + files.length > maxFilesLimit) {
      showToastMessage(`Upload limit exceeded. You can upload a maximum of ${maxFilesLimit} files.`, 'error');
      return;
    }

    for (const file of files) {
      // Check file size
      if (file.size > maxFileSizeBytes) {
        showToastMessage(`File "${file.name}" exceeds the size limit of ${maxFileSizeMB}MB.`, 'error');
        continue;
      }

      // Check if file is already added to queue
      if (uploadedFiles.some(f => f.name === file.name)) {
        showToastMessage(`File "${file.name}" is already uploaded.`, 'info');
        continue;
      }

      const fileExt = file.name.split('.').pop().toLowerCase();
      const isSpreadsheet = ['xlsx', 'xls', 'csv'].includes(fileExt);
      const isDoc = ['pdf', 'docx'].includes(fileExt);

      if (!isSpreadsheet && !isDoc) {
        showToastMessage(`File "${file.name}" format is unsupported. Please upload Excel, CSV, PDF, or Word files.`, 'error');
        continue;
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newFileObj = {
        id: fileId,
        name: file.name,
        size: file.size,
        uploadDate: new Date().toLocaleDateString(),
        status: 'uploading',
        progress: 15,
        type: fileExt === 'pdf' ? 'pdf' : fileExt === 'docx' ? 'docx' : 'spreadsheet'
      };

      // Add to file library state
      setUploadedFiles(prev => [...prev, newFileObj]);

      // Progress animation
      let progressVal = 15;
      const progressInterval = setInterval(() => {
        progressVal = Math.min(progressVal + 20, 90);
        setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: progressVal } : f));
      }, 250);

      try {
        if (isSpreadsheet) {
          // Detect template & validate
          const detection = await detectTemplateType(file);
          if (detection.confidence === 'none' || detection.score < 0.3) {
            throw new Error(`Spreadsheet structure not identified. Ensure it matches financial templates.`);
          }
          const validation = await validateAgainstTemplate(file, detection.type);
          if (!validation.isValid) {
            throw new Error(`Validation failed for: ${validation.templateName}`);
          }
          const validationResult = {
            templateType: detection.type,
            templateName: validation.templateName,
            validation: validation,
            confidence: detection.confidence,
            uploadMode: 'auto-detect'
          };

          // Actual backend upload
          await saveFileToDatabase(file, validationResult);

          if (onUploadedFileUpdate) {
            onUploadedFileUpdate(file);
          }

          if (onAnalysisRegenerate) {
            onAnalysisRegenerate({
              onlyFinancial: true,
              uploadedFile: file,
              skipConfirmation: true
            });
          }

          clearInterval(progressInterval);
          setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: 100, status: 'success' } : f));
          showToastMessage(`File "${file.name}" ingested successfully!`, 'success');
        } else {
          // Strategic PDF/DOCX - upload to database immediately!
          const result = await saveStrategicFileToDatabase(file);
          
          clearInterval(progressInterval);
          setUploadedFiles(prev => prev.map(f => f.id === fileId ? { 
            ...f, 
            id: `db-strategic-${result.document.filename}`,
            progress: 100, 
            status: 'success', 
            fileObject: file 
          } : f));
          showToastMessage(`File "${file.name}" uploaded successfully! Click "Analyze Document" to process.`, 'success');
        }
      } catch (error) {
        clearInterval(progressInterval);
        setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'failed', errorMessage: error.message } : f));
        showToastMessage(`Ingestion failed for "${file.name}": ${error.message || 'Verification error.'}`, 'error');
      }
    }
  };

  const handleRemoveFile = async (fileId, fileName) => {
    try {
      if (fileId.startsWith('db-strategic-')) {
        setIsSaving(true);
        showToastMessage(`Removing "${fileName}" references from database...`, 'info');

        // Also call the backend DELETE API to delete the strategic document itself
        const backendFilename = fileId.replace('db-strategic-', '');
        if (backendFilename && backendFilename !== fileName) {
          try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/strategic-document/${backendFilename}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            const result = await response.json();
            if (!response.ok) {
              console.warn('Failed to delete strategic document from database:', result.error);
            }
          } catch (err) {
            console.error('Failed to delete strategic document:', err);
          }
        }

        const toUpdate = [];
        const currentDetails = { ...useAnalysisStore.getState().answersDetails };

        Object.entries(currentDetails).forEach(([qId, detail]) => {
          if (detail && Array.isArray(detail.evidence)) {
            let matchesAny = false;
            const remainingEvidence = [];
            
            detail.evidence.forEach(ev => {
              if (ev && ev.document_name) {
                const names = ev.document_name.split(',').map(n => n.trim());
                if (names.includes(fileName)) {
                  matchesAny = true;
                  const newNames = names.filter(n => n !== fileName);
                  if (newNames.length > 0) {
                    remainingEvidence.push({
                      ...ev,
                      document_name: newNames.join(', ')
                    });
                  }
                } else {
                  remainingEvidence.push(ev);
                }
              } else {
                remainingEvidence.push(ev);
              }
            });

            if (matchesAny) {
              const existingId = answerIds[qId];
              if (existingId) {
                toUpdate.push({
                  answer_id: existingId,
                  answer: detail.user_answer || detail.ai_answer || '',
                  confidence: remainingEvidence.length > 0 ? detail.confidence : 0.0,
                  status: remainingEvidence.length > 0 ? detail.status : 'NOT_FOUND',
                  evidence: remainingEvidence
                });
              }
            }
          }
        });

        if (toUpdate.length > 0) {
          await answerService.bulkUpdateAnswers(selectedBusinessId, toUpdate);

          // Update Zustand store
          toUpdate.forEach(item => {
            const qId = Object.keys(answerIds).find(k => String(answerIds[k]) === String(item.answer_id));
            if (qId && currentDetails[qId]) {
              currentDetails[qId] = {
                ...currentDetails[qId],
                confidence: item.confidence,
                status: item.status,
                evidence: item.evidence
              };
            }
          });

          useAnalysisStore.setState({ answersDetails: currentDetails });
          showToastMessage(`Removed "${fileName}" and cleared citations.`, 'success');
        } else {
          showToastMessage(`Removed "${fileName}" from view.`, 'info');
        }
      } else if (fileId === 'db-financial' || fileId.startsWith('db-financial')) {
        setIsSaving(true);
        showToastMessage(`Deleting financial document "${fileName}" from server...`, 'info');
        
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/financial-document`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete financial document');
        }

        showToastMessage(`Financial document "${fileName}" deleted successfully.`, 'success');
        if (onBusinessDataUpdate) {
          onBusinessDataUpdate();
        }
      } else {
        // Queue/temporary files not yet persisted
        showToastMessage(`Removed "${fileName}" from active framework index.`, 'info');
      }

      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Error removing file:', error);
      showToastMessage(`Failed to remove file: ${error.message || 'Error occurred.'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Fully dynamic AI Answer Support compiler utilizing actual onboarding details and applying them directly
  const applyEnrichedAnswersDirectly = async (enrichedAnswersList) => {
    if (!enrichedAnswersList || enrichedAnswersList.length === 0) return;
    try {
      setIsApplyingEnrichment(true);
      const updatedQuestionIds = [];
      const answersToSave = enrichedAnswersList.map(enriched => {
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

      const newAnswerIds = { ...answerIds };
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
            answer: item.answer_text,
            confidence: 0,
            status: 'REFINED',
            evidence: [],
            ai_answer: null,
            user_answer: item.answer_text,
            previous_answer: null
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
          await answerService.bulkUpdateAnswers(selectedBusinessId, toUpdate.map(item => {
            const prevDetail = answersDetails[String(item.question_id)] || {};
            const prevAnswer = prevDetail.user_answer || prevDetail.ai_answer || prevDetail.previous_answer || null;
            return {
              answer_id: item.id,
              answer: item.answer_text,
              confidence: 0,
              status: 'REFINED',
              evidence: [],
              ai_answer: null,
              user_answer: item.answer_text,
              previous_answer: prevAnswer
            };
          }));
        } catch (err) {
          console.error('Failed to bulk update answers:', err);
        }
      }

      if (idsUpdated && setAnswerIds) {
        setAnswerIds(newAnswerIds);
      }

      // Update Zustand atomic state for AI enrichment answers
      const currentAnswers = { ...useAnalysisStore.getState().userAnswers };
      const currentDetails = { ...useAnalysisStore.getState().answersDetails };
      const currentCompleted = [...useAnalysisStore.getState().completedQuestions];

      answersToSave.forEach(item => {
        if (item.answer_text) {
          currentAnswers[item.question_id] = item.answer_text;
          if (!currentCompleted.includes(item.question_id)) {
            currentCompleted.push(item.question_id);
          }
        }
        const prevDetail = currentDetails[item.question_id] || {};
        const prevAnswer = prevDetail.user_answer || prevDetail.ai_answer || prevDetail.previous_answer || null;
        currentDetails[item.question_id] = {
          ...prevDetail,
          confidence: 0,
          status: 'REFINED',
          evidence: [],
          ai_answer: null,
          user_answer: item.answer_text || '',
          previous_answer: prevAnswer
        };
      });

      useAnalysisStore.setState({
        userAnswers: currentAnswers,
        answersDetails: currentDetails,
        completedQuestions: currentCompleted
      });

      answersToSave.forEach(item => {
        if (onAnswerUpdate) {
          onAnswerUpdate(item.question_id, item.answer_text);
        }
      });

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

  const handleGenerateEnrichment = async () => {
    try {
      setIsEnriching(true);
      let onboardingData = null;
      try {
        const analysisResult = await analysisService.getPMFAnalysis(selectedBusinessId);
        onboardingData = analysisResult?.analysis?.onboarding_data || analysisResult?.onboarding_data;
      } catch (err) {
        console.warn("Could not fetch onboarding data:", err);
      }

      if (!onboardingData || Object.keys(onboardingData).length === 0) {
        showToastMessage(t("completeOnboardingPrompt") || "Please complete the PMF Onboarding to generate suggestions.", 'error');
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

      const activeDocumentNames = uploadedFiles.filter(f => f.status === 'success').map(f => f.name).join(', ') || 'strategy documents';
      const result = await analysisService.makeAPICall('answer-questions-with-enrichment', null, null, selectedBusinessId, null, null, null, companyName, rawPayload);

      if (Array.isArray(result)) {
        await applyEnrichedAnswersDirectly(result);
      } else {
        throw new Error('Invalid response format from enrichment API');
      }
    } catch (error) {
      console.error('Enrichment error:', error);
      showToastMessage('Failed to generate enrichment suggestions', 'error');
    } finally {
      setIsEnriching(false);
    }
  };

  // Multiple File Strategic Document Ingestion & Bulk Save Flow
  const handleAnalyzeDocuments = async () => {
    // Find all strategic documents either loaded in memory or loaded from Azure Blob
    const filesToAnalyze = uploadedFiles.filter(
      f => (f.type === 'pdf' || f.type === 'docx')
    );

    if (filesToAnalyze.length === 0) {
      showToastMessage('No strategic documents in the queue to analyze.', 'info');
      return;
    }

    try {
      setIsAnalyzingDocs(true);

      // Update status of queued files to 'analyzing'
      setUploadedFiles(prev =>
        prev.map(f =>
          filesToAnalyze.some(fa => fa.id === f.id)
            ? { ...f, status: 'analyzing', progress: 30 }
            : f
        )
      );

      // Call the backend analysis API
      const result = await answerService.analyzeStrategicDocumentsBackend(selectedBusinessId);
      
      if (!result || !Array.isArray(result.answers)) {
        throw new Error(result?.error || 'Invalid response received from the analysis engine.');
      }

      const mappedAnswers = result.answers;
      
      // Update setAnswerIds prop if any were created
      const newAnswerIds = { ...answerIds };
      mappedAnswers.forEach(ans => {
        newAnswerIds[String(ans.question_id)] = String(ans._id);
        
        if (onAnswerUpdate) {
          onAnswerUpdate(ans.question_id, ans.answer || '');
        }
      });

      if (setAnswerIds) {
        setAnswerIds(newAnswerIds);
      }

      // Propagate answers to parent and update local highlights/edited fields
      const newlyEdited = new Set(editedFields);
      mappedAnswers.forEach(item => {
        newlyEdited.add(`question_${item.question_id}`);
      });
      setEditedFields(newlyEdited);

      // Atomic Zustand state update for reactive UI updates
      const currentAnswers = { ...useAnalysisStore.getState().userAnswers };
      const currentDetails = { ...useAnalysisStore.getState().answersDetails };
      const currentCompleted = [...useAnalysisStore.getState().completedQuestions];

      mappedAnswers.forEach(item => {
        currentAnswers[item.question_id] = item.answer || '';
        if (item.answer) {
          if (!currentCompleted.includes(item.question_id)) {
            currentCompleted.push(item.question_id);
          }
        } else {
          const idx = currentCompleted.indexOf(item.question_id);
          if (idx > -1) {
            currentCompleted.splice(idx, 1);
          }
        }
        currentDetails[item.question_id] = {
          confidence: item.confidence,
          status: item.status,
          evidence: item.evidence,
          ai_answer: item.answer || '',
          user_answer: item.user_answer || null,
          previous_answer: item.previous_answer || null
        };
      });

      useAnalysisStore.setState({
        userAnswers: currentAnswers,
        answersDetails: currentDetails,
        completedQuestions: currentCompleted
      });

      // Call onUploadedFileUpdate to register this file as ingested
      filesToAnalyze.forEach(file => {
        if (onUploadedFileUpdate && file.fileObject) {
          onUploadedFileUpdate(file.fileObject);
        }
      });

      // Set file status to success
      setUploadedFiles(prev =>
        prev.map(f =>
          filesToAnalyze.some(fa => fa.id === f.id)
            ? { ...f, status: 'success', progress: 100 }
            : f
        )
      );

      // Trigger AI Regeneration if needed
      if (onAnalysisRegenerate) {
        onAnalysisRegenerate({
          updatedQuestionIds: mappedAnswers.map(a => a.question_id),
          alsoRegenerateStrategic: true,
          skipConfirmation: true,
          skipFinancial: true
        });
      }

    } catch (err) {
      console.error('Batch Strategic Document analysis error:', err);
      const serverError = err.response?.data?.error || err.message || 'Error occurred.';
      setUploadedFiles(prev =>
        prev.map(f =>
          filesToAnalyze.some(fa => fa.id === f.id)
            ? { ...f, status: 'failed', errorMessage: serverError }
            : f
        )
      );
      showToastMessage(`Analysis failed: ${serverError}`, 'error');
    } finally {
      setIsAnalyzingDocs(false);
    }
  };

  // Drawer Reference Actions
  const handleOpenReference = (data) => {
    if (drawerOpen && drawerData && drawerData.title === data.title) {
      setDrawerOpen(false);
    } else {
      setDrawerData(data);
      setDrawerOpen(true);
    }
  };

  // Toggle Accordion Panels
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Dynamic spreadsheet ledger values
  const getLedgerValues = () => {
    const analysisStore = useAnalysisStore.getState();
    const profitability = analysisStore.profitabilityData?.profitability ||
      analysisStore.profitabilityData?.profitability_analysis ||
      analysisStore.profitabilityData?.profitabilityAnalysis;

    let revenue = 'N/A';
    let ebitda = 'N/A';
    let grossMargin = 'N/A';
    let ebitdaMargin = 'N/A';

    if (profitability) {
      if (profitability.revenue || profitability.annual_revenue) {
        const revVal = parseFloat(profitability.revenue || profitability.annual_revenue);
        if (!isNaN(revVal)) revenue = `$${revVal.toLocaleString()}`;
      }
      if (profitability.ebitda) {
        const ebitdaVal = parseFloat(profitability.ebitda);
        if (!isNaN(ebitdaVal)) ebitda = `$${ebitdaVal.toLocaleString()}`;
      }
      if (profitability.gross_margin) {
        const gmVal = parseFloat(profitability.gross_margin);
        if (!isNaN(gmVal)) grossMargin = `${gmVal.toFixed(1)}%`;
      }
      if (profitability.ebitda_margin) {
        const emVal = parseFloat(profitability.ebitda_margin);
        if (!isNaN(emVal)) ebitdaMargin = `${emVal.toFixed(1)}%`;
      }
    }

    return { revenue, ebitda, grossMargin, ebitdaMargin };
  };

  const ledgerVals = getLedgerValues();

  // Filter fields by phase
  const initialFields = briefFields.filter(f => f.phase === 'initial');
  const essentialFields = briefFields.filter(f => f.phase === 'essential');
  const advancedFields = briefFields.filter(f => f.phase === 'advanced');

  // Multi-file aggregate helper values
  const totalFileSizeKB = uploadedFiles.reduce((acc, f) => acc + (f.size || 0), 0) / 1024;
  const successfulIngestionCount = uploadedFiles.filter(f => (f.type === 'pdf' || f.type === 'docx') && f.status === 'success').length;
  const uploadedFilesCount = uploadedFiles.filter(f => f.status === 'uploaded').length;

  const strategyFiles = uploadedFiles.filter(f => f.type === 'pdf' || f.type === 'docx');
  const financialFiles = uploadedFiles.filter(f => f.type === 'spreadsheet');

  const initialCountStr = `${initialFields.filter(f => cleanValue(f.value).trim() !== '').length}/${initialFields.length}`;
  const essentialCountStr = `${essentialFields.filter(f => cleanValue(f.value).trim() !== '').length}/${essentialFields.length}`;
  const advancedCountStr = `${advancedFields.filter(f => cleanValue(f.value).trim() !== '').length}/${advancedFields.length}`;

  const currentTabFields = activePhaseTab === 'initial'
    ? initialFields
    : activePhaseTab === 'essential'
      ? essentialFields
      : advancedFields;

  const isAnyApiActive = isEnriching || isApplyingEnrichment || isAnalyzingDocs;

  return (
    <div className="simple-workspace">
      {showToast.show && (
        <div className={`brief-toast-container ${showToast.type}`}>
          {showToast.type === 'success' && <Check size={14} />}
          {showToast.type === 'error' && <AlertCircle size={14} />}
          {showToast.type === 'info' && <RefreshCw size={14} style={{ animation: 'spin 1.5s linear infinite' }} />}
          <span>{showToast.message}</span>
        </div>
      )}

      <div className="brief-split-layout">
        {/* Left Side: Uploads & AI Refinement */}
        <div className="brief-left-column">

          {/* 1. Refine AI Answers Section */}
          {isPmfCompleted && (
            <div className="brief-card refine-ai-card">
              <div 
                className={`brief-card-header accordion-header ${!leftPanelExpanded.refineAi ? 'collapsed' : ''}`}
                onClick={() => { if (isAnyApiActive) return; setLeftPanelExpanded(prev => ({ ...prev, refineAi: !prev.refineAi })); }}
                style={{ cursor: isAnyApiActive ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} style={{ color: '#4f46e5' }} />
                  <h4 className="brief-card-title">Refine AI Answers</h4>
                </div>
                {leftPanelExpanded.refineAi ? <ChevronUp size={16} style={{ color: '#64748b' }} /> : <ChevronDown size={16} style={{ color: '#64748b' }} />}
              </div>
              {leftPanelExpanded.refineAi && (
                <div className="brief-card-body">
                  {isEnriching ? (
                    <div className="in-page-loading-wrapper" style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                      <div className="spinner-container" style={{ display: 'inline-flex' }}>
                        <Loader size={28} className="animate-spin" style={{ color: '#4f46e5' }} />
                      </div>
                      <div style={{ color: '#1e293b', fontWeight: '500', fontSize: '14px' }}>
                        Generating AI answers based on PMF onboarding data...
                      </div>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>
                        This may take a moment as our LLM pipeline compiles your strategic insights.
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="brief-card-description">
                        Refine and pre-populate your strategic brief answers using AI-generated suggestions compiled from your onboarding setup details.
                      </p>

                      <button
                        onClick={() => {
                          if (!canEdit || isAnyApiActive) return;
                          setConfirmModalConfig({
                            title: t('Confirm AI Refinement') || 'Refine AI Answers',
                            message: 'By doing this, this will overwrite all the existing answers and it will regenerate the insights and strategic analysis. Are you sure you want to proceed?',
                            onConfirm: () => {
                              handleGenerateEnrichment();
                            }
                          });
                          setShowConfirmModal(true);
                        }}
                        disabled={isAnyApiActive || !canEdit}
                        className="btn-refine-action"
                      >
                        <Sparkles size={14} />
                        <span>Refine Answers with AI</span>
                      </button>
                    </>
                  )}
              </div>
            )}
          </div>
          )}

          {/* 2. Multiple File Upload Section */}
          <div className="brief-card upload-docs-card">
            <div 
              className={`brief-card-header accordion-header ${!leftPanelExpanded.fileUpload ? 'collapsed' : ''}`}
              onClick={() => { if (isAnyApiActive) return; setLeftPanelExpanded(prev => ({ ...prev, fileUpload: !prev.fileUpload })); }}
              style={{ cursor: isAnyApiActive ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} style={{ color: '#2563eb' }} />
                <h4 className="brief-card-title">Multiple File Upload</h4>
              </div>
              {leftPanelExpanded.fileUpload ? <ChevronUp size={16} style={{ color: '#64748b' }} /> : <ChevronDown size={16} style={{ color: '#64748b' }} />}
            </div>
            {leftPanelExpanded.fileUpload && (
              <div className="brief-card-body">
                {isAnalyzingDocs && (
                  <div className="brief-loading-top-banner">
                    <div className="brief-loading-top-content">
                      <div className="brief-loading-top-icon-wrapper">
                        <Loader className="brief-loading-top-spinner animate-spin" size={18} />
                      </div>
                      <div className="brief-loading-top-text">
                        <h5 className="brief-loading-top-title">Analyzing Strategic Documents</h5>
                        <p className="brief-loading-top-subtitle">We are getting refined AI answers based on the onboarding data...</p>
                      </div>
                    </div> 
                  </div>
                )}
                <p className="brief-card-description">
                  Upload PDF or DOCX strategic documents. The AI will extract answers to the strategic questions from your document.
                </p>

                <div 
                  className={`sidebar-dropzone ${isDragActive ? 'drag-active' : ''} ${isAnyApiActive ? 'disabled-dropzone' : ''}`}
                  onDragEnter={(e) => { if (isAnyApiActive || !canEdit) return; handleDrag(e); }}
                  onDragOver={(e) => { if (isAnyApiActive || !canEdit) return; handleDrag(e); }}
                  onDragLeave={(e) => { if (isAnyApiActive || !canEdit) return; handleDrag(e); }}
                  onDrop={(e) => { if (isAnyApiActive || !canEdit) return; handleDrop(e); }}
                  onClick={() => { if (isAnyApiActive || !canEdit) return; triggerFileInput(); }}
                  style={{
                    cursor: (isAnyApiActive || !canEdit) ? 'not-allowed' : 'pointer',
                    opacity: (isAnyApiActive || !canEdit) ? 0.6 : 1
                  }}
                >
                  <div className="sidebar-dropzone-icon">
                    <Upload size={20} />
                  </div>
                  <p className="sidebar-dropzone-text">
                    Drag & drop PDF/DOCX or click to browse
                  </p>
                  <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileInputChange}
                    accept=".pdf,.docx,.xlsx,.xls,.csv"
                    disabled={isAnyApiActive || !canEdit}
                  />
                </div>

                {strategyFiles.length > 0 && (
                  <div className="sidebar-file-list">
                    <div className="sidebar-list-header">Ingested Strategy Documents</div>
                    {strategyFiles.map(file => (
                      <div key={file.id} className="sidebar-file-item">
                        <div className="sidebar-file-info">
                          <FileText size={14} style={{ color: '#2563eb' }} />
                          <span className="sidebar-file-name" title={file.name}>{file.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`file-status-badge ${file.status}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                            {file.status === 'uploading' ? `${file.progress}%` : file.status}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isAnyApiActive || !canEdit) return;
                              handleRemoveFile(file.id, file.name);
                            }}
                            disabled={isAnyApiActive || !canEdit}
                            className="sidebar-file-remove"
                            title="Remove File"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  ref={analyzeBtnRef}
                  onClick={() => {
                    if (!canEdit || strategyFiles.length === 0 || isAnyApiActive) return;
                    setConfirmModalConfig({
                      title: t('Confirm Document Analysis') || 'Analyze Strategic Documents',
                      message: 'By doing this, this will overwrite all the existing answers and it will regenerate the insights and strategic analysis. Are you sure you want to proceed?',
                      onConfirm: () => {
                        handleAnalyzeDocuments();
                      }
                    });
                    setShowConfirmModal(true);
                  }}
                  disabled={isAnyApiActive || !canEdit || strategyFiles.length === 0}
                  className="btn-analyze-docs"
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  {isAnalyzingDocs ? (
                    <>
                      <Loader size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                      <span>Analyzing Document...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Analyze Document</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 3. Financial Data Upload Section */}
          <div className="brief-card financial-upload-card">
            <div 
              className={`brief-card-header accordion-header ${!leftPanelExpanded.financialUpload ? 'collapsed' : ''}`}
              onClick={() => { if (isAnyApiActive) return; setLeftPanelExpanded(prev => ({ ...prev, financialUpload: !prev.financialUpload })); }}
              style={{ cursor: isAnyApiActive ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} style={{ color: '#16a34a' }} />
                <h4 className="brief-card-title">Financial Data Upload</h4>
              </div>
              {leftPanelExpanded.financialUpload ? <ChevronUp size={16} style={{ color: '#64748b' }} /> : <ChevronDown size={16} style={{ color: '#64748b' }} />}
            </div>
            {leftPanelExpanded.financialUpload && (
              <div className="brief-card-body">
                <p className="brief-card-description">
                  Upload financial statement templates (Excel/Spreadsheet) to populate the core financial indicators.
                </p>

                <div className="financial-upload-actions">
                  <button 
                    onClick={() => { if (isAnyApiActive || !canEdit) return; setShowTemplatesPopup(true); }}
                    disabled={isAnyApiActive || !canEdit}
                    className="btn-financial-upload"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Verify & Upload Excel</span>
                  </button>
                </div>

                {financialFiles.length > 0 && (
                  <div className="sidebar-file-list">
                    <div className="sidebar-list-header">Active Ledger Spreadsheet</div>
                    {financialFiles.map(file => (
                      <div key={file.id} className="sidebar-file-item financial-item">
                        <div className="sidebar-file-info">
                          <FileSpreadsheet size={14} style={{ color: '#16a34a' }} />
                          <span className="sidebar-file-name" title={file.name}>{file.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`file-status-badge ${file.status}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                            {file.status === 'uploading' ? `${file.progress}%` : file.status}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isAnyApiActive || !canEdit) return;
                              handleRemoveFile(file.id, file.name);
                            }}
                            disabled={isAnyApiActive || !canEdit}
                            className="sidebar-file-remove"
                            title="Remove File"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* <div className="sidebar-ledger-summary">
                  <div className="ledger-summary-header">
                    <span>Financial Ledger Indicators</span>
                    <span className={`ledger-status-tag ${financialFiles.length > 0 ? 'active' : ''}`}>
                      {financialFiles.length > 0 ? 'SYNC ACTIVE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="ledger-summary-grid">
                    <div className="summary-indicator">
                      <span className="indicator-lbl">ANNUAL REVENUE</span>
                      <span className="indicator-val">{ledgerVals.revenue}</span>
                    </div>
                    <div className="summary-indicator">
                      <span className="indicator-lbl">EBITDA</span>
                      <span className="indicator-val">{ledgerVals.ebitda}</span>
                    </div>
                    <div className="summary-indicator">
                      <span className="indicator-lbl">GROSS MARGIN</span>
                      <span className="indicator-val">{ledgerVals.grossMargin}</span>
                    </div>
                    <div className="summary-indicator">
                      <span className="indicator-lbl">EBITDA MARGIN</span>
                      <span className="indicator-val">{ledgerVals.ebitdaMargin}</span>
                    </div>
                  </div>
                </div> */}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Questions & Answers with 3 Tabs */}
        <div className="brief-right-column">

          <div className="sqc-header-bar">
            <div className="phase-tabs-container">
              <button
                className={`phase-tab-btn ${activePhaseTab === 'initial' ? 'active' : ''}`}
                disabled={isAnyApiActive}
                onClick={() => { if (isAnyApiActive) return; setActivePhaseTab('initial'); setExpandAll(false); }}
              >
                <span className="phase-tab-title">Initial</span>
                <span className="phase-tab-badge">{initialCountStr}</span>
              </button>
              <button
                className={`phase-tab-btn ${activePhaseTab === 'essential' ? 'active' : ''}`}
                disabled={isAnyApiActive}
                onClick={() => { if (isAnyApiActive) return; setActivePhaseTab('essential'); setExpandAll(false); }}
              >
                <span className="phase-tab-title">Essential</span>
                <span className="phase-tab-badge">{essentialCountStr}</span>
              </button>
              <button
                className={`phase-tab-btn ${activePhaseTab === 'advanced' ? 'active' : ''}`}
                disabled={isAnyApiActive}
                onClick={() => { if (isAnyApiActive) return; setActivePhaseTab('advanced'); setExpandAll(false); }}
              >
                <span className="phase-tab-title">Advanced</span>
                <span className="phase-tab-badge">{advancedCountStr}</span>
              </button>
            </div>
            <div className="sqc-meta-bar">
              <span className="sqc-meta-count">
                <span style={{ color: '#4f46e5', fontWeight: 700 }}>
                  {currentTabFields.filter(f => cleanValue(f.value).trim() !== '').length}
                </span>
                /{currentTabFields.length} answered
              </span>
              <button
                className={`sqc-expand-all-btn ${expandAll ? 'sqc-expand-all-active' : ''}`}
                disabled={isAnyApiActive}
                onClick={() => { if (isAnyApiActive) return; setExpandAll(prev => !prev); }}
                title={expandAll ? 'Collapse all rows' : 'Expand all rows'}
              >
                {expandAll
                  ? <><ChevronUp size={12} /> Collapse All</>
                  : <><ChevronDown size={12} /> Expand All</>
                }
              </button>
            </div>
          </div>

          <div className="phase-tab-content-list">
            {currentTabFields.length === 0 ? (
              <div className="empty-phase-questions">
                No questions found for this phase.
              </div>
            ) : (
              currentTabFields.map(field => (
                <SimpleQuestionCard
                  key={field.key}
                  field={field}
                  editingField={editingField}
                  editedFields={editedFields}
                  isQuestionHighlighted={isQuestionHighlighted}
                  canEdit={canEdit && !isAnyApiActive}
                  handleEdit={handleEdit}
                  isSaving={isSaving}
                  isAnalysisRegenerating={isAnalysisRegenerating}
                  isStrategicRegenerating={isStrategicRegenerating}
                  inputRefs={inputRefs}
                  fieldRefs={fieldRefs}
                  handleSave={handleSave}
                  handleCancel={handleCancel}
                  handleAutoSave={handleAutoSave}
                  onOpenReference={handleOpenReference}
                  docName={uploadedFiles.find(f => f.status === 'success')?.name}
                  expandAll={expandAll}
                />
              ))
            )}
          </div>

        </div>
      </div>

      {/* Side Reference Drawer with z-index 999999 to float above sticky navigation headers */}
      <div ref={drawerRef} className={`reference-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h4 className="drawer-title">
            <BookOpen size={16} style={{ color: '#4f46e5' }} />
            Citation Workspace
          </h4>
          <button onClick={() => setDrawerOpen(false)} className="drawer-close-btn">
            <X size={18} />
          </button>
        </div>

        {drawerData && (
          <div className="drawer-content">
            <div className="drawer-section-title">
              Target Question Context
            </div>
            <div className="drawer-question-label">
              {drawerData.title || 'Extracted Metric Source'}
            </div>

            <div className="drawer-source-box">
              <div className="drawer-source-label">
                DOCUMENT SOURCE
              </div>
              <div className="drawer-source-name">
                {drawerData.doc || 'Strategic_Report.pdf'}
              </div>
              {drawerData.cell && (
                <div className="drawer-source-cell">
                  Cell: {drawerData.cell}
                </div>
              )}
            </div>

            <div className="drawer-excerpt-box">
              <div className="drawer-excerpt-label">
                VERBATIM DOCUMENT EXCERPT
              </div>
              <p className="drawer-excerpt-text">
                {drawerData.excerpt}
              </p>
            </div>
          </div>
        )}
      </div>

      {showTemplatesPopup && (
        <FinancialTemplatesPopup
          isOpen={showTemplatesPopup}
          onClose={() => setShowTemplatesPopup(false)}
          isFileUploading={isFileUploading}
          onFileUploaded={(file, validation) => {
            processMultipleFiles([file]);
            setShowTemplatesPopup(false);
          }}
          fileInputRef={fileInputRef}
        />
      )}

      {showConfirmModal && (
        <ConfirmationModal
          show={showConfirmModal}
          onHide={() => setShowConfirmModal(false)}
          onConfirm={confirmModalConfig.onConfirm}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmText={t('Yes, Proceed') || 'Yes, Proceed'}
          cancelText={t('Cancel') || 'Cancel'}
          confirmVariant="danger"
        />
      )}
    </div>
  );
};

export default EditableBriefSection;
