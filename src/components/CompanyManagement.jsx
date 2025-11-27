import React, { useState, useEffect } from 'react';
import { Plus, Building2, Loader, Eye, Upload, X, Image, Edit, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { formatDate } from '../utils/dateUtils'; // Import the utility function
import '../styles/CompanyManagement.css';
import { useTranslation } from '../hooks/useTranslation';
import Pagination from '../components/Pagination';

// ------------------ CreateCompanyForm ------------------
const CreateCompanyForm = ({ onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    size: '',
    admin_name: '',
    admin_email: '',
    admin_password: ''
  });
  const { t } = useTranslation();
  const validateForm = () => {
    const errors = {};


    // Regex for letters + single spaces
    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

    // Company name validation
    if (!formData.company_name.trim()) {
      errors.company_name = t('Company_name_is_required');
    } else if (!nameRegex.test(formData.company_name.trim())) {
      errors.company_name = t('Company_name_can_only_contain_letters_and_single_spaces');
    } else if (formData.company_name.trim().length < 2) {
      errors.company_name = t('Company_name_must_be_at_least_2_characters_long');
    } else if (formData.company_name.trim().length > 20) {
      errors.company_name = t('Company_name_must_be_at_most_20_characters_long');
    }

    if (!formData.industry) {
      errors.industry = t('Industry_is_required');
    }

    // Admin name validation
    if (!formData.admin_name.trim()) {
      errors.admin_name = t('Admin_name_is_required');
    } else if (!nameRegex.test(formData.admin_name.trim())) {
      errors.admin_name = t('Admin_name_can_only_contain_letters_and_single_spaces');
    } else if (formData.admin_name.trim().length < 2) {
      errors.admin_name = t('Admin_name_must_be_at_least_2_characters_long');
    } else if (formData.admin_name.trim().length > 20) {
      errors.admin_name = t('Admin_name_must_be_at_most_20_characters_long');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.admin_email.trim()) {
      errors.admin_email = 'Admin email is required';
    } else if (!emailRegex.test(formData.admin_email.trim())) {
      errors.admin_email = 'Invalid email format';
    }

    // Password validation
    if (!formData.admin_password) {
      errors.admin_password = t('password_required') || 'Password is required';
    } else if (formData.admin_password.length < 8) {
      errors.admin_password = t('password_min_length_8') || 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.admin_password)) {
      errors.admin_password = t('Password_must_contain_at_least_one_uppercase_letter_one_lowercase_letter_and_one_number');
    }

    return errors;
  };


  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const handleSubmit = (e) => {
    e.preventDefault();

    const foundErrors = validateForm();
    if (Object.keys(foundErrors).length > 0) {
      setErrors(foundErrors);
      return;
    }
    setErrors({});

    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    if (logoFile) submitData.append('logo', logoFile);

    onSubmit(submitData);
  };

const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData(prev => ({
    ...prev,
    [name]: value
  }));

  // Only clear email error when valid
  if (name === "admin_email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(value.trim())) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.admin_email;
        return updated;
      });
    }
  }
};

  const handleLogoChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Logo file size must be less than 5MB');
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content centered">
        <div className="modal-header">
          <h3>{t('create_new_company')}</h3>
        </div>

        <form onSubmit={handleSubmit} className="company-form">
          {/* Existing form fields */}
          <div className="form-section">
            <div className="form-grid">
              <div className="form-field">
                <label>{t('company_name')} *</label>
                <input
                  type="text"
                  name="company_name"
                  className='form-control'
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  placeholder="TechCorp Solutions"
                />
                {errors.company_name && <div className="error-message">{errors.company_name}</div>}
              </div>

              <div className="form-field">
                <label>{t('industry')} *</label>
                <select name="industry" value={formData.industry} onChange={handleChange} required>
                  <option value="">{t('select_industry')}</option>
                  <option value="Technology">{t('technology')}</option>
                  <option value="Healthcare">{t('healthcare')}</option>
                  <option value="Finance">{t('finance')}</option>
                  <option value="Retail">{t('retail')}</option>
                  <option value="Education">{t('education')}</option>
                  <option value="Other">{t('other')}</option>
                </select>
                {errors.industry && <div className="error-message">{errors.industry}</div>}
              </div>

              <div className="form-field">
                <label>{t('company_size')}</label>
                <select name="size" value={formData.size} onChange={handleChange}>
                  <option value="">{t('select_size')}</option>
                  <option value="startup">{t('startup')} (1-10)</option>
                  <option value="small">{t('small')} (11-50)</option>
                  <option value="medium">{t('medium')} (51-200)</option>
                  <option value="large">{t('large')} (201-1000)</option>
                  <option value="enterprise">{t('enterprise')} (1000+)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Simple Logo Upload Section */}
          <div className="form-section">
            <h4>{t('company_logo')} (Optional)</h4>
            <div className="form-field">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ marginBottom: '10px' }}
              />
              {logoPreview && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    style={{ maxWidth: '150px', maxHeight: '80px', objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Admin fields */}
          <div className="form-section">
            <h4>{t('company_admin_user')}</h4>
            <div className="form-grid">
              <div className="form-field">
                <label>{t('admin_name')} *</label>
                <input
                  type="text"
                  name="admin_name"
                  className='form-control'
                  value={formData.admin_name}
                  onChange={handleChange}
                  required
                  placeholder="John Smith"
                />
                {errors.admin_name && <div className="error-message">{errors.admin_name}</div>}
              </div>

              <div className="form-field">
                <label>{t('admin_email')} *</label>
                <input
                  type="email"
                  name="admin_email"
                  className='form-control'
                  value={formData.admin_email}
                  onChange={handleChange}
                  required
                  placeholder="admin@techcorp.com"
                />
                {errors.admin_email && <div className="error-message">{errors.admin_email}</div>}
              </div>

              <div className="form-field full-width">
                <label>{t('admin_password')} *</label>
                <input
                  type="password"
                  name="admin_password"
                  className='form-control'
                  value={formData.admin_password}
                  onChange={handleChange}
                  required
                  placeholder={t('Minimum_8_characters')}
                  minLength="8"
                />
                {errors.admin_password && <div className="error-message">{errors.admin_password}</div>}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={onCancel} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader size={14} className="spinner" />
                  Creating...
                </>
              ) : (
                t('create_company')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ------------------ CompanyDetails ------------------
const CompanyDetails = ({ company, onClose, canEdit = false, onEdit }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content centered large">
        <div className="modal-header">
          <h3>Company Details</h3>
          <div className="modal-header-actions">
            {canEdit && (
              <button className="secondary-btn" onClick={() => onEdit(company)}>
                <Edit size={16} />
                Edit Logo
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="company-details">
          {/* Company Logo Display */}
          {company.logo && (
            <div className="logo-section">
              <h4>Company Logo</h4>
              <div className="company-logo-display-container">
                <img
                  src={company.logo}
                  alt={`${company.company_name} logo`}
                  className="company-logo-display"
                />
              </div>
            </div>
          )}

          <div className="details-grid">
            <div className="detail-item">
              <label>Company Name</label>
              <span>{company.company_name}</span>
            </div>
            <div className="detail-item">
              <label>Industry</label>
              <span>{company.industry || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <label>Size</label>
              <span>{company.size || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <label>Status</label>
              <span className={`status-badge ${company.status}`}>
                {company.status}
              </span>
            </div>
            <div className="detail-item">
              <label>Created</label>
              <span>{formatDate(company.created_at)}</span>
            </div>
            {company.logo_updated_at && (
              <div className="detail-item">
                <label>Logo Updated</label>
                <span>{formatDate(company.logo_updated_at)}</span>
              </div>
            )}
          </div>

          <div className="admin-section">
            <h4>Company Administrator</h4>
            <div className="admin-info">
              <p><strong>Name:</strong> {company.admin_name}</p>
              <p><strong>Email:</strong> {company.admin_email}</p>
              {company.admin_created_at && (
                <p><strong>Admin Since:</strong> {formatDate(company.admin_created_at)}</p>
              )}
            </div>
          </div>

          <div className="stats-section">
            <h4>User Statistics</h4>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">{company.total_users || 0}</span>
                <span className="stat-label">Total Users</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{company.active_users || 0}</span>
                <span className="stat-label">Active Users</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------ CompanyManagement ------------------
const CompanyManagement = ({ onToast }) => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [userRole, setUserRole] = useState('');
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const getAuthToken = () => sessionStorage.getItem('token');

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    setUserRole(role || '');
    loadCompanies();
  }, []);

  // Check if user is super admin
  const isSuperAdmin = userRole === 'super_admin';
  const isCompanyAdmin = userRole === 'company_admin';

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      if (!token) {
        onToast('Authentication required', 'error');
        return;
      }

      // Different endpoint based on user role
      let endpoint = `${API_BASE_URL}/api/admin/companies`;

      // For company admin, we'll filter on backend to show only their company
      if (isCompanyAdmin) {
        // The backend should handle filtering based on the user's company_id from the token
        // We may need to modify the backend endpoint to support this
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const companiesData = data.companies || [];
        setCompanies(companiesData);
      } else if (response.status === 403) {
        onToast('Admin access required', 'error');
      } else if (response.status === 401) {
        onToast('Authentication expired. Please login again.', 'error');
      } else {
        const error = await response.json().catch(() => ({}));
        onToast(error.error || 'Failed to load companies', 'error');
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      onToast('Network error. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = async (formData) => {
    try {
      setIsCreating(true);
      const token = getAuthToken();

      if (!token) {
        onToast('Authentication required', 'error');
        return;
      }

      // Send FormData directly (handles both form fields and file)
      const response = await fetch(`${API_BASE_URL}/api/admin/companies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type header - let browser set it with boundary for FormData
        },
        body: formData // FormData object
      });

      if (response.ok) {
        const data = await response.json();
        onToast(data.message || 'Company created successfully', 'success');
        setShowCreateForm(false);
        loadCompanies(); // Reload the companies list
      } else if (response.status === 403) {
        onToast('Super admin access required', 'error');
      } else if (response.status === 401) {
        onToast('Authentication expired. Please login again.', 'error');
      } else {
        const error = await response.json().catch(() => ({}));
        onToast(error.error || 'Failed to create company', 'error');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      onToast('Network error. Please check your connection.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditCompany = (company) => {
    // For now, we'll just show a placeholder action for company admins
    // This could be expanded to include logo upload functionality
    onToast('Logo editing functionality coming soon', 'info');
  };

  const filteredCompanies = companies.filter(company =>
    company.company_name.toLowerCase().startsWith(searchTerm.toLowerCase())
  );

  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredCompanies.length / pageSize);

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader size={24} className="spinner" />
        <span>Loading companies...</span>
      </div>
    );
  }
  

  return (
    <div className="company-management">
      <div className="section-header">
        <h2>{isSuperAdmin ? t('company_management') : t('my_company')}</h2>
        <div className="header-actions">
          {/* Only show search for super admin or if there are multiple companies */}
          {(isSuperAdmin || companies.length > 1) && (
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder={t('search_companies')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
          {/* Only super admin can create companies */}
          {isSuperAdmin && (
            <button
              className="primary-btn"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={16} />
              {t('create_company')}
            </button>
          )}
        </div>
      </div>

      {/* Only show create form for super admin */}
      {showCreateForm && isSuperAdmin && (
        <CreateCompanyForm
          onSubmit={handleCreateCompany}
          onCancel={() => setShowCreateForm(false)}
          isLoading={isCreating}
        />
      )}

      {paginatedCompanies.length > 0 ? (
        <>
          <div className="table-container">
            <table className="company-table">
              <thead>
                <tr>
                  <th>{t('logo')}</th>
                  <th>{t('company_name')}</th>
                  {isSuperAdmin && <th>{t('admin_name')}</th>}
                  {isSuperAdmin && <th>{t('admin_email')}</th>}
                  <th>{t('industry')}</th>
                  <th>{t('size')}</th>
                  <th>{t('status')}</th>
                  <th>{t('total_users')}</th>
                  <th>{t('active_users')}</th>
                  <th>{t('created_date')}</th>
                  {/* <th>Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map(company => (
                  <tr key={company._id}>
                    <td>
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={`${company.company_name} logo`}
                          className="table-logo"
                          style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="no-logo-placeholder">
                          <Image size={16} />
                        </div>
                      )}
                    </td>
                    <td>{company.company_name}</td>
                    {isSuperAdmin && <td>{company.admin_name}</td>}
                    {isSuperAdmin && <td>{company.admin_email}</td>}
                    <td>{company.industry || '-'}</td>
                    <td>{company.size || '-'}</td>
                    <td>
                      <span className={`status-badge ${company.status}`}>
                        {company.status}
                      </span>
                    </td>
                    <td>{company.total_users}</td>
                    <td>{company.active_users}</td>
                    <td>{formatDate(company.created_at)}</td>
                    {/* <td>
                      <button
                        className="icon-btn"
                        onClick={() => setSelectedCompany(company)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isSuperAdmin && (<Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            variant="default"
            showPageNumbers={true}
            totalItems={filteredCompanies.length}
            itemsPerPage={pageSize}
          />)}
        </>
      ) : (
        <div className="empty-state">
          <Building2 size={48} />
          <h3>{isSuperAdmin ? 'No Companies Found' : 'Company Information Not Available'}</h3>
          <p>
            {searchTerm
              ? 'No companies match your search criteria'
              : isSuperAdmin
                ? 'Create your first company to get started'
                : 'Please contact your administrator for more information'
            }
          </p>
        </div>
      )}

      {selectedCompany && (
        <CompanyDetails
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          canEdit={isCompanyAdmin}
          onEdit={handleEditCompany}
        />
      )}
    </div>
  );
};

export default CompanyManagement;