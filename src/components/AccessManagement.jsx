import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Badge, Spinner, Form, Button, Modal } from "react-bootstrap";
import { Shield, Lock, Pencil, Users, AlertCircle, Trash2, AlertTriangle } from "lucide-react";
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
            <Container fluid className="p-4">
                <Card className="text-center p-5">
                    <AlertCircle size={48} className="mx-auto mb-3 text-muted" />
                    <h5>{t("No Launched Businesses")}</h5>
                    <p className="text-muted">
                        {t('No businesses have been launched yet. Access management is only available for launched businesses.')}
                    </p>
                </Card>
            </Container>
        );
    }

    return (
        <Container fluid className="p-4">
            <div className="access-header">
            <h2 className="page-title">{t("access_management")}</h2>
            </div>

            <div className="access-content">
                
                {/* Business Selector */}
                <Card className="business-selector-card mb-4">
                <Card.Body>
                    <Form.Group>
                    <Form.Label className="selector-label">
                        {t("Select_Business")}
                    </Form.Label>
                    <Form.Select
                        value={selectedBusinessId}
                        onChange={(e) => setSelectedBusinessId(e.target.value)}
                        className="business-select"
                    >
                        <option value="">Select a business</option>
                        {businesses.map((b) => (
                        <option key={b._id} value={b._id}>
                            {b.business_name || b.name}
                        </option>
                        ))}
                    </Form.Select>
                    </Form.Group>
                </Card.Body>
                </Card>


            {loading ? (
                <div className="text-center p-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Loading access data...</p>
                </div>
            ) : accessData ? (
                <>
                    {/* Summary Cards */}
                    <Row className="mb-4 g-3">
                        <Col md={4}>
                            <Card body className="summary-card">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="summary-icon bg-primary-light">
                                        <Users size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h6 className="mb-0 text-muted">{t("Total Users with Access")}</h6>
                                        <h3 className="mb-0 fw-bold">{accessData.total_users_with_access}</h3>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card body className="summary-card">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="summary-icon bg-warning-light">
                                        <Lock size={24} className="text-warning" />
                                    </div>
                                    <div>
                                        <h6 className="mb-0 text-muted">{t('Reranking Access')}</h6>
                                        <h3 className="mb-0 fw-bold">
                                            {accessData.access_list.filter(u => u.has_rerank_access).length}
                                        </h3>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card body className="summary-card">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="summary-icon bg-success-light">
                                        <Pencil size={24} className="text-success" />
                                    </div>
                                    <div>
                                        <h6 className="mb-0 text-muted">{t('Project Edit Access')}</h6>
                                        <h3 className="mb-0 fw-bold">
                                            {accessData.access_list.filter(u => u.has_project_edit_access).length}
                                        </h3>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Access List Table */}
                    <Card>
                        <Card.Body>
                            <h5 className="fw-semibold mb-3">
                                {t('Users with Granted Access')} ({accessData.access_list.length})
                            </h5>

                            {accessData.access_list.length === 0 ? (
                                <div className="text-center p-5">
                                    <Shield size={48} className="text-muted mb-3" />
                                    <p className="text-muted">
                                        No users have been granted access yet.
                                    </p>
                                </div>
                            ) : (
                                <Table hover responsive className="align-middle">
                                    <thead className="table-heading">
                                        <tr>
                                            <th>{t('user')}</th>
                                            <th className="text-center">{t("Rerank Access")}</th>
                                            <th className="text-center">{t("Project Edit Access")}</th>
                                            <th>{t("Projects with Access")}</th>
                                            <th className="text-center">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accessData.access_list.map((user) => (
                                            <tr key={user.user_id}>
                                                {/* User Column */}
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div
                                                            style={{
                                                                width: "35px",
                                                                height: "35px",
                                                                backgroundColor: "#e6f1ff",
                                                                borderRadius: "50%",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontWeight: "bold",
                                                                color: "#3f51b5",
                                                            }}
                                                        >
                                                            {user.user_name?.[0] || "U"}
                                                        </div>
                                                        <div>
                                                            <div className="fw-semibold">{user.user_name}</div>
                                                            <small className="text-muted">{user.user_email}</small>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Rerank Access Column */}
                                                <td className="text-center">
                                                    {user.has_rerank_access ? (
                                                        <Badge bg="warning" className="d-flex align-items-center gap-1 justify-content-center" style={{ width: "fit-content", margin: "0 auto" }}>
                                                            <Lock size={14} />
                                                            Yes
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>

                                                {/* Project Edit Access Column */}
                                                <td className="text-center">
                                                    {user.has_project_edit_access ? (
                                                        <Badge bg="success" className="d-flex align-items-center gap-1 justify-content-center" style={{ width: "fit-content", margin: "0 auto" }}>
                                                            <Pencil size={14} />
                                                            Yes
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>

                                                {/* Projects with Access Column */}
                                                <td>
                                                    {user.projects_with_access.length > 0 ? (
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {user.projects_with_access.map((project) => (
                                                                <Badge
                                                                    key={project.project_id}
                                                                    bg="light"
                                                                    text="dark"
                                                                    className="project-badge"
                                                                    title={project.project_name}
                                                                >
                                                                    {project.project_name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>

                                                {/* Actions Column */}
                                                <td className="text-center">
                                                    <div className="d-flex gap-2 justify-content-center">
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
                                                                className="revoke-btn"
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
                            )}
                        </Card.Body>
                    </Card>
                </>
            ) : (
                <Card className="text-center p-5">
                    <p className="text-muted">Select a business to view access data</p>
                </Card>
            )}

            {/* Revoke Access Confirmation Modal */}
            <Modal
                show={showRevokeModal}
                onHide={() => setShowRevokeModal(false)}
                centered
                backdrop="static"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <AlertTriangle size={24} className="text-warning" />
                        Confirm Revoke Access
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    {revokeDetails && (
                        <div>
                            <div className="alert alert-warning d-flex align-items-start gap-2 mb-3">
                                <AlertTriangle size={20} className="mt-1 flex-shrink-0" />
                                <div>
                                    <strong>Warning:</strong> This action will immediately remove access permissions.
                                </div>
                            </div>

                            <div className="revoke-details">
                                <p className="mb-2">
                                    <strong>User:</strong> {revokeDetails.user.user_name} ({revokeDetails.user.user_email})
                                </p>
                                <p className="mb-2">
                                    <strong>Access to Revoke:</strong>{" "}
                                    <Badge
                                        bg={
                                            revokeDetails.accessType === "all"
                                                ? "danger"
                                                : revokeDetails.accessType === "rerank"
                                                    ? "warning"
                                                    : "success"
                                        }
                                    >
                                        {revokeDetails.accessType === "all"
                                            ? "All Access"
                                            : revokeDetails.accessType === "rerank"
                                                ? "Reranking Access"
                                                : "Project Edit Access"}
                                    </Badge>
                                </p>

                                {revokeDetails.accessType === "all" && (
                                    <div className="mt-3 p-3 bg-light rounded">
                                        <p className="mb-2"><strong>This will revoke:</strong></p>
                                        <ul className="mb-0">
                                            {revokeDetails.user.has_rerank_access && (
                                                <li>Reranking access for this business</li>
                                            )}
                                            {revokeDetails.user.has_project_edit_access && (
                                                <li>
                                                    Edit access for {revokeDetails.user.projects_with_access.length} project(s)
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {revokeDetails.accessType === "project_edit" && revokeDetails.user.projects_with_access.length > 0 && (
                                    <div className="mt-3 p-3 bg-light rounded">
                                        <p className="mb-2"><strong>Projects affected:</strong></p>
                                        <div className="d-flex flex-wrap gap-1">
                                            {revokeDetails.user.projects_with_access.map((project) => (
                                                <Badge key={project.project_id} bg="secondary">
                                                    {project.project_name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button
                        variant="light"
                        onClick={() => setShowRevokeModal(false)}
                        disabled={revoking}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleRevokeAccess}
                        disabled={revoking}
                        className="d-flex align-items-center gap-2"
                    >
                        {revoking ? (
                            <>
                                <Spinner animation="border" size="sm" />
                                Revoking...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Revoke Access
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
            </div>
        </Container>
    );
};

export default AccessManagement;