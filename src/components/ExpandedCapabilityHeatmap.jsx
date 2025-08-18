import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, TrendingUp, TrendingDown, BarChart3, Grid3x3, Target, Info } from 'lucide-react'; 
import AnalysisEmptyState from './AnalysisEmptyState';
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
    onRedirectToBrief // Add this prop
}) => {
    const [data, setData] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [hoveredCell, setHoveredCell] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
    const getAuthToken = () => sessionStorage.getItem('token');

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

    // Check if a value contains "NOT ENOUGH DATA" (case-insensitive)
    const hasNotEnoughDataValue = (value) => {
        if (typeof value === 'string') {
            return value.toUpperCase().includes('NOT ENOUGH DATA');
        }
        return false;
    };

    // Check if any data contains "NOT ENOUGH DATA"
    const containsNotEnoughData = (data) => {
        if (!data) return false;

        // Check capabilities array
        if (data.capabilities && Array.isArray(data.capabilities)) {
            for (const capability of data.capabilities) {
                if (hasNotEnoughDataValue(capability.name) ||
                    hasNotEnoughDataValue(capability.category) ||
                    hasNotEnoughDataValue(capability.performanceRating) ||
                    hasNotEnoughDataValue(capability.maturityLevel)) {
                    return true;
                }
            }
        }

        // Check capability gaps
        if (data.capabilityGaps && Array.isArray(data.capabilityGaps)) {
            for (const gap of data.capabilityGaps) {
                if (hasNotEnoughDataValue(gap.capability) ||
                    hasNotEnoughDataValue(gap.currentLevel) ||
                    hasNotEnoughDataValue(gap.requiredLevel) ||
                    hasNotEnoughDataValue(gap.businessImpact)) {
                    return true;
                }
            }
        }

        return false;
    };

    // Check if the expanded capability data is empty/incomplete
    const isExpandedCapabilityDataIncomplete = (data) => {
        if (!data) return true;
        
        // Check if the data structure exists
        let processedData = null;
        
        if (data.expandedCapabilityHeatmap) {
            processedData = data.expandedCapabilityHeatmap;
        } else if (data.expanded_capability_heatmap) {
            processedData = data.expanded_capability_heatmap;
        } else if (data.capabilities && Array.isArray(data.capabilities)) {
            processedData = data;
        } else {
            processedData = data;
        }
        
        // Check for "NOT ENOUGH DATA" values
        if (containsNotEnoughData(processedData)) return true;
        
        // Check if capabilities array is empty or null
        if (!processedData?.capabilities || !Array.isArray(processedData.capabilities) || processedData.capabilities.length === 0) {
            return true;
        }
        
        // Check if capabilities have essential data
        const hasValidCapabilities = processedData.capabilities.some(capability => 
            capability.name && 
            capability.category &&
            capability.maturityLevel
        );
        
        return !hasValidCapabilities;
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
            
            // Handle different API response structures
            let processedData = null;
            
            if (expandedCapabilityData.expandedCapabilityHeatmap) {
                // When data comes from generateExpandedCapability function
                processedData = expandedCapabilityData.expandedCapabilityHeatmap;
            } else if (expandedCapabilityData.expanded_capability_heatmap) {
                // Alternative API response structure
                processedData = expandedCapabilityData.expanded_capability_heatmap;
            } else if (expandedCapabilityData.capabilities && Array.isArray(expandedCapabilityData.capabilities)) {
                // Direct capability data structure
                processedData = expandedCapabilityData;
            } else {
                // Fallback - use the data as-is
                processedData = expandedCapabilityData;
            } 
            
            // Validate that the processed data has the expected structure and doesn't contain "NOT ENOUGH DATA"
            if (processedData && processedData.capabilities && Array.isArray(processedData.capabilities) && !containsNotEnoughData(processedData)) {
                setData(processedData);
                setHasGenerated(true);
            } else {
                console.error('Invalid data structure or insufficient data for ExpandedCapabilityHeatmap:', processedData);
                setData(null);
                setHasGenerated(false);
            }
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

    const renderLoadingState = () => (
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

    const renderErrorState = () => (
        <div className="expanded-capability-heatmap"> 
            <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3>Analysis Error</h3>
                <p>Unable to generate expanded capability heatmap. Please try regenerating.</p>
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

    // Loading State
    if (isRegenerating) {
        return renderLoadingState();
    }

    // Check if data is incomplete (including "NOT ENOUGH DATA" values) and show missing questions checker
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
    if (!heatmapData) {
        return renderErrorState();
    }

    const { businessFunctions, heatmapMatrix } = heatmapData;
    const capabilities = data?.capabilities || [];
    const capabilityGaps = data?.capabilityGaps || [];

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

            {/* Capability Gaps Section */}
            {capabilityGaps.length > 0 && renderCapabilityGaps(capabilityGaps)}
        </div>
    );
};

export default ExpandedCapabilityHeatmap;