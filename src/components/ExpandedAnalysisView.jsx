import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { ArrowLeft, RefreshCw, Download } from 'lucide-react';
import AnalysisTypeSelector from './AnalysisTypeSelector';
import AnalysisRenderer from './AnalysisRenderer';
import { getIconComponent } from '../utils/iconUtils';

// NEW: Import Save Components
import SaveAnalysisButton from './SaveAnalysisButton';

// Helper function to get default analysis type for a category
const getDefaultAnalysisType = (category, analysisItems) => {
  const categoryItems = analysisItems.filter(item => item.category === category);

  if (category === 'analysis') {
    const swotItem = categoryItems.find(item => item.id === 'swot');
    if (swotItem) return 'swot';

    const firstItem = categoryItems[0];
    return firstItem ? getAnalysisTypeFromItemId(firstItem.id) : null;
  } else if (category === 'strategic') {
    const strategicItem = categoryItems.find(item => item.id === 'strategic');
    if (strategicItem) return 'strategic';

    const firstItem = categoryItems[0];
    return firstItem ? getAnalysisTypeFromItemId(firstItem.id) : null;
  }

  return null;
};

// Helper function to get default analysis item for a category
const getDefaultAnalysisItem = (category, analysisItems) => {
  const categoryItems = analysisItems.filter(item => item.category === category);

  if (category === 'analysis') {
    const swotItem = categoryItems.find(item => item.id === 'swot');
    return swotItem || categoryItems[0];
  } else if (category === 'strategic') {
    const strategicItem = categoryItems.find(item => item.id === 'strategic');
    return strategicItem || categoryItems[0];
  }

  return categoryItems[0];
};

// Helper function to convert item ID to analysis type (same logic as getAnalysisType)
const getAnalysisTypeFromItemId = (itemId) => {
  return itemId === 'porters' ? 'porter' :
    itemId === 'value-chain' ? 'valuechain' :
      itemId;
};

const ExpandedAnalysisView = ({
  businessData,
  activeAnalysisItem,
  fullScreenAnalysisTab,
  setFullScreenAnalysisTab,
  selectedAnalysisType,
  analysisData,
  analysisLoading,
  onFrameworkTabClick,
  onAnalysisTypeSelect,
  onCloseExpandedView,
  onRegenerateAnalysis,
  shouldAutoRegenerate, // NEW: Auto-regeneration status
  lastAnswerChangeTime, // NEW: Last change time for UI feedback
  surveyData, // NEW: Survey data for saving
  businessName, // NEW: Business name for saving
  t // Translation function passed from parent
}) => {
  const [translations, setTranslations] = useState({});
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Get translation function
  const translate = (key) => {
    if (t) {
      return t(key);
    }
    if (window.getTranslation) {
      return window.getTranslation(key);
    }
    return translations[key] || key;
  };

  // Update translations when language changes (fallback if t is not passed)
  useEffect(() => {
    if (!t) {
      const updateTranslations = () => {
        const currentLang = window.currentAppLanguage || 'en';
        const currentTranslations = window.appTranslations?.[currentLang] || {};
        setTranslations(currentTranslations);
      };

      updateTranslations();
      window.addEventListener('languageChanged', updateTranslations);

      return () => {
        window.removeEventListener('languageChanged', updateTranslations);
      };
    }
  }, [t]);

  const analysisItems = businessData.analysisItems.filter(item => item.category === "analysis");
  const strategicItems = businessData.analysisItems.filter(item => item.category === "strategic");
  const currentItems = fullScreenAnalysisTab === "analysis" ? analysisItems : strategicItems;

  // Ensure the correct tab is selected based on the active analysis item
  React.useEffect(() => {
    if (activeAnalysisItem && activeAnalysisItem.category !== fullScreenAnalysisTab) {
      setFullScreenAnalysisTab(activeAnalysisItem.category);
    }
  }, [activeAnalysisItem, fullScreenAnalysisTab, setFullScreenAnalysisTab]);

  const getCacheKey = () => {
    const currentLanguage = window.currentAppLanguage || 'en';
    return activeAnalysisItem ? `${activeAnalysisItem.id}-${selectedAnalysisType}-${currentLanguage}` : null;
  };

  const analysisResult = getCacheKey() ? analysisData[getCacheKey()] : null;
  const isLoading = getCacheKey() ? analysisLoading[getCacheKey()] : false;

  // Direct PDF Export - captures current UI content with same design
  const handleExportToPDF = async () => {
    setIsExporting(true);
    
    try {
      // Method 1: Using html2pdf library (better quality)
      const exportWithHtml2pdf = async () => {
        try {
          // Dynamically load html2pdf library
          if (!window.html2pdf) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            document.head.appendChild(script);
            
            await new Promise((resolve) => {
              script.onload = resolve;
            });
          }

          const element = document.querySelector('.expanded-analysis-main .analysis-component-container') || 
                         document.querySelector('.expanded-analysis-main') ||
                         document.querySelector('.analysis-component-container');
          
          if (!element) {
            alert(translate('no_content_to_export') || 'No content found to export');
            return false;
          }

          const opt = {
            margin: 1,
            filename: `analysis-report-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff'
            },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
          };

          await window.html2pdf().set(opt).from(element).save();
          return true;
        } catch (error) {
          console.error('html2pdf error:', error);
          return false;
        }
      };

      // Method 2: Using browser print (fallback)
      const exportWithPrint = () => {
        try {
          const element = document.querySelector('.expanded-analysis-main .analysis-component-container') || 
                         document.querySelector('.expanded-analysis-main') ||
                         document.querySelector('.analysis-component-container');
          
          if (!element) {
            alert(translate('no_content_to_export') || 'No content found to export');
            return false;
          }

          // Get current styles
          const styleSheets = Array.from(document.styleSheets)
            .map(styleSheet => {
              try {
                return Array.from(styleSheet.cssRules)
                  .map(rule => rule.cssText)
                  .join('\n');
              } catch (e) {
                return '';
              }
            })
            .join('\n');

          const printWindow = window.open('', '_blank');
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Analysis Report</title>
              <style>
                ${styleSheets}
                @media print {
                  body { 
                    margin: 20px !important; 
                    font-family: Arial, sans-serif !important; 
                    background: white !important;
                  }
                  button, .btn, .dropdown, .regenerate-analysis-btn {
                    display: none !important;
                  }
                  table { 
                    width: 100% !important; 
                    border-collapse: collapse !important; 
                    margin-bottom: 20px !important;
                  }
                  th, td { 
                    border: 1px solid #ddd !important; 
                    padding: 8px !important; 
                  }
                  .analysis-card, .card { 
                    margin-bottom: 20px !important; 
                    page-break-inside: avoid !important; 
                    border: 1px solid #ddd !important;
                    padding: 15px !important;
                  }
                  h1, h2, h3, h4, h5, h6 {
                    page-break-after: avoid !important;
                  }
                  * {
                    color: black !important;
                  }
                }
                @page {
                  margin: 20mm;
                  size: A4;
                }
              </style>
            </head>
            <body>
              <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                <h1>Analysis Report</h1>
                <p>Generated: ${new Date().toLocaleDateString()}</p>
              </div>
              ${element.outerHTML}
            </body>
            </html>
          `);
          
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => printWindow.close(), 1000);
          }, 1000);
          
          return true;
        } catch (error) {
          console.error('Print export error:', error);
          return false;
        }
      };

      // Try html2pdf first, fallback to print method
      let success = false;
      try {
        success = await exportWithHtml2pdf();
      } catch (error) {
        console.log('Trying print method...');
        success = exportWithPrint();
      }

      if (!success) {
        // Final fallback - just print current page
        window.print();
      }

    } catch (error) {
      console.error('Export error:', error);
      alert(translate('export_error') || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Enhanced tab click handler with proper caching logic
  const handleTabClick = async (item) => {
    console.log('Tab clicked:', item.id);

    // Get the analysis type for this item
    const analysisType = getAnalysisTypeFromItemId(item.id);
    const currentLanguage = window.currentAppLanguage || 'en';
    const cacheKey = `${item.id}-${analysisType}-${currentLanguage}`;

    // Check if we already have cached data for this analysis
    const hasCachedData = analysisData[cacheKey] && analysisData[cacheKey].length > 0;

    console.log('Cache key:', cacheKey);
    console.log('Has cached data:', hasCachedData);
    console.log('Cached data:', analysisData[cacheKey]);

    if (hasCachedData) {
      // Use cached data - NO API call
      console.log('Using cached analysis data');
      await onFrameworkTabClick(item, false, analysisType); // false = don't force refresh
    } else {
      // No cached data - generate new analysis
      console.log('No cached data found, generating new analysis');
      await onFrameworkTabClick(item, true, analysisType); // true = force refresh to generate
    }
  };

  // Handle Analysis/Strategic button clicks with default selection
  const handleCategoryTabClick = async (category) => {
    console.log('Category clicked:', category);
    setFullScreenAnalysisTab(category);

    // Only auto-select if there's no active analysis item or if switching categories
    if (!activeAnalysisItem || activeAnalysisItem.category !== category) {
      // Get default analysis type and item for this category
      const defaultAnalysisType = getDefaultAnalysisType(category, businessData.analysisItems);
      const defaultAnalysisItem = getDefaultAnalysisItem(category, businessData.analysisItems);

      console.log('Default analysis type:', defaultAnalysisType);
      console.log('Default analysis item:', defaultAnalysisItem);

      if (defaultAnalysisType && defaultAnalysisItem) {
        // Check cache for default item
        const currentLanguage = window.currentAppLanguage || 'en';
        const cacheKey = `${defaultAnalysisItem.id}-${defaultAnalysisType}-${currentLanguage}`;
        const hasCachedData = analysisData[cacheKey] && analysisData[cacheKey].length > 0;

        // Call onFrameworkTabClick with appropriate refresh flag
        await onFrameworkTabClick(defaultAnalysisItem, !hasCachedData, defaultAnalysisType);
      } else {
        console.log('No default analysis type or item found for category:', category);
        console.log('Available items:', businessData.analysisItems.filter(item => item.category === category));
      }
    }
  };

  // Handle regenerate current analysis
  const handleRegenerateCurrentAnalysis = async () => {
    if (!activeAnalysisItem || !selectedAnalysisType) {
      console.warn('No active analysis item or selected type for regeneration');
      return;
    }

    setIsRegenerating(true);

    try {
      console.log(`Regenerating analysis: ${selectedAnalysisType} for ${activeAnalysisItem.id}`);
      // Force regeneration and update cache
      await onRegenerateAnalysis(selectedAnalysisType, activeAnalysisItem.id);
      console.log('Analysis regenerated successfully');
    } catch (error) {
      console.error('Error regenerating analysis:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle analysis type change with caching logic
  const handleAnalysisTypeChange = async (analysisType, forceRefresh = false) => {
    if (!activeAnalysisItem) return;

    console.log('Analysis type changed to:', analysisType);

    const currentLanguage = window.currentAppLanguage || 'en';
    const cacheKey = `${activeAnalysisItem.id}-${analysisType}-${currentLanguage}`;
    const hasCachedData = analysisData[cacheKey] && analysisData[cacheKey].length > 0;

    console.log('Cache key for type change:', cacheKey);
    console.log('Has cached data for this type:', hasCachedData);

    if (hasCachedData && !forceRefresh) {
      // Use cached data
      console.log('Using cached data for analysis type change');
      await onAnalysisTypeSelect(analysisType, false);
    } else {
      // Generate new analysis
      console.log('Generating new analysis for type change');
      await onAnalysisTypeSelect(analysisType, true);
    }
  };

  // NEW: Enhanced Analysis Header Component with Save Button
  const AnalysisHeader = () => {
    if (!activeAnalysisItem) return null;

    const cacheKey = getCacheKey();
    const hasCachedData = cacheKey && analysisData[cacheKey] && analysisData[cacheKey].length > 0;

    return (
      <div className="d-flex justify-content-between align-items-center mb-3">
        {/* Left side - Analysis info and auto-regeneration status */}
        <div className="analysis-header-info">
          <h5 className="mb-1">{activeAnalysisItem.title}</h5>
          {shouldAutoRegenerate && (
            <small className="text-info">
              📝 {translate('analysis_will_update') || 'Analysis will update automatically after answer changes'}
            </small>
          )}
          {lastAnswerChangeTime && (
            <small className="text-muted d-block">
              {translate('last_change') || 'Last change'}: {new Date(lastAnswerChangeTime).toLocaleTimeString()}
            </small>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="d-flex gap-2"> 
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleRegenerateCurrentAnalysis}
            disabled={isLoading || isRegenerating || !hasCachedData}
            className="regenerate-analysis-btn"
            title={!hasCachedData ? "Generate analysis first" : "Regenerate this analysis"}
          >
            <RefreshCw
              size={14}
              className={`me-1 ${(isLoading || isRegenerating) ? 'spinning' : ''}`}
            />
            {isRegenerating ? (translate('regenerating') || 'Regenerating...') : (translate('regenerate') || 'Regenerate')}
          </Button>

          <SaveAnalysisButton
            analysisData={analysisResult}
            analysisType={selectedAnalysisType}
            analysisFramework={activeAnalysisItem?.title}
            category={activeAnalysisItem?.category}
            businessName={businessName}
            surveyData={surveyData}
            disabled={isLoading || isRegenerating || !hasCachedData}
            size="sm"
            variant="success"
            t={translate}
          />
          
          {/* Direct PDF Export Button */}
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleExportToPDF}
            disabled={isExporting || !hasCachedData}
            title={!hasCachedData ? "Generate analysis first" : "Export current view as PDF"}
          >
            {isExporting ? (
              <>
                <RefreshCw size={14} className="spinning me-1" />
                {translate('exporting') || 'Exporting...'}
              </>
            ) : (
              <>
                <Download size={14} className="me-1" />
                {translate('export_pdf') || 'Export PDF'}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="expanded-analysis-view">
      {/* Menu Bar */}
      <div className="analysis-menu-bar">
        <div className="menu-bar-left">
          <Button
            variant="outline-secondary"
            onClick={onCloseExpandedView}
            className="expanded-back-button"
          >
            <ArrowLeft size={18} className="me-2" />
            {translate('back')}
          </Button>
          <div className="menu-divider"></div>
          <Button
            variant={fullScreenAnalysisTab === "analysis" ? "primary" : "outline-primary"}
            size="sm"
            onClick={() => handleCategoryTabClick("analysis")}
            className="me-2"
          >
            {translate('analysis')}
          </Button>
          <Button
            variant={fullScreenAnalysisTab === "strategic" ? "primary" : "outline-primary"}
            size="sm"
            onClick={() => handleCategoryTabClick("strategic")}
          >
            {translate('strategic')}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="expanded-analysis-content">
        {/* Horizontal navigation tabs for current category */}
        <div className="expanded-analysis-nav">
          {currentItems.map((item) => {
            const IconComponent = getIconComponent(item.icon);

            // Check if this tab has cached data
            const analysisType = getAnalysisTypeFromItemId(item.id);
            const currentLanguage = window.currentAppLanguage || 'en';
            const cacheKey = `${item.id}-${analysisType}-${currentLanguage}`;
            const hasCachedData = analysisData[cacheKey] && analysisData[cacheKey].length > 0;

            return (
              <button
                key={item.id}
                className={`expanded-analysis-tab ${activeAnalysisItem?.id === item.id ? 'active' : ''
                  } ${hasCachedData ? 'has-cache' : ''}`}
                onClick={() => handleTabClick(item)}
                title={hasCachedData ? 'Analysis cached' : 'Generate analysis'}
              >
                <span className="tab-icon">
                  <IconComponent size={20} />
                </span>
                <span className="tab-text">{item.title}</span>
                {hasCachedData && (
                  <span className="cache-dot"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="expanded-analysis-main">
          {activeAnalysisItem ? (
            <>
              {/* NEW: Enhanced Analysis Header with Save Button */}
              <AnalysisHeader />

              {/* Only show AnalysisTypeSelector if the item has multiple analysis types */}
              {activeAnalysisItem.analysisTypes && activeAnalysisItem.analysisTypes.length > 1 ? (
                <AnalysisTypeSelector
                  analysisTypes={activeAnalysisItem.analysisTypes || []}
                  selectedType={selectedAnalysisType}
                  onTypeSelect={handleAnalysisTypeChange} // Use new handler with caching
                  onRegenerateAnalysis={onRegenerateAnalysis}
                  isLoading={isLoading || isRegenerating}
                  activeAnalysisItem={activeAnalysisItem}
                  showRegenerateButton={false} // Hide the old regenerate button since we have the new one
                  t={translate} // Pass translation function
                />
              ) : (
                <></>
              )}

              {/* Analysis Component */}
              <div className="analysis-component-container">
                <AnalysisRenderer
                  selectedAnalysisType={selectedAnalysisType}
                  analysisItem={activeAnalysisItem}
                  analysisResult={analysisResult}
                  isLoading={isLoading || isRegenerating}
                  t={translate} // Pass translation function
                />
              </div>
            </>
          ) : (
            <div className="analysis-content-workspace">
              <div className="analysis-content-header centered">
                <h4>{translate('select_analysis_framework')}</h4>
                <p>{translate('choose_framework_instruction')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add spinning animation CSS */}
      <style jsx>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .analysis-header-info h5 {
          margin-bottom: 4px;
        }

        .analysis-header-info small {
          font-size: 0.8rem;
        }

        .analysis-menu-bar {
          border-bottom: 1px solid #e9ecef;
          padding: 1rem;
          background: white;
        }

        .expanded-analysis-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .expanded-analysis-main {
          padding: 1.5rem;
          flex: 1;
        }
      `}</style>
    </div>
  );
};

export default ExpandedAnalysisView;