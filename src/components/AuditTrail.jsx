import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  User,
  Activity,
  ChevronDown,
  RefreshCw,
  Clock,
  Shield,
  LogIn,
  LogOut,
  Edit,
  Eye,
  Settings,
  Plus,
  X,
  Calendar,
  FilterX,
  ChevronUp,
  Database,
  BarChart3,
  FileText,
  Download,
  ExternalLink,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AnalysisDataModal from './AnalysisDataModal';
import "../styles/audittrail.css";
import Pagination from '../components/Pagination';
import { useTranslation } from '@/hooks/useTranslation';

const AuditTrail = ({ onToast }) => {
  const [auditEntries, setAuditEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_id: '',
    event_type: '',
    start_date: '',
    end_date: '',
    search_term: '',
    page: 1,
    limit: 10,
    include_analysis_data: false
  });
  const [users, setUsers] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeFilters, setActiveFilters] = useState([]);
  const [expandedAnalysis, setExpandedAnalysis] = useState({});
  const [loadingAnalysisData, setLoadingAnalysisData] = useState({});
  const [analysisStats, setAnalysisStats] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('user'); // Track current user role
  const { t } = useTranslation();

  // Modal state
  const [modalData, setModalData] = useState({
    isOpen: false,
    analysisType: '',
    analysisData: null,
    analysisName: '',
    businessName: '',
    auditId: ''
  });

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Quick filter presets - Updated for admin roles
  const quickFilters = [
    { label: t('Login_Events'), key: 'event_type', value: 'login_success' },
    { label: t('Failed_Logins'), key: 'event_type', value: 'login_failed' },
    { label: t('Analysis_Generated'), key: 'event_type', value: 'analysis_generated' },
    { label: t('Business_Created'), key: 'event_type', value: 'business_created' },
    { label: t('Business_Deleted'), key: 'event_type', value: 'business_deleted' },
    { label: t('Today'), key: 'quick_date', value: 'today' },
    { label: t('This_Week'), key: 'quick_date', value: 'week' },
    { label: t('This_Month'), key: 'quick_date', value: 'month' }
  ];

  // Get current user role from session/token
  useEffect(() => {
    const token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserRole(payload.role || 'user');
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  // Initial load effect
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Only fetch users if current user is admin (for filtering dropdown)
        if (['super_admin', 'company_admin'].includes(currentUserRole)) {
          await Promise.all([fetchUsers(), fetchEventTypes()]);
        } else {
          await fetchEventTypes();
        }
        setTimeout(() => fetchAuditTrail(), 100);
      } catch (error) {
        onToast('Error initializing data', 'error');
      } finally {
        setInitialLoad(false);
      }
    };

    if (initialLoad && currentUserRole) {
      initializeData();
    }
  }, [initialLoad, currentUserRole]);

  // Effect for page changes
  useEffect(() => {
    if (!initialLoad) {
      fetchAuditTrail();
    }
  }, [filters.page]);

  // Update active filters when filters change
  useEffect(() => {
    updateActiveFilters();
  }, [filters]);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');

      if (!token || token === 'undefined' || token === 'null') {
        onToast('Session expired. Please login again.', 'error');
        return;
      }

      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'quick_date') {
          params.append(key, filters[key]);
        }
      });

      const response = await fetch(`${REACT_APP_BACKEND_URL}/api/admin/audit-trail?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuditEntries(data.audit_entries);
        setPagination(data.pagination);
        setAnalysisStats(data.analysis_statistics || []);
      } else {
        const errorData = await response.json();

        if (response.status === 401 || response.status === 403) {
          onToast('Session expired. Please login again.', 'error');
        } else {
          onToast(`Failed to fetch audit trail: ${errorData.error}`, 'error');
        }
      }
    } catch (error) {
      onToast('Error fetching audit trail', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisData = async (auditId) => {
    try {
      setLoadingAnalysisData(prev => ({ ...prev, [auditId]: true }));
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');

      const response = await fetch(`${REACT_APP_BACKEND_URL}/api/admin/audit-trail/${auditId}/analysis-data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.analysis_result;
      } else {
        onToast('Failed to fetch analysis data', 'error');
        return null;
      }
    } catch (error) {
      onToast('Error fetching analysis data', 'error');
      return null;
    } finally {
      setLoadingAnalysisData(prev => ({ ...prev, [auditId]: false }));
    }
  };

  const openAnalysisModal = async (entry) => {
    const analysisData = entry.event_data?.analysis_result || await fetchAnalysisData(entry._id);

    if (analysisData) {
      const eventData = entry.event_data_summary || entry.event_data || {};

      setModalData({
        isOpen: true,
        analysisType: eventData.analysis_type || 'analysis',
        analysisData: analysisData,
        analysisName: eventData.analysis_name || `${eventData.analysis_type} Analysis`,
        businessName: eventData.business_name || 'Business',
        auditId: entry._id
      });
    }
  };

  const closeModal = () => {
    setModalData({
      isOpen: false,
      analysisType: '',
      analysisData: null,
      analysisName: '',
      businessName: '',
      auditId: ''
    });
  };

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');

      if (!token || token === 'undefined' || token === 'null') {
        return;
      }

      const response = await fetch(`${REACT_APP_BACKEND_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const fetchEventTypes = async () => {
    try {
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');

      if (!token || token === 'undefined' || token === 'null') {
        return;
      }

      const response = await fetch(`${REACT_APP_BACKEND_URL}/api/admin/audit-trail/event-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEventTypes(data.event_types || []);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleQuickFilter = (filterConfig) => {
    if (filterConfig.key === 'quick_date') {
      const dates = getDateRange(filterConfig.value);
      setFilters(prev => ({
        ...prev,
        start_date: dates.start,
        end_date: dates.end,
        page: 1
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [filterConfig.key]: filterConfig.value,
        page: 1
      }));
    }
  };

  const getDateRange = (range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case 'today':
        return {
          start: today.toISOString().slice(0, 16),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString().slice(0, 16)
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          start: weekStart.toISOString().slice(0, 16),
          end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString().slice(0, 16)
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        return {
          start: monthStart.toISOString().slice(0, 16),
          end: monthEnd.toISOString().slice(0, 16)
        };
      default:
        return { start: '', end: '' };
    }
  };

  const updateActiveFilters = () => {
    const active = [];

    // Only show user filter for admin roles
    if (filters.user_id && ['super_admin', 'company_admin'].includes(currentUserRole)) {
      const user = users.find(u => u._id === filters.user_id);
      active.push({
        key: 'user_id',
        label: `User: ${user?.name || 'Unknown'}`,
        value: filters.user_id
      });
    }

    if (filters.event_type) {
      active.push({
        key: 'event_type',
        label: `Event: ${filters.event_type.replace('_', ' ').toUpperCase()}`,
        value: filters.event_type
      });
    }

    if (filters.search_term) {
      active.push({
        key: 'search_term',
        label: `Search: "${filters.search_term}"`,
        value: filters.search_term
      });
    }

    if (filters.start_date) {
      active.push({
        key: 'start_date',
        label: `From: ${new Date(filters.start_date).toLocaleDateString()}`,
        value: filters.start_date
      });
    }

    if (filters.end_date) {
      active.push({
        key: 'end_date',
        label: `To: ${new Date(filters.end_date).toLocaleDateString()}`,
        value: filters.end_date
      });
    }

    if (filters.include_analysis_data) {
      active.push({
        key: 'include_analysis_data',
        label: 'Including full analysis data',
        value: filters.include_analysis_data
      });
    }

    setActiveFilters(active);
  };

  const removeFilter = (filterKey) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: filterKey === 'include_analysis_data' ? false : '',
      page: 1
    }));
  };

  const applyFilters = () => {
    fetchAuditTrail();
    setShowFilters(false);
  };

  const clearAllFilters = () => {
    setFilters({
      user_id: '',
      event_type: '',
      start_date: '',
      end_date: '',
      search_term: '',
      page: 1,
      limit: 50,
      include_analysis_data: false
    });
    setTimeout(() => fetchAuditTrail(), 100);
  };

  const getEventIcon = (eventType) => {
    const iconMap = {
      login_success: <LogIn size={16} className="text-green-600" />,
      login_failed: <LogIn size={16} className="text-red-600" />,
      logout: <LogOut size={16} className="text-gray-600" />,
      question_answered: <Edit size={16} className="text-blue-600" />,
      question_skipped: <Eye size={16} className="text-yellow-600" />,
      question_edited: <Settings size={16} className="text-purple-600" />,
      analysis_generated: <BarChart3 size={16} className="text-green-600" />,
      business_created: <Plus size={16} className="text-green-600" />,
      business_deleted: <X size={16} className="text-red-600" />
    };
    return iconMap[eventType] || <Shield size={16} className="text-gray-600" />;
  };

  const getEventColor = (eventType) => {
    const colorMap = {
      login_success: 'bg-green-50 border-green-200',
      login_failed: 'bg-red-50 border-red-200',
      logout: 'bg-gray-50 border-gray-200',
      question_answered: 'bg-blue-50 border-blue-200',
      question_skipped: 'bg-yellow-50 border-yellow-200',
      question_edited: 'bg-purple-50 border-purple-200',
      analysis_generated: 'bg-emerald-50 border-emerald-200',
      business_created: 'bg-green-50 border-green-200',
      business_deleted: 'bg-red-50 border-red-200'
    };
    return colorMap[eventType] || 'bg-gray-50 border-gray-200';
  };

  const formatEventData = (eventType, eventData, eventDataSummary) => {
    // Use summary for analysis_generated if available
    const data = eventType === 'analysis_generated' && eventDataSummary ? eventDataSummary : eventData;

    const formatMap = {
      login_success: `Successful login as ${data.role}${data.company ? ` at ${data.company}` : ''}`,
      login_failed: `Failed login attempt for ${data.email}`,
      logout: 'User logged out',
      question_answered: `Answered: ${data.question_text || 'Question'}`,
      question_skipped: `Skipped: ${data.question_text || 'Question'}`,
      question_edited: `Edited: ${data.question_text || 'Question'}`,
      analysis_generated: `Generated ${data.analysis_type || 'analysis'}: ${data.analysis_name} (Phase: ${data.phase})`,
      business_created: `Created business: ${data.business_name} (${data.business_purpose})`,
      business_deleted: `Deleted business: ${data.business_name}${data.conversations_deleted ? ` (${data.conversations_deleted} conversations removed)` : ''}`
    };
    return formatMap[eventType] || eventType.replace('_', ' ');
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const downloadAnalysisData = (auditId, analysisType, analysisResult) => {
    const dataStr = JSON.stringify(analysisResult, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysisType}_analysis_${auditId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper function to get page title based on user role
  const getPageTitle = () => {
    switch (currentUserRole) {
      case 'super_admin':
        return t('System_wide_Audit_Trail');
      case 'company_admin':
        return t('Company_Audit_Trail');
      default:
        return t('audit_trail');
    }
  };

  // Helper function to get page description based on user role
  const getPageDescription = () => {
    switch (currentUserRole) {
      case 'super_admin':
        return t('View_audit_logs_for_all_users_across_all_companies');
      case 'company_admin':
        return t('View_audit_logs_for_all_users_in_your_company');
      default:
        return t('View_system_audit_logs');
    }
  };

  return (
    <div className="porters-container audit-trail-container">
      {/* Header */}
      <div className="cs-header">
        <div className="cs-title-section">
          <Activity className="main-icon" size={24} />
          <div>
            <h2 className="cs-title">{getPageTitle()}</h2>
            <p className="text-sm text-gray-600 mt-1">{getPageDescription()}</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="filter-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            {t('Filters')}
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            className="refresh-button"
            onClick={fetchAuditTrail}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {t('Refresh')}
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="filter-results-summary">
          <div className="active-filters">
            <span className="results-count">{pagination.total || 0} entries found</span>
            {activeFilters.map((filter, index) => (
              <span key={index} className="filter-tag">
                {filter.label}
                <button
                  className="remove-filter"
                  onClick={() => removeFilter(filter.key)}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <button className="clear-all-filters" onClick={clearAllFilters}>
            Clear all filters
          </button>
        </div>
      )}

      {/* Quick Filters */}
      <div className="quick-filters">
        {quickFilters.map((filter, index) => (
          <button
            key={index}
            className={`quick-filter-btn ${(filter.key === 'event_type' && filters.event_type === filter.value) ||
              (filter.key === 'quick_date' && getDateRange(filter.value).start === filters.start_date)
              ? 'active' : ''
              }`}
            onClick={() => handleQuickFilter(filter)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="section-container">
          <div className="table-container">
            {/* Search Bar */}
            <div className="filter-group">
              <label>{t('search_events')}</label>
              <div className="search-container">
                {!filters.search_term && <Search className="search-icon" size={16} />}
                <input
                  type="text"
                  placeholder="Search by user name, email, or event description..."
                  value={filters.search_term}
                  onChange={(e) => handleFilterChange('search_term', e.target.value)}
                />
                {filters.search_term && (
                  <button
                    className="clear-search"
                    onClick={() => handleFilterChange('search_term', '')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="filters-grid">
              {/* User Filter - Only show for admin roles */}
              {['super_admin', 'company_admin'].includes(currentUserRole) && (
                <div className="filter-group">
                  <label>{t('user')}</label>
                  <select
                    value={filters.user_id}
                    onChange={(e) => handleFilterChange('user_id', e.target.value)}
                  >
                    <option value="">{t('all_users')}</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="filter-group">
                <label>{t('event_type')}</label>
                <select
                  value={filters.event_type}
                  onChange={(e) => handleFilterChange('event_type', e.target.value)}
                >
                  <option value="">{t('all_events')}</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="date-range-group">
                <div className="filter-group">
                  <label>{t('start_date')}</label>
                  <input
                    type="datetime-local"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  />
                </div>
                <div className="date-separator">to</div>
                <div className="filter-group">
                  <label>{t('end_date')}</label>
                  <input
                    type="datetime-local"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="advanced-options">
              <div className="filter-group">
                <div className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.include_analysis_data}
                    onChange={(e) => {
                      handleFilterChange('include_analysis_data', e.target.checked);
                    }}
                  />
                  <span className='span-text' style={{marginLeft: '2px'}}>Include full analysis data (slower loading)</span>
                  <span
                    className="info-tooltip"
                    tabIndex={0}
                    role="button"
                    aria-label="More info about including full analysis data"
                  >
                    <Info size={14} className="info-icon" aria-hidden="true" />
                    <span className="tooltip-content" role="tooltip">
                      When enabled, full analysis results are included in the initial load. Otherwise, they're loaded on-demand.
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="filter-actions">
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                <FilterX size={16} />
                {t('clear_all')}
              </button>
              <button className="apply-filters-btn" onClick={applyFilters}>
                {t('apply_filters')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Entries */}
      <div className="section-container">
        <div className="table-container">
          {loading ? (
            <div className="loading-state">
              <RefreshCw className="animate-spin" size={24} />
              <span>Loading audit trail...</span>
            </div>
          ) : auditEntries.length === 0 ? (
            <div className="empty-state">
              <Activity size={48} />
              <h3>No audit entries found</h3>
              <p>No audit trail entries match your current filters.</p>
              {activeFilters.length > 0 && (
                <button className="clear-all-filters" onClick={clearAllFilters}>
                  Clear filters to see all entries
                </button>
              )}
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('event')}</th>
                    <th>{t('timestamp')}</th>
                    <th>{t('user')}</th>
                    <th>{t('description')}</th>
                    <th>{t('details')}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEntries.map((entry, index) => (
                    <tr key={`${entry._id}-${index}`} className={getEventColor(entry.event_type)}>
                      <td>
                        <div className="event-type">
                          {getEventIcon(entry.event_type)}
                          <span>{entry.event_type.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </td>
                      <td>
                        <div className="timestamp">
                          <span className="timestamp-text">{formatTimestamp(entry.timestamp)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="user-info">
                          <div>
                            <span>{entry.user_name}</span>
                            <div className="email">({entry.user_email})</div>
                            {entry.company_name && (
                              <div className="company">@ {entry.company_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="description-cell">
                        {formatEventData(entry.event_type, entry.event_data, entry.event_data_summary)}
                      </td>
                      <td>
                        <div className="details-cell">
                          {/* Regular event details (exclude analysis_generated) */}
                          {entry.event_data && Object.keys(entry.event_data).length > 0 && entry.event_type !== 'analysis_generated' && (
                            <details className="event-details">
                              <summary>{t("audit_view")}</summary>
                              <pre>{JSON.stringify(entry.event_data, null, 2)}</pre>
                            </details>
                          )}

                          {/* Analysis-specific details */}
                          {entry.event_type === 'analysis_generated' && (
                            <div className="analysis-details">
                              <div className="analysis-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {/* View Analysis Button */}
                                <button
                                  className="view-analysis-btn"
                                  onClick={() => openAnalysisModal(entry)}
                                  disabled={loadingAnalysisData[entry._id]}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: loadingAnalysisData[entry._id] ? 'not-allowed' : 'pointer',
                                    opacity: loadingAnalysisData[entry._id] ? 0.7 : 1
                                  }}
                                >
                                  {loadingAnalysisData[entry._id] ? (
                                    <>
                                      <RefreshCw size={12} className="animate-spin" />
                                      Loading...
                                    </>
                                  ) : (
                                    <>
                                      <BarChart3 size={12} />
                                      {t("audit_analysis")}
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                currentPage={pagination.page || 1}
                totalPages={pagination.total_pages || 1}
                onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
                variant="default"
                showPageNumbers={true}
                totalItems={pagination.total || 0}
                itemsPerPage={filters.limit || 10}
              />
            </>
          )}
        </div>
      </div>

      {/* Analysis Data Modal */}
      <AnalysisDataModal
        isOpen={modalData.isOpen}
        onClose={closeModal}
        analysisType={modalData.analysisType}
        analysisData={modalData.analysisData}
        analysisName={modalData.analysisName}
        businessName={modalData.businessName}
        auditId={modalData.auditId}
      />
    </div>
  );
};

export default AuditTrail;