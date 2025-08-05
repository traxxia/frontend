import React, { useState, useEffect } from 'react';
import { Plus, Building2, Loader, Eye } from 'lucide-react';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content centered">
        <div className="modal-header">
          <h3>Create New Company</h3>
        </div>

        <form onSubmit={handleSubmit} className="company-form">
          <div className="form-section"> 
            <div className="form-grid">
              <div className="form-field">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  placeholder="TechCorp Solutions"
                />
              </div>

              <div className="form-field">
                <label>Industry</label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                >
                  <option value="">Select Industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-field">
                <label>Company Size</label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                >
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

          <div className="form-section">
            <h4>Company Admin User</h4>
            <div className="form-grid">
              <div className="form-field">
                <label>Admin Name *</label>
                <input
                  type="text"
                  name="admin_name"
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
            <button 
              type="button" 
              className="secondary-btn"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-btn"
              disabled={isLoading}
            >
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
const CompanyDetails = ({ company, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content centered large">
        <div className="modal-header">
          <h3>Company Details</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="company-details">
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

          {company.logo && (
            <div className="logo-section">
              <h4>Company Logo</h4>
              <img 
                src={company.logo} 
                alt={`${company.company_name} logo`}
                className="company-logo-display"
                style={{ maxWidth: '200px', maxHeight: '100px' }}
              />
            </div>
          )}
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

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const getAuthToken = () => sessionStorage.getItem('token');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      if (!token) {
        onToast('Authentication required', 'error');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/companies`, {
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
        onToast('Super admin access required', 'error');
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

      const response = await fetch(`${API_BASE_URL}/api/admin/companies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        onToast(data.message || `Company "${formData.company_name}" created successfully`, 'success');
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
        <h2>Company Management</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <button 
            className="primary-btn"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={16} />
            Create Company
          </button>
        </div>
      </div>

      {showCreateForm && (
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
                  <th>Company Name</th>
                  <th>Industry</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Total Users</th>
                  <th>Active Users</th>
                  <th>Admin Name</th>
                  <th>Admin Email</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map(company => (
                  <tr key={company._id}>
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
                    <td>{company.admin_name}</td>
                    <td>{company.admin_email}</td>
                    <td>{formatDate(company.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
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
          <h3>No Companies Found</h3>
          <p>{searchTerm ? 'No companies match your search criteria' : 'Create your first company to get started'}</p>
        </div>
      )}

      {selectedCompany && (
        <CompanyDetails
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
};

export default CompanyManagement;