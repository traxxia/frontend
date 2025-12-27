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
import axios from "axios";
import "../styles/RankProjectsPanel.css";

/* ---------- RATIONALE TOGGLE (UI ONLY) ---------- */
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
const RankProjectsPanel = ({ show, projects, onLockRankings, businessId, onRankSaved, isAdmin ,isRankingLocked}) => {
  const { t } = useTranslation();
  const [projectList, setProjectList] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // ✅ ADD THIS

 useEffect(() => {
  if (!projects || projects.length === 0) return;

  const sorted = [...projects].sort((a, b) => {
    const rankA = a.rank ?? Infinity;
    const rankB = b.rank ?? Infinity;
    return rankA - rankB;
  });

  setProjectList(sorted);
}, [projects]);


  if (!show) return null;
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(projectList);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    setProjectList(items);
  };

  const handleSaveRankings = async () => {
  try {
    const token = sessionStorage.getItem("token");

    const payload = {
      business_id: businessId,
      projects: projectList.map((p, index) => ({
        project_id: p._id,
        rank: index + 1,
        rationals: p.rationale || ""
      }))
    };

    await axios.put(
      `${process.env.REACT_APP_BACKEND_URL}/api/projects/rank`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    alert("Rankings saved successfully");
    setIsSaved(true); // ✅ ADD THIS LINE

    if (onRankSaved) {
      onRankSaved();
    }
  } catch (err) {
    console.error("Save rankings failed", err);
    alert("Failed to save rankings");
  }
};


  const handleLockRankings = () => {
  if (!isSaved) {
    alert("Please save your rankings before locking.");
    return; 
  }
  setIsLocked(true);
  localStorage.setItem(`rankingLocked_${businessId}`, "true");
  if (onLockRankings) {
    onLockRankings();
  }
};


  return (
    <div className="rank-panel-container responsive-panel compact-mode">
      <Row className="rank-panel-header">
        <Col xs={12} md={6}>
          <h4 className="rank-title">{t("Rank_Your_Projects")}</h4>
        </Col>

        <Col
          xs={12}
          md={6}
          className="rank-header-buttons d-flex justify-content-md-end justify-content-start"
        >
         {(isAdmin || !isRankingLocked) && (
          <Button
            className="btn-save-rank responsive-btn"
            onClick={handleSaveRankings}
          >
            {t("Save_Rankings")}
          </Button>
        )}

          {!isAdmin && (
            <Button
              className="btn-lock-rank responsive-btn"
              onClick={handleLockRankings}
              disabled={isLocked || !isSaved} 
            >
              <Lock size={16} /> {t("Lock_My_Rankings")}
            </Button>
          )}
        </Col>
      </Row>

      <p className="rank-description">
        Drag projects to reorder. Add rationale to explain your ranking.
      </p>

      {/* ---------- DRAG & DROP ---------- */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="rank-projects">
          {(provided) => (
            <Accordion
              alwaysOpen
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {projectList.map((item, index) => (
                <Draggable
                  key={item._id}
                  draggableId={item._id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`rank-project-card responsive-card ${
                        snapshot.isDragging ? "dragging" : ""
                      }`}
                    >
                      <Card.Body>

                        {/* ---------- TOP ---------- */}
                        <div className="rank-card-top responsive-card-top">

                          <div className="rank-number">{index + 1}</div>

                          <div className="rank-content">
                            <h5 className="rank-project-title">
                              {item.project_name}
                            </h5>
                            <p className="rank-project-desc">
                              {item.description}
                            </p>
                          </div>

                          <div
                            className="rank-move-buttons responsive-move-buttons"
                            style={{ cursor: "grab" }}
                          >
                            <ChevronUp size={18} />
                            <ChevronDown size={18} />
                          </div>
                        </div>

                        {/* ---------- RATIONALE ---------- */}
                        <div className="rank-rationale-btn-container responsive-rationale-btn">
                          <RationaleToggle eventKey={index.toString()}>
                            Add Rationale ▼
                          </RationaleToggle>
                        </div>

                        <Accordion.Collapse eventKey={index.toString()}>
                          <textarea
                            className="rank-rationale-textarea responsive-textarea"
                            placeholder="Why did you rank this project here?"
                            value={item.rationale || ""}
                            onChange={(e) => {
                              const updated = [...projectList];
                              updated[index] = {
                                ...updated[index],
                                rationale: e.target.value
                              };
                              setProjectList(updated);
                            }}
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
