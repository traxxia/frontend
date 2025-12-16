import React, { useState,useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { TrendingUp, Zap, AlertTriangle, Circle,  Diamond,  Rocket,  Bolt, Lightbulb, Heart, Shield, Boxes, Clock, DollarSign  } from "lucide-react";
import "../styles/NewProjectPage.css";
import axios from "axios";
import { useLocation } from "react-router-dom";

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
const SelectField = ({ label, icon, options, value, onChange, open, setOpen }) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="sf-wrapper">
      <label className="sf-label">
        {icon} {label}
      </label>

      <div className="sf-dropdown-wrapper">
        <div className="sf-dropdown-header" onClick={() => setOpen()}>
          <span>
            {selectedOption?.label ||
              (label ? `Select ${label.toLowerCase()}` : "Select")}
          </span>
          <span className={`sf-arrow ${open ? "open" : ""}`}>▼</span>
        </div>

        {open && (
          <div className="sf-options-container">
            {options.map((item) => (
              <div
                key={item.value}
                className="sf-option"
                onClick={() => {
                  onChange(item.value);
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

const NewProjectPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { businessId } = useParams();
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
  
  const handleCreate = async () => {
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  // if (!token || !businessId || !userId) {
  //   alert("Missing authentication or business information.");
  //   return;
  // }

  const payload = {
    business_id: businessId,
    user_id: userId,
    collaborators: [],
    project_name: projectName,
    description: description,
    why_this_matters: importance,

    impact: selectedImpact,
    effort: selectedEffort,
    risk: selectedRisk,
    strategic_theme: selectedTheme,

    dependencies,
    high_level_requirements: highLevelReq,
    scope_definition: scope,
    expected_outcome: outcome,
    success_metrics: successMetrics,
    estimated_timeline: timeline,
    budget_estimate: budget || 0,
  };

  try {
    const res = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/projects`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    alert("Project created successfully!");
  } catch (err) {
    console.error("Project creation failed:", err);
    alert("Failed to create project.");
  }
};


  return (
    <div className="page-wrapper">
      {/* Header Card */}
      <div className="header-card">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="back-btn">
          <ChevronLeft size={16} /> Back
        </button>

        {/* Breadcrumb */}
        <p className="breadcrumb">
          Dashboard  ›  Projects  ›
          <span className="breadcrumb-strong"> New Project</span>
        </p>

        {/* Page Title + Tag */}
        <div className="title-row">
          <h1 className="page-title">{t("Project_Idea")}</h1>

          <span className="idea-tag">Ideas</span>
        </div>
      </div>

      {/* Required Information Card */}
      <div className="center-row">
        <div className="form-card">
          <h3 className="section-title">{t("Required_Information")}</h3>

          {/* Project Name */}
          <div className="field-row">
            <label className="field-label">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Digital Wallet Launch"
              className="field-input"
            />
          </div>

          {/* Project Description */}
          <div className="field-row">
            <label className="field-label">Project Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Launch digital wallet product and achieve market penetration"
              rows={3}
              className="field-textarea"
            />
          </div>

          {/* Why This Matters */}
          <div className="field-row">
            <label className="field-label">Why This Matters (Strategic Importance)</label>
            <textarea
              value={importance}
              onChange={(e) => setImportance(e.target.value)}
              placeholder="Explain why this project is strategically important"
              rows={3}
              className="field-textarea"
            />
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

          {/* Impact / Effort / Risk */}
          <div className="grid-3">
            <div>
              <SelectField
                label="Impact"
                icon={<TrendingUp size={16} />}
                options={impactOptions}
                value={selectedImpact}
                onChange={setSelectedImpact}
                open={openDropdown === "impact"}
                setOpen={() =>
                  setOpenDropdown(openDropdown === "impact" ? null : "impact")
                }
              />
            </div>

            <div>
              <SelectField
                label="Effort"
                icon={<Zap size={16} />}
                options={effortOptions}
                value={selectedEffort}
                onChange={setSelectedEffort}
                open={openDropdown === "effort"}
                setOpen={() =>
                  setOpenDropdown(openDropdown === "effort" ? null : "effort")
                }
              />
            </div>

            <div>
              <SelectField
                label="Risk"
                icon={<AlertTriangle size={16} />}
                options={riskOptions}
                value={selectedRisk}
                onChange={setSelectedRisk}
                open={openDropdown === "risk"}
                setOpen={() =>
                  setOpenDropdown(openDropdown === "risk" ? null : "risk")
                }
              />
            </div>
          </div>

          {/* Strategic Theme */}
          <div className="field-row">
            <label className="field-label">Strategic Theme / Horizon</label>

            <SelectField
              label=""
              options={themeOptions}
              value={selectedTheme}
              onChange={setSelectedTheme}
              open={openDropdown === "theme"}
              setOpen={() =>
                setOpenDropdown(openDropdown === "theme" ? null : "theme")
              }
            />
          </div>

          {/* Dependencies */}
          <div className="field-row">
            <label className="field-label">Dependencies (on other projects or systems)</label>
            <textarea
              placeholder="List dependencies (one per line)"
              rows={3}
              className="field-textarea transparent"
              value={dependencies}
              onChange={e => setDependencies(e.target.value)}
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

          {/* High-Level Requirements */}
          <div className="field-row">
            <label className="field-label">High-Level Requirements</label>
            <textarea
              placeholder="What are the main requirements?"
              rows={3}
              className="field-textarea"
              value={highLevelReq}
              onChange={e => setHighLevelReq(e.target.value)}
            />
          </div>

          {/* Scope Definition */}
          <div className="field-row">
            <label className="field-label">Scope Definition</label>
            <textarea
              placeholder="Define the project scope"
              rows={3}
              className="field-textarea"
              value={scope}
              onChange={e => setScope(e.target.value)}
            />
          </div>

          {/* Expected Outcome */}
          <div className="field-row">
            <label className="field-label">Expected Outcome</label>
            <textarea
              placeholder="What is the end result?"
              rows={3}
              className="field-textarea"
              value={outcome}
              onChange={e => setOutcome(e.target.value)}
            />
          </div>

          {/* Success Metrics */}
          <div className="field-row">
            <label className="field-label">Success Metrics (KPIs)</label>
            <textarea
              placeholder="How will you measure success? (one metric per line)"
              rows={3}
              className="field-textarea"
              value={successMetrics}
              onChange={e => setSuccessMetrics(e.target.value)}
            />
          </div>

          {/* Timeline + Budget */}
          <div className="grid-2" style={{ marginTop: 12 }}>
            <div>
              <label className="field-label">
                <Clock size={16} /> Estimated Timeline
              </label>
              <input type="text" placeholder="e.g., 3–6 months" className="field-input" value={timeline} onChange={e => setTimeline(e.target.value)} />
            </div>

            <div>
              <label className="field-label">
                <DollarSign size={16} /> Budget Estimate
              </label>
              <input type="text" placeholder="e.g., $50K - $100K" className="field-input" value={budget} onChange={e => setBudget(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-row">
        <button type="button" className="btn-cancel">
          {t("cancel")}
        </button>

        <button type="button" className="btn-create" onClick={handleCreate}>

          {t("Create_Project")}
        </button>
      </div>
    </div>
  );
};

export default NewProjectPage;
