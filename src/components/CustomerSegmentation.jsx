import React, { useState, useEffect, useRef } from 'react';
import { Users, TrendingUp, Star, Calendar, Filter, Loader } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import '../styles/Analytics.css'; // We'll create this CSS file
import { useTranslation } from "../hooks/useTranslation";

const CustomerSegmentation = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true
}) => {
  const [segmentationData, setSegmentationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoadedFromBackend, setHasLoadedFromBackend] = useState(false);
  
  // Add refs to track if API has been called and component mount
  const hasCalledAPI = useRef(false);
  const isMounted = useRef(false);
  const { t } = useTranslation();

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  // Colors for the pie chart segments
  const SEGMENT_COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Load existing analysis from backend
  const loadExistingAnalysis = async () => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/analysis/customerSegmentation`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Loaded existing customer segmentation from backend:', result.analysisData);
        setSegmentationData(result.analysisData);
        setHasLoadedFromBackend(true);
        if (onDataGenerated) {
          onDataGenerated(result.analysisData);
        }
        return true;
      } else if (response.status === 404) {
        console.log('📊 No existing customer segmentation found in backend');
        setHasLoadedFromBackend(true);
        return false;
      } else {
        console.error('Failed to load customer segmentation:', response.statusText);
        setHasLoadedFromBackend(true);
        return false;
      }
    } catch (error) {
      console.error('Error loading customer segmentation:', error);
      setHasLoadedFromBackend(true);
      return false;
    }
  };

  // Save analysis to backend
  const saveAnalysisToBackend = async (analysisData) => {
    try {
      const token = getAuthToken();

      // Get current session ID
      const currentResponse = await fetch(`${API_BASE_URL}/api/conversation/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!currentResponse.ok) {
        throw new Error('Failed to get current conversation');
      }

      const conversation = await currentResponse.json();
      const sessionId = conversation.sessionId;

      if (!sessionId) {
        throw new Error('No active conversation session found');
      }

      const response = await fetch(`${API_BASE_URL}/api/analysis/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          analysisType: 'customerSegmentation',
          analysisData: analysisData,
          businessName: businessName
        })
      });

      if (response.ok) {
        console.log('📊 Customer segmentation analysis saved to backend');
        return true;
      } else {
        console.error('Failed to save customer segmentation analysis:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error saving customer segmentation analysis:', error);
      return false;
    }
  };

  const generateSegmentationData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare questions and answers arrays
      const questionsArray = [];
      const answersArray = [];

      // Sort questions by ID to maintain order
      const sortedQuestions = [...questions].sort((a, b) => a.id - b.id);

      // Only include answered questions
      sortedQuestions.forEach(question => {
        if (userAnswers[question.id]) {
          // Clean and sanitize text to avoid encoding issues
          const cleanQuestion = String(question.question)
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          const cleanAnswer = String(userAnswers[question.id])
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x00-\x7F]/g, '')
            .trim();

          questionsArray.push(cleanQuestion);
          answersArray.push(cleanAnswer);
        }
      });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for customer segmentation analysis');
      }

      const payload = {
        questions: questionsArray,
        answers: answersArray
      };

      console.log('Sending to /customer-segment API:', payload);

      const response = await fetch(`${ML_API_BASE_URL}/customer-segment`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        let errorMessage = `API returned ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.detail) {
            errorMessage = `API Error: ${errorData.detail}`;
          }
        } catch (e) {
          errorMessage = `API Error: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid JSON response from API');
      }

      console.log('Parsed result from /customer-segment API:', result);

      if (result && result.customerSegmentation) {
        console.log('Setting segmentation data:', result.customerSegmentation);
        setSegmentationData(result.customerSegmentation);
        
        // Save to backend
        await saveAnalysisToBackend(result.customerSegmentation);
        
        if (onDataGenerated) {
          onDataGenerated(result.customerSegmentation);
        }
      } else {
        console.error('Invalid response structure:', result);
        throw new Error('Invalid response structure from API');
      }

    } catch (error) {
      console.error('Error generating customer segmentation:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    hasCalledAPI.current = false; // Reset the flag for regeneration
    setHasLoadedFromBackend(false); // Reset backend load flag
    if (onRegenerate) {
      // Use parent's regeneration logic
      onRegenerate();
    } else {
      // Use local regeneration logic
      setSegmentationData(null);
      await generateSegmentationData();
    }
  };

  // Load existing analysis on mount
  useEffect(() => {
    isMounted.current = true;
    
    const initializeComponent = async () => {
      // First try to load existing analysis from backend
      const hasExistingAnalysis = await loadExistingAnalysis();
      
      if (!hasExistingAnalysis) {
        // If no existing analysis, check if we can generate new one
        const answeredCount = Object.keys(userAnswers).length;
        
        if (
          answeredCount >= 3 && 
          !segmentationData && 
          !isLoading && 
          !hasCalledAPI.current && 
          isMounted.current
        ) {
          hasCalledAPI.current = true;
          generateSegmentationData();
        }
      }
    };

    initializeComponent();

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []); // Empty dependency array - only run on mount

  // Separate useEffect to handle prop changes (if needed)
  useEffect(() => {
    // Only proceed if we've already tried loading from backend
    if (!hasLoadedFromBackend) return;
    
    const answeredCount = Object.keys(userAnswers).length;
    
    // Only trigger if we have new data and haven't called API yet
    if (
      answeredCount >= 3 && 
      !segmentationData && 
      !isLoading && 
      !hasCalledAPI.current && 
      isMounted.current
    ) {
      hasCalledAPI.current = true;
      generateSegmentationData();
    }
  }, [userAnswers, questions, hasLoadedFromBackend]); // Include hasLoadedFromBackend in dependencies

  // Create CSS pie chart data
  const createPieChartData = () => {
    if (!segmentationData?.segments) return { segments: [], total: 0 };

    let runningTotal = 0;
    const processedSegments = segmentationData.segments.map((segment, index) => {
      const startAngle = runningTotal;
      runningTotal += segment.percentage;

      return {
        ...segment,
        color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
        startAngle,
        endAngle: runningTotal,
        offset: runningTotal - (segment.percentage / 2) // For label positioning
      };
    });

    return { segments: processedSegments, total: runningTotal };
  };

  const preparePurchaseCriteriaData = () => {
    if (!segmentationData?.purchaseCriteriaRatings) return [];

    return Object.entries(segmentationData.purchaseCriteriaRatings).map(([criteria, rating]) => ({
      criteria: criteria.charAt(0).toUpperCase() + criteria.slice(1).replace(/([A-Z])/g, ' $1'),
      rating: rating,
      percentage: (rating / 10) * 100
    }));
  };

  if (isLoading || isRegenerating) {
    return (
      <div className="customer-segmentation">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? t("Regenerating customer segmentation analysis...")
              : !hasLoadedFromBackend
              ? t("Loading customer segmentation analysis...")
              : t("Generating customer segmentation analysis...")
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-segmentation">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={() => {
            hasCalledAPI.current = false; // Reset flag for retry
            generateSegmentationData();
          }} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!segmentationData) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="customer-segmentation">
        <div className="empty-state">
          <Users size={48} className="empty-icon" />
          <h3>Customer Segmentation Analysis</h3>
          <p>
            {answeredCount < 3
              ? `Answer ${3 - answeredCount} more questions to generate customer segmentation insights.`
              : hasLoadedFromBackend
              ? "Generate your customer segmentation analysis to understand your customer base better."
              : "Loading customer segmentation analysis..."
            }
          </p>
          {answeredCount >= 3 && hasLoadedFromBackend && (
            <button onClick={() => {
              hasCalledAPI.current = false; // Reset flag for manual generation
              generateSegmentationData();
            }} className="generate-button">
              Generate Analysis
            </button>
          )}
        </div>
      </div>
    );
  }

  const pieData = createPieChartData();
  const purchaseCriteriaData = preparePurchaseCriteriaData();

  return (
    <div className="customer-segmentation">
      {/* Header with regenerate button */}
      <div className="cs-header">
        <div className="cs-title-section">
          <Users className="cs-icon" size={24} />
          <h2 className="cs-title">{t("Customer Segmentation")}</h2>
        </div>
        <RegenerateButton
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="Customer Segmentation"
          size="medium"
        />
      </div>

      {/* Key Metrics */}
      <div className="cs-metrics">
        <div className="cs-metric-card cs-metric-blue">
          <div className="cs-metric-header">
            <Users size={20} />
            <span>Total Segments : </span>
            <p className="cs-metric-value">{segmentationData.segments?.length || 0}</p>
          </div>
          
          {segmentationData.loyaltyScore && (
            <div className="cs-metric-header">
              <Star size={20} />
              <span>Loyalty Score : </span>
              <p className="cs-metric-value">{segmentationData.loyaltyScore}</p>
            </div>
          )}
          
          {segmentationData.totalCustomers && (
            <div className="cs-metric-header">
              <TrendingUp size={20} />
              <span>Total Customers : </span>
              <p className="cs-metric-value">{segmentationData.totalCustomers.toLocaleString()}</p>
            </div>
          )}
          
          {segmentationData.segmentationCriteria && (
            <div className="cs-metric-header">
              <Filter size={20} />
              <span>Segmentation Criteria : </span>
              <p className="cs-metric-value">{segmentationData.segmentationCriteria}</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="cs-charts"> 
        <div className="cs-chart-container">
          <h3 className="cs-chart-title">Customer Distribution & Segment Details</h3>
          <div className="pie-chart-wrapper enhanced">
            <div className="pie-chart-section">
              <svg className="pie-chart" viewBox="0 0 200 200">
                {pieData.segments.map((segment, index) => {
                  const startAngle = (segment.startAngle / 100) * 360;
                  const endAngle = (segment.endAngle / 100) * 360;
                  const largeArcFlag = (endAngle - startAngle) > 180 ? 1 : 0;

                  const startX = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const startY = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const endX = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const endY = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);

                  const pathData = [
                    "M", 100, 100,
                    "L", startX, startY,
                    "A", 80, 80, 0, largeArcFlag, 1, endX, endY,
                    "Z"
                  ].join(" ");

                  return (
                    <g key={index}>
                      <path
                        d={pathData}
                        fill={segment.color}
                        stroke="#fff"
                        strokeWidth="2"
                        className="pie-segment"
                      />
                    </g>
                  );
                })}

                {/* Center circle */}
                <circle cx="100" cy="100" r="30" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                <text x="100" y="95" textAnchor="middle" className="pie-center-text">Customer</text>
                <text x="100" y="110" textAnchor="middle" className="pie-center-text">Segments</text>
              </svg>
            </div>

            {/* Single-Line Legend */}
            <div className="pie-legend-single-line">
              {pieData.segments.map((segment, index) => (
                <div key={index} className="pie-legend-single-item">
                  <div className="pie-legend-row">
                    <div
                      className="pie-legend-color"
                      style={{ backgroundColor: segment.color }}
                    ></div>
                    <span className="pie-legend-name">{segment.name}</span>
                    <span className="pie-legend-percentage">{segment.percentage}%</span>
                  </div>
                  
                  {/* Single line details */}
                  <div className="pie-legend-single-details">
                    {segment.characteristics?.primaryNeed && (
                      <>
                        <span className="pie-detail-label">Primary Need:</span>
                        <span className="pie-detail-value">{segment.characteristics.primaryNeed}</span>
                      </>
                    )}
                    {segment.characteristics?.behavior && (
                      <>
                        <span className="pie-detail-separator">•</span>
                        <span className="pie-detail-label">Behavior:</span>
                        <span className="pie-detail-value">{segment.characteristics.behavior}</span>
                      </>
                    )}
                    {segment.characteristics?.loyaltyScore && (
                      <>
                        <span className="pie-detail-separator">•</span>
                        <span className="pie-detail-label">Loyalty:</span>
                        <span className="pie-detail-value">{segment.characteristics.loyaltyScore}</span>
                      </>
                    )}
                    {segment.size && (
                      <>
                        <span className="pie-detail-separator">•</span>
                        <span className="pie-detail-label">Size:</span>
                        <span className="pie-detail-value">{segment.size.toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Purchase Criteria Chart */}
        {purchaseCriteriaData.length > 0 && (
          <div className="cs-chart-container">
            <h3 className="cs-chart-title">Purchase Criteria Ratings</h3>
            <div className="bar-chart">
              {purchaseCriteriaData.map((item, index) => (
                <div key={index} className="bar-item">
                  <div className="bar-label">{item.criteria}</div>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                    <span className="bar-value">{item.rating}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Segments Details */}
    </div>
  );
};

export default CustomerSegmentation;