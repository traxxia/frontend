import React, { useState, useEffect } from 'react';
import { Users, Search, Loader, Plus } from 'lucide-react';

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
    company_id: '',
    job_title: ''
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

      // Load companies in parallel - using the admin endpoint for super admin
      const companiesResponse = await fetch(`${API_BASE_URL}/api/admin/companies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData.companies);
      } else {
        // Fallback to public companies endpoint
        const publicCompaniesResponse = await fetch(`${API_BASE_URL}/api/companies`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (publicCompaniesResponse.ok) {
          const publicCompaniesData = await publicCompaniesResponse.json();
          setCompanies(publicCompaniesData.companies);
        }
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

      // Build query parameters properly
      const params = new URLSearchParams();
      if (selectedCompany) {
        params.append('company_id', selectedCompany);
      }
      
      // Append query string if there are parameters
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('Loading users with URL:', url); // Debug log

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Users data received:', data); // Debug log
        
        // Map the backend response to match frontend expectations
        const mappedUsers = data.users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          company_name: user.company_name || 'N/A',
          role: user.role_name || 'user',
          status: 'active', // Default status since backend doesn't seem to have this field
          created_at: user.created_at
        }));
        setUsers(mappedUsers);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        onToast(`Failed to load users: ${errorData.error || 'Unknown error'}`, 'error');
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

      const payload = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password
      };

      if (!payload.name || !payload.email || !payload.password) {
        onToast('Please fill in all required fields', 'warning');
        return;
      }

      // Add company_id if provided (for super admin)
      if (newUser.company_id) {
        payload.company_id = newUser.company_id;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
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
          company_id: '',
          job_title: ''
        });
        await loadUsers();
      } else {
        onToast(data.error || data.message || 'User creation failed', 'error');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      onToast('Error creating user', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addUser();
  };

  const handleChange = (field, value) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
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
            className='form-control'
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedCompany}
          
          onChange={(e) => {
            console.log('Company filter changed to:', e.target.value); // Debug log
            setSelectedCompany(e.target.value);
          }}
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
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.company_name || 'N/A'}</td>
                  <td>
                    <span className="role-badge">
                      {user.role === 'user' ? 'User' : 
                       user.role === 'company_admin' ? 'Company Admin' :
                       user.role === 'super_admin' ? 'Super Admin' : user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status}`}>{user.status}</span>
                  </td>
                  <td>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
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
          <div className="modal-content centered">
            <div className="modal-header">
              <h3>Create New User</h3>
            </div>

            <div className="company-form">
              <div className="form-section">
                <div className="form-grid">
                  <div className="form-field">
                    <label>Name *</label>
                    <input
                      type="text"
                      className='form-control'
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
                      className='form-control'
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
                      className='form-control'
                      value={newUser.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                      placeholder="Minimum 8 characters"
                      minLength="8"
                    />
                  </div>

                  <div className="form-field">
                    <label>Company *</label>
                    <select
                      value={newUser.company_id}
                      onChange={(e) => handleChange('company_id', e.target.value)}
                    >
                      <option value="">Select Company (Optional)</option>
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
                      className='form-control'
                      placeholder="Software Engineer (optional)"
                      value={newUser.job_title || ''}
                      onChange={(e) => handleChange('job_title', e.target.value)}
                    />
                  </div>
                </div>
              </div>

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
                  type="button"
                  className="primary-btn"
                  onClick={handleSubmit}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOverview;