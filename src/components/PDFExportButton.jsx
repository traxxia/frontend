import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";

const PDFExportButton = ({ 
  businessName, 
  onToastMessage,
  currentPhase, // 'initial' or 'essential'
  disabled = false,
  isChannelHeatmapReady = true,
  isCapabilityHeatmapReady = true,
  className = "",
  style = {}
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { t } = useTranslation();

  // Define which components belong to each phase
  const phaseComponents = {
    initial: [
      { selector: '.swot-analysis-container, [class*="swot"]', name: 'SWOT Analysis' },
      { selector: '.purchase-criteria-container, [class*="purchase"]', name: 'Purchase Criteria Matrix' },
      { selector: '.channel-heatmap-container, [class*="channel-heatmap"]', name: 'Channel Heatmap' },
      { selector: '.loyalty-nps-container, [class*="loyalty"]', name: 'Loyalty & NPS Analysis' },
      { selector: '.capability-heatmap, [class*="capability-heatmap"]', name: 'Capability Heatmap' },
      { selector: '.porters-container, [class*="porter"]', name: 'Porter\'s Five Forces' },
      { selector: '.pestel-container, [class*="pestel"]', name: 'PESTEL Analysis' }
    ],
    essential: [
      { selector: '.full-swot-container, [class*="full-swot"]', name: 'Full SWOT Portfolio' },
      { selector: '.customer-segmentation-container, [class*="customer-segment"]', name: 'Customer Segmentation' },
      { selector: '.competitive-advantage-container, [class*="competitive-advantage"]', name: 'Competitive Advantage Matrix' },
      { selector: '.channel-effectiveness-container, [class*="channel-effectiveness"]', name: 'Channel Effectiveness Map' },
      { selector: '.expanded-capability-container, [class*="expanded-capability"]', name: 'Expanded Capability Heatmap' },
      { selector: '.strategic-goals-container, [class*="strategic-goals"]', name: 'Strategic Goals' },
      { selector: '.strategic-radar-container, [class*="strategic-radar"]', name: 'Strategic Positioning Radar' },
      { selector: '.culture-profile-container, [class*="culture-profile"]', name: 'Organizational Culture Profile' },
      { selector: '.productivity-container, [class*="productivity"]', name: 'Productivity and Efficiency Metrics' },
      { selector: '.maturity-container', name: 'Business Maturity Score' }
    ]
  };

  const handleDownloadPhaseAnalysis = async () => {
    if (!currentPhase || !phaseComponents[currentPhase]) {
      onToastMessage("No analysis available for this phase", "warning");
      return;
    }
    if (currentPhase === 'initial') {
  if (!isChannelHeatmapReady || !isCapabilityHeatmapReady) {
    onToastMessage(
      "Please wait for Channel Heatmap and Capability Heatmap to finish loading before exporting PDF",
      "warning"
    );
    return;
  }
}

    try {
      setIsExportingPDF(true);
      onToastMessage(`Generating ${currentPhase} phase PDF...`, "info");

      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let isFirstPage = true;

      // Helper function to capture a single component
     const captureComponent = async (componentSelector, componentName) => {
  const component = document.querySelector(componentSelector);
  if (!component) {
    console.warn(`Component not found: ${componentName}`);
    return false;
  }

  // Save and remove scroll restrictions for heatmap scroll areas
  const scrollAreas = component.querySelectorAll('.ch-heatmap-scroll');
  const originalStyles = [];
  scrollAreas.forEach((area, i) => {
    originalStyles[i] = {
      overflowX: area.style.overflowX,
      width: area.style.width,
      maxWidth: area.style.maxWidth
    };
    area.style.overflowX = 'visible';
    area.style.width = 'auto';
    area.style.maxWidth = 'none';
  });

  // Hide all buttons
  const buttons = component.querySelectorAll('button');
  const originalDisplay = [];
  buttons.forEach((btn, index) => {
    originalDisplay[index] = btn.style.display;
    btn.style.display = 'none';
  });

  try {
    const canvas = await html2canvas(component, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    if (!isFirstPage) pdf.addPage();
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text(componentName, 20, 25);

    const imgData = canvas.toDataURL('image/png', 0.8);
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const maxHeight = pageHeight - 60;
    const finalHeight = imgHeight > maxHeight ? maxHeight : imgHeight;
    const finalWidth = imgHeight > maxHeight ? (canvas.width * maxHeight) / canvas.height : imgWidth;

    pdf.addImage(imgData, 'PNG', 20, 35, finalWidth, finalHeight);
    isFirstPage = false;

    return true;
  } catch (error) {
    console.error(`Failed to capture ${componentName}:`, error);
    return false;
  } finally {
    // Restore button visibility
    buttons.forEach((btn, index) => {
      btn.style.display = originalDisplay[index];
    });

    // Restore original scroll styles
    scrollAreas.forEach((area, i) => {
      area.style.overflowX = originalStyles[i].overflowX;
      area.style.width = originalStyles[i].width;
      area.style.maxWidth = originalStyles[i].maxWidth;
    });
  }
};


      // Add PDF cover page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      const phaseTitle = currentPhase === 'initial' ? 'Initial Phase Analysis' : 'Essential Phase Analysis';
      pdf.text(phaseTitle, pageWidth / 2, 30, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(businessName, pageWidth / 2, 45, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 55, { align: 'center' });

      isFirstPage = false;

      // Capture all components for the current phase
      const components = phaseComponents[currentPhase];
      let capturedCount = 0;

      for (const component of components) {
        const success = await captureComponent(component.selector, component.name);
        if (success) {
          capturedCount++;
        }
        // Small delay between captures to ensure rendering
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (capturedCount === 0) {
        onToastMessage(`No analysis components found for ${currentPhase} phase`, "warning");
        return;
      }

      // Generate filename
      const phaseLabel = currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1);
      const filename = `${businessName.replace(/[^a-z0-9]/gi, '_')}_${phaseLabel}_Phase_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save the PDF
      pdf.save(filename);

      onToastMessage(`${phaseLabel} phase PDF generated successfully! (${capturedCount} components captured)`, "success");

    } catch (error) {
      console.error('PDF generation error:', error);
      onToastMessage("Failed to generate PDF. Please try again.", "error");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const phaseLabel = currentPhase === 'initial' ? 'Initial' : 'Essential';

  return (
    <>
      {/* Loading Overlay */}
      {isExportingPDF && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
              minWidth: '300px',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <div
              style={{
                marginBottom: '20px'
              }}
            >
              <Loader 
                size={48} 
                style={{
                  color: '#1a73e8',
                  animation: 'spin 1s linear infinite'
                }} 
              />
            </div>
            <h3
              style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937'
              }}
            >
              Generating PDF
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: '#6b7280'
              }}
            >
              Creating {phaseLabel} phase analysis for {businessName}...
            </p>
          </div>
        </div>
      )}
      
      <button
        onClick={handleDownloadPhaseAnalysis}
        disabled={disabled || isExportingPDF}
        className={className}
        style={{
          backgroundColor: isExportingPDF ? "#f3f4f6" : "#1a73e8",
          color: isExportingPDF ? "#6b7280" : "#fff",
          border: "none",
          borderRadius: "10px",
          padding: "10px 18px",
          fontSize: "14px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          cursor: disabled || isExportingPDF ? "not-allowed" : "pointer",
          gap: "8px",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          ...style
        }}
        onMouseEnter={(e) => {
          if (!isExportingPDF && !disabled) {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 4px 12px rgba(26, 115, 232, 0.3)";
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
        }}
      >
        {isExportingPDF ? (
          <>
            <Loader size={16} className="animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download size={16} />
            Download
          </>
        )}
      </button>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default PDFExportButton;