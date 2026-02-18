import React, { useState, useEffect } from 'react';
import AnalysisDataModal from './AnalysisDataModal';
import AdminTable from './AdminTable';
import MetricCard from './MetricCard';
import { Form, Row, Col, Modal, Button as RBButton } from 'react-bootstrap';
import {
  Activity,
  Clock,
  Shield,
  LogIn,
  BarChart3,
  Eye,
  Settings,
  Search,
  Filter,
  RefreshCw,
  LogIn as LogInIcon,
  LogOut,
  Edit,
  Plus,
  X,
  Info
} from 'lucide-react';
import "../styles/audittrail.css";
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
  const [pagination, setPagination] = useState({});
  const [initialLoad, setInitialLoad] = useState(true);
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

  const [selectedEntry, setSelectedEntry] = useState(null);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';


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
          await fetchUsers();
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

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.search_term);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(filters.search_term);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.search_term]);

  // Consolidated fetch effect for all filters except page (which has its own effect or can be merged)
  // Actually, it's better to have one effect that handles everything to avoid race conditions
  useEffect(() => {
    if (!initialLoad) {
      fetchAuditTrail();
    }
  }, [
    filters.page,
    filters.event_type,
    filters.user_id,
    filters.start_date,
    filters.end_date,
    filters.limit,
    filters.include_analysis_data,
    debouncedSearchTerm
  ]);


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
        // Use debounced search term instead of raw filter search_term
        const value = key === 'search_term' ? debouncedSearchTerm : filters[key];
        if (value && key !== 'quick_date') {
          params.append(key, value);
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


  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1
    }));
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

  const openAnalysisModal = async (row) => {
    try {
      setLoadingAnalysisData(prev => ({ ...prev, [row._id]: true }));
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
      const response = await fetch(`${REACT_APP_BACKEND_URL}/api/admin/audit-trail/${row._id}/analysis-data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setModalData({
          isOpen: true,
          analysisType: row.event_data?.analysis_type || 'Analysis',
          analysisData: data.analysis_result,
          analysisName: row.event_data?.analysis_name || 'Analysis Result',
          businessName: data.business_name || row.company_name || 'System',
          auditId: row._id
        });
      } else {
        onToast('Failed to load analysis data', 'error');
      }
    } catch (error) {
      onToast('Error loading analysis data', 'error');
    } finally {
      setLoadingAnalysisData(prev => ({ ...prev, [row._id]: false }));
    }
  };

  const columns = [
    {
      label: t('event'),
      key: 'event_type',
      render: (val, row) => (
        <div className="d-flex align-items-center gap-2">
          {getEventIcon(val)}
          <span className="text-uppercase fw-600" style={{ fontSize: '0.75rem' }}>{val.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      label: t('timestamp'),
      key: 'timestamp',
      render: (val) => (
        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
          {formatTimestamp(val)}
        </div>
      )
    },
    {
      label: t('user'),
      key: 'user_name',
      render: (_, row) => (
        <div className="user-info">
          <div className="fw-600 text-dark">{row.user_name}</div>
          <div className="text-muted small">{row.user_email}</div>
          {row.company_name && <div className="text-primary tiny-label">@ {row.company_name}</div>}
        </div>
      )
    },
    {
      label: t('description'),
      key: 'description',
      width: '35%',
      render: (_, row) => (
        <div className="text-wrap" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
          {formatEventData(row.event_type, row.event_data, row.event_data_summary)}
        </div>
      )
    },
    {
      label: t('details'),
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <>
          {row.event_data && Object.keys(row.event_data).length > 0 && row.event_type !== 'analysis_generated' && (
            <button
              className="view-button btn-sm"
              onClick={() => setSelectedEntry(row)}
            >
              <Eye size={14} /> {t('view')}
            </button>
          )}
          {row.event_type === 'analysis_generated' && (
            <button
              className="btn btn-primary btn-sm d-flex align-items-center gap-2 rounded-pill px-3"
              onClick={() => openAnalysisModal(row)}
              disabled={loadingAnalysisData[row._id]}
            >
              <BarChart3 size={14} />
              {loadingAnalysisData[row._id] ? t('Loading...') : t('view_analysis')}
            </button>
          )}
        </>
      )
    }
  ];

  return (
    <div className="admin-container">
      <AdminTable
        title={t('audit_trail')}
        count={pagination.total || 0}
        countLabel={t('events')}
        columns={columns}
        data={auditEntries}
        searchTerm={filters.search_term}
        onSearchChange={(val) => handleFilterChange('search_term', val)}
        searchPlaceholder={t('search_events')}
        currentPage={filters.page}
        totalPages={pagination.total_pages || 1}
        onPageChange={(page) => handleFilterChange('page', page)}
        totalItems={pagination.total || 0}
        itemsPerPage={filters.limit}
        loading={loading}
        toolbarContent={
          <div className="d-flex gap-3 align-items-center flex-wrap">
            {['super_admin', 'company_admin'].includes(currentUserRole) && (
              <Form.Select
                size="sm"
                className="admin-filter-select"
                style={{ width: '200px' }}
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
              >
                <option value="">{t('all_users')}</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </Form.Select>
            )}

            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 border-0"
              onClick={fetchAuditTrail}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      <AnalysisDataModal
        isOpen={modalData.isOpen}
        onClose={closeModal}
        analysisType={modalData.analysisType}
        analysisData={modalData.analysisData}
        analysisName={modalData.analysisName}
        businessName={modalData.businessName}
        auditId={modalData.auditId}
      />

      <Modal
        show={!!selectedEntry}
        onHide={() => setSelectedEntry(null)}
        centered
        size="lg"
        className="admin-modal"
      >
        <Modal.Header closeButton className="border-0 px-4 pt-4">
          <Modal.Title className="fw-bold d-flex align-items-center gap-3">
            <div className={`p-2 rounded-3 ${selectedEntry ? getEventColor(selectedEntry.event_type) : ''}`}>
              {selectedEntry && getEventIcon(selectedEntry.event_type)}
            </div>
            <div>
              <div className="h5 mb-0 fw-bold">{selectedEntry?.event_type.replace('_', ' ').toUpperCase()}</div>
              <div className="text-muted small fw-normal">{selectedEntry && formatTimestamp(selectedEntry.timestamp)}</div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          <div className="detail-section mb-4">
            <h6 className="fw-bold text-muted small text-uppercase mb-3">{t('event_details')}</h6>
            <div className="bg-light p-3 rounded-3 border">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="text-muted tiny-label text-uppercase">{t('user')}</label>
                  <div className="fw-500">{selectedEntry?.user_name}</div>
                  <div className="text-muted small">{selectedEntry?.user_email}</div>
                </div>
                <div className="col-md-6">
                  <label className="text-muted tiny-label text-uppercase">{t('company')}</label>
                  <div className="fw-500">{selectedEntry?.company_name || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h6 className="fw-bold text-muted small text-uppercase mb-3">{t('raw_data')}</h6>
            <div className="bg-dark p-3 rounded-3 overflow-auto" style={{ maxHeight: '400px' }}>
              <pre className="text-light small mb-0" style={{ fontFamily: 'Monaco, Consolas, monospace' }}>
                {selectedEntry && JSON.stringify(selectedEntry.event_data, null, 2)}
              </pre>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pb-4 pt-0">
          <RBButton variant="secondary" onClick={() => setSelectedEntry(null)} className="rounded-pill px-4">
            {t('close')}
          </RBButton>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AuditTrail;
