import React, { useState } from 'react';
import { Button, Row, Col, Modal, Form, Alert, Spinner, Dropdown } from "react-bootstrap";
import { Plus, UserCog, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useTranslation } from '../hooks/useTranslation';

// Sub-components
import UserManagementMetrics from '@/components/UserManagement/UserManagementMetrics';
import UserManagementTable from '@/components/UserManagement/UserManagementTable';
import UpgradeModal from "./UpgradeModal";
import PlanLimitModal from "./PlanLimitModal";
import ErrorModal from "./ErrorModal";

// Hooks
import { useUserManagement } from '@/components/UserManagement/hooks/useUserManagement';

import "../styles/usermanagement.css";

const UserManagement = ({ onToast }) => {
  const { t } = useTranslation();
  const {
    users,
    companies,
    allBusinesses,
    launchedBusinesses,
    projects,
    collaborators,
    usage,
    loading,
    loadingCollaborators,
    loadingProjects,
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    handleRoleUpdate,
    addUser,
    handleAssign,
    handleGiveProjectAccess,
    userRole,
    isSubmitting,
    // Access states
    accessBusinessId, setAccessBusinessId,
    selectedProjectId, setSelectedProjectId,
    selectedCollaboratorIds, setSelectedCollaboratorIds,
    accessType, setAccessType
  } = useUserManagement();

  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = ['admin', 'super_admin', 'company_admin'].includes(userRole);

  // Modal Visibility States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showProjectAccessModal, setShowProjectAccessModal] = useState(false);
  const [showAccessConfirmation, setShowAccessConfirmation] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "", role: "", company_id: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Assign States
  const [assignData, setAssignData] = useState({ userId: "", businessId: "" });
  const [assignErrors, setAssignErrors] = useState({});
  const [assigningBusinessCollaborators, setAssigningBusinessCollaborators] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Project Access States
  const [accessErrors, setAccessErrors] = useState({});
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);

  // Role Confirm States
  const [pendingRoleUpdate, setPendingRoleUpdate] = useState(null);

  // Plan Limit Config
  const [planLimitConfig, setPlanLimitConfig] = useState({});
  const [errorModalConfig, setErrorModalConfig] = useState({});

  // --- Handlers ---
  const handleOpenAddModal = () => {
    // Check global limit first
    if (usage && 
        usage.users.current >= usage.users.limit && 
        usage.collaborators.current >= usage.collaborators.limit && 
        usage.viewers.current >= usage.viewers.limit) {
      setPlanLimitConfig({
        title: t("plan_limit_reached"),
        message: t("upgrade_to_add_users"),
        subMessage: t("plan_user_limit_reached", { plan: usage.plan })
      });
      setShowPlanLimitModal(true);
      return;
    }
    setFormData({ name: "", email: "", password: "", confirmPassword: "", role: "", company_id: "" });
    setFormErrors({});
    setShowAddModal(true);
  };

  const validateAddUser = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = t("Name_is_required");
    else if (formData.name.trim().length < 3) errors.name = t("Name_must_be_atleast3_characters_long");
    
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) errors.email = t("Email_is_required");
    else if (!emailPattern.test(formData.email)) errors.email = t("Enter_a_valid_email_address");

    if (!formData.password) errors.password = t("Password_is_required");
    else if (formData.password.length < 8) errors.password = t("Password_must_be_at_least_8_characters");

    if (formData.password !== formData.confirmPassword) errors.confirmPassword = t("passwords_do_not_match");
    if (!formData.role) errors.role = t("Role_is_required");
    if (isSuperAdmin && !formData.company_id) errors.company = t("Company_is_required");

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!validateAddUser()) return;

    // Specific role limit check
    if (usage) {
      const roleKey = formData.role === 'collaborator' ? 'collaborators' : (formData.role === 'viewer' ? 'viewers' : 'users');
      if (usage[roleKey]?.current >= usage[roleKey]?.limit) {
        setPlanLimitConfig({
          title: t("plan_limit_reached"),
          message: `${t("Upgrade to add more")} ${t(formData.role)}s`,
          subMessage: `${t("Your plan allows for")} ${usage[roleKey]?.limit} ${t(formData.role)}${usage[roleKey]?.limit !== 1 ? 's' : ''}.`
        });
        setShowPlanLimitModal(true);
        return;
      }
    }

    const res = await addUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
      ...(isSuperAdmin && { company_id: formData.company_id })
    });

    if (res.success) {
      onToast(t("User_added_successfully"), "success");
      setShowAddModal(false);
    } else {
      setFormErrors({ apiError: res.error });
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignData.userId || !assignData.businessId) {
      setAssignErrors({
        user: !assignData.userId ? t("select_user_required") : "",
        business: !assignData.businessId ? t("select_business_required") : ""
      });
      return;
    }
    setIsAssigning(true);
    const res = await handleAssign(assignData.businessId, assignData.userId);
    setIsAssigning(false);
    if (res.success) {
      onToast(t("User_assigned_successfully"), "success");
      setShowAssignModal(false);
    } else {
      onToast(res.error, "error");
    }
  };

  const handleProceedToConfirmation = () => {
    const errors = {};
    if (!accessBusinessId) errors.business = t("select_business_required");
    if (selectedCollaboratorIds.length === 0) errors.collaborators = t("select_collaborators_at_least_one");
    if (accessType === "projectEdit" && !selectedProjectId) errors.project = t("select_project_required");

    if (Object.keys(errors).length > 0) {
      setAccessErrors(errors);
      return;
    }
    setShowProjectAccessModal(false);
    setShowAccessConfirmation(true);
  };

  const handleGiveProjectAccessSubmit = async () => {
    setIsGrantingAccess(true);
    const res = await handleGiveProjectAccess();
    setIsGrantingAccess(false);
    if (res.success) {
      onToast(t("Access_granted_successfully"), "success");
      setShowAccessConfirmation(false);
      setSelectedProjectId("");
      setSelectedCollaboratorIds([]);
      setAccessBusinessId("");
    } else {
      onToast(res.error, "error");
    }
  };

  const onUpdateRoleRequested = (userId, role, userName) => {
    // Limit check for role update
    if (usage) {
      const roleKey = role === 'collaborator' ? 'collaborators' : (role === 'viewer' ? 'viewers' : 'users');
      if (usage[roleKey]?.current >= usage[roleKey]?.limit) {
        setPlanLimitConfig({
          title: t("plan_limit_reached"),
          message: `${t("Upgrade to add more")} ${t(role)}s`,
          subMessage: `${t("Your plan allows for")} ${usage[roleKey]?.limit} ${t(role)}${usage[roleKey]?.limit !== 1 ? 's' : ''}.`
        });
        setShowPlanLimitModal(true);
        return;
      }
    }
    setPendingRoleUpdate({ userId, role, userName });
    setShowRoleConfirmModal(true);
  };

  const handleConfirmRoleUpdate = async () => {
    if (!pendingRoleUpdate) return;
    const { userId, role } = pendingRoleUpdate;
    const res = await handleRoleUpdate(userId, role);
    if (res.success) {
      onToast(t("User_updated_successfully"), "success");
      setShowRoleConfirmModal(false);
    } else {
      onToast(res.error, "error");
    }
  };

  const formatRoleLabel = (role) => {
    const r = role?.toLowerCase();
    if (r === 'company_admin') return t('Org_Admin');
    if (r === 'collaborator') return t('Collaborator');
    if (r === 'user') return t('User');
    return t('Viewer');
  };

  return (
    <div className="usermanagement-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="section-title mb-0">{t('Team Management')}</h2>
      </div>

      <UserManagementMetrics users={users} currentRole={userRole} />

      <div className="admin-toolbar-row mb-3 d-flex justify-content-end gap-2">
        {isAdmin && !isSuperAdmin && (
          <>
            <Button className="admin-primary-btn" onClick={handleOpenAddModal}>
              <Plus size={16} className="me-2" /> {t("Add_User")}
            </Button>
            <Button className="admin-primary-btn" onClick={() => setShowAssignModal(true)}>
              <UserCog size={16} className="me-2" /> {t("Assign_Business_Access")}
            </Button>
            <Button className="admin-primary-btn" onClick={() => setShowProjectAccessModal(true)}>
              <ShieldCheck size={16} className="me-2" /> {t("Project_Access")}
            </Button>
          </>
        )}
      </div>

      <UserManagementTable 
        users={users}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRoleUpdate={onUpdateRoleRequested}
        isAdmin={isAdmin}
        selectedRoleFilter={selectedRole}
        onRoleFilterChange={setSelectedRole}
      />

      {/* --- Add New User Modal --- */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered scrollable size="lg" className="new-user-modal">
        <Modal.Header closeButton><Modal.Title>{t("New_user")}</Modal.Title></Modal.Header>
        <Modal.Body>
          {formErrors.apiError && <Alert variant="danger" dismissible onClose={() => setFormErrors({})}>{formErrors.apiError}</Alert>}
          <Form onSubmit={handleAddUserSubmit}>
            <fieldset disabled={isSubmitting}>
              <Form.Group as={Row} className="mb-4 align-items-center">
                <Form.Label column sm={4}>{t("email_address")} *</Form.Label>
                <Col sm={8}>
                  <Form.Control type="email" value={formData.email} isInvalid={!!formErrors.email}
                    onChange={e => setFormData({...formData, email: e.target.value})} />
                  <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-4 align-items-center">
                <Form.Label column sm={4}>{t("first_name")} *</Form.Label>
                <Col sm={8}>
                  <Form.Control type="text" value={formData.name} isInvalid={!!formErrors.name}
                    onChange={e => setFormData({...formData, name: e.target.value})} />
                  <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-4 align-items-center">
                <Form.Label column sm={4}>{t("password")} *</Form.Label>
                <Col sm={8}>
                  <div className="password-input-outer">
                    <Form.Control type={showPassword ? "text" : "password"} value={formData.password} isInvalid={!!formErrors.password}
                      onChange={e => setFormData({...formData, password: e.target.value})} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn">
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {formErrors.password && <div className="invalid-feedback d-block">{formErrors.password}</div>}
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-4 align-items-center">
                <Form.Label column sm={4}>{t("confirm_password")} *</Form.Label>
                <Col sm={8}>
                  <div className="password-input-outer">
                    <Form.Control type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} isInvalid={!!formErrors.confirmPassword}
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle-btn">
                      {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {formErrors.confirmPassword && <div className="invalid-feedback d-block">{formErrors.confirmPassword}</div>}
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-4 align-items-center">
                <Form.Label column sm={4}>{t("role")} *</Form.Label>
                <Col sm={8}>
                  <Form.Select value={formData.role} isInvalid={!!formErrors.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="">{t("Select_Role")}</option>
                    <option value="collaborator">{t("Collaborator")}</option>
                    <option value="user">{t("User")}</option>
                    <option value="viewer">{t("Viewer")}</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{formErrors.role}</Form.Control.Feedback>
                </Col>
              </Form.Group>
              {isSuperAdmin && (
                <Form.Group as={Row} className="mb-4 align-items-center">
                  <Form.Label column sm={4}>{t("company")} *</Form.Label>
                  <Col sm={8}>
                    <Form.Select value={formData.company_id} isInvalid={!!formErrors.company} onChange={e => setFormData({...formData, company_id: e.target.value})}>
                      <option value="">{t("Select_Company")}</option>
                      {companies.map(c => <option key={c._id} value={c._id}>{c.company_name}</option>)}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{formErrors.company}</Form.Control.Feedback>
                  </Col>
                </Form.Group>
              )}
            </fieldset>
            <div className="modal-footer">
              <Button variant="link" onClick={() => setShowAddModal(false)} className="btn-cancel" disabled={isSubmitting}>{t("cancel")}</Button>
              <Button variant="primary" type="submit" className="btn-ok" disabled={isSubmitting}>{isSubmitting ? t("Adding") : t("ok")}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* --- Assign Business Access Modal --- */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>{t("Assign_Business_Access")}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAssignSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{t("business")}</Form.Label>
              <Form.Select value={assignData.businessId} isInvalid={!!assignErrors.business}
                onChange={e => {
                  const bId = e.target.value;
                  setAssignData({...assignData, businessId: bId, userId: ""});
                  const biz = allBusinesses.find(b => b._id === bId);
                  setAssigningBusinessCollaborators((biz?.collaborators || []).map(c => typeof c === 'object' ? c._id : c));
                }}>
                <option value="">{allBusinesses.length > 0 ? t("Select_Business") : t("No_Business_Found")}</option>
                {allBusinesses.map(b => <option key={b._id} value={b._id}>{b.business_name || b.name}</option>)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{assignErrors.business}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t("User")}</Form.Label>
              <Form.Select value={assignData.userId} isInvalid={!!assignErrors.user} disabled={!assignData.businessId}
                onChange={e => setAssignData({...assignData, userId: e.target.value})}>
                {(() => {
                  const biz = allBusinesses.find(b => b._id === assignData.businessId);
                  const ownerId = biz?.user_id?.toString();
                  
                  // Check if the business was created by a regular 'user' role
                  const ownerUser = users.find(u => u._id?.toString() === ownerId);
                  const ownerRole = (ownerUser?.role_name || ownerUser?.role)?.toLowerCase();
                  const isOwnerRegularUser = ownerRole === 'user';

                  const filtered = users.filter(u => {
                    const isArchived = u.status === 'inactive' || u.status === 'deleted' || u.access_mode === 'archived';
                    const isAlreadyAssigned = assigningBusinessCollaborators.includes(u._id);
                    const isOwner = u._id?.toString() === ownerId;
                    const role = (u.role_name || u.role)?.toLowerCase();
                    const uiRole = formatRoleLabel(role); // Using our helper
                    
                    const isSuperAdminUser = role === "super_admin";
                    const isOrgAdminUser = role === "company_admin";

                    // Allow 'Org Admin' to be assigned if the business was created by a regular user
                    const isEligibleRole = ["Collaborator", "User", "Viewer"].includes(uiRole) || 
                                          (isOrgAdminUser && isOwnerRegularUser);

                    return !isArchived && isEligibleRole && !isAlreadyAssigned && !isOwner && !isSuperAdminUser;
                  });
                  return (
                    <>
                      <option value="">{filtered.length > 0 ? t("Select_user") : t("No_Users_Found")}</option>
                      {filtered.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </>
                  );
                })()}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{assignErrors.user}</Form.Control.Feedback>
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowAssignModal(false)} disabled={isAssigning}>{t("cancel")}</Button>
              <Button variant="primary" type="submit" disabled={isAssigning}>{isAssigning ? <Spinner size="sm" /> : t("save")}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* --- Project Access Modal --- */}
      <Modal show={showProjectAccessModal} onHide={() => setShowProjectAccessModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>{t("Add_Project_Access")}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form noValidate>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t("Access_Type")}</Form.Label>
              <div className="mt-2 ms-3">
                <Form.Check type="radio" label={t("Enable_Reranking_Project")} checked={accessType === "reRanking"} onChange={() => setAccessType("reRanking")} />
                <Form.Check type="radio" label={t("Edit_the_Project")} checked={accessType === "projectEdit"} onChange={() => setAccessType("projectEdit")} />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t("business")}</Form.Label>
              <Form.Select value={accessBusinessId} isInvalid={!!accessErrors.business} onChange={e => setAccessBusinessId(e.target.value)}>
                <option value="">{launchedBusinesses.length > 0 ? t("Select_Business") : t("No_Business_Found")}</option>
                {launchedBusinesses.map(b => <option key={b._id} value={b._id}>{b.business_name || b.name}</option>)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{accessErrors.business}</Form.Control.Feedback>
            </Form.Group>
            {accessType === "projectEdit" && (
              <Form.Group className="mb-3">
                <Form.Label>{t("Project")}</Form.Label>
                <Form.Select value={selectedProjectId} isInvalid={!!accessErrors.project} disabled={!accessBusinessId} onChange={e => setSelectedProjectId(e.target.value)}>
                  <option value="">{loadingProjects ? t("Loading_projects") : t("Select_Project")}</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{accessErrors.project}</Form.Control.Feedback>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>{t("Participants")}</Form.Label>
              <div className="collaborator-checkbox-list" style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px", padding: "10px" }}>
                {(() => {
                  const biz = launchedBusinesses.find(b => b._id === accessBusinessId);
                  const filtered = collaborators.filter(c => {
                    const isOwner = String(c._id) === String(biz?.user_id);
                    const role = c.role_name?.toLowerCase();
                    if (!isOwner && (role === 'viewer' || role === 'company_admin' || role === 'super_admin')) return false;
                    
                    if (accessType === "reRanking") {
                      const alreadyHas = (biz?.allowed_ranking_collaborators || []).some(item => {
                        const id = typeof item === 'object' && item !== null ? (item._id || item.id) : item;
                        return String(id) === String(c._id);
                      });
                      return !alreadyHas;
                    } else {
                      const proj = projects.find(p => p._id === selectedProjectId);
                      const alreadyHas = (proj?.allowed_collaborators || []).some(item => {
                        const id = typeof item === 'object' && item !== null ? (item._id || item.id) : item;
                        return String(id) === String(c._id);
                      });
                      return !alreadyHas;
                    }
                  });
                  return filtered.length > 0 ? filtered.map(c => (
                    <Form.Check key={c._id} label={c.name} checked={selectedCollaboratorIds.includes(c._id)} 
                      onChange={() => setSelectedCollaboratorIds(prev => prev.includes(c._id) ? prev.filter(id => id !== c._id) : [...prev, c._id])} />
                  )) : <div className="text-muted text-center py-2">{t("No_Participants_Found")}</div>;
                })()}
              </div>
              {accessErrors.collaborators && <div className="text-danger small mt-1">{accessErrors.collaborators}</div>}
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowProjectAccessModal(false)}>{t("cancel")}</Button>
              <Button variant="primary" onClick={handleProceedToConfirmation}>{t("Continue")}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* --- Access Confirmation Modal --- */}
      <Modal show={showAccessConfirmation} onHide={() => setShowAccessConfirmation(false)} centered>
        <Modal.Header closeButton><Modal.Title>{t("Confirm_Access_Grant")}</Modal.Title></Modal.Header>
        <Modal.Body>
          <p>{t("Business_Label")} {launchedBusinesses.find(b => b._id === accessBusinessId)?.business_name}</p>
          {accessType === "projectEdit" && <p>{t("Project_Label")} {projects.find(p => p._id === selectedProjectId)?.project_name}</p>}
          <p>{t("Access_Label")} {accessType === "reRanking" ? t("reRanking") : t("projectEdit")}</p>
          <p>{t("Participants_Label")} {collaborators.filter(c => selectedCollaboratorIds.includes(c._id)).map(c => c.name).join(", ")}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAccessConfirmation(false)}>{t("Back")}</Button>
          <Button variant="primary" onClick={handleGiveProjectAccessSubmit} disabled={isGrantingAccess}>{isGrantingAccess ? t("Granting") : t("Yes_Grant_Access")}</Button>
        </Modal.Footer>
      </Modal>

      {/* --- Role Change Confirmation Modal --- */}
      <Modal show={showRoleConfirmModal} onHide={() => setShowRoleConfirmModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>{t("Confirm_Role_Change")}</Modal.Title></Modal.Header>
        <Modal.Body>
          <p>
            {t("Change_role_confirm_msg", { user: "__USER__", role: "__ROLE__" }).split(/(__USER__|__ROLE__)/).map((part, i) => {
              if (part === "__USER__") return <strong key={i} className="text-primary">{pendingRoleUpdate?.userName}</strong>;
              if (part === "__ROLE__") return <strong key={i} className="text-info">{formatRoleLabel(pendingRoleUpdate?.role)}</strong>;
              return part;
            })}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowRoleConfirmModal(false)}>{t("cancel")}</Button>
          <Button variant="primary" onClick={handleConfirmRoleUpdate}>{t("Yes_Change_Role")}</Button>
        </Modal.Footer>
      </Modal>

      <UpgradeModal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} />
      <PlanLimitModal 
        show={showPlanLimitModal} 
        onHide={() => setShowPlanLimitModal(false)} 
        {...planLimitConfig} 
        plan={usage?.plan} 
        isAdmin={isAdmin} 
      />
      <ErrorModal 
        show={showErrorModal} 
        handleClose={() => setShowErrorModal(false)} 
        {...errorModalConfig} 
      />
    </div>
  );
};

export default UserManagement;
