import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Loader,
  Target,
  TrendingUp,
  CheckCircle,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import AnalysisEmptyState from "./AnalysisEmptyState";
import AnalysisError from "./AnalysisError";
import { useAnalysisStore } from "../store";
import { useTranslation } from "../hooks/useTranslation";
import {
  checkMissingQuestionsAndRedirect,
  ANALYSIS_TYPES,
} from "../services/missingQuestionsService";
import "../styles/EssentialPhase.css";

const StrategicGoals = ({
  questions = [],
  userAnswers = {},
  businessName = "",
  onRegenerate,
  isRegenerating: propIsRegenerating = false,
  canRegenerate = true,
  strategicGoalsData: propStrategicGoalsData = null,
  selectedBusinessId,
  onRedirectToBrief,
}) => {
  const { t } = useTranslation();

  // Use Zustand store
  const {
    strategicGoalsData: storeStrategicGoalsData,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis,
  } = useAnalysisStore();

  const isRegenerating =
    propIsRegenerating || isTypeRegenerating("strategicGoals");

  // Normalize data from store or props
  const data = useMemo(() => {
    const rawData = propStrategicGoalsData || storeStrategicGoalsData;
    if (!rawData) return null;

    // Handle nested structure
    const actualData = rawData.strategicGoals || rawData;
    return actualData;
  }, [propStrategicGoalsData, storeStrategicGoalsData]);

  const [expandedSections, setExpandedSections] = useState({
    overview: false,
    objectives: false,
    keyresults: false,
    gantt: false,
  });
  const [error, setError] = useState(null);

  const handleRedirectToBrief = useCallback(
    (missingQuestionsData = null) => {
      if (onRedirectToBrief) {
        onRedirectToBrief(missingQuestionsData);
      }
    },
    [onRedirectToBrief],
  );

  const handleMissingQuestionsCheck = useCallback(async () => {
    const analysisConfig = ANALYSIS_TYPES.strategicGoals || {
      displayName: "Strategic Goals & OKR Analysis",
      customMessage:
        "Answer more questions to unlock detailed strategic goals and OKR analysis",
    };

    await checkMissingQuestionsAndRedirect(
      "strategicGoals",
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage,
      },
    );
  }, [selectedBusinessId, handleRedirectToBrief]);

  const isStrategicGoalsDataIncomplete = useCallback((data) => {
    if (!data) return true;
    const objectives = data.objectives || [];
    if (!Array.isArray(objectives) || objectives.length === 0) return true;
    return !objectives.some(
      (obj) => obj.objective && (obj.priority !== undefined || obj.keyResults),
    );
  }, []);

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleRegenerate = useCallback(async () => {
    if (onRegenerate) {
      try {
        setError(null);
        await onRegenerate();
      } catch (err) {
        setError(err.message || "Failed to regenerate analysis");
      }
    } else {
      try {
        setError(null);
        await regenerateIndividualAnalysis(
          "strategicGoals",
          questions,
          userAnswers,
          selectedBusinessId,
        );
      } catch (err) {
        setError(err.message || "Failed to generate analysis");
      }
    }
  }, [
    onRegenerate,
    regenerateIndividualAnalysis,
    questions,
    userAnswers,
    selectedBusinessId,
  ]);

  const getProgressColor = (progress) => {
    if (progress >= 75) return "high-intensity";
    if (progress >= 50) return "medium-intensity";
    if (progress >= 25) return "low-intensity";
    return "progress-critical";
  };

  const getAlignmentIcon = (alignment) => {
    switch (alignment?.toLowerCase()) {
      case "growth":
        return <TrendingUp size={16} />;
      case "innovation":
        return <Target size={16} />;
      case "retention":
        return <CheckCircle size={16} />;
      case "customer_retention":
        return <CheckCircle size={16} />;
      case "geographic_expansion":
        return <Target size={16} />;
      default:
        return <Target size={16} />;
    }
  };

  const formatAlignmentLabel = (alignment) => {
    switch (alignment?.toLowerCase()) {
      case "growth":
        return "Growth";
      case "innovation":
        return "Innovation";
      case "retention":
        return "Retention";
      case "customer_retention":
        return "Customer Retention";
      case "geographic_expansion":
        return "Geographic Expansion";
      default:
        return alignment || "Strategy";
    }
  };

  const formatTheme = (theme) => {
    switch (theme?.toLowerCase()) {
      case "growth":
        return "Growth";
      case "customer_retention":
        return "Customer Retention";
      case "geographic_expansion":
        return "Geographic Expansion";
      case "innovation":
        return "Innovation";
      case "efficiency":
        return "Efficiency";
      default:
        return (
          theme?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
          theme
        );
    }
  };

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const renderGanttChart = (objectives) => {
    const objectivesWithTimeline = objectives.map((objective, index) => {
      let startMonth, duration;
      switch (objective.priority) {
        case 1:
          startMonth = 1;
          duration = 12;
          break;
        case 2:
          startMonth = 3;
          duration = 8;
          break;
        case 3:
          startMonth = 6;
          duration = 6;
          break;
        default:
          startMonth = index * 2 + 1;
          duration = 6;
      }
      return {
        ...objective,
        startMonth: objective.startMonth || startMonth,
        duration: objective.duration || duration,
      };
    });

    return (
      <div className="section-container">
        <div className="section-header" onClick={() => toggleSection("gantt")}>
          <h3>Strategic Timeline</h3>
          {expandedSections.gantt ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </div>

        <div className={`section-container ${expandedSections.gantt === true ? 'expanded' : 'collapsed'}`}>
          <div className="table-container">
            <div className="gantt-chart">
              <div className="timeline-header">
                <div className="timeline-label">Initiative</div>
                {months.map((month, index) => (
                  <div key={index} className="month-label">
                    {month}
                  </div>
                ))}
              </div>

              {objectivesWithTimeline.map((objective, index) => (
                <div key={index} className="initiative-row">
                  <div className="initiative-name">{objective.objective}</div>
                  {months.map((_, monthIndex) => {
                    const isActive =
                      monthIndex >= objective.startMonth - 1 &&
                      monthIndex <
                        objective.startMonth - 1 + objective.duration;
                    const isFirstMonth =
                      monthIndex === objective.startMonth - 1;
                    const isMidPoint =
                      monthIndex ===
                      Math.floor(
                        objective.startMonth - 1 + objective.duration / 2,
                      );

                    const avgProgress =
                      objective.keyResults?.length > 0
                        ? Math.round(
                            objective.keyResults.reduce(
                              (sum, kr) => sum + (kr.progress || 0),
                              0,
                            ) / objective.keyResults.length,
                          )
                        : 0;

                    return (
                      <div key={monthIndex} className="timeline-cell">
                        {isActive && (
                          <div
                            className={`timeline-bar priority-${objective.priority}`}
                            style={{
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "white",
                              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                            }}
                          >
                            {isMidPoint && objective.duration > 2 && (
                              <span
                                style={{
                                  background: "rgba(0,0,0,0.3)",
                                  padding: "1px 4px",
                                  borderRadius: "2px",
                                  fontSize: "10px",
                                }}
                              >
                                {avgProgress}%
                              </span>
                            )}
                            {((isFirstMonth && objective.duration <= 2) ||
                              (isFirstMonth && !isMidPoint)) && (
                              <span style={{ fontSize: "10px" }}>
                                P{objective.priority}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOverallProgress = (progress, themes) => {
    return (
      <div className="section-container">
        <div
          className="section-header"
          onClick={() => toggleSection("overview")}
        >
          <h3>Strategic Overview {data.year && `(${data.year})`}</h3>
          {expandedSections.overview ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </div>

        <div className={`section-container ${expandedSections.overview === true ? 'expanded' : 'collapsed'}`}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Annual Progress</strong>
                  </td>
                  <td>{progress}%</td>
                  <td>
                    <span
                      className={`status-badge ${getProgressColor(progress)}`}
                    >
                      {progress >= 75
                        ? "Excellent"
                        : progress >= 50
                          ? "Good"
                          : progress >= 25
                            ? "Fair"
                            : "Needs Attention"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Total Objectives</strong>
                  </td>
                  <td>{data.objectives?.length || 0}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>
                    <strong>High Priority Objectives</strong>
                  </td>
                  <td>
                    {data.objectives?.filter((obj) => obj.priority === 1)
                      .length || 0}
                  </td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>

            {themes && themes.length > 0 && (
              <div className="subsection">
                <h4>Strategic Themes</h4>
                <div className="forces-tags">
                  {themes.map((theme, index) => (
                    <span key={index} className="force-tag">
                      {formatTheme(theme)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderObjectivesTable = (objectives) => {
    return (
      <div className="section-container">
        <div
          className="section-header"
          onClick={() => toggleSection("objectives")}
        >
          <h3>Strategic Objectives & OKRs</h3>
          {expandedSections.objectives ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </div>

        <div className={`section-container ${expandedSections.objectives === true ? 'expanded' : 'collapsed'}`}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Objective</th>
                  <th>Priority</th>
                  <th>Alignment</th>
                  <th>Progress</th>
                  <th>Key Results</th>
                </tr>
              </thead>
              <tbody>
                {objectives.map((objective, index) => {
                  const avgProgress =
                    objective.keyResults?.length > 0
                      ? Math.round(
                          objective.keyResults.reduce(
                            (sum, kr) => sum + (kr.progress || 0),
                            0,
                          ) / objective.keyResults.length,
                        )
                      : 0;

                  return (
                    <tr key={index}>
                      <td>
                        <strong>{objective.objective}</strong>
                      </td>
                      <td>
                        <span
                          className={`status-badge priority-${objective.priority}`}
                        >
                          Priority {objective.priority}
                        </span>
                      </td>
                      <td>
                        <div className="force-name">
                          {getAlignmentIcon(objective.alignment)}
                          <span>
                            {formatAlignmentLabel(objective.alignment)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${getProgressColor(avgProgress)}`}
                        >
                          {avgProgress}%
                        </span>
                      </td>
                      <td>
                        <div className="factors-cell">
                          {objective.keyResults?.map((kr, krIndex) => (
                            <div key={krIndex} className="factor-item">
                              <span
                                className={`factor-impact ${getProgressColor(kr.progress)}`}
                              >
                                {kr.progress}%
                              </span>
                              <span className="factor-desc">
                                <strong>{kr.metric}:</strong> {kr.current} /{" "}
                                {kr.target}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderKeyResultsDetailTable = (objectives) => {
    const allKeyResults = objectives.flatMap((objective, objIndex) =>
      (objective.keyResults || []).map((kr, krIndex) => ({
        ...kr,
        objectiveTitle: objective.objective,
        objectiveIndex: objIndex,
        keyResultIndex: krIndex,
      })),
    );

    if (allKeyResults.length === 0) return null;

    return (
      <div className="section-container">
        <div
          className="section-header"
          onClick={() => toggleSection("keyresults")}
        >
          <h3>Key Results Details</h3>
          {expandedSections.keyresults ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </div>

        <div className={`section-container ${expandedSections.keyresults === true ? 'expanded' : 'collapsed'}`}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Objective</th>
                  <th>Key Result</th>
                  <th>Current</th>
                  <th>Target</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allKeyResults.map((kr, index) => (
                  <tr key={index}>
                    <td>
                      <strong>{kr.objectiveTitle}</strong>
                    </td>
                    <td>{kr.metric}</td>
                    <td>{kr.current}</td>
                    <td>{kr.target}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "60px",
                            height: "8px",
                            backgroundColor: "#f0f0f0",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(kr.progress || 0, 100)}%`,
                              height: "100%",
                              backgroundColor:
                                kr.progress >= 75
                                  ? "#10b981"
                                  : kr.progress >= 50
                                    ? "#f59e0b"
                                    : kr.progress >= 25
                                      ? "#ef4444"
                                      : "#dc2626",
                              transition: "width 0.3s ease-in-out",
                            }}
                          />
                        </div>
                        <span>{kr.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${getProgressColor(kr.progress)}`}
                      >
                        {kr.progress >= 75
                          ? "On Track"
                          : kr.progress >= 50
                            ? "Progressing"
                            : kr.progress >= 25
                              ? "Behind"
                              : "Critical"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (isRegenerating) {
    return (
      <div className="strategic-goals-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>Generating strategic goals analysis...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (error) {
      return (
        <AnalysisError
          error={error}
          onRetry={handleRegenerate}
          title="Strategic Goals Analysis Error"
        />
      );
    }

    if (!data || isStrategicGoalsDataIncomplete(data)) {
      return (
        <AnalysisEmptyState
          analysisType="strategicGoals"
          analysisDisplayName="Strategic Goals & OKR Analysis"
          icon={Target}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
        />
      );
    }

    return (
      <div className="goals-content">
        {data.overallProgress !== undefined &&
          renderOverallProgress(
            data.overallProgress,
            data.strategicThemes || data.themes,
          )}
        {data.objectives &&
          data.objectives.length > 0 &&
          renderObjectivesTable(data.objectives)}
        {data.objectives &&
          data.objectives.length > 0 &&
          renderKeyResultsDetailTable(data.objectives)}
        {data.objectives && renderGanttChart(data.objectives)}
      </div>
    );
  };

  return <div className="strategic-goals-container">{renderContent()}</div>;
};

export default React.memo(StrategicGoals);
