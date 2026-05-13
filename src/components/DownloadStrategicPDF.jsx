import React, { useState, useCallback } from 'react';
import { Download, Loader } from 'lucide-react';
const DownloadStrategicPDF = ({
  businessName = '',
  isDisabled = false,
  size = 'medium',
  onToastMessage
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const handleDownload = useCallback(async e => {
    e.preventDefault();
    e.stopPropagation();
    if (isDisabled || isGenerating) return;
    try {
      setIsGenerating(true);
      const [jsPDFModule, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')]);
      const jsPDF = jsPDFModule.default;
      const html2canvas = html2canvasModule.default;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const container = document.querySelector('.strategic-analysis-container, .strategic-content');
      if (!container) return;
      const canvas = await html2canvas(container, {
        scale: 1.5,
        useCORS: true,
        onclone: doc => {
          const el = doc.querySelector('.strategic-analysis-container, .strategic-content');
          if (el) {
            const junk = el.querySelectorAll('button');
            junk.forEach(b => b.style.display = 'none');
          }
        }
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const imgWidth = pageWidth - 20;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${businessName}_Strategic_Report.pdf`);
      if (onToastMessage) {
        onToastMessage("Download started successfully.", "success");
      }
    } catch (error) {
      console.error('Error in download process:', error);
      if (onToastMessage) {
        onToastMessage("Failed to generate PDF.", "error");
      }
    } finally {
      setIsGenerating(false);
    }
  }, [businessName, isDisabled, isGenerating, onToastMessage]);
  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24
  };
  return <>
            {isGenerating && <div className="download-strategic-p-d-f--s1">
                    <Loader size={48} color="white" className="download-strategic-p-d-f--s2" />
                </div>}

            <button onClick={handleDownload} disabled={isDisabled || isGenerating} className="download-strategic-p-d-f--s3">
                <Download size={iconSizes[size]} />
                {isGenerating ? "Generating..." : "Download PDF"}
            </button>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </>;
};
export default DownloadStrategicPDF;
