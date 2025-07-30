import React, { useState, useEffect } from 'react';
import { Plus, Building2, Edit, Users, Loader, Eye } from 'lucide-react';

const CompanyManagement = ({ onToast }) => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const getAuthToken = () => sessionStorage.getItem('token');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/super-admin/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies);
      } else {
        onToast('Failed to load companies', 'error');
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      onToast('Error loading companies', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = async (formData) => {
    try {
      setIsCreating(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/super-admin/companies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        onToast(`Company "${data.company.company_name}" created successfully`, 'success');
        setShowCreateForm(false);
        loadCompanies();
      } else {
        const error = await response.json();
        onToast(error.message || 'Failed to create company', 'error');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      onToast('Error creating company', 'error');
    } finally {
      setIsCreating(false);
    }
  };

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
        <button 
          className="primary-btn"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={16} />
          Create Company
        </button>
      </div>

      {showCreateForm && (
        <CreateCompanyForm
          onSubmit={handleCreateCompany}
          onCancel={() => setShowCreateForm(false)}
          isLoading={isCreating}
        />
      )}

      <div className="companies-grid">
        {companies.map(company => (
          <CompanyCard
            key={company._id}
            company={company}
            onView={setSelectedCompany}
          />
        ))}
      </div>

      {companies.length === 0 && (
        <div className="empty-state">
          <Building2 size={48} />
          <h3>No Companies Yet</h3>
          <p>Create your first company to get started</p>
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

// CompanyCard Component
const CompanyCard = ({ company, onView }) => {
  return (
    <div className="company-card">
      <div className="company-header">
        <div className="company-icon">
          <Building2 size={20} />
        </div>
        <span className={`status-badge ${company.status}`}>
          {company.status}
        </span>
      </div>
      
      <div className="company-info">
        <h3>{company.company_name}</h3>
        <p className="company-industry">{company.industry}</p>
      </div>

      <div className="company-stats">
        <div className="stat">
          <span className="stat-value">{company.total_users}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat">
          <span className="stat-value">{company.active_users}</span>
          <span className="stat-label">Active Users</span>
        </div>
      </div>

      <div className="company-admin">
        <p><strong>Admin:</strong> {company.admin_name}</p>
        <p className="admin-email">{company.admin_email}</p>
      </div>

      <div className="company-actions">
        <button 
          className="secondary-btn"
          onClick={() => onView(company)}
        >
          <Eye size={14} />
          View Details
        </button>
      </div>
    </div>
  );
};

// CreateCompanyForm Component
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
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create New Company</h3>
        </div>

        <form onSubmit={handleSubmit} className="company-form">
          <div className="form-section">
            <h4>Company Information</h4>
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

// CompanyDetails Component
const CompanyDetails = ({ company, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content large">
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
              <span>{new Date(company.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="admin-section">
            <h4>Company Administrator</h4>
            <div className="admin-info">
              <p><strong>Name:</strong> {company.admin_name}</p>
              <p><strong>Email:</strong> {company.admin_email}</p>
            </div>
          </div>

          <div className="stats-section">
            <h4>User Statistics</h4>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">{company.total_users}</span>
                <span className="stat-label">Total Users</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{company.active_users}</span>
                <span className="stat-label">Active Users</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyManagement;