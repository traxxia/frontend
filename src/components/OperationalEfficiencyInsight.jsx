import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { Zap, TrendingUp, Users, Target, Loader, Upload, X, Activity } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const OperationalEfficiencyInsight = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  operationalEfficiencyData = null,
  selectedBusinessId,
  onRedirectToBrief
}) => {
  const [analysisData, setAnalysisData] = useState(operationalEfficiencyData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Add refs to track component mount
  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  // Function to check missing questions and redirect
  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.operationalEfficiency || {
      displayName: 'Operational Efficiency Insight',
      customMessage: 'Answer more operational questions to unlock detailed efficiency and resource utilization analysis'
    };

    await checkMissingQuestionsAndRedirect(
      'operationalEfficiency',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  // Check if the operational efficiency data is empty/incomplete
  const isOperationalEfficiencyDataIncomplete = (data) => {
    if (!data) return true;

    // Check if essential data is empty or null
    if (!data.operationalEfficiencyInsight) return true;
    if (!data.operationalEfficiencyInsight.resourceUtilization) return true;
    if (!data.operationalEfficiencyInsight.efficiencyTrends) return true;
    if (!data.operationalEfficiencyInsight.capabilityPerformance) return true;

    return false;
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setAnalysisData(null);
      setError(null);
    }
  };

  // Update analysis data when prop changes
  useEffect(() => {
    if (operationalEfficiencyData && operationalEfficiencyData !== analysisData) {
      setAnalysisData(operationalEfficiencyData);
      if (onDataGenerated) {
        onDataGenerated(operationalEfficiencyData);
      }
    }
  }, [operationalEfficiencyData]);

  // Initialize component - only run once
  useEffect(() => {
    if (hasInitialized.current) return;

    isMounted.current = true;
    hasInitialized.current = true;

    if (operationalEfficiencyData) {
      setAnalysisData(operationalEfficiencyData);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (analysisData && onDataGenerated) {
      onDataGenerated(analysisData);
    }
  }, [analysisData]);

  // File upload handlers
  const handleFileUpload = (file) => {
    if (file) {
      // Validate file type (PDF, images, Excel, etc.)
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (allowedTypes.includes(file.type)) {
        setUploadedFile(file);
        setError(null);
      } else {
        setError('Please upload a PDF, image, Excel, or CSV file.');
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateOperationalEfficiencyAnalysis = async (withFile = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare questions and answers
      const questionsArray = [];
      const answersArray = [];

      questions
        .filter(q => userAnswers[q._id] && userAnswers[q._id].trim())
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(question => {
          questionsArray.push(question.question_text);
          answersArray.push(userAnswers[question._id]);
        });

      if (questionsArray.length === 0) {
        throw new Error('Please answer some questions first to generate operational efficiency analysis.');
      }

      // Create FormData
      const formData = new FormData();

      // Add file if provided and withFile is true
      if (withFile && uploadedFile) {
        formData.append('file', uploadedFile);
      } else {
        // Create a dummy text file with business information
        const businessInfo = `Business Information:\n${questionsArray.map((q, i) => `${q}: ${answersArray[i]}`).join('\n')}`;
        const dummyFile = new Blob([businessInfo], { type: 'text/plain' });
        formData.append('file', dummyFile, 'business_data.txt');
      }

      formData.append('questions', questionsArray.join(','));
      formData.append('answers', answersArray.join('\n'));

      const response = await fetch(`${ML_API_BASE_URL}/operational-efficiency`, {
        method: 'POST',
        headers: {
          'accept': 'application/json'
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // Process the result
      let operationalEfficiencyContent = null;
      if (result.operationalEfficiencyInsight) {
        operationalEfficiencyContent = result;
      } else if (result.operational_efficiency_insight) {
        operationalEfficiencyContent = { operationalEfficiencyInsight: result.operational_efficiency_insight };
      } else {
        operationalEfficiencyContent = { operationalEfficiencyInsight: result };
      }

      setAnalysisData(operationalEfficiencyContent);

      // Save to backend
      await saveAnalysisToBackend(operationalEfficiencyContent);

      if (onDataGenerated) {
        onDataGenerated(operationalEfficiencyContent);
      }

    } catch (error) {
      console.error('Error generating operational efficiency analysis:', error);
      setError(`Failed to generate analysis: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save analysis to backend using the API endpoint
  const saveAnalysisToBackend = async (analysisData) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/conversations/phase-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phase: 'good',
          analysis_type: 'operationalEfficiency',
          analysis_name: 'Operational Efficiency Insight',
          analysis_data: analysisData,
          business_id: selectedBusinessId,
          metadata: {
            generated_at: new Date().toISOString(),
            business_name: businessName,
            has_uploaded_file: !!uploadedFile
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save Operational Efficiency analysis');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving Operational Efficiency analysis to backend:', error);
      throw error;
    }
  };

  // Prepare efficiency trends data
  const prepareEfficiencyTrendsData = (data) => {
    if (!data?.operationalEfficiencyInsight?.efficiencyTrends) return [];

    const trends = data.operationalEfficiencyInsight.efficiencyTrends;
    return [
      {
        metric: 'Cost Reduction',
        value: trends.costReductionRate,
        target: 25,
        unit: '%'
      },
      {
        metric: 'Productivity Gain',
        value: trends.productivityGain,
        target: 20,
        unit: '%'
      },
      {
        metric: 'Automation Impact',
        value: trends.automationImpact,
        target: 10,
        unit: '%'
      }
    ];
  };

  // Prepare capability performance radar data
  const prepareCapabilityRadarData = (data) => {
    if (!data?.operationalEfficiencyInsight?.capabilityPerformance) return [];

    const capabilities = data.operationalEfficiencyInsight.capabilityPerformance;
    const performanceMap = { low: 1, medium: 2, high: 3 };

    return Object.entries(capabilities).map(([key, value]) => ({
      capability: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      score: performanceMap[value.toLowerCase()] || 1,
      fullMark: 3
    }));
  };

  // Custom tooltip for efficiency trends
  const EfficiencyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="ch-tooltip">
          <div className="ch-tooltip-header">{data.metric}</div>
          <div className="ch-tooltip-content">
            <div>{`Current: ${data.value}${data.unit}`}</div>
            <div>{`Target: ${data.target}${data.unit}`}</div>
            <div className={data.value >= data.target ? 'text-green-600' : 'text-yellow-600'}>
              {data.value >= data.target ? '✓ Above Target' : '⚠ Below Target'}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading || isRegenerating) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? t("Regenerating operational efficiency analysis...")
              : t("Generating operational efficiency analysis...")
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
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

  // Check if data is incomplete and show missing questions checker or file upload
  if (!analysisData || isOperationalEfficiencyDataIncomplete(analysisData)) {
    return (
      <div className="channel-heatmap channel-heatmap-container">
        <AnalysisEmptyState
          analysisType="operationalEfficiency"
          analysisDisplayName="Operational Efficiency Insight"
          icon={Zap}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          
          // File upload props
          showFileUpload={true}
          onFileUpload={handleFileUpload}
          onGenerateWithFile={() => generateOperationalEfficiencyAnalysis(true)}
          onGenerateWithoutFile={() => generateOperationalEfficiencyAnalysis(false)}
          uploadedFile={uploadedFile}
          onRemoveFile={removeFile}
          isUploading={isLoading}
          fileUploadMessage="Upload operational documents (PDF, Excel, CSV, or images)"
          acceptedFileTypes=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
        />
      </div>
    );
  }

  const { resourceUtilization, efficiencyTrends, capabilityPerformance } = analysisData.operationalEfficiencyInsight;
  const efficiencyTrendsData = prepareEfficiencyTrendsData(analysisData);
  const capabilityRadarData = prepareCapabilityRadarData(analysisData);

  const employeeROI = resourceUtilization.employeeROI.roi;
  const costPerRevenueDollar = resourceUtilization.costPerRevenueDollar;
  const totalValueGenerated = resourceUtilization.employeeROI.totalValueGenerated;
  const totalEmployeeCost = resourceUtilization.employeeROI.totalEmployeeCost;

  return (
    <div className="channel-heatmap channel-heatmap-container" data-analysis-type="operational-efficiency"
      data-analysis-name="Operational Efficiency Insight"
      data-analysis-order="4">

      {/* Key Metrics */}
      <div className="ch-metrics">
        <div className="ch-metric-card ch-metric-blue">
          <div className="ch-metric-header">
            <Users size={20} />
            <span>Employee ROI</span>
          </div>
          <p className="ch-metric-value">{employeeROI}%</p>
        </div>

        <div className="ch-metric-card ch-metric-green">
          <div className="ch-metric-header">
            <Target size={20} />
            <span>Cost per Revenue $</span>
          </div>
          <p className="ch-metric-value">${costPerRevenueDollar}</p>
        </div>

        <div className="ch-metric-card ch-metric-purple">
          <div className="ch-metric-header">
            <TrendingUp size={20} />
            <span>Productivity Gain</span>
          </div>
          <p className="ch-metric-value">{efficiencyTrends.productivityGain}%</p>
        </div>

        <div className="ch-metric-card ch-metric-orange">
          <div className="ch-metric-header">
            <Zap size={20} />
            <span>Automation Impact</span>
          </div>
          <p className="ch-metric-value">{efficiencyTrends.automationImpact}%</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="ch-heatmap-container">
        <div className="ch-heatmap-scroll">
          <div className="ch-heatmap-header-section">
            <h3 className="ch-section-title">Operational Efficiency Analysis</h3>
          </div>

          <div className="ch-charts-grid">
            {/* Efficiency Trends Chart */}
            <div className="ch-chart-section">
              <h4>Efficiency Trends vs Targets</h4>
              <div className="ch-chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={efficiencyTrendsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip content={<EfficiencyTooltip />} />
                    <Bar dataKey="value">
                      {efficiencyTrendsData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.value >= entry.target ? '#10b981' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Capability Performance Radar */}
            <div className="ch-chart-section">
              <h4>Capability Performance Radar</h4>
              <div className="ch-chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={capabilityRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="capability" />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 3]} 
                      tick={false}
                    />
                    <Radar
                      name="Performance"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Utilization Details */}
      <div className="ch-breakdown-section">
        <h3 className="ch-section-title">Resource Utilization Analysis</h3>
        <div className="ch-breakdown-grid">
          <div className="ch-breakdown-card">
            <h4>Employee Economics</h4>
            <div className="ch-cost-item">
              <span>Total Employee Cost:</span>
              <span>${totalEmployeeCost.toLocaleString()}</span>
            </div>
            <div className="ch-cost-item">
              <span>Value Generated:</span>
              <span>${totalValueGenerated.toLocaleString()}</span>
            </div>
            <div className="ch-cost-item">
              <span>ROI:</span>
              <span className={employeeROI > 50 ? 'text-green-600' : 'text-yellow-600'}>
                {employeeROI}%
              </span>
            </div>
          </div>

          <div className="ch-breakdown-card">
            <h4>Efficiency Metrics</h4>
            <div className="ch-cost-item">
              <span>Cost Reduction Rate:</span>
              <span>{efficiencyTrends.costReductionRate}%</span>
            </div>
            <div className="ch-cost-item">
              <span>Productivity Gain:</span>
              <span>{efficiencyTrends.productivityGain}%</span>
            </div>
            <div className="ch-cost-item">
              <span>Automation Impact:</span>
              <span>{efficiencyTrends.automationImpact}%</span>
            </div>
          </div>

          <div className="ch-breakdown-card">
            <h4>Performance Summary</h4>
            <div className="ch-cost-components">
              <strong>Top Performers:</strong>
              <ul>
                {Object.entries(capabilityPerformance)
                  .filter(([key, value]) => value === 'high')
                  .map(([key, value], index) => (
                    <li key={index} className="text-green-600">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: {value}
                    </li>
                  ))}
              </ul>
              <strong>Need Improvement:</strong>
              <ul>
                {Object.entries(capabilityPerformance)
                  .filter(([key, value]) => value === 'low')
                  .map(([key, value], index) => (
                    <li key={index} className="text-red-600">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: {value}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalEfficiencyInsight;