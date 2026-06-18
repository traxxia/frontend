import React, { useState, useEffect, useMemo } from "react";
import { Breadcrumb } from "react-bootstrap";
import { useTranslation } from "../hooks/useTranslation";
import { ChevronLeft, Circle, Diamond, Rocket, Bolt, Lightbulb, Heart, Shield, Boxes, Clock, ArrowLeft, Edit3, AlertTriangle, XCircle, CheckCircle, Edit2, Info, Zap, TrendingUp, Lock, DollarSign } from "lucide-react";
import "../styles/ProjectDetails.css";
const getImpactIcon = impact => {
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
const getEffortIcon = effort => {
  const normalizedEffort = !effort ? "" : effort.charAt(0).toUpperCase() + effort.slice(1).toLowerCase();
  switch (normalizedEffort) {
    case "Small":
      return <Diamond size={14} fill="black" color="black" />;
    case "Medium":
      return <div className="project-details--s1">
                    <Diamond size={14} fill="black" color="black" />
                    <Diamond size={14} fill="black" color="black" />
                </div>;
    case "Large":
      return <div className="project-details--s1">
                    <Diamond size={14} fill="black" color="black" />
                    <Diamond size={14} fill="black" color="black" />
                    <Diamond size={14} fill="black" color="black" />
                </div>;
    default:
      return null;
  }
};
const getRiskIcon = risk => {
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
const getThemeIcon = theme => {
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
  sNo,
  onBack,
  onEdit,
  onPerformReview,
  onAdhocUpdate,
  canEdit = false,
  canReview = false
}) => {
  const {
    t
  } = useTranslation();
  const breadcrumbRef = React.useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (breadcrumbRef.current) {
        breadcrumbRef.current.scrollIntoView({
          behavior: 'auto',
          block: 'start'
        });
      }
      window.scrollTo(0, 0);
      const parent = document.querySelector('.info-panel-content');
      if (parent) {
        parent.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  const isPendingReview = React.useMemo(() => {
    if (!project || !project.next_review_date) return false;
    const statusLower = (project?.status || "").toLowerCase();
    if (["completed", "scaled", "killed"].includes(statusLower)) return false;
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
    if (!isTerminal) return {
      isTerminal: false
    };
    let message = "Project reached a final state cannot be edited further.";
    if (statusLower === "completed") message = "Project reached Completed state cannot be edited further.";else if (statusLower === "scaled") message = "Project reached Scaled state cannot be edited further.";else if (statusLower === "killed") message = "Project reached Killed state cannot be edited further.";
    const latestTerminalLog = project?.decision_log && [...project.decision_log].reverse().find(log => (log.to_status || "").toLowerCase() === statusLower);
    return {
      isTerminal,
      message,
      justification: latestTerminalLog?.justification
    };
  }, [project]);
  if (!project) {
    return <div className="project-details-container">
                <div className="no-project-message">
                    <p>{t("No_project_data")}</p>
                    <button className="btn-back" onClick={onBack}>
                        <ArrowLeft size={16} /> {t("Back_to_Projects")}
                    </button>
                </div>
            </div>;
  }
  return <div className="project-details-container">
      <div className="project-custom-header-wrapper" ref={breadcrumbRef}>
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2">
          <button type="button" className="d-flex align-items-center gap-2" onClick={onBack} style={{ border: '1px solid #0c71b9', color: '#0c71b9', fontSize: '13px', fontWeight: '600', padding: '6px 14px', borderRadius: '8px', backgroundColor: '#ffffff', cursor: 'pointer' }}>
            <ChevronLeft size={14} strokeWidth={2.5} /> Back to Bets
          </button>
          
          {(() => {
            const getBadgeStyle = (status) => {
              const s = (status || "draft").toLowerCase();
              switch (s) {
                case "active": return { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" };
                case "at risk":
                case "at_risk": return { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" };
                case "paused": return { bg: "#fef3c7", text: "#b45309", border: "#fde68a" };
                case "killed": return { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" };
                case "completed": return { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" };
                case "scaled": return { bg: "#f3e8ff", text: "#7e22ce", border: "#e9d5ff" };
                default: return { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" };
              }
            };
            const initialStatusLower = (project.status || "draft").toLowerCase();
            const badgeStyle = getBadgeStyle(initialStatusLower);
            return (
              <div className="d-flex align-items-center gap-2">
                <div style={{ border: `1px solid ${badgeStyle.border}`, color: badgeStyle.text, fontSize: '12px', fontWeight: '700', padding: '6px 12px', borderRadius: '4px', backgroundColor: badgeStyle.bg, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}>
                  {initialStatusLower || "draft"}
                </div>
                {canEdit && !["completed", "scaled", "killed"].includes(initialStatusLower) && (
                  <button type="button" className="btn-edit d-flex align-items-center gap-2" onClick={() => onEdit(project)} style={{ backgroundColor: '#0c71b9', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', padding: '6px 16px', cursor: 'pointer' }}>
                    <Edit2 size={14} strokeWidth={2.5} /> {t("Edit")}
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        <div className="project-custom-header">
          <div className="project-custom-header-top">
            <span className="project-custom-header-bet">BET {sNo ? `#${sNo}` : '#NEW'}</span>
          </div>
          <div className="project-custom-header-title-row">
            <h1 className="project-custom-header-title">{project.project_name || "New Bet"}</h1>
          </div>
          <div className="project-custom-header-meta">
            <div className="meta-item">
              <span className="meta-label">DECIDER</span>
              <span className="meta-value text-dark fw-bold">{project.accountable_owner || project.created_by || "Not assigned"}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">CADENCE</span>
              <span className="meta-value text-dark fw-bold">{project.review_cadence || "Not set"}</span>
            </div>
          </div>
        </div>

        <hr className="my-4" style={{ borderColor: '#e2e8f0', opacity: 1 }} />
      </div>

            {}
            <div className="form-card">
                <h3 className="section-title">{t("Required_Information")}</h3>

                {}
                <div className="field-row">
                    <div className="field-label-row">
                        <label className="field-label">
                            {t("Project_Name")}
                        </label>
                    </div>
                    <div className="detail-value-display project-details--s9">
                        {project.project_name}
                    </div>
                </div>

                {}
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

            {}
            <div className="form-card">
                <h3 className="section-title">{t("Strategic_Core")}</h3>

                {}
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

                {}
                <div className="field-row">
                    <div className="field-label-row">
                        <label className="field-label">
                            {t("Key_Assumptions_Tested")}
                        </label>
                    </div>
                    {project.key_assumptions && project.key_assumptions.length > 0 ? <div className="project-details--s10">
                            {project.key_assumptions.filter(a => a).map((assumption, idx) => <div key={idx} className="detail-value-display project-details--s11">
                                    {assumption}
                                </div>)}
                        </div> : <div className="detail-value-display">{t("Not_Available")}</div>}
                </div>

                {}
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

                {}
                <div className="grid-3 project-details--s12">
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

                {}
                <div className="grid-2">
                    <div className="field-row">
                        <div className="field-label-row">
                            <label className="field-label">
                                <Clock size={16} /> {t("Next_Review_Date")}
                            </label>
                        </div>
                        <div className="detail-value-display project-details--s13">
                            <span style={{
              color: !terminalStatusInfo.isTerminal && (project.is_stale || project.next_review_date && new Date(project.next_review_date).getTime() < new Date().setHours(0, 0, 0, 0)) ? '#ef4444' : isPendingReview && !terminalStatusInfo.isTerminal ? '#d97706' : 'inherit'
            }} className="project-details--s6">
                                {project.next_review_date ? new Date(project.next_review_date).toLocaleDateString() : t("Not_Available")}
                            </span>
                            {!terminalStatusInfo.isTerminal && (project.is_stale || project.next_review_date && new Date(project.next_review_date).getTime() < new Date().setHours(0, 0, 0, 0) ? <span className="review-badge stale">
                                    <AlertTriangle size={12} /> {t("Stale")}
                                </span> : isPendingReview && <span className="review-badge due">
                                    <Clock size={12} /> {t("Pending_Review") || "Pending Review"}
                                </span>)}
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

                {}
                {/* <div className="field-row project-details--s14">
                    {canEdit && !["completed", "scaled", "killed"].includes(project.status?.toLowerCase()) && <button className="btn-edit project-details--s15" onClick={() => onEdit(project)}>
                            <Edit2 size={14} /> {t("Edit")}
                        </button>}
                    {canReview && !["completed", "scaled", "killed"].includes(project.status?.toLowerCase()) && <>
                            <button className="btn-review project-details--s16" onClick={() => onPerformReview(project)}>
                                <CheckCircle size={14} /> {t("Perform_Review")}
                            </button>
                            <button className="btn-adhoc project-details--s17" onClick={() => onAdhocUpdate(project)}>
                                <Edit3 size={14} /> {t("Ad_Hoc_Update")}
                            </button>
                        </>}
                </div> */}
            </div>

            {}
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

            {}
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

        </div>;
};
export default ProjectDetails;
