import React, { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { TrendingUp, Zap, AlertTriangle, Circle,  Diamond,  Rocket,  Bolt, Lightbulb, Heart, Shield, Boxes, Clock, DollarSign  } from "lucide-react";
import Aiassistant from './Aiassistant';
import { useParams } from "react-router-dom";
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
    icon: <Rocket size={16} color="#e11d48" />, // pink/red
  },
  {
    value: "Efficiency",
    label: "Operational Efficiency",
    icon: <Bolt size={16} color="#f59e0b" />, // yellow-orange
  },
  {
    value: "Innovation",
    label: "Innovation & R&D",
    icon: <Lightbulb size={16} color="#facc15" />, // bright yellow
  },
  {
    value: "CustomerExperience",
    label: "Customer Experience",
    icon: <Heart size={16} color="#dc2626" fill="#dc2626" />, // red
  },
  {
    value: "RiskMitigation",
    label: "Risk Mitigation",
    icon: <Shield size={16} color="#3b82f6" />, // blue
  },
  {
    value: "Platform",
    label: "Platform & Infrastructure",
    icon: <Boxes size={16} color="#fb923c" />, // orange
  },
];
const SelectField = ({ label, icon, options, value, onChange, open, setOpen, disabled }) => {
  return (
    <div>
      <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
        {icon} {label}
      </label>

      <div style={{ position: "relative", marginTop: "8px" }}>
        <div
          onClick={() => !disabled && setOpen(!open)}
          style={{
            width: "100%",
            fontSize: "15px",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <span>{value || `Select ${label.toLowerCase()}`}</span>
          <span style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }}>▼</span>
        </div>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "35px",
              left: 0,
              width: "100%",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "8px 0",
              zIndex: 10,
            }}
          >
            {options.map((item) => (
              <div
                key={item.value}
                onClick={() => {
                  onChange(item.label);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: "15px",
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



const EditProjectPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
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

const location = useLocation();
const projectId = location.state?.projectId;
const isReadOnly = location.state?.mode === "view";




useEffect(() => {
  if (!projectId) {
    console.error("No Project ID found");
    return;
  }

  const token = sessionStorage.getItem("token");

  axios.get(
    `${process.env.REACT_APP_BACKEND_URL}/api/projects/${projectId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  .then((res) => {
    const p = res.data.project;

    setProjectName(p.project_name || "");
    setDescription(p.description || "");
    setImportance(p.why_this_matters || "");

    // DROPDOWNS
    setSelectedImpact(p.impact || "");
    setSelectedEffort(p.effort || "");
    setSelectedRisk(p.risk || "");
    setSelectedTheme(p.strategic_theme || "");

    // DETAILS
    setDependencies(p.dependencies || "");
    setHighLevelReq(p.high_level_requirements || "");
    setScope(p.scope_definition || "");
    setOutcome(p.expected_outcome || "");
    setSuccessMetrics(p.success_metrics || "");
    setTimeline(p.estimated_timeline || "");
    setBudget(p.budget_estimate || "");

  })
  .catch(err => console.error("Error loading project:", err));
}, [projectId]);

const handleSave = async () => {
  if (!projectId) {
    console.error("No project ID found!");
    return;
  }

  const token = sessionStorage.getItem("token");
  if (!token) {
    console.error("Token missing!");
    return;
  }

  const payload = {
    project_name: projectName,
    description: description,
    why_this_matters: importance,
    impact: selectedImpact,
    effort: selectedEffort,
    risk: selectedRisk,
    strategic_theme: selectedTheme,
    dependencies: dependencies,
    high_level_requirements: highLevelReq,
    scope_definition: scope,
    expected_outcome: outcome,
    success_metrics: successMetrics,
    estimated_timeline: timeline,
    budget_estimate: budget,
  };

  try {
    await axios.patch(
      `${process.env.REACT_APP_BACKEND_URL}/api/projects/${projectId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    alert("Project updated successfully!");
  } catch (error) {
    console.error("Error updating project:", error);
    alert("Failed to update project.");
  }
};



  return (
    <div style={{ padding: "16px", paddingTop: "24px", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <Aiassistant />
        <div
        style={{
            background: "#fff",
            padding: "22px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            marginBottom: "20px",
        }}
        >
        {/* Back */}
        <button
            onClick={() => navigate(-1)}
            style={{
            background: "none",
            border: "none",
            fontSize: "17px",
            color: "#6b7280", // grey like screenshot
            marginBottom: "10px",
            cursor: "pointer",
            marginLeft: "-25px",
            }}
        >
            <ChevronLeft size={16} /> Back
        </button>

        <p
        style={{
            fontSize: "18px",
            color: "#6b7280", 
            margin: "0 0 10px 0",
        }}
        >
        Dashboard  ›  Projects  › 
        <span style={{ color: "#111827", fontWeight: "500" }}>
            Edit Project
        </span>
        </p>

        {/* Page Title + Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
            style={{
                fontSize: "26px",
                fontWeight: "600",
                margin: 0,
                color: "#111827", // dark title color (as in your image)
            }}
            >
            {t("Project_Idea")}
            </h1>
        </div>
        </div>
      <div
        style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
        }}
        >
      {/* White Form Box */}
        <div
          style={{
            marginTop: "24px",
            background: "#fff",
            borderRadius: "12px",
            padding: "32px",
            border: "1px solid #e5e7eb",
            maxWidth: "900px",
            width: "100%",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "24px" }}>
            {t("Required_Information")}
          </h3>

            {/* Project Name */}
            <div style={{ marginBottom: "26px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                Project Name
            </label>

            <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? "readonly-input" : ""}
                placeholder="Digital Wallet Launch"
                style={{
                marginTop: "8px",
                width: "100%",
                fontSize: "15px",
                color: "#111827",
                border: "none",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "6px",
                outline: "none",
                }}
            />
            </div>

            {/* Project Description */}
            <div style={{ marginBottom: "26px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                Project Description
            </label>

            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? "readonly-input" : ""}
                placeholder="Launch digital wallet product and achieve market penetration"
                rows={3}
                style={{
              marginTop: "0",
                width: "100%",
                fontSize: "15px",
                color: "#111827",
                border: "none",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "6px",
                outline: "none",
                resize: "none",
                }}
            />
            </div>

            {/* Why This Matters */}
            <div style={{ marginBottom: "26px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                Why This Matters (Strategic Importance)
            </label>

            <textarea
                value={importance}
                onChange={(e) => setImportance(e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? "readonly-input" : ""}
                placeholder="Explain why this project is strategically important"
                rows={3}
                style={{
                marginTop: "0",
                width: "100%",
                fontSize: "15px",
                color: "#111827",
                border: "none",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "6px",
                outline: "none",
                resize: "none",
                }}
            />
            </div>
            <div style={{ background: "rgba(127, 246, 243, 0.8)", padding: "8px 12px", borderRadius: "6px" }} >
                <div><b>Source : </b>This is where the source will be displayed</div>
            </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", width: "100%", }} >
        <div
          style={{
            marginTop: "24px",
            background: "#fff",
            borderRadius: "12px",
            padding: "32px",
            border: "1px solid #e5e7eb",
            maxWidth: "900px",
            width: "100%",
          }}
        >
          {/* Title + Optional Tag */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600" }}>{t("Strategic_Context")}</h3>

            <span
              style={{
                fontSize: "12px",
                background: "#f3f4f6",
                padding: "4px 10px",
                borderRadius: "6px",
                height: "fit-content",
              }}
            >
              {t("Optional")}
            </span>
          </div>

          {/* IMPACT / EFFORT / RISK ROW */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "20px",
              marginBottom: "26px",
            }}
          >
            {/* Impact */}
            <div>
              <SelectField
                label="Impact"
                icon={<TrendingUp size={16} style={{ marginRight: "6px", marginBottom: "-2px" }} />}
                options={impactOptions}
                value={selectedImpact}
                onChange={setSelectedImpact}
                open={openDropdown === "impact"}
                setOpen={() =>
                  setOpenDropdown(openDropdown === "impact" ? null : "impact")
                }
                disabled={isReadOnly} 
              />
          </div>
            {/* Effort */}
            <div>
              <SelectField
                label="Effort"
                icon={<Zap size={16} style={{ marginRight: "6px", marginBottom: "-2px" }} />}
                options={effortOptions}
                value={selectedEffort}
                onChange={setSelectedEffort}
                open={openDropdown === "effort"}
                setOpen={() =>
                  setOpenDropdown(openDropdown === "effort" ? null : "effort")
                }
                disabled={isReadOnly} 
              />

            </div>

            {/* Risk */}
            <div>
              <SelectField
                label="Risk"
                icon={<AlertTriangle size={16} style={{ marginRight: "6px", marginBottom: "-2px" }} />}
                options={riskOptions}
                value={selectedRisk}
                onChange={setSelectedRisk}
                open={openDropdown === "risk"}
                setOpen={() =>
                  setOpenDropdown(openDropdown === "risk" ? null : "risk")
                }
                disabled={isReadOnly} 
              />
            </div>
          </div>
          <div style={{ marginBottom: "26px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
              Strategic Theme / Horizon
            </label>

            <SelectField
              label=""
              options={themeOptions}
              value={selectedTheme}
              onChange={setSelectedTheme}
              open={openDropdown === "theme"}
              setOpen={() =>
                setOpenDropdown(openDropdown === "theme" ? null : "theme")
              }
              disabled={isReadOnly} 
            />
          </div>
          <div style={{ marginBottom: "26px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
              Dependencies (on other projects or systems)
            </label>

            <textarea
              value={dependencies}
              onChange={e => setDependencies(e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? "readonly-input" : ""}
              placeholder="List dependencies (one per line)"
              rows={3}
              style={{
                marginTop: "0",
                width: "100%",
                fontSize: "15px",
                border: "none",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "6px",
                outline: "none",
                resize: "none",
                background: "transparent",
              }}
            />
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            marginTop: "24px",
            background: "#fff",
            borderRadius: "12px",
            padding: "32px",
            border: "1px solid #e5e7eb",
            maxWidth: "900px",
            width: "100%",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "24px" }}>
            {t("Detailed_Planning")}
          </h3>
          <div style={{ marginBottom: "26px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
              High-Level Requirements
            </label>

            <textarea
              value={highLevelReq}
              onChange={e => setHighLevelReq(e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? "readonly-input" : ""}
              placeholder="What are the main requirements?"
              rows={3}
              style={{
                marginTop: "0",
                width: "100%",
                fontSize: "15px",
                color: "#111827",
                border: "none",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "6px",
                outline: "none",
                resize: "none",
              }}
            />
          </div>
          <div style={{ marginBottom: "26px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
              Scope Definition
            </label>

            <textarea
              value={scope}
              onChange={e => setScope(e.target.value)}
              placeholder="Define the project scope"
              readOnly={isReadOnly}
              className={isReadOnly ? "readonly-input" : ""}
              rows={3}
              style={{
                marginTop: "0",
                width: "100%",
                fontSize: "15px",
                color: "#111827",
                border: "none",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "6px",
                outline: "none",
                resize: "none",
              }}
            />
          </div>

          {/* Expected Outcome */}
          <div style={{ marginBottom: "26px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
              Expected Outcome
            </label>

            <textarea
              value={outcome}
              onChange={e => setOutcome(e.target.value)}
              placeholder="What is the end result?"
              readOnly={isReadOnly}
              className={isReadOnly ? "readonly-input" : ""}
              rows={3}
              style={{
                marginTop: "0",
                width: "100%",
                fontSize: "15px",
                color: "#111827",
                border: "none",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "6px",
                outline: "none",
                resize: "none",
              }}
            />
          </div>

          {/* Success Metrics */}
          <div style={{ marginBottom: "26px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
              Success Metrics (KPIs)
            </label>

            <textarea
              value={successMetrics}
              onChange={e => setSuccessMetrics(e.target.value)} 
              placeholder="How will you measure success? (one metric per line)"
              readOnly={isReadOnly}
              className={isReadOnly ? "readonly-input" : ""}
              rows={3}
              style={{
                marginTop: "0",
                width: "100%",
                fontSize: "15px",
                color: "#111827",
                border: "none",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "6px",
                outline: "none",
                resize: "none",
              }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginTop: "12px",
            }}
          >
            {/* Timeline */}
            <div>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                <Clock size={16} style={{ marginRight: "6px" }} /> Estimated Timeline
              </label>
              <input
                type="text"
                value={timeline}
                onChange={e => setTimeline(e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? "readonly-input" : ""}
                placeholder="e.g., 3–6 months"
                style={{
                  marginTop: "8px",
                  width: "100%",
                  fontSize: "15px",
                  color: "#111827",
                  border: "none",
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "6px",
                  outline: "none",
                }}
              />
            </div>

            {/* Budget */}
            <div>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                <DollarSign size={16} style={{ marginBottom: "-2px" }} /> Budget Estimate
              </label>
              <input
                type="text"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="e.g., $50K - $100K"
                readOnly={isReadOnly}
                className={isReadOnly ? "readonly-input" : ""}
                style={{
                  marginTop: "8px",
                  width: "100%",
                  fontSize: "15px",
                  color: "#111827",
                  border: "none",
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "6px",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {!isReadOnly && (
      <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "24px",
    gap: "7px",
    marginRight: "370px",
  }}
>
  <button
    type="button"
    className="btn btn-outline-secondary btn-sm w-30 w-md-auto"
  >
    {t("cancel")}
  </button>

  <button
    type="submit"
    onClick={handleSave}
    className="btn btn-sm w-30 w-md-auto"
    style={{
      background: "linear-gradient(90deg, #a855f7, #9333ea)",
      borderRadius: "12px",
      padding: "10px 18px",
      fontSize: "15px",
      border: "none",
      color: "#fff",
      cursor: "pointer",
    }}
  >
    {t("Save_Changes")}
  </button>
</div>
)}

    </div>
  );
};

export default EditProjectPage;
