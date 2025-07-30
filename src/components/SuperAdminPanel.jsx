import React, { useState, useEffect } from 'react';
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
  History
} from 'lucide-react';
import CompanyManagement from './CompanyManagement';
import QuestionManagement from './QuestionManagement';
import UserOverview from './UserOverview';
import UserHistory from './UserHistory';
import '../styles/superadmin.css';

const SuperAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('companies');
  const [systemStats, setSystemStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const getAuthToken = () => sessionStorage.getItem('token');

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/super-admin/system-overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSystemStats(data);
      } else {
        showToastMessage('Failed to load system stats', 'error');
      }
    } catch (error) {
      console.error('Error loading system stats:', error);
      showToastMessage('Error loading system stats', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const handleBack = () => {
    window.history.back();
  };

  const tabs = [
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'questions', label: 'Questions', icon: HelpCircle },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'history', label: 'User History', icon: History }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'companies':
        return <CompanyManagement onToast={showToastMessage} />;
      case 'questions':
        return <QuestionManagement onToast={showToastMessage} />;
      case 'users':
        return <UserOverview onToast={showToastMessage} />;
      case 'history':
        return <UserHistory onToast={showToastMessage} />;
      default:
        return <CompanyManagement onToast={showToastMessage} />;
    }
  };

  return (
    <div className="super-admin-container">
      {showToast.show && (
        <div className={`simple-toast ${showToast.type}`}>
          {showToast.message}
        </div>
      )}

      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={18} />
          </button>
          <div className="header-title">
            <Settings size={24} className="header-icon" />
            <h1>Super Admin Panel</h1>
          </div>
          <div className="header-stats">
            {systemStats && (
              <>
                <div className="stat-item">
                  <span className="stat-value">{systemStats.system_statistics.companies.total}</span>
                  <span className="stat-label">Companies</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{systemStats.system_statistics.users.total}</span>
                  <span className="stat-label">Total Users</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-nav">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="admin-content">
        {isLoading ? (
          <div className="loading-container">
            <Loader size={24} className="spinner" />
            <span>Loading system data...</span>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default SuperAdminPanel;