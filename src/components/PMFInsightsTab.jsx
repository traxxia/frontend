import React from "react";
import { Container, Row, Col, Card, Badge, Button } from "react-bootstrap";
import {
  TrendingUp,
  Target,
  Puzzle,
  AlertCircle
} from "lucide-react";

const PMFInsightsTab = () => {
  return (
    <div className="bg-light py-5 min-vh-100">
      <Container style={{ maxWidth: "1080px" }}>
        {/* Header */}
        <div className="text-center mb-5">
          <Badge
            bg="primary-subtle"
            text="primary"
            className="px-3 py-2 rounded-pill fw-semibold"
          >
            ✨ AHA Insights
          </Badge>

          <h2 className="fw-bold mt-3 mb-2">
            Here's what we discovered
          </h2>

          <p className="text-muted fs-6">
            Based on your inputs, here are four critical insights about your
            strategic position.
          </p>
        </div>

        {/* Cards */}
        <Row className="g-4">
          {/* Card 1 */}
          <Col md={6}>
            <Card className="h-100 border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <div className="d-flex align-items-start gap-3">
                  <div className="icon-box">
                    <TrendingUp size={18} color="#2563eb"/>
                  </div>

                  <div>
                    <h6 className="fw-semibold mb-2">
                      In Payments / Fintech in your market, value concentrates in
                      a few profit pools.
                    </h6>

                    <Badge
                      bg="warning-subtle"
                      text="warning"
                      className="rounded-pill fw-semibold mb-3"
                    >
                      Confidence: Medium
                    </Badge>

                    <ul className="insight-list mb-0">
                      <li>Market size typically ranges from $500M–$5B with 3–7% annual growth</li>
                      <li>Operating margins concentrate between 8–15% for market leaders</li>
                      <li>Scale and regulatory compliance are key industry variables</li>
                      <li>Digital transformation and sustainability are major ongoing trends</li>
                    </ul>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Card 2 */}
          <Col md={6}>
            <Card className="h-100 border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <div className="d-flex align-items-start gap-3">
                  <div className="icon-box">
                    <Target size={18} color="#2563eb"/>
                  </div>

                  <div>
                    <h6 className="fw-semibold mb-2">
                      Your core is focused and economically coherent.
                    </h6>

                    <Badge
                      bg="success-subtle"
                      text="success"
                      className="rounded-pill fw-semibold mb-3"
                    >
                      Confidence: High
                    </Badge>

                    <ul className="insight-list mb-0">
                      <li>Value concentrates where focus is sustained.</li>
                    </ul>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Card 3 */}
          <Col md={6}>
            <Card className="h-100 border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <div className="d-flex align-items-start gap-3">
                  <div className="icon-box">
                    <Puzzle size={18} color="#2563eb"/>
                  </div>

                  <div>
                    <h6 className="fw-semibold mb-2">
                      Your adjacencies vary widely in their fit with the core.
                    </h6>

                    <Badge
                      bg="warning-subtle"
                      text="warning"
                      className="rounded-pill fw-semibold mb-3"
                    >
                      Confidence: Medium
                    </Badge>

                    <ul className="insight-list mb-0">
                      <li>
                        The question is not whether to expand, but where expansion
                        reinforces the core.
                      </li>
                    </ul>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Card 4 */}
          <Col md={6}>
            <Card className="h-100 border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <div className="d-flex align-items-start gap-3">
                  <div className="icon-box">
                    <AlertCircle size={18} color="#2563eb"/>
                  </div>

                  <div>
                    <h6 className="fw-semibold mb-2">
                      You are trying to enter a new market while constrained.
                    </h6>

                    <Badge
                      bg="success-subtle"
                      text="success"
                      className="rounded-pill fw-semibold mb-3"
                    >
                      Confidence: High
                    </Badge>

                    <ul className="insight-list mb-0">
                      <li>
                        This usually requires sharper choices, not more initiatives.
                      </li>
                    </ul>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

      </Container>
    </div>
  );
};

export default PMFInsightsTab;
