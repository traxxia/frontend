import React, { useState, useCallback } from 'react';
import { Download, Loader } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";

const DownloadStrategicAnalysis = ({
    businessName = '',
    isDisabled = false,
    size = 'medium',
    onToastMessage 
}) => {
    const { t } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = useCallback(async () => {
        if (isDisabled) return;

        try {
            setIsGenerating(true);
            
            // 1. Load libraries
            const [jsPDFModule, html2canvasModule] = await Promise.all([
                import('jspdf'),
                import('html2canvas')
            ]);
            const jsPDF = jsPDFModule.default;
            const html2canvas = html2canvasModule.default;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            
            // 2. Capture Strategic Container
            const container = document.querySelector('.strategic-content, .strategic-analysis-container');
            if (!container) {
                onToastMessage?.('Strategic content not found', 'error');
                return;
            }

            const canvas = await html2canvas(container, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#ffffff',
                onclone: (doc) => {
                    const el = doc.querySelector('.strategic-content, .strategic-analysis-container');
                    if (el) {
                        el.style.padding = '20px';
                        const junk = el.querySelectorAll('button, .help-icon');
                        junk.forEach(j => j.style.display = 'none');
                    }
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.setFontSize(20);
            pdf.text('Strategic Analysis', 10, 20);
            pdf.addImage(imgData, 'JPEG', 10, 30, imgWidth, imgHeight);

            pdf.save(`${businessName}_Strategic_Analysis.pdf`);
            onToastMessage?.('Download started', 'success');

        } catch (error) {
            console.error('Error generating PDF:', error);
            onToastMessage?.('Failed to generate PDF', 'error');
        } finally {
            setIsGenerating(false);
        }
    }, [businessName, isDisabled, onToastMessage]);

    const iconSizes = { small: 16, medium: 20, large: 24 };

    return (
        <>
            {isGenerating && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
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
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", 
                }}
            >
                <Download size={iconSizes[size]} />
                {isGenerating ? 'Generating...' : t("Download PDF")}
            </button>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </>
    );
};

export default DownloadStrategicAnalysis;