import React from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Breadcrumb } from "react-bootstrap";
import { TrendingUp, Zap, AlertTriangle, Circle, Diamond, Rocket, Bolt, Lightbulb, Heart, Shield, Boxes, Clock, DollarSign, Lock } from "lucide-react";
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
      <label className="sf-label">
        {icon} {label}
      </label>

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
          <span>
            {selectedOption?.label || (label ? `Select ${label.toLowerCase()}` : "Select")}
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
  mode, // 'new', 'edit', or 'view'
   readOnly = false,
  projectName,
  setProjectName,
  description,
  setDescription,
  importance,
  setImportance,
  errors,
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
  const isFieldDisabled = (field) =>
    isReadOnly || isLockedByOther?.(field);

  const handleFieldFocus = (field) => {
    if (isFieldDisabled(field)) return;
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

  return (
    <div>
      {/* Stylish Breadcrumb */}
      <div className="projects-breadcrumb">
        <Breadcrumb className="projects-breadcrumb">
          <Breadcrumb.Item 
            onClick={onBack}
            style={{ cursor: "pointer" }}
          >
            {t("Projects")}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            {getTitle()}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* Required Information Card */}
      <div className="center-row">
        <div className="form-card">
          <h3 className="section-title">{t("Required_Information")}</h3>

          <div className="field-row">
            <div className="field-label-row">
              <label className="field-label">{t("Project_Name")}</label>
              {renderLockBadge("project_name")} 
            </div>
            <input
  type="text"
  value={projectName}
  onChange={(e) => {
    setProjectName(e.target.value);
    handleFieldEdit("project_name");
  }}
  placeholder="Digital Wallet Launch"
  className={`field-input ${errors?.projectName ? "error" : ""}`}
  readOnly={isFieldDisabled("project_name")}
  onFocus={() => handleFieldFocus("project_name")}
  style={{ opacity: isFieldDisabled("project_name") ? 0.6 : 1 }}
/>

{errors?.projectName && (
  <small className="error-text">{errors.projectName}</small>
)}

          </div>

          <div className="field-row">
            <div className="field-label-row">
              <label className="field-label">{t("Project_Description")}</label>
              {renderLockBadge("project_description")} 
            </div>
            <textarea
  value={description}
  onChange={(e) => {
    setDescription(e.target.value);
    handleFieldEdit("project_description");
  }}
  placeholder="Launch digital wallet product and achieve market penetration"
  rows={3}
  className={`field-textarea ${errors?.description ? "error" : ""}`}
  readOnly={isFieldDisabled("project_description")}
  onFocus={() => handleFieldFocus("project_description")}
/>

{errors?.description && (
  <small className="error-text">{errors.description}</small>
)}

          </div>

          <div className="field-row">
            <div className="field-label-row">
              <label className="field-label">{t("Why_This_Matters")}</label>
              {renderLockBadge("why_this_matters")} 
            </div>
            <textarea
  value={importance}
  onChange={(e) => {
    setImportance(e.target.value);
    handleFieldEdit("why_this_matters");
  }}
  placeholder="Explain why this project is strategically important"
  rows={3}
  className={`field-textarea ${errors?.importance ? "error" : ""}`}
  readOnly={isFieldDisabled("why_this_matters")}
  onFocus={() => handleFieldFocus("why_this_matters")}
/>

{errors?.importance && (
  <small className="error-text">{errors.importance}</small>
)}

          </div>
        </div>
      </div>

      {/* Strategic Context Card */}
      <div className="center-row">
        <div className="form-card">
          <div className="card-header-between">
            <h3 className="section-title">{t("Strategic_Context")}</h3>
            <span className="optional-tag">{t("Optional")}</span>
          </div>

          <div className="grid-3">
            <div>
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
            </div>

            <div>
              <SelectField
                label={t("Effor")}
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
            </div>

            <div>
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
          </div>

          <div className="field-row">
            <div className="field-label-row">
              <label className="field-label">{t("Strategic_Theme_Horizon")}</label>
              {renderLockBadge("theme")} 
            </div>
            <SelectField
              label=""
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
              value={dependencies}
              onChange={e => {
                setDependencies(e.target.value);
                handleFieldEdit("dependencies");
              }}
              readOnly={isFieldDisabled("dependencies")}
              onFocus={() => handleFieldFocus("dependencies")}
              style={{ opacity: isFieldDisabled("dependencies") ? 0.6 : 1, cursor: isFieldDisabled("dependencies") ? "not-allowed" : "text" }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Planning Card */}
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
              value={highLevelReq}
              onChange={e => {
                setHighLevelReq(e.target.value);
                handleFieldEdit("high_level_requirements");
              }}
              readOnly={isFieldDisabled("high_level_requirements")}
              onFocus={() => handleFieldFocus("high_level_requirements")}
              style={{ opacity: isFieldDisabled("high_level_requirements") ? 0.6 : 1, cursor: isFieldDisabled("high_level_requirements") ? "not-allowed" : "text" }}
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
              value={scope}
              onChange={e => {
                setScope(e.target.value);
                handleFieldEdit("scope_definition");
              }}
              readOnly={isFieldDisabled("scope_definition")}
              onFocus={() => handleFieldFocus("scope_definition")}
              style={{ opacity: isFieldDisabled("scope_definition") ? 0.6 : 1, cursor: isFieldDisabled("scope_definition") ? "not-allowed" : "text" }}
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
              value={outcome}
              onChange={e => {
                setOutcome(e.target.value);
                handleFieldEdit("expected_outcome");
              }}
              readOnly={isFieldDisabled("expected_outcome")}
              onFocus={() => handleFieldFocus("expected_outcome")}
              style={{ opacity: isFieldDisabled("expected_outcome") ? 0.6 : 1, cursor: isFieldDisabled("expected_outcome") ? "not-allowed" : "text" }}
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
              value={successMetrics}
              onChange={e => {
                setSuccessMetrics(e.target.value);
                handleFieldEdit("success_metrics");
              }}
              readOnly={isFieldDisabled("success_metrics")}
              onFocus={() => handleFieldFocus("success_metrics")}
              style={{ opacity: isFieldDisabled("success_metrics") ? 0.6 : 1, cursor: isFieldDisabled("success_metrics") ? "not-allowed" : "text" }}
            />
          </div>

          <div className="grid-2" style={{ marginTop: 12 }}>
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
                value={timeline} 
                onChange={e => {
                  setTimeline(e.target.value);
                  handleFieldEdit("estimated_timeline");
                }}
                readOnly={isFieldDisabled("estimated_timeline")}
                onFocus={() => handleFieldFocus("estimated_timeline")}
                style={{ opacity: isFieldDisabled("estimated_timeline") ? 0.6 : 1, cursor: isFieldDisabled("estimated_timeline") ? "not-allowed" : "text" }}
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
                type="text" 
                placeholder="e.g., $50K - $100K" 
                className="field-input" 
                value={budget} 
                onChange={e => {
                  setBudget(e.target.value);
                  handleFieldEdit("budget_estimate");
                }}
                readOnly={isFieldDisabled("budget_estimate")}
                onFocus={() => handleFieldFocus("budget_estimate")}
                style={{ opacity: isFieldDisabled("budget_estimate") ? 0.6 : 1, cursor: isFieldDisabled("budget_estimate") ? "not-allowed" : "text" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isReadOnly && (
        <div className="actions-row">
          <button 
            type="button" 
            className="btn-cancel"
            onClick={onBack}
          >
            {t("cancel")}
          </button>

          <button 
            type="button" 
            className="btn-create" 
            onClick={onSubmit}
          >
            {getSubmitButtonText()}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectForm;