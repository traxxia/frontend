import React from "react";
import {
  Pencil,
  Trash2,
  Users,
  Edit2,
  AlertTriangle,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

// Helper to get strategic signal
const getStrategicSignal = (project) => {
  const impact = project.impact || "Low";
  const theme = project.strategic_theme || "None";
  return { impact, theme };
};

const ProjectCard = ({
  project,
  index,
  rankMap,
  finalizeCompleted,
  launched,
  isViewer,
  isEditor,
  isDraft,
  projectCreationLocked,
  canEditProject,
  onEdit,
  onView,
  onDelete,
  onManageTeam,
  showMenuId,
  setShowMenuId,
  isDark
}) => {
  const { t } = useTranslation();

  // Stale Logic (V2)
  const lastReviewed = project.last_reviewed ? new Date(project.last_reviewed) : new Date(project.created_at || Date.now());
  const daysSince = Math.floor((new Date() - lastReviewed) / (1000 * 60 * 60 * 24));
  const cadenceDays = project.review_cadence === "Quarterly" ? 90 : project.review_cadence === "Milestone" ? 180 : 30; // Default Monthly
  const isStale = daysSince > cadenceDays;
  const { impact, theme } = getStrategicSignal(project);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <PlayCircle size={14} color="green" />;
      case 'At Risk': return <AlertTriangle size={14} color="red" />;
      case 'Paused': return <PauseCircle size={14} color="orange" />;
      case 'Killed': return <XCircle size={14} color="grey" />;
      case 'Scaled': return <CheckCircle size={14} color="purple" />;
      default: return <Edit2 size={14} color="grey" />; // Draft
    }
  };

  return (
    <div className={`project-card ${project.status?.toLowerCase().replace(" ", "-") || "draft"}-border`}>
      {finalizeCompleted && (
        <div className="project-serial-number">
          {rankMap[String(project._id)] ?? index + 1}
        </div>
      )}

      <div className="project-header">
        <h3 className="project-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* {getStatusIcon(project.status)} */}
          {project.project_name}
        </h3>
        <div className="project-menu-container">
          <button
            className="menu-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenuId && setShowMenuId(showMenuId === project._id ? null : project._id);
            }}
          >
            ⋮
          </button>
          {showMenuId === project._id && (
            <div className="menu-dropdown">
              <div onClick={() => onEdit(project)} className="menu-item"><Edit2 size={14} /> {t("edit")}</div>
              {/* <div onClick={() => onManageTeam(project)} className="menu-item"><Users size={14} /> Team</div> */}
              <div onClick={() => onDelete(project._id)} className="menu-item delete"><Trash2 size={14} /> {t("delete")}</div>
            </div>
          )}
        </div>
      </div>

      <p className="project-last-edited" style={{ marginBottom: "8px" }}>
        {t("Project_Description")}: <span className="project-last-edited-name">{project.description ? project.description : "None"}</span>
      </p>
      <p className="project-last-edited" style={{ marginBottom: "8px" }}>
        {t("Owner")}: <span className="project-last-edited-name">{project.accountable_owner || project.created_by || t("Unassigned")}</span>
      </p>

      {/* Strategic V2 Info */}
      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "12px", fontSize: "12px" }}>

        {/* Row 1: Status & Learning State */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
          <span className="status-badge">
            {project.status && t(project.status) !== project.status ? t(project.status) : (project.status || t("Draft"))}
          </span>
          {/* <span style={{ color: "#6b7280" }}>
            {t("State")}: <strong style={{ color: "#374151" }}>{project.learning_state ? t(project.learning_state) : t("Testing")}</strong>
          </span> */}
          <span title={t("Impact")} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={12} color={impact === 'High' ? 'orange' : '#9ca3af'} /> {impact} {t("Impact")}
          </span>
        </div>

        {/* Row 3: Stale/Review Warning */}
        {isStale ? (
          <div style={{ color: "#ef4444", fontWeight: "600", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertTriangle size={12} /> {t("Needs_Review")} ({daysSince} {t("days_ago")})
          </div>
        ) : (
          <div style={{ color: "#10b981", marginTop: "8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle size={12} /> {t("Reviewed_ago")} {daysSince} {t("days_ago")}
          </div>
        )}

      </div>

      {/* Footer / Actions - Keeping minimal as main actions are in menu now. Or we can restore the buttons if needed. 
          For clean V2 look, menu is better. 
      */}
      <div className="project-card-footer" style={{ marginTop: "auto", fontSize: "11px", color: "#9ca3af" }}>
        {t("Created")} {new Date(project.created_at).toLocaleDateString()}
      </div>

    </div>
  );
};

export default ProjectCard;