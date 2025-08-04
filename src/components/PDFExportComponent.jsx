import React, { useState } from 'react';
import { FileText, Download, Loader } from 'lucide-react';

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
          let analysisResult;
          
          if (typeof result.analysis_result === 'string') {
            try {
              analysisResult = JSON.parse(result.analysis_result);
            } catch (e) {
              analysisResult = result.analysis_result;
            }
          } else {
            analysisResult = result.analysis_result;
          }

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

  // Create comprehensive PDF content with both Q&A and Analysis sections
  const createComprehensivePDFContent = () => {
    const analysisData = parseAnalysisData();
    const conversationData = formatConversationData();
    const currentDate = new Date();
    
    const analysisEntries = Object.entries(analysisData).filter(([key, value]) => value !== null);

    return `
      <div id="comprehensive-pdf-content" style="
        width: 800px;
        background: white;
        padding: 40px;
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0 auto;
      ">
        <!-- Header -->
        <div style="
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #1a73e8;
        ">
          <h1 style="
            font-size: 28px;
            color: #1a73e8;
            margin-bottom: 10px;
            font-weight: bold;
          ">Comprehensive Business Analysis Report</h1>
          <h2 style="
            font-size: 20px;
            color: #666;
            margin-bottom: 15px;
            font-weight: normal;
          ">${user?.name || 'User'}</h2>
          <p style="
            font-size: 14px;
            color: #999;
            margin: 5px 0;
          ">Generated on ${currentDate.toLocaleDateString()}</p>
          <p style="
            font-size: 14px;
            color: #999;
            margin: 5px 0;
          ">Exported by: ${JSON.parse(sessionStorage.getItem('user') || '{}').name || 'Admin'}</p>
        </div>

        <!-- User Profile Section -->
        <div style="margin-bottom: 40px;">
          <h3 style="
            font-size: 20px;
            color: #1a73e8;
            margin-bottom: 20px;
            border-bottom: 2px solid #e8f0fe;
            padding-bottom: 10px;
          ">User Profile</h3>
          
          <table style="
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          ">
            <tr>
              <td style="
                padding: 12px;
                border: 1px solid #ddd;
                background-color: #f8f9fa;
                font-weight: bold;
                width: 150px;
              ">Name</td>
              <td style="
                padding: 12px;
                border: 1px solid #ddd;
              ">${user?.name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="
                padding: 12px;
                border: 1px solid #ddd;
                background-color: #f8f9fa;
                font-weight: bold;
              ">Email</td>
              <td style="
                padding: 12px;
                border: 1px solid #ddd;
              ">${user?.email || 'N/A'}</td>
            </tr>
            <tr>
              <td style="
                padding: 12px;
                border: 1px solid #ddd;
                background-color: #f8f9fa;
                font-weight: bold;
              ">Role</td>
              <td style="
                padding: 12px;
                border: 1px solid #ddd;
              ">${user?.role?.role_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="
                padding: 12px;
                border: 1px solid #ddd;
                background-color: #f8f9fa;
                font-weight: bold;
              ">Company</td>
              <td style="
                padding: 12px;
                border: 1px solid #ddd;
              ">${user?.company?.company_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="
                padding: 12px;
                border: 1px solid #ddd;
                background-color: #f8f9fa;
                font-weight: bold;
              ">Joined Date</td>
              <td style="
                padding: 12px;
                border: 1px solid #ddd;
              ">${user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
            </tr>
          </table>
        </div>

        <!-- Executive Summary -->
        <div style="margin-bottom: 40px;">
          <h3 style="
            font-size: 20px;
            color: #1a73e8;
            margin-bottom: 20px;
            border-bottom: 2px solid #e8f0fe;
            padding-bottom: 10px;
          ">Executive Summary</h3>
          
          <div style="
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          ">
            <div style="
              text-align: center;
              padding: 20px;
              background-color: #f8f9fa;
              border-radius: 8px;
              border: 1px solid #e9ecef;
            ">
              <div style="
                font-size: 24px;
                font-weight: bold;
                color: #1a73e8;
                margin-bottom: 5px;
              ">${conversationData.reduce((sum, phase) => sum + phase.questions.length, 0)}</div>
              <div style="
                font-size: 12px;
                color: #6c757d;
              ">Questions Answered</div>
            </div>
            <div style="
              text-align: center;
              padding: 20px;
              background-color: #f8f9fa;
              border-radius: 8px;
              border: 1px solid #e9ecef;
            ">
              <div style="
                font-size: 24px;
                font-weight: bold;
                color: #1a73e8;
                margin-bottom: 5px;
              ">${conversationData.length}</div>
              <div style="
                font-size: 12px;
                color: #6c757d;
              ">Phases Completed</div>
            </div>
            <div style="
              text-align: center;
              padding: 20px;
              background-color: #f8f9fa;
              border-radius: 8px;
              border: 1px solid #e9ecef;
            ">
              <div style="
                font-size: 24px;
                font-weight: bold;
                color: #1a73e8;
                margin-bottom: 5px;
              ">${analysisEntries.length}</div>
              <div style="
                font-size: 12px;
                color: #6c757d;
              ">Analysis Types</div>
            </div>
            <div style="
              text-align: center;
              padding: 20px;
              background-color: #f8f9fa;
              border-radius: 8px;
              border: 1px solid #e9ecef;
            ">
              <div style="
                font-size: 20px;
                font-weight: bold;
                color: #1a73e8;
                margin-bottom: 5px;
              ">${user?.company?.company_name || 'N/A'}</div>
              <div style="
                font-size: 12px;
                color: #6c757d;
              ">Company</div>
            </div>
          </div>
        </div>

        <!-- Placeholder for Analysis Components (will be replaced with actual rendered components) -->
        <div id="analysis-components-placeholder" style="margin-bottom: 40px;">
          <!-- This will be replaced with actual analysis components -->
        </div>

        <!-- Questions & Answers Section -->
        ${conversationData.length > 0 ? `
        <div style="margin-bottom: 40px; page-break-before: always;">
          <h3 style="
            font-size: 20px;
            color: #1a73e8;
            margin-bottom: 20px;
            border-bottom: 2px solid #e8f0fe;
            padding-bottom: 10px;
          ">Questions & Answers</h3>
          
          ${conversationData.map(phase => `
            <div style="margin-bottom: 30px;">
              <h4 style="
                font-size: 16px;
                color: #495057;
                margin-bottom: 15px;
                padding: 10px;
                background-color: #e8f0fe;
                border-radius: 5px;
              ">${phase.phaseName} Phase (${phase.severity})</h4>
              
              ${phase.questions.map(qa => `
                <div style="
                  margin-bottom: 20px;
                  padding: 15px;
                  background-color: #f8f9fa;
                  border-left: 4px solid #1a73e8;
                  border-radius: 0 8px 8px 0;
                ">
                  <div style="
                    font-weight: bold;
                    margin-bottom: 8px;
                    color: #212529;
                  ">Q${qa.questionNumber}: ${qa.question}</div>
                  <div style="
                    margin-left: 15px;
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
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #dee2e6;
          text-align: center;
          color: #6c757d;
          font-size: 12px;
        ">
          <p style="margin: 5px 0;">This report was generated by Traxxia AI - Your Strategic Business Advisor</p>
          <p style="margin: 5px 0;">© ${currentDate.getFullYear()} Traxxia AI. All rights reserved.</p>
          <p style="margin: 5px 0;">Report generated on ${currentDate.toLocaleString()}</p>
        </div>
      </div>
    `;
  };

  // Comprehensive PDF export that captures actual UI components
  const exportComprehensiveToPDF = async () => {
    if (!userDetails) {
      onToast('No user data available to export', 'warning');
      return;
    }

    try {
      setIsExporting(true);
      
      // Show enhanced loading indicator
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

      // Dynamically import libraries
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      // Create temporary container with comprehensive PDF content
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
      `;
      tempContainer.innerHTML = createComprehensivePDFContent();
      document.body.appendChild(tempContainer);

      const pdfElement = tempContainer.querySelector('#comprehensive-pdf-content');
      const analysisPlaceholder = pdfElement.querySelector('#analysis-components-placeholder');

      // Try to capture actual analysis components if they exist in the current page
      const analysisData = parseAnalysisData();
      const analysisEntries = Object.entries(analysisData).filter(([key, value]) => value !== null);

      if (analysisEntries.length > 0) {
        // Create analysis section header
        const analysisHeader = document.createElement('div');
        analysisHeader.innerHTML = `
          <h3 style="
            font-size: 20px;
            color: #1a73e8;
            margin-bottom: 20px;
            border-bottom: 2px solid #e8f0fe;
            padding-bottom: 10px;
          ">Business Analysis Results</h3>
        `;
        analysisPlaceholder.appendChild(analysisHeader);

        // For each analysis type, try to capture from current page or create simplified version
        for (const [type, analysis] of analysisEntries) {
          const analysisContainer = document.createElement('div');
          analysisContainer.style.cssText = `
            margin-bottom: 40px;
            padding: 25px;
            border: 1px solid #dee2e6;
            border-radius: 12px;
            background-color: #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            page-break-inside: avoid;
          `;

          const typeName = type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1');
          const analysisTitle = document.createElement('h4');
          analysisTitle.style.cssText = `
            font-size: 20px;
            color: #1a73e8;
            margin-bottom: 20px;
            border-bottom: 2px solid #e8f0fe;
            padding-bottom: 10px;
          `;
          analysisTitle.textContent = `${getAnalysisIcon(type)} ${typeName}`;
          analysisContainer.appendChild(analysisTitle);

          // Try to find and clone the actual component from the current page
          const existingComponent = document.querySelector(`[data-analysis-type="${type}"]`) || 
                                  document.querySelector(`.${type}-component`) ||
                                  document.querySelector(`#${type}-analysis`);

          if (existingComponent) {
            // Clone the existing component and clean it up for PDF
            const clonedComponent = existingComponent.cloneNode(true);
            
            // Remove interactive elements
            const elementsToRemove = clonedComponent.querySelectorAll(
              'button, .edit-button, .save-button, .cancel-button, .edit-actions, .download-pdf-btn, .simple-toast, .regenerate-btn'
            );
            elementsToRemove.forEach(el => el.remove());

            // Clean up edit containers
            const editContainers = clonedComponent.querySelectorAll('.edit-container');
            editContainers.forEach(container => {
              const textarea = container.querySelector('textarea');
              if (textarea) {
                const textDiv = document.createElement('div');
                textDiv.className = 'item-text';
                textDiv.textContent = textarea.value || textarea.placeholder;
                container.parentNode.replaceChild(textDiv, container);
              }
            });

            analysisContainer.appendChild(clonedComponent);
          } else {
            // Fallback: Create simple data representation
            const fallbackContent = document.createElement('div');
            fallbackContent.style.cssText = `
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              font-family: monospace;
              font-size: 12px;
              white-space: pre-wrap;
              max-height: 400px;
              overflow: hidden;
            `;
            fallbackContent.textContent = JSON.stringify(analysis, null, 2);
            analysisContainer.appendChild(fallbackContent);
          }

          analysisPlaceholder.appendChild(analysisContainer);
        }
      } else {
        // No analysis data available
        analysisPlaceholder.innerHTML = `
          <div style="
            text-align: center;
            padding: 40px;
            background-color: #f8f9fa;
            border-radius: 8px;
            color: #6c757d;
          ">
            <h4 style="color: #495057; margin-bottom: 10px;">No Analysis Data Available</h4>
            <p>This user hasn't generated any business analysis yet.</p>
          </div>
        `;
      }

      // Generate PDF from the complete content
      const canvas = await html2canvas(pdfElement, {
        width: 800,
        height: pdfElement.scrollHeight,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Additional cleanup for cloned document
          const buttons = clonedDoc.querySelectorAll('button, .btn, [onclick]');
          buttons.forEach(btn => btn.remove());
        }
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;
      
      // Calculate pages needed
      const totalPages = Math.ceil(imgHeight / pdfHeight);
      
      // Add content to PDF pages
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const yOffset = -(pdfHeight * i);
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
      }

      // Clean up
      document.body.removeChild(tempContainer);
      document.body.removeChild(loadingDiv);

      // Save PDF
      const filename = `${user?.name?.replace(/\s+/g, '_') || 'user'}_comprehensive_business_analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      onToast(`📄 Comprehensive business analysis PDF downloaded successfully for ${user?.name}!`, 'success');

    } catch (error) {
      console.error('Error exporting comprehensive PDF:', error);
      
      // Remove loading indicator if it exists
      const loadingDiv = document.getElementById('comprehensive-pdf-loading');
      if (loadingDiv) {
        document.body.removeChild(loadingDiv);
      }
      
      onToast('Failed to generate comprehensive PDF report. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Get analysis icon
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