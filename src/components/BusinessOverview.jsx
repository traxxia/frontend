import React, { useState, useEffect, useRef } from "react";
import { Search, Users, Building2, Activity, TrendingUp, X, Trash2, AlertCircle } from "lucide-react";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";
import AdminTable from "./AdminTable";
import MetricCard from "./MetricCard";
import "../styles/AdminTableStyles.css";

import { useAuthStore } from '../store/authStore';

import { useAdminBusinesses } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BusinessOverview = ({ onToast }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    // --- TanStack Query Hook ---
    const { data: qBusinesses = [], isLoading: loading } = useAdminBusinesses();
    const businesses = qBusinesses;

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageBeforeSearch, setPageBeforeSearch] = useState(1);
    const itemsPerPage = 10;

    // Collaborator modal state
    const [showCollabModal, setShowCollabModal] = useState(false);
    const [selectedBizForCollab, setSelectedBizForCollab] = useState(null);

    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingRemoval, setPendingRemoval] = useState(null);

    const token = useAuthStore(state => state.token);

    const fetchBusinesses = () => {
        // Handled by hook
    };

    const handleSearch = (value) => {
        if (value && !searchTerm) setPageBeforeSearch(currentPage);
        else if (!value && searchTerm) setCurrentPage(pageBeforeSearch);
        setSearchTerm(value);
    };

    const filteredBusinesses = React.useMemo(() => {
        if (!searchTerm) return businesses;
        const search = searchTerm.toLowerCase();
        return businesses.filter((biz) => {
            const collaboratorText = (biz.collaborators || [])
                .map(c => `${c.name} ${c.email}`)
                .join(" ")
                .toLowerCase();

            return (
                biz.business_name?.toLowerCase().includes(search) ||
                biz.owner_name?.toLowerCase().includes(search) ||
                biz.owner_email?.toLowerCase().includes(search) ||
                collaboratorText.includes(search) ||
                new Date(biz.created_at).toLocaleDateString().toLowerCase().includes(search)
            );
        });
    }, [searchTerm, businesses]);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }, [currentPage]);

    const totalItems = filteredBusinesses.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedBusinesses = filteredBusinesses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Metrics
    const launchedCount = businesses.filter(
        (b) => b.status?.toLowerCase() === "launched" || b.status?.toLowerCase() === "lauched"
    ).length;
    const inProgressCount = businesses.length - launchedCount;

    const getStatusClass = (status) => {
        const s = status?.toLowerCase();
        if (s === "launched" || s === "lauched") return "launched";
        if (s === "prioritized") return "prioritized";
        if (s === "prioritizing" || s === "prioritization") return "prioritization";
        if (s === "kick_start") return "kick_start";
        return "draft";
    };

    const getStatusLabel = (status) => {
        const s = status?.toLowerCase();
        if (s === "launched" || s === "lauched") return t("launched");
        if (s === "prioritized") return t("prioritized");
        if (s === "prioritizing" || s === "prioritization") return t("prioritization");
        if (s === "kick_start") return t("kick_start");
        return status || t("draft");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleShowAllCollaborators = (biz) => {
        setSelectedBizForCollab(biz);
        setShowCollabModal(true);
    };

    const handleRemoveParticipant = (businessId, userId, userName) => {
        setPendingRemoval({ businessId, userId, userName });
        setShowConfirmModal(true);
    };

    const confirmRemoveParticipant = async () => {
        if (!pendingRemoval) return;

        const { businessId, userId } = pendingRemoval;

        try {
            await axios.delete(`${BACKEND_URL}/api/admin/businesses/${businessId}/participants/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onToast(t("participant_removed_successfully") || "Participant removed successfully", "success");

            queryClient.invalidateQueries({ queryKey: ["adminBusinesses"] });

            // Also update selectedBizForCollab if modal is open
            if (selectedBizForCollab && selectedBizForCollab._id === businessId) {
                setSelectedBizForCollab({
                    ...selectedBizForCollab,
                    collaborators: (selectedBizForCollab.collaborators || []).filter(c => c.id !== userId)
                });
            }
        } catch (error) {
            console.error("Error removing participant:", error);
            onToast(error.response?.data?.error || t("failed_to_remove_participant") || "Failed to remove participant", "error");
        } finally {
            setShowConfirmModal(false);
            setPendingRemoval(null);
        }
    };

    // Column definitions for AdminTable
    const columns = [
        {
            key: "business_name",
            label: t("business_name"),
            render: (val) => <span className="admin-cell-primary">{val}</span>,
        },
        {
            key: "owner",
            label: t("owner"),
            render: (_, row) => (
                <div>
                    <div className="admin-cell-primary">{row.owner_name || t("unknown")}</div>
                    <div className="admin-cell-secondary">{row.owner_email}</div>
                </div>
            ),
        },
        {
            key: "collaborators",
            label: t("participants"),
            render: (_, row) => {
                const collabs = row.collaborators || [];
                const displayed = collabs.slice(0, 2);
                const hasMore = collabs.length > 2;
                if (collabs.length === 0) {
                    return (
                        <span className="admin-cell-secondary">
                            <Users size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                            {t("no_collaborators")}
                        </span>
                    );
                }
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        {displayed.map((c, idx) => (
                            <div key={idx} className="admin-collab-inline-item">
                                <div className="admin-collab-info">
                                    <div className="admin-cell-primary" style={{ fontSize: "0.85rem" }}>{c.name}</div>
                                    <div className="admin-cell-secondary">{c.email}</div>
                                </div>
                                <button
                                    className="admin-collab-remove-btn inline"
                                    onClick={() => handleRemoveParticipant(row._id, c.id, c.name)}
                                    title={t("remove_participant") || "Remove Participant"}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        {hasMore && (
                            <button
                                className="admin-collab-more-btn"
                                onClick={() => handleShowAllCollaborators(row)}
                            >
                                +{collabs.length - 2} {t("more") || "more"}...
                            </button>
                        )}
                    </div>
                );
            },
        },
        {
            key: "status",
            label: t("status"),
            render: (_, row) => {
                const s = (row.status || "").toLowerCase();
                const accessMode = (row.access_mode || "").toLowerCase();
                const isDeleted = s === "deleted";
                const isArchived = s === "archived" || accessMode === "archived" || accessMode === "hidden";

                let label, statusColor, statusBg;

                if (isDeleted) {
                    label = t("deleted") || "Deleted";
                    statusColor = "#dc2626";
                    statusBg = "#fee2e2";
                } else if (isArchived) {
                    label = t("archived") || "Archived";
                    statusColor = "#ecaa1cff";
                    statusBg = "#FCF9C3";
                } else {
                    // Everything else (launched, prioritized, kick_start, draft, etc.) → Active
                    label = t("active") || "Active";
                    statusColor = "#16a34a";
                    statusBg = "#dcfce7";
                }

                return (
                    <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: statusColor,
                        backgroundColor: statusBg,
                        display: "inline-block",
                        textTransform: "capitalize"
                    }}>
                        {label}
                    </span>
                );
            },
        },

        {
            key: "created_at",
            label: t("created"),
            render: (val) => <span className="admin-cell-secondary">{formatDate(val)}</span>,
        },
    ];

    return (
        <div>
            {/* ---- Table ---- */}

            {/* ---- Table ---- */}
            <AdminTable
                title={t("business_overview") || "Business Overview"}
                count={filteredBusinesses.length}
                countLabel={
                    filteredBusinesses.length === 1
                        ? t("business") || "Business"
                        : t("businesses") || "Businesses"
                }
                columns={columns}
                data={paginatedBusinesses}
                searchTerm={searchTerm}
                onSearchChange={handleSearch}
                searchPlaceholder={t("search_by_business_owner") || "Search by business or owner..."}
                searchTooltip={t("search_businesses_tooltip")}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                emptyMessage={t("no_businesses_found") || "No businesses found"}
                loading={loading}
            />

            {/* ---- Collaborators Modal (native, no Bootstrap) ---- */}
            {showCollabModal && selectedBizForCollab && (
                <div className="admin-modal-overlay" onClick={() => setShowCollabModal(false)}>
                    <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>
                                <Users size={18} style={{ color: "#6366f1" }} />
                                {selectedBizForCollab.business_name} — {t("participants")}
                            </h3>
                            <button
                                className="admin-modal-close"
                                onClick={() => setShowCollabModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="admin-modal-body">
                            {selectedBizForCollab.collaborators?.map((collab, idx) => (
                                <div key={idx} className="admin-collab-item">
                                    <div className="admin-collab-avatar">
                                        {(collab.name || "?")[0].toUpperCase()}
                                    </div>
                                    <div className="admin-collab-info">
                                        <span className="admin-collab-name">{collab.name}</span>
                                        <span className="admin-collab-email">{collab.email}</span>
                                    </div>
                                    <button
                                        className="admin-collab-remove-btn"
                                        onClick={() => handleRemoveParticipant(selectedBizForCollab._id, collab.id, collab.name)}
                                        title={t("remove_participant") || "Remove Participant"}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="admin-modal-footer">
                            <button
                                className="admin-modal-footer-btn"
                                onClick={() => setShowCollabModal(false)}
                            >
                                {t("close") || "Close"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ---- Confirmation Modal ---- */}
            {showConfirmModal && (
                <div className="admin-modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="admin-modal-box confirm-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="admin-modal-header">
                            <h3>{t("confirm_remove_participant_title") || "Confirm Removal"}</h3>
                            <button
                                className="admin-modal-close"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="admin-modal-body">
                            <p className="mb-2" style={{ color: '#4b5563', lineHeight: '1.5' }}>
                                {t("confirm_remove_participant_prefix") || "Are you sure you want to remove participant"} <strong>{pendingRemoval?.userName || "this participant"}</strong>?
                            </p>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.4', fontStyle: 'italic' }}>
                                <AlertCircle size={14} style={{ marginRight: '6px', color: '#f59e0b', verticalAlign: 'text-bottom' }} />
                                {t("reassign_ownership_notice") || "Any projects currently owned by this participant will be automatically reassigned to the business owner."}
                            </p>
                            <p className="mt-2" style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.4', fontStyle: 'italic' }}>
                                <AlertCircle size={14} style={{ marginRight: '6px', color: '#f59e0b', verticalAlign: 'text-bottom' }} />
                                {t("revoke_access_notice") || "Administrative access (reranking/project edit) will also be revoked for this participant in this business."}
                            </p>
                        </div>
                        <div className="admin-modal-footer" style={{ gap: '10px' }}>
                            <button
                                className="admin-modal-footer-btn"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                {t("cancel") || "Cancel"}
                            </button>
                            <button
                                className="admin-primary-btn"
                                onClick={confirmRemoveParticipant}
                                style={{ backgroundColor: "#ef4444", border: 'none' }}
                            >
                                {t("remove_participant") || "Remove Participant"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessOverview;
