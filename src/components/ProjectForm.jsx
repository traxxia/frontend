import React, { useState, useRef, useEffect, forwardRef } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Breadcrumb, Accordion } from "react-bootstrap";
import { TrendingUp, Zap, AlertTriangle, Circle, Diamond, Rocket, Bolt, Lightbulb, Heart, Shield, Boxes, Clock, DollarSign, Lock, CheckCircle, XCircle, Edit2, ShieldCheck, Users, Info, ChevronLeft, Check } from "lucide-react";
import { validateField } from "../utils/validation";
import "../styles/NewProjectPage.css";
import { useAuthStore } from '../store/authStore';
const eligibleOwnersCache = new Map();
const impactOptions = [{
  value: "High",
  label: "High - Game changer",
  icon: <Circle size={14} color="green" fill="green" />
}, {
  value: "Medium",
  label: "Medium - Significant",
  icon: <Circle size={14} color="gold" fill="gold" />
}, {
  value: "Low",
  label: "Low - Incremental",
  icon: <Circle size={14} color="gray" fill="gray" />
}];
const effortOptions = [{
  value: "Small",
  label: "Small - 1–3 months",
  icon: <Diamond size={14} fill="black" color="black" />
}, {
  value: "Medium",
  label: "Medium - 3–6 months",
  icon: <div className="project-form--s1">
    <Diamond size={14} fill="black" color="black" />
    <Diamond size={14} fill="black" color="black" />
  </div>
}, {
  value: "Large",
  label: "Large - 6+ months",
  icon: <div className="project-form--s1">
    <Diamond size={14} fill="black" color="black" />
    <Diamond size={14} fill="black" color="black" />
    <Diamond size={14} fill="black" color="black" />
  </div>
}];
const riskOptions = [{
  value: "Low",
  label: "Low - Proven approach",
  icon: <Circle size={14} color="green" fill="green" />
}, {
  value: "Medium",
  label: "Medium - Some uncertainty",
  icon: <Circle size={14} color="gold" fill="gold" />
}, {
  value: "High",
  label: "High - Experimental",
  icon: <Circle size={14} color="red" fill="red" />
}];
const themeOptions = [{
  value: "Growth",
  label: "Growth & Expansion",
  icon: <Rocket size={16} color="#e11d48" />
}, {
  value: "Efficiency",
  label: "Operational Efficiency",
  icon: <Bolt size={16} color="#f59e0b" />
}, {
  value: "Innovation",
  label: "Innovation & R&D",
  icon: <Lightbulb size={16} color="#facc15" />
}, {
  value: "CustomerExperience",
  label: "Customer Experience",
  icon: <Heart size={16} color="#dc2626" fill="#dc2626" />
}, {
  value: "RiskMitigation",
  label: "Risk Mitigation",
  icon: <Shield size={16} color="#3b82f6" />
}, {
  value: "Platform",
  label: "Platform & Infrastructure",
  icon: <Boxes size={16} color="#fb923c" />
}];
const SelectField = forwardRef(({
  label,
  icon,
  options,
  value,
  onChange,
  open,
  setOpen,
  disabled,
  fieldName,
  onFieldFocus,
  onFieldEdit,
  required = false,
  error = null
}, ref) => {
  const {
    t
  } = useTranslation();
  const dropdownRef = useRef(null);
  const selectedOption = options.find(opt => opt.value === value);
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (open) setOpen();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);
  return <div className="sf-wrapper" ref={node => {
    dropdownRef.current = node;
    if (typeof ref === "function") ref(node); else if (ref) ref.current = node;
  }} tabIndex={-1}>
    {label && <label className="sf-label">
      {label} {required && <span className="required">*</span>}
    </label>}
    <div className="sf-dropdown-wrapper">
      <div className={`sf-dropdown-header ${error ? "error" : ""}`} onClick={() => {
        if (disabled) return;
        onFieldFocus?.(fieldName);
        onFieldEdit?.(fieldName);
        setOpen();
      }} style={{
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        backgroundColor: disabled ? "#f5f5f5" : "#fff"
      }}>
        <span className="project-form--s2">
          {selectedOption?.icon}
          {selectedOption?.label || t("Select_option")}
        </span>
        <span className={`sf-arrow ${open ? "open" : ""}`}>▼</span>
      </div>
      {open && !disabled && <div className="sf-options-container">
        {options.map(item => <div key={item.value} className={`sf-option ${item.disabled ? 'disabled' : ''}`} onClick={() => {
          if (item.disabled) return;
          onChange(item.value);
          onFieldEdit?.(fieldName);
          setOpen();
        }} style={{
          cursor: item.disabled ? 'not-allowed' : 'pointer',
          opacity: item.disabled ? 0.6 : 1,
          pointerEvents: item.disabled ? 'none' : 'auto'
        }}>
          {item.icon} {item.label}
        </div>)}
      </div>}
    </div>
    {error && <small className="error-text project-form--s3">{error}</small>}
  </div>;
});
const InputField = forwardRef(({
  label,
  subLabel,
  value,
  onChange,
  placeholder,
  error,
  readOnly,
  onFocus,
  fieldName,
  required = false,
  maxLength,
  type = "text"
}, ref) => {
  return <div className="field-row">
    <div className="field-label-row">
      <label className="field-label">
        {label} {required && <span className="required">*</span>}
        {subLabel && <small className="field-sub-label project-form--s4">{subLabel}</small>}
      </label>
      {maxLength && <small className="text-muted project-form--s5">
        {(value || '').length}/{maxLength}
      </small>}
    </div>
    <input ref={ref} type={type} value={value || ""} onChange={onChange} placeholder={placeholder} className={`field-input ${error ? "error" : ""}`} readOnly={readOnly} onFocus={() => onFocus?.(fieldName)} />
    {error && <small className="error-text">{error}</small>}
  </div>;
});
const TextAreaField = forwardRef(({
  label,
  subLabel,
  value,
  onChange,
  placeholder,
  error,
  readOnly,
  onFocus,
  fieldName,
  required = false,
  rows = 3,
  maxLength,
  transparent = false
}, ref) => {
  return <div className="field-row">
    <div className="field-label-row">
      <label className="field-label">
        {label} {required && <span className="required">*</span>}
        {subLabel && <small className="field-sub-label project-form--s4">{subLabel}</small>}
      </label>
      {maxLength && <small className="text-muted project-form--s5">
        {(value || '').length}/{maxLength}
      </small>}
    </div>
    <textarea ref={ref} value={value || ""} onChange={onChange} placeholder={placeholder} rows={rows} className={`field-textarea ${transparent ? "transparent" : ""} ${error ? "error" : ""}`} readOnly={readOnly} onFocus={() => onFocus?.(fieldName)} />
    {error && <small className="error-text">{error}</small>}
  </div>;
});
const ProjectForm = ({
  mode,
  readOnly = false,
  projectName,
  setProjectName,
  description,
  setDescription,
  importance,
  setImportance,
  selectedImpact,
  setSelectedImpact,
  selectedEffort,
  setSelectedEffort,
  selectedRisk,
  setSelectedRisk,
  selectedTheme,
  setSelectedTheme,
  dependencies,
  setDependencies,
  highLevelReq,
  setHighLevelReq,
  scope,
  setScope,
  outcome,
  setOutcome,
  successMetrics,
setSuccessMetrics,
  timeline,
  setTimeline,
  budget,
  setBudget,
  openDropdown,
  setOpenDropdown,
  onBack,
  isLockedByOther,
  onSubmit,
  getLockOwnerForField,
  onFieldFocus,
  onFieldEdit,
  accountableOwner,
  setAccountableOwner,
  accountableOwnerId,
  setAccountableOwnerId,
  recommendRoles = [],
  setRecommendRoles,
  agreeRoles = [],
  setAgreeRoles,
  inputRoles = [],
  setInputRoles,
  performRoles = [],
  setPerformRoles,
  keyAssumptions,
  setKeyAssumptions,
  successCriteria,
  setSuccessCriteria,
  killCriteria,
  setKillCriteria,
  reviewCadence,
  setReviewCadence,
  status,
  setStatus,
  launchStatus,
  learningState,
  setLearningState,
  isSubmitting = false,
  selectedBusinessId,
  projectId,
  isAdmin = false,
  initialStatus,
  decisionLog,
  errors: hookErrors,
  validateForm,
  sNo
}) => {
  const {
    t
  } = useTranslation();
  const isReadOnly = mode === "view" || readOnly;
  const [fieldErrors, setFieldErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [eligibleOwners, setEligibleOwners] = useState([]);
  const breadcrumbRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (breadcrumbRef.current) {
        breadcrumbRef.current.scrollIntoView({
          behavior: 'auto',
          block: 'start'
        });
      }
      window.scrollTo(0, 0);
      const parent = document.querySelector('.info-panel-content');
      if (parent) {
        parent.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (selectedBusinessId && mode !== "view") {
      const cacheKey = `owners-${selectedBusinessId}`;
      const fetchOwners = async () => {
        if (eligibleOwnersCache.has(cacheKey)) {
          const owners = await eligibleOwnersCache.get(cacheKey);
          setEligibleOwners(owners || []);
          return;
        }
        const fetchPromise = (async () => {
          try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/businesses/${selectedBusinessId}/eligible-owners`, {
              headers: {
                "Authorization": `Bearer ${useAuthStore.getState().token}`
              }
            });
            const data = await response.json();
            return data.eligible_owners || [];
          } catch (err) {
            console.error("Failed to fetch eligible owners:", err);
            return [];
          }
        })();
        eligibleOwnersCache.set(cacheKey, fetchPromise);
        const owners = await fetchPromise;
        setEligibleOwners(owners);
      };
      fetchOwners();
    }
  }, [selectedBusinessId, mode]);
  useEffect(() => {
    if (!accountableOwnerId && eligibleOwners.length > 0) {
      const existingMatch = accountableOwner ? eligibleOwners.find(o => o.name === accountableOwner || o.email === accountableOwner) : null;
      if (existingMatch) {
        setAccountableOwnerId(String(existingMatch._id));
        setAccountableOwner(existingMatch.name || existingMatch.email);
      } else {
        const admin = eligibleOwners.find(o => o.is_company_admin) || eligibleOwners.find(o => o.is_business_owner);
        if (admin) {
          setAccountableOwnerId(String(admin._id));
          setAccountableOwner(admin.name || admin.email);
        }
      }
    }
  }, [accountableOwnerId, accountableOwner, eligibleOwners, setAccountableOwnerId, setAccountableOwner]);
  const projectNameRef = useRef(null);
  const descriptionRef = useRef(null);
  const importanceRef = useRef(null);
  const budgetRef = useRef(null);
  const accountableOwnerRef = useRef(null);
  const successCriteriaRef = useRef(null);
  const killCriteriaRef = useRef(null);
  const statusRef = useRef(null);
  const dependenciesRef = useRef(null);
  const highLevelReqRef = useRef(null);
  const scopeRef = useRef(null);
  const outcomeRef = useRef(null);
  const successMetricsRef = useRef(null);
  const keyAssumptionsRefs = [useRef(null), useRef(null), useRef(null)];
  const getTitle = () => {
    switch (mode) {
      case "new":
        return t("New_Project");
      case "view":
        return t("View_Project");
      case "edit":
        return t("Edit_Project");
      default:
        return t("Project");
    }
  };
  const hasDecider = !!accountableOwnerId;
  const isFieldDisabled = field => isReadOnly || isSubmitting || isLockedByOther?.(field) || isTerminal || (!hasDecider && field !== "accountable_owner");

  const isDeciderAssigned = !!accountableOwnerId;
  const isRequiredInfo = !!projectName && !!description && !!importance;
  const isKeyAssumptions = keyAssumptions.some(a => a && a.trim().length > 0) && !!successCriteria && !!killCriteria;
  const depsArray = dependencies === "[NONE]" ? [] : (dependencies || "").split("\n");
  const isDependenciesSet = dependencies === "[NONE]" || depsArray.some(d => d.trim().length > 0);
  const isStrategicContext = !!selectedImpact && !!selectedEffort && !!selectedRisk && !!selectedTheme && !!learningState && isDependenciesSet;

  const isMomentSet = !!reviewCadence;
  
  const kickstartItems = [
    { label: "Decider assigned", done: isDeciderAssigned },
    { label: "Moment set", done: isMomentSet },
    { label: "Bet overview", done: isRequiredInfo },
    { label: "Key assumptions", done: isKeyAssumptions },
    { label: "Strategic context", done: isStrategicContext }
  ];
  const kickstartCompleted = kickstartItems.filter(i => i.done).length;
  const canKickstart = kickstartCompleted === kickstartItems.length;

  const handleKickstart = (e) => {
    e.preventDefault();
    if (!canKickstart) return;

    // Call handleSubmit with isKickstart = true to enforce full validation
    handleSubmit(null, true);
  };

  const handleFieldFocus = field => {
    if (isFieldDisabled(field)) return;
    setOpenDropdown(null);
    onFieldFocus?.(field);
  };
  const handleFieldEdit = field => {
    if (isFieldDisabled(field)) return;
    onFieldEdit?.(field);
  };
  const renderLockBadge = field => {
    const owner = getLockOwnerForField?.(field);
    if (!owner) return null;
    return <span className="field-lock-indicator">
      <Lock size={14} /> {owner} {t("is_editing")}
    </span>;
  };
  const initialStatusLower = (initialStatus || "").toLowerCase();
  const isLaunched = (launchStatus || "").toLowerCase() === "launched" || ["active", "at risk", "paused", "completed", "scaled"].includes((status || "").toLowerCase());
  const isTerminal = initialStatusLower === "completed" || initialStatusLower === "scaled" || initialStatusLower === "killed" && !isAdmin;
  const getSubmitButtonText = () => {
    if (isSubmitting) {
      switch (mode) {
        case "new":
          return t("Creating...");
        case "edit":
          return t("Saving_Changes...");
        default:
          return t("Submitting...");
      }
    }
    switch (mode) {
      case "new":
        return t("Create_Project");
      case "edit":
        return t("Save_Changes");
      default:
        return t("Submit");
    }
  };
  const scrollToError = ref => {
    if (ref?.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      setTimeout(() => {
        ref.current.focus();
      }, 500);
    }
  };
  const handleProjectNameChange = e => {
    let value = e.target.value;
    value = value.replace(/[^A-Za-z0-9\s!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]/g, "");
    setProjectName(value);
    let customError = null;
    if (/^[0-9]+$/.test(value.trim())) {
      customError = t("Project name cannot contain only numbers.");
    }
    if (/[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]{4,}/.test(value)) {
      customError = t("Cannot use more than 5 consecutive special characters.");
    }
    if (showErrors || customError) {
      const validation = validateField('Project Name', value, {
        required: true,
        maxLength: 100,
        requiresText: true
      });
      setFieldErrors(prev => ({
        ...prev,
        projectName: customError || (validation.isValid ? null : t(validation.message))
      }));
    }
    handleFieldEdit("project_name");
  };
  const handleDescriptionChange = e => {
    const value = e.target.value;
    setDescription(value);
    if (showErrors) {
      const validation = validateField('Description', value, {
        required: true,
        maxLength: 500,
        requiresText: true
      });
      setFieldErrors(prev => ({
        ...prev,
        description: validation.isValid ? null : validation.message
      }));
    }
    handleFieldEdit("project_description");
  };
  const handleImportanceChange = e => {
    const value = e.target.value;
    setImportance(value);
    if (showErrors) {
      const validation = validateField('Why This Matters', value, {
        required: true,
        maxLength: 1000,
        requiresText: true
      });
      setFieldErrors(prev => ({
        ...prev,
        importance: validation.isValid ? null : validation.message
      }));
    }
    handleFieldEdit("why_this_matters");
  };
  const handleStrategicDecisionChange = e => {
    const value = e.target.value;
    setStrategicDecision(value);
    if (showErrors) {
      const validation = validateField('Strategic Decision', value, {
        required: true,
        requiresText: true
      });
      setFieldErrors(prev => ({
        ...prev,
        strategicDecision: validation.isValid ? null : validation.message
      }));
    }
    handleFieldEdit("strategic_decision");
  };
  const handleAccountableOwnerChange = e => {
    let value = e.target.value;
    value = value.replace(/[^A-Za-z0-9\s.@-]/g, "");
    setAccountableOwner(value);
    let customError = null;
    if (!value.trim()) {
      customError = t("Accountable Owner is required.");
    } else if (!/[A-Za-z]/.test(value)) {
      customError = t("Accountable Owner must contain at least one alphabet.");
    }
    if (showErrors || customError) {
      const validation = validateField('Accountable Owner', value, {
        required: true,
        requiresText: true,
        skipStrict: true
      });
      setFieldErrors(prev => ({
        ...prev,
        accountableOwner: customError || (validation.isValid ? null : t(validation.message))
      }));
    }
    handleFieldEdit("accountable_owner");
  };
  const handleSuccessCriteriaChange = e => {
    const value = e.target.value;
    setSuccessCriteria(value);
    if (showErrors) {
      const validation = validateField('Success Criteria', value, {
        required: true,
        requiresText: true
      });
      setFieldErrors(prev => ({
        ...prev,
        successCriteria: validation.isValid ? null : validation.message
      }));
    }
    handleFieldEdit("success_criteria");
  };
  const handleKillCriteriaChange = e => {
    const value = e.target.value;
    setKillCriteria(value);
    if (showErrors) {
      const validation = validateField('Kill Criteria', value, {
        required: true,
        requiresText: true
      });
      setFieldErrors(prev => ({
        ...prev,
        killCriteria: validation.isValid ? null : validation.message
      }));
    }
    handleFieldEdit("kill_criteria");
  };
  const handleBudgetChange = e => {
    const value = e.target.value;
    setBudget(value);
    if (showErrors) {
      const validation = validateField('Budget Estimate', value, {
        numeric: true,
        min: 0,
        allowSpecialChars: ['.', ',', '-', '$', 'K', 'M']
      });
      setFieldErrors(prev => ({
        ...prev,
        budget: validation.isValid ? null : validation.message
      }));
    }
    handleFieldEdit("budget_estimate");
  };
  const handleBudgetKeyPress = e => {
    const allowedChars = /[0-9.,\-$KMkm]/;
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (!allowedChars.test(e.key) && !controlKeys.includes(e.key)) {
      e.preventDefault();
    }
  };
  const handleDependenciesChange = e => {
    const value = e.target.value;
    setDependencies(value);
    if (showErrors) {
      const validation = validateField('Dependencies', value, {});
      setFieldErrors(prev => ({
        ...prev,
        dependencies: validation.isValid ? null : t(validation.message)
      }));
    }
    handleFieldEdit("dependencies");
  };
  const handleSuccessMetricsChange = e => {
    const value = e.target.value;
    setSuccessMetrics(value);
    if (showErrors) {
      const validation = validateField('Success Metrics (KPIs)', value, {});
      setFieldErrors(prev => ({
        ...prev,
        successMetrics: validation.isValid ? null : t(validation.message)
      }));
    }
    handleFieldEdit("success_metrics");
  };
  const handleConstraintsChange = e => {
    const value = e.target.value;
    setHighLevelReq(value);
    if (showErrors) {
      const validation = validateField('Constraints / Non-Negotiables', value, {});
      setFieldErrors(prev => ({
        ...prev,
        highLevelReq: validation.isValid ? null : t(validation.message)
      }));
    }
    handleFieldEdit("high_level_requirements");
  };
  const handleScopeChange = e => {
    const value = e.target.value;
    setScope(value);
    if (showErrors) {
      const validation = validateField('Explicitly Out of Scope', value, {});
      setFieldErrors(prev => ({
        ...prev,
        scope: validation.isValid ? null : t(validation.message)
      }));
    }
    handleFieldEdit("scope_definition");
  };
  const handleOutcomeChange = e => {
    const value = e.target.value;
    setOutcome(value);
    if (showErrors) {
      const validation = validateField('Expected Outcome', value, {});
      setFieldErrors(prev => ({
        ...prev,
        outcome: validation.isValid ? null : t(validation.message)
      }));
    }
    handleFieldEdit("expected_outcome");
  };
  const handleKeyAssumptionChange = (idx, value) => {
    const newAssumptions = [...keyAssumptions];
    newAssumptions[idx] = value;
    setKeyAssumptions(newAssumptions);
    if (showErrors && value.trim().length > 0) {
      const validation = validateField(`Assumption ${idx + 1}`, value, {});
      setFieldErrors(prev => ({
        ...prev,
        [`keyAssumptions_${idx}`]: validation.isValid ? null : t(validation.message)
      }));
    }
    handleFieldEdit("key_assumptions");
  };
  const handleSubmit = (e, isKickstart = false) => {
    if (e && e.preventDefault) e.preventDefault();
    const skipStrict = !isKickstart && initialStatusLower === "draft";
    const validation = validateForm({
      isNew: mode === "new",
      skipStrictRequired: skipStrict
    });
    const errors = validation.errors || {};
    setFieldErrors(errors);
    setShowErrors(true);
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      if (errors.projectName) scrollToError(projectNameRef); else if (errors.description) scrollToError(descriptionRef); else if (errors.importance) scrollToError(importanceRef); else if (errors.strategicDecision) scrollToError(strategicDecisionRef); else if (errors.accountableOwnerId || errors.accountableOwner) scrollToError(accountableOwnerRef); else if (errors.successCriteria) scrollToError(successCriteriaRef); else if (errors.killCriteria) scrollToError(killCriteriaRef); else if (errors.status) scrollToError(statusRef); else if (errors.dependencies) scrollToError(dependenciesRef); else if (errors.highLevelReq) scrollToError(highLevelReqRef); else if (errors.scope) scrollToError(scopeRef); else if (errors.outcome) scrollToError(outcomeRef); else if (errors.successMetrics) scrollToError(successMetricsRef); else if (errors.keyAssumptions_0) scrollToError(keyAssumptionsRefs[0]); else if (errors.keyAssumptions_1) scrollToError(keyAssumptionsRefs[1]); else if (errors.keyAssumptions_2) scrollToError(keyAssumptionsRefs[2]); else if (errors.learningState) {
        scrollToError(statusRef);
      } else if (errors.budget) scrollToError(budgetRef);
      return;
    }
    onSubmit({ isKickstart });
  };
  return <>
    <fieldset disabled={isSubmitting || isReadOnly} className="project-form--s6">

      { }
      <div className="project-custom-header-wrapper" ref={breadcrumbRef}>
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2">
          <button type="button" className="d-flex align-items-center gap-2" onClick={onBack} style={{ border: '1px solid #0c71b9', color: '#0c71b9', fontSize: '13px', fontWeight: '600', padding: '6px 14px', borderRadius: '8px', backgroundColor: '#ffffff', cursor: 'pointer' }}>
            <ChevronLeft size={14} strokeWidth={2.5} /> Back to Bets
          </button>
          
          {(() => {
            const getBadgeStyle = (status) => {
              const s = (status || "draft").toLowerCase();
              switch (s) {
                case "active": return { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" };
                case "at risk":
                case "at_risk": return { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" };
                case "paused": return { bg: "#fef3c7", text: "#b45309", border: "#fde68a" };
                case "killed": return { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" };
                case "completed": return { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" };
                case "scaled": return { bg: "#f3e8ff", text: "#7e22ce", border: "#e9d5ff" };
                default: return { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" };
              }
            };
            const badgeStyle = getBadgeStyle(initialStatusLower);
            return (
              <div className="d-flex align-items-center gap-2">
                <div style={{ border: `1px solid ${badgeStyle.border}`, color: badgeStyle.text, fontSize: '12px', fontWeight: '700', padding: '6px 12px', borderRadius: '4px', backgroundColor: badgeStyle.bg, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}>
                  {initialStatusLower || "draft"}
                </div>
                {!isReadOnly && (
                  <>
                    <button type="button" onClick={onBack} style={{ border: '1px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: '600', padding: '6px 16px', borderRadius: '6px', backgroundColor: '#ffffff', cursor: 'pointer' }}>
                      {t("Cancel")}
                    </button>
                    <button type="button" className="d-flex align-items-center gap-2" onClick={(e) => handleSubmit(e, false)} disabled={isSubmitting || isTerminal} style={{ backgroundColor: '#0c71b9', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', padding: '6px 16px', cursor: 'pointer', opacity: (isSubmitting || isTerminal) ? 0.6 : 1 }}>
                      <Check size={14} strokeWidth={2.5} /> Save changes
                    </button>
                  </>
                )}
              </div>
            );
          })()}
        </div>

        <div className="project-custom-header">
          <div className="project-custom-header-top">
            <span className="project-custom-header-bet">BET {sNo ? `#${sNo}` : '#NEW'}</span>
          </div>
          <div className="project-custom-header-title-row">
            <h1 className="project-custom-header-title">{projectName || "New Bet"}</h1>
          </div>
          <div className="project-custom-header-meta">
            <div className="meta-item">
              <span className="meta-label">DECIDER</span>
              <span className="meta-value text-dark fw-bold">{accountableOwner || "Not assigned"}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">CADENCE</span>
              <span className="meta-value text-dark fw-bold">{reviewCadence || "Not set"}</span>
            </div>
          </div>
        </div>

        <hr className="my-4" style={{ borderColor: '#e2e8f0', opacity: 1 }} />
      </div>

      {!isLaunched && initialStatusLower === "draft" && (
        <div className="kickstart-banner mt-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="kickstart-header">
                <span className="kickstart-badge">DRAFT · NOT IN PLAY YET</span>
              </div>
              <h2 className="kickstart-title">Complete the essentials to kickstart · {kickstartCompleted}/{kickstartItems.length}</h2>
              <p className="kickstart-subtitle">A bet joins its Cadences for review only once it's kickstarted to Active.</p>
              
              <div className="kickstart-items" style={{ marginTop: '16px' }}>
                {kickstartItems.map((item, index) => (
                  <div key={index} className={`kickstart-item ${item.done ? 'done' : ''}`}>
                    {item.done ? (
                      <CheckCircle size={18} color="white" fill="#10b981" />
                    ) : (
                      <Circle size={18} color="#cbd5e0" fill="#cbd5e0" />
                    )}
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 ms-4">
              <button className={`btn-kickstart ${canKickstart ? 'active' : ''}`} onClick={handleKickstart} disabled={!canKickstart}>
                Kickstart Bet &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {!hasDecider && (
        <div className="decider-warning-banner mt-4">
          <div className="decider-warning-content">
            <div className="decider-warning-title">
              <AlertTriangle size={14} color="#d97706" /> DECIDER NOT ASSIGNED
            </div>
            <div className="decider-warning-main">Pick a decider to start configuring this bet</div>
            <div className="decider-warning-sub">Only the decider can fill in the bet's details. Until one is assigned, the form below is locked.</div>
            <button className="btn btn-primary mt-3 btn-assign-decider" style={{ backgroundColor: '#0c71b9', border: 'none' }} onClick={(e) => {
              e.preventDefault();
              if (accountableOwnerRef.current) {
                accountableOwnerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}>
              Assign decider &rarr;
            </button>
          </div>
        </div>
      )}

      <Accordion alwaysOpen defaultActiveKey={['0', '1', '2', '3', '4']} className="mt-4 form-accordion">
        <Accordion.Item eventKey="0" className="mb-3 border rounded form-accordion-item">
          <Accordion.Header>
            <div className="d-flex justify-content-between align-items-center w-100 pe-3">
              <span className="fw-bold text-dark">1. {t('Required_Information')}</span>
              <span className="badge-required">REQUIRED</span>
            </div>
          </Accordion.Header>
          <Accordion.Body className="bg-white">

            { }
            <div className="field-row">
              <div className="field-label-row">
                <label className="field-label">
                  {t("Project_Name")} <span className="required">*</span>
                </label>
                {mode !== "new" && renderLockBadge("project_name")}
              </div>
              {mode === "new" ? <>
                <input ref={projectNameRef} type="text" value={projectName || ""} onChange={handleProjectNameChange} placeholder="Enter project name (minimum 3 characters)" className={`field-input ${showErrors && fieldErrors.projectName ? "error" : ""}`} readOnly={isReadOnly} onFocus={() => handleFieldFocus("project_name")} maxLength={100} disabled={isSubmitting} />
                <div className="project-form--s16">
                  {showErrors && fieldErrors.projectName && <small className="error-text">{fieldErrors.projectName}</small>}
                  <small className="text-muted project-form--s17">
                    {(projectName || '').length}/100 {t("characters")}
                  </small>
                </div>
              </> : projectName && <div className="project-name-display-inline">
                {projectName}
              </div>}
            </div>

            <div className="field-row">
              <div className="field-label-row">
                <label className="field-label">
                  {t("Project_Description")} <span className="required">*</span>
                </label>
                {renderLockBadge("project_description")}
              </div>
              <textarea ref={descriptionRef} value={description || ""} onChange={handleDescriptionChange} placeholder="Launch digital wallet product and achieve market penetration (minimum 10 characters)" rows={3} className={`field-textarea ${showErrors && fieldErrors.description ? "error" : ""}`} readOnly={isFieldDisabled("project_description")} onFocus={() => handleFieldFocus("project_description")} maxLength={500} />
              <div className="project-form--s16">
                {showErrors && fieldErrors.description && <small className="error-text">{fieldErrors.description}</small>}
                <small className="text-muted project-form--s17">
                  {(description || '').length}/500 {t("characters")}
                </small>
              </div>
            </div>

            <TextAreaField ref={importanceRef} label={t("Why_This_Matters")} value={importance} onChange={handleImportanceChange} placeholder={t("Why_This_Matters_Placeholder")} error={showErrors && fieldErrors.importance} readOnly={isFieldDisabled("why_this_matters")} onFocus={handleFieldFocus} fieldName="why_this_matters" required />
          </Accordion.Body>
        </Accordion.Item>
          <Accordion.Item eventKey="1" className="mb-3 border rounded form-accordion-item">
            <Accordion.Header>
              <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                <span className="fw-bold text-dark">2. Key Assumptions</span>
                <span className="badge-required">REQUIRED</span>
              </div>
            </Accordion.Header>
            <Accordion.Body className="bg-white">
            <div className="field-row">
              <div className="field-label-row">
                <label className="field-label">
                  {t("Key_Assumptions_Tested")} <span className="required">*</span>
                </label>
              </div>
              <p className="text-muted small mb-2 project-form--s17">The beliefs this bet is testing — at least one. If any turns out false, the bet's case weakens.</p>
              <div className="project-form--s18">
                {[0, 1, 2].map(idx => <React.Fragment key={idx}>
                  <input ref={keyAssumptionsRefs[idx]} type="text" value={keyAssumptions[idx] || ""} onChange={e => handleKeyAssumptionChange(idx, e.target.value)} placeholder={`${t("Assumption_Placeholder")} ${idx + 1}...`} className={`field-input ${showErrors && fieldErrors[`keyAssumptions_${idx}`] ? "error" : ""}`} readOnly={isFieldDisabled("key_assumptions")} onFocus={() => handleFieldFocus("key_assumptions")} />
                  {showErrors && fieldErrors[`keyAssumptions_${idx}`] && <small className="error-text">{fieldErrors[`keyAssumptions_${idx}`]}</small>}
                </React.Fragment>)}
              </div>
            </div>

            { }
            <div className="grid-2">
              <TextAreaField ref={successCriteriaRef} label={t("Continue_If_Label")} subLabel="Conditions that confirm the bet is working." value={successCriteria} onChange={handleSuccessCriteriaChange} placeholder={t("Success_Criteria_Placeholder")} error={showErrors && fieldErrors.successCriteria} readOnly={isFieldDisabled("success_criteria") || isSubmitting} onFocus={handleFieldFocus} fieldName="success_criteria" required isSubmitting={isSubmitting} />
              <TextAreaField ref={killCriteriaRef} label={t("Stop_If_Label")} subLabel="Conditions that would make you kill the bet." value={killCriteria} onChange={handleKillCriteriaChange} placeholder={t("Kill_Criteria_Placeholder")} error={showErrors && fieldErrors.killCriteria} readOnly={isFieldDisabled("kill_criteria") || isSubmitting} onFocus={handleFieldFocus} fieldName="kill_criteria" required isSubmitting={isSubmitting} />
            </div>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="2" className="mb-3 border rounded form-accordion-item">
            <Accordion.Header>
              <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                <span className="fw-bold text-dark">3. {t('Strategic_Context')}</span>
                <span className="badge-required">REQUIRED</span>
              </div>
            </Accordion.Header>
            <Accordion.Body className="bg-white">
              
              { }
              <div className="grid-3 project-form--s19 mb-3">
                {(!isLaunched && (status || "").toLowerCase() === "draft") ? (
                  <div className="sf-wrapper" ref={statusRef}>
                    <label className="sf-label">
                      {t("Status")}
                    </label>
                    <div className="d-flex align-items-center">
                      <div className="border rounded px-3 py-2 bg-white text-secondary fw-bold text-uppercase d-inline-block shadow-sm" style={{ fontSize: '0.85rem', borderColor: '#e2e8f0' }}>
                        DRAFT
                      </div>
                      <span className="ms-3 text-muted fst-italic" style={{ fontSize: '0.85rem' }}>
                        Kickstart to activate
                      </span>
                    </div>
                  </div>
                ) : (
                  <SelectField ref={statusRef} label={t("Status")} icon={<TrendingUp size={16} />} options={(() => {
                    const currentStatus = (status || "").toLowerCase();
                    const isLaunchedLocal = (launchStatus || "").toLowerCase() === "launched" || ["active", "at risk", "paused", "completed", "scaled"].includes(currentStatus);
                    const createOption = (val, label, icon, isDisabled) => ({
                      value: val,
                      label: isDisabled && val.toLowerCase() !== currentStatus ? <span className="project-form--s20">
                        {label} <Lock size={12} color="#94a3b8" />
                      </span> : label,
                      icon,
                      disabled: isDisabled && val.toLowerCase() !== currentStatus
                    });
                    const baseOptions = [{
                      key: 'draft',
                      value: "Draft",
                      label: t("Draft"),
                      icon: <Circle size={14} color="gray" fill="gray" />
                    }, {
                      key: 'active',
                      value: "Active",
                      label: t("Active"),
                      icon: <Circle size={14} color="green" fill="green" />
                    }, {
                      key: 'at risk',
                      value: "At Risk",
                      label: t("At Risk"),
                      icon: <Circle size={14} color="red" fill="red" />
                    }, {
                      key: 'paused',
                      value: "Paused",
                      label: t("Paused"),
                      icon: <Circle size={14} color="orange" fill="orange" />
                    }, {
                      key: 'killed',
                      value: "Killed",
                      label: t("Killed"),
                      icon: <Circle size={14} color="black" fill="black" />
                    }, {
                      key: 'completed',
                      value: "Completed",
                      label: t("Completed"),
                      icon: <CheckCircle size={14} color="blue" />
                    }, {
                      key: 'scaled',
                      value: "Scaled",
                      label: t("Scaled"),
                      icon: <Circle size={14} color="purple" fill="purple" />
                    }];
                    if (isTerminal) {
                      return baseOptions.map(opt => createOption(opt.value, opt.label, opt.icon, true));
                    }
                    return baseOptions.map(opt => {
                      let isDisabled = true;
                      const target = opt.key;
                      if (target === currentStatus) {
                        isDisabled = false;
                      } else if (!isLaunchedLocal) {
                        if (mode === "new") {
                          if (['draft'].includes(target)) isDisabled = false;
                        } else {
                          if (['draft', 'killed'].includes(target)) isDisabled = false;
                        }
                      } else {
                        if (currentStatus === 'active' || currentStatus === 'at risk') {
                          if (['active', 'at risk', 'paused', 'completed', 'killed', 'scaled'].includes(target)) isDisabled = false;
                        } else if (currentStatus === 'paused') {
                          if (['active', 'killed'].includes(target)) isDisabled = false;
                        } else if (currentStatus === 'killed' && isAdmin) {
                          if (isLaunchedLocal) {
                            if (['active', 'at risk', 'paused'].includes(target)) isDisabled = false;
                          } else {
                            if (['draft', 'active'].includes(target)) isDisabled = false;
                          }
                        }
                      }
                      return createOption(opt.value, opt.label, opt.icon, isDisabled);
                    });
                  })()} value={status} onChange={val => {
                    setStatus(val);
                    handleFieldEdit("status");
                    if (showErrors) {
                      setFieldErrors(prev => ({
                        ...prev,
                        status: val && val.trim() ? null : t("Status is required")
                      }));
                    }
                  }} open={openDropdown === "status"} setOpen={() => setOpenDropdown(openDropdown === "status" ? null : "status")} disabled={isReadOnly || isTerminal} fieldName="status" onFieldFocus={handleFieldFocus} onFieldEdit={handleFieldEdit} required error={showErrors && fieldErrors.status} />
                )}

                <SelectField label={t("Learning_State")} icon={<Zap size={16} />} options={(() => {
                  const isLaunched = launchStatus === "launched";
                  const currentLearningState = (learningState || "").toLowerCase();
                  const createOption = (val, label, icon, isDisabled) => ({
                    value: val,
                    label: isDisabled && val.toLowerCase() !== currentLearningState ? <span className="project-form--s20">
                      {label} <Lock size={12} color="#94a3b8" />
                    </span> : label,
                    icon,
                    disabled: isDisabled && val.toLowerCase() !== currentLearningState
                  });
                  return [createOption("Testing", t("Testing"), <Clock size={14} color="blue" />, false), createOption("Validated", t("Validated"), <CheckCircle size={14} color="green" />, !isLaunched || isTerminal), createOption("Invalidated", t("Invalidated"), <XCircle size={14} color="red" />, !isLaunched || isTerminal)];
                })()} value={learningState} onChange={val => {
                  setLearningState(val);
                  handleFieldEdit("learning_state");
                  if (showErrors) {
                    setFieldErrors(prev => ({
                      ...prev,
                      learningState: val ? null : t("Learning state is required")
                    }));
                  }
                }} open={openDropdown === "learning_state"} setOpen={() => setOpenDropdown(openDropdown === "learning_state" ? null : "learning_state")} disabled={isFieldDisabled("learning_state") || isSubmitting || isTerminal} fieldName="learning_state" onFieldFocus={handleFieldFocus} onFieldEdit={handleFieldEdit} required error={showErrors && fieldErrors.learningState} />

                <SelectField label={t("Strategic_Theme_Horizon")} icon={<Lock size={16} />} options={themeOptions} value={selectedTheme} onChange={setSelectedTheme} open={openDropdown === "theme"} setOpen={() => setOpenDropdown(openDropdown === "theme" ? null : "theme")} disabled={isFieldDisabled("theme")} fieldName="theme" onFieldFocus={handleFieldFocus} onFieldEdit={handleFieldEdit} />
              </div>

              { }
              <div className="grid-3 mb-3">
                <SelectField label={t("Impact")} icon={<TrendingUp size={16} />} options={impactOptions} value={selectedImpact} onChange={setSelectedImpact} open={openDropdown === "impact"} setOpen={() => setOpenDropdown(openDropdown === "impact" ? null : "impact")} disabled={isFieldDisabled("impact")} fieldName="impact" onFieldFocus={handleFieldFocus} onFieldEdit={handleFieldEdit} />
                <SelectField label={t("Effort")} icon={<Zap size={16} />} options={effortOptions} value={selectedEffort} onChange={setSelectedEffort} open={openDropdown === "effort"} setOpen={() => setOpenDropdown(openDropdown === "effort" ? null : "effort")} disabled={isFieldDisabled("effort")} fieldName="effort" onFieldFocus={handleFieldFocus} onFieldEdit={handleFieldEdit} />
                <SelectField label={t("Risk")} icon={<AlertTriangle size={16} />} options={riskOptions} value={selectedRisk} onChange={setSelectedRisk} open={openDropdown === "risk"} setOpen={() => setOpenDropdown(openDropdown === "risk" ? null : "risk")} disabled={isFieldDisabled("risk")} fieldName="risk" onFieldFocus={handleFieldFocus} onFieldEdit={handleFieldEdit} />
              </div>

              <div className="field-row">
                <div className="field-label-row">
                  <label className="field-label">{t("Dependencies")} <span className="required">*</span></label>
                  {renderLockBadge("dependencies")}
                </div>
                <p className="text-muted small mb-2 project-form--s17">Bets, decisions, or external events this one depends on. Add at least one — or check "No external dependencies" if there are none.</p>
                
                <div className="project-form--s18">
                  {dependencies !== "[NONE]" && (() => {
                    const localDeps = depsArray.length === 0 ? [""] : depsArray;
                    return localDeps.map((dep, idx) => (
                      <div key={idx} className="d-flex align-items-center mb-2">
                        <span className="me-2 text-muted" style={{ fontSize: '20px', lineHeight: '1' }}>•</span>
                        <input
                          type="text"
                          className="field-input m-0"
                          placeholder="A bet, decision, or external event..."
                          value={dep}
                          onChange={(e) => {
                            const newDeps = [...localDeps];
                            newDeps[idx] = e.target.value;
                            setDependencies(newDeps.join("\n"));
                            handleFieldEdit("dependencies");
                          }}
                          readOnly={isFieldDisabled("dependencies")}
                          onFocus={() => handleFieldFocus("dependencies")}
                        />
                        <button 
                          type="button" 
                          className="btn btn-link text-muted p-0 ms-2"
                          style={{ textDecoration: 'none', fontSize: '18px' }}
                          onClick={() => {
                            const newDeps = [...localDeps];
                            newDeps.splice(idx, 1);
                            setDependencies(newDeps.join("\n"));
                            handleFieldEdit("dependencies");
                          }}
                          disabled={isFieldDisabled("dependencies")}
                        >
                          ×
                        </button>
                      </div>
                    ));
                  })()}
                </div>
                
                {dependencies !== "[NONE]" && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm mt-2 mb-3"
                    style={{ borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}
                    onClick={() => {
                      const newDeps = depsArray.length === 0 ? [""] : [...depsArray];
                      newDeps.push("");
                      setDependencies(newDeps.join("\n"));
                      handleFieldEdit("dependencies");
                    }}
                    disabled={isFieldDisabled("dependencies")}
                  >
                    + Add a dependency
                  </button>
                )}

                <div className="d-flex align-items-center">
                  <input
                    type="checkbox"
                    id="no-dependencies"
                    className="form-check-input me-2 mt-0"
                    checked={dependencies === "[NONE]"}
                    onChange={(e) => {
                      setDependencies(e.target.checked ? "[NONE]" : "");
                      handleFieldEdit("dependencies");
                    }}
                    disabled={isFieldDisabled("dependencies")}
                  />
                  <label htmlFor="no-dependencies" className="fw-bold mb-0" style={{ cursor: 'pointer', fontSize: '14px' }}>
                    No external dependencies
                  </label>
                </div>
                
                {showErrors && !isDependenciesSet && <small className="error-text mt-2 d-block">Dependencies are required.</small>}
              </div>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="3" className="mb-3 border rounded form-accordion-item">
            <Accordion.Header>
              <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                <span className="fw-bold text-dark">4. RAPID roles</span>
                <span className="badge bg-light text-muted border project-form--s21">OPTIONAL</span>
              </div>
            </Accordion.Header>
            <Accordion.Body className="bg-white">

              <div className="rapid-banner">
                <Info size={20} className="rapid-banner-icon" />
                <p className="rapid-banner-text">
                  A clear-decision framework from Bain. The <strong>D</strong> is the only required role; the others sharpen accountability without diluting it.
                </p>
              </div>

              {/* DECIDER (D) - REQUIRED */}
              <div className="rapid-card rapid-card-decide">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-start text-dark">
                    <div className="rapid-icon rapid-icon-decide me-3">D</div>
                    <div>
                      <div className="rapid-title">Decide</div>
                      <div className="rapid-subtitle">The accountable — single person who owns the call.</div>
                    </div>
                  </div>
                </div>
                <SelectField ref={accountableOwnerRef} label="" icon={<Zap size={14} />} options={eligibleOwners.map(o => ({
                  value: o._id,
                  label: o.name,
                  icon: o.role === 'company_admin' || o.role === 'super_admin' ? <ShieldCheck size={14} color="#2563eb" /> : o.role === 'collaborator' ? <Users size={14} color="#64748b" /> : <Circle size={14} color="gray" />
                }))} value={accountableOwnerId} onChange={val => {
                  setAccountableOwnerId(val);
                  const obj = eligibleOwners.find(o => o._id === val);
                  if (obj) setAccountableOwner(obj.name);
                  handleFieldEdit("accountable_owner");
                  if (showErrors) {
                    setFieldErrors(prev => ({
                      ...prev,
                      accountableOwnerId: val ? null : t("Owner selection is required")
                    }));
                  }
                }} open={openDropdown === "accountable_owner"} setOpen={() => setOpenDropdown(openDropdown === "accountable_owner" ? null : "accountable_owner")} fieldName="accountable_owner" onFieldFocus={handleFieldFocus} onFieldEdit={handleFieldEdit} required error={showErrors && fieldErrors.accountableOwnerId} disabled={isFieldDisabled("accountable_owner")} />
              </div>

              {/* RECOMMEND (R) */}
              {/* RECOMMEND (R) */}
              <div className="rapid-card">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-start text-dark">
                    <div className="rapid-icon me-3">R</div>
                    <div>
                      <div className="rapid-title">Recommend</div>
                      <div className="rapid-subtitle">Proposes the decision and gathers the case.</div>
                    </div>
                  </div>
                </div>
                {recommendRoles.map((roleId, idx) => (
                  <div className="d-flex align-items-center mb-2" key={`R-${idx}`}>
                    <div className="flex-grow-1">
                      <SelectField 
                        options={eligibleOwners.map(o => ({
                          value: o._id,
                          label: o.name,
                          icon: o.role === 'company_admin' || o.role === 'super_admin' ? <ShieldCheck size={14} color="#2563eb" /> : o.role === 'collaborator' ? <Users size={14} color="#64748b" /> : <Circle size={14} color="gray" />
                        }))}
                        value={roleId}
                        onChange={val => {
                          const newArray = [...recommendRoles];
                          newArray[idx] = val;
                          setRecommendRoles(newArray);
                          handleFieldEdit("rapid_roles");
                        }}
                        open={openDropdown === `R_${idx}`}
                        setOpen={() => setOpenDropdown(openDropdown === `R_${idx}` ? null : `R_${idx}`)}
                        disabled={isFieldDisabled("rapid_roles")}
                      />
                    </div>
                    <button className="btn btn-sm btn-link text-danger ms-2 text-decoration-none fw-bold" onClick={(e) => { e.preventDefault(); const newArray = [...recommendRoles]; newArray.splice(idx, 1); setRecommendRoles(newArray); handleFieldEdit("rapid_roles"); }} disabled={isFieldDisabled("rapid_roles")}>×</button>
                  </div>
                ))}
                {!isFieldDisabled("rapid_roles") && (
                  <button className="btn btn-sm text-primary p-0 d-flex align-items-center mt-2 fw-semibold" onClick={(e) => { e.preventDefault(); setRecommendRoles([...recommendRoles, ""]); handleFieldEdit("rapid_roles"); }} style={{fontSize: '0.85rem'}}>
                    <span className="me-1 fw-bold fs-5" style={{lineHeight: '0'}}>+</span> Add a recommender
                  </button>
                )}
              </div>

              {/* AGREE (A) */}
              {/* AGREE (A) */}
              <div className="rapid-card">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-start text-dark">
                    <div className="rapid-icon me-3">A</div>
                    <div>
                      <div className="rapid-title">Agree</div>
                      <div className="rapid-subtitle">Has veto power on the recommendation.</div>
                    </div>
                  </div>
                </div>
                {agreeRoles.map((roleId, idx) => (
                  <div className="d-flex align-items-center mb-2" key={`A-${idx}`}>
                    <div className="flex-grow-1">
                      <SelectField 
                        options={eligibleOwners.map(o => ({
                          value: o._id,
                          label: o.name,
                          icon: o.role === 'company_admin' || o.role === 'super_admin' ? <ShieldCheck size={14} color="#2563eb" /> : o.role === 'collaborator' ? <Users size={14} color="#64748b" /> : <Circle size={14} color="gray" />
                        }))}
                        value={roleId}
                        onChange={val => {
                          const newArray = [...agreeRoles];
                          newArray[idx] = val;
                          setAgreeRoles(newArray);
                          handleFieldEdit("rapid_roles");
                        }}
                        open={openDropdown === `A_${idx}`}
                        setOpen={() => setOpenDropdown(openDropdown === `A_${idx}` ? null : `A_${idx}`)}
                        disabled={isFieldDisabled("rapid_roles")}
                      />
                    </div>
                    <button className="btn btn-sm btn-link text-danger ms-2 text-decoration-none fw-bold" onClick={(e) => { e.preventDefault(); const newArray = [...agreeRoles]; newArray.splice(idx, 1); setAgreeRoles(newArray); handleFieldEdit("rapid_roles"); }} disabled={isFieldDisabled("rapid_roles")}>×</button>
                  </div>
                ))}
                {!isFieldDisabled("rapid_roles") && (
                  <button className="btn btn-sm text-primary p-0 d-flex align-items-center mt-2 fw-semibold" onClick={(e) => { e.preventDefault(); setAgreeRoles([...agreeRoles, ""]); handleFieldEdit("rapid_roles"); }} style={{fontSize: '0.85rem'}}>
                    <span className="me-1 fw-bold fs-5" style={{lineHeight: '0'}}>+</span> Add an agree-er
                  </button>
                )}
              </div>

              {/* INPUT (I) */}
              {/* INPUT (I) */}
              <div className="rapid-card">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div className="d-flex align-items-start text-dark">
                    <div className="rapid-icon me-3">I</div>
                    <div>
                      <div className="rapid-title">Input</div>
                      <div className="rapid-subtitle">Is consulted (no veto, informed opinion).</div>
                    </div>
                  </div>
                </div>

                {inputRoles.map((roleId, idx) => (
                  <div className="d-flex align-items-center mb-2" key={`I-${idx}`}>
                    <div className="flex-grow-1">
                      <SelectField 
                        options={eligibleOwners.map(o => ({
                          value: o._id,
                          label: o.name,
                          icon: o.role === 'company_admin' || o.role === 'super_admin' ? <ShieldCheck size={14} color="#2563eb" /> : o.role === 'collaborator' ? <Users size={14} color="#64748b" /> : <Circle size={14} color="gray" />
                        }))}
                        value={roleId}
                        onChange={val => {
                          const newArray = [...inputRoles];
                          newArray[idx] = val;
                          setInputRoles(newArray);
                          handleFieldEdit("rapid_roles");
                        }}
                        open={openDropdown === `I_${idx}`}
                        setOpen={() => setOpenDropdown(openDropdown === `I_${idx}` ? null : `I_${idx}`)}
                        disabled={isFieldDisabled("rapid_roles")}
                      />
                    </div>
                    <button className="btn btn-sm btn-link text-danger ms-2 text-decoration-none fw-bold" onClick={(e) => { e.preventDefault(); const newArray = [...inputRoles]; newArray.splice(idx, 1); setInputRoles(newArray); handleFieldEdit("rapid_roles"); }} disabled={isFieldDisabled("rapid_roles")}>×</button>
                  </div>
                ))}
                {!isFieldDisabled("rapid_roles") && (
                  <button className="btn btn-sm text-primary p-0 d-flex align-items-center mt-2 fw-semibold" onClick={(e) => { e.preventDefault(); setInputRoles([...inputRoles, ""]); handleFieldEdit("rapid_roles"); }} style={{fontSize: '0.85rem'}}>
                    <span className="me-1 fw-bold fs-5" style={{lineHeight: '0'}}>+</span> Add an input
                  </button>
                )}
              </div>

              {/* PERFORM (P) */}
              {/* PERFORM (P) */}
              <div className="rapid-card mb-2">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-start text-dark">
                    <div className="rapid-icon me-3">P</div>
                    <div>
                      <div className="rapid-title">Perform</div>
                      <div className="rapid-subtitle">Executes once the decision is made.</div>
                    </div>
                  </div>
                </div>
                {performRoles.map((roleId, idx) => (
                  <div className="d-flex align-items-center mb-2" key={`P-${idx}`}>
                    <div className="flex-grow-1">
                      <SelectField 
                        options={eligibleOwners.map(o => ({
                          value: o._id,
                          label: o.name,
                          icon: o.role === 'company_admin' || o.role === 'super_admin' ? <ShieldCheck size={14} color="#2563eb" /> : o.role === 'collaborator' ? <Users size={14} color="#64748b" /> : <Circle size={14} color="gray" />
                        }))}
                        value={roleId}
                        onChange={val => {
                          const newArray = [...performRoles];
                          newArray[idx] = val;
                          setPerformRoles(newArray);
                          handleFieldEdit("rapid_roles");
                        }}
                        open={openDropdown === `P_${idx}`}
                        setOpen={() => setOpenDropdown(openDropdown === `P_${idx}` ? null : `P_${idx}`)}
                        disabled={isFieldDisabled("rapid_roles")}
                      />
                    </div>
                    <button className="btn btn-sm btn-link text-danger ms-2 text-decoration-none fw-bold" onClick={(e) => { e.preventDefault(); const newArray = [...performRoles]; newArray.splice(idx, 1); setPerformRoles(newArray); handleFieldEdit("rapid_roles"); }} disabled={isFieldDisabled("rapid_roles")}>×</button>
                  </div>
                ))}
                {!isFieldDisabled("rapid_roles") && (
                  <button className="btn btn-sm text-primary p-0 d-flex align-items-center mt-2 fw-semibold" onClick={(e) => { e.preventDefault(); setPerformRoles([...performRoles, ""]); handleFieldEdit("rapid_roles"); }} style={{fontSize: '0.85rem'}}>
                    <span className="me-1 fw-bold fs-5" style={{lineHeight: '0'}}>+</span> Add a performer
                  </button>
                )}
              </div>

            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="4" className="mb-3 border rounded form-accordion-item">
          <Accordion.Header>
            <div className="d-flex justify-content-between align-items-center w-100 pe-3">
              <span className="fw-bold text-dark">5. {t('Detailed_Planning')}</span>
              <span className="badge-optional">OPTIONAL</span>
            </div>
          </Accordion.Header>
          <Accordion.Body className="bg-white">

            <TextAreaField ref={highLevelReqRef} label={t("Constraints_Non_Negotiables")} value={highLevelReq} onChange={e => {
              setHighLevelReq(e.target.value);
              handleFieldEdit("high_level_requirements");
            }} placeholder={t("what_are_the_main_requirements_or_constraints")} error={showErrors && fieldErrors.highLevelReq} readOnly={isFieldDisabled("high_level_requirements")} onFocus={handleFieldFocus} fieldName="high_level_requirements" />

            <TextAreaField ref={scopeRef} label={t("Explicitly_Out_of_Scope")} value={scope} onChange={e => {
              setScope(e.target.value);
              handleFieldEdit("scope_definition");
            }} placeholder={t("define_what_is_not_included_in_this_project")} error={showErrors && fieldErrors.scope} readOnly={isFieldDisabled("scope_definition")} onFocus={handleFieldFocus} fieldName="scope_definition" />

            <TextAreaField ref={outcomeRef} label={t("Expected_Outcome")} value={outcome} onChange={e => {
              setOutcome(e.target.value);
              handleFieldEdit("expected_outcome");
            }} placeholder={t("what_is_the_end_result_use_outcome_based_wording")} error={showErrors && fieldErrors.outcome} readOnly={isFieldDisabled("expected_outcome")} onFocus={handleFieldFocus} fieldName="expected_outcome" />

            <div className="field-row">
              <div className="field-label-row">
                <label className="field-label">{t("Success_Metrics")}</label>
                {renderLockBadge("success_metrics")}
              </div>
              <textarea ref={successMetricsRef} placeholder={t("success_metrics_placeholder")} rows={3} className={`field-textarea ${showErrors && fieldErrors.successMetrics ? "error" : ""}`} value={successMetrics || ""} onChange={e => {
                setSuccessMetrics(e.target.value);
                handleFieldEdit("success_metrics");
              }} readOnly={isFieldDisabled("success_metrics")} onFocus={() => handleFieldFocus("success_metrics")} />
              {showErrors && fieldErrors.successMetrics && <small className="error-text">{fieldErrors.successMetrics}</small>}
            </div>

            <div className="grid-2">
              <div>
                <div className="field-label-row">
                  <label className="field-label">
                    {t("Estimated_Timeline")}
                  </label>
                  {renderLockBadge("estimated_timeline")}
                </div>
                <input type="text" placeholder="e.g., 3–6 months" className="field-input" value={timeline || ""} onChange={e => {
                  setTimeline(e.target.value);
                  handleFieldEdit("estimated_timeline");
                }} readOnly={isFieldDisabled("estimated_timeline")} onFocus={() => handleFieldFocus("estimated_timeline")} />
              </div>

              <div>
                <div className="field-label-row">
                  <label className="field-label">
                    {t("Budget_Estimate")}
                  </label>
                  {renderLockBadge("budget_estimate")}
                </div>
                <input ref={budgetRef} type="text" placeholder="e.g., $50K - $100K" className={`field-input ${showErrors && fieldErrors.budget ? "error" : ""}`} value={budget || ""} onChange={handleBudgetChange} onKeyPress={handleBudgetKeyPress} readOnly={isFieldDisabled("budget_estimate")} onFocus={() => handleFieldFocus("budget_estimate")} />
                {showErrors && fieldErrors.budget && <small className="error-text">{fieldErrors.budget}</small>}
              </div>
            </div>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </fieldset>
  </>;
};
export default ProjectForm;
