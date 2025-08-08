import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, TrendingUp, TrendingDown, BarChart3, Grid3x3, Target, Info } from 'lucide-react';

const ExpandedCapabilityHeatmap = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    expandedCapabilityData = null,
    selectedBusinessId
}) => {
    const [data, setData] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [hoveredCell, setHoveredCell] = useState(null);

    // Vibrant color scheme for maturity levels
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

    useEffect(() => {
        if (expandedCapabilityData) {
            setData(expandedCapabilityData);
            setHasGenerated(true);
        } else {
            setData(null);
            setHasGenerated(false);
        }
    }, [expandedCapabilityData]);

    const getHeatmapData = () => {
        if (!data?.capabilities || !Array.isArray(data.capabilities)) {
            return null;
        }

        const capabilities = data.capabilities;
        
        // Extract unique business functions (categories) and sort them
        const businessFunctions = [...new Set(capabilities.map(cap => cap.category))].sort();

        // Create matrix structure: businessFunction -> maturityLevel -> capabilities[]
        const heatmapMatrix = {};
        businessFunctions.forEach(func => {
            heatmapMatrix[func] = {};
            maturityLevels.forEach(level => {
                heatmapMatrix[func][level] = [];
            });
        });

        // Populate matrix with capabilities
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
        
        // Calculate intensity based on number of capabilities in this cell
        // Find the maximum number of capabilities in any single cell for normalization
        const allCellCounts = [];
        if (data?.capabilities) {
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

    const renderPlaceholderState = () => (
        <div className="expanded-capability-heatmap">
            <div className="cs-header">
                <div className="cs-title-section">
                    <Grid3x3 size={24} />
                    <h2 className="cs-title">Expanded Capability Heatmap</h2>
                </div>
            </div>
            <div className="placeholder-content">
                <div className="placeholder-icon">🎯</div>
                <p className="placeholder-text">
                    Expanded capability analysis will appear here once essential phase is completed.
                </p>
            </div>
        </div>
    );

    const renderLoadingState = () => (
        <div className="expanded-capability-heatmap">
            <div className="cs-header">
                <div className="cs-title-section">
                    <Grid3x3 size={24} />
                    <h2 className="cs-title">Expanded Capability Heatmap</h2>
                </div>
            </div>
            <div className="loading-state">
                <Loader size={32} className="loading-spinner" />
                <p className="loading-text">Generating expanded capability heatmap...</p>
            </div>
        </div>
    );

    const renderErrorState = () => (
        <div className="expanded-capability-heatmap">
            <div className="cs-header">
                <div className="cs-title-section">
                    <Grid3x3 size={24} />
                    <h2 className="cs-title">Expanded Capability Heatmap</h2>
                </div>
                {canRegenerate && onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        className="regenerate-button"
                        disabled={isRegenerating}
                    >
                        <RefreshCw size={16} />
                        Generate
                    </button>
                )}
            </div>
            <div className="error-state">
                <p className="error-text">
                    Unable to generate expanded capability heatmap. Please try regenerating.
                </p>
            </div>
        </div>
    );

    // Decision logic
    if (isRegenerating) {
        return renderLoadingState();
    }

    if (!hasGenerated && !data) {
        return renderPlaceholderState();
    }

    const heatmapData = getHeatmapData();
    if (!heatmapData) {
        return renderErrorState();
    }

    const { businessFunctions, heatmapMatrix } = heatmapData;
    const capabilities = data?.capabilities || [];
    const capabilityGaps = data?.capabilityGaps || [];

    return (
        <div className="expanded-capability-heatmap">
            {/* Header */}
            <div className="cs-header">
                <div className="cs-title-section">
                    <Grid3x3 size={24} />
                    <h2 className="cs-title">Capability Maturity Heatmap</h2>
                </div>

                {canRegenerate && onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        className="regenerate-button"
                        disabled={isRegenerating}
                    >
                        <RefreshCw size={16} />
                        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                    </button>
                )}
            </div>

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

            {/* Heatmap Grid */}
            <div
                className="heatmap-grid"
                style={{ gridTemplateColumns: `200px repeat(${maturityLevels.length}, 1fr)` }}
            >
                {/* Header Row */}
                <div className="heatmap-header-cell">Business Function</div>
                {maturityLevels.map((level, index) => (
                    <div key={level} className="heatmap-header-maturity">
                        <div className="maturity-level-number">Level {level}</div>
                        <div className="maturity-level-name">{maturityLabels[index]}</div>
                    </div>
                ))}

                {/* Data Rows */}
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
        </div>
    );
};

export default ExpandedCapabilityHeatmap;