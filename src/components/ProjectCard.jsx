import React from "react";
import { Trash2, Edit2, Eye, AlertTriangle, Target, Zap, CheckCircle, XCircle, PauseCircle, PlayCircle, Rocket, Bolt, Lightbulb, Heart, Shield, Boxes, Clock } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { getUserLimits } from "../utils/authUtils";
const getStrategicSignal = project => {
  const impact = project.impact;
  const theme = project.strategic_theme || "None";
  return {
    impact,
    theme
  };
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
  onToggleSelection,
  onPerformReview,
  onAdhocUpdate,
  canReviewProject,
  myUserId
}) => {
  const {
    t
  } = useTranslation();
  const userCanEdit = canEditProject ? canEditProject(project) : true;
  const userCanReview = canReviewProject ? canReviewProject(project, isAdmin, myUserId, isArchived) : false;
  const statusLower = project.status?.toLowerCase();
  const isTerminal = ["completed", "scaled", "killed"].includes(statusLower);
  const statusClass = (() => {
    const status = project.status?.toLowerCase()?.trim();
    const statusMap = {
      "draft": "draft",
      "active": "active",
      "at risk": "at-risk",
      "paused": "paused",
      "killed": "killed",
      "completed": "completed",
      "scaled": "scaled"
    };
    if (status && statusMap[status]) {
      return statusMap[status];
    }
    if (!status && project.launch_status === "launched") {
      return "active";
    }
    return "draft";
  })();
  return <div className={`project-card-premium ${statusClass}-border`}>
      {}
      <div className="card-header-premium">
        <div className="card-title-container-premium">
          {isAdmin && !isArchived && getUserLimits().project && !["completed", "scaled", "killed"].includes(project.status?.toLowerCase()) && project.launch_status !== 'launched' && <input type="checkbox" checked={isSelected} onChange={() => onToggleSelection(project._id)} onClick={e => e.stopPropagation()} className="project-card--s1" />}

          {(() => {
          const displayRank = rankMap?.[String(project?._id)] ?? project.rank ?? project.ai_rank;
          if (displayRank === null || displayRank === undefined || isViewer) return null;
          return <div className="card-rank-badge-premium">
                #{displayRank}
              </div>;
        })()}

          <h3 className="card-title-premium" title={project.project_name}>
            {project.project_name}
          </h3>

          {}
          {userCanReview && project.launch_status === 'launched' && !isTerminal && (project.is_stale || project.next_review_date && new Date(project.next_review_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) ? <span className="footer-status-premium project-card--s2" onClick={e => {
          e.stopPropagation();
          onPerformReview(project);
        }}>
              <AlertTriangle size={10} /> {t("Stale")}
            </span> : project.next_review_date && (() => {
          const nextDate = new Date(project.next_review_date);
          nextDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffDays = Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 3) {
            return <span className="footer-status-premium project-card--s3" onClick={e => {
              e.stopPropagation();
              onPerformReview(project);
            }}>
                      <Clock size={10} /> {t("Due")}
                    </span>;
          }
          return null;
        })())}
        </div>

        <div className="project-menu-container">
          <button className="menu-button" onClick={e => {
          e.stopPropagation();
          setShowMenuId && setShowMenuId(showMenuId === project._id ? null : project._id);
        }}>
            ⋮
          </button>
          {showMenuId === project._id && <div className="menu-dropdown">
              {isTerminal ? <div onClick={() => onView(project)} className="menu-item"><Eye size={14} /> {t("view")}</div> : !userCanEdit || isViewer || isArchived ? <div onClick={() => onView(project)} className="menu-item"><Eye size={14} /> {t("view")}</div> : <div onClick={() => onEdit(project)} className="menu-item"><Edit2 size={14} /> {t("edit")}</div>}
              {!isViewer && !isArchived && isAdmin && (!projectCreationLocked || project.status?.toLowerCase() === "draft" || !project.status) && !isTerminal && <div onClick={() => onDelete(project._id)} className="menu-item delete"><Trash2 size={14} /> {t("delete")}</div>}
              {userCanReview && !isArchived && !['completed', 'scaled', 'killed'].includes(project.status?.toLowerCase()) && <>
                  <div onClick={() => onPerformReview(project)} className="menu-item"><CheckCircle size={14} /> {t("Perform_Review")}</div>
                  <div onClick={() => onAdhocUpdate(project)} className="menu-item"><Edit2 size={14} /> {t("Ad_Hoc_Update")}</div>
                </>}
            </div>}
        </div>
      </div>

      {}
      <p className="card-description-premium">
        {project.description ? project.description : t("No description provided.")}
      </p>

      {}
      <div className="attribute-row-premium">
        <div className="attribute-item-premium">
          <span className="attribute-label-premium">{t("Impact")}</span>
          <div className="attribute-value-premium">
            <Zap size={12} />
            <span className={`badge-minimal impact-${project.impact?.toLowerCase() || 'low'}-min`}>
              {project.impact ? t(project.impact) : t("None")}
            </span>
          </div>
        </div>
        <div className="attribute-item-premium">
          <span className="attribute-label-premium">{t("Effort")}</span>
          <div className="attribute-value-premium">
            <Clock size={12} />
            <span className={`badge-minimal effort-${project.effort?.toLowerCase() || 'medium'}-min`}>
              {project.effort ? t(project.effort) : t("N/A")}
            </span>
          </div>
        </div>
        <div className="attribute-item-premium">
          <span className="attribute-label-premium">{t("Risk")}</span>
          <div className="attribute-value-premium">
            <AlertTriangle size={12} />
            <span className={`badge-minimal risk-${project.risk?.toLowerCase() || 'low'}-min`}>
              {project.risk ? t(project.risk) : t("N/A")}
            </span>
          </div>
        </div>
        <div className="attribute-item-premium">
          <span className="attribute-label-premium">{t("Owner")}</span>
          <div className="attribute-value-premium">
            <Target size={12} />
            <span className="project-card--s4">
              {project.accountable_owner || project.created_by || t("Unassigned")}
            </span>
          </div>
        </div>
      </div>

      {}
      <div className="card-footer-premium">
        <span className={`status-badge status-${(project.status || "Draft").toLowerCase().replace(" ", "-")} project-card--s5`}>
          {project.status && t(project.status) !== project.status ? t(project.status) : project.status || t("Draft")}
        </span>
        <div className="footer-date-premium">
          <Clock size={10} />
          {new Date(project.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>;
};
export default ProjectCard;
