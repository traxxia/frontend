// hooks/useAnalysisGeneration.js
import { useCallback } from 'react';

export const useAnalysisGeneration = (
  ML_API_BASE_URL,
  API_BASE_URL,
  getAuthToken,
  questions,
  selectedBusinessId,
  saveAnalysisToBackend
) => {
  
  // Generic function to prepare questions and answers for API calls
  const prepareQuestionsAndAnswers = useCallback((answers, filterFn = null) => {
    const questionsArray = [];
    const answersArray = [];

    questions
      .filter(q => {
        if (filterFn) return filterFn(q, answers);
        return answers[q._id] && answers[q._id].trim();
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(question => {
        questionsArray.push(question.question_text);
        answersArray.push(answers[question._id]);
      });

    return { questionsArray, answersArray };
  }, [questions]);

  // Enhanced API call function with better error handling
  const makeAPICall = useCallback(async (endpoint, questionsArray, answersArray) => {
    if (questionsArray.length === 0) {
      throw new Error(`No questions available for ${endpoint} analysis`);
    }

    try {
      const response = await fetch(`${ML_API_BASE_URL}/${endpoint}`, {
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
        throw new Error(`${endpoint} API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      // Check if the response contains an error detail
      if (result && result.detail && typeof result.detail === 'string' && result.detail.includes('Error')) {
        throw new Error(`API response failed to generate: ${result.detail}`);
      }

      return result;
    } catch (error) {
      // Handle network errors, parsing errors, and API errors uniformly
      if (error.message.includes('API response failed to generate')) {
        throw error; // Re-throw our custom error
      }
      throw new Error(`API response failed to generate: ${error.message}`);
    }
  }, [ML_API_BASE_URL]);

  // Strategic Analysis
  const generateStrategicAnalysis = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(answers);
      const result = await makeAPICall('strategic-analysis', questionsArray, answersArray);
      const strategicContent = result.strategic_analysis || result.strategic || result;
      await saveAnalysisToBackend(strategicContent, 'strategic');
      return strategicContent;
    } catch (error) {
      console.error('Error generating strategic analysis:', error);
      throw new Error(`Strategic analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // SWOT Analysis
  const generateSWOTAnalysis = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(answers);
      const result = await makeAPICall('find', questionsArray, answersArray);
      const analysisContent = typeof result === 'string' ? result : JSON.stringify(result);
      await saveAnalysisToBackend(analysisContent, 'swot');
      return analysisContent;
    } catch (error) {
      console.error('Error generating SWOT analysis:', error);
      throw new Error(`SWOT analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // Porter's Five Forces
  const generatePortersAnalysis = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(answers);
      const result = await makeAPICall('porter-analysis', questionsArray, answersArray);
      const portersContent = result.porters_analysis || result.porters || result;
      await saveAnalysisToBackend(portersContent, 'porters');
      return portersContent;
    } catch (error) {
      console.error('Error generating Porter\'s Five Forces analysis:', error);
      throw new Error(`Porter's analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // PESTEL Analysis
  const generatePestelAnalysis = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(answers);
      const result = await makeAPICall('pestel-analysis', questionsArray, answersArray);
      await saveAnalysisToBackend(result, 'pestel');
      return result;
    } catch (error) {
      console.error('Error generating PESTEL analysis:', error);
      throw new Error(`PESTEL analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // Full SWOT Portfolio
  const generateFullSwotPortfolio = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(
        answers, 
        (q, ans) => ans[q._id] && ans[q._id].trim() !== ''
      );
      const result = await makeAPICall('full-swot-portfolio', questionsArray, answersArray);
      await saveAnalysisToBackend(result, 'fullSwot');
      return result;
    } catch (error) {
      console.error('Error generating Full SWOT Portfolio analysis:', error);
      throw new Error(`Full SWOT Portfolio failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // Competitive Advantage
  const generateCompetitiveAdvantage = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(answers);
      const result = await makeAPICall('competitive-advantage', questionsArray, answersArray);
      await saveAnalysisToBackend(result, 'competitiveAdvantage');
      return result;
    } catch (error) {
      console.error('Error generating Competitive Advantage Matrix:', error);
      throw new Error(`Competitive Advantage analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // Channel Effectiveness
  const generateChannelEffectiveness = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(answers);
      const result = await makeAPICall('channel-effectiveness', questionsArray, answersArray);
      
      let channelContent = null;
      if (result.channelEffectiveness) {
        channelContent = result;
      } else if (result.channel_effectiveness) {
        channelContent = { channelEffectiveness: result.channel_effectiveness };
      } else {
        channelContent = { channelEffectiveness: result };
      }

      await saveAnalysisToBackend(channelContent, 'channelEffectiveness');
      return channelContent;
    } catch (error) {
      console.error('Error generating Channel Effectiveness Map:', error);
      throw new Error(`Channel Effectiveness analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // Expanded Capability
  const generateExpandedCapability = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(answers);
      const result = await makeAPICall('expanded-capability-heatmap', questionsArray, answersArray);
      
      let expandedCapabilityContent = null;
      if (result.expandedCapabilityHeatmap) {
        expandedCapabilityContent = result;
      } else if (result.expanded_capability_heatmap) {
        expandedCapabilityContent = { expandedCapabilityHeatmap: result.expanded_capability_heatmap };
      } else {
        expandedCapabilityContent = { expandedCapabilityHeatmap: result };
      }

      await saveAnalysisToBackend(expandedCapabilityContent, 'expandedCapability');
      return expandedCapabilityContent;
    } catch (error) {
      console.error('Error generating Capability Heatmap:', error);
      throw new Error(`Expanded Capability analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // Strategic Goals
  const generateStrategicGoals = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(answers);
      const result = await makeAPICall('strategic-goals', questionsArray, answersArray);
      await saveAnalysisToBackend(result, 'strategicGoals');
      return result;
    } catch (error) {
      console.error('Error generating Strategic Goals:', error);
      throw new Error(`Strategic Goals analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // Strategic Radar
  const generateStrategicRadar = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(answers);
      const result = await makeAPICall('strategic-positioning-radar', questionsArray, answersArray);
      
      let strategicRadarContent = null;
      if (result.strategicRadar) {
        strategicRadarContent = result;
      } else if (result.strategic_radar) {
        strategicRadarContent = { strategicRadar: result.strategic_radar };
      } else {
        strategicRadarContent = { strategicRadar: result };
      }

      await saveAnalysisToBackend(strategicRadarContent, 'strategicRadar');
      return strategicRadarContent;
    } catch (error) {
      console.error('Error generating Strategic Positioning Radar:', error);
      throw new Error(`Strategic Radar analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // Culture Profile
  const generateCultureProfile = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(answers);
      const result = await makeAPICall('culture-profile', questionsArray, answersArray);
      
      let cultureContent = null;
      if (result.cultureProfile) {
        cultureContent = result;
      } else if (result.culture_profile) {
        cultureContent = { cultureProfile: result.culture_profile };
      } else {
        cultureContent = { cultureProfile: result };
      }

      await saveAnalysisToBackend(cultureContent, 'cultureProfile');
      return cultureContent;
    } catch (error) {
      console.error('Error generating Culture Profile:', error);
      throw new Error(`Culture Profile analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // Productivity Metrics
  const generateProductivityMetrics = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(answers);
      const result = await makeAPICall('productivity-metrics', questionsArray, answersArray);
      
      let productivityContent = null;
      if (result.productivityMetrics) {
        productivityContent = result;
      } else if (result.productivity_metrics) {
        productivityContent = { productivityMetrics: result.productivity_metrics };
      } else {
        productivityContent = { productivityMetrics: result };
      }

      await saveAnalysisToBackend(productivityContent, 'productivityMetrics');
      return productivityContent;
    } catch (error) {
      console.error('Error generating Productivity Metrics:', error);
      throw new Error(`Productivity Metrics analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // Maturity Score
  const generateMaturityScore = useCallback(async (answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(answers);
      const result = await makeAPICall('maturity-scoring', questionsArray, answersArray);

      let maturityContent = null;
      if (result.maturityScore || result.maturity_score) {
        maturityContent = result;
      } else if (result.dimensions && result.overallMaturity) {
        maturityContent = { maturityScore: result };
      } else {
        maturityContent = { maturityScore: result };
      }

      await saveAnalysisToBackend(maturityContent, 'maturityScore');
      return maturityContent;
    } catch (error) {
      console.error('Error generating Maturity Score:', error);
      throw new Error(`Maturity Score analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  // Generic Single Analysis (for standard endpoints)
  const generateSingleAnalysis = useCallback(async (analysisType, endpoint, dataKey, answers) => {
    try {
      const { questionsArray, answersArray } = prepareQuestionsAndAnswers(
        answers,
        (q, ans) => {
          const hasAnswer = ans[q._id] && ans[q._id].trim();
          return hasAnswer;
        }
      );

      const result = await makeAPICall(endpoint, questionsArray, answersArray);
      let dataToSave = null;

      if (analysisType === 'capabilityHeatmap') {
        dataToSave = result.capabilities ? result : result[dataKey];
      } else if (result && result[dataKey]) {
        dataToSave = result[dataKey];
      } else {
        throw new Error(`Invalid response structure from ${analysisType} API`);
      }

      if (dataToSave) {
        await saveAnalysisToBackend(dataToSave, analysisType);
        return dataToSave;
      }
    } catch (error) {
      console.error(`Error generating ${analysisType} analysis:`, error);
      throw new Error(`${analysisType} analysis failed: ${error.message}`);
    }
  }, [prepareQuestionsAndAnswers, makeAPICall, saveAnalysisToBackend]);

  return {
    generateStrategicAnalysis,
    generateSWOTAnalysis,
    generatePortersAnalysis,
    generatePestelAnalysis,
    generateFullSwotPortfolio,
    generateCompetitiveAdvantage,
    generateChannelEffectiveness,
    generateExpandedCapability,
    generateStrategicGoals,
    generateStrategicRadar,
    generateCultureProfile,
    generateProductivityMetrics,
    generateMaturityScore,
    generateSingleAnalysis
  };
};