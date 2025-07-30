import React, { useState, useEffect } from 'react';
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
  Download
} from 'lucide-react';

const UserHistory = ({ onToast }) => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [isLoadingDetails, setIsLoadingDetails] = useState({});

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const getAuthToken = () => sessionStorage.getItem('token');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [selectedCompany]);

  const loadInitialData = async () => {
    try {
      const token = getAuthToken();

      // Load companies for filter
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

      await loadUsers();
    } catch (error) {
      console.error('Error loading initial data:', error);
      onToast('Error loading data', 'error');
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      let url = `${API_BASE_URL}/api/company-admin/users`;
      if (selectedCompany) {
        url += `?company_id=${selectedCompany}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out admin users, only show regular users who can answer questions
        const regularUsers = data.users.filter(user => 
          user.role?.role_name === 'answerer_user' || user.role?.role_name === 'viewer_user'
        );
        setUsers(regularUsers);
      } else {
        onToast('Failed to load users', 'error');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      onToast('Error loading users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserHistory = async (userId) => {
    if (userDetails[userId]) return; // Already loaded

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
        a.download = `${userName.replace(/\s+/g, '_')}_responses.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        onToast(`Exported data for ${userName}`, 'success');
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
      <div className="loading-container">
        <Loader size={24} className="spinner" />
        <span>Loading user history...</span>
      </div>
    );
  }

  return (
    <div className="user-history">
      <div className="section-header">
        <h2>User History & Responses</h2>
        <div className="header-stats">
          <span className="stat-item">
            <strong>{filteredUsers.length}</strong> users with responses
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="">All Companies</option>
            {companies.map(company => (
              <option key={company._id} value={company._id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </div>
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
        <div className="empty-state">
          <Users size={48} />
          <h3>No User History Found</h3>
          <p>No users with question responses found for the selected criteria</p>
        </div>
      )}
    </div>
  );
};
export default UserHistory;
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
      case 'answerer_user': return 'role-answerer';
      case 'viewer_user': return 'role-viewer';
      default: return 'role-default';
    }
  };

  const formatRoleName = (roleName) => {
    return roleName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="user-history-card">
      <div className="user-history-header" onClick={onExpand}>
        <div className="user-info-section">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <h3>{user.name}</h3>
            <p className="user-email">{user.email}</p>
            <div className="user-meta">
              <span className={`role-badge ${getRoleBadgeClass(user.role?.role_name)}`}>
                {formatRoleName(user.role?.role_name || 'Unknown')}
              </span>
              <div className="company-info">
                <Building2 size={12} />
                <span>{user.company?.company_name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="user-stats-section">
          {userDetails && (
            <div className="quick-stats">
              <div className="stat-item">
                <MessageSquare size={14} />
                <span>{userDetails.summary?.total_answers || 0} answers</span>
              </div>
              <div className="stat-item">
                <Award size={14} />
                <span>{userDetails.summary?.completed_phases || 0} phases</span>
              </div>
              <div className="stat-item">
                <Clock size={14} />
                <span>{userDetails.summary?.total_sessions || 0} sessions</span>
              </div>
            </div>
          )}
          
          <div className="expand-button">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="user-history-details">
          {isLoadingDetails ? (
            <div className="loading-details">
              <Loader size={16} className="spinner" />
              <span>Loading user history...</span>
            </div>
          ) : userDetails ? (
            <UserHistoryContent userDetails={userDetails} onExport={onExport} />
          ) : (
            <div className="no-details">
              <p>No history data available for this user</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// UserHistoryContent Component
const UserHistoryContent = ({ userDetails, onExport }) => {
  const [activeHistoryTab, setActiveHistoryTab] = useState('answers');

  return (
    <div className="user-history-content">
      {/* Export Button */}
      <div className="history-actions">
        <button className="export-btn" onClick={onExport}>
          <Download size={14} />
          Export User Data
        </button>
      </div>

      {/* History Navigation */}
      <div className="history-nav">
        <button 
          className={`history-tab ${activeHistoryTab === 'answers' ? 'active' : ''}`}
          onClick={() => setActiveHistoryTab('answers')}
        >
          Answers ({userDetails.answers?.length || 0})
        </button>
        <button 
          className={`history-tab ${activeHistoryTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveHistoryTab('results')}
        >
          Phase Results ({userDetails.phase_results?.length || 0})
        </button>
        <button 
          className={`history-tab ${activeHistoryTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveHistoryTab('sessions')}
        >
          Sessions ({userDetails.sessions?.length || 0})
        </button>
      </div>

      {/* History Content */}
      <div className="history-content">
        {activeHistoryTab === 'answers' && (
          <AnswersHistory answers={userDetails.answers || []} />
        )}
        {activeHistoryTab === 'results' && (
          <ResultsHistory results={userDetails.phase_results || []} />
        )}
        {activeHistoryTab === 'sessions' && (
          <SessionsHistory sessions={userDetails.sessions || []} />
        )}
      </div>
    </div>
  );
};

// AnswersHistory Component
const AnswersHistory = ({ answers }) => {
  if (answers.length === 0) {
    return (
      <div className="empty-history">
        <MessageSquare size={24} />
        <p>No answers recorded yet</p>
      </div>
    );
  }

  return (
    <div className="answers-history">
      {answers.map((answer, index) => (
        <div key={answer._id || index} className="answer-item">
          <div className="answer-header">
            <div className="question-info">
              <span className="question-number">Q{answer.global_question?.question_id}</span>
              <span className={`phase-badge ${answer.phase}`}>{answer.phase}</span>
            </div>
            <div className="answer-meta">
              <span className="answered-date">
                {new Date(answer.answered_at).toLocaleDateString()}
              </span>
              <span className="attempts">
                {answer.attempt_count} attempt{answer.attempt_count > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <div className="question-text">
            <strong>Question:</strong> {answer.question_text}
          </div>
          
          <div className="answer-text">
            <strong>Answer:</strong> {answer.answer_text}
          </div>
          
          {answer.confidence_score && (
            <div className="confidence-score">
              <strong>Confidence:</strong> {Math.round(answer.confidence_score * 100)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ResultsHistory Component
const ResultsHistory = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="empty-history">
        <Award size={24} />
        <p>No phase results generated yet</p>
      </div>
    );
  }

  return (
    <div className="results-history">
      {results.map((result, index) => (
        <div key={result._id || index} className="result-item">
          <div className="result-header">
            <h4>{result.phase_name.charAt(0).toUpperCase() + result.phase_name.slice(1)} Phase Results</h4>
            <div className="result-meta">
              <span className="generated-date">
                {new Date(result.generated_at).toLocaleDateString()}
              </span>
              <span className={`quality-score quality-${getQualityLevel(result.quality_score)}`}>
                Quality: {result.quality_score}/100
              </span>
            </div>
          </div>
          
          <div className="result-content">
            {result.result_data && (
              <div className="result-summary">
                <p><strong>Completion:</strong> {result.result_data.completion_percentage || 0}%</p>
                <p><strong>Questions Answered:</strong> {result.result_data.total_questions || 0}</p>
                {result.result_data.insights && (
                  <p><strong>Insights:</strong> {result.result_data.insights}</p>
                )}
              </div>
            )}
            
            {result.analysis_output && (
              <div className="analysis-output">
                <div className="analysis-summary">
                  <strong>Analysis Summary:</strong>
                  <p>{result.analysis_output.summary}</p>
                </div>
                
                {result.analysis_output.recommendations && (
                  <div className="recommendations">
                    <strong>Recommendations:</strong>
                    <ul>
                      {result.analysis_output.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// SessionsHistory Component
const SessionsHistory = ({ sessions }) => {
  if (sessions.length === 0) {
    return (
      <div className="empty-history">
        <Clock size={24} />
        <p>No sessions recorded yet</p>
      </div>
    );
  }

  return (
    <div className="sessions-history">
      {sessions.map((session, index) => (
        <div key={session._id || index} className="session-item">
          <div className="session-header">
            <div className="session-info">
              <span className="session-id">{session.session_id}</span>
              <span className={`session-status ${session.status}`}>
                {session.status}
              </span>
            </div>
            <div className="session-meta">
              <span className="session-phase">
                Phase: {session.current_phase}
              </span>
            </div>
          </div>
          
          <div className="session-details">
            <div className="session-timeline">
              <div className="timeline-item">
                <strong>Started:</strong> {new Date(session.started_at).toLocaleString()}
              </div>
              {session.last_activity && (
                <div className="timeline-item">
                  <strong>Last Activity:</strong> {new Date(session.last_activity).toLocaleString()}
                </div>
              )}
              {session.completedAt && (
                <div className="timeline-item">
                  <strong>Completed:</strong> {new Date(session.completedAt).toLocaleString()}
                </div>
              )}
            </div>
            
            {session.total_time_spent && (
              <div className="session-duration">
                <strong>Duration:</strong> {Math.round(session.total_time_spent)} minutes
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper function for quality score styling
const getQualityLevel = (score) => {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
};