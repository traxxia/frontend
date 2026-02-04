import { useState, useCallback } from "react";

export const useProjectForm = () => {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedImpact, setSelectedImpact] = useState("");
  const [selectedEffort, setSelectedEffort] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [dependencies, setDependencies] = useState("");
  const [highLevelReq, setHighLevelReq] = useState("");
  const [scope, setScope] = useState("");
  const [outcome, setOutcome] = useState("");
  const [successMetrics, setSuccessMetrics] = useState("");
  const [timeline, setTimeline] = useState("");
  const [budget, setBudget] = useState("");
  const [errors, setErrors] = useState({});

  // Strategic Core Fields (v2)
  const [strategicDecision, setStrategicDecision] = useState("");
  const [accountableOwner, setAccountableOwner] = useState("");
  const [keyAssumptions, setKeyAssumptions] = useState(["", "", ""]); // Max 3
  const [successCriteria, setSuccessCriteria] = useState("");
  const [killCriteria, setKillCriteria] = useState("");
  const [reviewCadence, setReviewCadence] = useState("Monthly");
  const [learningState, setLearningState] = useState("Testing");
  const [status, setStatus] = useState("Draft");
  const [lastReviewed, setLastReviewed] = useState(null);

  const resetForm = useCallback(() => {
    setProjectName("");
    setDescription("");
    setImportance("");
    setSelectedImpact("");
    setSelectedEffort("");
    setSelectedRisk("");
    setSelectedTheme("");
    setDependencies("");
    setHighLevelReq("");
    setScope("");
    setOutcome("");
    setSuccessMetrics("");
    setTimeline("");
    setBudget("");

    // Reset Strategic Core
    setStrategicDecision("");
    setAccountableOwner("");
    setKeyAssumptions(["", "", ""]);
    setSuccessCriteria("");
    setKillCriteria("");
    setReviewCadence("Monthly");
    setLearningState("Testing");
    setStatus("Draft");
    setLastReviewed(null);

    setOpenDropdown(null);
    setErrors({});
  }, []);

  const loadProjectData = useCallback((project) => {
    setProjectName(project.project_name || "");
    setDescription(project.description || "");
    setImportance(project.why_this_matters || "");
    setSelectedImpact(project.impact || "");
    setSelectedEffort(project.effort || "");
    setSelectedRisk(project.risk || "");
    setSelectedTheme(project.strategic_theme || "");
    setDependencies(project.dependencies || "");
    setHighLevelReq(project.high_level_requirements || "");
    setScope(project.scope_definition || "");
    setOutcome(project.expected_outcome || "");
    setSuccessMetrics(project.success_metrics || "");
    setTimeline(project.estimated_timeline || "");
    setBudget(project.budget_estimate || "");

    // Load Strategic Core
    setStrategicDecision(project.strategic_decision || "");
    setAccountableOwner(project.accountable_owner || "");
    setKeyAssumptions(project.key_assumptions && project.key_assumptions.length > 0 ? project.key_assumptions : ["", "", ""]);
    setSuccessCriteria(project.success_criteria || "");
    setKillCriteria(project.kill_criteria || "");
    setReviewCadence(project.review_cadence || "Monthly");
    setLearningState(project.learning_state || "Testing");
    setStatus(project.status || "Draft");
    setLastReviewed(project.last_reviewed || null);
  }, []);

  const getPayload = useCallback(
    (userId, businessId) => ({
      business_id: businessId,
      user_id: userId,
      collaborators: [],
      project_name: projectName.trim(),
      description: description.trim(),
      why_this_matters: importance.trim(),
      impact: selectedImpact || null,
      effort: selectedEffort || null,
      risk: selectedRisk || null,
      strategic_theme: selectedTheme || null,
      dependencies,
      high_level_requirements: highLevelReq,
      scope_definition: scope,
      expected_outcome: outcome,
      success_metrics: successMetrics,
      estimated_timeline: timeline,
      budget_estimate: budget,

      // Strategic Core Payload
      strategic_decision: strategicDecision,
      accountable_owner: accountableOwner,
      key_assumptions: keyAssumptions.filter(a => a.trim() !== ""),
      success_criteria: successCriteria,
      kill_criteria: killCriteria,
      review_cadence: reviewCadence,
      learning_state: learningState,
      status: status,
      last_reviewed: lastReviewed,
    }),
    [
      projectName,
      description,
      importance,
      selectedImpact,
      selectedEffort,
      selectedRisk,
      selectedTheme,
      dependencies,
      highLevelReq,
      scope,
      outcome,
      successMetrics,
      timeline,
      budget,
      strategicDecision,
      accountableOwner,
      keyAssumptions,
      successCriteria,
      killCriteria,
      reviewCadence,
      learningState,
      status,
      lastReviewed
    ]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};

    const isEmpty = (val) => !val || val.trim().length === 0;

    if (isEmpty(projectName)) {
      newErrors.projectName = "Project name is required";
    }

    if (isEmpty(description)) {
      newErrors.description = "Description is required";
    }

    if (isEmpty(importance)) {
      newErrors.importance = "Why This Matters is required";
    }

    if (isEmpty(strategicDecision)) {
      newErrors.strategicDecision = "Strategic Decision is mandatory";
    }

    if (isEmpty(accountableOwner)) {
      newErrors.accountableOwner = "Accountable Owner is mandatory";
    }

    if (isEmpty(successCriteria)) {
      newErrors.successCriteria = "Success criteria is required";
    }

    if (isEmpty(killCriteria)) {
      newErrors.killCriteria = "Kill criteria is required";
    }

    setErrors(newErrors);

    return {
      isValid: Object.keys(newErrors).length === 0,
      firstError: Object.values(newErrors)[0] || null,
    };
  }, [projectName, description, importance, strategicDecision, accountableOwner, successCriteria, killCriteria]);

  return {
    formState: {
      projectName,
      description,
      importance,
      openDropdown,
      selectedImpact,
      selectedEffort,
      selectedRisk,
      selectedTheme,
      dependencies,
      highLevelReq,
      scope,
      outcome,
      successMetrics,
      timeline,
      budget,
      errors,
      // Strategic Core
      strategicDecision,
      accountableOwner,
      keyAssumptions,
      successCriteria,
      killCriteria,
      reviewCadence,
      learningState,
      status,
      lastReviewed,
    },
    formSetters: {
      setProjectName,
      setDescription,
      setImportance,
      setOpenDropdown,
      setSelectedImpact,
      setSelectedEffort,
      setSelectedRisk,
      setSelectedTheme,
      setDependencies,
      setHighLevelReq,
      setScope,
      setOutcome,
      setSuccessMetrics,
      setTimeline,
      setBudget,
      // Strategic Core
      setStrategicDecision,
      setAccountableOwner,
      setKeyAssumptions,
      setSuccessCriteria,
      setKillCriteria,
      setReviewCadence,
      setLearningState,
      setStatus,
      setLastReviewed,
    },
    resetForm,
    loadProjectData,
    getPayload,
    validateForm,
  };
};