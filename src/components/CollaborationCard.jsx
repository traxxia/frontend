import React from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import { Lock, CheckCircle } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

const CollaborationCard = ({
  projectCreationLocked,
  finalizeCompleted,
  launched,
  lockSummary,
  allCollaboratorsLocked,
  onLockProjectCreation,
  onFinalizePrioritization,
  onLaunchProjects,
}) => {
  const { t } = useTranslation();

  if (!projectCreationLocked) {
    return (
      <Card className="open-collab-card shadow-sm">
        <Row className="align-items-center">
          <Col md="8">
            <h5 className="open-collab-title fw-bold">
              {t("Open_for_Collaboration")}
            </h5>
            <p className="open-collab-text">
              {t("All_collaborators_can_add_projects_update_info_and_rank")}
            </p>
          </Col>
          <Col md="4" className="d-flex justify-content-end align-items-center">
            <Button className="open-collab-btn" onClick={onLockProjectCreation}>
              <Lock size={16} color="#589be9ff" strokeWidth={2} />
              {t("Lock_Project_Creation")}
            </Button>
          </Col>
        </Row>
      </Card>
    );
  }

  if (!finalizeCompleted) {
    return (
      <Card className="project-creation-locked-card shadow-sm">
        <Row>
          <Col>
            <div className="project-locked-content">
              <div className="project-locked-header project-locked-header-row">
                <div className="project-locked-left">
                  <span className="project-locked-title">
                    {t("Project_Creation_Locked")}
                  </span>
                  <Lock size={16} className="project-locked-icon" />
                  <span className="project-locked-meta">
                    {lockSummary.locked_users_count} of {lockSummary.total_users}{" "}
                    collaborators locked
                  </span>
                </div>

                {allCollaboratorsLocked && (
                  <button
                    className="finalize-prioritization-btn"
                    onClick={onFinalizePrioritization}
                  >
                    <CheckCircle size={16} />
                    {t("Finalize_Prioritization")}
                  </button>
                )}
              </div>

              <p className="project-locked-subtitle">
                {t("No_newprojectscan_be_added_Continue_ranking_and_updating.")}
              </p>
            </div>
          </Col>
        </Row>
      </Card>
    );
  }

  if (launched) {
    return (
      <Card className="launched-card shadow-sm">
        <Row>
          <Col>
            <h5 className="launched-title">{t("Launched")}</h5>
            <p className="launched-subtitle">
              {t("Projects_ready_for_execution")}
            </p>
          </Col>
        </Row>
      </Card>
    );
  }

  return (
    <Card className="prioritization-complete-card shadow-sm">
      <Row className="align-items-center">
        <Col md={8}>
          <h5 className="prioritization-title">
            {t("Prioritization_Complete")}
          </h5>
          <p className="prioritization-subtitle">
            {t("Projects_prioritized")}
          </p>
        </Col>
        <Col md={4} className="d-flex justify-content-end">
          <button className="launch-projects-btn" onClick={onLaunchProjects}>
            {t("Launch_Projects")}
          </button>
        </Col>
      </Row>
    </Card>
  );
};

export default CollaborationCard;