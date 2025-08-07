import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Modal,
  Form,
  Alert,
  Dropdown,
} from "react-bootstrap";
import {
  ArrowRight, Info, X, MoreVertical, Trash2
} from "lucide-react";

// Components
import MenuBar from "../components/MenuBar";

// Styles
import "../styles/dashboard.css";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useTranslation } from '../hooks/useTranslation';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Business management state
  const [businesses, setBusinesses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false);
  const [businessFormData, setBusinessFormData] = useState({
    business_name: '',
    business_purpose: '',
    description: ''
  });
  const [businessError, setBusinessError] = useState('');

  // Delete business state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState(null);
  const [isDeletingBusiness, setIsDeletingBusiness] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Tour modal state
  const [showHowModal, setShowHowModal] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Fetch businesses on component mount
  useEffect(() => {
    fetchBusinesses();
  }, []);

  // API Functions
  const fetchBusinesses = async () => {
    try {
      const token = sessionStorage.getItem('token');

      if (!token) {
        console.error('No token found in sessionStorage');
        setBusinessError('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/businesses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
        setBusinessError('');
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch businesses:', errorData);

        if (response.status === 401 || response.status === 403) {
          sessionStorage.clear();
          navigate('/login');
        } else {
          setBusinessError(errorData.error || 'Failed to load businesses');
        }
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setBusinessError('Network error. Please check your connection and try again.');
    }
  };

  const deleteBusiness = async (businessId) => {
    try {
      setIsDeletingBusiness(true);
      setDeleteError('');

      const token = sessionStorage.getItem('token');

      if (!token) {
        setDeleteError('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/businesses/${businessId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        await fetchBusinesses();
        setShowDeleteModal(false);
        setBusinessToDelete(null);
        
        setSuccessMessage('Business and all associated data deleted successfully!');
        setShowSuccessPopup(true);
        
        setTimeout(() => {
          setShowSuccessPopup(false);
          setSuccessMessage('');
        }, 4000);
      } else {
        console.error('Delete business error:', data);
        
        if (response.status === 401 || response.status === 403) {
          sessionStorage.clear();
          navigate('/login');
        } else {
          setDeleteError(data.error || 'Failed to delete business');
        }
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      setDeleteError('Network error. Please try again.');
    } finally {
      setIsDeletingBusiness(false);
    }
  };

  const createBusiness = async () => {
    try {
      setIsCreatingBusiness(true);
      setBusinessError('');

      const token = sessionStorage.getItem('token');

      if (!token) {
        setBusinessError('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/businesses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(businessFormData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Business created successfully!');
        setShowSuccessPopup(true);
        
        setBusinessFormData({
          business_name: '',
          business_purpose: '',
          description: ''
        });

        await fetchBusinesses();
        setShowCreateModal(false);
        
        setTimeout(() => {
          setShowSuccessPopup(false);
          setSuccessMessage('');
        }, 4000);
      } else {
        console.error('Create business error:', data);

        if (response.status === 401 || response.status === 403) {
          sessionStorage.clear();
          navigate('/login');
        } else {
          setBusinessError(data.error || 'Failed to create business');
        }
      }
    } catch (error) {
      setBusinessError('Network error. Please try again.');
      console.error('Error creating business:', error);
    } finally {
      setIsCreatingBusiness(false);
    }
  };

  // Business Modal Functions
  const handleShowCreateModal = () => {
    setShowCreateModal(true);
    setBusinessError('');
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setBusinessFormData({
      business_name: '',
      business_purpose: '',
      description: ''
    });
    setBusinessError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setBusinessFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitBusiness = (e) => {
    e.preventDefault();

    if (!businessFormData.business_name.trim() || !businessFormData.business_purpose.trim()) {
      setBusinessError('Business name and purpose are required');
      return;
    }

    createBusiness();
  };

  // Delete Modal Functions
  const handleShowDeleteModal = (business) => {
    setBusinessToDelete(business);
    setShowDeleteModal(true);
    setDeleteError('');
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setBusinessToDelete(null);
    setDeleteError('');
  };

  const handleConfirmDelete = () => {
    if (businessToDelete) {
      deleteBusiness(businessToDelete._id);
    }
  };

  const BusinessList = ({ businesses, viewType }) => (
    <div className={`business-list ${viewType}`}>
      {businesses.length === 0 && (
        <div className="text-center text-muted py-5">
          {t('no_businesses_found')}
        </div>
      )}
      {businesses.length > 0 && businesses.map((business, index) => {
        const stats = business.question_statistics || {};
        const progress = stats.progress_percentage || 0;
        const completedQuestions = stats.completed_questions || 0;
        const totalQuestions = stats.total_questions || 0;
        const remainingQuestions = stats.pending_questions || 0;

        return (
          <div
            key={business._id || index}
            className="business-item d-flex align-items-center p-3 border-bottom position-relative"
          >
            <div 
              style={{ width: 60, height: 60, cursor: "pointer" }} 
              className="progress-circle me-3"
              onClick={() => handleBusinessClick(business)}
            >
              <CircularProgressbar
                value={progress}
                text={`${Math.round(progress)}%`}
                styles={buildStyles({
                  pathColor: progress === 100 ? "#28a745" : progress > 50 ? "#ffc107" : "#17a2b8",
                  textColor: "#000",
                  trailColor: "#e9ecef",
                  textSize: "28px",
                  pathTransitionDuration: 0.5,
                })}
              />
            </div>

            <div 
              className="flex-grow-1"
              onClick={() => handleBusinessClick(business)}
              style={{ cursor: "pointer" }}
            >
              <h6 className="mb-1">{business.business_name}</h6>
              <small className="text-muted">
                {completedQuestions}/{totalQuestions} questions completed
                {remainingQuestions > 0 && (
                  <span className="text-warning ms-2">
                    • {remainingQuestions} remaining
                  </span>
                )}
              </small>
            </div>

            <Dropdown align="end" className="me-2">
              <Dropdown.Toggle
                variant="link"
                className="p-0 border-0 shadow-none"
                style={{ color: '#6c757d' }}
              >
                <MoreVertical size={16} />
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {/* <Dropdown.Item onClick={() => handleBusinessClick(business)}>
                  <ArrowRight size={16} className="me-2" />
                  View Business
                </Dropdown.Item>
                <Dropdown.Divider /> */}
                <Dropdown.Item 
                  onClick={() => handleShowDeleteModal(business)}
                  className="text-danger"
                >
                  <Trash2 size={16} className="me-2" />
                  Delete Business
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        );
      })}
    </div>
  );

  // Event Handlers
  const handleBusinessClick = (business) => {
    navigate('/businesspage', { state: { business } });
  };

  const handleCloseModal = () => {
    setShowHowModal(false);
  };

  // Main render
  return (
    <div className="dashboard-layout">
      <MenuBar />

      <Container fluid className="p-0 main-content">
        <div className="responsive-view-container">
          <Row className="h-100 justify-content-center">
            <Col xs={12} className="p-0">
              {/* Mobile View */}
              <Card className="mobile-view-card d-md-none">
                <Card.Body className="p-0">
                  <div className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">{t('welcome')}</h5>
                    </div>
                    <p className="text-muted small mb-4">{t('welcome_message')}</p>
                  </div>
                  <div className="px-4 mb-4">
                    <h6 className="mb-3">{t('my_businesses')}</h6>
                    <BusinessList businesses={businesses} viewType="mobile" />
                  </div>
                  <div className="px-4 pb-4">
                    <Button
                      variant="primary"
                      className="w-100 create-business-btn"
                      onClick={handleShowCreateModal}
                    >
                      {t('create_business')}
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Desktop View */}
              <Card className="desktop-view-card d-none d-md-block">
                <Card.Body className="p-0 h-100">
                  <Row className="h-100 g-0">
                    <Col md={6} className="welcome-section">
                      <div>
                        <div className="d-flex justify-content-between align-items-start mb-4">
                          <div>
                            <h5 className="mb-2">{t('welcome')}</h5>
                          </div>
                        </div>
                        <p className="text-muted mb-4">{t('welcome_message')}</p>
                        <Button
                          variant="primary"
                          className="create-business-btn me-3"
                          onClick={handleShowCreateModal}
                        >
                          {t('create_business')}
                        </Button>

                        <Button
                          variant="primary"
                          className="create-business-btn"
                          onClick={() => setShowHowModal(true)}
                        >
                          <Info size={18} className="me-2" />
                          How It Works
                        </Button>

                        {/* How It Works Modal */}
                        {showHowModal && (
                          <div className="popup-overlay" onClick={handleCloseModal}>
                            <div className="popup-content large" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="close-button"
                                onClick={handleCloseModal}
                                aria-label="Close modal"
                              >
                                <X size={20} />
                              </button>

                              <h2 className="mb-4">How This Application Works</h2>

                              <div id="howItWorksCarousel" className="carousel slide" data-bs-ride="carousel" data-bs-interval="5000">
                                <div className="carousel-indicators">
                                  <button
                                    type="button"
                                    data-bs-target="#howItWorksCarousel"
                                    data-bs-slide-to="0"
                                    className="active"
                                    aria-label="Slide 1"
                                  ></button>
                                  <button
                                    type="button"
                                    data-bs-target="#howItWorksCarousel"
                                    data-bs-slide-to="1"
                                    aria-label="Slide 2"
                                  ></button>
                                  <button
                                    type="button"
                                    data-bs-target="#howItWorksCarousel"
                                    data-bs-slide-to="2"
                                    aria-label="Slide 3"
                                  ></button>
                                  <button
                                    type="button"
                                    data-bs-target="#howItWorksCarousel"
                                    data-bs-slide-to="3"
                                    aria-label="Slide 4"
                                  ></button>
                                </div>

                                <div className="carousel-inner">
                                  <div className="carousel-item active">
                                    <img
                                      src="/slides/slide1.jpeg"
                                      className="d-block w-100"
                                      alt="Step 1: Create your business profile"
                                    />
                                    <div className="carousel-caption d-none d-md-block">
                                      <h5>Step 1: Create Your Business</h5>
                                      <p>Start by setting up your business profile with basic information.</p>
                                    </div>
                                  </div>
                                  <div className="carousel-item">
                                    <img
                                      src="/slides/slide2.jpeg"
                                      className="d-block w-100"
                                      alt="Step 2: Answer assessment questions"
                                    />
                                    <div className="carousel-caption d-none d-md-block">
                                      <h5>Step 2: Complete Assessment</h5>
                                      <p>Answer questions about your business to get personalized insights.</p>
                                    </div>
                                  </div>
                                  <div className="carousel-item">
                                    <img
                                      src="/slides/slide3.jpeg"
                                      className="d-block w-100"
                                      alt="Step 3: Get insights and recommendations"
                                    />
                                    <div className="carousel-caption d-none d-md-block">
                                      <h5>Step 3: Get Insights</h5>
                                      <p>Receive detailed analysis and actionable recommendations.</p>
                                    </div>
                                  </div>
                                  <div className="carousel-item">
                                    <img
                                      src="/slides/slide4.PNG"
                                      className="d-block w-100"
                                      alt="Step 4: Track progress and optimize"
                                    />
                                    <div className="carousel-caption d-none d-md-block">
                                      <h5>Step 4: Track & Optimize</h5>
                                      <p>Monitor your progress and continuously improve your business performance.</p>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  className="carousel-control-prev"
                                  type="button"
                                  data-bs-target="#howItWorksCarousel"
                                  data-bs-slide="prev"
                                  aria-label="Previous slide"
                                >
                                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                  <span className="visually-hidden">Previous</span>
                                </button>
                                <button
                                  className="carousel-control-next"
                                  type="button"
                                  data-bs-target="#howItWorksCarousel"
                                  data-bs-slide="next"
                                  aria-label="Next slide"
                                >
                                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                  <span className="visually-hidden">Next</span>
                                </button>
                              </div>

                              <div className="text-center mt-4">
                                <Button
                                  variant="primary"
                                  onClick={handleCloseModal}
                                  className="px-4"
                                >
                                  Got it!
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Col>

                    {/* RIGHT SIDE - Business List */}
                    <Col md={6} className="businesses-section">
                      <div>
                        <h6 className="mb-4">{t('my_businesses')}</h6>
                        <BusinessList businesses={businesses} viewType="desktop" />
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </Container>

      {/* Create Business Modal */}
      <Modal show={showCreateModal} onHide={handleCloseCreateModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Business</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitBusiness}>
          <Modal.Body>
            {businessError && (
              <Alert variant="danger" className="mb-3">
                {businessError}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Business Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="business_name"
                value={businessFormData.business_name}
                onChange={handleFormChange}
                placeholder="Enter your business name"
                required
                disabled={isCreatingBusiness}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Business Purpose <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="business_purpose"
                value={businessFormData.business_purpose}
                onChange={handleFormChange}
                placeholder="Brief description of what your business does"
                required
                disabled={isCreatingBusiness}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={businessFormData.description}
                onChange={handleFormChange}
                placeholder="Detailed description of your business..."
                disabled={isCreatingBusiness}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseCreateModal}
              disabled={isCreatingBusiness}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isCreatingBusiness}
            >
              {isCreatingBusiness ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Creating...
                </>
              ) : (
                'Create Business'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="success-popup-overlay">
          <div className="success-popup">
            <div className="success-popup-content">
              <div className="success-icon">
                ✅
              </div>
              <h5 className="mb-2">Success!</h5>
              <p className="mb-3">{successMessage}</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowSuccessPopup(false);
                  setSuccessMessage('');
                }}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Business Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <Trash2 size={20} className="me-2" />
            Delete Business
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && (
            <Alert variant="danger" className="mb-3">
              {deleteError}
            </Alert>
          )}
          
          {businessToDelete && (
            <div>
              <p className="mb-3">Are you sure you want to delete <strong>"{businessToDelete.business_name}"</strong>?</p>
              
              <div className="alert alert-danger mb-3">
                <h6 className="alert-heading mb-2">⚠️ This will permanently delete:</h6>
                <ul className="mb-2">
                  <li><strong>All question responses and conversations</strong></li>
                  <li><strong>All generated analysis reports and insights</strong></li>
                  <li><strong>All progress data and statistics</strong></li>
                  <li><strong>The business profile itself</strong></li>
                </ul>
                <hr className="my-2" />
                <p className="mb-0"><strong>This action cannot be undone!</strong></p>
              </div>
              
              <div className="bg-light p-3 rounded">
                <p className="mb-1"><strong>Business Purpose:</strong></p>
                <p className="text-muted mb-0">{businessToDelete.business_purpose}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseDeleteModal}
            disabled={isDeletingBusiness}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={isDeletingBusiness}
          >
            {isDeletingBusiness ? (
              <>
                <Spinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} className="me-2" />
                Delete Business
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Dashboard;