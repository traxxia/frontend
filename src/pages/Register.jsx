import React, { useState } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaTimes, FaAngleLeft } from 'react-icons/fa';
import '../styles/Register.css';
import logo from '../assets/01a2750def81a5872ec67b2b5ec01ff5e9d69d0e.png';

import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

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
    if (!form.lastName.trim()) newErrors.lastName = t('last_name_required');
    if (!form.email.trim()) {
      newErrors.email = t('email_required');
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = t('email_invalid');
    }
    if (!form.password) {
      newErrors.password = t('password_required');
    } else if (form.password.length < 8) { // ENHANCED: Changed from 6 to 8 to match backend
      newErrors.password = t('password_min_length_8'); // Update translation key
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
      // SECURITY FIX: REMOVED role parameter - backend will automatically set to 'user'
      const userData = {
        name: `${form.name.trim()} ${form.lastName.trim()}`, // Added trim() for security
        email: form.email.trim().toLowerCase(), // Added trim() and toLowerCase() for consistency
        password: form.password,
        // CRITICAL FIX: Removed 'role: user' - this was the vulnerability!
        // Backend now automatically assigns 'user' role and ignores any role parameter
      };

      console.log('🔒 Sending secure registration data:', { 
        ...userData, 
        password: '[HIDDEN]' // Don't log passwords
      });

      const res = await axios.post(`${API_BASE_URL}/api/users`, userData);

      // Log successful registration for security monitoring
      console.log('✅ User registered successfully with role:', res.data.user.role);

      setModalMessage(t('registration_successful'));
      setIsError(false);
      setShowSuccessModal(true);
      
      // Reset form for security
      setForm({
        name: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: false,
      });
      
      // setTimeout(() => (window.location.href = '/login'), 2000);
    } catch (err) {
      setIsSubmitting(false);
      
      console.error('Registration error:', err.response?.data || err.message);
      
      let errorMsg = t('registration_failed');
      
      // Handle specific backend validation errors
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
        
        // Handle specific error cases
        if (errorMsg.includes('email')) {
          setErrors({ email: t('email_already_exists') });
        } else if (errorMsg.includes('password')) {
          setErrors({ password: errorMsg });
        } else if (errorMsg.includes('name')) {
          setErrors({ name: errorMsg });
        }
      }
      
      setIsError(true);
      setModalMessage(errorMsg);
      setShowSuccessModal(true);
      
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
    }
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
              <label>{t('first_name')}</label>
              <input
                type="text"
                name="name"
                placeholder={t('enter_first_name')}
                value={form.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                maxLength="50" // Added security: name length limit
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>
            
            <div className="form-group1">
              <label>{t('last_name')}</label>
              <input
                type="text"
                name="lastName"
                placeholder={t('enter_last_name')}
                value={form.lastName}
                onChange={handleChange}
                className={errors.lastName ? 'error' : ''}
                maxLength="50" // Added security: name length limit
              />
              {errors.lastName && <div className="error-message">{errors.lastName}</div>}
            </div>
            
            <div className="form-group1">
              <label>{t('email')}</label>
              <input
                type="email"
                name="email"
                placeholder={t('enter_email')}
                value={form.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                autoComplete="email" // Added for better UX
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            
            <div className="form-group1">
              <label>{t('password')}</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={t('create_password')}
                  value={form.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  minLength="8" // Added security: minimum password length
                  autoComplete="new-password" // Added for better UX
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
              {/* Added password requirements hint */}
              <small className="password-hint">
                {t('password_requirements')} {/* "Password must be at least 8 characters long" */}
              </small>
            </div>
            
            <div className="form-group1">
              <label>{t('confirm_password')}</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder={t('confirm_password')}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  autoComplete="new-password" // Added for better UX
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
              disabled={isSubmitting}
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