import React, { useState, useEffect, useRef } from 'react';
import { Building2, Image, Edit, Upload } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import '../styles/CompanyManagement.css';
import { useTranslation } from '../hooks/useTranslation';
import AdminTable from './AdminTable';


// ------------------ CompanyEdit Modal ------------------
const CompanyEditModal = ({ company, onClose, onSave, onToast }) => {
   const { t } = useTranslation();
  const [formData, setFormData] = useState({
    company_name: company.company_name,
    industry: company.industry || '',
    size: company.size || '',
  });
  const [logoPreview, setLogoPreview] = useState(company.logo);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const token = sessionStorage.getItem('token');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      onToast('Please upload an image file.', 'error');
      return;
    }

    // Set local preview
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    setSelectedFile(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalLogoUrl = company.logo;

      // 1. Upload logo if a new one was selected
      if (selectedFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', selectedFile);

        const logoRes = await fetch(`${API_BASE_URL}/api/admin/companies/${company._id}/logo`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: logoFormData,
        });

        if (!logoRes.ok) {
          const error = await logoRes.json().catch(() => ({}));
          throw new Error(error.error || 'Failed to upload logo');
        }

        const logoData = await logoRes.json();
        finalLogoUrl = logoData.logo_url;
      }

      // 2. Update company details
      const detailRes = await fetch(`${API_BASE_URL}/api/admin/companies/${company._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (detailRes.ok) {
        onToast('Company updated successfully', 'success');
        onSave({ ...company, ...formData, logo: finalLogoUrl });

        // Update sessionStorage if this is the user's company
        if (sessionStorage.getItem('userRole') === 'company_admin') {
          sessionStorage.setItem('companyName', formData.company_name);
          sessionStorage.setItem('companyLogo', finalLogoUrl);
          sessionStorage.setItem('companyIndustry', formData.industry);
        }

        onClose();
      } else {
        const error = await detailRes.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update company details');
      }
    } catch (error) {
      console.error('Error saving company:', error);
      onToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content centered medium">
        <div className="modal-header">
          <h3>{t("edit_company_information")}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSave} className="edit-company-form">
          <div className="logo-upload-card">
            <div className="logo-upload-header">
              <div className="logo-icon-wrapper">
                <Image size={24} />
              </div>
              <div className="logo-text-wrapper">
                <h4>{t("company_branding")}</h4>
                <p>{t("upload_company_logo")}</p>
              </div>
            </div>

            <div className="logo-upload-content">
              <div className="logo-preview-container-refined">
                {logoPreview ? (
                  <img src={logoPreview && (logoPreview.startsWith('/') || logoPreview.startsWith('blob:')) ? (logoPreview.startsWith('blob:') ? logoPreview : `${API_BASE_URL}${logoPreview}`) : logoPreview} alt="Company logo preview" className="logo-preview-refined" />
                ) : (
                  <div className="logo-placeholder-refined">
                    <Building2 size={32} />
                  </div>
                )}
              </div>

              <div className="logo-actions-refined">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  hidden
                />
                <button
                  type="button"
                  className="upload-trigger-btn"
                  onClick={() => fileInputRef.current.click()}
                  disabled={isSaving}
                >
                  <Upload size={16} />
                  {logoPreview ? t("change_logo") : t("upload_logo")}
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>{t("company_name")}</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>{t("industry")}</label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>{t("size")}</label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            >
              <option value="">{t("Select Size")}</option>
              <option value="1-10">{t("1-10 employees")}</option>
              <option value="11-50">{t("11-50 employees")}</option>
              <option value="51-200">{t("51-200 employees")}</option>
              <option value="201-500">{t("201-500 employees")}</option>
              <option value="501-1000">{t("501-1000 employees")}</option>
              <option value="1000+">{t("1000+ employees")}</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={isSaving}>
              {t("cancel")}
            </button>
            <button type="submit" className="primary-btn" disabled={isSaving}>
              {isSaving ? t("saving") : t("save_changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ------------------ CompanyManagement ------------------
const CompanyManagement = ({ onToast }) => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState(null);
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

  const handleEditCompany = (company) => {
    setEditingCompany(company);
  };

  const handleUpdateCompany = (updatedCompany) => {
    setCompanies(prev => prev.map(c => c._id === updatedCompany._id ? updatedCompany : c));
  };

  // Search
  const filteredCompanies = companies.filter((company) => {
  const search = searchTerm.toLowerCase();

  return (
    company.company_name?.toLowerCase().includes(search) ||
    company.admin_name?.toLowerCase().includes(search) ||
    company.admin_email?.toLowerCase().includes(search) ||
    company.industry?.toLowerCase().includes(search) ||
    company.size?.toLowerCase().includes(search) ||
    company.status?.toLowerCase().includes(search)
  );
});

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
            src={row.logo && row.logo.startsWith('/') ? `${API_BASE_URL}${row.logo}` : row.logo}
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
      render: (val) => <span className="admin-cell-primary">{val || '-'}</span>,
    },
    {
      key: 'size',
      label: t('size'),
      render: (val) => <span className="admin-cell-primary">{val || '-'}</span>,
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
      render: (val) => <span className="admin-cell-primary">{formatDate(val)}</span>,
    },
    ...(isCompanyAdmin ? [
      {
        key: 'actions',
        label: t('actions') || 'Actions',
        render: (_, row) => (
          <div className="admin-table-actions">
            <button
              className="action-icon-btn edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleEditCompany(row);
              }}
              title={t('edit_company') || "Edit Company"}
            >
              <Edit size={16} />
            </button>
          </div>
        ),
      },
    ] : []),
  ];

  return (
    <div className="company-management">
      <AdminTable
        title={isSuperAdmin ? t('company_management') : t('my_company')}
        count={isSuperAdmin ? filteredCompanies.length : undefined}
        countLabel={filteredCompanies.length === 1 ? t('Company') : t('Companies')}
        columns={columns}
        data={paginatedCompanies}
        searchTerm={(isSuperAdmin || companies.length > 1) ? searchTerm : undefined}
        onSearchChange={(isSuperAdmin || companies.length > 1) ? handleSearchChange : undefined}
        searchPlaceholder={t('search_companies')}
        searchTooltip={t('search_companies_tooltip')}
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

      {editingCompany && (
        <CompanyEditModal
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onSave={handleUpdateCompany}
          onToast={onToast}
        />
      )}
    </div>
  );
};

export default CompanyManagement;