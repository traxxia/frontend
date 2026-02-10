import React, { useState } from "react";
import { Card, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { ChevronRight } from "react-bootstrap-icons";
import { Folder } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/PrioritiesProjects.css";


const PRIORITIES = [
  {
    id: 1,
    title: "Strengthen core differentiation",
    description: "Align all operations and marketing to reinforce Customization",
    count: 3,
    projects: [
      "Audit current brand positioning",
      "Redesign customer touchpoints",
      "Train team on value proposition",
    ],
  },

  {
    id: 2,
    title: "Optimize profit pool concentration",
    description: "Double down on highest-margin customer segments and products",
    count: 2,
    projects: [
      "Analyze segment profitability",
      "Reallocate sales resources",
    ],
  },

  {
    id: 3,
    title: "Evaluate and rationalize adjacencies",
    description: "Exit low-ROI adjacencies, scale what reinforces the core",
    count: 3,
    projects: [
      "Score each adjacency on ROI",
      "Create exit plan for low performers",
      "Double down on top adjacencies",
    ],
  },
  {
    id: 4,
    title: "Address primary constraint",
    description: "Tackle talent / structure",
    count: 2,
    projects: [
      "Root cause analysis",
      "Design intervention",
    ],
  },
];

const PrioritiesProjects = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleSelection = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleKickstart = () => {
    console.log("Selected priorities:", selected);
  };

  return (
    <div className="container my-4 priorities-container">
      
      <h4 className="priorities-title">{t("Priorities & Projects")}</h4>
      <p className="priorities-subtitle">{t("What should I work on next")}?</p>

      <Card className="kickstart-card mb-4">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="kickstart-title mb-1">
              {t("Ready to Start Project Planning")}?
            </h6>
            <small className="text-muted">
              {t("Select one or more priorities below")}
            </small>
          </div>
          <Button
            className="kickstart-button"
            variant="secondary"
            disabled={selected.length === 0}
            onClick={handleKickstart}
          >
            🚀 {t("Kickstart_Projects")}
          </Button>
        </Card.Body>
      </Card>

      {PRIORITIES.map((item) => {
        const isExpanded = expandedId === item.id;

        return (
          <Card key={item.id} className="priority-card mb-3">
            <Card.Body>
              <Row className="align-items-center">
                <Col xs="auto">
                  <Form.Check
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggleSelection(item.id)}
                  />
                </Col>

                <Col>
                  <h6 className="priority-title mb-1">{item.title}</h6>
                  <small className="priority-desc">{item.description}</small>
                </Col>

                <Col
                  xs="auto"
                  className="d-flex align-items-center gap-2 expand-trigger"
                  onClick={() => toggleExpand(item.id)}
                >
                  <Badge bg="light" text="dark" className="priority-count">
                    📄 {item.count}
                  </Badge>
                  <ChevronRight className={isExpanded ? "rotate" : ""} />
                </Col>
              </Row>

              {isExpanded && item.projects.length > 0 && (
                <div className="projects-section mt-3">
                  <div className="projects-title mb-2 d-flex align-items-center gap-2">
                    <Folder size={16} className="projects-icon" />
                    <span>{t("Projects")}</span>
                  </div>

                  {item.projects.map((project, index) => (
                    <div key={index} className="project-row">
                      <span>{project}</span>
                      <span className="status-badge not-started">
                        Not Started
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        );
      })}

      <Card className="footer-note mt-4">
        <Card.Body>
          <small className="text-muted">
            <strong>{t("Note")}:</strong> {t("Note_desc")}
          </small>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PrioritiesProjects;
