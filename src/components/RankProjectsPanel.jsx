import React, { useState, useEffect, useMemo } from "react";
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
import { callMLRankingAPI } from "../services/aiRankingService";
import { Checkbox } from "lucide-react"; // Import Checkbox icon if needed or use native

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

const RankProjectsPanel = ({ show, projects, onLockRankings, businessId, onRankSaved, isAdmin, isRankingLocked, businessStatus, userHasRerankAccess, onShowToast, isArchived }) => {
  const { t } = useTranslation();
  const [projectList, setProjectList] = useState([]);
  const [initialOrder, setInitialOrder] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasEverSaved, setHasEverSaved] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [showRationaleModal, setShowRationaleModal] = useState(false);
  const [pendingDragResult, setPendingDragResult] = useState(null);
  const [tempRationale, setTempRationale] = useState("");
  const [movedProjectName, setMovedProjectName] = useState("");
  const [step, setStep] = useState(1); // 1: Selection, 2: Ranking
  const [selectedDraftIds, setSelectedDraftIds] = useState([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [rationaleErrors, setRationaleErrors] = useState({});
  const [initialAllRanked, setInitialAllRanked] = useState(false);

  useEffect(() => {
    if (!projects || projects.length === 0) return;

    if (!isAdmin) {
      console.log(projects)
      // For collaborators, we show projects that have an AI rank OR are targeted for launch (launched/pending)
      // and are not killed.
      const mandatoryProjects = projects.filter(p =>
        ((p.ai_rank !== null && p.ai_rank !== undefined) ||
          p.launch_status?.toLowerCase() === 'launched' ||
          p.launch_status?.toLowerCase() === 'pending_launch') &&
        p.status?.toLowerCase() !== 'killed'
      );

      const sortedMandatory = [...mandatoryProjects].sort((a, b) => {
        // Primary: use 'rank' (manual ranking)
        // Secondary: use 'ai_rank' (AI suggested ranking)
        const rankA = (a.rank !== null && a.rank !== undefined) ? a.rank :
          ((a.ai_rank !== null && a.ai_rank !== undefined) ? a.ai_rank : Infinity);
        const rankB = (b.rank !== null && b.rank !== undefined) ? b.rank :
          ((b.ai_rank !== null && b.ai_rank !== undefined) ? b.ai_rank : Infinity);

        if (rankA !== rankB) return rankA - rankB;
        return new Date(b.updated_at) - new Date(a.updated_at);
      });

      setProjectList(sortedMandatory.map(p => ({
        ...p,
        rationale: p.rationale || p.rationals || "",
        description: p.description || p.project_description || ""
      })));
      setInitialOrder(sortedMandatory.map(p => p._id));
      setStep(2);
      return;
    }

    // Filter projects by launch_status: launched/pending_launch = mandatory, unlaunched/draft = optional
    const active = projects.filter(p =>
      (p.launch_status?.toLowerCase() === 'launched' ||
        p.launch_status?.toLowerCase() === 'pending_launch') &&
      p.status?.toLowerCase() === 'active' // Only show Active status projects
    );
    const draft = projects.filter(p =>
      !p.launch_status ||
      (p.launch_status?.toLowerCase() !== 'launched' && p.launch_status?.toLowerCase() !== 'pending_launch')
    );

    // For step 2, we use whatever is selected (excluding killed projects)
    if (step === 2) {
      const selectedProjects = projects.filter(p =>
        (p.launch_status?.toLowerCase() === 'launched' ||
          p.launch_status?.toLowerCase() === 'pending_launch' ||
          selectedDraftIds.includes(p._id)) &&
        p.status?.toLowerCase() !== 'killed' // Exclude killed projects
      );

      const sorted = [...selectedProjects].sort((a, b) => {
        // Primary: use 'rank' (manual ranking)
        // Secondary: use 'ai_rank' (AI suggested ranking)
        const rankA = (a.rank !== null && a.rank !== undefined) ? a.rank :
          ((a.ai_rank !== null && a.ai_rank !== undefined) ? a.ai_rank : Infinity);
        const rankB = (b.rank !== null && b.rank !== undefined) ? b.rank :
          ((b.ai_rank !== null && b.ai_rank !== undefined) ? b.ai_rank : Infinity);

        if (rankA !== rankB) return rankA - rankB;
        return new Date(b.updated_at) - new Date(a.updated_at);
      });

      setProjectList(sorted.map(p => ({
        ...p,
        rationale: p.rationale || p.rationals || "",
        description: p.description || p.project_description || ""
      })));
      setInitialOrder(sorted.map(p => p._id));
    }
  }, [projects, step, selectedDraftIds, isAdmin]);

  const activeProjects = useMemo(() => projects.filter(p =>
    p.launch_status?.toLowerCase() === 'launched' ||
    p.status?.toLowerCase() !== 'killed' && // Exclude killed projects
    p.status?.toLowerCase() === 'active' // Only show Active status projects
  ), [projects]);
  const draftProjects = useMemo(() => projects.filter(p =>
    (!p.launch_status ||
      (p.launch_status?.toLowerCase() !== 'launched' && p.launch_status?.toLowerCase() !== 'pending_launch') ||
      p.status?.toLowerCase() === 'draft') &&
    p.status?.toLowerCase() !== 'killed' // Exclude killed projects
  ), [projects]);

  useEffect(() => {
    if (projects && projects.length > 0 && step === 1) {
      const rankedDraftIds = projects
        .filter(p => (p.launch_status?.toLowerCase() !== 'launched' || p.status?.toLowerCase() === 'draft') && p.rank !== null && p.rank !== undefined)
        .map(p => p._id);

      const unrankedDrafts = projects.filter(p =>
        (!p.launch_status || (p.launch_status?.toLowerCase() !== 'launched' && p.launch_status?.toLowerCase() !== 'pending_launch') || p.status?.toLowerCase() === 'draft') &&
        p.status?.toLowerCase() !== 'killed' &&
        (p.rank === null || p.rank === undefined)
      );

      // Check if ALL potential projects are ranked
      const allRanked = unrankedDrafts.length === 0;
      setInitialAllRanked(allRanked);

      // Initialize selectedDraftIds if not already set
      if (selectedDraftIds.length === 0 && rankedDraftIds.length > 0) {
        setSelectedDraftIds(rankedDraftIds);
      }

      // Jump to Step 2 for Admin ONLY if all projects are already ranked
      if (isAdmin && allRanked) {
        if (selectedDraftIds.length === 0 && rankedDraftIds.length > 0) {
          setSelectedDraftIds(rankedDraftIds);
        }
        setStep(2);
      }
    }
  }, [projects, step, isAdmin]); // Run when projects, step, or role changes

  const handleToggleDraft = (projectId) => {
    setSelectedDraftIds(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  const handleNextToRanking = async () => {
    const selectedProjects = [...activeProjects, ...draftProjects.filter(p => selectedDraftIds.includes(p._id))];

    if (selectedProjects.length === 0) {
      onShowToast("Please select at least one project", "warning");
      return;
    }

    setIsGeneratingAI(true);
    try {
      // Deduplicate projects by ID before sending to ML API
      const uniqueProjects = selectedProjects.filter((project, index, self) =>
        index === self.findIndex(p => p._id === project._id)
      );

      const { success, rankings } = await callMLRankingAPI(uniqueProjects);
      if (success) {
        // Map rankings back to projects
        const rankedList = uniqueProjects.map(p => {
          const r = rankings.find(rankItem => rankItem.project_id === p._id);
          return {
            ...p,
            rank: r ? r.rank : Infinity,
            rationale: "", // Reset rationale for new AI-suggested order
            description: p.description || p.project_description || ""
          };
        }).sort((a, b) => a.rank - b.rank);

        // Persist AI rankings to backend so collaborators can see them
        const validRankings = rankedList
          .filter(p => p.rank !== Infinity && p.rank !== null && p.rank !== undefined)
          .map(p => ({
            project_id: p._id,
            rank: p.rank
          }));

        if (validRankings.length > 0) {
          const aiPayload = {
            business_id: businessId,
            ai_rankings: validRankings,
            model_version: "v1.0"
          };
          const token = sessionStorage.getItem("token");
          await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/projects/ai-rankings`, aiPayload, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        setProjectList(rankedList);
        setInitialOrder(rankedList.map(p => p._id));
        setStep(2);
      }
    } catch (err) {
      onShowToast("ML ranking service failed. Proceeding with manual ranking.", "warning");
      setProjectList(selectedProjects.map(p => ({
        ...p,
        rationale: "",
        description: p.description || p.project_description || ""
      })));
      setInitialOrder(selectedProjects.map(p => p._id));
      setStep(2);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (!show) return null;

  const hasPositionChanged = (projectId, currentIndex) => {
    const initialIndex = initialOrder.indexOf(projectId);
    return initialIndex !== -1 && initialIndex !== currentIndex;
  };

  const hasRankingsChanged = () => {
    if (projectList.length !== initialOrder.length) return true;

    return projectList.some((project, index) => {
      return initialOrder[index] !== project._id;
    });
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
    const isRestrictedState = businessStatus === "launched" || businessStatus === "reprioritizing";
    if (!isAdmin && (isRankingLocked || (isRestrictedState && !userHasRerankAccess))) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const movedProject = projectList[sourceIndex];
    const movedProjectId = movedProject._id;
    const initialIndex = initialOrder.indexOf(movedProjectId);

    const willChangePosition = initialIndex !== destIndex;

    // Check if the rationale is auto-generated
    const isAutoRationale = movedProject.rationale && movedProject.rationale.includes("Order changed due to");

    if (willChangePosition && movedProject.rationale && movedProject.rationale.trim() !== "" && !isAutoRationale) {
      const validation = validateRationale(movedProject.rationale);

      if (!validation.isValid) {
        onShowToast(`Cannot move project: ${validation.error}\n\nPlease fix the rationale before moving this project.`, "error");
        return;
      }

      applyDragResult(result, movedProject.rationale);
      return;
    }

    if (willChangePosition) {
      setPendingDragResult(result);
      setMovedProjectName(movedProject.project_name);
      // Clear auto-generated rationale from the modal, require user to enter new one
      setTempRationale(isAutoRationale ? "" : (movedProject.rationale || ""));
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
      const autoRationale = `Order changed due to "${movedProjectName}" being repositioned.Rationale: <strong>"${rationale}"</strong>`;

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
      onShowToast(validation.error, "error");
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
      const autoRationale = `Order changed due to "${movedProjectName}" being repositioned. Rationale: <strong>"${currentProject.rationale}"</strong>`;

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
    // Only check if rankings have changed if user has already saved in this session
    if (hasEverSaved && !hasRankingsChanged()) {
      onShowToast("No changes detected. Please reorder projects before saving.", "warning");
      return;
    }

    const missingRationales = validateRankings();

    if (missingRationales.length > 0) {
      const errorMsg = `Please fix rationale issues:\n${missingRationales.join("\n")}`;
      setValidationError(errorMsg);
      onShowToast(errorMsg, "error");
      return;
    }

    setIsSaving(true);

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

      onShowToast("Rankings saved successfully", "success");
      setIsSaved(true);
      setHasEverSaved(true);
      setValidationError("");

      setInitialOrder(projectList.map(p => p._id));

      if (onRankSaved) {
        onRankSaved();
      }
    } catch (err) {
      console.error("Save rankings failed", err);
      const errorMsg = err.response?.data?.error || "Failed to save rankings";
      onShowToast(errorMsg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLockRankings = () => {
    if (!isSaved) {
      onShowToast("Please save your rankings before locking.", "warning");
      return;
    }
    setIsLocked(true);
    localStorage.setItem(`rankingLocked_${businessId}`, "true");
    if (onLockRankings) {
      onLockRankings();
    }
  };

  const handleSaveAndClose = async () => {
    await handleSaveRankings();
    // No explicit close here, as onRankSaved might be used by parent to close.
    // However, the user said "collapse the rank projects view", so I'll ensure parent is notified.
  };

  const renderStep1 = () => (
    <div className="rank-step-selection">
      <h6 className="mb-3 text-primary">{t("Mandatory Projects")}</h6>
      <div className="selection-list mb-4">
        {activeProjects.map(p => (
          <div key={p._id} className="selection-item mandatory">
            <Form.Check
              type="checkbox"
              checked={true}
              disabled={true}
              label={p.project_name}
            />
          </div>
        ))}
        {activeProjects.length === 0 && <p className="text-muted small">{t("No active projects found.")}</p>}
      </div>

      <h6 className="mb-3 text-secondary">{t("Unlaunched/Draft Projects (Optional)")}</h6>
      <div className="selection-list mb-4">
        {draftProjects.map(p => (
          <div key={p._id} className="selection-item">
            <Form.Check
              type="checkbox"
              id={`draft-${p._id}`}
              checked={selectedDraftIds.includes(p._id)}
              onChange={() => handleToggleDraft(p._id)}
              label={p.project_name}
              disabled={isArchived}
            />
          </div>
        ))}
        {draftProjects.length === 0 && <p className="text-muted small">{t("No draft projects found.")}</p>}
      </div>

    </div>
  );

  const renderStep2 = () => (
    <>
      <div className={`d-flex ${isAdmin && !initialAllRanked ? "justify-content-between" : "justify-content-end"} align-items-center mb-3`}>
        {isAdmin && !initialAllRanked && (
          <Button variant="outline-secondary" size="sm" onClick={() => setStep(1)}>
            ← {t("Back to Selection")}
          </Button>
        )}
        <p className="rank-description mb-0">
          {t("Drag projects to reorder. AI suggested an initial order.")}
        </p>
      </div>

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
              {projectList.length === 0 ? (
                <div className="text-center py-5 text-muted border rounded bg-light">
                  <p className="mb-0">{t("No projects have been prioritized for ranking by the admin yet.")}</p>
                </div>
              ) : (
                projectList.map((item, index) => {
                  const positionChanged = hasPositionChanged(item._id, index);
                  const validation = validateRationale(item.rationale);
                  const needsRationale = positionChanged && !validation.isValid;
                  const errorMessage = rationaleErrors[item._id] || "";

                  return (
                    <Draggable
                      key={item._id}
                      draggableId={item._id}
                      index={index}
                      isDragDisabled={(isRankingLocked && !isAdmin) || isArchived || (!isAdmin && (businessStatus === "launched" || businessStatus === "reprioritizing") && !userHasRerankAccess)}
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
                                  {item.description || item.project_description || "No description provided"}
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
                                {item.rationale && item.rationale.trim() !== "" ? (
                                  positionChanged ? (
                                    <span style={{ color: needsRationale ? "#dc3545" : "#28a745" }}>
                                      {validation.isValid ? t("Edit Rationale ▼") : t("⚠️ Edit Rationale (Invalid) ▼")}
                                    </span>
                                  ) : (
                                    <span style={{ color: "#28a745" }}>
                                      {t("Edit Rationale ▼")}
                                    </span>
                                  )
                                ) : (
                                  positionChanged ? (
                                    <span style={{ color: "#dc3545" }}>
                                      ⚠️ {t("Add Rationale (Required) ▼")}
                                    </span>
                                  ) : (
                                    t("Add Rationale ▼")
                                  )
                                )}
                              </RationaleToggle>
                            </div>

                            <Accordion.Collapse eventKey={index.toString()}>
                              <div className="mt-2">
                                {item.rationale && item.rationale.includes("<strong>") ? (
                                  <div
                                    className="rank-rationale-display responsive-textarea"
                                    dangerouslySetInnerHTML={{ __html: item.rationale }}
                                    style={{
                                      padding: "10px",
                                      border: "1px solid #dee2e6",
                                      borderRadius: "4px",
                                      backgroundColor: "#f8f9fa",
                                      minHeight: "80px",
                                      whiteSpace: "pre-wrap"
                                    }}
                                  />
                                ) : (
                                  <textarea
                                    className={`rank-rationale-textarea responsive-textarea ${errorMessage ? "border-danger" : ""}`}
                                    placeholder={
                                      positionChanged
                                        ? t("Required: Why did you rank this project here?")
                                        : t("Why did you rank this project here?")
                                    }
                                    value={item.rationale || ""}
                                    onChange={(e) => handleRationaleTextareaChange(index, e.target.value)}
                                    onBlur={() => handleRationaleBlur(index)}
                                    readOnly={isArchived}
                                    style={isArchived ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                                  />
                                )}
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
                })
              )}
              {provided.placeholder}
            </Accordion>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );

  return (
    <div className="rank-panel-container responsive-panel compact-mode" >

      <Row className="rank-panel-header responsive-header align-items-center">
        <Col xs={12} md={8} className="d-flex align-items-center gap-3">
          <h5 className="rank-title">{t("Rank_Your_Projects")}</h5>
        </Col>

        <Col
          xs={12}
          md={4}
          className="rank-header-buttons responsive-btn-group d-flex justify-content-md-end justify-content-start mt-md-0 mt-3"
        >
          {step === 1 && isAdmin && (
            <Button
              variant="primary"
              className="responsive-btn w-100-mobile"
              onClick={handleNextToRanking}
              disabled={isGeneratingAI || isArchived}
            >
              {isGeneratingAI ? t("Fetching AI Rankings...") : t("Next: Rank Projects")}
            </Button>
          )}
          {step === 2 && (isAdmin || (!isRankingLocked && (!(businessStatus === "launched" || businessStatus === "reprioritizing") || userHasRerankAccess))) && (
            <Button
              className="btn-save-rank responsive-btn w-100-mobile"
              onClick={handleSaveRankings}
              disabled={isSaving || (isSaved && !hasRankingsChanged()) || isArchived}
            >
              {isSaving ? "Saving..." : t("Save_Rankings")}
            </Button>
          )}
          {/* Lock Rankings removed - saving is final */}
        </Col>
      </Row>

      <div className="rank-panel-body">
        {step === 1 && isAdmin ? renderStep1() : renderStep2()}
      </div>

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
              <AlertTriangle size={20} color="rgb(26, 115, 232)" />
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