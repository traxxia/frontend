import React, { useEffect } from "react";
import {
  Button,
  Container,
  Spinner,
  Modal,
  Form,
  Carousel
} from "react-bootstrap";
import {
  Info, X, AlertTriangle, Check, ChevronDown
} from "lucide-react";

import MenuBar from "../components/MenuBar";
import PMFOnboardingModal from "../components/PMFOnboardingModal";
import PMFInsights from "../components/PMFInsights";
import PlanLimitModal from '../components/PlanLimitModal';
import UserTour from "../components/UserTour";
import BusinessTable from "../components/BusinessTable";
import { useDashboard } from "../hooks/useDashboard";
import { getUserLimits } from '../utils/authUtils';

import "../styles/dashboard.css";

const Dashboard = () => {
  const {
    t, navigate,
    usage, isLoadingBusinesses,
    allBusinessesQuery,
    filteredBusinesses, statusFilter, isFilterOpen, setIsFilterOpen,
    toggleStatusFilter, statusCounts,
    userName, isViewer, isCollaborator, isAdmin,
    isModalOpen, openModal, closeModal,
    businessFormData, handleFormChange, formErrors,
    newlyCreatedBusiness, newlyCreatedBusinessId,
    businessToDelete, setBusinessToDelete,
    activeSlide, setActiveSlide,
    createBusiness, deleteBusiness,
    handleBusinessClick,
    validateForm,
    handleShowCreateModal
  } = useDashboard();

  const ENABLE_PMF = getUserLimits().pmf;

  useEffect(() => {
    const slidesToPreload = Array.from({ length: 10 }, (_, i) => `/slides/slide${i + 1}.webp`);
    slidesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const handleSubmitBusiness = (e) => {
    e.preventDefault();
    if (validateForm()) {
      createBusiness();
    }
  };

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
            businessId={newlyCreatedBusinessId || allBusinessesQuery[0]?._id}
            onContinue={() => {
              closeModal('insights');
              navigate("/businesspage", {
                state: {
                  business: newlyCreatedBusiness || allBusinessesQuery.find(b => b._id === newlyCreatedBusinessId) || allBusinessesQuery[0]
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
                    <Info size={17} />
                    {t('how_it_works')}
                  </button>
                </div>
              </div>

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

                  <BusinessTable
                    businesses={filteredBusinesses}
                    isCollaborator={isCollaborator}
                    isViewer={isViewer}
                    onBusinessClick={handleBusinessClick}
                    onDeleteClick={(b) => {
                      setBusinessToDelete(b);
                      openModal('deleteBusiness');
                    }}
                    t={t}
                  />
                </div>
              )}
            </div>
          </Container>

          {}
          {isModalOpen('howItWorks') && (
            <div className="popup-overlay" onClick={() => closeModal('howItWorks')}>
              <div className="popup-content large" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={() => closeModal('howItWorks')} aria-label="Close modal">
                  <X size={20} />
                </button>
                <h2 className="mb-4">{t('how_it_works')}</h2>
                <Carousel
                  activeIndex={activeSlide}
                  onSelect={(idx) => setActiveSlide(idx)}
                  interval={5000}
                  indicators={true}
                  controls={true}
                  variant="dark"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(idx => (
                    <Carousel.Item key={idx}>
                      <div className="slide-content">
                        <img className="d-block w-100" src={`/slides/slide${idx}.webp`} alt={`Slide ${idx}`} />
                        <div className="slide-caption">
                          <h5>{t(`step_${idx}_title`)}</h5>
                          <p>{t(`step_${idx}_description`)}</p>
                        </div>
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel>
              </div>
            </div>
          )}

          {}
          <Modal show={isModalOpen('createBusiness')} onHide={() => closeModal('createBusiness')} centered className="create-business-modal">
            <Modal.Header closeButton>
              <Modal.Title>{t('create_new_business')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleSubmitBusiness}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('business_name')} <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    name="business_name"
                    value={businessFormData.business_name}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.business_name}
                    placeholder={t('enter_business_name')}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.business_name}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>{t('business_purpose')} <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="business_purpose"
                    value={businessFormData.business_purpose}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.business_purpose}
                    placeholder={t('describe_business_purpose')}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.business_purpose}</Form.Control.Feedback>
                </Form.Group>
                <div className="d-flex justify-content-end gap-2">
                  <Button variant="secondary" onClick={() => closeModal('createBusiness')}>{t('cancel')}</Button>
                  <Button variant="primary" type="submit">{t('create')}</Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          {}
          <Modal show={isModalOpen('deleteBusiness')} onHide={() => closeModal('deleteBusiness')} centered className="delete-modal">
            <Modal.Body className="text-center p-4">
              <div className="delete-icon-wrapper mb-4">
                <AlertTriangle size={48} color="#dc3545" />
              </div>
              <h3 className="mb-3">{t('delete_business_confirm_title')}</h3>
              <p className="text-muted mb-4">
                {t('delete_business_confirm_message', { name: businessToDelete?.business_name })}
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Button variant="outline-secondary" onClick={() => closeModal('deleteBusiness')}>
                  {t('cancel')}
                </Button>
                <Button variant="danger" onClick={() => deleteBusiness(businessToDelete?._id)}>
                  {t('delete_permanently')}
                </Button>
              </div>
            </Modal.Body>
          </Modal>

          <PMFOnboardingModal
            show={isModalOpen('pmfOnboarding')}
            onHide={() => closeModal('pmfOnboarding')}
            onComplete={() => {
              closeModal('pmfOnboarding');
              openModal('insights');
            }}
            businessId={newlyCreatedBusinessId}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
