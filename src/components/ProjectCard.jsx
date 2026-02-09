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
  HelpCircle,
  Clock
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

// Helper to get strategic signal
const getStrategicSignal = (project) => {
  const impact = project.impact;
  const theme = project.strategic_theme || "None";

  // Normalize status for display
  const rawStatus = (project.status || "Draft").toLowerCase();
  let status = "Draft";
  if (rawStatus === "active" || rawStatus === "launched") status = "Active";
  else if (rawStatus === "at risk" || rawStatus === "at-risk") status = "At Risk";
  else if (rawStatus === "paused") status = "Paused";
  else if (rawStatus === "killed") status = "Killed";
  else if (rawStatus === "scaled") status = "Scaled";
  else if (rawStatus === "prioritizing" || rawStatus === "prioritized" || rawStatus === "draft") status = "Draft";
  else status = "Draft";

  return { impact, theme, normalizedStatus: status };
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
  showMenuId,
  setShowMenuId,
}) => {
  const { t } = useTranslation();

  const { impact, theme, normalizedStatus } = getStrategicSignal(project);

  // Determine if user can edit this project
  const userCanEdit = canEditProject ? canEditProject(project) : true;

  return (
    <div className={`project-card-v2 status-${normalizedStatus.toLowerCase().replace(" ", "-")}`}>
      {finalizeCompleted && (
        <div className="project-rank-badge">
          {rankMap[String(project._id)] ?? index + 1}
        </div>
      )}

      <div className="project-card-header">
        <div className="project-title-section">
          <h3 className="project-name-v2">
            {project.project_name}
          </h3>
          <p className="project-owner-v2">
            {t("Owner")}: <span>{project.accountable_owner || project.created_by || t("Unassigned")}</span>
          </p>
        </div>

        <div className="project-status-and-menu">
          <div className={`status-tag status-${normalizedStatus.toLowerCase().replace(" ", "-")}`}>
            {t(normalizedStatus)}
          </div>

          <div className="project-menu-wrapper">
            <button
              className="project-menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenuId && setShowMenuId(showMenuId === project._id ? null : project._id);
              }}
            >
              <span className="dots-icon">⋮</span>
            </button>

            {showMenuId === project._id && (
              <div className="project-dropdown-menu">
                {(launched && !userCanEdit) || isViewer ? (
                  <div onClick={() => onView(project)} className="dropdown-item-v2">
                    <Eye size={14} /> {t("view")}
                  </div>
                ) : (
                  <div onClick={() => onEdit(project)} className="dropdown-item-v2">
                    <Edit2 size={14} /> {t("edit")}
                  </div>
                )}
                {!projectCreationLocked && !isViewer && (
                  <div onClick={() => onDelete(project._id)} className="dropdown-item-v2 delete-v2">
                    <Trash2 size={14} /> {t("delete")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="project-card-body">
        <p className="project-desc-v2">
          {project.description || t("No_description_provided")}
        </p>
      </div>

      <div className="project-card-footer-v2">
        <div className="project-learning-state">
          {project.learning_state && (
            <span className={`learning-pill ${project.learning_state.toLowerCase()}`}>
              {project.learning_state === "Validated" && <CheckCircle size={12} />}
              {project.learning_state === "Disproven" && <XCircle size={12} />}
              {project.learning_state === "Testing" && <HelpCircle size={12} />}
              {t(project.learning_state)}
            </span>
          )}
          {project.strategic_theme && (
            <span className="theme-pill">
              <Target size={12} />
              {t(project.strategic_theme)}
            </span>
          )}
        </div>
        <div className="project-meta-pills">
          <span className={`impact-pill impact-${impact?.toLowerCase() || 'none'}`}>
            <Zap size={12} />
            {impact ? t(impact) : t("No_Impact")}
          </span>
          {project.last_reviewed ? (
            <span className="date-pill reviewed" title={t("Last Reviewed")}>
              <Clock size={12} />
              {new Date(project.last_reviewed).toLocaleDateString()}
            </span>
          ) : (
            <span className="date-pill">
              {new Date(project.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;