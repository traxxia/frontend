import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
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
  Info, X, Trash2, AlertTriangle, Check
} from "lucide-react";
import MenuBar from "../components/MenuBar";
import PMFOnboardingModal from "../components/PMFOnboardingModal";
import PMFInsights from "../components/PMFInsights";
import "../styles/dashboard.css";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useTranslation } from '../hooks/useTranslation';

import PlanLimitModal from '../components/PlanLimitModal';
import { useAuthStore, useBusinessStore, useUIStore, useSubscriptionStore } from '../store';
import { getUserLimits } from '../utils/authUtils';
import UserTour from "../components/UserTour";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const getStepKeys = (index) => {
  const keys = [
    'step_1_login',
    'step_2_create_business',
    'step_3_onboarding_pmf',
    'step_4_aha_insights',
    'step_5_exec_summary',
    'step_6_kickstart_projects',
    'step_7_project_ranking',
    'step_8_ai_answers',
    'step_9_insights_6cs',
    'step_10_strategic'
  ];
  return {
    title: keys[index],
    description: `${keys[index]}_description`
  };
};

const DeleteButtonAlternatives = memo(({ business, viewType, canDelete = true, isViewer, t, onShowDeleteModal, setHoveredItem, onBusinessClick }) => {
  const stats = business.question_statistics || {};
  const progress = stats.progress_percentage || 0;
  const completedQuestions = stats.completed_questions || 0;
  const totalQuestions = stats.total_questions || 0;
  const remainingQuestions = stats.pending_questions || 0;

  const getStatusInfo = () => {
    if (business.status === 'deleted') return { label: t('deleted'), className: 'status-deleted' };
    if (business.access_mode === 'archived' || business.access_mode === 'hidden') return { label: t('archived'), className: 'status-archived' };
    return { label: t('active'), className: 'status-active' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className="business-item d-flex align-items-center p-3 border-bottom position-relative"
      onMouseEnter={() => setHoveredItem(business._id)}
      onMouseLeave={() => setHoveredItem(null)}
    >
      <div
        style={{ width: 60, height: 60, cursor: "pointer" }}
        className="progress-circle me-3 progress-wrapper"
        onClick={() => onBusinessClick(business)}
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
        onClick={() => onBusinessClick(business)}
        style={{ cursor: "pointer" }}
      >
        <h6 className="mb-1">{business.business_name}</h6>
        <small className="text-muted">
          {completedQuestions}/{totalQuestions} {t('questions_completed')}
          {remainingQuestions > 0 && (
            <span className="text-warning ms-2 text-grey-custom">
              • {remainingQuestions} {t('questions_remaining')}
            </span>
          )}
        </small>
      </div>
      <div className="right-side d-flex flex-column flex-md-row align-items-end align-items-md-center gap-1">
        <span className={`status-badge ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
        {canDelete && !isViewer && (
          <div className="delete-btn-wrapper">
            <button
              className="btn btn-outline-danger btn-sm delete-btn-simple"
              onClick={(e) => {
                e.stopPropagation();
                onShowDeleteModal(business);
              }}
              title={t('delete_business')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

const BusinessList = memo(({ businesses, viewType, canDelete = true, isLoading, t, isViewer, onShowDeleteModal, setHoveredItem, onBusinessClick }) => (
  <div className={`business-list ${viewType}`}>
    {isLoading && (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" role="status" variant="primary" />
        <span className="ms-2 text-muted">{t('loading_businesses')}</span>
      </div>
    )}
    {!isLoading && businesses.length === 0 && (
      <div className="text-center text-muted py-5">
        <p className="mb-2">{t('no_businesses_yet')}</p>
        <small>{t('get_started_by_creating')}</small>
      </div>
    )}
    {!isLoading && businesses.length > 0 && businesses.map((business, index) => {
      const isDeleted = business.status === 'deleted';
      const isArchived = business.access_mode === 'archived' || business.access_mode === 'hidden';
      return (
        <div key={business._id || index} className={isDeleted ? 'opacity-50' : ''} style={isDeleted ? { pointerEvents: isDeleted ? 'none' : 'auto' } : {}}>
          <DeleteButtonAlternatives
            business={business}
            viewType={viewType}
            canDelete={canDelete && !isDeleted && !isArchived}
            isViewer={isViewer}
            t={t}
            onShowDeleteModal={onShowDeleteModal}
            setHoveredItem={setHoveredItem}
            onBusinessClick={onBusinessClick}
          />
        </div>
      );
    })}
  </div>
));

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const ENABLE_PMF = getUserLimits().pmf;
  const { 
    businesses, 
    collaboratingBusinesses, 
    deletedBusinesses, 
    isLoading: isLoadingBusinesses,
    isCreating: isCreatingBusiness,
    isDeleting: isDeletingBusiness,
    error: businessError,
    deleteError: storeDeleteError,
    fetchBusinesses,
    createBusiness: createBusinessAction,
    deleteBusiness: deleteBusinessAction,
    setSelectedBusinessId,
    selectBusiness,
    selectedBusinessId,
    clearErrors
  } = useBusinessStore();
  const {
    openModal,
    closeModal,
    isModalOpen,
    addToast,
    setLoading
  } = useUIStore();

  const [newlyCreatedBusiness, setNewlyCreatedBusiness] = useState(null);
  const [businessFormData, setBusinessFormData] = useState({
    business_name: '',
    business_purpose: '',
    description: '',
    city: '',
    country: ''
  });
  // businessError is now from store
  const [formErrors, setFormErrors] = useState({});
  const userRole = useAuthStore(state => state.userRole);
  const isViewer = useAuthStore(state => state.isViewer());
  const isCollaborator = userRole?.toLowerCase() === "collaborator";
  const isAdmin = useAuthStore(state => state.isAdmin);
  // const logout = useAuthStore(state => state.logout);
  const token = useAuthStore(state => state.token);

  // Delete business state
  const [businessToDelete, setBusinessToDelete] = useState(null);
  // isLoadingBusinesses is now from store

  // Deletion cooldown state
  const [cooldownMessage] = useState('');


  // Tour modal state
  const [activeSlide, setActiveSlide] = useState(0);

  // Plan Limit Modal state from store
  const { usage, fetchPlanDetails } = useSubscriptionStore();

  // Custom menu state for alternatives

  const [, setHoveredItem] = useState(null);
  // const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const myBusinesses = useMemo(() => businesses.filter(
    b => Boolean(b.has_projects) === false
  ), [businesses]);

  const projectPhaseBusinesses = useMemo(() => businesses.filter(
    b => Boolean(b.has_projects) === true
  ), [businesses]);

  /* 
    fetchPlanDetails is now handled by useSubscriptionStore
  */

  // Fetch businesses on component mount
  useEffect(() => {
    fetchBusinesses();
    fetchPlanDetails();
  }, [fetchBusinesses, fetchPlanDetails]);

  /*
  const fetchSubscriptionDetails = async () => {
    try {
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
        addToast({ message: t('operation_success'), type: 'success' });
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    }
  };
  */

  // fetchPlanDetails and fetchSubscriptionDetails remain (or could be moved to store later)
  // Removed local fetchBusinesses as it's now in businessStore

  // Sync active slide for How It Works carousel
  useEffect(() => {
    if (isModalOpen('howItWorks')) {
      const carouselEl = document.getElementById('howItWorksCarousel');
      if (carouselEl) {
        const handleSlid = (event) => {
          setActiveSlide(event.to);
        };
        carouselEl.addEventListener('slid.bs.carousel', handleSlid);
        return () => carouselEl.removeEventListener('slid.bs.carousel', handleSlid);
      }
    } else {
      setActiveSlide(0);
    }
  }, [isModalOpen, activeSlide]); // Fixed: Added meaningful dependencies




  const deleteBusiness = useCallback(async (businessId) => {
    try {
      clearErrors();
      await deleteBusinessAction(businessId);
      await fetchPlanDetails();
      closeModal('deleteBusiness');
      setBusinessToDelete(null);
      addToast({ message: t('business_deleted_successfully'), type: 'success' });
    } catch (error) {
      console.error('Error deleting business:', error);
    }
  }, [deleteBusinessAction, fetchPlanDetails, t, closeModal, addToast, clearErrors]);

  const createBusiness = useCallback(async () => {
    try {
      const data = await createBusinessAction(businessFormData);
      setNewlyCreatedBusiness(data.business);
      if (data.business && (data.business._id || data.business.id)) {
        setSelectedBusinessId(data.business._id || data.business.id);
      }
      addToast({ message: t('business_created_successfully'), type: 'success' });
      setBusinessFormData({
        business_name: '',
        business_purpose: '',
        description: '',
        city: '',
        country: ''
      });
      await fetchPlanDetails();
      closeModal('createBusiness');
      if (ENABLE_PMF) openModal('pmfOnboarding');
    } catch (error) {
      console.error('Error creating business:', error);
    }
  }, [createBusinessAction, businessFormData, setSelectedBusinessId, fetchPlanDetails, t, ENABLE_PMF, closeModal, openModal, addToast]);

  // Validation Functions
  const validateForm = useCallback(() => {
    const errors = {};

    // Business Name validation
    const businessName = businessFormData.business_name.trim();

    if (!businessName) {
      errors.business_name = t('business_name_cannot_be_empty');
    }
    else if (businessName.length < 3) {
      errors.business_name = "Business name must be at least 3 characters";
    }
    else if (!/[A-Za-z]/.test(businessName)) {
      errors.business_name = "Business name must contain at least one letter";
    }
    else if (/[0-9]{5,}/.test(businessName)) {
      errors.business_name = "Too many consecutive numbers are not allowed";
    }
    else if (/[^A-Za-z0-9\s]{5,}/.test(businessName)) {
      errors.business_name = "Too many consecutive special characters are not allowed";
    }

    // Business purpose validation
    const businessPurpose = businessFormData.business_purpose.trim();

    if (!businessPurpose) {
      errors.business_purpose = t('business_purpose_required');
    }
    else if (businessPurpose.length < 10) {
      errors.business_purpose = "Business purpose must be at least 10 characters long";
    }
    else if (!/[A-Za-z]/.test(businessPurpose)) {
      errors.business_purpose =
        t('business_purpose_must_contain_alphabetic_characters') ||
        "Business purpose must contain alphabetic characters";
    }
    else if (/[0-9]{5,}/.test(businessPurpose)) {
      errors.business_purpose = "Too many consecutive numbers are not allowed";
    }
    else if (/[^A-Za-z0-9\s]{5,}/.test(businessPurpose)) {
      errors.business_purpose = "Too many consecutive special characters are not allowed";
    }

    // City validation (optional but if provided, must be valid)
    const cityTrimmed = businessFormData.city.trim();
    const cityHasSpecialChars = /[^a-zA-ZÀ-ÿ\s.-]/.test(cityTrimmed);

    if (businessFormData.city && cityTrimmed.length === 0) {
      errors.city = t('city_cannot_contain_only_spaces');
    } else if (cityTrimmed.length > 0 && cityTrimmed.length < 2) {
      errors.city = t('city_min_length');
    } else if (cityTrimmed.length > 20) {
      errors.city = t('city_max_length');
    } else {
      const hasNumber = /\d/.test(cityTrimmed);
      const hasSpecial = cityHasSpecialChars;

      if (hasNumber && hasSpecial) {
        errors.city = "Numeric and special characters are not allowed";
      } else if (hasNumber) {
        errors.city = "Numeric values not allowed.";
      } else if (hasSpecial) {
        errors.city = t('city_cannot_contain_special_characters');
      }
    }

    // Country validation (optional but if provided, must be valid)
    const countryTrimmed = businessFormData.country.trim();
    const countryHasSpecialChars = /[^a-zA-ZÀ-ÿ\s.-]/.test(countryTrimmed);

    if (businessFormData.country && countryTrimmed.length === 0) {
      errors.country = t('country_cannot_contain_only_spaces');
    } else if (countryTrimmed.length > 0 && countryTrimmed.length < 2) {
      errors.country = t('country_min_length');
    } else if (countryTrimmed.length > 20) {
      errors.country = t('country_max_length');
    } else {
      const hasNumber = /\d/.test(countryTrimmed);
      const hasSpecial = countryHasSpecialChars;

      if (hasNumber && hasSpecial) {
        errors.country = "Numeric and special characters are not allowed";
      } else if (hasNumber) {
        errors.country = t('Numeric_values_not_allowed');
      } else if (hasSpecial) {
        errors.country = t('country_cannot_contain_special_characters');
      }
    }

    const description = businessFormData.description?.trim() || "";

    if (description) {
      if (description.length < 10) {
        errors.description = t('description_min_length');
      }
      else if (!/[A-Za-z]/.test(description)) {
        errors.description = t('description_alphabetic_required');
      }
      else if (/[0-9]{5,}/.test(description)) {
        errors.description = t('description_consecutive_numbers');
      }
      else if (/[^A-Za-z0-9\s]{5,}/.test(description)) {
        errors.description = t('description_consecutive_special');
      }
      else if (/\s{3,}/.test(description)) {
        errors.description = t('description_consecutive_spaces');
      }
    }


    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [businessFormData, t]);

  /*
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
  */

  // Business Modal Functions
  const handleShowCreateModal = useCallback(() => {
    if (usage) {
      const current = usage.workspaces?.current || 0;
      const limit = usage.workspaces?.limit || 0;

      if (current >= limit && isAdmin) {
        openModal('planLimit');
        return;
      }
    }

    openModal('createBusiness');
    clearErrors();
    setFormErrors({});
  }, [usage, isAdmin, clearErrors, openModal]);

  const handleCloseCreateModal = useCallback(() => {
    closeModal('createBusiness');
    setBusinessFormData({
      business_name: '',
      business_purpose: '',
      description: '',
      city: '',
      country: ''
    });
    clearErrors();
    setFormErrors({});
  }, [clearErrors, closeModal]);

  const handleFormChange = useCallback((e) => {
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
    setFormErrors(prev => {
      if (!prev[name]) return prev;
      return {
        ...prev,
        [name]: ''
      };
    });
  }, []);

  const handleSubmitBusiness = useCallback((e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorField = Object.keys(formErrors)[0];
      if (firstErrorField) {
        setTimeout(() => {
          const element = document.querySelector(`input[name="${firstErrorField}"], textarea[name="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
            element.classList.add('shake');
            setTimeout(() => element.classList.remove('shake'), 500);
          }
        }, 100);
      }
      return;
    }

    createBusiness();
  }, [validateForm, formErrors, createBusiness]);

  // Delete Modal Functions
  const handleShowDeleteModal = useCallback((business) => {
    setBusinessToDelete(business);
    openModal('deleteBusiness');
    clearErrors();
  }, [openModal]);

  const handleCloseDeleteModal = useCallback(() => {
    closeModal('deleteBusiness');
    setBusinessToDelete(null);
    clearErrors();
  }, [closeModal]);

  const handleConfirmDelete = useCallback(() => {
    if (businessToDelete) {
      deleteBusiness(businessToDelete._id);
    }
  }, [businessToDelete, deleteBusiness]);

  // Close custom menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Different delete button alternatives


  // Event Handlers
  const handleBusinessClick = useCallback((business) => {
    const businessId = business._id || business.id;
    if (businessId) {
      selectBusiness(business);
    }
    navigate('/businesspage', { state: { business, initialTab: 'executive' } });
  }, [selectBusiness, navigate]);

  const handleCloseModal = useCallback(() => {
    closeModal('howItWorks');
  }, [closeModal]);

  // Character counter for business name
  const businessNameLength = businessFormData.business_name.length;

  // Main render
  return (
    <div className="dashboard-layout">
      <UserTour />
      <PlanLimitModal
        show={isModalOpen('planLimit')}
        onHide={() => closeModal('planLimit')}
        plan={usage?.plan}
        limit={usage?.workspaces?.limit}
        isAdmin={isAdmin}
        message="plan limit for business is reached please upgrade"
      />


      {/* FULL PAGE PMF INSIGHTS */}
      {isModalOpen('insights') ? (
        ENABLE_PMF ? (
          <PMFInsights
            businessId={newlyCreatedBusiness?._id || selectedBusinessId || businesses[0]?._id}
            onContinue={() => {
              closeModal('insights');
              navigate("/businesspage", {
                state: {
                  business: newlyCreatedBusiness || businesses.find(b => b._id === (selectedBusinessId || businesses[0]?._id)) || businesses[0]
                }
              });
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
                          <h5 className="mb-0">{t('welcome_dashboard')} <span className="text-primary">{userName}</span></h5>
                        </div>
                        <p className="text-muted small mb-4">{t('create_business_plans')}</p>

                      </div>
                      {isLoadingBusinesses ? (
                        <div className="d-flex flex-column align-items-center justify-content-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <span className="mt-3 text-muted">{t('loading_businesses')}</span>
                        </div>
                      ) : (
                        <Accordion className="px-4 mb-4">
                          {/* My Businesses */}
                          {!isCollaborator && !isViewer && (
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
                                  isLoading={false} // Global loader handles initial load
                                  t={t}
                                  isViewer={isViewer}
                                  onShowDeleteModal={handleShowDeleteModal}
                                  setHoveredItem={setHoveredItem}
                                  onBusinessClick={handleBusinessClick}
                                />
                              </Accordion.Body>
                            </Accordion.Item>
                          )}

                          {/* Project Phase */}
                          {!isCollaborator && !isViewer && projectPhaseBusinesses.length > 0 && (
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
                                  isLoading={false}
                                  t={t}
                                  isViewer={isViewer}
                                  onShowDeleteModal={handleShowDeleteModal}
                                  setHoveredItem={setHoveredItem}
                                  onBusinessClick={handleBusinessClick}
                                />
                              </Accordion.Body>
                            </Accordion.Item>
                          )}

                          {/* Collaborating Businesses */}
                          {(isCollaborator || isViewer || collaboratingBusinesses.length > 0) && (
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
                                  isLoading={false}
                                  t={t}
                                  isViewer={isViewer}
                                  onShowDeleteModal={handleShowDeleteModal}
                                  setHoveredItem={setHoveredItem}
                                  onBusinessClick={handleBusinessClick}
                                />
                              </Accordion.Body>
                            </Accordion.Item>
                          )}

                          {/* Deleted Businesses */}
                          {!isCollaborator && !isViewer && deletedBusinesses.length > 0 && (
                            <Accordion.Item eventKey="3">
                              <Accordion.Header>
                                <div className="accordion-header-content">
                                  <span className="accordion-title-text">
                                    Deleted Business
                                  </span>
                                  <span className="accordion-count-pill">
                                    {deletedBusinesses.length}
                                  </span>
                                </div>
                              </Accordion.Header>

                              <Accordion.Body>
                                <BusinessList
                                  businesses={deletedBusinesses}
                                  viewType="mobile"
                                  canDelete={false}
                                  isLoading={false}
                                  t={t}
                                  isViewer={isViewer}
                                  onShowDeleteModal={handleShowDeleteModal}
                                  setHoveredItem={setHoveredItem}
                                  onBusinessClick={handleBusinessClick}
                                />
                              </Accordion.Body>
                            </Accordion.Item>
                          )}
                        </Accordion>
                      )}

                      <div className="px-4 pb-4 d-flex flex-wrap gap-2">
                        {!isCollaborator && !isViewer && (
                          <Button
                            variant="primary"
                            className="flex-grow-1 create-business-btn"
                            onClick={handleShowCreateModal}
                            disabled={isLoadingBusinesses}
                          >
                            {isLoadingBusinesses ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                              </>
                            ) : (
                              t('create_business')
                            )}
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          className="flex-grow-1 create-business-btn"
                          onClick={() => openModal('howItWorks')}
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
                      <Row className="h-100 px-4">
                        <Col md={6} className="welcome-section">
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-4">
                              <div>
                                <h5 className="mb-2">{t('welcome_dashboard')} <span className="text-primary">{userName}</span></h5>
                              </div>
                            </div>
                            <p className="text-muted mb-4">{t('create_business_plans')}</p>

                            <div className="d-flex flex-wrap gap-2">
                              {!isCollaborator && !isViewer && (
                                <Button
                                  variant="primary"
                                  className="create-business-btn"
                                  onClick={handleShowCreateModal}
                                  disabled={isLoadingBusinesses}
                                >
                                  {isLoadingBusinesses ? (
                                    <>
                                      <Spinner size="sm" className="me-2" />
                                      {t('create_business')}
                                    </>
                                  ) : (
                                    t('create_business')
                                  )}
                                </Button>
                              )}

                              <Button
                                variant="primary"
                                className="create-business-btn"
                                onClick={() => openModal('howItWorks')}
                              >
                                <Info size={18} className="me-2" />
                                {t('how_it_works')}
                              </Button>
                            </div>
                          </div>
                        </Col>

                        {/* RIGHT SIDE - Business List */}
                        <Col md={6} className="businesses-section">
                          {isLoadingBusinesses ? (
                            <div className="d-flex flex-row align-items-center justify-content-center h-100 py-5 w-100">
                              <div className="text-center">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-3 text-muted">{t('loading_businesses')}</p>
                              </div>
                            </div>
                          ) : (
                            <Accordion>
                              {/* My Businesses */}
                              {!isCollaborator && !isViewer && (
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
                                      isLoading={false}
                                      t={t}
                                      isViewer={isViewer}
                                      onShowDeleteModal={handleShowDeleteModal}
                                      setHoveredItem={setHoveredItem}
                                      onBusinessClick={handleBusinessClick}
                                    />
                                  </Accordion.Body>
                                </Accordion.Item>
                              )}

                              {/* Project Phase */}
                              {!isCollaborator && !isViewer && projectPhaseBusinesses.length > 0 && (
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
                                      isLoading={false}
                                      t={t}
                                      isViewer={isViewer}
                                      onShowDeleteModal={handleShowDeleteModal}
                                      setHoveredItem={setHoveredItem}
                                      onBusinessClick={handleBusinessClick}
                                    />
                                  </Accordion.Body>
                                </Accordion.Item>
                              )}

                              {/* Collaborating Businesses */}
                              {(isCollaborator || isViewer || collaboratingBusinesses.length > 0) && (
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
                                      isLoading={false}
                                      t={t}
                                      isViewer={isViewer}
                                      onShowDeleteModal={handleShowDeleteModal}
                                      setHoveredItem={setHoveredItem}
                                      onBusinessClick={handleBusinessClick}
                                    />
                                  </Accordion.Body>
                                </Accordion.Item>
                              )}

                              {/* Deleted Businesses */}
                              {!isCollaborator && !isViewer && deletedBusinesses.length > 0 && (
                                <Accordion.Item eventKey="3">
                                  <Accordion.Header>
                                    <div className="accordion-header-content">
                                      <span className="accordion-title-text">
                                        Deleted Business
                                      </span>
                                      <span className="accordion-count-pill">
                                        {deletedBusinesses.length}
                                      </span>
                                    </div>
                                  </Accordion.Header>
                                  <Accordion.Body>
                                    <BusinessList
                                      businesses={deletedBusinesses}
                                      viewType="desktop"
                                      canDelete={false}
                                      isLoading={false}
                                      t={t}
                                      isViewer={isViewer}
                                      onShowDeleteModal={handleShowDeleteModal}
                                      setHoveredItem={setHoveredItem}
                                      onBusinessClick={handleBusinessClick}
                                    />
                                  </Accordion.Body>
                                </Accordion.Item>
                              )}
                            </Accordion>
                          )}
                        </Col>

                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          </Container>

          {/* How It Works Modal */}
          {isModalOpen('howItWorks') && (
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
                    {[...Array(10)].map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        data-bs-target="#howItWorksCarousel"
                        data-bs-slide-to={i}
                        className={i === 0 ? "active" : ""}
                        aria-label={`Slide ${i + 1}`}
                      ></button>
                    ))}
                  </div>

                  <div className="carousel-inner">
                    <div className="carousel-item active">
                      <img src="/slides/slide1.jpeg" className="d-block w-100" alt={t('step_1_login_alt')} />
                    </div>
                    <div className="carousel-item">
                      <img src="/slides/slide2.jpeg" className="d-block w-100" alt={t('step_2_create_business_alt')} />
                    </div>
                    <div className="carousel-item">
                      <img src="/slides/slide3.jpeg" className="d-block w-100" alt={t('step_3_onboarding_pmf_alt')} />
                    </div>
                    <div className="carousel-item">
                      <img src="/slides/slide4.jpeg" className="d-block w-100" alt={t('step_4_aha_insights_alt')} />
                    </div>
                    <div className="carousel-item">
                      <img src="/slides/slide5.jpeg" className="d-block w-100" alt={t('step_5_exec_summary_alt')} />
                    </div>
                    <div className="carousel-item">
                      <img src="/slides/slide6.jpeg" className="d-block w-100" alt={t('step_6_kickstart_projects_alt')} />
                    </div>
                    <div className="carousel-item">
                      <img src="/slides/slide7.jpeg" className="d-block w-100" alt={t('step_7_project_ranking_alt')} />
                    </div>
                    <div className="carousel-item">
                      <img src="/slides/slide8.jpeg" className="d-block w-100" alt={t('step_8_ai_answers_alt')} />
                    </div>
                    <div className="carousel-item">
                      <img src="/slides/slide9.jpeg" className="d-block w-100" alt={t('step_9_insights_6cs_alt')} />
                    </div>
                    <div className="carousel-item">
                      <img src="/slides/slide10.jpeg" className="d-block w-100" alt={t('step_10_strategic_alt')} />
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

                <div className="carousel-external-caption text-center mt-2">
                  <h5>{t(getStepKeys(activeSlide).title)}</h5>
                  <p className="text-muted">{t(getStepKeys(activeSlide).description)}</p>
                </div>

                <div className="text-center mt-2">
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
              show={isModalOpen('pmfOnboarding')}
              onHide={() => closeModal('pmfOnboarding')}
              businessId={newlyCreatedBusiness?._id || selectedBusinessId || businesses[0]?._id}
              onSubmit={(pmfFormData) => {
                closeModal('pmfOnboarding');
                // Instead of showing standalone insights, go straight to the business page
                // Any "AHA" results will be available in the tabs there
                closeModal('insights');
                navigate("/businesspage", {
                  state: {
                    business: newlyCreatedBusiness || businesses.find(b => b._id === (selectedBusinessId || businesses[0]?._id))
                  }
                });
              }}
            />
          )}

          {/* Create Business Modal */}
          <Modal show={isModalOpen('createBusiness')} onHide={handleCloseCreateModal} centered size="lg" backdrop="static">
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
                      maxLength={100}
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

          {/* Delete Business Confirmation Modal */}
          <Modal show={isModalOpen('deleteBusiness')} onHide={handleCloseDeleteModal} centered>
            <Modal.Header closeButton>
              <Modal.Title className="text-danger">
                <Trash2 size={20} className="me-2" />
                {t('delete_business')}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {storeDeleteError && (
                <Alert variant="danger" className="mb-3">
                  {storeDeleteError}
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
          <Modal show={isModalOpen('deleteCooldown')} onHide={() => closeModal('deleteCooldown')} centered>
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
                onClick={() => closeModal('deleteCooldown')}
              >
                {t('ok')}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* <UpgradeModal
            show={isModalOpen('upgrade')}
            onHide={() => closeModal('upgrade')}
            onUpgradeSuccess={(updatedSub) => {
              closeModal('upgrade');
              addToast({ message: t('upgrade_success'), type: 'success' });
            }}
          /> */}
        </>
      )}
    </div>


  );
};

export default Dashboard;