import React, { useState, useEffect } from "react";
import { Card, Table, Form, Row, Col, Spinner, Badge, Modal, Button } from "react-bootstrap";
import { Search, Building2, User, Users, Activity, X } from "lucide-react";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";
import Pagination from "./Pagination";
import "../styles/usermanagement.css"; // Reuse usermanagement styles for consistency

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

    // Modal state
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
        if (value && !searchTerm) {
            setPageBeforeSearch(currentPage);
        } else if (!value && searchTerm) {
            setCurrentPage(pageBeforeSearch);
        }
        setSearchTerm(value);
    };

    useEffect(() => {
        const filtered = businesses.filter((biz) =>
            biz.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            biz.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            biz.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredBusinesses(filtered);

        if (searchTerm) {
            const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(1);
            }
        }
    }, [searchTerm, businesses]);

    const totalItems = filteredBusinesses.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedBusinesses = filteredBusinesses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusLabelAndClass = (status) => {
        const s = status?.toLowerCase();
        if (s === "launched" || s === "lauched") return { label: t("launched"), className: "status-launched" };
        if (s === "prioritized") return { label: t("prioritized"), className: "status-active" }; // Using active for prioritized
        if (s === "prioritizing" || s === "prioritization") return { label: t("prioritization"), className: "status-pending" };
        if (s === "kick_start") return { label: t("kick_start"), className: "status-active" };
        return { label: status || t("draft"), className: "status-pending" };
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

    const launchedCount = businesses.filter(b => b.status?.toLowerCase() === "launched" || b.status?.toLowerCase() === "lauched").length;
    const inProgressCount = businesses.length - launchedCount;

    return (
        <div className="access-management-container minimal">
            <div className="access-content">
                <div className="access-header-minimal mb-4">
                    <h2 className="minimal-page-title">{t("business_overview")}</h2>
                    <p className="minimal-page-subtitle text-muted">
                        {t("business_overview_subtitle")}
                    </p>
                </div>

                <div className="compact-summary-row mb-4">
                    <div className="summary-item">
                        <span className="summary-label">{t("total_businesses") || "Total Businesses"}:</span>
                        <span className="summary-value-minimal">{businesses.length}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">{t("launched")}:</span>
                        <span className="summary-value-minimal">{launchedCount}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">{t("in_progress")}:</span>
                        <span className="summary-value-minimal">{inProgressCount}</span>
                    </div>
                </div>

                <Row className="mt-4">
                    <Col>
                        <div className="user-toolbar d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div className="search-container flex-grow-1">
                                <div className="search-input-wrapper">
                                    <Search size={18} className="search-icon" />
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder={t("search_by_business_owner")}
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>

                <Card className="mt-4">
                    <Card.Body>
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2 text-muted">{t("loading_businesses")}</p>
                            </div>
                        ) : (
                            <>
                                <Table hover responsive className="align-middle">
                                    <thead className="table-heading">
                                        <tr>
                                            <th>{t("business_name")}</th>
                                            <th>{t("owner")}</th>
                                            <th>{t("collaborators")}</th>
                                            <th>{t("stage")}</th>
                                            <th>{t("created")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedBusinesses.length > 0 ? (
                                            paginatedBusinesses.map((biz) => {
                                                const statusInfo = getStatusLabelAndClass(biz.status);
                                                const displayedCollabs = biz.collaborators?.slice(0, 2) || [];
                                                const hasMoreCollabs = (biz.collaborators?.length || 0) > 2;

                                                return (
                                                    <tr key={biz._id}>
                                                        <td title={biz.business_name}>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className="fw-semibold">{biz.business_name}</span>
                                                            </div>
                                                        </td>
                                                        <td title={`${biz.owner_name || t("unknown")} (${biz.owner_email})`}>
                                                            <div>
                                                                <div className="fw-semibold">{biz.owner_name || t("unknown")}</div>
                                                                <small className="text-muted">{biz.owner_email}</small>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex flex-column gap-2">
                                                                {displayedCollabs.length > 0 ? (
                                                                    <>
                                                                        {displayedCollabs.map((collab, idx) => (
                                                                            <div key={idx} className="d-flex flex-column lh-1" title={`${collab.name} (${collab.email})`}>
                                                                                <span className="fw-medium" style={{ fontSize: '0.9rem' }}>{collab.name}</span>
                                                                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{collab.email}</small>
                                                                            </div>
                                                                        ))}
                                                                        {hasMoreCollabs && (
                                                                            <Button
                                                                                variant="link"
                                                                                className="p-0 text-start text-primary text-decoration-none fw-semibold"
                                                                                style={{ fontSize: '0.8rem' }}
                                                                                onClick={() => handleShowAllCollaborators(biz)}
                                                                            >
                                                                                +{(biz.collaborators?.length || 0) - 2} {t("more") || "more"}...
                                                                            </Button>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span className="text-muted small">
                                                                        <Users size={14} className="me-1" />
                                                                        {t("no_collaborators")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex flex-column gap-1">
                                                                <span className={`status-badge ${statusInfo.className}`}>
                                                                    {statusInfo.label}
                                                                </span>
                                                                {(biz.access_mode === 'archived' || biz.access_mode === 'hidden') && (
                                                                    <span className="badge bg-warning text-dark" style={{ width: 'fit-content', fontSize: '0.7rem' }}>
                                                                        Archived
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="text-muted">{formatDate(biz.created_at)}</td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5 text-muted">
                                                    {t("no_businesses_found")}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        )}
                    </Card.Body>
                </Card>
            </div>

            {/* Collaborators Modal */}
            <Modal
                show={showCollabModal}
                onHide={() => setShowCollabModal(false)}
                centered
                size="md"
                className="minimal-modal"
            >

                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold h5">
                        <Users size={20} className="text-primary me-2" />
                        {selectedBizForCollab?.business_name} - {t("collaborators")}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <div className="d-flex flex-column gap-3 max-vh-50 overflow-auto pe-2 custom-scrollbar">
                        {selectedBizForCollab?.collaborators?.map((collab, idx) => (
                            <div key={idx} className="d-flex align-items-center gap-3 p-2 bg-light rounded-3">
                                <div className="d-flex flex-column">
                                    <span className="fw-semibold">{collab.name}</span>
                                    <small className="text-muted">{collab.email}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" className="px-4 fw-semibold" onClick={() => setShowCollabModal(false)}>
                        {t("close")}
                    </Button>
                </Modal.Footer>
            </Modal >
        </div >
    );
};

export default BusinessOverview;
