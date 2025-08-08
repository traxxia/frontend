import React, { useState, useEffect } from 'react';
import { Loader, RefreshCw, Activity, BarChart3, DollarSign, Target, TrendingUp } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import "../styles/EssentialPhase.css"; 

const ProductivityMetrics = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  productivityData = null
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';

  const generateProductivityMetrics = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => userAnswers[q._id] && userAnswers[q._id].trim() && userAnswers[q._id] !== '[Question Skipped]')
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(userAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('No answered questions available for productivity metrics analysis');
      }

      console.log('🚀 Calling Productivity Metrics API with:', {
        questionsCount: questionsArray.length,
        answersCount: answersArray.length,
        questions: questionsArray.slice(0, 3),
        answers: answersArray.slice(0, 3)
      });

      const response = await fetch(`${ML_API_BASE_URL}/productivity-metrics`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray,
          answers: answersArray
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Productivity Metrics API Error Response:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Productivity Metrics API Raw Response:', result);

      const processedData = result.productivityMetrics ? result : { productivityMetrics: result };
      console.log('📊 Processed Productivity Metrics Data:', processedData);

      return processedData;

    } catch (error) {
      console.error('💥 Error generating productivity metrics:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const hasAnswers = questions.some(q => userAnswers[q._id] && userAnswers[q._id].trim());

    console.log('🔍 Productivity Metrics useEffect triggered:', {
      hasAnswers,
      hasProductivityData: !!productivityData,
      isGenerating,
      isRegenerating,
      questionsLength: questions.length,
      userAnswersKeys: Object.keys(userAnswers).length
    });

    if (!productivityData && hasAnswers && !isGenerating && !isRegenerating) {
      console.log('✅ Auto-generating productivity metrics...');
      generateProductivityMetrics();
    }
  }, [questions, userAnswers, productivityData]);

  const handleRegenerate = async () => {
    console.log('🔄 Productivity Metrics Regenerate triggered');
    console.log('📝 Current productivityData:', productivityData);
    console.log('⚙️ Regeneration props:', {
      isRegenerating,
      canRegenerate,
      hasOnRegenerate: !!onRegenerate
    });

    if (onRegenerate) {
      console.log('🎯 Calling parent onRegenerate function');
      onRegenerate();
    } else {
      console.log('🔧 Calling local generateProductivityMetrics function');
      await generateProductivityMetrics();
    }
  };

  // Productivity Chart Component
  const ProductivityChart = ({ employeeProductivity = {} }) => {
    const {
      totalEmployees = 0,
      averageValuePerEmployee = 0,
      totalValueGenerated = 0,
      productivityIndex = 0,
      totalCostPercentage = 0
    } = employeeProductivity;

    return (
      <div className="productivity-chart">
        <div className="chart-metrics">
          <div className="metric-card primary">
            <div className="metric-value">{totalEmployees}</div>
            <div className="metric-label">Total Employees</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">${averageValuePerEmployee?.toLocaleString()}</div>
            <div className="metric-label">Avg Value/Employee</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">${totalValueGenerated?.toLocaleString()}</div>
            <div className="metric-label">Total Value Generated</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{productivityIndex}</div>
            <div className="metric-label">Productivity Index</div>
          </div>
        </div>
        
        {totalCostPercentage > 0 && (
          <div className="cost-indicator">
            <div className="cost-bar">
              <div 
                className="cost-fill" 
                style={{ width: `${totalCostPercentage}%` }}
              ></div>
            </div>
            <div className="cost-label">Employee Cost: {totalCostPercentage}%</div>
          </div>
        )}
      </div>
    );
  };

  // Value Drivers Component
  const ValueDrivers = ({ drivers = [] }) => {
    if (drivers.length === 0) return null;

    const getEfficiencyColor = (efficiency) => {
      switch (efficiency?.toLowerCase()) {
        case 'high': return '#10b981';
        case 'medium': return '#f59e0b';
        case 'low': return '#ef4444';
        default: return '#6b7280';
      }
    };

    return (
      <div className="value-drivers">
        <div className="drivers-grid">
          {drivers.map((driver, index) => (
            <div key={index} className="driver-card">
              <div className="driver-header">
                <div className="driver-name">{driver.driver}</div>
                <div 
                  className={`efficiency-badge ${driver.efficiency?.toLowerCase()}`}
                  style={{ backgroundColor: getEfficiencyColor(driver.efficiency) }}
                >
                  {driver.efficiency}
                </div>
              </div>
              <div className="driver-contribution">
                {driver.contribution?.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (isGenerating || isRegenerating) {
    return (
      <div className="productivity-metrics">
        <div className="loading-state">
          <Loader size={32} className="spinner" />
          <h3>Analyzing Productivity Metrics</h3>
          <p>Evaluating employee productivity, cost efficiency, and value generation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !productivityData) {
    return (
      <div className="productivity-metrics">
        <div className="error-state">
          <h3>Unable to Generate Productivity Analysis</h3>
          <p>{error}</p>
          <button onClick={handleRegenerate} disabled={!canRegenerate} className="btn-retry">
            <RefreshCw size={16} />
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!productivityData?.productivityMetrics && !productivityData?.employeeProductivity) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="productivity-metrics">
        <div className="cs-header">
          <div className="cs-title-section">
            <Activity size={24} />
            <h2 className='cs-title'>
              Productivity and Efficiency Metrics
            </h2> 
          </div>
          <RegenerateButton
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            sectionName="Productivity Metrics"
            size="medium"
            buttonText="Generate"
          />
        </div>

        <div className="empty-state">
          <Activity size={48} />
          <h3>Productivity and Efficiency Metrics</h3>
          <p>
            {answeredCount < 3
              ? `Answer ${3 - answeredCount} more questions to generate your productivity analysis.`
              : "Productivity analysis will be generated automatically after completing the essential phase."
            }
          </p>
        </div>
      </div>
    );
  }

  // Handle both wrapped and direct response structures
  const productivityMetrics = productivityData?.productivityMetrics || productivityData;

  console.log('📊 Final productivityMetrics data being rendered:', {
    originalData: productivityData,
    processedMetrics: productivityMetrics,
    hasEmployeeProductivity: !!productivityMetrics?.employeeProductivity,
    hasCostStructure: !!productivityMetrics?.costStructure,
    hasValueDrivers: !!productivityMetrics?.valueDrivers,
    hasImprovementOpportunities: !!productivityMetrics?.improvementOpportunities
  });

  return (
    <div className="productivity-metrics">
      {/* Header */}
      <div className="cs-header">
        <div className="cs-title-section">
          <Activity size={24} />
          <h2 className='cs-title'>
            Productivity and Efficiency Metrics
          </h2> 
        </div>
        {canRegenerate && (
          <RegenerateButton
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            sectionName="Productivity Metrics"
            size="medium"
          />
        )}
      </div>

      {/* Content */}
      <div className="profile-content">
        {/* Productivity Overview */}
        {productivityMetrics.employeeProductivity && (
          <div className="section productivity-overview-section">
            <h3>
              <BarChart3 size={20} />
              Employee Productivity Overview
            </h3>
            <ProductivityChart employeeProductivity={productivityMetrics.employeeProductivity} />
          </div>
        )}

        {/* Cost Structure & Value Drivers Row */}
        <div className="section-row">
          {/* Cost Structure */}
          {productivityMetrics.costStructure && (
            <div className="section cost-structure-section">
              <h3>
                <DollarSign size={20} />
                Cost Structure
              </h3>
              <div className="cost-structure-grid">
                {Object.entries(productivityMetrics.costStructure).map(([key, value]) => (
                  <div key={key} className="cost-item">
                    <span className="label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="value">
                      {key.toLowerCase().includes('costs') && typeof value === 'number' ? 
                        `${value}%` : 
                        value
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Value Drivers */}
          {productivityMetrics.valueDrivers && productivityMetrics.valueDrivers.length > 0 && (
            <div className="section value-drivers-section">
              <h3>
                <Target size={20} />
                Top Value Drivers
              </h3>
              <ValueDrivers drivers={productivityMetrics.valueDrivers} />
            </div>
          )}
        </div>

        {/* Improvement Opportunities */}
        {productivityMetrics.improvementOpportunities && productivityMetrics.improvementOpportunities.length > 0 && (
          <div className="section opportunities-section">
            <h3>
              <TrendingUp size={20} />
              Improvement Opportunities
            </h3>
            <div className="opportunities-list">
              {productivityMetrics.improvementOpportunities.map((opportunity, index) => (
                <div key={index} className="opportunity-item">
                  <div className="opportunity-bullet"></div>
                  <span className="opportunity-text">{opportunity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductivityMetrics;