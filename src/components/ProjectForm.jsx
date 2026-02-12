import React, { useState, useRef, useEffect, forwardRef } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Breadcrumb } from "react-bootstrap";
import { TrendingUp, Zap, AlertTriangle, Circle, Diamond, Rocket, Bolt, Lightbulb, Heart, Shield, Boxes, Clock, DollarSign, Lock, CheckCircle, XCircle } from "lucide-react";
import { validateField } from "../utils/validation";
import "../styles/NewProjectPage.css";

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
            {selectedOption?.label || "Select option"}
          </span>
          <span className={`sf-arrow ${open ? "open" : ""}`}>▼</span>
        </div>
        {open && !disabled && (
          <div className="sf-options-container">
            {options.map((item) => (
              <div
                key={item.value}
                className="sf-option"
                onClick={() => {
                  onChange(item.value);
                  onFieldEdit?.(fieldName);
                  setOpen();
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
  learningState,
  setLearningState,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view" || readOnly;

  const [fieldErrors, setFieldErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);

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

  const isFieldDisabled = (field) => isReadOnly || isSubmitting || isLockedByOther?.(field);

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
    const value = e.target.value;
    setProjectName(value);

    if (showErrors) {
      const validation = validateField('Project Name', value, {
        required: true,
        minLength: 3,
        maxLength: 100,
        requiresText: true
      });
      setFieldErrors(prev => ({
        ...prev,
        projectName: validation.isValid ? null : validation.message
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
    const value = e.target.value;
    setAccountableOwner(value);

    if (showErrors) {
      const validation = validateField('Accountable Owner', value, {
        required: true,
        requiresText: true
      });
      setFieldErrors(prev => ({
        ...prev,
        accountableOwner: validation.isValid ? null : validation.message
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

  const handleSubmit = () => {
    // Validate project name only for new projects
    const projectNameValidation = mode === "new"
      ? validateField('Project Name', projectName || '', {
        required: true,
        minLength: 3,
        maxLength: 100,
        requiresText: true
      })
      : { isValid: true, message: null };

    // Validate all required fields
    const descValidation = validateField('Description', description || '', {
      required: true,
      minLength: 10,
      maxLength: 500,
      requiresText: true
    });

    const impValidation = validateField('Why This Matters', importance || '', {
      required: true,
      minLength: 10,
      maxLength: 1000,
      requiresText: true
    });

    // Strategic Core Validation
    const decisionValidation = validateField('Strategic Decision', strategicDecision || '', { required: true, minLength: 10, requiresText: true });
    const ownerValidation = validateField('Accountable Owner', accountableOwner || '', { required: true, requiresText: true });
    const successValidation = validateField('Success Criteria', successCriteria || '', { required: true, requiresText: true });
    const killValidation = validateField('Kill Criteria', killCriteria || '', { required: true, requiresText: true });

    const budgetValidation = validateField('Budget Estimate', budget || '', {
      numeric: true,
      min: 0,
      allowSpecialChars: ['.', ',', '-', '$', 'K', 'M']
    });

    const errors = {
      projectName: projectNameValidation.isValid ? null : projectNameValidation.message,
      description: descValidation.isValid ? null : descValidation.message,
      importance: impValidation.isValid ? null : impValidation.message,
      strategicDecision: decisionValidation.isValid ? null : decisionValidation.message,
      accountableOwner: ownerValidation.isValid ? null : ownerValidation.message,
      successCriteria: successValidation.isValid ? null : successValidation.message,
      killCriteria: killValidation.isValid ? null : killValidation.message,
      budget: budgetValidation.isValid ? null : budgetValidation.message,
      status: (status && status.trim()) ? null : t("Status_is_required"),
    };
    setFieldErrors(errors);
    setShowErrors(true);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== null);

    if (hasErrors) {
      if (errors.projectName) scrollToError(projectNameRef);
      else if (errors.description) scrollToError(descriptionRef);
      else if (errors.importance) scrollToError(importanceRef);
      else if (errors.strategicDecision) scrollToError(strategicDecisionRef);
      else if (errors.accountableOwner) scrollToError(accountableOwnerRef);
      else if (errors.successCriteria) scrollToError(successCriteriaRef);
      else if (errors.killCriteria) scrollToError(killCriteriaRef);
      else if (errors.status) scrollToError(statusRef);
      else if (errors.budget) scrollToError(budgetRef);
      return;
    }

    // All validations passed, submit the form
    onSubmit();
  };

  return (
    <fieldset disabled={isSubmitting || isReadOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
      {/* Breadcrumb & Actions Header */}
      <div className="projects-breadcrumb" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Breadcrumb style={{ margin: 0 }}>
          <Breadcrumb.Item onClick={onBack} style={{ cursor: "pointer" }}>
            {t("Projects")}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>{getTitle()}</Breadcrumb.Item>
        </Breadcrumb>

        {/* Actions - Moved to Top */}
        {!isReadOnly && (
          <div className="actions-row-top" style={{ display: "flex", gap: "12px" }}>
            <button type="button" className="btn-cancel" onClick={onBack} style={{ padding: "8px 16px" }}>
              {t("cancel")}
            </button>
            <button
              type="button"
              className="btn-create"
              onClick={handleSubmit}
              style={{ padding: "8px 16px" }}
              disabled={isSubmitting}
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
                    {(projectName || '').length}/100 characters
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
                {(description || '').length}/500 characters
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
          <InputField
            ref={accountableOwnerRef}
            label={t("Accountable_Owner")}
            value={accountableOwner}
            onChange={handleAccountableOwnerChange}
            placeholder={t("Owner_Placeholder")}
            error={showErrors && fieldErrors.accountableOwner}
            readOnly={isFieldDisabled("accountable_owner")}
            onFocus={handleFieldFocus}
            fieldName="accountable_owner"
            required
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
                <input
                  key={idx}
                  type="text"
                  value={keyAssumptions[idx] || ""}
                  onChange={(e) => {
                    const newAssumptions = [...keyAssumptions];
                    newAssumptions[idx] = e.target.value;
                    setKeyAssumptions(newAssumptions);
                    handleFieldEdit("key_assumptions");
                  }}
                  placeholder={`${t("Assumption_Placeholder")} ${idx + 1}...`}
                  className="field-input"
                  readOnly={isFieldDisabled("key_assumptions")}
                  onFocus={() => handleFieldFocus("key_assumptions")}
                />
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
            />

            <SelectField
              ref={statusRef}
              label={t("Status")}
              icon={<TrendingUp size={16} />}
              options={[
                { value: "Draft", label: t("Draft"), icon: <Circle size={14} color="gray" fill="gray" /> },
                { value: "Active", label: t("Active"), icon: <Circle size={14} color="green" fill="green" /> },
                { value: "At Risk", label: t("At Risk"), icon: <Circle size={14} color="red" fill="red" /> },
                { value: "Paused", label: t("Paused"), icon: <Circle size={14} color="orange" fill="orange" /> },
                { value: "Killed", label: t("Killed"), icon: <Circle size={14} color="black" fill="black" /> },
                { value: "Scaled", label: t("Scaled"), icon: <Circle size={14} color="purple" fill="purple" /> },
              ]}
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
              disabled={isReadOnly}
              fieldName="status"
              onFieldFocus={handleFieldFocus}
              onFieldEdit={handleFieldEdit}
              required
              error={showErrors && fieldErrors.status}
            />

            <SelectField
              label={t("Learning_State")}
              icon={<Zap size={16} />}
              options={[
                { value: "Testing", label: t("Testing"), icon: <Clock size={14} color="blue" /> },
                { value: "Validated", label: t("Validated"), icon: <CheckCircle size={14} color="green" /> },
                { value: "Disproven", label: t("Disproven"), icon: <XCircle size={14} color="red" /> },
              ]}
              value={learningState}
              onChange={(val) => {
                setLearningState(val);
                handleFieldEdit("learning_state");
              }}
              open={openDropdown === "learning_state"}
              setOpen={() => setOpenDropdown(openDropdown === "learning_state" ? null : "learning_state")}
              disabled={isFieldDisabled("learning_state") || isSubmitting}
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
              placeholder="List dependencies (one per line)"
              rows={3}
              className="field-textarea transparent"
              value={dependencies || ""}
              onChange={e => {
                setDependencies(e.target.value);
                handleFieldEdit("dependencies");
              }}
              readOnly={isFieldDisabled("dependencies")}
              onFocus={() => handleFieldFocus("dependencies")}
            />
          </div>
        </div>
      </div>

      {/* Detailed Planning */}
      <div className="center-row">
        <div className="form-card">
          <h3 className="section-title">{t("Detailed_Planning")}</h3>

          <TextAreaField
            label={t("Constraints_Non_Negotiables")}
            value={highLevelReq}
            onChange={(e) => {
              setHighLevelReq(e.target.value);
              handleFieldEdit("high_level_requirements");
            }}
            placeholder={t("what_are_the_main_requirements_or_constraints")}
            readOnly={isFieldDisabled("high_level_requirements")}
            onFocus={handleFieldFocus}
            fieldName="high_level_requirements"
          />

          <TextAreaField
            label={t("Explicitly_Out_of_Scope")}
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              handleFieldEdit("scope_definition");
            }}
            placeholder={t("define_what_is_not_included_in_this_project")}
            readOnly={isFieldDisabled("scope_definition")}
            onFocus={handleFieldFocus}
            fieldName="scope_definition"
          />

          <TextAreaField
            label={t("Expected_Outcome")}
            value={outcome}
            onChange={(e) => {
              setOutcome(e.target.value);
              handleFieldEdit("expected_outcome");
            }}
            placeholder={t("what_is_the_end_result_use_outcome_based_wording")}
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
              placeholder="How will you measure success? (one metric per line)"
              rows={3}
              className="field-textarea"
              value={successMetrics || ""}
              onChange={e => {
                setSuccessMetrics(e.target.value);
                handleFieldEdit("success_metrics");
              }}
              readOnly={isFieldDisabled("success_metrics")}
              onFocus={() => handleFieldFocus("success_metrics")}
            />
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
  );
};

export default ProjectForm;