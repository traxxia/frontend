import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';

const HistoryPDFDownload = ({ 
  analysisData, 
  currentPhase, // This will be 'all' for user history
  businessName,
  userDetails,
  className = "",
  style = {}
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Function to determine actual export phase based on available analysis data
  const getExportPhase = () => {
    if (!analysisData) return 'initial';
    
    // Check if we have good phase data
    const hasGoodPhaseData = !!(
      analysisData.costEfficiency || 
      analysisData.financialPerformance || 
      analysisData.financialBalance || 
      analysisData.operationalEfficiency
    );
    if (hasGoodPhaseData) {
      return 'good';
    }
    
    // Check if we have essential phase data
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
    if (hasEssentialPhaseData) {
      return 'essential';
    }
    
    // Default to initial phase
    return 'initial';
  };

  // Define which components belong to each phase using data-component selectors
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
      // Include initial phase components first
      { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
      { selector: '[data-component="channel-heatmap"]', name: 'Channel Heatmap' },
      { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
      { selector: '[data-component="porters-analysis"]', name: 'Porter\'s Five Forces' },
      { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' },
      // Essential phase specific components
      { selector: '[data-component="full-swot"]', name: 'Full SWOT Portfolio' },
      { selector: '[data-component="customer-segmentation"]', name: 'Customer Segmentation' },
      { selector: '[data-component="competitive-advantage"]', name: 'Competitive Advantage Matrix' },
      { selector: '[data-component="channel-effectiveness"]', name: 'Channel Effectiveness Map' },
      { selector: '[data-component="expanded-capability"]', name: 'Expanded Capability Heatmap' },
      { selector: '[data-component="strategic-goals"]', name: 'Strategic Goals' },
      { selector: '[data-component="strategic-radar"]', name: 'Strategic Positioning Radar' },
      { selector: '[data-component="culture-profile"]', name: 'Organizational Culture Profile' },
      { selector: '[data-component="productivity"]', name: 'Productivity and Efficiency Metrics' },
      { selector: '[data-component="maturity"]', name: 'Business Maturity Score' }
    ],
    good: [
      // Include essential phase components first
      { selector: '[data-component="purchase-criteria"]', name: 'Purchase Criteria Matrix' },
      { selector: '[data-component="channel-heatmap"]', name: 'Channel Heatmap' },
      { selector: '[data-component="loyalty-nps"]', name: 'Loyalty & NPS Analysis' },
      { selector: '[data-component="porters-analysis"]', name: 'Porter\'s Five Forces' },
      { selector: '[data-component="pestel-analysis"]', name: 'PESTEL Analysis' },
      { selector: '[data-component="full-swot"]', name: 'Full SWOT Portfolio' },
      { selector: '[data-component="customer-segmentation"]', name: 'Customer Segmentation' },
      { selector: '[data-component="competitive-advantage"]', name: 'Competitive Advantage Matrix' },
      { selector: '[data-component="channel-effectiveness"]', name: 'Channel Effectiveness Map' },
      { selector: '[data-component="expanded-capability"]', name: 'Expanded Capability Heatmap' },
      { selector: '[data-component="strategic-goals"]', name: 'Strategic Goals' },
      { selector: '[data-component="strategic-radar"]', name: 'Strategic Positioning Radar' },
      { selector: '[data-component="culture-profile"]', name: 'Organizational Culture Profile' },
      { selector: '[data-component="productivity"]', name: 'Productivity and Efficiency Metrics' },
      { selector: '[data-component="maturity"]', name: 'Business Maturity Score' },
      // Good phase specific components
      { selector: '[data-component="cost-efficiency"]', name: 'Cost Efficiency Insight' },
      { selector: '[data-component="financial-performance"]', name: 'Financial Performance & Growth Trajectory' },
      { selector: '[data-component="financial-health"]', name: 'Financial Health Insight' },
      { selector: '[data-component="operational-efficiency"]', name: 'Operational Efficiency Insight' }
    ]
  };

  // Function to expand all cards and phases temporarily
  const expandAllContent = () => {
    const originalStates = [];
    
    // Expand all phase sections
    const phaseSections = document.querySelectorAll('.modern-phase-content');
    phaseSections.forEach((section, index) => {
      originalStates.push({
        element: section,
        type: 'phase',
        wasExpanded: section.classList.contains('expanded')
      });
      
      section.classList.remove('collapsed');
      section.classList.add('expanded');
      section.style.maxHeight = 'none';
      section.style.overflow = 'visible';
    });
    
    // Expand all analysis cards
    const allCards = document.querySelectorAll('.modern-card-content');
    allCards.forEach((card, index) => {
      originalStates.push({
        element: card,
        type: 'card',
        wasExpanded: card.classList.contains('expanded')
      });
      
      card.classList.remove('collapsed');
      card.classList.add('expanded');
      card.style.maxHeight = 'none';
      card.style.overflow = 'visible';
    });
    
    return originalStates;
  };

  // Function to restore original states
  const restoreOriginalStates = (originalStates) => {
    originalStates.forEach(({ element, wasExpanded }) => {
      if (!wasExpanded) {
        element.classList.remove('expanded');
        element.classList.add('collapsed');
        element.style.maxHeight = '';
        element.style.overflow = '';
      }
    });
  };

  const handleExport = async () => {
    // Dynamically determine the export phase based on available data
    const exportPhase = getExportPhase();
    
    if (!exportPhase || !phaseComponents[exportPhase]) {
      return;
    }

    // Check if we have any data to export for the determined phase
    const checkDataAvailability = () => {
      switch (exportPhase) {
        case 'initial':
          return document.querySelectorAll('[data-component*="swot"], [data-component*="purchase"], [data-component*="channel"], [data-component*="loyalty"], [data-component*="capability"], [data-component*="porter"], [data-component*="pestel"]').length > 0;
        case 'essential':
          return document.querySelectorAll('[data-component*="full-swot"], [data-component*="customer"], [data-component*="competitive"], [data-component*="channel-effectiveness"], [data-component*="expanded"], [data-component*="strategic"], [data-component*="culture"], [data-component*="productivity"], [data-component*="maturity"]').length > 0;
        case 'good':
          return document.querySelectorAll('[data-component*="cost-efficiency"], [data-component*="financial-performance"], [data-component*="financial-health"], [data-component*="operational-efficiency"]').length > 0;
        default:
          return false;
      }
    };

    if (!checkDataAvailability()) {
      console.warn(`No ${exportPhase} analysis data available to export`);
      return;
    }

    let originalStates = [];

    try {
      setIsExporting(true);

      // Expand all content temporarily
      originalStates = expandAllContent();
      
      // Wait for DOM to update and ensure content is visible
      await new Promise(resolve => setTimeout(resolve, 800));

      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let isFirstPage = true;

      // Helper function to capture a single component
      const captureComponent = async (componentSelector, componentName) => {
        const component = document.querySelector(componentSelector);
        if (!component || component.offsetHeight === 0 || component.offsetWidth === 0) {
          console.warn(`Component not found or not visible: ${componentName}`);
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
            logging: false,
            windowWidth: component.scrollWidth,
            windowHeight: component.scrollHeight
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

      // Helper function to add conversation history
      const addConversationHistory = async () => {
        if (!userDetails?.conversation || userDetails.conversation.length === 0) {
          return false;
        }

        if (!isFirstPage) pdf.addPage();
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text('Conversation History', 20, 25);

        let yPosition = 40;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');

        userDetails.conversation.forEach((phase, phaseIndex) => {
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

        isFirstPage = false;
        return true;
      };

      // Add PDF cover page with dynamically determined phase title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      const phaseTitle = exportPhase === 'initial' ? 'Initial Phase Analysis' : 
                        exportPhase === 'essential' ? 'Essential Phase Analysis' : 
                        'Good Phase Analysis';
      pdf.text(phaseTitle, pageWidth / 2, 30, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(businessName, pageWidth / 2, 45, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 55, { align: 'center' });

      isFirstPage = false;

      // Add conversation history first
      await addConversationHistory();

      // Capture all components for the dynamically determined export phase
      const components = phaseComponents[exportPhase];
      let capturedCount = 0;

      for (const component of components) {
        const success = await captureComponent(component.selector, component.name);
        if (success) {
          capturedCount++;
        }
        // Small delay between captures to ensure rendering
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (capturedCount === 0) {
        console.warn('No analysis components found to capture');
      }

      // Generate filename with dynamically determined phase
      const phaseLabel = exportPhase.charAt(0).toUpperCase() + exportPhase.slice(1);
      const filename = `${businessName.replace(/[^a-z0-9]/gi, '_')}_${phaseLabel}_Phase_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save the PDF
      pdf.save(filename);

    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      // Always restore original states
      if (originalStates.length > 0) {
        restoreOriginalStates(originalStates);
      }
      
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {isExporting && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)',
            pointerEvents: 'auto'
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
              minWidth: '320px',
              border: '2px solid #e2e8f0'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
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
              Creating analysis for {businessName}...
            </p>
          </div>
        </div>
      )}
      
      <button
        onClick={handleExport}
        disabled={isExporting || !analysisData}
        className={`${className} ${isExporting ? 'animate-pulse' : ''}`}
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
        onMouseEnter={(e) => {
          if (!isExporting && analysisData) {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 4px 12px rgba(26, 115, 232, 0.3)";
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
        }}
        title={`Export PDF`}
      >
        {isExporting ? (
          <>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Generating PDF...
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

export default HistoryPDFDownload;