import React, { useState, useEffect } from 'react';
import { Navbar, Container, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Settings, Home, User } from 'lucide-react';
import "../styles/menubar.css";
import { useTranslation } from '../hooks/useTranslation';  // <-- import your translation hook

const MenuBar = ({ currentPage = "DASHBOARD" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('User');

  const { t } = useTranslation();  // <-- use the translation function

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
                <Dropdown.Item
                  onClick={handleDashboardClick}
                  className={`dropdown-item-traxia ${isCurrentPage('/dashboard') ? 'active' : ''}`}
                >
                  <Home size={16} className="me-2" />
                  {t('dashboard')}
                </Dropdown.Item>
                {isAdmin && (
                  <Dropdown.Item
                    onClick={handleAdminClick}
                    className={`dropdown-item-traxia ${isCurrentPage('/admin') ? 'active' : ''}`}
                  >
                    <Settings size={16} className="me-2" />
                    {t('admin')}
                  </Dropdown.Item>
                )}
                <Dropdown.Divider />
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
