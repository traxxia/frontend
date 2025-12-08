import React, { useState, useRef } from "react";
import {
  Button,
  Card,
  Accordion,
  useAccordionButton,
  Row,
  Col
} from "react-bootstrap";
import { Lock, ChevronUp, ChevronDown } from "lucide-react";
import "../styles/RankProjectsPanel.css";

function RationaleToggle({ eventKey, children }) {
  const decoratedOnClick = useAccordionButton(eventKey);
  return (
    <Button
      variant="link"
      onClick={decoratedOnClick}
      className="rank-rationale-toggle"
    >
      {children}
    </Button>
  );
}

const RankProjectsPanel = ({ show, projects }) => {
  const [projectList, setProjectList] = useState(projects);

  const dragItem = useRef();
  const dragOverItem = useRef();

  if (!show) return null;

  const handleDragStart = (position) => {
    dragItem.current = position;
  };

  const handleDragEnter = (position) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    const listCopy = [...projectList];

    const draggedItemContent = listCopy[dragItem.current];
    listCopy.splice(dragItem.current, 1);
    listCopy.splice(dragOverItem.current, 0, draggedItemContent);

    dragItem.current = null;
    dragOverItem.current = null;

    setProjectList(listCopy);
  };

  return (
    <div className="rank-panel-container responsive-panel">

      {/* Header Section */}
      <Row className="rank-panel-header">
        <Col xs={12} md={6}>
          <h4 className="rank-title">Rank Your Projects</h4>
        </Col>

        <Col
          xs={12}
          md={6}
          className="rank-header-buttons d-flex justify-content-md-end justify-content-start"
        >
          <Button className="btn-save-rank responsive-btn">Save Rankings</Button>
          <Button className="btn-lock-rank responsive-btn">
            <Lock size={16} /> Lock My Rankings
          </Button>
        </Col>
      </Row>

      <p className="rank-description">
        Drag projects to reorder. Add rationale to explain your ranking.
      </p>

      {/* Card List */}
      <Accordion alwaysOpen>
        {projectList.map((item, index) => (
          <Card
            key={item.id}
            className="rank-project-card responsive-card"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
          >
            <Card.Body>
              <div className="rank-card-top responsive-card-top">

                {/* Number */}
                <div className="rank-number">{index + 1}</div>

                {/* Content */}
                <div className="rank-content">
                  <h5 className="rank-project-title">{item.title}</h5>
                  <p className="rank-project-desc">{item.description}</p>
                </div>

                {/* Move icons */}
                <div className="rank-move-buttons responsive-move-buttons">
                  <ChevronUp size={18} className="move-icon" />
                  <ChevronDown size={18} className="move-icon" />
                </div>
              </div>

              {/* Rationale Toggle */}
              <div className="rank-rationale-btn-container responsive-rationale-btn">
                <RationaleToggle eventKey={index.toString()}>
                  Add Rationale ▼
                </RationaleToggle>
              </div>

              {/* Accordion Content */}
              <Accordion.Collapse eventKey={index.toString()}>
                <textarea
                  className="rank-rationale-textarea responsive-textarea"
                  placeholder="Why did you rank this project here?"
                />
              </Accordion.Collapse>

            </Card.Body>
          </Card>
        ))}
      </Accordion>
    </div>
  );
};

export default RankProjectsPanel;
