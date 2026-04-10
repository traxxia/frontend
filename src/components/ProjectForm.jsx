import React, { useState, useRef, useEffect, forwardRef } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Breadcrumb } from "react-bootstrap";
import { TrendingUp, Zap, AlertTriangle, Circle, Diamond, Rocket, Bolt, Lightbulb, Heart, Shield, Boxes, Clock, DollarSign, Lock, CheckCircle, XCircle, Edit2, ShieldCheck, Users, Info } from "lucide-react";
import { validateField } from "../utils/validation";
import "../styles/NewProjectPage.css";

// Module-level cache to deduplicate requests across re-renders
const eligibleOwnersCache = new Map();


const impactOptions = [
  { value: "High", label: "High - Game changer", icon: <Circle size={14} color="green" fill="green" /> },
  { value: "Medium", label: "Medium - Significant", icon: <Circle size={14} color="gold" fill="gold" /> },
  { value: "Low", label: "Low - Incremental", icon: <Circle size={14} color="gray" fill="gray" /> },
];

const effortOptions = [
  {
    value: "Small",
    label: "Small - 1–3 months",
    icon: <Diamond size={14} fill="black" color="black" />,
  },
  {
    value: "Medium",
    label: "Medium - 3–6 months",
    icon: (
      <div style={{ display: "flex", gap: "2px" }}>
        <Diamond size={14} fill="black" color="black" />
        <Diamond size={14} fill="black" color="black" />
      </div>
    ),
  },
  {
    value: "Large",
    label: "Large - 6+ months",
    icon: (
      <div style={{ display: "flex", gap: "2px" }}>
        <Diamond size={14} fill="black" color="black" />
        <Diamond size={14} fill="black" color="black" />
        <Diamond size={14} fill="black" color="black" />
      </div>
    ),
  },
];

const riskOptions = [
  {
    value: "Low",
    label: "Low - Proven approach",
    icon: <Circle size={14} color="green" fill="green" />,
  },
  {
    value: "Medium",
    label: "Medium - Some uncertainty",
    icon: <Circle size={14} color="gold" fill="gold" />,
  },
  {
    value: "High",
    label: "High - Experimental",
    icon: <Circle size={14} color="red" fill="red" />,
  },
];

const themeOptions = [
  {
    value: "Growth",
    label: "Growth & Expansion",
    icon: <Rocket size={16} color="#e11d48" />,
  },
  {
    value: "Efficiency",
    label: "Operational Efficiency",
    icon: <Bolt size={16} color="#f59e0b" />,
  },
  {
    value: "Innovation",
    label: "Innovation & R&D",
    icon: <Lightbulb size={16} color="#facc15" />,
  },
  {
    value: "CustomerExperience",
    label: "Customer Experience",
    icon: <Heart size={16} color="#dc2626" fill="#dc2626" />,
  },
  {
    value: "RiskMitigation",
    label: "Risk Mitigation",
    icon: <Shield size={16} color="#3b82f6" />,
  },
  {
    value: "Platform",
    label: "Platform & Infrastructure",
    icon: <Boxes size={16} color="#fb923c" />,
  },
];
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
  error = null,
}, ref) => {
  const { t } = useTranslation();
  const dropdownRef = useRef(null);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (open) setOpen(); // Close only if open
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  // Combine refs if needed, but here we just need ref for scrolling
  return (
    <div className="sf-wrapper" ref={(node) => {
      dropdownRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }} tabIndex={-1}>
      {label && (
        <label className="sf-label">
          {icon} {label} {required && <span className="required">*</span>}
        </label>
      )}
      <div className="sf-dropdown-wrapper">
        <div
          className={`sf-dropdown-header ${error ? "error" : ""}`}
          onClick={() => {
            if (disabled) return;
            onFieldFocus?.(fieldName);
            onFieldEdit?.(fieldName);
            setOpen();
          }}
          style={{
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            backgroundColor: disabled ? "#f5f5f5" : "#fff"
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {selectedOption?.icon}
            {selectedOption?.label || t("Select_option")}
          </span>
          <span className={`sf-arrow ${open ? "open" : ""}`}>▼</span>
        </div>
        {open && !disabled && (
          <div className="sf-options-container">
            {options.map((item) => (
              <div
                key={item.value}
                className={`sf-option ${item.disabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (item.disabled) return; // Prevent selection of disabled options
                  onChange(item.value);
                  onFieldEdit?.(fieldName);
                  setOpen();
                }}
                style={{
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.6 : 1,
                  pointerEvents: item.disabled ? 'none' : 'auto'
                }}
              >
                {item.icon} {item.label}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <small className="error-text" style={{ display: 'block', marginTop: '4px' }}>{error}</small>}
    </div>
  );
});

// Reusable Input Field Component
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
  return (
    <div className="field-row">
      <div className="field-label-row">
        <label className="field-label">
          {label} {required && <span className="required">*</span>}
          {subLabel && <small className="field-sub-label" style={{ display: 'block', fontWeight: 'normal', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{subLabel}</small>}
        </label>
        {maxLength && (
          <small className="text-muted" style={{ marginLeft: 'auto', fontSize: '10px' }}>
            {(value || '').length}/{maxLength}
          </small>
        )}
      </div>
      <input
        ref={ref}
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className={`field-input ${error ? "error" : ""}`}
        readOnly={readOnly}
        onFocus={() => onFocus?.(fieldName)}
      />
      {error && <small className="error-text">{error}</small>}
    </div>
  );
});

// Reusable Text Area Component
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
  return (
    <div className="field-row">
      <div className="field-label-row">
        <label className="field-label">
          {label} {required && <span className="required">*</span>}
          {subLabel && <small className="field-sub-label" style={{ display: 'block', fontWeight: 'normal', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{subLabel}</small>}
        </label>
        {maxLength && (
          <small className="text-muted" style={{ marginLeft: 'auto', fontSize: '10px' }}>
            {(value || '').length}/{maxLength}
          </small>
        )}
      </div>
      <textarea
        ref={ref}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`field-textarea ${transparent ? "transparent" : ""} ${error ? "error" : ""}`}
        readOnly={readOnly}
        onFocus={() => onFocus?.(fieldName)}
      />
      {error && <small className="error-text">{error}</small>}
    </div>
  );
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
  // Strategic Core Props
  strategicDecision,
  setStrategicDecision,
  accountableOwner,
  setAccountableOwner,
  accountableOwnerId,
  setAccountableOwnerId,
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
  launchStatus, // Added launchStatus
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
}) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view" || readOnly;

  const [fieldErrors, setFieldErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [eligibleOwners, setEligibleOwners] = useState([]);

  useEffect(() => {
    // Only fetch for New or Edit mode
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
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/businesses/${selectedBusinessId}/eligible-owners`, {
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
    // DEFAULT: Set business owner as default if currently empty
    // This applies to new projects AND existing projects with no owner assigned yet.
    if (!accountableOwnerId && eligibleOwners.length > 0) {
      const admin =
        eligibleOwners.find(o => o.is_company_admin) ||
        eligibleOwners.find(o => o.is_business_owner);
      if (admin) {
        setAccountableOwnerId(String(admin._id));
        setAccountableOwner(admin.name || admin.email);
      }
    }
  }, [accountableOwnerId, eligibleOwners, setAccountableOwnerId, setAccountableOwner]);

  // Refs for error fields
  const projectNameRef = useRef(null);
  const descriptionRef = useRef(null);
  const importanceRef = useRef(null);
  const budgetRef = useRef(null);
  const strategicDecisionRef = useRef(null);
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

  const isFieldDisabled = (field) => isReadOnly || isSubmitting || isLockedByOther?.(field) || isTerminal;

  const handleFieldFocus = (field) => {
    if (isFieldDisabled(field)) return;
    setOpenDropdown(null);
    onFieldFocus?.(field);
  };

  const handleFieldEdit = (field) => {
    if (isFieldDisabled(field)) return;
    onFieldEdit?.(field);
  };

  const renderLockBadge = (field) => {
    const owner = getLockOwnerForField?.(field);
    if (!owner) return null;
    return (
      <span className="field-lock-indicator">
        <Lock size={14} /> {owner} {t("is_editing")}
      </span>
    );
  };

  const initialStatusLower = (initialStatus || "").toLowerCase();
  const isLaunched = (launchStatus || "").toLowerCase() === "launched" || ["active", "at risk", "paused", "completed", "scaled"].includes((status || "").toLowerCase());
  const isTerminal = initialStatusLower === "completed" || initialStatusLower === "scaled" || (initialStatusLower === "killed" && !isAdmin);

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

  const scrollToError = (ref) => {
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

  const handleProjectNameChange = (e) => {
    let value = e.target.value;
    // Allow standard characters
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
        minLength: 3,
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

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);

    if (showErrors) {
      const validation = validateField('Description', value, {
        required: true,
        minLength: 10,
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

  const handleImportanceChange = (e) => {
    const value = e.target.value;
    setImportance(value);

    if (showErrors) {
      const validation = validateField('Why This Matters', value, {
        required: true,
        minLength: 10,
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

  const handleStrategicDecisionChange = (e) => {
    const value = e.target.value;
    setStrategicDecision(value);

    if (showErrors) {
      const validation = validateField('Strategic Decision', value, {
        required: true,
        minLength: 10,
        requiresText: true
      });
      setFieldErrors(prev => ({
        ...prev,
        strategicDecision: validation.isValid ? null : validation.message
      }));
    }
    handleFieldEdit("strategic_decision");
  };

  const handleAccountableOwnerChange = (e) => {
    let value = e.target.value;
    // Allow letters, numbers, spaces, dot, hyphen, @
    value = value.replace(/[^A-Za-z0-9\s.@-]/g, "");

    setAccountableOwner(value);

    let customError = null;
    // Required
    if (!value.trim()) {
      customError = t("Accountable Owner is required.");
    }
    // Must contain at least one alphabet
    else if (!/[A-Za-z]/.test(value)) {
      customError = t("Accountable Owner must contain at least one alphabet.");
    }

    if (showErrors || customError) {
      const validation = validateField('Accountable Owner', value, {
        required: true,
        minLength: 2,
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

  const handleSuccessCriteriaChange = (e) => {
    const value = e.target.value;
    setSuccessCriteria(value);

    if (showErrors) {
      const validation = validateField('Success Criteria', value, {
        required: true,
        minLength: 10,
        requiresText: true
      });
      setFieldErrors(prev => ({
        ...prev,
        successCriteria: validation.isValid ? null : validation.message
      }));
    }
    handleFieldEdit("success_criteria");
  };

  const handleKillCriteriaChange = (e) => {
    const value = e.target.value;
    setKillCriteria(value);

    if (showErrors) {
      const validation = validateField('Kill Criteria', value, {
        required: true,
        minLength: 10,
        requiresText: true
      });
      setFieldErrors(prev => ({
        ...prev,
        killCriteria: validation.isValid ? null : validation.message
      }));
    }
    handleFieldEdit("kill_criteria");
  };

  const handleBudgetChange = (e) => {
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

  const handleBudgetKeyPress = (e) => {
    // Allow numbers, decimal point, comma, dash, dollar sign, K, M
    const allowedChars = /[0-9.,\-$KMkm]/;
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

    if (!allowedChars.test(e.key) && !controlKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleDependenciesChange = (e) => {
    const value = e.target.value;
    setDependencies(value);
    if (showErrors) {
      const validation = validateField('Dependencies', value, { minLength: 10 });
      setFieldErrors(prev => ({ ...prev, dependencies: validation.isValid ? null : t(validation.message) }));
    }
    handleFieldEdit("dependencies");
  };

  const handleSuccessMetricsChange = (e) => {
    const value = e.target.value;
    setSuccessMetrics(value);
    if (showErrors) {
      const validation = validateField('Success Metrics (KPIs)', value, { minLength: 10 });
      setFieldErrors(prev => ({ ...prev, successMetrics: validation.isValid ? null : t(validation.message) }));
    }
    handleFieldEdit("success_metrics");
  };

  const handleConstraintsChange = (e) => {
    const value = e.target.value;
    setHighLevelReq(value);
    if (showErrors) {
      const validation = validateField('Constraints / Non-Negotiables', value, { minLength: 10 });
      setFieldErrors(prev => ({ ...prev, highLevelReq: validation.isValid ? null : t(validation.message) }));
    }
    handleFieldEdit("high_level_requirements");
  };

  const handleScopeChange = (e) => {
    const value = e.target.value;
    setScope(value);
    if (showErrors) {
      const validation = validateField('Explicitly Out of Scope', value, { minLength: 10 });
      setFieldErrors(prev => ({ ...prev, scope: validation.isValid ? null : t(validation.message) }));
    }
    handleFieldEdit("scope_definition");
  };

  const handleOutcomeChange = (e) => {
    const value = e.target.value;
    setOutcome(value);
    if (showErrors) {
      const validation = validateField('Expected Outcome', value, { minLength: 10 });
      setFieldErrors(prev => ({ ...prev, outcome: validation.isValid ? null : t(validation.message) }));
    }
    handleFieldEdit("expected_outcome");
  };

  const handleKeyAssumptionChange = (idx, value) => {
    const newAssumptions = [...keyAssumptions];
    newAssumptions[idx] = value;
    setKeyAssumptions(newAssumptions);
    if (showErrors && value.trim().length > 0) {
      const validation = validateField(`Assumption ${idx + 1}`, value, { minLength: 10 });
      setFieldErrors(prev => ({ ...prev, [`keyAssumptions_${idx}`]: validation.isValid ? null : t(validation.message) }));
    }
    handleFieldEdit("key_assumptions");
  };

  const handleSubmit = () => {
    // Unified validation from hook
    const validation = validateForm({ isNew: mode === "new" });
    const errors = validation.errors || {};

    setFieldErrors(errors);
    setShowErrors(true);

    const hasErrors = Object.keys(errors).length > 0;

    if (hasErrors) {
      if (errors.projectName) scrollToError(projectNameRef);
      else if (errors.description) scrollToError(descriptionRef);
      else if (errors.importance) scrollToError(importanceRef);
      else if (errors.strategicDecision) scrollToError(strategicDecisionRef);
      // Map both hook's 'accountableOwner' and 'accountableOwnerId' to the owner ref
      else if (errors.accountableOwnerId || errors.accountableOwner) scrollToError(accountableOwnerRef);
      else if (errors.successCriteria) scrollToError(successCriteriaRef);
      else if (errors.killCriteria) scrollToError(killCriteriaRef);
      else if (errors.status) scrollToError(statusRef);
      else if (errors.dependencies) scrollToError(dependenciesRef);
      else if (errors.highLevelReq) scrollToError(highLevelReqRef);
      else if (errors.scope) scrollToError(scopeRef);
      else if (errors.outcome) scrollToError(outcomeRef);
      else if (errors.successMetrics) scrollToError(successMetricsRef);
      else if (errors.keyAssumptions_0) scrollToError(keyAssumptionsRefs[0]);
      else if (errors.keyAssumptions_1) scrollToError(keyAssumptionsRefs[1]);
      else if (errors.keyAssumptions_2) scrollToError(keyAssumptionsRefs[2]);
      else if (errors.reviewCadence) {
        // We don't have a ref for cadence, but let's scroll to the status area which is nearby
        scrollToError(statusRef);
      }
      else if (errors.budget) scrollToError(budgetRef);
      return;
    }

    // All validations passed, submit the form
    onSubmit();
  };

  return (
    <>
      <fieldset disabled={isSubmitting || isReadOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
        {isTerminal && (
          <div className="terminal-status-banner" style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #dbeafe",
            borderRadius: "8px",
            padding: "10px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#1e40af"
          }}>
            <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "14px" }}>
              <span style={{ fontWeight: "600" }}>
                {(() => {
                  if (initialStatusLower === "completed") return "Project reached Completed state cannot be edited further.";
                  if (initialStatusLower === "scaled") return "Project reached Scaled state cannot be edited further.";
                  if (initialStatusLower === "killed") return "Project reached Killed state cannot be edited further.";
                  return "Project reached a final state cannot be edited further.";
                })()}
              </span>
              {decisionLog && decisionLog.length > 0 && (() => {
                const latestTerminalLog = [...decisionLog]
                  .reverse()
                  .find(log => (log.to_status || "").toLowerCase() === initialStatusLower);
                if (latestTerminalLog) {
                  return (
                    <>
                      <span style={{ color: "#3b82f6", opacity: 0.8 }}>•</span>
                      <span style={{ fontStyle: "italic", color: "#1d4ed8" }}>
                        "{latestTerminalLog.justification || t("No_justification_provided")}"
                      </span>
                    </>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        )}
        {/* Breadcrumb & Actions Header */}
        <div className="projects-breadcrumb">
          <Breadcrumb style={{ margin: 0 }}>
            <Breadcrumb.Item onClick={onBack} style={{ cursor: "pointer" }}>
              {t("Projects")}
            </Breadcrumb.Item>
            <Breadcrumb.Item active>{getTitle()}</Breadcrumb.Item>
          </Breadcrumb>

          {/* Actions - Moved to Top */}
          {!isReadOnly && (
            <div className="actions-row-top">
              <button type="button" className="btn-cancel" onClick={onBack} style={{ padding: "8px 16px" }}>
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn-create"
                onClick={handleSubmit}
                style={{ padding: "8px 16px" }}
                disabled={isSubmitting || isTerminal}
              >
                {getSubmitButtonText()}
              </button>
            </div>
          )}
        </div>

        {/* Required Information */}
        <div className="center-row">
          <div className="form-card">
            <h3 className="section-title">{t("Required_Information")}</h3>

            {/* Project Name Field - Editable in new mode, readonly in edit mode */}
            <div className="field-row">
              <div className="field-label-row">
                <label className="field-label">
                  {t("Project_Name")} <span className="required">*</span>
                </label>
                {mode !== "new" && renderLockBadge("project_name")}
              </div>
              {mode === "new" ? (
                <>
                  <input
                    ref={projectNameRef}
                    type="text"
                    value={projectName || ""}
                    onChange={handleProjectNameChange}
                    placeholder="Enter project name (minimum 3 characters)"
                    className={`field-input ${showErrors && fieldErrors.projectName ? "error" : ""}`}
                    readOnly={isReadOnly}
                    onFocus={() => handleFieldFocus("project_name")}
                    maxLength={100}
                    disabled={isSubmitting}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {showErrors && fieldErrors.projectName && (
                      <small className="error-text">{fieldErrors.projectName}</small>
                    )}
                    <small className="text-muted" style={{ marginLeft: 'auto' }}>
                      {(projectName || '').length}/100 {t("characters")}
                    </small>
                  </div>
                </>
              ) : (
                projectName && (
                  <div className="project-name-display-inline">
                    {projectName}
                  </div>
                )
              )}
            </div>

            <div className="field-row">
              <div className="field-label-row">
                <label className="field-label">
                  {t("Project_Description")} <span className="required">*</span>
                </label>
                {renderLockBadge("project_description")}
              </div>
              <textarea
                ref={descriptionRef}
                value={description || ""}
                onChange={handleDescriptionChange}
                placeholder="Launch digital wallet product and achieve market penetration (minimum 10 characters)"
                rows={3}
                className={`field-textarea ${showErrors && fieldErrors.description ? "error" : ""}`}
                readOnly={isFieldDisabled("project_description")}
                onFocus={() => handleFieldFocus("project_description")}
                maxLength={500}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {showErrors && fieldErrors.description && (
                  <small className="error-text">{fieldErrors.description}</small>
                )}
                <small className="text-muted" style={{ marginLeft: 'auto' }}>
                  {(description || '').length}/500 {t("characters")}
                </small>
              </div>
            </div>

            <TextAreaField
              ref={importanceRef}
              label={t("Why_This_Matters")}
              value={importance}
              onChange={handleImportanceChange}
              placeholder={t("Why_This_Matters_Placeholder")}
              error={showErrors && fieldErrors.importance}
              readOnly={isFieldDisabled("why_this_matters")}
              onFocus={handleFieldFocus}
              fieldName="why_this_matters"
              required
            />
          </div>
        </div>



        {/* Strategic Core (Start of New V2 Section) */}
        <div className="center-row">
          <div className="form-card">
            <h3 className="section-title">{t("Strategic_Core")}</h3>

            {/* Strategic Decision */}
            <TextAreaField
              ref={strategicDecisionRef}
              label={t("Strategic_Decision_Bet")}
              value={strategicDecision}
              onChange={handleStrategicDecisionChange}
              placeholder={t("Strategic_Decision_Placeholder")}
              error={showErrors && fieldErrors.strategicDecision}
              readOnly={isFieldDisabled("strategic_decision")}
              onFocus={handleFieldFocus}
              fieldName="strategic_decision"
              required
            />

            {/* Accountable Owner */}
            {/* Accountable Owner Selection */}
            <SelectField
              ref={accountableOwnerRef}
              label={t("Accountable_Owner")}
              icon={<Zap size={14} />}
              options={eligibleOwners.map(o => ({
                value: o._id,
                label: o.name,
                icon: (o.role === 'company_admin' || o.role === 'super_admin')
                  ? <ShieldCheck size={14} color="#2563eb" />
                  : o.role === 'collaborator'
                    ? <Users size={14} color="#64748b" />
                    : <Circle size={14} color="gray" />
              }))}
              value={accountableOwnerId}
              onChange={(val) => {
                setAccountableOwnerId(val);
                const obj = eligibleOwners.find(o => o._id === val);
                if (obj) setAccountableOwner(obj.name);
                handleFieldEdit("accountable_owner");
              }}
              open={openDropdown === "accountable_owner"}
              setOpen={() => setOpenDropdown(openDropdown === "accountable_owner" ? null : "accountable_owner")}
              fieldName="accountable_owner"
              onFieldFocus={handleFieldFocus}
              onFieldEdit={handleFieldEdit}
              required
              error={showErrors && fieldErrors.accountableOwnerId}
              disabled={isFieldDisabled("accountable_owner")}
            />

            {/* Key Assumptions */}
            <div className="field-row">
              <div className="field-label-row">
                <label className="field-label">
                  {t("Key_Assumptions_Tested")}
                </label>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[0, 1, 2].map((idx) => (
                  <React.Fragment key={idx}>
                    <input
                      ref={keyAssumptionsRefs[idx]}
                      type="text"
                      value={keyAssumptions[idx] || ""}
                      onChange={(e) => handleKeyAssumptionChange(idx, e.target.value)}
                      placeholder={`${t("Assumption_Placeholder")} ${idx + 1}...`}
                      className={`field-input ${showErrors && fieldErrors[`keyAssumptions_${idx}`] ? "error" : ""}`}
                      readOnly={isFieldDisabled("key_assumptions")}
                      onFocus={() => handleFieldFocus("key_assumptions")}
                    />
                    {showErrors && fieldErrors[`keyAssumptions_${idx}`] && (
                      <small className="error-text">{fieldErrors[`keyAssumptions_${idx}`]}</small>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Success & Kill Criteria */}
            <div className="grid-2">
              <TextAreaField
                ref={successCriteriaRef}
                label={t("Continue_If_Label")}
                value={successCriteria}
                onChange={handleSuccessCriteriaChange}
                placeholder={t("Success_Criteria_Placeholder")}
                error={showErrors && fieldErrors.successCriteria}
                readOnly={isFieldDisabled("success_criteria") || isSubmitting}
                onFocus={handleFieldFocus}
                fieldName="success_criteria"
                required
                isSubmitting={isSubmitting}
              />
              <TextAreaField
                ref={killCriteriaRef}
                label={t("Stop_If_Label")}
                value={killCriteria}
                onChange={handleKillCriteriaChange}
                placeholder={t("Kill_Criteria_Placeholder")}
                error={showErrors && fieldErrors.killCriteria}
                readOnly={isFieldDisabled("kill_criteria") || isSubmitting}
                onFocus={handleFieldFocus}
                fieldName="kill_criteria"
                required
                isSubmitting={isSubmitting}
              />
            </div>

            {/* Review Cadence, Status & Learning State */}
            <div className="grid-3" style={{ marginTop: "16px" }}>
              <SelectField
                label={t("Review_Cadence")}
                icon={<Clock size={16} />}
                options={[
                  { value: "Weekly", label: t("Weekly"), icon: <Clock size={14} /> },
                  { value: "Monthly", label: t("Monthly"), icon: <Clock size={14} /> },
                  { value: "Quarterly", label: t("Quarterly"), icon: <Clock size={14} /> },
                ]}
                value={reviewCadence}
                onChange={(val) => {
                  setReviewCadence(val);
                  handleFieldEdit("review_cadence");
                }}
                open={openDropdown === "reviewCadence"}
                setOpen={() => setOpenDropdown(openDropdown === "reviewCadence" ? null : "reviewCadence")}
                disabled={isFieldDisabled("review_cadence") || isSubmitting}
                fieldName="review_cadence"
                onFieldFocus={handleFieldFocus}
                onFieldEdit={handleFieldEdit}
                required
                error={showErrors && fieldErrors.reviewCadence}
              />

              <SelectField
                ref={statusRef}
                label={t("Status")}
                icon={<TrendingUp size={16} />}
                options={(() => {
                  const currentStatus = (status || "").toLowerCase();
                  const isLaunched = (launchStatus || "").toLowerCase() === "launched" || ["active", "at risk", "paused", "completed", "scaled"].includes(currentStatus);

                  const createOption = (val, label, icon, isDisabled) => ({
                    value: val,
                    label: isDisabled && val.toLowerCase() !== currentStatus ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.5 }}>
                        {label} <Lock size={12} color="#94a3b8" />
                      </span>
                    ) : label,
                    icon,
                    disabled: isDisabled && val.toLowerCase() !== currentStatus
                  });

                  const baseOptions = [
                    { key: 'draft', value: "Draft", label: t("Draft"), icon: <Circle size={14} color="gray" fill="gray" /> },
                    { key: 'active', value: "Active", label: t("Active"), icon: <Circle size={14} color="green" fill="green" /> },
                    { key: 'at risk', value: "At Risk", label: t("At Risk"), icon: <Circle size={14} color="red" fill="red" /> },
                    { key: 'paused', value: "Paused", label: t("Paused"), icon: <Circle size={14} color="orange" fill="orange" /> },
                    { key: 'killed', value: "Killed", label: t("Killed"), icon: <Circle size={14} color="black" fill="black" /> },
                    { key: 'completed', value: "Completed", label: t("Completed"), icon: <CheckCircle size={14} color="blue" /> },
                    { key: 'scaled', value: "Scaled", label: t("Scaled"), icon: <Circle size={14} color="purple" fill="purple" /> },
                  ];

                  if (isTerminal) {
                    return baseOptions.map(opt => createOption(opt.value, opt.label, opt.icon, true));
                  }

                  return baseOptions.map(opt => {
                    let isDisabled = true;
                    const target = opt.key;

                    if (target === currentStatus) {
                      isDisabled = false;
                    } else if (!isLaunched) {
                      // Unlaunched: Draft and Killed are allowed. Active is handled via Launch mechanism.
                      if (['draft', 'killed'].includes(target)) isDisabled = false;
                    } else {
                      // Launched
                      if (currentStatus === 'active' || currentStatus === 'at risk') {
                        if (['active', 'at risk', 'paused', 'completed', 'killed', 'scaled'].includes(target)) isDisabled = false;
                      } else if (currentStatus === 'paused') {
                        if (['active', 'killed'].includes(target)) isDisabled = false;
                      } else if (currentStatus === 'killed' && isAdmin) {
                        // Admins can move back to Active or Draft (if unlaunched)
                        if (isLaunched) {
                          if (['active', 'at risk', 'paused'].includes(target)) isDisabled = false;
                        } else {
                          if (['draft', 'active'].includes(target)) isDisabled = false;
                        }
                      }
                    }

                    return createOption(opt.value, opt.label, opt.icon, isDisabled);
                  });
                })()}
                value={status}
                onChange={(val) => {
                  setStatus(val);
                  handleFieldEdit("status");
                  if (showErrors) {
                    setFieldErrors(prev => ({
                      ...prev,
                      status: (val && val.trim()) ? null : t("Status_is_required")
                    }));
                  }
                }}
                open={openDropdown === "status"}
                setOpen={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
                disabled={isReadOnly || isTerminal}
                fieldName="status"
                onFieldFocus={handleFieldFocus}
                onFieldEdit={handleFieldEdit}
                required
                error={showErrors && fieldErrors.status}
              />

              <SelectField
                label={t("Learning_State")}
                icon={<Zap size={16} />}
                options={(() => {
                  const isLaunched = launchStatus === "launched";
                  const currentLearningState = (learningState || "").toLowerCase();

                  const createOption = (val, label, icon, isDisabled) => ({
                    value: val,
                    label: isDisabled && val.toLowerCase() !== currentLearningState ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.5 }}>
                        {label} <Lock size={12} color="#94a3b8" />
                      </span>
                    ) : label,
                    icon,
                    disabled: isDisabled && val.toLowerCase() !== currentLearningState
                  });

                  // Validated and Invalidated are only available after launch
                  return [
                    createOption("Testing", t("Testing"), <Clock size={14} color="blue" />, false),
                    createOption("Validated", t("Validated"), <CheckCircle size={14} color="green" />, !isLaunched || isTerminal),
                    createOption("Invalidated", t("Invalidated"), <XCircle size={14} color="red" />, !isLaunched || isTerminal),
                  ];
                })()}
                value={learningState}
                onChange={(val) => {
                  setLearningState(val);
                  handleFieldEdit("learning_state");
                }}
                open={openDropdown === "learning_state"}
                setOpen={() => setOpenDropdown(openDropdown === "learning_state" ? null : "learning_state")}
                disabled={isFieldDisabled("learning_state") || isSubmitting || isTerminal}
                fieldName="learning_state"
                onFieldFocus={handleFieldFocus}
                onFieldEdit={handleFieldEdit}
              />
            </div>

          </div>
        </div>


        {/* Strategic Context */}
        <div className="center-row">
          <div className="form-card">
            <h3 className="section-title">{t("Strategic_Context")}</h3>
            <div className="grid-3">
              <SelectField
                label={t("Impact")}
                icon={<TrendingUp size={16} />}
                options={impactOptions}
                value={selectedImpact}
                onChange={setSelectedImpact}
                open={openDropdown === "impact"}
                setOpen={() => setOpenDropdown(openDropdown === "impact" ? null : "impact")}
                disabled={isFieldDisabled("impact")}
                fieldName="impact"
                onFieldFocus={handleFieldFocus}
                onFieldEdit={handleFieldEdit}
              />

              <SelectField
                label={t("Effort")}
                icon={<Zap size={16} />}
                options={effortOptions}
                value={selectedEffort}
                onChange={setSelectedEffort}
                open={openDropdown === "effort"}
                setOpen={() => setOpenDropdown(openDropdown === "effort" ? null : "effort")}
                disabled={isFieldDisabled("effort")}
                fieldName="effort"
                onFieldFocus={handleFieldFocus}
                onFieldEdit={handleFieldEdit}
              />

            </div> <br></br>

            <div className="grid-3">
              <SelectField
                label={t("Risk")}
                icon={<AlertTriangle size={16} />}
                options={riskOptions}
                value={selectedRisk}
                onChange={setSelectedRisk}
                open={openDropdown === "risk"}
                setOpen={() => setOpenDropdown(openDropdown === "risk" ? null : "risk")}
                disabled={isFieldDisabled("risk")}
                fieldName="risk"
                onFieldFocus={handleFieldFocus}
                onFieldEdit={handleFieldEdit}
              />

              <SelectField
                label={t("Strategic_Theme_Horizon")}
                icon={<Lock size={16} />}
                options={themeOptions}
                value={selectedTheme}
                onChange={setSelectedTheme}
                open={openDropdown === "theme"}
                setOpen={() => setOpenDropdown(openDropdown === "theme" ? null : "theme")}
                disabled={isFieldDisabled("theme")}
                fieldName="theme"
                onFieldFocus={handleFieldFocus}
                onFieldEdit={handleFieldEdit}
              />

            </div> <br></br>

            <div className="field-row">
              <div className="field-label-row">
                <label className="field-label">{t("Dependencies")}</label>
                {renderLockBadge("dependencies")}
              </div>
              <textarea
                ref={dependenciesRef}
                placeholder="List dependencies (one per line)"
                rows={3}
                className={`field-textarea transparent ${showErrors && fieldErrors.dependencies ? "error" : ""}`}
                value={dependencies || ""}
                onChange={e => {
                  setDependencies(e.target.value);
                  handleFieldEdit("dependencies");
                }}
                readOnly={isFieldDisabled("dependencies")}
                onFocus={() => handleFieldFocus("dependencies")}
              />
              {showErrors && fieldErrors.dependencies && (
                <small className="error-text">{fieldErrors.dependencies}</small>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Planning */}
        <div className="center-row">
          <div className="form-card">
            <h3 className="section-title">{t("Detailed_Planning")}</h3>

            <TextAreaField
              ref={highLevelReqRef}
              label={t("Constraints_Non_Negotiables")}
              value={highLevelReq}
              onChange={(e) => {
                setHighLevelReq(e.target.value);
                handleFieldEdit("high_level_requirements");
              }}
              placeholder={t("what_are_the_main_requirements_or_constraints")}
              error={showErrors && fieldErrors.highLevelReq}
              readOnly={isFieldDisabled("high_level_requirements")}
              onFocus={handleFieldFocus}
              fieldName="high_level_requirements"
            />

            <TextAreaField
              ref={scopeRef}
              label={t("Explicitly_Out_of_Scope")}
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                handleFieldEdit("scope_definition");
              }}
              placeholder={t("define_what_is_not_included_in_this_project")}
              error={showErrors && fieldErrors.scope}
              readOnly={isFieldDisabled("scope_definition")}
              onFocus={handleFieldFocus}
              fieldName="scope_definition"
            />

            <TextAreaField
              ref={outcomeRef}
              label={t("Expected_Outcome")}
              value={outcome}
              onChange={(e) => {
                setOutcome(e.target.value);
                handleFieldEdit("expected_outcome");
              }}
              placeholder={t("what_is_the_end_result_use_outcome_based_wording")}
              error={showErrors && fieldErrors.outcome}
              readOnly={isFieldDisabled("expected_outcome")}
              onFocus={handleFieldFocus}
              fieldName="expected_outcome"
            />

            <div className="field-row">
              <div className="field-label-row">
                <label className="field-label">{t("Success_Metrics")}</label>
                {renderLockBadge("success_metrics")}
              </div>
              <textarea
                ref={successMetricsRef}
                placeholder={t("success_metrics_placeholder")}
                rows={3}
                className={`field-textarea ${showErrors && fieldErrors.successMetrics ? "error" : ""}`}
                value={successMetrics || ""}
                onChange={e => {
                  setSuccessMetrics(e.target.value);
                  handleFieldEdit("success_metrics");
                }}
                readOnly={isFieldDisabled("success_metrics")}
                onFocus={() => handleFieldFocus("success_metrics")}
              />
              {showErrors && fieldErrors.successMetrics && (
                <small className="error-text">{fieldErrors.successMetrics}</small>
              )}
            </div>

            <div className="grid-2">
              <div>
                <div className="field-label-row">
                  <label className="field-label">
                    <Clock size={16} /> {t("Estimated_Timeline")}
                  </label>
                  {renderLockBadge("estimated_timeline")}
                </div>
                <input
                  type="text"
                  placeholder="e.g., 3–6 months"
                  className="field-input"
                  value={timeline || ""}
                  onChange={e => {
                    setTimeline(e.target.value);
                    handleFieldEdit("estimated_timeline");
                  }}
                  readOnly={isFieldDisabled("estimated_timeline")}
                  onFocus={() => handleFieldFocus("estimated_timeline")}
                />
              </div>

              <div>
                <div className="field-label-row">
                  <label className="field-label">
                    <DollarSign size={16} /> {t("Budget_Estimate")}
                  </label>
                  {renderLockBadge("budget_estimate")}
                </div>
                <input
                  ref={budgetRef}
                  type="text"
                  placeholder="e.g., $50K - $100K"
                  className={`field-input ${showErrors && fieldErrors.budget ? "error" : ""}`}
                  value={budget || ""}
                  onChange={handleBudgetChange}
                  onKeyPress={handleBudgetKeyPress}
                  readOnly={isFieldDisabled("budget_estimate")}
                  onFocus={() => handleFieldFocus("budget_estimate")}
                />
                {showErrors && fieldErrors.budget && (
                  <small className="error-text">{fieldErrors.budget}</small>
                )}
              </div>
            </div>
          </div>
        </div>


      </fieldset >
    </>
  );
};

export default ProjectForm;