import React from 'react';
import SuperAdminPanel from '../components/SuperAdminPanel';
import MenuBar from '../components/MenuBar';

const SuperAdminPage = () => {
  return (
    <div>
      <MenuBar currentPage="SUPER_ADMIN" />
      <SuperAdminPanel />
    </div>
  );
};

export default SuperAdminPage;