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

const getExportPhase = (unlockedFeatures = {}) => {
  if (unlockedFeatures.advancedPhase) return 'advanced';
  if (unlockedFeatures.goodPhase || unlockedFeatures.hasDocument) return 'good';
  if (unlockedFeatures.essentialPhase || unlockedFeatures.fullSwot) return 'essential';
  if (unlockedFeatures.initialPhase || unlockedFeatures.analysis) return 'initial';
  return 'initial';
};
const captureComponent = async (selector, name, html2canvas) => {
  const component = document.querySelector(selector);
  if (!component) {
    return null;
  }
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    const canvas = await html2canvas(component, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 60000,
      onclone: (clonedDoc) => {
        const style = clonedDoc.createElement('style');
        style.innerHTML = `

          .collapsed, .modern-card-content.collapsed, .modern-phase-content.collapsed, .section-container.collapsed {
            max-height: none !important;
            height: auto !important;
            visibility: visible !important;
            display: block !important;
            opacity: 1 !important;
            overflow: visible !important;
          }
          .modern-card-content, .modern-phase-content, .section-container {
            max-height: none !important;
            height: auto !important;
            display: block !important;
            overflow: visible !important;
          }

          .recharts-responsive-container, .ch-chart-wrapper, .ch-chart-section {
            width: 900px !important;
            height: 400px !important;
            min-width: 900px !important;
            min-height: 400px !important;
            visibility: visible !important;
            display: block !important;
          }

          svg {
            overflow: visible !important;
            visibility: visible !important;
            filter: none !important;
            transform: none !important;
          }

          tr {
            opacity: 1 !important;
            visibility: visible !important;
            display: table-row !important;
          }
          td, th {
            opacity: 1 !important;
            visibility: visible !important;
          }
        `;
        clonedDoc.head.appendChild(style);

        const clonedEl = clonedDoc.querySelector(selector);
        if (clonedEl) {
          let parent = clonedEl.parentElement;
          while (parent) {
            parent.style.maxHeight = 'none';
            parent.style.height = 'auto';
            parent.style.overflow = 'visible';
            parent.style.display = 'block';
            parent = parent.parentElement;
          }
          const allSVGs = clonedEl.querySelectorAll('svg');
          allSVGs.forEach((svg) => {
            if (svg.classList.contains('lucide')) return;
            svg.style.display = 'block';
            svg.style.visibility = 'visible';
            svg.style.opacity = '1';
            svg.style.filter = 'none';
            svg.style.transition = 'none';
            svg.style.animation = 'none';
            const parent = svg.closest('.recharts-responsive-container, .ch-chart-wrapper');
            if (parent) {
              parent.style.display = 'block';
              parent.style.visibility = 'visible';
              parent.style.height = '400px';
              parent.style.width = '900px';
            }
          });
          const uiJunk = clonedEl.querySelectorAll('button, .regenerate-button, .dropdown-button, .help-icon, .tooltip, .modern-expand-btn');
          uiJunk.forEach(el => el.style.display = 'none');
          clonedEl.style.display = 'block';
          clonedEl.style.visibility = 'visible';
          clonedEl.style.maxHeight = 'none';
          clonedEl.style.height = 'auto';
          clonedEl.style.padding = '40px';
          clonedEl.style.backgroundColor = '#ffffff';
          clonedEl.style.width = '1000px';
          clonedEl.style.overflow = 'visible';
          const allText = clonedEl.querySelectorAll('text, span, p, h1, h2, h3, h4');
          allText.forEach(t => {
            t.style.opacity = '1';
            t.style.visibility = 'visible';
          });
        }
      }
    });

    return {
      canvas: canvas,
      name: name
    };
  } catch (error) {
    console.error(`[PDF Export] Failed to capture ${name}:`, error);
    return null;
  }
};

const PDFExportButton = ({
  businessName,
  onToastMessage,
  disabled = false,
  className = "",
  style = {},
  exportType = "insights",
  unlockedFeatures = {},
  showText = false,
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, sectionName: '' });
  const { t } = useTranslation();

  const handleDownload = useCallback(async () => {
    try {
      setIsExportingPDF(true);
      setExportProgress({ current: 0, total: 0, sectionName: 'Preparing document...' });

      document.body.classList.add('generating-pdf');

      await new Promise(resolve => setTimeout(resolve, 500));

      const forceStyle = document.createElement('style');
      forceStyle.id = 'force-pdf-styles';
      forceStyle.innerHTML = `
        body.generating-pdf .collapsed,
        body.generating-pdf .modern-card-content.collapsed,
        body.generating-pdf .modern-phase-content.collapsed,
        body.generating-pdf .category-content.collapsed {
          max-height: none !important;
          height: auto !important;
          visibility: visible !important;
          display: block !important;
          opacity: 1 !important;
          overflow: visible !important;
        }
        body.generating-pdf .modern-analysis-card {
          margin-bottom: 40px !important;
        }
      `;
      document.head.appendChild(forceStyle);
      await new Promise(resolve => setTimeout(resolve, 1500));
      const [jsPDFModule, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);
      const jsPDF = jsPDFModule.default;
      const html2canvas = html2canvasModule.default;
      const exportPhase = (exportType === "advanced-brief" || exportType === "executive") ? exportType : getExportPhase(unlockedFeatures);

      let rawComponents = (exportType === "strategic")
        ? [
            { selector: '[data-component="strategic-direction"]', name: 'Direction & Positioning' },
            { selector: '[data-component="strategic-execution"]', name: 'Execution & Monitoring' },
            { selector: '[data-component="strategic-sustainability"]', name: 'Sustainability & Reinforcement' }
          ]
        : (PHASE_COMPONENTS[exportPhase] || []);
      const components = rawComponents.filter(comp => {
        const el = document.querySelector(comp.selector);
        return el !== null;
      });

      if (components.length === 0) {
        console.warn("[PDF Export] No components found to export!");
        onToastMessage?.('No content available for export', 'warning');
        document.body.classList.remove('generating-pdf');
        forceStyle.remove();
        setIsExportingPDF(false);
        return;
      }
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(26, 115, 232);
      pdf.text(exportType === 'strategic' ? 'Strategic Analysis' : 'Insight Analysis Report', pageWidth / 2, 40, { align: 'center' });

      pdf.setFontSize(16);
      pdf.setTextColor(60, 60, 60);
      pdf.text(businessName, pageWidth / 2, 55, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(130, 130, 130);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 65, { align: 'center' });
      let capturedResults = [];
      setExportProgress({ current: 0, total: components.length, sectionName: 'Starting capture...' });

      for (let i = 0; i < components.length; i++) {
        const comp = components[i];
        setExportProgress({ current: i + 1, total: components.length, sectionName: `Capturing ${comp.name}...` });
        const element = document.querySelector(comp.selector);
        if (element) {
          element.scrollIntoView({ block: 'center' });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const result = await captureComponent(comp.selector, comp.name, html2canvas);
        if (result) capturedResults.push(result);
      }
      let yOffset = 75;

      for (let i = 0; i < capturedResults.length; i++) {
        const { name, canvas, imgData } = capturedResults[i];
        setExportProgress({ current: i + 1, total: capturedResults.length, sectionName: `Adding ${name} to PDF...` });

        const margin = 15;
        const availableWidth = pageWidth - (margin * 2);
        const imgWidth = availableWidth;
        const fullImgHeight = (canvas.height * imgWidth) / canvas.width;

        let sY = 0;
        let remainingImgHeight = fullImgHeight;
        let isFirstSlice = true;

         while (remainingImgHeight > 0.1) {
          let spaceLeftOnPage = pageHeight - yOffset - 15;
          if (spaceLeftOnPage < 20) {
            pdf.addPage();
            yOffset = 20;
            spaceLeftOnPage = pageHeight - yOffset - 15;
          }

          const sliceHeightOnPage = Math.min(remainingImgHeight, spaceLeftOnPage);
          const sourceSliceHeight = (sliceHeightOnPage * canvas.width) / imgWidth;

          if (isFirstSlice) {
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(26, 115, 232);
            pdf.text(name, margin, yOffset);
            yOffset += 7;
          } else {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(150, 150, 150);
            pdf.text(`${name} (continued)`, margin, yOffset);
            yOffset += 7;
          }

          try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = Math.max(1, sourceSliceHeight);
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, sY, canvas.width, sourceSliceHeight, 0, 0, canvas.width, sourceSliceHeight);

            const sliceData = tempCanvas.toDataURL('image/jpeg', 0.85);
            pdf.addImage(sliceData, 'JPEG', margin, yOffset, imgWidth, sliceHeightOnPage, undefined, 'FAST');
          } catch (err) {
            console.error(`[PDF Export] Slice error for ${name}:`, err);
          }

          remainingImgHeight -= sliceHeightOnPage;
          sY += sourceSliceHeight;
          isFirstSlice = false;

          if (remainingImgHeight > 0.1) {
            pdf.addPage();
            yOffset = 20;
          } else {
            yOffset += sliceHeightOnPage + 15;
          }
        }
      }
      const filename = `${businessName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      onToastMessage?.('PDF downloaded successfully', 'success');

    } catch (error) {
      console.error('Export Error:', error);
      onToastMessage?.('Failed to export PDF', 'error');
    } finally {
      document.body.classList.remove('generating-pdf');
      const forceStyle = document.getElementById('force-pdf-styles');
      if (forceStyle) forceStyle.remove();

      setIsExportingPDF(false);
      setExportProgress({ current: 0, total: 0, sectionName: '' });
    }
  }, [businessName, exportType, unlockedFeatures, onToastMessage]);

  return (
    <>
      {isExportingPDF && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '30px',
            textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', minWidth: '320px'
          }}>
            <Loader size={40} style={{ color: '#1a73e8', animation: 'spin 1.5s linear infinite', marginBottom: '15px' }} />
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>{t("Generating PDF")}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{exportProgress.sectionName}</p>
            {exportProgress.total > 0 && (
              <div style={{ marginTop: '15px', fontSize: '16px', color: '#1a73e8', fontWeight: 'bold' }}>
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
          backgroundColor: "#1a73e8", color: "#fff", border: "none", borderRadius: "10px",
          padding: showText ? "10px 18px" : "10px", width: showText ? "auto" : "40px",
          height: "40px", fontSize: "14px", fontWeight: 600, display: "flex",
          alignItems: "center", justifyContent: "center", gap: "8px",
          cursor: disabled || isExportingPDF ? "not-allowed" : "pointer",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", ...style
        }}
      >
        <FileDown size={18} />
        {showText && <span>{t("Export_PDF")}</span>}
      </button>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default PDFExportButton;
