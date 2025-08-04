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

      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 800px;
        background: white;
        padding: 40px;
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      `;

      const clonedElement = element.cloneNode(true);

      const elementsToRemove = clonedElement.querySelectorAll(
        '.edit-button, .save-button, .cancel-button, .edit-actions, .download-pdf-btn, button, .simple-toast'
      );
      elementsToRemove.forEach(el => el.remove());

      const styles = document.createElement('style');
      styles.textContent = `
        .pdf-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #007bff;
        }
        .pdf-title {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 10px;
        }
        .pdf-subtitle {
          font-size: 16px;
          color: #666;
          margin-bottom: 5px;
        }
        .pdf-date {
          font-size: 12px;
          color: #999;
        }
        .analysis-section, .strategic-section {
          margin-bottom: 30px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .table th, .table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
          vertical-align: top;
        }
        .table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .analysis-box {
          margin-bottom: 8px;
          padding: 8px;
          border-radius: 4px;
          border-left: 4px solid #007bff;
          background-color: #f8f9fa;
        }
        .analysis-table {
          width: 100%;
          margin-bottom: 20px;
        }
        .analysis-row {
          display: flex;
          width: 100%;
        }
        .analysis-cell {
          flex: 1;
          padding: 15px;
          margin: 5px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        .strengths-bg { border-left-color: #28a745; background-color: #d4edda; }
        .weaknesses-bg { border-left-color: #dc3545; background-color: #f8d7da; }
        .opportunities-bg { border-left-color: #007bff; background-color: #d1ecf1; }
        .threats-bg { border-left-color: #ffc107; background-color: #fff3cd; }
        .strategic-item {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        h1, h2, h3, h4, h5 {
          color: #007bff;
          margin-bottom: 15px;
        }
        .conclusion-section {
          margin-top: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #007bff;
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
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        text-align: center;
        font-size: 12px;
        color: #666;
      `;
      footer.innerHTML = `
        <p>This report was generated by Traxxia AI - Your Strategic Business Advisor</p>
        <p>© ${new Date().getFullYear()} Traxxia AI. All rights reserved.</p>
      `;
      pdfContainer.appendChild(footer);

      document.body.appendChild(pdfContainer);

      const canvas = await html2canvas(pdfContainer, {
        width: 800,
        height: pdfContainer.scrollHeight,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;

      const totalPages = Math.ceil(imgHeight / pdfHeight);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

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