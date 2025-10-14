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

const CompetitiveLandscape = ({
    questions = [],
    userAnswers = {},
    businessName = '',
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    competitiveLandscapeData = null,
    selectedBusinessId,
    onRedirectToBrief
}) => {
    const [data, setData] = useState(competitiveLandscapeData);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});

    const handleRedirectToBrief = (missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    };

    const handleMissingQuestionsCheck = async () => {
        const analysisConfig = ANALYSIS_TYPES.competitiveLandscape;

        await checkMissingQuestionsAndRedirect(
            'competitiveLandscape',
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

    // Check if the competitive landscape data is empty/incomplete
    const isCompetitiveLandscapeDataIncomplete = (data) => {
        if (!data || typeof data !== 'object') return true;

        const competitors = Object.keys(data);
        if (competitors.length === 0) return true;

        // Check if at least one competitor has meaningful data
        const hasValidCompetitor = competitors.some(competitor => {
            const competitorData = data[competitor];
            if (!competitorData || typeof competitorData !== 'object') return false;

            const categories = Object.keys(competitorData);
            const hasContent = categories.some(category => {
                const categoryData = competitorData[category];
                return Array.isArray(categoryData) && categoryData.length > 0;
            });

            return hasContent;
        });

        return !hasValidCompetitor;
    };

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    useEffect(() => {
        if (competitiveLandscapeData) {
            setData(competitiveLandscapeData);
            setHasGenerated(true);
            setError(null);

            // Initialize expanded sections for all competitors
            const competitors = Object.keys(competitiveLandscapeData);
            const initialExpandedState = {};
            competitors.forEach(competitor => {
                initialExpandedState[competitor] = true;
            });
            setExpandedSections(initialExpandedState);
        } else {
            setData(null);
            setHasGenerated(false);
        }
    }, [competitiveLandscapeData]);

    const getCategoryIcon = (category) => {
        const categoryLower = category.toLowerCase();
        if (categoryLower === 's' || categoryLower.includes('strength')) return TrendingUp;
        if (categoryLower === 'w' || categoryLower.includes('weakness')) return TrendingDown;
        if (categoryLower === 'o' || categoryLower.includes('opportunity')) return Target;
        if (categoryLower === 't' || categoryLower.includes('threat')) return AlertTriangle;
        return Activity;
    };

    const getCategoryColor = (category) => {
        const categoryLower = category.toLowerCase();
        if (categoryLower === 's' || categoryLower.includes('strength')) return 'high-intensity';
        if (categoryLower === 'w' || categoryLower.includes('weakness')) return 'low-intensity';
        if (categoryLower === 'o' || categoryLower.includes('opportunity')) return 'medium-intensity';
        if (categoryLower === 't' || categoryLower.includes('threat')) return 'low-intensity';
        return 'medium-intensity';
    };

    const getCategoryLabel = (category) => {
        const categoryLower = category.toLowerCase();
        if (categoryLower === 's') return 'Strengths';
        if (categoryLower === 'w') return 'Weaknesses';
        if (categoryLower === 'o') return 'Opportunities';
        if (categoryLower === 't') return 'Threats';
        return category.charAt(0).toUpperCase() + category.slice(1);
    };

    // Loading state
    if (isRegenerating) {
        return (
            <div className="porters-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>
                        {isRegenerating
                            ? "Regenerating Competitive Landscape..."
                            : "Generating Competitive Landscape..."
                        }
                    </span>
                </div>
            </div>
        );
    }

    // Consolidated error state for all error conditions
    if (error ||
        (!hasGenerated && !data && Object.keys(userAnswers).length > 0)) {

        let errorMessage = error;
        if (!errorMessage) {
            errorMessage = "Unable to generate Competitive Landscape analysis. Please try regenerating or check your inputs.";
        }

        return (
            <div className="porters-container">
                <AnalysisError
                    error={errorMessage}
                    onRetry={handleRetry}
                    title="Competitive Landscape Analysis Error"
                />
            </div>
        );
    }

    // Check if data is incomplete and show missing questions checker
    if (!competitiveLandscapeData || isCompetitiveLandscapeDataIncomplete(competitiveLandscapeData)) {
        return (
            <div className="porters-container">
                <AnalysisEmptyState
                    analysisType="competitiveLandscape"
                    analysisDisplayName="Competitive Landscape"
                    icon={Users}
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

    const competitors = Object.keys(data);

    return (
        <div className="porters-container full-swot-container"
            data-analysis-type="competitiveLandscape"
            data-analysis-name="Competitive Landscape"
            data-analysis-order="9">

            <div className=" ">
                {competitors.map((competitor, competitorIndex) => {
                    const competitorData = data[competitor];
                    const categories = Object.keys(competitorData);
                    const IconComponent = getCategoryIcon('competitor');

                    return (
                        <div key={competitorIndex} className="section-container">
                            <div className="section-header" onClick={() => toggleSection(competitor)}>
                                <h5>
                                    {competitor}
                                </h5>
                                {expandedSections[competitor] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </div>

                            {expandedSections[competitor] && (
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Category</th>
                                                <th>Analysis</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map((category, categoryIndex) => {
                                                const categoryData = competitorData[category];
                                                const CategoryIcon = getCategoryIcon(category);
                                                const categoryColor = getCategoryColor(category);
                                                const categoryLabel = getCategoryLabel(category);

                                                return Array.isArray(categoryData) ? (
                                                    categoryData.map((item, itemIndex) => (
                                                        <tr key={`${category}-${itemIndex}`}>
                                                            {itemIndex === 0 && (
                                                                <td rowSpan={categoryData.length}>
                                                                    <span className={`status-badge ${categoryColor}`}>
                                                                        {categoryLabel}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            <td>{item}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr key={categoryIndex}>
                                                        <td>
                                                            <span className={`status-badge ${categoryColor}`}>
                                                                {categoryLabel}
                                                            </span>
                                                        </td>
                                                        <td>{categoryData}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CompetitiveLandscape;