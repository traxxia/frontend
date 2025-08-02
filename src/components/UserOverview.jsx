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
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role_name: 'answerer_user', // Default role
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
      const token = getAuthToken();

      const payload = { ...newUser };
      if (!payload.name || !payload.email || !payload.password || !payload.role_name) {
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
          <span className="stat-item">
            <strong>{filteredUsers.length}</strong> users found
          </span>
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

      {/* Add User Modal */}
      {showAddUser && (
        <div className="modal-overlay">
          <div className="modal-content medium">
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="close-btn" onClick={() => setShowAddUser(false)}>×</button>
            </div>

            <div className="form-grid">
              <input
                type="text"
                placeholder="Name *"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password *"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
              />

              {/* Role Selection */}
              <select
                value={newUser.role_name}
                onChange={(e) => setNewUser({ ...newUser, role_name: e.target.value })}
                required
              >
                <option value="">Select Role *</option>
                {roles.map(role => (
                  <option key={role.id} value={role.role_name}>
                    {role.role_name === 'viewer_user' ? 'Viewer User' : 
                     role.role_name === 'answerer_user' ? 'Answerer User' : 
                     role.role_name}
                  </option>
                ))}
              </select>

              {/* Company Selection (only for super_admin) */}
              <select
                value={newUser.company_id}
                onChange={(e) => setNewUser({ ...newUser, company_id: e.target.value })}
              >
                <option value="">Select Company (optional)</option>
                {companies.map(company => (
                  <option key={company._id} value={company._id}>
                    {company.company_name}
                  </option>
                ))}
              </select>

              {/* Job Title (optional) */}
              <input
                type="text"
                placeholder="Job Title (optional)"
                value={newUser.profile.job_title || ''}
                onChange={(e) => setNewUser({ 
                  ...newUser, 
                  profile: { ...newUser.profile, job_title: e.target.value }
                })}
              />
            </div>

            {/* Role Description */}
            {newUser.role_name && (
              <div className="role-description">
                <small>
                  {newUser.role_name === 'viewer_user' && 
                    '👁️ Viewer User: Can view questions and results but cannot answer questions'}
                  {newUser.role_name === 'answerer_user' && 
                    '✏️ Answerer User: Can view and answer questions'}
                </small>
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="primary-btn" 
                onClick={addUser}
                disabled={!newUser.name || !newUser.email || !newUser.password || !newUser.role_name}
              >
                Create User
              </button>
              <button className="secondary-btn" onClick={() => setShowAddUser(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOverview;