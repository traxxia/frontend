import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, TrendingUp, TrendingDown, Target, AlertTriangle, Star, Award, Clock, Zap } from 'lucide-react';
import '../styles/EssentialPhase.css'; 


const FullSWOTPortfolio = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    fullSwotData = null,
    selectedBusinessId
}) => {
    const [data, setData] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // API Configuration
    const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'https://traxxia-backend-ml.onrender.com';

    // Generate Full SWOT Portfolio from API
    const generateFullSwotAnalysis = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const questionsArray = [];
            const answersArray = [];

            questions
                .filter(q => userAnswers[q._id] && userAnswers[q._id].trim())
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .forEach(question => {
                    questionsArray.push(question.question_text);
                    answersArray.push(userAnswers[question._id]);
                });

            if (questionsArray.length === 0) {
                throw new Error('No questions available for Full SWOT Portfolio analysis');
            }

            const response = await fetch(`${ML_API_BASE_URL}/full-swot-portfolio`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
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

            setData(result);
            setHasGenerated(true);
            return result;

        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize component
    useEffect(() => {
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
    }, [fullSwotData]);

    // Handle regeneration
    const handleRegenerate = async () => {
        if (onRegenerate) {
            onRegenerate();
        } else {
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
        if (score >= 8) return '#10b981';
        if (score >= 6) return '#f59e0b';
        return '#ef4444';
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        const colors = {
            'high': '#ef4444',
            'medium': '#f59e0b',
            'low': '#10b981'
        };
        return colors[priority] || '#6b7280';
    };

    // Render SWOT Item
    const renderSWOTItem = (item, type) => (
        <div key={`${type}-${item.item}`} className="swot-item">
            <div className="item-header">
                <h4 className="item-title">{item.item}</h4>
                <div className="item-badges">
                    {item.score && (
                        <span 
                            className="score-badge"
                            style={{ backgroundColor: getScoreColor(item.score) }}
                        >
                            {item.score}/10
                        </span>
                    )}
                    <span 
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(item.category) }}
                    >
                        {item.category?.replace('_', ' ')}
                    </span>
                </div>
            </div>

            <div className="item-details">
                <span className="source-tag">Source: Question {item.source}</span>
                
                {/* Strengths specific badges */}
                {item.competitiveAdvantage && (
                    <span className="advantage-badge">
                        <Award size={12} />
                        Competitive Advantage
                    </span>
                )}
                {item.customerValidated && (
                    <span className="validated-badge">
                        <Star size={12} />
                        Customer Validated
                    </span>
                )}

                {/* Weaknesses specific badges */}
                {item.improvementPriority && (
                    <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(item.improvementPriority) }}
                    >
                        {item.improvementPriority} Priority
                    </span>
                )}

                {/* Opportunities specific badges */}
                {item.marketTrend && (
                    <span className="trend-badge">
                        <TrendingUp size={12} />
                        Market Trend
                    </span>
                )}
                {item.timeframe && (
                    <span className="timeframe-badge">
                        <Clock size={12} />
                        {item.timeframe}
                    </span>
                )}

                {/* Threats specific badges */}
                {item.likelihood && item.impact && (
                    <span className="likelihood-badge">
                        <AlertTriangle size={12} />
                        {item.likelihood} likelihood, {item.impact} impact
                    </span>
                )}
            </div>
        </div>
    );

    // Render Strategic Options
    const renderStrategicOptions = (strategies) => (
        <div className="strategic-options">
            <h3 className="strategic-title">
                <Zap size={20} />
                Strategic Options Matrix
            </h3>
            <div className="strategy-grid">
                <div className="strategy-quadrant so">
                    <h4>
                        <TrendingUp size={16} />
                        Strengths + Opportunities
                    </h4>
                    <div className="strategy-list">
                        {strategies.SO_strategies?.map((strategy, index) => (
                            <div key={index} className="strategy-item">{strategy}</div>
                        ))}
                    </div>
                </div>

                <div className="strategy-quadrant wo">
                    <h4>
                        <Target size={16} />
                        Weaknesses + Opportunities
                    </h4>
                    <div className="strategy-list">
                        {strategies.WO_strategies?.map((strategy, index) => (
                            <div key={index} className="strategy-item">{strategy}</div>
                        ))}
                    </div>
                </div>

                <div className="strategy-quadrant st">
                    <h4>
                        <TrendingDown size={16} />
                        Strengths + Threats
                    </h4>
                    <div className="strategy-list">
                        {strategies.ST_strategies?.map((strategy, index) => (
                            <div key={index} className="strategy-item">{strategy}</div>
                        ))}
                    </div>
                </div>

                <div className="strategy-quadrant wt">
                    <h4>
                        <AlertTriangle size={16} />
                        Weaknesses + Threats
                    </h4>
                    <div className="strategy-list">
                        {strategies.WT_strategies?.map((strategy, index) => (
                            <div key={index} className="strategy-item">{strategy}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // Loading state
    if (isLoading || isRegenerating) {
        return (
            <div className="full-swot-container">
                <div className="full-swot-loading">
                    <Loader className="spinner" />
                    <h3>Generating Full SWOT Portfolio...</h3>
                    <p>Creating comprehensive SWOT analysis with strategic insights...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="full-swot-container">
                <div className="full-swot-error">
                    <AlertTriangle />
                    <h3>Analysis Error</h3>
                    <p>{error}</p>
                    <button onClick={handleRegenerate} className="retry-btn">
                        Retry Analysis
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (!hasGenerated || !data?.swotPortfolio) {
        const answeredCount = Object.keys(userAnswers).length;
        return (
            <div className="full-swot-container">
                <div className="full-swot-empty">
                    <Target size={48} />
                    <h3>Full SWOT Portfolio (Enhanced)</h3>
                    <p>
                        {answeredCount < 5
                            ? `Answer ${5 - answeredCount} more questions to generate enhanced SWOT analysis.`
                            : "Complete essential phase questions to unlock enhanced SWOT analysis with competitive positioning and strategic options."
                        }
                    </p>
                </div>
            </div>
        );
    }

    const portfolio = data.swotPortfolio;

    return (
        <div className="full-swot-container">
            {/* Header */}
            <div className="full-swot-header">
                <div className="header-content">
                    <Target className="header-icon" />
                    <div>
                        <h1>Full SWOT Portfolio (Enhanced)</h1>
                        <p>Comprehensive SWOT analysis with competitive positioning for {businessName}</p>
                    </div>
                </div>
                {canRegenerate && onRegenerate && (
                    <button
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                        className="regenerate-btn"
                    >
                        <RefreshCw size={16} />
                        Regenerate
                    </button>
                )}
            </div>

            {/* SWOT Matrix */}
            <div className="swot-matrix">
                <div className="swot-quadrant strengths">
                    <h3 className="quadrant-title">
                        <TrendingUp size={20} />
                        Strengths ({portfolio.strengths?.length || 0})
                    </h3>
                    <div className="swot-items">
                        {portfolio.strengths?.map(item => renderSWOTItem(item, 'strength'))}
                    </div>
                </div>

                <div className="swot-quadrant weaknesses">
                    <h3 className="quadrant-title">
                        <TrendingDown size={20} />
                        Weaknesses ({portfolio.weaknesses?.length || 0})
                    </h3>
                    <div className="swot-items">
                        {portfolio.weaknesses?.map(item => renderSWOTItem(item, 'weakness'))}
                    </div>
                </div>

                <div className="swot-quadrant opportunities">
                    <h3 className="quadrant-title">
                        <Target size={20} />
                        Opportunities ({portfolio.opportunities?.length || 0})
                    </h3>
                    <div className="swot-items">
                        {portfolio.opportunities?.map(item => renderSWOTItem(item, 'opportunity'))}
                    </div>
                </div>

                <div className="swot-quadrant threats">
                    <h3 className="quadrant-title">
                        <AlertTriangle size={20} />
                        Threats ({portfolio.threats?.length || 0})
                    </h3>
                    <div className="swot-items">
                        {portfolio.threats?.map(item => renderSWOTItem(item, 'threat'))}
                    </div>
                </div>
            </div>

            {/* Strategic Options */}
            {portfolio.strategicOptions && renderStrategicOptions(portfolio.strategicOptions)}
        </div>
    );
};

export default FullSWOTPortfolio;