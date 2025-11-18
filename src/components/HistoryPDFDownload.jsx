import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const HistoryPDFDownload = ({ 
  analysisData, 
  currentPhase, 
  businessName,
  userDetails,
  className = "",
  style = {}
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { t } = useTranslation();

  // Function to determine actual export phase based on available analysis data
  const getExportPhase = () => {
    if (!analysisData) return 'initial';
    
    const hasGoodPhaseData = !!(
      analysisData.costEfficiency || 
      analysisData.financialPerformance || 
      analysisData.financialBalance || 
      analysisData.operationalEfficiency
    );
    if (hasGoodPhaseData) return 'good';
    
    const hasEssentialPhaseData = !!(
      analysisData.fullSwot || 
      analysisData.customerSegmentation || 
      analysisData.competitiveAdvantage || 
      analysisData.channelEffectiveness || 
      analysisData.expandedCapability || 
      analysisData.strategicGoals || 
      analysisData.strategicRadar || 
      analysisData.cultureProfile || 
      analysisData.productivityMetrics || 
      analysisData.maturityScore
    );
    if (hasEssentialPhaseData) return 'essential';
    
    return 'initial';
  };

  // Complete component list - same as original
  const phaseComponents = {
    initial: [
      { selector: '[data-component="swot-analysis"]', name: 'SWOT Analysis' },
      { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
      { selector: '[data-component="channel-heatmap"]', name: 'Channel Heatmap' },
      { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
      { selector: '[data-component="capability-heatmap"]', name: 'Capability Heatmap' },
      { selector: '[data-component="porters-analysis"]', name: 'Porter\'s Five Forces' },
      { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' }
    ],
    essential: [
      { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
      { selector: '[data-component="channel-heatmap"]', name: 'Channel Heatmap' },
      { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
      { selector: '[data-component="porters-analysis"]', name: 'Porter\'s Five Forces' },
      { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' },
      { selector: '[data-component="full-swot"]', name: 'Full SWOT Portfolio' },
      { selector: '[data-component="customer-segmentation"]', name: 'Customer Segmentation' },
      { selector: '[data-component="competitive-advantage"]', name: 'Competitive Advantage Matrix' },
      { selector: '[data-component="channel-effectiveness"]', name: 'Channel Effectiveness Map' },
      { selector: '[data-component="expanded-capability"]', name: 'Capability Heatmap' },
      { selector: '[data-component="strategic-goals"]', name: 'Strategic Goals' },
      { selector: '[data-component="strategic-radar"]', name: 'Strategic Positioning Radar' },
      { selector: '[data-component="culture-profile"]', name: 'Organizational Culture Profile' },
      { selector: '[data-component="productivity"]', name: 'Productivity and Efficiency Metrics' },
      { selector: '[data-component="maturity"]', name: 'Business Maturity Score' }
    ],
    good: [
      { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
      { selector: '[data-component="channel-heatmap"]', name: 'Channel Heatmap' },
      { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
      { selector: '[data-component="porters-analysis"]', name: 'Porter\'s Five Forces' },
      { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' },
      { selector: '[data-component="full-swot"]', name: 'Full SWOT Portfolio' },
      { selector: '[data-component="customer-segmentation"]', name: 'Customer Segmentation' },
      { selector: '[data-component="competitive-advantage"]', name: 'Competitive Advantage Matrix' },
      { selector: '[data-component="channel-effectiveness"]', name: 'Channel Effectiveness Map' },
      { selector: '[data-component="expanded-capability"]', name: 'Capability Heatmap' },
      { selector: '[data-component="strategic-goals"]', name: 'Strategic Goals' },
      { selector: '[data-component="strategic-radar"]', name: 'Strategic Positioning Radar' },
      { selector: '[data-component="culture-profile"]', name: 'Organizational Culture Profile' },
      { selector: '[data-component="productivity"]', name: 'Productivity and Efficiency Metrics' },
      { selector: '[data-component="maturity"]', name: 'Business Maturity Score' },
      { selector: '[data-component="cost-efficiency"]', name: 'Cost Efficiency Insight' },
      { selector: '[data-component="financial-performance"]', name: 'Financial Performance & Growth Trajectory' },
      { selector: '[data-component="financial-health"]', name: 'Financial Health Insight' },
      { selector: '[data-component="operational-efficiency"]', name: 'Operational Efficiency Insight' }
    ]
  };

  // Fast preparation function
  const prepareForCapture = () => {
    const changes = [];
    
    // Expand all cards instantly
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

    // Expand all phase sections
    const phaseSections = document.querySelectorAll('.modern-phase-content.collapsed');
    phaseSections.forEach(section => {
      changes.push({
        element: section,
        property: 'className',
        oldValue: section.className,
        newValue: section.className.replace('collapsed', 'expanded')
      });
      section.className = section.className.replace('collapsed', 'expanded');
      section.style.maxHeight = 'none';
      section.style.overflow = 'visible';
    });

    // Hide buttons
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

    // Fix overflow for scroll containers
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

  // Optimized capture with better zoom level
  const captureComponent = async (selector, name) => {
    const component = document.querySelector(selector);
    if (!component || component.offsetHeight === 0) {
      return null;
    }

    try {
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(component, {
        scale: 0.8, // Zoomed out for better overview
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true,
        imageTimeout: 3000,
        onclone: (clonedDoc) => {
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

  // Original conversation history function
  const addConversationHistory = async (pdf, pageWidth, pageHeight) => {
    if (!userDetails?.conversation || userDetails.conversation.length === 0) {
      return false;
    }

    pdf.addPage();
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('Conversation History', 20, 25);

    let yPosition = 40;
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');

    userDetails.conversation.forEach((phase) => {
      // Add phase header
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1)} Phase`, 20, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');

      phase.questions?.forEach((qa, qaIndex) => {
        // Question
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const questionLines = pdf.splitTextToSize(`Q${qaIndex + 1}: ${qa.question}`, pageWidth - 40);
        questionLines.forEach(line => {
          if (yPosition > pageHeight - 10) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 4;
        });

        // Answer
        yPosition += 2;
        const answerLines = pdf.splitTextToSize(`A: ${qa.answer}`, pageWidth - 40);
        answerLines.forEach(line => {
          if (yPosition > pageHeight - 10) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 4;
        });
        
        yPosition += 4; // Space between Q&A pairs
      });
      
      yPosition += 6; // Space between phases
    });

    return true;
  };

  // Main optimized export function
  const handleFastExport = async () => {
    if (isExporting) return;

    const exportPhase = getExportPhase();
    
    if (!exportPhase || !phaseComponents[exportPhase]) {
      return;
    }

    let changes = [];

    try {
      setIsExporting(true);

      // Fast preparation
      changes = prepareForCapture();

      // Short wait for DOM to settle
      await new Promise(resolve => setTimeout(resolve, 150));

      // Dynamic imports
      const jsPDF = (await import('jspdf')).default;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Title page - same as original
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      const phaseTitle = 'Analysis Result';
      pdf.text(phaseTitle, pageWidth / 2, 30, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(businessName, pageWidth / 2, 45, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 55, { align: 'center' });

      // Add conversation history
      await addConversationHistory(pdf, pageWidth, pageHeight);

      // Filter to only visible components with content - same as original
      const components = phaseComponents[exportPhase].filter(({ selector }) => {
        const element = document.querySelector(selector);
        return element && 
               element.offsetHeight > 50 && 
               element.offsetWidth > 50 &&
               !element.closest('.collapsed');
      });

      if (components.length === 0) {
        console.warn('No content available to export');
        return;
      }

      // Capture components in batches of 3 for faster processing
      let capturedCount = 0;
      
      for (let i = 0; i < components.length; i += 3) {
        const batch = components.slice(i, i + 3);
        
        const results = await Promise.all(
          batch.map(({ selector, name }) => captureComponent(selector, name))
        );

        results.forEach(result => {
          if (result) {
            pdf.addPage();
            
            // Add section title
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(59, 130, 246);
            pdf.text(result.name, 20, 25);

            // Calculate image dimensions to fit page - same as original
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
        });
        
        // Small delay between batches
        if (i + 3 < components.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      if (capturedCount === 0) {
        console.warn('No components could be captured');
        return;
      }

      // Generate filename - same as original
      const timestamp = new Date().toISOString().split('T')[0];
      const phaseLabel = exportPhase.charAt(0).toUpperCase() + exportPhase.slice(1);
      const filename = `${businessName.replace(/[^a-z0-9]/gi, '_')}_${phaseLabel}_Phase_${timestamp}.pdf`;
      
      // Save the PDF
      pdf.save(filename);

    } catch (error) {
      console.error('PDF export error:', error);
    } finally {
      // Always restore changes
      if (changes.length > 0) {
        restoreChanges(changes);
      }
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Loading overlay - same as original */}
      {isExporting && (
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
              Creating analysis for {businessName}...
            </p>
          </div>
        </div>
      )}
      
      <button
        onClick={handleFastExport}
        disabled={isExporting || !analysisData}
        className={className}
        style={{
          backgroundColor: isExporting ? "#f3f4f6" : "#1a73e8",
          color: isExporting ? "#6b7280" : "#fff",
          border: "none",
          borderRadius: "10px",
          padding: "10px 18px",
          fontSize: "14px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          cursor: isExporting || !analysisData ? "not-allowed" : "pointer",
          gap: "8px",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          ...style
        }}
        title="Export PDF"
      >
        {isExporting ? (
          <>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Generating...
          </>
        ) : (
          <>
            <Download size={16} />
            {t("Export_PDF")}
          </>
        )}
      </button>
    </>
  );
};

export default HistoryPDFDownload;