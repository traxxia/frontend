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
import { AI_PAGE_CONTEXTS } from "../utils/aiContexts";
import "../styles/ProjectsSection.css";
const RankingSection = ({
  isArchived,
  companyAdminIds,
  setActiveTab
}) => {
  const {
    t
  } = useTranslation();
  const {
    selectedBusinessId
  } = useBusinessStore();
  const {
    userRole,
    userId: myUserId,
    userName: user
  } = useAuthStore();
  const {
    addToast
  } = useUIStore();
  const queryClient = useQueryClient();
  const lockSummary = useProjectStore(state => state.lockSummary) || {
    total_users: 0,
    locked_users_count: 0,
    locked_users: []
  };
  const businessStatus = useProjectStore(state => state.businessStatus) || "draft";
  const lockRanking = useProjectStore(state => state.lockRanking);
  const {
    data: projects = [],
    isLoading: isLoadingProjects
  } = useProjects(selectedBusinessId);
  const {
    userHasRerankAccess,
    userHasRankingAccess
  } = useAccessControl(selectedBusinessId);
  const isViewer = userRole === "viewer";
  const isSuperAdmin = userRole === "super_admin" || userRole === "company_admin" || userRole === "admin";
  const allCollaboratorsLocked = lockSummary.locked_users_count === lockSummary.total_users;
  const isRankingLocked = allCollaboratorsLocked;
  const userHasLockedRank = useMemo(() => lockSummary.locked_users?.some(u => String(u.user_id) === String(myUserId)) || false, [lockSummary.locked_users, myUserId]);
  const [showRankScreen, setShowRankScreen] = useState(!isViewer);
  const [showTeamRankings, setShowTeamRankings] = useState(isViewer);
  const [activeAccordionKey, setActiveAccordionKey] = useState(null);
  const [apiIsArchived, setApiIsArchived] = useState(isArchived);
  const [isTransitioning, setIsTransitioning] = useState(false);
  useEffect(() => {
    setApiIsArchived(isArchived);
  }, [isArchived]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("ai_context_changed", {
      detail: {
        pageContext: AI_PAGE_CONTEXTS.RANKING
      }
    }));
  }, []);
  const normalizeId = id => id ? String(id) : "";
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
        const displayRank = storeRank !== null && storeRank !== undefined ? storeRank : p.rank !== null && p.rank !== undefined ? p.rank : p.ai_rank;
        if (displayRank !== null && displayRank !== undefined) acc[id] = displayRank;
      }
      return acc;
    }, {});
  }, [projects, storeProjects]);
  const adminRankMap = useMemo(() => (adminRanks || []).reduce((acc, r) => {
    acc[normalizeId(r.project_id)] = r.rank;
    return acc;
  }, {}), [adminRanks]);
  const aiRankMap = useMemo(() => (projects || []).reduce((acc, p) => {
    acc[normalizeId(p._id)] = p.ai_rank;
    return acc;
  }, {}), [projects]);
  const rankedProjects = useMemo(() => projects.map(p => ({
    ...p,
    rank: rankMap[String(p._id)],
    ai_rank: p.ai_rank || aiRankMap[String(p._id)]
  })), [projects, rankMap, aiRankMap]);
  const sortedProjects = useMemo(() => [...projects].sort((a, b) => {
    const rA = rankMap[normalizeId(a._id)] ?? Infinity;
    const rB = rankMap[normalizeId(b._id)] ?? Infinity;
    if (rA === rB) return new Date(b.created_at) - new Date(a.created_at);
    return rA - rB;
  }), [projects, rankMap]);
  const handleShowToast = useCallback((message, type = "error", duration = 3000) => {
    addToast({
      message,
      type,
      duration
    });
  }, [addToast]);
  const fetchedBusinessIdRef = useRef(null);
  const refreshData = useCallback(async (options = {
    silent: true
  }) => {
    if (!selectedBusinessId) return;
    const store = useProjectStore.getState();
    store.clearCache(selectedBusinessId);
    queryClient.invalidateQueries({
      queryKey: ["projects", selectedBusinessId]
    });
    queryClient.invalidateQueries({
      queryKey: ["teamRankings", selectedBusinessId]
    });
    queryClient.invalidateQueries({
      queryKey: ["rankingsSummary", selectedBusinessId]
    });
    const [_, accessData] = await Promise.all([store.fetchTeamRankings(selectedBusinessId, {
      silent: options.silent
    }), store.checkAllAccess(selectedBusinessId)]);
    if (accessData?.businessAccessMode) {
      setApiIsArchived(accessData.businessAccessMode === "archived" || accessData.businessAccessMode === "hidden");
    }
  }, [selectedBusinessId, queryClient]);
  useEffect(() => {
    if (!selectedBusinessId || fetchedBusinessIdRef.current === selectedBusinessId) return;
    fetchedBusinessIdRef.current = selectedBusinessId;
    const store = useProjectStore.getState();
    Promise.all([store.fetchTeamRankings(selectedBusinessId, {
      silent: true
    }), store.checkAllAccess(selectedBusinessId)]).then(([_, accessData]) => {
      if (accessData?.businessAccessMode) {
        setApiIsArchived(accessData.businessAccessMode === "archived" || accessData.businessAccessMode === "hidden");
      }
    }).catch(err => console.error("Error loading rankings:", err));
  }, [selectedBusinessId]);
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
  const handleAccordionSelect = useCallback(eventKey => {
    setActiveAccordionKey(prev => {
      const next = prev === eventKey ? null : eventKey;
      if (next === "0" && prev !== "0") refreshData();
      return next;
    });
  }, [refreshData]);
  return <div ref={undefined} className="projects-section-wrapper">
      <ToastNotifications />

      <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
        {}
        <div className="d-flex align-items-center gap-2 flex-grow-1">
          {!isViewer && <div className="status-tabs-container ranking-section--s1">
              <button onClick={() => {
            setShowRankScreen(true);
            setShowTeamRankings(false);
          }} className={`status-tab ${showRankScreen ? "active" : ""}`}>
                <ListOrdered size={16} />
                {t("Rank_Projects")}
              </button>

              {lockSummary.total_users > 0 && <button onClick={onToggleTeamRankings} className={`status-tab ${showTeamRankings ? "active" : ""}`}>
                  <Users size={16} />
                  {t("Rankings_View")}
                </button>}
            </div>}
        </div>

        {}
        {isSuperAdmin && lockSummary.total_users > 0 && <div className="collaborator-progress-compact d-flex align-items-center gap-2 px-3 py-2 ranking-section--s2">
            <Users size={16} className="text-primary" />
            <span className="ranking-section--s3">{t("Collaborator Progress")}:</span>
            <span className="badge bg-primary rounded-pill ranking-section--s4">
              {lockSummary.locked_users_count} / {lockSummary.total_users}
            </span>
            {lockSummary.locked_users_count === lockSummary.total_users && <CheckCircle size={14} className="text-success" />}
          </div>}
      </div>

      {}
      {isTransitioning || isLoadingProjects && projects.length === 0 ? <div className="d-flex flex-column justify-content-center align-items-center py-5 ranking-section--s5">
          <div className="spinner-border text-primary mb-3 ranking-section--s6" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">{isTransitioning ? t("Processing rankings and updating view...") : t("Loading projects...")}</p>
        </div> : <>
          {showRankScreen && <RankProjectsPanel show={showRankScreen} projects={rankedProjects} onLockRankings={handleLockProjectRanking} onRankSaved={async () => {
        setIsTransitioning(true);
        try {
          await refreshData();
          const currentLockSummary = useProjectStore.getState().lockSummary;
          if (!currentLockSummary || currentLockSummary.total_users === 0) {
            useProjectStore.getState().setViewMode("projects");
            if (setActiveTab) {
              setActiveTab("bets");
            }
          } else {
            onToggleTeamRankings();
          }
        } finally {
          setTimeout(() => setIsTransitioning(false), 500);
        }
      }} isAdmin={isSuperAdmin} isRankingLocked={isRankingLocked} businessStatus={businessStatus} userHasRerankAccess={userHasRerankAccess} userHasRankingAccess={userHasRankingAccess} onShowToast={handleShowToast} isArchived={apiIsArchived} userHasLockedRanking={userHasLockedRank} />}

          {showTeamRankings && <TeamRankingsView activeAccordionKey={activeAccordionKey} onAccordionSelect={handleAccordionSelect} isSuperAdmin={isSuperAdmin} user={user} sortedProjects={sortedProjects} rankMap={rankMap} adminRankMap={adminRankMap} userRole={userRole} businessId={selectedBusinessId} />}
        </>}
    </div>;
};
export default RankingSection;