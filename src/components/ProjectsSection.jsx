import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, ProgressBar, Button, Badge } from "react-bootstrap";
import { Lock,AlertTriangle, AlertCircle, CheckCircle, Dot,Plus, ListOrdered ,Pencil, Trash2} from "lucide-react";
import { useNavigate } from "react-router-dom";  

const projects = [
  {
    id: 1,
    initiative: "Immediate Initiative",
    title: "Enhance digital product offerings",
    description: "Expand digital product suite to diversify revenue",
    quote:
      "Reduces dependency on single product and increases customer lifetime value",
    lastUpdated: "Last edited by John Doe",
  },
  {
    id: 2,
    initiative: "Short-term Initiative",
    title: "Strengthen partnerships with key merchants",
    description:
      "Build strategic merchant partnerships for transaction volumes",
    quote: "Network effects drive platform value and competitive moat",
    lastUpdated: "Last edited by John Doe",
  },
];

const portfolioData = {
  totalProjects: 6,
  impactDistribution: {
    green: 0,
    orange: 0,
    blue: 0,
  },
  riskBalance: {
    high: 0,
    medium: 0,
    low: 0,
  },
  completedDetails: 0,
};

const getStatusVariant = (status) => {
  switch (status) {
    case "In Progress":
      return "info";
    case "Planning":
      return "warning";
    case "Near Completion":
      return "primary";
    case "Completed":
      return "success";
    default:
      return "secondary";
  }
};

const ProjectsSection = () => {
    const [userRole, setUserRole] = useState("");
  
    useEffect(() => {
      const role = sessionStorage.getItem("userRole");
      setUserRole(role);
    }, []);
  
    const isSuperAdmin = userRole === "super_admin";
  const navigate = useNavigate(); 
  return (
    <Container fluid className="p-3 p-md-4" style={{ backgroundColor: "#f5f7fb" }}>

      {/* 🔵 OPEN FOR COLLABORATION CARD (as per screenshot) */}
      {isSuperAdmin && (
      <Card
        className="shadow-sm"
        style={{
          backgroundColor: "#E8F3FF",
          borderRadius: "12px",
          padding: "28px 32px",
          marginBottom: "22px",
          marginTop: "12px",

          // Soft blue border EXACT like screenshot
          border: "1px solid #589be9ff",
        }}
      >
        <Row className="align-items-center">
          
          {/* Left Text Section */}
          <Col md="8">
            <h5 
              className="fw-bold"
              style={{ 
                color: "#589be9ff",      
                marginBottom: "18px",
                fontSize: "21px", 
              }}
            >
              Open for Collaboration
            </h5>

            <p
              style={{ 
                margin: 0, 
                fontSize: "16px",
                color: "#589be9ff"
              }}
            >
              All collaborators can add projects, update info, and rank
            </p>
          </Col>

          {/* Right Button Section */}
          <Col 
            md="4" 
            className="d-flex justify-content-end align-items-center"
          >
            <Button
              variant="light"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #589be9ff",
                borderRadius: "15px",
                color: "#589be9ff",
                fontSize: "14px",
                fontWeight: 500,
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Lock size={16} color="#589be9ff" strokeWidth={2} />
              Lock Project Creation
            </Button>

          </Col>

        </Row>
      </Card>
      )}
     {/* 🔵 PORTFOLIO OVERVIEW EXACT LIKE SCREENSHOT */}
      <Card
        className="shadow-sm"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "24px 32px",
          marginBottom: "22px",
          marginTop: "12px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h5 className="fw-bold mb-4" style={{ color: "#333", fontSize: "20px" }}>
          Portfolio Overview
        </h5>

        <Row>

          {[
            // Total Projects
            {
              title: "Total Projects",
              content: <h3 className="fw-bold">{portfolioData.totalProjects}</h3>,
            },

            // Impact Distribution
            {
              title: "Impact Distribution",
              content: (
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>

                  {/* Green */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#34c759" }}></span>
                    <span>{portfolioData.impactDistribution.green}</span>
                  </div>

                  {/* Orange */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff9500" }}></span>
                    <span>{portfolioData.impactDistribution.orange}</span>
                  </div>

                  {/* Blue */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#46506dff" }}></span>
                    <span>{portfolioData.impactDistribution.blue}</span>
                  </div>

                </div>
              ),
            },

            // Risk Balance
            {
              title: "Risk Balance",
              content: (
                <div style={{ display: "flex", gap: "12px", marginTop: "8px", alignItems: "center" }}>

                  {/* High Risk */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <AlertTriangle size={18} color="#ff3b30" />
                    <span>{portfolioData.riskBalance.high}</span>
                  </div>

                  {/* Medium Risk */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <AlertCircle size={18} color="#ff9500" />
                    <span>{portfolioData.riskBalance.medium}</span>
                  </div>

                  {/* Low Risk */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle size={18} color="#34c759" />
                    <span>{portfolioData.riskBalance.low}</span>
                  </div>

                </div>
              ),
            },

            // Completed Details
            {
              title: "Completed Details",
              content: <h3 className="fw-bold">{portfolioData.completedDetails}</h3>,
            },
          ].map((item, index) => (
            <Col md={3} key={index}>
              <div
                style={{
                  background: "#f8fafc",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "1px solid #edf2f7",
                  minHeight: "120px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                  {item.title}
                </p>
                {item.content}
              </div>
            </Col>
          ))}

        </Row>
      </Card>


      {/* 🔽 Projects Section Header (same style as screenshot) */}
      <div style={{ marginTop: "32px", marginBottom: "18px", marginLeft: "24px" }}>
        {/* Small Section Label */}
        <h6
            style={{
              
              fontSize: "26px",
              fontWeight: "700",
              margin: 0,
              color: "#1f2937",
            }}
        >
          Projects
        </h6>

        {/* Main Header Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Left Title */}
          <h2
          style={{
            color: "#6c757d",
            fontSize: "13px",
            fontWeight: "600",
            marginBottom: "6px",
          }}
          >
            {portfolioData.totalProjects} total projects
          </h2>

          {/* Right Buttons */}
          <div className="d-flex gap-2 flex-wrap justify-content-end">
            {/* New Project */}
            <button
              onClick={() => navigate("/projects/new")} 
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <Plus size={18} />
              New Project
            </button>

            {/* Rank Projects */}
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#f59e0b",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <ListOrdered size={18} />
              Rank Projects
            </button>
          </div>
        </div>
      </div>
      {/* 🔽 PROJECTS LIST */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "24px 28px",
          marginTop: "12px",
        }}
      >
        <Row className="g-4">
          {projects.map((p) => (
            <Col xs={12} sm={12} md={6} key={p.id}>
              {/* SUB CARD */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                {/* Initiative */}
                <p style={{ fontSize: "13px", marginBottom: "6px" }}>
                  from{" "}
                  <span style={{ color: "#2563eb", fontWeight: 500 }}>
                    {p.initiative}
                  </span>
                </p>

                {/* Title */}
                <h5 style={{ marginBottom: "6px", fontWeight: "600" }}>{p.title}</h5>

                {/* Description */}
                <p style={{ color: "#6b7280", marginBottom: "12px" }}>
                  {p.description}
                </p>

                {/* Quote Box */}
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontStyle: "italic",
                    fontSize: "14px",
                    marginBottom: "16px",
                    border: "1px solid #589be9ff",
                    backgroundColor: "#E8F3FF",
                    color:"#589be9ff",
                  }}
                >
                  “{p.quote}”
                </div>

                {/* Last Edited */}
                <p style={{ fontSize: "13px", color: "#6b7280" }}>
                  Last edited by <span style={{ color: "#000" }}>{p.lastUpdated.split(" ").slice(-2).join(" ")}</span>
                </p>
                <hr />

                {/* Buttons */}
                <div className="d-flex flex-column flex-md-row gap-2 mt-3">
                  <button
                    onClick={() => navigate("/projects/edit")}
                    className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <Pencil size={16} /> Edit
                  </button>

                  <button
                    className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <Trash2 size={16} /> Delete
                  </button>

                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

    </Container>
  );
};

export default ProjectsSection;
