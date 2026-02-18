import React, { useState, useEffect } from 'react';
import { Building2, Loader, Image, Edit, Search } from 'lucide-react';
import { formatDate } from '../utils/dateUtils'; // Import the utility function
import '../styles/CompanyManagement.css';
import { useTranslation } from '../hooks/useTranslation';
import Pagination from '../components/Pagination';




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

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [lastPageBeforeSearch, setLastPageBeforeSearch] = useState(1);
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



  const handleEditCompany = (company) => {
    // For now, we'll just show a placeholder action for company admins
    // This could be expanded to include logo upload functionality
    onToast('Logo editing functionality coming soon', 'info');
  };

  const filteredCompanies = companies.filter(company =>
    company.company_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!searchTerm) return;
    const maxPage = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredCompanies.length, searchTerm]);


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
                  const value = e.target.value;
                  // store page only when starting search
                  if (searchTerm === '' && value !== '') {
                    setLastPageBeforeSearch(currentPage);
                  }
                  // restore page when clearing search
                  if (searchTerm !== '' && value === '') {
                    setCurrentPage(lastPageBeforeSearch);
                  }
                  setSearchTerm(value);
                }}
              />
            </div>
          )}

        </div>
      </div>



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