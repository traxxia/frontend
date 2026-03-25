import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Briefcase, Users, CheckCircle, AlertTriangle, User, UserCog, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import axios from 'axios';

const DowngradeSelectionModal = ({
    show,
    onHide,
    data,
    newPlanDetails,
    onConfirm,
    submitting,
    externalError
}) => {
    const { t } = useTranslation();
    const [selectedBusinessId, setSelectedBusinessId] = useState(null);
    const [error, setError] = useState(null);
    
    // User lists and selections
    const [isFetchingUsers, setIsFetchingUsers] = useState(false);
    const [companyUsers, setCompanyUsers] = useState([]);
    const [selectedCollaborators, setSelectedCollaborators] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedViewers, setSelectedViewers] = useState([]);

    const errorMessage = externalError || error;

    const { businesses = [], new_plan } = data || {};
    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        if (show) {
            fetchUsers();
            
            // Auto-select the first workspace if available
            if (businesses && businesses.length > 0 && !selectedBusinessId) {
                setSelectedBusinessId(businesses[0]._id);
            }
        } else {
            // Reset state when hiding
            setSelectedBusinessId(null);
            setCompanyUsers([]);
            setSelectedCollaborators([]);
            setSelectedUsers([]);
            setSelectedViewers([]);
            setError(null);
        }
    }, [show]); // Run once when show toggles

    const fetchUsers = async () => {
        setIsFetchingUsers(true);
        setError(null);
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const usersData = Array.isArray(res.data) ? res.data : res.data.users || [];
            
            // Only consider standard users that count towards limits
            const standardUsers = usersData.filter(u => {
                const role = (u.role_name || u.role || '').toLowerCase();
                return ['collaborator', 'user', 'viewer'].includes(role);
            });
            
            setCompanyUsers(standardUsers);
            setSelectedCollaborators([]);
            setSelectedUsers([]);
            setSelectedViewers([]);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError(t("Failed to fetch users."));
        } finally {
            setIsFetchingUsers(false);
        }
    };

    const handleBusinessSelect = (businessId) => {
        if (selectedBusinessId === businessId) {
            setSelectedBusinessId(null);
        } else {
            setSelectedBusinessId(businessId);
        }
    };

    const handleUserToggle = (userId, role) => {
        const lowerRole = role.toLowerCase();
        let selectedList;
        let setSelectedList;
        let limit = 0;

        if (lowerRole === 'collaborator') {
            selectedList = selectedCollaborators;
            setSelectedList = setSelectedCollaborators;
            limit = newPlanDetails?.limits?.collaborators || 0;
        } else if (lowerRole === 'user') {
            selectedList = selectedUsers;
            setSelectedList = setSelectedUsers;
            limit = newPlanDetails?.limits?.users || 0;
        } else if (lowerRole === 'viewer') {
            selectedList = selectedViewers;
            setSelectedList = setSelectedViewers;
            limit = newPlanDetails?.limits?.viewers || 0;
        } else {
            return;
        }

        if (selectedList.includes(userId)) {
            setSelectedList(selectedList.filter(id => id !== userId));
            setError(null);
        } else {
            if (selectedList.length >= limit) {
                setError(t(`You have reached the maximum allowed limit for ${lowerRole}s in the new plan.`));
                return;
            }
            setSelectedList([...selectedList, userId]);
            setError(null);
        }
    };

    const handleConfirm = () => {
        if (businesses.length > 0 && !selectedBusinessId) {
            setError(t('Please select a workspace to keep active.'));
            return;
        }
        onConfirm({
            active_business_id: selectedBusinessId,
            active_collaborator_ids: selectedCollaborators,
            active_user_ids: selectedUsers,
            active_viewer_ids: selectedViewers
        });
    };

    const getRoleUsers = (roleName) => companyUsers.filter(u => (u.role_name || u.role || '').toLowerCase() === roleName.toLowerCase());

    const RoleSection = ({ roleName, title, icon: Icon, selectedList, limit }) => {
        const usersInRole = getRoleUsers(roleName);
        if (usersInRole.length === 0) return null;

        return (
            <div className="mb-4">
                <h6 className="mb-2 fw-bold d-flex align-items-center">
                    <Icon size={16} className="me-2 text-primary" />
                    {t(title)} ({selectedList.length}/{limit} {t("Selected")})
                </h6>
                <div className="user-selection-list ps-4">
                    {usersInRole.map(user => {
                        const isChecked = selectedList.includes(user._id);
                        const isDisabled = !isChecked && selectedList.length >= limit;
                        return (
                            <Form.Check 
                                key={user._id}
                                type="checkbox"
                                id={`user-${user._id}`}
                                label={
                                    <div className="ms-1">
                                        <div className="fw-medium text-dark">{user.name}</div>
                                        <div className="small text-muted">{user.email}</div>
                                    </div>
                                }
                                checked={isChecked}
                                onChange={() => handleUserToggle(user._id, roleName)}
                                className="mb-2 custom-check"
                                disabled={isDisabled}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="downgrade-selection-modal">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold d-flex align-items-center">
                    <AlertTriangle className="text-warning me-2" size={24} />
                    {t("Downgrade Configuration")}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-3">
                <Alert variant="warning" className="mb-3 border-0 shadow-sm">
                    <div className="d-flex align-items-start">
                        <AlertTriangle className="me-2 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <h6 className="mb-2 fw-bold">{t("Downgrade Impact")}</h6>
                          <p className="mb-2 small">
                            {t("You are downgrading to the")} <strong>{new_plan}</strong> {t("plan")}.
                            {t("Based on your current usage, the following changes will occur")}:
                          </p>
                          <div className="downgrade-impact-details small">
                            <div className="mb-2">
                              <strong>📊 {t("Current Usage")}:</strong>
                              <ul className="mb-1 mt-1 ps-3">
                                <li>{t("Workspaces")}: <strong>{businesses.length}</strong> {t("active")}</li>
                                <li>{t("Total Standard Users")}: <strong>{companyUsers.length || '...'}</strong></li>
                              </ul>
                            </div>
                            <div className="mb-2">
                              <strong>⚠️ {t("What will happen")}:</strong>
                              <ul className="mb-0 mt-1 ps-3">
                                <li>
                                  <strong>{t("Workspaces")}:</strong> {t("Only 1 workspace will remain active")}.
                                  {businesses.length > 1 ? ` ${businesses.length - 1} ${t("workspace(s) will be archived (read-only mode)")}.` : ''}
                                </li>
                                <li>
                                  <strong>{t("Users")}:</strong> {t("Any users that you do not select below will be archived")}.
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                    </div>
                </Alert>

                {errorMessage && <Alert variant="danger" className="py-2 small mb-3">{errorMessage}</Alert>}

                <h6 className="mb-3 text-uppercase small fw-bold text-muted d-flex align-items-center">
                    <Briefcase size={16} className="me-1" />
                    {t("Select Workspace to Keep Active")} ({selectedBusinessId ? '1' : '0'}/1 {t("Selected")})
                </h6>

                <div className="business-selection-list ps-4 mb-4">
                    {businesses.map(business => {
                        const isChecked = selectedBusinessId === business._id;
                        const isDisabled = !isChecked && selectedBusinessId !== null;
                        return (
                            <Form.Check 
                                key={business._id}
                                type="checkbox"
                                id={`business-${business._id}`}
                                label={
                                    <div className="ms-1">
                                        <div className="fw-medium text-dark">{business.business_name}</div>
                                        <div className="small text-muted">{t("Active Workspace")}</div>
                                    </div>
                                }
                                checked={isChecked}
                                onChange={() => handleBusinessSelect(business._id)}
                                className="mb-2 custom-check"
                                disabled={isDisabled}
                            />
                        );
                    })}
                </div>

                {/* Users Selection Area (Always visible to ensure clarity) */}
                <div className="mt-2">
                    <h6 className="mb-3 text-uppercase small fw-bold text-muted d-flex align-items-center border-top pt-3">
                        <Users size={16} className="me-1" />
                        {t("Select Users to Keep Active")}
                    </h6>
                    
                    {isFetchingUsers ? (
                        <div className="d-flex justify-content-center py-4">
                            <Spinner animation="border" variant="primary" size="sm" />
                            <span className="ms-2 small text-muted">{t("Loading users...")}</span>
                        </div>
                    ) : companyUsers.length === 0 ? (
                        <div className="text-muted small ps-3 mb-3 border rounded bg-light p-3 border-warning border-start border-4">
                            {t("No standard users found in your company.")}
                        </div>
                    ) : (
                        <div className="user-selection-area">
                            <RoleSection 
                                roleName="collaborator" 
                                title="Collaborators" 
                                icon={UserCog} 
                                selectedList={selectedCollaborators} 
                                limit={newPlanDetails?.limits?.collaborators || 0} 
                            />
                            <RoleSection 
                                roleName="user" 
                                title="Standard Users" 
                                icon={ShieldCheck} 
                                selectedList={selectedUsers} 
                                limit={newPlanDetails?.limits?.users || 0} 
                            />
                            <RoleSection 
                                roleName="viewer" 
                                title="Viewers" 
                                icon={User} 
                                selectedList={selectedViewers} 
                                limit={newPlanDetails?.limits?.viewers || 0} 
                            />
                        </div>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="link" onClick={onHide} className="text-decoration-none text-muted">
                    {t("Back to Plans")}
                </Button>
                <Button
                    variant="warning"
                    onClick={handleConfirm}
                    disabled={submitting || (businesses.length > 0 && !selectedBusinessId)}
                    className="px-4 py-2 fw-bold"
                >
                    {t(submitting ? "Processing..." : "Downgrade & Archive Others")}
                </Button>
            </Modal.Footer>

            <style dangerouslySetInnerHTML={{
                __html: `
    .downgrade-selection-modal .modal-content {
        border-radius: 12px;
        border: none;
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
    .cursor-pointer {
        cursor: pointer;
    }
    .bg-light-blue {
        background-color: #f0faff;
    }
    .downgrade-impact-details ul {
        margin-bottom: 0.5rem;
    }
    .downgrade-impact-details li {
        margin-bottom: 0.25rem;
        line-height: 1.5;
    }
    .user-selection-list {
        max-height: 200px;
        overflow-y: auto;
    }
    .custom-check .form-check-input {
        margin-top: 5px;
    }
`}} />
        </Modal>
    );
};

export default DowngradeSelectionModal;
