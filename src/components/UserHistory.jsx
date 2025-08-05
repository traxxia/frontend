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
import PDFExportComponent from '../components/PDFExportComponent';
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
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const getAuthToken = () => sessionStorage.getItem('token');

  // Load users based on role and company filter
  const loadUsers = useCallback(async (companyId = '') => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      let url = `${API_BASE_URL}/api/admin/users`;
      if (companyId && userRole === 'super_admin') {
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
        
        // Transform users to match expected format
        const transformedUsers = data.users.map(user => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          role: {
            role_name: user.role_name || 'user'
          },
          company: {
            company_name: user.company_name || 'No Company'
          },
          // Add mock activity data since it's not in the new API
          activity_summary: {
            has_activity: true, // Assume all users have some activity
            total_answers: 0
          }
        }));
        
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
  }, [API_BASE_URL, onToast, userRole]);

  // Initialize data only once
  useEffect(() => {
    if (!isInitialized) {
      loadInitialData();
    }
  }, [isInitialized]);

  // Handle company selection change
  useEffect(() => {
    if (isInitialized) {
      loadUsers(selectedCompany);
      setCurrentPage(1);
    }
  }, [selectedCompany, isInitialized, loadUsers]);

  const loadInitialData = async () => {
    try {
      const token = getAuthToken();
      const userInfo = JSON.parse(sessionStorage.getItem('user') || '{}');
      setUserRole(userInfo.role || '');

      // Load companies for super admin
      if (userInfo.role === 'super_admin') {
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
      }

      // Load initial users
      await loadUsers();
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      onToast('Error loading data', 'error');
      setIsInitialized(true);
    }
  };

  const loadUserHistory = async (userId, businessId = null) => {
    const cacheKey = businessId ? `${userId}_${businessId}` : userId;
    
    if (userDetails[cacheKey]) return;

    try {
      setIsLoadingDetails(true);
      const token = getAuthToken();

      // Use the new admin endpoint for comprehensive user data
      let url = `${API_BASE_URL}/api/admin/user-data/${userId}`;
      if (businessId) {
        url += `?business_id=${businessId}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // The API now returns data in the format we expect
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

  const handleUserSelect = async (userId) => {
    setSelectedUser(userId);
    // Load initial data (all businesses)
    await loadUserHistory(userId);
  };

  // Enhanced export function
  const exportUserData = async (userId, userName) => {
    try {
      const token = getAuthToken();
      
      const currentUserDetails = userDetails[userId];
      
      if (!currentUserDetails) {
        onToast('Please view the user details first before exporting', 'warning');
        return;
      }

      const currentUser = users.find(u => u._id === userId);

      // Prepare the complete export data
      const exportData = {
        exportInfo: {
          userName: userName,
          userId: userId,
          exportDate: new Date().toISOString(),
          exportedBy: JSON.parse(sessionStorage.getItem('user') || '{}').name || 'Admin'
        },
        userProfile: {
          name: currentUser?.name,
          email: currentUser?.email,
          role: currentUser?.role?.role_name,
          company: currentUser?.company?.company_name,
          joinedDate: currentUser?.created_at
        },
        conversationData: {
          totalPhases: currentUserDetails.conversation?.length || 0,
          phases: currentUserDetails.conversation || []
        },
        analysisResults: {
          totalAnalyses: currentUserDetails.system?.length || 0,
          analyses: currentUserDetails.system || []
        },
        questionsAndAnswers: []
      };

      // Parse and organize analysis data
      const organizedAnalyses = {};
      
      if (currentUserDetails.system) {
        currentUserDetails.system.forEach(result => {
          try {
            let analysisResult;
            
            if (typeof result.analysis_result === 'string') {
              try {
                analysisResult = JSON.parse(result.analysis_result);
              } catch (e) {
                analysisResult = result.analysis_result;
              }
            } else {
              analysisResult = result.analysis_result;
            }

            const analysisName = result.name?.toLowerCase() || '';
            let analysisType = 'other';
            
            if (analysisName.includes('swot')) {
              analysisType = 'swotAnalysis';
            } else if (analysisName.includes('customer')) {
              analysisType = 'customerSegmentation';
            } else if (analysisName.includes('purchase')) {
              analysisType = 'purchaseCriteria';
            } else if (analysisName.includes('channel')) {
              analysisType = 'channelHeatmap';
            } else if (analysisName.includes('loyalty')) {
              analysisType = 'loyaltyNPS';
            } else if (analysisName.includes('capability')) {
              analysisType = 'capabilityHeatmap';
            }

            organizedAnalyses[analysisType] = {
              name: result.name,
              data: analysisResult,
              rawResult: result.analysis_result
            };
          } catch (error) {
            console.error('Error parsing analysis for export:', error);
          }
        });
      }

      exportData.organizedAnalyses = organizedAnalyses;

      // Extract Q&A in a readable format
      if (currentUserDetails.conversation) {
        currentUserDetails.conversation.forEach((phase, phaseIndex) => {
          if (phase.questions) {
            phase.questions.forEach((qa, qaIndex) => {
              exportData.questionsAndAnswers.push({
                phaseNumber: phaseIndex + 1,
                phaseName: phase.phase,
                phaseSeverity: phase.severity,
                questionNumber: qaIndex + 1,
                question: qa.question,
                answer: qa.answer
              });
            });
          }
        });
      }

      // Create summary statistics
      exportData.summary = {
        totalQuestions: exportData.questionsAndAnswers.length,
        totalAnalyses: Object.keys(organizedAnalyses).length,
        analysisTypes: Object.keys(organizedAnalyses),
        phases: currentUserDetails.conversation?.map(p => p.phase) || []
      };

      // Convert to JSON and download
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${userName.replace(/\s+/g, '_')}_complete_analysis_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onToast(`Exported complete analysis data for ${userName}`, 'success');

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

      {/* Company Filter for Super Admin */}
      {userRole === 'super_admin' && companies.length > 0 && (
        <div className="company-filter-container">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="company-filter-select"
          >
            <option value="">All Companies</option>
            {companies.map(company => (
              <option key={company._id} value={company._id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search Container */}
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
              <th>Email</th>
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
                  </div>
                </td>
                <td><div className="user-email">{user.email}</div></td>
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
              userDetails={userDetails}
              isLoading={isLoadingDetails}
              onClose={() => setSelectedUser(null)}
              onExport={() => exportUserData(selectedUser, users.find(u => u._id === selectedUser)?.name)}
              onToast={onToast}
              loadUserHistory={loadUserHistory}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced UserDetailsPanel Component with Business Dropdown
const UserDetailsPanel = ({ user, userDetails, isLoading, onClose, onExport, onToast, loadUserHistory }) => {
  const [activeTab, setActiveTab] = useState('conversation');
  const [selectedBusiness, setSelectedBusiness] = useState('all');
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false);

  // Get all user details (without business filter) to access businesses list
  const allUserDetails = userDetails[user._id] || {};
  const businesses = allUserDetails.businesses || [];

  // Get current display data based on selected business
  const getCurrentUserDetails = () => {
    if (selectedBusiness === 'all') {
      return allUserDetails;
    }
    
    // Get data for specific business
    const businessCacheKey = `${user._id}_${selectedBusiness}`;
    return userDetails[businessCacheKey] || allUserDetails;
  };

  const currentUserDetails = getCurrentUserDetails();
  const conversationCount = currentUserDetails?.conversation?.length || 0;

  // Handle business selection change
  const handleBusinessChange = async (businessId) => {
    setSelectedBusiness(businessId);
    
    if (businessId !== 'all') {
      setIsLoadingBusiness(true);
      
      try {
        const businessCacheKey = `${user._id}_${businessId}`;
        
        // Check if we already have this business data
        if (!userDetails[businessCacheKey]) {
          await loadUserHistory(user._id, businessId);
        }
      } catch (error) {
        console.error('Error loading business data:', error);
        onToast('Error loading business data', 'error');
      } finally {
        setIsLoadingBusiness(false);
      }
    }
  };

  // Enhanced analysis data parsing
  const getAnalysisData = () => {
    if (!currentUserDetails) {
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
    if (currentUserDetails.conversation && currentUserDetails.conversation.length > 0) {
      currentUserDetails.conversation.forEach(phase => {
        if (phase.questions && phase.questions.length > 0) {
          phase.questions.forEach(qa => {
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
    if (currentUserDetails.system && currentUserDetails.system.length > 0) {
      currentUserDetails.system.forEach(result => {
        try {
          let analysisResult;

          if (typeof result.analysis_result === 'string') {
            try {
              analysisResult = JSON.parse(result.analysis_result);
            } catch (e) {
              analysisResult = result.analysis_result;
            }
          } else {
            analysisResult = result.analysis_result;
          }

          const analysisName = result.name?.toLowerCase() || '';

          if (analysisName.includes('capability')) {
            analysisData.capabilityHeatmap = analysisResult;
          } else if (analysisName.includes('swot')) {
            analysisData.swot = analysisResult;
          } else if (analysisName.includes('customer')) {
            analysisData.customerSegmentation = analysisResult;
          } else if (analysisName.includes('purchase')) {
            analysisData.purchaseCriteria = analysisResult;
          } else if (analysisName.includes('channel')) {
            analysisData.channelHeatmap = analysisResult;
          } else if (analysisName.includes('loyalty')) {
            analysisData.loyaltyNPS = analysisResult;
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

  // Get selected business name for display
  const getSelectedBusinessName = () => {
    if (selectedBusiness === 'all') return 'All Businesses';
    const business = businesses.find(b => b._id === selectedBusiness);
    return business ? business.business_name : 'Unknown Business';
  };

  return (
    <div className="user-details-panel">
      <div className="panel-header">
        <div className="user-header-info">
          <div>
            <h3>{user?.name}</h3>
            <p>{user?.email}</p>
          </div>
        </div>
        <div className="panel-actions">
          <PDFExportComponent 
            user={user}
            userDetails={currentUserDetails}
            onToast={onToast}
            buttonText="Export PDF"
            buttonSize="medium"
            className="pdf-export-btn"
          />
          
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Business Filter Dropdown */}
      {businesses.length > 0 && (
        <div className="business-filter-section">
          <div className="business-filter-container">
            <label htmlFor="business-select" className="business-filter-label">
              <Building2 size={16} />
              View data for:
            </label>
            <select
              id="business-select"
              value={selectedBusiness}
              onChange={(e) => handleBusinessChange(e.target.value)}
              className="business-filter-select"
              disabled={isLoadingBusiness}
            >
              <option value="all">All Businesses ({businesses.length})</option>
              {businesses.map(business => (
                <option key={business._id} value={business._id}>
                  {business.business_name}
                  {business.question_statistics && (
                    ` (${business.question_statistics.progress_percentage}% complete)`
                  )}
                </option>
              ))}
            </select>
            {isLoadingBusiness && (
              <div className="business-loading">
                <Loader size={16} className="loading-spinner" />
              </div>
            )}
          </div>
          
          {selectedBusiness !== 'all' && (
            <div className="selected-business-info">
              <div className="business-info-card">
                <h4>{getSelectedBusinessName()}</h4>
                {(() => {
                  const business = businesses.find(b => b._id === selectedBusiness);
                  return business ? (
                    <div className="business-details">
                      <p><strong>Purpose:</strong> {business.business_purpose}</p>
                      {business.description && (
                        <p><strong>Description:</strong> {business.description}</p>
                      )}
                      {business.question_statistics && (
                        <div className="business-stats-mini">
                          <span className="stat-mini">
                            {business.question_statistics.completed_questions}/
                            {business.question_statistics.total_questions} questions
                          </span>
                          <span className="stat-mini">
                            {business.question_statistics.progress_percentage}% complete
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="admin-nav">
        <button
          onClick={() => setActiveTab('conversation')}
          className={`nav-tab ${activeTab === 'conversation' ? 'active' : ''}`}
          disabled={isLoading || isLoadingBusiness}
        >
          <FileText size={16} />
          <span>Conversation</span>
          {conversationCount > 0 && (
            <span className="tab-badge">{conversationCount}</span>
          )}
        </button>

        {hasAnalysis && (
          <button
            onClick={() => setActiveTab('analysis')}
            className={`nav-tab ${activeTab === 'analysis' ? 'active' : ''}`}
            disabled={isLoading || isLoadingBusiness}
          >
            <Target size={16} />
            <span>Analysis</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('businesses')}
          className={`nav-tab ${activeTab === 'businesses' ? 'active' : ''}`}
          disabled={isLoading}
        >
          <Building2 size={16} />
          <span>Businesses</span>
          <span className="tab-badge">{businesses.length}</span>
        </button>
      </div>

      <div className="tab-content">
        {(isLoading || isLoadingBusiness) ? (
          <div className="loading-details">
            <Loader size={24} className="loading-spinner" />
            <span>
              {isLoadingBusiness ? 'Loading business data...' : 'Loading user data...'}
            </span>
          </div>
        ) : (
          <>
            {activeTab === 'conversation' && (
              <ConversationTab 
                conversation={currentUserDetails?.conversation || []} 
                totalQuestions={currentUserDetails?.stats?.total_questions || 0}
                completedQuestions={currentUserDetails?.stats?.completed_questions || 0}
                selectedBusiness={getSelectedBusinessName()}
              />
            )}
            {activeTab === 'analysis' && hasAnalysis && (
              <AnalysisTab 
                analysisData={analysisData} 
                selectedBusiness={getSelectedBusinessName()}
              />
            )}
            {activeTab === 'businesses' && (
              <BusinessesTab businesses={businesses} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// New BusinessesTab Component
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
          <div key={index} className="business-item">
            <div className="business-header">
              <h4 className="business-name">{business.business_name}</h4>
              <span className="business-date">{formatDate(business.created_at)}</span>
            </div>
            <div className="business-purpose">
              <strong>Purpose:</strong> {business.business_purpose}
            </div>
            {business.description && (
              <div className="business-description">
                <strong>Description:</strong> {business.description}
              </div>
            )}
            {business.question_statistics && (
              <div className="business-stats">
                <div className="stat-item">
                  <span className="stat-label">Progress:</span>
                  <span className="stat-value">{business.question_statistics.progress_percentage}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completed:</span>
                  <span className="stat-value">{business.question_statistics.completed_questions}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total:</span>
                  <span className="stat-value">{business.question_statistics.total_questions}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Updated AnalysisTab Component with business context
const AnalysisTab = ({ analysisData, selectedBusiness = 'All Businesses' }) => {
  if (!analysisData) {
    return (
      <div className="empty-state">
        <Target size={48} />
        <p className="empty-title">No analysis available</p>
        <p className="empty-subtitle">
          {selectedBusiness !== 'All Businesses' 
            ? `No analysis found for ${selectedBusiness}`
            : 'This user hasn\'t generated any business analysis yet'
          }
        </p>
      </div>
    );
  }

  const hasAnyAnalysis = analysisData.swot || analysisData.customerSegmentation || 
    analysisData.purchaseCriteria || analysisData.channelHeatmap || 
    analysisData.loyaltyNPS || analysisData.capabilityHeatmap;

  if (!hasAnyAnalysis) {
    return (
      <div className="empty-state">
        <Target size={48} />
        <p className="empty-title">No analysis available</p>
        <p className="empty-subtitle">
          {selectedBusiness !== 'All Businesses' 
            ? `No analysis generated for ${selectedBusiness} yet`
            : 'This user hasn\'t generated any business analysis yet'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="analysis-tab">
      <div className="business-context">
        <span className="context-label">Analysis for:</span>
        <span className="context-value">{selectedBusiness}</span>
      </div>
      
      <div className="analysis-components">
        {/* SWOT Analysis */}
        {analysisData.swot && (
          <div className="analysis-component">
            <SwotAnalysis
              analysisResult={analysisData.swot}
              businessName={analysisData.businessName}
              onRegenerate={null}
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
              onDataGenerated={() => { }}
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
              onDataGenerated={() => { }}
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
              onDataGenerated={() => { }}
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
              onDataGenerated={() => { }}
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
              onDataGenerated={() => { }}
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

// ConversationTab Component - Updated to show business context
const ConversationTab = ({ conversation, totalQuestions = 0, completedQuestions = 0, selectedBusiness = 'All Businesses' }) => {
  if (conversation.length === 0) {
    return (
      <div className="empty-state">
        <FileText size={48} />
        <p className="empty-title">No completed conversations</p>
        <p className="empty-subtitle">
          {selectedBusiness !== 'All Businesses' 
            ? `No completed questions found for ${selectedBusiness}`
            : `This user has ${completedQuestions} out of ${totalQuestions} questions completed across all businesses`
          }
        </p>
        {completedQuestions === 0 && (
          <p className="empty-help">Questions will appear here once the user completes them</p>
        )}
      </div>
    );
  }

  // Calculate total completed questions across all phases
  const totalCompletedQuestions = conversation.reduce((sum, phase) => sum + phase.questions.length, 0);

  return (
    <div className="conversation-tab">
      {/* Stats Header */}
      <div className="conversation-stats">
        <div className="business-context">
          <span className="context-label">Viewing:</span>
          <span className="context-value">{selectedBusiness}</span>
        </div>
        
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-number">{totalCompletedQuestions}</div>
            <div className="stat-label">Completed Questions</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{conversation.length}</div>
            <div className="stat-label">Active Phases</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {totalQuestions > 0 ? Math.round((totalCompletedQuestions / totalQuestions) * 100) : 0}%
            </div>
            <div className="stat-label">Progress</div>
          </div>
        </div>
      </div>

      <div className="conversation-list">
        {conversation.map((phase, index) => (
          <div key={index} className="conversation-phase">
            <div className="phase-header">
              <h4 className="phase-title">
                {phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1)} Phase
              </h4>
              <div className="phase-meta">
                <span className="phase-severity">{phase.severity}</span>
                <span className="question-count">{phase.questions.length} questions</span>
              </div>
            </div>

            <div className="questions-list">
              {phase.questions && phase.questions.map((question, qIndex) => (
                <div key={qIndex} className="question-item">
                  <div className="question-header">
                    <div className="question-text">{question.question}</div>
                    {question.last_updated && (
                      <div className="question-timestamp">
                        {formatDate(question.last_updated)}
                      </div>
                    )}
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
              className={`pagination-number ${number === currentPage ? 'active' : ''
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
    </div>
  );
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
 