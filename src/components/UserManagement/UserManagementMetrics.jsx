import React from 'react';
import { Crown, UserCog, User, ShieldCheck } from "lucide-react";
import MetricCard from '../MetricCard';
import { useTranslation } from '../../hooks/useTranslation';

const UserManagementMetrics = ({ users, currentRole }) => {
  const { t } = useTranslation();

  const formatRole = (role) => {
    const r = role?.toLowerCase();
    if (r === 'company_admin') return 'Org Admin';
    if (r === 'collaborator') return 'Collaborator';
    if (r === 'user') return 'User';
    return 'Viewer';
  };

  const activeUsers = users.filter(u => u.status !== 'inactive' && u.status !== 'deleted');
  
  const counts = {
    orgAdmin: activeUsers.filter(u => formatRole(u.role_name || u.role) === "Org Admin").length,
    collaborator: activeUsers.filter(u => formatRole(u.role_name || u.role) === "Collaborator").length,
    user: activeUsers.filter(u => formatRole(u.role_name || u.role) === "User").length,
    viewer: activeUsers.filter(u => formatRole(u.role_name || u.role) === "Viewer").length,
  };

  return (
    <div className="admin-metrics-grid mb-4">
      {currentRole !== "company_admin" && (
        <MetricCard label={t("org_admins")} value={counts.orgAdmin} icon={Crown} iconColor="purple" />
      )}
      <MetricCard label={t("Collaborators")} value={counts.collaborator} icon={UserCog} iconColor="green" />
      <MetricCard label={t("Users")} value={counts.user} icon={ShieldCheck} iconColor="cyan" />
      <MetricCard label={t("Viewers")} value={counts.viewer} icon={User} iconColor="orange" />
    </div>
  );
};

export default UserManagementMetrics;
