import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";

const PDFExportButton = ({ 
  analysisResult, 
  businessName, 
  onToastMessage,
  disabled = false,
  className = "",
  style = {},
  channelHeatmapReady = false,
  capabilityHeatmapReady = false
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { t } = useTranslation();

  const exportCompleteToPDF = async (elementId, filename, businessName, title) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
      }

      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'pdf-loading-indicator';
      loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        text-align: center;
      `;
      loadingDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 20px; height: 20px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          Generating PDF...
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingDiv);

      // Set container width to match A4 page width (210mm ≈ 794px at 96 DPI)
      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 1200px; /* Matches A4 width in pixels */
        background: white;
        padding: 20px; /* Reduced padding to maximize content area */
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      `;

      const clonedElement = element.cloneNode(true);
      // Expand heatmap scroll areas for accurate html2canvas rendering
const heatmapScrolls = clonedElement.querySelectorAll('.ch-heatmap-scroll');
heatmapScrolls.forEach(scroll => {
  scroll.style.overflow = 'visible';
  scroll.style.maxWidth = 'none';
  scroll.style.width = '100%';
});

// Widen the heatmap content wrapper so all cells are visible
const heatmapWrappers = clonedElement.querySelectorAll('.ch-heatmap-wrapper');
heatmapWrappers.forEach(wrapper => {
  wrapper.style.minWidth = '400px'; // adjust based on how wide your heatmap is
});
const capabilityheatmap = clonedElement.querySelector('.capability-heatmap .ch-heatmap');
if (capabilityheatmap) {
  capabilityheatmap.style.width = '100%'; // Ensure capability heatmap is wide enough
}
// Remove tooltips which can cause overlapping issues
const tooltips = clonedElement.querySelectorAll('.ch-tooltip');
tooltips.forEach(t => t.remove());

      const elementsToRemove = clonedElement.querySelectorAll(
        '.edit-button, .save-button, .cancel-button, .edit-actions, .download-pdf-btn, button, .simple-toast'
      );
      elementsToRemove.forEach(el => el.remove());

      // ===== FIX FOR CANVAS HEATMAPS =====
      // Convert all canvas elements to images
     // Convert all canvases in the cloned element into images before pdf capture
const canvases = clonedElement.querySelectorAll('canvas');

for (const canvas of canvases) {
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const img = document.createElement('img');
    img.src = dataUrl;
    img.style.width = canvas.width + 'px';
    img.style.height = canvas.height + 'px';
    img.style.display = 'block';
    canvas.parentNode.replaceChild(img, canvas); 
  } catch (err) {
    console.error("❌ Error converting canvas to image:", err);
  }
}



      // Allow time for image processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      // ===== END FIX =====

      const styles = document.createElement('style');
      styles.textContent = `
        .pdf-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #007bff;
        }
        .pdf-title {
          font-size: 22px; /* Slightly smaller for better fit */
          font-weight: bold;
          color: #007bff;
          margin-bottom: 8px;
        }
        .pdf-subtitle {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        .pdf-date {
          font-size: 10px;
          color: #999;
        }
        .analysis-section, .strategic-section {
          margin-bottom: 20px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .table th, .table td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
          vertical-align: top;
        }
        .table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .analysis-box {
          margin-bottom: 6px;
          padding: 6px;
          border-radius: 4px;
          border-left: 4px solid #007bff;
          background-color: #f8f9fa;
        }
        .analysis-table {
          width: 100%;
          margin-bottom: 15px;
        }
        .analysis-row {
          display: flex;
          width: 100%;
        }
        .analysis-cell {
          flex: 1;
          padding: 12px;
          margin: 4px;
          border-radius: 6px;
          border: 1px solid #ddd;
        }
        .strengths-bg { border-left-color: #28a745; background-color: #d4edda; }
        .weaknesses-bg { border-left-color: #dc3545; background-color: #f8d7da; }
        .opportunities-bg { border-left-color: #007bff; background-color: #d1ecf1; }
        .threats-bg { border-left-color: #ffc107; background-color: #fff3cd; }
        .strategic-item {
          margin-bottom: 15px;
          padding: 12px;
          border: 1px solid #eee;
          border-radius: 6px;
          background-color: #f9f9f9;
        }
        h1, h2, h3, h4, h5 {
          color: #007bff;
          margin-bottom: 12px;
        }
        .conclusion-section {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #007bff;
        }
        /* Heatmap specific styles */
        .heatmap-container {
          page-break-inside: avoid;
          margin: 15px 0;
        }
        .canvas-replacement {
          max-width: 100%;
          height: auto;
          border: 1px solid #eee;
          border-radius: 4px;
        }
        
  
      `;

      pdfContainer.appendChild(styles);

      const header = document.createElement('div');
      header.className = 'pdf-header';
      header.innerHTML = `
        <div class="pdf-title">${title}</div>
        <div class="pdf-subtitle">${businessName}</div>
        <div class="pdf-date">Generated on ${new Date().toLocaleDateString()}</div>
      `;
      pdfContainer.appendChild(header);

      pdfContainer.appendChild(clonedElement);

      const footer = document.createElement('div');
      footer.style.cssText = `
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #ddd;
        text-align: center;
        font-size: 10px;
        color: #666;
      `;
      footer.innerHTML = `
        <p>This report was generated by Traxxia AI - Your Strategic Business Advisor</p>
        <p>© ${new Date().getFullYear()} Traxxia AI. All rights reserved.</p>
      `;
      pdfContainer.appendChild(footer);

      document.body.appendChild(pdfContainer);

      // Render with high resolution and full A4 width
      const canvas = await html2canvas(pdfContainer, {
        width: 1200, // A4 width in pixels
        height: pdfContainer.scrollHeight,
        scale: 2, // High resolution for clarity
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false // Disable console logging for better performance
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const canvasWidth = canvas.width; // 794px * scale (2) = 1588px
      const canvasHeight = canvas.height;

      // Scale to fit full A4 page width
      const imgWidth = pdfWidth; // Use full A4 width (210mm)
      const imgHeight = (canvasHeight / canvasWidth) * imgWidth; // Maintain aspect ratio

      const totalPages = Math.ceil(imgHeight / pdfHeight);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Adjust yOffset to start at top of page
        const yOffset = -(pdfHeight * i);
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
      }

      document.body.removeChild(pdfContainer);
      document.body.removeChild(loadingDiv);

      pdf.save(filename);

      return true;
    } catch (error) {
      const loadingDiv = document.getElementById('pdf-loading-indicator');
      if (loadingDiv) {
        document.body.removeChild(loadingDiv);
      }

      throw error;
    }
  };

  const handleDownloadAnalysis = async () => {
    if (!analysisResult) {
      onToastMessage("No analysis available to export", "warning");
      return;
    }
//     if (!channelHeatmapReady || !capabilityHeatmapReady) {
//   onToastMessage("Please wait for all heatmaps to render before exporting.", "warning");
//   return;
// }

    try {
      setIsExportingPDF(true);
      onToastMessage("Generating comprehensive analysis PDF...", "info");

      const filename = `${businessName.replace(/[^a-z0-9]/gi, '_')}_Complete_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;

      await exportCompleteToPDF(
        'analysis-pdf-content',
        filename,
        businessName,
        'Complete Business Analysis Report'
      );

      onToastMessage("📄 Complete analysis PDF downloaded successfully!", "success");
    } catch (error) {
      onToastMessage("Failed to generate PDF. Please try again.", "error");
      console.error("PDF generation error:", error);
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
          Generating PDF...
        </>
      ) : (
        <>
          {t("Download analysis")}
          <Download size={16} style={{ marginLeft: 8 }} />
        </>
      )}
    </button>
  );
};

export default PDFExportButton;