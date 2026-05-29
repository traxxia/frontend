import React, { useEffect, useState } from 'react';
import { Card, Col, Form, Row, Badge, Button, Spinner } from 'react-bootstrap';
import { Settings2, Sparkles, Save, CheckCircle, HelpCircle, FileSearch, PieChart, Layers } from 'lucide-react';
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

  const renderDropdownCard = (title, key, description, Icon) => (
    <Col lg={6} md={12} className="mb-4">
      <Card className="border-0 shadow-sm h-100 rounded-4">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <div className="text-uppercase text-muted fw-semibold small mb-1">
                {title}
              </div>
              <h5 className="mb-0">{description}</h5>
            </div>
            {Icon && <Icon size={18} className="text-primary" />}
          </div>

          <Form.Group>
            <Form.Label className="fw-semibold">LLM model</Form.Label>
            <Form.Select
              id={`${key}-model-select`}
              value={selections[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              disabled={isbusy}
            >
              {LLM_MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <div className="mt-3 text-muted small">
            Current:{' '}
            <span className="fw-semibold text-dark">
              {getLabelFor(selections[key])}
            </span>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <div className="modal-management-shell">
      <div className="modal-management-header">
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
            className="d-inline-flex align-items-center gap-2"
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

      {/* Group 1: Core System Flows */}
      <div className="mt-4">
        <h4 className="mb-3 text-primary d-flex align-items-center gap-2">
          <Layers size={18} /> Core System Flows
        </h4>
        <Row className="g-4">
          {renderDropdownCard('PMF Flow', 'pmfFlow', 'Select the PMF Flow model', Sparkles)}
          {renderDropdownCard('Answer Enrichment', 'enrichment', 'Select the Answer Enrichment model', HelpCircle)}
          {renderDropdownCard('Document Analysis', 'documentQa', 'Select the Document QA model', FileSearch)}
        </Row>
      </div>

      {/* Group 2: Framework Analyses */}
      <div className="mt-5">
        <h4 className="mb-3 text-primary d-flex align-items-center gap-2">
          <PieChart size={18} /> Framework Analyses (Insights & Strategy)
        </h4>
        <Row className="g-4">
          {renderDropdownCard('Simple SWOT Portfolio', 'simpleSwot', 'Select Simple SWOT Portfolio model', PieChart)}
          {renderDropdownCard('Purchase Criteria', 'purchaseCriteria', 'Select Purchase Criteria model', PieChart)}
          {renderDropdownCard('Loyalty & NPS', 'loyaltyNps', 'Select Loyalty & NPS model', PieChart)}
          {renderDropdownCard('Expanded Capability Heatmap', 'expandedCapability', 'Select Expanded Capability Heatmap model', PieChart)}
          {renderDropdownCard('Strategic Radar', 'strategicRadar', 'Select Strategic Radar model', PieChart)}
          {renderDropdownCard('Maturity Scoring', 'maturityScoring', 'Select Maturity Scoring model', PieChart)}
          {renderDropdownCard('Competitive Advantage', 'competitiveAdvantage', 'Select Competitive Advantage model', PieChart)}
          {renderDropdownCard('Strategic Positioning Radar', 'strategicPositioning', 'Select Strategic Positioning Radar model', PieChart)}
          {renderDropdownCard('Productivity Metrics', 'productivityMetrics', 'Select Productivity Metrics model', PieChart)}
          {renderDropdownCard('Core Adjacency Matrix', 'coreAdjacency', 'Select Core Adjacency Matrix model', PieChart)}
        </Row>
      </div>

      <div className="mt-4 d-flex align-items-center gap-2 flex-wrap">
        {isSaved ? (
          <Badge bg="success" className="d-inline-flex align-items-center gap-1">
            <CheckCircle size={12} /> Saved to database
          </Badge>
        ) : (
          <Badge bg="secondary">Unsaved changes</Badge>
        )}
      </div>
    </div>
  );
};

export default ModalManagement;