import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  Row,
  Col,
  Spinner,
  Modal,
  Form,
  Alert,
  Carousel
} from "react-bootstrap";
import {
  Info, X, Trash2, Check, ChevronDown
} from "lucide-react";
import MenuBar from "../components/MenuBar";
import PMFOnboardingModal from "../components/PMFOnboardingModal";
import PMFInsights from "../components/PMFInsights";
import "../styles/dashboard.css";
import { useTranslation } from '../hooks/useTranslation';

import PlanLimitModal from '../components/PlanLimitModal';
import { useAuthStore, useBusinessStore, useUIStore } from '../store';
import { useBusinesses, usePlanDetails } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

import { getUserLimits } from '../utils/authUtils';
import UserTour from "../components/UserTour";

const toSlug = (name = '') => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const getStepKeys = (index) => {
  const keys = [
    'step_1_login',
    'step_2_create_business',
    'step_3_onboarding_pmf',
    'step_4_new_business',
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const ENABLE_PMF = getUserLimits().pmf;
  const {
    isCreating: isCreatingBusiness,
    isDeleting: isDeletingBusiness,
    createError: businessError,
    deleteError: storeDeleteError,
    createBusiness: createBusinessAction,
    deleteBusiness: deleteBusinessAction,
    setSelectedBusinessId,
    selectBusiness,
    selectedBusinessId,
    clearErrors
  } = useBusinessStore();

  const queryClient = useQueryClient();
  const {
    data: businessesData,
    isLoading: isLoadingBusinesses
  } = useBusinesses();

  const {
    data: planDetailsQuery
  } = usePlanDetails();

  const usage = planDetailsQuery?.usage;

  // Derive business lists from the query response
  const ownedBusinesses = businessesData?.businesses || [];
  const collaboratingBusinesses = businessesData?.collaborating_businesses || [];
  const deletedBusinesses = businessesData?.deleted_businesses || [];
  const allBusinessesQuery = [...ownedBusinesses, ...collaboratingBusinesses];

  const {
    openModal,
    closeModal,
    isModalOpen,
    addToast
  } = useUIStore();

  const [newlyCreatedBusiness, setNewlyCreatedBusiness] = useState(null);
  const [businessFormData, setBusinessFormData] = useState({
    business_name: '',
    business_purpose: '',
    description: '',
    city: '',
    country: ''
  });
  const [statusFilter, setStatusFilter] = useState(['ALL', 'EXECUTION', 'CREATED', 'DELETED']);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isHowItWorksExpanded, setIsHowItWorksExpanded] = useState(false);

  const allBusinesses = useMemo(() => {
    return [...ownedBusinesses, ...collaboratingBusinesses, ...deletedBusinesses];
  }, [ownedBusinesses, collaboratingBusinesses, deletedBusinesses]);

  const filteredBusinesses = useMemo(() => {
    return allBusinesses.filter(business => {
      const state = business.status === 'deleted' ? 'DELETED' : (business.has_projects ? 'EXECUTION' : 'CREATED');
      return statusFilter.includes(state);
    });
  }, [allBusinesses, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: allBusinesses.length, EXECUTION: 0, CREATED: 0, DELETED: 0 };
    allBusinesses.forEach(business => {
      const state = business.status === 'deleted' ? 'DELETED' : (business.has_projects ? 'EXECUTION' : 'CREATED');
      counts[state]++;
    });
    return counts;
  }, [allBusinesses]);

  const toggleStatusFilter = (status) => {
    if (status === 'ALL') {
      if (statusFilter.length === 4) setStatusFilter([]);
      else setStatusFilter(['ALL', 'EXECUTION', 'CREATED', 'DELETED']);
      return;
    }

    setStatusFilter(prev => {
      let newFilter;
      if (prev.includes(status)) {
        newFilter = prev.filter(s => s !== status && s !== 'ALL');
      } else {
        newFilter = [...prev, status];
        if (newFilter.length === 3) {
          newFilter = ['ALL', 'EXECUTION', 'CREATED', 'DELETED'];
        }
      }
      return newFilter;
    });
  };

  const [formErrors, setFormErrors] = useState({});
  const userRole = useAuthStore(state => state.userRole);
  const userName = useAuthStore(state => state.userName);
  const isViewer = useAuthStore(state => state.isViewer());
  const isCollaborator = userRole?.toLowerCase() === "collaborator";
  const isAdmin = useAuthStore(state => state.isAdmin);

  const [businessToDelete, setBusinessToDelete] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const [accessModalMessage, setAccessModalMessage] = useState('');
  const [accessModalSubMessage, setAccessModalSubMessage] = useState('');

  const renderHowItWorksCards = (showCreateButton) => (
    <div className="how-it-works-cards">
      <div className="hiw-card">
        <div className="hiw-card-header">
          <div className="hiw-number yellow">1</div>
          <div className="hiw-meta">
            <span className="hiw-subtitle">{t('hiw_create_business_caps') || 'CREATE BUSINESS'}</span>
            <h3 className="hiw-title">{t('hiw_start_with_business') || 'Start with your business'}</h3>
          </div>
        </div>
        <p className="hiw-description">
          {t('hiw_start_with_business_desc') || 'Name your business and answer a few basic questions. Trax turns that into a real diagnosis — add documents for a sharper one.'}
        </p>
        <div className="hiw-list">
          <div className="hiw-list-item">
            <strong>{t('hiw_inputs') || 'Inputs'}:</strong> {t('hiw_inputs_details') || 'basic questions · documents (optional)'}
          </div>
          <div className="hiw-list-item">
            <strong>{t('hiw_output') || 'Output'}:</strong> {t('hiw_output_details') || 'insights, strategy draft, and priorities'}
          </div>
        </div>
        {showCreateButton && !isCollaborator && !isViewer && (
          <>
            <hr className="hiw-divider hiw-card-btn-divider" />
            <button className="btn-create-business" onClick={handleShowCreateModal} disabled={isLoadingBusinesses}>
              + {t('create_business') || 'Create Business'}
            </button>
          </>
        )}
      </div>

      <div className="hiw-card">
        <div className="hiw-card-header">
          <div className="hiw-number blue">2</div>
          <div className="hiw-meta">
            <span className="hiw-subtitle">{t('hiw_insights_caps') || 'INSIGHTS'}</span>
            <h3 className="hiw-title">{t('hiw_diagnosis_from_docs') || 'A diagnosis from your documents'}</h3>
          </div>
        </div>
        <p className="hiw-description">
          {t('hiw_diagnosis_from_docs_desc') || 'Trax reads everything and gives you a structured report at two depths.'}
        </p> 
        <div className="hiw-list">
          <div className="hiw-list-item">
            <strong>{t('hiw_basic') || 'Basic'}:</strong> {t('hiw_basic_details') || 'AHA insights, Where & How to compete, Top 5 priorities'}
          </div>
          <div className="hiw-list-item">
            <strong>{t('hiw_advanced') || 'Advanced'}:</strong> {t('hiw_advanced_details') || "PESTEL, Porter's Five Forces, NPS, BCG, S.T.R.A.T.E.G.I.C. scorecard"}
          </div>
        </div>
      </div>

      <div className="hiw-card">
        <div className="hiw-card-header">
          <div className="hiw-number green">3</div>
          <div className="hiw-meta">
            <span className="hiw-subtitle">{t('hiw_execution_caps') || 'EXECUTION'}</span>
            <h3 className="hiw-title">{t('hiw_priorities_turn_commitment') || 'Priorities that turn into commitment'}</h3>
          </div>
        </div>
        <p className="hiw-description">
          {t('hiw_priorities_turn_commitment_desc') || 'Each priority becomes a tracked bet — owner, hypothesis, expected results. Anchored to the rituals that move the business forward.'}
        </p> 
        <div className="hiw-list">
          <div className="hiw-list-item">
            <strong>{t('hiw_bets') || 'Bets'}:</strong> {t('hiw_bets_details') || 'ledger of active initiatives with status, score, impact, risk'}
          </div>
          <div className="hiw-list-item">
            <strong>{t('hiw_moments') || 'Moments'}:</strong> {t('hiw_moments_details') || 'MBR, QBR, Annual Planning — auto-generated management reports'}
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    // Preload all slides for the "How it works" modal
    const slidesToPreload = Array.from({ length: 10 }, (_, i) => `/slides/slide${i + 1}.webp`);
    slidesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const handleSelect = (selectedIndex) => {
    setActiveSlide(selectedIndex);
  };

  const deleteBusiness = useCallback(async (businessId) => {
    try {
      clearErrors();
      await deleteBusinessAction(businessId);
      
      closeModal('deleteBusiness');
      setBusinessToDelete(null);
      addToast({ message: t('business_deleted_successfully'), type: 'success' });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['planDetails'] })
      ]);
    } catch (error) {
      console.error('Error deleting business:', error);
    }
  }, [deleteBusinessAction, t, closeModal, addToast, clearErrors, queryClient]);

  const createBusiness = useCallback(async () => {
    try {
      const data = await createBusinessAction(businessFormData);
      setNewlyCreatedBusiness(data.business);
      if (data.business && (data.business._id || data.business.id)) {
        setSelectedBusinessId(data.business._id || data.business.id);
      }

      closeModal('createBusiness');
      addToast({ message: t('business_created_successfully'), type: 'success' });

      if (ENABLE_PMF) openModal('pmfOnboarding');

      setBusinessFormData({
        business_name: '',
        business_purpose: '',
        description: '',
        city: '',
        country: ''
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['planDetails'] })
      ]);
    } catch (error) {
      console.error('Error creating business:', error);
    }
  }, [createBusinessAction, businessFormData, setSelectedBusinessId, t, ENABLE_PMF, closeModal, openModal, addToast, queryClient]);

  const validateForm = useCallback(() => {
    const errors = {};
    const businessName = businessFormData.business_name.trim();

    if (!businessName) {
      errors.business_name = t('business_name_cannot_be_empty');
    } else if (businessName.length < 3) {
      errors.business_name = "Business name must be at least 3 characters";
    } else if (!/[A-Za-z]/.test(businessName)) {
      errors.business_name = "Business name must contain at least one letter";
    }

    const businessPurpose = businessFormData.business_purpose.trim();
    if (!businessPurpose) {
      errors.business_purpose = t('business_purpose_required');
    } else if (businessPurpose.length < 10) {
      errors.business_purpose = "Business purpose must be at least 10 characters long";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [businessFormData, t]);

  const handleShowCreateModal = useCallback(() => {
    if (usage) {
      const current = usage.workspaces?.current || 0;
      const limit = usage.workspaces?.limit || 0;
      if (current >= limit) {
        openModal('planLimit');
        return;
      }
    }
    openModal('createBusiness');
    clearErrors();
    setFormErrors({});
  }, [usage, clearErrors, openModal]);

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
    setBusinessFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  }, []);

  const handleSubmitBusiness = useCallback((e) => {
    e.preventDefault();
    if (!validateForm()) return;
    createBusiness();
  }, [validateForm, createBusiness]);

  const handleShowDeleteModal = useCallback((business) => {
    setBusinessToDelete(business);
    openModal('deleteBusiness');
    clearErrors();
  }, [openModal, clearErrors]);

  const handleCloseDeleteModal = useCallback(() => {
    closeModal('deleteBusiness');
    setBusinessToDelete(null);
    clearErrors();
  }, [closeModal, clearErrors]);

  const handleConfirmDelete = useCallback(() => {
    if (businessToDelete) {
      deleteBusiness(businessToDelete._id);
    }
  }, [businessToDelete, deleteBusiness]);

  const handleBusinessClick = useCallback((business) => {
    const limits = getUserLimits();
    const hasAnyAccess = limits.pmf || limits.project || limits.strategic || limits.insight;

    if (!hasAnyAccess) {
      const isAdminRole = ['super_admin', 'company_admin', 'org_admin'].includes(userRole?.toLowerCase());
      const subMessageKey = isAdminRole ? "no_access_modal_sub_admin" : "no_access_modal_sub_user";
      
      setAccessModalMessage(t('no_access_modal_msg'));
      setAccessModalSubMessage(t(subMessageKey));
      openModal('noFeatureAccess');
      return;
    }

    selectBusiness(business);

    let initialTab = 'advanced';
    if (limits.pmf) initialTab = 'executive';
    else if (limits.insight || limits.strategic) initialTab = 'advanced';
    else if (limits.project) initialTab = 'bets';

    const businessSlug = toSlug(business?.business_name || '');
    navigate(`/businesspage?business=${businessSlug}&tab=${initialTab}`, { 
      state: { business, initialTab } 
    });
  }, [selectBusiness, navigate, t, userRole, openModal]);

  const handleCloseHowItWorksModal = useCallback(() => {
    closeModal('howItWorks');
  }, [closeModal]);

  const businessNameLength = businessFormData.business_name.length;

  return (
    <div className="dashboard-layout">
      <UserTour />
      <PlanLimitModal
        show={isModalOpen('planLimit')}
        onHide={() => closeModal('planLimit')}
        plan={usage?.plan}
        limit={usage?.workspaces?.limit}
        isAdmin={isAdmin}
      />

      {isModalOpen('insights') ? (
        ENABLE_PMF ? (
          <PMFInsights
            businessId={newlyCreatedBusiness?._id || selectedBusinessId || allBusinessesQuery[0]?._id}
            onContinue={() => {
              closeModal('insights');
              const business = newlyCreatedBusiness || allBusinessesQuery.find(b => b._id === (selectedBusinessId || allBusinessesQuery[0]?._id)) || allBusinessesQuery[0];
              const businessSlug = toSlug(business?.business_name || '');
              navigate(`/businesspage?business=${businessSlug}&tab=executive`, {
                state: { business, initialTab: 'executive' }
              });
            }}
          />
        ) : null
      ) : (
        <>
          <MenuBar />
          <Container fluid className="p-0 main-content">
            <div className="dashboard-content">
              <div className="welcome-section">
                <h1 className="welcome-title">
                  {t('welcome')} <span>{userName}</span>
                </h1>
                <p className="welcome-description">
                  {t('dashboard_description_redesign') || "Strategy as an operating system. Traxxia gives you a strategic diagnosis of your business in minutes, then turns each priority into a tracked bet your team actually executes."}
                </p>
              </div>

              {isLoadingBusinesses ? (
                <div className="d-flex justify-content-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : allBusinessesQuery.length === 0 ? (
                /* FIRST-TIME LOGIN VIEW (3 cards side-by-side) */
                <div className="first-time-container">
                  {renderHowItWorksCards(true)}
                </div>
              ) : (
                /* STANDARD LOGIN VIEW */
                <>
                  {/* Collapsible Accordion */}
                  <div className="how-it-works-accordion">
                    <div 
                      className="how-it-works-header"
                      onClick={() => setIsHowItWorksExpanded(!isHowItWorksExpanded)}
                    >
                      <span>{t('how_it_works') || 'HOW IT WORKS'}</span>
                      <ChevronDown 
                        size={18} 
                        className={`how-it-works-icon ${isHowItWorksExpanded ? 'expanded' : ''}`} 
                      />
                    </div>
                    {isHowItWorksExpanded && (
                      <div className="how-it-works-body">
                        {renderHowItWorksCards(false)}
                      </div>
                    )}
                  </div>

                  {/* Businesses Table */}
                  <div className="businesses-container">
                    <div className="businesses-header d-flex justify-content-between align-items-center gap-3">
                      <h2>
                        {t('your_businesses_all_states') || "YOUR BUSINESSES — ALL STATES"}
                      </h2>
                      
                      <div className="d-flex align-items-center gap-3">
                        <div className="status-filter-wrapper">
                          <button className="status-filter-btn" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            <span className="filter-label">{t('state_column') || 'STATE'}</span>
                            <span className="filter-value">
                              {statusFilter.length === 4 ? t('ALL') : (statusFilter.length === 1 ? t(statusFilter[0]) : t('multiple_filter') || 'Multiple')} · {filteredBusinesses.length}
                            </span>
                            <ChevronDown size={14} className={`ms-2 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isFilterOpen && (
                            <>
                              <div className="status-filter-overlay" onClick={() => setIsFilterOpen(false)} />
                              <div className="status-dropdown">
                              {['ALL', 'EXECUTION', 'CREATED', 'DELETED'].map(status => (
                                <div key={status} className="dropdown-item" onClick={() => toggleStatusFilter(status)}>
                                  <div className={`custom-checkbox ${statusFilter.includes(status) ? 'checked' : ''}`}>
                                    {statusFilter.includes(status) && <Check size={12} color="white" />}
                                  </div>
                                  <span className="status-name">{status === 'ALL' ? t('ALL') : t(status)}</span>
                                  <span className="status-count">{statusCounts[status]}</span>
                                </div>
                              ))}
                              </div>
                            </>
                          )}
                        </div>

                        {!isCollaborator && !isViewer && (
                          <button className="btn-create-business-header" onClick={handleShowCreateModal} disabled={isLoadingBusinesses}>
                            + {t('create_business') || 'Create Business'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="businesses-table-wrapper">
                      <table className="businesses-table">
                        <thead>
                          <tr>
                            <th>{t('business_column') || "BUSINESS"}</th>
                            <th>{t('state_column') || "STATE"}</th>
                            <th className="th-date">{t('date_of_creation_column') || "DATE OF CREATION"}</th>
                            <th className="text-center">{t('active_bets_column') || "ACTIVE BETS"}</th>
                            <th className="text-center">{t('collaborators_column') || "COLLABORATORS"}</th>
                            <th className="text-end th-actions">{t('actions_column') || "ACTIONS"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBusinesses.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-5 text-muted">
                                {t('no_businesses_yet') || 'No businesses yet'}
                              </td>
                            </tr>
                          ) : (
                            filteredBusinesses.map((business) => {
                              const isDeleted = business.status === 'deleted';
                              const state = isDeleted ? 'DELETED' : (business.has_projects ? 'EXECUTION' : 'CREATED');
                              const date = business.created_at ? new Date(business.created_at).toLocaleDateString('en-US', { 
                                month: 'short', day: '2-digit', year: 'numeric' 
                              }) : 'N/A';
                              
                              const activeBets = business.project_count || business.question_statistics?.total_projects || 0;
                              const collaborators = business.collaborators_count ?? (business.company_admin_id?.length || 1);

                              return (
                                <tr key={business._id || business.id} onClick={!isDeleted ? () => handleBusinessClick(business) : undefined} className={isDeleted ? 'row-deleted' : ''}>
                                  <td className="business-name-cell">{business.business_name}</td>
                                  <td>
                                    <span className={`state-badge state-${state.toLowerCase()}`}>
                                      {t(state)}
                                    </span>
                                  </td>
                                  <td className="date-cell">{date}</td>
                                  <td className="stats-cell text-center">{activeBets}</td>
                                  <td className="stats-cell text-center">{collaborators}</td>
                                  <td className="actions-cell">
                                    <div className="d-flex align-items-center gap-2 justify-content-end" onClick={(e) => e.stopPropagation()}>
                                      <button 
                                        className="btn-insights-outline" 
                                        onClick={() => handleBusinessClick(business)}
                                      >
                                        <span className="btn-icon-left">⚡</span> {t('insights') || 'Insights'}
                                      </button>
                                      <button 
                                        className="btn-execution-outline" 
                                        onClick={() => {}}
                                      >
                                        <span className="btn-icon-left">☑</span> {t('Execution') || 'Execution'} <span className="btn-icon-right">🔒</span>
                                      </button>
                                      {!isCollaborator && !isViewer && !isDeleted && (
                                        <button 
                                          className="btn-delete-business-inline" 
                                          onClick={() => handleShowDeleteModal(business)} 
                                          title={t('delete_business')}
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Container>

          {isModalOpen('howItWorks') && (
            <div className="popup-overlay" onClick={handleCloseHowItWorksModal}>
              <div className="popup-content large" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={handleCloseHowItWorksModal} aria-label="Close modal"><X size={20} /></button>
                <h2 className="mb-4">{t('how_it_works')}</h2>
                <Carousel activeIndex={activeSlide} onSelect={handleSelect} interval={5000} indicators={true} controls={true} variant="dark">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num, index) => (
                    <Carousel.Item key={index}>
                      <img src={`/slides/slide${num}.webp`} className="d-block w-100" alt={`Slide ${num}`} />
                    </Carousel.Item>
                  ))}
                </Carousel>
                <div className="carousel-external-caption text-center mt-2">
                  <h5>{t(getStepKeys(activeSlide).title)}</h5>
                  <p className="text-muted">{t(getStepKeys(activeSlide).description)}</p>
                </div>
                <div className="text-center mt-2">
                  <Button variant="primary" onClick={handleCloseHowItWorksModal} className="px-4">{t('got_it')}</Button>
                </div>
              </div>
            </div>
          )}

          {ENABLE_PMF && (
            <PMFOnboardingModal
              show={isModalOpen('pmfOnboarding')}
              onHide={() => closeModal('pmfOnboarding')}
              businessId={newlyCreatedBusiness?._id || selectedBusinessId || allBusinessesQuery[0]?._id}
              onSubmit={() => {
                closeModal('pmfOnboarding');
                const business = newlyCreatedBusiness || allBusinessesQuery.find(b => b._id === (selectedBusinessId || allBusinessesQuery[0]?._id));
                const businessSlug = toSlug(business?.business_name || '');
                navigate(`/businesspage?business=${businessSlug}&tab=executive`, {
                  state: { business, initialTab: 'executive' }
                });
              }}
            />
          )}

          <Modal show={isModalOpen('createBusiness')} onHide={handleCloseCreateModal} centered size="lg" backdrop="static">
            <Modal.Header closeButton><Modal.Title>{t('create_new_business')}</Modal.Title></Modal.Header>
            <Form onSubmit={handleSubmitBusiness} noValidate>
              <fieldset disabled={isCreatingBusiness}>
                <Modal.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('business_name')} *</Form.Label>
                    <Form.Control type="text" name="business_name" value={businessFormData.business_name} onChange={handleFormChange} placeholder={t('enter_your_business_name')} isInvalid={!!formErrors.business_name} maxLength={100} />
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <Form.Text className="text-danger">{formErrors.business_name}</Form.Text>
                      <Form.Text className={businessNameLength > 20 ? 'text-danger' : 'text-muted'}>{businessNameLength}/20</Form.Text>
                    </div>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('business_purpose')} *</Form.Label>
                    <Form.Control type="text" name="business_purpose" value={businessFormData.business_purpose} onChange={handleFormChange} placeholder={t('brief_description_of_what')} isInvalid={!!formErrors.business_purpose} />
                    <Form.Text className="text-danger">{formErrors.business_purpose}</Form.Text>
                  </Form.Group>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group><Form.Label>{t('city')} ({t('optional')})</Form.Label><Form.Control type="text" name="city" value={businessFormData.city} onChange={handleFormChange} placeholder={t('enter_city')} /></Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group><Form.Label>{t('country')} ({t('optional')})</Form.Label><Form.Control type="text" name="country" value={businessFormData.country} onChange={handleFormChange} placeholder={t('enter_country')} /></Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('description')} ({t('optional')})</Form.Label>
                    <Form.Control as="textarea" rows={3} name="description" value={businessFormData.description} onChange={handleFormChange} placeholder={t('detailed_description_of_your_business')} />
                  </Form.Group>
                  {businessError && <Alert variant="danger" className="mb-3">{businessError}</Alert>}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseCreateModal}>{t('cancel')}</Button>
                  <Button variant="primary" type="submit">{isCreatingBusiness ? <Spinner size="sm" /> : t('create_business')}</Button>
                </Modal.Footer>
              </fieldset>
            </Form>
          </Modal>

          <Modal show={isModalOpen('deleteBusiness')} onHide={handleCloseDeleteModal} centered>
            <Modal.Header closeButton><Modal.Title className="text-danger">{t('delete_business')}</Modal.Title></Modal.Header>
            <Modal.Body>
              {storeDeleteError && <Alert variant="danger">{storeDeleteError}</Alert>}
              {businessToDelete && <p>{t('are_you_sure_you_want_to_delete')} <strong>"{businessToDelete.business_name}"</strong>?</p>}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseDeleteModal}>{t('cancel')}</Button>
              <Button variant="danger" onClick={handleConfirmDelete}>{isDeletingBusiness ? <Spinner size="sm" /> : t('delete_business')}</Button>
            </Modal.Footer>
          </Modal>

          <PlanLimitModal
            show={isModalOpen('noFeatureAccess')}
            onHide={() => closeModal('noFeatureAccess')}
            title={t('no_access_modal_title')}
            message={accessModalMessage}
            subMessage={accessModalSubMessage}
            isAdmin={isAdmin}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
