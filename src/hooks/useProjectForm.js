import { useState, useCallback } from "react";
import { useTranslation } from '../hooks/useTranslation';

export const useProjectForm = () => {
  const { t } = useTranslation();
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
  const [accountableOwnerId, setAccountableOwnerId] = useState("");
  const [keyAssumptions, setKeyAssumptions] = useState(["", "", ""]); // Max 3
  const [successCriteria, setSuccessCriteria] = useState("");
  const [killCriteria, setKillCriteria] = useState("");
  const [reviewCadence, setReviewCadence] = useState("");
  const [learningState, setLearningState] = useState("");
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
    setAccountableOwnerId("");
    setKeyAssumptions(["", "", ""]);
    setSuccessCriteria("");
    setKillCriteria("");
    setReviewCadence("");
    setLearningState("");
    setStatus("Draft");
    setLastReviewed(null);

    setOpenDropdown(null);
    setErrors({});
  }, []);

  const loadProjectData = useCallback((project) => {
    const toTitleCase = (str) => {
      if (!str) return "";
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    setProjectName(project.project_name || "");
    setDescription(project.description || "");
    setImportance(project.why_this_matters || "");
    setSelectedImpact(toTitleCase(project.impact));
    setSelectedEffort(toTitleCase(project.effort));
    setSelectedRisk(toTitleCase(project.risk));
    setSelectedTheme(project.strategic_theme || "");
    setDependencies(project.dependencies || "");
    setHighLevelReq(project.high_level_requirements || "");
    setScope(project.scope_definition || "");
    setOutcome(project.expected_outcome || "");
    setSuccessMetrics(project.success_metrics || "");
    setTimeline(project.estimated_timeline || "");
    setBudget(project.budget_estimate || "");

    // Load Strategic Core
    // Ensure strategic decision field shows the project name for consistency in v2
    setStrategicDecision(project.strategic_decision || project.project_name || "");
    setAccountableOwner(project.accountable_owner || project.created_by || "");
    setAccountableOwnerId(project.accountable_owner_id || "");
    setKeyAssumptions(project.key_assumptions && project.key_assumptions.length > 0 ? project.key_assumptions : ["", "", ""]);
    setSuccessCriteria(project.success_criteria || "");
    setKillCriteria(project.kill_criteria || "");
    setReviewCadence(project.review_cadence || "");
    // Normalize learning_state to match dropdown option values (Title Case)
    const rawLearning = (project.learning_state || "").toLowerCase();
    let normalizedLearning = "";
    if (rawLearning === "testing") normalizedLearning = "Testing";
    else if (rawLearning === "validated") normalizedLearning = "Validated";
    else if (rawLearning === "invalidated") normalizedLearning = "Invalidated";
    setLearningState(normalizedLearning || project.learning_state || "");

    // Normalize status string to match UI options (capitalized)
    const rawStatus = (project.status || "").toLowerCase();
    let normalizedStatus = "";
    if (rawStatus === "active") normalizedStatus = "Active";
    else if (rawStatus === "at risk" || rawStatus === "at_risk") normalizedStatus = "At Risk";
    else if (rawStatus === "paused") normalizedStatus = "Paused";
    else if (rawStatus === "killed") normalizedStatus = "Killed";
    else if (rawStatus === "scaled") normalizedStatus = "Scaled";
    else if (rawStatus === "draft") normalizedStatus = "Draft";

    setStatus(normalizedStatus);
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
      accountable_owner_id: accountableOwnerId || null,
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
      accountableOwnerId,
      keyAssumptions,
      successCriteria,
      killCriteria,
      reviewCadence,
      learningState,
      status,
      lastReviewed
    ]
  );

  const validateForm = useCallback((options = {}) => {
    const { isNew = true } = options;
    const newErrors = {};

    const isEmpty = (val) => !val || val.trim().length === 0;

    // Stricter validators matching Dashboard.jsx
    const hasLetter = (val) => /[a-zA-Z]/.test(val);
    const hasTooManyConsecutiveNumbers = (val) => /[0-9]{5,}/.test(val);
    const hasTooManyConsecutiveSpecial = (val) => /[^A-Za-z0-9\s]{5,}/.test(val);

    const validateField = (val, fieldKey, options = {}) => {
      const { minLength = 3, label = "Field", required = false, skipStrict = false } = options;
      const trimmed = (val || "").trim();

      if (required && isEmpty(trimmed)) {
        newErrors[fieldKey] = t(`${label} is required`);
      } else if (!isEmpty(trimmed)) {
        if (trimmed.length < minLength) {
          newErrors[fieldKey] = t(`${label} must be at least ${minLength} characters`);
        } else if (!hasLetter(trimmed)) {
          newErrors[fieldKey] = t(`${label} must contain at least one letter`);
        } else if (!skipStrict && hasTooManyConsecutiveNumbers(trimmed)) {
          newErrors[fieldKey] = t("Too many consecutive numbers are not allowed");
        } else if (!skipStrict && hasTooManyConsecutiveSpecial(trimmed)) {
          newErrors[fieldKey] = t("Too many consecutive special characters are not allowed");
        }
      }
    };

    if (isNew) {
      validateField(projectName, "projectName", { label: "Project name", minLength: 3, required: true });
    }
    validateField(description, "description", { label: "Description", minLength: 10, required: true });
    validateField(importance, "importance", { label: "Why This Matters", minLength: 10, required: true });
    validateField(strategicDecision, "strategicDecision", { label: "Strategic Decision", minLength: 10, required: true });
    validateField(accountableOwner, "accountableOwner", { label: "Accountable Owner", minLength: 2, required: true, skipStrict: true });
    validateField(successCriteria, "successCriteria", { label: "Success criteria", minLength: 10, required: true });
    validateField(killCriteria, "killCriteria", { label: "Kill criteria", minLength: 10, required: true });

    // Additional fields requested by user (Now optional)
    validateField(dependencies, "dependencies", { label: "Dependencies", minLength: 10, required: false });
    validateField(highLevelReq, "highLevelReq", { label: "Constraints / Non-Negotiables", minLength: 10, required: false });
    validateField(scope, "scope", { label: "Explicitly Out of Scope", minLength: 10, required: false });
    validateField(outcome, "outcome", { label: "Expected Outcome", minLength: 10, required: false });
    validateField(successMetrics, "successMetrics", { label: "Success Metrics (KPIs)", minLength: 10, required: false });

    // Key Assumptions (Array)
    keyAssumptions.forEach((assumption, index) => {
      if (assumption && assumption.trim().length > 0) {
        validateField(assumption, `keyAssumptions_${index}`, { label: `${t("Assumption")} ${index + 1}`, minLength: 10 });
      }
    });

    if (isEmpty(status)) {
      newErrors.status = t("Status is required");
    }

    if (isEmpty(reviewCadence)) {
      newErrors.reviewCadence = t("Review cadence is required");
    }

    if (isEmpty(accountableOwnerId)) {
      newErrors.accountableOwnerId = t("Owner selection is required");
    }

    if (isEmpty(successCriteria)) {
      newErrors.successCriteria = t("Success criteria is required");
    }

    if (isEmpty(killCriteria)) {
      newErrors.killCriteria = t("Kill criteria is required");
    }

    if (isEmpty(learningState)) {
      newErrors.learningState = t("Learning state is required");
    }

    setErrors(newErrors); 
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
      firstError: Object.values(newErrors)[0] || null,
    };
  }, [
    projectName, description, importance, strategicDecision, accountableOwner,
    accountableOwnerId, successCriteria, killCriteria, dependencies,
    highLevelReq, scope, outcome, successMetrics, keyAssumptions, t, status, reviewCadence, learningState
  ]);

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
      accountableOwnerId,
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
      setAccountableOwnerId,
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