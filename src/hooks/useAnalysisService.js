import { useMemo, useCallback } from 'react';
import { AnalysisApiService } from '../services/analysisApiService';

export const useAnalysisService = (ML_API_BASE_URL, API_BASE_URL, getAuthToken) => {
  // Create API service instance
  const apiService = useMemo(() => {
    return new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);
  }, [ML_API_BASE_URL, API_BASE_URL, getAuthToken]);

  // Generate all initial phase analyses
  const generateInitialPhaseAnalyses = useCallback(async (questions, answers, selectedBusinessId, setters) => {
    const {
      setSwotAnalysisResult,
      setPurchaseCriteriaData,
      setLoyaltyNPSData,
      setChannelHeatmapData,
      setCapabilityHeatmapData,
      setStrategicData,
      setPortersData,
      setPestelData
    } = setters;

    const analysisPromises = [
      apiService.generateSWOTAnalysis(questions, answers, selectedBusinessId)
        .then(result => setSwotAnalysisResult(result)),

      apiService.generateSingleAnalysis('purchaseCriteria', 'purchase-criteria', 'purchaseCriteria', questions, answers, selectedBusinessId)
        .then(result => setPurchaseCriteriaData(result)),

      apiService.generateSingleAnalysis('loyaltyNPS', 'loyalty-metrics', 'loyaltyMetrics', questions, answers, selectedBusinessId)
        .then(result => setLoyaltyNPSData(result)),

      apiService.generateSingleAnalysis('channelHeatmap', 'channel-heatmap', 'channelHeatmap', questions, answers, selectedBusinessId)
        .then(result => setChannelHeatmapData(result)),

      apiService.generateSingleAnalysis('capabilityHeatmap', 'capability-heatmap', 'capabilityHeatmap', questions, answers, selectedBusinessId)
        .then(result => setCapabilityHeatmapData(result)),

      apiService.generateStrategicAnalysis(questions, answers, selectedBusinessId)
        .then(result => setStrategicData(result)),

      apiService.generatePortersAnalysis(questions, answers, selectedBusinessId)
        .then(result => setPortersData(result)),

      apiService.generatePestelAnalysis(questions, answers, selectedBusinessId)
        .then(result => setPestelData(result))
    ];

    return await Promise.allSettled(analysisPromises);
  }, [apiService]);

  // Generate all essential phase analyses
  const generateEssentialPhaseAnalyses = useCallback(async (questions, answers, selectedBusinessId, setters) => {
    const {
      setFullSwotData,
      setCustomerSegmentationData,
      setCompetitiveAdvantageData,
      setCoreAdjacencyData,
      setChannelEffectivenessData,
      setExpandedCapabilityData,
      setStrategicGoalsData,
      setStrategicRadarData,
      setCultureProfileData,
      setProductivityData,
      setMaturityData,
      setStrategicData
    } = setters;

    const analysisPromises = [
      apiService.generateFullSwotPortfolio(questions, answers, selectedBusinessId)
        .then(result => setFullSwotData(result)),

      apiService.generateSingleAnalysis('customerSegmentation', 'customer-segment', 'customerSegmentation', questions, answers, selectedBusinessId)
        .then(result => setCustomerSegmentationData(result)),

      apiService.generateCompetitiveAdvantage(questions, answers, selectedBusinessId)
        .then(result => setCompetitiveAdvantageData(result)),

      apiService.generateChannelEffectiveness(questions, answers, selectedBusinessId)
        .then(result => setChannelEffectivenessData(result)),

      apiService.generateExpandedCapability(questions, answers, selectedBusinessId)
        .then(result => setExpandedCapabilityData(result)),

      apiService.generateStrategicGoals(questions, answers, selectedBusinessId)
        .then(result => setStrategicGoalsData(result)),

      apiService.generateStrategicRadar(questions, answers, selectedBusinessId)
        .then(result => setStrategicRadarData(result)),

      apiService.generateCultureProfile(questions, answers, selectedBusinessId)
        .then(result => setCultureProfileData(result)),

      apiService.generateProductivityMetrics(questions, answers, selectedBusinessId)
        .then(result => setProductivityData(result)),

      apiService.generateMaturityScore(questions, answers, selectedBusinessId)
        .then(result => setMaturityData(result)),

      apiService.generateCoreAdjacency(questions, answers, selectedBusinessId)  // ADD THIS
        .then(result => setCoreAdjacencyData(result)),
      // Overwrite strategic analysis for essential phase
      apiService.generateStrategicAnalysis(questions, answers, selectedBusinessId)
        .then(result => setStrategicData(result))
    ];

    return await Promise.allSettled(analysisPromises);
  }, [apiService]);

  // Generate all good phase analyses
  const generateGoodPhaseAnalyses = useCallback(async (questions, answers, selectedBusinessId, setters) => {
    const {
      setCostEfficiencyData,
      setFinancialPerformanceData,
      setFinancialBalanceData,
      setOperationalEfficiencyData
    } = setters;

    const analysisPromises = [
      apiService.generateCostEfficiency(questions, answers, selectedBusinessId, null)
        .then(result => setCostEfficiencyData(result)),

      apiService.generateFinancialPerformance(questions, answers, selectedBusinessId, null)
        .then(result => setFinancialPerformanceData(result)),
      apiService.generateFinancialBalance(questions, answers, selectedBusinessId, null)
        .then(result => setFinancialBalanceData(result)),

      apiService.generateOperationalEfficiency(questions, answers, selectedBusinessId, null)
        .then(result => setOperationalEfficiencyData(result))

    ];

    return await Promise.allSettled(analysisPromises);
  }, [apiService]);

  // Individual analysis regeneration helper
  const createRegenerationHandler = useCallback((
    analysisType,
    endpoint,
    dataKey,
    setter,
    displayName,
    setIsRegenerating,
    questions,
    userAnswers,
    selectedBusinessId,
    showToastMessage,
    file = null
  ) => {
    return async () => {
      try {
        setIsRegenerating(true);
        showToastMessage(`Regenerating ${displayName}...`, "info");
        setter(null);
        await new Promise(resolve => setTimeout(resolve, 200));

        let result;
        // Handle special cases
        if (analysisType === 'swot') {
          result = await apiService.generateSWOTAnalysis(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'porters') {
          result = await apiService.generatePortersAnalysis(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'pestel') {
          result = await apiService.generatePestelAnalysis(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'strategic') {
          result = await apiService.generateStrategicAnalysis(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'fullSwot') {
          result = await apiService.generateFullSwotPortfolio(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'competitiveAdvantage') {
          result = await apiService.generateCompetitiveAdvantage(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'costEfficiency') {
          result = await apiService.generateCostEfficiency(questions, userAnswers, selectedBusinessId, file || null);
        }
        else if (analysisType === 'channelEffectiveness') {
          result = await apiService.generateChannelEffectiveness(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'expandedCapability') {
          result = await apiService.generateExpandedCapability(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'strategicGoals') {
          result = await apiService.generateStrategicGoals(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'strategicRadar') {
          result = await apiService.generateStrategicRadar(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'cultureProfile') {
          result = await apiService.generateCultureProfile(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'productivityMetrics') {
          result = await apiService.generateProductivityMetrics(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'maturityScore') {
          result = await apiService.generateMaturityScore(questions, userAnswers, selectedBusinessId);
        } else if (analysisType === 'costEfficiency') {
          result = await apiService.generateCostEfficiency(questions, userAnswers, selectedBusinessId, file || null);
        } else if (analysisType === 'financialPerformance') {
          result = await apiService.generateFinancialPerformance(questions, userAnswers, selectedBusinessId, file || null);
        } else if (analysisType === 'financialBalance') {
          result = await apiService.generateFinancialBalance(questions, userAnswers, selectedBusinessId, file || null);
        } else if (analysisType === 'operationalEfficiency') {
          result = await apiService.generateOperationalEfficiency(questions, userAnswers, selectedBusinessId, file || null);
        }
        else {
          result = await apiService.generateSingleAnalysis(analysisType, endpoint, dataKey, questions, userAnswers, selectedBusinessId);
        }

        setter(result);
        showToastMessage(`${displayName} regenerated successfully!`, "success");
      } catch (error) {
        console.error(`Error regenerating ${analysisType}:`, error);
        showToastMessage(`Failed to regenerate ${displayName}.`, "error");
      } finally {
        setIsRegenerating(false);
      }
    };
  }, [apiService]);

  return {
    apiService,
    generateInitialPhaseAnalyses,
    generateEssentialPhaseAnalyses,
    generateGoodPhaseAnalyses, // NEW: Add Good phase generation
    createRegenerationHandler
  };
};