import React, { useState, useEffect } from "react";
import { Search, Users, Building2, Activity, TrendingUp, X } from "lucide-react";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";
import AdminTable from "./AdminTable";
import MetricCard from "./MetricCard";
import "../styles/AdminTableStyles.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BusinessOverview = ({ onToast }) => {
    const { t } = useTranslation();
    const [businesses, setBusinesses] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageBeforeSearch, setPageBeforeSearch] = useState(1);
    const itemsPerPage = 10;

    // Collaborator modal state
    const [showCollabModal, setShowCollabModal] = useState(false);
    const [selectedBizForCollab, setSelectedBizForCollab] = useState(null);

    const token = sessionStorage.getItem("token");

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const fetchBusinesses = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${BACKEND_URL}/api/admin/businesses`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res.data.businesses || [];
            setBusinesses(data);
            setFilteredBusinesses(data);
        } catch (error) {
            console.error("Error fetching businesses:", error);
            onToast(t("failed_to_fetch_businesses") || "Failed to fetch businesses", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        if (value && !searchTerm) setPageBeforeSearch(currentPage);
        else if (!value && searchTerm) setCurrentPage(pageBeforeSearch);
        setSearchTerm(value);
    };

    useEffect(() => {
        const filtered = businesses.filter(
            (biz) =>
                biz.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                biz.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                biz.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredBusinesses(filtered);
        if (searchTerm) {
            const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) setCurrentPage(1);
        }
    }, [searchTerm, businesses]);

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
            label: t("collaborators"),
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
                            <div key={idx}>
                                <div className="admin-cell-primary" style={{ fontSize: "0.85rem" }}>{c.name}</div>
                                <div className="admin-cell-secondary">{c.email}</div>
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
                countLabel={filteredBusinesses.length === 1 ? "Business" : "Businesses"}
                columns={columns}
                data={paginatedBusinesses}
                searchTerm={searchTerm}
                onSearchChange={handleSearch}
                searchPlaceholder={t("search_by_business_owner") || "Search by business or owner..."}
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
                                {selectedBizForCollab.business_name} — {t("collaborators")}
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
        </div>
    );
};

export default BusinessOverview;
