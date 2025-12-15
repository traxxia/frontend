import React, { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";
import {
  Button,
  Card,
  Accordion,
  useAccordionButton,
  Row,
  Col
} from "react-bootstrap";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
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

const RankProjectsPanel = ({ show, projects, onLockRankings }) => {
  const { t } = useTranslation();
   const [projectList, setProjectList] = useState(projects || []);

  // Keep local list in sync with incoming projects from API
   useEffect(() => {
    setProjectList(projects || []);
  }, [projects]);

  if (!show) return null;

  // REORDER HANDLER 
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(projectList);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    setProjectList(items);
  };

  return (
    <div className="rank-panel-container responsive-panel compact-mode">

      {/* Header Section */}
      <Row className="rank-panel-header">
        <Col xs={12} md={6}>
          <h4 className="rank-title">{t("Rank_Your_Projects")}</h4>
        </Col>

        <Col
          xs={12}
          md={6}
          className="rank-header-buttons d-flex justify-content-md-end justify-content-start"
        >
          <Button className="btn-save-rank responsive-btn">{t("Save_Rankings")}</Button>
          <Button
            className="btn-lock-rank responsive-btn"
            onClick={onLockRankings}
          >
            <Lock size={16} /> {t("Lock_My_Rankings")}
          </Button>
        </Col>
      </Row>

      <p className="rank-description">
        Drag projects to reorder. Add rationale to explain your ranking.
      </p>

      {/* DRAG & DROP START */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="rank-projects">
          {(provided) => (
            <Accordion alwaysOpen ref={provided.innerRef} {...provided.droppableProps}>
              {projectList.map((item, index) => (
                <Draggable
                  key={item._id || index}
                  draggableId={(item._id || index).toString()}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <Card
                      className={`rank-project-card responsive-card ${
                        snapshot.isDragging ? "dragging" : ""
                      }`}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <Card.Body>

                        <div className="rank-card-top responsive-card-top">
                          
                          
                          {/* Number */}
                          <div className="rank-number">{index + 1}</div>

                          {/* Content */}
                          <div className="rank-content">
                            <h5 className="rank-project-title">{item.project_name || item.title}</h5>
                            <p className="rank-project-desc">{item.description}</p>
                          </div>
                          {/* ⭐ Drag handle (Grip icon) */}
                          <div
                            className="rank-move-buttons responsive-move-buttons"   
                            style={{ cursor: "grab" }}
                          >
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
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Accordion>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default RankProjectsPanel;
