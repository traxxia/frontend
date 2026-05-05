import React, { useState, useCallback, useMemo } from 'react';
import { FileDown, Loader } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";
import { useAnalysisStore } from '../store';

const PHASE_COMPONENTS = {
  initial: [
    { selector: '[data-component="swot-analysis"]', name: 'SWOT Analysis' },
    { selector: '[data-component="porters-analysis"]', name: "Porter's Five Forces" },
    { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' },
    { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
    { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' }
  ],
  essential: [
    { selector: '[data-component="core-adjacency"]', name: 'Core' },
    { selector: '[data-component="productivity"]', name: 'Productivity and Efficiency Metrics' },
    { selector: '[data-component="swot-analysis"]', name: 'SWOT Analysis' },
    { selector: '[data-component="porters-analysis"]', name: "Porter's Five Forces" },
    { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' },
    { selector: '[data-component="full-swot"]', name: 'Full SWOT Portfolio' },
    { selector: '[data-component="strategic-radar"]', name: 'Strategic Positioning Radar' },
    { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
    { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
    { selector: '[data-component="competitive-advantage"]', name: 'Competitive Advantage Matrix' },
    { selector: '[data-component="expanded-capability"]', name: 'Capability Heatmap' },
    { selector: '[data-component="maturity"]', name: 'Business Maturity Score' },
    { selector: '[data-component="competitive-landscape"]', name: 'Competitive Landscape' }
  ],
  good: [
    { selector: '[data-component="core-adjacency"]', name: 'Core' },
    { selector: '[data-component="profitability-analysis"]', name: 'Profitability Analysis' },
    { selector: '[data-component="growth-tracker"]', name: 'Growth Tracker' },
    { selector: '[data-component="liquidity-efficiency"]', name: 'Liquidity & Efficiency' },
    { selector: '[data-component="investment-performance"]', name: 'Investment Performance' },
    { selector: '[data-component="leverage-risk"]', name: 'Leverage & Risk' },
    { selector: '[data-component="productivity"]', name: 'Productivity and Efficiency Metrics' },
    { selector: '[data-component="swot-analysis"]', name: 'SWOT Analysis' },
    { selector: '[data-component="porters-analysis"]', name: "Porter's Five Forces" },
    { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' },
    { selector: '[data-component="full-swot"]', name: 'Full SWOT Portfolio' },
    { selector: '[data-component="strategic-radar"]', name: 'Strategic Positioning Radar' },
    { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
    { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
    { selector: '[data-component="competitive-advantage"]', name: 'Competitive Advantage Matrix' },
    { selector: '[data-component="expanded-capability"]', name: 'Capability Heatmap' },
    { selector: '[data-component="maturity"]', name: 'Business Maturity Score' },
    { selector: '[data-component="competitive-landscape"]', name: 'Competitive Landscape' }
  ],
  advanced: [
    { selector: '[data-component="core-adjacency"]', name: 'Core' },
    { selector: '[data-component="profitability-analysis"]', name: 'Profitability Analysis' },
    { selector: '[data-component="growth-tracker"]', name: 'Growth Tracker' },
    { selector: '[data-component="liquidity-efficiency"]', name: 'Liquidity & Efficiency' },
    { selector: '[data-component="investment-performance"]', name: 'Investment Performance' },
    { selector: '[data-component="leverage-risk"]', name: 'Leverage & Risk' },
    { selector: '[data-component="productivity"]', name: 'Productivity and Efficiency Metrics' },
    { selector: '[data-component="swot-analysis"]', name: 'SWOT Analysis' },
    { selector: '[data-component="porters-analysis"]', name: "Porter's Five Forces" },
    { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' },
    { selector: '[data-component="full-swot"]', name: 'Full SWOT Portfolio' },
    { selector: '[data-component="strategic-radar"]', name: 'Strategic Positioning Radar' },
    { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
    { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
    { selector: '[data-component="competitive-advantage"]', name: 'Competitive Advantage Matrix' },
    { selector: '[data-component="expanded-capability"]', name: 'Capability Heatmap' },
    { selector: '[data-component="maturity"]', name: 'Business Maturity Score' },
    { selector: '[data-component="competitive-landscape"]', name: 'Competitive Landscape' }
  ],
  'advanced-brief': [
    { selector: '[data-component="advanced-brief"]', name: 'Questions & Answers' }
  ],
  executive: [
    { selector: '[data-component="executive-aha"]', name: 'AHA Insights' },
    { selector: '[data-component="executive-where"]', name: 'Where to Compete' },
    { selector: '[data-component="executive-how"]', name: 'How to Compete' },
    { selector: '[data-component="executive-priorities"]', name: 'Strategic Priorities' }
  ]
};

const prepareForCapture = () => {
  const changes = [];
  document.body.classList.add('pdf-export-active');

  // 1. Expand all collapsed categories, cards, and sections
  const selectorsToExpand = [
    '.category-content.collapsed',
    '.modern-card-content.collapsed',
    '.exc-section-body.collapsed',
    '.pillar-content.collapsed',
    '.subsection-body.collapsed',
    '.section-container.collapsed',
    '.radar-section-content.collapsed',
    '.matrix-section-content.collapsed'
  ];

  selectorsToExpand.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      changes.push({
        element: el,
        property: 'className',
        oldValue: el.className,
        newValue: el.className.replace('collapsed', 'expanded')
      });

      changes.push({
        element: el,
        property: 'maxHeight',
        oldValue: el.style.maxHeight
      });

      changes.push({
        element: el,
        property: 'overflow',
        oldValue: el.style.overflow
      });

      el.className = el.className.replace('collapsed', 'expanded');
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
    });
  });

  // 2. Hide buttons and interactive elements
  const interactiveSelectors = [
    'button',
    '.regenerate-button',
    '.dropdown-button',
    '.btn',
    '.modern-expand-btn',
    '.exc-section-toggle'
  ];

  interactiveSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(btn => {
      changes.push({
        element: btn,
        property: 'display',
        oldValue: btn.style.display,
        newValue: 'none'
      });
      btn.style.display = 'none';
    });
  });

  // 3. Fix overflow and scroll issues for all potential containers
  const scrollSelectors = [
    '.ch-heatmap-scroll',
    '.scroll-container',
    '.table-container',
    '.analysis-content',
    '.preview-content',
    '.modern-card-content-inner'
  ];

  scrollSelectors.forEach(selector => {
    const containers = document.querySelectorAll(selector);
    containers.forEach(container => {
      changes.push({
        element: container,
        property: 'overflow',
        oldValue: container.style.overflow,
        newValue: 'visible'
      });
      changes.push({
        element: container,
        property: 'maxHeight',
        oldValue: container.style.maxHeight,
        newValue: 'none'
      });
      container.style.overflow = 'visible';
      container.style.maxHeight = 'none';
    });
  });

  return changes;
};

// Fast restore function
const restoreChanges = (changes) => {
  document.body.classList.remove('pdf-export-active');
  changes.forEach(({ element, property, oldValue }) => {
    if (property === 'className') {
      element.className = oldValue;
    } else {
      element.style[property] = oldValue;
    }
  });
};

// Function to determine actual export phase based on unlocked features
const getExportPhase = (unlockedFeatures = {}) => {
  if (unlockedFeatures.advancedPhase) return 'advanced';
  if (unlockedFeatures.goodPhase || unlockedFeatures.hasDocument) return 'good';
  if (unlockedFeatures.essentialPhase || unlockedFeatures.fullSwot) return 'essential';
  if (unlockedFeatures.initialPhase || unlockedFeatures.analysis) return 'initial';
  return 'initial';
};

// Optimized single-page capture for each component
const captureComponent = async (selector, name) => {
  const component = document.querySelector(selector);
  if (!component || component.offsetHeight === 0) {
    return null;
  }

  try {
    const html2canvas = (await import('html2canvas')).default;
    const rect = component.getBoundingClientRect();

    const canvas = await html2canvas(component, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 1200, // Fixed width for consistent capture
      windowWidth: 1200,
      imageTimeout: 5000,
      onclone: (clonedDoc) => {
        // Find the cloned element
        const clonedComponent = clonedDoc.querySelector(selector);
        if (clonedComponent) {
          clonedComponent.style.margin = '0';
          clonedComponent.style.padding = '0';
          clonedComponent.style.width = '1200px';
          clonedComponent.style.backgroundColor = 'white';
        }

        const style = clonedDoc.createElement('style');
        style.textContent = `
          * { 
            animation: none !important; 
            transition: none !important; 
            opacity: 1 !important;
            text-shadow: none !important;
          }

          /* ENSURE FULL VISIBILITY */
          .category-content, .modern-card-content, .pillar-content, .exc-section-body, .subsection-body, .section-container, .radar-section-content, .matrix-section-content {
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
          }

          /* FIX ALIGNMENT AND REMOVE SHADOWS FOR PDF */
          .modern-analysis-card, .exc-section-card, .strategic-page-section {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            margin-bottom: 30px !important;
            background-color: white !important;
            page-break-inside: avoid;
          }

          /* TABLE AND GRID IMPROVEMENTS */
          .table-container, .scroll-container, .analysis-content, .preview-content {
            overflow: visible !important;
            max-height: none !important;
            width: 100% !important;
            display: block !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: auto !important;
          }

          th, td {
            border: 1px solid #edf2f7 !important;
            padding: 12px 8px !important;
            word-wrap: break-word !important;
          }

          .ch-heatmap-scroll {
            overflow: visible !important;
            width: 100% !important;
          }

          /* COMPONENT SPECIFIC WIDTHS */
          [data-component="maturity"],
          [data-component="competitive-landscape"],
          [data-component="core-adjacency"],
          [data-component="strategic-radar"],
          [data-component="strategic-direction"],
          [data-component="strategic-execution"],
          [data-component="strategic-sustainability"] {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      }
    });

    return {
      imgData: canvas.toDataURL('image/png', 0.9),
      canvas: canvas
    };

  } catch (error) {
    console.error(`Failed to capture ${name}:`, error);
    return null;
  }
};

const PDFExportButton = ({
  businessName,
  onToastMessage,
  currentPhase,
  disabled = false,
  className = "",
  style = {},
  exportType = "insights", // "insights" or "strategic"
  unlockedFeatures = {},
  showText = false,
  // Multi-user/History support: Prioritize these props if provided
  swotAnalysis: propsSwotAnalysis,
  purchaseCriteria: propsPurchaseCriteria,
  loyaltyNPS: propsLoyaltyNPS,
  portersData: propsPortersData,
  pestelData: propsPestelData,
  fullSwotData: propsFullSwotData,
  competitiveAdvantage: propsCompetitiveAdvantage,
  strategicData: propsStrategicData,
  expandedCapability: propsExpandedCapability,
  strategicRadar: propsStrategicRadar,
  productivityData: propsProductivityData,
  maturityData: propsMaturityData,
  competitiveLandscape: propsCompetitiveLandscape,
  coreAdjacency: propsCoreAdjacency,
  profitabilityData: propsProfitabilityData,
  growthTrackerData: propsGrowthTrackerData,
  liquidityEfficiencyData: propsLiquidityEfficiencyData,
  investmentPerformanceData: propsInvestmentPerformanceData,
  leverageRiskData: propsLeverageRiskData,
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, sectionName: '' });
  const { t } = useTranslation();

  const {
    swotAnalysis: storeSwotLines, // Rename slightly to avoid shadowed vars if needed
  } = useAnalysisStore();

  // Prioritize props over store for multi-user/history support
  const displaySwot = propsSwotAnalysis || storeSwotLines;
  const displayStrategicData = propsStrategicData || useAnalysisStore.getState().strategicData;
  const displayPortersData = propsPortersData || useAnalysisStore.getState().portersData;
  const displayPestelData = propsPestelData || useAnalysisStore.getState().pestelData;
  // ... etc. But actually for Strategic Analysis, we mainly need strategicData




  // Main strategic export function
  const handleDownloadStrategicAnalysis = useCallback(async () => {
    // Re-fetch store data if needed or use display variable
    const exportStrategicData = propsStrategicData || useAnalysisStore.getState().strategicData;

    if (!exportStrategicData) {
      onToastMessage?.('No strategic analysis data available to export. Generate strategic analysis first.', 'warning');
      return;
    }

    let currentChanges = [];

    try {
      setIsExportingPDF(true);
      setExportProgress({ current: 0, total: 3, sectionName: 'Preparing...' });
      currentChanges = prepareForCapture();
      await new Promise(resolve => setTimeout(resolve, 300));

      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Title Page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('Strategic Analysis Report', pageWidth / 2, 30, { align: 'center' });

      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(businessName, pageWidth / 2, 45, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 55, { align: 'center' });

      const strategicBlocks = [
        { selector: '[data-component="strategic-direction"]', name: 'Direction & Positioning' },
        { selector: '[data-component="strategic-execution"]', name: 'Execution & Monitoring' },
        { selector: '[data-component="strategic-sustainability"]', name: 'Sustainability & Long-Term Reinforcement' },
      ];

      let capturedCount = 0;

      for (let i = 0; i < strategicBlocks.length; i++) {
        const { selector, name } = strategicBlocks[i];
        setExportProgress({
          current: i + 1,
          total: strategicBlocks.length,
          sectionName: `Capturing ${name}...`
        });

        const result = await captureComponent(selector, name);

        if (!result?.imgData || !result?.canvas) {
          console.warn("Skipping invalid capture:", name);
          continue;
        }

        pdf.addPage();

        const marginX = 10;
        const marginTop = 20;

        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text(name, marginX, marginTop);

        const canvas = result.canvas;
        const availableWidth = pageWidth - marginX * 2;
        const availableHeight = pageHeight - marginTop - 30; // Leave space for title and margins

        let imgWidth = availableWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Proportional scaling if height exceeds page
        if (imgHeight > availableHeight) {
          imgHeight = availableHeight;
          imgWidth = (canvas.width * imgHeight) / canvas.height;
        }

        // Center horizontally if scaled down
        const xPos = marginX + (availableWidth - imgWidth) / 2;

        pdf.addImage(
          result.imgData,
          'PNG',
          xPos,
          marginTop + 10,
          imgWidth,
          imgHeight
        );

        capturedCount++;
      }

      if (capturedCount === 0) {
        onToastMessage?.('No strategic blocks could be captured.', 'error');
        return;
      }

      const safeName = (businessName || "report")
        .toString()
        .trim()
        .replace(/[^a-z0-9]/gi, '_');

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${safeName}_Strategic_Analysis_${timestamp}.pdf`;

      pdf.save(filename);

      onToastMessage?.(`Strategic Analysis PDF exported successfully! ${capturedCount} sections included.`, 'success');

    } catch (error) {
      console.error('Strategic PDF export error:', error);
      onToastMessage?.('Failed to generate strategic PDF. Please try again.', 'error');
    } finally {
      if (currentChanges.length > 0) restoreChanges(currentChanges);
      setIsExportingPDF(false);
    }
  }, [businessName, onToastMessage, propsStrategicData]);


  // Main analysis export function (enhanced with phase-by-phase content)
  const handleDownloadPhaseAnalysis = useCallback(async () => {
    const exportPhase = (exportType === "advanced-brief" || exportType === "executive") ? exportType : getExportPhase(unlockedFeatures);

    if (!exportPhase) {
      onToastMessage?.('Unable to determine export phase', 'error');
      return;
    }

    let currentChanges = [];

    try {
      setIsExportingPDF(true);
      setExportProgress({ current: 0, total: 0, sectionName: 'Preparing analysis...' });
      currentChanges = prepareForCapture();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Title page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      const phaseTitle = exportPhase.charAt(0).toUpperCase() + exportPhase.slice(1) + ' Phase Analysis';
      pdf.text(phaseTitle, pageWidth / 2, 30, { align: 'center' });

      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(businessName, pageWidth / 2, 45, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 55, { align: 'center' });

      const components = PHASE_COMPONENTS[exportPhase] || [];

      if (components.length === 0) {
        onToastMessage?.('No components available for export', 'warning');
        return;
      }

      const visibleComponents = components.filter(({ selector }) => {
        const element = document.querySelector(selector);
        return element &&
          element.offsetHeight > 80 &&
          element.offsetWidth > 80 &&
          window.getComputedStyle(element).display !== 'none' &&
          !element.closest('.collapsed');
      });

      if (visibleComponents.length === 0) {
        onToastMessage?.('No content available to export', 'warning');
        return;
      }

      let capturedCount = 0;
      setExportProgress({ current: 0, total: visibleComponents.length, sectionName: 'Pre-processing components...' });

      for (let i = 0; i < visibleComponents.length; i++) {
        const { selector, name } = visibleComponents[i];

        setExportProgress({
          current: i + 1,
          total: visibleComponents.length,
          sectionName: `Capturing ${name}...`
        });

        const result = await captureComponent(selector, name);

        if (!result?.imgData || !result?.canvas) {
          console.warn("Skipping invalid capture:", name);
          continue;
        }

        const canvas = result.canvas;
        const availableWidth = pageWidth - 20; // Reduced margins to 10mm
        const availableHeight = pageHeight - 60;

        const imgWidth = availableWidth;
        const fullImgHeight = (canvas.height * imgWidth) / canvas.width;

        // Multi-page support for long components
        if (fullImgHeight > availableHeight) {
          let remainingHeight = canvas.height;
          let sourceY = 0;
          let pageNum = 1;

          while (remainingHeight > 0) {
            // How much of the source canvas to take for this page
            const sourceHeightForPage = Math.min(
              remainingHeight,
              (canvas.width * availableHeight) / imgWidth
            );

            const currentDrawHeight = (sourceHeightForPage * imgWidth) / canvas.width;

            // Create temporary canvas for the slice
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = sourceHeightForPage;

            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(
              canvas,
              0, sourceY, canvas.width, sourceHeightForPage,
              0, 0, canvas.width, sourceHeightForPage
            );

            // Add page for subsequent slices
            if (pageNum > 1) {
              pdf.addPage();
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'italic');
              pdf.setTextColor(150, 150, 150);
              pdf.text(`${name} (continued)`, 10, 15);
            } else {
              pdf.addPage();
              pdf.setFontSize(16);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(59, 130, 246);
              pdf.text(name, 10, 25);
            }

            const pageImgData = tempCanvas.toDataURL('image/png', 0.9);
            pdf.addImage(
              pageImgData,
              'PNG',
              10, // 10mm margin
              pageNum === 1 ? 35 : 20,
              imgWidth,
              currentDrawHeight
            );

            remainingHeight -= sourceHeightForPage;
            sourceY += sourceHeightForPage;
            pageNum++;
          }
        } else {
          // Fits on one page
          pdf.addPage();
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(59, 130, 246);
          pdf.text(name, 10, 25);

          const xPos = 10; // 10mm margin
          pdf.addImage(
            result.imgData,
            'PNG',
            xPos,
            35,
            imgWidth,
            fullImgHeight
          );
        }

        capturedCount++;

        if (visibleComponents.length > 3) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (capturedCount === 0) {
        onToastMessage?.('No components could be captured', 'error');
        return;
      }

      const safeName = (businessName || "report")
        .toString()
        .trim()
        .replace(/[^a-z0-9]/gi, '_');

      const timestamp = new Date().toISOString().split('T')[0];

      let typeLabel = "Insights";
      if (exportPhase === "executive") {
        typeLabel = "Executive_Summary";
      } else if (exportPhase === "advanced-brief") {
        typeLabel = "Questions_And_Answers";
      }

      const filename = `${safeName}_${typeLabel}_${timestamp}.pdf`;

      pdf.save(filename);

      onToastMessage?.(`PDF exported successfully! ${capturedCount} sections included.`, 'success');

    } catch (error) {
      console.error('PDF export error:', error);
      onToastMessage?.('Failed to generate PDF. Please try again.', 'error');
    } finally {
      if (currentChanges.length > 0) {
        restoreChanges(currentChanges);
      }
      setIsExportingPDF(false);
    }
  }, [exportType, unlockedFeatures, businessName, onToastMessage,
    propsSwotAnalysis, propsPurchaseCriteria, propsLoyaltyNPS, propsPortersData, propsPestelData,
    propsFullSwotData, propsCompetitiveAdvantage, propsStrategicData, propsExpandedCapability,
    propsStrategicRadar, propsProductivityData, propsMaturityData, propsCompetitiveLandscape,
    propsCoreAdjacency, propsProfitabilityData, propsGrowthTrackerData, propsLiquidityEfficiencyData,
    propsInvestmentPerformanceData, propsLeverageRiskData]);

  // Main strategic export function
  const handleDownload = exportType === "strategic" ? handleDownloadStrategicAnalysis : handleDownloadPhaseAnalysis;

  // Get the actual export phase for display (only for analysis type)
  const exportPhase = useMemo(() => exportType === "insights" ? getExportPhase(unlockedFeatures) : null, [exportType, unlockedFeatures]);
  const phaseLabel = useMemo(() => exportType === "strategic" ? "Strategic" :
    exportPhase === 'initial' ? 'Initial' :
      exportPhase === 'essential' ? 'Essential' :
        exportPhase === 'good' ? 'Good' :
          exportPhase === 'advanced-brief' ? 'Questions' : 'Advanced', [exportType, exportPhase]);

  return (
    <>
      {/* Simplified loading overlay */}
      {isExportingPDF && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <style>{`
            @keyframes spin-loader {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            textShadow: 'none',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            minWidth: '280px'
          }}>
            <Loader size={32} style={{
              color: '#1a73e8',
              animation: 'spin-loader 1s linear infinite',
              marginBottom: '12px',
              display: 'inline-block',
              transformOrigin: 'center'
            }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1f2937' }}>
              {t("Generating PDF")}
            </h3>

            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              {exportProgress.sectionName || t("Capturing analysis...")}
            </p>
            {exportProgress.total > 0 && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>
                {exportProgress.current} / {exportProgress.total}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleDownload}
        disabled={disabled || isExportingPDF}
        className={className}
        style={{
          backgroundColor: "#1a73e8",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          padding: showText ? "10px 18px" : "10px",
          width: showText ? "auto" : "40px",
          height: "40px",
          fontSize: "14px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: showText ? "8px" : "0",
          cursor: disabled || isExportingPDF ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          ...style
        }}
      >
        {isExportingPDF ? (
          <>
            <Loader size={18} style={{
              animation: 'spin-loader 1s linear infinite',
              display: 'inline-block',
              transformOrigin: 'center'
            }} />
            {showText && <span style={{ marginLeft: '8px' }}>Generating...</span>}
          </>
        ) : (
          <>
            <FileDown size={18} />
            {showText && <span style={{ marginLeft: '8px' }}>{t("Export_PDF")}</span>}
          </>
        )}
      </button>
    </>
  );
};

export default PDFExportButton;
