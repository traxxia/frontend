import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';

// Usage in StrategicAnalysis component:
// Import: import DownloadStrategicAnalysis from './DownloadStrategicAnalysis';
// Add to header: <DownloadStrategicAnalysis strategicData={localStrategicData} businessName={businessName} size="medium" />

const DownloadStrategicAnalysis = ({
    strategicData,
    businessName = '',
    isDisabled = false,
    size = 'medium',
    onToastMessage // Optional toast message callback
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    // Helper function to find component by text content
    const findComponentByText = (searchTexts) => {
        const sections = document.querySelectorAll('.strategic-page-section');
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

    // Define strategic analysis components to capture
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

    const handleDownload = async () => {
        if (!strategicData || isDisabled) {
            if (onToastMessage) {
                onToastMessage("No strategic analysis data available", "warning");
            }
            return;
        }

        try {
            setIsGenerating(true);
            if (onToastMessage) {
                onToastMessage("Generating Strategic Analysis PDF...", "info");
            }

            // Dynamic imports to reduce bundle size
            const jsPDF = (await import('jspdf')).default;
            const html2canvas = (await import('html2canvas')).default;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let isFirstPage = true;

            // Helper function to capture a single component
            const captureComponent = async (componentConfig) => {
                let component = null;
                
                // First try to find by text content
                if (componentConfig.searchTexts) {
                    component = findComponentByText(componentConfig.searchTexts);
                }
                
                // Try fallback selector if text search doesn't work
                if (!component && componentConfig.fallbackSelector) {
                    component = document.querySelector(componentConfig.fallbackSelector);
                }

                if (!component) {
                    console.warn(`Component not found: ${componentConfig.name}`);
                    return false;
                }

                try {
                    // Hide all buttons and interactive elements in this component during capture
                    const interactiveElements = component.querySelectorAll('button, .regenerate-button, .download-button, [class*="button"]');
                    const originalDisplay = [];
                    interactiveElements.forEach((element, index) => {
                        originalDisplay[index] = element.style.display;
                        element.style.display = 'none';
                    });

                    // Scroll element into view to ensure it's rendered
                    component.scrollIntoView({ behavior: 'instant', block: 'start' });
                    
                    // Wait a moment for any lazy loading or rendering
                    await new Promise(resolve => setTimeout(resolve, 300));

                    // Capture the component
                    const canvas = await html2canvas(component, {
                        scale: 1.5,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        height: component.scrollHeight,
                        width: component.scrollWidth,
                        windowWidth: window.innerWidth,
                        windowHeight: window.innerHeight,
                        scrollX: 0,
                        scrollY: 0
                    });

                    // Restore interactive elements
                    interactiveElements.forEach((element, index) => {
                        element.style.display = originalDisplay[index];
                    });

                    // Add new page if not the first component
                    if (!isFirstPage) {
                        pdf.addPage();
                    } else {
                        isFirstPage = false;
                    }

                    // Add component title
                    pdf.setFontSize(16);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(26, 115, 232); // Blue color
                    pdf.text(componentConfig.name, 20, 25);

                    // Calculate image dimensions to fit page
                    const imgData = canvas.toDataURL('image/png', 0.8);
                    const imgWidth = pageWidth - 40; // 20mm margin on each side
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    
                    // Check if image fits on page, scale down if needed
                    const maxHeight = pageHeight - 60; // Leave space for title and margins
                    const finalHeight = imgHeight > maxHeight ? maxHeight : imgHeight;
                    const finalWidth = imgHeight > maxHeight ? (canvas.width * maxHeight) / canvas.height : imgWidth;

                    // Center the image horizontally
                    const xPosition = (pageWidth - finalWidth) / 2;

                    pdf.addImage(imgData, 'PNG', xPosition, 35, finalWidth, finalHeight);

                    isFirstPage = false;
                    return true;

                } catch (error) {
                    console.error(`Failed to capture ${componentConfig.name}:`, error);
                    return false;
                }
            };

            // Capture all strategic analysis components
            let capturedCount = 0;

            for (const componentConfig of strategicComponents) {
                const success = await captureComponent(componentConfig);
                if (success) {
                    capturedCount++;
                }
                // Small delay between captures to ensure rendering
                await new Promise(resolve => setTimeout(resolve, 400));
            }

            // If no components were captured, try capturing the entire strategic content
            if (capturedCount === 0) {
                const strategicContent = document.querySelector('.strategic-content, .strategic-analysis-container');
                if (strategicContent) {
                    const success = await captureComponent({
                        searchTexts: [],
                        name: 'Complete Strategic Analysis',
                        fallbackSelector: '.strategic-content, .strategic-analysis-container'
                    });
                    if (success) capturedCount = 1;
                }
            }

            if (capturedCount === 0) {
                if (onToastMessage) {
                    onToastMessage("No strategic analysis components found to capture", "warning");
                }
                return;
            }

            // Generate filename
            const fileName = `Strategic_Analysis_${businessName ? businessName.replace(/[^a-z0-9]/gi, '_') : 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
            
            // Save the PDF
            pdf.save(fileName);

            if (onToastMessage) {
                onToastMessage(`Strategic Analysis PDF generated successfully! (${capturedCount} sections captured)`, "success");
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            if (onToastMessage) {
                onToastMessage("Failed to generate PDF. Please try again.", "error");
            } else {
                alert('Error generating PDF. Please try again.');
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
            {/* Loading Overlay */}
            {isGenerating && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '32px',
                            textAlign: 'center',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
                            minWidth: '300px',
                            animation: 'fadeIn 0.3s ease-out'
                        }}
                    >
                        <div
                            style={{
                                marginBottom: '20px'
                            }}
                        >
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
                            Creating Strategic Analysis for {businessName}...
                        </p>
                    </div>
                </div>
            )}

            <button
                onClick={handleDownload}
                disabled={isDisabled || !strategicData || isGenerating} 
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
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", 
                }}
                onMouseEnter={(e) => {
                    if (!isGenerating && !isDisabled) {
                        e.target.style.transform = "translateY(-1px)";
                        e.target.style.boxShadow = "0 4px 12px rgba(26, 115, 232, 0.3)";
                    }
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                }}
            >
                {isGenerating ? (
                    <>
                        <Loader size={iconSizes[size]} className="animate-spin" />
                        Generating PDF...
                    </>
                ) : (
                    <>
                        <Download size={iconSizes[size]} />
                        Download PDF
                    </>
                )}
            </button>

            <style >{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </>
    );
};

export default DownloadStrategicAnalysis;