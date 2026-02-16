import React from "react";
import {
  Pencil,
  Trash2,
  Users,
  Edit2,
  Eye,
  AlertTriangle,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Rocket,
  Bolt,
  Lightbulb,
  Heart,
  Shield,
  Boxes,
  Clock,
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

// Helper to get strategic signal
const getStrategicSignal = (project) => {
  const impact = project.impact;
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
  isDark,
  isArchived,
  isAdmin,
  isSelected,
  onToggleSelection
}) => {
  const { t } = useTranslation();

  const { impact, theme } = getStrategicSignal(project);

  // Determine if user can edit this project
  const userCanEdit = canEditProject ? canEditProject(project) : true;

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

  const getThemeIcon = (themeName) => {
    switch (themeName) {
      case "Growth": return <Rocket size={14} />;
      case "Efficiency": return <Bolt size={14} />;
      case "Innovation": return <Lightbulb size={14} />;
      case "CustomerExperience": return <Heart size={14} />;
      case "RiskMitigation": return <Shield size={14} />;
      case "Platform": return <Boxes size={14} />;
      default: return <Target size={14} />;
    }
  };

  return (
    <div className={`project-card ${project.status === "Killed" ? "killed" : ""} ${(project.status?.toLowerCase() === "launched" ? "draft" : (project.status?.toLowerCase().replace(" ", "-") || "draft"))}-border`}>
      <div className="project-header">
        <div className="project-header-content">
          {isAdmin && !isArchived && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(project._id)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '25px',
                height: '20px',
                cursor: 'pointer',
                accentColor: '#9333ea',
                flexShrink: 0
              }}
            />
          )}

          {rankMap && rankMap[String(project._id)] !== null && rankMap[String(project._id)] !== undefined && (
            <div className="project-rank-badge">
              Rank {rankMap[String(project._id)]}
            </div>
          )}

          <h3 className="project-title" style={{ marginBottom: 0 }}>
            {project.project_name}
          </h3>
        </div>
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
              {(launched && !userCanEdit) || isViewer || isArchived ? (
                <div onClick={() => onView(project)} className="menu-item"><Eye size={14} /> {t("view")}</div>
              ) : (
                <div onClick={() => onEdit(project)} className="menu-item"><Edit2 size={14} /> {t("edit")}</div>
              )}
              {!projectCreationLocked && !isViewer && !isArchived && (
                <div onClick={() => onDelete(project._id)} className="menu-item delete"><Trash2 size={14} /> {t("delete")}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="project-last-edited" style={{ marginBottom: "8px", fontSize: "12px" }}>
        {t("Project_Description")}: <span className="project-last-edited-name" style={{ color: "#475569" }}>{project.description ? project.description : "None"}</span>
      </p>

      {/* Grid for Impact, Effort, Risk */}
      <div className="card-grid-details">
        <div>
          <span className="details-label">{t("Impact")}</span>
          <span className={`property-badge impact-${project.impact?.toLowerCase() || 'low'}`}>
            <Zap size={10} /> {project.impact || 'None'}
          </span>
        </div>
        <div>
          <span className="details-label">{t("Effort")}</span>
          <span className={`property-badge effort-${project.selected_effort?.toLowerCase() || 'medium'}`}>
            <Clock size={10} /> {project.selected_effort || 'Medium'}
          </span>
        </div>
        <div>
          <span className="details-label">{t("Risk")}</span>
          <span className={`property-badge risk-${project.selected_risk?.toLowerCase() || 'low'}`}>
            <AlertTriangle size={10} /> {project.selected_risk || 'Low'}
          </span>
        </div>
        <div>
          <span className="details-label">{t("Owner")}</span>
          <span className="project-last-edited-name" style={{ fontSize: "12px", fontWeight: "600" }}>
            {project.accountable_owner || project.created_by || t("Unassigned")}
          </span>
        </div>
      </div>

      {/* Strategic Decision / Bet */}
      {project.strategic_decision && (
        <div className="strategic-bet-container">
          <span className="strategic-bet-label">{t("Strategic Bet")}</span>
          <div className="strategic-bet-text">"{project.strategic_decision}"</div>
        </div>
      )}

      {/* Footer Info */}
      <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="status-badge">
          {project.status?.toLowerCase() === "launched" ? t("Draft") : (project.status && t(project.status) !== project.status ? t(project.status) : (project.status || t("Draft")))}
        </span>
        <div className="project-card-footer" style={{ borderTop: "none", fontSize: "10px", color: "#94a3b8" }}>
          {t("Created")} {new Date(project.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;