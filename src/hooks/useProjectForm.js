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
    ]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};

    const isEmpty = (val) => !val || val.trim().length === 0;
    const hasLetter = (val) => /[a-zA-Z]/.test(val);

    if (isEmpty(projectName)) {
      newErrors.projectName = "Project name is required";
    } else if (!hasLetter(projectName)) {
      newErrors.projectName = "Project name must contain letters";
    }

    if (isEmpty(description)) {
      newErrors.description = "Description is required";
    } else if (!hasLetter(description)) {
      newErrors.description = "Description must contain letters";
    }

    if (isEmpty(importance)) {
      newErrors.importance = "Why this matters is required";
    } else if (!hasLetter(importance)) {
      newErrors.importance = "Must contain meaningful text";
    }

    setErrors(newErrors);

    return {
      isValid: Object.keys(newErrors).length === 0,
      firstError: Object.values(newErrors)[0] || null,
    };
  }, [projectName, description, importance]);

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
    },
    resetForm,
    loadProjectData,
    getPayload,
    validateForm,
  };
};