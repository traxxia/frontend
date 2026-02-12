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
                    <p>{t("No_project_data")}</p>
                    <button className="btn-back" onClick={onBack}>
                        <ArrowLeft size={16} /> {t("Back_to_Projects")}
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


            {/* Strategic Core */}
            <div className="details-card">
                <h3 className="card-title">🎯 {t("Strategic_Core")}</h3>
                <div className="details-grid">
                    <div className="detail-item">
                        <label className="detail-label">{t("Project_Description")}</label>
                        <p className="detail-value">{project.description || t("Not_Available")}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Why_This_Matters")}</label>
                        <p className="detail-value">{project.why_this_matters || t("Not_Available")}</p>
                    </div>
                    <div className="detail-item full-width">
                        <label className="detail-label">
                            {t("Strategic_Decision_Bet")}
                            <small className="field-sub-label">{t("Strategic_Decision_Sublabel")}</small>
                        </label>
                        <p className="detail-value">{project.strategic_decision || t("Not_Available")}</p>
                    </div>

                    <div className="grid-2">
                        <div className="detail-item">
                            <label className="detail-label">{t("Accountable_Owner")}</label>
                            <p className="detail-value">{project.accountable_owner || t("Not_Available")}</p>
                        </div>
                        <div className="detail-item">
                            <label className="detail-label">{t("Impact")}</label>
                            <div className="detail-value">
                                <div className="detail-value-with-icon">
                                    <span>{project.impact ? t(project.impact) : t("Not_Available")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-item full-width">
                        <label className="detail-label">
                            {t("Key_Assumptions_Tested")}
                            <small className="field-sub-label">{t("Key_Assumptions_Sublabel")}</small>
                        </label>
                        {project.key_assumptions && project.key_assumptions.length > 0 ? (
                            <ul className="assumptions-list" style={{ marginTop: '8px' }}>
                                {project.key_assumptions.filter(a => a).map((assumption, idx) => (
                                    <li key={idx}>{assumption}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="detail-value">{t("Not_Available")}</p>
                        )}
                    </div>

                    <div className="grid-2">
                        <div className="detail-item">
                            <label className="detail-label">
                                {t("Continue_If_Label")}
                                <small className="field-sub-label">{t("Continue_If_Sublabel")}</small>
                            </label>
                            <p className="detail-value">{project.success_criteria || t("Not_Available")}</p>
                        </div>
                        <div className="detail-item">
                            <label className="detail-label">
                                {t("Stop_If_Label")}
                                <small className="field-sub-label">{t("Stop_If_Sublabel")}</small>
                            </label>
                            <p className="detail-value">{project.kill_criteria || t("Not_Available")}</p>
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="detail-item">
                            <label className="detail-label">{t("Status")}</label>
                            <div className="detail-value">
                                <div className="detail-value-with-icon">
                                    {(() => {
                                        // Valid project statuses (case-insensitive check)
                                        const validProjectStatuses = ["draft", "active", "at risk", "paused", "killed", "scaled"];
                                        const statusLower = (project.status || "").toLowerCase();
                                        const isValidStatus = validProjectStatuses.includes(statusLower);

                                        // Normalize to proper case for display
                                        const statusMap = {
                                            "draft": "Draft",
                                            "active": "Active",
                                            "at risk": "At Risk",
                                            "paused": "Paused",
                                            "killed": "Killed",
                                            "scaled": "Scaled"
                                        };

                                        // If no status or invalid status, default to Draft
                                        const displayStatus = isValidStatus ? statusMap[statusLower] : "Draft";

                                        return (
                                            <>
                                                <span>{t(displayStatus)}</span>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div className="detail-item">
                            <label className="detail-label">{t("Learning_State")}</label>
                            <div className="detail-value">
                                <div className="detail-value-with-icon">
                                    {project.learning_state === "Validated" && <CheckCircle size={16} color="green" />}
                                    {project.learning_state === "Disproven" && <XCircle size={16} color="red" />}
                                    {project.learning_state === "Testing" && <Clock size={16} color="blue" />}
                                    <span>{project.learning_state ? t(project.learning_state) : t("Testing")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <label className="detail-label">{t("Review_Cadence")}</label>
                        <p className="detail-value">{project.review_cadence ? t(project.review_cadence) : t("Not_Available")}</p>
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
                                <span>{project.impact ? t(project.impact) : t("Not_Available")}</span>
                            </div>
                        </div>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Effort")}</label>
                        <div className="detail-value">
                            <div className="detail-value-with-icon">
                                {getEffortIcon(project.effort)}
                                <span>{project.effort ? t(project.effort) : t("Not_Available")}</span>
                            </div>
                        </div>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Risk")}</label>
                        <div className="detail-value">
                            <div className="detail-value-with-icon">
                                <span>{project.risk ? t(project.risk) : t("Not_Available")}</span>
                            </div>
                        </div>
                    </div>
                    {project.strategic_theme && (
                        <div className="detail-item">
                            <label className="detail-label">{t("Strategic_Theme")}</label>
                            <div className="detail-value">
                                <div className="detail-value-with-icon">
                                    {getThemeIcon(project.strategic_theme)}
                                    <span>{project.strategic_theme ? t(project.strategic_theme) : t("Not_Available")}</span>
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
                        <label className="detail-label">{t("Constraints_Non_Negotiables")}</label>
                        <p className="detail-value">{project.constraints_non_negotiables || project.high_level_requirements || t("Not_Available")}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Dependencies")}</label>
                        <p className="detail-value">{project.dependencies || t("Not_Available")}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Explicitly_Out_of_Scope")}</label>
                        <p className="detail-value">{project.explicitly_out_of_scope || project.scope_definition || t("Not_Available")}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Expected_Outcome")}</label>
                        <p className="detail-value">{project.expected_outcome || t("Not_Available")}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Success_Metrics")}</label>
                        <p className="detail-value">{project.success_metrics || t("Not_Available")}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Estimated_Timeline")}</label>
                        <p className="detail-value">{project.estimated_timeline || t("Not_Available")}</p>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Budget_Estimate")}</label>
                        <div className="detail-value">
                            <div className="detail-value-with-icon">
                                <span>{project.budget_estimate || t("Not_Available")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;