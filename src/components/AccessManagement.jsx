import React, { useState, useEffect } from "react";
import { Table, Badge, Spinner, Form, Button, Modal } from "react-bootstrap";
import { Shield, Lock, Pencil, Users, AlertCircle, Trash2, Activity, Key } from "lucide-react";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";
import AdminTable from "./AdminTable";
import MetricCard from "./MetricCard";
import "../styles/AdminTableStyles.css";
import "../styles/accessmanagement.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AccessManagement = ({ onToast }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [accessData, setAccessData] = useState(null);
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState("");
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [revokeDetails, setRevokeDetails] = useState(null);
    const [revoking, setRevoking] = useState(false);
    const [fetchingBusinesses, setFetchingBusinesses] = useState(true);
    const token = sessionStorage.getItem("token");

    useEffect(() => {
        fetchBusinesses();
    }, []);

    useEffect(() => {
        if (selectedBusinessId) {
            fetchAccessData();
        }
    }, [selectedBusinessId]);

    const fetchBusinesses = async () => {
        try {
            setFetchingBusinesses(true);
            const res = await axios.get(`${BACKEND_URL}/api/businesses`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = Array.isArray(res.data)
                ? res.data
                : res.data.businesses || [];

            const launchedBusinesses = data.filter(b => b.has_launched_projects);
            setBusinesses(launchedBusinesses);

            if (launchedBusinesses.length > 0 && !selectedBusinessId) {
                setSelectedBusinessId(launchedBusinesses[0]._id);
            }
        } catch (err) {
            console.error("Failed to fetch businesses", err);
            onToast("Failed to load businesses", "error");
        } finally {
            setFetchingBusinesses(false);
        }
    };

    const fetchAccessData = async () => {
        if (!selectedBusinessId) return;

        try {
            setLoading(true);
            const res = await axios.get(`${BACKEND_URL}/api/projects/granted-access`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { business_id: selectedBusinessId },
            });

            setAccessData(res.data);
        } catch (err) {
            console.error("Failed to fetch access data", err);
            onToast("Failed to load access data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenRevokeModal = (user, accessType) => {
        setRevokeDetails({
            user,
            accessType,
            business_id: selectedBusinessId
        });
        setShowRevokeModal(true);
    };

    const handleRevokeAccess = async () => {
        if (!revokeDetails) return;

        try {
            setRevoking(true);

            await axios.post(
                `${BACKEND_URL}/api/projects/revoke-access`,
                {
                    business_id: revokeDetails.business_id,
                    user_id: revokeDetails.user.user_id,
                    access_type: revokeDetails.accessType
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            onToast(
                `Successfully revoked ${revokeDetails.accessType === "all" ? "all access" : revokeDetails.accessType + " access"} for ${revokeDetails.user.user_name}`,
                "success"
            );

            setShowRevokeModal(false);
            setRevokeDetails(null);

            // Refresh data
            await fetchAccessData();
        } catch (err) {
            console.error("Failed to revoke access", err);
            onToast(
                err.response?.data?.error || "Failed to revoke access",
                "error"
            );
        } finally {
            setRevoking(false);
        }
    };

    const columns = [
        {
            key: "user",
            label: t("user"),
            render: (_, row) => (
                <div>
                    <div className="admin-cell-primary">{row.user_name}</div>
                    <div className="admin-cell-secondary">{row.user_email}</div>
                </div>
            )
        },
        {
            key: "permissions",
            label: t("Permissions"),
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {row.has_rerank_access && (
                        <span className="admin-status-badge prioritized" style={{ fontSize: '0.7rem' }}>
                            <Lock size={12} className="me-1" /> {t("Rerank")}
                        </span>
                    )}
                    {row.has_project_edit_access && (
                        <span className="admin-status-badge active" style={{ fontSize: '0.7rem' }}>
                            <Pencil size={12} className="me-1" /> {t("Edit")}
                        </span>
                    )}
                    {!row.has_rerank_access && !row.has_project_edit_access && (
                        <span className="admin-cell-secondary italic">No special access</span>
                    )}
                </div>
            )
        },
        {
            key: "projects",
            label: t("Projects with Access"),
            render: (_, row) => {
                const projects = row.projects_with_access || [];
                if (projects.length === 0) return <span className="admin-cell-secondary">—</span>;
                return (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '300px' }}>
                        {projects.slice(0, 2).map((p, idx) => (
                            <span key={idx} className="admin-status-badge archived" style={{ fontSize: '0.65rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.project_name}
                            </span>
                        ))}
                        {projects.length > 2 && (
                            <span className="admin-status-badge archived" style={{ fontSize: '0.65rem' }}>
                                +{projects.length - 2}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: "actions",
            label: t("actions"),
            render: (_, row) => (
                <>
                    {row.has_rerank_access && (
                        <Button
                            variant="outline-warning"
                            size="sm"
                            title="Revoke Rerank Access"
                            onClick={() => handleOpenRevokeModal(row, "rerank")}
                            disabled={revoking}
                        >
                            <Lock size={14} />
                        </Button>
                    )}
                    {row.has_project_edit_access && (
                        <Button
                            variant="outline-danger"
                            size="sm"
                            title="Revoke Edit Access"
                            onClick={() => handleOpenRevokeModal(row, "project_edit")}
                            disabled={revoking}
                        >
                            <Trash2 size={14} />
                        </Button>
                    )}
                    {(row.has_rerank_access || row.has_project_edit_access) && (
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            title="Revoke All Access"
                            onClick={() => handleOpenRevokeModal(row, "all")}
                            disabled={revoking}
                        >
                            {t("Revoke All")}
                        </Button>
                    )}
                </>
            )
        }
    ];

    if (fetchingBusinesses) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">{t('Loading_businesses...')}</p>
            </div>
        );
    }

    if (businesses.length === 0) {
        return (
            <div className="p-5 text-center">
                <AlertCircle size={48} className="text-muted mb-3" />
                <h4 className="fw-bold">{t("No Launched Businesses")}</h4>
                <p className="text-muted mb-0">
                    {t('No businesses have been launched yet. Access management is only available for launched businesses.')}
                </p>
            </div>
        );
    }

    // Metrics calculation
    const rerankCount = accessData?.access_list.filter(u => u.has_rerank_access).length || 0;
    const editCount = accessData?.access_list.filter(u => u.has_project_edit_access).length || 0;

    return (
        <div>
            {/* ---- Metric Cards ---- */}
            <div className="admin-metrics-grid">
                <MetricCard
                    label={t("Total Users with Access") || "Users with Access"}
                    value={accessData?.total_users_with_access || 0}
                    icon={Users}
                    iconColor="blue"
                />
                <MetricCard
                    label={t("Reranking Access") || "Reranking Access"}
                    value={rerankCount}
                    icon={Lock}
                    iconColor="orange"
                />
                <MetricCard
                    label={t("Project Edit Access") || "Project Edit Access"}
                    value={editCount}
                    icon={Pencil}
                    iconColor="green"
                />
                <MetricCard
                    label={t("Active Permissions") || "Active Permissions"}
                    value={rerankCount + editCount}
                    icon={Key}
                    iconColor="purple"
                />
            </div>

            {/* ---- Tool Actions ---- */}
            <div className="admin-toolbar-row mb-3 mt-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="business-selector-minimal">
                        <Form.Label className="admin-cell-secondary mb-1 fw-bold" style={{ fontSize: '17px', marginLeft:'10px', textTransform: 'uppercase' }}>
                            {t("Select_Business")}
                        </Form.Label>
                        <Form.Select
                            value={selectedBusinessId}
                            onChange={(e) => setSelectedBusinessId(e.target.value)}
                            className="role-select"
                            style={{ minWidth: '220px' }}
                        >
                            {businesses.map((b) => (
                                <option key={b._id} value={b._id}>
                                    {b.business_name || b.name}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                </div>
            </div>

            <AdminTable
                title={t("access_management")}
                count={accessData?.access_list.length}
                countLabel={t("Users")}
                columns={columns}
                data={accessData?.access_list || []}
                loading={loading}
                emptyMessage={t("No users have been granted access yet for this business.")}
                searchPlaceholder={t("Search users...")}
            />

            {/* Revoke Modal */}
            <Modal show={showRevokeModal} onHide={() => setShowRevokeModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="border-0 pb-2">
                    <Modal.Title className="fw-bold">{t("Confirm Revocation")}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4">
                    {revokeDetails && (
                        <div>
                            <p className="mb-4">
                                Are you sure you want to revoke <strong>
                                    {revokeDetails.accessType === "all" ? "all access" :
                                        revokeDetails.accessType === "rerank" ? "reranking access" : "edit access"}
                                </strong> for <strong>{revokeDetails.user.user_name}</strong>?
                            </p>

                            <div className="user-preview-minimal p-3 border rounded bg-light mb-3">
                                <div className="fw-bold">{revokeDetails.user.user_name}</div>
                                <div className="text-muted small">{revokeDetails.user.user_email}</div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="link" className="text-muted text-decoration-none" onClick={() => setShowRevokeModal(false)} disabled={revoking}>
                        {t("cancel")}
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleRevokeAccess} disabled={revoking} className="px-4" style={{ borderRadius: '8px' }}>
                        {revoking ? t("Revoking...") : t("Revoke Access")}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AccessManagement;