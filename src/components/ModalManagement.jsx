import React, { useEffect, useState } from 'react';
import { Card, Col, Form, Row, Badge, Button, Spinner } from 'react-bootstrap';
import {
  Settings2,
  Sparkles,
  Save,
  CheckCircle,
  HelpCircle,
  FileSearch,
  PieChart,
  Layers,
  RotateCcw,
  RefreshCcw,
  Landmark,
  Compass,
  Award,
  Activity,
  Percent,
  ArrowUpRight,
  Zap,
  Globe,
  Gauge
} from 'lucide-react';
import { useModelSettingsStore } from '../store';

const LLM_MODEL_OPTIONS = [
  { label: 'Claude Sonnet 4.6', value: 'claude-sonnet-4-6' },
  { label: 'Gemini 3.1 Pro', value: 'gemini-3.1-pro' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
  { label: 'GPT-OSS-120B', value: 'gpt-oss-120b' },
];

const DEFAULTS = {
  pmfFlow: 'gpt-4o-mini',
  enrichment: 'gpt-4o-mini',
  documentQa: 'gpt-oss-120b',
  simpleSwot: 'gpt-oss-120b',
  purchaseCriteria: 'gpt-4o',
  loyaltyNps: 'gpt-4o',
  expandedCapability: 'gpt-4o',
  strategicRadar: 'gpt-4o',
  maturityScoring: 'gpt-4o',
  competitiveAdvantage: 'gpt-4o',
  strategicPositioning: 'gpt-oss-120b',
  productivityMetrics: 'gpt-oss-120b',
  coreAdjacency: 'gpt-oss-120b',
};

const SYSTEM_FLOWS = [
  {
    key: 'pmfFlow',
    title: 'PMF Flow',
    description: 'Powers the core Product-Market Fit onboarding and diagnostic generation.',
    icon: Sparkles,
  },
  {
    key: 'enrichment',
    title: 'Answer Enrichment',
    description: 'Enriches and refines questions, business briefs, and user inputs.',
    icon: Zap,
  },
  {
    key: 'documentQa',
    title: 'Document Analysis',
    description: 'Powers search, comprehension, and Q&A over uploaded files.',
    icon: FileSearch,
  },
];

const FRAMEWORK_FLOWS = [
  {
    key: 'simpleSwot',
    title: 'Simple SWOT Portfolio',
    description: 'Conducts Strengths, Weaknesses, Opportunities, and Threats mapping.',
    icon: Layers,
  },
  {
    key: 'purchaseCriteria',
    title: 'Purchase Criteria Matrix',
    description: 'Analyzes user-buying motivators and customer decision metrics.',
    icon: Percent,
  },
  {
    key: 'loyaltyNps',
    title: 'Loyalty & NPS Estimator',
    description: 'Predicts retention curves and net promoter configurations.',
    icon: Gauge,
  },
  {
    key: 'expandedCapability',
    title: 'Expanded Capability Heatmap',
    description: 'Identifies operational capabilities and skill expansions.',
    icon: ArrowUpRight,
  },
  {
    key: 'strategicRadar',
    title: 'Strategic Radar',
    description: 'Plots competitive positions and business opportunities.',
    icon: Compass,
  },
  {
    key: 'maturityScoring',
    title: 'Maturity Scoring Index',
    description: 'Benchmarks organizational status against industry standards.',
    icon: Landmark,
  },
  {
    key: 'competitiveAdvantage',
    title: 'Competitive Advantage',
    description: 'Highlights barriers to entry and unique selling propositions.',
    icon: Award,
  },
  {
    key: 'strategicPositioning',
    title: 'Strategic Positioning Radar',
    description: 'Visualizes product pricing, value, and quadrant placements.',
    icon: PieChart,
  },
  {
    key: 'productivityMetrics',
    title: 'Productivity Metrics',
    description: 'Estimates delivery benchmarks, performance, and efficiency.',
    icon: Activity,
  },
  {
    key: 'coreAdjacency',
    title: 'Core Adjacency Matrix',
    description: 'Explores horizontal expansion vectors and market adjacencies.',
    icon: Globe,
  },
];

const ModalManagement = ({ onToast }) => {
  const {
    loadSettings,
    saveSettings,
    pmfFlow,
    enrichment,
    documentQa,
    simpleSwot,
    purchaseCriteria,
    loyaltyNps,
    expandedCapability,
    strategicRadar,
    maturityScoring,
    competitiveAdvantage,
    strategicPositioning,
    productivityMetrics,
    coreAdjacency,
    loading
  } = useModelSettingsStore();

  const [selections, setSelections] = useState({
    pmfFlow: pmfFlow || DEFAULTS.pmfFlow,
    enrichment: enrichment || DEFAULTS.enrichment,
    documentQa: documentQa || DEFAULTS.documentQa,
    simpleSwot: simpleSwot || DEFAULTS.simpleSwot,
    purchaseCriteria: purchaseCriteria || DEFAULTS.purchaseCriteria,
    loyaltyNps: loyaltyNps || DEFAULTS.loyaltyNps,
    expandedCapability: expandedCapability || DEFAULTS.expandedCapability,
    strategicRadar: strategicRadar || DEFAULTS.strategicRadar,
    maturityScoring: maturityScoring || DEFAULTS.maturityScoring,
    competitiveAdvantage: competitiveAdvantage || DEFAULTS.competitiveAdvantage,
    strategicPositioning: strategicPositioning || DEFAULTS.strategicPositioning,
    productivityMetrics: productivityMetrics || DEFAULTS.productivityMetrics,
    coreAdjacency: coreAdjacency || DEFAULTS.coreAdjacency,
  });

  const [bulkModel, setBulkModel] = useState('gpt-4o-mini');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load from DB on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Sync local state when store updates (e.g. after load)
  useEffect(() => {
    setSelections({
      pmfFlow: pmfFlow || DEFAULTS.pmfFlow,
      enrichment: enrichment || DEFAULTS.enrichment,
      documentQa: documentQa || DEFAULTS.documentQa,
      simpleSwot: simpleSwot || DEFAULTS.simpleSwot,
      purchaseCriteria: purchaseCriteria || DEFAULTS.purchaseCriteria,
      loyaltyNps: loyaltyNps || DEFAULTS.loyaltyNps,
      expandedCapability: expandedCapability || DEFAULTS.expandedCapability,
      strategicRadar: strategicRadar || DEFAULTS.strategicRadar,
      maturityScoring: maturityScoring || DEFAULTS.maturityScoring,
      competitiveAdvantage: competitiveAdvantage || DEFAULTS.competitiveAdvantage,
      strategicPositioning: strategicPositioning || DEFAULTS.strategicPositioning,
      productivityMetrics: productivityMetrics || DEFAULTS.productivityMetrics,
      coreAdjacency: coreAdjacency || DEFAULTS.coreAdjacency,
    });
  }, [
    pmfFlow,
    enrichment,
    documentQa,
    simpleSwot,
    purchaseCriteria,
    loyaltyNps,
    expandedCapability,
    strategicRadar,
    maturityScoring,
    competitiveAdvantage,
    strategicPositioning,
    productivityMetrics,
    coreAdjacency,
  ]);

  const handleChange = (key, value) => {
    setSelections((current) => ({ ...current, [key]: value }));
    setIsSaved(false);
  };

  const handleApplyBulk = () => {
    const updated = {};
    Object.keys(DEFAULTS).forEach((key) => {
      updated[key] = bulkModel;
    });
    setSelections(updated);
    setIsSaved(false);
    if (onToast) onToast(`Applied ${getLabelFor(bulkModel)} to all features locally. Click Save to persist.`, 'info');
  };

  const handleResetAll = () => {
    setSelections({ ...DEFAULTS });
    setIsSaved(false);
    if (onToast) onToast('All configurations reset to system defaults locally. Click Save to persist.', 'info');
  };

  const handleResetItem = (key) => {
    setSelections((current) => ({ ...current, [key]: DEFAULTS[key] }));
    setIsSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings(selections);
      setIsSaved(true);
      if (onToast) onToast('LLM model settings saved successfully', 'success');
    } catch (err) {
      if (onToast) onToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getLabelFor = (value) =>
    LLM_MODEL_OPTIONS.find((o) => o.value === value)?.label ?? value;

  const isbusy = isSaving || loading;

  // Statistics calculation
  const totalFeatures = Object.keys(DEFAULTS).length;
  const customizedCount = Object.keys(DEFAULTS).reduce(
    (count, key) => count + (selections[key] !== DEFAULTS[key] ? 1 : 0),
    0
  );
  const defaultCount = totalFeatures - customizedCount;

  const renderRow = (item, type) => {
    const { key, title, description, icon: Icon } = item;
    const isCustomized = selections[key] !== DEFAULTS[key];

    return (
      <div key={key} className="model-settings-row">
        <div className="d-flex align-items-center gap-3 flex-grow-1 me-3">
          <div className={`model-icon-container ${type}`}>
            <Icon size={18} />
          </div>
          <div>
            <div className="model-title-text">{title}</div>
            <div className="model-desc-text">{description}</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <Badge
            className={`status-badge-custom ${
              isCustomized ? 'modified' : 'default'
            }`}
          >
            {isCustomized ? 'Customized' : 'Default'}
          </Badge>

          <Form.Select
            className="compact-select"
            value={selections[key] || DEFAULTS[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            disabled={isbusy}
          >
            {LLM_MODEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>

          {isCustomized && (
            <button
              className="model-reset-btn"
              onClick={() => handleResetItem(key)}
              title={`Reset to default: ${getLabelFor(DEFAULTS[key])}`}
              disabled={isbusy}
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-management-shell">
      {/* Header section */}
      <div className="modal-management-header align-items-center">
        <div className="modal-management-title">
          <Badge bg="primary" className="modal-management-badge">
            <Settings2 size={14} />
            LLM Model Settings
          </Badge>
          <h2>Choose the model used in each flow</h2>
          <p>
            Configure which LLM model powers onboarding flows, Q&A, and each individual
            framework analysis. Settings are saved to the database and applied to all future generations.
          </p>
        </div>

        <div className="modal-management-actions">
          <Button
            variant="primary"
            className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-3 fw-semibold shadow-sm"
            onClick={handleSave}
            disabled={isbusy}
          >
            {isSaving ? <Spinner size="sm" /> : <Save size={16} />}
            Save settings
          </Button>
        </div>
      </div>

      {loading && !isSaving && (
        <div className="d-flex align-items-center gap-2 text-muted small mb-3">
          <Spinner size="sm" />
          Loading saved settings…
        </div>
      )}

      {/* Bulk Actions Panel */}
      <Card className="bulk-actions-card mb-4 border-0">
        <Card.Body className="p-4">
          <Row className="align-items-center g-4">
            <Col lg={6} md={12}>
              <h5 className="mb-2 d-flex align-items-center gap-2 text-primary fw-semibold">
                <RefreshCcw size={16} className="text-primary" />
                Bulk Actions & Overview
              </h5>
              <p className="text-muted small mb-3">
                Change configurations for all 13 features at once to speed up testing or reset all back to system defaults.
              </p>
              
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="stat-badge-pill bg-light text-secondary border">
                  Total Features: <strong className="text-dark">{totalFeatures}</strong>
                </span>
                <span className="stat-badge-pill bg-light text-secondary border">
                  Customized: <strong className="text-warning">{customizedCount}</strong>
                </span>
                <span className="stat-badge-pill bg-light text-secondary border">
                  Using Defaults: <strong className="text-success">{defaultCount}</strong>
                </span>
              </div>
            </Col>

            <Col lg={6} md={12} className="d-flex flex-column align-items-md-end justify-content-center">
              <div className="d-flex align-items-center justify-content-md-end gap-2 flex-wrap w-100">
                <Form.Select
                  className="compact-select w-auto"
                  value={bulkModel}
                  onChange={(e) => setBulkModel(e.target.value)}
                  disabled={isbusy}
                  style={{ minWidth: '180px', height: '38px' }}
                >
                  {LLM_MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>

                <Button
                  variant="info"
                  className="text-white d-inline-flex align-items-center justify-content-center px-3 rounded-2 fw-semibold"
                  onClick={handleApplyBulk}
                  disabled={isbusy}
                  style={{ height: '38px' }}
                >
                  Apply to All
                </Button>

                <Button
                  variant="outline-danger"
                  className="d-inline-flex align-items-center justify-content-center gap-1 px-3 rounded-2 fw-semibold"
                  onClick={handleResetAll}
                  disabled={isbusy}
                  style={{ height: '38px' }}
                >
                  <RotateCcw size={13} />
                  Reset All to Defaults
                </Button>
              </div>

            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Main Settings Grid */}
      <Row className="g-4">
        {/* Core System Flows */}
        <Col xl={5} lg={12}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h4 className="mb-0 text-primary d-flex align-items-center gap-2 fw-semibold fs-5">
              <Layers size={18} /> Core System Services
            </h4>
          </div>

          <Card className="model-settings-group-card border-0">
            <div className="model-settings-list">
              {SYSTEM_FLOWS.map((item) => renderRow(item, 'core'))}
            </div>
          </Card>
        </Col>

        {/* Framework Analyses */}
        <Col xl={7} lg={12}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h4 className="mb-0 text-primary d-flex align-items-center gap-2 fw-semibold fs-5">
              <PieChart size={18} /> Framework Analyses (Strategy & Insights)
            </h4>
          </div>

          <Card className="model-settings-group-card border-0">
            <div className="model-settings-list">
              {FRAMEWORK_FLOWS.map((item) => renderRow(item, 'framework'))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Footer Changes Badge */}
      <div className="mt-4 d-flex align-items-center gap-2 flex-wrap">
        {isSaved ? (
          <Badge bg="success" className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-2 fw-semibold shadow-sm">
            <CheckCircle size={14} /> Saved and applied to database
          </Badge>
        ) : (
          <Badge bg="secondary" className="px-3 py-2 rounded-2 fw-semibold">
            Unsaved changes present
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ModalManagement;