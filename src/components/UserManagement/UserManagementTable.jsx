import React from 'react';
import { Dropdown } from "react-bootstrap";
import { UserCog, User, ShieldCheck, MoreVertical } from "lucide-react";
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
  isAdmin 
}) => {
  const { t } = useTranslation();

  const formatRole = (role) => {
    const r = role?.toLowerCase();
    if (r === 'company_admin') return 'Org Admin';
    if (r === 'collaborator') return 'Collaborator';
    if (r === 'user') return 'User';
    return 'Viewer';
  };

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
        return <span className="role-badge">{t(uiRole)}</span>;
      }
    },
    {
      key: "status",
      label: t("Status"),
      render: (_, row) => (
        <span className={`status-badge ${row.status || 'active'}`}>
          {(row.status || 'active').toUpperCase()}
        </span>
      )
    },
    {
      key: "actions",
      label: t("Action"),
      render: (_, row) => {
        if (!isAdmin) return null;
        return (
          <Dropdown>
            <Dropdown.Toggle as={CustomToggle} />
            <Dropdown.Menu align="end">
              <Dropdown.Item onClick={() => onRoleUpdate(row._id, 'collaborator')}>
                <UserCog size={16} className="me-2" /> {t('Collaborator')}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => onRoleUpdate(row._id, 'viewer')}>
                <User size={16} className="me-2" /> {t('Viewer')}
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
      data={users} 
      loading={loading}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      title={t("User_Management")}
    />
  );
};

export default UserManagementTable;
