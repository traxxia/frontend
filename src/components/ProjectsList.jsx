import React, { useMemo, useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import ProjectCard from "./ProjectCard";

const ProjectsList = ({
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
}) => {
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
      } else if (statusValue === "scaled") {
        groups["Scaled"].push(p);
      } else {
        // Includes 'draft', 'launched', and any unknown fallback
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
            />
          </Col>
        ))}
      </Row>
    );
  };

  const getFilteredGroups = () => {
    // Show flat rank-ordered list for "All"
    if (!selectedCategory || selectedCategory === "All") {
      return renderProjectGrid(sortedProjects);
    }

    // Show filtered group for specific status
    const projects = groupedProjects[selectedCategory] || [];
    if (projects.length === 0) {
      return (
        <div className="empty-category-message text-center py-5">
          <p className="text-muted">No projects found in "{selectedCategory}" category.</p>
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