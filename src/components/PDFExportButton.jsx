import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";

const PDFExportButton = ({
  businessName,
  onToastMessage,
  currentPhase,
  disabled = false,
  isChannelHeatmapReady = true,
  isCapabilityHeatmapReady = true,
  className = "",
  style = {},
  exportType = "analysis", // "analysis" or "strategic"
  strategicData = null,
  // Analysis data state indicators
  unlockedFeatures = {},
  fullSwotData = null,
  competitiveAdvantageData = null,
  expandedCapabilityData = null,
  strategicRadarData = null,
  productivityData = null,
  maturityData = null,
  competitiveLandscapeData = null,
  coreAdjacencyData = null,
  // Financial analysis data (Good Phase)
  profitabilityData = null,
  growthTrackerData = null,
  liquidityEfficiencyData = null,
  investmentPerformanceData = null,
  leverageRiskData = null
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { t } = useTranslation();

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
    const cards = document.querySelectorAll('.modern-card-content.collapsed');
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
  const getExportPhase = () => {
    // Priority order: advanced > good > essential > initial

    // Check if user has unlocked advanced phase
    if (unlockedFeatures.advancedPhase) {
      return 'advanced';
    }

    // Check for good phase
    if (unlockedFeatures.goodPhase) {
      return 'good';
    }

    // Check for essential phase
    if (unlockedFeatures.fullSwot) {
      return 'essential';
    }

    // Check for initial phase
    if (unlockedFeatures.analysis) {
      return 'initial';
    }

    return 'initial';
  };

  // Optimized single-page capture for each component
  const captureComponent = async (selector, name) => {
    const component = document.querySelector(selector);
    if (!component || component.offsetHeight === 0) {
      return null;
    }

    try {
      // Dynamic import for better performance
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(component, {
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true,
        imageTimeout: 3000,
        windowWidth: component.scrollWidth,
        windowHeight: component.scrollHeight,
        onclone: (clonedDoc) => {
          // Remove animations in cloned document for speed
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * { 
              animation: none !important; 
              transition: none !important; 
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      return {
        canvas,
        name,
        imgData: canvas.toDataURL('image/png', 0.85)
      };
    } catch (error) {
      console.error(`Failed to capture ${name}:`, error);
      return null;
    }
  };

  // Main strategic export function
  const handleDownloadStrategicAnalysis = async () => {
    if (!strategicData) {
      onToastMessage?.('No strategic analysis data available to export. Generate strategic analysis first.', 'warning');
      return;
    }

    let changes = [];

    try {
      setIsExportingPDF(true);

      // Fast preparation
      changes = prepareForCapture();

      // Short wait for DOM to settle
      await new Promise(resolve => setTimeout(resolve, 300));

      // Dynamic imports
      const jsPDF = (await import('jspdf')).default;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Title page
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

      // Define strategic components to capture
      const strategicSelectors = [
        '.strategic-content',
        '.strategic-section',
        '.strategic-analysis-container',
        '.strategic-page-section'
      ];

      let capturedCount = 0;

      // Try each selector to find strategic content
      for (const selector of strategicSelectors) {
        const elements = document.querySelectorAll(selector);

        for (const element of elements) {
          if (element && element.offsetHeight > 50) {
            const result = await captureComponent(selector, 'Strategic Analysis');

            if (result) {
              pdf.addPage();

              // Add section title
              pdf.setFontSize(16);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(59, 130, 246);
              pdf.text(result.name, 20, 25);

              // Calculate image dimensions to fit page
              const imgWidth = pageWidth - 40;
              const canvas = result.canvas;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              const maxHeight = pageHeight - 60;

              if (imgHeight > maxHeight) {
                const scale = maxHeight / imgHeight;
                pdf.addImage(result.imgData, 'PNG', 20, 35, imgWidth * scale, maxHeight);
              } else {
                pdf.addImage(result.imgData, 'PNG', 20, 35, imgWidth, imgHeight);
              }

              capturedCount++;
            }
            break; // Only capture once per selector type
          }
        }
      }

      if (capturedCount === 0) {
        onToastMessage?.('No strategic analysis components could be captured', 'error');
        return;
      }

      // Save PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${businessName.replace(/[^a-z0-9]/gi, '_')}_Strategic_Analysis_${timestamp}.pdf`;
      pdf.save(filename);

      onToastMessage?.(`Strategic Analysis PDF exported successfully! ${capturedCount} sections included.`, 'success');

    } catch (error) {
      console.error('Strategic PDF export error:', error);
      onToastMessage?.('Failed to generate strategic PDF. Please try again.', 'error');
    } finally {
      // Always restore changes
      if (changes.length > 0) {
        restoreChanges(changes);
      }
      setIsExportingPDF(false);
    }
  };

  // Main analysis export function (enhanced with phase-by-phase content)
  const handleDownloadPhaseAnalysis = async () => {
    const exportPhase = getExportPhase();

    if (!exportPhase) {
      onToastMessage?.('Unable to determine export phase', 'error');
      return;
    }

    let changes = [];

    try {
      setIsExportingPDF(true);

      // Fast preparation
      changes = prepareForCapture();

      // Short wait for DOM to settle
      await new Promise(resolve => setTimeout(resolve, 300));

      // Dynamic imports
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

      // Define components for each phase - aligned with PHASE_API_CONFIG
      const phaseComponents = {
        initial: [
          { selector: '[data-component="swot-analysis"]', name: 'SWOT Analysis' },
          { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
          { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
          { selector: '[data-component="porters-analysis"]', name: "Porter's Five Forces" },
          { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' }
        ],
        essential: [
          // Include purchase criteria and loyalty from initial
          { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
          { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
          { selector: '[data-component="porters-analysis"]', name: "Porter's Five Forces" },
          { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' },
          // Essential phase specific components
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
          // Include all essential phase components
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
          { selector: '[data-component="core-adjacency"]', name: 'Core' },
          // Good phase specific components - 5 financial analyses
          { selector: '[data-component="profitability-analysis"]', name: 'Profitability Analysis' },
          { selector: '[data-component="growth-tracker"]', name: 'Growth Tracker' },
          { selector: '[data-component="liquidity-efficiency"]', name: 'Liquidity & Efficiency' },
          { selector: '[data-component="investment-performance"]', name: 'Investment Performance' },
          { selector: '[data-component="leverage-risk"]', name: 'Leverage & Risk' }
        ],
        advanced: [
          // Advanced phase has same components as good phase
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
          { selector: '[data-component="core-adjacency"]', name: 'Core' },
          { selector: '[data-component="profitability-analysis"]', name: 'Profitability Analysis' },
          { selector: '[data-component="growth-tracker"]', name: 'Growth Tracker' },
          { selector: '[data-component="liquidity-efficiency"]', name: 'Liquidity & Efficiency' },
          { selector: '[data-component="investment-performance"]', name: 'Investment Performance' },
          { selector: '[data-component="leverage-risk"]', name: 'Leverage & Risk' }
        ]
      };

      // Get components for the current export phase
      const components = phaseComponents[exportPhase] || [];

      if (components.length === 0) {
        onToastMessage?.('No components available for export', 'warning');
        return;
      }

      // Filter to only visible components with content
      const visibleComponents = components.filter(({ selector }) => {
        const element = document.querySelector(selector);
        return element &&
          element.offsetHeight > 50 &&
          element.offsetWidth > 50 &&
          !element.closest('.collapsed');
      });

      if (visibleComponents.length === 0) {
        onToastMessage?.('No content available to export', 'warning');
        return;
      }

      // Capture components sequentially with minimal delay
      let capturedCount = 0;

      for (const { selector, name } of visibleComponents) {
        const result = await captureComponent(selector, name);

        if (result) {
          pdf.addPage();

          // Add section title
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(59, 130, 246);
          pdf.text(result.name, 20, 25);

          // Calculate image dimensions to fit page
          const imgWidth = pageWidth - 40;
          const canvas = result.canvas;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          const maxHeight = pageHeight - 60;

          if (imgHeight > maxHeight) {
            const scale = maxHeight / imgHeight;
            pdf.addImage(result.imgData, 'PNG', 20, 35, imgWidth * scale, maxHeight);
          } else {
            pdf.addImage(result.imgData, 'PNG', 20, 35, imgWidth, imgHeight);
          }

          capturedCount++;
        }

        // Small delay between captures to prevent memory issues
        if (visibleComponents.length > 3) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (capturedCount === 0) {
        onToastMessage?.('No components could be captured', 'error');
        return;
      }

      // Save PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const phaseLabel = exportPhase === 'advanced' ? 'Advanced_Phase' :
        exportPhase === 'good' ? 'Good_Phase' :
          exportPhase === 'essential' ? 'Essential_Phase' : 'Initial_Phase';

      const filename = `${businessName.replace(/[^a-z0-9]/gi, '_')}_${phaseLabel}_${timestamp}.pdf`;
      pdf.save(filename);

      onToastMessage?.(`PDF exported successfully! ${capturedCount} sections included.`, 'success');

    } catch (error) {
      console.error('PDF export error:', error);
      onToastMessage?.('Failed to generate PDF. Please try again.', 'error');
    } finally {
      // Always restore changes
      if (changes.length > 0) {
        restoreChanges(changes);
      }
      setIsExportingPDF(false);
    }
  };

  // Determine button text and action based on export type
  const handleDownload = exportType === "strategic" ? handleDownloadStrategicAnalysis : handleDownloadPhaseAnalysis;

  // Get the actual export phase for display (only for analysis type)
  const exportPhase = exportType === "analysis" ? getExportPhase() : null;
  const phaseLabel = exportType === "strategic" ? "Strategic" :
    exportPhase === 'initial' ? 'Initial' :
      exportPhase === 'essential' ? 'Essential' :
        exportPhase === 'good' ? 'Good' : 'Advanced';

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
              Generating PDF
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              Capturing analysis...
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
          padding: "10px 18px",
          fontSize: "14px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          cursor: disabled || isExportingPDF ? "not-allowed" : "pointer",
          gap: "5px",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          ...style
        }}
        title={`Export ${phaseLabel} Phase PDF`}
      >
        {isExportingPDF ? (
          <>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Generating...
          </>
        ) : (
          <>
            <Download size={16} />
            Export PDF
          </>
        )}
      </button>
    </>
  );
};

export default PDFExportButton;