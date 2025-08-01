import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
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
  Bot
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils'; // Import the utility function
import '../styles/UserHistory.css';

const UserHistory = ({ onToast }) => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [isLoadingDetails, setIsLoadingDetails] = useState({});
  const [userRole, setUserRole] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

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
      setIsLoadingDetails(prev => ({ ...prev, [userId]: true }));
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
      setIsLoadingDetails(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUserExpand = (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
      loadUserHistory(userId);
    }
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
        <div className="user-count-badge">
          <span>{filteredUsers.length} users with history</span>
        </div>
      </div>

      {/* Filters */}
      <div className="user-history-filters">
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
      </div>

      {/* User History List */}
      <div className="user-history-list">
        {filteredUsers.map(user => (
          <UserHistoryCard
            key={user._id}
            user={user}
            isExpanded={expandedUser === user._id}
            onExpand={() => handleUserExpand(user._id)}
            userDetails={userDetails[user._id]}
            isLoadingDetails={isLoadingDetails[user._id]}
            onExport={() => exportUserData(user._id, user.name)}
          />
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="no-users-message">
          <Users size={48} className="no-users-icon" />
          <h3 className="no-users-title">No User History Found</h3>
          <p className="no-users-subtitle">No users with chat history or activity found for the selected criteria</p>
        </div>
      )}
    </div>
  );
};

// UserHistoryCard Component
const UserHistoryCard = ({ 
  user, 
  isExpanded, 
  onExpand, 
  userDetails, 
  isLoadingDetails,
  onExport 
}) => {
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

  return (
    <div className="user-history-card">
      <div className="user-card-header" onClick={onExpand}>
        <div className="user-info-section">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="user-details">
            <div className="user-name-section">
              <h3 className="user-name">{user.name}</h3>
              <span className={`role-badge ${getRoleBadgeClass(user.role?.role_name)}`}>
                {formatRoleName(user.role?.role_name || 'Unknown')}
              </span>
            </div>
            
            <p className="user-email">{user.email}</p>
            
            <div className="user-meta">
              <div className="meta-item">
                <Building2 size={14} />
                <span>{user.company?.company_name || 'No Company'}</span>
              </div>
              <div className="meta-item">
                <Calendar size={14} />
                <span>Joined {formatDate(user.created_at)}</span>
              </div>
              {user.last_login && (
                <div className="meta-item">
                  <Activity size={14} />
                  <span>Last seen {formatDate(user.last_login)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="user-stats-section">
          <div className="activity-stats">
            <div className="stat-item">
              <div className="stat-value">
                <MessageSquare size={14} />
                <span>{user.activity_summary?.total_answers || 0}</span>
              </div>
              <div className="stat-label">Answers</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                <Hash size={14} />
                <span>{user.activity_summary?.total_chat_messages || 0}</span>
              </div>
              <div className="stat-label">Messages</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                <Clock size={14} />
                <span>{user.activity_summary?.total_sessions || 0}</span>
              </div>
              <div className="stat-label">Sessions</div>
            </div>
          </div>
          
          <div className="expand-icon">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="user-expanded-content">
          {isLoadingDetails ? (
            <div className="loading-details">
              <Loader size={16} className="loading-spinner" />
              <span>Loading detailed history...</span>
            </div>
          ) : userDetails ? (
            <UserHistoryContent userDetails={userDetails} onExport={onExport} />
          ) : (
            <div className="no-details">
              <p>No detailed history data available for this user</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// UserHistoryContent Component
const UserHistoryContent = ({ userDetails, onExport }) => {
  const [activeTab, setActiveTab] = useState('chat');

  const tabs = [
    { id: 'chat', label: 'Chat History', count: userDetails.chat_history?.length || 0, icon: MessageSquare },
    { id: 'answers', label: 'Answers', count: userDetails.answers?.length || 0, icon: Hash },
    { id: 'sessions', label: 'Sessions', count: userDetails.sessions?.length || 0, icon: Clock },
    { id: 'results', label: 'Results', count: userDetails.phase_results?.length || 0, icon: Award }
  ];

  return (
    <div className="user-history-content">
      <div className="content-header">
        <div className="activity-summary">
          <strong>Total Activity:</strong> {userDetails.summary?.total_chat_messages || 0} messages, 
          {' '}{userDetails.summary?.total_answers || 0} answers, 
          {' '}{userDetails.summary?.total_sessions || 0} sessions
        </div>
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
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span className="tab-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      <div className="tab-content">
        {activeTab === 'chat' && <ChatHistory chatHistory={userDetails.chat_history || []} />}
        {activeTab === 'answers' && <AnswersHistory answers={userDetails.answers || []} />}
        {activeTab === 'sessions' && <SessionsHistory sessions={userDetails.sessions || []} />}
        {activeTab === 'results' && <ResultsHistory results={userDetails.phase_results || []} />}
      </div>
    </div>
  );
};

// ChatHistory Component
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

// AnswersHistory Component
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

// SessionsHistory Component
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

// ResultsHistory Component
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

export default UserHistory;