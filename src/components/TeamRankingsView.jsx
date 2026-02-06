import React, { useState, useEffect } from "react";
import { Table, Badge, Spinner, Collapse, Card } from "react-bootstrap";
import { Users, Sparkles, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { fetchConsensusAnalysis, fetchCollaboratorConsensus } from "../services/consensusService";

const TeamRankingsView = ({
  activeAccordionKey,
  onAccordionSelect,
  isSuperAdmin,
  user,
  sortedProjects,
  rankMap,
  businessId,
}) => {
  const { t } = useTranslation();

  const [consensusData, setConsensusData] = useState({});
  const [loadingConsensus, setLoadingConsensus] = useState(false);
  const [consensusSummary, setConsensusSummary] = useState(null);
  const [consensusMode, setConsensusMode] = useState("ai");
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Load data immediately on mount (or when businessId changes), as parent now controls visibility
  useEffect(() => {
    if (businessId) {
      loadConsensusData();
    }
  }, [businessId]);

  // Reload if mode changes
  useEffect(() => {
    if (businessId) {
      loadConsensusData();
    }
  }, [consensusMode]);


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
      if (newSet.has(projectId)) newSet.delete(projectId);
      else newSet.add(projectId);
      return newSet;
    });
  };

  const getConsensusEmoji = (consensusScore) => {
    switch (consensusScore) {
      case "green": return "🟢";
      case "yellow": return "🟡";
      case "red": return "🔴";
      default: return "⚪";
    }
  };

  // Render collaborator rankings details
  const renderCollaboratorDetails = (consensus) => {
    if (!consensus || !consensus.collaborator_rankings || consensus.collaborator_rankings.length === 0) {
      return <div className="text-center text-muted py-2"><small>No rankings available</small></div>;
    }

    return (
      <div className="collaborator-details-panel">
        <h6 className="collab-header">Team Rankings Summary</h6>
        <div className="table-responsive">
          <Table size="sm" className="collab-table mb-0">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Collaborator</th>
                <th style={{ width: '15%' }} className="text-center">Rank</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {consensus.collaborator_rankings.map((collab, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="collab-avatar-small">{collab.user_name.charAt(0)}</div>
                      <span className="fw-medium">{collab.user_name}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <Badge bg="light" text="dark" className="border">#{collab.rank}</Badge>
                  </td>
                  <td className="text-muted small">
                    {collab.rationale || "No rationale"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="ranking-panel-container expanded-view">

      {/* Panel Header */}
      <div
        className="ranking-header-bar open"
        style={{ cursor: 'default' }} // No longer togglable by clicking header, handled by parent button
      >
        <div className="header-left">
          <div className="header-icon-box">
            <Users size={18} className="text-primary" />
          </div>
          <h5 className="header-title">{t("Team_Rankings_View")}</h5>

          {/* Always show summary if available and in AI mode */}
          {isSuperAdmin && consensusSummary && consensusMode === "ai" && (
            <div className="mini-summary">
              <span className="dot green" title="High Agreement"></span> {consensusSummary.high_consensus || 0}
              <span className="dot yellow" title="Medium Agreement"></span> {consensusSummary.medium_consensus || 0}
              <span className="dot red" title="Low Agreement"></span> {consensusSummary.low_consensus || 0}
            </div>
          )}
        </div>

        {/* Optional: Add a close button here if requested, but user said "make it like rank projects button" which usually implies the header button toggles it. 
            We can leave the right side empty or add a refresh button?
        */}
      </div>

      {/* Content Body - Always Visible since this component is only rendered when open */}
      <div className="ranking-content-body">

        {/* Toolbar: Consensus Mode Toggle */}
        {isSuperAdmin && (
          <div className="ranking-toolbar">
            <div className="consensus-toggle-group">
              <button
                className={`toggle-btn ${consensusMode === "ai" ? "active" : ""}`}
                onClick={() => setConsensusMode("ai")}
              >
                <Sparkles size={14} /> AI Consensus
              </button>
              <button
                className={`toggle-btn ${consensusMode === "collaborator" ? "active" : ""}`}
                onClick={() => setConsensusMode("collaborator")}
              >
                <Users size={14} /> Team Consensus
              </button>
            </div>
          </div>
        )}

        {loadingConsensus ? (
          <div className="loading-state">
            <Spinner animation="border" size="sm" />
            <span>Analyzing...</span>
          </div>
        ) : (
          <div className="compact-table-wrapper">
            <Table hover size="sm" className="ranking-table">
              {consensusMode === "collaborator" && isSuperAdmin && (
                <colgroup>
                  <col style={{ width: "30px" }} />
                  <col style={{ width: "auto" }} />
                </colgroup>
              )}
              <thead>
                <tr>
                  {consensusMode === "collaborator" && isSuperAdmin ? (
                    <th colSpan={2} style={{ paddingLeft: '8px' }}>Project Name</th>
                  ) : (
                    <th>Project Name</th>
                  )}
                  {!isSuperAdmin && <th className="text-center">My Rank</th>}
                  {consensusMode === "ai" && <th className="text-center">AI Rank</th>}
                  {isSuperAdmin && consensusMode === "ai" && <th className="text-center">Consensus</th>}
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map((p, index) => {
                  const key = String(p._id);
                  const userRank = rankMap[key];
                  const aiRank = p.ai_rank;
                  const consensus = consensusData[key];
                  const isExpanded = expandedRows.has(key);
                  const hasCollaboratorData = consensus?.collaborator_rankings?.length > 0;

                  return (
                    <React.Fragment key={p._id}>
                      <tr className={`ranking-row ${isExpanded ? 'expanded' : ''}`} onClick={() => hasCollaboratorData && consensusMode === 'collaborator' && toggleRowExpansion(key)}>
                        {consensusMode === "collaborator" && isSuperAdmin && (
                          hasCollaboratorData ? (
                            <td className="text-center toggle-cell">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </td>
                          ) : null
                        )}
                        <td
                          className="project-name-cell"
                          colSpan={consensusMode === "collaborator" && isSuperAdmin && !hasCollaboratorData ? 2 : 1}
                        >
                          <div className="name-wrapper" style={{ fontSize: '0.95rem' }}>
                            {p.project_name}
                          </div>
                        </td>     {!isSuperAdmin && (
                          <td className="text-center">
                            {userRank ? <Badge bg="primary" className="rank-badge">{userRank}</Badge> : <span className="text-muted">-</span>}
                          </td>
                        )}

                        {consensusMode === "ai" && (
                          <td className="text-center">
                            {aiRank ? <Badge bg="warning" text="dark" className="rank-badge ai">{aiRank}</Badge> : <span className="text-muted">-</span>}
                          </td>
                        )}

                        {isSuperAdmin && consensusMode === "ai" && (
                          <td className="text-center">
                            {consensus ? getConsensusEmoji(consensus.consensus_score) : "-"}
                          </td>
                        )}
                      </tr>
                      {consensusMode === "collaborator" && isSuperAdmin && hasCollaboratorData && isExpanded && (
                        <tr className="details-row">
                          <td colSpan={10}>
                            {renderCollaboratorDetails(consensus)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamRankingsView;