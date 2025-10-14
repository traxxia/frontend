import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, TrendingUp, TrendingDown, BarChart3, Grid3x3, Target, Info } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const ExpandedCapabilityHeatmap = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    expandedCapabilityData = null,
    selectedBusinessId,
    onRedirectToBrief
}) => {
    const [data, setData] = useState(expandedCapabilityData);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [error, setError] = useState(null);
    const [hoveredCell, setHoveredCell] = useState(null);

    const handleRedirectToBrief = (missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    };

    const handleMissingQuestionsCheck = async () => {
        const analysisConfig = ANALYSIS_TYPES.expandedCapability;

        await checkMissingQuestionsAndRedirect(
            'expandedCapability',
            selectedBusinessId,
            handleRedirectToBrief,
            {
                displayName: analysisConfig.displayName,
                customMessage: analysisConfig.customMessage
            }
        );
    };

    const handleRegenerate = async () => {
        if (onRegenerate) {
            onRegenerate();
        }
    };

    // Handle retry for error state
    const handleRetry = () => {
        setError(null);
        if (onRegenerate) {
            onRegenerate();
        }
    };

    const isExpandedCapabilityDataIncomplete = (data) => {
        if (!data) return true;
        let normalizedData;
        if (data.expandedCapabilityHeatmap) {
            normalizedData = data;
        } else if (data.expanded_capability_heatmap) {
            normalizedData = { expandedCapabilityHeatmap: data.expanded_capability_heatmap };
        } else if (data.capabilities) {
            normalizedData = { expandedCapabilityHeatmap: data };
        } else {
            return true;
        }

        if (!normalizedData.expandedCapabilityHeatmap) {
            return true;
        }

        const heatmap = normalizedData.expandedCapabilityHeatmap;
        const hasCapabilities = heatmap.capabilities && heatmap.capabilities.length > 0;
        return !hasCapabilities;
    };

    useEffect(() => {
        if (expandedCapabilityData) {
            let normalizedData;
            if (expandedCapabilityData.expandedCapabilityHeatmap) {
                normalizedData = expandedCapabilityData;
            } else if (expandedCapabilityData.expanded_capability_heatmap) {
                normalizedData = { expandedCapabilityHeatmap: expandedCapabilityData.expanded_capability_heatmap };
            } else if (expandedCapabilityData.capabilities) {
                normalizedData = { expandedCapabilityHeatmap: expandedCapabilityData };
            } else {
                normalizedData = null;
            }

            if (normalizedData) {
                setData(normalizedData);
                setHasGenerated(true);
                setError(null);
            } else {
                setData(null);
                setHasGenerated(false);
            }
        } else {
            setData(null);
            setHasGenerated(false);
        }
    }, [expandedCapabilityData]);

    const maturityLevels = [1, 2, 3, 4, 5];
    const maturityLabels = ['Initial', 'Developing', 'Defined', 'Managed', 'Optimizing'];

    const getMaturityColor = (maturityLevel, intensity = 1) => {
        const colors = {
            1: `rgba(239, 68, 68, ${intensity})`,    // Vibrant Red
            2: `rgba(249, 115, 22, ${intensity})`,   // Vibrant Orange  
            3: `rgba(59, 130, 246, ${intensity})`,   // Vibrant Blue
            4: `rgba(34, 197, 94, ${intensity})`,    // Vibrant Green
            5: `rgba(168, 85, 247, ${intensity})`    // Vibrant Purple
        };
        return colors[maturityLevel] || `rgba(107, 114, 128, ${intensity})`;
    };

    const getPerformanceIcon = (rating) => {
        const iconProps = { size: 12 };
        const icons = {
            'high': <TrendingUp {...iconProps} color="#22c55e" />,
            'medium': <BarChart3 {...iconProps} color="#f59e0b" />,
            'low': <TrendingDown {...iconProps} color="#ef4444" />
        };
        return icons[rating?.toLowerCase()] || <BarChart3 {...iconProps} color="#6b7280" />;
    };

    const getHeatmapData = () => {
        if (!data?.expandedCapabilityHeatmap?.capabilities || !Array.isArray(data.expandedCapabilityHeatmap.capabilities)) {
            return null;
        }

        const capabilities = data.expandedCapabilityHeatmap.capabilities;
        const businessFunctions = [...new Set(capabilities.map(cap => cap.category))].sort();
        const heatmapMatrix = {};
        businessFunctions.forEach(func => {
            heatmapMatrix[func] = {};
            maturityLevels.forEach(level => {
                heatmapMatrix[func][level] = [];
            });
        });
        capabilities.forEach(capability => {
            const category = capability.category;
            const level = capability.maturityLevel;

            if (heatmapMatrix[category] && heatmapMatrix[category][level]) {
                heatmapMatrix[category][level].push(capability);
            }
        });

        return { businessFunctions, heatmapMatrix };
    };

    const renderHeatmapCell = (businessFunction, maturityLevel, capabilities) => {
        const cellKey = `${businessFunction}-${maturityLevel}`;
        const isEmpty = capabilities.length === 0;
        const allCellCounts = [];
        if (data?.expandedCapabilityHeatmap?.capabilities) {
            const heatmapData = getHeatmapData();
            if (heatmapData) {
                Object.values(heatmapData.heatmapMatrix).forEach(row => {
                    Object.values(row).forEach(cells => {
                        allCellCounts.push(cells.length);
                    });
                });
            }
        }

        const maxCapabilitiesInAnyCell = allCellCounts.length > 0 ? Math.max(...allCellCounts) : 1;
        const intensity = isEmpty ? 0.1 : Math.min((capabilities.length / maxCapabilitiesInAnyCell) * 0.8 + 0.2, 1);

        return (
            <div
                key={cellKey}
                className={`heatmap-cell ${capabilities.length > 0 ? 'interactive' : ''}`}
                style={{ backgroundColor: getMaturityColor(maturityLevel, intensity) }}
                onMouseEnter={() => capabilities.length > 0 && setHoveredCell(cellKey)}
                onMouseLeave={() => setHoveredCell(null)}
            >
                {capabilities.length > 0 && (
                    <>
                        <div className={`cell-count ${intensity > 0.5 ? 'light-text' : 'dark-text'}`}>
                            {capabilities.length}
                        </div>
                        <div className={`cell-label ${intensity > 0.5 ? 'light-text' : 'dark-text'}`}>
                            {capabilities.length === 1 ? 'capability' : 'capabilities'}
                        </div>
                    </>
                )}

                {hoveredCell === cellKey && capabilities.length > 0 && (
                    <div className="heatmap-tooltip">
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
                            {businessFunction} - Level {maturityLevel}
                        </div>
                        {capabilities.map((cap, idx) => (
                            <div key={idx} className="tooltip-capability">
                                {getPerformanceIcon(cap.performanceRating)}
                                <span>{cap.name}</span>
                                {cap.enablesDifferentiator && (
                                    <span className="differentiator-badge">★</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderCapabilityGaps = (gaps) => (
        <div className="capability-gaps">
            <h4 className="gaps-header">
                <Target size={20} color="#f59e0b" />
                Priority Capability Gaps
            </h4>
            <div className="gaps-grid">
                {gaps.slice(0, 6).map((gap, index) => (
                    <div key={index} className="gap-item">
                        <div className="gap-capability">
                            {gap.capability}
                        </div>
                        <div className="gap-details">
                            <span style={{ textTransform: 'capitalize' }}>{gap.currentLevel}</span>
                            <span>→</span>
                            <span style={{ textTransform: 'capitalize' }}>{gap.requiredLevel}</span>
                            <span className={`gap-impact ${gap.businessImpact}`}>
                                {gap.businessImpact}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (isRegenerating) {
        return (
            <div className="expanded-capability-heatmap">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>
                        {isRegenerating
                            ? "Regenerating expanded capability analysis..."
                            : "Generating expanded capability analysis..."
                        }
                    </span>
                </div>
            </div>
        );
    }

    // Single consolidated error state for all error conditions
    if (error || 
        (!hasGenerated && !data && Object.keys(userAnswers).length > 0) ||
        (data && !data?.expandedCapabilityHeatmap) ||
        (data && !getHeatmapData())) {
        
        let errorMessage = error;
        if (!errorMessage) {
            if (!hasGenerated && !data && Object.keys(userAnswers).length > 0) {
                errorMessage = "Unable to generate expanded capability analysis. Please try regenerating or check your inputs.";
            } else if (data && !data?.expandedCapabilityHeatmap) {
                errorMessage = "The expanded capability data received is not in the expected format. Please regenerate the analysis.";
            } else if (data && !getHeatmapData()) {
                errorMessage = "Unable to generate capability heatmap. Please try regenerating.";
            }
        }

        return (
            <div className="expanded-capability-heatmap">
                <AnalysisError 
                    error={errorMessage}
                    onRetry={handleRetry}
                    title="Expanded Capability Analysis Error"
                />
            </div>
        );
    }

    if (!expandedCapabilityData || isExpandedCapabilityDataIncomplete(expandedCapabilityData)) {
        return (
            <div className="expanded-capability-heatmap">
                <AnalysisEmptyState
                    analysisType="expandedCapability"
                    analysisDisplayName="Expanded Capability Analysis"
                    icon={Grid3x3}
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

    const heatmapData = getHeatmapData();
    const { businessFunctions, heatmapMatrix } = heatmapData;
    const capabilities = data?.expandedCapabilityHeatmap?.capabilities || [];
    const capabilityGaps = data?.expandedCapabilityHeatmap?.capabilityGaps || [];

    return (
        <div className="expanded-capability-heatmap">
            {/* Legend */}
            <div className="heatmap-legend">
                <div className="legend-info">
                    <Info size={16} color="#6b7280" />
                    <span className="legend-label">Maturity Levels:</span>
                </div>
                {maturityLevels.map((level, index) => (
                    <div key={level} className="legend-item">
                        <div
                            className="legend-color"
                            style={{ backgroundColor: getMaturityColor(level) }}
                        />
                        <span className="legend-text">
                            L{level}: {maturityLabels[index]}
                        </span>
                    </div>
                ))}
            </div>

            <div
                className="heatmap-grid"
                style={{ gridTemplateColumns: `200px repeat(${maturityLevels.length}, 1fr)` }}
            >
                <div className="heatmap-header-cell">Business Function</div>
                {maturityLevels.map((level, index) => (
                    <div key={level} className="heatmap-header-maturity">
                        <div className="maturity-level-number">Level {level}</div>
                        <div className="maturity-level-name">{maturityLabels[index]}</div>
                    </div>
                ))}
                {businessFunctions.map(businessFunction => (
                    <React.Fragment key={businessFunction}>
                        <div className="heatmap-row-header">{businessFunction}</div>
                        {maturityLevels.map(level =>
                            renderHeatmapCell(
                                businessFunction,
                                level,
                                heatmapMatrix[businessFunction][level]
                            )
                        )}
                    </React.Fragment>
                ))}
            </div>

            {capabilityGaps.length > 0 && renderCapabilityGaps(capabilityGaps)}
        </div>
    );
};

export default ExpandedCapabilityHeatmap;