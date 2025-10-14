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
    description: '', city: '',
    country: ''
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

  // Custom menu state for alternatives
  const [showCustomMenu, setShowCustomMenu] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);

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
      description: '',
      city: '',
      country: ''
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
    if (businessFormData.city && businessFormData.city.length < 2) {
      setBusinessError('City must be at least 2 characters long');
      return;
    }

    if (businessFormData.country && businessFormData.country.length < 2) {
      setBusinessError('Country must be at least 2 characters long');
      return;
    }
    createBusiness();
  };

  // Delete Modal Functions
  const handleShowDeleteModal = (business) => {
    setBusinessToDelete(business);
    setShowDeleteModal(true);
    setDeleteError('');
    // Close any open custom menus
    setShowCustomMenu({});
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

  // Custom menu functions
  const toggleCustomMenu = (businessId) => {
    setShowCustomMenu(prev => ({
      ...prev,
      [businessId]: !prev[businessId]
    }));
  };

  // Close custom menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCustomMenu({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Different delete button alternatives
  const DeleteButtonAlternatives = ({ business, viewType }) => {
    const stats = business.question_statistics || {};
    const progress = stats.progress_percentage || 0;
    const completedQuestions = stats.completed_questions || 0;
    const totalQuestions = stats.total_questions || 0;
    const remainingQuestions = stats.pending_questions || 0;

    // Alternative 1: Simple Delete Button (Always Visible)
    const SimpleDeleteButton = () => (
      <button
        className="btn btn-outline-danger btn-sm delete-btn-simple"
        onClick={(e) => {
          e.stopPropagation();
          handleShowDeleteModal(business);
        }}
        title="Delete Business"
      >
        <Trash2 size={16} />
      </button>
    );

    // Alternative 2: Delete Button on Hover
    const HoverDeleteButton = () => (
      <>
        {hoveredItem === business._id && (
          <button
            className="btn btn-outline-danger btn-sm delete-btn-hover"
            onClick={(e) => {
              e.stopPropagation();
              handleShowDeleteModal(business);
            }}
            title="Delete Business"
          >
            <Trash2 size={16} />
          </button>
        )}
      </>
    );

    // Alternative 3: Custom Menu (No Bootstrap Dropdown)
    const CustomMenuButton = () => (
      <div className="custom-menu-container position-relative">
        <button
          className="btn btn-link p-1 menu-trigger"
          onClick={(e) => {
            e.stopPropagation();
            toggleCustomMenu(business._id);
          }}
          style={{ color: '#6c757d' }}
        >
          <MoreVertical size={16} />
        </button>

        {showCustomMenu[business._id] && (
          <div className="custom-dropdown-menu">
            <button
              className="custom-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                handleShowDeleteModal(business);
                setShowCustomMenu(prev => ({ ...prev, [business._id]: false }));
              }}
            >
              <Trash2 size={16} />
              {t('delete_business')}
            </button>
          </div>
        )}
      </div>
    );

    // Alternative 4: Icon Button with Confirmation
    const IconDeleteButton = () => (
      <button
        className="btn btn-link p-1 delete-icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Are you sure you want to delete "${business.business_name}"?`)) {
            handleShowDeleteModal(business);
          }
        }}
        style={{ color: '#dc3545' }}
        title="Delete Business"
      >
        <Trash2 size={18} />
      </button>
    );

    return (
      <div
        className="business-item d-flex align-items-center p-3 border-bottom position-relative"
        onMouseEnter={() => setHoveredItem(business._id)}
        onMouseLeave={() => setHoveredItem(null)}
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
            {completedQuestions}/{totalQuestions} {t('questions_completed')}
            {remainingQuestions > 0 && (
              <span className="text-warning ms-2">
                • {remainingQuestions} {t('remaining')}
              </span>
            )}
          </small>
        </div>

        {/* Choose one of these alternatives */}

        {/* Option 1: Simple Delete Button - Always visible */}
        <SimpleDeleteButton />

        {/* Option 2: Delete Button on Hover - Uncomment to use */}
        {/* <HoverDeleteButton /> */}

        {/* Option 3: Custom Menu - Uncomment to use */}
        {/* <CustomMenuButton /> */}

        {/* Option 4: Icon Delete Button - Uncomment to use */}
        {/* <IconDeleteButton /> */}
      </div>
    );
  };

  const BusinessList = ({ businesses, viewType }) => (
    <div className={`business-list ${viewType}`}>
      {businesses.length === 0 && (
        <div className="text-center text-muted py-5">
          {t('no_businesses_found')}
        </div>
      )}
      {businesses.length > 0 && businesses.map((business, index) => (
        <DeleteButtonAlternatives
          key={business._id || index}
          business={business}
          viewType={viewType}
        />
      ))}
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
      <style jsx>{`
        /* Custom Delete Button Styles */
        .delete-btn-simple,
        .delete-btn-hover {
          transition: all 0.2s ease;
        }

        .delete-btn-hover {
          animation: fadeIn 0.3s ease-in-out;
        }

        .delete-icon-btn:hover {
          transform: scale(1.1);
          color: #dc3545 !important;
        }

        /* Custom Menu Styles */
        .custom-menu-container {
          z-index: 10;
        }

        .menu-trigger {
          border: none !important;
          background: none !important;
          box-shadow: none !important;
        }

        .menu-trigger:focus {
          box-shadow: none !important;
        }

        .custom-dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          min-width: 150px;
          z-index: 1000;
          animation: slideDown 0.2s ease-out;
        }

        .custom-menu-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 10px 12px;
          border: none;
          background: none;
          color: #dc3545;
          font-size: 14px;
          cursor: pointer;
          gap: 8px;
          transition: background-color 0.2s ease;
        }

        .custom-menu-item:hover {
          background-color: #f8f9fa;
        }

        /* Dark theme support */
        [data-theme="dark"] .custom-dropdown-menu {
          background: var(--color-bg-secondary);
          border-color: var(--color-border-light);
        }

        [data-theme="dark"] .custom-menu-item:hover {
          background-color: var(--color-bg-primary);
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

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
                  <div className="px-4 pb-4 d-flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      className="flex-grow-1 create-business-btn"
                      onClick={handleShowCreateModal}
                    >
                      {t('create_business')}
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-grow-1 create-business-btn"
                      onClick={() => setShowHowModal(true)}
                    >
                      <Info size={18} className="me-2" />
                      {t('how_it_works')}
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
                        <div className="d-flex flex-wrap gap-2">
                          <Button
                            variant="primary"
                            className="create-business-btn"
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
                            {t('how_it_works')}
                          </Button>
                        </div>
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

            <h2 className="mb-4">{t('how_this_application_works')}</h2>

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
                <button
                  type="button"
                  data-bs-target="#howItWorksCarousel"
                  data-bs-slide-to="4"
                  aria-label="Slide 5"
                ></button>
              </div>

              <div className="carousel-inner">
                <div className="carousel-item active">
                  <img
                    src="/slides/slide1.jpeg"
                    className="d-block w-100"
                    alt="Step 1: Login to your account"
                  />
                  <div className="carousel-caption d-none d-md-block">
                    <h5>Step 1: Login</h5>
                    <p>Sign in to access your personalized business dashboard.</p>
                  </div>
                </div>
                <div className="carousel-item">
                  <img
                    src="/slides/slide2.jpeg"
                    className="d-block w-100"
                    alt="Step 2: Create your business profile"
                  />
                  <div className="carousel-caption d-none d-md-block">
                    <h5>Step 2: Create Your Business</h5>
                    <p>Start by setting up your business profile with basic information.</p>
                  </div>
                </div>
                <div className="carousel-item">
                  <img
                    src="/slides/slide3.jpeg"
                    className="d-block w-100"
                    alt="Step 3: Answer assessment questions"
                  />
                  <div className="carousel-caption d-none d-md-block">
                    <h5>Step 3: Complete Assessment</h5>
                    <p>Answer questions about your business to get personalized insights.</p>
                  </div>
                </div>
                <div className="carousel-item">
                  <img
                    src="/slides/slide4.jpeg"
                    className="d-block w-100"
                    alt="Step 4: Get insights and recommendations"
                  />
                  <div className="carousel-caption d-none d-md-block">
                    <h5>Step 4: Get Insights</h5>
                    <p>Receive detailed analysis and actionable recommendations.</p>
                  </div>
                </div>
                <div className="carousel-item">
                  <img
                    src="/slides/slide5.jpeg"
                    className="d-block w-100"
                    alt="Step 5: View strategic recommendations"
                  />
                  <div className="carousel-caption d-none d-md-block">
                    <h5>Step 5: Strategic Recommendations</h5>
                    <p>Access personalized strategic recommendations tailored to your business goals and growth opportunities.</p>
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
                {t('got_it')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Business Modal */}
      <Modal show={showCreateModal} onHide={handleCloseCreateModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('create_new_business')}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitBusiness}>
          <Modal.Body>
            {businessError && (
              <Alert variant="danger" className="mb-3">
                {businessError}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>{t('business_name')} <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="business_name"
                value={businessFormData.business_name}
                onChange={handleFormChange}
                placeholder={t('enter_your_business_name')}
                required
                disabled={isCreatingBusiness}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('business_purpose')} <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="business_purpose"
                value={businessFormData.business_purpose}
                onChange={handleFormChange}
                placeholder={t('brief_description_of_what')}
                required
                disabled={isCreatingBusiness}
              />
            </Form.Group>

            {/* NEW: City and Country Fields Row */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>City ({t('optional')})</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={businessFormData.city}
                    onChange={handleFormChange}
                    placeholder="Enter city"
                    disabled={isCreatingBusiness}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Country ({t('optional')})</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={businessFormData.country}
                    onChange={handleFormChange}
                    placeholder="Enter country"
                    disabled={isCreatingBusiness}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>{t('description')} ({t('optional')})</Form.Label>
              <Form.Control
                as="textarea"
                className="dark-textarea"
                rows={3}
                name="description"
                value={businessFormData.description}
                onChange={handleFormChange}
                placeholder={t('detailed_description_of_your_business')}
                disabled={isCreatingBusiness}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              className="cancel-button"
              onClick={handleCloseCreateModal}
              disabled={isCreatingBusiness}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isCreatingBusiness}
            >
              {isCreatingBusiness ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {t('creating')}
                </>
              ) : (
                t('create_business')
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
            {t('delete_business')}
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
              <p className="mb-3">{t('are_you_sure_you_want_to_delete')} <strong>"{businessToDelete.business_name}"</strong>?</p>

              <div className="alert alert-danger mb-3">
                <h6 className="alert-heading mb-2">⚠️ {t('This_will_permanently_delete')}</h6>
                <ul className="mb-2">
                  <li><strong>{t('All_question_responses_and_conversations')}</strong></li>
                  <li><strong>{t('All_generated_analysis_reports_and_insights')}</strong></li>
                  <li><strong>{t('All_progress_data_and_statistics')}</strong></li>
                  <li><strong>{t('the_business_profile_itself')}</strong></li>
                </ul>
                <hr className="my-2" />
                <p className="mb-0"><strong>{t('This_action_cannot_be_undone!')}</strong></p>
              </div>

              <div className="bg-light p-3 rounded delete-popup-purpose">
                <p className="mb-1"><strong>{t('business_purpose')}:</strong></p>
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
            {t('cancel')}
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
                {t('delete_business')}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Dashboard;