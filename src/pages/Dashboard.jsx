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
  Accordion,
  Carousel
} from "react-bootstrap";
import {
  Info, X, Trash2, AlertTriangle, Check, ChevronDown
} from "lucide-react";
import MenuBar from "../components/MenuBar";
import PMFOnboardingModal from "../components/PMFOnboardingModal";
import PMFInsights from "../components/PMFInsights";
import "../styles/dashboard.css";
import { useTranslation } from '../hooks/useTranslation';

import PlanLimitModal from '../components/PlanLimitModal';
import { useAuthStore, useBusinessStore, useUIStore, useSubscriptionStore } from '../store';
import { useBusinesses, usePlanDetails } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

import { getUserLimits } from '../utils/authUtils';
import UserTour from "../components/UserTour";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

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
    fetchBusinesses,
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
  // Combined list for any code that needs all active businesses
  const allBusinessesQuery = [...ownedBusinesses, ...collaboratingBusinesses];


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
  const [statusFilter, setStatusFilter] = useState(['ALL', 'EXECUTION', 'CREATED', 'DELETED']);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
  // businessError is now from store
  const [formErrors, setFormErrors] = useState({});
  const userRole = useAuthStore(state => state.userRole);
  const userName = useAuthStore(state => state.userName);
  const isViewer = useAuthStore(state => state.isViewer());
  const isCollaborator = userRole?.toLowerCase() === "collaborator";
  const isAdmin = useAuthStore(state => state.isAdmin);
  // const logout = useAuthStore(state => state.logout);
  const token = useAuthStore(state => state.token);

  // Delete business state
  const [businessToDelete, setBusinessToDelete] = useState(null);
  // isLoadingBusinesses is now from store

  const [cooldownMessage] = useState('');
  const [accessModalMessage, setAccessModalMessage] = useState('');
  const [accessModalSubMessage, setAccessModalSubMessage] = useState('');


  // Tour modal state
  const [activeSlide, setActiveSlide] = useState(0);

  // Plan Limit Modal state from store


  // Custom menu state for alternatives

  const [, setHoveredItem] = useState(null);
  // const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const myBusinesses = useMemo(() => ownedBusinesses.filter(
    b => Boolean(b.has_projects) === false
  ), [ownedBusinesses]);

  const projectPhaseBusinesses = useMemo(() => ownedBusinesses.filter(
    b => Boolean(b.has_projects) === true
  ), [ownedBusinesses]);


  /* 
    fetchPlanDetails is now handled by useSubscriptionStore
  */

  // Fetching is now handled by useQuery hooks above.
  // We can keep the effect for any side effects if needed, 
  // but TanStack Query handles the initial load automatically.
  useEffect(() => {
    // Preload the first few slides for the "How it works" modal
    const slidesToPreload = ["/slides/slide1.jpeg", "/slides/slide2.jpeg", "/slides/slide3.jpeg"];
    slidesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);


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

  // Handle carousel slide selection
  const handleSelect = (selectedIndex) => {
    setActiveSlide(selectedIndex);
  };




  const deleteBusiness = useCallback(async (businessId) => {
    try {
      clearErrors();
      await deleteBusinessAction(businessId);
      
      // Close modal and show toast immediately
      closeModal('deleteBusiness');
      setBusinessToDelete(null);
      addToast({ message: t('business_deleted_successfully'), type: 'success' });

      // Refresh data in background
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

      // Close modal and show success toast immediately
      closeModal('createBusiness');
      addToast({ message: t('business_created_successfully'), type: 'success' });

      // Open PMF onboarding if enabled
      if (ENABLE_PMF) openModal('pmfOnboarding');

      // Clear form data
      setBusinessFormData({
        business_name: '',
        business_purpose: '',
        description: '',
        city: '',
        country: ''
      });

      // Refresh data in background
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['planDetails'] })
      ]);
    } catch (error) {
      console.error('Error creating business:', error);
    }
  }, [createBusinessAction, businessFormData, setSelectedBusinessId, t, ENABLE_PMF, closeModal, openModal, addToast, queryClient]);


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

      if (current >= limit) {
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
    const limits = getUserLimits();
    const hasAnyAccess = limits.pmf || limits.project || limits.strategic || limits.insight;

    // If no feature access is available, block navigation and trigger modal
    if (!hasAnyAccess) {
      const isAdminRole = ['super_admin', 'company_admin', 'org_admin'].includes(userRole?.toLowerCase());
      const subMessageKey = isAdminRole ? "no_access_modal_sub_admin" : "no_access_modal_sub_user";
      
      setAccessModalMessage(t('no_access_modal_msg'));
      setAccessModalSubMessage(t(subMessageKey));
      openModal('noFeatureAccess');
      return;
    }

    const businessId = business._id || business.id;
    if (businessId) {
      selectBusiness(business);
    }

    // Determine initial tab based on priority: PMF > Insights/Strategic > Projects
    let initialTab = 'advanced';
    if (limits.pmf) initialTab = 'executive';
    else if (limits.insight || limits.strategic) initialTab = 'advanced';
    else if (limits.project) initialTab = 'bets';

    navigate('/businesspage', { state: { business, initialTab } });
  }, [selectBusiness, navigate, addToast, t]);

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
      />


      {/* FULL PAGE PMF INSIGHTS */}
      {isModalOpen('insights') ? (
        ENABLE_PMF ? (
          <PMFInsights
            businessId={newlyCreatedBusiness?._id || selectedBusinessId || allBusinessesQuery[0]?._id}
            onContinue={() => {
              closeModal('insights');
              navigate("/businesspage", {
                state: {
                  business: newlyCreatedBusiness || allBusinessesQuery.find(b => b._id === (selectedBusinessId || allBusinessesQuery[0]?._id)) || allBusinessesQuery[0]
                }
              });
            }}
          />

        ) : null
      ) : (
        <>
          <MenuBar />
          <Container fluid className="p-0 main-content">
            <div className="dashboard-content">
              {/* Welcome Section */}
              <div className="welcome-section">
                <h1 className="welcome-title">
                  {t('welcome')} <span>{userName} !</span>
                </h1>
                <p className="welcome-description">
                  {t('dashboard_description_redesign') || "Create business plans step by step with the S.T.R.A.T.E.G.I.C framework. Activate AI capabilities for analysis, prediction, and decision-making."}
                </p>
                
                <div className="action-buttons">
                  {!isCollaborator && !isViewer && (
                    <button 
                      className="btn-create-business"
                      onClick={handleShowCreateModal}
                      disabled={isLoadingBusinesses}
                    >
                      <span style={{ fontSize: '20px', lineHeight: '1' }}>+</span>
                      {t('create_business')}
                    </button>
                  )}
                  <button 
                    className="btn-how-it-works"
                    onClick={() => openModal('howItWorks')}
                  >
                    <Info size={18} />
                    {t('how_it_works')}
                  </button>
                </div>
              </div>

              {/* Businesses Table Section */}
              {isLoadingBusinesses ? (
                <div className="d-flex justify-content-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <div className="businesses-container">
                  <div className="businesses-header d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                    <h2>{t('your_businesses_all_states') || "YOUR BUSINESSES — ALL STATES"}</h2>
                    
                    <div className="status-filter-wrapper">
                      <button 
                        className="status-filter-btn"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                      >
                        <span className="filter-label">STATE</span>
                        <span className="filter-value">
                          {statusFilter.length === 4 ? 'All' : (statusFilter.length === 1 ? statusFilter[0] : 'Multiple')} · {filteredBusinesses.length}
                        </span>
                        <ChevronDown size={14} className={`ms-2 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isFilterOpen && (
                        <>
                          <div className="status-filter-overlay" onClick={() => setIsFilterOpen(false)} />
                          <div className="status-dropdown">
                          {['ALL', 'EXECUTION', 'CREATED', 'DELETED'].map(status => (
                            <div 
                              key={status} 
                              className="dropdown-item"
                              onClick={() => toggleStatusFilter(status)}
                            >
                              <div className={`custom-checkbox ${statusFilter.includes(status) ? 'checked' : ''}`}>
                                {statusFilter.includes(status) && <Check size={12} color="white" />}
                              </div>
                              <span className="status-name">{status === 'ALL' ? 'All' : status}</span>
                              <span className="status-count">{statusCounts[status]}</span>
                            </div>
                          ))}
                          </div>
                        </>
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
                          <th>{t('status_column') || "STATUS"}</th>
                          <th>{t('active_bets_column') || "# BETS"}</th>
                          <th>{t('collaborators_column') || "# COLLABORATORS"}</th>
                          {(!isCollaborator && !isViewer) && <th>{t('action_column') || "ACTION"}</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBusinesses.length === 0 ? (
                          <tr>
                            <td colSpan={(!isCollaborator && !isViewer) ? "7" : "6"} className="text-center py-5 text-muted">
                              {t('no_businesses_yet')}
                            </td>
                          </tr>
                        ) : (
                          filteredBusinesses.map((business) => {
                            const isDeleted = business.status === 'deleted';
                            const state = isDeleted ? 'DELETED' : (business.has_projects ? 'EXECUTION' : 'CREATED');
                            const stateClass = `state-${state.toLowerCase()}`;
                            const date = business.created_at ? new Date(business.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: '2-digit', 
                              year: 'numeric' 
                            }) : 'N/A';
                            
                            // Derive stats
                            const activeBets = business.project_count || business.question_statistics?.total_projects || 0;
                            const collaborators = business.collaborators_count ?? (business.company_admin_id?.length || 1);

                            // Derive display status
                            const statusLower = (business.status || '').toLowerCase();
                            const accessLower = (business.access_mode || '').toLowerCase();
                            const isActuallyArchived = statusLower === 'archived' || accessLower === 'archived';
                            const isActuallyDeleted = statusLower === 'deleted';
                            
                            const displayStatus = isActuallyDeleted ? 'Deleted' : (isActuallyArchived ? 'Archived' : 'Active');
                            const statusBadgeClass = isActuallyDeleted ? 'status-deleted' : (isActuallyArchived ? 'status-archived' : 'status-active');

                            return (
                              <tr 
                                key={business._id || business.id} 
                                onClick={!isDeleted ? () => handleBusinessClick(business) : undefined}
                                className={isDeleted ? 'row-deleted' : ''}
                              >
                                <td className="business-name-cell">{business.business_name}</td>
                                <td>
                                  <span className={`state-badge ${stateClass}`}>{state}</span>
                                </td>
                                <td className="date-cell">{date}</td>
                                <td className="status-response-cell">
                                  <span className={`status-badge ${statusBadgeClass}`}>
                                    {displayStatus}
                                  </span>
                                </td>
                                <td className="stats-cell">{activeBets}</td>
                                <td className="stats-cell">{collaborators}</td>
                                {(!isCollaborator && !isViewer) && (
                                  <td className="stats-cell">
                                    {!isDeleted && (
                                      <button
                                        className="btn-delete-business"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleShowDeleteModal(business);
                                        }}
                                        title={t('delete_business')}
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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

                <Carousel
                  id="howItWorksCarousel"
                  activeIndex={activeSlide}
                  onSelect={handleSelect}
                  interval={5000}
                  indicators={true}
                  controls={true}
                  variant="dark"
                >
                  {[
                    { src: "/slides/slide1.png", alt: 'step_1_login_alt' },
                    { src: "/slides/slide2.png", alt: 'step_2_create_business_alt' },
                    { src: "/slides/slide3.png", alt: 'step_3_onboarding_pmf_alt' },
                    { src: "/slides/slide4.png", alt: 'step_4_new_business_alt' },
                    { src: "/slides/slide5.png", alt: 'step_5_exec_summary_alt' },
                    { src: "/slides/slide6.png", alt: 'step_6_kickstart_projects_alt' },
                    { src: "/slides/slide7.png", alt: 'step_7_project_ranking_alt' },
                    { src: "/slides/slide8.png", alt: 'step_8_ai_answers_alt' },
                    { src: "/slides/slide9.png", alt: 'step_9_insights_6cs_alt' },
                    { src: "/slides/slide10.png", alt: 'step_10_strategic_alt' },
                  ].map((slide, index) => (
                    <Carousel.Item key={index}>
                      <img
                        src={slide.src}
                        className="d-block w-100"
                        alt={t(slide.alt)}
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>

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
              businessId={newlyCreatedBusiness?._id || selectedBusinessId || allBusinessesQuery[0]?._id}
              onSubmit={(pmfFormData) => {
                closeModal('pmfOnboarding');
                // Instead of showing standalone insights, go straight to the business page
                // Any "AHA" results will be available in the tabs there
                closeModal('insights');
                navigate("/businesspage", {
                  state: {
                    business: newlyCreatedBusiness || allBusinessesQuery.find(b => b._id === (selectedBusinessId || allBusinessesQuery[0]?._id))
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

          <PlanLimitModal
            show={isModalOpen('noFeatureAccess')}
            onHide={() => closeModal('noFeatureAccess')}
            title={t('no_access_modal_title')}
            message={accessModalMessage}
            subMessage={accessModalSubMessage}
            isAdmin={isAdmin}
          />


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