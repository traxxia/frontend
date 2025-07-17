import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Form, 
  Badge, 
  Spinner, 
  Alert, 
  Modal,
  Pagination,
  InputGroup,
  Dropdown,
  Table
} from 'react-bootstrap';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Calendar, 
  Tag, 
  BarChart3, 
  FileText,
  ArrowLeft,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Components
import MenuBar from '../components/MenuBar';
import { useTranslation } from '../hooks/useTranslation';

// Utils - Import the date utilities instead of defining them inline
import { formatDate, formatRelativeTime } from '../utils/dateUtils';

const AuditTrailPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State Management
  const [auditHistory, setAuditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters and Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBusinessName, setSelectedBusinessName] = useState('');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // View Mode
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  // Get translation function
  const translate = (key) => {
    if (t) return t(key);
    if (window.getTranslation) return window.getTranslation(key);
    return key;
  };

  // Fetch audit trail data
  const fetchAuditTrail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      // Add filters if they exist
      if (searchTerm) params.append('search', searchTerm);
      if (selectedBusinessName) params.append('business_name', selectedBusinessName);
      if (selectedAnalysisType) params.append('analysis_type', selectedAnalysisType);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      console.log('🔍 Fetching audit trail with params:', params.toString());

      const response = await axios.get(
        `${API_BASE_URL}/api/audit-trail/history?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data;
      setAuditHistory(data.audit_history || []);
      setTotalCount(data.pagination?.total_count || 0);
      setTotalPages(data.pagination?.total_pages || 1);

      console.log('✅ Audit trail fetched:', data.audit_history?.length, 'items');

    } catch (err) {
      console.error('❌ Error fetching audit trail:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, selectedBusinessName, selectedAnalysisType, dateFrom, dateTo, API_BASE_URL]);

  // Fetch detailed entry
  const fetchEntryDetails = async (entryId) => {
    setDetailLoading(true);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/audit-trail/${entryId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSelectedEntry(response.data);
      setShowDetailModal(true);

    } catch (err) {
      console.error('Error fetching entry details:', err);
      alert(translate('error_loading_details') || 'Error loading entry details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAuditTrail();
  }, [fetchAuditTrail]);

  // Handle search with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchAuditTrail();
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm]);

  // Handle filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchAuditTrail();
    }
  }, [selectedBusinessName, selectedAnalysisType, dateFrom, dateTo, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBusinessName, selectedAnalysisType, dateFrom, dateTo]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBusinessName('');
    setSelectedAnalysisType('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // Get unique values for filter dropdowns
  const getUniqueBusinessNames = () => {
    const names = auditHistory.map(entry => entry.business_name).filter(Boolean);
    return [...new Set(names)].sort();
  };

  const getUniqueAnalysisTypes = () => {
    const types = auditHistory.map(entry => entry.analysis_summary?.type).filter(Boolean);
    return [...new Set(types)].sort();
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Export functionality
  const handleExport = async () => {
    try {
      // Create CSV export of current filtered results
      const csvData = auditHistory.map(entry => ({
        'Business Name': entry.business_name,
        'Title': entry.title,
        'Analysis Type': entry.analysis_summary?.type || 'N/A',
        'Framework': entry.analysis_summary?.framework || 'N/A',
        'Category': entry.analysis_summary?.category || 'N/A',
        'Completion %': entry.survey_summary?.completion_percentage || 0,
        'Created Date': formatDate(entry.created_at),
        'Tags': entry.tags?.join(', ') || 'None'
      }));

      // Convert to CSV string
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      alert(translate('export_failed') || 'Export failed');
    }
  };

  // Render loading state
  if (loading && auditHistory.length === 0) {
    return (
      <div className="audit-trail-page">
        <MenuBar />
        <Container fluid className="py-4">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="text-center">
              <Spinner animation="border" role="status" className="mb-3">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p>{translate('loading_audit_trail') || 'Loading audit trail...'}</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Render error state
  if (error && auditHistory.length === 0) {
    return (
      <div className="audit-trail-page">
        <MenuBar />
        <Container fluid className="py-4">
          <Alert variant="danger" className="text-center">
            <h5>{translate('error_loading_audit_trail') || 'Error Loading Audit Trail'}</h5>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={fetchAuditTrail}>
              <RefreshCw size={16} className="me-2" />
              {translate('retry') || 'Retry'}
            </Button>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="audit-trail-page">
      <MenuBar />
      
      <Container fluid className="py-4">
        {/* Header */}
        <Row className="mt-2">
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                {/* <h2 className="mb-1">{translate('saved_analyses') || 'Saved Analyses'}</h2>
                <p className="text-muted mb-0">
                  {translate('manage_saved_analyses') || 'Manage and view your saved business analyses'}
                </p> */}
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft size={16} className="me-2" />
                  {translate('back_to_dashboard') || 'Back to Dashboard'}
                </Button>
                 
              </div>
            </div>

            {/* Stats Cards */}
            {/* <Row className="mb-4">
              <Col md={3}>
                <Card className="stats-card">
                  <Card.Body className="text-center">
                    <BarChart3 size={24} className="text-primary mb-2" />
                    <h4 className="mb-1">{totalCount}</h4>
                    <small className="text-muted">{translate('total_analyses') || 'Total Analyses'}</small>
                  </Card.Body>
                </Card>
              </Col>
                
            </Row> */}
          </Col>
        </Row>

        {/* Search and Filters */}
        <Row className="mb-4">
          <Col>
            <Card style={{ border: 'none' }}>
              <Card.Body>
                <Row className="align-items-end">
                  {/* Search */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>{translate('search') || 'Search'}</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <Search size={16} />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder={translate('search_analyses') || 'Search analyses...'}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  {/* View Mode Toggle */}
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>{translate('view') || 'View'}</Form.Label>
                      <div className="d-flex">
                        <Button
                          variant={viewMode === 'cards' ? 'primary' : 'outline-primary'}
                          size="sm"
                          onClick={() => setViewMode('cards')}
                          className="me-1"
                        >
                          <BarChart3 size={14} />
                        </Button>
                        <Button
                          variant={viewMode === 'table' ? 'primary' : 'outline-primary'}
                          size="sm"
                          onClick={() => setViewMode('table')}
                        >
                          <FileText size={14} />
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>

                  {/* Filter Toggle */}
                  <Col md={2}>
                    <Button
                      variant={showFilters ? 'primary' : 'outline-primary'}
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-100"
                    >
                      <Filter size={16} className="me-2" />
                      {translate('filters') || 'Filters'}
                    </Button>
                  </Col>

                  {/* Items per page */}
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>{translate('per_page') || 'Per Page'}</Form.Label>
                      <Form.Select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Refresh */}
                  <Col md={2}>
                    <Button
                      variant="outline-secondary"
                      onClick={fetchAuditTrail}
                      disabled={loading}
                      className="w-100"
                    >
                      <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                    </Button>
                  </Col>
                </Row>

                {/* Advanced Filters */}
                {showFilters && (
                  <Row className="mt-3 pt-3 border-top">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>{translate('business_name') || 'Business Name'}</Form.Label>
                        <Form.Select
                          value={selectedBusinessName}
                          onChange={(e) => setSelectedBusinessName(e.target.value)}
                        >
                          <option value="">{translate('all_businesses') || 'All Businesses'}</option>
                          {getUniqueBusinessNames().map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>{translate('analysis_type') || 'Analysis Type'}</Form.Label>
                        <Form.Select
                          value={selectedAnalysisType}
                          onChange={(e) => setSelectedAnalysisType(e.target.value)}
                        >
                          <option value="">{translate('all_types') || 'All Types'}</option>
                          {getUniqueAnalysisTypes().map(type => (
                            <option key={type} value={type}>{type.toUpperCase()}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>{translate('date_from') || 'Date From'}</Form.Label>
                        <Form.Control
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>{translate('date_to') || 'Date To'}</Form.Label>
                        <Form.Control
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={2} className="d-flex align-items-end">
                      <Button
                        variant="outline-secondary"
                        onClick={clearFilters}
                        className="w-100"
                      >
                        {translate('clear_filters') || 'Clear Filters'}
                      </Button>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Content */}
        {auditHistory.length === 0 && !loading ? (
          <Row>
            <Col>
              <Card>
                <Card.Body className="text-center py-5">
                  <BarChart3 size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">{translate('no_saved_analyses') || 'No Saved Analyses'}</h5>
                  <p className="text-muted">
                    {searchTerm || selectedBusinessName || selectedAnalysisType || dateFrom || dateTo
                      ? (translate('no_results_found') || 'No results found for the current filters')
                      : (translate('no_analyses_yet') || 'You haven\'t saved any analyses yet')
                    }
                  </p>
                  {(searchTerm || selectedBusinessName || selectedAnalysisType || dateFrom || dateTo) && (
                    <Button variant="outline-primary" onClick={clearFilters}>
                      {translate('clear_filters') || 'Clear Filters'}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <>
            {/* Results */}
            {viewMode === 'cards' ? (
              <AuditTrailCards 
                auditHistory={auditHistory}
                onViewDetails={fetchEntryDetails}
                detailLoading={detailLoading}
                translate={translate}
              />
            ) : (
              <AuditTrailTable 
                auditHistory={auditHistory}
                onViewDetails={fetchEntryDetails}
                detailLoading={detailLoading}
                translate={translate}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Row className="mt-4">
                <Col>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted">
                      {translate('showing') || 'Showing'} {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} {translate('of') || 'of'} {totalCount} {translate('results') || 'results'}
                    </div>
                    <Pagination>
                      <Pagination.First 
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(1)}
                      />
                      <Pagination.Prev 
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      />
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Pagination.Item>
                        );
                      })}
                      
                      <Pagination.Next 
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      />
                      <Pagination.Last 
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(totalPages)}
                      />
                    </Pagination>
                  </div>
                </Col>
              </Row>
            )}
          </>
        )}

        {/* Detail Modal */}
        <AuditTrailDetailModal
          show={showDetailModal}
          onHide={() => setShowDetailModal(false)}
          entry={selectedEntry}
          translate={translate}
        />
      </Container>

      {/* CSS for spinning animation */}
      <style jsx>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .stats-card {
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }

        .stats-card:hover {
          transform: translateY(-2px);
        }

        .audit-card {
          transition: transform 0.2s, box-shadow 0.2s;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .audit-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .tag-badge {
          font-size: 0.75rem;
          margin-right: 4px;
          margin-bottom: 2px;
        }
      `}</style>
    </div>
  );
};

// Audit Trail Cards Component
const AuditTrailCards = ({ auditHistory, onViewDetails, detailLoading, translate }) => (
  <Row>
    {auditHistory.map((entry) => (
      <Col md={6} lg={4} key={entry.id} className="mb-4">
        <Card className="audit-card h-100">
          <Card.Body className="d-flex flex-column">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="flex-grow-1">
                <h6 className="mb-1 text-truncate" title={entry.title}>
                  {entry.title}
                </h6>
                <small className="text-muted">{entry.business_name}</small>
              </div>
              <Badge 
                bg={entry.analysis_summary?.category === 'analysis' ? 'primary' : 'success'}
                className="ms-2"
              >
                {entry.analysis_summary?.type?.toUpperCase() || 'N/A'}
              </Badge>
            </div>

            <div className="mb-2">
              <small className="text-muted d-block">
                <strong>{translate('framework') || 'Framework'}:</strong> {entry.analysis_summary?.framework || 'N/A'}
              </small>
              <small className="text-muted d-block">
                <strong>{translate('completion') || 'Completion'}:</strong> {entry.survey_summary?.completion_percentage || 0}%
              </small>
            </div>

            {entry.description && (
              <p className="text-muted small mb-2" style={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {entry.description}
              </p>
            )}

            {entry.tags && entry.tags.length > 0 && (
              <div className="mb-2">
                {entry.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} bg="light" text="dark" className="tag-badge">
                    {tag}
                  </Badge>
                ))}
                {entry.tags.length > 3 && (
                  <Badge bg="light" text="dark" className="tag-badge">
                    +{entry.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="mt-auto">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {formatRelativeTime(entry.created_at)}
                </small>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => onViewDetails(entry.id)}
                  disabled={detailLoading}
                >
                  <Eye size={14} className="me-1" />
                  {translate('view') || 'View'}
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    ))}
  </Row>
);

// Audit Trail Table Component
const AuditTrailTable = ({ auditHistory, onViewDetails, detailLoading, translate }) => (
  <Row>
    <Col>
      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>{translate('title') || 'Title'}</th>
                <th>{translate('business') || 'Business'}</th>
                <th>{translate('type') || 'Type'}</th>
                <th>{translate('framework') || 'Framework'}</th>
                <th>{translate('completion') || 'Completion'}</th>
                <th>{translate('created') || 'Created'}</th>
                <th>{translate('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {auditHistory.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <div>
                      <strong className="text-truncate d-block" style={{ maxWidth: '200px' }}>
                        {entry.title}
                      </strong>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="mt-1">
                          {entry.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} bg="light" text="dark" className="tag-badge">
                              {tag}
                            </Badge>
                          ))}
                          {entry.tags.length > 2 && (
                            <Badge bg="light" text="dark" className="tag-badge">
                              +{entry.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{entry.business_name}</td>
                  <td>
                    <Badge 
                      bg={entry.analysis_summary?.category === 'analysis' ? 'primary' : 'success'}
                    >
                      {entry.analysis_summary?.type?.toUpperCase() || 'N/A'}
                    </Badge>
                  </td>
                  <td>{entry.analysis_summary?.framework || 'N/A'}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div 
                        className="progress me-2" 
                        style={{ width: '60px', height: '6px' }}
                      >
                        <div 
                          className="progress-bar" 
                          style={{ width: `${entry.survey_summary?.completion_percentage || 0}%` }}
                        ></div>
                      </div>
                      <small>{entry.survey_summary?.completion_percentage || 0}%</small>
                    </div>
                  </td>
                  <td>
                    <small>{formatDate(entry.created_at)}</small>
                    <br />
                    <small className="text-muted">{formatRelativeTime(entry.created_at)}</small>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => onViewDetails(entry.id)}
                      disabled={detailLoading}
                    >
                      <Eye size={14} className="me-1" />
                      {translate('view') || 'View'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

// Audit Trail Detail Modal Component
const AuditTrailDetailModal = ({ show, onHide, entry, translate }) => {
  if (!entry) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <FileText className="me-2" size={24} />
          {translate('analysis_details') || 'Analysis Details'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Row>
          <Col md={8}>
            {/* Basic Information */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">{translate('basic_information') || 'Basic Information'}</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    {/* <div className="mb-3">
                      <strong>{translate('title') || 'Title'}:</strong>
                      <p className="mb-0">{entry.title}</p>
                    </div> */}
                    <div className="mb-3">
                      <strong>{translate('business_name') || 'Business Name'}:</strong>
                      <p className="mb-0">{entry.business_name}</p>
                    </div>
                    <div className="mb-3">
                      <strong>{translate('date') || 'Date'}:</strong>
                      <p className="mb-0">{formatDate(entry.created_at)}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>{translate('analysis_type') || 'Analysis Type'}:</strong>
                      <p className="mb-0">
                        <Badge bg="primary">
                          {entry.analysis_data?.analysis_type?.toUpperCase() || 'N/A'}
                        </Badge>
                      </p>
                    </div>
                    {/* <div className="mb-3">
                      <strong>{translate('framework') || 'Framework'}:</strong>
                      <p className="mb-0">{entry.analysis_data?.analysis_framework || 'N/A'}</p>
                    </div>
                    <div className="mb-3">
                      <strong>{translate('category') || 'Category'}:</strong>
                      <p className="mb-0">
                        <Badge bg={entry.analysis_data?.category === 'analysis' ? 'info' : 'success'}>
                          {entry.analysis_data?.category || 'N/A'}
                        </Badge>
                      </p>
                    </div> */}
                  </Col>
                </Row>

                {entry.description && (
                  <div className="mb-3">
                    <strong>{translate('description') || 'Description'}:</strong>
                    <p className="mb-0">{entry.description}</p>
                  </div>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <div>
                    <strong>{translate('tags') || 'Tags'}:</strong>
                    <div className="mt-1">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                          <Tag size={12} className="me-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Survey Information */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">{translate('survey_information') || 'Survey Information'}</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <div className="text-center">
                      <h4 className="text-primary">{entry.survey_data?.completion_percentage || 0}%</h4>
                      <small className="text-muted">{translate('completion_rate') || 'Completion Rate'}</small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <h4 className="text-success">{entry.survey_data?.questions?.length || 0}</h4>
                      <small className="text-muted">{translate('total_questions') || 'Total Questions'}</small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <h4 className="text-info">{entry.survey_data?.answers?.length || 0}</h4>
                      <small className="text-muted">{translate('answered_questions') || 'Answered Questions'}</small>
                    </div>
                  </Col>
                </Row>

                {/* <hr /> */}

                {/* <div className="mb-2">
                  <strong>{translate('survey_version') || 'Survey Version'}:</strong> {entry.survey_data?.version || 'N/A'}
                </div>
                <div className="mb-2">
                  <strong>{translate('submitted_at') || 'Submitted At'}:</strong> {formatDate(entry.survey_data?.submitted_at)}
                </div> */}
              </Card.Body>
            </Card>

            {/* Analysis Result Preview */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">{translate('analysis_result') || 'Analysis Result'}</h6>
              </Card.Header>
              <Card.Body>
                <div className="bg-light p-3 rounded">
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontSize: '0.9rem',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {typeof entry.analysis_data?.generated_result === 'string' 
                      ? entry.analysis_data.generated_result 
                      : JSON.stringify(entry.analysis_data?.generated_result, null, 2)
                    }
                  </pre>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            {/* User Information */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">{translate('user_information') || 'User Information'}</h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-2">
                  <strong>{translate('name') || 'Name'}:</strong>
                  <p className="mb-0">{entry.user?.name || 'N/A'}</p>
                </div>
                <div className="mb-2">
                  <strong>{translate('email') || 'Email'}:</strong>
                  <p className="mb-0">{entry.user?.email || 'N/A'}</p>
                </div>
              </Card.Body>
            </Card>

            {/* Timeline */}
            {/* <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">{translate('timeline') || 'Timeline'}</h6>
              </Card.Header>
              <Card.Body>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-marker bg-primary"></div>
                    <div className="timeline-content">
                      <small className="text-muted">{translate('analysis_generated') || 'Analysis Generated'}</small>
                      <br />
                      <small>{formatDate(entry.analysis_generated_at)}</small>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-marker bg-success"></div>
                    <div className="timeline-content">
                      <small className="text-muted">{translate('analysis_saved') || 'Analysis Saved'}</small>
                      <br />
                      <small>{formatDate(entry.saved_at)}</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card> */}
 
          </Col>
        </Row>
      </Modal.Body>

      {/* <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {translate('close') || 'Close'}
        </Button>
        <Button 
          variant="primary" 
          onClick={() => {
            // Export this specific analysis
            const analysisText = typeof entry.analysis_data?.generated_result === 'string' 
              ? entry.analysis_data.generated_result 
              : JSON.stringify(entry.analysis_data?.generated_result, null, 2);
            
            const blob = new Blob([analysisText], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }}
        >
          <Download size={16} className="me-2" />
          {translate('export_analysis') || 'Export Analysis'}
        </Button>
      </Modal.Footer> */}

      {/* Timeline CSS */}
      <style jsx>{`
        .timeline {
          position: relative;
          padding-left: 20px;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e9ecef;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 15px;
        }

        .timeline-marker {
          position: absolute;
          left: -12px;
          top: 2px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 2px #e9ecef;
        }

        .timeline-content {
          margin-left: 8px;
        }
      `}</style>
    </Modal>
  );
};

export default AuditTrailPage;