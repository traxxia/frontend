import React, { useState, useEffect } from "react";
import { Row, Col, Card, Form, Button, Dropdown, Modal } from "react-bootstrap";
import { Crown, UserCog, User, ShieldCheck, MoreVertical, Plus, Eye, EyeOff, Activity, Users, Shield } from "lucide-react";
import "../styles/usermanagement.css";
import UpgradeModal from "./UpgradeModal";
import axios from "axios";
import { useTranslation } from '../hooks/useTranslation';
import AdminTable from "./AdminTable";
import MetricCard from "./MetricCard";
import "../styles/AdminTableStyles.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CustomToggle = React.forwardRef(({ onClick, disabled }, ref) => (
  <span
    ref={ref}
    onClick={(e) => {
      if (disabled) return;
      e.preventDefault();
      onClick(e);
    }}
    style={{
      cursor: disabled ? "not-allowed" : "pointer",
      padding: "6px",
      borderRadius: "6px",
      display: "inline-flex",
      alignItems: "center",
      opacity: disabled ? 0.5 : 1
    }}
    className={`action-btn ${disabled ? "disabled" : ""}`}
  >
    <MoreVertical size={20} />
  </span>
));

const UserManagement = ({ onToast }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageBeforeFilter, setPageBeforeFilter] = useState(1);
  const itemsPerPage = 10;
  const { t } = useTranslation();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newRole, setNewRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const token = sessionStorage.getItem("token");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignBusinessId, setAssignBusinessId] = useState("");
  const [showGiveAccessModal, setShowGiveAccessModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [pendingRole, setPendingRole] = useState(null);
  const [accessType, setAccessType] = useState("reRanking");
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [launchedBusinesses, setLaunchedBusinesses] = useState([]);
  const [accessBusinessId, setAccessBusinessId] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [launchedProjectMap, setLaunchedProjectMap] = useState({});
  const [collaborators, setCollaborators] = useState([]);
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [showAccessConfirmation, setShowAccessConfirmation] = useState(false);
  const [assignErrors, setAssignErrors] = useState({});
  const [accessErrors, setAccessErrors] = useState({});
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);

  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  const currentRole = sessionStorage.getItem("userRole");
  const userPlan = sessionStorage.getItem("userPlan");
  const isSuperAdmin = currentRole === "super_admin";
  const hasPlan = userPlan === 'essential' || userPlan === 'advanced';
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const handleOpenModal = () => {
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setNewRole("");
    setSelectedCompanyId("");
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setNewRole("");
    setSelectedCompanyId("");
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleOpenAssignModal = () => {
    setAssignErrors({});
    setShowAssignModal(true);
  };
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setAssignUserId("");
    setAssignBusinessId("");
    setAssignErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!newName.trim()) {
      newErrors.name = t("Name_is_required");
    } else if (!/[a-zA-Z]/.test(newName)) {
      newErrors.name = t("Name_must_contain_alphabetic_characters") || "Name must contain at least some alphabetic characters";
    } else if (newName.trim().length < 3) {
      newErrors.name = t("Name_must_be_atleast3_characters_long");
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail.trim()) {
      newErrors.email = t("Email_is_required");
    } else if (!emailPattern.test(newEmail)) {
      newErrors.email = t("Enter a valid email address");
    }
    if (!newPassword) {
      newErrors.password = t("Password_is_required");
    } else if (newPassword.length < 8) {
      newErrors.password = t("Password_must_be_at_least_8_characters");
    } else if (!/(?=.*[a-z])/.test(newPassword)) {
      newErrors.password = t("Password_must_contain_lowercase_letter");
    } else if (!/(?=.*[A-Z])/.test(newPassword)) {
      newErrors.password = t("Password_must_contain_uppercase_letter");
    } else if (!/(?=.*\d)/.test(newPassword)) {
      newErrors.password = t("Password_must_contain_number");
    } else if (!/(?=.*[^A-Za-z0-9])/.test(newPassword)) {
      newErrors.password = t("Password_must_contain_special_character");
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = t("Please_confirm_your_password");
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t("Passwords_do_not_match");
    }
    if (isSuperAdmin && !selectedCompanyId) {
      newErrors.company = t("Company_is_required");
    }
    if (!newRole) {
      newErrors.role = t("Role_is_required");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    const payload = {
      name: newName.trim(),
      email: newEmail.trim(),
      password: newPassword,
      ...(isSuperAdmin && { company_id: selectedCompanyId }),
      role: newRole,
    };
    try {
      await axios.post(`${BACKEND_URL}/api/admin/users`, payload);
      onToast("User added successfully!", "success");
      await fetchUsers();
      handleCloseModal();
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || "Failed to add user";
      onToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/companies`);
        const data = Array.isArray(res.data) ? res.data : res.data.companies || [];
        setCompanies(data);
      } catch (err) {
        console.error("Failed to fetch companies", err);
      }
    };
    fetchCompanies();
  }, [isSuperAdmin]);

  const handleRoleUpdate = async (userId, role) => {
    const userPlan = sessionStorage.getItem("userPlan");
    if (userPlan === 'essential' && role.toLowerCase() === 'collaborator') {
      onToast("Your plan doesn't support collaborators. Upgrade to Advanced to assign team members.", "error");
      return;
    }
    try {
      await axios.put(`${BACKEND_URL}/api/admin/users/${userId}/role`, { role });
      onToast("User role updated successfully", "success");
      fetchUsers();
    } catch (error) {
      console.error(error);
      onToast(error.response?.data?.error || "Failed to update role", "error");
    }
  };

  const handleCollaboratorToggle = (collaboratorId) => {
    setSelectedCollaboratorIds(prev => prev.includes(collaboratorId) ? prev.filter(id => id !== collaboratorId) : [...prev, collaboratorId]);
  };

  const handleProceedToConfirmation = () => {
    const newErrors = {};
    if (!accessBusinessId) newErrors.business = t("select_business_required");
    if (selectedCollaboratorIds.length === 0) newErrors.collaborators = t("select_collaborators_at_least_one") || "Please select at least one collaborator";
    if (accessType === "projectEdit" && !selectedProjectId) newErrors.project = t("select_project_required");
    if (Object.keys(newErrors).length > 0) {
      setAccessErrors(newErrors);
      return;
    }
    setShowGiveAccessModal(false);
    setShowAccessConfirmation(true);
  };

  const handleGiveProjectAccess = async () => {
    setIsGrantingAccess(true);
    try {
      if (accessType === "projectEdit") {
        await axios.put(`${BACKEND_URL}/api/projects/edit-access`, { scope: "projectEdit", business_id: accessBusinessId, project_id: selectedProjectId });
      }
      if (accessType === "reRanking") {
        await axios.put(`${BACKEND_URL}/api/projects/edit-access`, { scope: "reRanking", business_id: accessBusinessId });
      }
      if (accessType === "projectEdit") {
        await axios.patch(`${BACKEND_URL}/api/businesses/${accessBusinessId}/project/${selectedProjectId}/allowed-collaborators`, { collaborator_ids: selectedCollaboratorIds });
      }
      if (accessType === "reRanking") {
        await axios.patch(`${BACKEND_URL}/api/businesses/${accessBusinessId}/allowed-ranking-collaborators`, { collaborator_ids: selectedCollaboratorIds });
      }
      onToast("Access granted successfully", "success");
      setShowAccessConfirmation(false);
      setSelectedProjectId("");
      setSelectedCollaboratorIds([]);
      setAccessBusinessId("");
    } catch (err) {
      console.error(err);
      onToast(err.response?.data?.error || "Failed to give access", "error");
    } finally {
      setIsGrantingAccess(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!assignUserId) newErrors.collaborator = t("select_collaborator_required");
    if (!assignBusinessId) newErrors.business = t("select_business_required");
    if (Object.keys(newErrors).length > 0) {
      setAssignErrors(newErrors);
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/api/businesses/${assignBusinessId}/collaborators`, { user_id: assignUserId });
      onToast("Collaborator assigned successfully");
      handleCloseAssignModal();
    } catch (error) {
      console.error(error);
      onToast(error.response?.data?.message || "Failed to assign collaborator", "error");
    }
  };

  const formatRole = (role_name) => {
    switch (role_name?.toLowerCase()) {
      case "company_admin": return "Org Admin";
      case "collaborator": return "Collaborator";
      case "user": return "User";
      default: return "Viewer";
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBusinesses();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/admin/users`);
      const data = Array.isArray(res.data) ? res.data : res.data.users || [];
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      onToast("Failed to fetch users", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/businesses`);
      const data = Array.isArray(res.data) ? res.data : res.data.businesses || [];
      setAllBusinesses(data);
    } catch (error) {
      console.error("Failed to fetch businesses", error);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    applyFilters(value, selectedRole);
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setSelectedRole(value);
    setCurrentPage(1);
    applyFilters(searchTerm, value);
  };

  const applyFilters = (search, role) => {
    const result = users.filter((user) => {
      const matchSearch = user.name?.toLowerCase().includes(search.toLowerCase()) || user.email?.toLowerCase().includes(search.toLowerCase()) || user.company_name?.toLowerCase().includes(search.toLowerCase());
      const uiRole = formatRole(user.role_name || user.role);
      const matchRole = role === "All Roles" || uiRole === role;
      return matchSearch && matchRole;
    });
    setFilteredUsers(result);
  };

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const roleStyles = {
    "Org Admin": { icon: <Crown size={14} color="#7c3aed" />, color: "#7c3aed" },
    Collaborator: { icon: <UserCog size={14} color="#0284c7" />, color: "#0284c7" },
    Viewer: { icon: <User size={14} color="#ca8a04" />, color: "#ca8a04" },
    User: { icon: <ShieldCheck size={14} color="#16a34a" />, color: "#16a34a" },
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const loadLaunchedBusinessAndProjects = async () => {
    try {
      setLoadingProjects(true);
      const projectRes = await axios.get(`${BACKEND_URL}/api/projects`, { params: { launch_status: "launched" } });
      const launchedProjects = projectRes.data.projects || [];
      const businessRes = await axios.get(`${BACKEND_URL}/api/businesses`);
      const allBiz = businessRes.data.businesses || businessRes.data || [];
      const map = {};
      launchedProjects.forEach((p) => {
        const bId = p.business_id?.toString();
        if (!bId) return;
        if (!map[bId]) map[bId] = [];
        map[bId].push(p);
      });
      const validBusinesses = allBiz.filter((b) => map[b._id.toString()]);
      setLaunchedBusinesses(validBusinesses);
      setLaunchedProjectMap(map);
      setAccessBusinessId("");
      setProjects([]);
      setSelectedProjectId("");
      setSelectedCollaboratorIds([]);
      setAccessErrors({});
    } catch (err) {
      console.error("Failed to load launched data", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    setProjects(launchedProjectMap[accessBusinessId] || []);
  }, [accessBusinessId, launchedProjectMap]);

  const fetchCollaboratorsByBusiness = async (businessId) => {
    if (!businessId) return;
    try {
      setLoadingCollaborators(true);
      const res = await axios.get(`${BACKEND_URL}/api/businesses/${businessId}/collaborators`);
      setCollaborators(res.data.collaborators || []);
      setSelectedCollaboratorIds([]);
    } catch (err) {
      console.error("Failed to fetch collaborators", err);
    } finally {
      setLoadingCollaborators(false);
    }
  };

  useEffect(() => {
    if (accessBusinessId) fetchCollaboratorsByBusiness(accessBusinessId);
  }, [accessBusinessId]);

  const getSelectedCollaboratorNames = () => collaborators.filter(c => selectedCollaboratorIds.includes(c._id)).map(c => c.name);
  const getSelectedProjectName = () => projects.find(p => p._id === selectedProjectId)?.project_name || "";
  const getSelectedBusinessName = () => {
    const b = launchedBusinesses.find(b => b._id === accessBusinessId);
    return b?.business_name || b?.name || "";
  };

  // Metrics calculation
  const orgAdminsCount = users.filter(u => formatRole(u.role_name || u.role) === "Org Admin").length;
  const collaboratorsCount = users.filter(u => formatRole(u.role_name || u.role) === "Collaborator").length;
  const viewersCount = users.filter(u => formatRole(u.role_name || u.role) === "Viewer").length;

  const columns = [
    {
      key: "name",
      label: t("User"),
      render: (_, row) => (
        <div>
          <div className="admin-cell-primary">{row.name}</div>
          <div className="admin-cell-secondary">{row.email}</div>
        </div>
      )
    },
    ...(isSuperAdmin ? [{ key: "company_name", label: t("Company") }] : []),
    {
      key: "role",
      label: t("Role"),
      render: (_, row) => {
        const uiRole = formatRole(row.role_name || row.role);
        const style = roleStyles[uiRole] || roleStyles["Viewer"];
        return (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {style.icon}
            <span style={{ color: style.color, fontWeight: 500 }}>{uiRole}</span>
          </span>
        );
      }
    },
    {
      key: "created_at",
      label: t("joined"),
      render: (val) => <span className="admin-cell-secondary">{formatDate(val)}</span>
    },
    ...((!hasPlan || isSuperAdmin) ? [{
      key: "actions",
      label: t("Action"),
      render: (_, row) => {
        const statusValue = row.access_mode === 'archived' ? 'Archived' : (row.status === 'inactive' ? 'Inactive' : 'Active');
        const disabled = statusValue === "Archived" || statusValue === "Inactive";
        return (
          <>
            <Dropdown>
              <Dropdown.Toggle as={CustomToggle} disabled={disabled} />
              <Dropdown.Menu align="end">
                <Dropdown.Item onClick={() => { setPendingUserId(row._id); setPendingRole("collaborator"); setShowConfirm(true); }}>
                  <UserCog size={16} className="me-2" /> Collaborator
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { setPendingUserId(row._id); setPendingRole("viewer"); setShowConfirm(true); }}>
                  <User size={16} className="me-2" /> Viewer
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { setPendingUserId(row._id); setPendingRole("user"); setShowConfirm(true); }}>
                  <ShieldCheck size={16} className="me-2" /> User
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </>
        );
      }
    }] : [])
  ];

  return (
    <div>
      {/* ---- Metric Cards ---- */}
      <div className="admin-metrics-grid">
        <MetricCard
          label={t("Total_Users") || "Total Users"}
          value={users.length}
          icon={Users}
          iconColor="blue"
        />
        <MetricCard
          label={t("org_admins") || "Org Admins"}
          value={orgAdminsCount}
          icon={Crown}
          iconColor="purple"
        />
        <MetricCard
          label={t("Collaborators") || "Collaborators"}
          value={collaboratorsCount}
          icon={UserCog}
          iconColor="green"
        />
        <MetricCard
          label={t("Viewers") || "Viewers"}
          value={viewersCount}
          icon={User}
          iconColor="orange"
        />
      </div>

      {/* ---- Tool Actions ---- */}
      <div className="admin-toolbar-row mb-3 mt-4">
        <div className="d-flex gap-2 ms-auto">
          {!isSuperAdmin && (
            <>
              <Button className="admin-primary-btn" onClick={() => (userPlan === "essential" ? setShowUpgradeModal(true) : handleOpenModal())}>
                <Plus size={16} /> {t("Add_User")}
              </Button>
              <Button className="admin-secondary-btn" onClick={() => (userPlan === 'essential' ? setShowUpgradeModal(true) : handleOpenAssignModal())}>
                <User size={16} /> {t("Assign_Collaborator")}
              </Button>
              <Button className="admin-secondary-btn" onClick={() => { loadLaunchedBusinessAndProjects(); setShowGiveAccessModal(true); }}>
                <ShieldCheck size={16} /> {t("Project Access")}
              </Button>
            </>
          )}
        </div>
      </div>

      <AdminTable
        title={t("User_Management")}
        count={filteredUsers.length}
        countLabel={t("Users")}
        columns={columns}
        data={paginatedUsers}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder={t("Search_by_name_or_email")}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        loading={isLoading}
        toolbarContent={
          <Form.Select
            className="role-select"
            style={{ width: '210px' }}
            value={selectedRole}
            onChange={handleRoleChange}
          >
            <option>{t("All_Roles")}</option>
            <option>Org Admin</option>
            <option>Collaborator</option>
            <option>User</option>
            <option>Viewer</option>
          </Form.Select>
        }
      />

      {/* --- Modals Stay Same --- */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-2"><Modal.Title className="fw-bold">{t("Add_New_User")}</Modal.Title></Modal.Header>
        <Modal.Body className="px-4">
          <Form onSubmit={handleAddUser}>
            <fieldset disabled={isSubmitting} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
              <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-semibold">{t("user_name")} *</Form.Label><Form.Control type="text" className={`minimal-input ${errors.name ? "is-invalid" : ""}`} value={newName} onChange={(e) => setNewName(e.target.value)} />{errors.name && <div className="invalid-feedback">{errors.name}</div>}</Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-semibold">{t("email_address")} *</Form.Label><Form.Control type="email" className={`minimal-input ${errors.email ? "is-invalid" : ""}`} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />{errors.email && <div className="invalid-feedback">{errors.email}</div>}</Form.Group></Col>
              </Row>
              <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-semibold">{t("password")} *</Form.Label><div className="d-flex"><Form.Control type={showPassword ? "text" : "password"} className={`minimal-input ${errors.password ? "is-invalid" : ""}`} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /><Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <Eye size={18} /> : <EyeOff size={18} />}</Button></div>{errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}</Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-semibold">{t("confirm_password")} *</Form.Label><div className="d-flex"><Form.Control type={showConfirmPassword ? "text" : "password"} className={`minimal-input ${errors.confirmPassword ? "is-invalid" : ""}`} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /><Button variant="outline-secondary" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}</Button></div>{errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}</Form.Group></Col>
              </Row>
              <Row>
                <Col md={isSuperAdmin ? 6 : 12}><Form.Group className="mb-3"><Form.Label className="fw-semibold">{t("role")} *</Form.Label><Form.Select className={`minimal-input ${errors.role ? "is-invalid" : ""}`} value={newRole} onChange={(e) => setNewRole(e.target.value)}><option value="">{t("Select_Role")}</option><option value="collaborator">Collaborator</option>{!hasPlan && (<><option value="user">User</option><option value="viewer">Viewer</option></>)}</Form.Select>{errors.role && <div className="invalid-feedback">{errors.role}</div>}</Form.Group></Col>
                {isSuperAdmin && (<Col md={6}><Form.Group className="mb-3"><Form.Label className="fw-semibold">{t("company")} *</Form.Label><Form.Select className={`minimal-input ${errors.company ? "is-invalid" : ""}`} value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)}><option value="">{t("Select_Company")}</option>{companies.map(c => <option key={c._id} value={c._id}>{c.company_name}</option>)}</Form.Select>{errors.company && <div className="invalid-feedback">{errors.company}</div>}</Form.Group></Col>)}
              </Row>
              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <Button variant="link" onClick={handleCloseModal} disabled={isSubmitting}>{t("cancel")}</Button>
                <Button type="submit" className="add-user-submit-btn" disabled={isSubmitting}>{isSubmitting ? t("Adding...") : t("Add_User")}</Button>
              </div>
            </fieldset>
          </Form>
        </Modal.Body>
      </Modal>

      {/* --- Modals for Assign, Access, Confirm --- */}
      <Modal show={showAssignModal} onHide={handleCloseAssignModal} centered>
        <Modal.Header closeButton><Modal.Title>{t("Assign_Collaborator")}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAssign} noValidate>
            <Form.Group className="mb-3"><Form.Label>{t("Collaborator")}</Form.Label><Form.Select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} isInvalid={!!assignErrors.collaborator}><option value="">{t("Select_collaborator")}</option>{users.filter(u => formatRole(u.role_name) === "Collaborator").map(u => <option key={u._id} value={u._id}>{u.name}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{assignErrors.collaborator}</Form.Control.Feedback></Form.Group>
            <Form.Group className="mb-3"><Form.Label>{t("business")}</Form.Label><Form.Select value={assignBusinessId} onChange={(e) => setAssignBusinessId(e.target.value)} isInvalid={!!assignErrors.business}><option value="">{t("Select_Business")}</option>{allBusinesses.map(b => <option key={b._id} value={b._id}>{b.business_name || b.name}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{assignErrors.business}</Form.Control.Feedback></Form.Group>
            <div className="d-flex justify-content-end"><Button variant="secondary" className="me-2" onClick={handleCloseAssignModal}>{t("cancel")}</Button><Button variant="primary" type="submit">{t("save")}</Button></div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showGiveAccessModal} onHide={() => setShowGiveAccessModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>{t("Add Project Access")}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form noValidate>
            <Form.Group className="mb-3"><Form.Label className="fw-bold">{t("Access Type")}</Form.Label><div className="mt-2 ms-3"><Form.Check type="radio" label="Enable Reranking Project" checked={accessType === "reRanking"} onChange={() => setAccessType("reRanking")} /><Form.Check type="radio" label="Edit the Project" checked={accessType === "projectEdit"} onChange={() => setAccessType("projectEdit")} /></div></Form.Group>
            <Form.Group className="mb-3"><Form.Label>{t("business")}</Form.Label><Form.Select value={accessBusinessId} onChange={(e) => setAccessBusinessId(e.target.value)} isInvalid={!!accessErrors.business}><option value="">{t("Select_Business")}</option>{launchedBusinesses.map(b => <option key={b._id} value={b._id}>{b.business_name || b.name}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{accessErrors.business}</Form.Control.Feedback></Form.Group>
            {accessType === "projectEdit" && (<Form.Group className="mb-3"><Form.Label>{t("Project")}</Form.Label><Form.Select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} isInvalid={!!accessErrors.project} disabled={!accessBusinessId}><option value="">{loadingProjects ? t("Loading projects") : t("Select Project")}</option>{projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}</Form.Select><Form.Control.Feedback type="invalid">{accessErrors.project}</Form.Control.Feedback></Form.Group>)}
            <Form.Group className="mb-3"><Form.Label>{t("Collaborators")}</Form.Label><div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px", padding: "10px" }}>{collaborators.map(c => <Form.Check key={c._id} label={c.name} checked={selectedCollaboratorIds.includes(c._id)} onChange={() => handleCollaboratorToggle(c._id)} />)}</div></Form.Group>
            <div className="d-flex justify-content-end"><Button variant="secondary" className="me-2" onClick={() => setShowGiveAccessModal(false)}>{t("cancel")}</Button><Button variant="primary" onClick={handleProceedToConfirmation}>{t("Continue")}</Button></div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showAccessConfirmation} onHide={() => setShowAccessConfirmation(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Access Grant</Modal.Title></Modal.Header>
        <Modal.Body><p>Business: {getSelectedBusinessName()}</p>{accessType === "projectEdit" && <p>Project: {getSelectedProjectName()}</p>}<p>Access: {accessType === "reRanking" ? "Reranking" : "Edit"}</p><p>Collaborators: {getSelectedCollaboratorNames().join(", ")}</p></Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowAccessConfirmation(false)}>Back</Button><Button variant="primary" onClick={handleGiveProjectAccess} disabled={isGrantingAccess}>{isGrantingAccess ? "Granting..." : "Yes, Grant Access"}</Button></Modal.Footer>
      </Modal>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered><Modal.Header closeButton><Modal.Title>Confirm Role Change</Modal.Title></Modal.Header><Modal.Body><p>Change role to <strong>{pendingRole}</strong>?</p></Modal.Body><Modal.Footer><Button variant="light" onClick={() => setShowConfirm(false)}>Cancel</Button><Button variant="primary" onClick={() => { handleRoleUpdate(pendingUserId, pendingRole); setShowConfirm(false); }}>Yes, Change Role</Button></Modal.Footer></Modal>

      <UpgradeModal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} onUpgradeSuccess={() => fetchUsers()} />
    </div>
  );
};

export default UserManagement;