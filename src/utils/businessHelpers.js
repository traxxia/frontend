// utils/businessHelpers.js

export const extractBusinessName = (text) => {
  const patterns = [
    /(?:we are|i am|this is|called|business is|company is)\s+([A-Z][a-zA-Z\s&.-]+?)(?:\.|,|$)/i,
    /^([A-Z][a-zA-Z\s&.-]+?)\s+(?:is|provides|offers|teaches)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length <= 50) {
      return match[1].trim();
    }
  }
  return null;
};

export const showToastMessage = (setShowToast) => (message, type = "success", options = {}) => {
  const { duration = 4000 } = options;
  setShowToast({ show: true, message, type });

  
  if (duration > 0) {
    setTimeout(() => {
      setShowToast({ show: false, message: "", type: "success" });
    }, duration);
  }
};

export const clearAllAnalysisData = (setters) => {
  const {
    setSwotAnalysisResult,
    setPurchaseCriteriaData,
    setChannelHeatmapData,
    setLoyaltyNPSData,
    setCapabilityHeatmapData,
    setStrategicData,
    setPortersData,
    setPestelData,
    setFullSwotData,
    setCompetitiveAdvantageData,
    setChannelEffectivenessData,
    setExpandedCapabilityData,
    setStrategicGoalsData,
    setStrategicRadarData,
    setCustomerSegmentationData,
    setCultureProfileData,
    setProductivityData,
    setMaturityData
  } = setters;

  setSwotAnalysisResult("");
  setPurchaseCriteriaData(null);
  setChannelHeatmapData(null);
  setLoyaltyNPSData(null);
  setCapabilityHeatmapData(null);
  setStrategicData(null);
  setPortersData(null);
  setPestelData(null);
  setFullSwotData(null);
  setCompetitiveAdvantageData(null);
  setChannelEffectivenessData(null);
  setExpandedCapabilityData(null);
  setStrategicGoalsData(null);
  setStrategicRadarData(null);
  setCustomerSegmentationData(null);
  setCultureProfileData(null);
  setProductivityData(null);
  setMaturityData(null);
};

export const createIndividualRegenerationHandler = (
  analysisType,
  endpoint,
  dataKey,
  setter,
  displayName,
  setIsRegenerating,
  generateFunction,
  userAnswers,
  showToastMessage
) => {
  return async () => {
    if (!generateFunction) return;

    try {
      setIsRegenerating(true);
      showToastMessage(`Regenerating ${displayName}...`, "info");
      setter(null);
      await new Promise(resolve => setTimeout(resolve, 200));

      await generateFunction(userAnswers);
      showToastMessage(`${displayName} regenerated successfully!`, "success");
    } catch (error) {
      console.error(`Error regenerating ${analysisType}:`, error);
      showToastMessage(`Failed to regenerate ${displayName}.`, "error");
    } finally {
      setIsRegenerating(false);
    }
  };
};