import React, { useState, useEffect } from 'react';
import {
    Loader, TrendingUp, Target, Lightbulb, AlertTriangle, Award, 
    ChevronDown, ChevronRight, Shield, Users, BarChart3, Map, 
    DollarSign, Activity, Zap, Package, Globe, ArrowRight
} from 'lucide-react';
import '../styles/EssentialPhase.css';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const CoreAdjacency = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    coreAdjacencyData = null,
    selectedBusinessId,
    onRedirectToBrief
}) => {
    const [data, setData] = useState(coreAdjacencyData);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        coreBusinessDefinition: true,
        growthOpportunities: true,
        growthVectorCategorization: true,
        missingInformation: true,
        recommendedNextSteps: true
    });

    const handleRedirectToBrief = (missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    };

    const handleMissingQuestionsCheck = async () => {
        const analysisConfig = ANALYSIS_TYPES.coreAdjacency || {
            displayName: 'Core vs. Adjacency Analysis',
            customMessage: 'Complete your business brief to generate a comprehensive Core vs. Adjacency analysis.'
        };

        await checkMissingQuestionsAndRedirect(
            'coreAdjacency',
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

    const handleRetry = () => {
        setError(null);
        if (onRegenerate) {
            onRegenerate();
        }
    };

    const isCoreAdjacencyDataIncomplete = (data) => {
        if (!data) return true;

        const hasCore = data.coreBusinessDefinition && 
            (data.coreBusinessDefinition.keySegments?.length > 0 || 
             data.coreBusinessDefinition.primaryCapabilities?.length > 0 ||
             data.coreBusinessDefinition.profitDrivers?.length > 0);

        const hasGrowth = data.growthOpportunities && 
            (data.growthOpportunities.withinCore?.length > 0 ||
             data.growthOpportunities.adjacent?.length > 0 ||
             data.growthOpportunities.nonAdjacent?.length > 0);

        const hasVectors = data.growthVectorCategorization &&
            Object.values(data.growthVectorCategorization).some(arr => arr?.length > 0);

        const sectionsWithData = [hasCore, hasGrowth, hasVectors].filter(Boolean).length;
        return sectionsWithData < 2;
    };

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    useEffect(() => {
        if (coreAdjacencyData) {
            setData(coreAdjacencyData);
            setHasGenerated(true);
            setError(null);
        } else {
            setData(null);
            setHasGenerated(false);
        }
    }, [coreAdjacencyData]);

    const formatLabel = (key) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    const getSectionIcon = (sectionKey) => {
        const keyLower = sectionKey.toLowerCase();
        if (keyLower.includes('core') || keyLower.includes('definition')) return Shield;
        if (keyLower.includes('growth') && keyLower.includes('opportunit')) return TrendingUp;
        if (keyLower.includes('vector') || keyLower.includes('categori')) return Target;
        if (keyLower.includes('missing') || keyLower.includes('gap')) return AlertTriangle;
        if (keyLower.includes('recommend') || keyLower.includes('next')) return Lightbulb;
        return Activity;
    };

    // Loading state
    if (isRegenerating) {
        return (
            <div className="porters-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>
                        {isRegenerating
                            ? "Regenerating Core vs. Adjacency Analysis..."
                            : "Generating Core vs. Adjacency Analysis..."
                        }
                    </span>
                </div>
            </div>
        );
    }

    // Consolidated error state
    if (error || (!hasGenerated && !data && Object.keys(userAnswers).length > 0)) {
        let errorMessage = error;
        if (!errorMessage) {
            errorMessage = "Unable to generate Core vs. Adjacency analysis. Please try regenerating or check your inputs.";
        }

        return (
            <div className="porters-container">
                <AnalysisError 
                    error={errorMessage}
                    onRetry={handleRetry}
                    title="Core vs. Adjacency Analysis Error"
                />
            </div>
        );
    }

    // Check if data is incomplete
    if (!coreAdjacencyData || isCoreAdjacencyDataIncomplete(coreAdjacencyData)) {
        return (
            <div className="porters-container">
                <AnalysisEmptyState
                    analysisType="coreAdjacency"
                    analysisDisplayName="Core vs. Adjacency Analysis"
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
        <div className="porters-container full-swot-container"
            data-analysis-type="coreAdjacency"
            data-analysis-name="Core vs. Adjacency"
            data-analysis-order="10">

            {/* Core Business Definition Section */}
            {data.coreBusinessDefinition && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('coreBusinessDefinition')}>
                        <h5>
                            <Shield size={20} style={{ marginRight: '8px' }} />
                            Core Business Definition
                        </h5>
                        {expandedSections.coreBusinessDefinition ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.coreBusinessDefinition && (
                        <div className="table-container">
                            {data.coreBusinessDefinition.description && (
                                <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', marginBottom: '1rem' }}>
                                    <p style={{ margin: 0, lineHeight: '1.6' }}>{data.coreBusinessDefinition.description}</p>
                                </div>
                            )}
                            
                            <table className="data-table">
                                <tbody>
                                    {data.coreBusinessDefinition.keySegments && data.coreBusinessDefinition.keySegments.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="status-badge high-intensity">
                                                    Key Segments
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.coreBusinessDefinition.keySegments.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                    {data.coreBusinessDefinition.primaryCapabilities && data.coreBusinessDefinition.primaryCapabilities.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="status-badge high-intensity">
                                                    Primary Capabilities
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.coreBusinessDefinition.primaryCapabilities.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                    {data.coreBusinessDefinition.profitDrivers && data.coreBusinessDefinition.profitDrivers.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="status-badge high-intensity">
                                                    Profit Drivers
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.coreBusinessDefinition.profitDrivers.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Growth Opportunities Section */}
            {data.growthOpportunities && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('growthOpportunities')}>
                        <h5>
                            <TrendingUp size={20} style={{ marginRight: '8px' }} />
                            Growth Opportunities
                        </h5>
                        {expandedSections.growthOpportunities ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.growthOpportunities && (
                        <div className="table-container">
                            <table className="data-table">
                                <tbody>
                                    {data.growthOpportunities.withinCore && data.growthOpportunities.withinCore.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="status-badge high-intensity">
                                                    Within Core
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.growthOpportunities.withinCore.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                    {data.growthOpportunities.adjacent && data.growthOpportunities.adjacent.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="status-badge medium-intensity">
                                                    Adjacent
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.growthOpportunities.adjacent.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                    {data.growthOpportunities.nonAdjacent && data.growthOpportunities.nonAdjacent.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="status-badge low-intensity">
                                                    Non-Adjacent
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.growthOpportunities.nonAdjacent.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Growth Vector Categorization Section */}
            {data.growthVectorCategorization && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('growthVectorCategorization')}>
                        <h5>
                            <Target size={20} style={{ marginRight: '8px' }} />
                            Growth Vector Categorization
                        </h5>
                        {expandedSections.growthVectorCategorization ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.growthVectorCategorization && (
                        <div className="table-container">
                            <table className="data-table">
                                <tbody>
                                    {data.growthVectorCategorization.newChannels && data.growthVectorCategorization.newChannels.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="force-tag">
                                                    New Channels
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.growthVectorCategorization.newChannels.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                    {data.growthVectorCategorization.newBusinesses && data.growthVectorCategorization.newBusinesses.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="force-tag">
                                                    New Businesses
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.growthVectorCategorization.newBusinesses.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                    {data.growthVectorCategorization.newCustomerSegments && data.growthVectorCategorization.newCustomerSegments.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="force-tag">
                                                    New Customer Segments
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.growthVectorCategorization.newCustomerSegments.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                    {data.growthVectorCategorization.newProducts && data.growthVectorCategorization.newProducts.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="force-tag">
                                                    New Products
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.growthVectorCategorization.newProducts.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                    {data.growthVectorCategorization.newGeographies && data.growthVectorCategorization.newGeographies.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="force-tag">
                                                    New Geographies
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.growthVectorCategorization.newGeographies.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                    {data.growthVectorCategorization.newValueChainSteps && data.growthVectorCategorization.newValueChainSteps.length > 0 && (
                                        <tr>
                                            <td style={{ width: '30%' }}>
                                                <span className="force-tag">
                                                    New Value Chain Steps
                                                </span>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                    {data.growthVectorCategorization.newValueChainSteps.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Missing Information Section */}
            {data.missingInformation && data.missingInformation.gaps && data.missingInformation.gaps.length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('missingInformation')}>
                        <h5>
                            <AlertTriangle size={20} style={{ marginRight: '8px' }} />
                            Missing Information
                        </h5>
                        {expandedSections.missingInformation ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.missingInformation && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '10%' }}>#</th>
                                        <th>Information Gap</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.missingInformation.gaps.map((gap, idx) => (
                                        <tr key={idx}>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                                            <td>{gap}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {((data.missingInformation.internalDataSources && data.missingInformation.internalDataSources.length > 0) || 
                              (data.missingInformation.externalDataSources && data.missingInformation.externalDataSources.length > 0)) && (
                                <div style={{ marginTop: '1rem' }}>
                                    <table className="data-table">
                                        <tbody>
                                            {data.missingInformation.internalDataSources && data.missingInformation.internalDataSources.length > 0 && (
                                                <tr>
                                                    <td style={{ width: '30%' }}>
                                                        <span className="status-badge high-intensity" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Users size={16} />
                                                            Internal Data Sources
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                            {data.missingInformation.internalDataSources.map((source, idx) => (
                                                                <li key={idx}>{source}</li>
                                                            ))}
                                                        </ul>
                                                    </td>
                                                </tr>
                                            )}
                                            
                                            {data.missingInformation.externalDataSources && data.missingInformation.externalDataSources.length > 0 && (
                                                <tr>
                                                    <td style={{ width: '30%' }}>
                                                        <span className="status-badge medium-intensity" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Globe size={16} />
                                                            External Data Sources
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                            {data.missingInformation.externalDataSources.map((source, idx) => (
                                                                <li key={idx}>{source}</li>
                                                            ))}
                                                        </ul>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Recommended Next Steps Section */}
            {data.recommendedNextSteps && data.recommendedNextSteps.length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('recommendedNextSteps')}>
                        <h5>
                            <Lightbulb size={20} style={{ marginRight: '8px' }} />
                            Recommended Next Steps
                        </h5>
                        {expandedSections.recommendedNextSteps ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.recommendedNextSteps && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '10%' }}>Step</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recommendedNextSteps.map((step, idx) => (
                                        <tr key={idx}>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#0ea5e9' }}>
                                                {idx + 1}
                                            </td>
                                            <td>{step}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CoreAdjacency;