import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Card, Row, Col, Badge, Alert } from 'react-bootstrap';
import { Briefcase, Users, CheckCircle, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const UpgradeReactivationModal = ({
    show,
    onHide,
    data,
    onConfirm,
    submitting,
    externalError
}) => {
    const { t } = useTranslation();
    const [selectedBusinessIds, setSelectedBusinessIds] = useState([]);
    const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [selectedViewerIds, setSelectedViewerIds] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (show && data) {
            setSelectedBusinessIds(data.active_businesses?.map(b => b._id) || []);
            setSelectedCollaboratorIds(data.active_collaborators?.map(u => u._id) || []);
            setSelectedUserIds(data.active_users?.map(u => u._id) || []);
            setSelectedViewerIds(data.active_viewers?.map(u => u._id) || []);
            setError(null);
        } else if (!show) {
            setSelectedBusinessIds([]);
            setSelectedCollaboratorIds([]);
            setSelectedUserIds([]);
            setSelectedViewerIds([]);
            setError(null);
        }
    }, [show, data]);

    const errorMessage = externalError || error;

    const {
        archived_businesses = [],
        active_businesses = [],
        inactive_collaborators = [],
        inactive_users = [],
        inactive_viewers = [],
        active_collaborators = [],
        active_users = [],
        active_viewers = [],
        limits = {},
        plan_id,
        new_plan_name
    } = data || {};

    const maxWorkspaces = limits.max_workspaces || 3;
    const maxCollaborators = limits.max_collaborators || 0;
    const maxUsers = limits.max_users || 0;
    const maxViewers = limits.max_viewers || 0;

    const handleBusinessToggle = (id) => {
        if (selectedBusinessIds.includes(id)) {
            setSelectedBusinessIds(selectedBusinessIds.filter(bid => bid !== id));
            setError(null);
        } else {
            if (selectedBusinessIds.length >= maxWorkspaces) {
                setError(`You can only select up to ${maxWorkspaces} active workspaces.`);
                return;
            }
            setSelectedBusinessIds([...selectedBusinessIds, id]);
            setError(null);
        }
    };

    const handleUserToggle = (id, roleType) => {
        let currentList, setList, limit, roleName;
        if (roleType === 'collaborator') { currentList = selectedCollaboratorIds; setList = setSelectedCollaboratorIds; limit = maxCollaborators; roleName = 'collaborators'; }
        else if (roleType === 'user') { currentList = selectedUserIds; setList = setSelectedUserIds; limit = maxUsers; roleName = 'standard users'; }
        else if (roleType === 'viewer') { currentList = selectedViewerIds; setList = setSelectedViewerIds; limit = maxViewers; roleName = 'viewers'; }

        if (currentList.includes(id)) {
            setList(currentList.filter(uid => uid !== id));
            setError(null);
        } else {
            if (currentList.length >= limit) {
                setError(`You can only select up to ${limit} active ${roleName}.`);
                return;
            }
            setList([...currentList, id]);
            setError(null);
        }
    };

    const handleConfirm = () => {
        // Calculate diff between active arrays and selected arrays to find archives/reactivates
        const activeBizIds = new Set(active_businesses?.map(b => b._id) || []);
        const reactivate_business_ids = selectedBusinessIds.filter(id => !activeBizIds.has(id));
        const archive_business_ids = Array.from(activeBizIds).filter(id => !selectedBusinessIds.includes(id));

        const activeCollabIds = new Set(active_collaborators?.map(u => u._id) || []);
        const reactivate_collaborator_ids = selectedCollaboratorIds.filter(id => !activeCollabIds.has(id));
        const archive_collaborator_ids = Array.from(activeCollabIds).filter(id => !selectedCollaboratorIds.includes(id));

        const activeUserIds = new Set(active_users?.map(u => u._id) || []);
        const reactivate_user_ids = selectedUserIds.filter(id => !activeUserIds.has(id));
        const archive_user_ids = Array.from(activeUserIds).filter(id => !selectedUserIds.includes(id));

        const activeViewerIds = new Set(active_viewers?.map(u => u._id) || []);
        const reactivate_viewer_ids = selectedViewerIds.filter(id => !activeViewerIds.has(id));
        const archive_viewer_ids = Array.from(activeViewerIds).filter(id => !selectedViewerIds.includes(id));

        onConfirm({
            plan_id,
            reactivate_business_ids,
            archive_business_ids,
            reactivate_collaborator_ids,
            archive_collaborator_ids,
            reactivate_user_ids,
            archive_user_ids,
            reactivate_viewer_ids,
            archive_viewer_ids
        });
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="upgrade-reactivation-modal">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold d-flex align-items-center">
                    <Zap className="text-primary me-2" size={24} />
                    Upgrade & Reactivate
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-3">
                <Alert variant="primary" className="mb-4 small border-0 bg-light-blue shadow-sm">
                    <div className="d-flex">
                        <ArrowRight className="me-2 flex-shrink-0" size={16} />
                        <div>
                            {t("Welcome to the")} <strong>{new_plan_name || 'new'}</strong> {t("plan")}!
                            {t("Select collaborators to restore their access, and reactivate the workspaces they need.")}
                        </div>
                    </div>
                </Alert>

                {errorMessage && <Alert variant="danger" className="py-2 small">{errorMessage}</Alert>}

                {/* ARCHIVED BUSINESSES SECTION */}
                {(archived_businesses.length > 0 || active_businesses?.length > 0) && (
                    <div className="mb-4">
                        <h6 className="mb-3 text-uppercase small fw-bold text-muted d-flex align-items-center">
                            <Briefcase size={16} className="me-1" />
                            Workspaces ({selectedBusinessIds.length + (active_businesses?.length || 0)}/{maxWorkspaces} limit)
                        </h6>
                        <Row xs={1} md={2} className="g-3">
                            {active_businesses?.map(business => (
                                <Col key={`active-${business._id}`}>
                                    <Card 
                                        className={`h-100 cursor-pointer selection-card ${selectedBusinessIds.includes(business._id) ? 'selected bg-light-blue border-primary' : ''}`} 
                                        onClick={() => handleBusinessToggle(business._id)}
                                    >
                                        <Card.Body className="p-3 d-flex align-items-center">
                                            <Form.Check
                                                type="checkbox"
                                                checked={selectedBusinessIds.includes(business._id)}
                                                onChange={() => { }}
                                                className="me-2"
                                            />
                                            <div className="ms-2 overflow-hidden flex-grow-1">
                                                <div className="fw-bold text-truncate">{business.business_name}</div>
                                                <div className="small text-primary fw-bold">Active Workspace</div>
                                            </div>
                                            <CheckCircle className="ms-auto text-primary" size={20} />
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                            {archived_businesses.map(business => (
                                <Col key={business._id}>
                                    <Card
                                        className={`h-100 cursor-pointer selection-card ${selectedBusinessIds.includes(business._id) ? 'selected' : ''}`}
                                        onClick={() => handleBusinessToggle(business._id)}
                                    >
                                        <Card.Body className="p-3 d-flex align-items-center">
                                            <Form.Check
                                                type="checkbox"
                                                checked={selectedBusinessIds.includes(business._id)}
                                                onChange={() => { }}
                                                className="me-2"
                                            />
                                            <div className="ms-2 overflow-hidden flex-grow-1">
                                                <div className="fw-bold text-truncate">{business.business_name}</div>
                                                <div className="small text-muted">Archived Workspace</div>
                                            </div>
                                            {selectedBusinessIds.includes(business._id) && (
                                                <CheckCircle className="ms-auto text-primary" size={20} />
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                {/* USERS SECTIONS */}
                {[
                    { title: 'Collaborators', inactive: inactive_collaborators, active: active_collaborators, limit: maxCollaborators, roleType: 'collaborator', selectedList: selectedCollaboratorIds },
                    { title: 'Standard Users', inactive: inactive_users, active: active_users, limit: maxUsers, roleType: 'user', selectedList: selectedUserIds },
                    { title: 'Viewers', inactive: inactive_viewers, active: active_viewers, limit: maxViewers, roleType: 'viewer', selectedList: selectedViewerIds }
                ].map((section, idx) => {
                    if (section.inactive.length === 0 && section.active.length === 0) return null;
                    return (
                        <div className="mb-4" key={idx}>
                            <h6 className="mb-3 text-uppercase small fw-bold text-muted d-flex align-items-center">
                                <Users size={16} className="me-1" />
                                {section.title} ({section.selectedList.length + section.active.length}/{section.limit} limit)
                            </h6>
                            <div className="collaborator-list">
                                {section.active.map(user => (
                                    <Card 
                                        key={`active-${user._id}`} 
                                        className={`mb-3 cursor-pointer collaborator-card ${section.selectedList.includes(user._id) ? 'selected bg-light-blue border-primary' : ''}`}
                                        onClick={() => handleUserToggle(user._id, section.roleType)}
                                    >
                                        <Card.Body className="p-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={section.selectedList.includes(user._id)}
                                                    onChange={() => { }}
                                                    className="me-2"
                                                />
                                                <div className="ms-2 overflow-hidden flex-grow-1">
                                                    <div className="fw-bold text-truncate text-dark">{user.name || user.email}</div>
                                                    <div className="small text-muted">{user.email}</div>
                                                </div>
                                                <Badge bg="primary" pill>Active</Badge>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                                {section.inactive.map(user => (
                                    <Card
                                        key={user._id}
                                        className={`mb-3 collaborator-card ${section.selectedList.includes(user._id) ? 'selected' : ''}`}
                                    >
                                        <Card.Body className="p-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={section.selectedList.includes(user._id)}
                                                    onChange={() => handleUserToggle(user._id, section.roleType)}
                                                    className="me-2"
                                                />
                                                <div className="ms-2 overflow-hidden flex-grow-1">
                                                    <div className="fw-bold text-truncate">{user.name || user.email}</div>
                                                    <div className="small text-muted">{user.email}</div>
                                                </div>
                                                {section.selectedList.includes(user._id) && (
                                                    <Badge bg="primary" pill>Selected</Badge>
                                                )}
                                            </div>

                                            {/* Show associated businesses as badges for collaborators */}
                                            {user.associated_business_ids?.length > 0 && (
                                                <div className="ms-4 ps-2 border-start mt-2">
                                                    <div className="x-small text-muted mb-1">Associated Workspaces:</div>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {user.associated_business_ids.map(bid => {
                                                            const business = archived_businesses.find(b => b._id === bid);
                                                            if (!business) return null;
                                                            const isSelected = selectedBusinessIds.includes(bid);
                                                            return (
                                                                <Badge
                                                                    key={bid}
                                                                    bg={isSelected ? "success" : "light"}
                                                                    text={isSelected ? "white" : "dark"}
                                                                    className="border cursor-pointer fw-normal"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleBusinessToggle(bid);
                                                                    }}
                                                                >
                                                                    {business.business_name}
                                                                    {isSelected && <CheckCircle size={10} className="ms-1 font-weight-bold" />}
                                                                </Badge>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="link" onClick={onHide} className="text-decoration-none text-muted">
                    Skip for Now
                </Button>
                <Button
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="px-4 py-2 fw-bold d-flex align-items-center gap-2"
                >
                    <ShieldCheck size={18} />
                    {submitting ? 'Updating...' : 'Confirm & Reactivate'}
                </Button>
            </Modal.Footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                .upgrade-reactivation-modal .modal-content {
                    border-radius: 12px;
                    border: none;
                }
                .collaborator-card {
                    transition: all 0.2s ease;
                    border: 2px solid #f0f0f0;
                }
                .collaborator-card.selected {
                    border-color: #0d6efd;
                    background-color: #f8fbff;
                }
                .selection-card {
                    transition: all 0.2s ease;
                    border: 2px solid #f0f0f0;
                    cursor: pointer;
                }
                .selection-card:hover {
                    border-color: #e0e0e0;
                    background-color: #fcfcfc;
                }
                .selection-card.selected {
                    border-color: #0d6efd;
                    background-color: #f0f7ff;
                }
                .business-mini-card {
                    background: white;
                    border: 1px solid #dee2e6;
                    transition: all 0.1s ease;
                }
                .business-mini-card:hover {
                    border-color: #adb5bd;
                }
                .business-mini-card.selected {
                    background: #e7f1ff;
                    border-color: #0d6efd;
                }
                .mini-check .form-check-input {
                    width: 1rem;
                    height: 1rem;
                    margin-top: 0;
                }
                .bg-light-blue {
                    background-color: #f0f7ff;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
            `}} />
        </Modal>
    );
};

export default UpgradeReactivationModal;
