import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";

const PDFExportButton = ({ 
  analysisResult, 
  businessName, 
  onToastMessage,
  disabled = false,
  className = "",
  style = {}
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { t } = useTranslation();

  const handleDownloadAnalysis = async () => {
    if (!analysisResult) {
      onToastMessage("No analysis available to export", "warning");
      return;
    }

    try {
      setIsExportingPDF(true);
      onToastMessage("Capturing each analysis component...", "info");

      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let isFirstPage = true;

      // Store current state
      const originalPhase = document.querySelector('.phase-tab.active')?.textContent || '';

      // Helper function to capture a single component
      const captureComponent = async (componentSelector, componentName) => {
        const component = document.querySelector(componentSelector);
        if (!component) return false;

        try {
          // Hide buttons in this component
          const buttons = component.querySelectorAll('button');
          const originalDisplay = [];
          buttons.forEach((btn, index) => {
            originalDisplay[index] = btn.style.display;
            btn.style.display = 'none';
          });

          // Capture the component
          const canvas = await html2canvas(component, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false
          });

          // Restore buttons
          buttons.forEach((btn, index) => {
            btn.style.display = originalDisplay[index];
          });

          // Add to PDF
          if (!isFirstPage) {
            pdf.addPage();
          }

          // Add component title
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 123, 255);
          pdf.text(componentName, 20, 25);

          // Add component image
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40; // 20mm margin on each side
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Check if image fits on page, if not scale it down
          const maxHeight = pageHeight - 60; // Leave space for title and margins
          const finalHeight = imgHeight > maxHeight ? maxHeight : imgHeight;
          const finalWidth = imgHeight > maxHeight ? (canvas.width * maxHeight) / canvas.height : imgWidth;

          pdf.addImage(imgData, 'PNG', 20, 35, finalWidth, finalHeight);

          isFirstPage = false;
          return true;

        } catch (error) {
          console.warn(`Failed to capture ${componentName}:`, error);
          return false;
        }
      };

      // Function to switch phase and wait
      const switchToPhase = async (phaseName) => {
        const phaseButtons = document.querySelectorAll('.phase-tab');
        const targetButton = Array.from(phaseButtons).find(btn => 
          btn.textContent.toLowerCase().includes(phaseName.toLowerCase())
        );
        
        if (targetButton && !targetButton.classList.contains('active')) {
          targetButton.click();
          await new Promise(resolve => setTimeout(resolve, 800)); // Wait for content to load
        }
      };

      // Add PDF header on first page
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 123, 255);
      pdf.text('Complete Business Analysis Report', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(businessName, pageWidth / 2, 30, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 38, { align: 'center' });

      isFirstPage = false;

      // CAPTURE INITIAL PHASE COMPONENTS
      await switchToPhase('initial');
      
      pdf.addPage();
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 123, 255);
      pdf.text('Initial Phase Analysis', 20, 25);

      // List of components to capture for Initial Phase
      const initialComponents = [
        { selector: '.swot-analysis-container, [class*="swot"]', name: 'SWOT Analysis' },
        { selector: '.purchase-criteria-container, [class*="purchase"]', name: 'Purchase Criteria Matrix' },
        { selector: '.channel-heatmap-container, [class*="channel-heatmap"]', name: 'Channel Heatmap' },
        { selector: '.loyalty-nps-container, [class*="loyalty"]', name: 'Loyalty & NPS Analysis' },
        { selector: '.capability-heatmap-container, [class*="capability-heatmap"]', name: 'Capability Heatmap' },
        { selector: '.porters-container, [class*="porter"]', name: 'Porter\'s Five Forces' },
        { selector: '.pestel-container, [class*="pestel"]', name: 'PESTEL Analysis' }
      ];

      for (const component of initialComponents) {
        await captureComponent(component.selector, component.name);
        await new Promise(resolve => setTimeout(resolve, 300)); // Small delay between captures
      }

      // CAPTURE ESSENTIAL PHASE COMPONENTS
      const phaseButtons = document.querySelectorAll('.phase-tab');
      const hasEssentialPhase = Array.from(phaseButtons).some(btn => 
        btn.textContent.toLowerCase().includes('essential')
      );

      if (hasEssentialPhase) {
        await switchToPhase('essential');
        
        pdf.addPage();
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 123, 255);
        pdf.text('Essential Phase Analysis', 20, 25);

        const essentialComponents = [
          { selector: '.full-swot-container, [class*="full-swot"]', name: 'Full SWOT Portfolio' },
          { selector: '.customer-segmentation-container, [class*="customer-segment"]', name: 'Customer Segmentation' },
          { selector: '.competitive-advantage-container, [class*="competitive-advantage"]', name: 'Competitive Advantage Matrix' },
          { selector: '.channel-effectiveness-container, [class*="channel-effectiveness"]', name: 'Channel Effectiveness Map' },
          { selector: '.expanded-capability-container, [class*="expanded-capability"]', name: 'Expanded Capability Heatmap' },
          { selector: '.strategic-goals-container, [class*="strategic-goals"]', name: 'Strategic Goals' },
          { selector: '.strategic-radar-container, [class*="strategic-radar"]', name: 'Strategic Positioning Radar' },
          { selector: '.culture-profile-container, [class*="culture-profile"]', name: 'Organizational Culture Profile' },
          { selector: '.productivity-container, [class*="productivity"]', name: 'Productivity Metrics' },
          { selector: '.maturity-container, [class*="maturity"]', name: 'Maturity Score' }
        ];

        for (const component of essentialComponents) {
          await captureComponent(component.selector, component.name);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Restore original phase
      if (originalPhase) {
        const restoreButton = Array.from(phaseButtons).find(btn => 
          btn.textContent.trim() === originalPhase
        );
        if (restoreButton) {
          restoreButton.click();
        }
      }

      // Save PDF
      const filename = `${businessName.replace(/[^a-z0-9]/gi, '_')}_Complete_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      onToastMessage("Complete analysis PDF generated successfully!", "success");

    } catch (error) {
      console.error('PDF generation error:', error);
      onToastMessage("Failed to generate PDF. Please try again.", "error");
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <button
      onClick={handleDownloadAnalysis}
      disabled={disabled || isExportingPDF || !analysisResult}
      className={className}
      style={{
        backgroundColor: "#1a73e8",
        color: "#fff",
        border: "none",
        borderRadius: "13px",
        padding: "10px 18px",
        fontSize: "14px",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        cursor: disabled || isExportingPDF || !analysisResult ? "not-allowed" : "pointer",
        opacity: disabled || isExportingPDF || !analysisResult ? 0.6 : 1,
        ...style
      }}
    >
      {isExportingPDF ? (
        <>
          <Loader size={16} className="spinner" style={{ marginRight: 8 }} />
          Capturing Components...
        </>
      ) : (
        <>
          {t("Download Analysis") || "Download Analysis"}
          <Download size={16} style={{ marginLeft: 8 }} />
        </>
      )}
    </button>
  );
};

export default PDFExportButton;