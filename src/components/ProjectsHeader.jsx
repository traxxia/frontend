import React from "react";
import { useTranslation } from "../hooks/useTranslation";

const ProjectsHeader = ({
  totalProjects,
  isLoading,
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
      </div>
    </div>
  );
};

export default ProjectsHeader;