// src/components/RankingSection.jsx
// Standalone Ranking page — completely separate from ProjectsSection.
// Fetches its own data on mount (once), with no shared state/effect loops.

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { Users, CheckCircle, ListOrdered } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore, useProjectStore, useUIStore, useBusinessStore } from "../store";
import { useProjects } from "../hooks/useQueries";
import { useAccessControl } from "../hooks/useAccessControl";
import RankProjectsPanel from "./RankProjectsPanel";
import TeamRankingsView from "./TeamRankingsView";
import ToastNotifications from "./ToastNotifications";
import "../styles/ProjectsSection.css";

const RankingSection = ({ isArchived, companyAdminIds }) => {
  const { t } = useTranslation();
  const { selectedBusinessId } = useBusinessStore();
  const { userRole, userId: myUserId, userName: user } = useAuthStore();
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  // ─── Store state (reactive reads only — no action extraction) ───────────────
  const lockSummary = useProjectStore(state => state.lockSummary) || { total_users: 0, locked_users_count: 0, locked_users: [] };
  const businessStatus = useProjectStore(state => state.businessStatus) || "draft";
  const lockRanking = useProjectStore(state => state.lockRanking);

  // ─── TanStack Query for projects list ───────────────────────────────────────
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects(selectedBusinessId);

  // ─── Access control ─────────────────────────────────────────────────────────
  const { userHasRerankAccess, userHasRankingAccess } = useAccessControl(selectedBusinessId);

  // ─── Derived flags ───────────────────────────────────────────────────────────
  const isViewer = userRole === "viewer";
  const isSuperAdmin = userRole === "super_admin" || userRole === "company_admin" || userRole === "admin";
  const allCollaboratorsLocked = lockSummary.locked_users_count === lockSummary.total_users;
  const isRankingLocked = allCollaboratorsLocked;
  const userHasLockedRank = useMemo(() =>
    lockSummary.locked_users?.some(u => String(u.user_id) === String(myUserId)) || false,
    [lockSummary.locked_users, myUserId]
  );

  // ─── UI sub-view state ───────────────────────────────────────────────────────
  const [showRankScreen, setShowRankScreen] = useState(!isViewer);
  const [showTeamRankings, setShowTeamRankings] = useState(isViewer);
  const [activeAccordionKey, setActiveAccordionKey] = useState(null);
  const [apiIsArchived, setApiIsArchived] = useState(isArchived);

  // Sync isArchived prop
  useEffect(() => { setApiIsArchived(isArchived); }, [isArchived]);

  // ─── Rank / AI rank maps ─────────────────────────────────────────────────────
  const normalizeId = (id) => (id ? String(id) : "");

  const storeProjects = useProjectStore(state => state.projects);
  const adminRanks = useProjectStore(state => state.aiRankings);

  const rankMap = useMemo(() => {
    const storeRankingMap = (storeProjects || []).reduce((acc, p) => {
      const id = normalizeId(p._id || p.project_id);
      if (id) acc[id] = p.rank;
      return acc;
    }, {});
    return (projects || []).reduce((acc, p) => {
      const id = normalizeId(p._id);
      if (id) {
        const storeRank = storeRankingMap[id];
        const displayRank = (storeRank !== null && storeRank !== undefined) ? storeRank :
                            ((p.rank !== null && p.rank !== undefined) ? p.rank : p.ai_rank);
        if (displayRank !== null && displayRank !== undefined) acc[id] = displayRank;
      }
      return acc;
    }, {});
  }, [projects, storeProjects]);

  const adminRankMap = useMemo(() =>
    (adminRanks || []).reduce((acc, r) => { acc[normalizeId(r.project_id)] = r.rank; return acc; }, {}),
    [adminRanks]
  );

  const aiRankMap = useMemo(() =>
    (projects || []).reduce((acc, p) => { acc[normalizeId(p._id)] = p.ai_rank; return acc; }, {}),
    [projects]
  );

  const rankedProjects = useMemo(() => projects.map(p => ({
    ...p,
    rank: rankMap[String(p._id)],
    ai_rank: p.ai_rank || aiRankMap[String(p._id)],
  })), [projects, rankMap, aiRankMap]);

  const sortedProjects = useMemo(() => [...projects].sort((a, b) => {
    const rA = rankMap[normalizeId(a._id)] ?? Infinity;
    const rB = rankMap[normalizeId(b._id)] ?? Infinity;
    if (rA === rB) return new Date(b.created_at) - new Date(a.created_at);
    return rA - rB;
  }), [projects, rankMap]);

  // ─── Toast helper ─────────────────────────────────────────────────────────────
  const handleShowToast = useCallback((message, type = "error", duration = 3000) => {
    addToast({ message, type, duration });
  }, [addToast]);

  // ─── Stable data refresh (called once on mount + manually on user actions) ───
  const hasFetchedRef = useRef(false);

  const refreshData = useCallback(async (options = { silent: true }) => {
    if (!selectedBusinessId) return;
    const store = useProjectStore.getState();

    // Clear caches so next call is fresh
    store.clearCache(selectedBusinessId);
    queryClient.invalidateQueries({ queryKey: ["projects", selectedBusinessId] });
    queryClient.invalidateQueries({ queryKey: ["teamRankings", selectedBusinessId] });
    queryClient.invalidateQueries({ queryKey: ["rankingsSummary", selectedBusinessId] });

    const [_, accessData] = await Promise.all([
      store.fetchTeamRankings(selectedBusinessId, { silent: options.silent }),
      store.checkAllAccess(selectedBusinessId),
    ]);

    if (accessData?.businessAccessMode) {
      setApiIsArchived(
        accessData.businessAccessMode === "archived" || accessData.businessAccessMode === "hidden"
      );
    }
  }, [selectedBusinessId, queryClient]);

  // ─── Fetch gracefully on mount instead of a hard refresh (which clears cache) ───
  useEffect(() => {
    if (!selectedBusinessId || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    // useProjects handles projects list automatically. We just need to load rankings and access:
    const store = useProjectStore.getState();
    Promise.all([
      store.fetchTeamRankings(selectedBusinessId, { silent: true }),
      store.checkAllAccess(selectedBusinessId)
    ]).then(([_, accessData]) => {
      if (accessData?.businessAccessMode) {
        setApiIsArchived(
          accessData.businessAccessMode === "archived" || accessData.businessAccessMode === "hidden"
        );
      }
    }).catch(err => console.error("Error loading rankings:", err));
  }, [selectedBusinessId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const onToggleTeamRankings = useCallback(() => {
    setShowTeamRankings(true);
    setShowRankScreen(false);
  }, []);

  const handleLockProjectRanking = useCallback(async () => {
    try {
      await lockRanking();
      await refreshData();
    } catch (err) {
      console.error("Failed to lock project ranking:", err);
    }
  }, [lockRanking, refreshData]);

  const handleAccordionSelect = useCallback((eventKey) => {
    setActiveAccordionKey(prev => {
      const next = prev === eventKey ? null : eventKey;
      if (next === "0" && prev !== "0") refreshData();
      return next;
    });
  }, [refreshData]);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div ref={undefined} className="projects-section-wrapper">
      <ToastNotifications />

      <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
        {/* Sub-tabs: Rank | Team Rankings */}
        <div className="d-flex align-items-center gap-2 flex-grow-1">
          {!isViewer && (
            <div className="status-tabs-container" style={{ WebkitOverflowScrolling: "touch", overflowX: "auto" }}>
              <button
                onClick={() => { setShowRankScreen(true); setShowTeamRankings(false); }}
                className={`status-tab ${showRankScreen ? "active" : ""}`}
              >
                <ListOrdered size={16} />
                {t("Rank_Projects")}
              </button>

              {lockSummary.total_users > 0 && (
                <button
                  onClick={onToggleTeamRankings}
                  className={`status-tab ${showTeamRankings ? "active" : ""}`}
                >
                  <Users size={16} />
                  {t("Rankings_View")}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Collaborator progress badge — admin only */}
        {isSuperAdmin && lockSummary.total_users > 0 && (
          <div
            className="collaborator-progress-compact d-flex align-items-center gap-2 px-3 py-2"
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
              whiteSpace: "nowrap",
            }}
          >
            <Users size={16} className="text-primary" />
            <span style={{ fontWeight: 600 }}>{t("Collaborator Progress")}:</span>
            <span className="badge bg-primary rounded-pill" style={{ fontSize: "11px" }}>
              {lockSummary.locked_users_count} / {lockSummary.total_users}
            </span>
            {lockSummary.locked_users_count === lockSummary.total_users && (
              <CheckCircle size={14} className="text-success" />
            )}
          </div>
        )}
      </div>

      {/* Loading spinner */}
      {isLoadingProjects && projects.length === 0 ? (
        <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: 300 }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {showRankScreen && (
            <RankProjectsPanel
              show={showRankScreen}
              projects={rankedProjects}
              onLockRankings={handleLockProjectRanking}
              onRankSaved={async () => {
                await refreshData();
                if (useProjectStore.getState().lockSummary.total_users === 0) {
                  // No collaborators — switch back to projects view via navigation
                  useProjectStore.getState().setViewMode("projects");
                } else {
                  onToggleTeamRankings();
                }
              }}
              isAdmin={isSuperAdmin}
              isRankingLocked={isRankingLocked}
              businessStatus={businessStatus}
              userHasRerankAccess={userHasRerankAccess}
              userHasRankingAccess={userHasRankingAccess}
              onShowToast={handleShowToast}
              isArchived={apiIsArchived}
              userHasLockedRanking={userHasLockedRank}
            />
          )}

          {showTeamRankings && (
            <TeamRankingsView
              activeAccordionKey={activeAccordionKey}
              onAccordionSelect={handleAccordionSelect}
              isSuperAdmin={isSuperAdmin}
              user={user}
              sortedProjects={sortedProjects}
              rankMap={rankMap}
              adminRankMap={adminRankMap}
              userRole={userRole}
              businessId={selectedBusinessId}
            />
          )}
        </>
      )}
    </div>
  );
};

export default RankingSection;
