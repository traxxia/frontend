import React from "react";
import { Rocket } from "lucide-react";
import { Container, Row, Col, Button } from "react-bootstrap";

const KickstartProjectsCard = ({ onKickstart }) => {
  return (
    <Container fluid className="p-0 mb-3">
      <div
        style={{
          width: "100%",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #9671c0",
          backgroundColor: "#f5e8ff",
        }}
      >
        <Row className="align-items-center g-3">
  {/* Text */}
  <Col xs={12} md={8}>
    <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "6px" }}>
      Ready to Start Project Planning?
    </h2>
    <p style={{ fontSize: "14px", color: "#666" }}>
      Kickstart your project workflow by cloning initiatives into actionable projects.
    </p>
  </Col>

  {/* Button - Right aligned on desktop */}
  <Col xs={12} md="auto" className="ms-md-auto">
    <Button
      variant="primary"
      onClick={onKickstart}
      className="d-flex align-items-center gap-2 w-100 w-md-auto"
      style={{
        backgroundColor: "#9333ea",
        border: "none",
        padding: "10px 16px",
        borderRadius: "8px",
        fontSize: "14px",
      }}
    >
      <Rocket size={18} />
      Kickstart Projects
    </Button>
  </Col>
</Row>

      </div>
    </Container>
  );
};

export default KickstartProjectsCard;
