import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, DollarSign, TrendingDown, Target, Loader, Upload, X } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import AnalysisEmptyState from './AnalysisEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const FinancialPerformance = ({
    questions = [],
    userAnswers = {},
    businessName = "Your Business",
    onDataGenerated,
    onRegenerate,
    isRegenerating = false,
    canRegenerate = true,
    financialPerformanceData = null,
    selectedBusinessId,
    onRedirectToBrief
}) => {
    const [analysisData, setAnalysisData] = useState(financialPerformanceData);
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
        const analysisConfig = ANALYSIS_TYPES.financialPerformance || {
            displayName: 'Financial Performance & Growth Trajectory',
            customMessage: 'Answer more questions to unlock detailed financial performance analysis'
        };

        await checkMissingQuestionsAndRedirect(
            'financialPerformance',
            selectedBusinessId,
            handleRedirectToBrief,
            {
                displayName: analysisConfig.displayName,
                customMessage: analysisConfig.customMessage
            }
        );
    };

    const isFinancialPerformanceDataIncomplete = (data) => {
        if (!data) return true;
        if (!data.financialPerformance) return true;

        const fp = data.financialPerformance;

        // Check currentYear
        if (!fp.currentYear ||
            !fp.currentYear.revenue ||
            fp.currentYear.revenue === "" ||
            !fp.currentYear.costs ||
            fp.currentYear.costs === "" ||
            !fp.currentYear.netIncome ||
            fp.currentYear.netIncome === "") {
            return true;
        }

        // Check previousYear
        if (!fp.previousYear ||
            !fp.previousYear.revenue ||
            fp.previousYear.revenue === "" ||
            !fp.previousYear.costs ||
            fp.previousYear.costs === "") {
            return true;
        }

        // Check growthRates
        if (!fp.growthRates ||
            fp.growthRates.revenueGrowth === "" ||
            fp.growthRates.profitGrowth === "") {
            return true;
        }

        // Check quarterlyTrend
        if (!fp.quarterlyTrend ||
            !Array.isArray(fp.quarterlyTrend) ||
            fp.quarterlyTrend.length === 0 ||
            fp.quarterlyTrend.some(quarter =>
                !quarter ||
                !quarter.quarter ||
                quarter.quarter === "" ||
                !quarter.revenue ||
                quarter.revenue === "")) {
            return true;
        }

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

    // Handle retry for error state
    const handleRetry = () => {
        setError(null);
        if (onRegenerate) {
            onRegenerate();
        }
    };

    // Update analysis data when prop changes
    useEffect(() => {
        if (financialPerformanceData && financialPerformanceData !== analysisData) {
            setAnalysisData(financialPerformanceData);
            if (onDataGenerated) {
                onDataGenerated(financialPerformanceData);
            }
        }
    }, [financialPerformanceData]);

    // Initialize component - only run once
    useEffect(() => {
        if (hasInitialized.current) return;

        isMounted.current = true;
        hasInitialized.current = true;

        if (financialPerformanceData) {
            setAnalysisData(financialPerformanceData);
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

    const generateFinancialPerformanceAnalysis = async (withFile = false) => {
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
                throw new Error('Please answer some questions first to generate financial performance analysis.');
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

            const response = await fetch(`${ML_API_BASE_URL}/financial-performance`, {
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
            let financialContent = null;
            if (result.financialPerformance) {
                financialContent = result;
            } else if (result.financial_performance) {
                financialContent = { financialPerformance: result.financial_performance };
            } else {
                financialContent = { financialPerformance: result };
            }

            setAnalysisData(financialContent);

            // Save to backend
            await saveAnalysisToBackend(financialContent);

            if (onDataGenerated) {
                onDataGenerated(financialContent);
            }

        } catch (error) {
            console.error('Error generating financial performance analysis:', error);
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
                    analysis_type: 'financialPerformance',
                    analysis_name: 'Financial Performance & Growth Trajectory',
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
                throw new Error(errorData.error || 'Failed to save Financial Performance analysis');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error saving Financial Performance analysis to backend:', error);
            throw error;
        }
    };

    // Prepare quarterly trend data for line chart
    const prepareQuarterlyData = (data) => {
        if (!data?.financialPerformance?.quarterlyTrend) return [];
        return data.financialPerformance.quarterlyTrend;
    };

    // Prepare year-over-year comparison data
    const prepareYearComparisonData = (data) => {
        if (!data?.financialPerformance) return [];

        const { currentYear, previousYear } = data.financialPerformance;

        return [
            {
                metric: 'Revenue',
                currentYear: currentYear.revenue,
                previousYear: previousYear.revenue,
                growth: data.financialPerformance.growthRates.revenueGrowth
            },
            {
                metric: 'EBITDA',
                currentYear: currentYear.ebitda,
                previousYear: previousYear.ebitda,
                growth: ((currentYear.ebitda - previousYear.ebitda) / previousYear.ebitda * 100).toFixed(1)
            },
            {
                metric: 'Net Income',
                currentYear: currentYear.netIncome,
                previousYear: previousYear.netIncome,
                growth: data.financialPerformance.growthRates.profitGrowth
            }
        ];
    };

    // Custom tooltip for quarterly trend chart
    const QuarterlyTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const value = payload[0].value;
            return (
                <div className="ch-tooltip">
                    <div className="ch-tooltip-header">{label}</div>
                    <div className="ch-tooltip-content">
                        <div>Revenue: ${value.toLocaleString()}</div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Custom tooltip for comparison chart
    const ComparisonTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const current = payload.find(p => p.dataKey === 'currentYear')?.value;
            const previous = payload.find(p => p.dataKey === 'previousYear')?.value;
            const growth = payload[0].payload.growth;

            return (
                <div className="ch-tooltip">
                    <div className="ch-tooltip-header">{label}</div>
                    <div className="ch-tooltip-content">
                        <div>Current Year: ${current?.toLocaleString()}</div>
                        <div>Previous Year: ${previous?.toLocaleString()}</div>
                        <div>Growth: {growth}%</div>
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
                            ? t("Regenerating financial performance analysis...")
                            : t("Generating financial performance analysis...")
                        }
                    </span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="channel-heatmap channel-heatmap-container">
                <AnalysisError 
                    error={error}
                    onRetry={handleRetry}
                    title="Financial Performance Analysis Error"
                />
            </div>
        );
    }

    // Check if data is incomplete and show missing questions checker or file upload
    if (!analysisData || isFinancialPerformanceDataIncomplete(analysisData)) {
        return (
            <div className="channel-heatmap channel-heatmap-container">
                <AnalysisEmptyState
                    analysisType="financialPerformance"
                    analysisDisplayName="Financial Performance & Growth Trajectory"
                    icon={TrendingUp}
                    onImproveAnswers={handleMissingQuestionsCheck}
                    onRegenerate={handleRegenerate}
                    isRegenerating={isRegenerating}
                    canRegenerate={canRegenerate}
                    userAnswers={userAnswers}
                    minimumAnswersRequired={3}

                    // File upload props
                    showFileUpload={true}
                    onFileUpload={handleFileUpload}
                    onGenerateWithFile={() => generateFinancialPerformanceAnalysis(true)}
                    onGenerateWithoutFile={() => generateFinancialPerformanceAnalysis(false)}
                    uploadedFile={uploadedFile}
                    onRemoveFile={removeFile}
                    isUploading={isLoading}
                    fileUploadMessage="Upload financial documents (PDF, Excel, CSV, or images) for detailed financial performance analysis"
                    acceptedFileTypes=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
                />
            </div>
        );
    }

    const { currentYear, previousYear, growthRates, quarterlyTrend } = analysisData.financialPerformance;
    const quarterlyData = prepareQuarterlyData(analysisData);
    const comparisonData = prepareYearComparisonData(analysisData);

    return (
        <div className="channel-heatmap channel-heatmap-container" data-analysis-type="financial-performance"
            data-analysis-name="Financial Performance & Growth Trajectory"
            data-analysis-order="2">

            {/* Key Metrics */}
            <div className="ch-metrics">
                <div className="ch-metric-card ch-metric-blue">
                    <div className="ch-metric-header">
                        <DollarSign size={20} />
                        <span>Current Revenue</span>
                    </div>
                    <p className="ch-metric-value">${currentYear.revenue.toLocaleString()}</p>
                </div>

                <div className="ch-metric-card ch-metric-green">
                    <div className="ch-metric-header">
                        <TrendingUp size={20} />
                        <span>Revenue Growth</span>
                    </div>
                    <p className="ch-metric-value">{growthRates.revenueGrowth}%</p>
                </div>

                <div className="ch-metric-card ch-metric-purple">
                    <div className="ch-metric-header">
                        <Target size={20} />
                        <span>Net Margin</span>
                    </div>
                    <p className="ch-metric-value">{currentYear.netMargin}%</p>
                </div>

                <div className="ch-metric-card ch-metric-orange">
                    <div className="ch-metric-header">
                        <TrendingUp size={20} />
                        <span>Profit Growth</span>
                    </div>
                    <p className="ch-metric-value">{growthRates.profitGrowth}%</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="ch-heatmap-container">
                <div className="ch-heatmap-scroll">
                    <div className="ch-heatmap-header-section">
                        <h3 className="ch-section-title">Financial Performance Charts</h3>
                    </div>

                    <div className="ch-charts-grid">
                        {/* Quarterly Revenue Trend */}
                        <div className="ch-chart-section">
                            <h4>Quarterly Revenue Trend</h4>
                            <div className="ch-chart-wrapper">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={quarterlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="quarter" />
                                        <YAxis />
                                        <Tooltip content={<QuarterlyTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#8884d8"
                                            strokeWidth={3}
                                            dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Year-over-Year Comparison */}
                        <div className="ch-chart-section">
                            <h4>Year-over-Year Performance</h4>
                            <div className="ch-chart-wrapper">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="metric" />
                                        <YAxis />
                                        <Tooltip content={<ComparisonTooltip />} />
                                        <Bar dataKey="previousYear" fill="#82ca9d" name="Previous Year" />
                                        <Bar dataKey="currentYear" fill="#8884d8" name="Current Year" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Details */}
            <div className="ch-breakdown-section">
                <h3 className="ch-section-title">Financial Performance Analysis</h3>
                <div className="ch-breakdown-grid">
                    <div className="ch-breakdown-card">
                        <h4>Current Year Performance</h4>
                        <div className="ch-cost-item">
                            <span>Revenue:</span>
                            <span>${currentYear.revenue.toLocaleString()}</span>
                        </div>
                        <div className="ch-cost-item">
                            <span>Costs:</span>
                            <span>${currentYear.costs.toLocaleString()}</span>
                        </div>
                        <div className="ch-cost-item">
                            <span>EBITDA:</span>
                            <span>${currentYear.ebitda.toLocaleString()}</span>
                        </div>
                        <div className="ch-cost-item">
                            <span>Net Income:</span>
                            <span>${currentYear.netIncome.toLocaleString()}</span>
                        </div>
                        <div className="ch-cost-item">
                            <span>Net Margin:</span>
                            <span>{currentYear.netMargin}%</span>
                        </div>
                    </div>

                    <div className="ch-breakdown-card">
                        <h4>Previous Year Performance</h4>
                        <div className="ch-cost-item">
                            <span>Revenue:</span>
                            <span>${previousYear.revenue.toLocaleString()}</span>
                        </div>
                        <div className="ch-cost-item">
                            <span>Costs:</span>
                            <span>${previousYear.costs.toLocaleString()}</span>
                        </div>
                        <div className="ch-cost-item">
                            <span>EBITDA:</span>
                            <span>${previousYear.ebitda.toLocaleString()}</span>
                        </div>
                        <div className="ch-cost-item">
                            <span>Net Income:</span>
                            <span>${previousYear.netIncome.toLocaleString()}</span>
                        </div>
                        <div className="ch-cost-item">
                            <span>Net Margin:</span>
                            <span>{previousYear.netMargin}%</span>
                        </div>
                    </div>

                    <div className="ch-breakdown-card">
                        <h4>Growth Metrics</h4>
                        <div className="ch-cost-item">
                            <span>Revenue Growth:</span>
                            <span style={{ color: growthRates.revenueGrowth > 0 ? '#10b981' : '#ef4444' }}>
                                {growthRates.revenueGrowth}%
                            </span>
                        </div>
                        <div className="ch-cost-item">
                            <span>Profit Growth:</span>
                            <span style={{ color: growthRates.profitGrowth > 0 ? '#10b981' : '#ef4444' }}>
                                {growthRates.profitGrowth}%
                            </span>
                        </div>
                        <div className="ch-cost-item">
                            <span>Margin Improvement:</span>
                            <span style={{ color: growthRates.marginImprovement > 0 ? '#10b981' : '#ef4444' }}>
                                {growthRates.marginImprovement}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialPerformance;