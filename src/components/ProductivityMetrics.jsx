import React, { useState, useEffect } from 'react';
import { Loader, RefreshCw, Activity, BarChart3, DollarSign, Target, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import MissingQuestionsChecker from './MissingQuestionsChecker';
import AnalysisEmptyState from './AnalysisEmptyState';
import "../styles/EssentialPhase.css"; 

const ProductivityMetrics = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  productivityData = null,
  selectedBusinessId,
  onRedirectToBrief // Add this prop
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  // Function to check missing questions and redirect
  const checkMissingQuestionsAndRedirect = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(
        `${API_BASE_URL}/api/questions/missing-for-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            analysis_type: 'productivityMetrics',
            business_id: selectedBusinessId
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        // If there are missing questions, redirect with highlighting
        if (result.missing_count > 0) {
          handleRedirectToBrief(result);
        } else {
          // No missing questions but data is incomplete - user needs to improve their answers
          // Create a custom result to highlight the productivityMetrics question(s)
          const productivityMetricsQuestions = await fetch(
            `${API_BASE_URL}/api/questions`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          ).then(res => res.json()).then(data => 
            data.questions.filter(q => q.used_for && q.used_for.includes('productivityMetrics'))
          );

          handleRedirectToBrief({
            missing_count: productivityMetricsQuestions.length,
            missing_questions: productivityMetricsQuestions.map(q => ({
              _id: q._id,
              order: q.order,
              question_text: q.question_text,
              objective: q.objective,
              required_info: q.required_info,
              used_for: q.used_for
            })),
            analysis_type: 'productivityMetrics',
            message: `Please provide more detailed answers for productivity metrics analysis. The current answers are insufficient to generate meaningful productivity insights.`,
            is_complete: false,
            keepHighlightLonger: true // Flag to keep highlighting longer
          });
        }
      } else {
        // If API call fails, redirect to review answers
        handleRedirectToBrief({
          missing_count: 0,
          missing_questions: [],
          analysis_type: 'productivityMetrics',
          message: 'Please review and improve your answers for productivity metrics analysis.'
        });
      }
    } catch (error) {
      console.error('Error checking missing questions:', error);
      // If error occurs, redirect to review answers
      handleRedirectToBrief({
        missing_count: 0,
        missing_questions: [],
        analysis_type: 'productivityMetrics',
        message: 'Please review and improve your answers for productivity metrics analysis.'
      });
    }
  };

  // Check if the productivity data is empty/incomplete
  const isProductivityDataIncomplete = (data) => {
    if (!data) return true;
    
    // Handle both wrapped and direct response structures
    const productivityMetrics = data?.productivityMetrics || data;
    
    // Check if essential productivity data exists
    if (!productivityMetrics) return true;
    
    // Check employee productivity - if all values are 0 or null, it's incomplete
    const employeeProductivity = productivityMetrics.employeeProductivity;
    const hasValidEmployeeData = employeeProductivity && (
      (employeeProductivity.totalEmployees > 0) ||
      (employeeProductivity.averageValuePerEmployee > 0) ||
      (employeeProductivity.totalValueGenerated > 0) ||
      (employeeProductivity.productivityIndex > 0)
    );
    
    // Check cost structure - if all values are 0 or empty, it's incomplete
    const costStructure = productivityMetrics.costStructure;
    const hasValidCostData = costStructure && (
      (costStructure.employeeCosts > 0) ||
      (costStructure.otherCosts > 0) ||
      (costStructure.costEfficiency && costStructure.costEfficiency !== 'unknown' && costStructure.costEfficiency !== '')
    );
    
    // Check if arrays have meaningful data
    const hasValueDrivers = productivityMetrics.valueDrivers && productivityMetrics.valueDrivers.length > 0;
    const hasImprovementOpportunities = productivityMetrics.improvementOpportunities && productivityMetrics.improvementOpportunities.length > 0;
    
    // Consider data complete only if we have at least one meaningful data source
    const hasEssentialData = hasValidEmployeeData || hasValidCostData || hasValueDrivers || hasImprovementOpportunities;
    
    return !hasEssentialData;
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

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

      const processedData = result.productivityMetrics ? result : { productivityMetrics: result }; 

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
 
    if (!productivityData && hasAnswers && !isGenerating && !isRegenerating) { 
      generateProductivityMetrics();
    }
  }, [questions, userAnswers, productivityData]);

  const handleRegenerate = async () => { 

    if (onRegenerate) { 
      onRegenerate();
    } else { 
      await generateProductivityMetrics();
    }
  };

  // Productivity Chart Component (keeping original chart)
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

  // Get efficiency color helper
  const getEfficiencyColor = (efficiency) => {
    const level = efficiency?.toLowerCase() || '';
    if (level.includes('high')) return 'high-intensity';
    if (level.includes('medium') || level.includes('moderate')) return 'medium-intensity';
    if (level.includes('low')) return 'low-intensity';
    return 'medium-intensity';
  };

  // Loading state
  if (isGenerating || isRegenerating) {
    return (
      <div className="porters-container productivity-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? "Regenerating productivity metrics analysis..."
              : "Generating productivity metrics analysis..."
            }
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !productivityData) {
    return (
      <div className="porters-container productivity-container">
        <div className="cs-header">
          <div className="cs-title-section">
            <Activity size={24} />
            <h2 className='cs-title'>Productivity and Efficiency Metrics</h2>
          </div>
          <RegenerateButton
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
            sectionName="Productivity Metrics"
            size="medium"
          />
        </div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={() => {
            setError(null);
            if (onRegenerate) {
              onRegenerate();
            }
          }} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  // Check if data is incomplete and show missing questions checker
  if (!productivityData || isProductivityDataIncomplete(productivityData)) {
    return (
      <div className="porters-container productivity-container">
        <div className="cs-header">
          <div className="cs-title-section">
            <Activity className="cs-icon" size={24} />
            <h2 className='cs-title'>Productivity and Efficiency Metrics</h2>
          </div> 
        </div>

        {/* Replace the entire empty-state div with the common component */}
        <AnalysisEmptyState
          analysisType="productivityMetrics"
          analysisDisplayName="Productivity and Efficiency Metrics Analysis"
          icon={Activity}
          onImproveAnswers={checkMissingQuestionsAndRedirect}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
        />
        
        <MissingQuestionsChecker
          analysisType="productivityMetrics"
          analysisData={productivityData}
          selectedBusinessId={selectedBusinessId}
          onRedirectToBrief={handleRedirectToBrief}
          API_BASE_URL={API_BASE_URL}
          getAuthToken={getAuthToken}
        />
      </div>
    );
  }

  // Handle both wrapped and direct response structures
  const productivityMetrics = productivityData?.productivityMetrics || productivityData;

  return (
    <div className="porters-container productivity-container">
      {/* Header */}
      <div className="cs-header">
        <div className="cs-title-section">
          <Activity className="main-icon" size={24} />
          <div>
            <h2 className='cs-title'>Productivity and Efficiency Metrics</h2> 
          </div>
        </div>
        <RegenerateButton
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="Productivity Metrics"
          size="medium"
        />
      </div>

      {/* Employee Productivity Overview Chart */}
      {productivityMetrics.employeeProductivity && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('overview')}>
            <h3>Employee Productivity Overview</h3>
            {expandedSections.overview ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.overview !== false && (
            <div className="table-container">
              <ProductivityChart employeeProductivity={productivityMetrics.employeeProductivity} />
            </div>
          )}
        </div>
      )}

      {/* Cost Structure Table */}
      {productivityMetrics.costStructure && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('costStructure')}>
            <h3>Cost Structure Analysis</h3>
            {expandedSections.costStructure ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.costStructure !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cost Category</th>
                    <th>Value</th>
                    <th>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(productivityMetrics.costStructure).map(([key, value]) => (
                    <tr key={key}>
                      <td><strong>{key.replace(/([A-Z])/g, ' $1').trim()}</strong></td>
                      <td>
                        {key.toLowerCase().includes('costs') && typeof value === 'number' ? 
                          `${value}%` : 
                          value
                        }
                      </td>
                      <td>
                        {typeof value === 'number' && key.toLowerCase().includes('costs') ? 
                          value : 
                          'N/A'
                        }
                      </td>
                      <td>
                        {typeof value === 'number' && key.toLowerCase().includes('costs') ? (
                          <span className={`status-badge ${value > 70 ? 'high-intensity' : value > 40 ? 'medium-intensity' : 'low-intensity'}`}>
                            {value > 70 ? 'High' : value > 40 ? 'Medium' : 'Low'}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Value Drivers Table */}
      {productivityMetrics.valueDrivers && productivityMetrics.valueDrivers.length > 0 && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('valueDrivers')}>
            <h3>Top Value Drivers</h3>
            {expandedSections.valueDrivers ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.valueDrivers !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Efficiency Level</th>
                    <th>Contribution</th>
                    <th>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {productivityMetrics.valueDrivers.map((driver, index) => (
                    <tr key={index}>
                      <td>
                        <div className="force-name">
                          <Target size={16} />
                          <span><strong>{driver.driver}</strong></span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getEfficiencyColor(driver.efficiency)}`}>
                          {driver.efficiency}
                        </span>
                      </td>
                      <td>{driver.contribution?.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}</td>
                      <td>
                        <span className={`score-badge ${driver.efficiency?.toLowerCase() === 'high' ? 'high' : driver.efficiency?.toLowerCase() === 'medium' ? 'medium' : 'low'}`}>
                          {driver.efficiency?.toLowerCase() === 'high' ? 'High Impact' : 
                           driver.efficiency?.toLowerCase() === 'medium' ? 'Medium Impact' : 'Low Impact'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Improvement Opportunities Table */}
      {productivityMetrics.improvementOpportunities && productivityMetrics.improvementOpportunities.length > 0 && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('opportunities')}>
            <h3>Improvement Opportunities</h3>
            {expandedSections.opportunities ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.opportunities !== false && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Priority</th>
                    <th>Expected Impact</th>
                    <th>Implementation Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {productivityMetrics.improvementOpportunities.map((opportunity, index) => (
                    <tr key={index}>
                      <td>
                        <div className="force-name">
                          <TrendingUp size={16} />
                          <span>{opportunity}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${index < 2 ? 'high-intensity' : index < 4 ? 'medium-intensity' : 'low-intensity'}`}>
                          {index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low'}
                        </span>
                      </td>
                      <td>
                        <span className="implications-cell">
                          {index < 2 ? 'High potential for productivity gains' : 
                           index < 4 ? 'Moderate productivity improvement' : 'Incremental efficiency gains'}
                        </span>
                      </td>
                      <td>
                        <span className={`score-badge ${index < 2 ? 'medium' : index < 4 ? 'low' : 'high'}`}>
                          {index < 2 ? 'Medium' : index < 4 ? 'Easy' : 'Complex'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bar Chart: Value Per Employee by Function */}
      {productivityMetrics.employeeProductivity && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('valuePerEmployee')}>
            <h3>Bar Chart: Value per Employee by Function</h3>
            {expandedSections.valuePerEmployee ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.valuePerEmployee !== false && (
            <div className="table-container">
              {/* Bar Chart Visualization */}
              <div className="bar-chart-container" style={{ marginBottom: '20px' }}>
                {[
                  { 
                    name: 'Sales & Marketing', 
                    value: Math.round(productivityMetrics.employeeProductivity.averageValuePerEmployee * 1.6),
                    employees: Math.round(productivityMetrics.employeeProductivity.totalEmployees * 0.25),
                    color: '#10b981'
                  },
                  { 
                    name: 'Product Development', 
                    value: Math.round(productivityMetrics.employeeProductivity.averageValuePerEmployee * 1.4),
                    employees: Math.round(productivityMetrics.employeeProductivity.totalEmployees * 0.20),
                    color: '#3b82f6'
                  },
                  { 
                    name: 'Operations', 
                    value: Math.round(productivityMetrics.employeeProductivity.averageValuePerEmployee * 0.85),
                    employees: Math.round(productivityMetrics.employeeProductivity.totalEmployees * 0.35),
                    color: '#f59e0b'
                  },
                  { 
                    name: 'Support Functions', 
                    value: Math.round(productivityMetrics.employeeProductivity.averageValuePerEmployee * 0.75),
                    employees: Math.round(productivityMetrics.employeeProductivity.totalEmployees * 0.20),
                    color: '#ef4444'
                  }
                ].map((func, index) => {
                  const maxValue = Math.round(productivityMetrics.employeeProductivity.averageValuePerEmployee * 1.6);
                  const barWidth = (func.value / maxValue) * 100;
                  
                  return (
                    <div key={index} className="bar-item" style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: '600' }}>{func.name}</span>
                        <span style={{ fontWeight: '600' }}>${func.value.toLocaleString()}</span>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '25px', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '4px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${barWidth}%`,
                          height: '100%',
                          backgroundColor: func.color,
                          transition: 'width 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '8px'
                        }}>
                          <span style={{ 
                            color: 'white', 
                            fontSize: '12px', 
                            fontWeight: '500'
                          }}>
                            {func.employees} employees
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Data Table */}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Function</th>
                    <th>Employees</th>
                    <th>Value Generated</th>
                    <th>Value per Employee</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="force-name">
                        <BarChart3 size={16} />
                        <span><strong>Sales & Marketing</strong></span>
                      </div>
                    </td>
                    <td>{Math.round(productivityMetrics.employeeProductivity.totalEmployees * 0.25)}</td>
                    <td>${Math.round(productivityMetrics.employeeProductivity.totalValueGenerated * 0.4).toLocaleString()}</td>
                    <td>${Math.round(productivityMetrics.employeeProductivity.averageValuePerEmployee * 1.6).toLocaleString()}</td>
                    <td>
                      <span className="status-badge high-intensity">Above Average</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="force-name">
                        <BarChart3 size={16} />
                        <span><strong>Product Development</strong></span>
                      </div>
                    </td>
                    <td>{Math.round(productivityMetrics.employeeProductivity.totalEmployees * 0.20)}</td>
                    <td>${Math.round(productivityMetrics.employeeProductivity.totalValueGenerated * 0.28).toLocaleString()}</td>
                    <td>${Math.round(productivityMetrics.employeeProductivity.averageValuePerEmployee * 1.4).toLocaleString()}</td>
                    <td>
                      <span className="status-badge high-intensity">Above Average</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="force-name">
                        <BarChart3 size={16} />
                        <span><strong>Operations</strong></span>
                      </div>
                    </td>
                    <td>{Math.round(productivityMetrics.employeeProductivity.totalEmployees * 0.35)}</td>
                    <td>${Math.round(productivityMetrics.employeeProductivity.totalValueGenerated * 0.3).toLocaleString()}</td>
                    <td>${Math.round(productivityMetrics.employeeProductivity.averageValuePerEmployee * 0.85).toLocaleString()}</td>
                    <td>
                      <span className="status-badge medium-intensity">Average</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="force-name">
                        <BarChart3 size={16} />
                        <span><strong>Support Functions</strong></span>
                      </div>
                    </td>
                    <td>{Math.round(productivityMetrics.employeeProductivity.totalEmployees * 0.20)}</td>
                    <td>${Math.round(productivityMetrics.employeeProductivity.totalValueGenerated * 0.15).toLocaleString()}</td>
                    <td>${Math.round(productivityMetrics.employeeProductivity.averageValuePerEmployee * 0.75).toLocaleString()}</td>
                    <td>
                      <span className="status-badge low-intensity">Below Average</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Efficiency Matrix: Cost vs Value Generation */}
      {productivityMetrics.employeeProductivity && productivityMetrics.costStructure && (
        <div className="section-container">
          <div className="section-header" onClick={() => toggleSection('efficiencyMatrix')}>
            <h3>Efficiency Matrix: Cost vs Value Generation</h3>
            {expandedSections.efficiencyMatrix ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          
          {expandedSections.efficiencyMatrix !== false && (
            <div className="table-container">
              {/* Matrix Visualization */}
              <div className="efficiency-matrix" style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '120px 1fr 1fr 1fr',
                  gap: '2px',
                  marginBottom: '20px'
                }}>
                  {/* Header */}
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    fontWeight: '600',
                    border: '1px solid #e5e7eb'
                  }}></div>
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    fontWeight: '600',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                  }}>Low Cost</div>
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    fontWeight: '600',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                  }}>Medium Cost</div>
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    fontWeight: '600',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                  }}>High Cost</div>
                  
                  {/* High Value Row */}
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    fontWeight: '600',
                    border: '1px solid #e5e7eb'
                  }}>High Value</div>
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#dcfce7', 
                    textAlign: 'center',
                    border: '1px solid #16a34a',
                    borderWidth: '2px'
                  }}>
                    <div style={{ fontWeight: '600', color: '#16a34a' }}>OPTIMAL</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Sales & Marketing</div>
                  </div>
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#fef3c7', 
                    textAlign: 'center',
                    border: '1px solid #d97706'
                  }}>
                    <div style={{ fontWeight: '600', color: '#d97706' }}>GOOD</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Product Dev</div>
                  </div>
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#fee2e2', 
                    textAlign: 'center',
                    border: '1px solid #dc2626'
                  }}>
                    <div style={{ fontWeight: '600', color: '#dc2626' }}>REVIEW</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>-</div>
                  </div>
                  
                  {/* Medium Value Row */}
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    fontWeight: '600',
                    border: '1px solid #e5e7eb'
                  }}>Medium Value</div>
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#fef3c7', 
                    textAlign: 'center',
                    border: '1px solid #d97706'
                  }}>
                    <div style={{ fontWeight: '600', color: '#d97706' }}>GOOD</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Operations</div>
                  </div>
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#fef3c7', 
                    textAlign: 'center',
                    border: '1px solid #d97706'
                  }}>
                    <div style={{ fontWeight: '600', color: '#d97706' }}>ACCEPTABLE</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>-</div>
                  </div>
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#fee2e2', 
                    textAlign: 'center',
                    border: '1px solid #dc2626'
                  }}>
                    <div style={{ fontWeight: '600', color: '#dc2626' }}>POOR</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>-</div>
                  </div>
                  
                  {/* Low Value Row */}
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    fontWeight: '600',
                    border: '1px solid #e5e7eb'
                  }}>Low Value</div>
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#fef3c7', 
                    textAlign: 'center',
                    border: '1px solid #d97706'
                  }}>
                    <div style={{ fontWeight: '600', color: '#d97706' }}>ACCEPTABLE</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Support</div>
                  </div>
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#fee2e2', 
                    textAlign: 'center',
                    border: '1px solid #dc2626'
                  }}>
                    <div style={{ fontWeight: '600', color: '#dc2626' }}>POOR</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>-</div>
                  </div>
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: '#fee2e2', 
                    textAlign: 'center',
                    border: '1px solid #dc2626'
                  }}>
                    <div style={{ fontWeight: '600', color: '#dc2626' }}>CRITICAL</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>-</div>
                  </div>
                </div>
              </div>

              {/* Efficiency Analysis Table */}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Function</th>
                    <th>Cost Level</th>
                    <th>Value Generation</th>
                    <th>Efficiency Rating</th>
                    <th>Strategic Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="force-name">
                        <Target size={16} />
                        <span><strong>Sales & Marketing</strong></span>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge low-intensity">Low</span>
                    </td>
                    <td>
                      <span className="status-badge high-intensity">High</span>
                    </td>
                    <td>
                      <span className="score-badge high">Optimal</span>
                    </td>
                    <td>Maintain and scale</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="force-name">
                        <Target size={16} />
                        <span><strong>Product Development</strong></span>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge medium-intensity">Medium</span>
                    </td>
                    <td>
                      <span className="status-badge high-intensity">High</span>
                    </td>
                    <td>
                      <span className="score-badge medium">Good</span>
                    </td>
                    <td>Optimize processes</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="force-name">
                        <Target size={16} />
                        <span><strong>Operations</strong></span>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge low-intensity">Low</span>
                    </td>
                    <td>
                      <span className="status-badge medium-intensity">Medium</span>
                    </td>
                    <td>
                      <span className="score-badge medium">Good</span>
                    </td>
                    <td>Increase value output</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="force-name">
                        <Target size={16} />
                        <span><strong>Support Functions</strong></span>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge low-intensity">Low</span>
                    </td>
                    <td>
                      <span className="status-badge low-intensity">Low</span>
                    </td>
                    <td>
                      <span className="score-badge low">Acceptable</span>
                    </td>
                    <td>Automate & streamline</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductivityMetrics;