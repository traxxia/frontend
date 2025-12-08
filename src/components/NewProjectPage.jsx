import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { TrendingUp, Zap, AlertTriangle, Circle,  Diamond,  Rocket,  Bolt, Lightbulb, Heart, Shield, Boxes, Clock, DollarSign  } from "lucide-react";
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
const SelectField = ({ label, icon, options, value, onChange, open, setOpen }) => {
  return (
    <div className="sf-wrapper">
      <label className="sf-label">
        {icon} {label}
      </label>

      <div className="sf-dropdown-wrapper">
        <div className="sf-dropdown-header" onClick={() => setOpen()}>
          <span>{value || (label ? `Select ${label.toLowerCase()}` : "Select")}</span>
          <span className={`sf-arrow ${open ? "open" : ""}`}>▼</span>
        </div>

        {open && (
          <div className="sf-options-container">
            {options.map((item) => (
              <div
                key={item.value}
                className="sf-option"
                onClick={() => {
                  onChange(item.label);
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
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);

  const [selectedImpact, setSelectedImpact] = useState("");
  const [selectedEffort, setSelectedEffort] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");

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
          <h1 className="page-title">Project Idea</h1>

          <span className="idea-tag">Ideas</span>
        </div>
      </div>

      {/* Required Information Card */}
      <div className="center-row">
        <div className="form-card">
          <h3 className="section-title">Required Information</h3>

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
            <h3 className="section-title">Strategic Context</h3>
            <span className="optional-tag">Optional</span>
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
            />
          </div>
        </div>
      </div>

      {/* Detailed Planning Card */}
      <div className="center-row">
        <div className="form-card">
          <div className="card-header-between">
            <h3 className="section-title">Detailed Planning</h3>
            <span className="optional-tag">Optional</span>
          </div>

          {/* High-Level Requirements */}
          <div className="field-row">
            <label className="field-label">High-Level Requirements</label>
            <textarea
              placeholder="What are the main requirements?"
              rows={3}
              className="field-textarea"
            />
          </div>

          {/* Scope Definition */}
          <div className="field-row">
            <label className="field-label">Scope Definition</label>
            <textarea
              placeholder="Define the project scope"
              rows={3}
              className="field-textarea"
            />
          </div>

          {/* Expected Outcome */}
          <div className="field-row">
            <label className="field-label">Expected Outcome</label>
            <textarea
              placeholder="What is the end result?"
              rows={3}
              className="field-textarea"
            />
          </div>

          {/* Success Metrics */}
          <div className="field-row">
            <label className="field-label">Success Metrics (KPIs)</label>
            <textarea
              placeholder="How will you measure success? (one metric per line)"
              rows={3}
              className="field-textarea"
            />
          </div>

          {/* Timeline + Budget */}
          <div className="grid-2" style={{ marginTop: 12 }}>
            <div>
              <label className="field-label">
                <Clock size={16} /> Estimated Timeline
              </label>
              <input type="text" placeholder="e.g., 3–6 months" className="field-input" />
            </div>

            <div>
              <label className="field-label">
                <DollarSign size={16} /> Budget Estimate
              </label>
              <input type="text" placeholder="e.g., $50K - $100K" className="field-input" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-row">
        <button type="button" className="btn-cancel">
          Cancel
        </button>

        <button type="submit" className="btn-create">
          Create Project
        </button>
      </div>
    </div>
  );
};

export default NewProjectPage;
