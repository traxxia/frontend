import React, {useState} from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Dropdown, Modal } from "react-bootstrap";
import { Crown, UserCog, User, ShieldCheck, MoreVertical,Search , Plus} from "lucide-react";
import "../styles/usermanagement.css";
const userData = [
  { name: "Sarah Johnson", email: "sarah@henrycorp.com", role: "Org Admin", status: "Active", joined: "Oct 15, 2025", lastActive: "Active now" },
  { name: "Michael Chen", email: "michael.c@henrycorp.com", role: "Collaborator", status: "Active", joined: "Oct 20, 2025", lastActive: "2 hours ago" },
  { name: "Emily Rodriguez", email: "emily.r@henrycorp.com", role: "Collaborator", status: "Active", joined: "Oct 18, 2025", lastActive: "1 day ago" },
  { name: "David Kim", email: "david.k@henrycorp.com", role: "Viewer", status: "Active", joined: "Oct 22, 2025", lastActive: "3 hours ago" }
];
const roleStyles = {
  "Org Admin": {
    color: "#a855f7",       // purple
    icon: <Crown size={16} color="#a855f7" />,
  },
  "Collaborator": {
    color: "#0284c7",       // blue
    icon: <UserCog size={16} color="#0284c7" />,
  },
  "Viewer": {
    color: "#64748b",       // gray
    icon: <User size={16} color="#64748b" />,
  },
  "Super Admin": {
    color: "#16a34a",       // green
    icon: <ShieldCheck size={16} color="#16a34a" />,
  },
};

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
const UserManagement = () => {
   const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [filteredUsers, setFilteredUsers] = useState(userData);
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);


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

  // ---- FILTER FUNCTION ----
  const applyFilters = (search, role) => {
    const result = userData.filter((user) => {
      const matchSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchRole = role === "All Roles" || user.role === role;

      return matchSearch && matchRole;
    });

    setFilteredUsers(result);
  };
  return (
    <Container fluid className="p-4">
      <h2 className="fw-bold">User Management</h2>
      <p className="text-muted">Add and manage organization collaborators and viewers</p>

      <Row className="mt-4 g-3">
        <Col md={3}><Card body><h5>Total Users</h5><h2>{userData.length}</h2></Card></Col>
        <Col md={3}><Card body><h5>Active Users</h5><h2>4</h2></Card></Col>
        <Col md={3}><Card body><h5>Collaborators</h5><h2>2</h2></Card></Col>
        <Col md={3}><Card body><h5>Pending Invites</h5><h2>1</h2></Card></Col>
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
      <option>All Roles</option>
      <option>Org Admin</option>
      <option>Collaborator</option>
      <option>Viewer</option>
    </Form.Select>

    <Button className="add-user-btn d-flex align-items-center" onClick={handleOpenModal}>
      <Plus size={16} className="me-2" />
      Add User
    </Button>
  </Col>

</Row>



      <Card className="mt-4">
        <Card.Body>
          <h5 className="fw-semibold mb-3">All Users ({userData.length})</h5>

          <Table hover responsive className="align-middle">
            <thead className="table-heading" >
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last Active</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {userData.map((user, index) => (
                <tr key={index}>
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
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="fw-semibold">{user.name}</div>
                      <small className="text-muted">{user.email}</small>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {roleStyles[user.role]?.icon}
                      <span style={{ color: roleStyles[user.role]?.color, fontWeight: 500 }}>
                        {user.role}
                      </span>
                    </span>
                  </td>
                  <td>
                  <span
                    style={{
                      backgroundColor: statusStyles[user.status].bg,
                      color: statusStyles[user.status].color,
                      padding: "5px 12px",
                      borderRadius: "16px",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {user.status}
                  </span>
                </td>

                  <td className="text-muted">{user.joined}</td>
                  <td className="text-muted">{user.lastActive}</td>
                  <td className="text-end">
                  <Dropdown>
                    <Dropdown.Toggle as={CustomToggle} />

                    <Dropdown.Menu
                        align="end"
                        flip={true}
                        renderOnMount
                        autoFocus={false}
                        popperConfig={{
                          strategy: "fixed",
                          modifiers: [
                            {
                              name: "preventOverflow",
                              options: {
                                boundary: "viewport",
                                padding: 10,
                              },
                            },
                            {
                              name: "flip",
                              options: {
                                fallbackPlacements: ["left", "top", "bottom", "right"],
                              },
                            },
                          ],
                        }}
                        style={{ maxHeight: "200px", overflowY: "auto" }}
                      >

                      <Dropdown.Item>
                        <span className="crown-purple"><Crown /> Org admin</span>
                      </Dropdown.Item>
                      <Dropdown.Item>
                        <span className="cog-bule"><UserCog /> Collaborator</span>
                      </Dropdown.Item>
                      <Dropdown.Item>
                        <span className="user-sandel"><User /> Viewer</span>
                      </Dropdown.Item>
                      <Dropdown.Item className="text-danger">Remove</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </td>

                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formUserName">
              <Form.Label>User Name</Form.Label>
              <Form.Control type="text" placeholder="Enter name" />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formUserEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control type="email" placeholder="Enter email" />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formUserRole">
              <Form.Label>Role</Form.Label>
              <Form.Select>
                <option>Org Admin</option>
                <option>Collaborator</option>
                <option>Viewer</option>
              </Form.Select>
            </Form.Group>
            <Button variant="secondary" className="me-2" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add User
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default UserManagement;
