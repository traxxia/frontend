import React, { useState, useEffect } from "react";
import { Accordion, Table, Badge, Spinner, Form, Collapse, Card } from "react-bootstrap";
import { Users, Sparkles, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { fetchConsensusAnalysis, fetchCollaboratorConsensus } from "../services/consensusService";

const TeamRankingsView = ({
  activeAccordionKey,
  onAccordionSelect,
  isSuperAdmin,
  user,
  sortedProjects,
  rankMap,
  adminRankMap,
  userRole,
  businessId,
}) => {
  const { t } = useTranslation();

  const [consensusData, setConsensusData] = useState({});
  const [loadingConsensus, setLoadingConsensus] = useState(false);
  const [consensusSummary, setConsensusSummary] = useState(null);
  const [consensusMode, setConsensusMode] = useState("ai");
  const [expandedRows, setExpandedRows] = useState(new Set());

  const hasAIRankings = sortedProjects.some(
    (p) => p.ai_rank !== undefined && p.ai_rank !== null
  );

  useEffect(() => {
    if (activeAccordionKey === "0" && businessId) {
      loadConsensusData();
    }
  }, [activeAccordionKey, businessId, consensusMode]);

  const loadConsensusData = async () => {
    if (!businessId) return;

    setLoadingConsensus(true);
    try {
      let response;

      if (consensusMode === "ai") {
        response = await fetchConsensusAnalysis(businessId);
      } else {
        response = await fetchCollaboratorConsensus(businessId);
      }

      console.log(`${consensusMode} Consensus Data:`, response);

      const consensusMap = {};
      if (response.consensus_data && Array.isArray(response.consensus_data)) {
        response.consensus_data.forEach((data) => {
          consensusMap[String(data.project_id)] = data;
        });
      }

      setConsensusData(consensusMap);
      setConsensusSummary(response.consensus_summary);
    } catch (error) {
      console.error("Failed to load consensus data:", error);
      setConsensusData({});
    } finally {
      setLoadingConsensus(false);
    }
  };

  const toggleRowExpansion = (projectId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const getConsensusColor = (consensusScore) => {
    switch (consensusScore) {
      case "green":
        return "success";
      case "yellow":
        return "warning";
      case "red":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getConsensusEmoji = (consensusScore) => {
    switch (consensusScore) {
      case "green":
        return "🟢";
      case "yellow":
        return "🟡";
      case "red":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getConsensusLabel = (level) => {
    switch (level) {
      case "high":
        return "High Agreement";
      case "medium":
        return "Medium Agreement";
      case "low":
        return "Low Agreement";
      default:
        return "No Data";
    }
  };

  // Render collaborator rankings details
  const renderCollaboratorDetails = (consensus) => {
    if (!consensus || !consensus.collaborator_rankings || consensus.collaborator_rankings.length === 0) {
      return (
        <div className="text-center text-muted py-2">
          <small>No rankings available</small>
        </div>
      );
    }

    return (
      <Card className="border-0 bg-light">
        <Card.Body className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <strong>Team Rankings Summary</strong>
            </div>
          </div>

          <Table size="sm" bordered hover className="mb-0 bg-white">
            <thead className="table-light">
              <tr>
                <th style={{ width: '30%' }}>Collaborator</th>
                <th style={{ width: '10%' }} className="text-center">Rank</th>
                <th style={{ width: '45%' }}>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {consensus.collaborator_rankings.map((collab, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: '0.9rem' }}>{collab.user_name}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <Badge bg="primary" pill>{collab.rank}</Badge>
                  </td>
                  <td>
                    {collab.rationale ? (
                      <div className="d-flex align-items-start gap-2">
                        <small className="text-muted" style={{ lineHeight: '1.4' }}>
                          {collab.rationale}
                        </small>
                      </div>
                    ) : (
                      <small className="text-muted fst-italic">No rationale provided</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="rank-list mt-4">
      <Accordion activeKey={activeAccordionKey} onSelect={onAccordionSelect}>
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <div className="d-flex flex-column">
              <div className="d-flex align-items-center gap-2">
                <Users size={18} className="text-info" />
                <strong>{t("Team_Rankings_View")}</strong>
              </div>
            </div>
          </Accordion.Header>
          <Accordion.Body>
            {hasAIRankings && consensusMode === "ai" && (
              <div className="alert alert-info d-flex align-items-center gap-2 mb-3">
                <Sparkles size={16} className="text-primary" />
                <small>
                  <strong>AI Rankings Available:</strong> Projects have been
                  analyzed and ranked by AI based on impact, effort, risk, and
                  strategic alignment.
                </small>
              </div>
            )}

            {/* Consensus Mode Toggle */}
            {isSuperAdmin && (
              <div className="d-flex align-items-center gap-3 mb-3 p-3 bg-light rounded">
                <strong>Consensus View:</strong>
                <div className="position-relative" style={{ minWidth: '320px' }}>
                  <Form.Check
                    type="switch"
                    id="consensus-mode-switch"
                    checked={consensusMode === "collaborator"}
                    onChange={(e) => {
                      setConsensusMode(e.target.checked ? "collaborator" : "ai");
                      setExpandedRows(new Set());
                    }}
                  />
                  <div
                    className="position-absolute top-50 translate-middle-y d-flex align-items-center gap-2 pointer-events-none"
                    style={{
                      left: '25px',
                      fontSize: '0.9rem',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      zIndex: 1,
                      opacity: consensusMode === "ai" ? 1 : 0.35,
                      filter: consensusMode === "ai" ? 'blur(0px)' : 'blur(1px)',
                      transform: consensusMode === "ai" ? 'scale(1)' : 'scale(0.95)'
                    }}
                  >
                    <span className={consensusMode === "ai" ? "text-dark fw-bold" : "text-muted fw-normal"}>
                      AI-Based
                    </span>
                  </div>

                  <div
                    className="position-absolute top-50 translate-middle-y d-flex align-items-center gap-2 pointer-events-none"
                    style={{
                      right: '25px',
                      fontSize: '0.9rem',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      zIndex: 1,
                      opacity: consensusMode === "collaborator" ? 1 : 0.35,
                      filter: consensusMode === "collaborator" ? 'blur(0px)' : 'blur(1px)',
                      transform: consensusMode === "collaborator" ? 'scale(1)' : 'scale(0.95)'
                    }}
                  >
                    <span className={consensusMode === "collaborator" ? "text-dark fw-bold" : "text-muted fw-normal"}>
                      Collaborator
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isSuperAdmin && consensusSummary && consensusMode === "ai" && (
              <div className="d-flex gap-4 mb-3 align-items-center">
                <span>🟢 High Agreement ({consensusSummary.high_consensus})</span>
                <span>🟡 Medium Agreement ({consensusSummary.medium_consensus})</span>
                <span>🔴 Low Agreement ({consensusSummary.low_consensus})</span>
              </div>
            )}

            {loadingConsensus && (
              <div className="text-center py-2 mb-3">
                <Spinner animation="border" size="sm" className="me-2" />
                <small>Loading consensus analysis...</small>
              </div>
            )}

            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    {consensusMode === "collaborator" && isSuperAdmin && <th style={{ width: '50px' }}></th>}
                    {consensusMode === "collaborator" && isSuperAdmin && (
                      <th className="text-center" style={{ width: '80px' }}>Rank</th>
                    )}
                    <th>{t("Project_Name")}</th>
                    {!isSuperAdmin && <th className="text-center">{user}</th>}
                    {consensusMode === "ai" && (
                      <th className="text-center" style={{ width: '150px' }}>
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <Sparkles size={14} className="text-warning" />
                          <span>AI Score</span>
                        </div>
                      </th>
                    )}
                    {isSuperAdmin && consensusMode === "ai" && (
                      <th className="text-center" style={{ width: '200px' }}>
                        <div className="d-flex flex-column align-items-center">
                          <span>Consensus</span>
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                            (AI vs Team)
                          </small>
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Sort projects by average rank in collaborator mode
                    const projectsToDisplay = consensusMode === "collaborator"
                      ? [...sortedProjects].sort((a, b) => {
                        const aConsensus = consensusData[String(a._id)];
                        const bConsensus = consensusData[String(b._id)];
                        const aAvgRank = aConsensus?.average_rank || 999;
                        const bAvgRank = bConsensus?.average_rank || 999;
                        return aAvgRank - bAvgRank;
                      })
                      : sortedProjects;

                    return projectsToDisplay.map((p, index) => {
                      const key = String(p._id);
                      const userRank = rankMap[key];
                      const aiRank = p.ai_rank;
                      const consensus = consensusData[key];
                      const isExpanded = expandedRows.has(key);
                      const hasCollaboratorData = consensus && consensus.collaborator_rankings && consensus.collaborator_rankings.length > 0;

                      return (
                        <React.Fragment key={p._id}>
                          <tr className={isExpanded ? "table-active" : ""}>
                            {consensusMode === "collaborator" && isSuperAdmin && (
                              <td className="text-center">
                                {hasCollaboratorData && (
                                  <button
                                    className="btn btn-sm btn-link p-0 text-decoration-none"
                                    onClick={() => toggleRowExpansion(key)}
                                    style={{ minWidth: '30px' }}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp size={18} className="text-primary" />
                                    ) : (
                                      <ChevronDown size={18} className="text-muted" />
                                    )}
                                  </button>
                                )}
                              </td>
                            )}
                            {consensusMode === "collaborator" && isSuperAdmin && (
                              <td className="text-center">
                                <Badge pill bg="info" text="white" style={{ minWidth: "35px" }}>
                                  {index + 1}
                                </Badge>
                              </td>
                            )}
                            <td>
                              <div className="d-flex flex-column">
                                <span>{p.project_name}</span>
                              </div>
                            </td>

                            {!isSuperAdmin && (
                              <td className="text-center">
                                <Badge pill bg="primary">
                                  {userRank ?? "-"}
                                </Badge>
                              </td>
                            )}

                            {consensusMode === "ai" && (
                              <td className="text-center">
                                {aiRank ? (
                                  <div className="d-flex flex-column align-items-center gap-1">
                                    <Badge
                                      pill
                                      bg="warning"
                                      text="dark"
                                      style={{ minWidth: "35px" }}
                                    >
                                      {aiRank}
                                    </Badge>
                                  </div>
                                ) : (
                                  <Badge pill bg="secondary">
                                    -
                                  </Badge>
                                )}
                              </td>
                            )}

                            {isSuperAdmin && consensusMode === "ai" && (
                              <td className="text-center">
                                {consensus ? (
                                  <div className="d-flex flex-column align-items-center gap-1">
                                    <div className="d-flex align-items-center gap-2">
                                      {getConsensusEmoji(consensus.consensus_score)}
                                    </div>
                                  </div>
                                ) : (
                                  <Badge pill bg="secondary">
                                    No Data
                                  </Badge>
                                )}
                              </td>
                            )}
                          </tr>

                          {consensusMode === "collaborator" && isSuperAdmin && hasCollaboratorData && (
                            <tr>
                              <td colSpan={3} className="p-0 border-0">
                                <Collapse in={isExpanded}>
                                  <div className="p-3 bg-light">
                                    {renderCollaboratorDetails(consensus)}
                                  </div>
                                </Collapse>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  })()}
                </tbody>
              </Table>
            </div>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

export default TeamRankingsView;