import React from "react";
import { Dropdown, OverlayTrigger } from "react-bootstrap";
import { ChevronDown, ChevronRight, Info, AlertTriangle, Clock, Eye, Edit2, Trash2, CheckCircle } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import ReviewCadencesModal from "./ReviewCadencesModal";
import AssignDeciderModal from "./AssignDeciderModal";
import axios from "axios";
import { useProjectStore, useBusinessStore, useAuthStore } from "../store";
import "../styles/ProjectsTable.css";
const ProjectsTable = ({
  projects,
  rankMap,
  onEdit,
  onView,
  onDelete,
  onPerformReview,
  onAdhocUpdate,
  onDirectUpdate,
  showMenuId,
  setShowMenuId,
  selectedProjectIds = [],
  onToggleSelection,
  isAdmin,
  isArchived,
  isViewer,
  canReviewProject,
  canEditProject,
  myUserId
}) => {
  const userName = useAuthStore(state => state.userName);
  const {
    t
  } = useTranslation();

  const selectedBusinessId = useBusinessStore(state => state.selectedBusinessId);
  const [showCadencesModal, setShowCadencesModal] = React.useState(false);
  const [cadenceProject, setCadenceProject] = React.useState(null);

  const [showDeciderModal, setShowDeciderModal] = React.useState(false);
  const [deciderProject, setDeciderProject] = React.useState(null);

  const [activeCadences, setActiveCadences] = React.useState(null);

  React.useEffect(() => {
    if (!selectedBusinessId) return;
    const fetchCadences = async () => {
      try {
        const token = useAuthStore.getState().token;
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/cadences?business_id=${selectedBusinessId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const active = (res.data || []).filter(c => c.scheduleDates && c.scheduleDates.some(m => !m.closed));
        const activeNames = active.map(c => c.name);
        setActiveCadences(activeNames);
      } catch (err) {
        console.error("Failed to fetch cadences in ProjectsTable:", err);
      }
    };
    fetchCadences();
  }, [selectedBusinessId]);

  const handleOpenCadences = (e, project) => {
    e.stopPropagation();
    setCadenceProject(project);
    setShowCadencesModal(true);
  };

  const handleOpenDecider = (e, project) => {
    e.stopPropagation();
    setDeciderProject(project);
    setShowDeciderModal(true);
  };

  const handleSaveCadences = async (project, cadencesString) => {
    if (onDirectUpdate) {
      await onDirectUpdate(project._id, { review_cadence: cadencesString, cadence: cadencesString });
    }
    setShowCadencesModal(false);
  };

  const handleSaveDecider = async (project, ownerId, ownerName) => {
    if (onDirectUpdate) {
      await onDirectUpdate(project._id, { accountable_owner_id: ownerId, accountable_owner: ownerName });
    }
    setShowDeciderModal(false);
  };

  const getStatusBadgeClass = status => {
    const s = (status || "Draft").toLowerCase().trim();
    if (s === "active") return "badge-active";
    if (s === "killed") return "badge-killed";
    if (s === "paused") return "badge-paused";
    if (s === "completed") return "badge-completed";
    if (s === "scaled") return "badge-scaled";
    if (s === "at risk" || s === "at_risk") return "badge-at-risk";
    return "badge-draft";
  };
  const getLearningBadgeClass = state => {
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
  return <div className={`projects-table-container ${showMenuId ? 'menu-open' : ''}`}>
    <table className="premium-table">
      <thead>
        <tr>
          <th className="col-index">#</th>
          <th className="col-bets">{t("BET")}</th>
          <th>{t("STATUS")}</th>
          <th>{t("CADENCE")}</th>
          <th>{t("DECIDER")}</th>
          <th>{t("IMPACT")}</th>
          <th>{t("EFFORT")}</th>
          <th>{t("RISK")}</th>
          <th className="text-end">{t("ACTIONS")}</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project, index) => {
          const displayRank = rankMap?.[String(project?._id)] ?? project.rank ?? project.ai_rank;
          const userCanReview = canReviewProject ? canReviewProject(project, isAdmin, myUserId, isArchived) : false;
          const isOwner = String(project.accountable_owner_id) === String(myUserId) ||
                          (project.accountable_owner && userName && String(project.accountable_owner).trim().toLowerCase() === String(userName).trim().toLowerCase());
          const canManageBet = isAdmin || isOwner;
          const isLastTwoRows = projects.length > 2 && index >= projects.length - 2;
          const statusLower = project.status?.toLowerCase();
          const isTerminal = ["completed", "scaled", "killed"].includes(statusLower);
          return <tr key={project._id} className={isLastTwoRows ? "last-two-rows" : ""}>
            <td className="col-index">
              <div className="index-badge">{displayRank ? displayRank : index + 1}</div>
            </td>
            <td className="col-bets">
              <div className="bet-name-wrapper">
                {project.launch_status === 'launched' && !isTerminal && (() => {
                  const isStale = project.is_stale || (project.next_review_date && new Date(project.next_review_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0));

                  if (isStale) {
                    return <span className="footer-status-premium stale-badge" onClick={userCanReview ? e => {
                      e.stopPropagation();
                      onPerformReview(project);
                    } : undefined} style={{ cursor: userCanReview ? 'pointer' : 'default' }}>
                      <AlertTriangle size={10} /> {t("Stale")}
                    </span>;
                  }

                  if (project.next_review_date) {
                    const nextDate = new Date(project.next_review_date);
                    nextDate.setHours(0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diffDays = Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    if (diffDays >= 0 && diffDays <= 3) {
                      return <span className="footer-status-premium due-badge" onClick={userCanReview ? e => {
                        e.stopPropagation();
                        onPerformReview(project);
                      } : undefined} style={{ cursor: userCanReview ? 'pointer' : 'default' }}>
                        <Clock size={10} /> {t("Due")}
                      </span>;
                    }
                  }
                  return null;
                })()}
                <span className="bet-name-text">{project.project_name}</span>
              </div>
            </td>
            <td>
              <span className={`table-badge ${getStatusBadgeClass(project.status)}`}>
                {project.status ? t(project.status) : t("Draft")}
              </span>
            </td>
            <td>
              {project.cadence || project.review_cadence ? (
                <span
                  className="text-dark"
                  style={{ cursor: isAdmin ? 'pointer' : 'default', borderBottom: isAdmin ? '1px dashed #cbd5e1' : 'none', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}
                  onClick={(e) => isAdmin ? handleOpenCadences(e, project) : null}
                >
                  {(() => {
                    const cStr = project.cadence || project.review_cadence;
                    if (!cStr) return "";
                    let parts = cStr.split(",").map(s => s.trim()).filter(s => s);
                    
                    if (activeCadences !== null) {
                      parts = parts.filter(p => activeCadences.includes(p));
                    }
                    
                    if (parts.length === 0) {
                      return isAdmin ? (
                        <span className="text-cadence-blue fw-bold d-inline-flex align-items-center gap-1 text-nowrap" style={{ fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={(e) => isAdmin ? handleOpenCadences(e, project) : null}>
                          + {t("Set cadence")} <ChevronDown size={14} className="text-muted" />
                        </span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '13px' }}>-</span>
                      );
                    }

                    if (parts.length > 1) {
                      return `Multiple (${parts.length})`;
                    }
                    return t(parts[0]);
                  })()}
                </span>
              ) : (
                isAdmin ? (
                  <span className="text-cadence-blue fw-bold d-inline-flex align-items-center gap-1 text-nowrap" style={{ fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={(e) => isAdmin ? handleOpenCadences(e, project) : null}>
                    + {t("Set cadence")} <ChevronDown size={14} className="text-muted" />
                  </span>
                ) : (
                  <span className="text-muted" style={{ fontSize: '13px' }}>-</span>
                )
              )}
            </td>
            <td className="col-owner">
              {project.accountable_owner_id ? (
                <span
                  className="text-dark"
                  style={{ cursor: isAdmin ? 'pointer' : 'default', borderBottom: isAdmin ? '1px dashed #cbd5e1' : 'none', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}
                  onClick={(e) => isAdmin ? handleOpenDecider(e, project) : null}
                >
                  {project.accountable_owner}
                </span>
              ) : (
                <span className="text-cadence-blue fw-bold d-inline-flex align-items-center gap-1 text-nowrap" style={{ fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={(e) => handleOpenDecider(e, project)}>
                  + {t("Assign decider")} <ChevronDown size={14} className="text-muted" />
                </span>
              )}
            </td>
            <td>
              {project.impact ? (
                <span className={`pill-attribute ${getAttributePillClass("impact", project.impact)}`}>{t(project.impact)}</span>
              ) : (
                <span className="text-muted">—</span>
              )}
            </td>
            <td>
              {project.effort ? (
                <span className={`pill-attribute ${getAttributePillClass("effort", project.effort)}`}>{t(project.effort)}</span>
              ) : (
                <span className="text-muted">—</span>
              )}
            </td>
            <td>
              {project.risk ? (
                <span className={`pill-attribute ${getAttributePillClass("risk", project.risk)}`}>{t(project.risk)}</span>
              ) : (
                <span className="text-muted">—</span>
              )}
            </td>
            <td className="text-end">
              {(() => {
                const isDraft = !project.status || project.status.toLowerCase() === "draft";
                const canEditDraft = isDraft && canEditProject && canEditProject(project);
                if (canEditDraft) {
                  return (
                    <button
                      className="btn btn-primary btn-sm rounded px-3 fw-bold actions-setup-btn"
                      style={{ fontSize: '13px', border: 'none', whiteSpace: 'nowrap' }}
                      onClick={() => isTerminal ? onView(project) : onEdit(project)}
                    >
                      {t("Set up")}
                    </button>
                  );
                } else {
                  return (
                    <button
                      className="btn btn-sm rounded px-3 fw-bold actions-open-btn"
                      onClick={() => onView(project)}
                    >
                      {t("Open")} <ChevronRight size={14} className="text-muted" style={{ marginLeft: '2px' }} />
                    </button>
                  );
                }
              })()}
            </td>
          </tr>;
        })}
      </tbody>
    </table>
    {cadenceProject && (
      <ReviewCadencesModal
        show={showCadencesModal}
        onHide={() => setShowCadencesModal(false)}
        project={cadenceProject}
        onSave={handleSaveCadences}
      />
    )}
    {deciderProject && (
      <AssignDeciderModal
        show={showDeciderModal}
        onHide={() => setShowDeciderModal(false)}
        project={deciderProject}
        businessId={selectedBusinessId}
        onSave={handleSaveDecider}
      />
    )}
  </div>;
};
export default ProjectsTable;
