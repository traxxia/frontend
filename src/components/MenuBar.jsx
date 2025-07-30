import React, { useState, useEffect } from 'react';
import { Navbar, Container, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Settings, Home, User, Archive, FileText, Shield } from 'lucide-react'; // Added Shield icon for Super Admin
import "../styles/menubar.css";
import { useTranslation } from '../hooks/useTranslation';

const MenuBar = ({ currentPage = "DASHBOARD" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userRole, setUserRole] = useState('');

  const { t } = useTranslation();

  useEffect(() => {
    const isAdminStored = sessionStorage.getItem('isAdmin');
    const userNameStored = sessionStorage.getItem('userName');
    const userRoleStored = sessionStorage.getItem('userRole');

    setIsAdmin(isAdminStored === 'true');
    setUserName(userNameStored || 'User');
    setUserRole(userRoleStored || '');
    
    // Check if user is super admin
    setIsSuperAdmin(userRoleStored === 'super_admin');
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const isCurrentPage = (path) => location.pathname === path;

  const handleAdminClick = () => navigate('/admin');
  const handleDashboardClick = () => navigate('/dashboard');
  const handleSuperAdminClick = () => navigate('/super-admin');
  
  // Handler for audit trail navigation
  const handleAuditTrailClick = () => navigate('/audit-trail');

  return (
    <Navbar className="traxia-navbar p-0">
      <Container fluid className="px-3 py-2">
        <div className="d-flex align-items-center justify-content-between w-100">
          
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

          <div className="navbar-right">
            <Dropdown>
              <Dropdown.Toggle
                variant="link"
                id="dropdown-user"
                className="user-menu p-0 border-0 shadow-none"
              >
                <User size={20} className="text-dark" />
              </Dropdown.Toggle>
              <Dropdown.Menu align="end" className="traxia-dropdown">
                <Dropdown.Header className="text-muted small">
                  {t('signed_in_as')} <strong>{userName}</strong>
                  {userRole && (
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Role: {userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  )}
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
                    {t('super_admin_panel') || 'Super Admin Panel'}
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
                    className={`dropdown-item-traxia ${isCurrentPage('/admin') ? 'active' : ''}`}
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
