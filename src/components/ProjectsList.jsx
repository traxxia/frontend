import React, { useMemo, useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { ChevronRight, ChevronDown, FolderOpen } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
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
  const { t } = useTranslation();
  const [showMenuId, setShowMenuId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest(".project-menu-btn") || event.target.closest(".project-dropdown-menu")) {
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

  // Group projects by Status
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
      // Normalize and map API status to UI categories
      const apiStatus = (p.status || "Draft").toLowerCase().trim();

      let mappedStatus = "Draft";
      if (apiStatus === "active") {
        mappedStatus = "Active";
      } else if (apiStatus === "at risk" || apiStatus === "at-risk") {
        mappedStatus = "At Risk";
      } else if (apiStatus === "paused") {
        mappedStatus = "Paused";
      } else if (apiStatus === "killed") {
        mappedStatus = "Killed";
      } else if (apiStatus === "scaled") {
        mappedStatus = "Scaled";
      } else if (apiStatus === "draft" || apiStatus === "prioritizing" || apiStatus === "prioritized") {
        mappedStatus = "Draft";
      } else {
        // Default fallback
        mappedStatus = "Draft";
      }

      if (groups[mappedStatus]) {
        groups[mappedStatus].push(p);
      } else {
        groups["Draft"].push(p);
      }
    });

    return groups;
  }, [sortedProjects]);

  const toggleSection = (status) => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const renderGroup = (status, projects) => {
    const isExpanded = !!expandedSections[status];
    const count = projects.length;

    return (
      <div key={status} className={`project-status-group-v2 ${count === 0 ? 'empty-group' : ''} mb-3`}>
        <div
          className="project-status-header-v2"
          onClick={() => toggleSection(status)}
        >
          <div className="status-header-left-v2">
            <span className="expand-icon-wrapper-v2">
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </span>
            <span className="status-title-v2">{t(status)}</span>
            <span className="status-count-v2">{count}</span>
          </div>
        </div>

        {isExpanded && (
          <div className="status-group-content-v2">
            {count === 0 ? (
              <div className="empty-category-v2">
                <FolderOpen size={48} className="empty-icon-v2" />
                <p>{t("No_projects_found")}</p>
              </div>
            ) : (
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
            )}
          </div>
        )}
      </div>
    );
  };

  const statusOrder = ["Draft", "Active", "At Risk", "Paused", "Killed", "Scaled"];

  return (
    <div className={`projects-list-v2 ${isFinalizedView ? "finalized-view" : ""}`}>
      {statusOrder.map(status => renderGroup(status, groupedProjects[status]))}
    </div>
  );
};

export default ProjectsList;