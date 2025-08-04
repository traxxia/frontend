import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { 
  Search, 
  Users, 
  Loader, 
  ChevronDown, 
  ChevronRight,
  MessageSquare,
  Award,
  Clock,
  Building2,
  Download,
  User,
  Calendar,
  Activity,
  Hash,
  Bot,
  X,
  ChevronLeft,
  Info,
  ChevronRight as ChevronRightIcon,
  FileText,
  BarChart3,
  Target,
  TrendingUp
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import SwotAnalysis from '../components/SwotAnalysis';
import CustomerSegmentation from '../components/CustomerSegmentation';
import PurchaseCriteria from '../components/PurchaseCriteria';
import ChannelHeatmap from '../components/ChannelHeatmap';
import LoyaltyNPS from '../components/LoyaltyNPS';
import CapabilityHeatmap from '../components/CapabilityHeatmap';
import '../styles/UserHistory.css';

const UserHistory = ({ onToast }) => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'last_login', direction: 'desc' });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const getAuthToken = () => sessionStorage.getItem('token');

  // Memoized function to load users
  const loadUsersWithActivity = useCallback(async (companyId = '') => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      let url = `${API_BASE_URL}/api/company-admin/users`;
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
        const usersWithActivity = data.users.filter(user => 
          user.activity_summary.has_activity || 
          ['super_admin', 'company_admin'].includes(user.role?.role_name)
        );
        setUsers(usersWithActivity);
      } else {
        onToast('Failed to load users with activity', 'error');
      }
    } catch (error) {
      console.error('Error loading users with activity:', error);
      onToast('Error loading users with activity', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, onToast]);

  // Initialize data only once
  useEffect(() => {
    if (!isInitialized) {
      loadInitialData();
    }
  }, [isInitialized]);

  // Handle company selection change
  useEffect(() => {
    if (isInitialized) {
      loadUsersWithActivity(selectedCompany);
      setCurrentPage(1);
    }
  }, [selectedCompany, isInitialized, loadUsersWithActivity]);

  const loadInitialData = async () => {
    try {
      const token = getAuthToken();
      const userInfo = JSON.parse(sessionStorage.getItem('user') || '{}');
      setUserRole(userInfo.role || '');

      // Load companies for super admin
      if (userInfo.role === 'super_admin') {
        const companiesResponse = await fetch(`${API_BASE_URL}/api/super-admin/companies`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json();
          setCompanies(companiesData.companies);
        }
      }

      // Load initial users
      await loadUsersWithActivity();
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      onToast('Error loading data', 'error');
      setIsInitialized(true);
    }
  };

  const loadUserHistory = async (userId) => {
    if (userDetails[userId]) return;

    try {
      setIsLoadingDetails(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/admin/user-data/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(prev => ({ ...prev, [userId]: data }));
      } else {
        onToast('Failed to load user history', 'error');
      }
    } catch (error) {
      console.error('Error loading user history:', error);
      onToast('Error loading user history', 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleUserSelect = async (userId) => {
    setSelectedUser(userId);
    await loadUserHistory(userId);
  };

  const exportUserData = async (userId, userName) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/export/responses/${userId}?format=json`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${userName.replace(/\s+/g, '_')}_complete_data.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        onToast(`Exported complete data for ${userName}`, 'success');
      } else {
        onToast('Failed to export user data', 'error');
      }
    } catch (error) {
      console.error('Error exporting user data:', error);
      onToast('Error exporting user data', 'error');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortConfig.key === 'name') {
      return sortConfig.direction === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortConfig.key === 'last_login') {
      const aDate = a.last_login ? new Date(a.last_login) : new Date(0);
      const bDate = b.last_login ? new Date(b.last_login) : new Date(0);
      return sortConfig.direction === 'asc' 
        ? aDate - bDate 
        : bDate - aDate;
    } else if (sortConfig.key === 'created_at') {
      const aDate = new Date(a.created_at);
      const bDate = new Date(b.created_at);
      return sortConfig.direction === 'asc' 
        ? aDate - bDate 
        : bDate - aDate;
    } else if (sortConfig.key === 'activity') {
      const aActivity = a.activity_summary?.total_answers || 0;
      const bActivity = b.activity_summary?.total_answers || 0;
      return sortConfig.direction === 'asc' 
        ? aActivity - bActivity 
        : bActivity - aActivity;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
      <div className="user-history-header">
        <div>
          <h2 className="user-history-title">User History & Chat Records</h2>
           
        </div> 
      </div>

      {/* Compact Search + Info Button */}
      <div className="search-container-row">
        <div className="compact-search">
          <Search size={18} className="compact-search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      
      </div>

      {/* Popup Modal with Bootstrap Carousel */}
      

      {/* User History Table */}
      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('name')}>
                <div className="header-content">
                  User
                  {sortConfig.key === 'name' && (
                    <span className="sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th>Role</th>
              <th>Company</th>
              <th onClick={() => requestSort('created_at')}>
                <div className="header-content">
                  Joined
                  {sortConfig.key === 'created_at' && (
                    <span className="sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th> 
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(user => (
              <tr key={user._id}>
                <td className="cell-user">
                  <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </td>
                <td><span className="badge-role">{formatRoleName(user.role?.role_name || 'Unknown')}</span></td>
                <td>{user.company?.company_name || 'No Company'}</td>
                <td>{formatDate(user.created_at)}</td>
                 
                <td className="cell-actions">
                  <button className="secondary-btn small-btn" onClick={() => handleUserSelect(user._id)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={paginate}
        />
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="user-details-modal">
          <div className="modal-overlayas" onClick={() => setSelectedUser(null)} />
          <div className="modal-content">
            <UserDetailsPanel 
              user={users.find(u => u._id === selectedUser)}
              userDetails={userDetails[selectedUser]} 
              isLoading={isLoadingDetails} 
              onClose={() => setSelectedUser(null)}
              onExport={() => exportUserData(selectedUser, users.find(u => u._id === selectedUser)?.name)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced UserDetailsPanel Component with Analysis Support
const UserDetailsPanel = ({ user, userDetails, isLoading, onClose, onExport }) => {
  const [activeTab, setActiveTab] = useState('conversation');

  // Count conversation messages and analysis results
  const conversationCount = userDetails?.conversation?.length || 0;
  
  // Enhanced analysis data parsing from user-data API response
  const getAnalysisData = () => {
    if (!userDetails) {
      return null;
    }

    const analysisData = {
      swot: null,
      customerSegmentation: null,
      purchaseCriteria: null,
      channelHeatmap: null,
      loyaltyNPS: null,
      capabilityHeatmap: null,
      businessName: user?.name || 'Business',
      userAnswers: {},
      questions: []
    };

    // Extract questions and answers from conversation data
    if (userDetails.conversation && userDetails.conversation.length > 0) {
      userDetails.conversation.forEach(phase => {
        if (phase.questions && phase.questions.length > 0) {
          phase.questions.forEach(qa => {
            // Create a simple question object for the analysis components
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
        }
      });
    }

    // Parse system results for analysis data
    if (userDetails.system && userDetails.system.length > 0) {
      userDetails.system.forEach(result => {
        try {
          let analysisResult;
          
          // Handle different data formats
          if (typeof result.analysis_result === 'string') {
            try {
              analysisResult = JSON.parse(result.analysis_result);
            } catch (e) {
              // If JSON parsing fails, treat as raw string
              analysisResult = result.analysis_result;
            }
          } else {
            analysisResult = result.analysis_result;
          }

          // Detect SWOT analysis (check for SWOT-specific fields)
          if (typeof analysisResult === 'string') {
            // Check if string contains SWOT keywords
            if (analysisResult.includes('strengths') || analysisResult.includes('weaknesses') || 
                analysisResult.includes('opportunities') || analysisResult.includes('threats')) {
              analysisData.swot = analysisResult;
            }
          } else if (analysisResult && typeof analysisResult === 'object') {
            // Check for SWOT object structure
            if (analysisResult.strengths || analysisResult.weaknesses || 
                analysisResult.opportunities || analysisResult.threats) {
              analysisData.swot = result.analysis_result;
            }
            
            // Detect Customer Segmentation
            else if (analysisResult.customerSegmentation || analysisResult.segments ||
                    (analysisResult.demographic && analysisResult.behavioral)) {
              analysisData.customerSegmentation = analysisResult.customerSegmentation || analysisResult;
            }

            // Detect Purchase Criteria
            else if (analysisResult.purchaseCriteria || analysisResult.criteria ||
                    analysisResult.purchase_factors) {
              analysisData.purchaseCriteria = analysisResult.purchaseCriteria || analysisResult;
            }

            // Detect Channel Heatmap
            else if (analysisResult.channelHeatmap || analysisResult.channels ||
                    analysisResult.channel_effectiveness) {
              analysisData.channelHeatmap = analysisResult.channelHeatmap || analysisResult;
            }

            // Detect Loyalty/NPS
            else if (analysisResult.loyaltyMetrics || analysisResult.loyalty || analysisResult.nps) {
              analysisData.loyaltyNPS = analysisResult.loyaltyMetrics || analysisResult;
            }

            // Detect Capability Heatmap
            else if (analysisResult.capabilities || analysisResult.capabilityHeatmap ||
                    analysisResult.capability_matrix) {
              analysisData.capabilityHeatmap = analysisResult.capabilities || analysisResult;
            }
          }

        } catch (error) {
          console.error('Error parsing analysis result:', error);
        }
      });
    }

    return analysisData;
  };

  const analysisData = getAnalysisData();
  const hasAnalysis = analysisData && (
    analysisData.swot || 
    analysisData.customerSegmentation || 
    analysisData.purchaseCriteria || 
    analysisData.channelHeatmap || 
    analysisData.loyaltyNPS || 
    analysisData.capabilityHeatmap
  );
  
  const analysisCount = hasAnalysis ? Object.values(analysisData).filter(data => 
    data !== null && data !== undefined && 
    data !== analysisData.businessName && 
    data !== analysisData.userAnswers && 
    data !== analysisData.questions
  ).length : 0;

  return (
    <div className="user-details-panel">
      <div className="panel-header">
        <div className="user-header-info">          
          <div>
            <h3>{user?.name}</h3> 
            {/* <div className="user-meta">
              <span className={`role-badge ${getRoleBadgeClass(user?.role?.role_name)}`}>
                {formatRoleName(user?.role?.role_name || 'Unknown')}
              </span> 
              <span className="user-email">{user?.email}</span>
            </div> */}
          </div>
        </div>
        <div className="panel-actions">
          <button onClick={onExport} className="export-button">
            <Download size={16} />
            <span>Export Data</span>
          </button>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* <div className="activity-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <MessageSquare size={16} />
            <span>{conversationCount} Conversations</span>
          </div>
          {hasAnalysis && (
            <div className="stat-item">
              <Target size={16} />
              <span>{analysisCount} Analysis Components</span>
            </div>
          )}
        </div>
      </div> */}

      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('conversation')}
          className={`tab-button ${activeTab === 'conversation' ? 'active' : ''}`}
          disabled={isLoading}
        >
          <FileText size={16} />
          <span>Conversation</span>
          {/* {conversationCount > 0 && <span className="tab-count">{conversationCount}</span>} */}
        </button>

        {hasAnalysis && (
          <button
            onClick={() => setActiveTab('analysis')}
            className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
            disabled={isLoading}
          >
            <Target size={16} />
            <span>Analysis</span>
            {/* <span className="tab-count">{analysisCount}</span> */}
          </button>
        )}
      </div>

      <div className="tab-content">
        {isLoading ? (
          <div className="loading-details">
            <Loader size={24} className="loading-spinner" />
            <span>Loading user data...</span>
          </div>
        ) : (
          <>
            {activeTab === 'conversation' && <ConversationTab conversation={userDetails?.conversation || []} />}
            {activeTab === 'analysis' && hasAnalysis && (
              <AnalysisTab analysisData={analysisData} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// New AnalysisTab Component
const AnalysisTab = ({ analysisData }) => {
  if (!analysisData) {
    return (
      <div className="empty-state">
        <Target size={48} />
        <p className="empty-title">No analysis available</p>
        <p className="empty-subtitle">This user hasn't generated any business analysis yet</p>
      </div>
    );
  }

  return (
    <div className="analysis-tab">
      <div className="analysis-components">
        {/* SWOT Analysis */}
        {analysisData.swot && (
          <div className="analysis-component">
            <SwotAnalysis
              analysisResult={analysisData.swot}
              businessName={analysisData.businessName}
              onRegenerate={null} // Read-only mode
              isRegenerating={false}
              canRegenerate={false}
            />
          </div>
        )}

        {/* Customer Segmentation */}
        {analysisData.customerSegmentation && (
          <div className="analysis-component">
            <CustomerSegmentation
              questions={analysisData.questions}
              userAnswers={analysisData.userAnswers}
              businessName={analysisData.businessName}
              onDataGenerated={() => {}}
              onRegenerate={null}
              isRegenerating={false}
              canRegenerate={false}
              customerSegmentationData={analysisData.customerSegmentation}
            />
          </div>
        )}

        {/* Purchase Criteria */}
        {analysisData.purchaseCriteria && (
          <div className="analysis-component">
            <PurchaseCriteria
              questions={analysisData.questions}
              userAnswers={analysisData.userAnswers}
              businessName={analysisData.businessName}
              onDataGenerated={() => {}}
              onRegenerate={null}
              isRegenerating={false}
              canRegenerate={false}
              purchaseCriteriaData={analysisData.purchaseCriteria}
            />
          </div>
        )}

        {/* Channel Heatmap */}
        {analysisData.channelHeatmap && (
          <div className="analysis-component">
            <ChannelHeatmap
              questions={analysisData.questions}
              userAnswers={analysisData.userAnswers}
              businessName={analysisData.businessName}
              onDataGenerated={() => {}}
              onRegenerate={null}
              isRegenerating={false}
              canRegenerate={false}
              channelHeatmapData={analysisData.channelHeatmap}
            />
          </div>
        )}

        {/* Loyalty NPS */}
        {analysisData.loyaltyNPS && (
          <div className="analysis-component">
            <LoyaltyNPS
              questions={analysisData.questions}
              userAnswers={analysisData.userAnswers}
              businessName={analysisData.businessName}
              onDataGenerated={() => {}}
              onRegenerate={null}
              isRegenerating={false}
              canRegenerate={false}
              loyaltyNPSData={analysisData.loyaltyNPS}
            />
          </div>
        )}

        {/* Capability Heatmap */}
        {analysisData.capabilityHeatmap && (
          <div className="analysis-component">
            <CapabilityHeatmap
              questions={analysisData.questions}
              userAnswers={analysisData.userAnswers}
              businessName={analysisData.businessName}
              onDataGenerated={() => {}}
              onRegenerate={null}
              isRegenerating={false}
              canRegenerate={false}
              capabilityHeatmapData={analysisData.capabilityHeatmap}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ConversationTab Component
const ConversationTab = ({ conversation }) => {
  if (conversation.length === 0) {
    return (
      <div className="empty-state">
        <FileText size={48} />
        <p className="empty-title">No conversations</p>
        <p className="empty-subtitle">This user hasn't started any conversations yet</p>
      </div>
    );
  }

  return (
    <div className="conversation-tab">
      <div className="conversation-list">
        {conversation.map((phase, index) => (
          <div key={index} className="conversation-phase">
            <div className="phase-header">
              <h4 className="phase-title">
                {phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1)} Phase
              </h4>
              <span className="phase-severity">{phase.severity}</span>
            </div>
            
            <div className="questions-list">
              {phase.questions.map((question, qIndex) => (
                <div key={qIndex} className="question-item">
                  <div className="question-header">
                    <div className="question-text">{question.question}</div>
                  </div>
                  
                  <div className="answer-section">
                    <div className="answer-label">Answer:</div>
                    <div className="answer-text">{question.answer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="pagination-container">
      <div className="pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn pagination-prev"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <div className="pagination-numbers">
          {getPageNumbers().map((number, index) => (
            <button
              key={index}
              onClick={() => typeof number === 'number' && onPageChange(number)}
              className={`pagination-number ${
                number === currentPage ? 'active' : ''
              } ${typeof number !== 'number' ? 'dots' : ''}`}
              disabled={typeof number !== 'number'}
            >
              {number}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn pagination-next"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>

      {/* <div className="pagination-info">
        Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, sortedUsers.length)} of {sortedUsers.length} users
      </div> */}
    </div>
  );
};

// Helper functions
const getRoleBadgeClass = (roleName) => {
  switch (roleName) {
    case 'super_admin': return 'role-badge-super-admin';
    case 'company_admin': return 'role-badge-company-admin';
    case 'answerer_user': return 'role-badge-answerer';
    case 'viewer_user': return 'role-badge-viewer';
    default: return 'role-badge-default';
  }
};

const formatRoleName = (roleName) => {
  return roleName.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default UserHistory;