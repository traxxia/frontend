import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  HelpCircle,
  Plus,
  Settings,
  ArrowLeft,
  Loader,
  CheckCircle,
  AlertCircle,
  History,
  Shield,
  Activity,
  CircleUserRound,
  Key,
} from "lucide-react";
import CompanyManagement from "./CompanyManagement";
import QuestionManagement from "./QuestionManagement";
import UserOverview from "./UserOverview";
import UserHistory from "./UserHistory";
import AuditTrail from "./AuditTrail";
import Usermanagement from "./Usermanagement";
import AccessManagement from "./AccessManagement";
import BusinessOverview from "./BusinessOverview";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/superadmin.css";

const SuperAdminPanel = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("companies");
  const [showToast, setShowToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const userRoleStored = sessionStorage.getItem("userRole");
    setUserRole(userRoleStored || "");
  }, []);

  const showToastMessage = (message, type = "success") => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleBack = () => {
    window.history.back();
  };

  const isSuperAdmin = userRole === "super_admin";

  const allTabs = [
    { id: "companies", label: isSuperAdmin ? t('companies') : t('company'), icon: Building2 },
    { id: "businesses", label: t('businesses') || "Businesses", icon: Building2 },
    { id: "user_management", label: t('user_management'), icon: CircleUserRound },
    {
      id: "access_management",
      label: t('access_management'),
      icon: Key,
      adminOnly: true
    },

    { id: "history", label: t('user_history'), icon: History },
    { id: "audit", label: t('audit_trail'), icon: Activity },
    {
      id: "questions",
      label: t('questions'),
      icon: HelpCircle,
      superAdminOnly: true,
    }
  ];

  const tabs = allTabs.filter((tab) => {
    if (tab.superAdminOnly && !isSuperAdmin) return false;

    if (tab.adminOnly && userRole !== 'company_admin') return false;

    return true;
  });

  const renderContent = () => {
    switch (activeTab) {
      case "companies":
        return <CompanyManagement onToast={showToastMessage} />;
      case "questions":
        return isSuperAdmin ? (
          <QuestionManagement onToast={showToastMessage} />
        ) : (
          <CompanyManagement onToast={showToastMessage} />
        );
      case "users":
        return <UserOverview onToast={showToastMessage} />;
      case "history":
        return <UserHistory onToast={showToastMessage} />;
      case "audit":
        return <AuditTrail onToast={showToastMessage} />;
      case "user_management":
        return <Usermanagement onToast={showToastMessage} />;
      case "access_management":
        return <AccessManagement onToast={showToastMessage} />;
      case "businesses":
        return <BusinessOverview onToast={showToastMessage} />;
      default:
        return <CompanyManagement onToast={showToastMessage} />;
    }
  };

  const panelTitle = isSuperAdmin ? t("super_admin_panel") : t("Admin_Panel");
  const HeaderIcon = isSuperAdmin ? Shield : Settings;

  useEffect(() => {
    if (activeTab === "questions" && !isSuperAdmin) {
      setActiveTab("companies");
    }
  }, [activeTab, isSuperAdmin]);

  return (
    <div className="super-admin-container">
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      <div className="admin-header">
        <div className="admin-header-content">
          <div className="header-left">
            {!isSuperAdmin && (
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="header-title">
              <HeaderIcon size={24} className="header-icon" />
              <h1>{panelTitle}</h1>
            </div>
          </div>
        </div>
      </div>

      <div
        className="admin-nav"
        style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          whiteSpace: "nowrap",
          scrollbarWidth: "thin",
        }}
      >
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="admin-content">{renderContent()}</div>
    </div>
  );
};

export default SuperAdminPanel;