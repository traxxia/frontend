import { AnalysisService } from './analysisService';
import { BusinessService } from './BusinessService';
import { ProjectService } from './ProjectService';
import { PmfService } from './PmfService';
import { MlApiService } from './MlApiService';

export const PHASE_API_CONFIG = {
  initial: [
    'swot',
    'porters',
    'pestel'
  ],

  essential: [
    'fullSwot',
    'porters',
    'pestel',
    'competitiveAdvantage',
    'expandedCapability',
    'strategicRadar',
    'productivityMetrics',
    'maturityScore',
    'competitiveLandscape',
    'coreAdjacency'
  ],

  advanced: [
    'fullSwot',
    'porters',
    'pestel',
    'competitiveAdvantage',
    'expandedCapability',
    'strategicRadar',
    'productivityMetrics',
    'maturityScore',
    'competitiveLandscape',
    'coreAdjacency'
  ],
  financial: [
    'profitabilityAnalysis',
    'growthTracker',
    'liquidityEfficiency',
    'investmentPerformance',
    'leverageRisk'
  ]
};
export const API_ENDPOINTS = {
  swot: 'find',
  fullSwot: 'full-swot-portfolio',
  porters: 'porter-analysis',
  pestel: 'pestel-analysis',
  competitiveAdvantage: 'competitive-advantage',
  expandedCapability: 'expanded-capability-heatmap',
  strategicRadar: 'strategic-positioning-radar',
  productivityMetrics: 'productivity-metrics',
  maturityScore: 'maturity-scoring',
  competitiveLandscape: 'simple-swot-portfolio',
  coreAdjacency: 'core-adjacency-matrix',
  strategic: 'strategic-analysis',

  profitabilityAnalysis: 'insights/profitability',
  growthTracker: 'insights/growth',
  liquidityEfficiency: 'insights/liquidity',
  investmentPerformance: 'insights/investment',
  leverageRisk: 'insights/leverage',
  ahaInsight: 'aha-insight',
  executiveSummary: 'executive-summary',
  answerQuestionsWithEnrichment: 'answer-questions-with-enrichment'
};
const EXCEL_ANALYSIS_METRIC_TYPES = {
  profitabilityAnalysis: 'profitability',
  growthTracker: 'growth_trends',
  liquidityEfficiency: 'liquidity',
  investmentPerformance: 'investment',
  leverageRisk: 'leverage'
};

const DEEP_SEARCH_ENDPOINTS = ['find', 'pestel-analysis', 'full-swot-portfolio', 'porter-analysis'];
const kickstartRequestCache = new Map();
const pmfAnalysisCache = new Map();
const pmfExecutiveSummaryCache = new Map();
const analysisDataCache = new Map();
const projectsCache = new Map();
const strategicDocsCache = new Map();

export class AnalysisApiService {
  constructor(ML_API_BASE_URL, API_BASE_URL, getAuthToken, setApiLoading = null) {
    const backendUrl = (API_BASE_URL && API_BASE_URL !== 'undefined') ? API_BASE_URL : (import.meta.env.VITE_BACKEND_URL || '');
    const mlUrl = (ML_API_BASE_URL && ML_API_BASE_URL !== 'undefined') ? ML_API_BASE_URL : (import.meta.env.VITE_ML_BACKEND_URL || '');

    this.businessService = new BusinessService(backendUrl);
    this.projectService = new ProjectService(backendUrl);
    this.pmfService = new PmfService(backendUrl);
    this.mlService = new MlApiService(mlUrl);

    this.ML_API_BASE_URL = mlUrl;
    this.API_BASE_URL = backendUrl;
    this.getAuthToken = getAuthToken;
    this.setApiLoading = setApiLoading;
    this.excelAnalysisCache = null;
  }

  async fetchAnalysisDataThroughBackend(businessId, forceRefresh = false) {
    if (!businessId) return [];

    const cacheKey = `analysis-${businessId}`;
    if (!forceRefresh && analysisDataCache.has(cacheKey)) {
      return await analysisDataCache.get(cacheKey);
    }

    const fetchPromise = (async () => {
      try {
        const token = this.getAuthToken();
        if (!token) return [];
        return await AnalysisService.getAnalysis(this.API_BASE_URL, token, businessId, forceRefresh);
      } catch (error) {
        analysisDataCache.delete(cacheKey);
        throw error;
      }
    })();

    analysisDataCache.set(cacheKey, fetchPromise);
    return fetchPromise;
  }
  async savePMFOnboardingData(businessId, onboardingData) {
    const res = await this.pmfService.savePMFOnboardingData(businessId, onboardingData);
    pmfAnalysisCache.delete(`pmf-${businessId}`);
    return res;
  }

  async getPMFAnalysis(businessId, forceRefresh = false) {
    if (!businessId) return null;
    const cacheKey = `pmf-${businessId}`;
    if (!forceRefresh && pmfAnalysisCache.has(cacheKey)) return await pmfAnalysisCache.get(cacheKey);

    const promise = (async () => {
      try {
        return await this.pmfService.getPMFAnalysis(businessId, forceRefresh);
      } catch (err) {
        pmfAnalysisCache.delete(cacheKey);
        throw err;
      }
    })();
    pmfAnalysisCache.set(cacheKey, promise);
    return promise;
  }

  async savePMFExecutiveSummary(businessId, summary) {
    const res = await this.pmfService.savePMFExecutiveSummary(businessId, summary);
    pmfExecutiveSummaryCache.delete(`exec-${businessId}`);
    pmfAnalysisCache.delete(`pmf-${businessId}`);
    return res;
  }

  async getPMFExecutiveSummary(businessId) {
    if (!businessId) return null;
    const cacheKey = `exec-${businessId}`;
    if (pmfExecutiveSummaryCache.has(cacheKey)) return await pmfExecutiveSummaryCache.get(cacheKey);

    const promise = (async () => {
      try {
        return await this.pmfService.getPMFExecutiveSummary(businessId);
      } catch (err) {
        pmfExecutiveSummaryCache.delete(cacheKey);
        throw err;
      }
    })();
    pmfExecutiveSummaryCache.set(cacheKey, promise);
    return promise;
  }

  async getProjects(businessId) {
    if (!businessId) return [];
    const cacheKey = `projects-${businessId}`;
    if (projectsCache.has(cacheKey)) return await projectsCache.get(cacheKey);

    const promise = (async () => {
      try {
        return await this.projectService.getProjects(businessId);
      } catch (err) {
        projectsCache.delete(cacheKey);
        throw err;
      }
    })();
    projectsCache.set(cacheKey, promise);
    return promise;
  }

  async savePMFInsights(businessId, insights) {
    const res = await this.pmfService.savePMFInsights(businessId, insights);
    pmfAnalysisCache.delete(`pmf-${businessId}`);
    return res;
  }

  async getKickstartData(businessId, forceRefresh = false) {
    if (!businessId) return null;

    const cacheKey = `kickstart-${businessId}`;
    if (!forceRefresh && kickstartRequestCache.has(cacheKey)) {
      return await kickstartRequestCache.get(cacheKey);
    }
    if (kickstartRequestCache.has(cacheKey)) {
      return await kickstartRequestCache.get(cacheKey);
    }

    const fetchPromise = (async () => {
      try {
        const token = this.getAuthToken();
        const response = await fetch(`${this.API_BASE_URL}/api/pmf/kickstart/${businessId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.status === 404) return null;
        return await response.json();
      } catch (error) {
        console.error('Error fetching kickstart data:', error);
        throw error;
      }
    })();

    kickstartRequestCache.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async kickstartProject(payload) {
    return this.projectService.kickstartProject(payload);
  }

  async getBusiness(businessId) {
    return this.businessService.getBusiness(businessId);
  }

  async getEligibleOwners(businessId) {
    return this.businessService.getEligibleOwners(businessId);
  }

  isExcelAnalysisType(analysisType) {
    return ['profitabilityAnalysis', 'growthTracker', 'liquidityEfficiency', 'investmentPerformance', 'leverageRisk'].includes(analysisType);
  }

  requiresDeepSearch(endpoint) {
    return DEEP_SEARCH_ENDPOINTS.includes(endpoint);
  }
  // Fetch the spreadsheet document info from strategic documents list (replaces obsolete /financial-document GET)
  async fetchFinancialDocument(businessId) {
    if (!businessId) return null;
    const cacheKey = `strategic-docs-${businessId}`;
    if (strategicDocsCache.has(cacheKey)) {
      const docs = await strategicDocsCache.get(cacheKey);
      return this._findSpreadsheetDoc(docs);
    }

    const promise = (async () => {
      try {
        const token = this.getAuthToken();
        const response = await fetch(`${this.API_BASE_URL}/api/businesses/${businessId}/strategic-documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.documents || [];
      } catch (err) {
        strategicDocsCache.delete(cacheKey);
        return [];
      }
    })();

    strategicDocsCache.set(cacheKey, promise);
    const docs = await promise;
    return this._findSpreadsheetDoc(docs);
  }

  _findSpreadsheetDoc(docs) {
    if (!Array.isArray(docs)) return null;
    const spreadsheet = docs.find(doc => {
      const ext = (doc.original_name || '').toLowerCase().split('.').pop();
      return ['xlsx', 'xls', 'csv'].includes(ext);
    });
    if (!spreadsheet) return null;
    return {
      filename: spreadsheet.filename,
      original_name: spreadsheet.original_name,
      file_size: spreadsheet.file_size,
      upload_date: spreadsheet.upload_date,
      has_document: true,
      template_type: 'simple'
    };
  }

  // Download a spreadsheet via the strategic-document download endpoint (replaces obsolete /financial-document/download GET)
  async downloadFinancialDocument(businessId) {
    if (!businessId) return null;
    const docInfo = await this.fetchFinancialDocument(businessId);
    if (!docInfo || !docInfo.filename) return null;
    const token = this.getAuthToken();
    const response = await fetch(
      `${this.API_BASE_URL}/api/businesses/${businessId}/strategic-document/${encodeURIComponent(docInfo.filename)}/download`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error(`Failed to download spreadsheet: ${response.statusText}`);
    return await response.blob();
  }

  clearFinancialCache(businessId) {
    if (businessId) {
      strategicDocsCache.delete(`strategic-docs-${businessId}`);
    } else {
      strategicDocsCache.clear();
    }
  }
  async createFileFromDocument(documentBlob, documentInfo) {
    try {
      if (!documentBlob || !documentInfo) {
        return null;
      }
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

  async bulkUpdateConversations(businessId, answers) {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${this.API_BASE_URL}/api/conversations/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ business_id: businessId, answers })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to bulk update conversations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in bulkUpdateConversations:', error);
      throw error;
    }
  }
  prepareQuestionsAndAnswers(questions, answers, filterFn = null) {
    const questionsArray = [];
    const answersArray = [];

    questions
      .filter(q => {
        const qId = q._id || q.id || q.question_id;
        if (filterFn) return filterFn(q, answers);
        return answers[qId] && answers[qId].trim();
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(question => {
        const qId = question._id || question.id || question.question_id;
        questionsArray.push(question.question_text);
        answersArray.push(answers[qId]);
      });

    return { questionsArray, answersArray };
  }

  async makeAPICall(
    endpoint,
    questionsArray,
    answersArray,
    selectedBusinessId = null,
    uploadedFile = null,
    metricType = null,
    onStreamChunk = null,
    companyName = null,
    rawPayload = null,
    loadingKey = null,
    analysisType = null
  ) {
    if (!rawPayload && (!questionsArray || questionsArray.length === 0) && endpoint !== 'excel-analysis' && !endpoint.startsWith('insights/')) {
      throw new Error(`No questions available for ${endpoint} analysis`);
    }

    try {
      if (this.setApiLoading) {
        this.setApiLoading(loadingKey || endpoint, true);
      }

      const isExcelAnalysis = endpoint === 'excel-analysis';
      const stage = analysisType || (isExcelAnalysis ? metricType : endpoint);
      const obsHeaders = {};
      try {
        const authState = JSON.parse(
          sessionStorage.getItem('auth-storage') || localStorage.getItem('auth-storage') || '{}'
        );
        const isObservatory = authState?.state?.isObservatory === true;
        obsHeaders['x-is-observatory'] = isObservatory ? 'true' : 'false';

        if (selectedBusinessId) {
          obsHeaders['X-Business-Id'] = selectedBusinessId;
        }

        if (isObservatory) {
          if (stage) {
            obsHeaders['x-stage'] = stage;
          }
          obsHeaders['x-request-timestamp'] = new Date().toISOString();
        }
      } catch (_) { }

      let response;
      if (isExcelAnalysis) {
        const formData = new FormData();

        let fileToUpload = uploadedFile;
        let documentInfo = null;

        // If no in-memory file provided, retrieve the spreadsheet from the strategic documents store
        if (!fileToUpload && selectedBusinessId) {
          documentInfo = await this.fetchFinancialDocument(selectedBusinessId);
          if (documentInfo) {
            const documentBlob = await this.downloadFinancialDocument(selectedBusinessId);
            if (documentBlob) {
              fileToUpload = await this.createFileFromDocument(documentBlob, documentInfo);
            }
          }
        } else if (fileToUpload && selectedBusinessId) {
          // Fetch metadata for template_type only (no separate download needed)
          documentInfo = await this.fetchFinancialDocument(selectedBusinessId);
        }

        if (fileToUpload) {
          formData.append('file', fileToUpload);
        } else {
          const businessInfo = `Business Information:\n${questionsArray.map((q, i) => `${q}: ${answersArray[i]}`).join('\n')}`;
          const dummyFile = new Blob([businessInfo], { type: 'text/plain' });
          formData.append('file', dummyFile, 'business_data.txt');
        }
        if (documentInfo?.template_type) {
          formData.append('source', documentInfo.template_type);
        }
        let url = `${this.ML_API_BASE_URL}/excel-analysis`;
        const params = new URLSearchParams();
        if (metricType) {
          params.append('metric_type', metricType);
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        response = await fetch(url, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'source': documentInfo?.template_type || 'simple',
            ...obsHeaders
          },
          body: formData
        });
      } else if (endpoint && endpoint.startsWith('insights/')) {
        const headers = {
          'Accept': 'application/json',
          ...obsHeaders
        };
        response = await fetch(`${this.ML_API_BASE_URL}/${endpoint}`, {
          method: 'POST',
          headers
        });
      } else {
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...obsHeaders
        };

        if (this.requiresDeepSearch(endpoint)) {
          headers['deep_search'] = 'true';
        }
        const payload = rawPayload || {
          questions: questionsArray,
          answers: answersArray,
        };

        response = await fetch(`${this.ML_API_BASE_URL}/${endpoint}?stream=true`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${endpoint} API returned ${response.status}: ${errorText}`);
      }
      if (response.body && onStreamChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            onStreamChunk(buffer);
          }
          done = readerDone;
        }
        try {
          const jsonStart = buffer.indexOf('{');
          const jsonEnd = buffer.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonString = buffer.slice(jsonStart, jsonEnd + 1);
            return JSON.parse(jsonString);
          }
        } catch (err) {
          console.warn('Error parsing JSON stream:', err);
        }
        return { raw: buffer };
      }
      return await response.json();
    } finally {
      if (this.setApiLoading) {
        this.setApiLoading(loadingKey || endpoint, false);
      }
    }
  }

  async handlePhaseCompletion(
    phase,
    questions,
    userAnswers,
    selectedBusinessId,
    stateSetters,
    showToastMessage
  ) {
    const analysisTypes = PHASE_API_CONFIG[phase];

    if (!analysisTypes) {
      console.error(`Unknown phase: ${phase}`);
      return;
    }

    this.clearPhaseData(phase, stateSetters);

    try {
      const { freshAnswers } = await this.getFreshAnswersData(selectedBusinessId);

      const status = { completed: 0 };
      const total = analysisTypes.length;
      const results = [];

      const processItem = (analysisType) => {
        const displayName = this.getDisplayName(analysisType);

        // Pass freshAnswers into generateAnalysis to avoid redundant fetching
        return this.generateAnalysis(analysisType, questions, userAnswers, selectedBusinessId, { freshAnswers })
          .then((res) => {
            status.completed++;
            stateSetters.setRegenerating?.(analysisType, false);

            const setterName = this.getStateSetterName(analysisType);
            if (stateSetters[setterName]) {
              stateSetters[setterName](res);
            }

            showToastMessage(
              `${status.completed}/${total} analyses — "${displayName}" completed successfully`,
              "info",
              { duration: 5000 }
            );

            return { status: "fulfilled", analysisType, value: res };
          })
          .catch((err) => {
            status.completed++;
            stateSetters.setRegenerating?.(analysisType, false);

            console.error(`Error with ${analysisType} analysis:`, err);
            showToastMessage(
              `${status.completed}/${total} ${phase} phase analyses — "${displayName}" failed`,
              "warning",
              { duration: 5000 }
            );

            return { status: "rejected", analysisType, reason: err };
          });
      };
      const batchSize = 2;
      for (let i = 0; i < analysisTypes.length; i += batchSize) {
        const batch = analysisTypes.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processItem));
        results.push(...batchResults);
      }

      return { success: true, phase, results };
    } catch (error) {
      console.error(`Error generating ${phase} phase analysis:`, error);

      showToastMessage(
        `Failed to generate ${phase} phase analyses. Please try again.`,
        "error",
        { duration: 4000 }
      );

      throw error;
    }
  }

  async handleCustomTypesCompletion(
    types,
    questions,
    userAnswers,
    selectedBusinessId,
    stateSetters,
    showToastMessage
  ) {
    if (!types || types.length === 0) return;

    // Clear existing data for these types
    types.forEach(analysisType => {
      const setterName = this.getStateSetterName(analysisType);
      const setter = stateSetters[setterName];
      if (setter) setter(null);
    });

    try {
      const { freshAnswers } = await this.getFreshAnswersData(selectedBusinessId);

      const status = { completed: 0 };
      const total = types.length;
      const results = [];

      const processItem = (analysisType) => {
        const displayName = this.getDisplayName(analysisType);

        // Pass freshAnswers into generateAnalysis to avoid redundant fetching
        return this.generateAnalysis(analysisType, questions, userAnswers, selectedBusinessId, { freshAnswers })
          .then((res) => {
            status.completed++;
            stateSetters.setRegenerating?.(analysisType, false);

            // Map the result back to the store using the stateSetters
            const setterName = this.getStateSetterName(analysisType);
            if (stateSetters[setterName]) {
              stateSetters[setterName](res);
            }

            showToastMessage(
              `${status.completed}/${total} analyses — "${displayName}" completed successfully`,
              "info",
              { duration: 5000 }
            );

            return { status: "fulfilled", analysisType, value: res };
          })
          .catch((err) => {
            status.completed++;
            stateSetters.setRegenerating?.(analysisType, false);

            console.error(`Error with ${analysisType} analysis:`, err);
            showToastMessage(
              `${status.completed}/${total} analyses — "${displayName}" failed`,
              "warning",
              { duration: 5000 }
            );

            return { status: "rejected", analysisType, reason: err };
          });
      };

      const batchSize = 2;
      for (let i = 0; i < types.length; i += batchSize) {
        const batch = types.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processItem));
        results.push(...batchResults);
      }

      return { success: true, results };
    } catch (error) {
      console.error(`Error in handleCustomTypesCompletion:`, error);
      showToastMessage(
        `Failed to generate some analyses. Please try again.`,
        "error",
        { duration: 4000 }
      );
      throw error;
    }
  }

  getDisplayName(analysisType) {
    const displayNames = {
      profitabilityAnalysis: "Profitability Analysis",
      growthTracker: "Growth Tracker",
      liquidityEfficiency: "Liquidity & Efficiency",
      investmentPerformance: "Investment Performance",
      leverageRisk: "Leverage & Risk",
      swot: "SWOT Analysis",
      porters: "Porter's Five Forces",
      pestel: "PESTEL Analysis",
      fullSwot: "Full SWOT Portfolio",
      competitiveAdvantage: "Competitive Advantage",
      expandedCapability: "Capability Heatmap",
      strategicRadar: "Strategic Positioning Radar",
      productivityMetrics: "Productivity Metrics",
      maturityScore: "Maturity Score",
      competitiveLandscape: "Competitive Landscape",
      coreAdjacency: "Core",
    };

    return displayNames[analysisType] || analysisType;
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
      porters: 'setPortersData',
      pestel: 'setPestelData',
      fullSwot: 'setFullSwotData',
      competitiveAdvantage: 'setCompetitiveAdvantageData',
      expandedCapability: 'setExpandedCapabilityData',
      strategicRadar: 'setStrategicRadarData',
      productivityMetrics: 'setProductivityData',
      maturityScore: 'setMaturityData',
      competitiveLandscape: 'setCompetitiveLandscapeData',
      coreAdjacency: 'setCoreAdjacencyData',
      profitabilityAnalysis: 'setProfitabilityData',
      growthTracker: 'setGrowthTrackerData',
      liquidityEfficiency: 'setLiquidityEfficiencyData',
      investmentPerformance: 'setInvestmentPerformanceData',
      leverageRisk: 'setLeverageRiskData',
      strategic: 'setStrategicData'
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
        'porters': 'initial',
        'pestel': 'initial',
        'fullSwot': 'essential',
        'competitiveAdvantage': 'essential',
        'expandedCapability': 'essential',
        'strategicRadar': 'essential',
        'productivityMetrics': 'essential',
        'maturityScore': 'essential',
        'competitiveLandscape': 'essential',
        'coreAdjacency': 'essential',
        'leverageRisk': 'good',
        'strategic': 'advanced'
      };

      const displayNames = {
        'profitabilityAnalysis': 'Profitability Analysis',
        'growthTracker': 'Growth Tracker',
        'liquidityEfficiency': 'Liquidity & Efficiency',
        'investmentPerformance': 'Investment Performance',
        'leverageRisk': 'Leverage & Risk',
        'swot': 'SWOT Analysis',
        'porters': "Porter's Five Forces",
        'pestel': 'PESTEL Analysis',
        'fullSwot': 'Full SWOT Portfolio',
        'competitiveAdvantage': 'Competitive Advantage',
        'expandedCapability': 'Capability Heatmap',
        'strategicRadar': 'Strategic Positioning Radar',
        'productivityMetrics': 'Productivity Metrics',
        'maturityScore': 'Maturity Score',
        'competitiveLandscape': 'Competitive Landscape',
        'coreAdjacency': 'Core'
      };

      const phase = analysisPhaseMap[analysisType] || 'initial';
      const displayName = displayNames[analysisType] || `${analysisType.toUpperCase()} Analysis`;

      const analysisPayload = {
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
      };

      await AnalysisService.upsertAnalysis(this.API_BASE_URL, token, analysisPayload);
      analysisDataCache.delete(`analysis-${selectedBusinessId}`);

      return true;
    } catch (error) {
      console.error(`Error saving ${analysisType} analysis:`, error);
      return false;
    }
  }

  createSimpleRegenerationHandler(
    analysisType,
    questions,
    userAnswers,
    selectedBusinessId,
    stateSetters,
    showToastMessage,
    streamingCallbacks = {}
  ) {
    return async () => {
      try {
        showToastMessage(`Regenerating ${analysisType}...`, "info");

        const setterName = this.getStateSetterName(analysisType);
        const setter = stateSetters[setterName];
        if (setter) {
          setter(null);
        }
        if (analysisType === 'porters' && streamingCallbacks.setIsStreaming && streamingCallbacks.setStreamingText) {
          streamingCallbacks.setIsStreaming(true);
          streamingCallbacks.setStreamingText('');
        }
        if (this.isExcelAnalysisType(analysisType)) {
          this.excelAnalysisCache = null;
        }

        const { freshAnswers } = await this.getFreshAnswersData(selectedBusinessId);

        const payload = {
          questions,
          userAnswers: { ...userAnswers, ...freshAnswers },
          selectedBusinessId,
          stateSetters
        };
        const onStreamChunk = (analysisType === 'porters' && streamingCallbacks.setStreamingText)
          ? (buffer) => {
            streamingCallbacks.setStreamingText(buffer);
          }
          : null;
        const response = await this.callAnalysisEndpointWithStreaming(
          analysisType,
          payload,
          onStreamChunk
        );

        if (setter) {
          setter(response.data);
        }

        await this.saveAnalysisToBackend(response.data, analysisType, selectedBusinessId);
        if (analysisType === 'porters' && streamingCallbacks.setIsStreaming) {
          streamingCallbacks.setIsStreaming(false);
        }

        showToastMessage(`${analysisType} regenerated successfully!`, "success");
      } catch (error) {
        console.error(`Error regenerating ${analysisType}:`, error);
        if (analysisType === 'porters' && streamingCallbacks.setIsStreaming) {
          streamingCallbacks.setIsStreaming(false);
        }

        showToastMessage(`Failed to regenerate ${analysisType}.`, "error");
      }
    };
  }

  async callAnalysisEndpoint(analysisType, payload) {
    const performCall = async (isRetry = false) => {
      try {
        const endpoint = API_ENDPOINTS[analysisType];
        if (!endpoint) {
          console.error(`Unknown analysis type: ${analysisType}`);
          throw new Error(`Unknown analysis type: ${analysisType}`);
        }
        const methodNameMap = {
          swot: 'generateSWOTAnalysis',
          porters: 'generatePortersAnalysis',
          pestel: 'generatePestelAnalysis',
          fullSwot: 'generateFullSwotPortfolio',
          competitiveAdvantage: 'generateCompetitiveAdvantage',
          expandedCapability: 'generateExpandedCapability',
          strategicRadar: 'generateStrategicRadar',
          productivityMetrics: 'generateProductivityMetrics',
          maturityScore: 'generateMaturityScore',
          competitiveLandscape: 'generateCompetitiveLandscape',
          coreAdjacency: 'generateCoreAdjacency',
          profitabilityAnalysis: 'generateProfitabilityAnalysis',
          growthTracker: 'generateGrowthTracker',
          liquidityEfficiency: 'generateLiquidityEfficiency',
          investmentPerformance: 'generateInvestmentPerformance',
          leverageRisk: 'generateLeverageRisk',
          strategic: 'generateStrategicAnalysis'
        };

        const methodName = methodNameMap[analysisType];
        if (methodName && typeof this[methodName] === 'function') {
          let result;
          if (this.isExcelAnalysisType(analysisType)) {
            result = await this[methodName](
              payload.questions,
              payload.userAnswers,
              payload.selectedBusinessId,
              payload.stateSetters?.uploadedFile || null
            );
          } else {
            result = await this[methodName](
              payload.questions,
              payload.userAnswers,
              payload.selectedBusinessId
            );
          }
          return { data: result };
        }
        const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(
          payload.questions,
          payload.userAnswers
        );

        const result = await this.makeAPICall(
          endpoint,
          questionsArray,
          answersArray,
          payload.selectedBusinessId
        );

        return { data: result };
      } catch (error) {
        if (!isRetry) {
          console.warn(`Analysis ${analysisType} failed, retrying once...`, error);
          await new Promise(resolve => setTimeout(resolve, 1500));
          return await performCall(true);
        }
        throw error;
      }
    };

    return await performCall();
  }

  async callAnalysisEndpointWithStreaming(analysisType, payload, onStreamChunk = null) {
    const performCall = async (isRetry = false) => {
      try {
        const endpoint = API_ENDPOINTS[analysisType];
        if (!endpoint) {
          console.error(`Unknown analysis type: ${analysisType}`);
          throw new Error(`Unknown analysis type: ${analysisType}`);
        }
        if (this.isExcelAnalysisType(analysisType)) {
          const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(
            payload.questions,
            payload.userAnswers
          );

          const metricType = EXCEL_ANALYSIS_METRIC_TYPES[analysisType];
          const loadingKey = `excel-analysis-${metricType?.replace('_trends', '')}`;

          const result = await this.makeAPICall(
            endpoint,
            questionsArray,
            answersArray,
            payload.selectedBusinessId,
            payload.stateSetters?.uploadedFile || null,
            metricType,
            onStreamChunk,
            null,
            null,
            loadingKey,
            analysisType
          );

          return { data: result };
        }
        const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(
          payload.questions,
          payload.userAnswers
        );

        const result = await this.makeAPICall(
          endpoint,
          questionsArray,
          answersArray,
          payload.selectedBusinessId,
          null,
          null,
          onStreamChunk,
          null,
          null,
          null,
          analysisType
        );

        return { data: result };
      } catch (error) {
        if (!isRetry) {
          console.warn(`Analysis ${analysisType} failed, retrying once...`, error);
          await new Promise(resolve => setTimeout(resolve, 1500));
          return await performCall(true);
        }
        throw error;
      }
    };

    return await performCall();
  }
  async generateAnalysis(analysisType, questions, answers, selectedBusinessId, options = {}) {
    const { uploadedFile = null, onStreamChunk = null, forceRefresh = false } = options;

    try {
      const endpoint = API_ENDPOINTS[analysisType];
      if (!endpoint) throw new Error(`Unknown analysis type: ${analysisType}`);

      // 1. Prepare Data
      let freshAnswers = options.freshAnswers;
      if (!freshAnswers && selectedBusinessId) {
        const freshData = await this.getFreshAnswersData(selectedBusinessId);
        freshAnswers = freshData.freshAnswers;
      }
      const combinedAnswers = { ...answers, ...freshAnswers };

      const { questionsArray, answersArray } = this.prepareQuestionsAndAnswers(
        questions,
        combinedAnswers,
        analysisType === 'fullSwot' ? (q, ans) => ans[q._id] && ans[q._id].trim() !== '' : null
      );

      // 2. API Call
      let result;
      if (this.isExcelAnalysisType(analysisType)) {
        const metricType = EXCEL_ANALYSIS_METRIC_TYPES[analysisType];
        const loadingKey = `excel-analysis-${metricType?.replace('_trends', '')}`;
        result = await this.makeAPICall(
          endpoint,
          questionsArray,
          answersArray,
          selectedBusinessId,
          uploadedFile,
          metricType,
          onStreamChunk,
          null,
          null,
          loadingKey,
          analysisType
        );
      } else {
        result = await this.makeAPICall(
          endpoint,
          questionsArray,
          answersArray,
          selectedBusinessId,
          null,
          null,
          onStreamChunk,
          null,
          null,
          null,
          analysisType
        );
      }

      // 3. Post-processing
      let processedResult = result;
      if (analysisType === 'swot') {
        processedResult = typeof result === 'string' ? result : JSON.stringify(result);
      } else if (analysisType === 'strategic') {
        processedResult = result.strategic_analysis || result.strategic || result;
      } else if (analysisType === 'porters') {
        processedResult = result.porters_analysis || result.porters || result;
      } else if (analysisType === 'expandedCapability') {
        processedResult = result.expandedCapabilityHeatmap ? result : (result.expanded_capability_heatmap ? { expandedCapabilityHeatmap: result.expanded_capability_heatmap } : { expandedCapabilityHeatmap: result });
      } else if (analysisType === 'strategicRadar') {
        processedResult = result.strategicRadar ? result : (result.strategic_radar ? { strategicRadar: result.strategic_radar } : { strategicRadar: result });
      } else if (analysisType === 'productivityMetrics') {
        processedResult = result.productivityMetrics ? result : (result.productivity_metrics ? { productivityMetrics: result.productivity_metrics } : { productivityMetrics: result });
      } else if (analysisType === 'maturityScore') {
        processedResult = (result.maturityScore || result.maturity_score || (result.dimensions && result.overallMaturity)) ? (result.maturityScore ? result : { maturityScore: result }) : { maturityScore: result };
      }

      // 4. Save & Cache
      if (selectedBusinessId) {
        await this.saveAnalysisToBackend(processedResult, analysisType, selectedBusinessId);
      }

      return processedResult;
    } catch (error) {
      console.error(`Error generating ${analysisType} analysis:`, error);
      throw error;
    }
  }

  // Wrapper methods for backward compatibility and specific use cases
  async generateStrategicAnalysis(questions, answers, selectedBusinessId) {
    return this.generateAnalysis('strategic', questions, answers, selectedBusinessId);
  }

  async generateCompetitiveLandscape(questions, answers, selectedBusinessId) {
    return this.generateAnalysis('competitiveLandscape', questions, answers, selectedBusinessId);
  }

  async generateSWOTAnalysis(questions, answers, selectedBusinessId) {
    return this.generateAnalysis('swot', questions, answers, selectedBusinessId);
  }

  async generatePortersAnalysis(questions, answers, selectedBusinessId) {
    return this.generateAnalysis('porters', questions, answers, selectedBusinessId);
  }

  async generatePestelAnalysis(questions, answers, selectedBusinessId) {
    return this.generateAnalysis('pestel', questions, answers, selectedBusinessId);
  }

  async generateFullSwotPortfolio(questions, answers, selectedBusinessId) {
    return this.generateAnalysis('fullSwot', questions, answers, selectedBusinessId);
  }

  async generateCompetitiveAdvantage(questions, answers, selectedBusinessId) {
    return this.generateAnalysis('competitiveAdvantage', questions, answers, selectedBusinessId);
  }

  async generateExpandedCapability(questions, answers, selectedBusinessId) {
    return this.generateAnalysis('expandedCapability', questions, answers, selectedBusinessId);
  }

  async generateStrategicRadar(questions, answers, selectedBusinessId) {
    return this.generateAnalysis('strategicRadar', questions, answers, selectedBusinessId);
  }

  async generateProductivityMetrics(questions, answers, selectedBusinessId) {
    return this.generateAnalysis('productivityMetrics', questions, answers, selectedBusinessId);
  }

  async generateCoreAdjacency(questions, answers, selectedBusinessId) {
    return this.generateAnalysis('coreAdjacency', questions, answers, selectedBusinessId);
  }

  async generateMaturityScore(questions, answers, selectedBusinessId) {
    return this.generateAnalysis('maturityScore', questions, answers, selectedBusinessId);
  }

  async generateProfitabilityAnalysis(questions, answers, selectedBusinessId, uploadedFile = null) {
    return this.generateAnalysis('profitabilityAnalysis', questions, answers, selectedBusinessId, { uploadedFile });
  }

  async generateGrowthTracker(questions, answers, selectedBusinessId, uploadedFile = null) {
    return this.generateAnalysis('growthTracker', questions, answers, selectedBusinessId, { uploadedFile });
  }

  async generateLiquidityEfficiency(questions, answers, selectedBusinessId, uploadedFile = null) {
    return this.generateAnalysis('liquidityEfficiency', questions, answers, selectedBusinessId, { uploadedFile });
  }

  async generateInvestmentPerformance(questions, answers, selectedBusinessId, uploadedFile = null) {
    return this.generateAnalysis('investmentPerformance', questions, answers, selectedBusinessId, { uploadedFile });
  }

  async generateLeverageRisk(questions, answers, selectedBusinessId, uploadedFile = null) {
    return this.generateAnalysis('leverageRisk', questions, answers, selectedBusinessId, { uploadedFile });
  }

  async getFreshAnswersData(selectedBusinessId) {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${this.API_BASE_URL}/api/answers/business/${selectedBusinessId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch fresh answers data');
      const { data } = await response.json();
      const freshAnswers = {};
      const freshAnswersDetails = {};
      const freshCompletedSet = new Set();
      data?.forEach(answerDoc => {
        const questionId = String(answerDoc.question_id);
        const answerText = answerDoc.answer;
        if (answerText && answerText.trim()) {
          freshCompletedSet.add(questionId);
          freshAnswers[questionId] = answerText.trim();
          freshAnswersDetails[questionId] = {
            confidence: answerDoc.confidence,
            status: answerDoc.status,
            evidence: answerDoc.evidence,
            ai_answer: answerDoc.ai_answer,
            user_answer: answerDoc.user_answer,
            previous_answer: answerDoc.previous_answer
          };
        }
      });
      return { freshAnswers, freshCompletedSet, freshAnswersDetails };
    } catch (error) {
      console.error('Error fetching fresh answers data:', error);
      return { freshAnswers: {}, freshCompletedSet: new Set() };
    }
  }

  async getFreshConversationData(selectedBusinessId) {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${this.API_BASE_URL}/api/conversations?business_id=${selectedBusinessId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch fresh conversation data');
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
            if (allAnswers.length > 0) freshAnswers[questionId] = allAnswers.join('. ');
          }
        }
      });
      return { freshAnswers, freshCompletedSet };
    } catch (error) {
      console.error('Error fetching fresh conversation data:', error);
      return { freshAnswers: {}, freshCompletedSet: new Set() };
    }
  }
}
