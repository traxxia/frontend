import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Info, X, Trash2, Check, ChevronDown, Lock, FileText, Zap, CheckSquare
} from "lucide-react";
import { answerService } from '../services/answerService';
import { AnalysisApiService } from '../services/analysisApiService';
import MenuBar from "../components/MenuBar";
import PMFOnboardingModal from "../components/PMFOnboardingModal";
import PMFInsights from "../components/PMFInsights";
import "../styles/dashboard.css";
import { useTranslation } from '../hooks/useTranslation';

import PlanLimitModal from '../components/PlanLimitModal';
import { useAuthStore, useBusinessStore, useUIStore, useAnalysisStore } from '../store';
import { useBusinesses, usePlanDetails } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

import { getUserLimits } from '../utils/authUtils';
import { fileKey, computePageCount, getFileDetails } from '../utils/fileUtils';

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
  const { t, currentLanguage } = useTranslation();
  const ENABLE_PMF = getUserLimits().pmf;
  const regenerating = useAnalysisStore(state => state.regenerating);
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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePageCounts, setFilePageCounts] = useState({});
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef(null);
  const [businessFormData, setBusinessFormData] = useState({
    business_name: '',
    website: '',
    has_no_website: false
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

  const limits = getUserLimits();
  const hasInsightsAccess = limits.pmf || limits.insight || limits.strategic;
  const hasProjectAccess = limits.project;

  const [businessToDelete, setBusinessToDelete] = useState(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Compute real page/slide/sheet counts asynchronously whenever files are added
  useEffect(() => {
    let cancelled = false;
    const newFiles = selectedFiles.filter(f => !(fileKey(f) in filePageCounts));
    if (newFiles.length === 0) return;
    newFiles.forEach(async (file) => {
      const info = await computePageCount(file);
      if (cancelled) return;
      setFilePageCounts(prev => ({ ...prev, [fileKey(file)]: info }));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles]);

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
        {/* <hr className="hiw-divider" /> */}
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
        {/* <hr className="hiw-divider" /> */}
        <div className="hiw-list">
          <div className="hiw-list-item">
            <strong>{t('hiw_basic') || 'Basic'}:</strong> {t('hiw_basic_details') || 'AHA insights, Where & How to compete, Top 5 priorities'}
          </div>
          <div className="hiw-list-item">
            <strong>{t('hiw_advanced') || 'Advanced'}:</strong> <>{t('hiw_advanced_details_pre') || "PESTEL, Porter's Five Forces, NPS, BCG, "} <span className="notranslate">S.T.R.A.T.E.G.I.C.</span> {t('hiw_advanced_details_post') || " scorecard"}</>
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
        {/* <hr className="hiw-divider" /> */}
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
      setIsProcessingDelete(true);
      clearErrors();
      await deleteBusinessAction(businessId);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['planDetails'] })
      ]);

      closeModal('deleteBusiness');
      setBusinessToDelete(null);
      addToast({ message: t('business_deleted_successfully'), type: 'success' });
    } catch (error) {
      console.error('Error deleting business:', error);
    } finally {
      setIsProcessingDelete(false);
    }
  }, [deleteBusinessAction, t, closeModal, addToast, clearErrors, queryClient]);

  const createBusiness = useCallback(async () => {
    try {
      const data = await createBusinessAction(businessFormData);
      const business = data.business;
      const newBusinessId = business?._id || business?.id;

      let pmfData = null;
      if (newBusinessId && (selectedFiles.length > 0 || (businessFormData.website && !businessFormData.has_no_website))) {
        setIsUploadingFiles(true);
        if (selectedFiles.length > 0) {
          for (const file of selectedFiles) {
            try {
              const count = filePageCounts[fileKey(file)]?.count;
              await answerService.uploadStrategicDocument(newBusinessId, file, count);
            } catch (uploadErr) {
              console.error(`Error uploading file ${file.name}:`, uploadErr);
            }
          }
        }

        try {
          const mlBackendUrl = import.meta.env.VITE_ML_BACKEND_URL || 'http://localhost:8000';
          const formData = new FormData();
          if (selectedFiles.length > 0) {
            formData.append('file', selectedFiles[0]);
          }
          if (businessFormData.website && !businessFormData.has_no_website) {
            formData.append('url', businessFormData.website);
          }
          formData.append('language', currentLanguage || 'en');

          const mlResponse = await fetch(`${mlBackendUrl}/pmf-analysis`, {
            method: 'POST',
            headers: {
              'X-Business-Id': newBusinessId
            },
            body: formData
          });

          const mlResult = await mlResponse.json();
          if (mlResult.success && mlResult.data) {
            pmfData = mlResult.data;
            try {
              const getAuthToken = () => useAuthStore.getState().token;
              const analysisService = new AnalysisApiService(import.meta.env.VITE_ML_BACKEND_URL, import.meta.env.VITE_BACKEND_URL, getAuthToken);
              await analysisService.savePMFOnboardingData(newBusinessId, pmfData);
            } catch (saveErr) {
              console.error("Failed to save extracted PMF data to DB:", saveErr);
            }
          }
        } catch (extractErr) {
          console.warn("ML Analysis failed:", extractErr);
        }

        setIsUploadingFiles(false);
      }

      setNewlyCreatedBusiness(business);
      if (newBusinessId) {
        setSelectedBusinessId(newBusinessId);
      }

      closeModal('createBusiness');
      addToast({ message: t('business_created_successfully'), type: 'success' });

      const uploadedFilesData = selectedFiles.map(file => ({
        name: file.name,
        meta: getFileDetails(file, filePageCounts[fileKey(file)])
      }));
      navigate(`/onboarding/${newBusinessId}`, {
        state: { business, initialTab: 'onboarding', pmfData, uploadedFiles: uploadedFilesData }
      });

      setBusinessFormData({
        business_name: '',
        website: '',
        has_no_website: false
      });
      setSelectedFiles([]);
      setFilePageCounts({});

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['planDetails'] })
      ]);
    } catch (error) {
      console.error('Error creating business:', error);
      setIsUploadingFiles(false);
    }
  }, [createBusinessAction, businessFormData, selectedFiles, setSelectedBusinessId, t, closeModal, addToast, queryClient, navigate]);

  const validateForm = useCallback(() => {
    const errors = {};
    const businessName = businessFormData.business_name.trim();

    if (!businessName) {
      errors.business_name = t('business_name_cannot_be_empty') || "Business name cannot be empty";
    } else if (businessName.length < 3) {
      errors.business_name = "Business name must be at least 3 characters";
    } else if (!/[A-Za-z]/.test(businessName)) {
      errors.business_name = "Business name must contain at least one letter";
    }

    if (!businessFormData.has_no_website) {
      const website = businessFormData.website.trim();
      if (!website) {
        errors.website = t('website_required') || "Website is required";
      }
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
      website: '',
      has_no_website: false
    });
    setSelectedFiles([]);
    setFilePageCounts({});
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

  const handleFileChange = useCallback((e) => {
    if (e.target.files) {
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf'];
      const files = Array.from(e.target.files);
      const validFiles = [];
      const invalidFiles = [];

      files.forEach(file => {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        addToast({ message: 'this is not supported file format', type: 'error' });
      }

      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
      }

      // Reset the input so the same file can be re-selected after being removed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [addToast]);

  const handleRemoveFile = useCallback((indexToRemove) => {
    setSelectedFiles(prev => {
      const removed = prev[indexToRemove];
      if (removed) {
        setFilePageCounts(counts => {
          const next = { ...counts };
          delete next[fileKey(removed)];
          return next;
        });
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
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

  const handleInsightsClick = useCallback(async (business) => {
    if (business.status === 'deleted') return;

    selectBusiness(business);
    const businessId = business?._id || business?.id;
    const businessSlug = toSlug(business?.business_name || '');
    const stage = business?.pmf_stage || 'onboarding';

    const userPlan = useAuthStore.getState().userPlan;
    const hasPlan = userPlan && userPlan.trim().toLowerCase() !== "no plan" && userPlan.trim().toLowerCase() !== "none";

    if (stage === 'onboarding') {
      // Still need to pass pmfData if available, but for simplicity, we can fetch it on the onboarding page or just navigate.
      navigate(`/onboarding/${businessId}`, {
        state: { business }
      });
      return;
    }

    if (!hasPlan) {
      // Free users can only ever access up to the executive summary tab.
      navigate(`/businesspage?business=${businessSlug}&tab=executive`, {
        state: { business, initialTab: 'executive' }
      });
      return;
    }

    let initialTab = 'executive';
    if (stage === 'executive_summary') {
      initialTab = 'executive';
    } else if (stage === 'advanced_brief') {
      initialTab = 'advanced';
    } else if (stage === 'insights') {
      initialTab = 'insights';
    }

    navigate(`/businesspage?business=${businessSlug}&tab=${initialTab}`, {
      state: { business, initialTab }
    });
  }, [selectBusiness, navigate, t, userRole, openModal, regenerating]);

  const handleExecutionClick = useCallback((business) => {
    if (business.status === 'deleted') return;

    const limits = getUserLimits();
    const hasAccess = limits.project;

    const businessSlug = toSlug(business?.business_name || '');
    const businessId = business?._id || business?.id;

    if (!hasAccess) {
      navigate(`/business/${businessId || 'default'}/execution`);
      return;
    }

    selectBusiness(business);

    const initialTab = 'bets';
    navigate(`/businesspage?business=${businessSlug}&tab=${initialTab}`, {
      state: { business, initialTab }
    });
  }, [selectBusiness, navigate, t, userRole, openModal]);

  const handleCloseHowItWorksModal = useCallback(() => {
    closeModal('howItWorks');
  }, [closeModal]);



  return (
    <div className="dashboard-layout">
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
                  {t('welcome')} <span className="notranslate">{userName}!</span>
                </h1>
                <p className="welcome-description">
                  <>{t('dashboard_description_p1') || "Create business plans step by step with the "} <span className="notranslate">S.T.R.A.T.E.G.I.C.</span> {t('dashboard_description_p2') || " framework. Activate AI capabilities for analysis, prediction, and decision-making."}</>
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
                      <span class="biz-table-title"><b>{t('your_businesses_all_states')}</b></span>

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
                                <tr key={business._id || business.id} className={isDeleted ? 'row-deleted' : ''}>
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
                                        onClick={() => handleInsightsClick(business)}
                                        disabled={isDeleted}
                                        style={isDeleted ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                      >
                                        <Zap size={14} className="me-2" /> {t('insights') || 'Insights'}
                                      </button>
                                      <button
                                        className="btn-execution-outline"
                                        onClick={() => handleExecutionClick(business)}
                                        disabled={isDeleted}
                                        style={isDeleted ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                      >
                                        <CheckSquare size={14} className="me-2" /> {t('Execution') || 'Execution'}
                                        {!hasProjectAccess && <span className="ms-1" style={{ fontSize: '10px' }}>🔒</span>}
                                      </button>
                                      {!isCollaborator && !isViewer && (
                                        <button
                                          className="btn-delete-business-inline"
                                          onClick={!isDeleted ? () => handleShowDeleteModal(business) : undefined}
                                          title={!isDeleted ? t('delete_business') : undefined}
                                          style={{ visibility: isDeleted ? 'hidden' : 'visible' }}
                                          disabled={isDeleted}
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

          <Modal
            show={isModalOpen('createBusiness')}
            onHide={() => {
              if (isCreatingBusiness || isUploadingFiles) return;
              handleCloseCreateModal();
            }}
            centered
            dialogClassName="create-business-modal"
            backdrop="static"
          >
            <Modal.Header closeButton={!(isCreatingBusiness || isUploadingFiles)}>
              <Modal.Title>{t('create_new_business', 'Create New Business')}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmitBusiness} noValidate className="form-modal">
              <fieldset disabled={isCreatingBusiness || isUploadingFiles}>
                <Modal.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('business_name', 'Business Name')} <span>*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="business_name"
                      value={businessFormData.business_name}
                      onChange={handleFormChange}
                      placeholder="e.g. Atlas CPG"
                      isInvalid={!!formErrors.business_name}
                      maxLength={100}
                    />
                    {formErrors.business_name && (
                      <Form.Text className="text-danger mt-1 d-block">{formErrors.business_name}</Form.Text>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('website', 'Website')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="website"
                      value={businessFormData.website}
                      onChange={handleFormChange}
                      placeholder="e.g. atlascpg.com"
                      isInvalid={!!formErrors.website}
                      disabled={businessFormData.has_no_website}
                    />
                    {formErrors.website && (
                      <Form.Text className="text-danger mt-1 d-block">{formErrors.website}</Form.Text>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-3 form-check d-flex flex-column align-items-start gap-1 p-0">
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        className="form-check-input m-0"
                        id="has_no_website"
                        name="has_no_website"
                        checked={businessFormData.has_no_website}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBusinessFormData(prev => ({
                            ...prev,
                            has_no_website: checked,
                            website: checked ? '' : prev.website
                          }));
                          setFormErrors(prev => ({
                            ...prev,
                            website: ''
                          }));
                        }}
                      />
                      <label className="form-check-label" htmlFor="has_no_website">
                        {t('i_dont_have_website', "I don't have a website yet")}
                      </label>
                    </div>
                    {/* <div className="info-box-blue mt-2 w-100">
                      <strong>{t('trax_will_read_your_website_bold', 'Trax will read your website')}</strong> {t('trax_will_read_your_website_rest', "and ask only for what's still missing.")}
                    </div> */}
                  </Form.Group>

                  <div className="create-business-doc-upload mt-2">
                    <div className="doc-upload-header d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <span className="doc-upload-title">{t('add_documents_optional', 'Add documents (optional)')}</span>
                        {selectedFiles.length > 0 && (
                          <span className="files-count-badge">
                            {selectedFiles.length} {selectedFiles.length === 1 ? t('file', 'file') : t('files', 'files')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="doc-upload-body mt-2">
                      <div className="info-box-blue mb-3">
                        Upload your annual plan, board deck, or financials and Trax will auto-fill the questions below — the more it has, the sharper the diagnosis.
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="d-flex flex-column gap-2 mb-3">
                          {selectedFiles.map((file, idx) => {
                            const ext = file.name.split('.').pop().toUpperCase();
                            return (
                              <div key={idx} className="selected-file-card d-flex align-items-center justify-content-between p-2 rounded">
                                <div className="d-flex align-items-center gap-3">
                                  <div className="file-type-badge">
                                    {ext}
                                  </div>
                                  <div className="d-flex flex-column text-start">
                                    <span className="selected-file-name" title={file.name}>
                                      {file.name}
                                    </span>
                                    <span className="selected-file-meta">
                                      {getFileDetails(file, filePageCounts[fileKey(file)])}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="btn-remove-selected-file p-1 border-0 bg-transparent text-secondary d-flex align-items-center"
                                  onClick={() => handleRemoveFile(idx)}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <button
                        type="button"
                        className={`btn-add-file-dashed py-2 d-flex align-items-center justify-content-center gap-2 ${selectedFiles.length > 0 ? 'btn-add-file-small' : 'w-100'}`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span>+ {t('add_file', 'Add file')}</span>
                      </button>
                      <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
                      />

                      <div className="info-box-green mt-3">
                        <Lock size={12} className="text-success flex-shrink-0" />
                        <span>
                          <strong>{t('your_documents_stay_private_bold', 'Your documents stay private.')}</strong> {t('your_documents_stay_private_rest', 'Encrypted at rest and isolated to your workspace.')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {businessError && <Alert variant="danger" className="mb-3">{businessError}</Alert>}
                </Modal.Body>
              </fieldset>
              <Modal.Footer>
                <button type="button" className="btn-cancel" onClick={handleCloseCreateModal}>
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  className="btn-continue"
                  disabled={isCreatingBusiness || isUploadingFiles || !businessFormData.business_name.trim() || (!businessFormData.has_no_website && !businessFormData.website.trim())}
                  onClick={() => {
                    if (!validateForm()) return;
                    createBusiness();
                  }}
                >
                  {isCreatingBusiness || isUploadingFiles ? <Spinner size="sm" /> : (t('letsBegin', `Let's Begin`) + ' \u2192')}
                </button>
              </Modal.Footer>
            </Form>
          </Modal>

          <Modal show={isModalOpen('deleteBusiness')} onHide={handleCloseDeleteModal} centered>
            <Modal.Header closeButton><Modal.Title className="text-danger">{t('delete_business')}</Modal.Title></Modal.Header>
            <Modal.Body>
              {storeDeleteError && <Alert variant="danger">{storeDeleteError}</Alert>}
              {businessToDelete && <p>{t('are_you_sure_you_want_to_delete')} <strong>"{businessToDelete.business_name}"</strong>?</p>}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseDeleteModal} disabled={isDeletingBusiness || isProcessingDelete}>{t('cancel')}</Button>
              <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeletingBusiness || isProcessingDelete}>{isDeletingBusiness || isProcessingDelete ? <Spinner size="sm" /> : <span>{t('delete_business')}</span>}</Button>
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
