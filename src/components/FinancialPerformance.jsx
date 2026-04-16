import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, DollarSign, Target, Loader } from 'lucide-react';
import '../styles/goodPhase.css';
import { useTranslation } from "../hooks/useTranslation";
import { useAnalysisStore } from '../store';
import FinancialEmptyState from './FinancialEmptyState';
import AnalysisError from './AnalysisError';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';

const FinancialPerformance = ({
    questions = [],
    userAnswers = {},
    businessName = "Your Business",
    onRegenerate,
    isRegenerating: propIsRegenerating = false,
    canRegenerate = true,
    financialPerformanceData: propFinancialPerformanceData = null,
    selectedBusinessId,
    onRedirectToBrief
}) => {
    const { t } = useTranslation();
    
    // Use Zustand store
    const { 
        financialPerformanceData: storeFinancialPerformanceData,
        isRegenerating: isTypeRegenerating,
        regenerateIndividualAnalysis 
    } = useAnalysisStore();

    const isRegenerating = propIsRegenerating || isTypeRegenerating('financialPerformance');

    // Normalize data from store or props
    const analysisData = useMemo(() => {
        const rawData = propFinancialPerformanceData || storeFinancialPerformanceData;
        if (!rawData) return null;

        let normalizedData;
        if (rawData.financialPerformance) {
            normalizedData = rawData.financialPerformance;
        } else if (rawData.financial_performance) {
            normalizedData = rawData.financial_performance;
        } else if (rawData.currentYear && rawData.previousYear) {
            normalizedData = rawData;
        } else {
            return null;
        }

        return { financialPerformance: normalizedData };
    }, [propFinancialPerformanceData, storeFinancialPerformanceData]);

    const [error, setError] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleRedirectToBrief = useCallback((missingQuestionsData = null) => {
        if (onRedirectToBrief) {
            onRedirectToBrief(missingQuestionsData);
        }
    }, [onRedirectToBrief]);

    const handleMissingQuestionsCheck = useCallback(async () => {
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
    }, [selectedBusinessId, handleRedirectToBrief]);

    const isFinancialPerformanceDataIncomplete = useCallback((data) => {
        if (!data || !data.financialPerformance) return true;
        const fp = data.financialPerformance;

        if (!fp.currentYear || !fp.currentYear.revenue || !fp.previousYear || !fp.growthRates || !fp.quarterlyTrend) {
            return true;
        }
        return false;
    }, []);

    const handleRegenerate = useCallback(async () => {
        if (onRegenerate) {
            try {
                setError(null);
                await onRegenerate();
            } catch (err) {
                setError(`Failed to generate analysis: ${err.message}`);
            }
        } else {
            try {
                setError(null);
                await regenerateIndividualAnalysis('financialPerformance', questions, userAnswers, selectedBusinessId);
            } catch (err) {
                setError(`Failed to generate analysis: ${err.message}`);
            }
        }
    }, [onRegenerate, regenerateIndividualAnalysis, questions, userAnswers, selectedBusinessId]);

    const handleFileUpload = useCallback((file) => {
        if (file) {
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
    }, []);

    const removeFile = useCallback(() => {
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const quarterlyData = useMemo(() => {
        return analysisData?.financialPerformance?.quarterlyTrend || [];
    }, [analysisData]);

    const comparisonData = useMemo(() => {
        if (!analysisData?.financialPerformance) return [];

        const { currentYear, previousYear, growthRates } = analysisData.financialPerformance;

        return [
            {
                metric: 'Revenue',
                currentYear: currentYear.revenue,
                previousYear: previousYear.revenue,
                growth: growthRates.revenueGrowth
            },
            {
                metric: 'EBITDA',
                currentYear: currentYear.ebitda,
                previousYear: previousYear.ebitda,
                growth: previousYear.ebitda !== 0 ? ((currentYear.ebitda - previousYear.ebitda) / previousYear.ebitda * 100).toFixed(1) : 0
            },
            {
                metric: 'Net Income',
                currentYear: currentYear.netIncome,
                previousYear: previousYear.netIncome,
                growth: growthRates.profitGrowth
            }
        ];
    }, [analysisData]);

    const QuarterlyTooltip = React.memo(({ active, payload, label }) => {
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
    });

    const ComparisonTooltip = React.memo(({ active, payload, label }) => {
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
    });

    if (isRegenerating) {
        return (
            <div className="channel-heatmap channel-heatmap-container">
                <div className="loading-state">
                    <Loader size={24} className="loading-spinner" />
                    <span>Generating financial performance analysis...</span>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (error) {
            return (
                <AnalysisError
                    error={error}
                    onRetry={handleRegenerate}
                    title="Financial Performance Analysis Error"
                />
            );
        }

        if (!analysisData || isFinancialPerformanceDataIncomplete(analysisData)) {
            return (
                <FinancialEmptyState
                    analysisType="financialPerformance"
                    analysisDisplayName="Financial Performance & Growth Trajectory"
                    icon={TrendingUp}
                    onImproveAnswers={handleMissingQuestionsCheck}
                    onRegenerate={handleRegenerate}
                    isRegenerating={isRegenerating}
                    canRegenerate={canRegenerate}
                    userAnswers={userAnswers}
                    minimumAnswersRequired={3}
                    showFileUpload={true}
                    onFileUpload={handleFileUpload}
                    uploadedFile={uploadedFile}
                    onRemoveFile={removeFile}
                    fileUploadMessage="Upload financial documents (PDF, Excel, CSV, or images) for detailed financial performance analysis"
                    acceptedFileTypes=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
                />
            );
        }

        const { currentYear, growthRates } = analysisData.financialPerformance;

        return (
            <>
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
            </>
        );
    };

    return (
        <div className="channel-heatmap channel-heatmap-container" data-analysis-type="financial-performance"
            data-analysis-name="Financial Performance & Growth Trajectory"
            data-analysis-order="2">
            {renderContent()}
        </div>
    );
};

export default React.memo(FinancialPerformance);