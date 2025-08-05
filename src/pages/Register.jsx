import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaTimes, FaAngleLeft, FaSpinner } from 'react-icons/fa';
import '../styles/Register.css';
import logo from '../assets/01a2750def81a5872ec67b2b5ec01ff5e9d69d0e.png';

import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company_id: '',
    job_title: '',
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companiesError, setCompaniesError] = useState('');
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchCompanies();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    setCompaniesError('');
    
    try {
      // Updated to match backend API endpoint - no authentication required
      const response = await axios.get(`${API_BASE_URL}/api/companies`);
      
      // Updated to match backend response structure
      if (response.data.companies) {
        setCompanies(response.data.companies);
        console.log(`✅ Loaded ${response.data.companies.length} companies`);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Error fetching companies:', error);
      
      // Updated error handling
      const errorMessage = error.response?.data?.error || 'Unable to load companies. Please try again later.';
      setCompaniesError(errorMessage);
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = t('first_name_required');
    if (!form.email.trim()) {
      newErrors.email = t('email_required');
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = t('email_invalid');
    }
    if (!form.company_id) {
      newErrors.company_id = 'Company selection is required';
    }
    if (!form.password) {
      newErrors.password = t('password_required');
    } else if (form.password.length < 8) {
      newErrors.password = t('password_min_length_8');
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = t('confirm_password_required');
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('passwords_do_not_match');
    }
    if (!form.terms) {
      newErrors.terms = t('agree_terms');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setModalMessage('');
    setIsError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Updated to match backend API expectations
      const userData = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        company_id: form.company_id,
        // Note: job_title is not handled in the current backend API
        // You may need to add it to the backend if required
      };

      // Updated API call to match backend endpoint
      const response = await axios.post(`${API_BASE_URL}/api/register`, userData);

      // Updated success handling to match backend response
      setModalMessage(response.data.message || 'Registration successful! Redirecting to login page...');
      setIsError(false);
      setShowSuccessModal(true);

      // Reset form for security
      setForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        company_id: '',
        job_title: '',
        terms: false,
      });

      // Redirect to login page after showing success message
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/login');
      }, 2000);

    } catch (err) {
      setIsSubmitting(false);

      console.error('Registration error:', err.response?.data || err.message);

      // Updated error handling to match backend error response structure
      let errorMsg = 'Registration failed. Please try again.';

      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;

        // Handle specific error cases based on backend error messages
        if (errorMsg.includes('Email already exists')) {
          setErrors({ email: 'This email is already registered' });
        } else if (errorMsg.includes('password')) {
          setErrors({ password: errorMsg });
        } else if (errorMsg.includes('name')) {
          setErrors({ name: errorMsg });
        } else if (errorMsg.includes('company') || errorMsg.includes('Invalid company')) {
          setErrors({ company_id: 'Please select a valid company' });
        } else if (errorMsg.includes('All fields required')) {
          // Handle validation errors from backend
          setErrors({ 
            name: !form.name.trim() ? 'Name is required' : '',
            email: !form.email.trim() ? 'Email is required' : '',
            password: !form.password ? 'Password is required' : '',
            company_id: !form.company_id ? 'Company selection is required' : ''
          });
        }
      }

      setIsError(true);
      setModalMessage(errorMsg);
      setShowSuccessModal(true);
    }
  };

  const retryFetchCompanies = () => {
    fetchCompanies();
  };

  return (
    <div className="register-container">
      <div className="REGISTER-left-section">
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
      <div className="register-right">
        <div className="register-wrapper">
          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-title">
              <FaAngleLeft size={34} onClick={() => navigate('/')} className="back-icon" />
              <h4>{t('sign_up')}</h4>
            </div>
            <p className="register-subtitle">{t('create_account_subtitle')}</p>

            <div className="form-group1">
              <label>User Name *</label>
              <input
                type="text"
                name="name"
                placeholder="Enter User name"
                value={form.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                maxLength="50"
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>

            <div className="form-group1">
              <label>{t('email')} *</label>
              <input
                type="email"
                name="email"
                placeholder={t('enter_email')}
                value={form.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                autoComplete="email"
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            <div className="form-group1">
              <label>Company *</label>
              {loadingCompanies ? (
                <div className="loading-select">
                  <FaSpinner className="spinner" />
                  Loading companies...
                </div>
              ) : companiesError ? (
                <div className="company-error">
                  <div className="error-message">{companiesError}</div>
                  <button 
                    type="button" 
                    onClick={retryFetchCompanies}
                    className="retry-button"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <select
                  name="company_id"
                  value={form.company_id}
                  onChange={handleChange}
                  className={errors.company_id ? 'error' : ''}
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.company_name}
                      {company.industry && ` - ${company.industry}`}
                    </option>
                  ))}
                </select>
              )}
              {errors.company_id && <div className="error-message">{errors.company_id}</div>}
            </div>

            <div className="form-group1">
              <label>Job Title (Optional)</label>
              <input
                type="text"
                name="job_title"
                placeholder="Enter job title"
                value={form.job_title}
                onChange={handleChange}
                maxLength="100"
              />
              <small className="field-note">Note: Job title will be saved for future use</small>
            </div>

            <div className="form-group1">
              <label>{t('password')} *</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={t('create_password')}
                  value={form.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  minLength="8"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? t('hide_password') : t('show_password')}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <div className="error-message">{errors.password}</div>}
              <small className="password-hint">
                {t('password_requirements')}
              </small>
            </div>

            <div className="form-group1">
              <label>{t('confirm_password')} *</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder={t('confirm_password')}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? t('hide_password') : t('show_password')}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>

            <div className="checkbox-group">
              <label className="checkbox-container">
                <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} />
                <span className="checkbox-label">
                  {t('agree_terms')} <a href="#terms">{t('terms_conditions')}</a> {t('and')} <a href="#privacy">{t('privacy_policy')}</a>
                </span>
              </label>
              {errors.terms && <div className="error-message">{errors.terms}</div>}
            </div>

            <button
              type="submit"
              className={`submit-button ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting || loadingCompanies}
            >
              {isSubmitting ? t('creating_account') : t('create_account')}
            </button>
          </form>
        </div>

        {showSuccessModal && (
          <div className="modal-overlay">
            <div className={`success-modal ${isError ? 'error-modal' : ''}`}>
              <button className="modal-close-button" onClick={closeModal} aria-label={t('close')}>
                <FaTimes />
              </button>
              <div className={`success-icon ${isError ? 'error-icon' : ''}`}>{isError ? '✗' : '✓'}</div>
              <h3>{isError ? t('registration_failed_msg') : t('account_created')}</h3>
              <p>{modalMessage}</p>
              {!isError && (
                <div className="success-details">
                  <p className="redirect-text">{t('redirecting_login')}</p>
                  <div className="loading-spinner"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;