import React from 'react';
import { X, Download } from 'lucide-react';
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
import MissingMetricsDisplay from './MissingMetricsDisplay'; // Added import for MissingMetricsDisplay

const AnalysisDataModal = ({ 
  isOpen, 
  onClose, 
  analysisType, 
  analysisData, 
  analysisName,
  businessName = "Business",
  auditId,
  documentInfo = null // Added new prop for document information
}) => {
  if (!isOpen) return null;

  const downloadAnalysisData = () => {
    const dataStr = JSON.stringify(analysisData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysisType}_analysis_${auditId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Determine if this is a financial analysis type
  const financialAnalysisTypes = [
    'profitabilityAnalysis',
    'growthTracker',
    'liquidityEfficiency',
    'investmentPerformance',
    'leverageRisk'
  ];
  const isFinancialAnalysis = financialAnalysisTypes.includes(analysisType);

  // Determine if a document is uploaded based on documentInfo
  const hasDocumentUploaded = documentInfo && documentInfo.has_document;

  // Create effective document info if needed for financial analyses
  const effectiveDocumentInfo = isFinancialAnalysis 
    ? (documentInfo || {
        has_document: hasDocumentUploaded || true, // Assume true for financial if not specified
        filename: documentInfo?.filename || 'Financial Document',
        template_name: documentInfo?.template_name || 'Standard',
        upload_date: documentInfo?.upload_date || new Date().toISOString()
      })
    : documentInfo;

  const renderAnalysisComponent = () => {
    // Mock props for read-only display
    const mockProps = {
      questions: [],
      userAnswers: {},
      businessName: businessName,
      onDataGenerated: () => {},
      onRegenerate: () => {},
      isRegenerating: false,
      canRegenerate: false,
      selectedBusinessId: null,
      onRedirectToBrief: () => {},
      onRedirectToChat: () => {},
      isMobile: false,
      setActiveTab: () => {},
      hasUploadedDocument: hasDocumentUploaded,
      uploadedFile: null,
      // Disable all interactive features
      readOnly: true,
      hideControls: true
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
            readOnly={false}
            hideDownload={true}
      
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

      // Added missing financial analysis components
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
        // Fallback for unknown analysis types - show raw JSON
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
    // Only close if clicking the overlay, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="analysis-modal-overlay" onClick={handleOverlayClick}>
      <div className="analysis-modal-content">
        {/* Close Button - Top Right */}
        <button
          className="analysis-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
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

        {/* Modal Body */}
        <div className="analysis-modal-body">
          <div className="analysis-modal-content-wrapper">
            {/* Missing Metrics Display - Show for financial analyses */}
            {isFinancialAnalysis && effectiveDocumentInfo && (
              <h5>You answered the required questions, but the responses need more detail to generate meaningful analysis.</h5>
            )}
            {renderAnalysisComponent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDataModal;