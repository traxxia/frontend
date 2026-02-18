import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Dropdown, Modal, InputGroup } from "react-bootstrap";
import { Crown, UserCog, User, ShieldCheck, MoreVertical, Search, Plus, Eye, EyeOff } from "lucide-react";
import "../styles/usermanagement.css";
import UpgradeModal from "./UpgradeModal";
import axios from "axios";
import Pagination from "../components/Pagination";
import { useTranslation } from '../hooks/useTranslation';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const statusStyles = {
  Active: { bg: "#d1fae5", color: "#047857" },
  Pending: { bg: "#fef3c7", color: "#b45309" },
  Archived: { bg: "#f3f4f6", color: "#4b5563" },
  Inactive: { bg: "#f3f4f6", color: "#4b5563" },
};

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
  const [businesses, setBusinesses] = useState([]);
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

    // Name validation
    if (!newName.trim()) {
      newErrors.name = t("Name_is_required");
    } else if (!/[a-zA-Z]/.test(newName)) {
      newErrors.name = t("Name_must_contain_alphabetic_characters") || "Name must contain at least some alphabetic characters";
    } else if (newName.trim().length < 3) {
      newErrors.name = t("Name_must_be_atleast3_characters_long");
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail.trim()) {
      newErrors.email = t("Email_is_required");
    } else if (!emailPattern.test(newEmail)) {
      newErrors.email = t("Enter a valid email address");
    }

    // Password validation
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

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = t("Please_confirm_your_password");
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t("Passwords_do_not_match");
    }

    // Company validation for super admin
    if (isSuperAdmin && !selectedCompanyId) {
      newErrors.company = t("Company_is_required");
    }

    // Role validation
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
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to add user";

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
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.companies || [];

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
      await axios.put(
        `${BACKEND_URL}/api/admin/users/${userId}/role`,
        { role },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      onToast("User role updated successfully", "success");
      fetchUsers();
    } catch (error) {
      console.error(error);
      onToast(
        error.response?.data?.error || "Failed to update role",
        "error"
      );
    }
  };

  const handleCollaboratorToggle = (collaboratorId) => {
    setSelectedCollaboratorIds(prev => {
      if (prev.includes(collaboratorId)) {
        return prev.filter(id => id !== collaboratorId);
      } else {
        return [...prev, collaboratorId];
      }
    });
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
        await axios.put(
          `${BACKEND_URL}/api/projects/edit-access`,
          {
            scope: "projectEdit",
            business_id: accessBusinessId,
            project_id: selectedProjectId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (accessType === "reRanking") {
        await axios.put(
          `${BACKEND_URL}/api/projects/edit-access`,
          {
            scope: "reRanking",
            business_id: accessBusinessId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (accessType === "projectEdit") {
        await axios.patch(
          `${BACKEND_URL}/api/businesses/${accessBusinessId}/project/${selectedProjectId}/allowed-collaborators`,
          {
            collaborator_ids: selectedCollaboratorIds,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (accessType === "reRanking") {
        await axios.patch(
          `${BACKEND_URL}/api/businesses/${accessBusinessId}/allowed-ranking-collaborators`,
          {
            collaborator_ids: selectedCollaboratorIds,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      onToast("Access granted successfully", "success");
      setShowAccessConfirmation(false);
      setSelectedProjectId("");
      setSelectedCollaboratorIds([]);
      setAccessBusinessId("");
    } catch (err) {
      console.error(err);
      onToast(
        err.response?.data?.error || "Failed to give access",
        "error"
      );
    } finally {
      setIsGrantingAccess(false);
    }
  };

  const handleAccessTypeChange = (value) => {
    setAccessType(value);
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
      await axios.post(
        `${BACKEND_URL}/api/businesses/${assignBusinessId}/collaborators`,
        {
          user_id: assignUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onToast("Collaborator assigned successfully");
      handleCloseAssignModal();
    } catch (error) {
      console.error(error);
      if (error.response?.data?.message) {
        onToast(error.response.data.message);
        return;
      }
      onToast("Failed to assign collaborator", "error");
    }
  };

  const formatRole = (role_name) => {
    switch (role_name?.toLowerCase()) {
      case "company_admin":
        return "Org Admin";
      case "collaborator":
        return "Collaborator";
      case "user":
        return "User";
      default:
        return "Viewer";
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/users`);
      const data = Array.isArray(res.data) ? res.data : res.data.users || [];
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      alert("Failed to fetch users");
    }
  };

  const collaboratorsCount = users.filter(
    (u) => formatRole(u.role_name || u.role) === "Collaborator"
  ).length;
  const collaboratorUsers = users.filter(
    (u) => formatRole(u.role_name || u.role) === "Collaborator"
  );
  const viewersCount = users.filter(
    (u) => formatRole(u.role_name || u.role) === "Viewer"
  ).length;
  const usersCount = users.filter(
    (u) => formatRole(u.role_name || u.role) === "User"
  ).length;

  const handleSearch = (e) => {
    const value = e.target.value;
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
      const matchSearch =
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.company_name?.toLowerCase().includes(search.toLowerCase());

      const uiRole = formatRole(user.role_name || user.role);

      const matchRole = role === "All Roles" || uiRole === role;

      return matchSearch && matchRole;
    });
    setFilteredUsers(result);

    const isFiltering = search.trim() !== "" || role !== "All Roles";
    if (isFiltering) {
      if (searchTerm === "" && selectedRole === "All Roles") {
        setPageBeforeFilter(currentPage);
      }
      setCurrentPage(1);
    } else {
      setCurrentPage(pageBeforeFilter);
    }
  };

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const roleStyles = {
    "Org Admin": { icon: <Crown size={16} color="#7c3aed" />, color: "#7c3aed" },
    Collaborator: { icon: <UserCog size={16} color="#0284c7" />, color: "#0284c7" },
    Viewer: { icon: <User size={16} color="#ca8a04" />, color: "#ca8a04" },
    User: { icon: <ShieldCheck size={16} color="#16a34a" />, color: "#16a34a" },
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/businesses`);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.businesses || [];

      setAllBusinesses(data);
    } catch (error) {
      alert("Failed to fetch businesses");
    }
  };

  const loadLaunchedBusinessAndProjects = async () => {
    try {
      setLoadingProjects(true);

      const projectRes = await axios.get(`${BACKEND_URL}/api/projects`, {
        params: { launch_status: "launched" },
        headers: { Authorization: `Bearer ${token}` },
      });

      const launchedProjects = projectRes.data.projects || [];

      const businessRes = await axios.get(`${BACKEND_URL}/api/businesses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allBiz =
        businessRes.data.businesses || businessRes.data || [];

      const map = {};
      launchedProjects.forEach((p) => {
        const bId = p.business_id?.toString();
        if (!bId) return;

        if (!map[bId]) map[bId] = [];
        map[bId].push(p);
      });

      const validBusinesses = allBiz.filter(
        (b) => map[b._id.toString()]
      );

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
    if (!accessBusinessId) {
      setProjects([]);
      return;
    }

    setProjects(launchedProjectMap[accessBusinessId] || []);
  }, [accessBusinessId, launchedProjectMap]);

  const fetchCollaboratorsByBusiness = async (businessId) => {
    if (!businessId) return;

    try {
      setLoadingCollaborators(true);

      const res = await axios.get(
        `${BACKEND_URL}/api/businesses/${businessId}/collaborators`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCollaborators(res.data.collaborators || []);
      setSelectedCollaboratorIds([]);
    } catch (err) {
      console.error("Failed to fetch collaborators", err);
      onToast("Failed to load collaborators", "error");
    } finally {
      setLoadingCollaborators(false);
    }
  };

  useEffect(() => {
    if (!accessBusinessId) {
      setCollaborators([]);
      return;
    }

    fetchCollaboratorsByBusiness(accessBusinessId);
  }, [accessBusinessId]);

  const getSelectedCollaboratorNames = () => {
    return collaborators
      .filter(c => selectedCollaboratorIds.includes(c._id))
      .map(c => c.name);
  };

  const getSelectedProjectName = () => {
    const project = projects.find(p => p._id === selectedProjectId);
    return project?.project_name || "";
  };

  const getSelectedBusinessName = () => {
    const business = launchedBusinesses.find(b => b._id === accessBusinessId);
    return business?.business_name || business?.name || "";
  };

  return (
    <div className="access-management-container minimal">
      <div className="access-content">
        <div className="access-header-minimal mb-4">
          <h2 className="minimal-page-title">{t("User_Management")}</h2>
          <p className="minimal-page-subtitle text-muted">
            {t("Manage organization users, roles, and permissions.")}
          </p>
        </div>

        <div className="compact-summary-row mb-4">
          <div className="summary-item">
            <span className="summary-label">{t("Total_Users")}:</span>
            <span className="summary-value-minimal">{users.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t("users")}:</span>
            <span className="summary-value-minimal">{usersCount}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t("Collaborators")}:</span>
            <span className="summary-value-minimal">{collaboratorsCount}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t("Viewers")}:</span>
            <span className="summary-value-minimal">{viewersCount}</span>
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
                    placeholder={t("Search_by_name_or_email")}
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
              </div>

              <div className="toolbar-actions">
                <Form.Select className="role-select" value={selectedRole} onChange={handleRoleChange}>
                  <option>{t("All_Roles")}</option>
                  <option>Org Admin</option>
                  <option>Collaborator</option>
                  <option>User</option>
                  <option>Viewer</option>
                </Form.Select>

                {!isSuperAdmin && (
                  <Button
                    className="add-user-btn d-flex align-items-center"
                    onClick={() => {
                      const userPlan = sessionStorage.getItem("userPlan");
                      if (userPlan === "essential") {
                        setShowUpgradeModal(true);
                      } else {
                        handleOpenModal();
                      }
                    }}
                  >
                    <Plus size={16} className="me-2" />
                    {t("Add_User")}
                  </Button>
                )}



                {!isSuperAdmin && (<>
                  <Button
                    className="add-user-btn d-flex align-items-center"
                    onClick={() => {
                      const userPlan = sessionStorage.getItem("userPlan");
                      if (userPlan === 'essential') {
                        setShowUpgradeModal(true);
                      } else {
                        handleOpenAssignModal();
                      }
                    }}
                  >
                    <User size={16} className="me-2" />
                    {t("Assign_Collaborator")}
                  </Button>
                  <Button
                    className="add-user-btn d-flex align-items-center"
                    onClick={() => {
                      loadLaunchedBusinessAndProjects();
                      setShowGiveAccessModal(true);
                    }}
                  >
                    <ShieldCheck size={16} className="me-2" />
                    {t("Add Project Access")}
                  </Button></>)}
              </div>
            </div>
          </Col>
        </Row>

        <Card className="mt-4">
          <Card.Body>
            <Table hover responsive className="align-middle">
              <thead className="table-heading" >
                <tr>
                  <th>{t("User")}</th>
                  {isSuperAdmin && <th>{t("Company")}</th>}
                  <th>{t("Role")}</th>
                  <th>{t("status")}</th>
                  <th>{t("joined")}</th>
                  {(!hasPlan || isSuperAdmin) && <th className="text-end">{t("Action")}</th>}
                </tr>
              </thead>
              <tbody>
                {Array.isArray(filteredUsers) &&
                  paginatedUsers.map((user, index) => {
                    const uiRole = formatRole(user.role_name);
                    const roleStyle = roleStyles[uiRole] || roleStyles["Viewer"];

                    // Determine Status Value
                    let statusValue = "Active";
                    if (user.access_mode === 'archived') {
                      statusValue = "Archived";
                    } else if (user.status === 'inactive') {
                      statusValue = "Inactive";
                    } else if (user.status) {
                      // Capitalize first letter of status (e.g., 'active' -> 'Active')
                      statusValue = user.status.charAt(0).toUpperCase() + user.status.slice(1);
                    }

                    const s = statusStyles[statusValue] || {
                      bg: "#e5e7eb",
                      color: "#374151"
                    };

                    return (
                      <tr key={index}>
                        <td className="d-flex align-items-center gap-2">
                          <div>
                            <div className="fw-semibold">{user.name}</div>
                            <small className="text-muted">{user.email}</small>
                          </div>
                        </td>
                        {isSuperAdmin && <td>{user.company_name || "-"}</td>}
                        <td>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {roleStyle.icon}
                            <span style={{ color: roleStyle.color, fontWeight: 500 }}>
                              {uiRole}
                            </span>
                          </span>
                        </td>

                        <td>
                          <span className={`status-badge status-${statusValue.toLowerCase()}`}>
                            {statusValue}
                          </span>
                        </td>
                        <td className="text-muted">{formatDate(user.created_at)}</td>
                        {(!hasPlan || isSuperAdmin) && (
                          <td className="text-end">
                            <Dropdown>
                              <Dropdown.Toggle as={CustomToggle} disabled={statusValue === "Archived" || statusValue === "Inactive"} />

                              <Dropdown.Menu align="end">
                                <Dropdown.Item
                                  onClick={() => {
                                    setPendingUserId(user._id);
                                    setPendingRole("collaborator");
                                    setShowConfirm(true);
                                  }}
                                >
                                  <UserCog className="me-2" />
                                  Collaborator
                                </Dropdown.Item>

                                <Dropdown.Item
                                  onClick={() => {
                                    setPendingUserId(user._id);
                                    setPendingRole("viewer");
                                    setShowConfirm(true);
                                  }}
                                >
                                  <User className="me-2" />
                                  Viewer
                                </Dropdown.Item>

                                <Dropdown.Item
                                  onClick={() => {
                                    setPendingUserId(user._id);
                                    setPendingRole("user");
                                    setShowConfirm(true);
                                  }}
                                >
                                  <ShieldCheck className="me-2" />
                                  User
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </Card.Body>
        </Card>

        {/* IMPROVED ADD USER MODAL */}
        <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
          <Modal.Header closeButton className="border-0 pb-2">
            <Modal.Title className="fw-bold">{t("Add_New_User")}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-4">
            <Form onSubmit={handleAddUser}>
              <fieldset disabled={isSubmitting} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        {t("user_name")} <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t("Enter_user_name")}
                        className={`minimal-input ${errors.name ? "is-invalid" : ""}`}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        {t("email_address")} <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder={t("Enter_email_address")}
                        className={`minimal-input ${errors.email ? "is-invalid" : ""}`}
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        {t("password")} <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup className="minimal-input-group">
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          placeholder={t("Enter_password")}
                          className={`minimal-input ${errors.password ? "is-invalid" : ""}`}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Button
                          variant="outline-secondary"
                          className="toggle-password-btn"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </Button>
                        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        {t("confirm_password")} <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup className="minimal-input-group">
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={t("Confirm_password")}
                          className={`minimal-input ${errors.confirmPassword ? "is-invalid" : ""}`}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Button
                          variant="outline-secondary"
                          className="toggle-password-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </Button>
                        {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={isSuperAdmin ? 6 : 12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        {t("role")} <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        className={`minimal-input ${errors.role ? "is-invalid" : ""}`}
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                      >
                        <option value="">{t("Select_Role")}</option>
                        <option value="collaborator">Collaborator</option>
                        {!hasPlan && (
                          <>
                            <option value="user">User</option>
                            <option value="viewer">Viewer</option>
                          </>
                        )}
                      </Form.Select>
                      {errors.role && <div className="invalid-feedback">{errors.role}</div>}
                    </Form.Group>
                  </Col>

                  {isSuperAdmin && (
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          {t("company")} <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          className={`minimal-input ${errors.company ? "is-invalid" : ""}`}
                          value={selectedCompanyId}
                          onChange={(e) => setSelectedCompanyId(e.target.value)}
                        >
                          <option value="">{t("Select_Company")}</option>
                          {companies.map((company) => (
                            <option key={company._id} value={company._id}>
                              {company.company_name}
                            </option>
                          ))}
                        </Form.Select>
                        {errors.company && <div className="invalid-feedback">{errors.company}</div>}
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <Button
                    variant="link"
                    className="cancel-link text-decoration-none"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    className="add-user-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {t("Adding...")}
                      </>
                    ) : (
                      t("Add_User")
                    )}
                  </Button>
                </div>
              </fieldset>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal show={showAssignModal} onHide={handleCloseAssignModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>{t("Assign_Collaborator")}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form onSubmit={handleAssign} noValidate>
              <Form.Group className="mb-3">
                <Form.Label>{t("Collaborator")}</Form.Label>
                <Form.Select
                  value={assignUserId}
                  onChange={(e) => {
                    setAssignUserId(e.target.value);
                    if (e.target.value) {
                      setAssignErrors(prev => ({ ...prev, collaborator: null }));
                    }
                  }}
                  isInvalid={!!assignErrors.collaborator}
                >
                  <option value="">{t("Select_collaborator")}</option>
                  {collaboratorUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {assignErrors.collaborator}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t("business")}</Form.Label>
                <Form.Select
                  value={assignBusinessId}
                  onChange={(e) => {
                    setAssignBusinessId(e.target.value);
                    if (e.target.value) {
                      setAssignErrors(prev => ({ ...prev, business: null }));
                    }
                  }}
                  isInvalid={!!assignErrors.business}
                >
                  <option value="">{t("Select_Business")}</option>
                  {allBusinesses.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.business_name || b.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {assignErrors.business}
                </Form.Control.Feedback>
              </Form.Group>

              <div className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" onClick={handleCloseAssignModal}>
                  {t("cancel")}
                </Button>
                <Button variant="primary" type="submit">
                  {t("save")}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal
          show={showGiveAccessModal}
          onHide={() => setShowGiveAccessModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>{t("Add Project Access")}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form onSubmit={(e) => e.preventDefault()} noValidate>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">{t("Access Type")}</Form.Label>
                <div className="mt-2 ms-3">
                  <Form.Check
                    type="radio"
                    name="accessType"
                    id="reRanking"
                    value="reRanking"
                    checked={accessType === "reRanking"}
                    onChange={() => handleAccessTypeChange("reRanking")}
                    label="Enable Reranking Project"
                  />
                  <Form.Check
                    type="radio"
                    name="accessType"
                    id="projectEdit"
                    value="projectEdit"
                    checked={accessType === "projectEdit"}
                    onChange={() => handleAccessTypeChange("projectEdit")}
                    label="Edit the Project"
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t("business")}</Form.Label>
                <Form.Select
                  value={accessBusinessId}
                  onChange={(e) => {
                    setAccessBusinessId(e.target.value);
                    if (e.target.value) {
                      setAccessErrors(prev => ({ ...prev, business: null }));
                    }
                  }}
                  isInvalid={!!accessErrors.business}
                >
                  <option value="">{t("Select_Business")}</option>
                  {launchedBusinesses.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.business_name || b.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {accessErrors.business}
                </Form.Control.Feedback>
              </Form.Group>

              {accessType === "projectEdit" && (
                <Form.Group className="mb-3">
                  <Form.Label>{t("Project")}</Form.Label>
                  <Form.Select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      if (e.target.value) {
                        setAccessErrors(prev => ({ ...prev, project: null }));
                      }
                    }}
                    disabled={!accessBusinessId || loadingProjects}
                    isInvalid={!!accessErrors.project}
                  >
                    <option value="">
                      {loadingProjects ? t("Loading projects") : t("Select Project")}
                    </option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.project_name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {accessErrors.project}
                  </Form.Control.Feedback>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>{t("Collaborators")}</Form.Label>
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    padding: "10px 10px 10px 20px"
                  }}
                >
                  {loadingCollaborators ? (
                    <div className="text-center py-3">Loading collaborators...</div>
                  ) : collaborators.length === 0 ? (
                    <div className="text-muted text-center py-3">No collaborators available</div>
                  ) : (
                    collaborators.map((c) => (
                      <Form.Check
                        key={c._id}
                        type="checkbox"
                        id={`collab-${c._id}`}
                        label={c.name}
                        checked={selectedCollaboratorIds.includes(c._id)}
                        onChange={() => handleCollaboratorToggle(c._id)}
                        className="mb-2"
                      />
                    ))
                  )}
                </div>
                {accessErrors.collaborators && (
                  <div className="text-danger small mt-1">
                    {accessErrors.collaborators}
                  </div>
                )}
                {selectedCollaboratorIds.length > 0 && (
                  <small className="text-muted">
                    {selectedCollaboratorIds.length} collaborator(s) selected
                  </small>
                )}
              </Form.Group>

              <div className="d-flex justify-content-end">
                <Button
                  variant="secondary"
                  className="me-2"
                  onClick={() => setShowGiveAccessModal(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="primary"
                  disabled={
                    !accessBusinessId ||
                    selectedCollaboratorIds.length === 0 ||
                    (accessType === "projectEdit" && !selectedProjectId)
                  }
                  onClick={handleProceedToConfirmation}
                >
                  {t("Continue")}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal
          show={showAccessConfirmation}
          onHide={() => setShowAccessConfirmation(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Confirm Access Grant</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <strong>Business:</strong> {getSelectedBusinessName()}
            </div>
            {accessType === "projectEdit" && (
              <div className="mb-3">
                <strong>Project:</strong> {getSelectedProjectName()}
              </div>
            )}
            <div className="mb-3">
              <strong>Access Type:</strong> {accessType === "reRanking" ? "Enable Reranking Project" : "Edit the Project"}
            </div>
            <div className="mb-3">
              <strong>Collaborators ({selectedCollaboratorIds.length}):</strong>
              <ul className="mt-2">
                {getSelectedCollaboratorNames().map((name, idx) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            </div>
            <p className="text-muted">
              Are you sure you want to grant access to these collaborators?
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAccessConfirmation(false);
                setShowGiveAccessModal(true);
              }}
            >
              Go Back
            </Button>
            <Button
              variant="primary"
              onClick={handleGiveProjectAccess}
              disabled={isGrantingAccess}
            >
              {isGrantingAccess ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Granting...
                </>
              ) : (
                "Yes, Grant Access"
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showConfirm}
          onHide={() => setShowConfirm(false)}
          centered
          backdrop="static"
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-semibold">
              Confirm Role Change
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="pt-2">
            <div className="d-flex align-items-start gap-3">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#fff4e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f59e0b",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
              >
                !
              </div>
              <div>
                <p className="mb-1 fw-semibold">
                  Are you sure you want to change this user's role?
                </p>
                <p className="mb-0 text-muted">
                  The role will be updated to{" "}
                  <span className="fw-bold text-primary text-capitalize">
                    {pendingRole}
                  </span>
                  .
                </p>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="light"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="px-4"
              onClick={() => {
                handleRoleUpdate(pendingUserId, pendingRole);
                setShowConfirm(false);
              }}
            >
              Yes, Change Role
            </Button>
          </Modal.Footer>
        </Modal>
        <UpgradeModal
          show={showUpgradeModal}
          onHide={() => setShowUpgradeModal(false)}
          onUpgradeSuccess={(updatedSub) => {
            onToast(t('plan_updated_success') || 'Plan updated successfully!', 'success');
          }}
        />
      </div >
    </div >
  );
};

export default UserManagement;