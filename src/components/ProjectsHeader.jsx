import React from "react";
import { Plus, ListOrdered, Lock } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

const ProjectsHeader = ({
  totalProjects,
  isDraft,
  isPrioritizing,
  launched,
  isViewer,
  rankingsLocked,
  showRankScreen,
  userHasRerankAccess,
  onNewProject,
  onToggleRankScreen,
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
              border: '1px solid #e9ecef',
              minWidth: '120px'
            }}
          >
            <span className="fw-bold" style={{ color: '#212529', fontSize: '18px' }}>
              {totalProjects}
            </span>
            <span className="text-muted" style={{ fontSize: '14px', fontWeight: '500' }}>
              {totalProjects === 1 ? t("project") : t("total_projects")}
            </span>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap justify-content-end align-items-center">
          {isDraft && !isViewer && (
            <button onClick={onNewProject} className="btn-new-project">
              <Plus size={18} />
              {t("New_Project")}
            </button>
          )}

          {((isPrioritizing && !rankingsLocked) ||
            (launched && userHasRerankAccess)) &&
            !isViewer && (
              <button onClick={onToggleRankScreen} className="btn-rank-projects">
                <ListOrdered size={18} />
                {showRankScreen ? t("Hide") : t("Rank_Projects")}
              </button>
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