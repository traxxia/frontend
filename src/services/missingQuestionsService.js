import FinancialPerformance from "@/components/FinancialPerformance";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const getAuthToken = () => sessionStorage.getItem('token');

export const checkMissingQuestions = async (analysisType, selectedBusinessId) => {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/questions/missing-for-analysis`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysis_type: analysisType,
          business_id: selectedBusinessId
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking missing questions:', error);
    throw error;
  }
};

export const getQuestionsByAnalysisType = async (analysisType) => {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/questions`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.status}`);
    }

    const data = await response.json();

    return data.questions.filter(q =>
      q.used_for && q.used_for.includes(analysisType)
    );
  } catch (error) {
    console.error('Error fetching questions by analysis type:', error);
    throw error;
  }
};

export const checkMissingQuestionsAndRedirect = async (
  analysisType,
  selectedBusinessId,
  handleRedirectToBrief,
  options = {}
) => {
  const {
    displayName = analysisType,
    customMessage = null
  } = options;

  try {
    const result = await checkMissingQuestions(analysisType, selectedBusinessId);

    if (result.missing_count > 0) {
      handleRedirectToBrief(result);
    } else {
      const analysisQuestions = await getQuestionsByAnalysisType(analysisType);

      const defaultMessage = `Please provide more detailed answers for ${displayName} analysis. The current answers are insufficient to generate meaningful insights.`;

      handleRedirectToBrief({
        missing_count: analysisQuestions.length,
        missing_questions: analysisQuestions.map(q => ({
          _id: q._id,
          order: q.order,
          question_text: q.question_text,
          objective: q.objective,
          required_info: q.required_info,
          used_for: q.used_for
        })),
        analysis_type: analysisType,
        message: customMessage || defaultMessage,
        is_complete: false,
        keepHighlightLonger: true
      });
    }
  } catch (error) {
    console.error('Error in checkMissingQuestionsAndRedirect:', error);

    const fallbackMessage = customMessage || `Please review and improve your answers for ${displayName} analysis.`;

    handleRedirectToBrief({
      missing_count: 0,
      missing_questions: [],
      analysis_type: analysisType,
      message: fallbackMessage
    });
  }
};

export const ANALYSIS_TYPES = {
  // Initial Phase Analyses
  swot: {
    displayName: 'SWOT Analysis',
    customMessage: 'Please provide more detailed answers for SWOT analysis. The current answers are insufficient to generate meaningful SWOT insights.'
  },
  purchaseCriteria: {
    displayName: 'Purchase Criteria Analysis',
    customMessage: 'Please provide more detailed answers for purchase criteria analysis. The current answers are insufficient to generate meaningful criteria.'
  },
  channelHeatmap: {
    displayName: 'Channel Heatmap Analysis',
    customMessage: 'Please provide more detailed answers for channel heatmap analysis. The current answers are insufficient to generate meaningful channel performance data.'
  },
  loyaltyNPS: {
    displayName: 'Loyalty/NPS Analysis',
    customMessage: 'Please provide more detailed answers for loyalty and NPS analysis. The current answers are insufficient to generate meaningful loyalty insights.'
  },
  capabilityHeatmap: {
    displayName: 'Capability Heatmap Analysis',
    customMessage: 'Please provide more detailed answers for capability heatmap analysis. The current answers are insufficient to generate meaningful capability insights.'
  },
  porters: {
    displayName: 'Porter\'s Five Forces Analysis',
    customMessage: 'Please provide more detailed answers for Porter\'s Five Forces analysis. The current answers are insufficient to generate meaningful competitive force insights.'
  },
  pestel: {
    displayName: 'PESTEL Analysis',
    customMessage: 'Please provide more detailed answers for PESTEL analysis. The current answers are insufficient to generate meaningful insights.'
  },
  strategic: {
    displayName: 'Strategic Analysis',
    customMessage: 'Please provide more detailed answers for strategic analysis. The current answers are insufficient to generate meaningful strategic insights.'
  },

  // Essential Phase Analyses
  fullSwot: {
    displayName: 'Full SWOT Portfolio',
    customMessage: 'Please provide more detailed answers for Full SWOT Portfolio analysis. The current answers are insufficient to generate comprehensive SWOT insights.'
  },
  customerSegmentation: {
    displayName: 'Customer Segmentation Analysis',
    customMessage: 'Please provide more detailed answers for customer segmentation analysis. The current answers are insufficient to generate meaningful segments.'
  },
  competitiveAdvantage: {
    displayName: 'Competitive Advantage Matrix',
    customMessage: 'Please provide more detailed answers for Competitive Advantage analysis. The current answers are insufficient to generate meaningful competitive insights.'
  },
  channelEffectiveness: {
    displayName: 'Channel Effectiveness Analysis',
    customMessage: 'Please provide more detailed answers for channel effectiveness analysis. The current answers are insufficient to generate meaningful channel insights.'
  },
  expandedCapability: {
    displayName: 'Capability Heatmap',
    customMessage: 'Please provide more detailed answers for capability heatmap analysis. The current answers are insufficient to generate comprehensive capability insights.'
  },
  strategicGoals: {
    displayName: 'Strategic Goals Analysis',
    customMessage: 'Please provide more detailed answers for strategic goals analysis. The current answers are insufficient to generate meaningful strategic goal insights.'
  },
  strategicRadar: {
    displayName: 'Strategic Positioning Radar',
    customMessage: 'Please provide more detailed answers for strategic positioning radar analysis. The current answers are insufficient to generate meaningful positioning insights.'
  },
  cultureProfile: {
    displayName: 'Organizational Culture Profile',
    customMessage: 'Please provide more detailed answers for organizational culture profile analysis. The current answers are insufficient to generate meaningful culture insights.'
  },
  productivityMetrics: {
    displayName: 'Productivity and Efficiency Metrics Analysis',
    customMessage: 'Please provide more detailed answers for productivity metrics analysis. The current answers are insufficient to generate meaningful productivity insights.'
  },
  maturityScore: {
    displayName: 'Maturity Score Analysis',
    customMessage: 'Please provide more detailed answers for maturity score analysis. The current answers are insufficient to generate meaningful maturity insights.'
  },

  // Additional analyses that might be present
  loyaltyMetrics: {
    displayName: 'Loyalty Metrics Analysis',
    customMessage: 'Please provide more detailed answers for loyalty metrics analysis. The current answers are insufficient to generate meaningful loyalty insights.'
  },
  expandedCapabilityHeatmap: {
    displayName: 'Capability Heatmap Analysis',
    customMessage: 'Please provide more detailed answers for capability heatmap analysis. The current answers are insufficient to generate comprehensive capability insights.'
  },
  costEfficiency: {
    displayName: 'Cost Efficiency Insight',
    customMessage: 'Answer more financial and operational questions to unlock detailed cost efficiency analysis with unit economics and benchmarking'
  },
  FinancialPerformance: {
    displayName: 'Financial Performance Insight',
    customMessage: 'Answer more financial questions to unlock detailed performance sheet and ratio analysis with innovation investment tracking'
  }, financialBalance: {
    displayName: 'Financial Balance Insight',
    customMessage: 'Answer more financial questions to unlock detailed balance sheet and ratio analysis with innovation investment tracking'
  },
  operationalEfficiency: {
    displayName: 'Operational Efficiency Insight',
    customMessage: 'Answer more operational questions to unlock detailed efficiency metrics and resource utilization analysis'
  },
  competitiveLandscape: {
    displayName: 'Competitive Landscape',
    customMessage: 'Comprehensive analysis of key competitors using SWOT framework'
  }
};

export default {
  checkMissingQuestions,
  getQuestionsByAnalysisType,
  checkMissingQuestionsAndRedirect,
  ANALYSIS_TYPES
};