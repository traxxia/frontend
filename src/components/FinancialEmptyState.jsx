import React from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import AnalysisEmptyState from './AnalysisEmptyState';
import '../styles/AnalysisEmptyState.css';

const FinancialEmptyState = ({
  analysisType,
  analysisDisplayName,
  icon,
  onImproveAnswers,
  onRegenerate,
  isRegenerating,
  canRegenerate,
  userAnswers = {},
  minimumAnswersRequired = 3
}) => {
  const getDisplayName = () => {
    if (analysisDisplayName) return analysisDisplayName;
    
    // Fallback names based on common types
    switch (analysisType) {
      case 'growthTracker':
        return 'Growth Tracker Analysis';
      case 'investmentPerformance':
        return 'Investment Performance Analysis';
      case 'leverageRisk':
        return 'Leverage & Risk Analysis';
      case 'liquidityEfficiency':
        return 'Liquidity & Efficiency Analysis';
      case 'operationalEfficiency':
        return 'Operational Efficiency Analysis';
      case 'profitability':
        return 'Profitability Analysis';
      case 'financialPerformance':
        return 'Financial Performance';
      case 'costEfficiency':
        return 'Cost Efficiency Insight';
      case 'financialBalance':
        return 'Financial Balance Insight';
      default:
        return 'Financial Analysis';
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    if (analysisType === 'leverageRisk') return AlertTriangle;
    return TrendingUp;
  };

  return (
    <div className="porters-container" style={{ width: '100%' }}>
      <AnalysisEmptyState
        analysisType={analysisType}
        analysisDisplayName={getDisplayName()}
        icon={getIcon()}
        onImproveAnswers={onImproveAnswers}
        onRegenerate={onRegenerate}
        isRegenerating={isRegenerating}
        canRegenerate={canRegenerate}
        userAnswers={userAnswers}
        minimumAnswersRequired={minimumAnswersRequired}
        customMessage="Financial data is unavailable. Please provide the required financial information to generate insights."
        showImproveButton={false}
        showRegenerateButton={false}
      />
    </div>
  );
};

export default FinancialEmptyState;
