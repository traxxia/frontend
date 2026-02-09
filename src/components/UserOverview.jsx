import React, { useState, useEffect } from 'react';
import { Users, Search, Loader, Plus, ChevronRight, ChevronLeft, } from 'lucide-react';
import Pagination from '../components/Pagination';
import { formatDate } from '../utils/dateUtils';
import { useTranslation } from '../hooks/useTranslation';



const UserOverview = ({ onToast }) => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { t } = useTranslation();
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
          return t('Name_is_required');
        }
        // Only allow letters and spaces
        if (!/^[A-Za-z\s]+$/.test(value)) {
          return t('Name_can_only_contain_letters_and_spaces');
        }
        // No consecutive spaces allowed
        if (/\s{2,}/.test(value)) {
          return t('Name_cannot_contain_consecutive_spaces');
        }
        if (value.trim().length < 2) {
          return t('Name_must_be_at_least_2_characters_long');
        }
        if (value.trim().length > 20) {
          return t('Name_must_be_at_most_20_characters_long');
        }
        return '';

      case 'email':
        if (!value || !value.trim()) {
          return t('Email_is_required');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          return t('Please_enter_a_valid_email_address');
        }
        return '';

      case 'password':
        if (!value || !value.trim()) {
          return t('Password_is_required');
        }
        if (value.trim().length < 8) {
          return t('Password_must_be_at_least_8_characters_long');
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return t('Password_must_contain_at_least_one_uppercase_letter_one_lowercase_letter_and_one_number');
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

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

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

        /* Header layout fix */
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap; /* allow wrapping on smaller screens */
          gap: 10px;
          width: 100%;
        }

        .section-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .header-stats {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          width: auto;
        }

        .primary-btn {
          background-color: #2563eb;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          white-space: nowrap; /* prevents text from wrapping */
        }

        .primary-btn:hover {
          background-color: #1e40af;
        }

        /* Make responsive */
         @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
            align-items: stretch; /* makes both elements full width */
            gap: 12px;
          }

          .header-stats {
            width: 100%;
            justify-content: center;
          }

          .primary-btn {
            width: 100%;
            justify-content: center;
            font-size: 15px;
            padding: 10px;
          }
        }
      `}</style>

      <div className="user-overview">
        <div className="section-header">
          <h2>{t("All_Users_Overview")}</h2>
          <div className="header-stats">
            <button className="primary-btn" onClick={() => setShowAddUser(true)}>
              <Plus size={16} /> {t("Add_User")}
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
              placeholder={t('search_users')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedCompany}
            className='select-company-dropdown'
            onChange={(e) => {
              setSelectedCompany(e.target.value);
            }}
          >
            <option value="">{t('all_companies')}</option>
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
                    <th>{t('name')}</th>
                    <th>{t('email')}</th>
                    <th>{t('role')}</th>
                    <th>{t('company')}</th>
                    <th>{t('status')}</th>
                    <th>{t('created_at')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role.toLowerCase()}`}>
                          {t(user.role.toLowerCase())}
                        </span>
                      </td>
                      <td>{user.company_name}</td>
                      <td>
                        <span className={`status-badge status-${user.status.toLowerCase()}`}>
                          {t(user.status.toLowerCase())}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
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
                <h3>{t('create_new_user')}</h3>
              </div>

              <div className="company-form">
                <div className="form-section">
                  <div className="form-grid">
                    {renderFormField(t('name'), 'name', 'text', 'John Doe', true)}
                    {renderFormField(t('email'), 'email', 'email', 'john.doe@company.com', true)}
                    {renderFormField(t('password'), 'password', 'password', t('Minimum_8_characters'), true)}

                    <div className="form-field">
                      <label>{t('company')} *</label>
                      <select
                        value={newUser.company_id}
                        onChange={(e) => handleChange('company_id', e.target.value)}
                      >
                        <option value="">{t('select_company')}</option>
                        {companies.map(company => (
                          <option key={company._id} value={company._id}>
                            {company.company_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label>{t('job_title')}</label>
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
                      t('create_user')
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