import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Row, Col, Card, Form, Button, Dropdown, Modal, Alert, Spinner } from "react-bootstrap";
import { Crown, UserCog, User, ShieldCheck, MoreVertical, Plus, Eye, EyeOff, Activity, Users, Shield, History } from "lucide-react";
import "../styles/usermanagement.css";
import UpgradeModal from "./UpgradeModal";
import PlanLimitModal from "./PlanLimitModal";
import ErrorModal from "./ErrorModal";
import axios from "axios";
import { useTranslation } from '../hooks/useTranslation';
import AdminTable from "./AdminTable";
import MetricCard from "./MetricCard";
import "../styles/AdminTableStyles.css";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useAuthStore, useProjectStore } from "../store";
import { usePlanDetails, useCompanies, useAdminUsers, useBusinesses, useProjects, useCompanyCollaborators } from "../hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";

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
  const { t } = useTranslation();
  const { userRole, token } = useAuthStore();
  const currentRole = userRole;
  const isSuperAdmin = currentRole === 'super_admin';
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'company_admin';

  const fetchUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Legacy
  const [isAssigning, setIsAssigning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination & Search state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPageBeforeSearch, setLastPageBeforeSearch] = useState(1);
  const itemsPerPage = 10;

  // Modal contexts
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newRole, setNewRole] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignBusinessId, setAssignBusinessId] = useState("");
  const [assigningBusinessCollaborators, setAssigningBusinessCollaborators] = useState([]);
  const [assignErrors, setAssignErrors] = useState({});

  const [showGiveAccessModal, setShowGiveAccessModal] = useState(false);
  const [accessBusinessId, setAccessBusinessId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState([]);
  const [accessErrors, setAccessErrors] = useState({});
  const [accessType, setAccessType] = useState("reRanking");
  const [showAccessConfirmation, setShowAccessConfirmation] = useState(false);
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);

  // Confirmation state
  const [pendingUserId, setPendingUserId] = useState(null);
  const [pendingUserName, setPendingUserName] = useState("");
  const [pendingRole, setPendingRole] = useState("");
  const [isReactivating, setIsReactivating] = useState(false);
  const [isRoleChanging, setIsRoleChanging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Plan level & errors
  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false);
  const [planLimitConfig, setPlanLimitConfig] = useState({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalConfig, setErrorModalConfig] = useState({});

  const queryClient = useQueryClient();

  // --- TanStack Query hooks ---
  const { data: usageData, isLoading: loadingPlans } = usePlanDetails();
  const usage = usageData?.usage;
  const { data: users = [], isLoading: loadingUsers } = useAdminUsers();
  const { data: companies = [], isLoading: loadingCompanies } = useCompanies();
  const { data: businessesRaw, isLoading: loadingBusinesses } = useBusinesses();
  // Combine owned + collaborating into a flat list for the admin view
  const businessData = React.useMemo(() => [
    ...(businessesRaw?.businesses || []),
    ...(businessesRaw?.collaborating_businesses || [])
  ], [businessesRaw]);


  const { data: collaboratorData = [], isLoading: loadingCollaborators } = useCompanyCollaborators(accessBusinessId);
  const { data: projectData = [], isLoading: loadingProjects } = useProjects(accessBusinessId);

  // Derive specialized business lists
  const allBusinesses = React.useMemo(() => 
    businessData.filter(b => {
      const s = (b.status || "").toLowerCase();
      const am = (b.access_mode || "").toLowerCase();
      return s !== "deleted" && s !== "archived" && s !== "inactive" && am !== "archived" && am !== "hidden";
    }), 
    [businessData]
  );
  const launchedBusinesses = React.useMemo(() =>
    businessData.filter(b => {
      const s = (b.status || "").toLowerCase();
      const am = (b.access_mode || "").toLowerCase();
      const isLaunched = s === "launched" || b.has_launched_projects === true;
      const isActive = s !== "deleted" && s !== "archived" && s !== "inactive" && am !== "archived" && am !== "hidden";
      return isLaunched && isActive;
    }),
    [businessData]
  );

  const collaborators = React.useMemo(() => collaboratorData, [collaboratorData]);
  const projects = React.useMemo(() => {
    return (projectData || []).filter(p => {
      const s = (p.status || "").toLowerCase().trim().replace(/[-_\s]/g, "");
      const isArchivedOrDeleted = s === "deleted" || s === "archived" || p.access_mode === "archived" || p.access_mode === "hidden";
      return (s === "active" || s === "atrisk" || s === "paused") && !isArchivedOrDeleted;
    });
  }, [projectData]);

  const loadLaunchedBusinessAndProjects = () => {
    // Legacy placeholder, now handled by TanStack hooks
  };



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
    setAssigningBusinessCollaborators([]);
    setAssignErrors({});
  };

  const handleOpenGiveAccessModal = () => {
    setAccessBusinessId("");
    setSelectedProjectId("");
    setSelectedCollaboratorIds([]);
    setAccessErrors({});
    setAccessType("reRanking");
    loadLaunchedBusinessAndProjects();
    setShowGiveAccessModal(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!newName.trim()) {
      newErrors.name = t("Name_is_required");
    } else if (!/[a-zA-Z]/.test(newName)) {
      newErrors.name = t("Name_must_contain_alphabetic_characters");
    } else if (newName.trim().length < 3) {
      newErrors.name = t("Name_must_be_atleast3_characters_long");
    }
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{3,}$/;
    if (!newEmail.trim()) {
      newErrors.email = t("Email_is_required");
    } else if (!emailPattern.test(newEmail)) {
      newErrors.email = t("Enter_a_valid_email_address");
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
      newErrors.confirmPassword = t("confirm_password_required");
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t("passwords_do_not_match");
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

    // Dynamic Limit Check
    if (usage) {
      const roleKey = newRole.toLowerCase() === 'collaborator' ? 'collaborators' :
        (newRole.toLowerCase() === 'viewer' ? 'viewers' : 'users');

      const current = usage[roleKey]?.current || 0;
      const limit = usage[roleKey]?.limit || 0;

      if (current >= limit) {
        setPlanLimitConfig({
          title: t("plan_limit_reached") || "Plan Limit Reached",
          message: `${t("Upgrade to add more")} ${t(newRole)}s`,
          subMessage: `${t("Your plan allows for")} ${limit} ${t(newRole)}${limit !== 1 ? 's' : ''}. ${t("Please upgrade to add more.")}`
        });
        setShowPlanLimitModal(true);
        return;
      }
    }

    setIsSubmitting(true);
    const payload = {
      name: newName.trim(),
      email: newEmail.trim(),
      password: newPassword,
      ...(isSuperAdmin && { company_id: selectedCompanyId }),
      role: newRole,
    };
    try {
      await axios.post(`${BACKEND_URL}/api/admin/users`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onToast(t("User_added_successfully"), "success");

      // Invalidate queries to trigger parallel refetch
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["planDetails"] });

      handleCloseModal();

    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || t("Failed_to_add_user");
      setErrors(prev => ({ ...prev, apiError: message }));
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleRoleUpdate = async (userId, role) => {
    // Dynamic Limit Check for role update
    if (usage) {
      const roleKey = role.toLowerCase() === 'collaborator' ? 'collaborators' :
        (role.toLowerCase() === 'viewer' ? 'viewers' : 'users');

      const current = usage[roleKey]?.current || 0;
      const limit = usage[roleKey]?.limit || 0;

      if (current >= limit) {
        setPlanLimitConfig({
          title: t("plan_limit_reached") || "Plan Limit Reached",
          message: `${t("Upgrade to add more")} ${t(role)}s`,
          subMessage: `${t("Your plan allows for")} ${limit} ${t(role)}${limit !== 1 ? 's' : ''}. ${t("Please upgrade to add more.")}`
        });
        setShowPlanLimitModal(true);
        return;
      }
    }

    try {
      await axios.put(`${BACKEND_URL}/api/admin/users/${userId}/role`, { role }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onToast(t("User_updated_successfully"), "success");

      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["planDetails"] });

    } catch (error) {
      console.error(error);
      onToast(error.response?.data?.error || t("Failed_to_update_role"), "error");
    }
  };

  const handleCollaboratorToggle = (collaboratorId) => {
    setSelectedCollaboratorIds(prev => {
      const next = prev.includes(collaboratorId) ? prev.filter(id => id !== collaboratorId) : [...prev, collaboratorId];
      if (next.length > 0 && accessErrors.collaborators) {
        setAccessErrors(curr => {
          const updated = { ...curr };
          delete updated.collaborators;
          return updated;
        });
      }
      return next;
    });
  };

  const handleProceedToConfirmation = () => {
    const newErrors = {};
    if (!accessBusinessId) newErrors.business = t("select_business_required");
    if (selectedCollaboratorIds.length === 0) newErrors.collaborators = t("select_collaborators_at_least_one");
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
      const { setBusinessAccessMode, grantProjectEditAccess, grantRankingAccess } = useProjectStore.getState();

      const tasks = [];
      if (accessType === "reRanking") {
        tasks.push(setBusinessAccessMode(accessBusinessId, "reRanking"));
        tasks.push(grantRankingAccess(accessBusinessId, selectedCollaboratorIds));
      } else if (accessType === "projectEdit") {
        tasks.push(grantProjectEditAccess(accessBusinessId, selectedProjectId, selectedCollaboratorIds));
      }

      await Promise.all(tasks);

      onToast(t("Access_granted_successfully"), "success");
      setShowAccessConfirmation(false);
      setSelectedProjectId("");
      setSelectedCollaboratorIds([]);
      setAccessBusinessId("");
    } catch (err) {
      console.error(err);
      onToast(err.error || t("Failed_to_give_access"), "error");
    } finally {
      setIsGrantingAccess(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!assignUserId) newErrors.collaborator = t("select_user_required");
    if (!assignBusinessId) newErrors.business = t("select_business_required");
    if (Object.keys(newErrors).length > 0) {
      setAssignErrors(newErrors);
      return;
    }

    // Assigning usually means they are already a user/collaborator.
    // The total seat limit is checked when adding a user or changing their role.

    setIsAssigning(true);
    try {
      await axios.post(`${BACKEND_URL}/api/businesses/${assignBusinessId}/collaborators`, { user_id: assignUserId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onToast(t("User_assigned_successfully"), "success");
      handleCloseAssignModal();
      queryClient.invalidateQueries({ queryKey: ["planDetails"] });
      queryClient.invalidateQueries({ queryKey: ["collaborators", assignBusinessId] });
    } catch (error) {
      console.error(error);
      onToast(error.response?.data?.message || error.response?.data?.error || t("Failed_to_assign_user"), "error");
    } finally {
      setIsAssigning(false);
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


  const handleSearch = (value) => {
    if (searchTerm === "" && value !== "") setLastPageBeforeSearch(currentPage);
    if (searchTerm !== "" && value === "") setCurrentPage(lastPageBeforeSearch);
    // if (value !== searchTerm) setCurrentPage(1);
    setSearchTerm(value);
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setSelectedRole(value);
    setCurrentPage(1);
  };

  // Filtered users for the table
  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    const matchSearch =
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.company_name?.toLowerCase().includes(search) ||
      formatRole(user.role_name || user.role).toLowerCase().includes(search) ||
      user.status?.toLowerCase().includes(search) ||
      user.access_mode?.toLowerCase().includes(search);

    const uiRole = formatRole(user.role_name || user.role);
    const matchRole = selectedRole === "All Roles" || uiRole === selectedRole;

    return matchSearch && matchRole;
  });

  useEffect(() => {
    if (!searchTerm && selectedRole === "All Roles") return;
    const maxPage = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [filteredUsers.length, searchTerm, selectedRole]);

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



  const getSelectedCollaboratorNames = () => collaborators.filter(c => selectedCollaboratorIds.includes(c._id)).map(c => c.name);
  const getSelectedProjectName = () => projects.find(p => p._id === selectedProjectId)?.project_name || "";
  const getSelectedBusinessName = () => {
    const b = launchedBusinesses.find(b => b._id === accessBusinessId);
    return b?.business_name || b?.name || "";
  };

  // Metrics calculation
  const activeUsers = users.filter(u => u.status !== 'inactive' && u.status !== 'deleted' && u.access_mode !== 'archived');
  const orgAdminsCount = activeUsers.filter(u => formatRole(u.role_name || u.role) === "Org Admin").length;
  const collaboratorsCount = activeUsers.filter(u => formatRole(u.role_name || u.role) === "Collaborator").length;
  const viewersCount = activeUsers.filter(u => formatRole(u.role_name || u.role) === "Viewer").length;
  const usersCount = activeUsers.filter(u => formatRole(u.role_name || u.role) === "User").length;

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
            <span style={{ color: style.color, fontWeight: 500 }}>{t(uiRole.replace(' ', '_'))}</span>
          </span>
        );
      }
    },
    {
      key: "created_at",
      label: t("joined"),
      render: (val) => <span className="admin-cell-secondary">{formatDate(val)}</span>
    },
    {
      key: "status",
      label: t("Status"),
      render: (_, row) => {
        const isArchived = row.status === 'inactive' || row.status === 'deleted' || row.access_mode === 'archived';
        const label = (isArchived ? t('archived') : t('active'))?.toUpperCase();
        let statusColor = "#16a34a";
        let statusBg = "#dcfce7";
        if (isArchived) {
          statusColor = "#ecaa1cff";
          statusBg = "#FCF9C3";
        }
        return (
          <span style={{
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 500,
            color: statusColor,
            backgroundColor: statusBg,
            display: "inline-block"
          }}>
            {label}
          </span>
        );
      }
    },
    ...(isAdmin ? [{
      key: "actions",
      label: t("Action"),
      render: (_, row) => {
        const roleName = (row.role_name || row.role)?.toLowerCase();
        if (roleName === "company_admin" || roleName === "super_admin") return null;

        const isArchived = row.status === 'inactive' || row.status === 'deleted' || row.access_mode === 'archived';
        return (
          <>
            <Dropdown>
              <Dropdown.Toggle as={CustomToggle} />
              <Dropdown.Menu align="end">
                {(row.role_name?.toLowerCase() !== "collaborator" || isArchived) && (
                  <Dropdown.Item onClick={() => {
                    setPendingUserId(row._id);
                    setPendingUserName(row.name);
                    setPendingRole("collaborator");
                    setIsReactivating(isArchived);
                    setIsRoleChanging((row.role_name || row.role)?.toLowerCase() !== "collaborator");
                    setShowConfirm(true);
                  }}>
                    <UserCog size={16} className="me-2" /> {isArchived && row.role_name?.toLowerCase() === "collaborator" ? t("Reactivate_Collaborator") : t("Collaborator")}
                  </Dropdown.Item>
                )}
                {(row.role_name?.toLowerCase() !== "viewer" || isArchived) && (
                  <Dropdown.Item onClick={() => {
                    setPendingUserId(row._id);
                    setPendingUserName(row.name);
                    setPendingRole("viewer");
                    setIsReactivating(isArchived);
                    setIsRoleChanging((row.role_name || row.role)?.toLowerCase() !== "viewer");
                    setShowConfirm(true);
                  }}>
                    <User size={16} className="me-2" /> {isArchived && row.role_name?.toLowerCase() === "viewer" ? t("Reactivate_Viewer") : t("Viewer")}
                  </Dropdown.Item>
                )}
                {(row.role_name?.toLowerCase() !== "user" || isArchived) && (
                  <Dropdown.Item onClick={() => {
                    setPendingUserId(row._id);
                    setPendingUserName(row.name);
                    setPendingRole("user");
                    setIsReactivating(isArchived);
                    setIsRoleChanging((row.role_name || row.role)?.toLowerCase() !== "user");
                    setShowConfirm(true);
                  }}>
                    <ShieldCheck size={16} className="me-2" /> {isArchived && row.role_name?.toLowerCase() === "user" ? t("Reactivate_User") : t("User")}
                  </Dropdown.Item>
                )}
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
        {currentRole !== "company_admin" && (
          <MetricCard
            label={t("org_admins")}
            value={orgAdminsCount}
            icon={Crown}
            iconColor="purple"
          />
        )}
        <MetricCard
          label={t("Collaborators")}
          value={collaboratorsCount}
          icon={UserCog}
          iconColor="green"
        />
        <MetricCard
          label={t("Users")}
          value={usersCount}
          icon={ShieldCheck}
          iconColor="cyan"
        />
        <MetricCard
          label={t("Viewers")}
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
              <Button className="admin-primary-btn" onClick={() => {
                // If usage has loaded, we check if they can add ANY role.
                // If they have 0 limit for ALL roles (which shouldn't happen), then show modal.
                // Otherwise, let them open the modal and check specifically on submit.
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
                } else {
                  handleOpenModal();
                }
              }}>
                <Plus size={16} /> {t("Add_User")}
              </Button>
              <Button className="admin-secondary-btn" onClick={() => {
                handleOpenAssignModal();
              }}>
                <UserCog size={16} /> {t("Assign_Business_Access")}
              </Button>
              <Button className="admin-secondary-btn" onClick={handleOpenGiveAccessModal}>
                <ShieldCheck size={16} /> {t("Project_Access")}
              </Button>
            </>
          )}
        </div>
      </div>

      <AdminTable
        title={t("User_Management")}
        count={activeUsers.length}
        countLabel={activeUsers.length === 1 ? t("User") : t("Users")}
        columns={columns}
        data={paginatedUsers}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder={t("Search_by_name_or_email")}
        searchTooltip={t("search_users_tooltip")}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        loading={isLoading}
        emptyMessage={t("No_Users_Found")}
        emptySubMessage={
          searchTerm
            ? t("No_users_match_your_search_criteria")
            : t("No_users_available")
        }
        toolbarContent={
          <Form.Select
            className="role-select"
            style={{ width: '210px' }}
            value={selectedRole}
            onChange={handleRoleChange}
          >
            <option value="All Roles">{t("All_Roles")}</option>
            <option value="Org Admin">{t("Org_Admin")}</option>
            <option value="Collaborator">{t("Collaborator")}</option>
            <option value="User">{t("User")}</option>
            <option value="Viewer">{t("Viewer")}</option>
          </Form.Select>
        }
      />

      {/* --- Modals Stay Same --- */}
      {/* --- Add New User Modal --- */}
      <Modal show={showModal} onHide={handleCloseModal} centered scrollable size="lg" className="new-user-modal">
        <Modal.Header closeButton>
          <Modal.Title>{t("New_user")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errors.apiError && (
            <Alert variant="danger" onClose={() => setErrors(prev => ({ ...prev, apiError: "" }))} dismissible>
              {errors.apiError}
            </Alert>
          )}
          <Form onSubmit={handleAddUser}>
            <fieldset disabled={isSubmitting} style={{ border: 'none', padding: 0 }}>
              <Form.Group as={Row} className="mb-4 align-items-center">
                <Form.Label column sm={4}>{t("email_address")} *</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      const newErrors = { ...errors };
                      if (newErrors.email) delete newErrors.email;
                      if (newErrors.apiError) delete newErrors.apiError;
                      setErrors(newErrors);
                    }}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-4 align-items-center">
                <Form.Label column sm={4}>{t("first_name")} *</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      const newErrors = { ...errors };
                      if (newErrors.name) delete newErrors.name;
                      if (newErrors.apiError) delete newErrors.apiError;
                      setErrors(newErrors);
                    }}
                    isInvalid={!!errors.name}
                  />
                  <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-4 align-items-center">
                <Form.Label column sm={4}>{t("password")} *</Form.Label>
                <Col sm={8}>
                  <div className="password-input-outer">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        const newErrors = { ...errors };
                        if (newErrors.password) delete newErrors.password;
                        if (newErrors.apiError) delete newErrors.apiError;
                        setErrors(newErrors);
                      }}
                      isInvalid={!!errors.password}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn">
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-4 align-items-center">
                <Form.Label column sm={4}>{t("confirm_password")} *</Form.Label>
                <Col sm={8}>
                  <div className="password-input-outer">
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        const newErrors = { ...errors };
                        if (newErrors.confirmPassword) delete newErrors.confirmPassword;
                        if (newErrors.apiError) delete newErrors.apiError;
                        setErrors(newErrors);
                      }}
                      isInvalid={!!errors.confirmPassword}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle-btn">
                      {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-4 align-items-center">
                <Form.Label column sm={4}>{t("role")} *</Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={newRole}
                    onChange={(e) => {
                      setNewRole(e.target.value);
                      const newErrors = { ...errors };
                      if (newErrors.role) delete newErrors.role;
                      if (newErrors.apiError) delete newErrors.apiError;
                      setErrors(newErrors);
                    }}
                    isInvalid={!!errors.role}
                  >
                    <option value="">{t("Select_Role")}</option>
                    <option value="collaborator">{t("Collaborator")}</option>
                    <option value="user">{t("User")}</option>
                    <option value="viewer">{t("Viewer")}</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.role}</Form.Control.Feedback>
                </Col>
              </Form.Group>

              {isSuperAdmin && (
                <Form.Group as={Row} className="mb-4 align-items-center">
                  <Form.Label column sm={4}>{t("company")} *</Form.Label>
                  <Col sm={8}>
                    <Form.Select
                      value={selectedCompanyId}
                      onChange={(e) => {
                        setSelectedCompanyId(e.target.value);
                        const newErrors = { ...errors };
                        if (newErrors.company) delete newErrors.company;
                        if (newErrors.apiError) delete newErrors.apiError;
                        setErrors(newErrors);
                      }}
                      isInvalid={!!errors.company}
                    >
                      <option value="">{t("Select_Company")}</option>
                      {companies.map(c => (
                        <option key={c._id} value={c._id}>{c.company_name}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.company}</Form.Control.Feedback>
                  </Col>
                </Form.Group>
              )}
            </fieldset>

            <div className="modal-footer">
              <Button variant="link" onClick={handleCloseModal} className="btn-cancel" disabled={isSubmitting}>
                {t("cancel")}
              </Button>
              <Button variant="primary" type="submit" className="btn-ok" disabled={isSubmitting}>
                {isSubmitting ? t("Adding") : t("ok")}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* --- Modals for Assign, Access, Confirm --- */}
      <Modal show={showAssignModal} onHide={handleCloseAssignModal} centered>
        <Modal.Header closeButton><Modal.Title>{t("Assign_Business_Access")}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAssign} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>{t("business")}</Form.Label>
              <Form.Select
                value={assignBusinessId}
                onChange={(e) => {
                  const bizId = e.target.value;
                  setAssignBusinessId(bizId);
                  setAssignUserId(""); // Reset user selection when business changes
                  // Populate current collaborators of the selected business so the user
                  // dropdown can filter them out
                  const selectedBiz = businessData.find(b => b._id === bizId);
                  setAssigningBusinessCollaborators(
                    (selectedBiz?.collaborators || []).map(c =>
                      typeof c === "object" ? c : { _id: c }
                    )
                  );
                }}
                isInvalid={!!assignErrors.business}
                disabled={allBusinesses.length === 0}
              >
                <option value="">
                  {allBusinesses.length > 0 ? t("Select_Business") : t("No_Business_Found")}
                </option>
                {allBusinesses.map(b => (
                  <option key={b._id} value={b._id}>{b.business_name || b.name}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{assignErrors.business}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t("User")}</Form.Label>
              <Form.Select
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                isInvalid={!!assignErrors.collaborator}
                disabled={!assignBusinessId}
              >
                {(() => {
                  const filtered = users.filter(u => {
                    const isArchivedOrDeleted = u.status === 'inactive' || u.status === 'deleted' || u.access_mode === 'archived';
                    const roleName = formatRole(u.role_name || u.role);
                    const isAlreadyAssigned = assigningBusinessCollaborators.some(c => c._id === u._id);
                    return !isArchivedOrDeleted && ["Collaborator", "User", "Viewer"].includes(roleName) && !isAlreadyAssigned;
                  });

                  const showNoUsers = assignBusinessId && filtered.length === 0;

                  return (
                    <>
                      <option value="">{showNoUsers ? t("No_Users_Found") : t("Select_user")}</option>
                      {!showNoUsers && filtered.map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </>
                  );
                })()}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{assignErrors.collaborator}</Form.Control.Feedback>
            </Form.Group>
            <div className="d-flex justify-content-end"><Button variant="secondary" className="me-2" onClick={handleCloseAssignModal} disabled={isAssigning}>{t("cancel")}</Button><Button variant="primary" type="submit" disabled={isAssigning}>{isAssigning ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> : null}{isAssigning ? t("Saving...") : t("save")}</Button></div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showGiveAccessModal} onHide={() => setShowGiveAccessModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>{t("Add_Project_Access")}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form noValidate>
            <Form.Group className="mb-3"><Form.Label className="fw-bold">{t("Access_Type")}</Form.Label><div className="mt-2 ms-3"><Form.Check type="radio" label={t("Enable_Reranking_Project")} checked={accessType === "reRanking"} onChange={() => setAccessType("reRanking")} /><Form.Check type="radio" label={t("Edit_the_Project")} checked={accessType === "projectEdit"} onChange={() => setAccessType("projectEdit")} /></div></Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t("business")}</Form.Label>
              <Form.Select
                value={accessBusinessId}
                onChange={(e) => {
                  setAccessBusinessId(e.target.value);
                  if (accessErrors.business) {
                    setAccessErrors(curr => {
                      const next = { ...curr };
                      delete next.business;
                      return next;
                    });
                  }
                }}
                isInvalid={!!accessErrors.business}
              >
                <option value="">
                  {launchedBusinesses.length > 0 ? t("Select_Business") : t("No_Business_Found")}
                </option>
                {launchedBusinesses.map(b => (
                  <option key={b._id} value={b._id}>{b.business_name || b.name}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{accessErrors.business}</Form.Control.Feedback>
            </Form.Group>
            {accessType === "projectEdit" && (
              <Form.Group className="mb-3">
                <Form.Label>{t("Project")}</Form.Label>
                <Form.Select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    if (accessErrors.project) {
                      setAccessErrors(curr => {
                        const next = { ...curr };
                        delete next.project;
                        return next;
                      });
                    }
                  }}
                  isInvalid={!!accessErrors.project}
                  disabled={!accessBusinessId}
                >
                  <option value="">{loadingProjects ? t("Loading_projects") : t("Select_Project")}</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{accessErrors.project}</Form.Control.Feedback>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>{t("Participants")}</Form.Label>
              <div className="collaborator-checkbox-list" style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px", padding: "17px" }}>
                {(() => {
                  // Find selected business from ALL business data (not just launched)
                  const selectedBizData = businessData.find(b => b._id?.toString() === accessBusinessId?.toString());

                  const filteredCollaborators = collaborators.filter(c => {
                    // Filter out viewers
                    if (c.role_name?.toLowerCase() === 'viewer') return false;

                    const cId = c._id?.toString();

                    if (accessType === "reRanking") {
                      // Exclude collaborators already granted reranking access
                      const existing = (selectedBizData?.allowed_ranking_collaborators || []);
                      const alreadyHas = existing.some(id => id?.toString() === cId);
                      return !alreadyHas;
                    }

                    if (accessType === "projectEdit") {
                      if (!selectedProjectId) return true; // No project chosen yet — show all
                      const project = projects.find(p => p._id?.toString() === selectedProjectId?.toString());
                      const existing = project?.allowed_collaborators || [];
                      const alreadyHas = existing.some(id => id?.toString() === cId);
                      return !alreadyHas;
                    }

                    return true;
                  });

                  return filteredCollaborators.length > 0 ? (
                    filteredCollaborators.map(c => (
                      <Form.Check key={c._id} label={c.name} checked={selectedCollaboratorIds.includes(c._id)} onChange={() => handleCollaboratorToggle(c._id)} />
                    ))
                  ) : (
                    <div className="text-muted text-center py-3">{t("No_Participants_Found")}</div>
                  );
                })()}
              </div>
              {accessErrors.collaborators && <div className="text-danger mt-1" style={{ fontSize: '0.875em' }}>{accessErrors.collaborators}</div>}
            </Form.Group>
            <div className="d-flex justify-content-end"><Button variant="secondary" className="me-2" onClick={() => setShowGiveAccessModal(false)}>{t("cancel")}</Button><Button variant="primary" onClick={handleProceedToConfirmation}>{t("Continue")}</Button></div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showAccessConfirmation} onHide={() => setShowAccessConfirmation(false)} centered>
        <Modal.Header closeButton><Modal.Title>{t("Confirm_Access_Grant")}</Modal.Title></Modal.Header>
        <Modal.Body><p>{t("Business_Label")} {getSelectedBusinessName()}</p>{accessType === "projectEdit" && <p>{t("Project_Label")} {getSelectedProjectName()}</p>}<p>{t("Access_Label")} {accessType === "reRanking" ? t("reRanking") : t("projectEdit")}</p><p>{t("Participants_Label")} {getSelectedCollaboratorNames().join(", ")}</p></Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowAccessConfirmation(false)}>{t("Back")}</Button><Button variant="primary" onClick={handleGiveProjectAccess} disabled={isGrantingAccess}>{isGrantingAccess ? t("Granting") : t("Yes_Grant_Access")}</Button></Modal.Footer>
      </Modal>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered dialogClassName="compact-confirm-modal">
        <Modal.Header closeButton>
          <Modal.Title>{isReactivating ? t("Confirm_Reactivation") || t("Confirm_Role_Change") : t("Confirm_Role_Change")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(() => {
            const roleName = t(pendingRole?.charAt(0).toUpperCase() + pendingRole?.slice(1));
            const msgKey = isReactivating
              ? (isRoleChanging ? "Reactivate_And_Change_Role_Confirm_Msg" : "Reactivate_User_Confirm_Msg")
              : "Change_role_confirm_msg";

            const message = t(msgKey, { user: "__USER__", role: "__ROLE__" });
            const parts = message.split(/(__USER__|__ROLE__)/);

            return (
              <p>
                {parts.map((part, i) => {
                  if (part === "__USER__") return <strong key={i} style={{ color: "#4f46e5" }}>{pendingUserName}</strong>;
                  if (part === "__ROLE__") return <strong key={i} style={{ color: "#0ea5e9" }}>{roleName}</strong>;
                  return part;
                })}
              </p>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => { setShowConfirm(false); setIsReactivating(false); setIsRoleChanging(false); setPendingUserName(""); }}>{t("cancel")}</Button>
          <Button variant="primary" onClick={() => { handleRoleUpdate(pendingUserId, pendingRole); setShowConfirm(false); setIsReactivating(false); setIsRoleChanging(false); setPendingUserName(""); }}>
            {isReactivating ? t("reactivate") : t("Yes_Change_Role")}
          </Button>
        </Modal.Footer>
      </Modal>

      <UpgradeModal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} onUpgradeSuccess={() => fetchUsers()} />
      <PlanLimitModal
        show={showPlanLimitModal}
        onHide={() => setShowPlanLimitModal(false)}
        onAction={handleCloseModal}
        title={planLimitConfig.title}
        message={planLimitConfig.message}
        subMessage={planLimitConfig.subMessage}
        plan={usage?.plan}
        isAdmin={isAdmin}
      />
      <ErrorModal
        show={showErrorModal}
        handleClose={() => setShowErrorModal(false)}
        title={errorModalConfig.title}
        message={errorModalConfig.message}
        buttonText="OK"
      />
    </div>
  );
};

export default UserManagement;