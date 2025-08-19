export const PHASE_API_CONFIG = {
  initial: [
    'swot',
    'purchaseCriteria', 
    'channelHeatmap',
    'loyaltyNPS',
    'capabilityHeatmap',
    'porters',
    'pestel'
  ],
  
  essential: [
    'purchaseCriteria',
    'channelHeatmap', 
    'loyaltyNPS',
    'porters',
    'pestel',
    'fullSwot',
    'customerSegmentation',
    'competitiveAdvantage',
    'channelEffectiveness',
    'expandedCapability',
    'strategicGoals',
    'strategicRadar',
    'cultureProfile',
    'productivityMetrics',
    'maturityScore'
  ],
  
  good: [
    'purchaseCriteria',
    'channelHeatmap',
    'loyaltyNPS', 
    'porters',
    'pestel',
    'fullSwot',
    'customerSegmentation',
    'competitiveAdvantage',
    'channelEffectiveness',
    'expandedCapability',
    'strategicGoals',
    'strategicRadar',
    'cultureProfile',
    'productivityMetrics',
    'maturityScore',
    'costEfficiency',
    'financialPerformance',
    'financialHealth',
    'operationalEfficiency'
  ],
  
  advanced: [
    'purchaseCriteria',
    'channelHeatmap',
    'loyaltyNPS',
    'porters', 
    'pestel',
    'fullSwot',
    'customerSegmentation',
    'competitiveAdvantage',
    'channelEffectiveness',
    'expandedCapability',
    'strategicGoals',
    'strategicRadar',
    'cultureProfile',
    'productivityMetrics',
    'maturityScore',
    'costEfficiency',
    'financialPerformance',
    'financialHealth',
    'operationalEfficiency'
  ]
};

// API endpoint mapping
export const API_ENDPOINTS = {
  swot: 'find',
  purchaseCriteria: 'purchase-criteria',
  channelHeatmap: 'channel-heatmap',
  loyaltyNPS: 'loyalty-metrics',
  capabilityHeatmap: 'capability-heatmap',
  porters: 'porter-analysis',
  pestel: 'pestel-analysis',
  fullSwot: 'full-swot-portfolio',
  customerSegmentation: 'customer-segment',
  competitiveAdvantage: 'competitive-advantage',
  channelEffectiveness: 'channel-effectiveness',
  expandedCapability: 'expanded-capability-heatmap',
  strategicGoals: 'strategic-goals',
  strategicRadar: 'strategic-positioning-radar',
  cultureProfile: 'culture-profile',
  productivityMetrics: 'productivity-metrics',
  maturityScore: 'maturity-scoring',
  costEfficiency: 'cost-efficiency-competitive-position',
  financialPerformance: 'financial-performance',
  financialHealth: 'financial-health',
  operationalEfficiency: 'operational-efficiency'
};

export class AnalysisApiService {
  constructor(ML_API_BASE_URL, API_BASE_URL, getAuthToken, setApiLoading = null) {
    this.ML_API_BASE_URL = ML_API_BASE_URL;
    this.API_BASE_URL = API_BASE_URL;
    this.getAuthToken = getAuthToken;
    this.setApiLoading = setApiLoading; // NEW - API loading state tracker
  }

  // Helper method to prepare questions and answers
  prepareQuestionsAndAnswers(questions, answers, filterFn = null) {
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
  }

  async makeAPICall(endpoint, questionsArray, answersArray, selectedBusinessId = null, uploadedFile = null) {
  if (questionsArray.length === 0) {
    throw new Error(`No questions available for ${endpoint} analysis`);
  }

  try {
    // Set loading state for this specific endpoint
    if (this.setApiLoading) {
      this.setApiLoading(endpoint, true);
    }

    // Check if this is a good phase API that supports file upload
    const goodPhaseEndpoints = [
      'cost-efficiency-competitive-position',
      'financial-performance', 
      'financial-health',
      'operational-efficiency'
    ];

    const isGoodPhaseAPI = goodPhaseEndpoints.includes(endpoint);

    let response;

    if (isGoodPhaseAPI) {
      // Always use FormData for good phase APIs (with or without file)
      const formData = new FormData();
      
      if (uploadedFile) {
        // Add the uploaded file if provided
        formData.append('file', uploadedFile);
      } else {
        // Create a dummy text file with business information
        const businessInfo = `Business Information:\n${questionsArray.map((q, i) => `${q}: ${answersArray[i]}`).join('\n')}`;
        const dummyFile = new Blob([businessInfo], { type: 'text/plain' });
        formData.append('file', dummyFile, 'business_data.txt');
      }
      
      // Add questions and answers
      formData.append('questions', questionsArray.join(','));
      formData.append('answers', answersArray.join('\n'));

      response = await fetch(`${this.ML_API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json'
        },
        body: formData
      });
    } else {
      // Use JSON for other APIs
      response = await fetch(`${this.ML_API_BASE_URL}/${endpoint}`, {
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
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${endpoint} API returned ${response.status}: ${errorText}`);
    }

    return await response.json();
  } finally {
    // Always clear loading state for this endpoint
    if (this.setApiLoading) {
      this.setApiLoading(endpoint, false);
    }
  }
}

  // Save analysis to backend
  async saveAnalysisToBackend(analysisData, analysisType, selectedBusinessId) {
    try {
      const token = this.getAuthToken();

      // Define which analysis types belong to which phases
      const analysisPhaseMap = {
        // Initial Phase analyses
        'swot': 'initial',
        'purchaseCriteria': 'initial',
        'channelHeatmap': 'initial',
        'loyaltyNPS': 'initial',
        'capabilityHeatmap': 'initial',
        'porters': 'initial',
        'pestel': 'initial',
        'strategic': 'strategic',

        // Essential Phase analyses  
        'fullSwot': 'essential',
        'customerSegmentation': 'essential',
        'competitiveAdvantage': 'essential',
        'channelEffectiveness': 'essential',
        'expandedCapability': 'essential',
        'strategicGoals': 'essential',
        'strategicRadar': 'essential',
        'cultureProfile': 'essential',
        'productivityMetrics': 'essential',
        'maturityScore': 'essential',

        // Good Phase analyses
        'costEfficiency': 'good',
        'financialPerformance': 'good',
        'financialHealth': 'good',
        'operationalEfficiency': 'good'
      };

      // Determine the correct phase
      const phase = analysisPhaseMap[analysisType] || 'initial';

      const response = await fetch(`${this.API_BASE_URL}/api/conversations/phase-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phase: phase,
          analysis_type: analysisType,
          analysis_name: `${analysisType.toUpperCase()} Analysis`,
          analysis_data: analysisData,
          business_id: selectedBusinessId,
          metadata: {
            generated_at: new Date().toISOString(),
            phase: phase,
            generation_context: 'regular_generation'
          }
        })
      });

      if (!response.ok) {
        console.error(`Failed to save ${analysisType} analysis:`, response.statusText);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Error saving ${analysisType} analysis:`, error);
      return false;
    }
  }

  async callAnalysisEndpoint(analysisType, payload) {
  const endpoint = API_ENDPOINTS[analysisType];
  if (!endpoint) {
    throw new Error(`Unknown analysis type: ${analysisType}`);
  }

  const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(
    payload.questions, 
    payload.userAnswers
  );

  // Pass uploadedFile from stateSetters for good phase APIs
  const uploadedFile = payload.stateSetters?.uploadedFile || null;

  const result = await this.makeAPICall(
    endpoint, 
    questionsArray, 
    answersArray, 
    payload.selectedBusinessId, 
    uploadedFile
  );
  
  // Process result based on analysis type
  let processedData = null;
  
  switch (analysisType) {
    case 'swot':
      processedData = typeof result === 'string' ? result : JSON.stringify(result);
      break;
    case 'porters':
      processedData = result.porters_analysis || result.porters || result;
      break;
    case 'purchaseCriteria':
      processedData = result.purchase_criteria || result.purchaseCriteria || result;
      break;
    case 'channelHeatmap':
      processedData = result.channel_heatmap || result.channelHeatmap || result;
      break;
    case 'loyaltyNPS':
      processedData = result.loyalty_nps || result.loyaltyNPS || result;
      break;
    case 'capabilityHeatmap':
      processedData = result.capabilities ? result : result.capability_heatmap || result;
      break;
    case 'channelEffectiveness':
      processedData = result.channelEffectiveness ? result : { channelEffectiveness: result.channel_effectiveness || result };
      break;
    case 'expandedCapability':
      processedData = result.expandedCapabilityHeatmap ? result : { expandedCapabilityHeatmap: result.expanded_capability_heatmap || result };
      break;
    case 'strategicRadar':
      processedData = result.strategicRadar ? result : { strategicRadar: result.strategic_radar || result };
      break;
    case 'cultureProfile':
      processedData = result.cultureProfile ? result : { cultureProfile: result.culture_profile || result };
      break;
    case 'productivityMetrics':
      processedData = result.productivityMetrics ? result : { productivityMetrics: result.productivity_metrics || result };
      break;
    case 'maturityScore':
      processedData = result.maturityScore || result.maturity_score ? result : { maturityScore: result };
      break;
    // GOOD PHASE APIs - Enhanced processing
    case 'costEfficiency':
      processedData = result.costEfficiencyInsight ? result : { costEfficiencyInsight: result.cost_efficiency_insight || result };
      break;
    case 'financialPerformance':
      processedData = result.financialPerformance ? result : { financialPerformance: result.financial_performance || result };
      break;
    case 'financialHealth':
      // Handle both old and new structure
      if (result.financialHealth) {
        processedData = result;
      } else if (result.financialBalanceInsight) {
        processedData = result;
      } else if (result.financial_balance_insight) {
        processedData = { financialBalanceInsight: result.financial_balance_insight };
      } else {
        processedData = { financialHealth: result };
      }
      break;
    case 'operationalEfficiency':
      processedData = result.operationalEfficiencyInsight ? result : { operationalEfficiencyInsight: result.operational_efficiency_insight || result };
      break;
    default:
      processedData = result;
  }

  return { data: processedData };
}
async handlePhaseCompletion(phase, questions, userAnswers, selectedBusinessId, stateSetters, showToastMessage) {
  const analysisTypes = PHASE_API_CONFIG[phase];
  
  if (!analysisTypes) {
    console.error(`Unknown phase: ${phase}`);
    return;
  }

  showToastMessage(`${phase.charAt(0).toUpperCase() + phase.slice(1)} phase completed! Generating analyses...`, "info");

  // Clear existing data for this phase
  this.clearPhaseData(phase, stateSetters);

  try {
    // Get fresh conversation data
    const { freshAnswers } = await this.getFreshConversationData(selectedBusinessId);
    
    // Prepare payload with all questions, answers, and file support
    const payload = {
      questions,
      userAnswers: { ...userAnswers, ...freshAnswers },
      selectedBusinessId,
      phase,
      stateSetters // Include stateSetters to access uploadedFile
    };

    // Call all APIs for this phase concurrently with file support
    const results = await Promise.allSettled(
      analysisTypes.map(analysisType => 
        this.callAnalysisAPIWithSave(analysisType, payload, stateSetters, selectedBusinessId)
      )
    );

    // Handle results
    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    if (failures > 0) {
      showToastMessage(
        `${successes}/${analysisTypes.length} ${phase} phase analyses completed successfully.`,
        failures < successes ? "warning" : "error"
      );
    } else {
      showToastMessage(`All ${phase} phase analyses generated successfully!`, "success");
    }

  } catch (error) {
    console.error(`Error generating ${phase} phase analysis:`, error);
    showToastMessage(`Failed to generate ${phase} phase analyses. Please try again.`, "error");
  }
}

  // Call individual analysis API with automatic saving
  async callAnalysisAPIWithSave(analysisType, payload, stateSetters, selectedBusinessId) {
    try {
      const setterName = this.getStateSetterName(analysisType);
      console.log(`Looking for setter: ${setterName} for analysis: ${analysisType}`);
      console.log('Available setters:', Object.keys(stateSetters));
      
      const setter = stateSetters[setterName];

      if (!setter) {
        console.error(`Missing setter for ${analysisType}. Expected: ${setterName}`);
        throw new Error(`Missing setter for ${analysisType}`);
      }

      // Make API call (loading state is handled in makeAPICall)
      const response = await this.callAnalysisEndpoint(analysisType, payload);
      
      // Update state
      setter(response.data);
      
      // Automatically save to backend
      try {
        await this.saveAnalysisToBackend(response.data, analysisType, selectedBusinessId);
      } catch (saveError) {
        console.warn(`Failed to save ${analysisType} analysis:`, saveError);
        // Don't throw here - the analysis was generated successfully
      }
      
      return { analysisType, status: 'success' };
    } catch (error) {
      console.error(`Error calling ${analysisType} API:`, error);
      throw error;
    }
  }

  // Get state setter name for analysis type
  getStateSetterName(analysisType) {
    const setterMap = {
      swot: 'setSwotAnalysisResult',
      purchaseCriteria: 'setPurchaseCriteriaData',
      channelHeatmap: 'setChannelHeatmapData',
      loyaltyNPS: 'setLoyaltyNPSData',
      capabilityHeatmap: 'setCapabilityHeatmapData',
      porters: 'setPortersData',
      pestel: 'setPestelData',
      fullSwot: 'setFullSwotData',
      customerSegmentation: 'setCustomerSegmentationData',
      competitiveAdvantage: 'setCompetitiveAdvantageData',
      channelEffectiveness: 'setChannelEffectivenessData',
      expandedCapability: 'setExpandedCapabilityData',
      strategicGoals: 'setStrategicGoalsData',
      strategicRadar: 'setStrategicRadarData',
      cultureProfile: 'setCultureProfileData',
      productivityMetrics: 'setProductivityData',
      maturityScore: 'setMaturityData',
      costEfficiency: 'setCostEfficiencyData',
      financialPerformance: 'setFinancialPerformanceData',
      financialHealth: 'setFinancialBalanceData',
      operationalEfficiency: 'setOperationalEfficiencyData'
    };
    return setterMap[analysisType];
  }

  // Clear data for specific phase
  clearPhaseData(phase, stateSetters) {
    const analysisTypes = PHASE_API_CONFIG[phase];
    
    analysisTypes.forEach(analysisType => {
      const setterName = this.getStateSetterName(analysisType);
      const setter = stateSetters[setterName];
      if (setter) {
        setter(null);
      }
    });
  }

  // UPDATED - Create simple regeneration handler for individual analysis
  createSimpleRegenerationHandler(analysisType, questions, userAnswers, selectedBusinessId, stateSetters, showToastMessage) {
    return async () => {
      try {
        showToastMessage(`Regenerating ${analysisType}...`, "info");
        
        const setterName = this.getStateSetterName(analysisType);
        const setter = stateSetters[setterName];
        if (setter) {
          setter(null); // Clear existing data
        }

        // Get fresh conversation data
        const { freshAnswers } = await this.getFreshConversationData(selectedBusinessId);
        
        // Prepare payload
        const payload = {
          questions,
          userAnswers: { ...userAnswers, ...freshAnswers },
          selectedBusinessId
        };

        // Call API (loading state is handled automatically in makeAPICall)
        const response = await this.callAnalysisEndpoint(analysisType, payload);
        
        // Update state
        if (setter) {
          setter(response.data);
        }
        
        // Save to backend
        await this.saveAnalysisToBackend(response.data, analysisType, selectedBusinessId);
        
        showToastMessage(`${analysisType} regenerated successfully!`, "success");
      } catch (error) {
        console.error(`Error regenerating ${analysisType}:`, error);
        showToastMessage(`Failed to regenerate ${analysisType}.`, "error");
      }
    };
  }

  // Strategic Analysis (kept for compatibility)
  async generateStrategicAnalysis(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('strategic-analysis', questionsArray, answersArray);
      const strategicContent = result.strategic_analysis || result.strategic || result;
      await this.saveAnalysisToBackend(strategicContent, 'strategic', selectedBusinessId);
      return strategicContent;
    } catch (error) {
      console.error('Error generating strategic analysis:', error);
      throw error;
    }
  }

  // Keep individual methods for backward compatibility
  async generateSWOTAnalysis(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('find', questionsArray, answersArray);
      const analysisContent = typeof result === 'string' ? result : JSON.stringify(result);
      await this.saveAnalysisToBackend(analysisContent, 'swot', selectedBusinessId);
      return analysisContent;
    } catch (error) {
      console.error('Error generating SWOT analysis:', error);
      throw error;
    }
  }

  // Fetch fresh conversation data
  async getFreshConversationData(selectedBusinessId) {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${this.API_BASE_URL}/api/conversations?business_id=${selectedBusinessId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fresh conversation data');
      }

      const data = await response.json();
      const freshAnswers = {};
      const freshCompletedSet = new Set();

      data.conversations?.forEach(conversation => {
        if (conversation.completion_status === 'complete' || conversation.completion_status === 'skipped') {
          const questionId = conversation.question_id;
          freshCompletedSet.add(questionId);

          if (conversation.completion_status === 'skipped' || conversation.is_skipped) {
            freshAnswers[questionId] = '[Question Skipped]';
          } else {
            const allAnswers = conversation.conversation_flow
              .filter(item => item.type === 'answer')
              .map(a => a.text.trim())
              .filter(text => text.length > 0 && text !== '[Question Skipped]');

            if (allAnswers.length > 0) {
              freshAnswers[questionId] = allAnswers.join('. ');
            }
          }
        }
      });

      return { freshAnswers, freshCompletedSet };
    } catch (error) {
      console.error('Error fetching fresh conversation data:', error);
      return { freshAnswers: {}, freshCompletedSet: new Set() };
    }
  }

  // Keep all other existing methods for backward compatibility...
  async generatePortersAnalysis(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('porter-analysis', questionsArray, answersArray);
      const portersContent = result.porters_analysis || result.porters || result;
      await this.saveAnalysisToBackend(portersContent, 'porters', selectedBusinessId);
      return portersContent;
    } catch (error) {
      console.error('Error generating Porter\'s Five Forces analysis:', error);
      throw error;
    }
  }

  async generatePestelAnalysis(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('pestel-analysis', questionsArray, answersArray);
      await this.saveAnalysisToBackend(result, 'pestel', selectedBusinessId);
      return result;
    } catch (error) {
      console.error('Error generating PESTEL analysis:', error);
      throw error;
    }
  }

  async generateFullSwotPortfolio(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(
        questions,
        answers,
        (q, ans) => ans[q._id] && ans[q._id].trim() !== ''
      );
      const result = await this.makeAPICall('full-swot-portfolio', questionsArray, answersArray);
      await this.saveAnalysisToBackend(result, 'fullSwot', selectedBusinessId);
      return result;
    } catch (error) {
      console.error('Error generating Full SWOT Portfolio analysis:', error);
      throw error;
    }
  }

  async generateCompetitiveAdvantage(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('competitive-advantage', questionsArray, answersArray);
      await this.saveAnalysisToBackend(result, 'competitiveAdvantage', selectedBusinessId);
      return result;
    } catch (error) {
      console.error('Error generating Competitive Advantage Matrix:', error);
      throw error;
    }
  }

  async generateChannelEffectiveness(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('channel-effectiveness', questionsArray, answersArray);

      let channelContent = null;
      if (result.channelEffectiveness) {
        channelContent = result;
      } else if (result.channel_effectiveness) {
        channelContent = { channelEffectiveness: result.channel_effectiveness };
      } else {
        channelContent = { channelEffectiveness: result };
      }

      await this.saveAnalysisToBackend(channelContent, 'channelEffectiveness', selectedBusinessId);
      return channelContent;
    } catch (error) {
      console.error('Error generating Channel Effectiveness Map:', error);
      throw error;
    }
  }

  async generateExpandedCapability(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('expanded-capability-heatmap', questionsArray, answersArray);

      let expandedCapabilityContent = null;
      if (result.expandedCapabilityHeatmap) {
        expandedCapabilityContent = result;
      } else if (result.expanded_capability_heatmap) {
        expandedCapabilityContent = { expandedCapabilityHeatmap: result.expanded_capability_heatmap };
      } else {
        expandedCapabilityContent = { expandedCapabilityHeatmap: result };
      }

      await this.saveAnalysisToBackend(expandedCapabilityContent, 'expandedCapability', selectedBusinessId);
      return expandedCapabilityContent;
    } catch (error) {
      console.error('Error generating Expanded Capability Heatmap:', error);
      throw error;
    }
  }

  async generateStrategicGoals(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('strategic-goals', questionsArray, answersArray);
      await this.saveAnalysisToBackend(result, 'strategicGoals', selectedBusinessId);
      return result;
    } catch (error) {
      console.error('Error generating Strategic Goals:', error);
      throw error;
    }
  }

  async generateStrategicRadar(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('strategic-positioning-radar', questionsArray, answersArray);

      let strategicRadarContent = null;
      if (result.strategicRadar) {
        strategicRadarContent = result;
      } else if (result.strategic_radar) {
        strategicRadarContent = { strategicRadar: result.strategic_radar };
      } else {
        strategicRadarContent = { strategicRadar: result };
      }

      await this.saveAnalysisToBackend(strategicRadarContent, 'strategicRadar', selectedBusinessId);
      return strategicRadarContent;
    } catch (error) {
      console.error('Error generating Strategic Positioning Radar:', error);
      throw error;
    }
  }

  async generateCultureProfile(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('culture-profile', questionsArray, answersArray);

      let cultureContent = null;
      if (result.cultureProfile) {
        cultureContent = result;
      } else if (result.culture_profile) {
        cultureContent = { cultureProfile: result.culture_profile };
      } else {
        cultureContent = { cultureProfile: result };
      }

      await this.saveAnalysisToBackend(cultureContent, 'cultureProfile', selectedBusinessId);
      return cultureContent;
    } catch (error) {
      console.error('Error generating Culture Profile:', error);
      throw error;
    }
  }

  async generateProductivityMetrics(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('productivity-metrics', questionsArray, answersArray);

      let productivityContent = null;
      if (result.productivityMetrics) {
        productivityContent = result;
      } else if (result.productivity_metrics) {
        productivityContent = { productivityMetrics: result.productivity_metrics };
      } else {
        productivityContent = { productivityMetrics: result };
      }

      await this.saveAnalysisToBackend(productivityContent, 'productivityMetrics', selectedBusinessId);
      return productivityContent;
    } catch (error) {
      console.error('Error generating Productivity Metrics:', error);
      throw error;
    }
  }

  async generateMaturityScore(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('maturity-scoring', questionsArray, answersArray);

      let maturityContent = null;
      if (result.maturityScore || result.maturity_score) {
        maturityContent = result;
      } else if (result.dimensions && result.overallMaturity) {
        maturityContent = { maturityScore: result };
      } else {
        maturityContent = { maturityScore: result };
      }

      await this.saveAnalysisToBackend(maturityContent, 'maturityScore', selectedBusinessId);
      return maturityContent;
    } catch (error) {
      console.error('Error generating Maturity Score:', error);
      throw error;
    }
  }

  async generateCostEfficiency(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('cost-efficiency-competitive-position', questionsArray, answersArray);

      let costEfficiencyContent = null;
      if (result.costEfficiencyInsight) {
        costEfficiencyContent = result;
      } else if (result.cost_efficiency_insight) {
        costEfficiencyContent = { costEfficiencyInsight: result.cost_efficiency_insight };
      } else {
        costEfficiencyContent = { costEfficiencyInsight: result };
      }

      await this.saveAnalysisToBackend(costEfficiencyContent, 'costEfficiency', selectedBusinessId);
      return costEfficiencyContent;
    } catch (error) {
      console.error('Error generating Cost Efficiency Insight:', error);
      throw error;
    }
  }

  async generateFinancialPerformance(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('financial-performance', questionsArray, answersArray);

      let financialContent = null;
      if (result.financialPerformance) {
        financialContent = result;
      } else if (result.financial_performance) {
        financialContent = { financialPerformance: result.financial_performance };
      } else {
        financialContent = { financialPerformance: result };
      }

      await this.saveAnalysisToBackend(financialContent, 'financialPerformance', selectedBusinessId);
      return financialContent;
    } catch (error) {
      console.error('Error generating Financial Performance analysis:', error);
      throw error;
    }
  }

  async generateFinancialBalance(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('financial-health', questionsArray, answersArray);

      let financialBalanceContent = null;
      if (result.financialBalanceInsight) {
        financialBalanceContent = result;
      } else if (result.financial_balance_insight) {
        financialBalanceContent = { financialBalanceInsight: result.financial_balance_insight };
      } else {
        financialBalanceContent = { financialBalanceInsight: result };
      }

      await this.saveAnalysisToBackend(financialBalanceContent, 'financialBalance', selectedBusinessId);
      return financialBalanceContent;
    } catch (error) {
      console.error('Error generating Financial Balance analysis:', error);
      throw error;
    }
  }

  async generateOperationalEfficiency(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('operational-efficiency', questionsArray, answersArray);

      let operationalEfficiencyContent = null;
      if (result.operationalEfficiencyInsight) {
        operationalEfficiencyContent = result;
      } else if (result.operational_efficiency_insight) {
        operationalEfficiencyContent = { operationalEfficiencyInsight: result.operational_efficiency_insight };
      } else {
        operationalEfficiencyContent = { operationalEfficiencyInsight: result };
      }

      await this.saveAnalysisToBackend(operationalEfficiencyContent, 'operationalEfficiency', selectedBusinessId);
      return operationalEfficiencyContent;
    } catch (error) {
      console.error('Error generating Operational Efficiency analysis:', error);
      throw error;
    }
  }

  // Generic Single Analysis (for standard endpoints)
  async generateSingleAnalysis(analysisType, endpoint, dataKey, questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(
        questions,
        answers,
        (q, ans) => {
          const hasAnswer = ans[q._id] && ans[q._id].trim();
          return hasAnswer;
        }
      );

      const result = await this.makeAPICall(endpoint, questionsArray, answersArray);
      let dataToSave = null;

      if (analysisType === 'capabilityHeatmap') {
        dataToSave = result.capabilities ? result : result[dataKey];
      } else if (result && result[dataKey]) {
        dataToSave = result[dataKey];
      } else {
        throw new Error(`Invalid response structure from ${analysisType} API`);
      }

      if (dataToSave) {
        await this.saveAnalysisToBackend(dataToSave, analysisType, selectedBusinessId);
        return dataToSave;
      }
    } catch (error) {
      console.error(`Error generating ${analysisType} analysis:`, error);
      throw error;
    }
  }
}