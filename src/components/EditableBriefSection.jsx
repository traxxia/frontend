import React, { useState, useEffect, useRef } from 'react';
import {
  Edit3, Check, X, Loader, Loader2, AlertCircle, Sparkles, Wand2, Upload, FileText, Database, RefreshCw,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle, FileSpreadsheet, HelpCircle, Eye, ArrowRight, BookOpen, Trash2, Maximize2, Minimize2,
  Activity, DollarSign, Calendar
} from 'lucide-react';
import { AnalysisApiService } from '../services/analysisApiService';
import { answerService } from '../services/answerService';
import { useTranslation } from "../hooks/useTranslation";
import { detectTemplateType, validateAgainstTemplate } from '../utils/templateValidator';
import '../styles/CompanyManagement.css';
import '../styles/docIntelligence.css';
import { useAuthStore } from '../store/authStore';
import { useAnalysisStore } from '../store/analysisStore';
import { useBusinessStore } from '../store/businessStore';
import DOMPurify from 'dompurify';
import RichTextEditor from './RichTextEditor';
import { markdownToHtml } from '../utils/markdownHelper';
import ConfirmationModal from './ConfirmationModal';
import { formatCurrencyValue } from '../utils/currencyUtils';
import { computePageCount, getFileDetails } from '../utils/fileUtils';
import AnalysisContentManager from './AnalysisContentManager';

// Derives the correct unit label from a file extension for already-stored documents
const getPageUnit = (ext, count) => {
  if (['xlsx', 'xls'].includes(ext)) return count === 1 ? 'sheet' : 'sheets';
  if (['pptx', 'ppt'].includes(ext)) return count === 1 ? 'slide' : 'slides';
  if (ext === 'csv') return count === 1 ? 'row' : 'rows';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  return count === 1 ? 'page' : 'pages';
};

let globalLimitsPromise = null;
const sessionCache = new Map();
const strategicDocsCache = new Map();

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

  // Protection against corrupted DB records from before the fix
  const isCorrupted = details.status === 'EDITED' && details.ai_answer === details.user_answer && !details.previous_answer;

  const original = isCorrupted ? null : (details.ai_answer !== undefined && details.ai_answer !== null && details.ai_answer !== ''
    ? details.ai_answer
    : (field.value && field.value.startsWith('[AI Extraction]')
      ? field.value
      : null));

  if (details.status === 'FOUND') {
    const conf = details.confidence >= 0.7 ? 'High' : details.confidence >= 0.5 ? 'Medium' : 'Low';
    const color = conf === 'High' ? '#10b981' : conf === 'Medium' ? '#f59e0b' : '#ef4444';
    
    return {
      conf,
      color,
      original,
      hasCitation: true,
      evidence: Array.isArray(details.evidence) ? details.evidence : []
    };
  }
  
  if (details.status === 'NOT_FOUND') {
    return {
      conf: 'None',
      color: '#9ca3af',
      original: original || 'Not found',
      hasCitation: true,
      evidence: Array.isArray(details.evidence) ? details.evidence : []
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

  const hasDifferentOriginal = !!(intel.original && cleanValue(intel.original) !== cleanVal);
  const hasDifferentPrevious = !!(details && details.previous_answer && cleanValue(details.previous_answer) !== cleanVal);
  const shouldShowCompare = hasDifferentOriginal || hasDifferentPrevious;

  // Compact inline preview (first 90 chars)
  const cleanValPlain = stripMarkdown(cleanVal);
  const previewText = cleanValPlain ? (cleanValPlain.length > 90 ? cleanValPlain.slice(0, 90) + '…' : cleanValPlain) : null;

  // Auto-expand when editing starts
  const handleEditClick = () => {
    if (showOriginal) return;
    if (canEdit && !isSaving) {
      setIsExpanded(true);
      handleEdit(field);
    }
  };

  return (
    <div
      ref={el => fieldRefs.current[field.key] = el}
      className={`sqc-row ${hasValue ? 'answered' : ''} ${isHighlighted ? 'highlighted' : ''} ${isEditing ? 'sqc-editing' : ''} ${effectiveExpanded ? 'sqc-expanded' : ''}`}
    >
      {/* Compact summary row — always visible */}
      <div className="sqc-summary" style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'start', gap: '8px', minHeight: '46px' }} onClick={() => !isEditing && setIsExpanded(prev => !prev)}>
        {/* Left: number + status dot */}
        <div className="sqc-left" style={{ display: 'flex', alignItems: 'center', alignSelf: 'start', marginTop: '3px', gap: '10px', flexShrink: 0 }}>
          {hasValue ? (
            <div style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', flexShrink: 0, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }} title="Answered">
              <Check size={10} color="#ffffff" strokeWidth={4} />
            </div>
          ) : (
            <div style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', flexShrink: 0, borderRadius: '50%', border: '1.5px solid #cbd5e1', background: 'transparent', marginTop: '2px' }} title="Unanswered" />
          )}
          <span className="sqc-num" style={{ fontWeight: '500', color: hasValue ? '#22c55e' : '#475569', fontSize: '15px' }}>{field.sequentialNumber}</span>
        </div>

        {/* Center: question label + answer preview */}
        <div className="sqc-center" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span className="sqc-question-text notranslate" style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>
              {field.label}
              {field.severity === 'mandatory' && <span style={{ color: '#dc2626', marginLeft: '2px' }} title="Mandatory Question">*</span>}
            </span>
            {hasValue && isAI && !effectiveExpanded && !isEditing && (
              <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={10} /> auto-filled
              </span>
            )}
          </div>
          {!hasValue && !effectiveExpanded && (
            <span className="sqc-answer-preview sqc-preview-empty" style={{ marginTop: '2px' }}>No answer yet — click to add</span>
          )}
        </div>

        {/* Right: confidence dot + expand chevron */}
        <div className="sqc-right" style={{ display: 'flex', alignItems: 'center', alignSelf: 'start', marginTop: '5px', gap: '6px', flexShrink: 0 }}>
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
                {shouldShowCompare && (
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
                {!showOriginal && (
                  <button className="simple-text-toggle sqc-edit-btn" onClick={handleEditClick}>
                    <Edit3 size={11} /> Edit
                  </button>
                )}
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
const DEFAULT_MAX_RETRIES = 12;

const defaultFinancialMetrics = {
  meta: { document_currency: "USD", reporting_period: "N/A", extraction_confidence: "N/A" },
  financial_performance: {
    revenue: { value: null },
    gross_profit: { value: null },
    ebitda: { value: null },
    net_income: { value: null },
    revenue_growth_yoy: { value: null }
  },
  financial_health: {
    current_ratio: { value: null },
    quick_ratio: { value: null },
    debt_to_equity: { value: null },
    interest_coverage: { value: null },
    cash_and_equivalents: { value: null }
  },
  operational_efficiency: {
    gross_margin: { value: null },
    operating_margin: { value: null },
    net_margin: { value: null },
    roe: { value: null },
    roa: { value: null }
  },
  cost_efficiency: {
    cogs: { value: null },
    opex: { value: null },
    rd_spend: { value: null },
    capex: { value: null }
  }
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
  hasPmfAccess = false,
  isLoading = false,
  isAdvancedMode = false,
  setActiveTab
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
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isFinancialRegenerating, setIsFinancialRegenerating] = useState(false);
  const [isAnalyzingDocs, setIsAnalyzingDocs] = useState(false);

  // States for Multiple File Upload System
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [activePhaseTab, setActivePhaseTab] = useState('initial');
  const [financialTabMode, setFinancialTabMode] = useState('data');
  const [leftPanelExpanded, setLeftPanelExpanded] = useState({
    refineAi: true,
    fileUpload: false,
    docsHistory: false,
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

  // Document Intelligence Add-on States
  const [docIntelSession, setDocIntelSession] = useState(null);
  const [isAnalyzingFinancial, setIsAnalyzingFinancial] = useState(false);
  const [sseLogs, setSseLogs] = useState([]);
  const [editingMetric, setEditingMetric] = useState(null); // { category, key }
  const [editMetricValue, setEditMetricValue] = useState('');


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

  // Dynamic configuration limits fetched from backend (Single Source of Truth)
  const [uploadLimits, setUploadLimits] = useState({
    maxFilesLimit: 5,
    maxFileSizeMB: 15
  });

  useEffect(() => {
    let active = true;
    const fetchLimits = async () => {
      try {
        if (!globalLimitsPromise) {
          globalLimitsPromise = answerService.getConfigLimits().catch(err => {
            globalLimitsPromise = null;
            throw err;
          });
        }
        const data = await globalLimitsPromise;
        if (active) {
          setUploadLimits({
            maxFilesLimit: data.maxFileUploadLimit || 5,
            maxFileSizeMB: data.maxFileSizeMB || 15
          });
        }
      } catch (err) {
        console.warn('[EditableBriefSection] Could not retrieve server upload limits, falling back to local .env config:', err);
      }
    };
    fetchLimits();
    return () => {
      active = false;
    };
  }, []);

  const inputRefs = useRef({});
  const fieldRefs = useRef({});
  const autoSaveTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const analyzeBtnRef = useRef(null);
  const fileUploadSectionRef = useRef(null);
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
    setActivePhaseTab('initial');
  }, [isAdvancedMode]);

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
    generateBriefFields();
  }, [questions, userAnswers]);

  // Reset uploaded files state when the business selection changes
  useEffect(() => {
    setUploadedFiles([]);
  }, [selectedBusinessId]);

  // Load Document Intelligence Session
  useEffect(() => {
    if (!selectedBusinessId) return;
    let active = true;
    const loadSession = async () => {
      try {
        let sPromise = sessionCache.get(selectedBusinessId);
        if (!sPromise) {
          sPromise = answerService.getSessionByBusiness(selectedBusinessId)
            .then(data => data && data.hasSession !== false ? data : null)
            .catch(err => {
              sessionCache.delete(selectedBusinessId);
              throw err;
            });
          sessionCache.set(selectedBusinessId, sPromise);
        }

        const sData = await sPromise;
        if (active) { 
          setDocIntelSession(sData);
        }
      } catch (err) {
        console.warn("[DocIntel] Failed to load session:", err);
        if (active) {
          setDocIntelSession(null);
        }
      }
    };
    loadSession();
    return () => {
      active = false;
    };
  }, [selectedBusinessId]);

  // Trigger actual ML Backend financial extraction API!
  const triggerSSEAnalysis = async (businessId, files = []) => {
    sessionCache.delete(businessId);
    analysisService.clearFinancialCache(businessId);
    setIsAnalyzingFinancial(true);
    setSseLogs([
      { timestamp: new Date().toLocaleTimeString(), tag: "INGEST", message: "Initiating ML financial extraction...", type: "info" }
    ]);
    
    try {
      let filesToAnalyze = files;

      if (filesToAnalyze.length === 0) {
        // Fallback to memory file if not passed
        const spreadsheetFile = uploadedFiles.find(f => f.type === 'spreadsheet')?.fileObject || uploadedFiles[0]?.fileObject;
        if (spreadsheetFile) {
          filesToAnalyze = [spreadsheetFile];
        }
      }

      // /financial-summary-extract supports: .pdf, .xlsx, .xls, .csv, .docx, .doc
      const SUPPORTED_EXTS = ['pdf', 'xlsx', 'xls', 'csv', 'docx', 'doc'];
      filesToAnalyze = filesToAnalyze.filter(f => {
        const ext = (f.name || '').toLowerCase().split('.').pop();
        return SUPPORTED_EXTS.includes(ext);
      });

      if (filesToAnalyze.length === 0) {
        console.warn('[triggerSSEAnalysis] No supported financial files (pdf/xlsx/xls/csv/docx/doc) found — skipping financial extraction.');
        setIsAnalyzingFinancial(false);
        return false;
      }

      setSseLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        tag: "ML_API",
        message: `Sending ${filesToAnalyze.length} file(s) to ML backend for summary extraction...`,
        type: "progress"
      }]);

      const formData = new FormData();
      filesToAnalyze.forEach(file => {
        formData.append('files', file, file.name);
      });

      const mlResponse = await answerService.extractFinancialSummary(formData, businessId); 
      // ── Normalise ML response: new shape has { timeline: [...], meta }
      //    Legacy shape is a flat metrics object. Support both.
      let financialTimeline = null;
      let financialMetrics  = null;

      if (mlResponse && Array.isArray(mlResponse.timeline) && mlResponse.timeline.length > 0) {
        // New FinancialTimelineResponse shape
        financialTimeline = mlResponse.timeline; // full array of period objects
        // Latest period's derived metrics → backward-compat flat financialMetrics
        const sortedTimeline = [...financialTimeline].sort((a, b) => a.period.localeCompare(b.period));
        financialMetrics = sortedTimeline[sortedTimeline.length - 1] || null;
        if (financialMetrics && mlResponse.meta) {
          financialMetrics.meta = mlResponse.meta;
        }
      } else {
        // Legacy flat metrics shape
        financialMetrics = mlResponse;
      }

      setSseLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        tag: "DATABASE",
        message: "Saving extracted financial metrics to database...",
        type: "progress"
      }]);

      await answerService.saveRawSession(businessId, "completed", financialMetrics, financialTimeline);

      setSseLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        tag: "SYNC",
        message: "Synchronizing metrics with dashboard panels...",
        type: "progress"
      }]);

      const syncResult = await answerService.syncFinancial(businessId);

      // Reactively update Zustand store to render core charts instantly
      useAnalysisStore.setState({
        profitabilityData: { profitability: syncResult.excelAnalysisSuite.profitability },
        growthTrackerData: { growth_trends: syncResult.excelAnalysisSuite.growth_trends },
        liquidityEfficiencyData: { liquidity: syncResult.excelAnalysisSuite.liquidity },
        investmentPerformanceData: { investment: syncResult.excelAnalysisSuite.investment },
        leverageRiskData: { leverage: syncResult.excelAnalysisSuite.leverage },
        financialPerformanceData: syncResult.financialPerformanceData
      });

      if (onUploadedFileUpdate && filesToAnalyze.length > 0) {
        onUploadedFileUpdate({ name: filesToAnalyze[0].name });
      }

      setSseLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        tag: "SUCCESS",
        message: "Financial metrics extracted and synchronized successfully!",
        type: "success"
      }]);

      // Load latest session state to update local UI State
      const sData = await answerService.getSessionByBusiness(businessId); 
      if (sData && sData.hasSession !== false) {
        sessionCache.set(businessId, Promise.resolve(sData));
        setDocIntelSession(sData);
        setActivePhaseTab('financial');
      }

      showToastMessage("Financial data processed successfully! Regenerating all insights...", "success");
      return true;
    } catch (err) {
      console.error("Extraction pipeline failed:", err);
      setSseLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        tag: "FAILED",
        message: `Error: ${err.message}`,
        type: "failed"
      }]);
      showToastMessage(`Extraction failed: ${err.message}`, "error");
      throw err;
    } finally {
      setIsAnalyzingFinancial(false);
    }
  };

  // Update a single financial metric (Human-in-the-loop)
  const handleUpdateMetric = async (category, metricKey, newValue) => {
    if (!docIntelSession) return;
    
    const currentMetrics = (() => {
      if (!docIntelSession?.financialMetrics) return defaultFinancialMetrics;
      const merged = JSON.parse(JSON.stringify(defaultFinancialMetrics));
      if (docIntelSession.financialMeta) merged.meta = { ...merged.meta, ...docIntelSession.financialMeta };
      else if (docIntelSession.financialMetrics.meta) merged.meta = { ...merged.meta, ...docIntelSession.financialMetrics.meta };
      const cats = ["financial_performance", "financial_health", "operational_efficiency", "cost_efficiency"];
      cats.forEach(cat => {
        if (docIntelSession.financialMetrics[cat]) {
          Object.keys(docIntelSession.financialMetrics[cat]).forEach(k => {
            if (k !== 'meta') merged[cat][k] = docIntelSession.financialMetrics[cat][k];
          });
        }
      });
      return merged;
    })();
      
    const oldValue = currentMetrics?.[category]?.[metricKey]?.value;
    
    const trimmed = String(newValue || '').trim();
    let parsedNewValue = null;
    if (trimmed !== '') {
      if (trimmed === '-' || trimmed === '.' || trimmed === '-.' || isNaN(parseFloat(trimmed))) {
        showToastMessage("Please enter a valid number.", "error");
        return;
      }
      parsedNewValue = parseFloat(trimmed);
    }
    
    // Guard: Only call the API if there is an actual change!
    if (oldValue === parsedNewValue || (parsedNewValue === null && oldValue === null)) {
      return;
    }
    
    // Deep copy currentMetrics
    const updatedMetrics = JSON.parse(JSON.stringify(currentMetrics));
    if (updatedMetrics[category] && updatedMetrics[category][metricKey]) {
      updatedMetrics[category][metricKey].value = parsedNewValue;
    }
    
    try {
      const result = await answerService.updateSession(selectedBusinessId, updatedMetrics);
      sessionCache.set(selectedBusinessId, Promise.resolve({
        ...docIntelSession,
        financialMetrics: result.financialMetrics
      }));
      setDocIntelSession(prev => ({
        ...prev,
        financialMetrics: result.financialMetrics
      }));
      showToastMessage("Metric updated successfully.", "success");
    } catch (err) {
      showToastMessage(`Failed to update metric: ${err.message}`, "error");
    }
  };


  // Sync to Core Product
  const handleSyncFinancial = async () => {
    try {
      setIsAnalyzingFinancial(true);
      showToastMessage("Syncing Document Intelligence financial data...", "info");
      const result = await answerService.syncFinancial(selectedBusinessId);
      
      // Reactively update Zustand store to render core charts instantly
      useAnalysisStore.setState({
        profitabilityData: { profitability: result.excelAnalysisSuite.profitability },
        growthTrackerData: { growth_trends: result.excelAnalysisSuite.growth_trends },
        liquidityEfficiencyData: { liquidity: result.excelAnalysisSuite.liquidity },
        investmentPerformanceData: { investment: result.excelAnalysisSuite.investment },
        leverageRiskData: { leverage: result.excelAnalysisSuite.leverage },
        financialPerformanceData: result.financialPerformanceData
      });
      
      if (onUploadedFileUpdate) {
        onUploadedFileUpdate({ name: docIntelSession.uploadedDocuments?.[0]?.original_name || "financial_statement.xlsx" });
      }
      
      showToastMessage("Extracted metrics synchronized!", "success");
    } catch (err) {
      showToastMessage(`Sync failed: ${err.message}`, "error");
    } finally {
      setIsAnalyzingFinancial(false);
    }
  };

  // NOTE: Document sync from documentInfo/docIntelSession is intentionally removed.
  // All documents (including spreadsheets) are now managed through the unified
  // strategic documents endpoint loaded by loadStrategicDocs below.




  // Fetch strategic documents from database
  useEffect(() => {
    let active = true;
    const loadStrategicDocs = async () => {
      if (!selectedBusinessId) return;
      try {
        let docsPromise = strategicDocsCache.get(selectedBusinessId);
        if (!docsPromise) {
          docsPromise = answerService.getStrategicDocuments(selectedBusinessId).catch(err => {
            strategicDocsCache.delete(selectedBusinessId);
            throw err;
          });
          strategicDocsCache.set(selectedBusinessId, docsPromise);
        }

        const data = await docsPromise;
        if (!active) return;

        setUploadedFiles(prev => {
          // Retain only financial files and temporary files
          const nonDbStrategic = prev.filter(f => !f.id.startsWith('db-strategic-'));
          const dbStrategic = (data.documents || []).map(doc => {
            const ext = doc.original_name.toLowerCase().split('.').pop();
            const type = ['xlsx', 'xls', 'csv'].includes(ext) ? 'spreadsheet'
              : ['pptx', 'ppt'].includes(ext) ? 'presentation'
              : ext;
            return {
              id: `db-strategic-${doc.filename}`,
              name: doc.original_name,
              size: doc.file_size || 512000,
              uploadDate: doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Uploaded',
              status: 'success',
              type: type,
              section: 'strategic',
              progress: 100,
              isNewSessionFile: !doc.is_analyzed,
              pageInfo: doc.page_count ? { count: doc.page_count, unit: getPageUnit(ext, doc.page_count) } : null
            };
          });
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
  }, [selectedBusinessId]);



  const isQuestionHighlighted = questionId => {
    if (!highlightedMissingQuestions?.missing_questions) return false;
    const question = questions.find(q => (q._id || q.question_id) === questionId);
    if (!question) return false;
    return highlightedMissingQuestions.missing_questions.some(q => q.order === question.order);
  };

  const generateBriefFields = () => {
    const fields = [];
    const phaseOrderMap = { 'initial': 1, 'essential': 2, 'advanced': 3 };
    const filteredQuestions = (questions || []).filter(q => q.phase && !['good'].includes(q.phase.toLowerCase()));

    const sortedQuestions = [...filteredQuestions].sort((a, b) => {
      const phaseA = phaseOrderMap[a.phase?.toLowerCase()] || 4;
      const phaseB = phaseOrderMap[b.phase?.toLowerCase()] || 4;
      if (phaseA !== phaseB) return phaseA - phaseB;
      return (a.order || 0) - (b.order || 0);
    });

    const sequentialNumberByPhase = {
      initial: 1,
      essential: 1,
      advanced: 1
    };
    
    sortedQuestions.forEach(question => {
      const qId = question._id || question.question_id;
      const answer = userAnswers[qId] || '';
      const phase = (question.phase || 'initial').toLowerCase();
      
      fields.push({
        key: `question_${qId}`,
        label: question.question_text,
        value: answer,
        questionId: qId,
        phase: question.phase,
        severity: question.severity,
        order: question.order,
        sequentialNumber: sequentialNumberByPhase[phase] ? sequentialNumberByPhase[phase]++ : 1
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
          user_answer: newAnswer,
          status: 'EDITED'
        });
      } else {
        response = await answerService.createAnswer(selectedBusinessId, questionId, newAnswer, {
          user_answer: newAnswer,
          ai_answer: '',
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
      const currentStoreAnswer = useAnalysisStore.getState().userAnswers[field.questionId] || '';
      if (value.trim() && value.trim() !== currentStoreAnswer) {
        // Capture correct previous answer before any store updates occur
        const currentDetails = useAnalysisStore.getState().answersDetails || {};
        const prevDetail = currentDetails[field.questionId] || {};
        const previousAnswerVal = prevDetail.user_answer || prevDetail.ai_answer || prevDetail.previous_answer || null;

        try {
          await updateConversationAnswer(field, value.trim());
          if (onAnswerUpdate) {
            await onAnswerUpdate(field.questionId, value.trim());
          }
          setEditedFields(prev => new Set([...prev, field.key]));

          // Keep local Zustand store details in perfect sync
          const latestDetails = { ...useAnalysisStore.getState().answersDetails };
          const latestPrevDetail = latestDetails[field.questionId] || {};
          latestDetails[field.questionId] = {
            ...latestPrevDetail,
            user_answer: value.trim(),
            previous_answer: previousAnswerVal
          };

          useAnalysisStore.setState({ answersDetails: latestDetails });

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
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    const input = inputRefs.current[field.key];
    const newValue = input?.value || '';
    
    // Capture correct previous answer before any store updates occur
    const currentDetails = useAnalysisStore.getState().answersDetails || {};
    const prevDetail = currentDetails[field.questionId] || {};
    const previousAnswerVal = prevDetail.user_answer || prevDetail.ai_answer || prevDetail.previous_answer || null;

    const currentStoreAnswer = useAnalysisStore.getState().userAnswers[field.questionId] || '';
    if (newValue.trim() === currentStoreAnswer.trim()) {
      setEditingField(null);
      return;
    }

    try {
      await updateConversationAnswer(field, newValue.trim());
      if (onAnswerUpdate) {
        await onAnswerUpdate(field.questionId, newValue.trim());
      }
      setEditedFields(prev => new Set([...prev, field.key]));

      // Keep local Zustand store details in perfect sync
      const latestDetails = { ...useAnalysisStore.getState().answersDetails };
      const latestPrevDetail = latestDetails[field.questionId] || {};
      latestDetails[field.questionId] = {
        ...latestPrevDetail,
        user_answer: newValue.trim(),
        previous_answer: previousAnswerVal
      };

      useAnalysisStore.setState({ answersDetails: latestDetails });

      showToastMessage('Answer updated successfully!', 'success');
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


  const saveStrategicFileToDatabase = async (file, page_count) => {
    try {
      strategicDocsCache.delete(selectedBusinessId);
      if (!selectedBusinessId) throw new Error('No business selected');

      const result = await answerService.uploadStrategicDocument(selectedBusinessId, file, page_count);
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



  // Multiple File concurrent validation and upload engine
  const processMultipleFiles = async (files) => {
    const validFiles = [];
    const newFileObjs = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop().toLowerCase();
      const isSpreadsheet = ['xlsx', 'xls', 'csv'].includes(fileExt);
      const isDoc = ['pdf', 'docx', 'doc'].includes(fileExt);
      const isPresentation = ['pptx', 'ppt'].includes(fileExt);

      if (!isSpreadsheet && !isDoc && !isPresentation) {
        showToastMessage(`File "${file.name}" format is unsupported. Please upload Excel, CSV, PDF, Word, or PowerPoint files.`, 'error');
        continue;
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const pageInfo = await computePageCount(file);

      const newFileObj = {
        id: fileId,
        name: file.name,
        size: file.size,
        pageInfo: pageInfo,
        uploadDate: new Date().toLocaleDateString(),
        status: 'uploading',
        progress: 15,
        type: isSpreadsheet ? 'spreadsheet' : isPresentation ? 'presentation' : (fileExt === 'pdf' ? 'pdf' : 'docx'),
        section: 'strategic',
        fileObject: file,
        isNewSessionFile: true
      };

      validFiles.push({ file, fileId });
      newFileObjs.push(newFileObj);
    }

    if (newFileObjs.length === 0) return;

    // 1. Add all valid file objects to the queue at once so they render simultaneously!
    setUploadedFiles(prev => [...prev, ...newFileObjs]);

    const successfulFiles = [];

    // 2. Upload all valid files concurrently
    const uploadPromises = validFiles.map(async ({ file, fileId }, index) => {
      // Progress animation
      let progressVal = 15;
      const progressInterval = setInterval(() => {
        progressVal = Math.min(progressVal + 20, 90);
        setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: progressVal } : f));
      }, 250);

      try {
        // Upload via the single unified endpoint!
        const strategicResult = await saveStrategicFileToDatabase(file, newFileObjs[index].pageInfo?.count);

        if (onUploadedFileUpdate) {
          onUploadedFileUpdate(file);
        }

        const newId = `db-strategic-${strategicResult.document.filename}`;
        const successFileObj = { 
          ...newFileObjs[index], 
          id: newId,
          progress: 100, 
          status: 'success', 
          fileObject: file 
        };
        successfulFiles.push(successFileObj);

        clearInterval(progressInterval);
        setUploadedFiles(prev => prev.map(f => f.id === fileId ? successFileObj : f));
        showToastMessage(`File "${file.name}" uploaded successfully! Click Analyze to process it.`, 'success');
      } catch (error) {
        clearInterval(progressInterval);
        setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'failed', errorMessage: error.message } : f));
        showToastMessage(`Ingestion failed for "${file.name}": ${error.message || 'Verification error.'}`, 'error');
      }
    });

    await Promise.all(uploadPromises);

    if (successfulFiles.length > 0) {
      // Just set to success, do not trigger analysis automatically
      setUploadedFiles(prev =>
        prev.map(f =>
          successfulFiles.some(fa => fa.id === f.id)
            ? { ...f, status: 'success', progress: 100, isNewSessionFile: true }
            : f
        )
      );
    }
  };

  const handleAnalyzeFilesBulk = async (filesToAnalyze) => {
    const fileIds = filesToAnalyze.map(f => f.id);
    // Set to analyzing state
    setUploadedFiles(prev =>
      prev.map(f =>
        fileIds.includes(f.id)
          ? { ...f, status: 'analyzing', progress: 30 }
          : f
      )
    );

    const hasSpreadsheet = filesToAnalyze.some(f => f.type === 'spreadsheet' || f.name.endsWith('.xlsx') || 
    f.name.endsWith('.xls') || f.name.endsWith('.csv'));

    // Wait for document analysis to fully complete (and persist to DB) before
    // calling syncFinancial — running them in parallel caused a 404 because
    // the session had no financial data yet when the sync request arrived.
    await handleAnalyzeDocuments(filesToAnalyze);

    if (hasSpreadsheet) {
      await handleSyncFinancial();
    }

    // Finally set to success
    setUploadedFiles(prev =>
      prev.map(f =>
        fileIds.includes(f.id)
          ? { ...f, status: 'success', progress: 100, isNewSessionFile: false }
          : f
      )
    );
    window.dispatchEvent(new CustomEvent('strategicDocumentsAnalyzed'));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const allowedTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      showToastMessage('Please upload Excel (.xlsx, .xls) files only.', 'error');
      return;
    }
    try {
      setIsFileUploading(true);
      const detection = await detectTemplateType(file);
      if (detection.confidence === 'none' || detection.score < 0.3) {
        throw new Error('Please check the file format. The uploaded file should be in the proper template file format.');
      }
      const validation = await validateAgainstTemplate(file, detection.type);
      if (!validation.isValid) {
        throw new Error('Please check the file format. The uploaded file should be in the proper template file format.');
      }
      const validationResult = {
        templateType: detection.type,
        templateName: validation.templateName,
        validation: validation,
        confidence: detection.confidence,
        uploadMode: 'auto-detect'
      };
      await saveFileToDatabase(file, validationResult);
      
      const fileId = `file-${Date.now()}`;
      setUploadedFiles(prev => {
        const filtered = prev.filter(f => f.type !== 'spreadsheet');
        return [
          ...filtered,
          {
            id: fileId,
            name: file.name,
            size: file.size,
            uploadDate: new Date().toLocaleDateString(),
            status: 'success',
            type: 'spreadsheet',
            progress: 100
          }
        ];
      });

      if (onUploadedFileUpdate) {
        onUploadedFileUpdate(file);
      }
      // Disabled automatic regeneration on file upload as per new flow
      showToastMessage(`File "${file.name}" ingested successfully!`, 'success');
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

  const handleRemoveFile = async (fileId, fileName) => {
    try {
      if (fileId.startsWith('db-strategic-')) {
        strategicDocsCache.delete(selectedBusinessId);
        setIsSaving(true);
        showToastMessage(`Removing "${fileName}" references from database...`, 'info');

        // Also call the backend DELETE API to delete the strategic document itself
        const backendFilename = fileId.replace('db-strategic-', '');
        if (backendFilename && backendFilename !== fileName) {
          try {
            await answerService.deleteStrategicDocument(selectedBusinessId, backendFilename);
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
      } else {
        // Queue/temporary files not yet persisted
        showToastMessage(`Removed "${fileName}" from active framework index.`, 'info');
      }

      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      window.dispatchEvent(new CustomEvent('strategicDocumentsAnalyzed'));
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

      const currentStoreBusinessId = useBusinessStore.getState().selectedBusinessId;
      
      if (currentStoreBusinessId !== selectedBusinessId) {
        return;
      }

      // Disabled automatic regeneration on enriched answers update as per new flow
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
  // Multiple File Unified Document Ingestion & Bulk Save Flow
  const handleAnalyzeDocuments = async (explicitFilesToAnalyze = null) => {
    // Find all documents in the upload section (strategic) - matches exactly what is shown in the UI
    const filesToAnalyze = explicitFilesToAnalyze || uploadedFiles.filter(f => f.section === 'strategic' && f.isNewSessionFile);

    if (filesToAnalyze.length === 0) {
      showToastMessage('No documents in the queue to analyze.', 'info');
      return;
    }

    try {
      setIsAnalyzingDocs(true);

      if (fileUploadSectionRef.current) {
        fileUploadSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // 1. Download ALL files from Azure Cloud (via Backend strategic download)
      const fetchedFiles = [];
      for (const file of filesToAnalyze) {
        let rawFile = file.fileObject;
        if (!rawFile) {
          const filename = file.id.replace('db-strategic-', '');
          const blob = await answerService.downloadStrategicDocument(selectedBusinessId, filename);
          rawFile = new File([blob], file.name, { type: blob.type || 'application/octet-stream' });
        }
        fetchedFiles.push(rawFile);
      }

      // 2. Call the ML strategic analysis API (document-qa) with ALL uploaded documents
      let mlResult = { answers: [] };
      if (fetchedFiles.length > 0) {
        mlResult = await answerService.analyzeStrategicDocumentsML(fetchedFiles, selectedBusinessId);
      }
      
      if (!mlResult || !Array.isArray(mlResult.answers)) {
        throw new Error('Invalid response received from the ML analysis engine.');
      }

      // 3. Pass responses to backend to save in the database
      const analyzedFileNames = filesToAnalyze.map(f => f.id.replace('db-strategic-', ''));
      const result = await answerService.analyzeStrategicDocumentsBackend(selectedBusinessId, mlResult.answers, analyzedFileNames);
      
      if (!result || !Array.isArray(result.answers)) {
        throw new Error(result?.error || 'Failed to save analysis answers to backend.');
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

      // 2. Call the financial analysis API (financial-summary-extract) with all documents in queue
      await triggerSSEAnalysis(selectedBusinessId, fetchedFiles);

      const currentStoreBusinessId = useBusinessStore.getState().selectedBusinessId;
      
      if (currentStoreBusinessId !== selectedBusinessId) {
        return;
      }

      // 3. Automatic regeneration disabled. User must click "Generate Advanced Insights" manually.

    } catch (err) {
      console.error('Unified dual analysis error:', err);
      const serverError = err.response?.data?.error || err.message || 'Error occurred.';
      setUploadedFiles(prev =>
        prev.map(f =>
          filesToAnalyze.some(fa => fa.id === f.id)
            ? { ...f, status: 'failed', progress: 100 }
            : f
        )
      );
      showToastMessage(`ML Analysis API failed: ${serverError}. The document remains uploaded successfully.`, 'error');
    } finally {
      setIsAnalyzingDocs(false);
    }
  };

  // Drawer Reference Actions
  const handleOpenReference = (data) => {
    if (drawerOpen && drawerData && drawerData.title === data.title) {
      setDrawerOpen(false);
    } else {
      let normalizedData = { ...data };
      if (!Array.isArray(normalizedData.evidence)) {
        normalizedData.evidence = [{
          document_name: data.doc || data.document_name || 'Strategic Document',
          page: data.page || null,
          sheet: data.sheet || data.source_sheet || data.cell || null,
          text: data.text || data.excerpt || ''
        }];
      }
      setDrawerData(normalizedData);
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
  const successfulIngestionCount = uploadedFiles.filter(f => f.section === 'strategic' && f.status === 'success').length;
  const uploadedFilesCount = uploadedFiles.filter(f => f.status === 'uploaded').length;

  const strategyFiles = uploadedFiles.filter(f => f.section === 'strategic');

  const initialCompletedCount = initialFields.filter(f => cleanValue(f.value).trim() !== '').length;
  const isAllMandatoryAnswered = briefFields.filter(f => f.severity === 'mandatory').every(f => {
    const cleanAns = cleanValue(f.value);
    return cleanAns && cleanAns !== '[Question Skipped]';
  });
  const initialCountStr = `${initialCompletedCount}/${initialFields.length}`;
  const essentialCountStr = `${essentialFields.filter(f => cleanValue(f.value).trim() !== '').length}/${essentialFields.length}`;
  const advancedCountStr = `${advancedFields.filter(f => cleanValue(f.value).trim() !== '').length}/${advancedFields.length}`;

  const displayFinancialMetrics = (() => {
    if (!docIntelSession?.financialMetrics) return defaultFinancialMetrics;
    const merged = JSON.parse(JSON.stringify(defaultFinancialMetrics));
    if (docIntelSession.financialMeta) merged.meta = { ...merged.meta, ...docIntelSession.financialMeta };
    else if (docIntelSession.financialMetrics.meta) merged.meta = { ...merged.meta, ...docIntelSession.financialMetrics.meta };
    const cats = ["financial_performance", "financial_health", "operational_efficiency", "cost_efficiency"];
    cats.forEach(cat => {
      if (docIntelSession.financialMetrics[cat]) {
        Object.keys(docIntelSession.financialMetrics[cat]).forEach(k => {
          if (k !== 'meta') merged[cat][k] = docIntelSession.financialMetrics[cat][k];
        });
      }
    });
    return merged;
  })();

  const handleTabModeChange = (mode) => {
    setFinancialTabMode(mode);
    if (mode === 'analysis') {
      const state = useAnalysisStore.getState();
      const hasFinancialAnalysis = state.profitabilityData || state.growthTrackerData || state.liquidityEfficiencyData || state.investmentPerformanceData || state.leverageRiskData;
      const hasMetrics = !!docIntelSession?.financialMetrics;
      
      // Auto-trigger financial generation if not yet generated but data exists
      if (!hasFinancialAnalysis && hasMetrics && onAnalysisRegenerate) {
        onAnalysisRegenerate({
          alsoRegenerateStrategic: false,
          includeFinancial: true,
          skipConfirmation: true
        });
      }
    }
  };

  const financialCountStr = (() => {
    if (!displayFinancialMetrics) return "0/0";
    let total = 0;
    let filled = 0;
    const cats = ["financial_performance", "financial_health", "operational_efficiency", "cost_efficiency"];
    cats.forEach(catKey => {
      const metricsMap = displayFinancialMetrics[catKey] || {};
      const metricsEntries = Object.entries(metricsMap).filter(([k]) => k !== "meta");
      total += metricsEntries.length;
      metricsEntries.forEach(([k, v]) => {
        if (v && v.value !== undefined && v.value !== null && String(v.value).trim() !== '') {
          filled++;
        }
      });
    });
    return `${filled}/${total}`;
  })();

  const currentTabFields = activePhaseTab === 'initial'
    ? initialFields
    : activePhaseTab === 'essential'
      ? essentialFields
      : advancedFields;

  const hasAnyAnswer = [...initialFields, ...essentialFields, ...advancedFields].some(f => cleanValue(f.value).trim() !== '');
  let hasAnyFinancial = false;
  if (displayFinancialMetrics) {
    const cats = Object.keys(displayFinancialMetrics).filter(k => k !== 'meta');
    for (const cat of cats) {
        const metrics = displayFinancialMetrics[cat];
        if (metrics && Object.values(metrics).some(m => m && m.value !== undefined && m.value !== null && String(m.value).trim() !== '')) {
            hasAnyFinancial = true;
            break;
        }
    }
  }
  const hasAnyValidData = hasAnyAnswer || hasAnyFinancial;

  const isAnyApiActive = isEnriching || isApplyingEnrichment || isAnalyzingDocs || isAnalyzingFinancial;
  const isAnyFileUploading = uploadedFiles.some(f => f.status === 'uploading');

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

      <div className="brief-advanced-layout" style={{ display: 'flex', flexDirection: 'column',padding: '0 10px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        


          {/* 2. Unified Ingestion Dropzone Section */}
          <div ref={fileUploadSectionRef} className="brief-card upload-docs-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottomLeftRadius: '0', borderBottomRightRadius: '0', marginBottom: 0 }}>
            <div 
              className={`brief-card-header accordion-header ${!leftPanelExpanded.fileUpload ? 'collapsed' : ''}`}
              onClick={() => { if (isAnyApiActive) return; setLeftPanelExpanded(prev => ({ ...prev, fileUpload: !prev.fileUpload })); }}
              style={{ cursor: isAnyApiActive ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '16px', background: 'white' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} style={{ color: '#0ea5e9' }} />
                <h4 className="brief-card-title" style={{ fontWeight: '600', margin: 0, fontSize: '15px', color: '#0f172a' }}>Add documents <span style={{ color: '#94a3b8', fontWeight: 'normal', fontStyle: 'italic' }}>(optional)</span> {strategyFiles.length > 0 && <span style={{ color: '#0ea5e9', fontSize: '13px', marginLeft: '8px', fontWeight: '500' }}>{strategyFiles.length} file{strategyFiles.length > 1 ? 's' : ''}</span>}</h4>
              </div>
              {leftPanelExpanded.fileUpload ? <ChevronUp size={16} style={{ color: '#94a3b8' }} /> : <ChevronDown size={16} style={{ color: '#94a3b8' }} />}
            </div>
            
            {leftPanelExpanded.fileUpload && (
              <div className="brief-card-body" style={{ padding: '0 16px 16px 16px', background: 'white' }}>
                <div style={{ background: '#f0f9ff', border: '1px solid #e0f2fe', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                    <strong style={{ color: '#0284c7' }}>Trax values context.</strong> Upload financials, a board deck, or a market report and Trax will auto-fill what it can across all four sections — the more it has, the sharper the analysis.
                  </p>
                </div>

                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileInputChange}
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
                  disabled={isAnyApiActive || !canEdit}
                />

                {strategyFiles.length > 0 && (() => {
                  const renderFile = (file) => {
                    const ext = (file.name || '').split('.').pop().toUpperCase();
                    let badgeColor = '#64748b';
                    let badgeBg = '#f1f5f9';
                    if (['XLSX', 'XLS', 'CSV'].includes(ext)) { badgeColor = '#16a34a'; badgeBg = '#dcfce7'; }
                    else if (['PDF'].includes(ext)) { badgeColor = '#ef4444'; badgeBg = '#fee2e2'; }
                    else if (['DOCX', 'DOC'].includes(ext)) { badgeColor = '#2563eb'; badgeBg = '#dbeafe'; }

                    return (
                      <div key={file.id} className="sidebar-file-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '3px 8px', marginBottom: '8px' }}>
                        <div className="sidebar-file-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: badgeColor, fontWeight: '800', fontSize: '10px', background: badgeBg, padding: '4px 8px', borderRadius: '4px' }}>{ext || 'FILE'}</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="sidebar-file-name" title={file.name} style={{ fontWeight: '500', fontSize: '14px', color: '#1e293b' }}>{file.name}</span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>{getFileDetails(file, file.pageInfo)}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`file-status-badge ${file.status}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                              {file.status === 'uploading' ? `${file.progress}%` : (
                                file.status === 'analyzing' ? (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Loader2 size={12} className="animate-spin" /> Analyzing...
                                  </span>
                                ) : file.status
                              )}
                            </span>
                            {file.isNewSessionFile && (
                              <button
                                className="sidebar-file-delete-btn"
                                onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.id, file.name); }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  color: '#ef4444',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Delete file"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                      </div>
                    );
                  };

                  return (
                    <div style={{ marginBottom: '16px' }}>
                      <div className="sidebar-file-list">
                        {(() => {
                          const unanalyzedFiles = strategyFiles.filter(f => f.isNewSessionFile);
                          const analyzedFiles = strategyFiles.filter(f => !f.isNewSessionFile);
                          
                          return (
                            <>
                              {unanalyzedFiles.length > 0 && (
                                <div style={{ marginBottom: analyzedFiles.length > 0 ? '16px' : '0' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h5 style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: '600' }}>Not Analyzed</h5>
                                    {unanalyzedFiles.some(f => f.status === 'success') && (
                                      <button
                                        className="sidebar-file-analyze-btn"
                                        onClick={() => {
                                          if (isAnyApiActive || !canEdit) return;
                                          const filesToAnalyze = unanalyzedFiles.filter(f => f.status === 'success');
                                          handleAnalyzeFilesBulk(filesToAnalyze);
                                        }}
                                        disabled={isAnyApiActive || !canEdit}
                                        style={{
                                          cursor: (isAnyApiActive || !canEdit) ? 'not-allowed' : 'pointer',
                                          opacity: (isAnyApiActive || !canEdit) ? 0.5 : 1,
                                          padding: '4px 12px',
                                          background: 'var(--color-primary)',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '6px',
                                          fontSize: '12px',
                                          fontWeight: '600'
                                        }}
                                        title="Analyze new files"
                                      >
                                        Analyze
                                      </button>
                                    )}
                                  </div>
                                  {unanalyzedFiles.map(renderFile)}
                                </div>
                              )}

                              {analyzedFiles.length > 0 && (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h5 style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: '600' }}>Analyzed</h5>
                                  </div>
                                  {analyzedFiles.map(renderFile)}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                  <button 
                    onClick={() => { if (!isAnyApiActive && canEdit) triggerFileInput(); }}
                    disabled={isAnyApiActive || !canEdit}
                    style={{ width: 'auto', background: 'white', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '3px 8px', color: '#64748b', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', cursor: (isAnyApiActive || !canEdit) ? 'not-allowed' : 'pointer' }}
                  >
                    <span style={{ fontSize: '18px', fontWeight: '300' }}>+</span> Add file
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderTop: 'none', borderTopLeftRadius: '0', borderTopRightRadius: '0', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <span style={{ fontSize: '14px' }}>🔒</span>
            <p style={{ margin: 0, fontSize: '13px', color: '#16a34a' }}>
              <strong>Your documents stay private.</strong> Encrypted at rest and isolated to your workspace.
            </p>
          </div>

          {/* Phase Tabs */}
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
                <button
                  className={`phase-tab-btn ${activePhaseTab === 'financial' ? 'active' : ''}`}
                  onClick={() => { setActivePhaseTab('financial'); setExpandAll(false); }}
                >
                  <span className="phase-tab-title">Financial Data</span> 
                  <span className="phase-tab-badge">{financialCountStr}</span>
                </button>
              </div>
              {/* <div className="sqc-header-actions">
                <button 
                  className="expand-all-btn" 
                  onClick={() => setExpandAll(!expandAll)}
                  style={{ background: 'white' }}
                >
                  {expandAll ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  <span>{expandAll ? 'Collapse all' : 'Expand all'}</span>
                </button>
              </div> */}
            </div>

          <div className="sqc-meta-bar">
              {activePhaseTab === 'financial' ? null : (
                <span className="sqc-meta-count">
                  <span style={{ color: '#4f46e5', fontWeight: 700 }}>
                    {currentTabFields.filter(f => cleanValue(f.value).trim() !== '').length}
                  </span>
                  /{currentTabFields.length} completed
                </span>
              )}
              {/* {activePhaseTab !== 'financial' && (
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
              )} */}
            </div>

          <div className="phase-tab-content-list">
            {/* FINANCIAL DATA (LEDGER VIEW) */}
            {activePhaseTab === 'financial' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <div className="custom-toggle-container" style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
                    <button 
                      onClick={() => handleTabModeChange('data')}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: financialTabMode === 'data' ? 'white' : 'transparent', color: financialTabMode === 'data' ? '#0f172a' : '#64748b', fontWeight: financialTabMode === 'data' ? '600' : '500', boxShadow: financialTabMode === 'data' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                      Data
                    </button>
                    <button 
                      onClick={() => handleTabModeChange('analysis')}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: financialTabMode === 'analysis' ? 'white' : 'transparent', color: financialTabMode === 'analysis' ? '#0f172a' : '#64748b', fontWeight: financialTabMode === 'analysis' ? '600' : '500', boxShadow: financialTabMode === 'analysis' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                      Analysis
                    </button>
                  </div>
                </div>

                {financialTabMode === 'data' ? (
                  displayFinancialMetrics ? (
                    <div className="doc-intel-ledger" style={{ marginTop: '0', border: 'none', boxShadow: 'none', background: 'transparent', padding: '10px 0px' }}>
                      <div className="ledger-category-header" style={{ marginBottom: '15px', color: '#16a34a', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
                        <Database size={16} />
                        <span>Extracted Ledger Workspace</span>
                      </div>

                  {/* Sync ledger button moved to the top */}
                  <div className="sync-ledger-footer" style={{ marginBottom: '20px', marginTop: '5px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      HITL verification active. Sync to update core products.
                    </span>
                    <button 
                      className="btn-sync-ledger"
                      onClick={() => {
                        // Guard: block manual sync while any document is still being analyzed.
                        // (Programmatic calls from handleAnalyzeFilesBulk bypass this check.)
                        const isStillAnalyzing = uploadedFiles.some(f => f.status === 'analyzing');
                        if (isStillAnalyzing) {
                          showToastMessage("Documents are still being analyzed. Please wait before syncing.", "warning");
                          return;
                        }
                        handleSyncFinancial();
                      }}
                      disabled={!canEdit || isAnyApiActive}
                    > 
                      <span>Save Financial Data</span>
                    </button>
                  </div>

                  <div className="ledger-meta-grid">
                    <div className="meta-pill">
                      <span className="meta-pill-lbl">CURRENCY</span>
                      <span className="meta-pill-val">{displayFinancialMetrics.meta?.document_currency || "USD"}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-pill-lbl">REPORT PERIOD</span>
                      <span className="meta-pill-val">{displayFinancialMetrics.meta?.reporting_period || "FY2024"}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-pill-lbl">CONFIDENCE</span>
                      <span className="meta-pill-val confidence-high" style={{ textTransform: 'uppercase' }}>
                        <CheckCircle size={12} />
                        {displayFinancialMetrics.meta?.extraction_confidence || "HIGH"}
                      </span>
                    </div>
                  </div>

                  {/* Expandable LEDGER CATEGORIES */}
                  {Object.entries({
                    "financial_performance": { icon: "📈", label: "Financial Performance" },
                    "financial_health": { icon: "🏦", label: "Financial Health" },
                    "operational_efficiency": { icon: "⚙️", label: "Operational Efficiency" },
                    "cost_efficiency": { icon: "💰", label: "Cost & CAPEX Efficiency" }
                    // "profitability": { icon: "💹", label: "Profitability" },
                    // "liquidity": { icon: "💧", label: "Liquidity" },
                    // "leverage": { icon: "⚖️", label: "Leverage" },
                    // "investment": { icon: "🚀", label: "Investment" }
                  }).map(([catKey, catInfo]) => {
                    const metricsMap = displayFinancialMetrics[catKey] || {};
                    const metricsEntries = Object.entries(metricsMap).filter(([k]) => k !== "meta");
                    
                    return (
                      <div key={catKey} className="ledger-category-block">
                        <div className="ledger-category-header">
                          <span>{catInfo.icon}</span>
                          <span>{catInfo.label}</span>
                          <span className="count">{metricsEntries.length}</span>
                        </div>
                        
                        <div className="ledger-metrics-grid">
                          {metricsEntries.map(([metricKey, mData]) => {
                            const isEditing = editingMetric?.category === catKey && editingMetric?.key === metricKey;
                            const lowerKey = metricKey.toLowerCase();
                            const isPercentage = 
                              lowerKey.includes('growth') || 
                              lowerKey.includes('margin') || 
                              lowerKey === 'roa' || 
                              lowerKey === 'roe';
                              
                            const displayValue = (() => {
                              if (mData?.value === null || mData?.value === undefined) return "N/A";
                              
                              if (isPercentage) {
                                return `${(mData.value * 100).toFixed(1)}%`;
                              }
                              
                              // Plain numbers -> Current Ratio, Quick Ratio, Debt-to-Equity, Interest Coverage, Employees
                              const isPlainNumber = 
                                lowerKey.includes('ratio') || 
                                lowerKey.includes('coverage') || 
                                lowerKey.includes('debt_to_equity') || 
                                lowerKey === 'employees';
                                
                              if (isPlainNumber) {
                                return mData.value.toLocaleString(undefined, { 
                                  minimumFractionDigits: 0, 
                                  maximumFractionDigits: 2 
                                });
                              }
                              
                              // Currency formatting using common utility
                              return formatCurrencyValue(mData.value, mData.currency || "USD");
                            })();

                            return (
                              <div key={metricKey} className="ledger-metric-card">
                                <div className="ledger-metric-info">
                                  <span className="ledger-metric-name">{metricKey.replace(/_/g, ' ')}</span>
                                  <div className="ledger-metric-subtext">
                                    {(() => {
                                      const citation = mData?.citation;
                                      const sourcePage = citation?._metadata?.page || mData?.source_page;
                                      const sourceSheet = citation?._metadata?.sheet || mData?.source_sheet;
                                      const citationText = citation?.text || mData?.excerpt;
                                      const citationFilename = citation?.filename || docIntelSession?.uploadedDocuments?.[0]?.original_name || "financial_statement.xlsx";
                                      const hasCitation = !!(citation || sourcePage || sourceSheet);
                                      const displayRef = sourcePage ? `Page ${sourcePage}` : (sourceSheet ? sourceSheet : '');

                                      if (!hasCitation) return null;

                                      return (
                                        <span 
                                          className="ledger-metric-citation"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenReference({
                                              title: `FINANCIAL INDICATOR: ${metricKey.replace(/_/g, ' ').toUpperCase()}`,
                                              doc: citationFilename,
                                              excerpt: citationText || `Disclosed financial metric in ${sourceSheet ? `sheet ${sourceSheet}` : 'balance sheet worksheets'}.`,
                                              cell: sourcePage ? `Page ${sourcePage}` : (sourceSheet ? `Sheet ${sourceSheet}` : ''),
                                              page: sourcePage || null,
                                              sheet: sourceSheet || null
                                            });
                                          }}
                                        >
                                          Citation
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>

                                <div className="ledger-metric-action-area">
                                  {isEditing ? (
                                    <input 
                                      type="text"
                                      className="ledger-metric-edit-input"
                                      value={editMetricValue}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                                          setEditMetricValue(val);
                                        }
                                      }}
                                      onBlur={() => {
                                        let finalValue = editMetricValue;
                                        if (isPercentage && editMetricValue !== '' && !isNaN(parseFloat(editMetricValue))) {
                                          finalValue = String(parseFloat(editMetricValue) / 100);
                                        }
                                        handleUpdateMetric(catKey, metricKey, finalValue);
                                        setEditingMetric(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          let finalValue = editMetricValue;
                                          if (isPercentage && editMetricValue !== '' && !isNaN(parseFloat(editMetricValue))) {
                                            finalValue = String(parseFloat(editMetricValue) / 100);
                                          }
                                          handleUpdateMetric(catKey, metricKey, finalValue);
                                          setEditingMetric(null);
                                        } else if (e.key === "Escape") {
                                          setEditingMetric(null);
                                        }
                                      }}
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className="ledger-metric-value-display"
                                      onClick={() => {
                                        if (!canEdit || isAnyApiActive) return;
                                        setEditingMetric({ category: catKey, key: metricKey });
                                        if (mData?.value !== null && mData?.value !== undefined) {
                                          setEditMetricValue(isPercentage ? String(mData.value * 100) : String(mData.value));
                                        } else {
                                          setEditMetricValue('');
                                        }
                                      }}
                                      style={{ cursor: (!canEdit || isAnyApiActive) ? 'not-allowed' : 'pointer' }}
                                    >
                                      {displayValue}
                                    </span>
                                  )}

                                  <button 
                                    className="ledger-metric-edit-btn"
                                    disabled={!canEdit || isAnyApiActive}
                                    onClick={() => {
                                      if (!canEdit || isAnyApiActive) return;
                                      if (isEditing) {
                                        let finalValue = editMetricValue;
                                        if (isPercentage && editMetricValue !== '' && !isNaN(parseFloat(editMetricValue))) {
                                          finalValue = String(parseFloat(editMetricValue) / 100);
                                        }
                                        handleUpdateMetric(catKey, metricKey, finalValue);
                                        setEditingMetric(null);
                                      } else {
                                        setEditingMetric({ category: catKey, key: metricKey });
                                        if (mData?.value !== null && mData?.value !== undefined) {
                                          setEditMetricValue(isPercentage ? String(mData.value * 100) : String(mData.value));
                                        } else {
                                          setEditMetricValue('');
                                        }
                                      }
                                    }}
                                  >
                                    {isEditing ? <Check size={12} /> : <Edit3 size={12} />}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                </div>
              ) : (
                <div className="empty-phase-questions">
                  No financial data available.
                </div>
              )
            ) : (
              <AnalysisContentManager singleCategory="costs-financial" selectedBusinessId={selectedBusinessId} />
            )}
          </>
        ) : currentTabFields.length === 0 ? (
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

          {/* Generate Advanced Insights Button */}
          {!(activePhaseTab === 'financial' && financialTabMode === 'analysis') && (
            <div style={{ marginTop: '32px', marginBottom: '32px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
                <button
                  className="btn-refine-action"
                  onClick={() => {
                    if (!canEdit || isAnyApiActive) return;

                    // Validate mandatory questions
                    const unansweredMandatory = briefFields.filter(f => {
                      if (f.severity !== 'mandatory') return false;
                      const cleanAns = cleanValue(f.value);
                      return !cleanAns || cleanAns === '[Question Skipped]';
                    });

                    if (unansweredMandatory.length > 0) {
                      showToastMessage("Please answer all mandatory questions to unlock Advanced Insights.", "error");
                      return;
                    }

                    setConfirmModalConfig({
                      title: t('Generate Advanced Insights') || 'Generate Advanced Insights',
                      message: 'This will regenerate all insights and strategic analysis based on your answers. Are you sure you want to proceed?',
                      onConfirm: async () => {
                        try {
                          const { useBusinessStore } = await import('../store/businessStore');
                          const businessId = useBusinessStore.getState().selectedBusinessId;
                          if (businessId) {
                            await useBusinessStore.getState().updatePmfStage(businessId, 'insights');
                            queryClient.setQueryData(['businesses'], (oldData) => {
                              if (!oldData) return oldData;
                              const updateList = (list) => (list || []).map(b => 
                                (b._id === businessId || b.id === businessId) ? { ...b, pmf_stage: 'insights' } : b
                              );
                              return {
                                ...oldData,
                                businesses: updateList(oldData.businesses),
                                collaborating_businesses: updateList(oldData.collaborating_businesses)
                              };
                            });
                            queryClient.invalidateQueries({ queryKey: ['businesses'] });
                          }
                        } catch (err) {
                          console.error("Failed to update pmf stage:", err);
                        }

                        if (onAnalysisRegenerate) {
                          onAnalysisRegenerate({
                            alsoRegenerateStrategic: true,
                            includeFinancial: true,
                            skipConfirmation: true
                          });
                          if (setActiveTab) {
                            setActiveTab('insights');
                          }
                        }
                      }
                    });
                    setShowConfirmModal(true);
                  }}
                  disabled={isAnyApiActive || !canEdit || !hasAnyValidData || !isAllMandatoryAnswered}
                  style={{ width: 'auto', padding: '12px 32px', background: (isAnyApiActive || !canEdit || !hasAnyValidData || !isAllMandatoryAnswered) ? '#93c5fd' : '#0c71b9', color: '#fff', fontSize: '15px', fontWeight: '600', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: (isAnyApiActive || !canEdit || !hasAnyValidData || !isAllMandatoryAnswered) ? 'not-allowed' : 'pointer', opacity: (isAnyApiActive || !canEdit || !hasAnyValidData || !isAllMandatoryAnswered) ? 0.6 : 1 }}
                >
                  {(isAnalysisRegenerating || isStrategicRegenerating) ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      <span>Generating Insights...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Advanced Insights</span>
                      <span style={{ fontSize: '16px' }}>&rarr;</span>
                    </>
                  )}
                </button>
              <p style={{ marginTop: '16px', marginBottom: '0', color: '#94a3b8', fontSize: '13px' }}>
                {isAllMandatoryAnswered ? 'All mandatory sections complete - generate your Advanced analysis.' : 'Please answer all mandatory questions before generating insights.'}
              </p>
            </div>
          )}

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
            <div>
              <div className="drawer-section-title" style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', marginBottom: '8px' }}>
                Target Question Context
              </div>
              <div className="drawer-question-label" style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', lineHeight: '1.4' }}>
                {drawerData.title}
              </div>
            </div>

            {/* Loop through each evidence block individually */}
            {Array.isArray(drawerData.evidence) && drawerData.evidence.length > 0 ? (
              drawerData.evidence.map((ev, index) => {
                // Split comma-separated document names if present
                const docNames = ev.document_name 
                  ? ev.document_name.split(',').map(s => s.trim()).filter(Boolean)
                  : [docName || 'Strategic Document'];

                return (
                  <div key={index} className="evidence-block" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc' }}>
                    <div style={{ background: '#f1f5f9', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className="drawer-source-label" style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        DOCUMENT SOURCE {drawerData.evidence.length > 1 ? `#${index + 1}` : ''}
                      </div>
                      
                      {/* Render each document citation individually */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {docNames.map((name, dIdx) => {
                          const isPDF = name.toLowerCase().endsWith('.pdf');
                          const isDocx = name.toLowerCase().endsWith('.docx') || name.toLowerCase().endsWith('.doc');
                          const isExcel = name.toLowerCase().endsWith('.xlsx') || name.toLowerCase().endsWith('.xls');

                          return (
                            <div key={dIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px' }}>
                              {isPDF ? (
                                <span style={{ background: '#fee2e2', color: '#ef4444', fontSize: '9px', fontWeight: '800', padding: '2px 4px', borderRadius: '4px' }}>PDF</span>
                              ) : isDocx ? (
                                <span style={{ background: '#dbeafe', color: '#2563eb', fontSize: '9px', fontWeight: '800', padding: '2px 4px', borderRadius: '4px' }}>DOC</span>
                              ) : isExcel ? (
                                <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '9px', fontWeight: '800', padding: '2px 4px', borderRadius: '4px' }}>XLS</span>
                              ) : (
                                <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '9px', fontWeight: '800', padding: '2px 4px', borderRadius: '4px' }}>FILE</span>
                              )}
                              <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', wordBreak: 'break-all', flex: 1 }}>
                                {name}
                              </span>
                              {ev.page ? (
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#4f46e5', background: '#e0e7ff', padding: '1px 6px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                                  Page {ev.page}
                                </span>
                              ) : (ev.sheet || ev.source_sheet) ? (
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                                  {ev.sheet || ev.source_sheet}
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="drawer-excerpt-box" style={{ padding: '14px', background: '#fffbeb' }}>
                      <div className="drawer-excerpt-label" style={{ fontSize: '10px', fontWeight: '700', color: '#b45309', marginBottom: '6px', textTransform: 'uppercase' }}>
                        VERBATIM DOCUMENT EXCERPT
                      </div>
                      <p className="drawer-excerpt-text" style={{ margin: 0, fontSize: '12px', color: '#78350f', fontStyle: 'italic', lineHeight: '1.6' }}>
                        {ev.text ? `"${ev.text}"` : 'No excerpt text available.'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>
                No citation details found.
              </div>
            )}
          </div>
        )}
      </div>


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
