import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Loader, TrendingUp, TrendingDown, Target, AlertTriangle, Star, Award, Clock, Zap, ChevronDown, ChevronRight } from 'lucide-react';
import '../styles/EssentialPhase.css';
import RegenerateButton from './RegenerateButton'; 
import AnalysisEmptyState from './AnalysisEmptyState';
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
    const [data, setData] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});

    const isMounted = useRef(false);
    const hasInitialized = useRef(false);

    // API Configuration
    const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'https://traxxia-backend-ml.onrender.com';
    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
    const getAuthToken = () => sessionStorage.getItem('token');

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

    // Save to backend using the phase analysis API (same as SWOT)
    const saveToBackend = async (analysisData) => {
        try {
            const token = getAuthToken();

            const response = await fetch(`${API_BASE_URL}/api/conversations/phase-analysis`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phase: 'essential', // Full SWOT is part of essential phase
                    analysis_type: 'fullSwot',
                    analysis_name: 'Full SWOT Portfolio Analysis',
                    analysis_data: analysisData,
                    business_id: selectedBusinessId,
                    metadata: {
                        generated_at: new Date().toISOString(),
                        business_name: businessName,
                        phase: 'essential',
                        generation_context: 'regular_generation'
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save Full SWOT Portfolio analysis');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error saving Full SWOT Portfolio analysis to backend:', error);
            throw error;
        }
    };

    // Generate Full SWOT Portfolio from API
    const generateFullSwotAnalysis = async () => {
        if (isLoading) return;

        try {
            setIsLoading(true);
            setError(null);
            setData(null); // Clear existing data like SWOT does

            const questionsArray = [];
            const answersArray = [];

            // Filter and sort questions like SWOT does
            const sortedQuestions = [...questions].sort((a, b) => (a.order || 0) - (b.order || 0));

            sortedQuestions.forEach(question => {
                const questionId = question._id || question.question_id;
                if (userAnswers[questionId] && userAnswers[questionId].trim()) {
                    // Clean the text like SWOT does
                    const cleanQuestion = String(question.question_text)
                        .replace(/[\u2018\u2019]/g, "'")
                        .replace(/[\u201C\u201D]/g, '"')
                        .replace(/[\u2013\u2014]/g, '-')
                        .replace(/[\u2026]/g, '...')
                        .replace(/[^\x00-\x7F]/g, '')
                        .trim();

                    const cleanAnswer = String(userAnswers[questionId])
                        .replace(/[\u2018\u2019]/g, "'")
                        .replace(/[\u201C\u201D]/g, '"')
                        .replace(/[\u2013\u2014]/g, '-')
                        .replace(/[\u2026]/g, '...')
                        .replace(/[^\x00-\x7F]/g, '')
                        .trim();

                    questionsArray.push(cleanQuestion);
                    answersArray.push(cleanAnswer);
                }
            });

            if (questionsArray.length === 0) {
                throw new Error('No answered questions available for Full SWOT Portfolio analysis');
            }

            // Call ML Backend
            const response = await fetch(`${ML_API_BASE_URL}/full-swot-portfolio`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify({
                    questions: questionsArray,
                    answers: answersArray
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Full SWOT API returned ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            // Validate response structure
            if (!result.swotPortfolio) {
                throw new Error('Invalid API response structure: missing swotPortfolio');
            }

            // Set local state
            setData(result);
            setHasGenerated(true);

            // Save to backend using phase analysis API (like SWOT)
            await saveToBackend(result);

            return result;

        } catch (error) {
            console.error('Error generating Full SWOT Portfolio analysis:', error);
            setError(error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize component
    useEffect(() => {
        if (hasInitialized.current) return;

        isMounted.current = true;
        hasInitialized.current = true;

        if (fullSwotData) {
            setData(fullSwotData);
            setHasGenerated(true);
        } else {
            // Check if we have enough data to generate analysis
            const answeredCount = Object.keys(userAnswers).length;
            if (answeredCount >= 5 && questions.length > 0) {
                generateFullSwotAnalysis();
            }
        }

        return () => {
            isMounted.current = false;
        };
    }, [fullSwotData]);

    // Handle regeneration - Updated to match SWOT pattern
    const handleRegenerate = async () => {
        if (onRegenerate) {
            // If parent component provides regeneration handler, use it
            await onRegenerate();
        } else {
            // Otherwise, handle regeneration internally
            await generateFullSwotAnalysis();
        }
    };

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
    if (isLoading || isRegenerating) {
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
                <div className="cs-header">
                    <div className="cs-title-section">
                        <Target className="main-icon" size={24} />
                        <h2 className='cs-title'>Full SWOT Portfolio (Enhanced)</h2>
                    </div>
                </div>

                {/* Replace the entire empty-state div with the common component */}
                <AnalysisEmptyState
                    analysisType="fullSwot"
                    analysisDisplayName="Full SWOT Portfolio (Enhanced)"
                    icon={Target}
                    onImproveAnswers={handleMissingQuestionsCheck}
                    onRegenerate={handleRegenerate}
                    isRegenerating={isRegenerating}
                    canRegenerate={canRegenerate}
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
            {/* Header */}
            <div className="cs-header">
                <div className="cs-title-section">
                    <Target className="main-icon" size={24} />
                    <h2 className='cs-title'>Full SWOT Portfolio (Enhanced)</h2>
                </div>
                <RegenerateButton
                    onRegenerate={handleRegenerate}
                    isRegenerating={isRegenerating}
                    canRegenerate={canRegenerate}
                    sectionName="Full SWOT"
                    size="medium"
                />
            </div>

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
                                        <th>Source</th>
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
                                            <td>Question {item.source}</td>
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
                                        <th>Source</th>
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
                                            <td>Question {item.source}</td>
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
                                        <th>Source</th>
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
                                            <td>Question {item.source}</td>
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
                                        <th>Source</th>
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
                                            <td>Question {item.source}</td>
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

            {/* Strategic Options Matrix Table */}
            {portfolio.strategicOptions && (
                <div className="section-container">
                    <div className="section-header" onClick={() => toggleSection('strategic')}>
                        <h3>
                            <Zap size={20} />
                            Strategic Options Matrix
                        </h3>
                        {expandedSections.strategic ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {expandedSections.strategic !== false && (
                        <div className="table-container">
                            {/* SO Strategies */}
                            {portfolio.strategicOptions.SO_strategies && portfolio.strategicOptions.SO_strategies.length > 0 && (
                                <div className="subsection">
                                    <h4>
                                        <TrendingUp size={16} />
                                        Strengths + Opportunities (SO) Strategies
                                    </h4>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Strategy</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {portfolio.strategicOptions.SO_strategies.map((strategy, index) => (
                                                <tr key={index}>
                                                    <td><span className="status-badge high-intensity">SO{index + 1}</span></td>
                                                    <td>{strategy}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* WO Strategies */}
                            {portfolio.strategicOptions.WO_strategies && portfolio.strategicOptions.WO_strategies.length > 0 && (
                                <div className="subsection">
                                    <h4>
                                        <Target size={16} />
                                        Weaknesses + Opportunities (WO) Strategies
                                    </h4>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Strategy</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {portfolio.strategicOptions.WO_strategies.map((strategy, index) => (
                                                <tr key={index}>
                                                    <td><span className="status-badge medium-intensity">WO{index + 1}</span></td>
                                                    <td>{strategy}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* ST Strategies */}
                            {portfolio.strategicOptions.ST_strategies && portfolio.strategicOptions.ST_strategies.length > 0 && (
                                <div className="subsection">
                                    <h4>
                                        <TrendingDown size={16} />
                                        Strengths + Threats (ST) Strategies
                                    </h4>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Strategy</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {portfolio.strategicOptions.ST_strategies.map((strategy, index) => (
                                                <tr key={index}>
                                                    <td><span className="status-badge medium-intensity">ST{index + 1}</span></td>
                                                    <td>{strategy}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* WT Strategies */}
                            {portfolio.strategicOptions.WT_strategies && portfolio.strategicOptions.WT_strategies.length > 0 && (
                                <div className="subsection">
                                    <h4>
                                        <AlertTriangle size={16} />
                                        Weaknesses + Threats (WT) Strategies
                                    </h4>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Strategy</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {portfolio.strategicOptions.WT_strategies.map((strategy, index) => (
                                                <tr key={index}>
                                                    <td><span className="status-badge low-intensity">WT{index + 1}</span></td>
                                                    <td>{strategy}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FullSWOTPortfolio;