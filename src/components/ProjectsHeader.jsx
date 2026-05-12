import React from "react";
import { useTranslation } from "../hooks/useTranslation";
const ProjectsHeader = ({
  totalProjects,
  isLoading
}) => {
  const {
    t
  } = useTranslation();
  return <div className="projects-header-container">
      <div className="projects-header-row">
        <div className="d-flex align-items-center gap-3">
          <h6 className="projects-small-title mb-0">{t("Projects")}</h6>
          <div className="d-flex align-items-center gap-2 px-3 py-2 projects-header--s1">
            {isLoading ? <span className="fw-bold projects-header--s2">
                {t("loading")}
              </span> : <>
                <span className="fw-bold projects-header--s3">
                  {totalProjects}
                </span>
                <span className="projects-header--s4">
                  {totalProjects === 1 ? t("project") : t("total_projects")}
                </span>
              </>}
          </div>
        </div>
      </div>
    </div>;
};
export default ProjectsHeader;