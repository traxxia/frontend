import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Check, X, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import '../styles/Register.css';
import logo from '../assets/traxxia-logo.png';

import { useRegister } from '../hooks/useRegister';
import UserStep from '../components/UserStep';
import CompanyStep from '../components/CompanyStep';
import PaymentStep from '../components/PaymentStep';

const StripeHookWrapper = (props) => {
  const { stripeComponents } = props;
  const stripe = stripeComponents.useStripe();
  const elements = stripeComponents.useElements();
  return <PaymentStep {...props} stripe={stripe} elements={elements} />;
};

const Register = () => {
  const navigate = useNavigate();
  const {
    activeTab, setActiveTab, form, setForm, isNewCompany, setIsNewCompany, selectedPlanId, setSelectedPlanId,
    errors, setErrors, isSubmitting, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword,
    showSuccessModal, setShowSuccessModal, modalMessage, isError, isCheckingEmail, companySearch, setCompanySearch,
    submitError, setSubmitError, isCompanyDropdownOpen, setIsCompanyDropdownOpen, isRoleDropdownOpen, setIsRoleDropdownOpen,
    plans, loadingPlans, companies, loadingCompanies, filteredCompanies, handleChange, handleNext, handleBack, handleSubmit, t, hasInviteToken
  } = useRegister();

  const companyErrorRef = useRef(null);
  const plansErrorRef = useRef(null);
  const termsErrorRef = useRef(null);
  const companyDropdownRef = useRef(null);
  const roleDropdownRef = useRef(null);
  const errorBoxRef = useRef(null);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [stripeComponents, setStripeComponents] = useState(null);

  const stripePromise = useMemo(async () => {
    if (activeTab === 3 && isNewCompany) {
      const [stripeJs, reactStripeJs] = await Promise.all([
        import('@stripe/stripe-js'),
        import('@stripe/react-stripe-js')
      ]);
      setStripeComponents(reactStripeJs);
      return stripeJs.loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    }
    return null;
  }, [activeTab, isNewCompany]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) setIsCompanyDropdownOpen(false);
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) setIsRoleDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsCompanyDropdownOpen, setIsRoleDropdownOpen]);

  const handleNextWithScroll = async () => {
    const tab2Errors = await handleNext();
    if (tab2Errors && Object.keys(tab2Errors).length > 0) {
      setTimeout(() => {
        if (tab2Errors.company_name || tab2Errors.company_id) companyErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else if (tab2Errors.selectedPlanId) plansErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else if (tab2Errors.terms) termsErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  return (
    <>
      <div className="register-container notranslate">
        <div className="register-left-section">
          <div className="company-branding">
            <div className="logo-container">
              <img src={logo} alt="Traxxia Logo" className="logo" />
            </div>
            <div className="decoration-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
            </div>
          </div>
        </div>

        <div className="register-right-section">
          <main className="register-main-content">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="register-box">
              <div className="register-header">
                <h1>{t('register_title')}</h1>
                <p>{t('create_account_subtitle')}</p>
              </div>

              <AnimatePresence mode="wait">
                {submitError && (
                  <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 20 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="registration-error-box" ref={errorBoxRef}>
                    <div className="error-icon"><XCircle size={20} /></div>
                    <div className="error-content">
                      <p>{submitError}</p>
                      {submitError.includes('limit') && <span className="error-action">{t('contact_admin_to_upgrade')}</span>}
                    </div>
                    <button className="error-close" onClick={() => setSubmitError(null)}><X size={18} /></button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <UserStep
                  form={form} handleChange={handleChange} errors={errors} isCheckingEmail={isCheckingEmail}
                  isSubmitting={isSubmitting}
                  showPassword={showPassword} setShowPassword={setShowPassword}
                  showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
                  handleNext={handleNext} onBackToLogin={() => navigate('/login')} t={t}
                  hasInviteToken={hasInviteToken}
                />
              </AnimatePresence>
            </motion.div>
          </main>
        </div>
      </div>

      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered className="success-modal">
        <Modal.Body>
          <div className={`modal-status-icon ${isError ? 'error' : 'success'}`}>{isError ? <XCircle size={48} /> : <Check size={48} />}</div>
          <h3>{isError ? t('error') : t('success')}</h3>
          <p>{modalMessage}</p>
          <Button variant="primary" onClick={() => setShowSuccessModal(false)}>{t('close')}</Button>
        </Modal.Body>
      </Modal>

      <Modal show={showTermsModal} onHide={() => setShowTermsModal(false)} size="lg" centered dialogClassName="terms-modal">
        <Modal.Header closeButton><Modal.Title>{t('terms_conditions')}</Modal.Title></Modal.Header>
        <Modal.Body className="terms-content"><p className="modal-text-break">{t('terms_content')}</p></Modal.Body>
      </Modal>

      <Modal show={showPrivacyModal} onHide={() => setShowPrivacyModal(false)} size="lg" centered dialogClassName="terms-modal">
        <Modal.Header closeButton><Modal.Title>{t('privacy_policy')}</Modal.Title></Modal.Header>
        <Modal.Body className="terms-content"><p className="modal-text-break">{t('privacy_content')}</p></Modal.Body>
      </Modal>
    </>
  );
};

export default Register;
