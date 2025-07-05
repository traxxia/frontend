import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Alert,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Pagination
} from 'react-bootstrap';
import MenuBar from '../components/MenuBar';
import {
  MdArrowUpward,
  MdArrowDownward,
  MdUnfoldMore,
  MdRefresh,
  MdDownload
} from 'react-icons/md';
import { useTranslation } from '../hooks/useTranslation';

const Admin = () => {
  const { t } = useTranslation();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterText, setFilterText] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(t('failed_to_fetch_users'));
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadUserCSV = async (userId, version) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/download-csv/${userId}?version=${version}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error(t('failed_to_download_csv'));

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_${userId}_v${version}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(`${t('failed_to_download_csv')}: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users
    .filter(
      (user) =>
        user.name.toLowerCase().includes(filterText.toLowerCase()) ||
        user.email.toLowerCase().includes(filterText.toLowerCase())
    )
    .filter((user) => {
      if (!filterDate) return true;
      const userDate = new Date(user.created_at);
      const selectedDate = new Date(filterDate);
      return userDate.toDateString() === selectedDate.toDateString();
    });

  const sortedUsers = [...filteredUsers];
  if (sortOrder) {
    sortedUsers.sort((a, b) => {
      if (sortOrder === 'asc') return a.total_responses - b.total_responses;
      return b.total_responses - a.total_responses;
    });
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const renderSortArrow = () => {
    const iconStyle = { marginLeft: 5, fontSize: '20px' };
    if (sortOrder === 'asc') return <MdArrowUpward style={iconStyle} />;
    if (sortOrder === 'desc') return <MdArrowDownward style={iconStyle} />;
    return <MdUnfoldMore style={{ ...iconStyle, opacity: 0.5 }} />;
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  return (
    <>
      <MenuBar />
      <Container className="mt-4">
        <Row>
          <Col>
            <h3 className="mb-4">{t('admin_panel_users_management')}</h3>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}

            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{t('all_users')}</h5>
                  <Button variant="outline-primary" onClick={fetchUsers} disabled={loading}>
                    {loading ? <Spinner size="sm" /> : <MdRefresh size={20} />}
                  </Button>
                </div>
              </Card.Header>

              <Card.Body>
                <Row className="mb-3">
                  <Col md={6} sm={12}>
                    <Form.Control
                      type="text"
                      placeholder={t('filter_by_name_or_email')}
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                    />
                  </Col>
                  <Col md={3} sm={12}>
                    <Form.Control
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </Col>
                </Row>

                {loading ? (
                  <div className="text-center">
                    <Spinner animation="border" />
                  </div>
                ) : (
                  <>
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>{t('name')}</th>
                          <th>{t('email')}</th>
                          <th>{t('company')}</th>
                          <th>{t('created_at')}</th>
                          <th
                            role="button"
                            onClick={toggleSortOrder}
                            style={{ userSelect: 'none', cursor: 'pointer' }}
                            title={t('sort_by_total_responses')}
                          >
                            {t('total_responses')} {renderSortArrow()}
                          </th>
                          <th>{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentUsers.map((user) => (
                          <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.company}</td>
                            <td>{new Date(user.created_at).toLocaleDateString('en-US')}</td>
                            <td>{user.total_responses}</td>
                            <td>
                              {user.latest_response && (
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>{t('download_csv')}</Tooltip>}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline-success"
                                    onClick={() =>
                                      downloadUserCSV(user.id, user.latest_response.version)
                                    }
                                  >
                                    <MdDownload size={18} />
                                  </Button>
                                </OverlayTrigger>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    {sortedUsers.length > usersPerPage && (
                      <div className="d-flex justify-content-center">
                        <Pagination>
                          {[...Array(totalPages).keys()].map((page) => (
                            <Pagination.Item
                              key={page + 1}
                              active={page + 1 === currentPage}
                              onClick={() => setCurrentPage(page + 1)}
                            >
                              {page + 1}
                            </Pagination.Item>
                          ))}
                        </Pagination>
                      </div>
                    )}
                  </>
                )}

                {!loading && currentUsers.length === 0 && (
                  <div className="text-center text-muted">
                    <p>{t('no_users_found')}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Admin;
