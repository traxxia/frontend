import React, { useState, useEffect, useRef } from "react";
import { Table, Badge, Spinner, Form, Button, Modal } from "react-bootstrap";
import { Shield, Lock, Pencil, Users, AlertCircle, Trash2, Activity, Key, ListOrdered, FileEdit, ShieldOff, FolderX, UserMinus } from "lucide-react";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";
import AdminTable from "./AdminTable";
import MetricCard from "./MetricCard";
import "../styles/AdminTableStyles.css";
import "../styles/accessmanagement.css";

import { useBusinesses, useAccessControlQuery } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useProjectStore } from "../store";

const AccessManagement = ({ onToast }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    // --- TanStack Query Hooks ---
    const { data: businessesRaw, isLoading: fetchingBusinesses } = useBusinesses();
    // Combine owned + collaborating for the admin access management view
    const businessesQuery = React.useMemo(() => [
        ...(businessesRaw?.businesses || []),
        ...(businessesRaw?.collaborating_businesses || [])
    ], [businessesRaw]);
    const businesses = businessesQuery.filter(b =>
        ((b.status || "").toLowerCase() === 'launched' || b.has_launched_projects === true) &&
        b.has_access_grants === true
    );

    const [selectedBusinessId, setSelectedBusinessId] = useState("");

    const { data: accessData, isLoading: loadingAccess } = useAccessControlQuery(selectedBusinessId);

    // Auto-select first business if none selected
    useEffect(() => {
        if (!selectedBusinessId && businesses.length > 0) {
            setSelectedBusinessId(businesses[0]._id);
        }
    }, [businesses, selectedBusinessId]);

    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [revokeDetails, setRevokeDetails] = useState(null);
    const [revoking, setRevoking] = useState(false);
    const token = useAuthStore(state => state.token);

    const isLoading = fetchingBusinesses || loadingAccess;

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
            const { revokeAccess } = useProjectStore.getState();

            const result = await revokeAccess(
                revokeDetails.business_id,
                revokeDetails.user.user_id,
                revokeDetails.accessType
            );

            if (result.success) {
                onToast(
                    `Successfully revoked ${revokeDetails.accessType === "all" ? "all access" : revokeDetails.accessType + " access"} for ${revokeDetails.user.user_name}`,
                    "success"
                );
                setShowRevokeModal(false);
                setRevokeDetails(null);
                queryClient.invalidateQueries({ queryKey: ["accessControl", selectedBusinessId] });
                queryClient.invalidateQueries({ queryKey: ["businesses"] });
            } else {
                onToast(result.error || "Failed to revoke access", "error");
            }
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
                        <span className="admin-status-badge prioritized" style={{ fontSize: '0.9rem' }}>
                            <ListOrdered size={12} className="me-1" /> {t("Rerank")}
                        </span>
                    )}
                    {row.has_project_edit_access && (
                        <span className="admin-status-badge active" style={{ fontSize: '0.9rem' }}>
                            <FileEdit size={12} className="me-1" /> {t("Edit")}
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
                            <span key={idx} title={p.project_name} className="admin-status-badge archived" style={{ fontSize: '0.9rem', maxWidth: 'auto', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                            <ShieldOff size={14} />
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
                            <FolderX size={14} />
                        </Button>
                    )}
                    {(row.has_rerank_access || row.has_project_edit_access) && (
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="d-flex align-items-center gap-1"
                            title="Revoke All Access"
                            onClick={() => handleOpenRevokeModal(row, "all")}
                            disabled={revoking}
                        >
                            <UserMinus size={14} /> {t("Revoke All")}
                        </Button>
                    )}
                </>
            )
        }
    ];

    const rerankCount = accessData?.access_list?.filter(u => u.has_rerank_access).length || 0;
    const editCount = accessData?.access_list?.filter(u => u.has_project_edit_access).length || 0;

    return (
        <div>
            {/* ---- Tool Actions ---- */}
            <div className="admin-toolbar-row mb-3 mt-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="business-selector-minimal">
                        <Form.Label className="admin-cell-secondary mb-1 fw-bold" style={{ fontSize: '17px', marginLeft: '10px', textTransform: 'uppercase' }}>
                            {t("Select_Business")}
                        </Form.Label>
                        <Form.Select
                            value={selectedBusinessId}
                            onChange={(e) => setSelectedBusinessId(e.target.value)}
                            className="role-select"
                            style={{ minWidth: '220px' }}
                            disabled={isLoading || businesses.length === 0}
                        >
                            {businesses.length === 0 ? (
                                <option value="">{t("No_Business_Found")}</option>
                            ) : (
                                <>
                                    {/* No placeholder here as it auto-selects the first one in the original logic, 
                                        but if businesses > 0 we keep the original mapping */}
                                    {businesses.map((b) => (
                                        <option key={b._id} value={b._id}>
                                            {b.business_name || b.name}
                                        </option>
                                    ))}
                                </>
                            )}
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
                loading={isLoading}
                emptyMessage={
                    businesses.length === 0
                        ? t("no_launched_businesses_found") || "No Launched Businesses Found"
                        : t("no_users_granted_access") || "No users have been granted access yet for this business."
                }
                emptySubMessage={businesses.length === 0 ? t("Access management is only available for launched businesses.") : ""}
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