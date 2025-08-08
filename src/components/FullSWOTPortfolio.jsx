import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
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
    const [data, setData] = useState(fullSwotData);
    const [hasGenerated, setHasGenerated] = useState(false);

    useEffect(() => {
        if (fullSwotData) {
            setData(fullSwotData);
            setHasGenerated(true);
        }
    }, [fullSwotData]);

    const getCategoryColor = (category) => {
        const colors = {
            'service_differentiator': '#10b981',
            'internal_capability': '#3b82f6',
            'operational': '#f59e0b',
            'technology': '#8b5cf6',
            'regulatory': '#ef4444',
            'market': '#06b6d4'
        };
        return colors[category] || '#6b7280';
    };

    const getScoreColor = (score) => {
        if (score >= 8) return '#10b981';
        if (score >= 6) return '#f59e0b';
        return '#ef4444';
    };

    const renderSWOTItem = (item, type) => (
        <div key={`${type}-${item.item}`} className="swot-item">
            <div className="item-header">
                <span className="item-text">{item.item}</span>
                <div className="item-meta">
                    {item.score && (
                        <span
                            className="score-badge"
                            style={{ backgroundColor: getScoreColor(item.score), color: 'white' }}
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
                <small>Source: Question {item.source}</small>
                {item.competitiveAdvantage && (
                    <span className="advantage-badge">Competitive Advantage</span>
                )}
                {item.customerValidated && (
                    <span className="validated-badge">Customer Validated</span>
                )}
                {item.improvementPriority && (
                    <span className={`priority-badge ${item.improvementPriority}`}>
                        {item.improvementPriority} Priority
                    </span>
                )}
                {item.marketTrend && (
                    <span className="trend-badge">Market Trend</span>
                )}
                {item.timeframe && (
                    <span className="timeframe-badge">{item.timeframe}</span>
                )}
                {item.likelihood && (
                    <span className="likelihood-badge">
                        {item.likelihood} likelihood, {item.impact} impact
                    </span>
                )}
            </div>
        </div>
    );

    const renderStrategicOptions = (strategies) => (
        <div className="strategic-options">
            <h4>Strategic Options Matrix</h4>
            <div className="strategy-grid">
                <div className="strategy-quadrant so">
                    <h5><TrendingUp size={16} /> Strengths + Opportunities</h5>
                    {strategies.SO_strategies?.map((strategy, index) => (
                        <div key={index} className="strategy-item">{strategy}</div>
                    ))}
                </div>

                <div className="strategy-quadrant wo">
                    <h5><Target size={16} /> Weaknesses + Opportunities</h5>
                    {strategies.WO_strategies?.map((strategy, index) => (
                        <div key={index} className="strategy-item">{strategy}</div>
                    ))}
                </div>

                <div className="strategy-quadrant st">
                    <h5><TrendingDown size={16} /> Strengths + Threats</h5>
                    {strategies.ST_strategies?.map((strategy, index) => (
                        <div key={index} className="strategy-item">{strategy}</div>
                    ))}
                </div>

                <div className="strategy-quadrant wt">
                    <h5><AlertTriangle size={16} /> Weaknesses + Threats</h5>
                    {strategies.WT_strategies?.map((strategy, index) => (
                        <div key={index} className="strategy-item">{strategy}</div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (!hasGenerated && !data) {
        return (
            <div className="analysis-card">
                <div className="card-header">
                    <h3>Full SWOT Portfolio (Enhanced)</h3>
                    <p className="card-description">
                        Complete essential phase questions to unlock enhanced SWOT analysis with competitive positioning and strategic options.
                    </p>
                </div>
                <div className="placeholder-content">
                    <div className="placeholder-icon">📊</div>
                    <p>Enhanced SWOT analysis will appear here once essential phase is completed.</p>
                </div>
            </div>
        );
    }

    if (isRegenerating) {
        return (
            <div className="analysis-card">
                <div className="card-header">
                    <h3>Full SWOT Portfolio (Enhanced)</h3>
                </div>
                <div className="loading-state">
                    <Loader size={32} className="spinner" />
                    <p>Generating enhanced SWOT portfolio...</p>
                </div>
            </div>
        );
    }

    if (!data?.swotPortfolio) {
        return (
            <div className="analysis-card">
                <div className="card-header">
                    <h3>Full SWOT Portfolio (Enhanced)</h3>
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
                    <p>Unable to generate SWOT portfolio. Please try regenerating.</p>
                </div>
            </div>
        );
    }

    const portfolio = data.swotPortfolio;

    return (
        <div className="analysis-card full-swot-portfolio">
            <div className="card-header">
                <div>
                    <h3>Full SWOT Portfolio (Enhanced)</h3>
                    <p className="card-description">
                        Enhanced SWOT analysis with competitive positioning and strategic options for {businessName}
                    </p>
                </div>
                {canRegenerate && onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        className="regenerate-button"
                        disabled={isRegenerating}
                    >
                        <RefreshCw size={16} />
                        Regenerate
                    </button>
                )}
            </div>

            <div className="swot-matrix">
                <div className="swot-quadrant strengths">
                    <h4 className="quadrant-title">
                        <TrendingUp size={20} color="#10b981" />
                        Strengths
                    </h4>
                    <div className="swot-items">
                        {portfolio.strengths?.map(item => renderSWOTItem(item, 'strength'))}
                    </div>
                </div>

                <div className="swot-quadrant weaknesses">
                    <h4 className="quadrant-title">
                        <TrendingDown size={20} color="#ef4444" />
                        Weaknesses
                    </h4>
                    <div className="swot-items">
                        {portfolio.weaknesses?.map(item => renderSWOTItem(item, 'weakness'))}
                    </div>
                </div>

                <div className="swot-quadrant opportunities">
                    <h4 className="quadrant-title">
                        <Target size={20} color="#3b82f6" />
                        Opportunities
                    </h4>
                    <div className="swot-items">
                        {portfolio.opportunities?.map(item => renderSWOTItem(item, 'opportunity'))}
                    </div>
                </div>

                <div className="swot-quadrant threats">
                    <h4 className="quadrant-title">
                        <AlertTriangle size={20} color="#f59e0b" />
                        Threats
                    </h4>
                    <div className="swot-items">
                        {portfolio.threats?.map(item => renderSWOTItem(item, 'threat'))}
                    </div>
                </div>
            </div>

            {portfolio.strategicOptions && renderStrategicOptions(portfolio.strategicOptions)}
 
        </div>
    );
};

export default FullSWOTPortfolio;