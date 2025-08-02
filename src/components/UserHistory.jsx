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
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
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
  const [showHowModal, setShowHowModal] = useState(false);


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
          <p className="user-history-subtitle">
            {userRole === 'super_admin' ? 'All users across all companies' : 'Your company users'} with activity
          </p>
        </div>
        <div className="user-count-card">
  <div className="count-number">{filteredUsers.length}</div>
  <div className="count-label">Users with History</div>
</div>

      </div>

      {/* Filters */}
      {/* <div className="user-history-filters">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      
        {userRole === 'super_admin' && companies.length > 0 && (
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="company-select"
          >
            <option value="">All Companies</option>
            {companies.map((company) => (
              <option key={company._id} value={company._id}>
                {company.company_name}
              </option>
            ))}
          </select>
        )}
      </div> */}

      {/* Compact Search Only */}
{/* <div className="compact-search">
  <Search size={16} className="compact-search-icon" />
  <input
    type="text"
    placeholder="Search users..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div> */}

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

  <button className="info-btn" onClick={() => setShowHowModal(true)}>
    <Info size={18} /> How It Works
  </button>
</div>

{/* Popup Modal with Bootstrap Carousel */}
{showHowModal && (
  <div className="popup-overlay" onClick={() => setShowHowModal(false)}>
    <div className="popup-content large" onClick={(e) => e.stopPropagation()}>
      <h2 className="mb-3">How This Application Works</h2>

      <div id="howItWorksCarousel" className="carousel slide" data-bs-ride="carousel" data-bs-interval="3000">
        {/* Indicators */}
        <div className="carousel-indicators">
          <button type="button" data-bs-target="#howItWorksCarousel" data-bs-slide-to="0" className="active"></button>
          <button type="button" data-bs-target="#howItWorksCarousel" data-bs-slide-to="1"></button>
          <button type="button" data-bs-target="#howItWorksCarousel" data-bs-slide-to="2"></button>
        </div>

        {/* Slides */}
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img src="/slides/slide1.jpeg" className="d-block w-100" alt="Step 1" />
          </div>
          <div className="carousel-item">
            <img src="/slides/slide2.jpeg" className="d-block w-100" alt="Step 2" />
          </div>
          <div className="carousel-item">
            <img src="/slides/slide3.jpeg" className="d-block w-100" alt="Step 3" />
          </div>
        </div>

        {/* Navigation Arrows */}
        <button className="carousel-control-prev" type="button" data-bs-target="#howItWorksCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon"></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#howItWorksCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </div>
  </div>
)}





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
        <th onClick={() => requestSort('last_login')}>
          <div className="header-content">
            Last Activity
            {sortConfig.key === 'last_login' && (
              <span className="sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </th>
        <th onClick={() => requestSort('activity')}>
          <div className="header-content">
            Activity
            {sortConfig.key === 'activity' && (
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
          <td>
            {user.last_login ? (
              <div className="last-login">
                {formatDate(user.last_login)}
                <span className="time-ago">{getTimeAgo(user.last_login)}</span>
              </div>
            ) : 'Never'}
          </td>
          <td>
            <div className="activity-inline">
              <span title="Answers"><MessageSquare size={14} /> {user.activity_summary?.total_answers || 0}</span>
              <span title="Messages"><Hash size={14} /> {user.activity_summary?.total_chat_messages || 0}</span>
              <span title="Sessions"><Clock size={14} /> {user.activity_summary?.total_sessions || 0}</span>
            </div>
          </td>
          <td className="cell-actions">
            <button className="secondary-btn small-btn" onClick={() => handleUserSelect(user._id)}>View</button>
            <button className="btn-secondary" onClick={() => exportUserData(user._id, user.name)}>
              <Download size={14} />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


      

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

// UserDetailsPanel Component
const UserDetailsPanel = ({ user, userDetails, isLoading, onClose, onExport }) => {
  const [activeTab, setActiveTab] = useState('chat');

  const tabs = [
    { id: 'chat', label: 'Chat History', count: userDetails?.chat_history?.length || 0, icon: MessageSquare },
    { id: 'answers', label: 'Answers', count: userDetails?.answers?.length || 0, icon: Hash },
    { id: 'sessions', label: 'Sessions', count: userDetails?.sessions?.length || 0, icon: Clock },
    { id: 'results', label: 'Results', count: userDetails?.phase_results?.length || 0, icon: Award }
  ];

  return (
    <div className="user-details-panel">
      <div className="panel-header">
        <div className="user-header-info">
          <div className="user-avatar large">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3>{user?.name}</h3>
            <p className="user-email">{user?.email}</p>
            <div className="user-meta">
              <span className={`role-badge ${getRoleBadgeClass(user?.role?.role_name)}`}>
                {formatRoleName(user?.role?.role_name || 'Unknown')}
              </span>
              <span className="company-badge">
                <Building2 size={14} />
                {user?.company?.company_name || 'No Company'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="close-button">
          <X size={20} />
        </button>
      </div>
      
      <div className="activity-summary">
        <strong>Total Activity:</strong> {userDetails?.summary?.total_chat_messages || 0} messages, 
        {' '}{userDetails?.summary?.total_answers || 0} answers, 
        {' '}{userDetails?.summary?.total_sessions || 0} sessions
        <button onClick={onExport} className="export-button">
          <Download size={14} />
          <span>Export All Data</span>
        </button>
      </div>

      <div className="tab-navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              disabled={isLoading}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
            </button>
          );
        })}
      </div>

      <div className="tab-content">
        {isLoading ? (
          <div className="loading-details">
            <Loader size={24} className="loading-spinner" />
            <span>Loading detailed history...</span>
          </div>
        ) : (
          <>
            {activeTab === 'chat' && <ChatHistory chatHistory={userDetails?.chat_history || []} />}
            {activeTab === 'answers' && <AnswersHistory answers={userDetails?.answers || []} />}
            {activeTab === 'sessions' && <SessionsHistory sessions={userDetails?.sessions || []} />}
            {activeTab === 'results' && <ResultsHistory results={userDetails?.phase_results || []} />}
          </>
        )}
      </div>
    </div>
  );
};

// ChatHistory Component (same as before)
const ChatHistory = ({ chatHistory }) => {
  if (chatHistory.length === 0) {
    return (
      <div className="empty-state">
        <MessageSquare size={48} />
        <p className="empty-title">No chat history</p>
        <p className="empty-subtitle">This user hasn't engaged in any conversations yet</p>
      </div>
    );
  }

  return (
    <div className="chat-history">
      <div className="chat-messages">
        {chatHistory.map((message, index) => (
          <div key={message._id || index} className="chat-message">
            <div className={`message-avatar ${message.message_type}`}>
              {message.message_type === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className="message-content">
              <div className="message-header">
                <span className="message-type">{message.message_type}</span>
                <span className="message-time">
                  {formatDate(message.timestamp)} {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                {message.question_id && (
                  <span className="question-id">Q{message.question_id}</span>
                )}
              </div>
              
              <div className={`message-text ${message.message_type}`}>
                <p>{message.message_text}</p>
              </div>
              
              {message.metadata && Object.keys(message.metadata).length > 0 && (
                <div className="message-metadata">
                  <strong>Metadata:</strong> {JSON.stringify(message.metadata)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// AnswersHistory Component (same as before)
const AnswersHistory = ({ answers }) => {
  if (answers.length === 0) {
    return (
      <div className="empty-state">
        <Hash size={48} />
        <p className="empty-title">No answers recorded</p>
        <p className="empty-subtitle">This user hasn't answered any questions yet</p>
      </div>
    );
  }

  return (
    <div className="answers-history">
      <div className="answers-list">
        {answers.map((answer, index) => (
          <div key={answer._id || index} className="answer-item">
            <div className="answer-header">
              <div className="answer-badges">
                <span className="question-badge">Q{answer.question_id}</span>
                {answer.phase && (
                  <span className={`phase-badge ${answer.phase}`}>
                    {answer.phase}
                  </span>
                )}
                {answer.is_followup && (
                  <span className="followup-badge">Follow-up</span>
                )}
              </div>
              
              <div className="answer-meta">
                <span>{formatDate(answer.answered_at)}</span>
                <span>{answer.attempt_count} attempt{answer.attempt_count > 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <div className="question-section">
              <div className="section-label">Question:</div>
              <div className="question-text">{answer.question_text}</div>
            </div>
            
            <div className="answer-section">
              <div className="section-label">Answer:</div>
              <div className="answer-text">{answer.answer_text}</div>
            </div>
            
            {answer.confidence_score && (
              <div className="confidence-section">
                <span className="confidence-label">Confidence:</span>
                <div className="confidence-bar">
                  <div className="confidence-track">
                    <div 
                      className="confidence-fill" 
                      style={{ width: `${answer.confidence_score * 100}%` }}
                    ></div>
                  </div>
                  <span className="confidence-value">
                    {Math.round(answer.confidence_score * 100)}%
                  </span>
                </div>
              </div>
            )}

            {answer.related_chat_messages && answer.related_chat_messages.length > 0 && (
              <div className="related-messages">
                <div className="section-label">
                  Related Chat Messages ({answer.related_chat_messages.length})
                </div>
                <div className="related-list">
                  {answer.related_chat_messages.map((chat, idx) => (
                    <div key={idx} className="related-message">
                      <span className="message-sender">{chat.message_type}:</span> 
                      {chat.message_text.substring(0, 100)}
                      {chat.message_text.length > 100 && '...'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// SessionsHistory Component (same as before)
const SessionsHistory = ({ sessions }) => {
  if (sessions.length === 0) {
    return (
      <div className="empty-state">
        <Clock size={48} />
        <p className="empty-title">No sessions recorded</p>
        <p className="empty-subtitle">This user hasn't started any sessions yet</p>
      </div>
    );
  }

  return (
    <div className="sessions-history">
      <div className="sessions-list">
        {sessions.map((session, index) => (
          <div key={session._id || index} className="session-item">
            <div className="session-header">
              <div className="session-info">
                <span className="session-id">{session.session_id}</span>
                <span className={`session-status ${session.status}`}>
                  {session.status}
                </span>
              </div>
              
              {session.current_phase && (
                <span className="current-phase">Phase: {session.current_phase}</span>
              )}
            </div>
            
            <div className="session-details">
              <div className="session-time">
                <div className="time-label">Started</div>
                <div className="time-value">
                  {formatDate(session.started_at)} {new Date(session.started_at).toLocaleTimeString()}
                </div>
              </div>
              
              {session.last_activity && (
                <div className="session-time">
                  <div className="time-label">Last Activity</div>
                  <div className="time-value">
                    {formatDate(session.last_activity)} {new Date(session.last_activity).toLocaleTimeString()}
                  </div>
                </div>
              )}
              
              {session.completedAt && (
                <div className="session-time">
                  <div className="time-label">Completed</div>
                  <div className="time-value">
                    {formatDate(session.completedAt)} {new Date(session.completedAt).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
            
            {session.total_time_spent && (
              <div className="session-duration">
                <span className="duration-label">Duration: </span>
                <span className="duration-value">
                  {Math.round(session.total_time_spent)} minutes
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ResultsHistory Component (same as before)
const ResultsHistory = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="empty-state">
        <Award size={48} />
        <p className="empty-title">No phase results</p>
        <p className="empty-subtitle">No analysis results have been generated yet</p>
      </div>
    );
  }

  const getQualityClass = (score) => {
    if (score >= 80) return 'quality-excellent';
    if (score >= 60) return 'quality-good';
    if (score >= 40) return 'quality-fair';
    return 'quality-poor';
  };

  return (
    <div className="results-history">
      <div className="results-list">
        {results.map((result, index) => (
          <div key={result._id || index} className="result-item">
            <div className="result-header">
              <h4 className="result-title">
                {result.phase_name?.charAt(0).toUpperCase() + result.phase_name?.slice(1)} Phase Results
              </h4>
              <div className="result-meta">
                <span className="result-date">
                  {formatDate(result.generated_at)}
                </span>
                {result.quality_score && (
                  <span className={`quality-badge ${getQualityClass(result.quality_score)}`}>
                    Quality: {result.quality_score}/100
                  </span>
                )}
              </div>
            </div>
            
            {result.result_data && (
              <div className="result-data">
                <div className="data-metrics">
                  <div className="metric">
                    <span className="metric-label">Completion: </span>
                    <span className="metric-value">{result.result_data.completion_percentage || 0}%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Questions: </span>
                    <span className="metric-value">{result.result_data.total_questions || 0}</span>
                  </div>
                </div>
                {result.result_data.insights && (
                  <div className="insights-section">
                    <div className="section-label">Insights:</div>
                    <p className="insights-text">{result.result_data.insights}</p>
                  </div>
                )}
              </div>
            )}
            
            {result.analysis_output && (
              <div className="analysis-output">
                {result.analysis_output.summary && (
                  <div className="summary-section">
                    <div className="section-label">Analysis Summary:</div>
                    <p className="summary-text">{result.analysis_output.summary}</p>
                  </div>
                )}
                
                {result.analysis_output.recommendations && result.analysis_output.recommendations.length > 0 && (
                  <div className="recommendations-section">
                    <div className="section-label">Recommendations:</div>
                    <ul className="recommendations-list">
                      {result.analysis_output.recommendations.map((rec, idx) => (
                        <li key={idx} className="recommendation-item">
                          <span className="recommendation-bullet"></span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
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