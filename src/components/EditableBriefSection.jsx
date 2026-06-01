import React, { useState, useEffect, useRef } from 'react';
import {
  Edit3, Check, X, Loader, AlertCircle, Sparkles, Wand2, Upload, FileText, Database, RefreshCw,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle, FileSpreadsheet, HelpCircle, Eye, ArrowRight, BookOpen, Trash2
} from 'lucide-react';
import { AnalysisApiService } from '../services/analysisApiService';
import { answerService } from '../services/answerService';
import { useTranslation } from "../hooks/useTranslation";
import { detectTemplateType, validateAgainstTemplate } from '../utils/templateValidator';
import '../styles/CompanyManagement.css';
import '../styles/docIntelligence.css';
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
      <div className="sqc-summary" style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'start', gap: '8px', minHeight: '46px' }} onClick={() => !isEditing && setIsExpanded(prev => !prev)}>
        {/* Left: number + status dot */}
        <div className="sqc-left" style={{ display: 'flex', alignItems: 'center', alignSelf: 'start', marginTop: '5px', gap: '6px', flexShrink: 0 }}>
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

  // Document Intelligence Add-on States
  const [docIntelSession, setDocIntelSession] = useState(null);
  const [isAnalyzingFinancial, setIsAnalyzingFinancial] = useState(false);
  const [sseLogs, setSseLogs] = useState([]);
  const [editingMetric, setEditingMetric] = useState(null); // { category, key }
  const [editMetricValue, setEditMetricValue] = useState('');
  const [isDragActiveFinancial, setIsDragActiveFinancial] = useState(false);
  const financialFileInputRef = useRef(null);

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
        const response = await fetch(`${API_BASE_URL}/api/config/limits`);
        if (!response.ok) throw new Error('Failed to fetch config limits');
        const data = await response.json();
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
  }, [API_BASE_URL]);

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

  // Load Document Intelligence Session
  useEffect(() => {
    if (!selectedBusinessId) return;
    const loadSession = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/sessions/business/${selectedBusinessId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const sData = await response.json();
          if (sData && sData.hasSession !== false) {
            setDocIntelSession(sData);
          } else {
            setDocIntelSession(null);
          }
        } else {
          setDocIntelSession(null);
        }
      } catch (err) {
        console.warn("[DocIntel] Failed to load session:", err);
      }
    };
    loadSession();
  }, [selectedBusinessId, API_BASE_URL]);

  // Trigger actual ML Backend financial extraction API!
  const triggerSSEAnalysis = (businessId) => {
    setIsAnalyzingFinancial(true);
    setSseLogs([
      { timestamp: new Date().toLocaleTimeString(), tag: "INGEST", message: "Initiating ML financial extraction...", type: "info" }
    ]);
    
    const runExtraction = async () => {
      try {
        let fileToAnalyze = financialFiles[0]?.fileObject;

        if (!fileToAnalyze) {
          setSseLogs(prev => [...prev, {
            timestamp: new Date().toLocaleTimeString(),
            tag: "DOWNLOAD",
            message: "File not in memory. Downloading uploaded spreadsheet from database...",
            type: "info"
          }]);

          const docInfo = await analysisService.fetchFinancialDocument(businessId);
          if (docInfo) {
            const docBlob = await analysisService.downloadFinancialDocument(businessId);
            if (docBlob) {
              fileToAnalyze = await analysisService.createFileFromDocument(docBlob, docInfo);
            }
          }
        }

        if (!fileToAnalyze) {
          throw new Error("Could not retrieve the uploaded financial document file.");
        }

        setSseLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          tag: "ML_API",
          message: "Sending file to ML backend for summary extraction...",
          type: "progress"
        }]);

        const formData = new FormData();
        formData.append('files', fileToAnalyze);

        const mlResponse = await fetch('https://trax-qa1-ml-b4e6gmc4hjdncdg2.centralus-01.azurewebsites.net/financial-summary-extract', {
          method: 'POST',
          body: formData
        });

        if (!mlResponse.ok) {
          const errText = await mlResponse.text();
          throw new Error(`ML extraction failed: ${mlResponse.statusText}. Details: ${errText}`);
        }

        const financialMetrics = await mlResponse.json();

        setSseLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          tag: "DATABASE",
          message: "Saving extracted financial metrics to database...",
          type: "progress"
        }]);

        const token = getAuthToken();
        const saveResponse = await fetch(`${API_BASE_URL}/api/sessions/save-raw`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId,
            status: "completed",
            strategicAnswers: [],
            financialMetrics
          })
        });

        if (!saveResponse.ok) {
          const saveErr = await saveResponse.json();
          throw new Error(saveErr.error || "Failed to save raw metrics to session state");
        }

        setSseLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          tag: "SYNC",
          message: "Synchronizing metrics with dashboard panels...",
          type: "progress"
        }]);

        const syncResponse = await fetch(`${API_BASE_URL}/api/sessions/business/${businessId}/sync-financial`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!syncResponse.ok) {
          const syncErr = await syncResponse.json();
          throw new Error(syncErr.error || "Failed to synchronize metrics to core product");
        }

        const syncResult = await syncResponse.json();

        // Reactively update Zustand store to render core charts instantly
        useAnalysisStore.setState({
          profitabilityData: { profitability: syncResult.excelAnalysisSuite.profitability },
          growthTrackerData: { growth_trends: syncResult.excelAnalysisSuite.growth_trends },
          liquidityEfficiencyData: { liquidity: syncResult.excelAnalysisSuite.liquidity },
          investmentPerformanceData: { investment: syncResult.excelAnalysisSuite.investment },
          leverageRiskData: { leverage: syncResult.excelAnalysisSuite.leverage },
          financialPerformanceData: syncResult.financialPerformanceData
        });

        if (onUploadedFileUpdate) {
          onUploadedFileUpdate({ name: fileToAnalyze.name });
        }

        setSseLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          tag: "SUCCESS",
          message: "Financial metrics extracted and synchronized successfully!",
          type: "success"
        }]);

        // Load latest session state to update local UI State
        const sessionResponse = await fetch(`${API_BASE_URL}/api/sessions/business/${businessId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (sessionResponse.ok) {
          const sData = await sessionResponse.json();
          if (sData && sData.hasSession !== false) {
            setDocIntelSession(sData);
            setActivePhaseTab('financial');
          }
        }

        showToastMessage("Financial data processed successfully via ML Backend!", "success");
      } catch (err) {
        console.error("Extraction pipeline failed:", err);
        setSseLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          tag: "FAILED",
          message: `Error: ${err.message}`,
          type: "failed"
        }]);
        showToastMessage(`Extraction failed: ${err.message}`, "error");
      } finally {
        setIsAnalyzingFinancial(false);
      }
    };

    runExtraction();
  };

  // Update a single financial metric (Human-in-the-loop)
  const handleUpdateMetric = async (category, metricKey, newValue) => {
    if (!docIntelSession) return;
    
    const oldValue = docIntelSession.financialMetrics?.[category]?.[metricKey]?.value;
    const parsedNewValue = newValue === '' || newValue === null || newValue === undefined ? null : parseFloat(newValue);
    
    // Guard: Only call the API if there is an actual change!
    if (oldValue === parsedNewValue || (isNaN(parsedNewValue) && oldValue === null)) {
      console.log(`[DocIntel] No change detected for ${metricKey} (${oldValue} === ${newValue}). Skipping API call.`);
      return;
    }
    
    const updatedMetrics = { ...docIntelSession.financialMetrics };
    if (updatedMetrics[category] && updatedMetrics[category][metricKey]) {
      updatedMetrics[category][metricKey].value = isNaN(parsedNewValue) ? null : parsedNewValue;
    }
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/sessions/business/${selectedBusinessId}/update-session`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ financialMetrics: updatedMetrics })
      });
      
      if (response.ok) {
        const result = await response.json();
        setDocIntelSession(prev => ({
          ...prev,
          financialMetrics: result.financialMetrics
        }));
        showToastMessage("Metric updated successfully.", "success");
      } else {
        throw new Error("Failed to update metric");
      }
    } catch (err) {
      showToastMessage(`Failed to update metric: ${err.message}`, "error");
    }
  };


  // Sync to Core Product
  const handleSyncFinancial = async () => {
    if (!docIntelSession) return;
    
    try {
      const token = getAuthToken();
      showToastMessage("Syncing Document Intelligence financial data to core product...", "info");
      const response = await fetch(`${API_BASE_URL}/api/sessions/business/${selectedBusinessId}/sync-financial`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        
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
        
        showToastMessage("Extracted metrics synchronized! All financial analysis modules are now unlocked.", "success");
      } else {
        throw new Error("Failed to sync financial data");
      }
    } catch (err) {
      showToastMessage(`Sync failed: ${err.message}`, "error");
    }
  };

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

  // Sync Document Intelligence session uploaded documents into our multi-file library
  useEffect(() => {
    if (docIntelSession && Array.isArray(docIntelSession.uploadedDocuments) && docIntelSession.uploadedDocuments.length > 0) {
      setUploadedFiles(prev => {
        let updated = [...prev];
        let changed = false;
        docIntelSession.uploadedDocuments.forEach(doc => {
          const docName = doc.original_name || 'financial_statement.xlsx';
          if (!updated.some(f => f.name === docName)) {
            updated.push({
              id: doc.id || 'db-financial',
              name: docName,
              size: doc.file_size || 240000,
              uploadDate: doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Uploaded',
              status: 'success',
              type: 'spreadsheet',
              progress: 100
            });
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [docIntelSession]);


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
        response = await answerService.updateAnswer(existingAnswerId, newAnswer);
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

  // Drag and Drop event handlers for Financial Spreadsheets
  const handleDragFinancial = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActiveFinancial(true);
    } else if (e.type === "dragleave") {
      setIsDragActiveFinancial(false);
    }
  };

  const handleDropFinancial = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActiveFinancial(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const onlySpreadsheets = files.filter(file => {
        const fileExt = file.name.split('.').pop().toLowerCase();
        return ['xlsx', 'xls', 'csv'].includes(fileExt);
      });
      if (onlySpreadsheets.length < files.length) {
        showToastMessage("Only Excel (.xlsx, .xls) and CSV files are allowed in this section.", "error");
      }
      if (onlySpreadsheets.length > 0) {
        processMultipleFiles(onlySpreadsheets);
      }
    }
  };

  const handleFinancialFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      const onlySpreadsheets = files.filter(file => {
        const fileExt = file.name.split('.').pop().toLowerCase();
        return ['xlsx', 'xls', 'csv'].includes(fileExt);
      });
      if (onlySpreadsheets.length < files.length) {
        showToastMessage("Only Excel (.xlsx, .xls) and CSV files are allowed in this section.", "error");
      }
      if (onlySpreadsheets.length > 0) {
        processMultipleFiles(onlySpreadsheets);
      }
    }
  };

  const triggerFinancialFileInput = () => {
    if (financialFileInputRef.current) {
      financialFileInputRef.current.click();
    }
  };

  // Multiple File sequential validation and upload engine
  const processMultipleFiles = async (files, isFinancial = false) => {
    const { maxFilesLimit, maxFileSizeMB } = uploadLimits;
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
      const isSpreadsheet = ['xlsx', 'xls'].includes(fileExt);
      const isDoc = ['pdf', 'docx'].includes(fileExt);

      if (fileExt === 'csv') {
        showToastMessage(`File "${file.name}" format is unsupported. CSV files are not accepted. Please upload PDF, Word (DOCX), or Excel (XLSX, XLS) files.`, 'error');
        continue;
      }

      // If uploading via financial templates popup, only allow spreadsheets
      if (isFinancial && !isSpreadsheet) {
        showToastMessage(`File "${file.name}" format is unsupported for financial data. Please upload Excel (XLSX, XLS) files only.`, 'error');
        continue;
      }

      if (!isSpreadsheet && !isDoc) {
        showToastMessage(`File "${file.name}" format is unsupported. Please upload PDF, Word (DOCX), or Excel (XLSX, XLS) files.`, 'error');
        continue;
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Determine file object type
      let fileType = 'pdf';
      if (isDoc) {
        fileType = fileExt === 'pdf' ? 'pdf' : 'docx';
      } else if (isSpreadsheet) {
        fileType = isFinancial ? 'spreadsheet' : 'excel-strategic';
      }

      const newFileObj = {
        id: fileId,
        name: file.name,
        size: file.size,
        uploadDate: new Date().toLocaleDateString(),
        status: 'uploading',
        progress: 15,
        type: fileType
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
        if (isFinancial && isSpreadsheet) {
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

          clearInterval(progressInterval);
          setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: 100, status: 'success', fileObject: file } : f));
          showToastMessage(`File "${file.name}" uploaded successfully! Click "Upload Financial Document" below to analyze.`, 'success');
        } else {
          // Strategic PDF/DOCX/XLSX/XLS - upload to database immediately!
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
      if (onAnalysisRegenerate) {
        setIsFinancialRegenerating(true);
        onAnalysisRegenerate({
          onlyFinancial: true,
          uploadedFile: file,
          skipConfirmation: true
        });
      }
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
      f => (f.type === 'pdf' || f.type === 'docx' || f.type === 'excel-strategic')
    );

    if (filesToAnalyze.length === 0) {
      showToastMessage('No strategic documents in the queue to analyze.', 'info');
      return;
    }

    try {
      setIsAnalyzingDocs(true);

      if (fileUploadSectionRef.current) {
        fileUploadSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

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

  const handleAnalyzeFinancial = () => {
    if (!selectedBusinessId || financialFiles.length === 0 || isAnyApiActive) return;
    
    setConfirmModalConfig({
      title: t('Confirm Financial Analysis') || 'Analyze Financial Documents',
      message: 'By doing this, this will remove the current financial data and overwrite all existing financial metrics and insights. Are you sure you want to proceed?',
      onConfirm: () => {
        triggerSSEAnalysis(selectedBusinessId);
        
        if (onAnalysisRegenerate) {
          onAnalysisRegenerate({
            onlyFinancial: true,
            uploadedFile: { name: financialFiles[0]?.name || "Financial_Statement.xlsx" },
            skipConfirmation: true
          });
        }
      }
    });
    setShowConfirmModal(true);
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
  const successfulIngestionCount = uploadedFiles.filter(f => (f.type === 'pdf' || f.type === 'docx' || f.type === 'excel-strategic') && f.status === 'success').length;
  const uploadedFilesCount = uploadedFiles.filter(f => f.status === 'uploaded').length;

  const strategyFiles = uploadedFiles.filter(f => f.type === 'pdf' || f.type === 'docx' || f.type === 'excel-strategic');
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
          <div ref={fileUploadSectionRef} className="brief-card upload-docs-card">
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
                  <p className="sidebar-dropzone-text" style={{ fontSize: '11.5px', padding: '0 4px' }}>
                    Drag & drop files or click to browse
                  </p>
                  <p style={{ fontSize: '10.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                    Supports: PDF, DOCX, XLSX, XLS
                  </p>
                  <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileInputChange}
                    accept=".pdf,.docx,.xlsx,.xls"
                    disabled={isAnyApiActive || !canEdit}
                  />
                </div>

                {strategyFiles.length > 0 && (
                  <div className="sidebar-file-list">
                    <div className="sidebar-list-header">Uploaded Documents</div>
                    {strategyFiles.map(file => (
                      <div key={file.id} className="sidebar-file-item">
                        <div className="sidebar-file-info">
                          {file.name.toLowerCase().endsWith('.pdf') ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-5-5z" fill="rgba(239, 68, 68, 0.05)" />
                              <path d="M14 2v5h5" />
                              <line x1="8" y1="15" x2="16" y2="15" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.5" />
                              <line x1="8" y1="17.5" x2="16" y2="17.5" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.5" />
                              <line x1="8" y1="20" x2="16" y2="20" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.5" />
                              <rect x="1.5" y="7.5" width="13.5" height="7" rx="1.2" fill="#ef4444" stroke="none" />
                              <text x="8.25" y="11" fill="white" fontSize="5.2" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" stroke="none" textAnchor="middle" dominantBaseline="central">PDF</text>
                            </svg>
                          ) : file.name.toLowerCase().endsWith('.docx') ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-5-5z" fill="rgba(37, 99, 235, 0.05)" />
                              <path d="M14 2v5h5" />
                              <line x1="8" y1="15" x2="16" y2="15" stroke="rgba(37, 99, 235, 0.4)" strokeWidth="1.5" />
                              <line x1="8" y1="17.5" x2="16" y2="17.5" stroke="rgba(37, 99, 235, 0.4)" strokeWidth="1.5" />
                              <line x1="8" y1="20" x2="16" y2="20" stroke="rgba(37, 99, 235, 0.4)" strokeWidth="1.5" />
                              <rect x="1.5" y="7.5" width="13.5" height="7" rx="1.2" fill="#2563eb" stroke="none" />
                              <text x="8.25" y="11" fill="white" fontSize="5.2" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" stroke="none" textAnchor="middle" dominantBaseline="central">DOC</text>
                            </svg>
                          ) : (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-5-5z" fill="rgba(22, 163, 74, 0.05)" />
                              <path d="M14 2v5h5" />
                              <line x1="8" y1="15" x2="16" y2="15" stroke="rgba(22, 163, 74, 0.4)" strokeWidth="1.5" />
                              <line x1="8" y1="17.5" x2="16" y2="17.5" stroke="rgba(22, 163, 74, 0.4)" strokeWidth="1.5" />
                              <line x1="8" y1="20" x2="16" y2="20" stroke="rgba(22, 163, 74, 0.4)" strokeWidth="1.5" />
                              <rect x="1.5" y="7.5" width="13.5" height="7" rx="1.2" fill="#16a34a" stroke="none" />
                              <text x="8.25" y="11" fill="white" fontSize="5.2" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" stroke="none" textAnchor="middle" dominantBaseline="central">XLS</text>
                            </svg>
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-5-5z" fill="rgba(100, 116, 139, 0.05)" />
                              <path d="M14 2v5h5" />
                              <line x1="8" y1="15" x2="16" y2="15" stroke="rgba(100, 116, 139, 0.4)" strokeWidth="1.5" />
                              <line x1="8" y1="17.5" x2="16" y2="17.5" stroke="rgba(100, 116, 139, 0.4)" strokeWidth="1.5" />
                              <line x1="8" y1="20" x2="16" y2="20" stroke="rgba(100, 116, 139, 0.4)" strokeWidth="1.5" />
                              <rect x="1.5" y="7.5" width="13.5" height="7" rx="1.2" fill="#64748b" stroke="none" />
                              <text x="8.25" y="11" fill="white" fontSize="4.5" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" stroke="none" textAnchor="middle" dominantBaseline="central">FILE</text>
                            </svg>
                          )}
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

                <div 
                  className={`sidebar-dropzone financial-dropzone ${isDragActiveFinancial ? 'drag-active' : ''} ${isAnyApiActive ? 'disabled-dropzone' : ''}`}
                  onDragEnter={(e) => { if (isAnyApiActive || !canEdit) return; handleDragFinancial(e); }}
                  onDragOver={(e) => { if (isAnyApiActive || !canEdit) return; handleDragFinancial(e); }}
                  onDragLeave={(e) => { if (isAnyApiActive || !canEdit) return; handleDragFinancial(e); }}
                  onDrop={(e) => { if (isAnyApiActive || !canEdit) return; handleDropFinancial(e); }}
                  onClick={() => { if (isAnyApiActive || !canEdit) return; triggerFinancialFileInput(); }}
                  style={{
                    cursor: (isAnyApiActive || !canEdit) ? 'not-allowed' : 'pointer',
                    opacity: (isAnyApiActive || !canEdit) ? 0.6 : 1,
                    marginTop: '12px'
                  }}
                >
                  <div className="sidebar-dropzone-icon" style={{ color: '#16a34a', background: '#dcfce7' }}>
                    <Upload size={20} />
                  </div>
                  <p className="sidebar-dropzone-text">
                    Drag & drop Excel/CSV or click to browse
                  </p>
                  <input 
                    type="file" 
                    multiple 
                    ref={financialFileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFinancialFileInputChange}
                    accept=".xlsx,.xls,.csv"
                    disabled={isAnyApiActive || !canEdit}
                  />
                </div>

                {financialFiles.length > 0 && (
                  <div className="sidebar-file-list">
                    <div className="sidebar-list-header">Active Ledger Spreadsheet</div>
                    {financialFiles.map(file => (
                      <div key={file.id} className="sidebar-file-item financial-item">
                        <div className="sidebar-file-info">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-5-5z" fill="rgba(22, 163, 74, 0.05)" />
                            <path d="M14 2v5h5" />
                            <line x1="8" y1="15" x2="16" y2="15" stroke="rgba(22, 163, 74, 0.4)" strokeWidth="1.5" />
                            <line x1="8" y1="17.5" x2="16" y2="17.5" stroke="rgba(22, 163, 74, 0.4)" strokeWidth="1.5" />
                            <line x1="8" y1="20" x2="16" y2="20" stroke="rgba(22, 163, 74, 0.4)" strokeWidth="1.5" />
                            <rect x="1.5" y="7.5" width="13.5" height="7" rx="1.2" fill="#16a34a" stroke="none" />
                            <text x="8.25" y="11" fill="white" fontSize="5.2" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" stroke="none" textAnchor="middle" dominantBaseline="central">XLS</text>
                          </svg>
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
                  onClick={handleAnalyzeFinancial}
                  disabled={isAnyApiActive || !canEdit || financialFiles.length === 0}
                  className="btn-analyze-docs financial-analyze-btn"
                  style={{ marginTop: '12px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  {isAnalyzingFinancial ? (
                    <>
                      <Loader size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                      <span>Analyzing Spreadsheet...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Upload Financial Document</span>
                    </>
                  )}
                </button>
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
              {docIntelSession && docIntelSession.financialMetrics && (
                <button
                  className={`phase-tab-btn ${activePhaseTab === 'financial' ? 'active' : ''}`}
                  disabled={isAnyApiActive}
                  onClick={() => { if (isAnyApiActive) return; setActivePhaseTab('financial'); setExpandAll(false); }}
                >
                  <span className="phase-tab-title">Financial Data</span>
                  <span className="phase-tab-badge">
                    {Object.keys(docIntelSession.financialMetrics).filter(k => k !== "meta").reduce((acc, cat) => acc + Object.keys(docIntelSession.financialMetrics[cat]).length, 0)}
                  </span>
                </button>
              )}
            </div>
            <div className="sqc-meta-bar">
              {activePhaseTab === 'financial' ? (
                <span className="sqc-meta-count">
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>
                    {Object.keys(docIntelSession?.financialMetrics || {}).filter(k => k !== "meta").reduce((acc, cat) => acc + Object.keys(docIntelSession.financialMetrics[cat]).length, 0)}
                  </span>
                  /19 metrics extracted
                </span>
              ) : (
                <span className="sqc-meta-count">
                  <span style={{ color: '#4f46e5', fontWeight: 700 }}>
                    {currentTabFields.filter(f => cleanValue(f.value).trim() !== '').length}
                  </span>
                  /{currentTabFields.length} answered
                </span>
              )}
              {activePhaseTab !== 'financial' && (
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
              )}
            </div>
          </div>

          <div className="phase-tab-content-list">
            {activePhaseTab === 'financial' ? (
              docIntelSession && docIntelSession.financialMetrics ? (
                <div className="doc-intel-ledger" style={{ marginTop: '0', border: 'none', boxShadow: 'none', background: 'transparent', padding: '24px' }}>
                  <div className="ledger-category-header" style={{ marginBottom: '15px', color: '#16a34a', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
                    <Database size={16} />
                    <span>Extracted Ledger Workspace</span>
                  </div>

                  <div className="ledger-meta-grid">
                    <div className="meta-pill">
                      <span className="meta-pill-lbl">CURRENCY</span>
                      <span className="meta-pill-val">{docIntelSession.financialMetrics.meta?.document_currency || "USD"}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-pill-lbl">REPORT PERIOD</span>
                      <span className="meta-pill-val">{docIntelSession.financialMetrics.meta?.reporting_period || "FY2024"}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-pill-lbl">CONFIDENCE</span>
                      <span className="meta-pill-val confidence-high" style={{ textTransform: 'uppercase' }}>
                        <CheckCircle size={12} />
                        {docIntelSession.financialMetrics.meta?.extraction_confidence || "HIGH"}
                      </span>
                    </div>
                  </div>

                  {/* Expandable LEDGER CATEGORIES */}
                  {Object.entries({
                    "financial_performance": { icon: "📈", label: "Financial Performance" },
                    "financial_health": { icon: "🏦", label: "Financial Health" },
                    "operational_efficiency": { icon: "⚙️", label: "Operational Efficiency" },
                    "cost_efficiency": { icon: "💰", label: "Cost & CAPEX Efficiency" }
                  }).map(([catKey, catInfo]) => {
                    const metricsMap = docIntelSession.financialMetrics[catKey] || {};
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
                            const displayValue = mData?.value !== null && mData?.value !== undefined 
                              ? (catKey === "operational_efficiency" || metricKey === "revenue_growth_yoy" 
                                  ? `${(mData.value * 100).toFixed(1)}%` 
                                  : (mData.currency || "USD") === "USD" 
                                    ? `$${mData.value.toLocaleString()}` 
                                    : `${mData.value.toLocaleString()} ${mData.currency || ""}`)
                              : "N/A";

                            return (
                              <div key={metricKey} className="ledger-metric-card">
                                <div className="ledger-metric-info">
                                  <span className="ledger-metric-name">{metricKey.replace(/_/g, ' ')}</span>
                                  <div className="ledger-metric-subtext">
                                    {mData?.source_page && (
                                      <span 
                                        className="ledger-metric-citation"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenReference({
                                            title: `FINANCIAL INDICATOR: ${metricKey.replace(/_/g, ' ').toUpperCase()}`,
                                            doc: docIntelSession.uploadedDocuments?.[0]?.original_name || "financial_statement.xlsx",
                                            excerpt: mData.excerpt || "Disclosed financial metric in balance sheet worksheets.",
                                            cell: `Page ${mData.source_page}`,
                                            page: mData.source_page
                                          });
                                        }}
                                      >
                                        Ref: Page {mData.source_page}
                                      </span>
                                    )}
                                    <span>Conf: {mData?.confidence || "High"}</span>
                                  </div>
                                </div>

                                <div className="ledger-metric-action-area">
                                  {isEditing ? (
                                    <input 
                                      type="text"
                                      className="ledger-metric-edit-input"
                                      value={editMetricValue}
                                      onChange={(e) => setEditMetricValue(e.target.value)}
                                      onBlur={() => {
                                        handleUpdateMetric(catKey, metricKey, editMetricValue);
                                        setEditingMetric(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleUpdateMetric(catKey, metricKey, editMetricValue);
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
                                        setEditingMetric({ category: catKey, key: metricKey });
                                        setEditMetricValue(mData?.value !== null ? String(mData.value) : '');
                                      }}
                                    >
                                      {displayValue}
                                    </span>
                                  )}

                                  <button 
                                    className="ledger-metric-edit-btn"
                                    onClick={() => {
                                      if (isEditing) {
                                        handleUpdateMetric(catKey, metricKey, editMetricValue);
                                        setEditingMetric(null);
                                      } else {
                                        setEditingMetric({ category: catKey, key: metricKey });
                                        setEditMetricValue(mData?.value !== null ? String(mData.value) : '');
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

                  {/* Sync ledger button */}
                  <div className="sync-ledger-footer">
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      HITL verification active. Sync to update core products.
                    </span>
                    <button 
                      className="btn-sync-ledger"
                      onClick={handleSyncFinancial}
                    >
                      <RefreshCw size={14} />
                      <span>Accept & Sync to Core Product</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-phase-questions">
                  No financial data available.
                </div>
              )
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
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#4f46e5', background: '#e0e7ff', padding: '1px 6px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                                Page {ev.page || 1}
                              </span>
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
