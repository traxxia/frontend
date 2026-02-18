import React, { useState, useEffect } from 'react';
import { Building2, Image, Edit } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import '../styles/CompanyManagement.css';
import { useTranslation } from '../hooks/useTranslation';
import AdminTable from './AdminTable';

// ------------------ CompanyDetails Modal ------------------
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
      const endpoint = `${API_BASE_URL}/api/admin/companies`;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
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

  const handleEditCompany = () => {
    onToast('Logo editing functionality coming soon', 'info');
  };

  // Search
  const filteredCompanies = companies.filter((company) =>
    company.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!searchTerm) return;
    const maxPage = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [filteredCompanies.length, searchTerm]);

  const handleSearchChange = (value) => {
    if (searchTerm === '' && value !== '') setLastPageBeforeSearch(currentPage);
    if (searchTerm !== '' && value === '') setCurrentPage(lastPageBeforeSearch);
    setSearchTerm(value);
  };

  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(filteredCompanies.length / pageSize);

  // Column definitions
  const columns = [
    {
      key: 'logo',
      label: t('logo'),
      render: (_, row) =>
        row.logo ? (
          <img
            src={row.logo}
            alt={`${row.company_name} logo`}
            className="admin-table-logo"
          />
        ) : (
          <div className="admin-table-logo-placeholder">
            <Image size={14} />
          </div>
        ),
    },
    {
      key: 'company_name',
      label: t('company_name'),
      render: (val) => <span className="admin-cell-primary">{val}</span>,
    },
    ...(isSuperAdmin
      ? [
        {
          key: 'admin',
          label: t('administrator') || 'Administrator',
          render: (_, row) => (
            <div>
              <div className="admin-cell-primary">{row.admin_name}</div>
              <div className="admin-cell-secondary">{row.admin_email}</div>
            </div>
          ),
        },
      ]
      : []),
    {
      key: 'industry',
      label: t('industry'),
      render: (val) => <span className="admin-cell-secondary">{val || '-'}</span>,
    },
    {
      key: 'size',
      label: t('size'),
      render: (val) => <span className="admin-cell-secondary">{val || '-'}</span>,
    },
    {
      key: 'status',
      label: t('status'),
      render: (val) => (
        <span className={`admin-status-badge ${val}`}>{val}</span>
      ),
    },
    {
      key: 'users',
      label: t('users'),
      render: (_, row) => (
        <div style={{ minWidth: '80px' }}>
          <div className="admin-cell-primary" style={{ fontSize: '0.8rem' }}>
            {row.total_users ?? 0} 
          </div> 
        </div>
      ),
    },
    {
      key: 'created_at',
      label: t('created_date'),
      render: (val) => <span className="admin-cell-secondary">{formatDate(val)}</span>,
    },
  ];

  return (
    <div className="company-management">
      <AdminTable
        title={isSuperAdmin ? t('company_management') : t('my_company')}
        count={isSuperAdmin ? filteredCompanies.length : undefined}
        countLabel={filteredCompanies.length === 1 ? 'Company' : 'Companies'}
        columns={columns}
        data={paginatedCompanies}
        searchTerm={(isSuperAdmin || companies.length > 1) ? searchTerm : undefined}
        onSearchChange={(isSuperAdmin || companies.length > 1) ? handleSearchChange : undefined}
        searchPlaceholder={t('search_companies')}
        currentPage={currentPage}
        totalPages={isSuperAdmin ? totalPages : 1}
        onPageChange={setCurrentPage}
        totalItems={filteredCompanies.length}
        itemsPerPage={pageSize}
        emptyMessage={isSuperAdmin ? 'No Companies Found' : 'Company Information Not Available'}
        emptySubMessage={
          searchTerm
            ? 'No companies match your search criteria'
            : isSuperAdmin
              ? 'Create your first company to get started'
              : 'Please contact your administrator for more information'
        }
        loading={isLoading}
      />

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