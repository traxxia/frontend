import React, { useState } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Rocket } from "lucide-react";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import "../styles/KickstartProjectsCard.css";

const KickstartProjectsCard = ({ onKickstart, isLocked = false }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleKickstart = async () => {
    setIsLoading(true);
    try {
      await onKickstart();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="p-0 mb-3">
      <div className="kickstart-wrapper">
        <Row className="align-items-center g-3">
          {/* Text */}
          <Col xs={12} md={8}>
            <h2 className="kickstart-title">
              {isLocked ? "Ready to Execute Your Strategy?" : `${t("Ready_to_Start_Project_Planning")}?`}
            </h2>

            <p className="kickstart-description">
              {isLocked
                ? "Upgrade to the Advanced tier to convert these initiatives into actionable projects and access the execution engine."
                : t("Kickstart_your_project_workflow_by_cloning_initiatives_into_actionable_projects.")
              }
            </p>
          </Col>

          {/* Button */}
          <Col xs={12} md="auto" className="ms-md-auto">
            <Button
              variant={isLocked ? "warning" : "primary"}
              onClick={handleKickstart}
              disabled={isLoading}
              className="d-flex align-items-center gap-2 w-100 w-md-auto kickstart-button"
            >
              {isLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  {t("Processing")}...
                </>
              ) : (
                <>
                  <Rocket size={18} />
                  <span>{isLocked ? "Upgrade to Execute" : t("Kickstart_Projects")}</span>
                </>
              )}
            </Button>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default KickstartProjectsCard;