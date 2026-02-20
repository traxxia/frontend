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
  Accordion
} from "react-bootstrap";
import {
  Info, X, Trash2, AlertTriangle
} from "lucide-react";
import MenuBar from "../components/MenuBar";
import PMFOnboardingModal from "../components/PMFOnboardingModal";
import PMFInsights from "../components/PMFInsights";
import "../styles/dashboard.css";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useTranslation } from '../hooks/useTranslation';
import UpgradeModal from '../components/UpgradeModal';
import PlanLimitModal from '../components/PlanLimitModal';

const ENABLE_PMF = process.env.REACT_APP_ENABLE_PMF === 'true';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [businesses, setBusinesses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPMFOnboarding, setShowPMFOnboarding] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false);
  const [businessFormData, setBusinessFormData] = useState({
    business_name: '',
    business_purpose: '',
    description: '',
    city: '',
    country: ''
  });
  const [businessError, setBusinessError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const userRole = sessionStorage.getItem("userRole");
  const isViewer = userRole?.toLowerCase() === "viewer";
  const isCollaborator = userRole?.toLowerCase() === "collaborator";


  // Delete business state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState(null);
  const [isDeletingBusiness, setIsDeletingBusiness] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);


  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [collaboratingBusinesses, setCollaboratingBusinesses] = useState([]);

  // Deletion cooldown state
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState('');


  // Tour modal state
  const [showHowModal, setShowHowModal] = useState(false);

  // Plan Limit Modal state
  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false);

  // Custom menu state for alternatives
  const [showCustomMenu, setShowCustomMenu] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const myBusinesses = businesses.filter(
    b => Boolean(b.has_projects) === false
  );

  const projectPhaseBusinesses = businesses.filter(
    b => Boolean(b.has_projects) === true
  );

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Fetch businesses on component mount
  useEffect(() => {
    fetchBusinesses();
    //fetchSubscriptionDetails();
  }, []);

  const fetchSubscriptionDetails = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/subscription/plan-details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Show success popup with subscription info
        const expiryDate = data.expires_at ? new Date(data.expires_at).toLocaleDateString() : 'N/A';
        setSuccessMessage(`Welcome! Your ${data.plan} plan is active until ${expiryDate}.`);
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 5000);
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    }
  };

  // API Functions
  const fetchBusinesses = async () => {
    try {
      setIsLoadingBusinesses(true);
      const token = sessionStorage.getItem('token');

      if (!token) {
        console.error('No token found in sessionStorage');
        setBusinessError(t('authentication_required'));
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
        const collabList = data.collaboratingBusinesses || data.collaborating_businesses || [];
        setBusinesses(data.businesses || []);
        setCollaboratingBusinesses(Array.isArray(collabList) ? collabList : []);
        setBusinessError('');
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch businesses:', errorData);

        if (response.status === 401 || response.status === 403) {
          sessionStorage.clear();
          navigate('/login');
        } else {
          setBusinessError(errorData.error || t('failed_to_load_businesses'));
        }
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setBusinessError(t('network_error'));
    } finally {
      setIsLoadingBusinesses(false);
    }
  };

  const deleteBusiness = async (businessId) => {
    try {
      setIsDeletingBusiness(true);
      setDeleteError('');

      const token = sessionStorage.getItem('token');

      if (!token) {
        setDeleteError(t('authentication_required'));
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

        setSuccessMessage(t('business_deleted_successfully'));
        setShowSuccessPopup(true);

        setTimeout(() => {
          setShowSuccessPopup(false);
          setSuccessMessage('');
        }, 4000);
      } else {
        console.error('Delete business error:', data);

        if (response.status === 401) {
          sessionStorage.clear();
          navigate('/login');
        } else if (response.status === 403 && data.error && data.error.includes('30 days')) {
          setCooldownMessage(data.error);
          setShowCooldownModal(true);
          setShowDeleteModal(false);
        } else if (response.status === 403) {
          sessionStorage.clear();
          navigate('/login');
        } else {
          setDeleteError(data.error || t('failed_to_delete_business'));
        }
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      setDeleteError(t('network_error_try_again'));
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
        setBusinessError(t('authentication_required'));
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
        setSuccessMessage(t('business_created_successfully'));
        setShowSuccessPopup(true);

        setBusinessFormData({
          business_name: '',
          business_purpose: '',
          description: '',
          city: '',
          country: ''
        });

        await fetchBusinesses();
        setShowCreateModal(false);

        // Show PMF Onboarding modal after successful business creation (only if enabled)
        setTimeout(() => {
          setShowSuccessPopup(false);
          setSuccessMessage('');
          if (ENABLE_PMF) setShowPMFOnboarding(true);
        }, 2000);
      } else {
        console.error('Create business error:', data);

        if (response.status === 401) {
          sessionStorage.clear();
          navigate('/login');
        } else if (response.status === 403 && data.error && data.error.includes('limit reached')) {
          setShowUpgradeModal(true);
        } else {
          setBusinessError(data.error || t('failed_to_create_business'));
        }
      }
    } catch (error) {
      setBusinessError(t('network_error_try_again'));
      console.error('Error creating business:', error);
    } finally {
      setIsCreatingBusiness(false);
    }
  };

  // Validation Functions
  const validateForm = () => {
    const errors = {};

    // Business Name validation
    const businessName = businessFormData.business_name.trim();
    if (!businessName) {
      errors.business_name = t('business_name_cannot_be_empty');
    } else if (businessName.length > 20) {
      errors.business_name = t('business_name_max_length');
    } else if (!/[a-zA-Z]/.test(businessName)) {
      errors.business_name = t('business_name_must_contain_alphabetic_characters') || 'Business name must contain at least some alphabetic characters';
    } else if (startsWithSymbolOrNumber(businessName)) {
      errors.business_name = t('business_name_invalid_start');
    }

    // Business Purpose validation
    const businessPurpose = businessFormData.business_purpose.trim();
    if (!businessPurpose) {
      errors.business_purpose = t('business_purpose_required');
    } else if (!/[a-zA-Z]/.test(businessPurpose)) {
      errors.business_purpose = t('business_purpose_must_contain_alphabetic_characters') || 'Business purpose must contain at least some alphabetic characters';
    }

    // City validation (optional but if provided, must be valid)
    const cityTrimmed = businessFormData.city.trim();
    const cityHasSpecialChars = /[^a-zA-Z\s]/.test(cityTrimmed);

    if (businessFormData.city && cityTrimmed.length === 0) {
      errors.city = t('city_cannot_contain_only_spaces');
    } else if (cityTrimmed.length > 0 && cityTrimmed.length < 2) {
      errors.city = t('city_min_length');
    } else if (cityTrimmed.length > 20) {
      errors.city = t('city_max_length');
    } else if (cityHasSpecialChars) {
      errors.city = t('city_cannot_contain_special_characters');
    }

    // Country validation (optional but if provided, must be valid)
    const countryTrimmed = businessFormData.country.trim();
    const countryHasSpecialChars = /[^a-zA-Z\s]/.test(countryTrimmed);

    if (businessFormData.country && countryTrimmed.length === 0) {
      errors.country = t('country_cannot_contain_only_spaces');
    } else if (countryTrimmed.length > 0 && countryTrimmed.length < 2) {
      errors.country = t('country_min_length');
    } else if (countryTrimmed.length > 20) {
      errors.country = t('country_max_length');
    } else if (countryHasSpecialChars) {
      errors.country = t('country_cannot_contain_special_characters');
    }


    if (businessFormData.description && /\s{3,}/.test(businessFormData.description)) {
      errors.description = t('description_no_continuous_spaces');
    }


    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isInvisibleOrEmpty = (str) => {
    if (!str) return true; // Empty or null

    const normalized = str
      .replace(/\\u[0-9A-Fa-f]{4}/g, '')
      .replace(/U\+[0-9A-Fa-f]{4}/g, '');

    const cleaned = normalized.replace(/\s+/g, '');
    return cleaned.length === 0;
  }

  const startsWithSymbolOrNumber = (str) => {
    if (!str) return false;
    const trimmed = str.trim();
    // Check if first visible character is NOT a letter
    return /^[^A-Za-z]/.test(trimmed);
  }

  // Business Modal Functions
  const handleShowCreateModal = () => {
    const userPlan = sessionStorage.getItem("userPlan");
    const activeBusinessesCount = businesses.filter(b => b.status !== 'deleted').length;

    if (userPlan === 'essential' && activeBusinessesCount >= 1) {
      setShowPlanLimitModal(true); // Show limit modal instead of upgrade modal directly
      return;
    }

    if (userPlan === 'advanced' && activeBusinessesCount >= 3) { // Assuming 3 is the limit for advanced.
      setBusinessError("Your plan has been utilized, please contact admin support");
      setShowSuccessPopup(true); // Using common popup but now it will show as error
      setTimeout(() => {
        setShowSuccessPopup(false);
        setBusinessError('');
      }, 5000);
      return;
    }

    setShowCreateModal(true);
    setBusinessError('');
    setFormErrors({});
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
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    const sanitizedValue =
      name === "business_name"
        ? value
          .replace(/\\u[0-9A-Fa-f]{4}/g, '')
        : value;

    setBusinessFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmitBusiness = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Highlight the first error by scrolling to it and focusing
      const firstErrorField = Object.keys(formErrors)[0];
      if (firstErrorField) {
        // Small delay to ensure form errors are rendered
        setTimeout(() => {
          const element = document.querySelector(`input[name="${firstErrorField}"], textarea[name="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
            // Optional: Add a temporary shake class for visual highlight (add CSS for .shake)
            element.classList.add('shake');
            setTimeout(() => element.classList.remove('shake'), 500);
          }
        }, 100);
      }
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

  // Close custom menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCustomMenu({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Different delete button alternatives
  const DeleteButtonAlternatives = ({ business, viewType, canDelete = true }) => {
    const stats = business.question_statistics || {};
    const progress = stats.progress_percentage || 0;
    const completedQuestions = stats.completed_questions || 0;
    const totalQuestions = stats.total_questions || 0;
    const remainingQuestions = stats.pending_questions || 0;

    const getStatusInfo = () => {
      if (business.status === 'deleted') return { label: 'Deleted', className: 'status-deleted' };
      if (business.access_mode === 'archived' || business.access_mode === 'hidden') return { label: 'Archived', className: 'status-archived' };
      return { label: 'Active', className: 'status-active' };
    };

    const statusInfo = getStatusInfo();

    // Alternative 1: Simple Delete Button (Always Visible)
    const SimpleDeleteButton = () => {
      if (isViewer) return null; // 👈 HIDE FOR VIEWER

      return (
        <button
          className="btn btn-outline-danger btn-sm delete-btn-simple"
          onClick={(e) => {
            e.stopPropagation();
            handleShowDeleteModal(business);
          }}
          title={t('delete_business')}
        >
          <Trash2 size={16} />
        </button>
      );
    };

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
                • {remainingQuestions} {t('questions_remaining')}
              </span>
            )}
          </small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className={`status-badge ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
          {canDelete && <SimpleDeleteButton />}
        </div>
      </div>
    );
  };

  const BusinessList = ({ businesses, viewType, canDelete = true }) => (
    <div className={`business-list ${viewType}`}>
      {isLoadingBusinesses && (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" role="status" variant="primary" />
          <span className="ms-2 text-muted">{t('loading_businesses')}</span>
        </div>
      )}
      {!isLoadingBusinesses && businesses.length === 0 && (
        <div className="text-center text-muted py-5">
          <p className="mb-2">{t('no_businesses_yet')}</p>
          <small>{t('get_started_by_creating')}</small>
        </div>
      )}
      {!isLoadingBusinesses && businesses.length > 0 && businesses.map((business, index) => {
        const isDeleted = business.status === 'deleted';
        const isArchived = business.access_mode === 'archived' || business.access_mode === 'hidden';
        return (
          <div key={business._id || index} className={isDeleted ? 'opacity-50' : ''} style={isDeleted ? { pointerEvents: isDeleted ? 'none' : 'auto' } : {}}>
            <DeleteButtonAlternatives
              business={business}
              viewType={viewType}
              canDelete={canDelete && !isDeleted && !isArchived}
            />
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

  // Character counter for business name
  const businessNameLength = businessFormData.business_name.length;

  // Main render
  return (
    <div className="dashboard-layout">
      <PlanLimitModal
        show={showPlanLimitModal}
        onHide={() => setShowPlanLimitModal(false)}
      />


      {/* FULL PAGE PMF INSIGHTS */}
      {showInsights ? (
        ENABLE_PMF ? (
          <PMFInsights
            onContinue={() => {
              setShowInsights(false);
              navigate("/businesspage");
            }}
          />
        ) : null
      ) : (
        <>
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
                          <h5 className="mb-0">{t('welcome_dashboard')}</h5>
                        </div>
                        <p className="text-muted small mb-4">{t('create_business_plans')}</p>

                      </div>
                      <Accordion className="px-4 mb-4" defaultActiveKey="0">
                        {/* My Businesses */}
                        <Accordion.Item eventKey="0">
                          <Accordion.Header>
                            <div className="accordion-header-content">
                              <span className="accordion-title-text">
                                {t("my_businesses")}
                              </span>
                              <span className="accordion-count-pill">
                                {myBusinesses.length}
                              </span>
                            </div>
                          </Accordion.Header>

                          <Accordion.Body>
                            <BusinessList
                              businesses={myBusinesses}
                              viewType="mobile"
                            />
                          </Accordion.Body>
                        </Accordion.Item>

                        {/* Project Phase */}
                        {projectPhaseBusinesses.length > 0 && (
                          <Accordion.Item eventKey="1">
                            <Accordion.Header>
                              <div className="accordion-header-content">
                                <span className="accordion-title-text">
                                  {t("Project Phase")}
                                </span>
                                <span className="accordion-count-pill">
                                  {projectPhaseBusinesses.length}
                                </span>
                              </div>
                            </Accordion.Header>

                            <Accordion.Body>
                              <BusinessList
                                businesses={projectPhaseBusinesses}
                                viewType="mobile"
                                canDelete={false}
                              />
                            </Accordion.Body>
                          </Accordion.Item>
                        )}

                        {/* Collaborating Businesses */}
                        {collaboratingBusinesses.length > 0 && (
                          <Accordion.Item eventKey="2">
                            <Accordion.Header>
                              <div className="accordion-header-content">
                                <span className="accordion-title-text">
                                  Collaborating Businesses
                                </span>
                                <span className="accordion-count-pill">
                                  {collaboratingBusinesses.length}
                                </span>
                              </div>
                            </Accordion.Header>

                            <Accordion.Body>
                              <BusinessList
                                businesses={collaboratingBusinesses}
                                viewType="mobile"
                                canDelete={false}
                              />
                            </Accordion.Body>
                          </Accordion.Item>
                        )}

                      </Accordion>

                      <div className="px-4 pb-4 d-flex flex-wrap gap-2">
                        {!isCollaborator && !isViewer && (
                          <Button
                            variant="primary"
                            className="flex-grow-1 create-business-btn"
                            onClick={handleShowCreateModal}
                          >
                            {t('create_business')}
                          </Button>
                        )}
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
                                <h5 className="mb-2">{t('welcome_dashboard')}</h5>
                              </div>
                            </div>
                            <p className="text-muted mb-4">{t('create_business_plans')}</p>

                            <div className="d-flex flex-wrap gap-2">
                              {!isCollaborator && !isViewer && (
                                <Button
                                  variant="primary"
                                  className="create-business-btn"
                                  onClick={handleShowCreateModal}
                                >
                                  {t('create_business')}
                                </Button>
                              )}

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
                          <Accordion defaultActiveKey="0">
                            {/* My Businesses */}
                            <Accordion.Item eventKey="0">
                              <Accordion.Header>
                                <div className="accordion-header-content">
                                  <span className="accordion-title-text">
                                    {t("my_businesses")}
                                  </span>
                                  <span className="accordion-count-pill">
                                    {myBusinesses.length}
                                  </span>
                                </div>
                              </Accordion.Header>
                              <Accordion.Body>
                                <BusinessList
                                  businesses={myBusinesses}
                                  viewType="desktop"
                                />
                              </Accordion.Body>
                            </Accordion.Item>

                            {/* Project Phase */}
                            {projectPhaseBusinesses.length > 0 && (
                              <Accordion.Item eventKey="1">
                                <Accordion.Header>
                                  <div className="accordion-header-content">
                                    <span className="accordion-title-text">
                                      {t("Project Phase")}
                                    </span>
                                    <span className="accordion-count-pill">
                                      {projectPhaseBusinesses.length}
                                    </span>
                                  </div>
                                </Accordion.Header>
                                <Accordion.Body>
                                  <BusinessList
                                    businesses={projectPhaseBusinesses}
                                    viewType="desktop"
                                    canDelete={false}
                                  />
                                </Accordion.Body>
                              </Accordion.Item>
                            )}

                            {/* Collaborating Businesses */}
                            {collaboratingBusinesses.length > 0 && (
                              <Accordion.Item eventKey="2">
                                <Accordion.Header>
                                  <div className="accordion-header-content">
                                    <span className="accordion-title-text">
                                      Collaborating Businesses
                                    </span>
                                    <span className="accordion-count-pill">
                                      {collaboratingBusinesses.length}
                                    </span>
                                  </div>
                                </Accordion.Header>
                                <Accordion.Body>
                                  <BusinessList
                                    businesses={collaboratingBusinesses}
                                    viewType="desktop"
                                    canDelete={false}
                                  />
                                </Accordion.Body>
                              </Accordion.Item>
                            )}
                          </Accordion>
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

                <h2 className="mb-4">{t('how_it_works')}</h2>

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
                        alt={t('step_1_login_alt')}
                      />
                      <div className="carousel-caption d-none d-md-block">
                        <h5>{t('step_1_login')}</h5>
                        <p>{t('step_1_login_description')}</p>
                      </div>
                    </div>
                    <div className="carousel-item">
                      <img
                        src="/slides/slide2.jpeg"
                        className="d-block w-100"
                        alt={t('step_2_create_business_alt')}
                      />
                      <div className="carousel-caption d-none d-md-block">
                        <h5>{t('step_2_create_business')}</h5>
                        <p>{t('step_2_create_business_description')}</p>
                      </div>
                    </div>
                    <div className="carousel-item">
                      <img
                        src="/slides/slide3.jpeg"
                        className="d-block w-100"
                        alt={t('step_3_complete_assessment_alt')}
                      />
                      <div className="carousel-caption d-none d-md-block">
                        <h5>{t('step_3_complete_assessment')}</h5>
                        <p>{t('step_3_complete_assessment_description')}</p>
                      </div>
                    </div>
                    <div className="carousel-item">
                      <img
                        src="/slides/slide4.jpeg"
                        className="d-block w-100"
                        alt={t('step_4_get_insights_alt')}
                      />
                      <div className="carousel-caption d-none d-md-block">
                        <h5>{t('step_4_get_insights')}</h5>
                        <p>{t('step_4_get_insights_description')}</p>
                      </div>
                    </div>
                    <div className="carousel-item">
                      <img
                        src="/slides/slide5.jpeg"
                        className="d-block w-100"
                        alt={t('step_5_strategic_recommendations_alt')}
                      />
                      <div className="carousel-caption d-none d-md-block">
                        <h5>{t('step_5_strategic_recommendations')}</h5>
                        <p>{t('step_5_strategic_recommendations_description')}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    className="carousel-control-prev"
                    type="button"
                    data-bs-target="#howItWorksCarousel"
                    data-bs-slide="prev"
                    aria-label={t('previous')}
                  >
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">{t('previous')}</span>
                  </button>
                  <button
                    className="carousel-control-next"
                    type="button"
                    data-bs-target="#howItWorksCarousel"
                    data-bs-slide="next"
                    aria-label={t('next')}
                  >
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">{t('next')}</span>
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

          {/* PMF Onboarding Modal */}
          {ENABLE_PMF && (
            <PMFOnboardingModal
              show={showPMFOnboarding}
              onHide={() => setShowPMFOnboarding(false)}
              onSubmit={(pmfFormData) => {
                setShowPMFOnboarding(false);
                setShowInsights(true);
              }}
            />
          )}

          {/* Create Business Modal */}
          <Modal show={showCreateModal} onHide={handleCloseCreateModal} centered size="lg" backdrop="static">
            <Modal.Header closeButton>
              <Modal.Title>{t('create_new_business')}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmitBusiness} noValidate>
              <fieldset disabled={isCreatingBusiness} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
                <Modal.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('business_name')} <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="business_name"
                      value={businessFormData.business_name}
                      onChange={handleFormChange}
                      placeholder={t('enter_your_business_name')}
                      isInvalid={!!formErrors.business_name}
                      maxLength={20}
                    />
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <div>
                        {formErrors.business_name && (
                          <Form.Text className="text-danger">
                            {formErrors.business_name}
                          </Form.Text>
                        )}
                      </div>
                      <Form.Text className={businessNameLength > 20 ? 'text-danger' : 'text-muted'}>
                        {businessNameLength}/20
                      </Form.Text>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{t('business_purpose')} <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="business_purpose"
                      value={businessFormData.business_purpose}
                      onChange={handleFormChange}
                      placeholder={t('brief_description_of_what')}
                      isInvalid={!!formErrors.business_purpose}
                    />
                    {formErrors.business_purpose && (
                      <Form.Text className="text-danger">
                        {formErrors.business_purpose}
                      </Form.Text>
                    )}
                  </Form.Group>

                  {/* City and Country Fields Row */}
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>{t('city')} ({t('optional')})</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={businessFormData.city}
                          onChange={handleFormChange}
                          placeholder={t('enter_city')}
                          isInvalid={!!formErrors.city}
                        />
                        {formErrors.city && (
                          <Form.Text className="text-danger">
                            {formErrors.city}
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>{t('country')} ({t('optional')})</Form.Label>
                        <Form.Control
                          type="text"
                          name="country"
                          value={businessFormData.country}
                          onChange={handleFormChange}
                          placeholder={t('enter_country')}
                          isInvalid={!!formErrors.country}
                        />
                        {formErrors.country && (
                          <Form.Text className="text-danger">
                            {formErrors.country}
                          </Form.Text>
                        )}
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
                      isInvalid={!!formErrors.description}
                    />
                    {formErrors.description && (
                      <Form.Text className="text-danger">
                        {formErrors.description}
                      </Form.Text>
                    )}

                  </Form.Group>
                  {businessError && (
                    <Alert variant="danger" className="mb-3">
                      {businessError}
                    </Alert>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    variant="secondary"
                    className="cancel-button"
                    onClick={handleCloseCreateModal}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    className="create-button"
                  >
                    {isCreatingBusiness ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {t('creating')}...
                      </>
                    ) : (
                      t('create_business')
                    )}
                  </Button>
                </Modal.Footer>
              </fieldset>
            </Form>
          </Modal>

          {/* Success/Alert Popup */}
          {showSuccessPopup && (
            <div className="success-popup-overlay">
              <div className="success-popup">
                <div className="success-popup-content">
                  <div className={`dashboard-success-icon ${businessError ? 'bg-danger shadow-sm' : ''}`}>
                    {businessError ? <AlertTriangle size={36} color="white" strokeWidth={3} /> : '✅'}
                  </div>
                  <h5 className={`mb-2 ${businessError ? 'text-danger' : ''}`}>
                    {businessError ? t('alert') : t('success')}
                  </h5>
                  <p className="mb-3">{businessError || successMessage}</p>
                  <Button
                    variant={businessError ? "danger" : "primary"}
                    size="sm"
                    onClick={() => {
                      setShowSuccessPopup(false);
                      setSuccessMessage('');
                      setBusinessError('');
                    }}
                  >
                    {t('ok')}
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
                  <p className="mb-3">
                    {t('are_you_sure_you_want_to_delete')} <strong>"{businessToDelete.business_name}"</strong>?
                  </p>

                  <div className="alert alert-danger mb-3">
                    <h6 className="alert-heading mb-2">⚠️ {t('This_will_permanently_delete')}</h6>
                    <ul className="mb-2">
                      <li><strong>{t('All_question_responses_and_conversations')}</strong></li>
                      <li><strong>{t('All_generated_analysis_reports_and_insights')}</strong></li>
                      <li><strong>{t('All_progress_data_and_statistics')}</strong></li>
                      <li><strong>{t('the_business_profile_itself')}</strong></li>
                    </ul>
                    <hr className="my-2" />
                    <p className="mb-0"><strong>{t('This_action_cannot_be_undone')}</strong></p>
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
                    {t('deleting')}...
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

          {/* Deletion Cooldown Error Modal */}
          <Modal show={showCooldownModal} onHide={() => setShowCooldownModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title className="text-warning">
                <Info size={20} className="me-2" />
                {t('Action Restricted')}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Alert variant="warning">
                {cooldownMessage || t('You cannot delete by 30 days. Please wait 30 more day(s).')}
              </Alert>
              <p>
                {t('For security and policy reasons, you can only delete one business every 30 days.')}
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="primary"
                onClick={() => setShowCooldownModal(false)}
              >
                {t('ok')}
              </Button>
            </Modal.Footer>
          </Modal>

          <UpgradeModal
            show={showUpgradeModal}
            onHide={() => setShowUpgradeModal(false)}
            onUpgradeSuccess={(updatedSub) => {
              setShowUpgradeModal(false);
              setSuccessMessage(`Plan updated to ${updatedSub.plan} successfully!`);
              setShowSuccessPopup(true);
              setTimeout(() => setShowSuccessPopup(false), 3000);
            }}
          />
        </>
      )}
    </div>


  );
};

export default Dashboard;