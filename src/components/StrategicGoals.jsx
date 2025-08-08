import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, Target, TrendingUp, Calendar, CheckCircle, BarChart3 } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import '../styles/EssentialPhase.css';

const StrategicGoals = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    strategicGoalsData = null,
    selectedBusinessId
}) => {
    const [data, setData] = useState(strategicGoalsData);
    const [hasGenerated, setHasGenerated] = useState(false);

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
            setData(strategicGoalsData);
            setHasGenerated(true);
        }
    }, [strategicGoalsData]);

    const getProgressColor = (progress) => {
        if (progress >= 75) return 'progress-high';
        if (progress >= 50) return 'progress-medium';
        if (progress >= 25) return 'progress-low';
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
        const objectivesWithTimeline = objectives.map((objective, index) => ({
            ...objective,
            startMonth: objective.startMonth || (index * 2 + 1), // Stagger start months
            duration: objective.duration || 6 // Default 6-month duration
        }));

        return (
            <div className="gantt-container">
                <div className="gantt-header">
                    <BarChart3 size={20} />
                    <h5>Strategic Gnatt Chart</h5>
                </div>

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
        );
    };

    const renderOverallProgress = (progress, themes) => (
        <div className="overall-progress">
            <div className="progress-header">
                <Target size={20} />
                <h4>Overall Strategic Progress</h4>
            </div>

            <div className="progress-stats">
                <span className="progress-label">Annual Progress</span>
                <span className={`progress-value ${getProgressColor(progress)}`}>
                    {progress}%
                </span>
            </div>

            <div className="progress-bar">
                <div className={`progress-fill ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }} />
            </div>

            {themes && themes.length > 0 && (
                <div className="strategic-themes">
                    <h5>Strategic Themes</h5>
                    <div className="themes-list">
                        {themes.map((theme, index) => (
                            <span key={index} className="theme-tag">
                                {formatTheme(theme)}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderObjectiveCard = (objective, index) => (
        <div key={index} className={`objective-card priority-${objective.priority}`}>
            <div className="objective-header">
                <div>
                    <h4 className="objective-title">{objective.objective}</h4>
                    <div className="objective-meta">
                        <div className="alignment-badge">
                            {getAlignmentIcon(objective.alignment)}
                            <span>{formatAlignmentLabel(objective.alignment)} Strategy</span>
                        </div>
                    </div>
                </div>

                <div className={`priority-badge priority-${objective.priority}`}>
                    Priority {objective.priority}
                </div>
            </div>

            <div className="key-results">
                <h5>Key Results</h5>
                {objective.keyResults?.map((kr, krIndex) => (
                    <div key={krIndex} className="key-result-item">
                        <div className="kr-header">
                            <span className="kr-metric">{kr.metric}</span>
                            <div className="kr-target">
                                <Calendar size={14} />
                                <span>Target: {kr.target}</span>
                            </div>
                        </div>

                        <div className="kr-progress">
                            <div className="kr-progress-header">
                                <span className="kr-current">Current: {kr.current}</span>
                                <span className={`kr-percentage ${getProgressColor(kr.progress)}`}>
                                    {kr.progress}%
                                </span>
                            </div>
                            <div className="kr-progress-bar" style={{
                                width: '100%',
                                height: '8px',
                                backgroundColor: '#f0f0f0',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div className={`kr-progress-fill ${getProgressColor(kr.progress)}`}
                                    style={{
                                        width: `${Math.min(kr.progress || 0, 100)}%`,
                                        height: '100%',
                                        backgroundColor: kr.progress >= 75 ? '#10b981' :
                                            kr.progress >= 50 ? '#f59e0b' :
                                                kr.progress >= 25 ? '#ef4444' : '#dc2626',
                                        borderRadius: '4px',
                                        transition: 'width 0.3s ease-in-out'
                                    }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Loading state
    if (isRegenerating) {
        return (
            <div className="strategic-goals-container">
                <div className="cs-header">
                    <div className="cs-title-section">
                        <Target size={24} />
                        <h2 className="cs-title">OKRs & Strategic Goals</h2>
                    </div>
                </div>
                <div className="loading-state">
                    <Loader size={32} className="spinner" />
                    <p>Generating strategic goals and OKRs...</p>
                </div>
            </div>
        );
    }

    // No data state
    if (!hasGenerated && !data) {
        const answeredCount = Object.keys(userAnswers).length;
        return (
            <div className="strategic-goals-container">
                <div className="cs-header">
                    <div className="cs-title-section">
                        <Target size={24} />
                        <h2 className="cs-title">OKRs & Strategic Goals</h2>
                    </div>
                    <RegenerateButton
                        onRegenerate={handleRegenerate}
                        isRegenerating={isRegenerating}
                        canRegenerate={canRegenerate}
                        sectionName="Strategic Goals"
                        size="medium"
                        buttonText="Generate"
                    />
                </div>

                <div className="empty-state">
                    <Target size={48} className="empty-icon" />
                    <h3>Strategic Goals & OKR Analysis</h3>
                    <p>
                        {answeredCount < 3
                            ? `Answer ${3 - answeredCount} more questions to generate strategic goals and OKR insights.`
                            : "Strategic goals and OKR analysis will be generated automatically after completing the initial phase."
                        }
                    </p>
                </div>
            </div>
        );
    }

    // No data available but has attempted generation
    if (!data) {
        return (
            <div className="strategic-goals-container">
                <div className="cs-header">
                    <div className="cs-title-section">
                        <Target size={24} />
                        <h2 className="cs-title">OKRs & Strategic Goals</h2>
                    </div>
                    <RegenerateButton
                        onRegenerate={handleRegenerate}
                        isRegenerating={isRegenerating}
                        canRegenerate={canRegenerate}
                        sectionName="Strategic Goals"
                        size="medium"
                    />
                </div>
                <div className="empty-state">
                    <div className="empty-icon">⚠️</div>
                    <h3>Analysis Error</h3>
                    <p>Unable to generate strategic goals. Please try regenerating or check your inputs.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="strategic-goals-container">
            <div className="cs-header">
                <div className="cs-title-section">
                    <Target size={24} />
                    <h2 className="cs-title">OKRs & Strategic Goals</h2>
                </div>
                <RegenerateButton
                    onRegenerate={handleRegenerate}
                    isRegenerating={isRegenerating}
                    canRegenerate={canRegenerate}
                    sectionName="Strategic Goals"
                    size="medium"
                />
            </div>

            <div className="goals-content">
                {/* Overall Progress Section */}
                {data.overallProgress !== undefined && renderOverallProgress(data.overallProgress, data.themes)}


                {/* Gantt Chart: Timeline of strategic initiatives */}
                {data.objectives && renderGanttChart(data.objectives)}




                {/* Progress bars: OKR completion status */}
                {data.objectives && data.objectives.length > 0 && (
                    <div className="objectives-section">

                        <div className="gantt-header">
                            <BarChart3 size={20} />
                            <h5>OKR Completion Status</h5>
                        </div>
                        {data.objectives.map((objective, index) =>
                            renderObjectiveCard(objective, index)
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrategicGoals;