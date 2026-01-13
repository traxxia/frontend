import React from "react";
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
  return (
    <div className={`projects-list-wrapper ${isFinalizedView ? "finalized-view" : ""}`}>
      <Row className="g-4">
        {sortedProjects.map((project, index) => (
          <Col
            xs={12}
            sm={12}
            md={isFinalizedView ? 12 : 6}
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
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProjectsList;