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
      <h6 className="projects-small-title">{t("Projects")}</h6>

      <div className="projects-header-row">
        <h2 className="projects-count">
          {totalProjects} {t("total_projects")}
        </h2>

        <div className="d-flex gap-2 flex-wrap justify-content-end">
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