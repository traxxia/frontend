import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaCheck, FaTimes, FaAngleLeft, FaAngleRight, FaSpinner, FaUser, FaBuilding, FaSave, FaBriefcase, FaEnvelope } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Button } from 'react-bootstrap';
import '../styles/Register.css';
import logo from '../assets/01a2750def81a5872ec67b2b5ec01ff5e9d69d0e.png';

import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import PricingPlanCard from '../components/PricingPlanCard';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company_id: '',
    company_name: '',
    job_title: '',
    terms: false,
  });
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchCompanies();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/plans`);
      if (response.data.plans) {
        setPlans(response.data.plans);
        const essential = response.data.plans.find(p => p.name === 'Essential');
        if (essential) setSelectedPlanId(essential._id);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/companies`);
      if (response.data.companies) setCompanies(response.data.companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validateTab1 = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = t('first_name_required') || 'Name is required';
    if (!form.email.trim()) newErrors.email = t('email_required') || 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = t('email_invalid') || 'Invalid email';

    if (!form.password) newErrors.password = t('password_required') || 'Password is required';
    else if (form.password.length < 8) newErrors.password = t('password_min_length_8') || 'Min 8 characters';

    if (form.password !== form.confirmPassword) newErrors.confirmPassword = t('passwords_do_not_match') || 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTab2 = () => {
    const newErrors = {};
    if (isNewCompany) {
      if (!form.company_name.trim()) newErrors.company_name = t('company_name_required') || 'Company name is required';
      if (!selectedPlanId) newErrors.selectedPlanId = t('plan_selection_required') || 'Please select a pricing plan';
    } else if (!form.company_id) {
      newErrors.company_id = t('Company_selection_is_required') || 'Company selection is required';
    }
    if (!form.terms) newErrors.terms = t('terms_agreement_required') || 'You must agree to terms and conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateTab1()) setActiveTab(2);
  };

  const handleBack = () => {
    setActiveTab(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateTab2()) return;
    setIsSubmitting(true);

    try {
      const userData = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        terms_accepted: form.terms,
        job_title: form.job_title.trim() || undefined
      };

      if (isNewCompany) {
        userData.company_name = form.company_name.trim();
        userData.plan_id = selectedPlanId;
      } else {
        userData.company_id = form.company_id;
      }

      const response = await axios.post(`${API_BASE_URL}/api/register`, userData);
      setModalMessage(response.data.message || 'Success!');
      setIsError(false);
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/login');
      }, 2000);

    } catch (err) {
      setIsSubmitting(false);
      setIsError(true);
      setModalMessage(err.response?.data?.error || 'Registration failed.');
      setShowSuccessModal(true);
    }
  };

  return (
    <>
      <div className="register-container">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="register-box"
            >
              <div className="register-header">
                <h1>{t('register_title')}</h1>
                <p>{t('create_account_subtitle')}</p>
              </div>

              {/* Redesigned Step Indicator */}
              <div className="register-steps-container">
                <div className={`step-item ${activeTab === 1 ? 'active' : ''} ${activeTab === 2 ? 'completed' : ''}`}>
                  <div className="step-circle">
                    {activeTab === 2 ? <FaCheck /> : 1}
                  </div>
                  <span className="step-label">{t('step_1_user_info')}</span>
                </div>
                <div className="step-line"></div>
                <div className={`step-item ${activeTab === 2 ? 'active' : ''}`}>
                  <div className="step-circle">2</div>
                  <span className="step-label">{t('step_2_company_setup')}</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 1 ? (
                  <motion.div
                    key="user"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="tab-content"
                  >
                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="register-form">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>
                            {t('full_name')} <span className="required">*</span>
                          </label>
                          <div className="input-with-icon">
                            <input
                              type="text"
                              name="name"
                              placeholder={t('full_name_placeholder')}
                              value={form.name}
                              onChange={handleChange}
                              className={errors.name ? 'input-error' : ''}
                            />
                          </div>
                          {errors.name && <span className="error-message">{errors.name}</span>}
                        </div>

                        <div className="form-group">
                          <label>
                            {t('email_address')} <span className="required">*</span>
                          </label>
                          <div className="input-with-icon">
                            <input
                              type="email"
                              name="email"
                              placeholder={t('email_placeholder')}
                              value={form.email}
                              onChange={handleChange}
                              className={errors.email ? 'input-error' : ''}
                            />
                          </div>
                          {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                          <label>
                            {t('password')} <span className="required">*</span>
                          </label>
                          <div className="input-with-icon">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              placeholder={t('create_password')}
                              value={form.password}
                              onChange={handleChange}
                              className={errors.password ? 'input-error' : ''}
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <FaEye /> : <FaEyeSlash />}
                            </button>
                          </div>
                          {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                          <label>
                            {t('confirm_password')} <span className="required">*</span>
                          </label>
                          <div className="input-with-icon">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              placeholder={t('confirm_password_placeholder')}
                              value={form.confirmPassword}
                              onChange={handleChange}
                              className={errors.confirmPassword ? 'input-error' : ''}
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                            </button>
                          </div>
                          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={() => navigate('/login')}>
                          <FaAngleLeft /> {t('back_to_home')}
                        </button>
                        <button type="submit" className="btn-primary">
                          {t('next_step')} <FaAngleRight />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="company"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="tab-content"
                  >
                    <form onSubmit={handleSubmit} className="register-form">
                      <AnimatePresence mode="wait">
                        {activeTab === 1 && (
                          <motion.div
                            key="tab1"
                            className="register-form-grid fade-blur-in"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                          >
                            <div className="form-group-custom">
                              <label>{t('user_name')} *</label>
                              <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className={errors.name ? 'error' : ''} required />
                              {errors.name && <div className="error-message">{errors.name}</div>}
                            </div>

                            <div className="form-group-custom">
                              <label>{t('email')} *</label>
                              <input type="email" name="email" placeholder="email@example.com" value={form.email} onChange={handleChange} className={errors.email ? 'error' : ''} autoComplete="email" required />
                              {errors.email && <div className="error-message">{errors.email}</div>}
                            </div>

                            <div className="form-group-custom">
                              <label>{t('password')} *</label>
                              <div className="password-input-container">
                                <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Create password" value={form.password} onChange={handleChange} className={errors.password ? 'error' : ''} required />
                                <button type="button" className="password-toggle-button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FaEye /> : <FaEyeSlash />}</button>
                              </div>
                              {errors.password && <div className="error-message">{errors.password}</div>}
                            </div>

                            <div className="form-group-custom">
                              <label>{t('confirm_password')} *</label>
                              <div className="password-input-container">
                                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} className={errors.confirmPassword ? 'error' : ''} required />
                                <button type="button" className="password-toggle-button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <FaEye /> : <FaEyeSlash />}</button>
                              </div>
                              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                            </div>

                            <div className="form-group-custom full-width-field">
                              <label>{t('job_title')} (Optional)</label>
                              <input type="text" name="job_title" placeholder="e.g. Strategy Manager" value={form.job_title} onChange={handleChange} />
                            </div>

                            <div className="tab-navigation full-width-field">
                              <button type="button" onClick={() => navigate('/')} className="btn-vibrant btn-secondary-vibrant">
                                <FaAngleLeft /> Back to Home
                              </button>
                              <button type="button" onClick={handleNext} className="btn-vibrant btn-primary-vibrant">
                                Next Step <FaAngleRight />
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {activeTab === 2 && (
                          <motion.div
                            key="tab2"
                            className="register-form-grid fade-blur-in"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                          >
                            <div className="form-group-custom full-width-field">
                              <div className="selection-header"> 
                                <label>Action Type  <span className="required">*</span></label>
                                <div className="action-selection-group">
                                  <button
                                    type="button"
                                    className={`selection-btn ${!isNewCompany ? 'active' : ''}`}
                                    onClick={() => setIsNewCompany(false)}
                                  >
                                    <FaUser /> Join Existing
                                  </button>
                                  <button
                                    type="button"
                                    className={`selection-btn ${isNewCompany ? 'active' : ''}`}
                                    onClick={() => setIsNewCompany(true)}
                                  >
                                    <FaBuilding /> Create New
                                  </button>
                                </div>
                              </div>

                              <div className="selection-content">
                                {isNewCompany ? (
                                  <div className="form-group-custom animate-slide-in">
                                    <label>Company Name  <span className="required">*</span></label>
                                    <input type="text" name="company_name" placeholder="Your brand name" value={form.company_name} onChange={handleChange} className={errors.company_name ? 'error' : ''} required />
                                  </div>
                                ) : (
                                  <div className="form-group-custom animate-slide-in">
                                    <label>Select Company  <span className="required">*</span></label>
                                    <div className="select-wrapper">
                                      {loadingCompanies ? (
                                        <div className="loading-select"><FaSpinner className="spinner" /> Loading...</div>
                                      ) : (
                                        <select name="company_id" value={form.company_id} onChange={handleChange} className={errors.company_id ? 'error' : ''} required>
                                          <option value="">{t('select_a_company')}</option>
                                          {companies.map((c) => (
                                            <option key={c._id} value={c._id}>{c.company_name}</option>
                                          ))}
                                        </select>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {(errors.company_name || errors.company_id) && <div className="error-message">{errors.company_name || errors.company_id}</div>}
                            </div>

                            {isNewCompany && (
                              <div className="pricing-section full-width-field">
                                <label className="section-label">Choose Strategy Plan  <span className="required">*</span></label>
                                <div className="plans-grid">
                                  {plans.map((p) => (
                                    <PricingPlanCard key={p._id} plan={p} isSelected={selectedPlanId === p._id} onSelect={setSelectedPlanId} />
                                  ))}
                                </div>
                                {errors.selectedPlanId && <div className="error-message">{errors.selectedPlanId}</div>}
                              </div>
                            )}

                            <div className="checkbox-group full-width-field">
                              <div className="checkbox-wrapper">
                                <input type="checkbox" id="terms-checkbox" name="terms" checked={form.terms} onChange={handleChange} required />
                                <label htmlFor="terms-checkbox" className="checkbox-label-text">
                                  I agree to the <a href="#terms" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}>Terms</a> and <a href="#privacy" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}>Privacy Policy</a>
                                </label> <span className="required">*</span>
                              </div>
                              {errors.terms && <div className="error-message centered-error">{errors.terms}</div>}
                            </div>

                            <div className="tab-navigation full-width-field">
                              <button type="button" onClick={handleBack} className="btn-vibrant btn-secondary-vibrant">
                                <FaAngleLeft /> Previous
                              </button>
                              <button type="submit" disabled={isSubmitting} className="btn-vibrant btn-primary-vibrant create-account-btn">
                                {isSubmitting ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Create Account</>}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </main>
        </div>
      </div>

      {/* Success/Error Modal */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Body className="text-center py-4">
          <div className={`mb-3 ${isError ? 'text-danger' : 'text-success'}`}>
            {isError ? <FaTimes size={48} /> : <FaCheck size={48} />}
          </div>
          <h5 className="mb-2">
            {isError ? t('oops') : t('success')}
          </h5>
          <p className="mb-0">{modalMessage}</p>
        </Modal.Body>
        {isError && (
          <Modal.Footer className="justify-content-center">
            <Button
              variant="primary"
              onClick={() => setShowSuccessModal(false)}
            >
              {t('close')}
            </Button>
          </Modal.Footer>
        )}
      </Modal>

      <AnimatePresence>
        {(showTermsModal || showPrivacyModal) && (
          <div className="modal-overlay">
            <motion.div className="terms-modal" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <div className="modal-header">
                <h3>{showTermsModal ? t('terms') : t('privacy_policy')}</h3>
                <button className="modal-close-button" onClick={() => { setShowTermsModal(false); setShowPrivacyModal(false); }}><FaTimes /></button>
              </div>
              <div className="modal-content">
                <p className="modal-text-break">
                  {showTermsModal ? t('terms_content') : t('privacy_content')}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Register;