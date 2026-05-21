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

const cleanValue = (val) => {
  if (!val || val === '[Question Skipped]') return '';
  return val.replace(/^\[AI Extraction\]\s*/i, '');
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

  // Dynamic citation extraction
  const intel = getQuestionIntelligence(field, docName, details);

  const isAI = field.value && (field.value.startsWith('[AI Extraction]') || (!details || !details.user_answer));
  const hasValue = field.value && field.value !== '[Question Skipped]';
  const cleanVal = cleanValue(field.value);

  // Compact inline preview (first 90 chars)
  const previewText = cleanVal ? (cleanVal.length > 90 ? cleanVal.slice(0, 90) + '…' : cleanVal) : null;

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
            <span className="sqc-status-dot" style={{ backgroundColor: isAI ? '#a855f7' : '#3b82f6' }} title={isAI ? 'AI Answer' : 'Edited'} />
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
                  <strong>Previous Edit:</strong> {cleanValue(details.previous_answer)}
                </div>
              )}
            </div>
          ) : null}

          {/* Answer box — editing or read mode */}
          {!showOriginal && isEditing && canEdit ? (
            <div>
              <textarea
                ref={el => inputRefs.current[field.key] = el}
                className="simple-textarea"
                defaultValue={cleanVal}
                disabled={isSaving || isAnalysisRegenerating}
                placeholder="Write your answer..."
                onChange={e => handleAutoSave(field, e.target.value)}
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
            >
              {cleanVal || 'Click here to add your strategic answer...'}
            </div>
          ) : null}

          {/* Bottom action row */}
          {hasValue && !isEditing && (
            <div className="sqc-action-row">
              <div className="sqc-badges">
                {isAI ? (
                  <span className="brief-badge-ai"><Sparkles size={10} /> AI</span>
                ) : (
                  <span className="brief-badge-user"><Check size={10} /> Edited</span>
                )}
                {intel.hasCitation && (
                  <span className="sqc-conf-badge" style={{ color: intel.color, borderColor: intel.color + '40' }}>
                    <span className="sqc-conf-dot-sm" style={{ backgroundColor: intel.color }} />
                    {intel.conf}
                  </span>
                )}
              </div>
              <div className="card-bottom-actions">
                {!isAI && (
                  <button className="simple-text-toggle" onClick={() => setShowOriginal(!showOriginal)}>
                    <Sparkles size={11} />
                    {showOriginal ? 'Show Edited' : 'Compare'}
                  </button>
                )}
                {intel.hasCitation && (
                  <button
                    className="simple-text-toggle"
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
  const [enrichedAnswers, setEnrichedAnswers] = useState(null);
  const [isApplyingEnrichment, setIsApplyingEnrichment] = useState(false);
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

  // Extract previously uploaded/indexed strategic document names from answersDetails
  useEffect(() => {
    if (lastFetchedBusinessId !== selectedBusinessId) return;
    if (answersDetails && Object.keys(answersDetails).length > 0) {
      const foundDocNames = new Set();
      Object.values(answersDetails).forEach(detail => {
        if (detail && Array.isArray(detail.evidence)) {
          detail.evidence.forEach(ev => {
            if (ev && ev.document_name && ev.document_name.trim() !== '') {
              foundDocNames.add(ev.document_name);
            }
          });
        }
      });

      setUploadedFiles(prev => {
        // Retain only spreadsheets and temporary upload-queue files
        const nonDbStrategic = prev.filter(f => !f.id.startsWith('db-strategic-'));
        const dbStrategic = Array.from(foundDocNames).map(docName => ({
          id: `db-strategic-${docName}`,
          name: docName,
          size: 512000,
          uploadDate: 'Indexed',
          status: 'success',
          type: docName.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
          progress: 100
        }));
        return [...nonDbStrategic, ...dbStrategic];
      });
    } else {
      setUploadedFiles(prev => prev.filter(f => !f.id.startsWith('db-strategic-')));
    }
  }, [answersDetails, lastFetchedBusinessId, selectedBusinessId]);



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
        response = await answerService.updateAnswer(existingAnswerId, newAnswer);
      } else {
        response = await answerService.createAnswer(selectedBusinessId, questionId, newAnswer);
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
    for (const file of files) {
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
          // Strategic PDF/DOCX - just add to queue for later analysis
          clearInterval(progressInterval);
          setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: 100, status: 'uploaded', fileObject: file } : f));
          showToastMessage(`File "${file.name}" uploaded to queue. Click "Analyze Document" to process.`, 'success');
        }
      } catch (error) {
        clearInterval(progressInterval);
        setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'failed', errorMessage: error.message } : f));
        showToastMessage(`Ingestion failed for "${file.name}": ${error.message || 'Verification error.'}`, 'error');
      }
    }
  };

  const handleRemoveFile = (fileId, fileName) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    showToastMessage(`Removed "${fileName}" from active framework index.`, 'info');
  };

  // Fully dynamic AI Answer Support compiler utilizing actual onboarding details
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

      showToastMessage('Compiling onboarding details and launching LLM pipeline...', 'info');

      const activeDocumentNames = uploadedFiles.filter(f => f.status === 'success').map(f => f.name).join(', ') || 'strategy documents';
      const result = await analysisService.makeAPICall('answer-questions-with-enrichment', null, null, selectedBusinessId, null, null, null, companyName, rawPayload);

      if (Array.isArray(result)) {
        // Enriched response mapping
        setEnrichedAnswers(result);
        showToastMessage('Enrichment suggestions generated successfully!', 'success');
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

  // Fully dynamic synchronization & save handler for enriched answers in MongoDB
  const handleApplyEnrichedAnswers = async () => {
    if (!enrichedAnswers || enrichedAnswers.length === 0) return;
    try {
      setIsApplyingEnrichment(true);
      showToastMessage('Syncing suggestions to database...', 'info');
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
            confidence: 0.9,
            status: 'FOUND',
            evidence: [],
            ai_answer: item.answer_text,
            user_answer: null,
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
            return {
              answer_id: item.id,
              answer: item.answer_text,
              confidence: 0.9,
              status: 'FOUND',
              evidence: prevDetail.evidence || [],
              ai_answer: item.answer_text,
              user_answer: null,
              previous_answer: prevDetail.user_answer || prevDetail.previous_answer || null
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
        currentDetails[item.question_id] = {
          ...prevDetail,
          confidence: 0.9,
          status: 'FOUND',
          evidence: prevDetail.evidence || [],
          ai_answer: item.answer_text || '',
          user_answer: null,
          previous_answer: prevDetail.user_answer || prevDetail.previous_answer || null
        };
      });

      useAnalysisStore.setState({
        userAnswers: currentAnswers,
        answersDetails: currentDetails,
        completedQuestions: currentCompleted
      });

      const newlyEdited = new Set(editedFields);
      answersToSave.forEach(item => {
        if (onAnswerUpdate) {
          onAnswerUpdate(item.question_id, item.answer_text);
        }
        newlyEdited.add(`question_${item.question_id}`);
      });
      setEditedFields(newlyEdited);
      setEnrichedAnswers(null);
      showToastMessage('AI framework suggestions synced successfully!', 'success');

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

  // Multiple File Strategic Document Ingestion & Bulk Save Flow
  const handleAnalyzeDocuments = async () => {
    const filesToAnalyze = uploadedFiles.filter(
      f => (f.type === 'pdf' || f.type === 'docx') && f.status === 'uploaded' && f.fileObject
    );

    if (filesToAnalyze.length === 0) {
      showToastMessage('No strategic documents in the queue to analyze.', 'info');
      return;
    }

    try {
      setIsAnalyzingDocs(true);
      showToastMessage(`Starting analysis on ${filesToAnalyze.length} queued document(s)...`, 'info');

      // Update status of queued files to 'analyzing'
      setUploadedFiles(prev =>
        prev.map(f =>
          (f.type === 'pdf' || f.type === 'docx') && f.status === 'uploaded'
            ? { ...f, status: 'analyzing', progress: 30 }
            : f
        )
      );

      for (const file of filesToAnalyze) {
        try {
          // Call the dummy Strategic Document Ingestion API
          const response = await answerService.analyzeDocuments(selectedBusinessId, file.fileObject);
          
          if (!response || !Array.isArray(response.answers)) {
            throw new Error('Invalid response received from the analysis engine.');
          }

          const answers = response.answers;
          
          // Partition into bulkCreate vs bulkUpdate
          const toCreate = [];
          const toUpdate = [];
          const newAnswerIds = { ...answerIds };
          let idsUpdated = false;

          answers.forEach(item => {
            const qIdStr = String(item.question_id);
            const existingId = answerIds[qIdStr];

            if (existingId) {
              toUpdate.push({
                answer_id: existingId,
                answer: item.answer,
                confidence: item.confidence,
                status: item.status,
                evidence: item.evidence
              });
            } else {
              toCreate.push({
                question_id: item.question_id,
                answer: item.answer,
                confidence: item.confidence,
                status: item.status,
                evidence: item.evidence
              });
            }
          });

          // Call backend bulk APIs to persist details
          if (toCreate.length > 0) {
            const bulkRes = await answerService.bulkCreateAnswers(selectedBusinessId, toCreate);
            if (bulkRes && bulkRes.data && Array.isArray(bulkRes.data.insertedIds)) {
              toCreate.forEach((item, index) => {
                const newId = bulkRes.data.insertedIds[index];
                if (newId) {
                  newAnswerIds[String(item.question_id)] = newId;
                  idsUpdated = true;
                }
              });
            }
          }

          if (toUpdate.length > 0) {
            await answerService.bulkUpdateAnswers(selectedBusinessId, toUpdate);
          }

          // Update setAnswerIds prop if any were created
          if (idsUpdated && setAnswerIds) {
            setAnswerIds(newAnswerIds);
          }

          // Propagate answers to parent and update local highlights/edited fields
          const newlyEdited = new Set(editedFields);
          answers.forEach(item => {
            if (onAnswerUpdate) {
              onAnswerUpdate(item.question_id, item.answer);
            }
            newlyEdited.add(`question_${item.question_id}`);
          });
          setEditedFields(newlyEdited);

          // Atomic Zustand state update for reactive UI updates
          const currentAnswers = { ...useAnalysisStore.getState().userAnswers };
          const currentDetails = { ...useAnalysisStore.getState().answersDetails };
          const currentCompleted = [...useAnalysisStore.getState().completedQuestions];

          answers.forEach(item => {
            if (item.answer) {
              currentAnswers[item.question_id] = item.answer;
              if (!currentCompleted.includes(item.question_id)) {
                currentCompleted.push(item.question_id);
              }
            }
            currentDetails[item.question_id] = {
              confidence: item.confidence,
              status: item.status,
              evidence: item.evidence,
              ai_answer: item.answer || '',
              user_answer: null,
              previous_answer: null
            };
          });

          useAnalysisStore.setState({
            userAnswers: currentAnswers,
            answersDetails: currentDetails,
            completedQuestions: currentCompleted
          });

          // Call onUploadedFileUpdate to register this file as ingested
          if (onUploadedFileUpdate) {
            onUploadedFileUpdate(file.fileObject);
          }

          // Set file status to success
          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === file.id
                ? { ...f, status: 'success', progress: 100 }
                : f
            )
          );

          showToastMessage(`Document "${file.name}" analyzed successfully!`, 'success');

          // Trigger AI Regeneration if needed
          if (onAnalysisRegenerate) {
            onAnalysisRegenerate({
              updatedQuestionIds: answers.map(a => a.question_id),
              alsoRegenerateStrategic: true,
              skipConfirmation: true,
              skipFinancial: true
            });
          }

        } catch (fileErr) {
          console.error(`Error analyzing file ${file.name}:`, fileErr);
          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === file.id
                ? { ...f, status: 'failed', errorMessage: fileErr.message || 'Analysis failed.' }
                : f
            )
          );
          showToastMessage(`Analysis failed for "${file.name}": ${fileErr.message || 'Error occurred.'}`, 'error');
        }
      }

    } catch (err) {
      console.error('Document analysis queue error:', err);
      showToastMessage('An error occurred during bulk document analysis.', 'error');
    } finally {
      setIsAnalyzingDocs(false);
    }
  };

  // Drawer Reference Actions
  const handleOpenReference = (data) => {
    setDrawerData(data);
    setDrawerOpen(true);
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
                onClick={() => setLeftPanelExpanded(prev => ({ ...prev, refineAi: !prev.refineAi }))}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} style={{ color: '#4f46e5' }} />
                  <h4 className="brief-card-title">Refine AI Answers</h4>
                </div>
                {leftPanelExpanded.refineAi ? <ChevronUp size={16} style={{ color: '#64748b' }} /> : <ChevronDown size={16} style={{ color: '#64748b' }} />}
              </div>
              {leftPanelExpanded.refineAi && (
                <div className="brief-card-body">
                  <p className="brief-card-description">
                    Refine and pre-populate your strategic brief answers using AI-generated suggestions compiled from your onboarding setup details.
                  </p>

                  <button
                    onClick={handleGenerateEnrichment}
                    disabled={isEnriching || !canEdit}
                    className="btn-refine-action"
                  >
                    {isEnriching ? (
                      <>
                        <Loader size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                        <span>Generating AI Insights...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Refine Answers with AI</span>
                      </>
                    )}
                  </button>

                {enrichedAnswers && (
                  <div className="nested-suggestions-box">
                    <div className="nested-suggestions-header">
                      <div className="nested-suggestions-title">
                        <Sparkles size={12} /> AI Suggestions Ready
                      </div>
                      <span className="nested-suggestions-count">{enrichedAnswers.length} items</span>
                    </div>
                    <p className="nested-suggestions-desc">
                      AI has identified relevant strategic highlights from your documents. Sync them directly into the framework questions.
                    </p>
                    <div className="nested-suggestions-actions">
                      <button
                        onClick={() => setEnrichedAnswers(null)}
                        className="btn-nested-discard"
                        disabled={isApplyingEnrichment}
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleApplyEnrichedAnswers}
                        disabled={isApplyingEnrichment}
                        className="btn-nested-sync"
                      >
                        {isApplyingEnrichment ? 'Syncing...' : 'Sync All'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* 2. Multiple File Upload Section */}
          <div className="brief-card upload-docs-card">
            <div 
              className={`brief-card-header accordion-header ${!leftPanelExpanded.fileUpload ? 'collapsed' : ''}`}
              onClick={() => setLeftPanelExpanded(prev => ({ ...prev, fileUpload: !prev.fileUpload }))}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} style={{ color: '#2563eb' }} />
                <h4 className="brief-card-title">Multiple File Upload</h4>
              </div>
              {leftPanelExpanded.fileUpload ? <ChevronUp size={16} style={{ color: '#64748b' }} /> : <ChevronDown size={16} style={{ color: '#64748b' }} />}
            </div>
            {leftPanelExpanded.fileUpload && (
              <div className="brief-card-body">
                <p className="brief-card-description">
                  Upload PDF or DOCX strategic documents. The AI will extract answers to the strategic questions from your document.
                </p>

                <div 
                  className={`sidebar-dropzone ${isDragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
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
                              handleRemoveFile(file.id, file.name);
                            }}
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
                  onClick={handleAnalyzeDocuments}
                  disabled={isAnalyzingDocs || !canEdit || uploadedFilesCount === 0}
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
              onClick={() => setLeftPanelExpanded(prev => ({ ...prev, financialUpload: !prev.financialUpload }))}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
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
                    onClick={() => setShowTemplatesPopup(true)}
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
                              handleRemoveFile(file.id, file.name);
                            }}
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

                <div className="sidebar-ledger-summary">
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
                </div>
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
                onClick={() => { setActivePhaseTab('initial'); setExpandAll(false); }}
              >
                <span className="phase-tab-title">Initial</span>
                <span className="phase-tab-badge">{initialCountStr}</span>
              </button>
              <button
                className={`phase-tab-btn ${activePhaseTab === 'essential' ? 'active' : ''}`}
                onClick={() => { setActivePhaseTab('essential'); setExpandAll(false); }}
              >
                <span className="phase-tab-title">Essential</span>
                <span className="phase-tab-badge">{essentialCountStr}</span>
              </button>
              <button
                className={`phase-tab-btn ${activePhaseTab === 'advanced' ? 'active' : ''}`}
                onClick={() => { setActivePhaseTab('advanced'); setExpandAll(false); }}
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
                onClick={() => setExpandAll(prev => !prev)}
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
                  canEdit={canEdit}
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
      <div className={`reference-drawer ${drawerOpen ? 'open' : ''}`}>
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
    </div>
  );
};

export default EditableBriefSection;
