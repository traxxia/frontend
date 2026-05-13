import React, { useState, useMemo } from 'react';
import { Dropdown, Form } from "react-bootstrap";
import { UserCog, User, ShieldCheck, MoreVertical, Crown } from "lucide-react";
import AdminTable from "../AdminTable";
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/dateUtils';

const CustomToggle = React.forwardRef(({ onClick, disabled }, ref) => (
  <span 
    ref={ref} 
    onClick={(e) => { if (!disabled) { e.preventDefault(); onClick(e); } }} 
    className={`action-btn ${disabled ? "disabled" : ""}`}
    style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
  >
    <MoreVertical size={20} />
  </span>
));

const UserManagementTable = ({ 
  users, 
  loading, 
  searchTerm, 
  onSearchChange, 
  onRoleUpdate,
  isAdmin,
  selectedRoleFilter = "All Roles",
  onRoleFilterChange
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatRole = (role) => {
    const r = role?.toLowerCase();
    if (r === 'company_admin' || r === 'super_admin') return 'Org Admin';
    if (r === 'collaborator') return 'Collaborator';
    if (r === 'user') return 'User';
    return 'Viewer';
  };

  const roleStyles = {
    "Org Admin": { icon: <Crown size={14} color="#7c3aed" />, color: "#7c3aed" },
    Collaborator: { icon: <UserCog size={14} color="#0284c7" />, color: "#0284c7" },
    Viewer: { icon: <User size={14} color="#ca8a04" />, color: "#ca8a04" },
    User: { icon: <ShieldCheck size={14} color="#16a34a" />, color: "#16a34a" },
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.company_name?.toLowerCase().includes(search) ||
        formatRole(user.role_name || user.role).toLowerCase().includes(search) ||
        user.status?.toLowerCase().includes(search);

      const uiRole = formatRole(user.role_name || user.role);
      const matchRole = selectedRoleFilter === "All Roles" || uiRole === selectedRoleFilter;

      return matchSearch && matchRole;
    });
  }, [users, searchTerm, selectedRoleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        render: (val) => <span className="admin-cell-secondary">{val ? formatDate(val) : '-'}</span>
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
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 500,
            color: statusColor,
            backgroundColor: statusBg,
            border:"1px solid",
            display: "inline-block"
          }}>
            {label}
          </span>
        );
      }
    },
    {
      key: "actions",
      label: t("Action"),
      render: (_, row) => {
        if (!isAdmin) return null;
        const roleName = (row.role_name || row.role)?.toLowerCase();
        if (roleName === "company_admin" || roleName === "super_admin") return null;

        return (
          <Dropdown>
            <Dropdown.Toggle as={CustomToggle} />
            <Dropdown.Menu align="end">
              <Dropdown.Item onClick={() => onRoleUpdate(row._id, 'collaborator', row.name)}>
                <UserCog size={16} className="me-2" /> {t('Collaborator')}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => onRoleUpdate(row._id, 'viewer', row.name)}>
                <User size={16} className="me-2" /> {t('Viewer')}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => onRoleUpdate(row._id, 'user', row.name)}>
                <ShieldCheck size={16} className="me-2" /> {t('User')}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        );
      }
    }
  ];

  return (
    <AdminTable 
      columns={columns} 
      data={paginatedUsers} 
      loading={loading}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      title={t("User_Management")}
      count={filteredUsers.length}
      countLabel={filteredUsers.length === 1 ? t("User") : t("Users")}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      totalItems={filteredUsers.length}
      itemsPerPage={itemsPerPage}
      toolbarContent={
        <Form.Select
          className="role-select"
          style={{ width: '210px' }}
          value={selectedRoleFilter}
          onChange={(e) => {
              onRoleFilterChange(e.target.value);
              setCurrentPage(1);
          }}
        >
          <option value="All Roles">{t("All_Roles")}</option>
          <option value="Org Admin">{t("Org_Admin")}</option>
          <option value="Collaborator">{t("Collaborator")}</option>
          <option value="User">{t("User")}</option>
          <option value="Viewer">{t("Viewer")}</option>
        </Form.Select>
      }
    />
  );
};

export default UserManagementTable;
