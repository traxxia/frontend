import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

const ProjectCard = ({
  project,
  index,
  rankMap,
  finalizeCompleted,
  launched,
  isViewer,
  isEditor,
  isDraft,
  projectCreationLocked,
  canEditProject,
  onEdit,
  onView,
  onDelete,
}) => {
  const { t } = useTranslation();

  const handlePrimaryAction = () => {
    if (launched) {
      if (canEditProject(project)) {
        onEdit(project);
      } else {
        onView(project);
      }
    } else {
      if (isViewer) {
        onView(project);
      } else {
        onEdit(project);
      }
    }
  };

  return (
    <div className="project-card">
      {finalizeCompleted && (
        <div className="project-serial-number">
          {rankMap[String(project._id)] ?? index + 1}
        </div>
      )}
      
      <p className="project-initiative">
        from&nbsp;
        <span className="project-initiative-highlight">
          {project.project_type || "Created project"}
        </span>
      </p>

      <h5 className="project-title">{project.project_name}</h5>
      <p className="project-description">{project.description}</p>

      <div className="project-quote">
        "{project.quote || "Generate using AI"}"
      </div>

      <p className="project-last-edited">
        Created by{" "}
        <span className="project-last-edited-name">
          {project.created_by || "Unknown"}
        </span>
      </p>

      <hr />

      <div className="project-actions">
        {launched ? (
          canEditProject(project) ? (
            <button onClick={handlePrimaryAction} className="view-details-btn">
              <Pencil size={16} /> {t("edit")}
            </button>
          ) : (
            <button onClick={handlePrimaryAction} className="view-details-btn">
              {t("View_Details")}
            </button>
          )
        ) : (
          <button onClick={handlePrimaryAction} className="view-details-btn">
            {isViewer ? (
              t("View_Details")
            ) : (
              <>
                <Pencil size={16} /> {t("edit")}
              </>
            )}
          </button>
        )}

        {isEditor && !isViewer && isDraft && !projectCreationLocked && (
          <button
            onClick={() => onDelete(project._id)}
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
          >
            <Trash2 size={16} /> {t("delete")}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;