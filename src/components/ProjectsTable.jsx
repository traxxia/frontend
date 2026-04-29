import React from "react";
import { ChevronDown, Info, AlertTriangle, Clock, Eye, Edit2, Trash2, CheckCircle } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/ProjectsTable.css";

const ProjectsTable = ({
  projects,
  rankMap,
  onEdit,
  onView,
  onDelete,
  onPerformReview,
  onAdhocUpdate,
  showMenuId,
  setShowMenuId,
  selectedProjectIds = [],
  onToggleSelection,
  isAdmin,
  isArchived,
  isViewer,
  canReviewProject,
  myUserId,
}) => {
  const { t } = useTranslation();

  const getStatusBadgeClass = (status) => {
    const s = (status || "Draft").toLowerCase().trim();
    if (s === "active") return "badge-active";
    if (s === "killed") return "badge-killed";
    if (s === "paused") return "badge-paused";
    if (s === "completed") return "badge-completed";
    if (s === "scaled") return "badge-scaled";
    return "badge-draft";
  };

  const getLearningBadgeClass = (state) => {
    const s = (state || "Testing").toLowerCase().trim();
    if (s === "testing") return "badge-testing";
    if (s === "invalidated") return "badge-invalidated";
    if (s === "validated") return "badge-validated";
    return "badge-testing";
  };

  const getAttributePillClass = (attr, value) => {
    const v = (value || "").toLowerCase().trim();
    return `pill-${attr}-${v}`;
  };

  return (
    <div className="projects-table-container">
      <table className="premium-table">
        <thead>
          <tr>
            <th className="col-index">#</th>
            <th className="col-bets">{t("Bets")}</th>
            <th>{t("Status")}</th>
            <th>{t("Learning State")}</th>
            <th>
              {t("Score")} <Info size={12} className="score-info-icon" />
            </th>
            <th>{t("Impact")}</th>
            <th>{t("Effort")}</th>
            <th>{t("Risk")}</th>
            <th>{t("Owner")}</th>
            <th className="text-end">{t("Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => {
            const displayRank = rankMap?.[String(project?._id)] ?? project.rank ?? project.ai_rank ?? (index + 1);
            const userCanReview = canReviewProject ? canReviewProject(project, isAdmin, myUserId, isArchived) : false;
            const statusLower = project.status?.toLowerCase();
            const isTerminal = ["completed", "scaled", "killed"].includes(statusLower);

            return (
              <tr key={project._id}>
                <td className="col-index">
                  <div className="index-badge">{displayRank}</div>
                </td>
                <td className="col-bets">
                  <div className="d-flex align-items-center gap-2">
                    {isAdmin && !isArchived && !isTerminal && (
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(project._id)}
                        onChange={() => onToggleSelection(project._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <span>{project.project_name}</span>
                  </div>
                </td>
                <td>
                  <span className={`table-badge ${getStatusBadgeClass(project.status)}`}>
                    {project.status ? t(project.status) : t("Draft")}
                  </span>
                </td>
                <td>
                  <span className={`table-badge ${getLearningBadgeClass(project.learning_state)}`}>
                    {project.learning_state ? t(project.learning_state) : t("Testing")}
                  </span>
                </td>
                <td className="col-score">
                   {/* Fallback to 0.0 if no score is available, or use ai_score if present */}
                  {project.ai_score ? (project.ai_score * 10).toFixed(1) : (project.score ? (project.score * 10).toFixed(1) : "0.0")}
                </td>
                <td>
                  <span className={`pill-attribute ${getAttributePillClass("impact", project.impact)}`}>
                    {project.impact ? t(project.impact) : t("Low")}
                  </span>
                </td>
                <td>
                  <span className={`pill-attribute ${getAttributePillClass("effort", project.effort)}`}>
                    {project.effort ? t(project.effort) : t("Medium")}
                  </span>
                </td>
                <td>
                  <span className={`pill-attribute ${getAttributePillClass("risk", project.risk)}`}>
                    {project.risk ? t(project.risk) : t("Low")}
                  </span>
                </td>
                <td className="col-owner">
                  {project.accountable_owner || project.created_by || t("Unassigned")}
                </td>
                <td className="text-end">
                  <div className="project-menu-container d-inline-block">
                    <button
                      className="actions-dropdown-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenuId(showMenuId === project._id ? null : project._id);
                      }}
                    >
                      {t("Actions")} <ChevronDown size={14} />
                    </button>
                    {showMenuId === project._id && (
                      <div className="menu-dropdown" style={{ right: 0, top: '100%' }}>
                        {isTerminal ? (
                          <div onClick={() => onView(project)} className="menu-item"><Eye size={14} /> {t("view")}</div>
                        ) : (!isAdmin && isViewer || isArchived) ? (
                          <div onClick={() => onView(project)} className="menu-item"><Eye size={14} /> {t("view")}</div>
                        ) : (
                          <div onClick={() => onEdit(project)} className="menu-item"><Edit2 size={14} /> {t("edit")}</div>
                        )}
                        {!isViewer && !isArchived && isAdmin && !isTerminal && (
                          <div onClick={() => onDelete(project._id)} className="menu-item delete"><Trash2 size={14} /> {t("delete")}</div>
                        )}
                        {userCanReview && !isArchived && !isTerminal && (
                          <>
                            <div onClick={() => onPerformReview(project)} className="menu-item"><CheckCircle size={14} /> {t("Perform_Review")}</div>
                            <div onClick={() => onAdhocUpdate(project)} className="menu-item"><Edit2 size={14} /> {t("Ad_Hoc_Update")}</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsTable;
