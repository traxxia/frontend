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
    let v = (value || "").toLowerCase().trim();
    if (!v) return "pill-na";
    return `pill-${attr}-${v}`;
  };

  return (
    <div className="projects-table-container">
      <table className="premium-table">
        <thead>
          <tr>
            <th className="col-selection"></th>
            <th className="col-index">#</th>
            <th className="col-bets">{t("Bets")}</th>
            <th>{t("Status")}</th>
            <th>{t("Learning State")}</th>
            <th className="col-score-header">
              <div className="score-header-content">
                {t("Score")}
                <div className="score-info-icon-wrapper">
                  <Info size={12} className="score-info-icon" />
                  <div className="score-formula-tooltip">
                    <div className="tooltip-section">
                      <h4 className="tooltip-title">{t("PRIORITY SCORE FORMULA")}</h4>
                      <p className="tooltip-formula">
                        {t("Priority")} = ({t("Impact")} × 3) - ({t("Effort")} × 2) - ({t("Risk")} × 2)
                      </p>
                      <p className="tooltip-note">
                        {t("where Low = 1, Medium = 2, High / Large = 3")}
                      </p>
                    </div>
                    <div className="tooltip-divider"></div>
                    <div className="tooltip-section">
                      <h4 className="tooltip-title">{t("NORMALIZED TO 0-10")}</h4>
                      <p className="tooltip-formula">
                        {t("score")} = (({t("raw")} + 9) / 14) × 10
                      </p>
                      <p className="tooltip-description">
                        {t("Raw range is [-9, +5]: worst case is -9 (low impact, large effort, high risk); best case is +5 (high impact, small effort, low risk).")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
            const displayRank = rankMap?.[String(project?._id)] ?? project.rank ?? project.ai_rank ?? 0;
            const userCanReview = canReviewProject ? canReviewProject(project, isAdmin, myUserId, isArchived) : false;
            const statusLower = project.status?.toLowerCase();
            const isTerminal = ["completed", "scaled", "killed"].includes(statusLower);

            const isLastTwoRows = index >= projects.length - 2;

            return (
              <tr key={project._id}>
                <td className="col-selection">
                  {isAdmin && !isArchived && !isTerminal && project.launch_status !== 'launched' && (
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(project._id)}
                      onChange={() => onToggleSelection(project._id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </td>
                <td className="col-index">
                  <div className="index-badge">{displayRank}</div>
                </td>
                <td className="col-bets">
                  <span>{project.project_name}</span>
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
                  {/* Use backend-calculated score, or ai_score if present */}
                  {project.score !== undefined ? Number(project.score).toFixed(1) :
                    (project.ai_score ? (Number(project.ai_score) * 10).toFixed(1) : "0.0")}
                </td>
                <td>
                  <span className={`pill-attribute ${getAttributePillClass("impact", project.impact)}`}>
                    {project.impact ? t(project.impact) : "N/A"}
                  </span>
                </td>
                <td>
                  <span className={`pill-attribute ${getAttributePillClass("effort", project.effort)}`}>
                    {project.effort ? t(project.effort) : "N/A"}
                  </span>
                </td>
                <td>
                  <span className={`pill-attribute ${getAttributePillClass("risk", project.risk)}`}>
                    {project.risk ? t(project.risk) : "N/A"}
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
                      <div
                        className="menu-dropdown"
                        style={{
                          right: 0,
                          top: isLastTwoRows ? 'auto' : '100%',
                          bottom: isLastTwoRows ? '100%' : 'auto',
                          marginBottom: isLastTwoRows ? '8px' : '0'
                        }}
                      >
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
