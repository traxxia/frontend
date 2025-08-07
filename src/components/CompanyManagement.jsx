import React, { useState, useEffect } from 'react';
import { Plus, Building2, Loader, Eye, Upload, X, Image, Edit } from 'lucide-react';
import { formatDate } from '../utils/dateUtils'; // Import the utility function
import '../styles/CompanyManagement.css';

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

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create FormData to handle both form fields and file
    const submitData = new FormData();
    
    // Append all form fields
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    
    // Append logo file if selected
    if (logoFile) {
      submitData.append('logo', logoFile);
    }
    
    onSubmit(submitData);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
          <h3>Create New Company</h3>
        </div>

        <form onSubmit={handleSubmit} className="company-form">
          {/* Existing form fields */}
          <div className="form-section"> 
            <div className="form-grid">
              <div className="form-field">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  className='form-control'
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  placeholder="TechCorp Solutions"
                />
              </div>

              <div className="form-field">
                <label>Industry</label>
                <select name="industry" value={formData.industry} onChange={handleChange}>
                  <option value="">Select Industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Retail">Retail</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-field">
                <label>Company Size</label>
                <select name="size" value={formData.size} onChange={handleChange}>
                  <option value="">Select Size</option>
                  <option value="startup">Startup (1-10)</option>
                  <option value="small">Small (11-50)</option>
                  <option value="medium">Medium (51-200)</option>
                  <option value="large">Large (201-1000)</option>
                  <option value="enterprise">Enterprise (1000+)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Simple Logo Upload Section */}
          <div className="form-section">
            <h4>Company Logo (Optional)</h4>
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
            <h4>Company Admin User</h4>
            <div className="form-grid">
              <div className="form-field">
                <label>Admin Name *</label>
                <input
                  type="text"
                  name="admin_name"
                  className='form-control'
                  value={formData.admin_name}
                  onChange={handleChange}
                  required
                  placeholder="John Smith"
                />
              </div>

              <div className="form-field">
                <label>Admin Email *</label>
                <input
                  type="email"
                  name="admin_email"
                  className='form-control'
                  value={formData.admin_email}
                  onChange={handleChange}
                  required
                  placeholder="admin@techcorp.com"
                />
              </div>

              <div className="form-field full-width">
                <label>Admin Password *</label>
                <input
                  type="password"
                  name="admin_password"
                  className='form-control'
                  value={formData.admin_password}
                  onChange={handleChange}
                  required
                  placeholder="Minimum 8 characters"
                  minLength="8"
                />
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
                'Create Company'
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
    company.company_name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h2>{isSuperAdmin ? 'Company Management' : 'My Company'}</h2>
        <div className="header-actions">
          {/* Only show search for super admin or if there are multiple companies */}
          {(isSuperAdmin || companies.length > 1) && (
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          )}
          {/* Only super admin can create companies */}
          {isSuperAdmin && (
            <button 
              className="primary-btn"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={16} />
              Create Company
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
                  <th>Logo</th>
                  <th>Company Name</th>
                  <th>Industry</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Total Users</th>
                  <th>Active Users</th>
                  {isSuperAdmin && <th>Admin Name</th>}
                  {isSuperAdmin && <th>Admin Email</th>}
                  <th>Created Date</th>
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
                    <td>{company.industry || '-'}</td>
                    <td>{company.size || '-'}</td>
                    <td>
                      <span className={`status-badge ${company.status}`}>
                        {company.status}
                      </span>
                    </td>
                    <td>{company.total_users}</td>
                    <td>{company.active_users}</td>
                    {isSuperAdmin && <td>{company.admin_name}</td>}
                    {isSuperAdmin && <td>{company.admin_email}</td>}
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

          {/* Only show pagination for super admin if there are multiple pages */}
          {totalPages > 1 && isSuperAdmin && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          )}
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