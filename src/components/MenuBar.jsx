import React, { useState, useEffect } from 'react';
import { Navbar, Container, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Settings, Home, User, Archive, FileText } from 'lucide-react'; // Added Archive and FileText icons
import "../styles/menubar.css";
import { useTranslation } from '../hooks/useTranslation';

const MenuBar = ({ currentPage = "DASHBOARD" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('User');

  const { t } = useTranslation();

  useEffect(() => {
    const isAdminStored = sessionStorage.getItem('isAdmin');
    const userNameStored = sessionStorage.getItem('userName');

    setIsAdmin(isAdminStored === 'true');
    setUserName(userNameStored || 'User');
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const isCurrentPage = (path) => location.pathname === path;

  const handleAdminClick = () => navigate('/admin');
  const handleDashboardClick = () => navigate('/dashboard');
  
  // NEW: Handler for audit trail navigation
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

                {/* NEW: Audit Trail / Saved Analyses Link */}
                {/* <Dropdown.Item
                  onClick={handleAuditTrailClick}
                  className={`dropdown-item-traxia ${
                    isCurrentPage('/audit-trail') || isCurrentPage('/saved-analyses') ? 'active' : ''
                  }`}
                >
                  <Archive size={16} className="me-2" />
                  {t('saved_analyses') || 'Saved Analyses'}
                </Dropdown.Item> */}

                {/* Admin Link (only for admins) */}
                {/* {isAdmin && (
                  <Dropdown.Item
                    onClick={handleAdminClick}
                    className={`dropdown-item-traxia ${isCurrentPage('/admin') ? 'active' : ''}`}
                  >
                    <Settings size={16} className="me-2" />
                    {t('admin')}
                  </Dropdown.Item>
                )} */}

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