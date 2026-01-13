export const generateRandomAIRankings = (projects) => {
  if (!projects || projects.length === 0) {
    return [];
  }

  const ranks = Array.from({ length: projects.length }, (_, i) => i + 1);

  for (let i = ranks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ranks[i], ranks[j]] = [ranks[j], ranks[i]];
  }

  return projects.map((project, index) => ({
    project_id: project._id,
    rank: ranks[index],
    score: parseFloat((Math.random() * 0.5 + 0.5).toFixed(2)), // Score between 0.5 and 1.0
    factors: {
      impact_score: parseFloat((Math.random() * 0.5 + 0.5).toFixed(2)),
      effort_score: parseFloat((Math.random() * 0.5 + 0.5).toFixed(2)),
      risk_score: parseFloat((Math.random() * 0.5 + 0.5).toFixed(2)),
      strategic_alignment: parseFloat((Math.random() * 0.5 + 0.5).toFixed(2)),
    }
  }));
};

export const simulateMLRankingAPI = async (businessId, projects) => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const rankings = generateRandomAIRankings(projects);

  return {
    success: true,
    business_id: businessId,
    rankings: rankings,
    model_version: "mock-v1.0",
    metadata: {
      factors_used: ["impact", "effort", "risk", "strategic_alignment"],
      confidence: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)), // 0.7 to 1.0
      generated_at: new Date().toISOString(),
    }
  };
};