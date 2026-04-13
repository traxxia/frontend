import React, { useMemo, useState, useEffect } from "react";
import { Row, Col, Spinner } from "react-bootstrap";
import ProjectCard from "./ProjectCard";
import { useTranslation } from '../hooks/useTranslation';
import { getUserLimits } from '../utils/authUtils';
import { useAuthStore } from '../store/authStore';

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
  selectedCategory,
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
  const [showMenuId, setShowMenuId] = useState(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click is inside a menu-button or menu-dropdown, ignore
      if (event.target.closest(".menu-button") || event.target.closest(".menu-dropdown")) {
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

  // Group projects by v2 Status (case-insensitive)
  const groupedProjects = useMemo(() => {
    const groups = {
      "Draft": [],
      "Active": [],
      "At Risk": [],
      "Paused": [],
      "Killed": [],
      "Completed": [],
      "Scaled": []
    };

    sortedProjects.forEach(p => {
      const statusValue = (p.status || "Draft").toLowerCase();
      if (statusValue === "active") {
        groups["Active"].push(p);
      } else if (statusValue === "at risk" || statusValue === "at_risk") {
        groups["At Risk"].push(p);
      } else if (statusValue === "paused") {
        groups["Paused"].push(p);
      } else if (statusValue === "killed") {
        groups["Killed"].push(p);
      } else if (statusValue === "completed") {
        groups["Completed"].push(p);
      } else if (statusValue === "scaled") {
        groups["Scaled"].push(p);
      } else if (statusValue === "draft") {
        groups["Draft"].push(p);
      } else {
        // Unknown fallback
        groups["Draft"].push(p);
      }
    });

    return groups;
  }, [sortedProjects]);

  const renderProjectGrid = (projects) => {
    if (!projects || projects.length === 0) return null;
    return (
      <Row className="g-4">
        {projects.map((project, index) => (
          <Col
            xs={12}
            sm={12}
            md={isFinalizedView ? 12 : 6}
            lg={4}
            key={project._id}
          >
            <ProjectCard
              project={project}
              index={index}
              rankMap={rankMap}
              finalizeCompleted={finalizeCompleted}
              launched={launched}
              isViewer={isViewer}
              isEditor={isEditor}
              isDraft={isDraft}
              projectCreationLocked={projectCreationLocked}
              canEditProject={canEditProject}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              showMenuId={showMenuId}
              setShowMenuId={setShowMenuId}
              isArchived={isArchived}
              isAdmin={isAdmin}
              isSelected={selectedProjectIds.includes(project._id)}
              onToggleSelection={onToggleSelection}
              onPerformReview={onPerformReview}
              onAdhocUpdate={onAdhocUpdate}
              canReviewProject={canReviewProject}
              myUserId={myUserId}
              isCheckboxDisabled={isArchived || selectionDisabled || !getUserLimits().project || useAuthStore.getState().userPlan === 'essential'}
            />
          </Col>
        ))}
      </Row>
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

    // Show flat rank-ordered list for "All"
    if (!selectedCategory || selectedCategory === "All") {
      return renderProjectGrid(sortedProjects);
    }

    // Show filtered group for specific status
    const projects = groupedProjects[selectedCategory] || [];
    if (projects.length === 0) {
      return (
        <div className="empty-category-message text-center py-5">
          <p className="text-muted">{t("No projects found in")} "{selectedCategory}" {t("category")}.</p>
        </div>
      );
    }
    return renderProjectGrid(projects);
  };

  return (
    <div className={`projects-list-wrapper ${isFinalizedView ? "finalized-view" : ""}`}>
      {getFilteredGroups()}
    </div>
  );
};

export default ProjectsList;