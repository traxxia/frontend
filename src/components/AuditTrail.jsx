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
    event_type: '',
    start_date: '',
    end_date: '',
    include_analysis_data: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPageBeforeSearch, setLastPageBeforeSearch] = useState(1);
  const itemsPerPage = 10;
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
        fetchAuditTrail();
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


  // Consolidated fetch effect for all filters
  useEffect(() => {
    if (!initialLoad) {
      fetchAuditTrail();
    }
  }, [
    filters.event_type,
    filters.start_date,
    filters.end_date,
    filters.include_analysis_data
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
      // Fetch up to 500 entries for local filtering/pagination
      params.append('limit', '500');

      Object.keys(filters).forEach(key => {
        const value = filters[key];
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    if (searchTerm === "" && value !== "") setLastPageBeforeSearch(currentPage);
    if (searchTerm !== "" && value === "") setCurrentPage(lastPageBeforeSearch);
    if (value !== searchTerm) setCurrentPage(1);
    setSearchTerm(value);
  };

  const filteredEntries = auditEntries.filter((entry) => {
    const term = searchTerm.toLowerCase();
    const dataString = JSON.stringify(entry.event_data || {}).toLowerCase();
    const summaryString = JSON.stringify(entry.event_data_summary || {}).toLowerCase();
    const infoString = JSON.stringify(entry.additional_info || {}).toLowerCase();

    return (
      entry.user_name?.toLowerCase().includes(term) ||
      entry.user_email?.toLowerCase().includes(term) ||
      entry.event_type?.toLowerCase().includes(term) ||
      entry.event_type?.replace(/_/g, ' ').toLowerCase().includes(term) ||
      entry.company_name?.toLowerCase().includes(term) ||
      entry.business_name?.toLowerCase().includes(term) ||
      dataString.includes(term) ||
      summaryString.includes(term) ||
      infoString.includes(term)
    );
  });

  const totalItems = filteredEntries.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const formatEventData = (eventType, eventData, eventDataSummary, row) => {
    // Use summary for analysis_generated if available
    const data = eventType === 'analysis_generated' && eventDataSummary ? eventDataSummary : eventData;

    const formatMap = {
      login_success: `Successful login as ${data.role}${data.company ? ` at ${data.company}` : ''}`,
      login_failed: `Failed login attempt for ${data.email}`,
      logout: 'User logged out',
      question_answered: `Answered Question ${row.business_name ? ` for business: ${row.business_name}` : ''}`,
      question_skipped: `Skipped Question ${row.business_name ? ` for business: ${row.business_name}` : ''}`,
      question_edited: `Edited Question ${row.business_name ? ` for business: ${row.business_name}` : ''}`,
      analysis_generated: `Generated ${data.analysis_type || 'analysis'}: ${data.analysis_name} (Phase: ${data.phase})${row.business_name ? ` for business: ${row.business_name}` : ''}`,
      business_created: `Created business: ${data.business_name}`,
      business_deleted: `Deleted business: ${data.business_name}${data.conversations_deleted ? ` (${data.conversations_deleted} conversations removed)` : ''}`,
      collaborator_assigned: `Assigned collaborator to business: ${row.business_name || 'Business'}`
    };
    return formatMap[eventType] || eventType.replace('_', ' ');
  };

  const getEventStatusInfo = (eventType) => {
    if (eventType.includes('success') || eventType.includes('created') || eventType === 'analysis_generated') {
      return { label: t('success'), color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    }
    if (eventType.includes('failed') || eventType.includes('deleted')) {
      return { label: eventType.includes('failed') ? t('failed') : t('deleted'), color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    }
    if (eventType.includes('skipped') || eventType.includes('skipped')) {
      return { label: t('skipped'), color: 'yellow', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
    }
    return { label: t('info'), color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
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

  const renderEventDetails = (data) => {
    if (!data || typeof data !== 'object') return null;

    const excludedKeys = ['has_location', 'conversations_deleted', 'business_purpose'];

    return Object.entries(data)
      .filter(([key]) => !excludedKeys.includes(key.toLowerCase()))
      .map(([key, value]) => {
        // Skip IDs and internal fields if needed, or format them
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let displayValue = value;

        if (value === null || value === undefined || value === "") displayValue = '-';
        else if (typeof value === 'boolean') displayValue = value ? 'Yes' : 'No';
        else if (typeof value === 'object' && value !== null) {
          if (key.toLowerCase() === 'location' || key.toLowerCase() === 'additional_info') {
            const parts = [];
            if (value.city) parts.push(value.city);
            if (value.country) parts.push(value.country);
            displayValue = parts.length > 0 ? parts.join(', ') : '-';
          } else {
            displayValue = Object.entries(value)
              .filter(([_, v]) => v !== null && v !== undefined && v !== "")
              .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
              .join(' | ') || '-';
          }
        }
        else if (key.includes('at') || key.includes('timestamp')) {
          try {
            displayValue = new Date(value).toLocaleString();
          } catch (e) {
            displayValue = value;
          }
        }

        const isLongText = String(displayValue).length > 60;

        return (
          <div className={isLongText ? "col-12 mb-3" : "col-md-6 mb-3"} key={key}>
            <label className="text-muted tiny-label text-uppercase d-block mb-1">{label}</label>
            <div className={`fw-500 text-dark ${isLongText ? 'bg-white p-2 border rounded-1' : ''}`} style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{String(displayValue)}</div>
          </div>
        );
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

  const openAnalysisModal = async (entry) => {
    const eventData = entry.event_data_summary || entry.event_data || {};
    let analysisData = entry.event_data?.analysis_result;
    let businessName = eventData.business_name || entry.business_name || 'Business';

    if (!analysisData) {
      try {
        setLoadingAnalysisData(prev => ({ ...prev, [entry._id]: true }));
        const token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
        const response = await fetch(`${REACT_APP_BACKEND_URL}/api/admin/audit-trail/${entry._id}/analysis-data`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          analysisData = data.analysis_result;
          businessName = data.business_name || businessName;
        } else {
          onToast('Failed to load analysis data', 'error');
          return;
        }
      } catch (error) {
        onToast('Error loading analysis data', 'error');
        return;
      } finally {
        setLoadingAnalysisData(prev => ({ ...prev, [entry._id]: false }));
      }
    }

    if (analysisData) {
      setModalData({
        isOpen: true,
        analysisType: eventData.analysis_type || 'analysis',
        analysisData: analysisData,
        analysisName: eventData.analysis_name || `${(eventData.analysis_type || 'analysis').toUpperCase()} Analysis`,
        businessName: businessName,
        auditId: entry._id
      });
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
          {formatEventData(row.event_type, row.event_data, row.event_data_summary, row)}
        </div>
      )
    },
    {
      label: t('details'),
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="details-cell">
          {row.event_data && Object.keys(row.event_data).length > 0 && row.event_type !== 'analysis_generated' && (
            <button
              className="view-button btn-sm"
              onClick={() => setSelectedEntry(row)}
            >
              <Eye size={14} /> {t('view')}
            </button>
          )}
          {row.event_type === 'analysis_generated' && (
            <div className="analysis-details">
              <button
                className="btn btn-primary btn-sm d-flex align-items-center gap-2 rounded-pill px-3"
                onClick={() => openAnalysisModal(row)}
                disabled={loadingAnalysisData[row._id]}
                style={{ fontSize: '0.75rem' }}
              >
                {loadingAnalysisData[row._id] ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    {t('Loading...')}
                  </>
                ) : (
                  <>
                    <BarChart3 size={14} />
                    {t("audit_analysis")}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="admin-container">
      <AdminTable
        title={t('audit_trail')}
        count={totalItems}
        countLabel={t('events')}
        columns={columns}
        data={paginatedEntries}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder={t('search_events')}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        loading={loading}
        toolbarContent={
          <div className="d-flex gap-3 align-items-center flex-wrap">
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
              <div className="text-muted small fw-normal mt-1">{selectedEntry && formatTimestamp(selectedEntry.timestamp)}</div>
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

          <div className="detail-section mb-0">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold text-muted small text-uppercase mb-0">{t('event_data')}</h6>
              {selectedEntry && (
                <span className={`badge rounded-pill ${getEventStatusInfo(selectedEntry.event_type).bg} ${getEventStatusInfo(selectedEntry.event_type).text} border ${getEventStatusInfo(selectedEntry.event_type).border} px-2 py-1`} style={{ fontSize: '0.65rem' }}>
                  {getEventStatusInfo(selectedEntry.event_type).label.toUpperCase()}
                </span>
              )}
            </div>
            <div className={`${selectedEntry ? getEventStatusInfo(selectedEntry.event_type).bg : 'bg-light'} p-3 rounded-3 border ${selectedEntry ? getEventStatusInfo(selectedEntry.event_type).border : ''}`}>
              <div className="row">
                {selectedEntry && renderEventDetails(selectedEntry.event_data)}
                {selectedEntry && renderEventDetails(selectedEntry.additional_info)}
                {!selectedEntry?.event_data && !selectedEntry?.additional_info && (
                  <div className="col-12 text-center py-3 text-muted">
                    {t('no_details_available')}
                  </div>
                )}
              </div>
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
