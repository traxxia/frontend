import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Building2, Loader, Eye } from 'lucide-react';

const UserOverview = ({ onToast }) => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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
        setUsers(data.users);
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

  const loadUserDetails = async (userId) => {
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
        setUserDetails(data);
      } else {
        onToast('Failed to load user details', 'error');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      onToast('Error loading user details', 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    loadUserDetails(user._id);
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
        <span>Loading users...</span>
      </div>
    );
  }

  return (
    <div className="user-overview">
      <div className="section-header">
        <h2>All Users Overview</h2>
        <div className="header-stats">
          <span className="stat-item">
            <strong>{filteredUsers.length}</strong> users found
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

      {/* Users Grid */}
      <div className="users-grid">
        {filteredUsers.map(user => (
          <UserCard
            key={user._id}
            user={user}
            onView={handleViewUser}
          />
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <h3>No Users Found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          userDetails={userDetails}
          isLoading={isLoadingDetails}
          onClose={() => {
            setSelectedUser(null);
            setUserDetails(null);
          }}
        />
      )}
    </div>
  );
};
export default UserOverview;
// UserCard Component
const UserCard = ({ user, onView }) => {
  const getRoleBadgeClass = (roleName) => {
    switch (roleName) {
      case 'super_admin': return 'role-super-admin';
      case 'company_admin': return 'role-company-admin';
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
    <div className="user-card">
      <div className="user-header">
        <div className="user-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className={`status-badge ${user.status}`}>
          {user.status}
        </span>
      </div>

      <div className="user-info">
        <h3>{user.name}</h3>
        <p className="user-email">{user.email}</p>
        <span className={`role-badge ${getRoleBadgeClass(user.role?.role_name)}`}>
          {formatRoleName(user.role?.role_name || 'Unknown')}
        </span>
      </div>

      <div className="user-company">
        <Building2 size={14} />
        <span>{user.company?.company_name || 'No Company'}</span>
      </div>

      <div className="user-activity">
        <div className="activity-item">
          <span className="activity-label">Last Login:</span>
          <span className="activity-value">
            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
          </span>
        </div>
        <div className="activity-item">
          <span className="activity-label">Joined:</span>
          <span className="activity-value">
            {new Date(user.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="user-actions">
        <button 
          className="secondary-btn"
          onClick={() => onView(user)}
        >
          <Eye size={14} />
          View Details
        </button>
      </div>
    </div>
  );
};

// UserDetailsModal Component
const UserDetailsModal = ({ user, userDetails, isLoading, onClose }) => {
  if (isLoading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content large">
          <div className="loading-container">
            <Loader size={24} className="spinner" />
            <span>Loading user details...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>User Details - {user.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="user-details">
          {/* Basic Info */}
          <div className="details-section">
            <h4>Basic Information</h4>
            <div className="details-grid">
              <div className="detail-item">
                <label>Name</label>
                <span>{user.name}</span>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <span>{user.email}</span>
              </div>
              <div className="detail-item">
                <label>Role</label>
                <span>{user.role?.role_name?.replace('_', ' ') || 'Unknown'}</span>
              </div>
              <div className="detail-item">
                <label>Status</label>
                <span className={`status-badge ${user.status}`}>{user.status}</span>
              </div>
              <div className="detail-item">
                <label>Company</label>
                <span>{user.company?.company_name || 'No Company'}</span>
              </div>
              <div className="detail-item">
                <label>Last Login</label>
                <span>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</span>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          {userDetails && (
            <div className="details-section">
              <h4>Activity Summary</h4>
              <div className="activity-stats">
                <div className="stat-card">
                  <span className="stat-number">{userDetails.summary.total_sessions}</span>
                  <span className="stat-label">Total Sessions</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{userDetails.summary.total_answers}</span>
                  <span className="stat-label">Answers Given</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{userDetails.summary.completed_phases}</span>
                  <span className="stat-label">Phases Completed</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          {userDetails?.sessions && userDetails.sessions.length > 0 && (
            <div className="details-section">
              <h4>Recent Sessions</h4>
              <div className="sessions-list">
                {userDetails.sessions.slice(0, 5).map(session => (
                  <div key={session._id} className="session-item">
                    <div className="session-info">
                      <span className="session-id">{session.session_id}</span>
                      <span className={`session-status ${session.status}`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="session-details">
                      <span>Phase: {session.current_phase}</span>
                      <span>Started: {new Date(session.started_at).toLocaleDateString()}</span>
                      {session.last_activity && (
                        <span>Last Activity: {new Date(session.last_activity).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Answers Preview */}
          {userDetails?.answers && userDetails.answers.length > 0 && (
            <div className="details-section">
              <h4>Recent Answers ({userDetails.answers.length} total)</h4>
              <div className="answers-preview">
                {userDetails.answers.slice(0, 3).map(answer => (
                  <div key={answer._id} className="answer-item">
                    <div className="answer-question">
                      <strong>Q:</strong> {answer.question_text}
                    </div>
                    <div className="answer-text">
                      <strong>A:</strong> {answer.answer_text.substring(0, 150)}
                      {answer.answer_text.length > 150 && '...'}
                    </div>
                    <div className="answer-meta">
                      <span>Phase: {answer.phase}</span>
                      <span>Answered: {new Date(answer.answered_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};