import React, { useState, useEffect } from "react";
import { Table, Badge, Spinner, Form, Button, Modal } from "react-bootstrap";
import { Shield, Lock, Pencil, Users, AlertCircle, Trash2 } from "lucide-react";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";
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
            const res = await axios.get(`${BACKEND_URL}/api/businesses`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = Array.isArray(res.data)
                ? res.data
                : res.data.businesses || [];

            const launchedBusinesses = data.filter(b => b.status === "launched");
            setBusinesses(launchedBusinesses);

            if (launchedBusinesses.length > 0 && !selectedBusinessId) {
                setSelectedBusinessId(launchedBusinesses[0]._id);
            }
        } catch (err) {
            console.error("Failed to fetch businesses", err);
            onToast("Failed to load businesses", "error");
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

    if (businesses.length === 0) {
        return (
            <div className="access-management-container minimal">
                <div className="access-content">
                    <div className="empty-state minimal-empty text-center p-5 border rounded">
                        <AlertCircle size={48} className="text-muted mb-3" />
                        <h4 className="fw-bold">{t("No Launched Businesses")}</h4>
                        <p className="text-muted mb-0">
                            {t('No businesses have been launched yet. Access management is only available for launched businesses.')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="access-management-container minimal">
            <div className="access-content">
                {/* Minimal Header */}
                <div className="access-header-minimal">
                    <h2 className="minimal-page-title">{t("access_management")}</h2>
                    <p className="minimal-page-subtitle text-muted">
                        {t("Manage user permissions and access levels.")}
                    </p>
                </div>

                {loading ? (
                    <div className="loading-container p-5 text-center">
                        <Spinner animation="border" variant="secondary" size="md" />
                        <p className="loading-text mt-3 text-muted">{t("Loading...")}</p>
                    </div>
                ) : (
                    <>
                        {/* Compact Summary Row */}
                        {accessData && (
                            <div className="compact-summary-row mb-4">
                                <div className="summary-item">
                                    <span className="summary-label">{t("Total Users")}:</span>
                                    <span className="summary-value-minimal">{accessData.total_users_with_access}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">{t("Reranking Access")}:</span>
                                    <span className="summary-value-minimal">
                                        {accessData.access_list.filter(u => u.has_rerank_access).length}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">{t("Project Edit Access")}:</span>
                                    <span className="summary-value-minimal">
                                        {accessData.access_list.filter(u => u.has_project_edit_access).length}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Main Interaction Area */}
                        <div className="table-controls-compact d-flex justify-content-between align-items-end mb-3">
                            <div className="business-selector-minimal">
                                <Form.Label className="minimal-label mb-1">
                                    {t("Select_Business")}
                                </Form.Label>
                                <Form.Select
                                    value={selectedBusinessId}
                                    onChange={(e) => setSelectedBusinessId(e.target.value)}
                                    className="minimal-select"
                                >
                                    {businesses.map((b) => (
                                        <option key={b._id} value={b._id}>
                                            {b.business_name || b.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                            {accessData && (
                                <div className="table-info-minimal">
                                    <span className="text-muted small">
                                        {t('Showing')} <strong>{accessData.access_list.length}</strong> {t('users')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {accessData ? (
                            <div className="table-card border-0 mt-2">
                                {accessData.access_list.length === 0 ? (
                                    <div className="empty-state p-5 text-center">
                                        <Shield size={64} className="empty-icon text-muted mb-3" />
                                        <p className="text-muted fs-5">
                                            No users have been granted access yet for this business.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <Table hover className="access-table mb-0 align-middle">
                                            <thead>
                                                <tr>
                                                    <th>{t('user')}</th>
                                                    <th className="text-center">{t("Permissions")}</th>
                                                    <th>{t("Projects with Access")}</th>
                                                    <th className="text-end px-4">{t('actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accessData.access_list.map((user) => (
                                                    <tr key={user.user_id}>
                                                        {/* User Column */}
                                                        <td>
                                                            <div className="user-cell">

                                                                <div className="user-info">
                                                                    <div className="user-name">{user.user_name}</div>
                                                                    <div className="user-email">{user.user_email}</div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Permissions Column */}
                                                        <td className="text-center">
                                                            <div className="access-badges">
                                                                {user.has_rerank_access && (
                                                                    <Badge className="access-badge rerank">
                                                                        <Lock size={12} />
                                                                        {t("Rerank")}
                                                                    </Badge>
                                                                )}
                                                                {user.has_project_edit_access && (
                                                                    <Badge className="access-badge edit">
                                                                        <Pencil size={12} />
                                                                        {t("Edit")}
                                                                    </Badge>
                                                                )}
                                                                {!user.has_rerank_access && !user.has_project_edit_access && (
                                                                    <span className="text-muted italic small">No special access</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Projects Column */}
                                                        <td>
                                                            <div className="projects-cell">
                                                                {user.projects_with_access.length > 0 ? (
                                                                    <div className="projects-preview">
                                                                        {user.projects_with_access.slice(0, 3).map((project) => (
                                                                            <Badge
                                                                                key={project.project_id}
                                                                                className="project-badge text-truncate"
                                                                                title={project.project_name}
                                                                            >
                                                                                {project.project_name}
                                                                            </Badge>
                                                                        ))}
                                                                        {user.projects_with_access.length > 3 && (
                                                                            <Badge className="project-count-badge bg-light text-dark border">
                                                                                +{user.projects_with_access.length - 3}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted small">—</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Actions Column */}
                                                        <td className="text-end px-4">
                                                            <div className="d-flex gap-2 justify-content-end">
                                                                {user.has_rerank_access && (
                                                                    <Button
                                                                        variant="outline-warning"
                                                                        size="sm"
                                                                        onClick={() => handleOpenRevokeModal(user, "rerank")}
                                                                        className="revoke-btn"
                                                                        title="Revoke Rerank Access"
                                                                    >
                                                                        <Lock size={14} />
                                                                    </Button>
                                                                )}
                                                                {user.has_project_edit_access && (
                                                                    <Button
                                                                        variant="outline-success"
                                                                        size="sm"
                                                                        onClick={() => handleOpenRevokeModal(user, "project_edit")}
                                                                        className="revoke-btn"
                                                                        title="Revoke Project Edit Access"
                                                                    >
                                                                        <Pencil size={14} />
                                                                    </Button>
                                                                )}
                                                                {(user.has_rerank_access || user.has_project_edit_access) && (
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={() => handleOpenRevokeModal(user, "all")}
                                                                        className="revoke-btn btn-danger-hover"
                                                                        title="Revoke All Access"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="minimal-select-notice border p-5 text-center bg-white rounded">
                                <Users size={48} className="text-light mb-3" />
                                <p className="text-muted mb-0">Please select a business above to view access list.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Revoke Modal - Kept Minimalist */}
                <Modal
                    show={showRevokeModal}
                    onHide={() => setShowRevokeModal(false)}
                    centered
                    backdrop="static"
                    className="minimal-modal"
                >
                    <Modal.Header closeButton>
                        <Modal.Title className="fs-5 fw-bold">{t("Confirm Revocation")}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
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
                            Cancel
                        </Button>
                        <Button variant="danger" size="sm" onClick={handleRevokeAccess} disabled={revoking} className="px-4">
                            {revoking ? t("Revoking...") : t("Revoke Access")}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default AccessManagement;