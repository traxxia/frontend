import React, { useState } from 'react';
import { Button, Row, Col } from "react-bootstrap";
import { Plus, UserCog, ShieldCheck } from "lucide-react";
import { useTranslation } from '../hooks/useTranslation';

// Sub-components
import UserManagementMetrics from '@/components/UserManagement/UserManagementMetrics';
import UserManagementTable from '@/components/UserManagement/UserManagementTable';

// Hooks
import { useUserManagement } from '@/components/UserManagement/hooks/useUserManagement';

import "../styles/usermanagement.css";

const UserManagement = ({ onToast }) => {
  const { t } = useTranslation();
  const {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    handleRoleUpdate,
    userRole
  } = useUserManagement();

  const isAdmin = ['admin', 'super_admin', 'company_admin'].includes(userRole);

  const onUpdateRole = async (userId, role) => {
    const result = await handleRoleUpdate(userId, role);
    if (result.success) {
      onToast(t("User_updated_successfully"), "success");
    } else {
      onToast(result.error, "error");
    }
  };

  return (
    <div className="usermanagement-container p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="section-title mb-0">{t('Team Management')}</h2>
      </div>

      <UserManagementMetrics users={users} currentRole={userRole} />

      <div className="admin-toolbar-row mb-3 d-flex justify-content-end gap-2">
        {isAdmin && (
          <>
            <Button className="admin-primary-btn">
              <Plus size={16} className="me-2" /> {t("Add_User")}
            </Button>
            <Button className="admin-secondary-btn">
              <UserCog size={16} className="me-2" /> {t("Assign_Business_Access")}
            </Button>
          </>
        )}
      </div>

      <UserManagementTable 
        users={users}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRoleUpdate={onUpdateRole}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default UserManagement;
