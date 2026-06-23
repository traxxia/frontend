import React, { useMemo, useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import ProjectsTable from "./ProjectsTable";
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../store';
const ProjectsList = ({
  isLoading,
  sortedProjects,
  rankMap,
  finalizeCompleted,
  launched,
  isViewer,
  isEditor,
  isDraft,
  projectCreationLocked,
  isFinalizedView,
  canEditProject,
  onEdit,
  onView,
  onDelete,
  selectedCategories,
  isArchived,
  isAdmin,
  selectedProjectIds = [],
  onToggleSelection,
  selectionDisabled = false,
  onPerformReview,
  onAdhocUpdate,
  onDirectUpdate,
  canReviewProject,
  myUserId
}) => {
  const {
    t
  } = useTranslation();
  const userPlan = useAuthStore(state => state.userPlan);
  const [showMenuId, setShowMenuId] = useState(null);
  useEffect(() => {
    const handleClickOutside = event => {
      if (event.target.closest(".menu-button") || event.target.closest(".menu-dropdown") || event.target.closest(".actions-dropdown-btn")) {
        return;
      }
      setShowMenuId(null);
    };
    if (showMenuId) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showMenuId]);
  const renderProjectTable = projects => {
    if (!projects || projects.length === 0) {
      return (
        <div className="w-100 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '350px' }}>
          <div className="mb-3" style={{ opacity: 0.5 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </div>
          <h5 className="text-secondary fw-bold mb-2">{t("No bets found")}</h5>
          <p className="text-muted" style={{ maxWidth: '400px', textAlign: 'center' }}>
            {t("There are currently no bets or initiatives to display.")}
          </p>
        </div>
      );
    }
    return <ProjectsTable projects={projects} rankMap={rankMap} onEdit={onEdit} onView={onView} onDelete={onDelete} onPerformReview={onPerformReview} onAdhocUpdate={onAdhocUpdate} onDirectUpdate={onDirectUpdate} showMenuId={showMenuId} setShowMenuId={setShowMenuId} selectedProjectIds={selectedProjectIds} onToggleSelection={onToggleSelection} isAdmin={isAdmin} isArchived={isArchived} isViewer={isViewer} canReviewProject={canReviewProject} canEditProject={canEditProject} myUserId={myUserId} />;
  };
  const getFilteredGroups = () => {
    if (isLoading) {
      return <div className="d-flex justify-content-center align-items-center py-5 projects-list--s1">
          <div className="text-center">
            <Spinner animation="border" variant="primary" size="lg" />
            <p className="mt-3 text-muted fw-500">{t("Loading projects...")}</p>
          </div>
        </div>;
    }
    if (!selectedCategories || selectedCategories.includes("All")) {
      return renderProjectTable(sortedProjects);
    }
    const filteredProjects = sortedProjects.filter(p => {
      const statusValue = (p.status || "Draft").toLowerCase();
      return selectedCategories.some(catId => {
        if (catId === "At Risk" && (statusValue === "at risk" || statusValue === "at_risk")) return true;
        return statusValue === catId.toLowerCase();
      });
    });
    if (filteredProjects.length === 0) {
      const labels = selectedCategories.map(id => t(id)).join(", ");
      return <div className="empty-category-message text-center py-5">
          <p className="text-muted">{t("No projects found in selected categories")}: {labels}.</p>
        </div>;
    }
    return renderProjectTable(filteredProjects);
  };
  return <div className={`projects-list-wrapper ${isFinalizedView ? "finalized-view" : ""}`}>
      {getFilteredGroups()}
    </div>;
};
export default ProjectsList;
