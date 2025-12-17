import React, {useState,useEffect} from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Dropdown, Modal } from "react-bootstrap";
import { Crown, UserCog, User, ShieldCheck, MoreVertical,Search , Plus} from "lucide-react";
import "../styles/usermanagement.css";
import axios from "axios";
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
  const { t } = useTranslation();
  const [errors, setErrors] = useState({});


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


  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;


  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const handleOpenAssignModal = () => setShowAssignModal(true);
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setAssignUserId("");
    setAssignBusinessId("");
    
  };
  
  const validateForm = () => {
  const newErrors = {};

  if (!newName.trim() || newName.length < 3) {
    newErrors.name = "Name must be at least 3 characters.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!newEmail.trim() || !emailPattern.test(newEmail)) {
    newErrors.email = "Enter a valid email address.";
  }

  if (
  !newPassword ||
  newPassword.length < 8 ||
  !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)
) {
  newErrors.password =
    "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
}

  if (!newRole) {
    newErrors.role = "Role is required.";
  }

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};


 const handleAddUser = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return; 
  }
  
  const payload = {
    name: newName,
    email: newEmail,
    password: newPassword,
    role: newRole,
  };

  try {
    await axios.post(`${BACKEND_URL}/api/admin/users`, payload);

    alert("User added successfully!");

    // Refresh table immediately
    await fetchUsers();

    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("");

    handleCloseModal();

  } catch (error) {
    if (error.response?.status === 409) {
      onToast("User already exists!");
    } else {
      onToast("Failed to add user");
    }
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
    onToast("Failed to assign collaborator");
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

  // ---- HANDLERS ----
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    applyFilters(value, selectedRole);
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setSelectedRole(value);
    applyFilters(searchTerm, value);
  };

  const applyFilters = (search, role) => {
  const result = users.filter((user) => {
    const matchSearch =
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());

    const uiRole = formatRole(user.role_name || user.role); // FIXED

    const matchRole = role === "All Roles" || uiRole === role;

    return matchSearch && matchRole;
  });

  setFilteredUsers(result);
};

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
  return (
    <Container fluid className="p-4">
      <h2 className="fw-bold">{t("User_Management")}</h2>
      <p className="text-muted">{t("Add_and_manage_organization_collaborators_and_viewers")}</p>

      <Row className="mt-4 g-3">
        <Col md={3}><Card body><h5>{t("Total_Users")}</h5><h2>{users.length}</h2></Card></Col>
        <Col md={3}><Card body><h5>{t("Active_Users")}</h5><h2>4</h2></Card></Col>
        <Col md={3}><Card body><h5>{t("Collaborators")}</h5><h2>{collaboratorsCount}</h2></Card></Col>
        <Col md={3}><Card body><h5>{t("Pending_Invites")}</h5><h2>1</h2></Card></Col>
      </Row>
      <Row className="mt-4 g-2 align-items-center justify-content-between">

  <Col md={8}>
    <div className="search-input-wrapper">
      <Search size={18} className="search-icon" />
      <input
        type="text"
        className="search-input"
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={handleSearch}
      />
    </div>
  </Col>

  <Col md="auto" className="d-flex gap-2 align-items-center">
    <Form.Select className="role-select" value={selectedRole} onChange={handleRoleChange}>
      <option>{t("All_Roles")}</option>
      <option>Org Admin</option>
      <option>Collaborator</option>
      <option>Viewer</option>
    </Form.Select>

    <Button className="add-user-btn d-flex align-items-center" onClick={handleOpenModal}>
      <Plus size={16} className="me-2" />
      {t("Add_User")}
    </Button>

    <Button  className="add-user-btn d-flex align-items-center" onClick={handleOpenAssignModal}>
      <User size={16} className="me-2" />
      {t("Assign_User")}
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
                <th>Role{t("Role")}</th>
                <th>{t("status")}</th>
                <th>{t("joined")}</th>
                <th>{t("Last_Active")}</th>
                <th className="text-end">{t("Action")}</th>
              </tr>
            </thead>
            <tbody>
  {Array.isArray(filteredUsers) &&
    filteredUsers.map((user, index) => {
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
            <span
              style={{
                backgroundColor: s.bg,
                color: s.color,
                padding: "5px 12px",
                borderRadius: "16px",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
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
                <Dropdown.Item><UserCog /> Collaborator</Dropdown.Item>
                <Dropdown.Item><User /> Viewer</Dropdown.Item>
                <Dropdown.Item className="text-danger">Remove</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </td>
        </tr>
      );
    })}
</tbody>
          </Table>
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
      required
    />
    {errors.name && (<small className="text-danger">{errors.name}</small>)}
  </Form.Group>

  <Form.Group className="mb-3">
    <Form.Label>{t("email")} <span className="text-danger">*</span></Form.Label>
    <Form.Control
      type="email"
      placeholder={t("Enter_email")}
      value={newEmail}
      onChange={(e) => setNewEmail(e.target.value)}
      required
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
      required
    />
    {errors.password && (<small className="text-danger">{errors.password}</small>)}
  </Form.Group>

  <Form.Group className="mb-3">
    <Form.Label>{t("role")} <span className="text-danger">*</span></Form.Label>
    <Form.Select
      value={newRole}
      onChange={(e) => setNewRole(e.target.value)}
      required
    >
      <option value="">{t("Select_role")}</option>
      <option value="Collaborator">Collaborator</option>
      <option value="Viewer">Viewer</option>
    </Form.Select>
    <Form.Control.Feedback type="invalid">
      {errors.role}
    </Form.Control.Feedback>
  </Form.Group>

  <div className="d-flex justify-content-end">
    <Button variant="secondary" className="me-2" onClick={handleCloseModal}>
      {t("cancel")}
    </Button> 

    <Button variant="primary" type="submit">
      {t("Add_User")}
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
        <Form.Label>{t("user")}</Form.Label>
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

    </Container>
  );
};

export default UserManagement;
