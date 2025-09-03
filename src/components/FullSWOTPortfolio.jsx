import React, { useState, useEffect, useRef } from 'react';
import { 
    Loader, TrendingUp, TrendingDown, Target, AlertTriangle, Star, Award, Clock, Zap, 
    ChevronDown, ChevronRight, Shield, Users, BarChart3, Lightbulb, PieChart,
    DollarSign, Activity, Map, CheckCircle, XCircle
} from 'lucide-react';
import '../styles/EssentialPhase.css'; 
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const FullSWOTPortfolio = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating,
    canRegenerate = true,
    fullSwotData = null,
    selectedBusinessId,
    onRedirectToBrief
}) => {
    const [data, setData] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        strengths: true,
        weaknesses: true,
        opportunities: true,
        threats: true,
        strategicOptions: true,
        riskAssessment: true,
        competitivePositioning: true
    });
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

    const isFullSwotDataIncomplete = (data) => {
        if (!data) return true;
        if (!data.swotPortfolio) return true;

        const portfolio = data.swotPortfolio;
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
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        if (fullSwotData) {
            setData(fullSwotData);
            setHasGenerated(true);
            setError(null);
        }
    }, [fullSwotData]);

    useEffect(() => {
        if (fullSwotData) {
            setData(fullSwotData);
            setHasGenerated(true);
            setError(null);
        } else if (fullSwotData === null) {
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
                    <h5>Analysis Error</h5>
                    <p>{error}</p>
                    <button onClick={handleRegenerate} className="retry-button">
                        Retry Analysis
                    </button>
                </div>
            </div>
        );
    }

    // Check if data is incomplete
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

            {/* Overall Strategic Score */}
            {portfolio.overallStrategicScore && (
                <div className="">
                    <h4>
                            <BarChart3 size={24} />
                            Overall Strategic Score: {portfolio.overallStrategicScore} 
                            
                        </h4>
                </div>
            )}

            {/* Strengths Table */}
            {portfolio.strengths && portfolio.strengths.length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('strengths')}>
                        <h5>
                            <TrendingUp size={20} />
                            Strengths 
                        </h5>
                        {expandedSections.strengths ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.strengths && (
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
                                                        <Award size={12} />
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="status-badge low-intensity">
                                                        <XCircle size={12} />
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {item.customerValidated ? (
                                                    <span className="status-badge high-intensity">
                                                        <Star size={12} />
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="status-badge low-intensity">
                                                        <XCircle size={12} />
                                                        No
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

            {/* Weaknesses Table */}
            {portfolio.weaknesses && portfolio.weaknesses.length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('weaknesses')}>
                        <h5>
                            <TrendingDown size={20} />
                            Weaknesses 
                        </h5>
                        {expandedSections.weaknesses ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.weaknesses && (
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
                        </div>
                    )}
                </div>
            )}

            {/* Opportunities Table */}
            {portfolio.opportunities && portfolio.opportunities.length > 0 && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('opportunities')}>
                        <h5>
                            <Target size={20} />
                            Opportunities 
                        </h5>
                        {expandedSections.opportunities ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.opportunities && (
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
                                                        <TrendingUp size={12} />
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="status-badge low-intensity">
                                                        <XCircle size={12} />
                                                        No
                                                    </span>
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
                        <h5>
                            <AlertTriangle size={20} />
                            Threats 
                        </h5>
                        {expandedSections.threats ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.threats && (
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
                        </div>
                    )}
                </div>
            )}

            {/* Strategic Options Table */}
            {portfolio.strategicOptions && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('strategicOptions')}>
                        <h5>
                            <Lightbulb size={20} />
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
                            <Shield size={20} />
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
                                                    <Activity size={12} />
                                                    Operational
                                                </span>
                                            </td>
                                            <td><strong>{risk.risk}</strong></td>
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
                                                    <Target size={12} />
                                                    Strategic
                                                </span>
                                            </td>
                                            <td><strong>{risk.risk}</strong></td>
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

            {/* Competitive Positioning Table */}
            {portfolio.competitivePositioning && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('competitivePositioning')}>
                        <h3>
                            <PieChart size={20} />
                            Competitive Positioning
                        </h3>
                        {expandedSections.competitivePositioning ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.competitivePositioning && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Positioning Aspect</th>
                                        <th>Details</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.competitivePositioning.marketShare && (
                                        <tr>
                                            <td>
                                                <strong>
                                                    <BarChart3 size={16} />
                                                    Market Share
                                                </strong>
                                            </td>
                                            <td>{portfolio.competitivePositioning.marketShare}</td>
                                            <td>
                                                <span className="status-badge medium-intensity">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                    {portfolio.competitivePositioning.competitiveAdvantage && (
                                        <tr>
                                            <td>
                                                <strong>
                                                    <Award size={16} />
                                                    Competitive Advantage
                                                </strong>
                                            </td>
                                            <td>{portfolio.competitivePositioning.competitiveAdvantage}</td>
                                            <td>
                                                <span className="status-badge high-intensity">
                                                    Strong
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                    {portfolio.competitivePositioning.customerSegments && portfolio.competitivePositioning.customerSegments.length > 0 && (
                                        <tr>
                                            <td>
                                                <strong>
                                                    <Users size={16} />
                                                    Customer Segments
                                                </strong>
                                            </td>
                                            <td>
                                                {portfolio.competitivePositioning.customerSegments.map((segment, index) => (
                                                    <span key={index} className="force-tag" style={{marginRight: '4px'}}>
                                                        {segment}
                                                    </span>
                                                ))}
                                            </td>
                                            <td>
                                                <span className="status-badge medium-intensity">
                                                    {portfolio.competitivePositioning.customerSegments.length} Segments
                                                </span>
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
    );
};

export default FullSWOTPortfolio;