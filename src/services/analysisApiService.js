export const PHASE_API_CONFIG = {
  initial: [
    'swot',
    'purchaseCriteria',
    'loyaltyNPS',
    'porters',
    'pestel'
  ],

  essential: [
    'purchaseCriteria',
    'loyaltyNPS',
    'porters',
    'pestel',
    'fullSwot',
    'competitiveAdvantage',
    'expandedCapability',
    'strategicRadar',
    'productivityMetrics',
    'maturityScore'
  ],

  good: [
    'purchaseCriteria',
    'loyaltyNPS',
    'porters',
    'pestel',
    'fullSwot',
    'competitiveAdvantage',
    'expandedCapability',
    'strategicRadar',
    'productivityMetrics',
    'maturityScore',
    // 5 financial analyses
    'profitabilityAnalysis',
    'growthTracker',
    'liquidityEfficiency',
    'investmentPerformance',
    'leverageRisk'
  ],

  advanced: [
    'purchaseCriteria',
    'loyaltyNPS',
    'porters',
    'pestel',
    'fullSwot',
    'competitiveAdvantage',
    'expandedCapability',
    'strategicRadar',
    'productivityMetrics',
    'maturityScore',
    // 5 financial analyses
    'profitabilityAnalysis',
    'growthTracker',
    'liquidityEfficiency',
    'investmentPerformance',
    'leverageRisk'
  ]
};

// API endpoint mapping
export const API_ENDPOINTS = {
  swot: 'find',
  purchaseCriteria: 'purchase-criteria',
  loyaltyNPS: 'loyalty-metrics',
  porters: 'porter-analysis',
  pestel: 'pestel-analysis',
  fullSwot: 'full-swot-portfolio',
  competitiveAdvantage: 'competitive-advantage',
  expandedCapability: 'expanded-capability-heatmap',
  strategicRadar: 'strategic-positioning-radar',
  productivityMetrics: 'productivity-metrics',
  maturityScore: 'maturity-scoring',

  // All 5 financial analyses use the same endpoint
  profitabilityAnalysis: 'excel-analysis',
  growthTracker: 'excel-analysis',
  liquidityEfficiency: 'excel-analysis',
  investmentPerformance: 'excel-analysis',
  leverageRisk: 'excel-analysis'
};

const DEEP_SEARCH_ENDPOINTS = ['find', 'pestel-analysis', 'full-swot-portfolio', 'porter-analysis'];

export class AnalysisApiService {
  constructor(ML_API_BASE_URL, API_BASE_URL, getAuthToken, setApiLoading = null) {
    this.ML_API_BASE_URL = ML_API_BASE_URL;
    this.API_BASE_URL = API_BASE_URL;
    this.getAuthToken = getAuthToken;
    this.setApiLoading = setApiLoading;
    this.excelAnalysisCache = null; // Cache the excel-analysis result
  }

  isExcelAnalysisType(analysisType) {
    return ['profitabilityAnalysis', 'growthTracker', 'liquidityEfficiency', 'investmentPerformance', 'leverageRisk'].includes(analysisType);
  }

  requiresDeepSearch(endpoint) {
    return DEEP_SEARCH_ENDPOINTS.includes(endpoint);
  }

  // Fetch document metadata from backend
  async fetchFinancialDocument(businessId) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.warn('No auth token available for document fetch');
        return null;
      }

      const response = await fetch(`${this.API_BASE_URL}/api/businesses/${businessId}/financial-document`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn(`Financial document fetch failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const documentInfo = await response.json();

      if (!documentInfo.has_document) {
        return null;
      }

      return documentInfo.document;

    } catch (error) {
      console.error('Error fetching financial document:', error);
      return null;
    }
  }

  // Download financial document binary data
  async downloadFinancialDocument(businessId) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.warn('No auth token available for document download');
        return null;
      }

      const response = await fetch(`${this.API_BASE_URL}/api/businesses/${businessId}/financial-document/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn(`Financial document download failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const blob = await response.blob();

      return blob;

    } catch (error) {
      console.error('Error downloading financial document:', error);
      return null;
    }
  }

  // Create File object from downloaded document
  async createFileFromDocument(documentBlob, documentInfo) {
    try {
      if (!documentBlob || !documentInfo) {
        return null;
      }

      // Determine the correct MIME type based on file extension
      const getMimeType = (filename) => {
        const ext = filename.toLowerCase().split('.').pop();
        switch (ext) {
          case 'xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          case 'xls':
            return 'application/vnd.ms-excel';
          case 'csv':
            return 'text/csv';
          default:
            return 'application/octet-stream';
        }
      };

      const mimeType = getMimeType(documentInfo.filename) || documentInfo.file_type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      // Create a File object from the blob with correct MIME type
      const file = new File([documentBlob], documentInfo.filename, {
        type: mimeType,
        lastModified: new Date(documentInfo.upload_date).getTime()
      });

      return file;

    } catch (error) {
      console.error('Error creating file from document:', error);
      return null;
    }
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
    if (questionsArray.length === 0 && endpoint !== 'excel-analysis') {
      throw new Error(`No questions available for ${endpoint} analysis`);
    }

    try {
      if (this.setApiLoading) {
        this.setApiLoading(endpoint, true);
      }

      const goodPhaseEndpoints = [
        'excel-analysis'
      ];

      const isGoodPhaseAPI = goodPhaseEndpoints.includes(endpoint);

      let response;

      if (isGoodPhaseAPI) {
        const formData = new FormData();

        // Try to get financial document from backend first
        let fileToUpload = uploadedFile;
        let documentInfo = null;
        if (!fileToUpload && selectedBusinessId && endpoint === 'excel-analysis') {

          // Fetch document info
          documentInfo = await this.fetchFinancialDocument(selectedBusinessId);
          if (documentInfo) {
            // Download the actual file
            const documentBlob = await this.downloadFinancialDocument(selectedBusinessId);

            if (documentBlob) {
              // Create File object from blob
              fileToUpload = await this.createFileFromDocument(documentBlob, documentInfo);
            }
          }
        }

        if (fileToUpload) {
          formData.append('file', fileToUpload);
        } else {
          const businessInfo = `Business Information:\n${questionsArray.map((q, i) => `${q}: ${answersArray[i]}`).join('\n')}`;
          const dummyFile = new Blob([businessInfo], { type: 'text/plain' });
          formData.append('file', dummyFile, 'business_data.txt');
        }

        if (endpoint !== 'excel-analysis') {
          formData.append('questions', questionsArray.join(','));
          formData.append('answers', answersArray.join('\n'));
        }

        const headers = {
          'accept': 'application/json'
        };

        if (endpoint === 'excel-analysis') {
          headers['source'] = documentInfo?.template_type || 'simple';
          formData.append('source', documentInfo?.template_type || 'simple');
        }

        response = await fetch(`${this.ML_API_BASE_URL}/${endpoint}`, {
          method: 'POST',
          headers: headers,
          body: formData
        });
      } else { 
        const headers = {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        };
 
        if (this.requiresDeepSearch(endpoint)) {
          headers['deep_search'] = 'true';
        }

        response = await fetch(`${this.ML_API_BASE_URL}/${endpoint}`, {
          method: 'POST',
          headers: headers,
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
      if (this.setApiLoading) {
        this.setApiLoading(endpoint, false);
      }
    }
  }

  async callAnalysisEndpoint(analysisType, payload) {
    const endpoint = API_ENDPOINTS[analysisType];
    if (!endpoint) {
      throw new Error(`Unknown analysis type: ${analysisType}`);
    }

    // For excel-analysis types, use cached result or make single API call
    if (this.isExcelAnalysisType(analysisType)) {
      if (!this.excelAnalysisCache) {
        const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(
          payload.questions,
          payload.userAnswers
        );

        this.excelAnalysisCache = await this.makeAPICall(
          'excel-analysis',
          questionsArray,
          answersArray,
          payload.selectedBusinessId,
          payload.stateSetters?.uploadedFile || null
        );
      }

      // Extract specific data for each analysis type
      let processedData = null;
      switch (analysisType) {
        case 'profitabilityAnalysis':
          if (this.excelAnalysisCache.profitability) {
            processedData = { profitability: this.excelAnalysisCache.profitability };
          } else if (this.excelAnalysisCache.Profitability) {
            processedData = { profitability: this.excelAnalysisCache.Profitability };
          } else {
            processedData = this.excelAnalysisCache;
          }
          break;
        case 'growthTracker':
          if (this.excelAnalysisCache.growth_trends) {
            processedData = { growth_trends: this.excelAnalysisCache.growth_trends };
          } else if (this.excelAnalysisCache['Growth Tracker']) {
            processedData = { growthTracker: this.excelAnalysisCache['Growth Tracker'] };
          } else {
            processedData = this.excelAnalysisCache;
          }
          break;

        case 'liquidityEfficiency':
          if (this.excelAnalysisCache.liquidity) {
            processedData = { liquidity: this.excelAnalysisCache.liquidity };
          } else if (this.excelAnalysisCache['Liquidity & Efficiency']) {
            processedData = { liquidityEfficiency: this.excelAnalysisCache['Liquidity & Efficiency'] };
          } else {
            processedData = this.excelAnalysisCache;
          }
          break;

        case 'investmentPerformance':
          if (this.excelAnalysisCache.investment) {
            processedData = { investment: this.excelAnalysisCache.investment };
          } else if (this.excelAnalysisCache['Investment Performance']) {
            processedData = { investmentPerformance: this.excelAnalysisCache['Investment Performance'] };
          } else {
            processedData = this.excelAnalysisCache;
          }
          break;

        case 'leverageRisk':
          if (this.excelAnalysisCache.leverage) {
            processedData = { leverage: this.excelAnalysisCache.leverage };
          } else if (this.excelAnalysisCache['Leverage & Risk']) {
            processedData = { leverageRisk: this.excelAnalysisCache['Leverage & Risk'] };
          } else {
            processedData = this.excelAnalysisCache;
          }
          break;
      }

      return { data: processedData };
    }

    // For other analysis types, use existing logic
    const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(
      payload.questions,
      payload.userAnswers
    );

    const result = await this.makeAPICall(
      endpoint,
      questionsArray,
      answersArray,
      payload.selectedBusinessId,
      payload.stateSetters?.uploadedFile || null
    );

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
      case 'loyaltyNPS':
        processedData = result.loyalty_nps || result.loyaltyNPS || result;
        break;
      case 'expandedCapability':
        processedData = result.expandedCapabilityHeatmap ? result : { expandedCapabilityHeatmap: result.expanded_capability_heatmap || result };
        break;
      case 'strategicRadar':
        processedData = result.strategicRadar ? result : { strategicRadar: result.strategic_radar || result };
        break;
      case 'productivityMetrics':
        processedData = result.productivityMetrics ? result : { productivityMetrics: result.productivity_metrics || result };
        break;
      case 'maturityScore':
        processedData = result.maturityScore || result.maturity_score ? result : { maturityScore: result };
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

    this.clearPhaseData(phase, stateSetters);

    try {
      const { freshAnswers } = await this.getFreshConversationData(selectedBusinessId);

      const payload = {
        questions,
        userAnswers: { ...userAnswers, ...freshAnswers },
        selectedBusinessId,
        phase,
        stateSetters
      };

      // Clear cache before processing
      this.excelAnalysisCache = null;

      const results = await Promise.allSettled(
        analysisTypes.map(analysisType =>
          this.callAnalysisAPIWithSave(analysisType, payload, stateSetters, selectedBusinessId)
        )
      );

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

      if (phase === 'good' && this.excelAnalysisCache) {
        console.log('Returning excel analysis result for good phase:', this.excelAnalysisCache);
        return this.excelAnalysisCache;
      }
      return { success: true, phase };

    } catch (error) {
      console.error(`Error generating ${phase} phase analysis:`, error);
      showToastMessage(`Failed to generate ${phase} phase analyses. Please try again.`, "error");
      throw error; 
    }
  }

  async callAnalysisAPIWithSave(analysisType, payload, stateSetters, selectedBusinessId) {
    try {
      const setterName = this.getStateSetterName(analysisType);
      const setter = stateSetters[setterName];

      if (!setter) {
        console.error(`Missing setter for ${analysisType}. Expected: ${setterName}`);
        console.error('Available setters in stateSetters:', Object.keys(stateSetters));
        throw new Error(`Missing setter for ${analysisType}`);
      }

      const response = await this.callAnalysisEndpoint(analysisType, payload);
      setter(response.data);

      try {
        await this.saveAnalysisToBackend(response.data, analysisType, selectedBusinessId);
      } catch (saveError) {
        console.warn(`Failed to save ${analysisType} analysis:`, saveError);
      }

      return { analysisType, status: 'success' };
    } catch (error) {
      console.error(`Error calling ${analysisType} API:`, error);
      throw error;
    }
  }

  getStateSetterName(analysisType) {
    const setterMap = {
      swot: 'setSwotAnalysisResult',
      purchaseCriteria: 'setPurchaseCriteriaData',
      loyaltyNPS: 'setLoyaltyNPSData',
      porters: 'setPortersData',
      pestel: 'setPestelData',
      fullSwot: 'setFullSwotData',
      competitiveAdvantage: 'setCompetitiveAdvantageData',
      expandedCapability: 'setExpandedCapabilityData',
      strategicRadar: 'setStrategicRadarData',
      productivityMetrics: 'setProductivityData',
      maturityScore: 'setMaturityData',

      // 5 financial analysis setters
      profitabilityAnalysis: 'setProfitabilityData',
      growthTracker: 'setGrowthTrackerData',
      liquidityEfficiency: 'setLiquidityEfficiencyData',
      investmentPerformance: 'setInvestmentPerformanceData',
      leverageRisk: 'setLeverageRiskData'
    };
    return setterMap[analysisType];
  }

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

  async saveAnalysisToBackend(analysisData, analysisType, selectedBusinessId) {
    try {
      const token = this.getAuthToken();

      const analysisPhaseMap = {
        'swot': 'initial',
        'purchaseCriteria': 'initial',
        'loyaltyNPS': 'initial',
        'porters': 'initial',
        'pestel': 'initial',
        'fullSwot': 'essential',
        'competitiveAdvantage': 'essential',
        'expandedCapability': 'essential',
        'strategicRadar': 'essential',
        'productivityMetrics': 'essential',
        'maturityScore': 'essential',

        // 5 financial analysis types
        'profitabilityAnalysis': 'good',
        'growthTracker': 'good',
        'liquidityEfficiency': 'good',
        'investmentPerformance': 'good',
        'leverageRisk': 'good'
      };

      const displayNames = {
        'profitabilityAnalysis': 'Profitability Analysis',
        'growthTracker': 'Growth Tracker',
        'liquidityEfficiency': 'Liquidity & Efficiency',
        'investmentPerformance': 'Investment Performance',
        'leverageRisk': 'Leverage & Risk',
        'swot': 'SWOT Analysis',
        'purchaseCriteria': 'Purchase Criteria',
        'loyaltyNPS': 'Loyalty & NPS',
        'porters': "Porter's Five Forces",
        'pestel': 'PESTEL Analysis',
        'fullSwot': 'Full SWOT Portfolio',
        'competitiveAdvantage': 'Competitive Advantage',
        'expandedCapability': 'Capability Heatmap',
        'strategicRadar': 'Strategic Positioning Radar',
        'productivityMetrics': 'Productivity Metrics',
        'maturityScore': 'Maturity Score'
      };

      const phase = analysisPhaseMap[analysisType] || 'initial';
      const displayName = displayNames[analysisType] || `${analysisType.toUpperCase()} Analysis`;

      const response = await fetch(`${this.API_BASE_URL}/api/conversations/phase-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phase: phase,
          analysis_type: analysisType,
          analysis_name: displayName,
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

  createSimpleRegenerationHandler(analysisType, questions, userAnswers, selectedBusinessId, stateSetters, showToastMessage) {
    return async () => {
      try {
        showToastMessage(`Regenerating ${analysisType}...`, "info");

        const setterName = this.getStateSetterName(analysisType);
        const setter = stateSetters[setterName];
        if (setter) {
          setter(null);
        }

        // Clear cache if regenerating any excel-analysis type
        if (this.isExcelAnalysisType(analysisType)) {
          this.excelAnalysisCache = null;
        }

        const { freshAnswers } = await this.getFreshConversationData(selectedBusinessId);

        const payload = {
          questions,
          userAnswers: { ...userAnswers, ...freshAnswers },
          selectedBusinessId,
          stateSetters
        };

        const response = await this.callAnalysisEndpoint(analysisType, payload);

        if (setter) {
          setter(response.data);
        }

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

  // Individual analysis methods - Active ones only

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

  async generatePurchaseCriteria(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('purchase-criteria', questionsArray, answersArray);
      const criteriaData = result.purchase_criteria || result.purchaseCriteria || result;
      await this.saveAnalysisToBackend(criteriaData, 'purchaseCriteria', selectedBusinessId);
      return criteriaData;
    } catch (error) {
      console.error('Error generating Purchase Criteria analysis:', error);
      throw error;
    }
  }

  async generateLoyaltyNPS(questions, answers, selectedBusinessId) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('loyalty-metrics', questionsArray, answersArray);
      const loyaltyData = result.loyalty_nps || result.loyaltyNPS || result;
      await this.saveAnalysisToBackend(loyaltyData, 'loyaltyNPS', selectedBusinessId);
      return loyaltyData;
    } catch (error) {
      console.error('Error generating Loyalty NPS analysis:', error);
      throw error;
    }
  }

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
      console.error('Error generating Capability Heatmap:', error);
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

  // Financial analysis methods with automatic document fetching
  async generateProfitabilityAnalysis(questions, answers, selectedBusinessId, uploadedFile = null) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('excel-analysis', questionsArray, answersArray, selectedBusinessId, uploadedFile);

      const profitabilityData = { profitability: result.profitability };
      await this.saveAnalysisToBackend(profitabilityData, 'profitabilityAnalysis', selectedBusinessId);
      return profitabilityData;
    } catch (error) {
      console.error('Error generating Profitability Analysis:', error);
      throw error;
    }
  }

  async generateGrowthTracker(questions, answers, selectedBusinessId, uploadedFile = null) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('excel-analysis', questionsArray, answersArray, selectedBusinessId, uploadedFile);

      const growthData = { growth_trends: result.growth_trends };
      await this.saveAnalysisToBackend(growthData, 'growthTracker', selectedBusinessId);
      return growthData;
    } catch (error) {
      console.error('Error generating Growth Tracker:', error);
      throw error;
    }
  }

  async generateLiquidityEfficiency(questions, answers, selectedBusinessId, uploadedFile = null) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('excel-analysis', questionsArray, answersArray, selectedBusinessId, uploadedFile);

      const liquidityData = { liquidity: result.liquidity };
      await this.saveAnalysisToBackend(liquidityData, 'liquidityEfficiency', selectedBusinessId);
      return liquidityData;
    } catch (error) {
      console.error('Error generating Liquidity & Efficiency:', error);
      throw error;
    }
  }

  async generateInvestmentPerformance(questions, answers, selectedBusinessId, uploadedFile = null) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('excel-analysis', questionsArray, answersArray, selectedBusinessId, uploadedFile);

      const investmentData = { investment: result.investment};
      await this.saveAnalysisToBackend(investmentData, 'investmentPerformance', selectedBusinessId);
      return investmentData;
    } catch (error) {
      console.error('Error generating Investment Performance:', error);
      throw error;
    }
  }

  async generateLeverageRisk(questions, answers, selectedBusinessId, uploadedFile = null) {
    try {
      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(questions, answers);
      const result = await this.makeAPICall('excel-analysis', questionsArray, answersArray, selectedBusinessId, uploadedFile);

      const leverageData = { leverage: result.leverage};
      await this.saveAnalysisToBackend(leverageData, 'leverageRisk', selectedBusinessId);
      return leverageData;
    } catch (error) {
      console.error('Error generating Leverage & Risk:', error);
      throw error;
    }
  }
}