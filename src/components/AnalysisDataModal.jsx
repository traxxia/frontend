import React from 'react';
import { X } from 'lucide-react';
import '../styles/AnalysisEmptyState.css';

import SwotAnalysis from './SwotAnalysis';
import CustomerSegmentation from './CustomerSegmentation';
import PurchaseCriteria from './PurchaseCriteria';
import ChannelHeatmap from './ChannelHeatmap';
import LoyaltyNPS from './LoyaltyNPS';
import CapabilityHeatmap from './CapabilityHeatmap';
import StrategicAnalysis from './StrategicAnalysis';
import PortersFiveForces from './PortersFiveForces';
import PestelAnalysis from './PestelAnalysis';
import FullSWOTPortfolio from './FullSWOTPortfolio';
import CompetitiveAdvantageMatrix from './CompetitiveAdvantageMatrix';
import ChannelEffectivenessMap from './ChannelEffectivenessMap';
import ExpandedCapabilityHeatmap from './ExpandedCapabilityHeatmap';
import StrategicGoals from './StrategicGoals';
import StrategicPositioningRadar from './StrategicPositioningRadar';
import OrganizationalCultureProfile from './OrganizationalCultureProfile';
import ProductivityMetrics from './ProductivityMetrics';
import MaturityScoreLight from './MaturityScoreLight';
import ProfitabilityAnalysis from './ProfitabilityAnalysis';
import GrowthTracker from './GrowthTracker';
import LiquidityEfficiency from './LiquidityEfficiency';
import InvestmentPerformance from './InvestmentPerformance';
import LeverageRisk from './LeverageRisk';
import CoreAdjacency from './CoreAdjacency';
import CompetitiveLandscape from './CompetitiveLandscape';

const AnalysisDataModal = ({
  isOpen,
  onClose,
  analysisType,
  analysisData,
  analysisName,
  businessName = "Business",
  auditId,
  documentInfo = null,
  phaseAnalysisArray = []
}) => {
  if (!isOpen) return null;
  const financialAnalysisTypes = [
    'profitabilityAnalysis',
    'growthTracker',
    'liquidityEfficiency',
    'investmentPerformance',
    'leverageRisk'
  ];
  const isFinancialAnalysis = financialAnalysisTypes.includes(analysisType);
  const hasDocumentUploaded = documentInfo && documentInfo.has_document;
  const effectiveDocumentInfo = isFinancialAnalysis
    ? (documentInfo || {
      has_document: hasDocumentUploaded || true,
      filename: documentInfo?.filename || 'Financial Document',
      template_name: documentInfo?.template_name || 'Standard',
      upload_date: documentInfo?.upload_date || new Date().toISOString()
    })
    : documentInfo;

  const renderAnalysisComponent = () => {
    const mockProps = {
      questions: [],
      userAnswers: {},
      businessName: businessName,
      onDataGenerated: () => { },
      onRegenerate: () => { },
      isRegenerating: false,
      canRegenerate: false,
      selectedBusinessId: null,
      onRedirectToBrief: () => { },
      onRedirectToChat: () => { },
      isMobile: false,
      setActiveTab: () => { },
      hasUploadedDocument: hasDocumentUploaded,
      uploadedFile: null,
      readOnly: true,
      hideControls: true,
      questionsLoaded: true
    };

    switch (analysisType) {
      case 'swot':
        return (
          <SwotAnalysis
            {...mockProps}
            analysisResult={typeof analysisData === 'string' ? analysisData : JSON.stringify(analysisData)}
          />
        );

      case 'customerSegmentation':
        return (
          <CustomerSegmentation
            {...mockProps}
            customerSegmentationData={analysisData}
          />
        );

      case 'purchaseCriteria':
        return (
          <PurchaseCriteria
            {...mockProps}
            purchaseCriteriaData={analysisData}
          />
        );

      case 'channelHeatmap':
        return (
          <ChannelHeatmap
            {...mockProps}
            channelHeatmapData={analysisData}
          />
        );

      case 'loyaltyNPS':
        return (
          <LoyaltyNPS
            {...mockProps}
            loyaltyNPSData={analysisData}
          />
        );

      case 'capabilityHeatmap':
        return (
          <CapabilityHeatmap
            {...mockProps}
            capabilityHeatmapData={analysisData}
          />
        );

      case 'strategic':
        return (
          <StrategicAnalysis
            {...mockProps}
            strategicData={analysisData}
            phaseManager={{ getUnlockedFeatures: () => ({ analysis: true }) }}
            phaseAnalysisArray={phaseAnalysisArray}
            readOnly={false}
            hideDownload={true}
            hideKickstart={true}
          />
        );

      case 'porters':
        return (
          <PortersFiveForces
            {...mockProps}
            portersData={analysisData}
          />
        );

      case 'pestel':
        return (
          <PestelAnalysis
            {...mockProps}
            pestelData={analysisData}
          />
        );

      case 'fullSwot':
        return (
          <FullSWOTPortfolio
            {...mockProps}
            fullSwotData={analysisData}
          />
        );

      case 'competitiveAdvantage':
        return (
          <CompetitiveAdvantageMatrix
            {...mockProps}
            competitiveAdvantageData={analysisData}
          />
        );

      case 'competitiveLandscape':
        return (
          <CompetitiveLandscape
            {...mockProps}
            competitiveLandscapeData={analysisData}
          />
        );

      case 'channelEffectiveness':
        return (
          <ChannelEffectivenessMap
            {...mockProps}
            channelEffectivenessData={analysisData}
          />
        );

      case 'expandedCapability':
        return (
          <ExpandedCapabilityHeatmap
            {...mockProps}
            expandedCapabilityData={analysisData}
          />
        );

      case 'coreAdjacency':
        return (
          <CoreAdjacency
            {...mockProps}
            coreAdjacencyData={analysisData}
          />
        );

      case 'strategicGoals':
        return (
          <StrategicGoals
            {...mockProps}
            strategicGoalsData={analysisData}
          />
        );

      case 'strategicRadar':
        return (
          <StrategicPositioningRadar
            {...mockProps}
            strategicRadarData={analysisData}
          />
        );

      case 'cultureProfile':
        return (
          <OrganizationalCultureProfile
            {...mockProps}
            cultureProfileData={analysisData}
          />
        );

      case 'productivityMetrics':
        return (
          <ProductivityMetrics
            {...mockProps}
            productivityData={analysisData}
          />
        );

      case 'maturityScore':
        return (
          <MaturityScoreLight
            {...mockProps}
            maturityData={analysisData}
          />
        );
      case 'profitabilityAnalysis':
        return (
          <ProfitabilityAnalysis
            {...mockProps}
            profitabilityData={analysisData}
          />
        );

      case 'growthTracker':
        return (
          <GrowthTracker
            {...mockProps}
            growthData={analysisData}
          />
        );

      case 'liquidityEfficiency':
        return (
          <LiquidityEfficiency
            {...mockProps}
            liquidityData={analysisData}
          />
        );

      case 'investmentPerformance':
        return (
          <InvestmentPerformance
            {...mockProps}
            investmentData={analysisData}
          />
        );

      case 'leverageRisk':
        return (
          <LeverageRisk
            {...mockProps}
            leverageData={analysisData}
          />
        );

      default:
        return (
          <div className="analysis-modal-fallback">
            <h3>Raw Analysis Data</h3>
            <pre className="analysis-modal-json">
              {JSON.stringify(analysisData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="analysis-modal-overlay" onClick={handleOverlayClick}>
      <div className="analysis-modal-content">
        {}
        <button
          className="analysis-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {}
        <div className="analysis-modal-header">
          <div>
            <h2 className="analysis-modal-title">
              {analysisName || `${analysisType} Analysis`}
            </h2>
            <p className="analysis-modal-subtitle">
              Business: {businessName}
            </p>
          </div>
        </div>

        {}
        <div className="analysis-modal-body">
          <div className="analysis-modal-content-wrapper">
            {(() => {
              const hasValidData = (data) => {
                if (!data) return false;
                if (typeof data === 'string') return data.trim().length > 0;
                if (typeof data !== 'object') return false;
                if (isFinancialAnalysis) {
                  if (data.error || data.message === "Analysis failed") return false;
                  const checkDeep = (obj) => {
                    return Object.entries(obj).some(([key, value]) => {
                      if (key === 'citations' || key === 'analysis_metadata' || key.includes('threshold')) return false;
                      if (value === null || value === undefined) return false;
                      if (typeof value === 'number') return !isNaN(value);
                      if (typeof value === 'object') return checkDeep(value);
                      if (typeof value === 'string') return value.trim().length > 0 && !value.toLowerCase().includes('error');
                      return false;
                    });
                  };
                  return checkDeep(data);
                }
                return Object.keys(data).length > 0;
              };

              const validData = hasValidData(analysisData);

              if (isFinancialAnalysis && !hasDocumentUploaded && !validData) {
                return (
                  <div className="loyalty-nps">
                    <div className="empty-state-container">
                      <h3 className="empty-state-title">{analysisName || "Financial Analysis Limited"}</h3>
                      <p className="empty-state-message">
                        Since there may be no proper values in the financial document, we didn't get the analysis.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <>
                  {effectiveDocumentInfo && !isFinancialAnalysis && (
                    <h5>You answered the required questions, but the responses need more detail to generate meaningful analysis.</h5>
                  )}
                  {renderAnalysisComponent()}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDataModal;
