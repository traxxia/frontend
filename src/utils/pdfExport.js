import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (elementId, filename, options = {}) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Show loading state
    const originalContent = element.innerHTML;
    const loadingDiv = document.createElement('div');
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

    // Create a temporary container for PDF content
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

    // Clone the content and clean it up for PDF
    const clonedElement = element.cloneNode(true);
    
    // Remove interactive elements and edit buttons
    const elementsToRemove = clonedElement.querySelectorAll(
      '.edit-button, .save-button, .cancel-button, .edit-actions, .download-pdf-btn, button, .simple-toast'
    );
    elementsToRemove.forEach(el => el.remove());

    // Convert edit containers back to text
    const editContainers = clonedElement.querySelectorAll('.edit-container');
    editContainers.forEach(container => {
      const textarea = container.querySelector('textarea');
      if (textarea) {
        const textDiv = document.createElement('div');
        textDiv.className = 'item-text';
        textDiv.textContent = textarea.value || textarea.placeholder;
        container.parentNode.replaceChild(textDiv, container);
      }
    });

    // Style improvements for PDF
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
      .strengths-bg { border-left-color: #28a745; background-color: #d4edda; }
      .weaknesses-bg { border-left-color: #dc3545; background-color: #f8d7da; }
      .opportunities-bg { border-left-color: #007bff; background-color: #d1ecf1; }
      .threats-bg { border-left-color: #ffc107; background-color: #fff3cd; }
      .brief-item {
        margin-bottom: 15px;
        padding: 10px;
        border: 1px solid #eee;
        border-radius: 4px;
      }
      .item-label {
        font-weight: bold;
        color: #007bff;
        display: block;
        margin-bottom: 5px;
      }
      .item-text {
        margin: 0;
      }
      .conclusion-section {
        margin-top: 30px;
        padding: 20px;
        background-color: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #007bff;
      }
      .strategic-item {
        margin-bottom: 20px;
        padding: 15px;
        border: 1px solid #eee;
        border-radius: 8px;
        background-color: #f9f9f9;
      }
      .strategic-letter {
        font-size: 18px;
        font-weight: bold;
        color: #007bff;
        margin-bottom: 10px;
      }
      .intro-text, .conclusion-text {
        margin-bottom: 20px;
        padding: 15px;
        background-color: #f8f9fa;
        border-radius: 4px;
      }
      h4, h5 {
        color: #007bff;
        margin-bottom: 15px;
      }
      .page-break {
        page-break-before: always;
      }
    `;

    pdfContainer.appendChild(styles);

    // Add header
    const header = document.createElement('div');
    header.className = 'pdf-header';
    header.innerHTML = `
      <div class="pdf-title">${options.title || 'Business Analysis Report'}</div>
      <div class="pdf-subtitle">${options.businessName || 'Your Business'}</div>
      <div class="pdf-date">Generated on ${new Date().toLocaleDateString()}</div>
    `;
    pdfContainer.appendChild(header);

    // Add the cleaned content
    pdfContainer.appendChild(clonedElement);

    // Add footer
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

    // Generate PDF
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
    
    // Calculate how many pages we need
    const totalPages = Math.ceil(imgHeight / pdfHeight);
    
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      const yOffset = -(pdfHeight * i);
      pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
    }

    // Clean up
    document.body.removeChild(pdfContainer);
    document.body.removeChild(loadingDiv);

    // Save the PDF
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Remove loading indicator if it exists
    const loadingDiv = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]');
    if (loadingDiv) {
      document.body.removeChild(loadingDiv);
    }
    
    throw error;
  }
};

// Specific export functions
export const exportAnalysisToPDF = async (businessName = 'Your Business') => {
  const filename = `${businessName.replace(/[^a-z0-9]/gi, '_')}_Analysis_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  
  return await exportToPDF('analysis-pdf-content', filename, {
    title: 'SWOT Analysis Report',
    businessName: businessName
  });
};

export const exportStrategicToPDF = async (businessName = 'Your Business') => {
  const filename = `${businessName.replace(/[^a-z0-9]/gi, '_')}_Strategic_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  
  return await exportToPDF('strategic-pdf-content', filename, {
    title: 'S.T.R.A.T.E.G.I.C Analysis Report',
    businessName: businessName
  });
};