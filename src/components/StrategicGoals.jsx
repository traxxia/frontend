import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, Target, TrendingUp, Calendar, CheckCircle, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import '../styles/EssentialPhase.css';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const StrategicGoals = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    strategicGoalsData = null,
    selectedBusinessId,
    onRedirectToBrief // Add this prop
}) => {
    const [data, setData] = useState(strategicGoalsData);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
    const getAuthToken = () => sessionStorage.getItem('token');

    const handleRedirectToBrief = (missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    };

    const handleMissingQuestionsCheck = async () => {
        const analysisConfig = ANALYSIS_TYPES.strategicGoals; 
        
        await checkMissingQuestionsAndRedirect(
            'strategicGoals', 
            selectedBusinessId,
            handleRedirectToBrief,
            {
            displayName: analysisConfig.displayName,
            customMessage: analysisConfig.customMessage
            }
        );
    };

    // Check if the strategic goals data is empty/incomplete
    const isStrategicGoalsDataIncomplete = (data) => {
        if (!data) return true;
        
        // Handle nested structure - check if data is nested under 'strategicGoals' key
        const actualData = data.strategicGoals || data;
        
        // Check if objectives array is empty or null
        if (!actualData.objectives || !Array.isArray(actualData.objectives) || actualData.objectives.length === 0) {
            return true;
        }
        
        // Check if objectives have essential data
        const hasValidObjectives = actualData.objectives.some(objective => 
            objective.objective && 
            (objective.priority !== undefined || objective.keyResults)
        );
        
        return !hasValidObjectives;
    };

    // Toggle section expansion
    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    // Handle regeneration
    const handleRegenerate = async () => {
        if (onRegenerate) {
            onRegenerate();
        } else {
            setData(null);
            setHasGenerated(false);
        }
    };

    useEffect(() => {
        if (strategicGoalsData) {
            // Handle nested structure - check if data is nested under 'strategicGoals' key
            const actualData = strategicGoalsData.strategicGoals || strategicGoalsData;
            
            setData(actualData);
            setHasGenerated(true);
        }
    }, [strategicGoalsData]);

    const getProgressColor = (progress) => {
        if (progress >= 75) return 'high-intensity';
        if (progress >= 50) return 'medium-intensity';
        if (progress >= 25) return 'low-intensity';
        return 'progress-critical';
    };

    const getAlignmentIcon = (alignment) => {
        switch (alignment?.toLowerCase()) {
            case 'growth': return <TrendingUp size={16} />;
            case 'innovation': return <Target size={16} />;
            case 'retention': return <CheckCircle size={16} />;
            case 'customer_retention': return <CheckCircle size={16} />;
            case 'geographic_expansion': return <Target size={16} />;
            default: return <Target size={16} />;
        }
    };

    const formatAlignmentLabel = (alignment) => {
        switch (alignment?.toLowerCase()) {
            case 'growth': return 'Growth';
            case 'innovation': return 'Innovation';
            case 'retention': return 'Retention';
            case 'customer_retention': return 'Customer Retention';
            case 'geographic_expansion': return 'Geographic Expansion';
            default: return alignment || 'Strategy';
        }
    };

    const formatTheme = (theme) => {
        switch (theme?.toLowerCase()) {
            case 'growth': return 'Growth';
            case 'customer_retention': return 'Customer Retention';
            case 'geographic_expansion': return 'Geographic Expansion';
            case 'innovation': return 'Innovation';
            case 'efficiency': return 'Efficiency';
            default: return theme?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || theme;
        }
    };

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const renderGanttChart = (objectives) => {
        // Generate default timeline data if missing
        const objectivesWithTimeline = objectives.map((objective, index) => {
            // Create more realistic timeline based on priority
            let startMonth, duration;
            
            switch(objective.priority) {
                case 1: // High priority - start early, longer duration
                    startMonth = 1;
                    duration = 12;
                    break;
                case 2: // Medium priority - start mid-year, medium duration
                    startMonth = 3;
                    duration = 8;
                    break;
                case 3: // Lower priority - start later, shorter duration
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
                duration: objective.duration || duration
            };
        });

        return (
            <div className="section-container">
                <div className="section-header" onClick={() => toggleSection('gantt')}>
                    <h3>Strategic Timeline</h3>
                    {expandedSections.gantt ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>

                {expandedSections.gantt !== false && (
                    <div className="table-container">
                        <div className="gantt-chart">
                            {/* Timeline Header */}
                            <div className="timeline-header">
                                <div className="timeline-label">Initiative</div>
                                {months.map((month, index) => (
                                    <div key={index} className="month-label">{month}</div>
                                ))}
                            </div>

                            {/* Initiative Rows */}
                            {objectivesWithTimeline.map((objective, index) => (
                                <div key={index} className="initiative-row">
                                    <div className="initiative-name">{objective.objective}</div>
                                    {months.map((_, monthIndex) => {
                                        const isActive = monthIndex >= (objective.startMonth - 1) &&
                                            monthIndex < (objective.startMonth - 1 + objective.duration);
                                        const isFirstMonth = monthIndex === objective.startMonth - 1;
                                        const isMidPoint = monthIndex === Math.floor(objective.startMonth - 1 + objective.duration / 2);

                                        // Calculate average progress from key results
                                        const avgProgress = objective.keyResults?.length > 0
                                            ? Math.round(objective.keyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0) / objective.keyResults.length)
                                            : 0;

                                        return (
                                            <div key={monthIndex} className="timeline-cell">
                                                {isActive && (
                                                    <div className={`timeline-bar priority-${objective.priority}`}
                                                        style={{
                                                            position: 'relative',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                            color: 'white',
                                                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                                        }}>
                                                        {/* Show progress percentage in the middle of the timeline bar */}
                                                        {isMidPoint && objective.duration > 2 && (
                                                            <span style={{
                                                                background: 'rgba(0,0,0,0.3)',
                                                                padding: '1px 4px',
                                                                borderRadius: '2px',
                                                                fontSize: '10px'
                                                            }}>
                                                                {avgProgress}%
                                                            </span>
                                                        )}
                                                        {/* Show priority for short durations or first month */}
                                                        {((isFirstMonth && objective.duration <= 2) ||
                                                            (isFirstMonth && !isMidPoint)) && (
                                                                <span style={{ fontSize: '10px' }}>
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
                )}
            </div>
        );
    };

    const renderOverallProgress = (progress, themes) => {
        return (
            <div className="section-container">
                <div className="section-header" onClick={() => toggleSection('overview')}>
                    <h3>Strategic Overview {data.year && `(${data.year})`}</h3>
                    {expandedSections.overview ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>

                {expandedSections.overview !== false && (
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
                                    <td><strong>Annual Progress</strong></td>
                                    <td>{progress}%</td>
                                    <td>
                                        <span className={`status-badge ${getProgressColor(progress)}`}>
                                            {progress >= 75 ? 'Excellent' : 
                                             progress >= 50 ? 'Good' : 
                                             progress >= 25 ? 'Fair' : 'Needs Attention'}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Total Objectives</strong></td>
                                    <td>{data.objectives?.length || 0}</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td><strong>High Priority Objectives</strong></td>
                                    <td>{data.objectives?.filter(obj => obj.priority === 1).length || 0}</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td><strong>Strategic Themes</strong></td>
                                    <td>{themes?.length || 0}</td>
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
                )}
            </div>
        );
    };

    const renderObjectivesTable = (objectives) => {
        return (
            <div className="section-container">
                <div className="section-header" onClick={() => toggleSection('objectives')}>
                    <h3>Strategic Objectives & OKRs</h3>
                    {expandedSections.objectives ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                
                {expandedSections.objectives !== false && (
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
                                    const avgProgress = objective.keyResults?.length > 0
                                        ? Math.round(objective.keyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0) / objective.keyResults.length)
                                        : 0;

                                    return (
                                        <tr key={index}>
                                            <td>
                                                <strong>{objective.objective}</strong>
                                            </td>
                                            <td>
                                                <span className={`status-badge priority-${objective.priority}`}>
                                                    Priority {objective.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="force-name">
                                                    {getAlignmentIcon(objective.alignment)}
                                                    <span>{formatAlignmentLabel(objective.alignment)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getProgressColor(avgProgress)}`}>
                                                    {avgProgress}%
                                                </span>
                                            </td>
                                            <td>
                                                <div className="factors-cell">
                                                    {objective.keyResults?.map((kr, krIndex) => (
                                                        <div key={krIndex} className="factor-item">
                                                            <span className={`factor-impact ${getProgressColor(kr.progress)}`}>
                                                                {kr.progress}%
                                                            </span>
                                                            <span className="factor-desc">
                                                                <strong>{kr.metric}:</strong> {kr.current} / {kr.target}
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
                )}
            </div>
        );
    };

    const renderKeyResultsDetailTable = (objectives) => {
        const allKeyResults = objectives.flatMap((objective, objIndex) => 
            (objective.keyResults || []).map((kr, krIndex) => ({
                ...kr,
                objectiveTitle: objective.objective,
                objectiveIndex: objIndex,
                keyResultIndex: krIndex
            }))
        );

        if (allKeyResults.length === 0) return null;

        return (
            <div className="section-container">
                <div className="section-header" onClick={() => toggleSection('keyresults')}>
                    <h3>Key Results Details</h3>
                    {expandedSections.keyresults ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                
                {expandedSections.keyresults !== false && (
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
                                        <td><strong>{kr.objectiveTitle}</strong></td>
                                        <td>{kr.metric}</td>
                                        <td>{kr.current}</td>
                                        <td>{kr.target}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '60px',
                                                    height: '8px',
                                                    backgroundColor: '#f0f0f0',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${Math.min(kr.progress || 0, 100)}%`,
                                                        height: '100%',
                                                        backgroundColor: kr.progress >= 75 ? '#10b981' :
                                                            kr.progress >= 50 ? '#f59e0b' :
                                                                kr.progress >= 25 ? '#ef4444' : '#dc2626',
                                                        transition: 'width 0.3s ease-in-out'
                                                    }} />
                                                </div>
                                                <span>{kr.progress}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getProgressColor(kr.progress)}`}>
                                                {kr.progress >= 75 ? 'On Track' : 
                                                 kr.progress >= 50 ? 'Progressing' : 
                                                 kr.progress >= 25 ? 'Behind' : 'Critical'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    // Loading state
    if (isRegenerating) {
        return (
            <div className="strategic-goals-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>
                        {isRegenerating
                            ? "Regenerating strategic goals analysis..."
                            : "Generating strategic goals analysis..."
                        }
                    </span>
                </div>
            </div>
        );
    }

    // Error state
    if (!hasGenerated && !data && Object.keys(userAnswers).length > 0) {
        return (
            <div className="strategic-goals-container">                
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Analysis Error</h3>
                    <p>Unable to generate strategic goals. Please try regenerating or check your inputs.</p>
                    <button onClick={() => {
                        if (onRegenerate) {
                            onRegenerate();
                        }
                    }} className="retry-button">
                        Retry Analysis
                    </button>
                </div>
            </div>
        );
    }

    // Check if data is incomplete and show missing questions checker
    if (!strategicGoalsData || isStrategicGoalsDataIncomplete(strategicGoalsData)) {
        return (
            <div className="strategic-goals-container"> 

                {/* Replace the entire empty-state div with the common component */}
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
            </div>
        );
    }

    return (
        <div className="strategic-goals-container"> 

            <div className="goals-content">
                {/* Overall Progress Section */}
                {data.overallProgress !== undefined && (
                    renderOverallProgress(data.overallProgress, data.strategicThemes || data.themes)
                )}

                {/* Objectives Table */}
                {data.objectives && data.objectives.length > 0 && (
                    renderObjectivesTable(data.objectives)
                )}

                {/* Key Results Detail Table */}
                {data.objectives && data.objectives.length > 0 && (
                    renderKeyResultsDetailTable(data.objectives)
                )}

                {/* Gantt Chart: Timeline of strategic initiatives */}
                {data.objectives && (
                    renderGanttChart(data.objectives)
                )}
            </div>
        </div>
    );
};

export default StrategicGoals;