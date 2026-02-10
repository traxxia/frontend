import React from "react";
import {
  Pencil,
  Trash2,
  Users,
  Edit2,
  Eye,
  AlertTriangle,
  TrendingUp,
  Zap,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  HelpCircle,
  Clock,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

// Helper to get strategic signal
const getStrategicSignal = (project) => {
  const impact = project.impact;
  const theme = project.strategic_theme || "None";

  // Valid project statuses only
  const validProjectStatuses = ["draft", "active", "at risk", "at-risk", "paused", "killed", "scaled"];
  const rawStatus = (project.status || "").toLowerCase();

  // Check if status is valid, otherwise default to Draft
  let status = "Draft";
  if (validProjectStatuses.includes(rawStatus)) {
    if (rawStatus === "active") status = "Active";
    else if (rawStatus === "at risk" || rawStatus === "at-risk") status = "At Risk";
    else if (rawStatus === "paused") status = "Paused";
    else if (rawStatus === "killed") status = "Killed";
    else if (rawStatus === "scaled") status = "Scaled";
    else if (rawStatus === "draft") status = "Draft";
  }

  return { impact, theme, normalizedStatus: status };
};

// Helper for relative time (e.g., "2 weeks ago")
const getRelativeTime = (date, t) => {
  if (!date) return null;
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now - past;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 1) return t("today");
  if (diffInDays === 1) return t("yesterday");
  if (diffInDays < 7) return `${diffInDays} ${t("days_ago")}`;

  const weeks = Math.floor(diffInDays / 7);
  if (weeks === 1) return `1 ${t("week_ago")}`;
  return `${weeks} ${t("weeks_ago")}`;
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

      <div className="project-card-header-new">
        <div className="project-title-row">
          <h3 className="project-name-v2">
            {rankMap[String(project._id)] && (
              <span className="project-rank-inline">{rankMap[String(project._id)]}</span>
            )}
            {project.project_name}
          </h3>

          <div className="project-menu-wrapper-v2">
            <button
              className="project-menu-btn-v2"
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

        <div className="project-subheader-row">
          <span className="project-owner-name">Owner :&nbsp; 
            {project.accountable_owner || project.created_by || t("Unassigned")}
          </span> 
        </div>

        <div className="project-subheader-row"> 
          {project.learning_state && (
            <span className={`learning-pill-v2 ${project.learning_state.toLowerCase()}`}>
              {project.learning_state === "Validated" && <CheckCircle size={12} />}
              {project.learning_state === "Disproven" && <XCircle size={12} />}
              {project.learning_state === "Testing" && <HelpCircle size={12} />}
              {t(project.learning_state)}
            </span>
          )}

          <div className={`status-pill-v2 status-${normalizedStatus.toLowerCase().replace(" ", "-")}`}>
            {t(normalizedStatus)}
          </div>

          <div className={`impact-pill-new impact-${impact?.toLowerCase() || 'none'}`}>
            {impact === 'High' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {impact ? t(impact) : t("No_Impact")}
          </div>

        </div>

        <div className="project-reviewed-row">
          <span className="reviewed-text">
            {t("Last_Reviewed")}: <strong>{getRelativeTime(project.last_reviewed || project.updated_at, t)}</strong>
          </span>
        </div>
      </div>

      <div className="project-card-body-new">
        <p className="project-desc-v2">
          {project.description || t("No_description_provided")}
        </p>

        {project.key_assumptions && project.key_assumptions.length > 0 && (
          <div className="project-assumptions-preview">
            <h4 className="assumptions-title">{t("Key_Assumptions")}:</h4>
            <ul className="assumptions-bullets">
              {project.key_assumptions.slice(0, 3).map((a, i) => a && (
                <li key={i}>{a}</li>
              ))}
              {project.key_assumptions.length > 3 && (
                <li className="more-assumptions">
                  + {project.key_assumptions.length - 3} {t("more")}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
