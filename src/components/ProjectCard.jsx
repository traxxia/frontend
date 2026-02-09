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
  PlayCircle
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
  showMenuId,
  setShowMenuId,
}) => {
  const { t } = useTranslation();

  const { impact } = getStrategicSignal(project);

  // Determine if user can edit this project
  const userCanEdit = canEditProject ? canEditProject(project) : true;

  return (
    <div className={`project-card-v2 status-${project.status?.toLowerCase().replace(" ", "-") || "draft"}`}>
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

      <div className="project-card-body">
        <p className="project-desc-v2">
          {project.description || t("No description provided")}
        </p>
      </div>

      <div className="project-card-footer-v2">
        <div className="project-meta-pills">
          <span className={`impact-pill impact-${impact?.toLowerCase() || 'none'}`}>
            <Zap size={12} />
            {impact ? t(impact) : t("No Impact")}
          </span>
          <span className="date-pill">
            {new Date(project.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;