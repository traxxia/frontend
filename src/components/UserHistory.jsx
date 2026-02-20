import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Table, Badge, Spinner, Form, Button, Modal, Card } from "react-bootstrap";
import {
  Search,
  Loader,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Building2,
  User,
  X,
  FileText,
  Target,
  TrendingUp,
  History,
  Activity,
  Users
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import StrategicAnalysis from '../components/StrategicAnalysis';
import AnalysisContentManager from '../components/AnalysisContentManager';
import AdminTable from "./AdminTable";
import MetricCard from "./MetricCard";
import '../styles/UserHistory.css';
import '../styles/AdminTableStyles.css';
import { useTranslation } from '../hooks/useTranslation';

// Constants
const ITEMS_PER_PAGE = 10;
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Utility functions
const getAuthToken = () => sessionStorage.getItem('token');
const getUserInfo = () => JSON.parse(sessionStorage.getItem('user') || '{}');

const transformUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  created_at: user.created_at,
  role_name: user.role_name || 'user',
  company_name: user.company_name || 'No Company',
  activity_summary: { has_activity: true, total_answers: 0 }
});

// Main Component
const UserHistory = ({ onToast }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      const userInfo = getUserInfo();
      const storedRole = sessionStorage.getItem("userRole");
      setUserRole(storedRole || userInfo.role || '');

      const token = getAuthToken();
      try {
        const companiesResponse = await fetch(`${API_BASE_URL}/api/admin/companies`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (companiesResponse.ok) {
          const data = await companiesResponse.json();
          setCompanies(data.companies || []);
        }
        await loadUsers();
      } catch (err) {
        console.error(err);
      } finally {
        setIsInitialized(true);
      }
    };
    init();
  }, []);

  const loadUsers = async (companyId = '') => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      let url = `${API_BASE_URL}/api/admin/users`;
      if (companyId) url += `?company_id=${companyId}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const transformed = data.users.map(transformUser);
        setUsers(transformed);
        setFilteredUsers(transformed);
      }
    } catch (error) {
      onToast('Error loading users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized) loadUsers(selectedCompany);
  }, [selectedCompany, isInitialized]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    const filtered = users.filter(u =>
      u.name.toLowerCase().includes(value.toLowerCase()) ||
      u.email.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const loadUserHistory = async (userId, businessId = null) => {
    const cacheKey = businessId ? `${userId}_${businessId}` : userId;
    if (userDetails[cacheKey]) return;

    try {
      setIsLoadingDetails(true);
      const token = getAuthToken();
      let url = `${API_BASE_URL}/api/admin/user-data/${userId}`;
      if (businessId) url += `?business_id=${businessId}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(prev => ({ ...prev, [cacheKey]: data }));
      }
    } catch (error) {
      onToast('Error loading details', 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleUserSelect = async (userId) => {
    setSelectedUser(userId);
    await loadUserHistory(userId);
  };

  const formatRoleName = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case "company_admin": return "Org Admin";
      case "collaborator": return "Collaborator";
      case "user": return "User";
      case "viewer": return "Viewer";
      default: return roleName ? roleName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'User';
    }
  };

  const columns = [
    {
      key: 'user',
      label: t('user'),
      render: (_, row) => (
        <div>
          <div className="admin-cell-primary">{row.name}</div>
          <div className="admin-cell-secondary">{row.email}</div>
        </div>
      )
    },
    {
      key: 'role_name',
      label: t('role'),
      render: (val) => <span className="admin-status-badge active" style={{ fontSize: '0.72rem' }}>{formatRoleName(val)}</span>
    },
    {
      key: 'company',
      label: t('company'),
      render: (_, row) => <span className="admin-cell-secondary">{row.company_name}</span>
    },
    {
      key: 'joined',
      label: t('joined'),
      render: (_, row) => <span className="admin-cell-secondary">{formatDate(row.created_at)}</span>
    },
    {
      key: 'actions',
      label: t('actions'),
      render: (_, row) => (
        <>
          <Button variant="outline-primary" size="sm" onClick={() => handleUserSelect(row._id)} style={{ borderRadius: '8px', fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>
            {t('view_history')}
          </Button>
        </>
      )
    }
  ];

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="user-history-redesign">
      {/* ---- Toolbar ---- */}

      <AdminTable
        title={t('user_history_and_chat_records')}
        count={filteredUsers.length}
        countLabel={t('records')}
        columns={columns}
        data={paginatedUsers}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder={t('search_users')}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredUsers.length}
        itemsPerPage={ITEMS_PER_PAGE}
        loading={isLoading}
        toolbarContent={
          companies.length > 0 && userRole === 'super_admin' && (
            <Form.Select
              className="role-select"
              style={{ width: '220px' }}
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <option value="">{t('all_companies')}</option>
              {companies.map(c => (
                <option key={c._id} value={c._id}>{c.company_name}</option>
              ))}
            </Form.Select>
          )
        }
      />

      {selectedUser && (
        <UserDetailsModal
          user={users.find(u => u._id === selectedUser)}
          userDetails={userDetails}
          isLoading={isLoadingDetails}
          onClose={() => setSelectedUser(null)}
          onToast={onToast}
          loadUserHistory={loadUserHistory}
          t={t}
        />
      )}
    </div>
  );
};

// Sub-components (Modal and Panels) - Kept mostly same but styled for premium look
const UserDetailsModal = ({ user, userDetails, isLoading, onClose, onToast, loadUserHistory, t }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <Modal show={true} onHide={onClose} size="xl" centered className="user-history-modal">
      <Modal.Header closeButton className="border-0 px-4 pt-4">
        <Modal.Title className="fw-bold d-flex align-items-center gap-2">
          <History size={24} className="text-primary" />
          {t('user_history_details')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <UserDetailsPanel
          user={user}
          userDetails={userDetails}
          isLoading={isLoading}
          onClose={onClose}
          onToast={onToast}
          loadUserHistory={loadUserHistory}
          t={t}
        />
      </Modal.Body>
    </Modal>
  );
};

const UserDetailsPanel = ({ user, userDetails, isLoading, onClose, onToast, loadUserHistory, t }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const details = userDetails[user?._id] || {};

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5">
        <Loader size={48} className="spinner-border text-primary border-0" />
        <p className="mt-3 text-muted">{t('Loading_user_data...')}</p>
      </div>
    );
  }
  const getAnalysisProps = (systemAnalyses) => {
    const analysisProps = {};
    if (!systemAnalyses) return analysisProps;

    const mapping = {
      swot: 'swotAnalysisResult',
      profitabilityanalysis: 'profitabilityData',
      growthtracker: 'growthTrackerData',
      liquidityefficiency: 'liquidityEfficiencyData',
      investmentperformance: 'investmentPerformanceData',
      leveragerisk: 'leverageRiskData',
      productivitymetrics: 'productivityData',
      fullswot: 'fullSwotData',
      strategicradar: 'strategicRadarData',
      porters: 'portersData',
      pestel: 'pestelData',
      competitiveadvantage: 'competitiveAdvantageData',
      purchasecriteria: 'purchaseCriteriaData',
      loyaltynps: 'loyaltyNPSData',
      expandedcapability: 'expandedCapabilityData',
      maturityscore: 'maturityData',
      competitivelandscape: 'competitiveLandscapeData',
      coreadjacency: 'coreAdjacencyData'
    };

    systemAnalyses.forEach(analysis => {
      const type = analysis.normalized_type || analysis.analysis_type?.toLowerCase();
      if (mapping[type]) {
        analysisProps[mapping[type]] = analysis.analysis_result;
      }
    });

    return analysisProps;
  };

  return (
    <div className="user-details-panel">
      {/* Header Info */}
      <div className="panel-user-header px-4 py-3 bg-light border-bottom">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="user-avatar" style={{ width: '50px', height: '50px', background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h4 className="mb-0 fw-bold">{user?.name}</h4>
              <p className="mb-0 text-muted small">{user?.email} • {user?.company_name}</p>
            </div>
          </div>
          <div className="d-flex gap-2">
          </div>
        </div>
      </div>

      <div className="panel-content-layout">
        <div className="panel-main p-4 overflow-auto" style={{ flex: 1 }}>
          <div className="panel-tabs mb-4 border-bottom">
            <button className={`tab-link ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>{t('activity_summary')}</button>
            <button className={`tab-link ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>{t('chat_records')}</button>
            <button className={`tab-link ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>{t('strategic_analysis_tab')}</button>
          </div>

          <div className="tab-content">
            {activeTab === 'summary' && (
              <div className="summary-tab">
                <div className="row g-4">
                  <div className="col-md-4">
                    <Card className="border-0 shadow-sm rounded-4 p-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary"><FileText size={20} /></div>
                        <div><div className="text-muted small">{t('Total Questions')}</div><div className="h4 mb-0 fw-bold">{details.stats?.total_questions || 0}</div></div>
                      </div>
                    </Card>
                  </div>
                  <div className="col-md-4">
                    <Card className="border-0 shadow-sm rounded-4 p-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-success bg-opacity-10 p-2 rounded-3 text-success"><Target size={20} /></div>
                        <div><div className="text-muted small">{t('Completed')}</div><div className="h4 mb-0 fw-bold">{details.stats?.completed_questions || 0}</div></div>
                      </div>
                    </Card>
                  </div>
                  <div className="col-md-4">
                    <Card className="border-0 shadow-sm rounded-4 p-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-orange bg-opacity-10 p-2 rounded-3 text-orange"><TrendingUp size={20} /></div>
                        <div><div className="text-muted small">{t('completion_percentage')}</div><div className="h4 mb-0 fw-bold">{details.stats?.completion_percentage || 0}%</div></div>
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="mt-4">
                  <h5 className="fw-bold mb-3">{t('user_progress')}</h5>
                  <div className="progress rounded-pill" style={{ height: '10px' }}>
                    <div className="progress-bar bg-primary" style={{ width: `${details.stats?.completion_percentage || 0}%` }} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="chat-tab">
                {details.conversation?.length > 0 ? (
                  <div className="chat-phases d-flex flex-column gap-4">
                    {details.conversation.map((phase, idx) => (
                      <div key={idx} className="phase-card border rounded-4 overflow-hidden">
                        <div className="phase-header bg-light px-3 py-2 border-bottom d-flex justify-content-between">
                          <span className="fw-bold text-primary">{phase.phase}</span>
                          <span className="badge bg-secondary text-capitalize">{phase.severity}</span>
                        </div>
                        <div className="phase-body p-3">
                          {phase.questions?.map((qa, qIdx) => (
                            <div key={qIdx} className="qa-item mb-3 last-child-mb-0">
                              <div className="question-text fw-bold mb-1 text-dark" style={{ fontSize: '0.9rem' }}>{t('question_short')}: {qa.question}</div>
                              <div className="answer-text text-muted" style={{ fontSize: '0.85rem' }}>{t('answer')}: {qa.answer}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-5 text-muted border rounded-4">
                    <Activity size={48} className="mb-3 opacity-25" />
                    <p>{t('no_chat_records')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="analysis-tab">
                <AnalysisContentManager
                  {...getAnalysisProps(details.system)}
                  userDetails={details}
                  user={user}
                  businessData={{ name: user?.company_name || 'Business' }}
                  phaseManager={{ getUnlockedFeatures: () => ({ analysis: true, fullSwot: true, goodPhase: true }) }}
                  expandedCards={expandedCards}
                  collapsedCategories={collapsedCategories}
                  setExpandedCards={setExpandedCards}
                  setCollapsedCategories={setCollapsedCategories}
                  createSimpleRegenerationHandler={() => () => { }}
                  readOnly={true}
                  hideRegenerateButtons={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserHistory;