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
  canReviewProject,
  myUserId,
}) => {
  const { t } = useTranslation();
  const userPlan = useAuthStore((state) => state.userPlan);
  const [showMenuId, setShowMenuId] = useState(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click is inside a menu-button or menu-dropdown, ignore
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


  const renderProjectTable = (projects) => {
    if (!projects || projects.length === 0) return null;
    return (
      <ProjectsTable
        projects={projects}
        rankMap={rankMap}
        onEdit={onEdit}
        onView={onView}
        onDelete={onDelete}
        onPerformReview={onPerformReview}
        onAdhocUpdate={onAdhocUpdate}
        showMenuId={showMenuId}
        setShowMenuId={setShowMenuId}
        selectedProjectIds={selectedProjectIds}
        onToggleSelection={onToggleSelection}
        isAdmin={isAdmin}
        isArchived={isArchived}
        isViewer={isViewer}
        canReviewProject={canReviewProject}
        myUserId={myUserId}
      />
    );
  };


  const getFilteredGroups = () => {
    if (isLoading) {
      return (
        <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: "300px" }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" size="lg" />
            <p className="mt-3 text-muted fw-500">{t("Loading projects...")}</p>
          </div>
        </div>
      );
    }

    // Show flat rank-ordered list if "All" is selected
    if (!selectedCategories || selectedCategories.includes("All")) {
      return renderProjectTable(sortedProjects);
    }

    // Show projects that match any of the selected categories
    const filteredProjects = sortedProjects.filter(p => {
      const statusValue = (p.status || "Draft").toLowerCase();
      return selectedCategories.some(catId => {
        if (catId === "At Risk" && (statusValue === "at risk" || statusValue === "at_risk")) return true;
        return statusValue === catId.toLowerCase();
      });
    });

    if (filteredProjects.length === 0) {
      const labels = selectedCategories.map(id => t(id)).join(", ");
      return (
        <div className="empty-category-message text-center py-5">
          <p className="text-muted">{t("No projects found in selected categories")}: {labels}.</p>
        </div>
      );
    }
    return renderProjectTable(filteredProjects);
  };

  return (
    <div className={`projects-list-wrapper ${isFinalizedView ? "finalized-view" : ""}`}>
      {getFilteredGroups()}
    </div>
  );
};

export default ProjectsList;