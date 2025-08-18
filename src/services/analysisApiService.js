export class AnalysisApiService {
  constructor(ML_API_BASE_URL, API_BASE_URL, getAuthToken) {
    this.ML_API_BASE_URL = ML_API_BASE_URL;
    this.API_BASE_URL = API_BASE_URL;
    this.getAuthToken = getAuthToken;
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

  // Generic API call method
  async makeAPICall(endpoint, questionsArray, answersArray) {
    if (questionsArray.length === 0) {
      throw new Error(`No questions available for ${endpoint} analysis`);
    }

    const response = await fetch(`${this.ML_API_BASE_URL}/${endpoint}`, {
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

    return await response.json();
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
        'maturityScore': 'essential'
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

  // Strategic Analysis
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

  // SWOT Analysis
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

  // Porter's Five Forces
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

  // PESTEL Analysis
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

  // Full SWOT Portfolio
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

  // Competitive Advantage
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

  // Channel Effectiveness
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

  // Expanded Capability
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

  // Strategic Goals
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

  // Strategic Radar
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

  // Culture Profile
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

  // Productivity Metrics
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

  // Maturity Score
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
}