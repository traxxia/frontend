import React, { useState, useEffect } from 'react';
import {
    Loader, TrendingUp, TrendingDown, Target, AlertTriangle, Star, Award, Clock, Zap,
    ChevronDown, ChevronRight, Shield, Users, BarChart3, Lightbulb, PieChart,
    DollarSign, Activity, Map, CheckCircle, XCircle
} from 'lucide-react';
import '../styles/EssentialPhase.css';
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const FullSWOTPortfolio = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    fullSwotData = null,
    selectedBusinessId,
    onRedirectToBrief
}) => {
    const [data, setData] = useState(fullSwotData);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        strengths: true,
        weaknesses: true,
        opportunities: true,
        threats: true,
        strategicOptions: true,
        riskAssessment: true,
        competitivePositioning: true
    });

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

    // Check if the full swot data is empty/incomplete
    const isFullSwotDataIncomplete = (data) => {
        if (!data) return true;

        // Handle both wrapped and direct API response formats
        let normalizedData;
        if (data.swotPortfolio) {
            normalizedData = data;
        } else if (data.strengths || data.weaknesses) {
            normalizedData = { swotPortfolio: data };
        } else {
            return true;
        }

        // Check if swotPortfolio exists
        if (!normalizedData.swotPortfolio) {
            return true;
        }

        const portfolio = normalizedData.swotPortfolio;
        const hasStrengths = portfolio.strengths && portfolio.strengths.length > 0;
        const hasWeaknesses = portfolio.weaknesses && portfolio.weaknesses.length > 0;
        const hasOpportunities = portfolio.opportunities && portfolio.opportunities.length > 0;
        const hasThreats = portfolio.threats && portfolio.threats.length > 0;

        const sectionsWithData = [hasStrengths, hasWeaknesses, hasOpportunities, hasThreats].filter(Boolean).length;
        return sectionsWithData < 2;
    };

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    useEffect(() => {
        if (fullSwotData) {
            // Handle both wrapped and direct API response formats
            let normalizedData;
            if (fullSwotData.swotPortfolio) {
                // Data is already wrapped
                normalizedData = fullSwotData;
            } else if (fullSwotData.strengths || fullSwotData.weaknesses) {
                // Data is direct from API, needs wrapping
                normalizedData = { swotPortfolio: fullSwotData };
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
    }, [fullSwotData]);

    const getScoreColor = (score) => {
        if (score >= 8) return 'high-intensity';
        if (score >= 6) return 'medium-intensity';
        return 'low-intensity';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'high-intensity',
            'medium': 'medium-intensity',
            'low': 'low-intensity'
        };
        return colors[priority.toLowerCase()] || 'medium-intensity';
    };

    const getLikelihoodColor = (likelihood) => {
        if (likelihood >= 4) return 'high-intensity';
        if (likelihood >= 3) return 'medium-intensity';
        return 'low-intensity';
    };

    // Loading state
    if (isRegenerating) {
        return (
            <div className="porters-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>
                        {isRegenerating
                            ? "Regenerating Full SWOT Portfolio..."
                            : "Generating Full SWOT Portfolio..."
                        }
                    </span>
                </div>
            </div>
        );
    }

    // Consolidated error state for all error conditions
    if (error || 
        (!hasGenerated && !data && Object.keys(userAnswers).length > 0) ||
        (data && !data?.swotPortfolio)) {
        
        let errorMessage = error;
        if (!errorMessage) {
            if (!hasGenerated && !data && Object.keys(userAnswers).length > 0) {
                errorMessage = "Unable to generate Full SWOT Portfolio analysis. Please try regenerating or check your inputs.";
            } else if (data && !data?.swotPortfolio) {
                errorMessage = "The Full SWOT Portfolio data received is not in the expected format. Please regenerate the analysis.";
            }
        }

        return (
            <div className="porters-container">
                <AnalysisError 
                    error={errorMessage}
                    onRetry={handleRetry}
                    title="Full SWOT Portfolio Analysis Error"
                />
            </div>
        );
    }

    // Check if data is incomplete and show missing questions checker
    if (!fullSwotData || isFullSwotDataIncomplete(fullSwotData)) {
        return (
            <div className="porters-container">
                <AnalysisEmptyState
                    analysisType="fullSwot"
                    analysisDisplayName="Full SWOT Portfolio"
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

    const portfolio = data.swotPortfolio;

    return (
        <div className="porters-container full-swot-container"
            data-analysis-type="fullSwot"
            data-analysis-name="Full SWOT Portfolio"
            data-analysis-order="8">

            {/* Overall Strategic Score */}
            {portfolio.overallStrategicScore && (
                <div className="">
                    <h4>
                        <BarChart3 size={24} />
                        Overall Strategic Score: {portfolio.overallStrategicScore}

                    </h4>
                </div>
            )}

            <div className="section-container">
                <div className="section-header" onClick={() => toggleSection('threats')}>
                    <h5>
                        Full SWOT
                    </h5>
                    {expandedSections.threats ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                <div className='table-container'>
                    {portfolio.strengths && portfolio.strengths.length > 0 && (
                        <>
                            {expandedSections.strengths && (
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
                                                <td>{item.item}</td>
                                                <td>
                                                    {item.score && (
                                                        <span className={`status-badge ${getScoreColor(item.score)}`}>
                                                            {item.score}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="force-tag">
                                                        {item.category?.replace(/_/g, ' ') || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {item.competitiveAdvantage ? (
                                                        <span className="status-badge high-intensity">
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span className="status-badge low-intensity">
                                                            No
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {item.customerValidated ? (
                                                        <span className="status-badge high-intensity">
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span className="status-badge low-intensity">
                                                            No
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}

                    {/* Weaknesses Table */}
                    {portfolio.weaknesses && portfolio.weaknesses.length > 0 && (
                        <>
                            {expandedSections.weaknesses && (
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
                                                <td>{item.item}</td>
                                                <td>
                                                    {item.score && (
                                                        <span className={`status-badge ${getScoreColor(item.score)}`}>
                                                            {item.score}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="force-tag">
                                                        {item.category?.replace(/_/g, ' ') || 'N/A'}
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
                            )}
                        </>
                    )}

                    {/* Opportunities Table */}
                    {portfolio.opportunities && portfolio.opportunities.length > 0 && (
                        <>
                            {expandedSections.opportunities && (
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
                                                <td>{item.item}</td>
                                                <td>
                                                    {item.score && (
                                                        <span className={`status-badge ${getScoreColor(item.score)}`}>
                                                            {item.score}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="force-tag">
                                                        {item.category?.replace(/_/g, ' ') || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {item.marketTrend ? (
                                                        <span className="status-badge high-intensity">
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span className="status-badge low-intensity">
                                                            No
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {item.timeframe && (
                                                        <span className="timeline-badge">
                                                            {item.timeframe}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                    {portfolio.threats && portfolio.threats.length > 0 && (
                        <>
                            {expandedSections.threats && (
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
                                                <td>{item.item}</td>
                                                <td>
                                                    {item.score && (
                                                        <span className={`status-badge ${getScoreColor(item.score)}`}>
                                                            {item.score}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="force-tag">
                                                        {item.category?.replace(/_/g, ' ') || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {item.likelihood && (
                                                        <span className={`status-badge ${getPriorityColor(item.likelihood)}`}>
                                                            {item.likelihood}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {item.impact && (
                                                        <span className={`status-badge ${getPriorityColor(item.impact)}`}>
                                                            {item.impact}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}</div>
            </div>

            {/* Strategic Options Table */}
            {portfolio.strategicOptions && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('strategicOptions')}>
                        <h5>
                            Cross Dimensional Action Items
                        </h5>
                        {expandedSections.strategicOptions ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.strategicOptions && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Strategy Type</th>
                                        <th>Strategy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.strategicOptions.SO_strategies && portfolio.strategicOptions.SO_strategies.map((strategy, index) => (
                                        <tr key={`so-${index}`}>
                                            <td>
                                                <span className="force-tag" >
                                                    SO - Strengths-Opportunities
                                                </span>
                                            </td>
                                            <td>{strategy}</td>
                                        </tr>
                                    ))}
                                    {portfolio.strategicOptions.WO_strategies && portfolio.strategicOptions.WO_strategies.map((strategy, index) => (
                                        <tr key={`wo-${index}`}>
                                            <td>
                                                <span className="force-tag" >
                                                    WO - Weaknesses-Opportunities
                                                </span>
                                            </td>
                                            <td>{strategy}</td>
                                        </tr>
                                    ))}
                                    {portfolio.strategicOptions.ST_strategies && portfolio.strategicOptions.ST_strategies.map((strategy, index) => (
                                        <tr key={`st-${index}`}>
                                            <td>
                                                <span className="force-tag">
                                                    ST - Strengths-Threats
                                                </span>
                                            </td>
                                            <td>{strategy}</td>
                                        </tr>
                                    ))}
                                    {portfolio.strategicOptions.WT_strategies && portfolio.strategicOptions.WT_strategies.map((strategy, index) => (
                                        <tr key={`wt-${index}`}>
                                            <td>
                                                <span className="force-tag">
                                                    WT - Weaknesses-Threats
                                                </span>
                                            </td>
                                            <td>{strategy}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Risk Assessment Table */}
            {portfolio.riskAssessment && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('riskAssessment')}>
                        <h3>
                            Risk Assessment
                        </h3>
                        {expandedSections.riskAssessment ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.riskAssessment && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Risk Type</th>
                                        <th>Risk</th>
                                        <th>Likelihood</th>
                                        <th>Financial Impact</th>
                                        <th>Mitigation Measures</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.riskAssessment.operationalRisks && portfolio.riskAssessment.operationalRisks.map((risk, index) => (
                                        <tr key={`operational-${index}`}>
                                            <td>
                                                <span className="force-tag" >
                                                    Operational
                                                </span>
                                            </td>
                                            <td>{risk.risk}</td>
                                            <td>
                                                <span className={`status-badge ${getLikelihoodColor(risk.likelihood)}`}>
                                                    {risk.likelihood}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="status-badge medium-intensity">
                                                    {risk.potentialFinancialImpact}
                                                </span>
                                            </td>
                                            <td>{risk.mitigationMeasures}</td>
                                        </tr>
                                    ))}
                                    {portfolio.riskAssessment.strategicRisks && portfolio.riskAssessment.strategicRisks.map((risk, index) => (
                                        <tr key={`strategic-${index}`}>
                                            <td>
                                                <span className="force-tag">
                                                    Strategic
                                                </span>
                                            </td>
                                            <td>{risk.risk}</td>
                                            <td>
                                                <span className={`status-badge ${getLikelihoodColor(risk.likelihood)}`}>
                                                    {risk.likelihood}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="status-badge medium-intensity">
                                                    {risk.potentialFinancialImpact}
                                                </span>
                                            </td>
                                            <td>{risk.mitigationMeasures}</td>
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