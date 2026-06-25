import React from "react";
import { Navbar, Container, Dropdown } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Settings, Home, User, Archive, FileText, Shield, BookOpen, Briefcase, Building, ScanSearch } from "lucide-react";
import "../styles/menubar.css";
import { useTranslation } from "../hooks/useTranslation";
import NotificationBell from "./NotificationBell";
import { useAuthStore } from "../store/authStore";
const MenuBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    t
  } = useTranslation();
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const isAdmin = useAuthStore(state => state.isAdmin);
  const isSuperAdmin = useAuthStore(state => state.isSuperAdmin());
  const isObservatory = useAuthStore(state => state.isObservatory);
  const userName = useAuthStore(state => state.userName || "User");
  const userRole = useAuthStore(state => state.userRole || "");
  const companyLogo = useAuthStore(state => state.companyLogo);
  const companyName = useAuthStore(state => state.companyName || "");
  const companyId = useAuthStore(state => state.companyId);
  const logout = useAuthStore(state => state.logout);
  const handleLogout = async () => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        await fetch(`${VITE_BACKEND_URL}/api/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      logout();
      window.location.href = "/login";
    }
  };
  const isCurrentPage = path => location.pathname === path;
  const handleAdminClick = () => navigate("/admin");
  const handleDashboardClick = () => navigate("/dashboard");
  const handleSuperAdminClick = () => navigate("/super-admin");
  const handleObservatoryClick = () => navigate("/super-admin/observatory");
  const handleAcademyClick = () => navigate("/academy");
  const handleAuditTrailClick = () => navigate("/audit-trail");
  const handleDecisionLogsClick = () => navigate("/decision-logs");
  return <Navbar className="traxia-navbar p-0" id="main-menu-bar">
    <Container fluid className="px-3 py-2">
      <div className="d-flex align-items-center justify-content-between w-100">
        { }
        <div className="navbar-left">
          {companyLogo && <div className="company-logo-container" onClick={() => navigate("/dashboard")}>
            <img src={companyLogo && companyLogo.startsWith("/") ? `${VITE_BACKEND_URL}${companyLogo}` : companyLogo} alt={companyName ? `${companyName} Logo` : t("company_logo_alt") || "Company Logo"} className="header-company-logo" onError={e => {
              e.target.style.display = "none";
            }} />
          </div>}
        </div>

        { }
        <div className="navbar-center">
          <Navbar.Brand className="traxia-logo notranslate" onClick={!isSuperAdmin ? () => navigate("/dashboard") : undefined} style={{
            cursor: isSuperAdmin ? "default" : "pointer"
          }}>
            <img src="/traxxia-logo.png" alt={t("traxia_logo_alt") || "Traxia Logo"} className="menu-bar--s1" />
          </Navbar.Brand>
        </div>

        { }
        <div className="navbar-right d-flex align-items-center menu-bar--s2">
          { }
          {isObservatory && <div onClick={handleObservatoryClick} style={{
            background: isCurrentPage("/super-admin/observatory") ? "#1e1b4b" : "transparent",
            color: isCurrentPage("/super-admin/observatory") ? "#a5b4fc" : "#495057"
          }} className="menu-bar--s3">
            <ScanSearch size={18} className="me-2" />
            AI Observatory
          </div>}

          {!isSuperAdmin && <NotificationBell />}

          <Dropdown>
            <Dropdown.Toggle variant="link" id="dropdown-user" className="user-menu p-0 border-0 shadow-none d-flex align-items-center justify-content-center">
              <div className="user-initial-avatar menu-bar--s5 notranslate">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" className="traxia-dropdown">
              <Dropdown.Header className="pt-3 pb-3 px-3 mb-2">
                <div className="d-flex flex-column gap-2">

                  { }
                  <div className="d-flex align-items-center">
                    <div className="d-flex align-items-center justify-content-center rounded me-3 menu-bar--s6">
                      <User size={16} className="menu-bar--s7" />
                    </div>
                    <div className="d-flex flex-column">
                      <span className="text-uppercase text-muted fw-bold menu-bar--s8 notranslate">{t("User Name")}</span>
                      <span className="fw-semibold text-secondary menu-bar--s9 notranslate">{userName}</span>
                    </div>
                  </div>

                  { }
                  {userRole && <div className="d-flex align-items-center">
                    <div className="d-flex align-items-center justify-content-center rounded me-3 menu-bar--s6">
                      <Briefcase size={16} className="menu-bar--s7" />
                    </div>
                    <div className="d-flex flex-column">
                      <span className="text-uppercase text-muted fw-bold menu-bar--s8 notranslate">{t("Role")}</span>
                      <span className="fw-semibold text-secondary menu-bar--s9">
                        {userRole.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>}

                  { }
                  {companyName && <div className="d-flex align-items-center">
                    <div className="d-flex align-items-center justify-content-center rounded me-3 menu-bar--s6">
                      <Building size={16} className="menu-bar--s7" />
                    </div>
                    <div className="d-flex flex-column">
                      <span className="text-uppercase text-muted fw-bold menu-bar--s8 notranslate">{t("Company")}</span>
                      <span className="fw-semibold text-secondary menu-bar--s9">{companyName}</span>
                    </div>
                  </div>}
                </div>
              </Dropdown.Header>
              <Dropdown.Divider />

              { }
              {!isSuperAdmin && <Dropdown.Item onClick={handleDashboardClick} className={`dropdown-item-traxia ${isCurrentPage("/dashboard") ? "active" : ""}`}>
                <Home size={16} className="me-2" />
                {t("dashboard")}
              </Dropdown.Item>}

              { }
              <Dropdown.Item onClick={handleAcademyClick} className={`dropdown-item-traxia ${isCurrentPage("/academy") || location.pathname.startsWith("/academy/") ? "active" : ""}`}>
                <BookOpen size={16} className="me-2" />
                {t("traxxia_academy")}
              </Dropdown.Item>

              { }
              {isSuperAdmin && <Dropdown.Item onClick={handleSuperAdminClick} className={`dropdown-item-traxia ${isCurrentPage("/super-admin") ? "active" : ""}`} style={{
                background: isCurrentPage("/super-admin") ? "#fef3c7" : "transparent",
                color: isCurrentPage("/super-admin") ? "#92400e" : "#495057"
              }}>
                <Shield size={16} className="me-2 menu-bar--s10" />
                {t("super_admin_panel")}
              </Dropdown.Item>}

              { }
              {isAdmin && !isSuperAdmin && <Dropdown.Item onClick={handleAdminClick} className={`dropdown-item-traxia ${isCurrentPage("/admin") ? "active" : ""}`}>
                <Settings size={16} className="me-2" />
                {t("admin")}
              </Dropdown.Item>}

              { }
              { }

              <Dropdown.Divider />

              { }
              <Dropdown.Item onClick={handleLogout} className="dropdown-item-traxia text-danger">
                <LogOut size={16} className="me-2" />
                {t("logout")}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </Container>
  </Navbar>;
};
export default MenuBar;
