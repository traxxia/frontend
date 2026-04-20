import React, { useState, useCallback, useMemo } from 'react';
import { FileDown, Loader } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";
import { useAnalysisStore } from '../store';

const PHASE_COMPONENTS = {
  initial: [
    { selector: '[data-component="swot-analysis"]', name: 'SWOT Analysis' },
    { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
    { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
    { selector: '[data-component="porters-analysis"]', name: "Porter's Five Forces" },
    { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' }
  ],
  essential: [
    { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
    { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
    { selector: '[data-component="porters-analysis"]', name: "Porter's Five Forces" },
    { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' },
    { selector: '[data-component="full-swot"]', name: 'Full SWOT Portfolio' },
    { selector: '[data-component="competitive-advantage"]', name: 'Competitive Advantage Matrix' },
    { selector: '[data-component="expanded-capability"]', name: 'Capability Heatmap' },
    { selector: '[data-component="strategic-radar"]', name: 'Strategic Positioning Radar' },
    { selector: '[data-component="productivity"]', name: 'Productivity and Efficiency Metrics' },
    { selector: '[data-component="maturity"]', name: 'Business Maturity Score' },
    { selector: '[data-component="competitive-landscape"]', name: 'Competitive Landscape' },
    { selector: '[data-component="core-adjacency"]', name: 'Core' }
  ],
  good: [
    { selector: '[data-component="profitability-analysis"]', name: 'Profitability Analysis' },
    { selector: '[data-component="growth-tracker"]', name: 'Growth Tracker' },
    { selector: '[data-component="liquidity-efficiency"]', name: 'Liquidity & Efficiency' },
    { selector: '[data-component="investment-performance"]', name: 'Investment Performance' },
    { selector: '[data-component="leverage-risk"]', name: 'Leverage & Risk' },
    { selector: '[data-component="productivity"]', name: 'Productivity and Efficiency Metrics' },
    { selector: '[data-component="full-swot"]', name: 'Full SWOT Portfolio' },
    { selector: '[data-component="strategic-radar"]', name: 'Strategic Positioning Radar' },
    { selector: '[data-component="porters-analysis"]', name: "Porter's Five Forces" },
    { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' },
    { selector: '[data-component="competitive-advantage"]', name: 'Competitive Advantage Matrix' },
    { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
    { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
    { selector: '[data-component="expanded-capability"]', name: 'Capability Heatmap' },
    { selector: '[data-component="maturity"]', name: 'Business Maturity Score' },
    { selector: '[data-component="competitive-landscape"]', name: 'Competitive Landscape' },
    { selector: '[data-component="core-adjacency"]', name: 'Core' }
  ],
  advanced: [
    { selector: '[data-component="profitability-analysis"]', name: 'Profitability Analysis' },
    { selector: '[data-component="growth-tracker"]', name: 'Growth Tracker' },
    { selector: '[data-component="liquidity-efficiency"]', name: 'Liquidity & Efficiency' },
    { selector: '[data-component="investment-performance"]', name: 'Investment Performance' },
    { selector: '[data-component="leverage-risk"]', name: 'Leverage & Risk' },
    { selector: '[data-component="productivity"]', name: 'Productivity and Efficiency Metrics' },
    { selector: '[data-component="porters-analysis"]', name: "Porter's Five Forces" },
    { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' },
    { selector: '[data-component="full-swot"]', name: 'Full SWOT Portfolio' },
    { selector: '[data-component="strategic-radar"]', name: 'Strategic Positioning Radar' },
    { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
    { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
    { selector: '[data-component="competitive-advantage"]', name: 'Competitive Advantage Matrix' },
    { selector: '[data-component="expanded-capability"]', name: 'Capability Heatmap' },
    { selector: '[data-component="maturity"]', name: 'Business Maturity Score' },
    { selector: '[data-component="competitive-landscape"]', name: 'Competitive Landscape' },
    { selector: '[data-component="core-adjacency"]', name: 'Core' }
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

  // 1. Expand all collapsed categories first
  const categories = document.querySelectorAll('.category-content.collapsed');
  categories.forEach(category => {
    changes.push({
      element: category,
      property: 'className',
      oldValue: category.className,
      newValue: category.className.replace('collapsed', 'expanded')
    });
    category.className = category.className.replace('collapsed', 'expanded');
    category.style.maxHeight = 'none';
    category.style.overflow = 'visible';
  });

  // 2. Expand all cards
  const cards = document.querySelectorAll('.modern-card-content.collapsed, .exc-section-body.collapsed');
  cards.forEach(card => {
    changes.push({
      element: card,
      property: 'className',
      oldValue: card.className,
      newValue: card.className.replace('collapsed', 'expanded')
    });
    card.className = card.className.replace('collapsed', 'expanded');
    card.style.maxHeight = 'none';
    card.style.overflow = 'visible';
  });

  // 3. Hide buttons
  const buttons = document.querySelectorAll('button, .regenerate-button, .dropdown-button');
  buttons.forEach(btn => {
    changes.push({
      element: btn,
      property: 'display',
      oldValue: btn.style.display,
      newValue: 'none'
    });
    btn.style.display = 'none';
  });

  // 4. Fix overflow issues
  const scrollContainers = document.querySelectorAll('.ch-heatmap-scroll, .scroll-container');
  scrollContainers.forEach(container => {
    changes.push({
      element: container,
      property: 'overflow',
      oldValue: container.style.overflow,
      newValue: 'visible'
    });
    container.style.overflow = 'visible';
  });

  return changes;
};

// Fast restore function
const restoreChanges = (changes) => {
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
  if (unlockedFeatures.goodPhase) return 'good';
  if (unlockedFeatures.fullSwot) return 'essential';
  if (unlockedFeatures.analysis) return 'initial';
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

    const canvas = await html2canvas(component, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true,
      imageTimeout: 2000,
      windowWidth: component.scrollWidth,
      windowHeight: component.scrollHeight,
      onclone: (clonedDoc) => {
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * { 
            animation: none !important; 
            transition: none !important; 
            opacity: 1 !important;
          }

          /* FIX ALIGNMENT */
          [data-component="maturity"],
          [data-component="competitive-landscape"],
          [data-component="core-adjacency"] {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* FORCE INNER ELEMENTS FULL WIDTH */
          [data-component="maturity"] *,
          [data-component="competitive-landscape"] *,
          [data-component="core-adjacency"] * {
            max-width: 100% !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      }
    });

    return {
      canvas,
      name,
      imgData: canvas.toDataURL('image/png', 0.7)
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
    showText = false
  }) => {
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const { t } = useTranslation();
    
    const {
      swotAnalysis, purchaseCriteria, loyaltyNPS, portersData, pestelData,
      fullSwotData, competitiveAdvantage, strategicData, expandedCapability,
      strategicRadar, productivityData, maturityData, competitiveLandscape,
      coreAdjacency, profitabilityData, growthTrackerData, liquidityEfficiencyData,
      investmentPerformanceData, leverageRiskData
    } = useAnalysisStore();



  // Main strategic export function
  const handleDownloadStrategicAnalysis = useCallback(async () => {
    if (!strategicData) {
      onToastMessage?.('No strategic analysis data available to export. Generate strategic analysis first.', 'warning');
      return;
    }

    let currentChanges = [];

    try {
      setIsExportingPDF(true);
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

      for (const { selector, name } of strategicBlocks) {
        const result = await captureComponent(selector, name);

        if (!result?.imgData || !result?.canvas) {
          console.warn("Skipping invalid capture:", name);
          continue;
        }

        pdf.addPage();

        const marginX = 20;
        const marginTop = 20;

        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text(name, marginX, marginTop);

        const canvas = result.canvas;
        const imgWidth = pageWidth - marginX * 2;

        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const maxHeight = pageHeight - 40;
        const finalHeight = Math.min(imgHeight, maxHeight);

        pdf.addImage(
          result.imgData,
          'PNG',
          marginX,
          marginTop + 10,
          imgWidth,
          finalHeight
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
  }, [businessName, onToastMessage, strategicData]);


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

      for (const { selector, name } of visibleComponents) {
        const result = await captureComponent(selector, name);

        if (!result?.imgData || !result?.canvas) {
          console.warn("Skipping invalid capture:", name);
          continue;
        }

        pdf.addPage();

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text(name, 20, 25);

        const imgWidth = pageWidth - 40;
        const canvas = result.canvas;

        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const maxHeight = pageHeight - 60;
        const finalHeight = Math.min(imgHeight, maxHeight);

        pdf.addImage(
          result.imgData,
          'PNG',
          20,
          35,
          imgWidth,
          finalHeight
        );

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
      swotAnalysis, purchaseCriteria, loyaltyNPS, portersData, pestelData,
      fullSwotData, competitiveAdvantage, expandedCapability,
      strategicRadar, productivityData, maturityData, competitiveLandscape,
      coreAdjacency, profitabilityData, growthTrackerData, liquidityEfficiencyData,
      investmentPerformanceData, leverageRiskData]);

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
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            minWidth: '280px'
          }}>
            <Loader size={32} style={{
              color: '#1a73e8',
              animation: 'spin 1s linear infinite',
              marginBottom: '12px'
            }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1f2937' }}>
  {t("Generating PDF")}
</h3>

<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
  {t("Capturing analysis...")}
</p>
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
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
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
