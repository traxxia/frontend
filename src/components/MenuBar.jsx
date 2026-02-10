import React, { useState, useEffect } from 'react';
import { Navbar, Container, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Settings, Home, User, Archive, FileText, Shield, BookOpen, Briefcase } from 'lucide-react';
import "../styles/menubar.css";
import { useTranslation } from '../hooks/useTranslation';
import { useBusiness } from '../context/BusinessContext';

const MenuBar = ({ selectedBusinessName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userRole, setUserRole] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const { t } = useTranslation();
  const { businesses, collaboratingBusinesses, selectedBusiness, selectBusiness, fetchBusinesses } = useBusiness();

  useEffect(() => {
    // Only fetch if not already loaded, though Provider handles its own fetch usually
    // but here we can ensure dashboard data is fresh if needed
    if (businesses.length === 0) {
      fetchBusinesses();
    }
  }, [fetchBusinesses, businesses.length]);

  const handleBusinessSelect = (business) => {
    selectBusiness(business);
    navigate('/businesspage', { state: { business } });
  };

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
  const isBusinessPage = location.pathname.startsWith('/business/') || location.pathname === '/businesspage';

  const handleAdminClick = () => navigate('/admin');
  const handleDashboardClick = () => navigate('/dashboard');
  const handleSuperAdminClick = () => navigate('/super-admin');
  const handleAcademyClick = () => navigate('/academy');

  // Debug logging
  useEffect(() => {
    console.log('MenuBar - selectedBusinessName:', selectedBusinessName);
    console.log('MenuBar - isBusinessPage:', isBusinessPage);
  }, [selectedBusinessName, isBusinessPage]);

  return (
    <Navbar className="traxia-navbar-horizontal p-0">
      <Container fluid className="px-3 py-2">
        <div className="horizontal-nav-container">
          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle d-md-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Navigation Links */}
          <div className={`nav-links-container ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {/* Dashboard Link */}
            {!isSuperAdmin && (
              <a
                onClick={handleDashboardClick}
                className={`nav-link-item ${isCurrentPage('/dashboard') ? 'active' : ''}`}
              >
                <Home size={18} />
                <span>{t('dashboard')}</span>
              </a>
            )}

            {/* Business Dropdown */}
            <Dropdown className="nav-dropdown-business">
              <Dropdown.Toggle as="a" className={`nav-link-item ${isBusinessPage ? 'active' : ''}`} id="business-dropdown">
                <Briefcase size={18} />
                <span>{isBusinessPage ? (selectedBusiness?.business_name || selectedBusinessName || t('select_business')) : t('select_business')}</span>
              </Dropdown.Toggle>

              <Dropdown.Menu className="business-dropdown-menu">
                {/* Business Group (No Projects) */}
                <Dropdown.Header className="dropdown-group-header">Business</Dropdown.Header>
                {businesses.filter(b => !b.has_projects).length > 0 ? (
                  businesses.filter(b => !b.has_projects).map(b => (
                    <Dropdown.Item
                      key={b._id}
                      onClick={() => handleBusinessSelect(b)}
                      className={selectedBusiness?._id === b._id ? 'active' : ''}
                    >
                      {b.business_name}
                    </Dropdown.Item>
                  ))
                ) : (
                  <Dropdown.Item disabled className="empty-group-text">No businesses yet</Dropdown.Item>
                )}

                <Dropdown.Divider />

                {/* Project Phase Group (With Projects) */}
                <Dropdown.Header className="dropdown-group-header">Project Phase</Dropdown.Header>
                {businesses.filter(b => b.has_projects).length > 0 ? (
                  businesses.filter(b => b.has_projects).map(b => (
                    <Dropdown.Item
                      key={b._id}
                      onClick={() => handleBusinessSelect(b)}
                      className={selectedBusiness?._id === b._id ? 'active' : ''}
                    >
                      {b.business_name}
                    </Dropdown.Item>
                  ))
                ) : (
                  <Dropdown.Item disabled className="empty-group-text">No projects in phase</Dropdown.Item>
                )}

                <Dropdown.Divider />

                {/* Collaborate Group */}
                <Dropdown.Header className="dropdown-group-header">Collaborate</Dropdown.Header>
                {collaboratingBusinesses.length > 0 ? (
                  collaboratingBusinesses.map(b => (
                    <Dropdown.Item
                      key={b._id}
                      onClick={() => handleBusinessSelect(b)}
                      className={selectedBusiness?._id === b._id ? 'active' : ''}
                    >
                      {b.business_name}
                    </Dropdown.Item>
                  ))
                ) : (
                  <Dropdown.Item disabled className="empty-group-text">No collaborating businesses</Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>

            {/* Super Admin Panel */}
            {isSuperAdmin && (
              <a
                onClick={handleSuperAdminClick}
                className={`nav-link-item ${isCurrentPage('/super-admin') ? 'active' : ''}`}
              >
                <Shield size={18} />
                <span>{t('super_admin_panel')}</span>
              </a>
            )}

            {/* Admin Link */}
            {isAdmin && !isSuperAdmin && (
              <a
                onClick={handleAdminClick}
                className={`nav-link-item ${isCurrentPage('/admin') ? 'active' : ''}`}
              >
                <Settings size={18} />
                <span>{t('admin')}</span>
              </a>
            )}

            {/* Academy Link */}
            <a
              onClick={handleAcademyClick}
              className={`nav-link-item ${isCurrentPage('/academy') || location.pathname.startsWith('/academy/') ? 'active' : ''}`}
            >
              <BookOpen size={18} />
              <span>Academy</span>
            </a>

            {/* User Info & Logout */}
            <div className="nav-user-section">
              <div className="nav-user-info">
                <div className="user-avatar">
                  <User size={20} />
                </div>
                <div className="user-details">
                  <span className="user-name">{userName}</span>
                  {userRole && (
                    <span className="user-role">{userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="nav-logout-btn"
                title={t('logout')}
              >
                <LogOut size={18} />
                <span className="d-md-none">{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </Container>
    </Navbar>
  );
};

export default MenuBar;