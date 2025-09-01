import React, { useState, useEffect, useRef } from 'react';
import { Loader, TrendingUp, TrendingDown, Target, AlertTriangle, Star, Award, Clock, Zap, ChevronDown, ChevronRight } from 'lucide-react';
import '../styles/EssentialPhase.css'; 
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const FullSWOTPortfolio = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate, // This is the key prop we need
    isRegenerating ,
    canRegenerate = true,
    fullSwotData = null,
    selectedBusinessId,
    onRedirectToBrief
}) => {
    const [data, setData] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});
    const [error, setError] = useState(null);

    const hasInitialized = useRef(false);

    const handleRedirectToBrief = (missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    };

    const handleMissingQuestionsCheck = async () => {
        const analysisConfig = ANALYSIS_TYPES.fullSwot; 
        
        await checkMissingQuestionsAndRedirect(
            'fullSwot', 
            selectedBusinessId,
            handleRedirectToBrief,
            {
                displayName: analysisConfig.displayName,
                customMessage: analysisConfig.customMessage
            }
        );
    };

    // Handle regenerate - this is the key function
    const handleRegenerate = async () => {
        console.log('FullSWOT handleRegenerate called', { onRegenerate: !!onRegenerate });
        
        if (onRegenerate) {
            try {
                await onRegenerate();
            } catch (error) {
                console.error('Error in FullSWOT regeneration:', error);
                setError(error.message || 'Failed to regenerate analysis');
            }
        } else {
            console.warn('No onRegenerate prop provided to FullSWOTPortfolio');
            setError('Regeneration not available');
        }
    };

    // Check if the full SWOT data is empty/incomplete
    const isFullSwotDataIncomplete = (data) => {
        if (!data) return true;

        // Check if swotPortfolio is empty or null
        if (!data.swotPortfolio) return true;

        const portfolio = data.swotPortfolio;

        // Check if all main sections are empty
        const hasStrengths = portfolio.strengths && portfolio.strengths.length > 0;
        const hasWeaknesses = portfolio.weaknesses && portfolio.weaknesses.length > 0;
        const hasOpportunities = portfolio.opportunities && portfolio.opportunities.length > 0;
        const hasThreats = portfolio.threats && portfolio.threats.length > 0;

        // At least 2 sections should have data for meaningful analysis
        const sectionsWithData = [hasStrengths, hasWeaknesses, hasOpportunities, hasThreats].filter(Boolean).length;

        return sectionsWithData < 2;
    };

    // Toggle section expansion
    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    // Initialize component
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        if (fullSwotData) {
            setData(fullSwotData);
            setHasGenerated(true);
            setError(null);
        }
    }, [fullSwotData]);

    // Update data when prop changes
    useEffect(() => {
        if (fullSwotData) {
            setData(fullSwotData);
            setHasGenerated(true);
            setError(null);
        } else if (fullSwotData === null) {
            // Only reset if explicitly set to null (during regeneration)
            setData(null);
            setHasGenerated(false);
        }
    }, [fullSwotData]);

    // Get category color
    const getCategoryColor = (category) => {
        const colors = {
            'product_feature': '#10b981',
            'service_quality': '#3b82f6',
            'internal_capability': '#f59e0b',
            'organizational_culture': '#8b5cf6',
            'marketing': '#ef4444',
            'customer_service': '#06b6d4',
            'market_trend': '#10b981',
            'geographic_expansion': '#3b82f6',
            'security': '#ef4444',
            'regulatory': '#f59e0b'
        };
        return colors[category] || '#6b7280';
    };

    // Get score color
    const getScoreColor = (score) => {
        if (score >= 8) return 'high-intensity';
        if (score >= 6) return 'medium-intensity';
        return 'low-intensity';
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'high-intensity',
            'medium': 'medium-intensity',
            'low': 'low-intensity'
        };
        return colors[priority] || 'medium-intensity';
    };

    // Loading state
    if (isRegenerating) {
        return (
            <div className="porters-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>Regenerating Full SWOT Portfolio...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="porters-container">
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Analysis Error</h3>
                    <p>{error}</p>
                    <button onClick={handleRegenerate} className="retry-button">
                        Retry Analysis
                    </button>
                </div>
            </div>
        );
    }

    // Check if data is incomplete and show missing questions checker
    if (!hasGenerated || !data?.swotPortfolio || isFullSwotDataIncomplete(data)) {
        return (
            <div className="porters-container"> 
                <AnalysisEmptyState
                    analysisType="fullSwot"
                    analysisDisplayName="Full SWOT Portfolio (Enhanced)"
                    icon={Target}
                    onImproveAnswers={handleMissingQuestionsCheck}
                    onRegenerate={canRegenerate && onRegenerate ? handleRegenerate : null}
                    isRegenerating={isRegenerating}
                    canRegenerate={canRegenerate && !!onRegenerate}
                    userAnswers={userAnswers}
                    minimumAnswersRequired={5}
                    customMessage="Complete essential phase questions to unlock enhanced SWOT analysis with competitive positioning and strategic options."
                /> 
            </div>
        );
    }

    const portfolio = data.swotPortfolio;

    return (
        <div className="porters-container full-swot-container" 
             data-analysis-type="fullSwot"
             data-analysis-name="Full SWOT Portfolio"
             data-analysis-order="8"> 

            {/* Strengths Table */}
            {portfolio.strengths && portfolio.strengths.length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('strengths')}>
                        <h3>
                            <TrendingUp size={20} />
                            Strengths ({portfolio.strengths.length})
                        </h3>
                        {expandedSections.strengths ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.strengths !== false && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Strength</th>
                                        <th>Score</th>
                                        <th>Category</th> 
                                        <th>Competitive Advantage</th>
                                        <th>Customer Validated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.strengths.map((item, index) => (
                                        <tr key={index}>
                                            <td><strong>{item.item}</strong></td>
                                            <td>
                                                {item.score && (
                                                    <span className={`status-badge ${getScoreColor(item.score)}`}>
                                                        {item.score}/10
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="force-tag">
                                                    {item.category?.replace('_', ' ')}
                                                </span>
                                            </td> 
                                            <td>
                                                {item.competitiveAdvantage ? (
                                                    <span className="status-badge high-intensity">
                                                        <Award size={12} />
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="status-badge low-intensity">No</span>
                                                )}
                                            </td>
                                            <td>
                                                {item.customerValidated ? (
                                                    <span className="status-badge high-intensity">
                                                        <Star size={12} />
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="status-badge low-intensity">No</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Weaknesses Table */}
            {portfolio.weaknesses && portfolio.weaknesses.length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('weaknesses')}>
                        <h3>
                            <TrendingDown size={20} />
                            Weaknesses ({portfolio.weaknesses.length})
                        </h3>
                        {expandedSections.weaknesses ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.weaknesses !== false && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Weakness</th>
                                        <th>Score</th>
                                        <th>Category</th> 
                                        <th>Improvement Priority</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.weaknesses.map((item, index) => (
                                        <tr key={index}>
                                            <td><strong>{item.item}</strong></td>
                                            <td>
                                                {item.score && (
                                                    <span className={`status-badge ${getScoreColor(item.score)}`}>
                                                        {item.score}/10
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="force-tag">
                                                    {item.category?.replace('_', ' ')}
                                                </span>
                                            </td> 
                                            <td>
                                                {item.improvementPriority && (
                                                    <span className={`status-badge ${getPriorityColor(item.improvementPriority)}`}>
                                                        {item.improvementPriority}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Opportunities Table */}
            {portfolio.opportunities && portfolio.opportunities.length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('opportunities')}>
                        <h3>
                            <Target size={20} />
                            Opportunities ({portfolio.opportunities.length})
                        </h3>
                        {expandedSections.opportunities ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.opportunities !== false && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Opportunity</th>
                                        <th>Score</th>
                                        <th>Category</th> 
                                        <th>Market Trend</th>
                                        <th>Timeframe</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.opportunities.map((item, index) => (
                                        <tr key={index}>
                                            <td><strong>{item.item}</strong></td>
                                            <td>
                                                {item.score && (
                                                    <span className={`status-badge ${getScoreColor(item.score)}`}>
                                                        {item.score}/10
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="force-tag">
                                                    {item.category?.replace('_', ' ')}
                                                </span>
                                            </td> 
                                            <td>
                                                {item.marketTrend ? (
                                                    <span className="status-badge high-intensity">
                                                        <TrendingUp size={12} />
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="status-badge low-intensity">No</span>
                                                )}
                                            </td>
                                            <td>
                                                {item.timeframe && (
                                                    <span className="timeline-badge">
                                                        <Clock size={12} />
                                                        {item.timeframe}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Threats Table */}
            {portfolio.threats && portfolio.threats.length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('threats')}>
                        <h3>
                            <AlertTriangle size={20} />
                            Threats ({portfolio.threats.length})
                        </h3>
                        {expandedSections.threats ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.threats !== false && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Threat</th>
                                        <th>Score</th>
                                        <th>Category</th> 
                                        <th>Likelihood</th>
                                        <th>Impact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.threats.map((item, index) => (
                                        <tr key={index}>
                                            <td><strong>{item.item}</strong></td>
                                            <td>
                                                {item.score && (
                                                    <span className={`status-badge ${getScoreColor(item.score)}`}>
                                                        {item.score}/10
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="force-tag">
                                                    {item.category?.replace('_', ' ')}
                                                </span>
                                            </td> 
                                            <td>
                                                {item.likelihood && (
                                                    <span className={`status-badge ${getPriorityColor(item.likelihood.toLowerCase())}`}>
                                                        {item.likelihood}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {item.impact && (
                                                    <span className={`status-badge ${getPriorityColor(item.impact.toLowerCase())}`}>
                                                        {item.impact}
                                                    </span>
                                                )}
                                            </td>
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

export default FullSWOTPortfolio;