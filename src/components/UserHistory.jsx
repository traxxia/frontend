import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
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
  TrendingUp
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import StrategicAnalysis from '../components/StrategicAnalysis';
import AnalysisContentManager from '../components/AnalysisContentManager';
import HistoryPDFDownload from './HistoryPDFDownload';
import DownloadStrategicPDF from './DownloadStrategicPDF';
import Pagination from '../components/Pagination';
import '../styles/UserHistory.css';
import { useTranslation } from '../hooks/useTranslation';

// Constants
const ITEMS_PER_PAGE = 10;
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Utility functions
const getAuthToken = () => sessionStorage.getItem('token');
const getUserInfo = () => JSON.parse(sessionStorage.getItem('user') || '{}');

const formatRoleName = (roleName) => {
  return roleName.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const transformUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  created_at: user.created_at,
  role: { role_name: user.role_name || 'user' },
  company: { company_name: user.company_name || 'No Company' },
  activity_summary: { has_activity: true, total_answers: 0 }
});

// Custom hooks
const useUserData = (onToast) => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  const loadUsers = useCallback(async (companyId = '') => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      let url = `${API_BASE_URL}/api/admin/users`;
      if (companyId) {
        url += `?company_id=${companyId}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const transformedUsers = data.users.map(transformUser);
        setUsers(transformedUsers);
      } else {
        onToast('Failed to load users', 'error');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      onToast('Error loading users', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [userRole, onToast]);

  const loadInitialData = async () => {
    try {
      const userInfo = getUserInfo();
      setUserRole(userInfo.role || '');

      const token = getAuthToken();
      const companiesResponse = await fetch(`${API_BASE_URL}/api/admin/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData.companies || []);
      }

      await loadUsers();
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      onToast('Error loading data', 'error');
      setIsInitialized(true);
    }
  };

  return {
    users,
    companies,
    isLoading,
    userRole,
    isInitialized,
    loadUsers,
    loadInitialData
  };
};

const useUserDetails = (onToast) => {
  const [userDetails, setUserDetails] = useState({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const loadUserHistory = async (userId, businessId = null) => {
    const cacheKey = businessId ? `${userId}_${businessId}` : userId;
    if (userDetails[cacheKey]) return;

    try {
      setIsLoadingDetails(true);
      const token = getAuthToken();

      let url = `${API_BASE_URL}/api/admin/user-data/${userId}`;
      if (businessId) url += `?business_id=${businessId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const transformedData = {
          conversation: data.conversation || [],
          system: data.system || [],
          businesses: data.businesses || [],
          stats: {
            total_questions: data.stats?.total_questions || 0,
            completed_questions: data.stats?.completed_questions || 0,
            completion_percentage: data.stats?.completion_percentage || 0
          },
          user_info: data.user_info
        };

        setUserDetails(prev => ({ ...prev, [cacheKey]: transformedData }));
      } else {
        const errorData = await response.json();
        onToast(errorData.error || 'Failed to load user history', 'error');
      }
    } catch (error) {
      console.error('Error loading user history:', error);
      onToast('Error loading user history', 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return { userDetails, isLoadingDetails, loadUserHistory };
};

// Sorting and filtering utilities
const useSortedFilteredUsers = (users, searchTerm) => {
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return user.name.toLowerCase().startsWith(searchLower) 
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const { key, direction } = sortConfig;

    if (key === 'name') {
      return direction === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }

    if (key === 'created_at') {
      const comparison = new Date(b.created_at) - new Date(a.created_at);
      return direction === 'asc' ? -comparison : comparison;
    }

    if (key === 'activity') {
      const aActivity = a.activity_summary?.total_answers || 0;
      const bActivity = b.activity_summary?.total_answers || 0;
      return direction === 'asc' ? aActivity - bActivity : bActivity - aActivity;
    }

    return 0;
  });

  const requestSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  return { sortedUsers, sortConfig, requestSort };
};

const parseAnalysisData = (userDetails, user) => {
  if (!userDetails) return null;

  const analysisData = {
    // Initial Phase Components
    swot: null,
    purchaseCriteria: null,
    channelHeatmap: null,
    loyaltyNPS: null,
    capabilityHeatmap: null,
    porters: null,
    pestel: null,
    strategic: null,

    // Essential Phase Components
    fullSwot: null,
    customerSegmentation: null,
    competitiveAdvantage: null,
    channelEffectiveness: null,
    expandedCapability: null,
    strategicGoals: null,
    strategicRadar: null,
    cultureProfile: null,
    productivityMetrics: null,
    maturityScore: null,

    // Good Phase Components - Financial analyses
    costEfficiency: null,
    financialPerformance: null,
    financialBalance: null,
    operationalEfficiency: null,
    profitabilityData: null,
    growthTrackerData: null,
    liquidityEfficiencyData: null,
    investmentPerformanceData: null,
    leverageRiskData: null,

    businessName: user?.name || 'Business',
    userAnswers: {},
    questions: []
  };

  // Process conversation data
  if (userDetails.conversation?.length > 0) {
    userDetails.conversation.forEach(phase => {
      phase.questions?.forEach(qa => {
        const questionId = qa.question || `q_${Math.random()}`;
        analysisData.questions.push({
          _id: questionId,
          question_id: questionId,
          question_text: qa.question,
          phase: phase.phase,
          severity: phase.severity
        });
        analysisData.userAnswers[questionId] = qa.answer;
      });
    });
  }

  // Process ALL analysis types from system data - SIMPLIFIED LOGIC
  userDetails.system?.forEach(result => {
    try {
      const analysisResult = typeof result.analysis_result === 'string'
        ? JSON.parse(result.analysis_result)
        : result.analysis_result;

      const analysisType = result.analysis_type?.toLowerCase() ||
        result.name?.toLowerCase() ||
        result.normalized_type?.toLowerCase() || '';

      // Enhanced analysis type mapping - Same as AnalysisContentManager
      switch (analysisType) {
        // Initial Phase Analysis Types
        case 'swot':
          analysisData.swot = analysisResult;
          break;
        case 'purchasecriteria':
        case 'purchase_criteria':
          analysisData.purchaseCriteria = analysisResult;
          break;
        case 'channelheatmap':
        case 'channel_heatmap':
          analysisData.channelHeatmap = analysisResult;
          break;
        case 'loyaltynps':
        case 'loyalty_nps':
        case 'loyalty_metrics':
          analysisData.loyaltyNPS = analysisResult;
          break;
        case 'capabilityheatmap':
        case 'capability_heatmap':
          analysisData.capabilityHeatmap = analysisResult;
          break;
        case 'porters':
        case 'porter_analysis':
        case 'porters_five_forces':
          analysisData.porters = analysisResult;
          break;
        case 'pestel':
        case 'pestel_analysis':
          analysisData.pestel = analysisResult;
          break;
        case 'strategic':
        case 'strategic_analysis':
          analysisData.strategic = analysisResult;
          break;

        // Essential Phase Analysis Types
        case 'fullswot':
        case 'full_swot':
        case 'full_swot_portfolio':
          analysisData.fullSwot = analysisResult;
          break;
        case 'customersegmentation':
        case 'customer_segmentation':
          analysisData.customerSegmentation = analysisResult;
          break;
        case 'competitiveadvantage':
        case 'competitive_advantage':
        case 'competitive_advantage_matrix':
          analysisData.competitiveAdvantage = analysisResult;
          break;
        case 'channeleffectiveness':
        case 'channel_effectiveness':
        case 'channel_effectiveness_map':
          analysisData.channelEffectiveness = analysisResult;
          break;
        case 'expandedcapability':
        case 'expanded_capability':
        case 'expanded_capability_heatmap':
          analysisData.expandedCapability = analysisResult;
          break;
        case 'strategicgoals':
        case 'strategic_goals':
          analysisData.strategicGoals = analysisResult;
          break;
        case 'strategicradar':
        case 'strategic_radar':
        case 'strategic_positioning_radar':
          analysisData.strategicRadar = analysisResult;
          break;
        case 'cultureprofile':
        case 'culture_profile':
        case 'organizational_culture_profile':
          analysisData.cultureProfile = analysisResult;
          break;
        case 'productivitymetrics':
        case 'productivity_metrics':
          analysisData.productivityMetrics = analysisResult;
          break;
        case 'maturityscore':
        case 'maturity_score':
        case 'maturity_scoring':
          analysisData.maturityScore = analysisResult;
          break;

        case 'competitivelandscape':
        case 'competitive landscape':
          analysisData.competitiveLandscapeData = analysisResult;
          break;

        case 'coreadjacency':
        case 'core adjacency':
          analysisData.coreAdjacencyData = analysisResult;
          break;

        case 'profitabilityanalysis':
        case 'profitability_analysis':
        case 'profitability':
          analysisData.profitabilityData = analysisResult;
          break;


        // Financial Analysis Types - SIMPLIFIED: Just check if data exists
        case 'profitabilityanalysis':
        case 'profitability_analysis':
        case 'profitability':
          analysisData.profitabilityData = analysisResult;
          console.log('✓ Profitability Analysis loaded:', !!analysisResult);
          break;
        case 'growthtracker':
        case 'growth_tracker':
        case 'growth':
          analysisData.growthTrackerData = analysisResult;
          console.log('✓ Growth Tracker loaded:', !!analysisResult);
          break;
        case 'liquidityefficiency':
        case 'liquidity_efficiency':
        case 'liquidity':
          analysisData.liquidityEfficiencyData = analysisResult;
          console.log('✓ Liquidity Efficiency loaded:', !!analysisResult);
          break;
        case 'investmentperformance':
        case 'investment_performance':
        case 'investment':
          analysisData.investmentPerformanceData = analysisResult;
          console.log('✓ Investment Performance loaded:', !!analysisResult);
          break;
        case 'leveragerisk':
        case 'leverage_risk':
        case 'leverage':
          analysisData.leverageRiskData = analysisResult;
          console.log('✓ Leverage Risk loaded:', !!analysisResult);
          break;
        case 'costefficiency':
        case 'cost_efficiency':
          analysisData.costEfficiency = analysisResult;
          console.log('✓ Cost Efficiency loaded:', !!analysisResult);
          break;
        case 'financialperformance':
        case 'financial_performance':
          analysisData.financialPerformance = analysisResult;
          console.log('✓ Financial Performance loaded:', !!analysisResult);
          break;
        case 'financialbalance':
        case 'financial_balance':
        case 'financial_health':
          analysisData.financialBalance = analysisResult;
          console.log('✓ Financial Balance loaded:', !!analysisResult);
          break;
        case 'operationalefficiency':
        case 'operational_efficiency':
          analysisData.operationalEfficiency = analysisResult;
          console.log('✓ Operational Efficiency loaded:', !!analysisResult);
          break;

        default:
          // Fallback detection for financial analyses based on is_financial_analysis flag
          if (result.is_financial_analysis) {
            console.log('Processing fallback financial analysis:', analysisType);

            if (analysisType.includes('profitab')) {
              analysisData.profitabilityData = analysisResult;
            } else if (analysisType.includes('growth')) {
              analysisData.growthTrackerData = analysisResult;
            } else if (analysisType.includes('liquidity')) {
              analysisData.liquidityEfficiencyData = analysisResult;
            } else if (analysisType.includes('investment')) {
              analysisData.investmentPerformanceData = analysisResult;
            } else if (analysisType.includes('leverage')) {
              analysisData.leverageRiskData = analysisResult;
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing analysis result:', error, result);
    }
  });

  // Enhanced logging for debugging
  const financialAnalysesFound = [
    analysisData.profitabilityData ? 'profitability' : null,
    analysisData.growthTrackerData ? 'growth' : null,
    analysisData.liquidityEfficiencyData ? 'liquidity' : null,
    analysisData.investmentPerformanceData ? 'investment' : null,
    analysisData.leverageRiskData ? 'leverage' : null
  ].filter(Boolean);

  console.log('Final Analysis Data Summary:', {
    totalAnalyses: userDetails.system?.length || 0,
    financialAnalysesFound: financialAnalysesFound.length,
    financialTypes: financialAnalysesFound,
    hasDocument: userDetails?.document_info?.has_document || false,
    documentExists: userDetails?.document_info?.file_exists || false
  });

  return analysisData;
};

// Check if analysis data exists
const hasAnalysisData = (analysisData) => {
  if (!analysisData) return false;

  // Check if any analysis exists
  return !!(
    analysisData.swot || analysisData.purchaseCriteria ||
    analysisData.channelHeatmap || analysisData.loyaltyNPS ||
    analysisData.capabilityHeatmap || analysisData.porters ||
    analysisData.pestel || analysisData.strategic ||
    analysisData.fullSwot || analysisData.customerSegmentation ||
    analysisData.competitiveAdvantage || analysisData.channelEffectiveness ||
    analysisData.expandedCapability || analysisData.strategicGoals ||
    analysisData.strategicRadar || analysisData.cultureProfile ||
    analysisData.productivityMetrics || analysisData.maturityScore ||
    analysisData.costEfficiency || analysisData.financialPerformance ||
    analysisData.financialBalance || analysisData.operationalEfficiency
  );
};
const createSimplePhaseManager = (analysisData, userDetails) => {
  // Simplified logic - similar to AnalysisContentManager
  const hasFullSwot = !!analysisData?.fullSwot;
  const hasEssentialAnalyses = !!(
    analysisData?.competitiveAdvantage ||
    analysisData?.expandedCapability ||
    analysisData?.strategicRadar ||
    analysisData?.productivityMetrics ||
    analysisData?.maturityScore
  );

  // Financial analyses show if we have any financial data (similar to AnalysisContentManager)
  const hasAnyFinancialData = !!(
    analysisData?.profitabilityData ||
    analysisData?.growthTrackerData ||
    analysisData?.liquidityEfficiencyData ||
    analysisData?.investmentPerformanceData ||
    analysisData?.leverageRiskData
  );

  return {
    getUnlockedFeatures: () => ({
      analysis: true,
      fullSwot: hasFullSwot && hasEssentialAnalyses,
      goodPhase: hasAnyFinancialData // Simple: show if we have any financial data
    })
  };
};

// Export utility
const exportUserData = async (user, userDetails, onToast) => {
  try {
    if (!userDetails) {
      onToast('Please view the user details first before exporting', 'warning');
      return;
    }

    const exportData = {
      exportInfo: {
        userName: user.name,
        userId: user._id,
        exportDate: new Date().toISOString(),
        exportedBy: getUserInfo().name || 'Admin'
      },
      userProfile: {
        name: user.name,
        email: user.email,
        role: user.role?.role_name,
        company: user.company?.company_name,
        joinedDate: user.created_at
      },
      conversationData: {
        totalPhases: userDetails.conversation?.length || 0,
        phases: userDetails.conversation || []
      },
      analysisResults: {
        totalAnalyses: userDetails.system?.length || 0,
        analyses: userDetails.system || []
      },
      questionsAndAnswers: []
    };

    userDetails.conversation?.forEach((phase, phaseIndex) => {
      phase.questions?.forEach((qa, qaIndex) => {
        exportData.questionsAndAnswers.push({
          phaseNumber: phaseIndex + 1,
          phaseName: phase.phase,
          phaseSeverity: phase.severity,
          questionNumber: qaIndex + 1,
          question: qa.question,
          answer: qa.answer
        });
      });
    });

    exportData.summary = {
      totalQuestions: exportData.questionsAndAnswers.length,
      totalAnalyses: userDetails.system?.length || 0,
      phases: userDetails.conversation?.map(p => p.phase) || []
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${user.name.replace(/\s+/g, '_')}_analysis_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    onToast(`Exported analysis data for ${user.name}`, 'success');
  } catch (error) {
    console.error('Error exporting user data:', error);
    onToast('Error exporting user data', 'error');
  }
};

// Main Component
const UserHistory = ({ onToast }) => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { users, companies, isLoading, userRole, isInitialized, loadUsers, loadInitialData } = useUserData(onToast);
  const { userDetails, isLoadingDetails, loadUserHistory } = useUserDetails(onToast);
  const { sortedUsers, sortConfig, requestSort } = useSortedFilteredUsers(users, searchTerm);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isInitialized) loadInitialData();
  }, [isInitialized, loadInitialData]);

  useEffect(() => {
    if (isInitialized) {
      loadUsers(selectedCompany);
      setCurrentPage(1);
    }
  }, [selectedCompany, isInitialized, loadUsers]);

  const handleUserSelect = async (userId) => {
    setSelectedUser(userId);
    await loadUserHistory(userId);
  };

  const handleExport = () => {
    const user = users.find(u => u._id === selectedUser);
    const details = userDetails[selectedUser];
    exportUserData(user, details, onToast);
  };

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="user-history-loading">
        <Loader size={24} className="loading-spinner" />
        <span>Loading user history...</span>
      </div>
    );
  }

  return (
    <div className="user-history-container">
      <div className="section-header">
        <div className="user-history-header">
          <h2 className="user-history-title">{t('user_history_and_chat_records')}</h2>
        </div>

        <div className="search-container-row">
          <div className="compact-search">
            <Search size={18} className="compact-search-icon" />
            <input
              type="text"
              placeholder={t('search_users')}
              value={searchTerm}
              className="form-control"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {companies.length > 0 && (
            <div className="company-filter-container">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="company-filter-select"
              >
                <option value="">{t('all_companies')}</option>
                {companies.map(company => (
                  <option key={company._id} value={company._id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <SortableHeader title={t('user')} sortKey="name" sortConfig={sortConfig} onSort={requestSort} />
              <th>{t('email')}</th>
              <th>{t('role')}</th>
              <th>{t('company')}</th>
              <SortableHeader title={t('joined')} sortKey="created_at" sortConfig={sortConfig} onSort={requestSort} />
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(user => (
              <UserRow key={user._id} user={user} onUserSelect={handleUserSelect} t={t} />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        variant="default"
        totalItems={sortedUsers.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={users.find(u => u._id === selectedUser)}
          userDetails={userDetails}
          isLoading={isLoadingDetails}
          onClose={() => setSelectedUser(null)}
          onExport={handleExport}
          onToast={onToast}
          loadUserHistory={loadUserHistory}
        />
      )}
    </div>
  );
};

// Sub-components
// Updated SortableHeader component
const SortableHeader = ({ title, sortKey, sortConfig, onSort, style, className }) => (
  <th
    onClick={() => onSort(sortKey)}
    style={{
      cursor: 'pointer',
      ...style
    }}
    className={className}
  >
    <div
      className="header-content"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexDirection: 'row',
        justifyContent: 'flex-start'
      }}
    >
      <span>{title}</span>
      {sortConfig.key === sortKey && (
        <span className="sort-arrow">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </div>
  </th>
);

const UserRow = ({ user, onUserSelect, t }) => (
  <tr>
    <td className="cell-user">
      <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
      <div className="user-info">
        <div className="user-name">{user.name}</div>
      </div>
    </td>
    <td><div className="user-email">{user.email}</div></td>
    <td><span className="badge-role">{formatRoleName(user.role?.role_name || 'Unknown')}</span></td>
    <td>{user.company?.company_name || 'No Company'}</td>
    <td>{formatDate(user.created_at)}</td>
    <td className="cell-actions">
      <button className="secondary-btn small-btn" onClick={() => onUserSelect(user._id)}>
        {t('view')}
      </button>
    </td>
  </tr>
);

const UserDetailsModal = ({ user, userDetails, isLoading, onClose, onExport, onToast, loadUserHistory }) => (
  <div className="user-details-modal">
    <div className="modal-overlayas" onClick={onClose} />
    <div className="modal-content">
      <UserDetailsPanel
        user={user}
        userDetails={userDetails}
        isLoading={isLoading}
        onClose={onClose}
        onExport={onExport}
        onToast={onToast}
        loadUserHistory={loadUserHistory}
      />
    </div>
  </div>
);

// Enhanced UserDetailsPanel with Strategic Analysis Tab
const UserDetailsPanel = ({ user, userDetails, isLoading, onClose, onExport, onToast, loadUserHistory }) => {
  const [activeTab, setActiveTab] = useState('businesses');
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false);

  const allUserDetails = userDetails[user._id] || {};
  const businesses = allUserDetails.businesses || [];

  useEffect(() => {
    if (businesses.length > 0 && !selectedBusiness) {
      const firstBusinessId = businesses[0]._id;
      setSelectedBusiness(firstBusinessId);
      handleBusinessChange(firstBusinessId);
    }
  }, [businesses, selectedBusiness]);

  const getCurrentUserDetails = () => {
    if (!selectedBusiness) return allUserDetails;
    const businessCacheKey = `${user._id}_${selectedBusiness}`;
    return userDetails[businessCacheKey] || {};
  };

  const handleBusinessChange = async (businessId) => {
    if (!businessId) return;

    setSelectedBusiness(businessId);
    setIsLoadingBusiness(true);

    try {
      await loadUserHistory(user._id, businessId);
    } catch (error) {
      console.error('Error loading business data:', error);
      onToast('Error loading business data', 'error');
    } finally {
      setIsLoadingBusiness(false);
    }
  };

  const currentUserDetails = getCurrentUserDetails();
  const analysisData = parseAnalysisData(currentUserDetails, user);
  const phaseManager = createSimplePhaseManager(analysisData);

  if (businesses.length === 0 && !isLoading) {
    return <EmptyBusinessState user={user} onClose={onClose} />;
  }

  return (
    <div className="user-details-panel">
      <PanelHeader user={user} currentUserDetails={currentUserDetails} onClose={onClose} onExport={onExport} />

      {selectedBusiness && (
        <>
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            businesses={businesses}
          />

          <div className="tab-content">
            {isLoadingBusiness ? (
              <LoadingState message="Loading business data..." />
            ) : (
              <TabContent
                activeTab={activeTab}
                businesses={businesses}
                currentUserDetails={currentUserDetails}
                analysisData={analysisData}
                selectedBusiness={selectedBusiness}
                selectedBusinessId={selectedBusiness}
                onBusinessChange={handleBusinessChange}
                isLoadingBusiness={isLoadingBusiness}
                userDetails={currentUserDetails}
                phaseManager={phaseManager}
                onToast={onToast}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

const EmptyBusinessState = ({ user, onClose }) => (
  <div className="user-details-panel">
    <div className="panel-header">
      <div className="user-header-info">
        <div>
          <h3>{user?.name}</h3>
          <p>{user?.email}</p>
        </div>
      </div>
      <div className="panel-actions">
        <button onClick={onClose} className="close-button">
          <X size={20} />
        </button>
      </div>
    </div>
    <div className="empty-state">
      <Building2 size={48} />
      <p className="empty-title">No businesses found</p>
      <p className="empty-subtitle">This user hasn't created any businesses yet</p>
    </div>
  </div>
);

const PanelHeader = ({ user, currentUserDetails, onClose, onExport }) => (
  <div className="panel-header">
    <div className="header-row">
      <div className="header-left">
        <h3 className="user-name-header">User Name: {user?.name}</h3>
      </div>
      <div className="header-right">
        <button onClick={onClose} className="close-button">
          <X size={20} />
        </button>
      </div>
    </div>
  </div>
);

const TabNavigation = ({
  activeTab,
  onTabChange,
  businesses
}) => {
  const { t } = useTranslation();
  return (
    <div className="admin-nav">
      <button
        onClick={() => onTabChange('businesses')}
        className={`nav-tab ${activeTab === 'businesses' ? 'active' : ''}`}
      >
        <Building2 size={16} />
        <span>{t('businesses')}</span>
        <span className="tab-badge">{businesses.length}</span>
      </button>
      <button
        onClick={() => onTabChange('conversation')}
        className={`nav-tab ${activeTab === 'conversation' ? 'active' : ''}`}
      >
        <FileText size={16} />
        <span>{t('conversation')}</span>
      </button>
      <button
        onClick={() => onTabChange('analysis')}
        className={`nav-tab ${activeTab === 'analysis' ? 'active' : ''}`}
      >
        <Target size={16} />
        <span>{t('analysis')}</span>
      </button>
      <button
        onClick={() => onTabChange('strategic')}
        className={`nav-tab ${activeTab === 'strategic' ? 'active' : ''}`}
      >
        <TrendingUp size={16} />
        <span>{t('strategic')}</span>
      </button>
    </div>
  );
};

const LoadingState = ({ message }) => (
  <div className="loading-details">
    <Loader size={24} className="loading-spinner" />
    <span>{message}</span>
  </div>
);

const TabContent = ({
  activeTab,
  businesses,
  currentUserDetails,
  analysisData,
  selectedBusiness,
  selectedBusinessId,
  onBusinessChange,
  isLoadingBusiness,
  userDetails,
  phaseManager,
  onToast
}) => {
  const getSelectedBusinessName = () => {
    if (!selectedBusiness) return 'Select a Business';
    const business = businesses.find(b => b._id === selectedBusiness);
    return business?.business_name || 'Unknown Business';
  };

  switch (activeTab) {
    case 'businesses':
      return <BusinessesTab businesses={businesses} />;
    case 'conversation':
      return (
        <ConversationTab
          conversation={currentUserDetails?.conversation || []}
          totalQuestions={currentUserDetails?.stats?.total_questions || 0}
          completedQuestions={currentUserDetails?.stats?.completed_questions || 0}
          selectedBusiness={getSelectedBusinessName()}
          businesses={businesses}
          selectedBusinessId={selectedBusinessId}
          onBusinessChange={onBusinessChange}
          isLoadingBusiness={isLoadingBusiness}
        />
      );
    case 'analysis':
      return (
        <AnalysisTab
          analysisData={analysisData}
          selectedBusiness={getSelectedBusinessName()}
          businesses={businesses}
          selectedBusinessId={selectedBusinessId}
          onBusinessChange={onBusinessChange}
          isLoadingBusiness={isLoadingBusiness}
          totalQuestions={currentUserDetails?.stats?.total_questions || 0}
          completedQuestions={currentUserDetails?.stats?.completed_questions || 0}
          conversationCount={currentUserDetails?.conversation?.length || 0}
          userDetails={userDetails}
          phaseManager={phaseManager}
        />
      );
    case 'strategic':
      return (
        <StrategicTab
          analysisData={analysisData}
          selectedBusiness={getSelectedBusinessName()}
          businesses={businesses}
          selectedBusinessId={selectedBusinessId}
          onBusinessChange={onBusinessChange}
          isLoadingBusiness={isLoadingBusiness}
          totalQuestions={currentUserDetails?.stats?.total_questions || 0}
          completedQuestions={currentUserDetails?.stats?.completed_questions || 0}
          conversationCount={currentUserDetails?.conversation?.length || 0}
          phaseManager={phaseManager}
          onToast={onToast}
        />
      );
    default:
      return null;
  }
};

// BusinessesTab Component
const BusinessesTab = ({ businesses }) => {
  if (businesses.length === 0) {
    return (
      <div className="empty-state">
        <Building2 size={48} />
        <p className="empty-title">No businesses</p>
        <p className="empty-subtitle">This user hasn't created any businesses yet</p>
      </div>
    );
  }

  return (
    <div className="businesses-tab">
      <div className="businesses-list">
        {businesses.map((business, index) => (
          <BusinessCard key={index} business={business} />
        ))}
      </div>
    </div>
  );
};

const BusinessCard = ({ business }) => {
  const { t } = useTranslation();   

  return (
    <div className="business-item">
      <div className="business-header">
        <h5 className="business-name"><strong>{t('business_name')}:</strong> {business.business_name}</h5>
        <span className="business-date">{formatDate(business.created_at)}</span>
      </div>
      <div className="business-purpose">
        <strong>{t('Purpose')}:</strong> {business.business_purpose}
      </div>
      {business.description && (
        <div className="business-description">
          <strong>{t('description')}:</strong> {business.description}
        </div>
      )}
      {business.question_statistics && (
        <BusinessStats stats={business.question_statistics} />
      )}
    </div>
  );
};

const BusinessStats = ({ stats }) => (
  <div className="business-stats">
    <div className="stat-item">
      <span className="stat-label">Progress:</span>
      <span className="stat-value">{stats.progress_percentage}%</span>
    </div>
    <div className="stat-item">
      <span className="stat-label">Completed:</span>
      <span className="stat-value">{stats.completed_questions}</span>
    </div>
    <div className="stat-item">
      <span className="stat-label">Total:</span>
      <span className="stat-value">{stats.total_questions}</span>
    </div>
  </div>
);

// BusinessFilter Component (reusable)
const BusinessFilter = ({ businesses, selectedBusinessId, onBusinessChange, isLoadingBusiness }) => (
  <div className="business-filter-inline">
    <label htmlFor="business-select" className="business-filter-label">
      Business:
    </label>
    <select
      id="business-select"
      value={selectedBusinessId}
      onChange={(e) => onBusinessChange(e.target.value)}
      className="business-filter-select"
      disabled={isLoadingBusiness}
    >
      {businesses.map(business => (
        <option key={business._id} value={business._id}>
          {business.business_name}
        </option>
      ))}
    </select>
    {isLoadingBusiness && (
      <div className="business-loading">
        <Loader size={16} className="loading-spinner" />
      </div>
    )}
  </div>
);

// StatsRow Component (reusable) - Updated to support strategic PDF download
const StatsRow = ({
  businesses,
  selectedBusinessId,
  onBusinessChange,
  isLoadingBusiness,
  stats,
  showPDFExport,
  analysisData,
  selectedBusiness,
  isStrategicTab = false,
  onToast
}) => (
  <div className="user-history-stats-container">
    <div className="user-history-stats-row">
      {businesses.length > 0 && (
        <div className="business-filter-inline">
          <label htmlFor="business-select" className="business-filter-label">
            Business:
          </label>
          <select
            id="business-select"
            value={selectedBusinessId}
            onChange={(e) => onBusinessChange(e.target.value)}
            className="business-filter-select"
            disabled={isLoadingBusiness}
          >
            {businesses.map(business => (
              <option key={business._id} value={business._id}>
                {business.business_name}
              </option>
            ))}
          </select>
          {isLoadingBusiness && (
            <div className="business-loading">
              <Loader size={16} className="loading-spinner" />
            </div>
          )}
        </div>
      )}

      <div className="stats-group">
        <div className="stat-card">
          <div className="stat-number">{stats.completed}</div>
          <div className="stat-label">Completed Questions</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.progress}%</div>
          <div className="stat-label">Progress</div>
        </div>
      </div>

      {showPDFExport && analysisData && (
        <div className="pdf-export-container">
          {isStrategicTab ? (
            <DownloadStrategicPDF
              analysisData={analysisData}
              businessName={selectedBusiness}
              onToastMessage={onToast}
              modalSelector=".user-details-modal"
              size="medium"
            />
          ) : (
            <HistoryPDFDownload
              analysisData={analysisData}
              currentPhase="all"
              businessName={selectedBusiness}
              userDetails={analysisData}
            />
          )}
        </div>
      )}
    </div>
  </div>
);

// ConversationTab Component - Updated to show all questions sequentially
const ConversationTab = ({
  conversation,
  totalQuestions = 0,
  completedQuestions = 0,
  selectedBusiness = 'Select a Business',
  businesses = [],
  selectedBusinessId = '',
  onBusinessChange,
  isLoadingBusiness = false
}) => {
  // Flatten all questions from all phases into a single array
  const allQuestions = conversation.reduce((questions, phase) => {
    const phaseQuestions = phase.questions?.map(qa => ({
      ...qa,
      phase: phase.phase,
      severity: phase.severity
    })) || [];
    return [...questions, ...phaseQuestions];
  }, []);

  const totalCompletedQuestions = allQuestions.length;

  const stats = {
    completed: totalCompletedQuestions,
    phases: conversation.length,
    progress: totalQuestions > 0 ? Math.round((totalCompletedQuestions / totalQuestions) * 100) : 0
  };

  if (allQuestions.length === 0) {
    return (
      <div className="conversation-tab">
        <StatsRow
          businesses={businesses}
          selectedBusinessId={selectedBusinessId}
          onBusinessChange={onBusinessChange}
          isLoadingBusiness={isLoadingBusiness}
          stats={stats}
        />
        <div className="empty-state">
          <FileText size={48} />
          <p className="empty-title">No completed conversations</p>
          <p className="empty-subtitle">No completed questions found for {selectedBusiness}</p>
          <p className="empty-help">Questions will appear here once the user completes them</p>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-tab">
      <StatsRow
        businesses={businesses}
        selectedBusinessId={selectedBusinessId}
        onBusinessChange={onBusinessChange}
        isLoadingBusiness={isLoadingBusiness}
        stats={stats}
      />
      <div className="questions-list">
        {allQuestions.map((question, index) => (
          <QuestionItem key={index} question={question} questionNumber={index + 1} />
        ))}
      </div>
    </div>
  );
};

const QuestionItem = ({ question, questionNumber }) => (
  <div className="question-item">
    <div className="question-text">Q{questionNumber}: {question.question}</div>
    <div className="answer-section">
      <div className="answer-text">A: {question.answer}</div>
    </div>
  </div>
);

const AnalysisTab = ({
  analysisData,
  selectedBusiness = 'Select a Business',
  businesses = [],
  selectedBusinessId = '',
  onBusinessChange,
  isLoadingBusiness = false,
  totalQuestions = 0,
  completedQuestions = 0,
  conversationCount = 0,
  userDetails = {},
  phaseManager
}) => {
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const totalCompletedQuestions = analysisData?.conversation?.reduce((sum, phase) => sum + phase.questions.length, 0) || completedQuestions;

  const stats = {
    completed: totalCompletedQuestions,
    phases: conversationCount,
    progress: totalQuestions > 0 ? Math.round((totalCompletedQuestions / totalQuestions) * 100) : 0,
  };

  // Create a fallback phase manager if none is provided
  const safePhaseManager = phaseManager || createSimplePhaseManager(analysisData);

  if (!analysisData || !hasAnalysisData(analysisData)) {
    return (
      <div className="analysis-tab">
        <StatsRow
          businesses={businesses}
          selectedBusinessId={selectedBusinessId}
          onBusinessChange={onBusinessChange}
          isLoadingBusiness={isLoadingBusiness}
          stats={stats}
          showPDFExport={false}
        />
        <div className="empty-state">
          <Target size={48} />
          <p className="empty-title">No analysis available</p>
          <p className="empty-subtitle">No analysis found for {selectedBusiness}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-tab">
      <StatsRow
        businesses={businesses}
        selectedBusinessId={selectedBusinessId}
        onBusinessChange={onBusinessChange}
        isLoadingBusiness={isLoadingBusiness}
        stats={stats}
        showPDFExport={true}
        analysisData={analysisData}
        selectedBusiness={selectedBusiness}
      />

      <div className="analysis-components">
        <AnalysisContentManager
          phaseManager={safePhaseManager}
          businessData={{ name: analysisData.businessName }}
          questions={analysisData.questions}
          userAnswers={analysisData.userAnswers}
          selectedBusinessId={selectedBusinessId}
          swotAnalysisResult={analysisData.swot}
          customerSegmentationData={analysisData.customerSegmentation}
          purchaseCriteriaData={analysisData.purchaseCriteria}
          channelHeatmapData={analysisData.channelHeatmap}
          loyaltyNPSData={analysisData.loyaltyNPS}
          capabilityHeatmapData={analysisData.capabilityHeatmap}
          strategicData={analysisData.strategic}
          portersData={analysisData.porters}
          pestelData={analysisData.pestel}
          fullSwotData={analysisData.fullSwot}
          competitiveAdvantageData={analysisData.competitiveAdvantage}
          channelEffectivenessData={analysisData.channelEffectiveness}
          expandedCapabilityData={analysisData.expandedCapability}
          strategicGoalsData={analysisData.strategicGoals}
          strategicRadarData={analysisData.strategicRadar}
          cultureProfileData={analysisData.cultureProfile}
          productivityData={analysisData.productivityMetrics}
          maturityData={analysisData.maturityScore}
          costEfficiencyData={analysisData.costEfficiency}
          financialPerformanceData={analysisData.financialPerformance}
          financialBalanceData={analysisData.financialBalance}
          operationalEfficiencyData={analysisData.operationalEfficiency}
          profitabilityData={analysisData.profitabilityData}
          growthTrackerData={analysisData.growthTrackerData}
          liquidityEfficiencyData={analysisData.liquidityEfficiencyData}
          investmentPerformanceData={analysisData.investmentPerformanceData}
          leverageRiskData={analysisData.leverageRiskData}
          competitiveLandscapeData={analysisData.competitiveLandscapeData}
          coreAdjacencyData={analysisData.coreAdjacencyData}
          setSwotAnalysisResult={() => { }}
          setCustomerSegmentationData={() => { }}
          setPurchaseCriteriaData={() => { }}
          setChannelHeatmapData={() => { }}
          setLoyaltyNPSData={() => { }}
          setCapabilityHeatmapData={() => { }}
          setPortersData={() => { }}
          setPestelData={() => { }}
          setFullSwotData={() => { }}
          setCompetitiveAdvantageData={() => { }}
          setChannelEffectivenessData={() => { }}
          setExpandedCapabilityData={() => { }}
          setStrategicGoalsData={() => { }}
          setStrategicRadarData={() => { }}
          setCultureProfileData={() => { }}
          setProductivityData={() => { }}
          setMaturityData={() => { }}
          setCostEfficiencyData={() => { }}
          setFinancialPerformanceData={() => { }}
          setFinancialBalanceData={() => { }}
          setOperationalEfficiencyData={() => { }}
          setProfitabilityData={() => { }}
          setGrowthTrackerData={() => { }}
          setLiquidityEfficiencyData={() => { }}
          setInvestmentPerformanceData={() => { }}
          setLeverageRiskData={() => { }}
          isSwotAnalysisRegenerating={false}
          isCustomerSegmentationRegenerating={false}
          isPurchaseCriteriaRegenerating={false}
          isChannelHeatmapRegenerating={false}
          isLoyaltyNPSRegenerating={false}
          isCapabilityHeatmapRegenerating={false}
          isPortersRegenerating={false}
          isPestelRegenerating={false}
          isFullSwotRegenerating={false}
          isCompetitiveAdvantageRegenerating={false}
          isChannelEffectivenessRegenerating={false}
          isExpandedCapabilityRegenerating={false}
          isStrategicGoalsRegenerating={false}
          isStrategicRadarRegenerating={false}
          isCultureProfileRegenerating={false}
          isProductivityRegenerating={false}
          isMaturityRegenerating={false}
          isCostEfficiencyRegenerating={false}
          isFinancialPerformanceRegenerating={false}
          isFinancialBalanceRegenerating={false}
          isOperationalEfficiencyRegenerating={false}
          isProfitabilityRegenerating={false}
          isGrowthTrackerRegenerating={false}
          isLiquidityEfficiencyRegenerating={false}
          isInvestmentPerformanceRegenerating={false}
          isLeverageRiskRegenerating={false}
          isAnalysisRegenerating={false}
          isChannelHeatmapReady={true}
          setIsChannelHeatmapReady={() => { }}
          isCapabilityHeatmapReady={true}
          setIsCapabilityHeatmapReady={() => { }}
          apiLoadingStates={{}}
          swotRef={{ current: null }}
          customerSegmentationRef={{ current: null }}
          purchaseCriteriaRef={{ current: null }}
          channelHeatmapRef={{ current: null }}
          loyaltyNpsRef={{ current: null }}
          capabilityHeatmapRef={{ current: null }}
          portersRef={{ current: null }}
          pestelRef={{ current: null }}
          fullSwotRef={{ current: null }}
          competitiveAdvantageRef={{ current: null }}
          channelEffectivenessRef={{ current: null }}
          expandedCapabilityRef={{ current: null }}
          strategicGoalsRef={{ current: null }}
          strategicRadarRef={{ current: null }}
          cultureProfileRef={{ current: null }}
          productivityRef={{ current: null }}
          maturityScoreRef={{ current: null }}
          costEfficiencyRef={{ current: null }}
          financialPerformanceRef={{ current: null }}
          financialBalanceRef={{ current: null }}
          operationalEfficiencyRef={{ current: null }}
          profitabilityRef={{ current: null }}
          growthTrackerRef={{ current: null }}
          liquidityEfficiencyRef={{ current: null }}
          investmentPerformanceRef={{ current: null }}
          leverageRiskRef={{ current: null }}
          handleRedirectToBrief={() => { }}
          showToastMessage={() => { }}
          apiService={null}
          createSimpleRegenerationHandler={() => () => { }}
          uploadedFileForAnalysis={null}
          collapsedCategories={collapsedCategories}
          setCollapsedCategories={setCollapsedCategories}
          highlightedCard={null}
          expandedCards={expandedCards}
          setExpandedCards={setExpandedCards}
          onRedirectToChat={() => { }}
          isMobile={false}
          setActiveTab={() => { }}
          hasUploadedDocument={false}
          hideRegenerateButtons={true}
          readOnly={true}
          hideImproveButton={true}
          showImproveButton={false}
        />
      </div>
    </div>
  );
};

const StrategicTab = ({
  analysisData,
  selectedBusiness = 'Select a Business',
  businesses = [],
  selectedBusinessId = '',
  onBusinessChange,
  isLoadingBusiness = false,
  totalQuestions = 0,
  completedQuestions = 0,
  conversationCount = 0,
  phaseManager,
  onToast
}) => {
  const totalCompletedQuestions = analysisData?.conversation?.reduce((sum, phase) => sum + phase.questions.length, 0) || completedQuestions;

  const stats = {
    completed: totalCompletedQuestions,
    phases: conversationCount,
    progress: totalQuestions > 0 ? Math.round((totalCompletedQuestions / totalQuestions) * 100) : 0,
  };

  // Create a fallback phase manager if none is provided
  const safePhaseManager = phaseManager || createSimplePhaseManager(analysisData);

  if (!analysisData) {
    return (
      <div className="strategic-tab">
        <StatsRow
          businesses={businesses}
          selectedBusinessId={selectedBusinessId}
          onBusinessChange={onBusinessChange}
          isLoadingBusiness={isLoadingBusiness}
          stats={stats}
          showPDFExport={false}
          isStrategicTab={true}
          onToast={onToast}
        />
        <div className="empty-state">
          <TrendingUp size={48} />
          <p className="empty-title">No strategic analysis available</p>
          <p className="empty-subtitle">No strategic analysis found for {selectedBusiness}</p>
        </div>
      </div>
    );
  }

  if (!analysisData.strategic) {
    return (
      <div className="strategic-tab">
        <StatsRow
          businesses={businesses}
          selectedBusinessId={selectedBusinessId}
          onBusinessChange={onBusinessChange}
          isLoadingBusiness={isLoadingBusiness}
          stats={stats}
          showPDFExport={false}
          isStrategicTab={true}
          onToast={onToast}
        />
        <div className="empty-state">
          <TrendingUp size={48} />
          <p className="empty-title">No strategic analysis available</p>
          <p className="empty-subtitle">No strategic analysis generated for {selectedBusiness} yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="strategic-tab">
      <StatsRow
        businesses={businesses}
        selectedBusinessId={selectedBusinessId}
        onBusinessChange={onBusinessChange}
        isLoadingBusiness={isLoadingBusiness}
        stats={stats}
        showPDFExport={true}
        analysisData={analysisData}
        selectedBusiness={selectedBusiness}
        isStrategicTab={true}
        onToast={onToast}
      />

      {/* Strategic analysis container with proper structure for PDF capture */}
      <div className="strategic-analysis-container">
        <StrategicAnalysis
          questions={analysisData.questions}
          userAnswers={analysisData.userAnswers}
          businessName={analysisData.businessName}
          strategicData={analysisData.strategic}
          onRegenerate={null}
          isRegenerating={false}
          canRegenerate={false}
          phaseManager={safePhaseManager}
          hideDownload={true} // Hide the original download button since we have our custom one
          hideImproveButton={true}
        />
      </div>
    </div>
  );
};


export default UserHistory;