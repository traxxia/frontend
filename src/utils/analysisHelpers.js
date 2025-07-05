// utils/analysisHelpers.js - Complete Updated File with Translation Support and HTML Formatting

// Get translation function
const getTranslation = (key) => {
  if (window.getTranslation) {
    return window.getTranslation(key);
  }
  return key; // Fallback to original key if translation not available
};

export const ANALYSIS_NAMES = {
  swot: () => getTranslation('swot_analysis'),
  porter: () => getTranslation('porters_five_forces'),
  valuechain: () => getTranslation('value_chain_analysis'),
  bcg: () => getTranslation('bcg_matrix'),
  strategic: () => getTranslation('strategic_framework')
};

export const ANALYSIS_ICONS = {
  strategic: 'Users',
  swot: 'Target',  
  porter: 'BarChart3',
  valuechain: 'Zap',
  bcg: 'TrendingUp'
};

export const getAnalysisFormatInstructions = (analysisType) => {
  const t = getTranslation;
  
  switch (analysisType) {
    case "swot":
      return `**${t('strengths')}:** [List the strengths identified]
      **${t('weaknesses')}:** [List the weaknesses identified]
      **${t('opportunities')}:** [List the opportunities identified]
      **${t('threats')}:** [List the threats identified]`;
    case "porter":
      return `**${t('supplier_power')}:** [Supplier power analysis]
      **${t('buyer_power')}:** [Buyer power analysis]
      **${t('competitive_rivalry')}:** [Competitive rivalry analysis]
      **${t('threat_substitution')}:** [Threat of substitution analysis]
      **${t('threat_new_entry')}:** [Threat of new entry analysis]`;
    case "valuechain":
      return `**${t('primary_activities')}:** [Provide a concise overview of how the primary activities create value]

- ${t('inbound_logistics')}: [Analyze how materials and resources are received, stored, and distributed within the organization]
- ${t('operations')}: [Evaluate the processes that transform inputs into outputs/products/services]
- ${t('outbound_logistics')}: [Assess the collection, storage, and distribution of products to customers]
- ${t('marketing_sales')}: [Review activities related to customer acquisition and persuasion to purchase]
- ${t('service')}: [Examine activities that maintain and enhance product value after purchase]

**${t('support_activities')}:** [Provide a concise overview of how support activities strengthen primary activities]

- ${t('firm_infrastructure')}: [Analyze general management, planning, finance, accounting, legal, and quality management]
- ${t('human_resource_management')}: [Evaluate recruitment, development, retention, and compensation of employees]
- ${t('technology_development')}: [Assess R&D, process automation, and other technological developments]
- ${t('procurement')}: [Review processes for acquiring resources needed for the business]

**${t('margin')}:** [Analyze how the organization's value chain contributes to competitive advantage and profitability]

**${t('linkages')}:** [Identify key connections between activities that create additional value or reduce costs]`;
    case "bcg":
      return `**${t('agile_leaders')}:** [Analysis]
      **${t('established_performers')}:** [Analysis]
      **${t('emerging_innovators')}:** [Analysis]
      **${t('strategic_drifters')}:** [Analysis]`;
    case "pestle":
      return `**${t('political_factors')}:** [Political factors analysis]
      **${t('economic_factors')}:** [Economic factors analysis]
      **${t('social_factors')}:** [Social factors analysis]
      **${t('technological_factors')}:** [Technological factors analysis]
      **${t('legal_factors')}:** [Legal factors analysis]
      **${t('environmental_factors')}:** [Environmental factors analysis]`;
    default:
      return `**${t('strengths')}:** [List the strengths identified]
      **${t('weaknesses')}:** [List the weaknesses identified]
      **${t('opportunities')}:** [List the opportunities identified]
      **${t('threats')}:** [List the threats identified]`;
  }
};

export const getAnalysisSystemContent = (analysisType) => {
  const analysisName = typeof ANALYSIS_NAMES[analysisType] === 'function' 
    ? ANALYSIS_NAMES[analysisType]() 
    : ANALYSIS_NAMES[analysisType];

  if (analysisType === 'strategic') {
    return `You are a strategic analyst. Your task is to read the Strategic Planning Book (Parts 1 and 2) provided by the user and analyze their question-answer responses to deliver a detailed ${analysisName} analysis. This analysis will help the user understand the next steps in their strategic planning process.

**FORMATTING INSTRUCTIONS:**
- Format all framework headers (starting with letters like "S = Strategy", "T = Tactics", etc.) as HTML h5 tags: \`<h5>S = Strategy: Defining a clear vision, mission, and objectives</h5>\`
- Keep all other text formatting as regular paragraphs
- Maintain the structure and content quality as specified below

Your response MUST follow this exact format:

1. Start with a brief introduction paragraph about strategic planning.

2. Provide specific actionable recommendations using the STRATEGIC framework:

<h5>S = Strategy: Defining a clear vision, mission, and objectives</h5>
* Theory: Strategy sets the organizational north star. Without a clear vision, actions lack cohesion and direction.
* Example: Early on, Amazon defined its vision as "to be Earth's most customer-centric company." This focus has guided all decisions, from creating Amazon Prime to innovating in logistics.
 
<h5>T = Tactics: Translating vision into concrete actions</h5>
* Theory: Tactics are the specific activities needed to execute the strategy.
* Example: Spotify uses "squads"—small, cross-functional teams—to develop new features quickly. This lets them release multiple updates each month, responding swiftly to user needs.
 
<h5>R = Resources: Prioritizing capital, talent, and technology</h5>
* Theory: Efficient resource allocation maximizes the impact of each investment.
* Example: In 2024, Nubank invested 20% of its annual budget in cloud technology, reducing operating costs by 30%.
 
<h5>A = Analysis and Data: Insights-based decision-making</h5>
* Theory: Data analysis allows organizations to anticipate trends and fine-tune strategies in real time.
* Example: Netflix uses advanced algorithms to analyze millions of hours of viewed content, enabling them to produce series like Stranger Things with a high degree of certainty of success.
 
<h5>T = Technology and Digitization: Automation and AI as accelerators</h5>
* Theory: Technology not only streamlines processes but also uncovers new business opportunities.
* Example: Tesla developed its own autonomous driving software, differentiating itself from competitors and capturing 80% of the electric vehicle market in 2023.
 
<h5>E = Execution: Rigorous implementation and constant monitoring</h5>
* Theory: Without effective execution, even the best strategy is doomed.
* Example: During its global launch, Disney+ employed a disciplined approach, achieving 100 million subscribers in under two years.
 
<h5>G = Governance: Clear structures for decision-making</h5>
* Theory: Effective governance ensures agile, transparent decisions aligned with strategy.
* Example: At Mercado Libre, strategic decisions are made within "leadership capsules," speeding up response times.
 
<h5>I = Innovation: A culture of experimentation</h5>
* Theory: Ongoing innovation is crucial to remain competitive.
* Example: Google's "20% time" policy lets employees spend one day a week on innovative projects, spawning Gmail and Google Maps.
 
<h5>C = Culture: Aligning organizational values with strategic objectives</h5>
* Theory: Organizational culture is the glue that binds every aspect of the STRATEGIC model together.
* Example: Patagonia, with its emphasis on sustainability, has aligned its entire operation around environmental values, attracting both customers and employees committed to its mission.

Your analysis should be comprehensive, actionable, and tailored to the user's specific business context. Be detailed and insightful in your recommendations.

**REMEMBER:** Always wrap framework headers (S = Strategy, T = Tactics, etc.) in \`<h5></h5>\` tags as shown in the examples above.`;
  }

  // For all other analysis types (no STRATEGIC framework)
  return `You are a strategic analyst. Your task is to read the Strategic Planning Book (Parts 1 and 2) provided by the user and analyze their question-answer responses to deliver a detailed ${analysisName} analysis. This analysis will help the user understand their current strategic position and identify key areas for improvement.

Your response MUST follow this exact format:

1. Start with a brief introduction paragraph.

2. Format the analysis section like this:
**${analysisName.toUpperCase()} Analysis:**
${getAnalysisFormatInstructions(analysisType)}

3. End with a conclusion paragraph with actionable recommendations.

Your analysis should be comprehensive, actionable, and tailored to the user's specific business context. Be detailed and insightful in your recommendations.`;
};

export const buildUserPrompt = (selectedType, businessData, strategicBooks) => {
  let userQA = `Please analyze the following survey responses and provide insights:\n`;

  if (businessData?.categories) {
    businessData.categories.forEach((category) => {
      category.questions.forEach((question) => {
        userQA += `\n<Question>\nMain Category: ${category.name}\n`;
        userQA += `Sub Category: ${question.nested?.question || question.placeholder || 'N/A'}\n`;
        userQA += `${question.title || question.question}\n`;
        
        if (question.type === "options" && question.answer && question.answer.selectedOption) {
          userQA += `(Choices given below)\n`;
          if (question.options) {
            question.options.forEach((option) => {
              userQA += `- ${option}\n`;
            });
          }
          userQA += `</Question>\n<Answer>\nChoice: ${question.answer.selectedOption}`;
          if (question.answer.description) {
            userQA += `\nAdditional Information: ${question.answer.description}</Answer>`;
          } else {
            userQA += `\n</Answer>`;
          }
        } else if (question.answer) {
          userQA += `</Question>\n<Answer>\n${question.answer.description || question.answer || ""}\n</Answer>`;
        } else {
          userQA += `</Question>\n<Answer>\nNo answer provided\n</Answer>`;
        }
      });
    });
  }

  const analysisName = typeof ANALYSIS_NAMES[selectedType] === 'function' 
    ? ANALYSIS_NAMES[selectedType]() 
    : ANALYSIS_NAMES[selectedType];

  if (selectedType === 'strategic') {
    return `Please analyze my business situation and provide:

1. A comprehensive ${analysisName} analysis based on the information below
2. Specific actionable recommendations using the S.T.R.A.T.E.G.I.C framework

Strategic Planning Book:
Part 1: ${strategicBooks.part1}
Part 2: ${strategicBooks.part2}

My Business Context (Questions and Answers):
${userQA}

Please ensure your analysis is detailed and your recommendations are practical and implementable for my specific business situation.`;
  }

  // For all other analysis types (no STRATEGIC framework)
  return `Please analyze my business situation and provide a comprehensive ${analysisName} analysis based on the information below.

Strategic Planning Book:
Part 1: ${strategicBooks.part1}
Part 2: ${strategicBooks.part2}

My Business Context (Questions and Answers):
${userQA}

Please ensure your analysis is detailed and your recommendations are practical and implementable for my specific business situation.`;
};

// FIXED: Updated to match your actual API response structure with translation support
// FIXED: Updated transformBusinessData function to match your actual API response structure
export const transformBusinessData = (apiData, businessName) => { 
  console.log('🔄 transformBusinessData called with:', apiData);
  
  if (!apiData || !apiData.categories) { 
    console.log('❌ No apiData or categories found');
    return null;
  }

  try {
    // Transform categories from your actual API response format
    const transformedCategories = apiData.categories.map((category, categoryIndex) => { 
      console.log(`📂 Processing category ${categoryIndex}:`, category);
      
      // Transform questions from your actual API structure
      const transformedQuestions = category.questions ? category.questions.map((question, questionIndex) => { 
        console.log(`❓ Processing question ${questionIndex}:`, question);
        
        return {
          // Use the actual field names from your API response
          id: question.question_id, // API uses question_id
          question_id: question.question_id,
          title: question.question_text, // API uses question_text
          question_text: question.question_text,
          question: question.question_text, // Fallback for compatibility
          placeholder: question.nested?.question || question.question_text, 
          type: question.question_type || 'open-ended', // API uses question_type
          options: question.options || null,
          nested: question.nested || null,
          // Initialize answer from user_answer or empty string
          answer: question.user_answer?.answer || "", 
          user_answer: question.user_answer || null,
          answered: question.answered || false,
          required: true
        };
      }) : [];

      return {
        // Use the actual field names from your API response
        id: category.category_id, // API uses category_id
        category_id: category.category_id,
        name: category.category_name, // API uses category_name
        category_name: category.category_name,
        questions_answered: category.questions_answered || 0,
        total_questions: category.total_questions || transformedQuestions.length,
        questions: transformedQuestions
      };
    });

    // Create analysis items with translation support
    const analysisItems = [
      // Analysis category items
      {
        id: "swot",
        title: getTranslation('swot_analysis'),
        subtitle: getTranslation('swot_subtitle'),
        icon: "Target",
        category: "analysis"
      },
      {
        id: "porters",
        title: getTranslation('porters_five_forces'),
        subtitle: getTranslation('porters_subtitle'),
        icon: "BarChart3",
        category: "analysis"
      },
      {
        id: "bcg",
        title: getTranslation('bcg_matrix'),
        subtitle: getTranslation('bcg_subtitle'),
        icon: "TrendingUp",
        category: "analysis"
      },
      {
        id: "value-chain",
        title: getTranslation('value_chain_analysis'),
        subtitle: getTranslation('value_chain_subtitle'),
        icon: "Zap",
        category: "analysis"
      },
      // Strategic category items  
      {
        id: "strategic",
        title: getTranslation('strategic_framework'), 
        subtitle: getTranslation('strategic_subtitle'),
        icon: "Users",
        category: "strategic"
      }
    ];

    const transformedData = {
      id: apiData.user?.id || 'unknown',
      name: businessName || apiData.user?.company || apiData.user?.name || 'Unknown Business',
      totalQuestions: apiData.survey?.total_questions || 0,
      categories: transformedCategories,
      analysisItems: analysisItems,
      user: apiData.user,
      survey: apiData.survey,
      metadata: {
        translated: apiData.translated || false,
        target_language: apiData.target_language || 'en',
        translation_method: apiData.translation_method || null
      }
    };

    console.log('✅ Transformed data:', transformedData);
    return transformedData;

  } catch (error) { 
    console.error('❌ Error in transformBusinessData:', error);
    return null;
  }
};

// Helper function to debug data structure
export const debugDataStructure = (data, label) => { 
  
  if (data && data.categories) { 
    data.categories.forEach((cat, index) => { 
      if (cat.questions) {
        cat.questions.forEach((q, qIndex) => { 
        });
      }
    });
  }
};

// Error message helper with translation support
export const getErrorMessage = (err) => {
  const t = getTranslation;
  
  if (err.response?.status === 404) {
    return t('no_survey_responses');
  } else if (err.response?.status === 401 || err.response?.status === 403) {
    return t('authentication_failed');
  } else {
    return err.response?.data?.message || t('failed_load_business_data');
  }
};

export const getAnalysisType = (itemId) => {
  return itemId === 'porters' ? 'porter' : 
         itemId === 'value-chain' ? 'valuechain' : 
         itemId;
};

// Helper function to get translated analysis name (for use in components)
export const getTranslatedAnalysisName = (analysisType) => {
  if (typeof ANALYSIS_NAMES[analysisType] === 'function') {
    return ANALYSIS_NAMES[analysisType]();
  }
  return ANALYSIS_NAMES[analysisType] || analysisType;
};

// Helper function to update analysis items with current translations (call this when language changes)
export const updateAnalysisItemsTranslations = () => {
  return [
    {
      id: "swot",
      title: getTranslation('swot_analysis'),
      subtitle: getTranslation('swot_subtitle'),
      icon: "Target",
      category: "analysis"
    },
    {
      id: "porters",
      title: getTranslation('porters_five_forces'),
      subtitle: getTranslation('porters_subtitle'),
      icon: "BarChart3",
      category: "analysis"
    },
    {
      id: "bcg",
      title: getTranslation('bcg_matrix'),
      subtitle: getTranslation('bcg_subtitle'),
      icon: "TrendingUp",
      category: "analysis"
    },
    {
      id: "value-chain",
      title: getTranslation('value_chain_analysis'),
      subtitle: getTranslation('value_chain_subtitle'),
      icon: "Zap",
      category: "analysis"
    },
    {
      id: "strategic",
      title: getTranslation('strategic_framework'), 
      subtitle: getTranslation('strategic_subtitle'),
      icon: "Users",
      category: "strategic"
    }
  ];
};