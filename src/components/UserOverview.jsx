import React, { useState, useEffect } from 'react';
import { Users, Search, Loader, Plus } from 'lucide-react';
import { formatDate } from '../utils/dateUtils'; // Import the utility function

const UserOverview = ({ onToast }) => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role_name: 'answerer_user', // Always answerer_user
    company_id: '', 
    profile: {} 
  });

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

      // Load companies and roles in parallel
      const [companiesResponse, rolesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/super-admin/companies`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/roles`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData.companies);
      }

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        // Filter roles to only show user roles (not admin roles)
        const userRoles = rolesData.roles.filter(role => 
          ['viewer_user', 'answerer_user'].includes(role.role_name)
        );
        setRoles(userRoles);
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
      let url = `${API_BASE_URL}/api/admin/users`;

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

  const addUser = async () => {
    try {
      setIsCreating(true);
      const token = getAuthToken();

      const payload = { ...newUser };
      if (!payload.name || !payload.email || !payload.password) {
        onToast('Please fill in all required fields', 'warning');
        return;
      }

      // Remove company_id if empty (let backend handle it based on user role)
      if (!payload.company_id) {
        delete payload.company_id;
      }

      const response = await fetch(`${API_BASE_URL}/api/company-admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        onToast('User created successfully', 'success');
        setShowAddUser(false);
        setNewUser({ 
          name: '', 
          email: '', 
          password: '', 
          role_name: 'answerer_user', 
          company_id: '', 
          profile: {} 
        });
        await loadUsers();
      } else {
        onToast(data.message || 'User creation failed', 'error');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      onToast('Error creating user', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleChange = (field, value) => {
    if (field.startsWith('profile.')) {
      const profileField = field.replace('profile.', '');
      setNewUser(prev => ({
        ...prev,
        profile: { ...prev.profile, [profileField]: value }
      }));
    } else {
      setNewUser(prev => ({ ...prev, [field]: value }));
    }
  };

  const filteredUsers = users.filter(user => {
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
          {/* <span className="stat-item">
            <strong>{filteredUsers.length}</strong> users found
          </span> */}
          <button className="primary-btn" onClick={() => setShowAddUser(true)}>
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
        >
          <option value="">All Companies</option>
          {companies.map((company) => (
            <option key={company._id} value={company._id}>
              {company.company_name}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <div className="table-container">
          <table className="company-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th> 
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.company_name || 'N/A'}</td>  
                  <td>{user.role}</td>
                  <td>
                    <span className={`status-badge ${user.status}`}>{user.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <Users size={48} />
          <h3>No Users Found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Add User Modal - Updated with same structure as Company Form */}
      {showAddUser && (
        <div className="modal-overlay">
          <div className="modal-content centered">
            <div className="modal-header">
              <h3>Create New User</h3>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); addUser(); }} className="company-form">
              <div className="form-section">
                <h4>User Information</h4>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="form-field">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      placeholder="john.doe@company.com"
                    />
                  </div>

                  <div className="form-field">
                    <label>Password *</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                      placeholder="Minimum 8 characters"
                      minLength="8"
                    />
                  </div>
<div className="form-field">
                    <label>Company</label>
                    <select
                      value={newUser.company_id}
                      onChange={(e) => handleChange('company_id', e.target.value)}
                    >
                      <option value="">Select Company</option>
                      {companies.map(company => (
                        <option key={company._id} value={company._id}>
                          {company.company_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Job Title</label>
                    <input
                      type="text"
                      placeholder="Software Engineer (optional)"
                      value={newUser.profile.job_title || ''}
                      onChange={(e) => handleChange('profile.job_title', e.target.value)}
                    />
                  </div>
                  
                </div>
              </div>

              {/* Role Information */}
              {/* <div className="form-section">
                <div className="role-description">
                  <small>
                    ✏️ <strong>User Role:</strong> Answerer User - Can view and answer questions
                  </small>
                </div>
              </div> */}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="secondary-btn"
                  onClick={() => setShowAddUser(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="primary-btn"
                  disabled={isCreating || !newUser.name || !newUser.email || !newUser.password}
                >
                  {isCreating ? (
                    <>
                      <Loader size={14} className="spinner" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOverview;