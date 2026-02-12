import React from "react";
import { Plus, ListOrdered, Lock, Users } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

const ProjectsHeader = ({
  totalProjects,
  isLoading,
  isDraft,
  isPrioritizing,
  launched,
  isViewer,
  isArchived,
  rankingsLocked,
  showRankScreen,
  userHasRerankAccess,
  onNewProject,
  onToggleRankScreen,
  showTeamRankings,
  onToggleTeamRankings,
}) => {
  const { t } = useTranslation();
  return (
    <div className="projects-header-container">
      <div className="projects-header-row">
        <div className="d-flex align-items-center gap-3">
          <h6 className="projects-small-title mb-0">{t("Projects")}</h6>
          <div
            className="d-flex align-items-center gap-2 px-3 py-2"
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid rgb(26, 115, 232)',
              minWidth: '120px'
            }}
          >
            {isLoading ? (
              <span className="fw-bold" style={{ color: '#2563eb', fontSize: '14px' }}>
                {t("loading")}
              </span>
            ) : (
              <>
                <span className="fw-bold" style={{ color: '#2563eb', fontSize: '18px' }}>
                  {totalProjects}
                </span>
                <span className="" style={{ color: '#2563eb', fontSize: '14px', fontWeight: '500' }}>
                  {totalProjects === 1 ? t("project") : t("total_projects")}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap justify-content-end align-items-center">
          {isDraft && !isViewer && !isArchived && sessionStorage.getItem("userPlan") !== 'essential' && (
            <button onClick={onNewProject} className="btn-new-project">
              <Plus size={18} />
              {t("New_Project")}
            </button>
          )}

          {((isPrioritizing && !rankingsLocked) ||
            (launched && userHasRerankAccess)) &&
            !isViewer && !isArchived && (
              <div className="consensus-toggle-group" style={{ marginLeft: '8px' }}>
                <button
                  onClick={onToggleRankScreen}
                  className={`toggle-btn ${showRankScreen ? 'active' : ''}`}
                >
                  <ListOrdered size={14} />
                  {t("Rank_Projects")}
                </button>

                <button
                  onClick={onToggleTeamRankings}
                  className={`toggle-btn ${showTeamRankings ? 'active' : ''}`}
                >
                  <Users size={14} />
                  {t("Rankings_View")}
                </button>
              </div>
            )}

          {isPrioritizing && rankingsLocked && !userHasRerankAccess && (
            <>
              <button className="btn-rankings-locked" disabled>
                <Lock size={18} />
                {t("Rankings_Locked")}
              </button>
              {showRankScreen && (
                <button onClick={onToggleRankScreen} className="btn-rank-projects">
                  {t("Hide")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsHeader;