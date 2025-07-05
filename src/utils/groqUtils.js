export const categorizeQuestionsWithGroq = async (questions) => {
  const apiKey = process.env.REACT_APP_GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('Groq API key not found');
  }

  // Prepare questions for analysis
  const questionsForAnalysis = questions.flatMap(category => 
    category.questions.map(question => ({
      id: question.question_id || question.id,
      text: question.question_text || question.question,
      category: category.category_name || category.name
    }))
  );

  const prompt = `You are an expert business consultant. Your task is to find EXACTLY 7 questions for Basic level that cover these SPECIFIC categories:

**REQUIRED CATEGORIES FOR BASIC LEVEL (exactly 7 questions total):**
1. INDUSTRY - Which industry/sector the business operates in
2. BUSINESS MODEL - How the business operates and makes money  
3. CUSTOMER SEGMENT - Target customers and market segments
4. PAIN POINTS - Customer problems and challenges
5. MAIN COMPETITORS - Key competitors and competitive analysis
6. SHORT-TERM OBJECTIVES - Immediate goals and short-term targets
7. MARGINS - Profit margins, profitability, and financial performance

**SELECTION CRITERIA:**
- Choose the SHORTEST and most DIRECT question for each category
- Prioritize QUICK-TO-ANSWER questions over complex ones
- Select FOUNDATIONAL questions, not detailed analysis
- If multiple questions fit a category, choose the SIMPLER one
- EXACTLY 7 questions must go in Basic level (one per category above)
- All remaining questions go in Advanced level

Here are the questions to categorize:
${questionsForAnalysis.map((q, index) => `${index + 1}. "${q.text}" (Category: ${q.category})`).join('\n')}

Respond with JSON in this exact format:
{
  "basic": [exactly 7 question numbers],
  "advanced": [all remaining question numbers]
}

CRITICAL: Basic level must have exactly 7 questions, one for each required category.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.05,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const groqResponse = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = groqResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const categorization = JSON.parse(jsonMatch[0]);
    
    // Handle backward compatibility if Groq still returns phase1/phase2
    if (categorization.phase1 && categorization.phase2) {
      categorization.basic = categorization.phase1;
      categorization.advanced = categorization.phase2;
      delete categorization.phase1;
      delete categorization.phase2;
    }
    
    // Ensure exactly 7 questions in Basic level
    if (categorization.basic.length !== 7) {
      if (categorization.basic.length > 7) {
        const extra = categorization.basic.slice(7);
        categorization.basic = categorization.basic.slice(0, 7);
        categorization.advanced = [...categorization.advanced, ...extra];
      }
    }

    return categorization;
    
  } catch (error) {
    console.error('Groq categorization failed:', error);
    throw error;
  }
};

// Backward compatibility function if you need to support the old phase1/phase2 format
export const categorizeQuestionsWithGroqLegacy = async (questions) => {
  const result = await categorizeQuestionsWithGroq(questions);
  
  // Convert basic/advanced back to phase1/phase2 if needed
  return {
    phase1: result.basic,
    phase2: result.advanced
  };
};