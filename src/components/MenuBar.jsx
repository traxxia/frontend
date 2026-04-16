import React from "react";
import { Navbar, Container, Dropdown } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Settings,
  Home,
  User,
  Archive,
  FileText,
  Shield,
  BookOpen,
  Briefcase,
  Building,
} from "lucide-react";
import "../styles/menubar.css";
import { useTranslation } from "../hooks/useTranslation";
import NotificationBell from "./NotificationBell";
import { useAuthStore } from "../store/authStore";

const MenuBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Zustand auth store selectors
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin());
  const userName = useAuthStore((state) => state.userName || "User");
  const userRole = useAuthStore((state) => state.userRole || "");
  const companyLogo = useAuthStore((state) => state.companyLogo);
  const companyName = useAuthStore((state) => state.companyName || "");
  const companyId = useAuthStore((state) => state.companyId);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      const token = useAuthStore.getState().token;

      if (token) {
        await fetch(`${REACT_APP_BACKEND_URL}/api/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Clear the local state first
      logout();

      // Perform a full page reload to the login page to ensure all memory state is cleared
      window.location.href = "/login";
    }
  };

  const isCurrentPage = (path) => location.pathname === path;

  const handleAdminClick = () => navigate("/admin");
  const handleDashboardClick = () => navigate("/dashboard");
  const handleSuperAdminClick = () => navigate("/super-admin");
  const handleAcademyClick = () => navigate("/academy");

  // Handler for audit trail navigation
  const handleAuditTrailClick = () => navigate("/audit-trail");

  return (
    <Navbar className="traxia-navbar p-0" id="main-menu-bar">
      <Container fluid className="px-3 py-2">
        <div className="d-flex align-items-center justify-content-between w-100">
          {/* Left side - Company Logo */}
          <div className="navbar-left">
            {companyLogo && (
              <div
                className="company-logo-container"
                onClick={() => navigate("/dashboard")}
              >
                <img
                  src={
                    companyLogo && companyLogo.startsWith("/")
                      ? `${REACT_APP_BACKEND_URL}${companyLogo}`
                      : companyLogo
                  }
                  alt={
                    companyName
                      ? `${companyName} Logo`
                      : t("company_logo_alt") || "Company Logo"
                  }
                  className="header-company-logo"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Center - Traxxia Logo */}
          <div className="navbar-center">
            <Navbar.Brand
              className="traxia-logo"
              onClick={!isSuperAdmin ? () => navigate("/dashboard") : undefined}
              style={{ cursor: isSuperAdmin ? "default" : "pointer" }}
            >
              <img
                src="/traxxia-logo.png"
                alt={t("traxia_logo_alt") || "Traxia Logo"}
                style={{ height: "24px" }}
              />
            </Navbar.Brand>
          </div>

          {/* Right side - User Menu */}
          <div className="navbar-right d-flex align-items-center">
            {!isSuperAdmin && <NotificationBell />}

            <Dropdown>
              <Dropdown.Toggle
                variant="link"
                id="dropdown-user"
                className="user-menu p-0 border-0 shadow-none d-flex align-items-center justify-content-center"
              >
                <div
                  className="user-initial-avatar"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                    color: '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    border: '1px solid #a5b4fc',
                    cursor: 'pointer'
                  }}
                >
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end" className="traxia-dropdown">
                <Dropdown.Header className="text-muted small">
                  <User size={16} className="me-2" style={{ color: '#6366f1' }} /><strong>{userName}</strong>
                  {userRole && (
                    <div className="text-muted mt-1 d-flex align-items-center" style={{ fontSize: "0.75rem" }}>
                      <Briefcase size={14} className="me-2" style={{ color: '#6366f1' }} />
                      <span>{" "}
                        {userRole
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                    </div>
                  )}
                  {companyName && (
                    <div className="text-muted mt-1 d-flex align-items-center" style={{ fontSize: "0.75rem" }}>
                      <Building size={14} className="me-2" style={{ color: '#6366f1' }} />
                      <span> {companyName}</span>
                    </div>
                  )}
                </Dropdown.Header>
                <Dropdown.Divider />

                {/* Dashboard Link */}
                {!isSuperAdmin && (
                  <Dropdown.Item
                    onClick={handleDashboardClick}
                    className={`dropdown-item-traxia ${isCurrentPage("/dashboard") ? "active" : ""}`}
                  >
                    <Home size={16} className="me-2" />
                    {t("dashboard")}
                  </Dropdown.Item>
                )}

                {/* Traxxia Academy Link */}
                <Dropdown.Item
                  onClick={handleAcademyClick}
                  className={`dropdown-item-traxia ${isCurrentPage("/academy") || location.pathname.startsWith("/academy/") ? "active" : ""}`}
                >
                  <BookOpen size={16} className="me-2" />
                  {t("traxxia_academy")}
                </Dropdown.Item>

                {/* NEW: Super Admin Panel (only for super admin) */}
                {isSuperAdmin && (
                  <Dropdown.Item
                    onClick={handleSuperAdminClick}
                    className={`dropdown-item-traxia ${isCurrentPage("/super-admin") ? "active" : ""}`}
                    style={{
                      background: isCurrentPage("/super-admin")
                        ? "#fef3c7"
                        : "transparent",
                      color: isCurrentPage("/super-admin")
                        ? "#92400e"
                        : "#495057",
                    }}
                  >
                    <Shield
                      size={16}
                      className="me-2"
                      style={{ color: "#f59e0b" }}
                    />
                    {t("super_admin_panel")}
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
                    className={`dropdown-item-traxia ${isCurrentPage("/admin") ? "active" : ""}`}
                  >
                    <Settings size={16} className="me-2" />
                    {t("admin")}
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
                  {t("logout")}
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
