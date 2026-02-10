import React, { useState, useEffect } from 'react';
import SuperAdminPanel from '../components/SuperAdminPanel';
import MenuBar from '../components/MenuBar';
import SuperAdminNavigation from '../components/SuperAdminNavigation';
import '../styles/superadmin.css';

const SuperAdminPage = () => {
  const [activeTab, setActiveTab] = useState('companies');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    setUserRole(role || '');
  }, []);

  return (
    <div className="super-admin-page-container">
      {/* Top Header */}
      <div className="admin-page-header">
        <div className="admin-header-left">
          <img src="/traxxia-logo.png" alt="Traxxia" className="dashboard-logo" />
        </div>
        <div className="admin-header-right">
          <MenuBar currentPage="SUPER_ADMIN" />
        </div>
      </div>

      <div className="admin-page-layout">
        <SuperAdminNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={userRole}
        />

        <main className="admin-main-content">
          <SuperAdminPanel activeTab={activeTab} />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminPage;