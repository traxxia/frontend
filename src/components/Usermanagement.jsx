import React, {useState,useEffect} from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Dropdown, Modal } from "react-bootstrap";
import { Crown, UserCog, User, ShieldCheck, MoreVertical,Search , Plus} from "lucide-react";
import "../styles/usermanagement.css";
import axios from "axios";
import Pagination from "../components/Pagination";
import { useTranslation } from '../hooks/useTranslation';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;



const statusStyles = {
  Active: { bg: "#d1fae5", color: "#047857" },
  Pending: { bg: "#fef3c7", color: "#b45309" },
};

const CustomToggle = React.forwardRef(({ onClick }, ref) => (
  <span
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    style={{
      cursor: "pointer",
      padding: "6px",
      borderRadius: "6px",
      display: "inline-flex",
      alignItems: "center",
    }}
    className="action-btn"
  >
    <MoreVertical size={20} />
  </span>
));
const UserManagement = ({ onToast }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { t } = useTranslation();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);



  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState(""); 
  const [newRole, setNewRole] = useState(""); 
  const token = sessionStorage.getItem("token");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [assignBusinessId, setAssignBusinessId] = useState("");
  const [showGiveAccessModal, setShowGiveAccessModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [pendingRole, setPendingRole] = useState(null);
  // ---- Project Access states ----
const [accessBusinessId, setAccessBusinessId] = useState("");
const [projects, setProjects] = useState([]);
const [selectedProjectId, setSelectedProjectId] = useState("");
const [loadingProjects, setLoadingProjects] = useState(false);
const [launchedProjectMap, setLaunchedProjectMap] = useState({});
// ---- Collaborator Access states ----
const [collaborators, setCollaborators] = useState([]);
const [selectedCollaboratorId, setSelectedCollaboratorId] = useState("");
const [loadingCollaborators, setLoadingCollaborators] = useState(false);



  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  const currentRole = sessionStorage.getItem("userRole");
  const isSuperAdmin = currentRole === "super_admin";
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const handleOpenModal = () => {
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("");
    setSelectedCompanyId("");
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);
  const handleOpenAssignModal = () => setShowAssignModal(true);
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setAssignUserId("");
    setAssignBusinessId("");
    
  };
  
  const validateForm = () => {
  const newErrors = {};

  // Name validation
  if (!newName.trim()) {
    newErrors.name = t("Name_is_required")
  } 
  else if (!/^[A-Za-z]/.test(newName)) {
    newErrors.name = t("Name_must_start_with_letter")
  } 
  else if (newName.trim().length < 3) {
    newErrors.name = t("Name_must_be_atleast3_characters_long")
  }


  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!newEmail.trim() || !emailPattern.test(newEmail)) {
    newErrors.email = t("Enter a valid email address")
  }

  if (
    !newPassword ||
    newPassword.length < 8 ||
    !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(newPassword)
  ) {
    newErrors.password =
      t("Password_uppercase_lowercase_number_special character")
  }

  if (!newRole) {
    newErrors.role = t("Role_is_required")
  }

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};


const handleAddUser = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  setIsSubmitting(true); // ✅ START LOADER

  const payload = {
    name: newName,
    email: newEmail,
    password: newPassword,
    ...(isSuperAdmin && { company_id: selectedCompanyId }),
    role: newRole,
  };

  try {
    await axios.post(`${BACKEND_URL}/api/admin/users`, payload);

    onToast("User added successfully!", "success");

    await fetchUsers();

    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("");
    setSelectedCompanyId("");

    handleCloseModal();
  } catch (error) {
  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    "Failed to add user";

  if (message.toLowerCase().includes("exist")) {
    onToast("User already exists!", "error");
  } else {
    onToast(message, "error");
  }
}finally {
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

    // Refresh users after update
    fetchUsers();
  } catch (error) {
    console.error(error);
    onToast(
      error.response?.data?.error || "Failed to update role",
      "error"
    );
  }
};
const handleGiveProjectAccess = async () => {
  if (!accessBusinessId || !selectedProjectId || !selectedCollaboratorId) {
    onToast("Please select business, project and collaborator", "error");
    return;
  }

  try {
    await axios.patch(
      `${BACKEND_URL}/api/projects/${selectedProjectId}/status`,
      { status: "reprioritizing" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await axios.patch(
      `${BACKEND_URL}/api/projects/${selectedProjectId}`,
      {
        status: "reprioritizing",
        allowed_collaborators: [selectedCollaboratorId],
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    onToast("Project access given successfully", "success");

    setShowGiveAccessModal(false);
    setAccessBusinessId("");
    setSelectedProjectId("");
    setSelectedCollaboratorId("");
    setProjects([]);
    setCollaborators([]);
  } catch (error) {
    console.error(error);
    onToast(
      error.response?.data?.error || "Failed to give project access",
      "error"
    );
  }
};

const handleAssign = async (e) => {
  e.preventDefault();

  if (!assignUserId || !assignBusinessId) {
    onToast("Select user and business");
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

  // ---- DERIVED METRICS ----
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


  // ---- HANDLERS ----
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
      user.name?.toLowerCase().startsWith(search.toLowerCase()) ||
      user.email?.toLowerCase().startsWith(search.toLowerCase());

    const uiRole = formatRole(user.role_name || user.role); // FIXED

    const matchRole = role === "All Roles" || uiRole === role;

    return matchSearch && matchRole;
  });

  setFilteredUsers(result);
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
    const data = Array.isArray(res.data) ? res.data : res.data.businesses || [];
    setBusinesses(data);
  } catch (error) {
    alert("Failed to fetch businesses");
  }
};
const loadLaunchedBusinessAndProjects = async () => {
  try {
    setLoadingProjects(true);

    // Fetch all launched projects
    const projectRes = await axios.get(`${BACKEND_URL}/api/projects`, {
      params: { status: "launched" },
      headers: { Authorization: `Bearer ${token}` },
    });

    const launchedProjects = projectRes.data.projects || [];

    // Fetch all businesses
    const businessRes = await axios.get(`${BACKEND_URL}/api/businesses`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const allBusinesses =
      businessRes.data.businesses || businessRes.data || [];

    // Build business → projects map
    const map = {};
    launchedProjects.forEach((p) => {
      const bId = p.business_id?.toString();
      if (!bId) return;

      if (!map[bId]) map[bId] = [];
      map[bId].push(p);
    });

    // Keep only businesses that have launched projects
    const validBusinesses = allBusinesses.filter(
      (b) => map[b._id.toString()]
    );

    setBusinesses(validBusinesses);
    setLaunchedProjectMap(map);

    // reset selections
    setAccessBusinessId("");
    setProjects([]);
    setSelectedProjectId("");
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
    setSelectedCollaboratorId("");
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

  return (
    <Container fluid className="p-4">
      <h2 className="fw-bold">{t("User_Management")}</h2>
      
      <Row className="mt-4 g-3">
        <Col md={3}><Card body><h5>{t("Total_Users")}</h5><h2>{users.length}</h2></Card></Col>
        <Col md={3}><Card body><h5>{t("users")}</h5><h2>{usersCount}</h2></Card></Col>
        <Col md={3}><Card body><h5>{t("Collaborators")}</h5><h2>{collaboratorsCount}</h2></Card></Col>
        <Col md={3}><Card body><h5>{t("Viewers")}</h5><h2>{viewersCount}</h2></Card></Col>
      </Row>
      <Row className="mt-4 g-2 align-items-center justify-content-between">

  <Col md={8}>
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
  </Col>

  {/* Actions */}
  <Col md="auto" className="d-flex gap-2 align-items-center">
    <Form.Select className="role-select" value={selectedRole} onChange={handleRoleChange}>
      <option>{t("All_Roles")}</option>
      <option>Org Admin</option>
      <option>Collaborator</option>
      <option>User</option>
      <option>Viewer</option>
    </Form.Select>

    <Button className="add-user-btn d-flex align-items-center" onClick={handleOpenModal}>
      <Plus size={16} className="me-2" />
      {t("Add_User")}
    </Button>

    {!isSuperAdmin && (
      <Button
        className="add-user-btn d-flex align-items-center"
        onClick={handleOpenAssignModal}
      >
        <User size={16} className="me-2" />
        {t("Collaborator")}
      </Button>   
    )}
    <Button
      className="add-user-btn d-flex align-items-center"
      onClick={() => {
        loadLaunchedBusinessAndProjects();
        setShowGiveAccessModal(true);
      }}
    >
      <ShieldCheck size={16} className="me-2" />
      Add Project Access
    </Button>


  </Col>
</Row>



      <Card className="mt-4">
        <Card.Body>
           <h5 className="fw-semibold mb-3">{t("All_Users")} ({users.length})</h5>
          
          <Table hover responsive className="align-middle">
            <thead className="table-heading" >
              <tr>
                <th>{t("User")}</th>
                {isSuperAdmin && <th>{t("Company")}</th>}
                <th>{t("Role")}</th>
                <th>{t("status")}</th>
                <th>{t("joined")}</th>
                <th>{t("Last_Active")}</th>
                {/* <th className="text-end">{t("Action")}</th> */}
              </tr>
            </thead>
            <tbody>
  {Array.isArray(filteredUsers) &&
     paginatedUsers.map((user, index) => {
      const uiRole = formatRole(user.role_name);              // FIXED
      const roleStyle = roleStyles[uiRole] || roleStyles["Viewer"];

      const statusValue = "Active";                           // Backend has no status
      const s = statusStyles[statusValue] || {
        bg: "#e5e7eb",
        color: "#374151"
      };

      return (
        <tr key={index}>
          {/* USER COLUMN */}
          <td className="d-flex align-items-center gap-2">
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
              {user.name?.[0] || "U"}
            </div>

            <div>
              <div className="fw-semibold">{user.name}</div>
              <small className="text-muted">{user.email}</small>
            </div>
          </td>
          {isSuperAdmin && <td>{user.company_name || "-"}</td>}
          {/* ROLE COLUMN */}
          <td>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {roleStyle.icon}
              <span style={{ color: roleStyle.color, fontWeight: 500 }}>
                {uiRole}
              </span>
            </span>
          </td>

          {/* STATUS COLUMN */}
          <td>
            <span className={`status-badge status-${statusValue.toLowerCase()}`}>
              {statusValue}
            </span>
          </td>
          <td className="text-muted">{formatDate(user.created_at)}</td>

          <td className="text-muted">-</td>

          {/* ACTION COLUMN */}
          <td className="text-end">
  <Dropdown>
    <Dropdown.Toggle as={CustomToggle} />

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
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t("Add_New_User")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddUser}>
  <Form.Group className="mb-3">
    <Form.Label> {t("user_name")}<span className="text-danger">*</span></Form.Label>
    <Form.Control
  type="text"
  placeholder={t("Enter_name")}
  value={newName}
  onChange={(e) => setNewName(e.target.value)}
  disabled={isSubmitting}
/>
{errors.name && <small className="text-danger">{errors.name}</small>}

  </Form.Group>

  <Form.Group className="mb-3">
    <Form.Label>{t("email")} <span className="text-danger">*</span></Form.Label>
    <Form.Control
      type="email"
      placeholder={t("Enter_email")}
      value={newEmail}
      onChange={(e) => setNewEmail(e.target.value)}
      disabled={isSubmitting}
    />
    {errors.email && (<small className="text-danger">{errors.email}</small>)}
  </Form.Group>

  <Form.Group className="mb-3">
    <Form.Label>{t("password")} <span className="text-danger">*</span></Form.Label>
    <Form.Control
      type="password"
      placeholder={t("Enter_password")}
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      disabled={isSubmitting}
    />
    {errors.password && (<small className="text-danger">{errors.password}</small>)}
  </Form.Group>
  {isSuperAdmin && (
  <Form.Group className="mb-3">
    <Form.Label>
      Companies <span className="text-danger">*</span>
    </Form.Label>

    <Form.Select
      value={selectedCompanyId}
      onChange={(e) => setSelectedCompanyId(e.target.value)}
      disabled={isSubmitting}
    >
      <option value="">Select Company</option>
      {companies.map((c) => (
        <option key={c._id} value={c._id}>
          {c.company_name || c.name}
        </option>
      ))}
    </Form.Select>
  </Form.Group>
)}


  <Form.Group className="mb-3">
    <Form.Label>{t("role")} <span className="text-danger">*</span></Form.Label>
    <Form.Select
      value={newRole}
      onChange={(e) => setNewRole(e.target.value)}
      disabled={isSubmitting}
    >
      <option value="">{t("Select_role")}</option>
      <option value="Collaborator">Collaborator</option>
      <option value="Viewer">Viewer</option>
      <option value="User">User</option>
    </Form.Select>
    <Form.Control.Feedback type="invalid">
      {errors.role}
    </Form.Control.Feedback>
  </Form.Group>

  <div className="d-flex justify-content-end">
    <Button variant="secondary" className="me-2" onClick={handleCloseModal} disabled={isSubmitting}>
      {t("cancel")}
    </Button> 

    <Button variant="primary" type="submit" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" />
          Adding...
        </>
      ) : (
        t("Add_User")
      )}
    </Button>
  </div>
</Form>

        </Modal.Body>
      </Modal>

      <Modal show={showAssignModal} onHide={handleCloseAssignModal} centered>
  <Modal.Header closeButton>
    <Modal.Title>{t("Assign_Collaborator")}</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <Form onSubmit={handleAssign}>

      <Form.Group className="mb-3">
        <Form.Label>{t("Collaborator")}</Form.Label>
        <Form.Select
          value={assignUserId}
          onChange={(e) => setAssignUserId(e.target.value)}
          required
        >
          <option value="">{t("Select_collaborator")}</option>
          {collaboratorUsers.map((u) => (
    <option key={u._id} value={u._id}>
      {u.name} 
    </option>
  ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>{t("business")}</Form.Label>
        <Form.Select
          value={assignBusinessId}
          onChange={(e) => setAssignBusinessId(e.target.value)}
          required
        >
          <option value="">{t("Select_Business")}</option>
          {businesses.map((b) => (
            <option key={b._id} value={b._id}>
              {b.business_name || b.name}
            </option>
          ))}
        </Form.Select>
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
>
  <Modal.Header closeButton>
    <Modal.Title> Add Project Access</Modal.Title>
  </Modal.Header>

 <Modal.Body>
  <Form onSubmit={(e) => e.preventDefault()}>

    {/* Business */}
    <Form.Group className="mb-3">
  <Form.Label>{t("Business")}</Form.Label>
  <Form.Select
    value={accessBusinessId}
    onChange={(e) => setAccessBusinessId(e.target.value)}
    required
  >
    <option value="">{t("Select_Business")}</option>
    {businesses.map((b) => (
      <option key={b._id} value={b._id}>
        {b.business_name || b.name}
      </option>
    ))}
  </Form.Select>
</Form.Group>


    {/* Project */}
    <Form.Group className="mb-3">
  <Form.Label>{t("Project")}</Form.Label>
  <Form.Select
    value={selectedProjectId}
    onChange={(e) => setSelectedProjectId(e.target.value)}
    disabled={!accessBusinessId || loadingProjects}
    required
  >
    <option value="">
      {loadingProjects ? "Loading projects..." : "Select Project"}
    </option>

    {projects.map((p) => (
      <option key={p._id} value={p._id}>
        {p.project_name}
      </option>
    ))}
  </Form.Select>
</Form.Group>


    {/* Collaborator */}
    <Form.Group className="mb-3">
  <Form.Label>{t("Collaborator")}</Form.Label>
  <Form.Select
    value={selectedCollaboratorId}
    onChange={(e) => setSelectedCollaboratorId(e.target.value)}
    disabled={!accessBusinessId || loadingCollaborators}
    required
  >
    <option value="">
      {loadingCollaborators ? "Loading collaborators..." : "Select Collaborator"}
    </option>

    {collaborators.map((c) => (
      <option key={c._id} value={c._id}>
        {c.name}
      </option>
    ))}
  </Form.Select>
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
  disabled={!accessBusinessId || !selectedProjectId || !selectedCollaboratorId}
  onClick={handleGiveProjectAccess}
>
  Give Access
</Button>

    </div>

  </Form>
</Modal.Body>


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
          Are you sure you want to change this user’s role?
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



    </Container>
  );
};

export default UserManagement;
