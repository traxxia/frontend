import React, { useState, useRef } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Breadcrumb } from "react-bootstrap";
import { TrendingUp, Zap, AlertTriangle, Circle, Diamond, Rocket, Bolt, Lightbulb, Heart, Shield, Boxes, Clock, DollarSign, Lock } from "lucide-react";
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

const SelectField = ({
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
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="sf-wrapper">
      {label && (
        <label className="sf-label">
          {icon} {label}
        </label>
      )}

      <div className="sf-dropdown-wrapper">
        <div
          className="sf-dropdown-header"
          onClick={() => {
            if (disabled) return;
            onFieldFocus?.(fieldName);
            onFieldEdit?.(fieldName);
            setOpen();
          }}
          style={{
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1
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
    </div>
  );
};

const ProjectForm = ({
  mode,
  readOnly = false,
  projectName,
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
}) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view" || readOnly;

  const [fieldErrors, setFieldErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);

  // Refs for error fields
  const descriptionRef = useRef(null);
  const importanceRef = useRef(null);
  const budgetRef = useRef(null);

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

  const isFieldDisabled = (field) => isReadOnly || isLockedByOther?.(field);

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

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    
    if (showErrors) {
      const validation = validateField('Description', value, {
        required: true,
        minLength: 10,
        maxLength: 500
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
        maxLength: 1000
      });
      setFieldErrors(prev => ({
        ...prev,
        importance: validation.isValid ? null : validation.message
      }));
    }
    handleFieldEdit("why_this_matters");
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
    // Validate all required fields
    const descValidation = validateField('Description', description || '', {
      required: true,
      minLength: 10,
      maxLength: 500
    });

    const impValidation = validateField('Why This Matters', importance || '', {
      required: true,
      minLength: 10,
      maxLength: 1000
    });

    const budgetValidation = validateField('Budget Estimate', budget || '', {
      numeric: true,
      min: 0,
      allowSpecialChars: ['.', ',', '-', '$', 'K', 'M']
    });

    const errors = {
      description: descValidation.isValid ? null : descValidation.message,
      importance: impValidation.isValid ? null : impValidation.message,
      budget: budgetValidation.isValid ? null : budgetValidation.message,
    };

    setFieldErrors(errors);
    setShowErrors(true);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== null);

    if (hasErrors) {
      // Scroll to first error
      if (errors.description) {
        scrollToError(descriptionRef);
      } else if (errors.importance) {
        scrollToError(importanceRef);
      } else if (errors.budget) {
        scrollToError(budgetRef);
      }
      return;
    }

    // All validations passed, submit the form
    onSubmit();
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="projects-breadcrumb">
        <Breadcrumb>
          <Breadcrumb.Item onClick={onBack} style={{ cursor: "pointer" }}>
            {t("Projects")}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>{getTitle()}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* Required Information */}
      <div className="center-row">
        <div className="form-card">
          <h3 className="section-title">{t("Required_Information")}</h3>

          {/* Project Name Display */}
          {projectName && (
            <div className="field-row">
              <div className="field-label-row">
                <label className="field-label">
                  {t("Project_Name")} <span className="required">*</span>
                </label>
              </div>
              <div className="project-name-display-inline">
                {projectName}
              </div>
            </div>
          )}

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

          <div className="field-row">
            <div className="field-label-row">
              <label className="field-label">
                {t("Why_This_Matters")} <span className="required">*</span>
              </label>
              {renderLockBadge("why_this_matters")}
            </div>
            <textarea
              ref={importanceRef}
              value={importance || ""}
              onChange={handleImportanceChange}
              placeholder="Explain why this project is strategically important to the business (minimum 10 characters)"
              rows={3}
              className={`field-textarea ${showErrors && fieldErrors.importance ? "error" : ""}`}
              readOnly={isFieldDisabled("why_this_matters")}
              onFocus={() => handleFieldFocus("why_this_matters")}
              maxLength={1000}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {showErrors && fieldErrors.importance && (
                <small className="error-text">{fieldErrors.importance}</small>
              )}
              <small className="text-muted" style={{ marginLeft: 'auto' }}>
                {(importance || '').length}/1000 characters
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Context */}
      <div className="center-row">
        <div className="form-card">
          <div className="card-header-between">
            <h3 className="section-title">{t("Strategic_Context")}</h3>
            <span className="optional-tag">{t("Optional")}</span>
          </div>

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
          </div>

          <div className="field-row">
            <div className="field-label-row">
              <label className="field-label">{t("Strategic_Theme_Horizon")}</label>
              {renderLockBadge("theme")}
            </div>
            <SelectField
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
          </div>

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
          <div className="card-header-between">
            <h3 className="section-title">{t("Detailed_Planning")}</h3>
            <span className="optional-tag">{t("Optional")}</span>
          </div>

          <div className="field-row">
            <div className="field-label-row">
              <label className="field-label">{t("High-Level_Requirements")}</label>
              {renderLockBadge("high_level_requirements")}
            </div>
            <textarea
              placeholder="What are the main requirements?"
              rows={3}
              className="field-textarea"
              value={highLevelReq || ""}
              onChange={e => {
                setHighLevelReq(e.target.value);
                handleFieldEdit("high_level_requirements");
              }}
              readOnly={isFieldDisabled("high_level_requirements")}
              onFocus={() => handleFieldFocus("high_level_requirements")}
            />
          </div>

          <div className="field-row">
            <div className="field-label-row">
              <label className="field-label">{t("Scope_Definition")}</label>
              {renderLockBadge("scope_definition")}
            </div>
            <textarea
              placeholder="Define the project scope"
              rows={3}
              className="field-textarea"
              value={scope || ""}
              onChange={e => {
                setScope(e.target.value);
                handleFieldEdit("scope_definition");
              }}
              readOnly={isFieldDisabled("scope_definition")}
              onFocus={() => handleFieldFocus("scope_definition")}
            />
          </div>

          <div className="field-row">
            <div className="field-label-row">
              <label className="field-label">{t("Expected_Outcome")}</label>
              {renderLockBadge("expected_outcome")}
            </div>
            <textarea
              placeholder="What is the end result?"
              rows={3}
              className="field-textarea"
              value={outcome || ""}
              onChange={e => {
                setOutcome(e.target.value);
                handleFieldEdit("expected_outcome");
              }}
              readOnly={isFieldDisabled("expected_outcome")}
              onFocus={() => handleFieldFocus("expected_outcome")}
            />
          </div>

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

      {/* Actions */}
      {!isReadOnly && (
        <div className="actions-row">
          <button type="button" className="btn-cancel" onClick={onBack}>
            {t("cancel")}
          </button>
          <button type="button" className="btn-create" onClick={handleSubmit}>
            {getSubmitButtonText()}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectForm;