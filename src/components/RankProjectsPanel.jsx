import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore, useBusinessStore, useUIStore, useProjectStore } from "../store";
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
import ConfirmationModal from "./ConfirmationModal";
import { Checkbox } from "lucide-react"; 

/* ---------- PROJECT FILTERING HELPERS ---------- */
const isLaunched = (p) => {
  const ls = p?.launch_status?.toLowerCase();
  return ls === 'launched' || ls === 'pending_launch';
};

const isActiveStatus = (p) => {
  const s = p?.status?.toLowerCase();
  return ["active", "at risk", "paused"].includes(s);
};

const isTerminalStatus = (p) => {
  const s = p?.status?.toLowerCase();
  return ["killed", "completed", "scaled"].includes(s);
};

const isKilled = (p) => p?.status?.toLowerCase() === 'killed';

// Projects that are "live" or in active development (Active, Launched, etc.)
// Projects that MUST be in the ranking list (Step 2)
const isMandatoryOrActive = (p) => 
  (isLaunched(p) || isActiveStatus(p)) && 
  !isTerminalStatus(p);

// Projects that MUST be ranked (Collaborators see AI ranked ones too and any admin-ranked ones)
const isMandatoryForCollaborator = (p) =>
  ((p.ai_rank !== null && p.ai_rank !== undefined) || p.is_admin_ranked || isLaunched(p) || isActiveStatus(p)) &&
  !isTerminalStatus(p);

// Projects that are considered "Draft" or "Unlaunched"
const isDraftProject = (p) => !isLaunched(p) && !isActiveStatus(p) && !isTerminalStatus(p);

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

const RankProjectsPanel = ({ show, projects, onLockRankings, onRankSaved, isAdmin, isRankingLocked, businessStatus, userHasRerankAccess, userHasRankingAccess, onShowToast, isArchived, userHasLockedRanking }) => {
  const { selectedBusinessId: businessId } = useBusinessStore();
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
  const [initialSelectedDraftIds, setInitialSelectedDraftIds] = useState([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [rationaleErrors, setRationaleErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [initialAllRanked, setInitialAllRanked] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (userHasLockedRanking) {
      setHasEverSaved(true);
      setIsSaved(true);
    } else {
      setHasEverSaved(false);
      setIsSaved(false);
    }
  }, [userHasLockedRanking]);

  useEffect(() => {
    if (!projects || projects.length === 0) return;

    // 1. INITIALIZATION (Run once when projects are first available)
    if (!hasInitialized.current) {
      if (isAdmin) {
        const initialRankedIds = projects
          .filter(p => !isLaunched(p) && p.rank !== null && p.rank !== undefined)
          .map(p => p._id);
        
        setSelectedDraftIds(initialRankedIds);

        // Check if all eligible projects are ranked to decide initial step
        const allEligible = projects.filter(p => !isKilled(p));
        const unranked = allEligible.filter(p => 
          (isMandatoryOrActive(p) || initialRankedIds.includes(p._id)) && 
          (p.rank === null || p.rank === undefined)
        );
        const allRanked = unranked.length === 0 && allEligible.length > 0;
        
        setInitialAllRanked(allRanked);
      } else {
        // Collaborators always start on Step 2
        setStep(2);
      }
      hasInitialized.current = true;
    }

    // 2. PROJECT LIST CALCULATION (Sync Step 2 ranking list)
    // Only recalc Step 2 list when on step 2 (for Admin) or always for Collaborators
    if (step === 2 || !isAdmin) {
      const listToShow = isAdmin 
        ? projects.filter(p => (isMandatoryOrActive(p) || selectedDraftIds.includes(p._id)) && !isTerminalStatus(p))
        : projects.filter(isMandatoryForCollaborator);

      const sorted = [...listToShow].sort((a, b) => {
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

  const activeProjects = useMemo(() => projects.filter(isMandatoryOrActive), [projects]);

  const draftProjects = useMemo(() => projects.filter(isDraftProject), [projects]);
  
  // Projects that have a manual rank set (drafts specifically)
  const rankedDraftIds = useMemo(() => projects
    .filter(p => !isLaunched(p) && p.rank !== null && p.rank !== undefined)
    .map(p => p._id), 
  [projects]);

  const hasSelectionChanged = useMemo(() => {
    if (selectedDraftIds.length !== rankedDraftIds.length) return true;
    const sortedSelected = [...selectedDraftIds].sort();
    const sortedRanked = [...rankedDraftIds].sort();
    return sortedSelected.some((id, idx) => id !== sortedRanked[idx]);
  }, [selectedDraftIds, rankedDraftIds]);

  const isFullyRanked = useMemo(() => {
    // Check if everything selected (Mandatory + Selected Drafts) has a rank
    const selectedProjects = [...activeProjects, ...draftProjects.filter(p => selectedDraftIds.includes(p._id))];
    const unranked = selectedProjects.filter(p => p.rank === null || p.rank === undefined);
    return unranked.length === 0 && selectedProjects.length > 0;
  }, [activeProjects, draftProjects, selectedDraftIds]);



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

      const { callMLRankingAPI, saveAIRankings, fetchTeamRankings } = useProjectStore.getState();
      const { success, rankings } = await callMLRankingAPI(uniqueProjects);

      if (success && rankings && rankings.length > 0) {
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
          await saveAIRankings(businessId, validRankings);
          // Refresh background data, but don't wait for UI update
          fetchTeamRankings(businessId, { silent: true });
        }

        onShowToast(t("AI suggested an initial order based on your strategy and insights."), "success");
        setProjectList(rankedList);
        setInitialOrder(rankedList.map(p => p._id));
        setStep(2);
      } else {
        // Fallback if AI succeeds but returns no results
        throw new Error("No AI rankings returned");
      }
    } catch (err) {
      console.error("AI Ranking Error:", err);
      // If AI ranking fails, do not proceed to step 2
      onShowToast("ai ranking api is failed", "error");
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
    if (!isAdmin && !userHasRerankAccess && !userHasRankingAccess) return;

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
      const { saveRankings } = useProjectStore.getState();
      const rankingPayload = projectList.map((p, index) => ({
        project_id: p._id,
        rank: index + 1,
        rationals: p.rationale || ""
      }));

      const result = await saveRankings(businessId, rankingPayload);
      if (!result.success) throw new Error(result.error);

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
    useUIStore.getState().setBusinessSetting(businessId, 'rankingLocked', true);
    if (onLockRankings) {
      onLockRankings();
    }
  };

  const handleSaveAndClose = () => {
    // Only show confirmation if there are actually changes to save or it's the first save
    if (hasRankingsChanged() || !hasEverSaved) {
      setShowConfirmModal(true);
    } else {
      handleSaveRankings();
    }
  };

  const renderStep1 = () => (
    <div className="rank-step-selection">
      <h6 className="mb-3 text-primary">{t("Launched Projects (Mandatory Projects)")}</h6>
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
          <div
            key={p._id}
            className="selection-item clickable-row"
            onClick={() => !isArchived && !isGeneratingAI && handleToggleDraft(p._id)}
            style={{ cursor: (isArchived || isGeneratingAI) ? "not-allowed" : "pointer" }}
          >
            <Form.Check
              type="checkbox"
              id={`draft-${p._id}`}
              checked={selectedDraftIds.includes(p._id)}
              onChange={() => !isGeneratingAI && handleToggleDraft(p._id)}
              onClick={(e) => e.stopPropagation()}
              label={p.project_name}
              disabled={isArchived || isGeneratingAI}
            />
          </div>
        ))}
        {draftProjects.length === 0 && <p className="text-muted small">{t("No draft projects found.")}</p>}
      </div>

    </div>
  );

  const renderStep2 = () => (
    <>
      {projectList.length > 0 && (
        <div className={`d-flex ${isAdmin && !initialAllRanked ? "justify-content-end" : "justify-content-end"} align-items-center mb-3`}>
          <p className="rank-description mb-0">
            {t("Drag projects to reorder. AI suggested an initial order.")}
          </p>
        </div>
      )}

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
                      isDragDisabled={isArchived || (!isAdmin && !userHasRerankAccess && !userHasRankingAccess)}
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
                                style={{ cursor: (!isAdmin && !userHasRerankAccess && !userHasRankingAccess) ? "not-allowed" : "grab" }}
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
              disabled={isGeneratingAI || isArchived || !hasSelectionChanged}
            >
              {isGeneratingAI ? t("Fetching AI Rankings...") : t("Next: Rank Projects")}
            </Button>
          )}
          {step === 2 && isAdmin && !initialAllRanked && (
            <Button
              variant="outline-secondary"
              className="responsive-btn w-100-mobile"
              onClick={() => setStep(1)}
            >
              ← {t("Back to Selection")}
            </Button>
          )}
          {step === 2 && (isAdmin || userHasRankingAccess || userHasRerankAccess) && projectList.length > 0 && (
            <Button
              variant="primary"
              className="btn-save-rank responsive-btn w-100-mobile"
              onClick={handleSaveAndClose}
              disabled={isSaving || (isSaved && !hasRankingsChanged() && !userHasRerankAccess && !userHasRankingAccess) || isArchived}
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
              {t("rationale_required")}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            {t("moving_project_position", { project: movedProjectName })}
          </p>
          <p className="mb-3 text-muted">
            {t("explain_project_ranking")}
          </p>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder={t("project_rationale_placeholder")}
              value={tempRationale}
              onChange={(e) => setTempRationale(e.target.value)}
              autoFocus
            />
          </Form.Group>
          {pendingDragResult && (
            <div className="mt-3">
              <small className="text-info">
                ℹ️ {t("rationale_auto_applied")}
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleRationaleCancel}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleRationaleSubmit}
            disabled={!tempRationale || tempRationale.trim() === ""}
          >
            {t("confirm_ranking")}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={handleSaveRankings}
        title={t("Save Rankings?")}
        message={t("Are you sure you want to save these rankings? This will update the project order for all team members.")}
        confirmVariant="primary"
        confirmText={t("Save")}
      />
    </div>
  );
};

export default RankProjectsPanel;