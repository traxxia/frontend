import React, { useState, useEffect } from 'react';
import { Card, Table, Alert, Spinner, Button } from 'react-bootstrap';
import Pagination from './Pagination';
import { MdRefresh, MdUnfoldMore, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../store';

const StaleBetsAdmin = ({ onToast }) => {
  const { t } = useTranslation();
  const [staleProjects, setStaleProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [sortField, setSortField] = useState('next_review_date');
  const [sortOrder, setSortOrder] = useState('asc'); // asc / desc
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 10;

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchStaleProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE_URL}/api/admin/stale-projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(t('failed_to_fetch_stale_projects') || "Failed to fetch stale projects");
      }

      const data = await response.json();
      setStaleProjects(data.stale_projects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaleProjects();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedData = () => {
    const sorted = [...staleProjects];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      // Null safety
      if (!valA && valB) return sortOrder === 'asc' ? 1 : -1;
      if (valA && !valB) return sortOrder === 'asc' ? -1 : 1;
      if (!valA && !valB) return 0;
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const sortedData = getSortedData();

  // Pagination
  const indexOfLastItem = currentPage * projectsPerPage;
  const indexOfFirstItem = indexOfLastItem - projectsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / projectsPerPage);

  const renderSortArrow = (field) => {
    const iconStyle = { marginLeft: 5, fontSize: '16px', display: 'inline-block' };
    if (sortField !== field) return <MdUnfoldMore style={{ ...iconStyle, opacity: 0.5 }} />;
    return sortOrder === 'asc' ? <MdArrowUpward style={iconStyle} /> : <MdArrowDownward style={iconStyle} />;
  };

  return (
    <div className="admin-content-card">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{t('stale_bets') || "Stale Bets (Overdue Reviews)"}</h5>
          <Button variant="outline-primary" onClick={fetchStaleProjects} disabled={loading} size="sm">
            {loading ? <Spinner size="sm" /> : <MdRefresh size={20} />}
          </Button>
        </Card.Header>

        <Card.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {loading && staleProjects.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <>
              <Table responsive striped hover className="admin-table">
                <thead>
                  <tr>
                    <th role="button" onClick={() => handleSort('business_name')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {t('business') || "Business"} {renderSortArrow('business_name')}
                    </th>
                    <th role="button" onClick={() => handleSort('project_name')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {t('project') || "Project"} {renderSortArrow('project_name')}
                    </th>
                    <th role="button" onClick={() => handleSort('owner_name')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {t('owner') || "Accountable Owner"} {renderSortArrow('owner_name')}
                    </th>
                    <th role="button" onClick={() => handleSort('review_cadence')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {t('cadence') || "Cadence"} {renderSortArrow('review_cadence')}
                    </th>
                    <th role="button" onClick={() => handleSort('status')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {t('status') || "Status"} {renderSortArrow('status')}
                    </th>
                    <th role="button" onClick={() => handleSort('last_reviewed')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {t('last_reviewed') || "Last Reviewed"} {renderSortArrow('last_reviewed')}
                    </th>
                    <th role="button" onClick={() => handleSort('next_review_date')} className="text-danger" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {t('overdue_since') || "Overdue Since"} {renderSortArrow('next_review_date')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((project) => (
                      <tr key={project.project_id}>
                        <td>{project.business_name}</td>
                        <td className="font-weight-bold" style={{ fontWeight: 600 }}>{project.project_name}</td>
                        <td>{project.owner_name}</td>
                        <td>{t(project.review_cadence) || project.review_cadence}</td>
                        <td>
                          <span className={`badge bg-${(project.status || '').toLowerCase() === 'active' ? 'success' : 'warning'} text-dark border`}>
                            {t(project.status) || project.status}
                          </span>
                        </td>
                        <td>
                          {project.last_reviewed ? new Date(project.last_reviewed).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="text-danger font-weight-bold" style={{ fontWeight: 600 }}>
                          {project.next_review_date ? new Date(project.next_review_date).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        {t('no_stale_bets_found') || "No stale bets found. Great job on keeping up with reviews!"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {sortedData.length > projectsPerPage && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sortedData.length}
                    itemsPerPage={projectsPerPage}
                  />
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default StaleBetsAdmin;
