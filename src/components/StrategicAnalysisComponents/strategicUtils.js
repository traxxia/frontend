export const calculateTotalRows = (data, phaseAnalysisArray = []) => {
  if (!data) return 0;
  const analysisData = data.strategic_analysis || data;
  const recommendations = analysisData?.strategic_recommendations;
  if (!recommendations) return 0;

  let total = 0;
  
  // Strategy Block
  if (recommendations.strategy_block?.S_strategy?.where_to_compete) {
    total += recommendations.strategy_block.S_strategy.where_to_compete.length;
  }
  if (recommendations.strategy_block?.S_strategy?.how_to_compete) {
    total += recommendations.strategy_block.S_strategy.how_to_compete.length;
  }
  
  // Resources Block
  if (recommendations.strategy_block?.R_resources?.capital_priorities) {
    total += recommendations.strategy_block.R_resources.capital_priorities.length;
  }
  if (recommendations.strategy_block?.R_resources?.talent_priorities) {
    total += recommendations.strategy_block.R_resources.talent_priorities.length;
  }
  if (recommendations.strategy_block?.R_resources?.technology_investments) {
    total += recommendations.strategy_block.R_resources.technology_investments.length;
  }

  // Execution Block
  if (recommendations.execution_block?.A_analysis_data?.recommendations) {
    total += recommendations.execution_block.A_analysis_data.recommendations.length;
  }
  if (recommendations.execution_block?.T_technology_digitalization?.infrastructure_initiatives) {
    total += recommendations.execution_block.T_technology_digitalization.infrastructure_initiatives.length;
  }
  if (recommendations.execution_block?.T_technology_digitalization?.platform_priorities) {
    total += recommendations.execution_block.T_technology_digitalization.platform_priorities.length;
  }
  if (recommendations.execution_block?.E_execution?.implementation_roadmap) {
    total += recommendations.execution_block.E_execution.implementation_roadmap.length;
  }
  
  const kpi = recommendations.execution_block?.E_execution?.kpi_dashboard;
  if (kpi) {
    if (kpi.adoption_metrics) total += kpi.adoption_metrics.length;
    if (kpi.network_metrics) total += kpi.network_metrics.length;
    if (kpi.operational_metrics) total += kpi.operational_metrics.length;
    if (kpi.financial_metrics) total += kpi.financial_metrics.length;
  }

  // Sustainability Block
  if (recommendations.sustainability_block?.G_governance?.decision_delegation) {
    total += recommendations.sustainability_block.G_governance.decision_delegation.length;
  }
  if (recommendations.sustainability_block?.G_governance?.accountability_framework) {
    total += recommendations.sustainability_block.G_governance.accountability_framework.length;
  }
  if (recommendations.sustainability_block?.I_innovation?.priority_innovation_bets) {
    total += recommendations.sustainability_block.I_innovation.priority_innovation_bets.length;
  }
  if (recommendations.sustainability_block?.C_culture?.cultural_shifts) {
    total += recommendations.sustainability_block.C_culture.cultural_shifts.length;
  }
  if (recommendations.sustainability_block?.C_culture?.change_approach) {
    total += recommendations.sustainability_block.C_culture.change_approach.length;
  }

  // Linkages
  if (analysisData.strategic_linkages?.objective_to_initiative_map) {
    total += analysisData.strategic_linkages.objective_to_initiative_map.length;
  }

  // External Analyses
  const pestelAnalysis = phaseAnalysisArray.find(a => a.analysis_type === 'pestel');
  const portersAnalysis = phaseAnalysisArray.find(a => a.analysis_type === 'porters');
  const pestelRec = pestelAnalysis?.analysis_data?.pestel_analysis?.strategic_recommendations;
  const portersRec = portersAnalysis?.analysis_data?.porter_analysis?.strategic_recommendations;

  if (pestelRec?.immediate_actions) total += pestelRec.immediate_actions.length;
  if (pestelRec?.short_term_initiatives) total += pestelRec.short_term_initiatives.length;
  if (pestelRec?.long_term_strategic_shifts) total += pestelRec.long_term_strategic_shifts.length;
  
  if (portersRec?.immediate_actions) total += portersRec.immediate_actions.length;
  if (portersRec?.short_term_initiatives) total += portersRec.short_term_initiatives.length;
  if (portersRec?.long_term_strategic_shifts) total += portersRec.long_term_strategic_shifts.length;

  return total;
};

export const parseDuration = (duration) => {
  if (!duration) return 1;
  const match = duration?.toString().toLowerCase().match(/(\d+)\s*(month|week|day)/);
  if (!match) return 1;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'week': return Math.max(0.25, value / 4);
    case 'day': return Math.max(0.1, value / 30);
    case 'month':
    default: return Math.max(1, value);
  }
};
