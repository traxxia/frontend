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

  // Enhanced export function that exports complete data shown in panels
  const exportUserData = async (userId, userName) => {
    try {
      const token = getAuthToken();
      
      // Get the user details that are currently loaded
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
          joinedDate: currentUser?.created_at,
          lastLogin: currentUser?.last_login
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

      // Parse and organize analysis data for better readability
      const organizedAnalyses = {};
      
      if (currentUserDetails.system) {
        currentUserDetails.system.forEach(result => {
          try {
            let analysisResult;
            
            // Parse the analysis result
            if (typeof result.analysis_result === 'string') {
              try {
                analysisResult = JSON.parse(result.analysis_result);
              } catch (e) {
                analysisResult = result.analysis_result;
              }
            } else {
              analysisResult = result.analysis_result;
            }

            // Organize by analysis type
            const analysisName = result.name?.toLowerCase() || '';
            let analysisType = 'other';
            
            if (analysisName.includes('swot')) {
              analysisType = 'swotAnalysis';
            } else if (analysisName.includes('customersegmentation')) {
              analysisType = 'customerSegmentation';
            } else if (analysisName.includes('purchasecriteria')) {
              analysisType = 'purchaseCriteria';
            } else if (analysisName.includes('channelheatmap')) {
              analysisType = 'channelHeatmap';
            } else if (analysisName.includes('loyaltynps')) {
              analysisType = 'loyaltyNPS';
            } else if (analysisName.includes('capabilityheatmap')) {
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

      // Add organized analyses to export data
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

      // Convert to JSON and create downloadable file
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
              userDetails={userDetails[selectedUser]}
              isLoading={isLoadingDetails}
              onClose={() => setSelectedUser(null)}
              onExport={() => exportUserData(selectedUser, users.find(u => u._id === selectedUser)?.name)}
              onToast={onToast}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced UserDetailsPanel Component with Analysis Support
const UserDetailsPanel = ({ user, userDetails, isLoading, onClose, onExport, onToast }) => {
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

          // Use the 'name' field to determine analysis type
          const analysisName = result.name?.toLowerCase() || '';

          if (analysisName.includes('capabilityheatmap')) {
            console.log('🔥 Found CAPABILITYHEATMAP data:', analysisResult);
            analysisData.capabilityHeatmap = analysisResult;
          }
          else if (analysisName.includes('swot')) {
            console.log('🔥 Found SWOT data:', analysisResult);
            analysisData.swot = analysisResult;
          }
          else if (analysisName.includes('customersegmentation')) {
            console.log('🔥 Found CUSTOMERSEGMENTATION data:', analysisResult);
            analysisData.customerSegmentation = analysisResult;
          }
          else if (analysisName.includes('purchasecriteria')) {
            console.log('🔥 Found PURCHASECRITERIA data:', analysisResult);
            analysisData.purchaseCriteria = analysisResult;
          }
          else if (analysisName.includes('channelheatmap')) {
            console.log('🔥 Found CHANNELHEATMAP data:', analysisResult);
            analysisData.channelHeatmap = analysisResult;
          }
          else if (analysisName.includes('loyaltynps')) {
            console.log('🔥 Found LOYALTYNPS data:', analysisResult);
            analysisData.loyaltyNPS = analysisResult;
          }
          else {
            // Fallback: try to detect by content structure
            if (typeof analysisResult === 'string') {
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
              // Detect Capability Heatmap - FIXED DETECTION
              else if (analysisResult.capabilities || analysisResult.capabilityHeatmap ||
                analysisResult.capability_matrix || analysisResult.maturityScale) {
                console.log('🔥 Found capability heatmap by structure:', analysisResult);
                analysisData.capabilityHeatmap = analysisResult;
              }
            }
          }

        } catch (error) {
          console.error('Error parsing analysis result:', error);
        }
      });
    }

    console.log('🔍 Final analysisData:', analysisData);
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
          </div>
        </div>
        <div className="panel-actions">
          {/* JSON Export Button */}
          {/* <button onClick={onExport} className="export-button">
            <Download size={16} />
            <span>Export JSON</span>
          </button> */}
          
          {/* PDF Export Component */}
          <PDFExportComponent 
            user={user}
            userDetails={userDetails}
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

      <div className="admin-nav">
        <button
          onClick={() => setActiveTab('conversation')}
          className={`nav-tab ${activeTab === 'conversation' ? 'active' : ''}`}
          disabled={isLoading}
        >
          <FileText size={16} />
          <span>Conversation</span>
        </button>

        {hasAnalysis && (
          <button
            onClick={() => setActiveTab('analysis')}
            className={`nav-tab ${activeTab === 'analysis' ? 'active' : ''}`}
            disabled={isLoading}
          >
            <Target size={16} />
            <span>Analysis</span>
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