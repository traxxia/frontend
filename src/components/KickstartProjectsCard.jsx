import React from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Rocket } from "lucide-react";
import { Container, Row, Col, Button } from "react-bootstrap";
import "../styles/KickstartProjectsCard.css";

const KickstartProjectsCard = ({ onKickstart }) => {
  const { t } = useTranslation();

  return (
    <Container fluid className="p-0 mb-3">
      <div className="kickstart-wrapper">
        <Row className="align-items-center g-3">
          {/* Text */}
          <Col xs={12} md={8}>
            <h2 className="kickstart-title">
              {t("Ready_to_Start_Project_Planning")}?
            </h2>

            <p className="kickstart-description">
              {t(
                "Kickstart_your_project_workflow_by_cloning_initiatives_into_actionable_projects."
              )}
            </p>
          </Col>

          {/* Button */}
          <Col xs={12} md="auto" className="ms-md-auto">
            <Button
              variant="primary"
              onClick={onKickstart}
              className="d-flex align-items-center gap-2 w-100 w-md-auto kickstart-button"
            >
              <Rocket size={18} />
              {t("Kickstart_Projects")}
            </Button>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default KickstartProjectsCard;
