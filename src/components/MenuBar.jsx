import React, { useState, useEffect } from 'react';
import { Navbar, Container, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Settings, Home, User, Archive, FileText, Shield } from 'lucide-react';
import "../styles/menubar.css";
import { useTranslation } from '../hooks/useTranslation';

const MenuBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userRole, setUserRole] = useState('');
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const { t } = useTranslation();

  useEffect(() => {
    const isAdminStored = sessionStorage.getItem('isAdmin');
    const userNameStored = sessionStorage.getItem('userName');
    const userRoleStored = sessionStorage.getItem('userRole');

    setIsAdmin(isAdminStored === 'true');
    setUserName(userNameStored || 'User');
    setUserRole(userRoleStored || '');
    setIsSuperAdmin(userRoleStored === 'super_admin');
  }, []);
  
  const logout = async () => {
    try {
      const token = sessionStorage.getItem('token');

      if (token) {
        await fetch(`${REACT_APP_BACKEND_URL}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      sessionStorage.clear();
      navigate('/login');
    }
  };
  
  const handleLogout = () => {
    logout();
  };

  const isCurrentPage = (path) => location.pathname === path;

  const handleAdminClick = () => navigate('/super-admin');
  const handleDashboardClick = () => navigate('/dashboard');
  const handleSuperAdminClick = () => navigate('/super-admin');

  // Handler for audit trail navigation
  const handleAuditTrailClick = () => navigate('/audit-trail');

  return (
    <Navbar className="traxia-navbar p-0">
      <Container fluid className="px-3 py-2">
        <div className="d-flex align-items-center justify-content-between w-100">

          {/* Left side - Company Logo */}
          <div className="navbar-left">
            {/* {companyLogo && (
              <div
                className="company-logo"
                onClick={() => navigate('/dashboard')}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={companyLogo}
                  alt={companyName ? `${companyName} Logo` : t('company_logo_alt') || "Company Logo"}
                  style={{
                    height: '50px',
                    maxWidth: '100px',
                    marginLeft: '20px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )} */}
          </div>

          {/* Center - Traxxia Logo */}
          <div className="navbar-center">
            <Navbar.Brand
              className="traxia-logo"
              onClick={() => navigate('/dashboard')}
              style={{ cursor: 'pointer' }}
            >
              <img
                src="/traxxia-logo.png"
                alt={t('traxia_logo_alt') || "Traxia Logo"}
                style={{ height: '24px' }}
              />
            </Navbar.Brand>
          </div>

          {/* Right side - User Menu */}
          <div className="navbar-right">
            <Dropdown>
              <Dropdown.Toggle
                variant="link"
                id="dropdown-user"
                className="user-menu p-0 border-0 shadow-none"
              >
                <User size={20} className="navbar_icon" />
              </Dropdown.Toggle>
              <Dropdown.Menu align="end" className="traxia-dropdown">
                <Dropdown.Header className="text-muted small">
                  {t('signed_in_as')}: <strong>{userName}</strong>
                  {userRole && (
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {t('role')}: {userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  )}
                  {/* {companyName && (
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Company: {companyName}
                    </div>
                  )} */}
                </Dropdown.Header>
                <Dropdown.Divider />

                {/* Dashboard Link */}
                <Dropdown.Item
                  onClick={handleDashboardClick}
                  className={`dropdown-item-traxia ${isCurrentPage('/dashboard') ? 'active' : ''}`}
                >
                  <Home size={16} className="me-2" />
                  {t('dashboard')}
                </Dropdown.Item>

                {/* NEW: Super Admin Panel (only for super admin) */}
                {isSuperAdmin && (
                  <Dropdown.Item
                    onClick={handleSuperAdminClick}
                    className={`dropdown-item-traxia ${isCurrentPage('/super-admin') ? 'active' : ''}`}
                    style={{
                      background: isCurrentPage('/super-admin') ? '#fef3c7' : 'transparent',
                      color: isCurrentPage('/super-admin') ? '#92400e' : '#495057'
                    }}
                  >
                    <Shield size={16} className="me-2" style={{ color: '#f59e0b' }} />
                    {t('super_admin_panel')}
                  </Dropdown.Item>
                )}

                {/* Audit Trail / Saved Analyses Link */}
                {/* <Dropdown.Item
                  onClick={handleAuditTrailClick}
                  className={`dropdown-item-traxia ${
                    isCurrentPage('/audit-trail') || isCurrentPage('/saved-analyses') ? 'active' : ''
                  }`}
                >
                  <Archive size={16} className="me-2" />
                  {t('saved_analyses') || 'Saved Analyses'}
                </Dropdown.Item> */}

                {/* Admin Link (only for regular admins, not super admin) */}
                {isAdmin && !isSuperAdmin && (
                  <Dropdown.Item
                    onClick={handleAdminClick}
                    className={`dropdown-item-traxia ${isCurrentPage('/super-admin') ? 'active' : ''}`}
                  >
                    <Settings size={16} className="me-2" />
                    {t('admin')}
                  </Dropdown.Item>
                )}

                {/* Future: Reports Section (commented out, ready for future use) */}
                {/*
                <Dropdown.Item
                  className="dropdown-item-traxia text-muted"
                  disabled
                >
                  <FileText size={16} className="me-2" />
                  {t('reports') || 'Reports'} 
                  <small className="ms-auto text-muted">{t('coming_soon') || 'Soon'}</small>
                </Dropdown.Item>
                */}

                <Dropdown.Divider />

                {/* Logout */}
                <Dropdown.Item
                  onClick={handleLogout}
                  className="dropdown-item-traxia text-danger"
                >
                  <LogOut size={16} className="me-2" />
                  {t('logout')}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </Container>
    </Navbar>
  );
};

export default MenuBar;