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

  // Group projects by v2 Status
  const groupedProjects = useMemo(() => {
    const groups = {
      "Active Bets": [],
      "Parked / Paused": [],
      "Learned & Killed": [],
      "Drafts": []
    };

    sortedProjects.forEach(p => {
      const status = p.status || "Draft";
      if (status === "Active" || status === "At Risk" || status === "Scaled") {
        groups["Active Bets"].push(p);
      } else if (status === "Paused") {
        groups["Parked / Paused"].push(p);
      } else if (status === "Killed") {
        groups["Learned & Killed"].push(p);
      } else {
        groups["Drafts"].push(p);
      }
    });

    return groups;
  }, [sortedProjects]);

  const renderGroup = (title, projects) => {
    if (projects.length === 0) return null;
    return (
      <div key={title} className="project-group mb-5">
        {/* <h4 className="group-title mb-3" style={{ borderBottom: "1px solid #333", paddingBottom: "8px", color: "#888" }}>
          {title} <span style={{ fontSize: "0.8em", opacity: 0.6 }}>({projects.length})</span>
        </h4> */}
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
              />
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  return (
    <div className={`projects-list-wrapper ${isFinalizedView ? "finalized-view" : ""}`}>
      {renderGroup("Active Bets", groupedProjects["Active Bets"])}
      {renderGroup("Drafts", groupedProjects["Drafts"])}
      {renderGroup("Parked / Paused", groupedProjects["Parked / Paused"])}
      {renderGroup("Learned & Killed", groupedProjects["Learned & Killed"])}

      {/* Fallback if all empty but logic implies we should show something? 
          sortedProjects will handle empty state usually in parent. 
      */}
    </div>
  );
};

export default ProjectsList;