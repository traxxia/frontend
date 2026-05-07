import React, { useState, useCallback } from 'react';
import { Download, Loader } from 'lucide-react';

const DownloadStrategicPDF = ({
    businessName = '',
    isDisabled = false,
    size = 'medium',
    onToastMessage,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isDisabled || isGenerating) return;

        try {
            setIsGenerating(true);
            
            const [jsPDFModule, html2canvasModule] = await Promise.all([
                import('jspdf'),
                import('html2canvas')
            ]);
            const jsPDF = jsPDFModule.default;
            const html2canvas = html2canvasModule.default;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();

            const container = document.querySelector('.strategic-analysis-container, .strategic-content');
            if (!container) return;

            const canvas = await html2canvas(container, {
                scale: 1.5,
                useCORS: true,
                onclone: (doc) => {
                    const el = doc.querySelector('.strategic-analysis-container, .strategic-content');
                    if (el) {
                        const junk = el.querySelectorAll('button');
                        junk.forEach(b => b.style.display = 'none');
                    }
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

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

    const iconSizes = { small: 16, medium: 20, large: 24 };

    return (
        <>
            {isGenerating && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 99999
                }}>
                    <Loader size={48} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            )}
            
            <button
                onClick={handleDownload}
                disabled={isDisabled || isGenerating} 
                style={{
                    backgroundColor: "#1a73e8", color: "#fff", border: "none", borderRadius: "10px",
                    padding: "10px 18px", fontSize: "14px", fontWeight: 600, display: "flex",
                    alignItems: "center", cursor: "pointer", gap: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                }}
            >
                <Download size={iconSizes[size]} />
                {isGenerating ? "Generating..." : "Download PDF"}
            </button>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </>
    );
};

export default DownloadStrategicPDF;