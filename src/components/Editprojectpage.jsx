import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { TrendingUp, Zap, AlertTriangle, Circle,  Diamond,  Rocket,  Bolt, Lightbulb, Heart, Shield, Boxes, Clock, DollarSign  } from "lucide-react";

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
const SelectField = ({ label, icon, options, value, onChange, open, setOpen }) => {
  return (
    <div>
      <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
        {icon} {label}
      </label>

      <div style={{ position: "relative", marginTop: "8px" }}>
        <div
          onClick={() => setOpen(!open)}
          style={{
            width: "100%",
            fontSize: "15px",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
    <div style={{ padding: "16px", paddingTop: "24px", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
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
            Project Idea
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
            Required Information
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
            <h3 style={{ fontSize: "18px", fontWeight: "600" }}>Strategic Context</h3>

            <span
              style={{
                fontSize: "12px",
                background: "#f3f4f6",
                padding: "4px 10px",
                borderRadius: "6px",
                height: "fit-content",
              }}
            >
              Optional
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
              />
            </div>
          </div>

          {/* Strategic Theme */}
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
            />
          </div>
          <div style={{ marginBottom: "26px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
              Dependencies (on other projects or systems)
            </label>

            <textarea
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
            Detailed Planning
          </h3>
          <div style={{ marginBottom: "26px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
              High-Level Requirements
            </label>

            <textarea
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
              placeholder="Define the project scope"
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
              placeholder="What is the end result?"
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
              placeholder="How will you measure success? (one metric per line)"
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
                placeholder="e.g., $50K - $100K"
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
    Cancel
  </button>

  <button
    type="submit"
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
    Save Changes
  </button>
</div>

    </div>
  );
};

export default EditProjectPage;
