import React from "react";
import { Breadcrumb } from "react-bootstrap";
import { useTranslation } from "../hooks/useTranslation";
import {
    TrendingUp,
    Zap,
    Circle,
    Diamond,
    Rocket,
    Bolt,
    Lightbulb,
    Heart,
    Shield,
    Boxes,
    Clock,
    DollarSign,
    ArrowLeft,
    Edit3,
    PlayCircle,
    AlertTriangle,
    PauseCircle,
    XCircle,
    CheckCircle,
    Edit2
} from "lucide-react";
import "../styles/ProjectDetails.css";

const ProjectDetails = ({
    project,
    onBack,
    onEdit,
    canEdit = false
}) => {
    const { t } = useTranslation();

    if (!project) {
        return (
            <div className="project-details-container">
                <div className="no-project-message">
                    <p>No project data available.</p>
                    <button className="btn-back" onClick={onBack}>
                        <ArrowLeft size={16} /> Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    const getImpactIcon = (impact) => {
        switch (impact) {
            case "High":
                return <Circle size={14} color="green" fill="green" />;
            case "Medium":
                return <Circle size={14} color="gold" fill="gold" />;
            case "Low":
                return <Circle size={14} color="gray" fill="gray" />;
            default:
                return <Circle size={14} color="gray" />;
        }
    };

    const getEffortIcon = (effort) => {
        switch (effort) {
            case "Small":
                return <Diamond size={14} fill="black" color="black" />;
            case "Medium":
                return (
                    <div style={{ display: "flex", gap: "2px" }}>
                        <Diamond size={14} fill="black" color="black" />
                        <Diamond size={14} fill="black" color="black" />
                    </div>
                );
            case "Large":
                return (
                    <div style={{ display: "flex", gap: "2px" }}>
                        <Diamond size={14} fill="black" color="black" />
                        <Diamond size={14} fill="black" color="black" />
                        <Diamond size={14} fill="black" color="black" />
                    </div>
                );
            default:
                return null;
        }
    };

    const getRiskIcon = (risk) => {
        switch (risk) {
            case "Low":
                return <Circle size={14} color="green" fill="green" />;
            case "Medium":
                return <Circle size={14} color="gold" fill="gold" />;
            case "High":
                return <Circle size={14} color="red" fill="red" />;
            default:
                return <Circle size={14} color="gray" />;
        }
    };

    const getThemeIcon = (theme) => {
        switch (theme) {
            case "Growth":
                return <Rocket size={16} color="#e11d48" />;
            case "Efficiency":
                return <Bolt size={16} color="#f59e0b" />;
            case "Innovation":
                return <Lightbulb size={16} color="#facc15" />;
            case "CustomerExperience":
                return <Heart size={16} color="#dc2626" fill="#dc2626" />;
            case "RiskMitigation":
                return <Shield size={16} color="#3b82f6" />;
            case "Platform":
                return <Boxes size={16} color="#fb923c" />;
            default:
                return null;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Active":
                return <PlayCircle size={16} color="green" />;
            case "At Risk":
                return <AlertTriangle size={16} color="red" />;
            case "Paused":
                return <PauseCircle size={16} color="orange" />;
            case "Killed":
                return <XCircle size={16} color="grey" />;
            case "Scaled":
                return <CheckCircle size={16} color="purple" />;
            default:
                return <Edit2 size={16} color="grey" />;
        }
    };

    return (
        <div className="project-details-container">
            {/* Breadcrumb */}
            <div className="projects-breadcrumb">
                <Breadcrumb>
                    <Breadcrumb.Item onClick={onBack} style={{ cursor: "pointer" }}>
                        {t("Projects")}
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active>{project.project_name}</Breadcrumb.Item>
                </Breadcrumb>
            </div>

            {/* Required Information */}
            <div className="details-card">
                <h3 className="card-title">{t("Required_Information")}</h3>
                <div className="details-grid">
                    <div className="detail-item">
                        <label className="detail-label">{t("Project_Description")}</label>
                        <p className="detail-value">{project.description || "N/A"}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Why_This_Matters")}</label>
                        <p className="detail-value">{project.importance || "N/A"}</p>
                    </div>
                </div>
            </div>

            {/* Strategic Core */}
            <div className="details-card">
                <h3 className="card-title">{t("Strategic_Core")}</h3>
                <div className="details-grid">
                    <div className="detail-item full-width">
                        <label className="detail-label">{t("Strategic_Decision_Bet")}</label>
                        <p className="detail-value">{project.strategic_decision || "N/A"}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Accountable_Owner")}</label>
                        <p className="detail-value">{project.accountable_owner || "N/A"}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Status")}</label>
                        <div className="detail-value">
                            <div className="detail-value-with-icon">
                                <span>{project.status ? t(project.status) : t("Draft")}</span>
                            </div>
                        </div>
                    </div>
                    {project.key_assumptions && project.key_assumptions.length > 0 && (
                        <div className="detail-item full-width">
                            <label className="detail-label">{t("Key_Assumptions")}</label>
                            <ul className="assumptions-list">
                                {project.key_assumptions.filter(a => a).map((assumption, idx) => (
                                    <li key={idx}>{assumption}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="detail-item">
                        <label className="detail-label">{t("Success_Criteria")}</label>
                        <p className="detail-value">{project.success_criteria || "N/A"}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Kill_Criteria")}</label>
                        <p className="detail-value">{project.kill_criteria || "N/A"}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Review_Cadence")}</label>
                        <div className="detail-value">
                            <div className="detail-value-with-icon">
                                <span>{project.review_cadence ? t(project.review_cadence) : "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategic Context */}
            <div className="details-card">
                <h3 className="card-title">{t("Strategic_Context")}</h3>
                <div className="details-grid-3">
                    <div className="detail-item">
                        <label className="detail-label">{t("Impact")}</label>
                        <div className="detail-value">
                            <div className="detail-value-with-icon">
                                <span>{project.impact || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Effort")}</label>
                        <div className="detail-value">
                            <div className="detail-value-with-icon">
                                <span>{project.effort || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Risk")}</label>
                        <div className="detail-value">
                            <div className="detail-value-with-icon">
                                <span>{project.risk || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                    {project.strategic_theme && (
                        <div className="detail-item">
                            <label className="detail-label">{t("Strategic_Theme")}</label>
                            <div className="detail-value">
                                <div className="detail-value-with-icon">
                                    <span>{project.strategic_theme || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Details */}
            <div className="details-card">
                <h3 className="card-title">{t("Additional_Details")}</h3>
                <div className="details-grid">
                    <div className="detail-item">
                        <label className="detail-label">{t("High_Level_Requirements")}</label>
                        <p className="detail-value">{project.high_level_req || "N/A"}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Dependencies")}</label>
                        <p className="detail-value">{project.dependencies || "N/A"}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Scope")}</label>
                        <p className="detail-value">{project.scope || "N/A"}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Expected_Outcome")}</label>
                        <p className="detail-value">{project.outcome || "N/A"}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Success_Metrics")}</label>
                        <p className="detail-value">{project.success_metrics || "N/A"}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Estimated_Timeline")}</label>
                        <p className="detail-value">{project.timeline || "N/A"}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Budget_Estimate")}</label>
                        <div className="detail-value">
                            <div className="detail-value-with-icon">
                                <span>{project.budget || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
