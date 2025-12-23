import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";
import {
  Loader,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Users,
  Shield,
  Zap,
  Settings,
  BarChart3,
  Activity,
  Star,
  ArrowRight,
  Calendar,
  Database,
  Lightbulb,
  Heart,
  DollarSign,
  Link2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import { StreamingRow } from './StreamingManager';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';
import KickstartProjectsCard from "../components/KickstartProjectsCard";
import '../styles/StrategicAnalysis.css';

const StrategicAnalysis = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  strategicData = null,
  phaseManager,
  saveAnalysisToBackend,
  selectedBusinessId,
  hideDownload = false,
  hideImproveButton,
  showImproveButton = true,
  onRedirectToBrief,
  phaseAnalysisArray = [],
  streamingManager,
  onKickstartProjects,
  hasProjectsTab = false,
  onToastMessage,
}) => {
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const isSuperAdmin = userRole === "super_admin";
  const isCompanyAdmin = userRole === "company_admin";
  const canShowKickstart = isSuperAdmin || isCompanyAdmin;
  const { t } = useTranslation();
  const cardId = 'strategic-analysis';
  const isExpanded = true;

  const [localStrategicData, setLocalStrategicData] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [kickstartError, setKickstartError] = useState('');
  const [isFreshGeneration, setIsFreshGeneration] = useState(false);
  const [hasKickstarted, setHasKickstarted] = useState(false);
  const handleKickstart = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const userId = sessionStorage.getItem("userId");

      setKickstartError('');

      if (!token || !selectedBusinessId || !userId || !localStrategicData) {
        const msg = 'Unable to kickstart projects. Please make sure a business is selected and strategic analysis is available.';
        setKickstartError(msg);
        if (onToastMessage) {
          onToastMessage(msg, 'error');
        }
        return;
      }

      if (token && selectedBusinessId && userId && localStrategicData) {
        const analysisData = localStrategicData.strategic_analysis || localStrategicData;
        const recommendations = analysisData?.strategic_recommendations;

        const pestelAnalysis = phaseAnalysisArray.find(a => a.analysis_type === 'pestel');
        const portersAnalysis = phaseAnalysisArray.find(a => a.analysis_type === 'porters');

        const pestelRec = pestelAnalysis?.analysis_data?.pestel_analysis?.strategic_recommendations;
        const portersRec = portersAnalysis?.analysis_data?.porter_analysis?.strategic_recommendations;

        const immediateActions = [
          ...(pestelRec?.immediate_actions || []),
          ...(portersRec?.immediate_actions || [])
        ];

        const shortTermInitiatives = [
          ...(pestelRec?.short_term_initiatives || []),
          ...(portersRec?.short_term_initiatives || [])
        ];

        const longTermShifts = [
          ...(pestelRec?.long_term_strategic_shifts || []),
          ...(portersRec?.long_term_strategic_shifts || [])
        ];

        const itemsToCreate = [];

        immediateActions.forEach(action => {
          if (!action || action === 'N/A') return;
          itemsToCreate.push({
            project_name: action.action,
            description: action.rationale,
            expected_outcome: action.expected_impact || '',
            estimated_timeline: action.timeline || '',
            success_metrics: action.success_metrics || action.metrics || [],
            project_type: 'immediate_action'
          });
        });

        shortTermInitiatives.forEach(initiative => {
          if (!initiative || initiative === 'N/A') return;
          itemsToCreate.push({
            project_name: initiative.initiative,
            description: initiative.expected_outcome || '',
            expected_outcome: initiative.expected_outcome || '',
            estimated_timeline: '',
            project_type: 'short_term_initiative'
          });
        });

        longTermShifts.forEach(shift => {
          if (!shift || shift === 'N/A') return;
          itemsToCreate.push({
            project_name: shift.shift,
            description: shift.transformation_required || '',
            expected_outcome: shift.competitive_advantage || '',
            estimated_timeline: '',
            project_type: 'long_term_shift'
          });
        });

        if (itemsToCreate.length === 0) {
          const msg = 'No recommended projects are available to create from the strategic analysis.';
          setKickstartError(msg);
          if (onToastMessage) {
            onToastMessage(msg, 'warning');
          }
          return;
        }

        for (const item of itemsToCreate) {
          const payload = {
            business_id: selectedBusinessId,
            user_id: userId,
            collaborators: [],
            status: "draft",
            project_name: item.project_name,
            description: '',
            project_type: item.project_type,
            why_this_matters: '',
            impact: '',
            effort: '',
            risk: '',
            strategic_theme: '',
            dependencies: '',
            high_level_requirements: '',
            scope_definition: '',
            expected_outcome: item.expected_outcome,
            success_metrics:  item.success_metrics || item.metrics,
            estimated_timeline: item.estimated_timeline,
            budget_estimate: '',
          };

          try {
            await axios.post(
              `${process.env.REACT_APP_BACKEND_URL}/api/projects`,
              payload,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
                }
              }
            );
          } catch (postErr) {
            console.error("Kickstart project creation failed", postErr);
          }
        }
      }
    } catch (e) {
      console.error("Kickstart processing failed", e);
      const msg = 'Something went wrong while kickstarting projects. Please try again.';
      setKickstartError(msg);
      if (onToastMessage) {
        onToastMessage(msg, 'error');
      }
      return;
    }

    if (onKickstartProjects) {
      try {
        onKickstartProjects();
      } catch (e) {
        console.warn('Kickstart handler error:', e);
      }
    }
    try {
      phaseManager?.openTab?.('projects');
      phaseManager?.goToTab?.('projects');
      phaseManager?.setActiveTab?.('projects');
    } catch (e) {
    }
    setHasKickstarted(true);
    try {
      sessionStorage.setItem('showProjectsTab', 'true');
      sessionStorage.setItem('activeTab', 'projects');
    } catch {}
  };
  useEffect(() => {
    try {
      const active = sessionStorage.getItem('activeTab');
      if (active === 'projects' && hasProjectsTab && !hasKickstarted) {
        setHasKickstarted(true);
      }
    } catch {}
  }, [hasKickstarted, hasProjectsTab]);

  useEffect(() => {
    if (!hasProjectsTab && hasKickstarted) {
      setHasKickstarted(false);
    }
  }, [hasProjectsTab, hasKickstarted]);

  const [collapsedCategories, setCollapsedCategories] = useState(
    new Set(['strategy-block', 'execution-block', 'sustainability-block'])
  );

  const [visibleRows, setVisibleRows] = useState(0);
  const [typingTexts, setTypingTexts] = useState({});
  const streamingIntervalRef = useRef(null);
  const hasStartedStreaming = useRef(false);

  const { lastRowRef, userHasScrolled, setUserHasScrolled } = useAutoScroll(
    streamingManager,
    cardId,
    false,
    visibleRows
  );

  const hasInitialized = useRef(false);

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.strategic;

    await checkMissingQuestionsAndRedirect(
      'strategic',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig?.displayName || 'Strategic Analysis',
        customMessage: analysisConfig?.customMessage || 'Complete essential phase questions to unlock strategic analysis.'
      }
    );
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      try {
        // Reset streaming states
        if (streamingManager) {
          streamingManager.resetCard(cardId);
          hasStartedStreaming.current = false;
        }

        setCollapsedCategories(new Set(['strategy-block', 'execution-block', 'sustainability-block']));
        setLocalStrategicData(null);
        setIsLoading(true);

        await new Promise(resolve => setTimeout(resolve, 50));

        await onRegenerate();
      } catch (error) {
        console.error('❌ ERROR in regeneration:', error);
        setErrorMessage(error.message || 'Failed to regenerate strategic analysis');
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrorMessage('Regeneration not available');
    }
  };

  const toggleCategory = (categoryId) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const isStrategicDataIncomplete = (data) => {
    if (!data) return true;
    const analysisData = data.strategic_analysis || data;
    if (!analysisData) return true;

    const recommendations = analysisData.strategic_recommendations;
    if (!recommendations) return true;

    const hasStrategyBlock = recommendations.strategy_block &&
      (recommendations.strategy_block.S_strategy ||
        recommendations.strategy_block.T_tactics ||
        recommendations.strategy_block.R_resources);

    const hasExecutionBlock = recommendations.execution_block;
    const hasSustainabilityBlock = recommendations.sustainability_block;

    return !hasStrategyBlock && !hasExecutionBlock && !hasSustainabilityBlock;
  };

  const calculateTotalRows = (data) => {
    if (!data || isStrategicDataIncomplete(data)) {
      return 0;
    }

    const analysisData = data.strategic_analysis || data;
    const recommendations = analysisData?.strategic_recommendations;
    let total = 0;

    if (!recommendations) {
      return 0;
    }

    if (recommendations.strategy_block?.S_strategy?.where_to_compete) {
      total += recommendations.strategy_block.S_strategy.where_to_compete.length;
    }

    if (recommendations.strategy_block?.S_strategy?.how_to_compete) {
      total += recommendations.strategy_block.S_strategy.how_to_compete.length;
    }

    if (recommendations.strategy_block?.R_resources?.capital_priorities) {
      total += recommendations.strategy_block.R_resources.capital_priorities.length;
    }
    if (recommendations.strategy_block?.R_resources?.talent_priorities) {
      total += recommendations.strategy_block.R_resources.talent_priorities.length;
    }
    if (recommendations.strategy_block?.R_resources?.technology_investments) {
      total += recommendations.strategy_block.R_resources.technology_investments.length;
    }

    if (recommendations.execution_block?.A_analysis_data?.recommendations) {
      total += recommendations.execution_block.A_analysis_data.recommendations.length;
    }

    if (recommendations.execution_block?.T_technology_digitalization?.infrastructure_initiatives) {
      total += recommendations.execution_block.T_technology_digitalization.infrastructure_initiatives.length;
    }
    if (recommendations.execution_block?.T_technology_digitalization?.platform_priorities) {
      total += recommendations.execution_block.T_technology_digitalization.platform_priorities.length;
    }

    if (recommendations.execution_block?.E_execution?.implementation_roadmap) {
      total += recommendations.execution_block.E_execution.implementation_roadmap.length;
    }

    const kpi = recommendations.execution_block?.E_execution?.kpi_dashboard;
    if (kpi) {
      if (kpi.adoption_metrics) total += kpi.adoption_metrics.length;
      if (kpi.network_metrics) total += kpi.network_metrics.length;
      if (kpi.operational_metrics) total += kpi.operational_metrics.length;
      if (kpi.financial_metrics) total += kpi.financial_metrics.length;
    }

    if (recommendations.sustainability_block?.G_governance?.decision_delegation) {
      total += recommendations.sustainability_block.G_governance.decision_delegation.length;
    }
    if (recommendations.sustainability_block?.G_governance?.accountability_framework) {
      total += recommendations.sustainability_block.G_governance.accountability_framework.length;
    }

    if (recommendations.sustainability_block?.I_innovation?.priority_innovation_bets) {
      total += recommendations.sustainability_block.I_innovation.priority_innovation_bets.length;
    }

    if (recommendations.sustainability_block?.C_culture?.cultural_shifts) {
      total += recommendations.sustainability_block.C_culture.cultural_shifts.length;
    }
    if (recommendations.sustainability_block?.C_culture?.change_approach) {
      total += recommendations.sustainability_block.C_culture.change_approach.length;
    }

    if (analysisData.strategic_linkages?.objective_to_initiative_map) {
      total += analysisData.strategic_linkages.objective_to_initiative_map.length;
    }

    const pestelAnalysis = phaseAnalysisArray.find(a => a.analysis_type === 'pestel');
    const portersAnalysis = phaseAnalysisArray.find(a => a.analysis_type === 'porters');

    const pestelRec = pestelAnalysis?.analysis_data?.pestel_analysis?.strategic_recommendations;
    const portersRec = portersAnalysis?.analysis_data?.porter_analysis?.strategic_recommendations;

    if (pestelRec?.immediate_actions) total += pestelRec.immediate_actions.length;
    if (pestelRec?.short_term_initiatives) total += pestelRec.short_term_initiatives.length;
    if (pestelRec?.long_term_strategic_shifts) total += pestelRec.long_term_strategic_shifts.length;

    if (portersRec?.immediate_actions) total += portersRec.immediate_actions.length;
    if (portersRec?.short_term_initiatives) total += portersRec.short_term_initiatives.length;
    if (portersRec?.long_term_strategic_shifts) total += portersRec.long_term_strategic_shifts.length;
    return total;
  };
  useEffect(() => {
    if (!isFreshGeneration || !strategicData || isStrategicDataIncomplete(strategicData)) {
      return;
    }

    if (streamingManager && !hasStartedStreaming.current) {
      hasStartedStreaming.current = true;
      setCollapsedCategories(new Set([])); // Expand all

      if (!streamingManager.hasStreamed(cardId)) {
        setTimeout(() => {
          streamingManager.startStreaming(cardId);
        }, 100);
      }
    }
  }, [strategicData, streamingManager, cardId, isFreshGeneration]);


  useEffect(() => {
    const totalRows = calculateTotalRows(strategicData);

    if (totalRows === 0) {
      return;
    }

    if (!streamingManager?.shouldStream(cardId)) {
      setVisibleRows(totalRows);
    }
  }, [strategicData, cardId, streamingManager, phaseAnalysisArray]);

  useEffect(() => {
    if (!streamingManager?.shouldStream(cardId) || !isFreshGeneration) {
      return;
    }

    if (!strategicData || isRegenerating || isStrategicDataIncomplete(strategicData)) {
      return;
    }

    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }

    setVisibleRows(0);
    setTypingTexts({});

    const totalItems = calculateTotalRows(strategicData);
    let currentRow = 0;
    let scrollEnabled = false;

    streamingIntervalRef.current = setInterval(() => {
      if (currentRow < totalItems) {
        currentRow++;
        setVisibleRows(currentRow);

        if (currentRow === 5 && !scrollEnabled) {
          scrollEnabled = true;
          setUserHasScrolled(false);
        }
      } else {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
        if (streamingManager) {
          streamingManager.stopStreaming(cardId);
        }
        setIsFreshGeneration(false); // Reset flag after streaming
      }
    }, STREAMING_CONFIG.ROW_INTERVAL);

    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
    };
  }, [cardId, strategicData, isRegenerating, streamingManager, isFreshGeneration, setUserHasScrolled]);

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);


  useEffect(() => {
    if (strategicData) {
      setLocalStrategicData(strategicData);
      setHasGenerated(true);
      setErrorMessage('');
      setIsLoading(false);

      // Check if this is a fresh generation
      const isFresh = strategicData._isFreshGeneration === true;

      // Only expand on fresh generation
      if (isFresh && !isStrategicDataIncomplete(strategicData)) {
        setIsFreshGeneration(true); // SET THIS FIRST
        setCollapsedCategories(new Set([]));
      } else if (!hasInitialized.current) {
        // First load - keep collapsed
        hasInitialized.current = true;
        setIsFreshGeneration(false);
        setCollapsedCategories(new Set(['strategy-block', 'execution-block', 'sustainability-block']));
      }
    } else if (strategicData === null) {
      setLocalStrategicData(null);
      setHasGenerated(false);
    }
  }, [strategicData]);

  const getRowIndex = () => {
    const analysisData = localStrategicData?.strategic_analysis || localStrategicData;
    const recommendations = analysisData?.strategic_recommendations;
    let currentIndex = 0;
    const indices = {};

    if (!recommendations) return indices;

    // ===== STRATEGY BLOCK (S.T.R) - These render together =====

    // S - Strategy: Where to Compete
    if (recommendations.strategy_block?.S_strategy?.where_to_compete) {
      indices.whereToCompete = {};
      recommendations.strategy_block.S_strategy.where_to_compete.forEach((_, idx) => {
        indices.whereToCompete[idx] = currentIndex++;
      });
    }
    if (recommendations.strategy_block?.S_strategy?.how_to_compete) {
      indices.howToCompete = {};
      recommendations.strategy_block.S_strategy.how_to_compete.forEach((_, idx) => {
        indices.howToCompete[idx] = currentIndex++;
      });
    }

    // T - Tactics: Strategic Linkages (renders in Tactics pillar)
    if (analysisData.strategic_linkages?.objective_to_initiative_map) {
      indices.strategicLinkages = {};
      analysisData.strategic_linkages.objective_to_initiative_map.forEach((_, idx) => {
        indices.strategicLinkages[idx] = currentIndex++;
      });
    }

    // T - Tactics: Strategic Recommendations from Analyses (renders in Tactics pillar)
    const pestelAnalysis = phaseAnalysisArray.find(a => a.analysis_type === 'pestel');
    const portersAnalysis = phaseAnalysisArray.find(a => a.analysis_type === 'porters');

    const pestelRec = pestelAnalysis?.analysis_data?.pestel_analysis?.strategic_recommendations;
    const portersRec = portersAnalysis?.analysis_data?.porter_analysis?.strategic_recommendations;

    const combinedImmediateActions = [
      ...(pestelRec?.immediate_actions || []),
      ...(portersRec?.immediate_actions || [])
    ];

    const combinedShortTermInitiatives = [
      ...(pestelRec?.short_term_initiatives || []),
      ...(portersRec?.short_term_initiatives || [])
    ];

    const combinedLongTermShifts = [
      ...(pestelRec?.long_term_strategic_shifts || []),
      ...(portersRec?.long_term_strategic_shifts || [])
    ];

    if (combinedImmediateActions.length > 0) {
      indices.immediateActions = {};
      combinedImmediateActions.forEach((_, idx) => {
        indices.immediateActions[idx] = currentIndex++;
      });
    }

    if (combinedShortTermInitiatives.length > 0) {
      indices.shortTermInitiatives = {};
      combinedShortTermInitiatives.forEach((_, idx) => {
        indices.shortTermInitiatives[idx] = currentIndex++;
      });
    }

    if (combinedLongTermShifts.length > 0) {
      indices.longTermShifts = {};
      combinedLongTermShifts.forEach((_, idx) => {
        indices.longTermShifts[idx] = currentIndex++;
      });
    }

    // R - Resources Block
    if (recommendations.strategy_block?.R_resources) {
      if (recommendations.strategy_block.R_resources.capital_priorities) {
        indices.capitalPriorities = {};
        recommendations.strategy_block.R_resources.capital_priorities.forEach((_, idx) => {
          indices.capitalPriorities[idx] = currentIndex++;
        });
      }
      if (recommendations.strategy_block.R_resources.talent_priorities) {
        indices.talentPriorities = {};
        recommendations.strategy_block.R_resources.talent_priorities.forEach((_, idx) => {
          indices.talentPriorities[idx] = currentIndex++;
        });
      }
      if (recommendations.strategy_block.R_resources.technology_investments) {
        indices.technologyInvestments = {};
        recommendations.strategy_block.R_resources.technology_investments.forEach((_, idx) => {
          indices.technologyInvestments[idx] = currentIndex++;
        });
      }
    }

    // ===== EXECUTION BLOCK (A.T.E) - These render together =====

    // A - Analysis Data Block
    if (recommendations.execution_block?.A_analysis_data?.recommendations) {
      indices.analysisData = {};
      recommendations.execution_block.A_analysis_data.recommendations.forEach((_, idx) => {
        indices.analysisData[idx] = currentIndex++;
      });
    }

    // T - Technology Block
    if (recommendations.execution_block?.T_technology_digitalization) {
      if (recommendations.execution_block.T_technology_digitalization.infrastructure_initiatives) {
        indices.infrastructureInitiatives = {};
        recommendations.execution_block.T_technology_digitalization.infrastructure_initiatives.forEach((_, idx) => {
          indices.infrastructureInitiatives[idx] = currentIndex++;
        });
      }
      if (recommendations.execution_block.T_technology_digitalization.platform_priorities) {
        indices.platformPriorities = {};
        recommendations.execution_block.T_technology_digitalization.platform_priorities.forEach((_, idx) => {
          indices.platformPriorities[idx] = currentIndex++;
        });
      }
    }

    // E - Execution Block - Implementation Roadmap
    if (recommendations.execution_block?.E_execution?.implementation_roadmap) {
      indices.implementationRoadmap = {};
      recommendations.execution_block.E_execution.implementation_roadmap.forEach((_, idx) => {
        indices.implementationRoadmap[idx] = currentIndex++;
      });
    }

    // E - Execution Block - KPI Dashboard
    const kpi = recommendations.execution_block?.E_execution?.kpi_dashboard;
    if (kpi) {
      if (kpi.adoption_metrics) {
        indices.adoptionMetrics = {};
        kpi.adoption_metrics.forEach((_, idx) => {
          indices.adoptionMetrics[idx] = currentIndex++;
        });
      }
      if (kpi.network_metrics) {
        indices.networkMetrics = {};
        kpi.network_metrics.forEach((_, idx) => {
          indices.networkMetrics[idx] = currentIndex++;
        });
      }
      if (kpi.operational_metrics) {
        indices.operationalMetrics = {};
        kpi.operational_metrics.forEach((_, idx) => {
          indices.operationalMetrics[idx] = currentIndex++;
        });
      }
      if (kpi.financial_metrics) {
        indices.financialMetrics = {};
        kpi.financial_metrics.forEach((_, idx) => {
          indices.financialMetrics[idx] = currentIndex++;
        });
      }
    }
    if (recommendations.sustainability_block?.G_governance) {
      if (recommendations.sustainability_block.G_governance.decision_delegation) {
        indices.decisionDelegation = {};
        recommendations.sustainability_block.G_governance.decision_delegation.forEach((_, idx) => {
          indices.decisionDelegation[idx] = currentIndex++;
        });
      }
      if (recommendations.sustainability_block.G_governance.accountability_framework) {
        indices.accountabilityFramework = {};
        recommendations.sustainability_block.G_governance.accountability_framework.forEach((_, idx) => {
          indices.accountabilityFramework[idx] = currentIndex++;
        });
      }
    }

    // I - Innovation Block
    if (recommendations.sustainability_block?.I_innovation?.priority_innovation_bets) {
      indices.innovationBets = {};
      recommendations.sustainability_block.I_innovation.priority_innovation_bets.forEach((_, idx) => {
        indices.innovationBets[idx] = currentIndex++;
      });
    }

    // C - Culture Block
    if (recommendations.sustainability_block?.C_culture) {
      if (recommendations.sustainability_block.C_culture.cultural_shifts) {
        indices.culturalShifts = {};
        recommendations.sustainability_block.C_culture.cultural_shifts.forEach((_, idx) => {
          indices.culturalShifts[idx] = currentIndex++;
        });
      }
      if (recommendations.sustainability_block.C_culture.change_approach) {
        indices.changeApproach = {};
        recommendations.sustainability_block.C_culture.change_approach.forEach((_, idx) => {
          indices.changeApproach[idx] = currentIndex++;
        });
      }
    }
    return indices;
  };

  const rowIndices = getRowIndex();
  const isStreaming = streamingManager?.shouldStream(cardId);
  const hasStreamed = streamingManager?.hasStreamed(cardId);

  const CategorySection = ({ id, title, icon: IconComponent, children, description }) => {
    const isCollapsed = collapsedCategories.has(id);

    return (
      <div className="analysis-category">
        <div className="category-header" onClick={() => toggleCategory(id)}>
          <div className="category-header-left">
            <IconComponent size={24} className="category-icon" />
            <div>
              <h2 className="category-title">{title}</h2>
              {description && (
                <p style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  margin: '4px 0 0 0',
                  fontWeight: '500'
                }}>
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="category-toggle">
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </div>

        <div className={`category-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
          <div className="category-grid">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const DiagnosticBox = ({ diagnostic }) => {
    if (!diagnostic || diagnostic === 'N/A') return null;

    return (
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#f0f9ff',
        marginBottom: '5px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        <Info size={16} style={{ color: '#3b82f6', marginTop: '2px', flexShrink: 0 }} /> {t("diagnostic")}:
        <div style={{
          fontSize: '14px',
          fontStyle: 'italic',
          color: '#1e40af',
          lineHeight: '1.5'
        }}>
          {diagnostic}
        </div>
      </div>
    );
  };

  const renderStrategyPillar = (strategy) => {
    if (!strategy) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card strategy-card">
          <div className="pillar-header strategy-header">
            <Target size={22} className="strategy-icon" />
            <h3 className="pillar-title">
              S – Strategy: Where to Compete & How to Compete
            </h3>
          </div>

          <DiagnosticBox diagnostic={strategy.diagnostic} />

          {strategy.where_to_compete && strategy.where_to_compete.length > 0 &&
            strategy.where_to_compete[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <ArrowRight size={16} className="strategy-icon" />
                  {t("strategy_subsection_1")}
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <tbody>
                      {strategy.where_to_compete.map((item, idx) => {
                        const rowIndex = rowIndices.whereToCompete?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="subsection-list-item">
                              <strong>{item.position}:</strong>{' '}
                              {item.description}
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {strategy.how_to_compete && strategy.how_to_compete.length > 0 &&
              strategy.how_to_compete[0] !== 'N/A' && (
                <div className="subsection">
                <h4 className="subsection-title">
                  <ArrowRight size={16} className="strategy-icon" />
                  How to Compete
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <tbody>
                      {strategy.how_to_compete.map((item, idx) => {
                        const rowIndex = rowIndices.howToCompete?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;
 
                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="subsection-list-item">
                              <strong>{item.approach}:</strong>{' '}
                              {item.description}
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
 
            )}
        </div>
      </div>
    );
  };

  const renderTacticsPillar = (tactics) => {
    if (!tactics) return null;
    const analysisData = localStrategicData?.strategic_analysis || localStrategicData;

    return (
      <div className="pillar-container">
        <div className="pillar-card tactics-card">
          <div className="pillar-header tactics-header">
            <Zap size={22} className="tactics-icon" />
            <h3 className="pillar-title">
              {t("execution_subtitle_1")}
            </h3>
          </div>

          <DiagnosticBox diagnostic={tactics.diagnostic} />
          {renderStrategicLinkages(analysisData?.strategic_linkages)}<br></br>
          {renderStrategicRecommendationsFromAnalyses()}
        </div>
      </div>
    );
  };

  const renderResourcesPillar = (resources) => {
    if (!resources) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card resources-card">
          <div className="pillar-header resources-header">
            <DollarSign size={22} className="resources-icon" />
            <h3 className="pillar-title">
              {t("execution_table5_header")}
            </h3>
          </div>

          <DiagnosticBox diagnostic={resources.diagnostic} />

          {resources.capital_allocation && resources.capital_allocation !== 'N/A' && (
            <div className="info-box resources">
              <h4 className="info-box-title resources">
                <DollarSign size={14} />
                Capital Allocation
              </h4>
              <p className="info-box-text resources">
                {resources.capital_allocation}
              </p>
            </div>
          )}

          {resources.capital_priorities && resources.capital_priorities.length > 0 &&
            resources.capital_priorities[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <Star size={16} className="resources-icon" />
                  {t("execution_table5_header1")}
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <tbody>
                      {resources.capital_priorities.map((priority, idx) => {
                        const rowIndex = rowIndices.capitalPriorities?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="subsection-list-item">
                              {priority}
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {resources.talent_priorities && resources.talent_priorities.length > 0 &&
            resources.talent_priorities[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <Users size={16} className="resources-icon" />
                  {t("execution_table5_header2")}
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <tbody>
                      {resources.talent_priorities.map((talent, idx) => {
                        const rowIndex = rowIndices.talentPriorities?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="subsection-list-item">
                              {talent}
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {resources.technology_investments && resources.technology_investments.length > 0 &&
            resources.technology_investments[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <Settings size={16} className="resources-icon" />
                  {t("execution_table5_header3")}
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <tbody>
                      {resources.technology_investments.map((tech, idx) => {
                        const rowIndex = rowIndices.technologyInvestments?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="subsection-list-item">
                              {tech}
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderAnalysisDataPillar = (analysisData) => {
    if (!analysisData) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card analysis-data-card">
          <div className="pillar-header analysis-data-header">
            <Database size={22} className="analysis-data-icon" />
            <h3 className="pillar-title">
              {t("execution1_table_header1")}
            </h3>
          </div>

          <DiagnosticBox diagnostic={analysisData.diagnostic} />

          {analysisData.recommendations && analysisData.recommendations.length > 0 &&
            analysisData.recommendations[0] !== 'N/A' && (
              <div>
                <div className="table-container">
                  <table className="data-table">
                    <tbody>
                      {analysisData.recommendations.map((rec, idx) => {
                        const rowIndex = rowIndices.analysisData?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="subsection-list-item">
                              {rec}
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderTechnologyPillar = (tech) => {
    if (!tech) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card technology-card">
          <div className="pillar-header technology-header">
            <Settings size={22} className="technology-icon" />
            <h3 className="pillar-title">
              {t("execution1_table1_header1")}
            </h3>
          </div>

          <DiagnosticBox diagnostic={tech.diagnostic} />

          {tech.infrastructure_initiatives && tech.infrastructure_initiatives.length > 0 &&
            tech.infrastructure_initiatives[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <Activity size={16} className="technology-icon" />
                  {t("execution1_table1_header2")}
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <tbody>
                      {tech.infrastructure_initiatives.map((initiative, idx) => {
                        const rowIndex = rowIndices.infrastructureInitiatives?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="subsection-list-item">
                              {initiative}
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {tech.platform_priorities && tech.platform_priorities.length > 0 &&
            tech.platform_priorities[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <BarChart3 size={16} className="technology-icon" />
                  {t("execution1_table1_header3")}
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <tbody>
                      {tech.platform_priorities.map((priority, idx) => {
                        const rowIndex = rowIndices.platformPriorities?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="subsection-list-item">
                              {priority}
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderExecutionPillar = (execution) => {
    if (!execution) return null;

    const parseDuration = (duration) => {
      if (!duration) return 1;
      const match = duration?.toString().toLowerCase().match(/(\d+)\s*(month|week|day)/);
      if (!match) return 1;

      const value = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case 'week': return Math.max(0.25, value / 4);
        case 'day': return Math.max(0.1, value / 30);
        case 'month':
        default: return Math.max(1, value);
      }
    };

    const renderGanttChart = (roadmap) => {
      if (!roadmap || roadmap.length === 0) return null;

      let cumulativeMonths = 0;
      const initiativesWithTimeline = roadmap.map((item, index) => {
        const duration = parseDuration(item.milestone || '1 month');
        const startMonth = cumulativeMonths;
        cumulativeMonths += duration;

        return {
          ...item,
          duration,
          startMonth,
          endMonth: cumulativeMonths,
          index
        };
      });

      const totalTimeline = cumulativeMonths;
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

      const renderGanttBar = (startMonth, duration, index) => {
        const color = colors[index % colors.length];
        const leftPercent = (startMonth / totalTimeline) * 100;
        const widthPercent = (duration / totalTimeline) * 100;

        return (
          <div
            style={{
              position: 'absolute',
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              height: '20px',
              backgroundColor: color,
              borderRadius: '4px',
              opacity: 0.85,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: '600',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {Math.round(duration)}m
          </div>
        );
      };

      const renderTimelineHeader = () => {
        const months = Math.ceil(totalTimeline);
        return (
          <div style={{
            display: 'flex',
            marginBottom: '15px',
            fontSize: '12px',
            color: '#4b5563',
            fontWeight: '600',
            borderBottom: '2px solid #d1d5db',
            paddingBottom: '8px'
          }}>
            {Array.from({ length: months }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  borderLeft: i > 0 ? '1px solid #e5e7eb' : 'none',
                  padding: '4px 2px',
                  minWidth: '40px'
                }}
              >
                M{i + 1}
              </div>
            ))}
          </div>
        );
      };

      return (
        <div style={{ marginTop: '20px', marginBottom: '30px' }}>
          <h4 className="subsection-title" style={{ marginBottom: '20px' }}>
            <BarChart3 size={18} className="execution-icon" />
            {t("execution1_table2_header2")}
          </h4>

          <div style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600' }}>
              Timeline Overview ({Math.ceil(totalTimeline)} months)
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '700px' }}>
                {renderTimelineHeader()}

                <div style={{ position: 'relative' }}>
                  {initiativesWithTimeline.map(({ initiative, startMonth, duration, index }) => (
                    <div key={index} style={{
                      position: 'relative',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        marginRight: '12px',
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: colors[index % colors.length],
                          flexShrink: 0
                        }} />
                        {initiative}
                      </div>
                      <div style={{
                        flex: 1,
                        position: 'relative',
                        height: '28px',
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        minWidth: '520px'
                      }}>
                        {renderGanttBar(startMonth, duration, index)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="pillar-container">
        <div className="pillar-card execution-card">
          <div className="pillar-header execution-header">
            <CheckCircle size={22} className="execution-icon" />
            <h3 className="pillar-title">
              {t("execution1_table2_header1")}
            </h3>
          </div>

          <DiagnosticBox diagnostic={execution.diagnostic} />

          {execution.implementation_roadmap && execution.implementation_roadmap.length > 0 && (
            <>
              {renderGanttChart(execution.implementation_roadmap)}

              <div className="subsection">
                <h4 className="subsection-title">
                  <Calendar size={18} className="execution-icon" />
                  {t("execution1_table3_header1")}
                </h4>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("execution_table3_header1")}</th>
                        <th>{t("execution1_table3_header2")}</th>
                        <th>{t("execution1_table3_header3")}</th>
                        <th>{t("execution1_table3_header4")}</th>
                        <th>{t("execution_table2_header5")}</th>
                        <th>{t("execution_table2_header4")}</th>
                        <th>{t("execution1_table3_header5")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {execution.implementation_roadmap.map((item, idx) => {
                        const rowIndex = rowIndices.implementationRoadmap?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="table-value">
                              <div style={{ fontWeight: '600', fontSize: '14px' }}>
                                {item.initiative}
                              </div>
                            </td>
                            <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                              {item.milestone}
                            </td>
                            <td className="table-value text-center" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.3s' }}>
                              <div className="flex-center" style={{ justifyContent: 'center' }}>
                                <Calendar size={12} />
                                <span style={{ fontSize: '13px', fontWeight: '500' }}>
                                  {item.target_date}
                                </span>
                              </div>
                            </td>
                            <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.4s' }}>
                              <div className="flex-center">
                                <Users size={12} />
                                {item.owner}
                              </div>
                            </td>
                            <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.5s' }}>
                              {item.success_metrics && item.success_metrics.length > 0 && (
                                <ul className="table-list">
                                  {item.success_metrics.map((metric, metricIdx) => (
                                    <li key={metricIdx} className="flex-center" style={{
                                      fontSize: '12px',
                                      color: '#059669',
                                      fontWeight: '600'
                                    }}>
                                      <Target size={10} />
                                      {metric}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                            <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.6s' }}>
                              {item.resources_required && (
                                <div style={{ fontSize: '12px' }}>
                                  {item.resources_required.budget && (
                                    <div style={{ marginBottom: '4px' }}>
                                      <strong>Budget:</strong> {item.resources_required.budget}
                                    </div>
                                  )}
                                  {item.resources_required.headcount && (
                                    <div style={{ marginBottom: '4px' }}>
                                      <strong>Headcount:</strong> {item.resources_required.headcount}
                                    </div>
                                  )}
                                  {item.resources_required.technology && item.resources_required.technology.length > 0 && (
                                    <div>
                                      <strong>Technology:</strong>
                                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                                        {item.resources_required.technology.map((tech, techIdx) => (
                                          <li key={techIdx}>{tech}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.7s' }}>
                              {item.dependencies && item.dependencies.length > 0 && (
                                <ul className="table-list">
                                  {item.dependencies.map((dep, depIdx) => (
                                    <li key={depIdx} className="flex-center" style={{ fontSize: '12px' }}>
                                      <Link2 size={10} />
                                      {dep}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {execution.kpi_dashboard && (
            <div className="subsection">
              <h4 className="subsection-title">
                <BarChart3 size={18} className="execution-icon" />
                {t("kpi_dashboard")}
              </h4>

              {execution.kpi_dashboard.review_cadence && (
                <div className="info-box execution">
                  <Clock size={16} className="execution-icon" />
                  <span className="info-box-text execution">
                    Review Cadence: {execution.kpi_dashboard.review_cadence}
                  </span>
                </div>
              )}

              {execution.kpi_dashboard.adoption_metrics && execution.kpi_dashboard.adoption_metrics.length > 0 && (
                <div className="subsection">
                  <h5 className="subsection-title">
                    <TrendingUp size={14} style={{ color: '#3b82f6' }} />
                    {t("kpi_table_header")}
                  </h5>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t("kpi_table_body")}</th>
                          <th>{t("kpi_table_body1")}</th>
                          <th>{t("execution1_table3_header4")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {execution.kpi_dashboard.adoption_metrics.map((metric, idx) => {
                          const rowIndex = rowIndices.adoptionMetrics?.[idx];
                          const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                          const isLast = rowIndex === visibleRows - 1;

                          return (
                            <StreamingRow
                              key={idx}
                              isVisible={isVisible}
                              isLast={isLast && isStreaming}
                              lastRowRef={lastRowRef}
                            >
                              <td className="table-value">
                                {metric.metric}
                              </td>
                              <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                                <span className="badge adoption">
                                  {metric.target}
                                </span>
                              </td>
                              <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.3s' }}>
                                <div className="flex-center">
                                  <Users size={12} />
                                  {metric.owner}
                                </div>
                              </td>
                            </StreamingRow>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {execution.kpi_dashboard.network_metrics && execution.kpi_dashboard.network_metrics.length > 0 && (
                <div className="subsection">
                  <h5 className="subsection-title">
                    <Link2 size={14} style={{ color: '#8b5cf6' }} />
                    {t("kpi_table1_header")}
                  </h5>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t("kpi_table_body")}</th>
                          <th>{t("kpi_table_body1")}</th>
                          <th>{t("execution1_table3_header4")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {execution.kpi_dashboard.network_metrics.map((metric, idx) => {
                          const rowIndex = rowIndices.networkMetrics?.[idx];
                          const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                          const isLast = rowIndex === visibleRows - 1;

                          return (
                            <StreamingRow
                              key={idx}
                              isVisible={isVisible}
                              isLast={isLast && isStreaming}
                              lastRowRef={lastRowRef}
                            >
                              <td className="table-value">
                                {metric.metric}
                              </td>
                              <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                                <span className="badge network">
                                  {metric.target}
                                </span>
                              </td>
                              <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.3s' }}>
                                <div className="flex-center">
                                  <Users size={12} />
                                  {metric.owner}
                                </div>
                              </td>
                            </StreamingRow>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {execution.kpi_dashboard.operational_metrics && execution.kpi_dashboard.operational_metrics.length > 0 && (
                <div className="subsection">
                  <h5 className="subsection-title">
                    <Activity size={14} style={{ color: '#f59e0b' }} />
                    {t("kpi_table2_header")}
                  </h5>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t("kpi_table_body")}</th>
                          <th>{t("kpi_table_body1")}</th>
                          <th>{t("execution1_table3_header4")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {execution.kpi_dashboard.operational_metrics.map((metric, idx) => {
                          const rowIndex = rowIndices.operationalMetrics?.[idx];
                          const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                          const isLast = rowIndex === visibleRows - 1;

                          return (
                            <StreamingRow
                              key={idx}
                              isVisible={isVisible}
                              isLast={isLast && isStreaming}
                              lastRowRef={lastRowRef}
                            >
                              <td className="table-value">
                                {metric.metric}
                              </td>
                              <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                                <span className="badge operational">
                                  {metric.target}
                                </span>
                              </td>
                              <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.3s' }}>
                                <div className="flex-center">
                                  <Users size={12} />
                                  {metric.owner}
                                </div>
                              </td>
                            </StreamingRow>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {execution.kpi_dashboard.financial_metrics && execution.kpi_dashboard.financial_metrics.length > 0 && (
                <div className="subsection">
                  <h5 className="subsection-title">
                    <DollarSign size={14} style={{ color: '#10b981' }} />
                    {t("kpi_table3_header")}
                  </h5>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t("kpi_table_body")}</th>
                          <th>{t("kpi_table_body1")}</th>
                          <th>{t("execution1_table3_header4")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {execution.kpi_dashboard.financial_metrics.map((metric, idx) => {
                          const rowIndex = rowIndices.financialMetrics?.[idx];
                          const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                          const isLast = rowIndex === visibleRows - 1;

                          return (
                            <StreamingRow
                              key={idx}
                              isVisible={isVisible}
                              isLast={isLast && isStreaming}
                              lastRowRef={lastRowRef}
                            >
                              <td className="table-value">
                                {metric.metric}
                              </td>
                              <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                                <span className="badge financial">
                                  {metric.target}
                                </span>
                              </td>
                              <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.3s' }}>
                                <div className="flex-center">
                                  <Users size={12} />
                                  {metric.owner}
                                </div>
                              </td>
                            </StreamingRow>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGovernancePillar = (governance) => {
    if (!governance) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card governance-card">
          <div className="pillar-header governance-header">
            <Shield size={22} className="governance-icon" />
            <h3 className="pillar-title">
              {t("sustainability_card1")}
            </h3>
          </div>

          <DiagnosticBox diagnostic={governance.diagnostic} />

          {governance.decision_delegation && governance.decision_delegation.length > 0 &&
            governance.decision_delegation[0].decision_type !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <ArrowRight size={16} className="governance-icon" />
                  {t("sustainability_card1_header")}
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("sustainability_card1_table1")}</th>
                        <th>{t("sustainability_card1_table2")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {governance.decision_delegation.map((delegation, idx) => {
                        const rowIndex = rowIndices.decisionDelegation?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="table-value">
                              <div style={{ fontWeight: '600' }}>
                                {delegation.decision_type}
                              </div>
                            </td>
                            <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                              <div className="flex-center">
                                <Users size={12} />
                                {delegation.delegate_to}
                              </div>
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {governance.accountability_framework && governance.accountability_framework.length > 0 &&
            governance.accountability_framework[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <CheckCircle size={16} className="governance-icon" />
                  {t("sustainability_card1_header1")}
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <tbody>
                      {governance.accountability_framework.map((item, idx) => {
                        const rowIndex = rowIndices.accountabilityFramework?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="subsection-list-item">
                              {item}
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderInnovationPillar = (innovation) => {
    if (!innovation) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card innovation-card">
          <div className="pillar-header innovation-header">
            <Lightbulb size={22} className="innovation-icon" />
            <h3 className="pillar-title">
              {t("sustainability_card2")}
            </h3>
          </div>

          <DiagnosticBox diagnostic={innovation.diagnostic} />

          {innovation.target_portfolio_mix && innovation.target_portfolio_mix.core !== 'N/A' && (
            <div className="subsection">
              <h4 className="subsection-title">
                <BarChart3 size={16} className="innovation-icon" />
                {t("sustainability_header1")}
              </h4>
              <div className="portfolio-mix-container">
                {innovation.target_portfolio_mix.core && innovation.target_portfolio_mix.core !== 'N/A' && (
                  <div className="portfolio-mix-card core">
                    <div className="portfolio-mix-label core">
                      Core
                    </div>
                    <div className="portfolio-mix-value core">
                      {innovation.target_portfolio_mix.core}
                    </div>
                  </div>
                )}
                {innovation.target_portfolio_mix.adjacent && innovation.target_portfolio_mix.adjacent !== 'N/A' && (
                  <div className="portfolio-mix-card adjacent">
                    <div className="portfolio-mix-label adjacent">
                      Adjacent
                    </div>
                    <div className="portfolio-mix-value adjacent">
                      {innovation.target_portfolio_mix.adjacent}
                    </div>
                  </div>
                )}
                {innovation.target_portfolio_mix.transformational && innovation.target_portfolio_mix.transformational !== 'N/A' && (
                  <div className="portfolio-mix-card transformational">
                    <div className="portfolio-mix-label transformational">
                      Transformational
                    </div>
                    <div className="portfolio-mix-value transformational">
                      {innovation.target_portfolio_mix.transformational}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {innovation.priority_innovation_bets && innovation.priority_innovation_bets.length > 0 &&
            innovation.priority_innovation_bets[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <Star size={16} className="innovation-icon" />
                  {t("sustainability_header2")}
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <tbody>
                      {innovation.priority_innovation_bets.map((bet, idx) => {
                        const rowIndex = rowIndices.innovationBets?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="subsection-list-item">
                              {bet}
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderCulturePillar = (culture) => {
    if (!culture) return null;

    return (
      <div className="pillar-container">
        <div className="pillar-card culture-card">
          <div className="pillar-header culture-header">
            <Heart size={22} className="culture-icon" />
            <h3 className="pillar-title">
              {t("sustainability_card3")}
            </h3>
          </div>

          <DiagnosticBox diagnostic={culture.diagnostic} />

          {culture.cultural_shifts && culture.cultural_shifts.length > 0 &&
            culture.cultural_shifts[0].from !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <TrendingUp size={16} className="culture-icon" />
                  {t("sustainability_card3_header1")}
                </h4>
                <div className="cultural-shifts-container">
                  {culture.cultural_shifts.map((shift, idx) => {
                    const rowIndex = rowIndices.culturalShifts?.[idx];
                    const isVisible = rowIndex !== undefined && rowIndex < visibleRows;

                    return (
                      <div
                        key={idx}
                        className="cultural-shift-card"
                        style={{
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                          transition: hasStreamed ? 'none' : 'opacity 0.3s, transform 0.3s'
                        }}
                      >
                        <div className="cultural-shift-content">
                          <div className="cultural-shift-from">
                            <span className="cultural-shift-label">From: </span>
                            <span className="cultural-shift-value">{shift.from}</span>
                          </div>
                          <ArrowRight size={16} className="cultural-shift-arrow" />
                          <div className="cultural-shift-to">
                            <span className="cultural-shift-label">To: </span>
                            <span className="cultural-shift-value to">{shift.to}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {culture.change_approach && culture.change_approach.length > 0 &&
            culture.change_approach[0] !== 'N/A' && (
              <div className="subsection">
                <h4 className="subsection-title">
                  <CheckCircle size={16} className="culture-icon" />
                  {t("sustainability_card3_header2")}
                </h4>
                <div className="table-container">
                  <table className="data-table">
                    <tbody>
                      {culture.change_approach.map((approach, idx) => {
                        const rowIndex = rowIndices.changeApproach?.[idx];
                        const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                        const isLast = rowIndex === visibleRows - 1;

                        return (
                          <StreamingRow
                            key={idx}
                            isVisible={isVisible}
                            isLast={isLast && isStreaming}
                            lastRowRef={lastRowRef}
                          >
                            <td className="subsection-list-item">
                              {approach}
                            </td>
                          </StreamingRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderStrategicLinkages = (linkages) => {
    if (!linkages || !linkages.objective_to_initiative_map || linkages.objective_to_initiative_map.length === 0) {
      return null;
    }

    return (
      <section className="strategic-page-section">
        <div className="section-headers">
          <Link2 size={24} style={{ color: 'blue' }} />
          <div><h2 className="category-title">{t("execution_table_header1")}</h2></div>
        </div>

        <div className="strategic-linkages-container">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("execution_table_header1")}</th>
                  <th>{t("execution_table_header2")}</th>
                  <th>{t("execution_table_header3")}</th>
                </tr>
              </thead>
              <tbody>
                {linkages.objective_to_initiative_map.map((link, idx) => {
                  const rowIndex = rowIndices.strategicLinkages?.[idx];
                  const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                  const isLast = rowIndex === visibleRows - 1;

                  return (
                    <StreamingRow
                      key={idx}
                      isVisible={isVisible}
                      isLast={isLast && isStreaming}
                      lastRowRef={lastRowRef}
                    >
                      <td className="table-value">
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
                          {link.strategic_objective}
                        </div>
                      </td>
                      <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                        {link.linked_initiatives && link.linked_initiatives.length > 0 && (
                          <ul className="table-list">
                            {link.linked_initiatives.map((initiative, initIdx) => (
                              <li key={initIdx} className="flex-center" style={{ fontSize: '13px' }}>
                                <ArrowRight size={10} style={{ color: '#3b82f6' }} />
                                {initiative}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.3s' }}>
                        <div className="flex-center" style={{
                          fontSize: '13px',
                          color: '#059669',
                          fontWeight: '500'
                        }}>
                          <Target size={12} />
                          {link.success_criteria}
                        </div>
                      </td>
                    </StreamingRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  };

  const renderStrategicRecommendationsFromAnalyses = () => {
    const pestelAnalysis = phaseAnalysisArray.find(analysis =>
      analysis.analysis_type === 'pestel'
    );
    const portersAnalysis = phaseAnalysisArray.find(analysis =>
      analysis.analysis_type === 'porters'
    );

    const pestelRecommendations = pestelAnalysis?.analysis_data?.pestel_analysis?.strategic_recommendations;
    const portersRecommendations = portersAnalysis?.analysis_data?.porter_analysis?.strategic_recommendations;

    const hasPestelRecommendations = pestelRecommendations && (
      (pestelRecommendations.immediate_actions && pestelRecommendations.immediate_actions.length > 0) ||
      (pestelRecommendations.short_term_initiatives && pestelRecommendations.short_term_initiatives.length > 0) ||
      (pestelRecommendations.long_term_strategic_shifts && pestelRecommendations.long_term_strategic_shifts.length > 0)
    );

    const hasPortersRecommendations = portersRecommendations && (
      (portersRecommendations.immediate_actions && portersRecommendations.immediate_actions.length > 0) ||
      (portersRecommendations.short_term_initiatives && portersRecommendations.short_term_initiatives.length > 0) ||
      (portersRecommendations.long_term_strategic_shifts && portersRecommendations.long_term_strategic_shifts.length > 0)
    );

    if (!hasPestelRecommendations && !hasPortersRecommendations) {
      return null;
    }

    const renderRecommendationActions = (actions, title, icon, indexKey) => {
      if (!actions || actions.length === 0) return null;

      return (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#1f2937',
            marginBottom: '15px'
          }}>
            {icon}
            {title}
          </h3>

          <div className="table-container" style={{ margin: 0, padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("execution_table2_header1")}</th>
                  <th>{t("execution_table2_header2")}</th>
                  <th>{t("execution_table2_header3")}</th>
                  <th>{t("execution_table2_header4")}</th>
                  <th>{t("execution_table2_header5")}</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action, index) => {
                  const rowIndex = rowIndices[indexKey]?.[index];
                  const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                  const isLast = rowIndex === visibleRows - 1;

                  return (
                    <StreamingRow
                      key={index}
                      isVisible={isVisible}
                      isLast={isLast && isStreaming}
                      lastRowRef={lastRowRef}
                    >
                      <td className="table-value">
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {action.action}
                        </div>
                      </td>
                      <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                        <div style={{ fontSize: '13px', color: '#374151' }}>
                          {action.rationale}
                        </div>
                      </td>
                      <td className="table-value text-center" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.3s' }}>
                        <div style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          display: 'inline-block'
                        }}>
                          {action.timeline}
                        </div>
                      </td>
                      <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.4s' }}>
                        {action.resources_required && (
                          <ul className="table-list">
                            {(Array.isArray(action.resources_required) ? action.resources_required : [action.resources_required]).map((resource, idx) => (
                              <li key={idx} style={{
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <div style={{
                                  width: '4px',
                                  height: '4px',
                                  borderRadius: '50%',
                                  backgroundColor: '#3b82f6'
                                }} />
                                {resource}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.5s' }}>
                        {action.success_metrics && action.success_metrics.length > 0 && (
                          <ul className="table-list">
                            {action.success_metrics.map((metric, idx) => (
                              <li key={idx} style={{
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: '600',
                                color: '#059669'
                              }}>
                                <Target size={10} />
                                {metric}
                              </li>
                            ))}
                          </ul>
                        )}
                        {action.expected_impact && (
                          <div style={{
                            fontSize: '12px',
                            color: '#059669',
                            display: 'flex',
                            fontWeight: '600',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <Target size={10} />
                            {action.expected_impact}
                          </div>
                        )}
                      </td>
                    </StreamingRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const renderInitiatives = (initiatives, title, icon, indexKey) => {
      if (!initiatives || initiatives.length === 0) return null;

      return (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#1f2937',
            marginBottom: '15px'
          }}>
            {icon}
            {title}
          </h3>

          <div className="table-container" style={{ margin: 0, padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("execution_table3_header1")}</th>
                  <th>{t("execution_table3_header2")}</th>
                  <th>{t("execution_table3_header3")}</th>
                  <th>{t("execution_table3_header4")}</th>
                </tr>
              </thead>
              <tbody>
                {initiatives.map((initiative, index) => {
                  const rowIndex = rowIndices[indexKey]?.[index];
                  const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                  const isLast = rowIndex === visibleRows - 1;

                  return (
                    <StreamingRow
                      key={index}
                      isVisible={isVisible}
                      isLast={isLast && isStreaming}
                      lastRowRef={lastRowRef}
                    >
                      <td className="table-value">
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {initiative.initiative}
                        </div>
                      </td>
                      <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                        <div style={{
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          display: 'inline-block'
                        }}>
                          {initiative.strategic_pillar}
                        </div>
                      </td>
                      <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.3s' }}>
                        <div style={{ fontSize: '13px', color: '#374151' }}>
                          {initiative.expected_outcome}
                        </div>
                      </td>
                      <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.4s' }}>
                        <div style={{ fontSize: '13px', color: '#dc2626' }}>
                          {initiative.risk_mitigation}
                        </div>
                      </td>
                    </StreamingRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const renderLongTermShifts = (shifts, title, icon, indexKey) => {
      if (!shifts || shifts.length === 0) return null;

      return (
        <div style={{ marginBottom: '5px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#1f2937',
            marginBottom: '15px'
          }}>
            {icon}
            {title}
          </h3>

          <div className="table-container" style={{ margin: 0, padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("execution_table4_header1")}</th>
                  <th>{t("execution_table4_header2")}</th>
                  <th>{t("execution_table4_header3")}</th>
                  <th>{t("execution_table4_header4")}</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift, index) => {
                  const rowIndex = rowIndices[indexKey]?.[index];
                  const isVisible = rowIndex !== undefined && rowIndex < visibleRows;
                  const isLast = rowIndex === visibleRows - 1;

                  return (
                    <StreamingRow
                      key={index}
                      isVisible={isVisible}
                      isLast={isLast && isStreaming}
                      lastRowRef={lastRowRef}
                    >
                      <td className="table-value">
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {shift.shift}
                        </div>
                      </td>
                      <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.2s' }}>
                        <div style={{ fontSize: '13px', color: '#374151' }}>
                          {shift.transformation_required}
                        </div>
                      </td>
                      <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.3s' }}>
                        <div style={{
                          fontSize: '13px',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <TrendingUp size={12} />
                          {shift.competitive_advantage}
                        </div>
                      </td>
                      <td className="table-value" style={{ opacity: isVisible ? 1 : 0, transition: hasStreamed ? 'none' : 'opacity 0.3s 0.4s' }}>
                        <div style={{ fontSize: '13px', color: '#374151' }}>
                          {shift.sustainability}
                        </div>
                      </td>
                    </StreamingRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const combinedImmediateActions = [
      ...(pestelRecommendations?.immediate_actions || []),
      ...(portersRecommendations?.immediate_actions || [])
    ];

    const combinedShortTermInitiatives = [
      ...(pestelRecommendations?.short_term_initiatives || []),
      ...(portersRecommendations?.short_term_initiatives || [])
    ];

    const combinedLongTermShifts = [
      ...(pestelRecommendations?.long_term_strategic_shifts || []),
      ...(portersRecommendations?.long_term_strategic_shifts || [])
    ];

    return (
      <section className="strategic-page-section">
        {renderRecommendationActions(
          combinedImmediateActions,
          t('execution_table2_header'),
          <Zap size={20} style={{ color: '#ef4444' }} />,
          'immediateActions'
        )}

        {renderInitiatives(
          combinedShortTermInitiatives,
          t('execution_table3_header'),
          <Activity size={20} style={{ color: '#f59e0b' }} />,
          'shortTermInitiatives'
        )}

        {renderLongTermShifts(
          combinedLongTermShifts,
          t('execution_table4_header'),
          <TrendingUp size={20} style={{ color: '#10b981' }} />,
          'longTermShifts'
        )}
      </section>
    );
  };

  const renderStrategicContent = () => {
    const analysisData = localStrategicData?.strategic_analysis || localStrategicData;
    const recommendations = analysisData?.strategic_recommendations;

    if (!recommendations) return null;

    return (
      <div className="strategic-content">
        {recommendations.strategy_block && (
          <div className="block-wrapper" data-component="strategic-direction">
            <CategorySection
              id="strategy-block"
              title={t("strategy_block_title")}
              icon={Target}
              description={t("strategy_desc")}
            >
              {renderStrategyPillar(recommendations.strategy_block.S_strategy)}
              {renderTacticsPillar(recommendations.strategy_block.T_tactics)}
              {renderResourcesPillar(recommendations.strategy_block.R_resources)}
            </CategorySection>
          </div>
        )}

        {recommendations.execution_block && (
          <div className="block-wrapper" data-component="strategic-execution">
            <CategorySection
              id="execution-block"
              title={t("execution_block_title")}
              icon={CheckCircle}
              description={t("execution_desc")}
            >
              {renderAnalysisDataPillar(recommendations.execution_block.A_analysis_data)}
              {renderTechnologyPillar(recommendations.execution_block.T_technology_digitalization)}
              {renderExecutionPillar(recommendations.execution_block.E_execution)}
            </CategorySection>
          </div>
        )}

        {recommendations.sustainability_block && (
          <div className="block-wrapper" data-component="strategic-sustainability">
            <CategorySection
              id="sustainability-block"
              title={t("sustainability-block_title")}
              icon={Shield}
              description={t("sustainability_desc")}
            >
              {renderGovernancePillar(recommendations.sustainability_block.G_governance)}
              {renderInnovationPillar(recommendations.sustainability_block.I_innovation)}
              {renderCulturePillar(recommendations.sustainability_block.C_culture)}
            </CategorySection>
          </div>
        )}
      </div>
    );
  };

  if (isRegenerating || isLoading) {
    return (
      <div className="strategic-analysis-container">
        <div className="loading-state">
          <Loader className="loading-spinner spin-animation" size={40} />
          <h3 className="loading-title">Generating Strategic Analysis</h3>
          <p className="loading-text">Building comprehensive strategic insights...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="strategic-analysis-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{errorMessage}</p>
          <button onClick={handleRegenerate} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!hasGenerated || !localStrategicData || isStrategicDataIncomplete(localStrategicData)) {
    return (
      <div
        className="strategic-analysis-container"
        data-analysis-type="strategic"
        data-analysis-name="Strategic Analysis"
        data-analysis-order="10"
      >
        <AnalysisEmptyState
          analysisType="strategic"
          analysisDisplayName="Strategic Analysis"
          icon={Target}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={canRegenerate && onRegenerate ? handleRegenerate : null}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate && !!onRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={5}
          customMessage="Complete essential phase questions to unlock comprehensive strategic analysis with implementation roadmaps and accountability frameworks."
          showImproveButton={!hideImproveButton}
        />
      </div>
    );
  }

  return (
    <div
      className="strategic-analysis-container"
      data-analysis-type="strategic"
      data-analysis-name="Strategic Analysis"
      data-analysis-order="10"
    >
      {canShowKickstart && !hasKickstarted && !hasProjectsTab && (
        <KickstartProjectsCard onKickstart={handleKickstart} />
      )}
      <div className="dashboard-container">
        {renderStrategicContent()}
      </div>
    </div>
  );
};

export default StrategicAnalysis;