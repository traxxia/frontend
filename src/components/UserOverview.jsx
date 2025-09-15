import React, { useState, useEffect } from 'react';
import { Users, Search, Loader, Plus, ChevronRight, ChevronLeft, } from 'lucide-react';
import Pagination from '../components/Pagination';

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
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [currentPage, setCurrentPage] = useState(1);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const getAuthToken = () => sessionStorage.getItem('token');

  // Validation function for individual fields
  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'name':
        if (!value || !value.trim()) {
          return 'Name is required';
        }
        // Only allow letters and spaces
        if (!/^[A-Za-z\s]+$/.test(value)) {
          return 'Name can only contain letters and spaces';
        }
        // No consecutive spaces allowed
        if (/\s{2,}/.test(value)) {
          return 'Name cannot contain consecutive spaces';
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters long';
        }
        return '';

      case 'email':
        if (!value || !value.trim()) {
          return 'Email is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return '';

      case 'password':
        if (!value || !value.trim()) {
          return 'Password is required';
        }
        if (value.trim().length < 8) {
          return 'Password must be at least 8 characters long';
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        return '';

      default:
        return '';
    }
  };


  const validateUserForm = (user) => {
    const errors = {};
    errors.name = validateField('name', user.name);
    errors.email = validateField('email', user.email);
    errors.password = validateField('password', user.password);
    return errors;
  };

  // Check if form is valid

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
  const filteredUsers = users.filter(user => {
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  // Pagination logic
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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



  const handleChange = (field, value) => {
    setNewUser(prev => ({ ...prev, [field]: value }));

    // Real-time validation - validate field as user types

  };
  const addUser = async () => {
    // Validate the form before making the API call
    const validationErrors = validateUserForm(newUser);

    // Update error state to show messages
    setFormErrors(validationErrors);

    // Check if there are any errors
    const hasErrors = Object.values(validationErrors).some(error => error);
    if (hasErrors) {
      onToast('Please fix the highlighted errors', 'warning');
      return;
    }

    try {
      setIsCreating(true);
      const token = getAuthToken();

      const payload = {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password.trim()
      };

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
        setNewUser({ name: '', email: '', password: '', company_id: '', job_title: '' });
        setFormErrors({ name: '', email: '', password: '' });
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

  // Helper function to render form fields with validation
  const renderFormField = (label, field, type = 'text', placeholder = '', required = false) => (
    <div className="form-field">
      <label>{label} {required && '*'}</label>
      <input
        type={type}
        className={`form-control ${formErrors[field] ? 'error' : ''}`}
        value={newUser[field] || ''}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        minLength={type === 'password' ? '8' : undefined}
      />
      {formErrors[field] && (
        <div className="error-message">{formErrors[field]}</div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader size={24} className="spinner" />
        <span>Loading users...</span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .form-control.error {
          border-color: #dc3545;
          box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
        }
        
        .error-message {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
          display: block;
        }
        
        .form-field {
          margin-bottom: 1rem;
        }
      `}</style>

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
            className='select-company-dropdown'
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
          <>
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
                  {paginatedUsers.map(user => (
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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              variant="default"
              showPageNumbers={true}
              totalItems={filteredUsers.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
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
                    {renderFormField('Name', 'name', 'text', 'John Doe', true)}
                    {renderFormField('Email', 'email', 'email', 'john.doe@company.com', true)}
                    {renderFormField('Password', 'password', 'password', 'Minimum 8 characters', true)}

                    <div className="form-field">
                      <label>Company *</label>
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
                    onClick={() => {
                      setShowAddUser(false);
                      // Clear form errors when closing modal
                      setFormErrors({
                        name: '',
                        email: '',
                        password: ''
                      });
                    }}
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleSubmit}
                    disabled={isCreating}
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
    </>
  );
};

export default UserOverview;