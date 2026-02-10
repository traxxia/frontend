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

const SuperAdminPanel = ({ activeTab: propActiveTab }) => {
  const { t } = useTranslation();
  const [internalActiveTab, setInternalActiveTab] = useState("companies");
  const [showToast, setShowToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [userRole, setUserRole] = useState("");

  // Use the activeTab from props if provided, otherwise fallback to internal state
  const activeTab = propActiveTab || internalActiveTab;
  const setActiveTab = propActiveTab ? () => { } : setInternalActiveTab;

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

  const isSuperAdmin = userRole === "super_admin";

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

  useEffect(() => {
    if (activeTab === "questions" && !isSuperAdmin && !propActiveTab) {
      setInternalActiveTab("companies");
    }
  }, [activeTab, isSuperAdmin, propActiveTab]);

  return (
    <div className="super-admin-panel-v2">
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      <div className="admin-content-v2">{renderContent()}</div>
    </div>
  );
};

export default SuperAdminPanel;