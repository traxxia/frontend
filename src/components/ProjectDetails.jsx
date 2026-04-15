import React from "react";
import { Breadcrumb } from "react-bootstrap";
import { useTranslation } from "../hooks/useTranslation";
import {
    Circle,
    Diamond,
    Rocket,
    Bolt,
    Lightbulb,
    Heart,
    Shield,
    Boxes,
    Clock,
    ArrowLeft,
    Edit3,
    AlertTriangle,
    XCircle,
    CheckCircle,
    Edit2,
    Info
} from "lucide-react";
import "../styles/ProjectDetails.css";

const getImpactIcon = (impact) => {
    const normalizedImpact = !impact ? "" : impact.charAt(0).toUpperCase() + impact.slice(1).toLowerCase();
    switch (normalizedImpact) {
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
    const normalizedEffort = !effort ? "" : effort.charAt(0).toUpperCase() + effort.slice(1).toLowerCase();
    switch (normalizedEffort) {
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
    const normalizedRisk = !risk ? "" : risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase();
    switch (normalizedRisk) {
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


const ProjectDetails = ({
    project,
    onBack,
    onEdit,
    onPerformReview,
    onAdhocUpdate,
    canEdit = false,
    canReview = false
}) => {
    const { t } = useTranslation();

    const isPendingReview = React.useMemo(() => {
        if (!project || !project.next_review_date) return false;
        if (project.is_stale || new Date(project.next_review_date).getTime() < new Date().setHours(0, 0, 0, 0)) return false;
        const nextDate = new Date(project.next_review_date);
        nextDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
    }, [project]);

    const terminalStatusInfo = React.useMemo(() => {
        const statusLower = (project?.status || "").toLowerCase();
        const isTerminal = statusLower === "completed" || statusLower === "scaled" || statusLower === "killed";
        if (!isTerminal) return null;

        let message = "Project reached a final state cannot be edited further.";
        if (statusLower === "completed") message = "Project reached Completed state cannot be edited further.";
        else if (statusLower === "scaled") message = "Project reached Scaled state cannot be edited further.";
        else if (statusLower === "killed") message = "Project reached Killed state cannot be edited further.";

        const latestTerminalLog = project?.decision_log && [...project.decision_log]
            .reverse()
            .find(log => (log.to_status || "").toLowerCase() === statusLower);

        return { isTerminal, message, justification: latestTerminalLog?.justification };
    }, [project]);

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

            {terminalStatusInfo && (
                <div className="terminal-status-banner" style={{
                    backgroundColor: "#eff6ff",
                    border: "1px solid #dbeafe",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#1e40af"
                }}>
                    <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "14px" }}>
                        <span style={{ fontWeight: "600" }}>{terminalStatusInfo.message}</span>
                        {terminalStatusInfo.justification && (
                            <>
                                <span style={{ color: "#3b82f6", opacity: 0.8 }}>•</span>
                                <span style={{ fontStyle: "italic", color: "#1d4ed8" }}>
                                    "{terminalStatusInfo.justification || t("No_justification_provided")}"
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Header with Title and Actions */}
            <div className="details-header mb-4">
                <h1 className="details-title">{project.project_name}</h1>
                <div className="details-actions">
                    {canEdit && !["completed", "scaled", "killed"].includes(project.status?.toLowerCase()) && (
                        <button className="btn-edit" onClick={() => onEdit(project)}>
                            <Edit2 size={16} /> {t("Edit")}
                        </button>
                    )}
                </div>
            </div>


            {/* Strategic Core */}
            <div className="details-card">
                <h3 className="card-title">🎯 {t("Strategic_Core")}</h3>
                <div className="details-grid">
                    <div className="detail-item">
                        <label className="detail-label">{t("Project_Description")}</label>
                        <p className="detail-value">{project.description || t("Not_Available")}</p>
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
                                    {getImpactIcon(project.impact)}
                                    <span>{project.impact ? t(project.impact.charAt(0).toUpperCase() + project.impact.slice(1).toLowerCase()) : t("Not_Available")}</span>
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
                                            "completed": "Completed",
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
                                    {project.learning_state === "Invalidated" && <XCircle size={16} color="red" />}
                                    {project.learning_state === "Testing" && <Clock size={16} color="blue" />}
                                    <span>{project.learning_state ? t(project.learning_state) : t("Testing")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="detail-item">
                            <label className="detail-label">{t("Review_Cadence")}</label>
                            <p className="detail-value">{project.review_cadence ? t(project.review_cadence) : t("Not_Available")}</p>
                        </div>
                        <div className="detail-item">
                            <label className="detail-label">{t("Next_Review_Date")}</label>
                            <div className="detail-value" style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{
                                    color: (project.is_stale || (project.next_review_date && new Date(project.next_review_date).getTime() < new Date().setHours(0, 0, 0, 0))) ? '#ef4444' : (isPendingReview ? '#d97706' : 'inherit'),
                                    fontWeight: '600'
                                }}>
                                    {project.next_review_date ? new Date(project.next_review_date).toLocaleDateString() : t("Not_Available")}
                                </span>
                                {(project.is_stale || (project.next_review_date && new Date(project.next_review_date).getTime() < new Date().setHours(0, 0, 0, 0))) ? (
                                    <span className="review-badge stale">
                                        <AlertTriangle size={12} /> {t("Stale")}
                                    </span>
                                ) : isPendingReview && (
                                    <span className="review-badge due">
                                        <Clock size={12} /> {t("Pending_Review") || "Pending Review"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="detail-item">
                            <label className="detail-label">{t("Last_Reviewed")}</label>
                            <p className="detail-value">{project.last_reviewed ? new Date(project.last_reviewed).toLocaleDateString() : t("Never")}</p>
                        </div>
                        <div className="detail-item" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                            {canEdit && !["completed", "scaled", "killed"].includes(project.status?.toLowerCase()) && (
                                <button className="btn-edit" onClick={() => onEdit(project)} style={{ padding: '6px 12px', fontSize: '13px' }}>
                                    <Edit2 size={14} /> {t("Edit")}
                                </button>
                            )}
                            {canReview && !["completed", "scaled", "killed"].includes(project.status?.toLowerCase()) && (
                                <>
                                    <button className="btn-review" onClick={() => onPerformReview(project)} style={{ background: '#059669', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CheckCircle size={14} /> {t("Perform_Review")}
                                    </button>
                                    <button className="btn-adhoc" onClick={() => onAdhocUpdate(project)} style={{ background: '#4b5563', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Edit3 size={14} /> {t("Ad_Hoc_Update")}
                                    </button>
                                </>
                            )}
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
                                {getImpactIcon(project.impact)}
                                <span>{project.impact ? t(project.impact.charAt(0).toUpperCase() + project.impact.slice(1).toLowerCase()) : t("Not_Available")}</span>
                            </div>
                        </div>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Effort")}</label>
                        <div className="detail-value">
                            <div className="detail-value-with-icon">
                                {getEffortIcon(project.effort)}
                                <span>{project.effort ? t(project.effort.charAt(0).toUpperCase() + project.effort.slice(1).toLowerCase()) : "N/A"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="detail-item">
                        <label className="detail-label">{t("Risk")}</label>
                        <div className="detail-value">
                            <div className="detail-value-with-icon">
                                {getRiskIcon(project.risk)}
                                <span>{project.risk ? t(project.risk.charAt(0).toUpperCase() + project.risk.slice(1).toLowerCase()) : "N/A"}</span>
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

            {/* Decision Log */}
            {project.decision_log && project.decision_log.length > 0 && (
                <div className="details-card mt-4">
                    <h3 className="card-title">📜 {t("Decision_Log") || "Decision Log"}</h3>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t("Date") || "Date"}</th>
                                    <th>{t("Transition") || "Transition"}</th>
                                    <th>{t("Justification") || "Justification"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {project.decision_log.map((log, index) => (
                                    <tr key={index}>
                                        <td>{new Date(log.changed_at).toLocaleDateString()}</td>
                                        <td>
                                            <span className="badge bg-secondary">{log.from_status}</span>
                                            {" ➔ "}
                                            <span className="badge bg-primary">{log.to_status}</span>
                                        </td>
                                        <td>{log.justification}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;