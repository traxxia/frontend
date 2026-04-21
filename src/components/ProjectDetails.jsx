import React, { useState, useEffect, useMemo } from "react";
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
    Info,
    Zap,
    TrendingUp,
    Lock,
    DollarSign
} from "lucide-react";
import "../styles/ProjectDetails.css";
import { decisionLogApiService } from "../services/decisionLogApiService";

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

    // --- Decision Log state ---
    const [decisionLogs, setDecisionLogs] = useState(project?.decision_log || []);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsError, setLogsError] = useState("");
    const [sortOrder, setSortOrder] = useState("desc");
    const [logTypeFilter, setLogTypeFilter] = useState("");
    const [executionStateFilter, setExecutionStateFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(project?.decision_log?.length || 0);
    const [selectedLogDetails, setSelectedLogDetails] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newLogType, setNewLogType] = useState("manual");
    const [newExecutionState, setNewExecutionState] = useState(project?.status || "Draft");
    const [newJustification, setNewJustification] = useState("");
    const [isCreatingLog, setIsCreatingLog] = useState(false);

    const pageSize = 8;

    const fetchDecisionLogs = React.useCallback(async (targetPage = 1) => {
        if (!project?._id) return;
        setLogsLoading(true);
        setLogsError("");
        try {
            const response = await decisionLogApiService.getProjectLogs(project._id, {
                limit: pageSize,
                skip: (targetPage - 1) * pageSize,
                sort_order: sortOrder,
                log_type: logTypeFilter || undefined,
                execution_state: executionStateFilter || undefined,
            });
            setDecisionLogs(response.logs || []);
            setTotalLogs(response.total || 0);
        } catch (error) {
            setLogsError(error?.response?.data?.error || "Failed to load decision logs");
            setDecisionLogs(project?.decision_log || []);
            setTotalLogs((project?.decision_log || []).length);
        } finally {
            setLogsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?._id, sortOrder, logTypeFilter, executionStateFilter]);

    useEffect(() => {
        setPage(1);
        setDecisionLogs(project?.decision_log || []);
        setTotalLogs((project?.decision_log || []).length);
        setSelectedLogDetails(null);
    }, [project?._id, project?.decision_log]);

    useEffect(() => {
        fetchDecisionLogs(page);
    }, [fetchDecisionLogs, page]);

    const totalPages = useMemo(() => {
        if (!totalLogs) return 1;
        return Math.max(1, Math.ceil(totalLogs / pageSize));
    }, [totalLogs]);

    const handleCreateManualLog = async () => {
        const justification = newJustification.trim();
        if (!justification || !project?._id) return;
        setIsCreatingLog(true);
        setLogsError("");
        try {
            await decisionLogApiService.createDecisionLog(project._id, {
                log_type: newLogType,
                decision: "manual_decision",
                execution_state: newExecutionState,
                assumption_state: project?.learning_state || "Testing",
                justification,
                metadata: { source: "project_details_manual_form" },
            });
            setNewJustification("");
            setShowCreateForm(false);
            setPage(1);
            fetchDecisionLogs(1);
        } catch (error) {
            setLogsError(error?.response?.data?.error || "Failed to create decision log");
        } finally {
            setIsCreatingLog(false);
        }
    };

    const handleOpenDetails = async (decisionLogId) => {
        try {
            const details = await decisionLogApiService.getDecisionDetails(decisionLogId);
            setSelectedLogDetails(details.log || null);
        } catch (error) {
            setLogsError(error?.response?.data?.error || "Failed to load decision details");
        }
    };

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


            {/* Required Information */}
            <div className="form-card">
                <h3 className="section-title">{t("Required_Information")}</h3>
                
                {/* Project Name */}
                <div className="field-row">
                    <div className="field-label-row">
                        <label className="field-label">
                            {t("Project_Name")}
                        </label>
                    </div>
                    <div className="detail-value-display" style={{ fontWeight: '700', fontSize: '16px' }}>
                        {project.project_name}
                    </div>
                </div>

                {/* Project Description */}
                <div className="field-row">
                    <div className="field-label-row">
                        <label className="field-label">
                            {t("Project_Description")}
                        </label>
                    </div>
                    <div className="detail-value-display">
                        {project.description || t("Not_Available")}
                    </div>
                </div>
            </div>

            {/* Strategic Core */}
            <div className="form-card">
                <h3 className="section-title">{t("Strategic_Core")}</h3>
                
                {/* Accountable Owner */}
                <div className="field-row">
                    <div className="field-label-row">
                        <label className="field-label">
                            <Zap size={14} /> {t("Accountable_Owner")}
                        </label>
                    </div>
                    <div className="detail-value-display">
                        {project.accountable_owner || project.created_by || t("Not_Available")}
                    </div>
                </div>

                {/* Key Assumptions */}
                <div className="field-row">
                    <div className="field-label-row">
                        <label className="field-label">
                            {t("Key_Assumptions_Tested")}
                        </label>
                    </div>
                    {project.key_assumptions && project.key_assumptions.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {project.key_assumptions.filter(a => a).map((assumption, idx) => (
                                <div key={idx} className="detail-value-display" style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    {assumption}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="detail-value-display">{t("Not_Available")}</div>
                    )}
                </div>

                {/* Success & Kill Criteria */}
                <div className="grid-2">
                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                {t("Continue_If_Label")}
                            </label>
                        </div>
                        <div className="detail-value-display">
                            {project.success_criteria || t("Not_Available")}
                        </div>
                    </div>
                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                {t("Stop_If_Label")}
                            </label>
                        </div>
                        <div className="detail-value-display">
                            {project.kill_criteria || t("Not_Available")}
                        </div>
                    </div>
                </div>

                {/* Status, Cadence, Learning State */}
                <div className="grid-3" style={{ marginTop: '16px' }}>
                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                <Clock size={16} /> {t("Review_Cadence")}
                            </label>
                        </div>
                        <div className="detail-value-display">
                            {project.review_cadence ? t(project.review_cadence) : t("Not_Available")}
                        </div>
                    </div>

                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                <TrendingUp size={16} /> {t("Status")}
                            </label>
                        </div>
                        <div className="detail-value-display">
                            <div className="detail-value-with-icon">
                                {(() => {
                                    const validProjectStatuses = ["draft", "active", "at risk", "paused", "killed", "scaled"];
                                    const statusLower = (project.status || "").toLowerCase();
                                    const isValidStatus = validProjectStatuses.includes(statusLower);
                                    const statusMap = {
                                        "draft": "Draft",
                                        "active": "Active",
                                        "at risk": "At Risk",
                                        "paused": "Paused",
                                        "killed": "Killed",
                                        "completed": "Completed",
                                        "scaled": "Scaled"
                                    };
                                    const displayStatus = isValidStatus ? statusMap[statusLower] : "Draft";
                                    return <span>{t(displayStatus)}</span>;
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                <Zap size={16} /> {t("Learning_State")}
                            </label>
                        </div>
                        <div className="detail-value-display">
                            <div className="detail-value-with-icon">
                                {project.learning_state === "Validated" && <CheckCircle size={16} color="green" />}
                                {project.learning_state === "Invalidated" && <XCircle size={16} color="red" />}
                                {project.learning_state === "Testing" && <Clock size={16} color="blue" />}
                                <span>{project.learning_state ? t(project.learning_state) : t("Testing")}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review Dates (View-specific but in Strategic Core) */}
                <div className="grid-2">
                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                <Clock size={16} /> {t("Next_Review_Date")}
                            </label>
                        </div>
                        <div className="detail-value-display" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                {t("Last_Reviewed")}
                            </label>
                        </div>
                        <div className="detail-value-display">
                            {project.last_reviewed ? new Date(project.last_reviewed).toLocaleDateString() : t("Never")}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="field-row" style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    {canEdit && !["completed", "scaled", "killed"].includes(project.status?.toLowerCase()) && (
                        <button className="btn-edit" onClick={() => onEdit(project)} style={{ padding: '8px 16px', fontSize: '13px' }}>
                            <Edit2 size={14} /> {t("Edit")}
                        </button>
                    )}
                    {canReview && !["completed", "scaled", "killed"].includes(project.status?.toLowerCase()) && (
                        <>
                            <button className="btn-review" onClick={() => onPerformReview(project)} style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle size={14} /> {t("Perform_Review")}
                            </button>
                            <button className="btn-adhoc" onClick={() => onAdhocUpdate(project)} style={{ background: '#4b5563', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Edit3 size={14} /> {t("Ad_Hoc_Update")}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Strategic Context */}
            <div className="form-card">
                <h3 className="section-title">{t("Strategic_Context")}</h3>
                <div className="grid-2">
                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                <TrendingUp size={16} /> {t("Impact")}
                            </label>
                        </div>
                        <div className="detail-value-display">
                            <div className="detail-value-with-icon">
                                {getImpactIcon(project.impact)}
                                <span>{project.impact ? t(project.impact.charAt(0).toUpperCase() + project.impact.slice(1).toLowerCase()) : t("Not_Available")}</span>
                            </div>
                        </div>
                    </div>
                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                <Zap size={16} /> {t("Effort")}
                            </label>
                        </div>
                        <div className="detail-value-display">
                            <div className="detail-value-with-icon">
                                {getEffortIcon(project.effort)}
                                <span>{project.effort ? t(project.effort.charAt(0).toUpperCase() + project.effort.slice(1).toLowerCase()) : "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid-2">
                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                <AlertTriangle size={16} /> {t("Risk")}
                            </label>
                        </div>
                        <div className="detail-value-display">
                            <div className="detail-value-with-icon">
                                {getRiskIcon(project.risk)}
                                <span>{project.risk ? t(project.risk.charAt(0).toUpperCase() + project.risk.slice(1).toLowerCase()) : "N/A"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                <Lock size={16} /> {t("Strategic_Theme_Horizon")}
                            </label>
                        </div>
                        <div className="detail-value-display">
                            <div className="detail-value-with-icon">
                                {getThemeIcon(project.strategic_theme)}
                                <span>{project.strategic_theme ? t(project.strategic_theme) : t("Not_Available")}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="field-row">
                    <div className="field-label-row">
                        <label className="field-label">{t("Dependencies")}</label>
                    </div>
                    <div className="detail-value-display">
                        {project.dependencies || t("Not_Available")}
                    </div>
                </div>
            </div>

            {/* Detailed Planning */}
            <div className="form-card">
                <h3 className="section-title">{t("Detailed_Planning")}</h3>
                
                <div className="field-row">
                    <div className="field-label-row">
                        <label className="field-label">{t("Constraints_Non_Negotiables")}</label>
                    </div>
                    <div className="detail-value-display">
                        {project.constraints_non_negotiables || project.high_level_requirements || t("Not_Available")}
                    </div>
                </div>

                <div className="field-row">
                    <div className="field-label-row">
                        <label className="field-label">{t("Explicitly_Out_of_Scope")}</label>
                    </div>
                    <div className="detail-value-display">
                        {project.explicitly_out_of_scope || project.scope_definition || t("Not_Available")}
                    </div>
                </div>

                <div className="field-row">
                    <div className="field-label-row">
                        <label className="field-label">{t("Expected_Outcome")}</label>
                    </div>
                    <div className="detail-value-display">
                        {project.expected_outcome || t("Not_Available")}
                    </div>
                </div>

                <div className="field-row">
                    <div className="field-label-row">
                        <label className="field-label">{t("Success_Metrics")}</label>
                    </div>
                    <div className="detail-value-display">
                        {project.success_metrics || t("Not_Available")}
                    </div>
                </div>

                <div className="grid-2">
                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                <Clock size={16} /> {t("Estimated_Timeline")}
                            </label>
                        </div>
                        <div className="detail-value-display">
                            {project.estimated_timeline || t("Not_Available")}
                        </div>
                    </div>
                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                <DollarSign size={16} /> {t("Budget_Estimate")}
                            </label>
                        </div>
                        <div className="detail-value-display">
                            {project.budget_estimate || t("Not_Available")}
                        </div>
                    </div>
                </div>
            </div>

            {/* Decision Log */}
            <div className="details-card mt-4">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h3 className="card-title">📜 {t("Decision_Log") || "Decision Log"}</h3>
                    {canEdit && (
                        <button className="btn-edit" onClick={() => setShowCreateForm((prev) => !prev)}>
                            {showCreateForm ? (t("Cancel") || "Cancel") : (t("Add_Decision_Log") || "Add Decision Log")}
                        </button>
                    )}
                </div>

                {showCreateForm && (
                    <div style={{ marginBottom: "16px", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "10px" }}>
                            <select value={newLogType} onChange={(e) => setNewLogType(e.target.value)} className="form-select">
                                <option value="manual">{t("Manual") || "Manual"}</option>
                                <option value="review_update">{t("Review") || "Review"}</option>
                                <option value="adhoc_update">{t("Ad_Hoc_Update") || "Ad Hoc Update"}</option>
                            </select>
                            <select value={newExecutionState} onChange={(e) => setNewExecutionState(e.target.value)} className="form-select">
                                <option>Draft</option>
                                <option>Active</option>
                                <option>At Risk</option>
                                <option>Paused</option>
                                <option>Killed</option>
                                <option>Completed</option>
                                <option>Scaled</option>
                            </select>
                        </div>
                        <textarea
                            className="form-control"
                            rows={3}
                            value={newJustification}
                            onChange={(e) => setNewJustification(e.target.value)}
                            placeholder={t("Please provide a mandatory justification for the decision log...") || "Add a clear justification"}
                        />
                        <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
                            <button
                                className="btn-edit"
                                disabled={isCreatingLog || !newJustification.trim()}
                                onClick={handleCreateManualLog}
                            >
                                {isCreatingLog ? (t("Saving...") || "Saving...") : (t("Save") || "Save")}
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "12px" }}>
                    <select className="form-select" value={logTypeFilter} onChange={(e) => { setLogTypeFilter(e.target.value); setPage(1); }}>
                        <option value="">{t("All_Types") || "All Types"}</option>
                        <option value="manual">{t("Manual") || "Manual"}</option>
                        <option value="status_change">{t("Status_Change") || "Status Change"}</option>
                        <option value="review_update">{t("Review") || "Review"}</option>
                        <option value="adhoc_update">{t("Ad_Hoc_Update") || "Ad Hoc Update"}</option>
                        <option value="cadence_review">{t("Cadence_Review") || "Cadence Review"}</option>
                    </select>
                    <select className="form-select" value={executionStateFilter} onChange={(e) => { setExecutionStateFilter(e.target.value); setPage(1); }}>
                        <option value="">{t("All_States") || "All States"}</option>
                        <option>Draft</option>
                        <option>Active</option>
                        <option>At Risk</option>
                        <option>Paused</option>
                        <option>Killed</option>
                        <option>Completed</option>
                        <option>Scaled</option>
                    </select>
                    <select className="form-select" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}>
                        <option value="desc">{t("Newest_First") || "Newest first"}</option>
                        <option value="asc">{t("Oldest_First") || "Oldest first"}</option>
                    </select>
                </div>

                {logsError && <p style={{ color: "#dc2626", marginBottom: "10px" }}>{logsError}</p>}
                {logsLoading ? (
                    <p>{t("Loading") || "Loading"}...</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t("Date") || "Date"}</th>
                                    <th>{t("Log_Type") || "Log Type"}</th>
                                    <th>{t("Decision") || "Decision"}</th>
                                    <th>{t("Execution_State") || "Execution State"}</th>
                                    <th>{t("Justification") || "Justification"}</th>
                                    <th>{t("Details") || "Details"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {decisionLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>
                                            {t("No_decision_logs_available") || "No decision logs available"}
                                        </td>
                                    </tr>
                                ) : (
                                    decisionLogs.map((log) => (
                                        <tr key={String(log._id)}>
                                            <td>{new Date(log.created_at || log.changed_at).toLocaleString()}</td>
                                            <td>{log.log_type || "-"}</td>
                                            <td>{log.decision || `${log.from_status || "-"} → ${log.to_status || "-"}`}</td>
                                            <td>{log.execution_state || log.to_status || "-"}</td>
                                            <td style={{ maxWidth: "240px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {log.justification || "-"}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => handleOpenDetails(log._id)}
                                                    style={{ padding: "4px 10px", fontSize: "12px" }}
                                                >
                                                    {t("View") || "View"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                    <small>{`${t("Total") || "Total"}: ${totalLogs}`}</small>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                            className="btn-edit"
                            style={{ padding: "4px 10px", fontSize: "12px" }}
                            disabled={page <= 1}
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        >
                            {t("Prev") || "Prev"}
                        </button>
                        <small>{`${page} / ${totalPages}`}</small>
                        <button
                            className="btn-edit"
                            style={{ padding: "4px 10px", fontSize: "12px" }}
                            disabled={page >= totalPages}
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        >
                            {t("Next") || "Next"}
                        </button>
                    </div>
                </div>

                {selectedLogDetails && (
                    <div style={{ marginTop: "14px", borderTop: "1px solid #e5e7eb", paddingTop: "10px" }}>
                        <h5 style={{ fontSize: "14px", fontWeight: 700 }}>{t("Decision_Log_Details") || "Decision Log Details"}</h5>
                        <p style={{ marginBottom: "6px" }}><strong>{t("Decision") || "Decision"}:</strong> {selectedLogDetails.decision || "-"}</p>
                        <p style={{ marginBottom: "6px" }}><strong>{t("Type") || "Type"}:</strong> {selectedLogDetails.log_type || "-"}</p>
                        <p style={{ marginBottom: "6px" }}><strong>{t("Execution_State") || "Execution State"}:</strong> {selectedLogDetails.execution_state || "-"}</p>
                        <p style={{ marginBottom: "6px" }}><strong>{t("Assumption_State") || "Assumption State"}:</strong> {selectedLogDetails.assumption_state || "-"}</p>
                        <p style={{ marginBottom: "6px" }}><strong>{t("Justification") || "Justification"}:</strong> {selectedLogDetails.justification || "-"}</p>
                        <button
                            className="btn-edit"
                            style={{ padding: "4px 10px", fontSize: "12px", marginTop: "6px" }}
                            onClick={() => setSelectedLogDetails(null)}
                        >
                            {t("Close") || "Close"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetails;