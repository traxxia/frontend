import React, { useState } from 'react';
import { FileText, Download, Loader } from 'lucide-react';
import SwotAnalysis from './SwotAnalysis';
import CustomerSegmentation from './CustomerSegmentation';
import PurchaseCriteria from './PurchaseCriteria';
import ChannelHeatmap from './ChannelHeatmap';
import LoyaltyNPS from './LoyaltyNPS';
import CapabilityHeatmap from './CapabilityHeatmap';
import { render } from 'react-dom';

const PDFExportComponent = ({
  user,
  userDetails,
  onToast,
  className = "",
  buttonText = "Export PDF Report",
  buttonSize = "medium"
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Parse analysis data from userDetails
  const parseAnalysisData = () => {
    const analysisData = {
      swot: null,
      customerSegmentation: null,
      purchaseCriteria: null,
      channelHeatmap: null,
      loyaltyNPS: null,
      capabilityHeatmap: null
    };

    if (userDetails?.system) {
      userDetails.system.forEach(result => {
        try {
          let analysisResult =
            typeof result.analysis_result === 'string'
              ? JSON.parse(result.analysis_result)
              : result.analysis_result;

          const analysisName = result.name?.toLowerCase() || '';

          if (analysisName.includes('swot')) {
            analysisData.swot = analysisResult;
          } else if (analysisName.includes('customersegmentation')) {
            analysisData.customerSegmentation = analysisResult;
          } else if (analysisName.includes('purchasecriteria')) {
            analysisData.purchaseCriteria = analysisResult;
          } else if (analysisName.includes('channelheatmap')) {
            analysisData.channelHeatmap = analysisResult;
          } else if (analysisName.includes('loyaltynps')) {
            analysisData.loyaltyNPS = analysisResult;
          } else if (analysisName.includes('capabilityheatmap')) {
            analysisData.capabilityHeatmap = analysisResult;
          }
        } catch (error) {
          console.error('Error parsing analysis for PDF export:', error);
        }
      });
    }

    return analysisData;
  };

  // Format conversation data for PDF
  const formatConversationData = () => {
    if (!userDetails?.conversation) return [];

    return userDetails.conversation.map((phase, phaseIndex) => ({
      phaseName: phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1),
      severity: phase.severity,
      questions: phase.questions?.map((qa, qIndex) => ({
        questionNumber: qIndex + 1,
        question: qa.question,
        answer: qa.answer
      })) || []
    }));
  };

  // Map analysis types to their components
  const analysisComponentMap = {
    swot: SwotAnalysis,
    customerSegmentation: CustomerSegmentation,
    purchaseCriteria: PurchaseCriteria,
    channelHeatmap: ChannelHeatmap,
    loyaltyNPS: LoyaltyNPS,
    capabilityHeatmap: CapabilityHeatmap
  };

  // Create comprehensive PDF content
  const createComprehensivePDFContent = () => {
    const analysisData = parseAnalysisData();
    const conversationData = formatConversationData();
    const currentDate = new Date();

    const analysisEntries = Object.entries(analysisData).filter(([key, value]) => value !== null);

    return `
      <div id="comprehensive-pdf-content" style="
        width: 210mm;
        background: white;
        padding: 10mm;
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        box-sizing: border-box;
      ">
        <!-- Header -->
        <div style="
          text-align: center;
          margin-bottom: 10mm;
          padding-bottom: 5mm;
          border-bottom: 0.8mm solid #1a73e8;
        ">
          <h1 style="
            font-size: 7mm;
            color: #1a73e8;
            margin-bottom: 2.5mm;
            font-weight: bold;
          ">Comprehensive Business Analysis Report</h1>
          <h2 style="
            font-size: 5mm;
            color: #666;
            margin-bottom: 4mm;
            font-weight: normal;
          ">${user?.name || 'User'}</h2>
          <p style="
            font-size: 3.5mm;
            color: #999;
            margin: 1.5mm 0;
          ">Generated on ${currentDate.toLocaleDateString()}</p>
          <p style="
            font-size: 3.5mm;
            color: #999;
            margin: 1.5mm 0;
          ">Exported by: ${JSON.parse(sessionStorage.getItem('user') || '{}').name || 'Admin'}</p>
        </div>

        <!-- User Profile Section -->
        <div style="margin-bottom: 10mm;">
          <h3 style="
            font-size: 5mm;
            color: #1a73e8;
            margin-bottom: 5mm;
            border-bottom: 0.5mm solid #e8f0fe;
            padding-bottom: 2.5mm;
          ">User Profile</h3>
          <table style="
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5mm;
          ">
            <tr><td style="padding: 3mm; border: 0.3mm solid #ddd; background-color: #f8f9fa; font-weight: bold; width: 40mm;">Name</td><td style="padding: 3mm; border: 0.3mm solid #ddd;">${user?.name || 'N/A'}</td></tr>
            <tr><td style="padding: 3mm; border: 0.3mm solid #ddd; background-color: #f8f9fa; font-weight: bold;">Email</td><td style="padding: 3mm; border: 0.3mm solid #ddd;">${user?.email || 'N/A'}</td></tr>
            <tr><td style="padding: 3mm; border: 0.3mm solid #ddd; background-color: #f8f9fa; font-weight: bold;">Role</td><td style="padding: 3mm; border: 0.3mm solid #ddd;">${user?.role?.role_name || 'N/A'}</td></tr>
            <tr><td style="padding: 3mm; border: 0.3mm solid #ddd; background-color: #f8f9fa; font-weight: bold;">Company</td><td style="padding: 3mm; border: 0.3mm solid #ddd;">${user?.company?.company_name || 'N/A'}</td></tr>
            <tr><td style="padding: 3mm; border: 0.3mm solid #ddd; background-color: #f8f9fa; font-weight: bold;">Joined Date</td><td style="padding: 3mm; border: 0.3mm solid #ddd;">${user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td></tr>
          </table>
        </div>

        <!-- Executive Summary -->
        <div style="margin-bottom: 10mm;">
          <h3 style="
            font-size: 5mm;
            color: #1a73e8;
            margin-bottom: 5mm;
            border-bottom: 0.5mm solid #e8f0fe;
            padding-bottom: 2.5mm;
          ">Executive Summary</h3>
          <div style="
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4mm;
            margin-bottom: 5mm;
          ">
            <div style="text-align: center; padding: 5mm; background-color: #f8f9fa; border-radius: 2mm; border: 0.3mm solid #e9ecef;">
              <div style="font-size: 6mm; font-weight: bold; color: #1a73e8; margin-bottom: 1.5mm;">${conversationData.reduce((sum, phase) => sum + phase.questions.length, 0)}</div>
              <div style="font-size: 3mm; color: #6c757d;">Questions Answered</div>
            </div>
            <div style="text-align: center; padding: 5mm; background-color: #f8f9fa; border-radius: 2mm; border: 0.3mm solid #e9ecef;">
              <div style="font-size: 6mm; font-weight: bold; color: #1a73e8; margin-bottom: 1.5mm;">${conversationData.length}</div>
              <div style="font-size: 3mm; color: #6c757d;">Phases Completed</div>
            </div>
            <div style="text-align: center; padding: 5mm; background-color: #f8f9fa; border-radius: 2mm; border: 0.3mm solid #e9ecef;">
              <div style="font-size: 6mm; font-weight: bold; color: #1a73e8; margin-bottom: 1.5mm;">${analysisEntries.length}</div>
              <div style="font-size: 3mm; color: #6c757d;">Analysis Types</div>
            </div>
            <div style="text-align: center; padding: 5mm; background-color: #f8f9fa; border-radius: 2mm; border: 0.3mm solid #e9ecef;">
              <div style="font-size: 5mm; font-weight: bold; color: #1a73e8; margin-bottom: 1.5mm;">${user?.company?.company_name || 'N/A'}</div>
              <div style="font-size: 3mm; color: #6c757d;">Company</div>
            </div>
          </div>
        </div>

        <!-- Analysis Components Placeholder -->
        <div id="analysis-components-placeholder" style="margin-bottom: 10mm;"></div>

        <!-- Questions & Answers Section -->
        ${conversationData.length > 0 ? `
        <div style="margin-bottom: 10mm; page-break-before: always;">
          <h3 style="
            font-size: 5mm;
            color: #1a73e8;
            margin-bottom: 5mm;
            border-bottom: 0.5mm solid #e8f0fe;
            padding-bottom: 2.5mm;
          ">Questions & Answers</h3>
          ${conversationData.map(phase => `
            <div style="margin-bottom: 7.5mm;">
              <h4 style="
                font-size: 4mm;
                color: #495057;
                margin-bottom: 4mm;
                padding: 2.5mm;
                background-color: #e8f0fe;
                border-radius: 1.5mm;
              ">${phase.phaseName} Phase (${phase.severity})</h4>
              ${phase.questions.map(qa => `
                <div style="
                  margin-bottom: 5mm;
                  padding: 4mm;
                  background-color: #f8f9fa;
                  border-left: 1mm solid #1a73e8;
                  border-radius: 0 2mm 2mm 0;
                ">
                  <div style="
                    font-weight: bold;
                    margin-bottom: 2mm;
                    color: #212529;
                  ">Q${qa.questionNumber}: ${qa.question}</div>
                  <div style="
                    margin-left: 4mm;
                    color: #6c757d;
                  "><strong>Answer:</strong> ${qa.answer}</div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="
          margin-top: 10mm;
          padding-top: 5mm;
          border-top: 0.5mm solid #dee2e6;
          text-align: center;
          color: #6c757d;
          font-size: 3mm;
        ">
          <p style="margin: 1.5mm 0;">This report was generated by Traxxia AI - Your Strategic Business Advisor</p>
          <p style="margin: 1.5mm 0;">© ${currentDate.getFullYear()} Traxxia AI. All rights reserved.</p>
          <p style="margin: 1.5mm 0;">Report generated on ${currentDate.toLocaleString()}</p>
        </div>
      </div>
    `;
  };

  const exportComprehensiveToPDF = async () => {
    if (!userDetails) {
      onToast('No user data available to export', 'warning');
      return;
    }

    try {
      setIsExporting(true);

      // Show loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'comprehensive-pdf-loading';
      loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 40px;
        border-radius: 16px;
        z-index: 10000;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        min-width: 300px;
      `;
      loadingDiv.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
          <div style="
            width: 32px;
            height: 32px;
            border: 4px solid #fff;
            border-top: 4px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <div>
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
              Generating Comprehensive PDF Report
            </div>
            <div style="font-size: 14px; opacity: 0.8; line-height: 1.4;">
              Capturing analysis components, questions, and generating high-quality PDF...
            </div>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingDiv);

      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 210mm;
      `;
      tempContainer.innerHTML = createComprehensivePDFContent();
      document.body.appendChild(tempContainer);

      const pdfElement = tempContainer.querySelector('#comprehensive-pdf-content');
      const analysisPlaceholder = pdfElement.querySelector('#analysis-components-placeholder');

      const analysisData = parseAnalysisData();
      const analysisEntries = Object.entries(analysisData).filter(([key, value]) => value !== null);

      if (analysisEntries.length > 0) {
        const analysisHeader = document.createElement('div');
        analysisHeader.innerHTML = `
          <h3 style="
            font-size: 5mm;
            color: #1a73e8;
            margin-bottom: 5mm;
            border-bottom: 0.5mm solid #e8f0fe;
            padding-bottom: 2.5mm;
          ">Business Analysis Results</h3>
        `;
        analysisPlaceholder.appendChild(analysisHeader);

        // Add heatmap-specific styles
        const heatmapStyles = document.createElement('style');
        heatmapStyles.textContent = `
          
          .ch-heatmap:nth-child(1) {
            width: 10% !important;
          }

          .channel-heatmap .ch-heatmap{
            width: 600px !important;
            } 
           
          .ch-heatmap-wrapper {
            min-width: 600px;
            max-width: 100%;
            overflow: visible !important;
          }
          .ch-heatmap-scroll {
            overflow: visible !important;
            max-width: none !important;
            width: 100% !important;
          }
          .canvas-replacement {
            max-width: 100%;
            height: auto;
            border: 0.3mm solid #eee;
            border-radius: 2mm;
          }
        `;
        analysisPlaceholder.appendChild(heatmapStyles);

        for (const [type, analysis] of analysisEntries) {
          const analysisContainer = document.createElement('div');
          analysisContainer.style.cssText = `
            margin-bottom: 10mm;
            padding: 6mm;
            border: 0.3mm solid #dee2e6;
            border-radius: 3mm;
            background-color: #ffffff;
            box-shadow: 0 0.5mm 1mm rgba(0,0,0,0.1);
            page-break-inside: avoid;
          `;

          const typeName = type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1');
          const analysisTitle = document.createElement('h4');
          analysisTitle.style.cssText = `
            font-size: 5mm;
            color: #1a73e8;
            margin-bottom: 5mm;
            border-bottom: 0.5mm solid #e8f0fe;
            padding-bottom: 2.5mm;
          `;
          analysisTitle.textContent = `${getAnalysisIcon(type)} ${typeName}`;
          analysisContainer.appendChild(analysisTitle);

          const Component = analysisComponentMap[type];
          if (Component) {
            const componentContainer = document.createElement('div');
            componentContainer.setAttribute('data-analysis-type', type);
            analysisContainer.appendChild(componentContainer);

            // Prepare props for the component
            const props = {
              [type === 'swot' ? 'analysisResult' : `${type}Data`]: analysis,
              businessName: user?.name || 'Business',
              questions: userDetails?.conversation?.flatMap(phase => phase.questions?.map(qa => ({
                _id: qa.question || `q_${Math.random()}`,
                question_id: qa.question || `q_${Math.random()}`,
                question_text: qa.question,
                phase: phase.phase,
                severity: phase.severity
              })) || []),
              userAnswers: userDetails?.conversation?.flatMap(phase =>
                phase.questions?.reduce((acc, qa) => ({
                  ...acc,
                  [qa.question || `q_${Math.random()}`]: qa.answer
                }), {})
              ) || {},
              onDataGenerated: () => {},
              onRegenerate: null,
              isRegenerating: false,
              canRegenerate: false
            };

            // Render the component
            render(<Component {...props} />, componentContainer);

            // Wait for rendering to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Convert canvases to images
            const canvases = componentContainer.querySelectorAll('canvas');
            for (const canvas of canvases) {
              try {
                const dataUrl = canvas.toDataURL('image/png');
                const img = document.createElement('img');
                img.src = dataUrl;
                img.style.width = canvas.width + 'px';
                img.style.height = canvas.height + 'px';
                img.style.display = 'block';
                img.className = 'canvas-replacement';
                canvas.parentNode.replaceChild(img, canvas);
                console.log(`✅ ${type} canvas converted to image for PDF export`);
              } catch (err) {
                console.error(`❌ Error converting ${type} canvas to image:`, err);
              }
            }

            // Ensure component fits A4 width
            componentContainer.style.width = '100%';
            componentContainer.style.maxWidth = '210mm';
          } else {
            const fallbackContent = document.createElement('div');
            fallbackContent.style.cssText = `
              background-color: #f8f9fa;
              padding: 5mm;
              border-radius: 2mm;
              font-family: monospace;
              font-size: 3mm;
              white-space: pre-wrap;
              max-height: 100mm;
              overflow: hidden;
            `;
            fallbackContent.textContent = JSON.stringify(analysis, null, 2);
            analysisContainer.appendChild(fallbackContent);
          }

          analysisPlaceholder.appendChild(analysisContainer);
        }
      } else {
        analysisPlaceholder.innerHTML = `
          <div style="
            text-align: center;
            padding: 10mm;
            background-color: #f8f9fa;
            border-radius: 2mm;
            color: #6c757d;
          ">
            <h4 style="color: #495057; margin-bottom: 2.5mm;">No Analysis Data Available</h4>
            <p>This user hasn't generated any business analysis yet.</p>
          </div>
        `;
      }

      // Generate PDF
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const scale = 2;
      const canvasWidth = pdfWidth * 3.78;

      const canvas = await html2canvas(pdfElement, {
        width: canvasWidth,
        height: pdfElement.scrollHeight,
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const buttons = clonedDoc.querySelectorAll('button, .btn, [onclick]');
          buttons.forEach(btn => btn.remove());
        }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;

      const totalPages = Math.ceil(imgHeight / pdfHeight);
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        const yOffset = -(pdfHeight * i);
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
      }

      document.body.removeChild(tempContainer);
      document.body.removeChild(loadingDiv);

      const filename = `${user?.name?.replace(/\s+/g, '_') || 'user'}_comprehensive_business_analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      onToast(`📄 Comprehensive business analysis PDF downloaded successfully for ${user?.name}!`, 'success');
    } catch (error) {
      console.error('Error exporting comprehensive PDF:', error);
      onToast('Failed to generate comprehensive PDF report. Please try again.', 'error');
    } finally {
      setIsExporting(false);
      const loadingDiv = document.getElementById('comprehensive-pdf-loading');
      if (loadingDiv) document.body.removeChild(loadingDiv);
    }
  };

  const getAnalysisIcon = (type) => {
    const icons = {
      swot: '⚡',
      customerSegmentation: '👥',
      purchaseCriteria: '📊',
      loyaltyNPS: '💯',
      capabilityHeatmap: '🎯',
      channelHeatmap: '🌐'
    };
    return icons[type] || '📈';
  };

  const buttonSizeClass = buttonSize === 'small' ? 'small-btn' : buttonSize === 'large' ? 'large-btn' : '';

  return (
    <div className={`pdf-export-component ${className}`}>
      <button
        onClick={exportComprehensiveToPDF}
        disabled={isExporting || !userDetails}
        className={`export-pdf-button ${buttonSizeClass}`}
        title="Export comprehensive business analysis report as PDF with visual components"
        style={{
          backgroundColor: "#1a73e8",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "10px 18px",
          fontSize: "14px",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          cursor: isExporting || !userDetails ? "not-allowed" : "pointer",
          opacity: isExporting || !userDetails ? 0.6 : 1,
          gap: "8px"
        }}
      >
        {isExporting ? (
          <>
            <Loader size={16} className="loading-spinner" />
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <FileText size={16} />
            <span>{buttonText}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default PDFExportComponent;