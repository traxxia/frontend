import React, { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";
import {
  Button,
  Card,
  Accordion,
  useAccordionButton,
  Row,
  Col,
  Alert,
  Modal,
  Form
} from "react-bootstrap";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Lock, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import axios from "axios";
import "../styles/RankProjectsPanel.css";
import { validateRationale } from "../utils/validation";

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

const RankProjectsPanel = ({ show, projects, onLockRankings, businessId, onRankSaved, isAdmin, isRankingLocked }) => {
  const { t } = useTranslation();
  const [projectList, setProjectList] = useState([]);
  const [initialOrder, setInitialOrder] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [showRationaleModal, setShowRationaleModal] = useState(false);
  const [pendingDragResult, setPendingDragResult] = useState(null);
  const [tempRationale, setTempRationale] = useState("");
  const [movedProjectName, setMovedProjectName] = useState("");
  const [rationaleErrors, setRationaleErrors] = useState({});

  useEffect(() => {
    if (!projects || projects.length === 0) return;

    const sorted = [...projects].sort((a, b) => {
      const rankA = a.rank ?? Infinity;
      const rankB = b.rank ?? Infinity;
      return rankA - rankB;
    }).map(project => ({
      ...project,
      rationale: project.rationale || project.rationals || ""
    }));
    setProjectList(sorted);
    setInitialOrder(sorted.map(p => p._id));
  }, [projects]);

  if (!show) return null;

  const hasPositionChanged = (projectId, currentIndex) => {
    const initialIndex = initialOrder.indexOf(projectId);
    return initialIndex !== -1 && initialIndex !== currentIndex;
  };

  const validateRankings = () => {
    const missingRationales = [];

    projectList.forEach((project, index) => {
      if (hasPositionChanged(project._id, index)) {
        const validation = validateRationale(project.rationale);
        if (!validation.isValid) {
          missingRationales.push(`${project.project_name}: ${validation.error}`);
        }
      }
    });

    return missingRationales;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    if (isRankingLocked && !isAdmin) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const movedProject = projectList[sourceIndex];
    const movedProjectId = movedProject._id;
    const initialIndex = initialOrder.indexOf(movedProjectId);

    const willChangePosition = initialIndex !== destIndex;

    if (willChangePosition && movedProject.rationale && movedProject.rationale.trim() !== "") {
      const validation = validateRationale(movedProject.rationale);

      if (!validation.isValid) {
        alert(`Cannot move project: ${validation.error}\n\nPlease fix the rationale before moving this project.`);
        return;
      }

      applyDragResult(result, movedProject.rationale);
      return;
    }

    if (willChangePosition) {
      setPendingDragResult(result);
      setMovedProjectName(movedProject.project_name);
      setTempRationale(movedProject.rationale || "");
      setShowRationaleModal(true);
      return;
    }

    applyDragResult(result);
  };

  const applyDragResult = (result, rationale = null) => {
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    const items = Array.from(projectList);
    const [moved] = items.splice(sourceIndex, 1);

    if (rationale !== null) {
      moved.rationale = rationale;
    }

    items.splice(destIndex, 0, moved);

    if (rationale !== null && rationale.trim() !== "") {
      const movedProjectName = moved.project_name;
      const autoRationale = `Order changed due to "${movedProjectName}" being repositioned. ${rationale}`;

      const startIdx = Math.min(sourceIndex, destIndex);
      const endIdx = Math.max(sourceIndex, destIndex);

      items.forEach((project, index) => {
        if (project._id === moved._id) return;

        if (index >= startIdx && index <= endIdx) {
          const isAutoRationale = project.rationale && project.rationale.includes("Order changed due to");

          if (!project.rationale || project.rationale.trim() === "" || isAutoRationale) {
            project.rationale = autoRationale;
          }
        }
      });

      const newErrors = { ...rationaleErrors };
      items.forEach((project, index) => {
        if (index >= startIdx && index <= endIdx) {
          delete newErrors[project._id];
        }
      });
      setRationaleErrors(newErrors);
    }

    setProjectList(items);
    setValidationError("");
    setIsSaved(false);
  };

  const handleRationaleSubmit = () => {
    const validation = validateRationale(tempRationale);

    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    applyDragResult(pendingDragResult, tempRationale);
    setShowRationaleModal(false);
    setPendingDragResult(null);
    setTempRationale("");
    setMovedProjectName("");
  };

  const handleRationaleCancel = () => {
    setShowRationaleModal(false);
    setPendingDragResult(null);
    setTempRationale("");
    setMovedProjectName("");
  };

  const handleRationaleTextareaChange = (index, value) => {
    const updated = [...projectList];
    updated[index] = {
      ...updated[index],
      rationale: value
    };
    setProjectList(updated);
    setValidationError("");

    const project = updated[index];
    const validation = validateRationale(value);
    const newErrors = { ...rationaleErrors };

    if (value.trim() !== "" && !validation.isValid) {
      newErrors[project._id] = validation.error;
    } else {
      delete newErrors[project._id];
    }

    setRationaleErrors(newErrors);
  };

  const handleRationaleBlur = (index) => {
    const project = projectList[index];
    const positionChanged = hasPositionChanged(project._id, index);

    if (!positionChanged) return;

    const validation = validateRationale(project.rationale);

    if (validation.isValid && project.rationale.trim() !== "") {
      const items = [...projectList];
      const currentProject = items[index];
      const movedProjectName = currentProject.project_name;
      const autoRationale = `Order changed due to "${movedProjectName}" being repositioned. ${currentProject.rationale}`;

      const initialIndex = initialOrder.indexOf(currentProject._id);
      const startIdx = Math.min(initialIndex, index);
      const endIdx = Math.max(initialIndex, index);

      items.forEach((proj, idx) => {
        if (proj._id === currentProject._id) return;

        if (idx >= startIdx && idx <= endIdx) {
          const isAutoRationale = proj.rationale && proj.rationale.includes("Order changed due to");

          if (!proj.rationale || proj.rationale.trim() === "" || isAutoRationale) {
            proj.rationale = autoRationale;
          }
        }
      });

      setProjectList(items);

      const newErrors = { ...rationaleErrors };
      delete newErrors[project._id];
      setRationaleErrors(newErrors);
    }
  };

  const handleSaveRankings = async () => {
    const missingRationales = validateRankings();

    if (missingRationales.length > 0) {
      const errorMsg = `Please fix rationale issues:\n${missingRationales.join("\n")}`;
      setValidationError(errorMsg);
      alert(errorMsg);
      return;
    }

    try {
      const token = sessionStorage.getItem("token");

      const payload = {
        business_id: businessId,
        projects: projectList.map((p, index) => {
          return {
            project_id: p._id,
            rank: index + 1,
            rationals: p.rationale || ""
          };
        })
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
      setIsSaved(true);
      setValidationError("");

      setInitialOrder(projectList.map(p => p._id));

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
        Drag projects to reorder. <strong>Rationale is required</strong> for any project you move.
      </p>

      {/* Validation Error Alert */}
      {validationError && (
        <Alert variant="danger" dismissible onClose={() => setValidationError("")} className="mt-3">
          <div className="d-flex align-items-center gap-2">
            <AlertTriangle size={18} />
            <span>{validationError}</span>
          </div>
        </Alert>
      )}

      {/* ---------- DRAG & DROP ---------- */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="rank-projects">
          {(provided) => (
            <Accordion
              alwaysOpen
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {projectList.map((item, index) => {
                const positionChanged = hasPositionChanged(item._id, index);
                const validation = validateRationale(item.rationale);
                const needsRationale = positionChanged && !validation.isValid;
                const errorMessage = rationaleErrors[item._id] || "";

                return (
                  <Draggable
                    key={item._id}
                    draggableId={item._id}
                    index={index}
                    isDragDisabled={isRankingLocked && !isAdmin}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`rank-project-card responsive-card ${snapshot.isDragging ? "dragging" : ""
                          } ${needsRationale ? "needs-rationale" : ""}`}
                      >
                        <Card.Body>
                          {/* ---------- TOP ---------- */}
                          <div className="rank-card-top responsive-card-top">
                            <div className="rank-number">{index + 1}</div>

                            <div className="rank-content">
                              <div className="d-flex align-items-center gap-2">
                                <h5 className="rank-project-title mb-0">
                                  {item.project_name}
                                </h5>
                                {needsRationale && (
                                  <AlertTriangle size={16} color="#dc3545" title="Rationale required" />
                                )}
                              </div>
                              <p className="rank-project-desc">
                                {item.description}
                              </p>
                            </div>

                            <div
                              className="rank-move-buttons responsive-move-buttons"
                              style={{ cursor: isRankingLocked && !isAdmin ? "not-allowed" : "grab" }}
                            >
                              <ChevronUp size={18} />
                              <ChevronDown size={18} />
                            </div>
                          </div>

                          {/* ---------- RATIONALE ---------- */}
                          <div className="rank-rationale-btn-container responsive-rationale-btn">
                            <RationaleToggle eventKey={index.toString()}>
                              {positionChanged ? (
                                <span style={{ color: needsRationale ? "#dc3545" : "#28a745" }}>
                                  {validation.isValid ? "Edit Rationale ▼" : "⚠️ Add Rationale (Required) ▼"}
                                </span>
                              ) : (
                                "Add Rationale ▼"
                              )}
                            </RationaleToggle>
                          </div>

                          <Accordion.Collapse eventKey={index.toString()}>
                            <div>
                              <textarea
                                className={`rank-rationale-textarea responsive-textarea ${errorMessage ? "border-danger" : ""
                                  }`}
                                placeholder={
                                  positionChanged
                                    ? "Required: Why did you rank this project here?"
                                    : "Why did you rank this project here?"
                                }
                                value={item.rationale || ""}
                                onChange={(e) => handleRationaleTextareaChange(index, e.target.value)}
                                onBlur={() => handleRationaleBlur(index)}
                              />
                              {errorMessage && (
                                <small className="text-danger d-block mt-1">
                                  ⚠️ {errorMessage}
                                </small>
                              )}
                            </div>
                          </Accordion.Collapse>
                        </Card.Body>
                      </Card>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </Accordion>
          )}
        </Droppable>
      </DragDropContext>

      {/* ---------- RATIONALE MODAL ---------- */}
      <Modal
        show={showRationaleModal}
        onHide={handleRationaleCancel}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header>
          <Modal.Title>
            <div className="d-flex align-items-center gap-2">
              <AlertTriangle size={20} color="#ff9500" />
              Rationale Required
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            You're moving <strong>{movedProjectName}</strong> to a new position.
          </p>
          <p className="mb-3 text-muted">
            Please explain why you're ranking this project at this position:
          </p>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="e.g., This project has higher business impact and should be prioritized..."
              value={tempRationale}
              onChange={(e) => setTempRationale(e.target.value)}
              autoFocus
            />
          </Form.Group>
          {pendingDragResult && (
            <div className="mt-3">
              <small className="text-info">
                ℹ️ This rationale will be automatically applied to all other projects affected by this change.
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleRationaleCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRationaleSubmit}
            disabled={!tempRationale || tempRationale.trim() === ""}
          >
            Confirm Ranking
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RankProjectsPanel;