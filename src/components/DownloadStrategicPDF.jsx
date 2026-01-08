import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';

const DownloadStrategicPDF = ({
    analysisData,
    businessName = '',
    isDisabled = false,
    size = 'medium',
    onToastMessage,
    modalSelector = '.user-details-modal'
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!analysisData?.strategic || isDisabled || isGenerating) {
            return;
        }

        try {
            setIsGenerating(true);
            
            // Wait a bit to show loading
            await new Promise(resolve => setTimeout(resolve, 500));

            // Find the modal container
            const modalContainer = document.querySelector(modalSelector);
            if (!modalContainer) {
                console.error('Modal container not found');
                return;
            }

            // Find strategic container
            let strategicContainer = modalContainer.querySelector('.strategic-analysis-container') ||
                                   modalContainer.querySelector('.strategic-content') ||
                                   modalContainer.querySelector('[class*="strategic"]');
            
            if (!strategicContainer) {
                console.error('Strategic analysis container not found');
                return;
            }

            // Define the specific strategic components we want to capture
            const strategicComponents = [
                { 
                    searchTexts: ['Strategic Pillars', 'pillars', 'pillar'],
                    name: 'Strategic Pillars Analysis',
                    fallbackSelector: '.strategic-content > .strategic-page-section:nth-child(2)'
                },
                { 
                    searchTexts: ['Cross-Pillar', 'cross pillar', 'synthesis'],
                    name: 'Cross-Pillar Synthesis',
                    fallbackSelector: '.strategic-content > .strategic-page-section:nth-child(3)'
                },
                { 
                    searchTexts: ['Agile', 'frameworks', 'agile frameworks'],
                    name: 'Agile Frameworks Recommendations',
                    fallbackSelector: '.strategic-content > .strategic-page-section:nth-child(4)'
                },
                { 
                    searchTexts: ['Risk', 'risk assessment', 'assessment'],
                    name: 'Risk Assessment',
                    fallbackSelector: '.strategic-content > .strategic-page-section:nth-child(5)'
                },
                { 
                    searchTexts: ['Success', 'benchmarks', 'success benchmarks'],
                    name: 'Success Benchmarks',
                    fallbackSelector: '.strategic-content > .strategic-page-section:nth-child(6)'
                },
                { 
                    searchTexts: ['Implementation', 'roadmap', 'implementation roadmap'],
                    name: 'Implementation Roadmap',
                    fallbackSelector: '.strategic-content > .strategic-page-section:nth-child(7)'
                },
                { 
                    searchTexts: ['Monitoring', 'feedback', 'monitoring feedback'],
                    name: 'Monitoring & Feedback',
                    fallbackSelector: '.strategic-content > .strategic-page-section:nth-child(8)'
                }
            ];

            // Helper function to find component by text content
            const findComponentByText = (searchTexts, container) => {
                const sections = container.querySelectorAll('.strategic-page-section');
                for (const section of sections) {
                    const headerElement = section.querySelector('.section-header, h2, h3');
                    if (headerElement) {
                        const headerText = headerElement.textContent || headerElement.innerText || '';
                        for (const searchText of searchTexts) {
                            if (headerText.toLowerCase().includes(searchText.toLowerCase())) {
                                return section;
                            }
                        }
                    }
                }
                return null;
            };

            // Find actual strategic sections using our specific components
            const strategicSections = [];
            for (const componentConfig of strategicComponents) {
                let component = null;
                
                // First try to find by text content
                if (componentConfig.searchTexts) {
                    component = findComponentByText(componentConfig.searchTexts, strategicContainer);
                }
                
                // Try fallback selector if text search doesn't work
                if (!component && componentConfig.fallbackSelector) {
                    component = strategicContainer.querySelector(componentConfig.fallbackSelector);
                }

                if (component) {
                    strategicSections.push({
                        element: component,
                        name: componentConfig.name
                    });
                } 
            }
            // Import PDF libraries
            const jsPDF = (await import('jspdf')).default;
            const html2canvas = (await import('html2canvas')).default;

            // Initialize PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let isFirstPage = true;
            // Helper function to capture a single section
            const captureSection = async (sectionData, sectionIndex) => {                
                const section = sectionData.element;
                const sectionTitle = sectionData.name;
                
                if (!section || section.offsetHeight === 0 || section.offsetWidth === 0) {
                    return false;
                }

                try {
                    // Hide buttons temporarily
                    const buttons = section.querySelectorAll('button');                    
                    const originalDisplay = [];
                    buttons.forEach((btn, index) => {
                        originalDisplay[index] = btn.style.display;
                        btn.style.display = 'none';
                    });

                    // Capture with html2canvas
                    const canvas = await html2canvas(section, {
                        scale: 1.5,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        height: section.scrollHeight,
                        width: section.scrollWidth
                    });

                    // Restore buttons
                    buttons.forEach((btn, index) => {
                        btn.style.display = originalDisplay[index];
                    });

                    // Add new page if not first
                    if (!isFirstPage) {
                        pdf.addPage();
                    } else {
                        isFirstPage = false;
                    }

                    // Add title
                    pdf.setFontSize(16);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(26, 115, 232);
                    pdf.text(sectionTitle, 20, 25);

                    // Add image
                    const imgData = canvas.toDataURL('image/png', 0.9);
                    const imgWidth = pageWidth - 40;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    const maxHeight = pageHeight - 60;
                    const finalHeight = imgHeight > maxHeight ? maxHeight : imgHeight;
                    const finalWidth = imgHeight > maxHeight ? (canvas.width * maxHeight) / canvas.height : imgWidth;

                    pdf.addImage(imgData, 'PNG', 20, 35, finalWidth, finalHeight);
                    return true;

                } catch (error) {
                    console.error(`Failed to capture section ${sectionIndex + 1}:`, error);
                    return false;
                }
            };

            // Capture all sections
            let capturedCount = 0;
            for (let i = 0; i < strategicSections.length; i++) {
                const success = await captureSection(strategicSections[i], i);
                if (success) {
                    capturedCount++;
                } 
                
                // Small delay between captures
                await new Promise(resolve => setTimeout(resolve, 300));
            } 
            // Check if we captured anything
            if (capturedCount === 0) {
                console.error('No sections were captured successfully');
                if (onToastMessage) {
                    onToastMessage("No strategic analysis content could be captured", "error");
                }
                return;
            }

            // Generate filename
            const fileName = `Strategic_Analysis_${businessName ? businessName.replace(/[^a-z0-9]/gi, '_') : 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
            // Save the PDF
            pdf.save(fileName);
            // Show success message
            if (onToastMessage) {
                onToastMessage(`Strategic Analysis PDF generated successfully! (${capturedCount} sections captured)`, "success");
            }

        } catch (error) {
            console.error('Error in download process:', error);
            if (onToastMessage) {
                onToastMessage("Failed to generate PDF. Please try again.", "error");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const iconSizes = {
        small: 16,
        medium: 20,
        large: 24
    };

    return (
        <>
            {/* Simple Black Blurred Loading Overlay */}
            {isGenerating && (
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
                        zIndex: 99999,
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)'
                    }}
                >
                    <Loader 
                        size={48} 
                        color="white"
                        style={{ animation: 'spin 1s linear infinite' }} 
                    />
                </div>
            )}
            
            <button
                onClick={handleDownload}
                disabled={isDisabled || !analysisData?.strategic || isGenerating} 
                style={{
                    backgroundColor: isGenerating ? "#f3f4f6" : "#1a73e8",
                    color: isGenerating ? "#6b7280" : "#fff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 18px",
                    fontSize: "14px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    cursor: isDisabled || isGenerating ? "not-allowed" : "pointer",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                }}
            >
                {isGenerating ? (
                    <>
                        <Loader size={iconSizes[size]} style={{ animation: 'spin 1s linear infinite' }} />
                        Generating PDF...
                    </>
                ) : (
                    <>
                        <Download size={iconSizes[size]} />
                        Download PDF
                    </>
                )}
            </button>
        </>
    );
};

export default DownloadStrategicPDF;