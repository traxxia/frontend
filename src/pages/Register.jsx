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
  
  // New state for Terms & Privacy modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
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

  // New functions for Terms & Privacy modals
  const openTermsModal = (e) => {
    e.preventDefault();
    setShowTermsModal(true);
  };

  const openPrivacyModal = (e) => {
    e.preventDefault();
    setShowPrivacyModal(true);
  };

  const closeTermsModal = () => setShowTermsModal(false);
  const closePrivacyModal = () => setShowPrivacyModal(false);

  const validate = () => {
    const newErrors = {};
    
    // Name validation
   if (!form.name.trim()) {
  newErrors.name = t('first_name_required') || 'Name is required';
} else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(form.name.trim())) {
  newErrors.name = 'Name can only contain letters and single spaces (no double spaces)';
}else if (form.name.trim().length < 2) {
  newErrors.name = 'Name must be at least 2 characters long';
}

    
    // Email validation
    if (!form.email.trim()) {
      newErrors.email = t('email_required') || 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = t('email_invalid') || 'Please enter a valid email address';
    }
    
    // Company validation
    if (!form.company_id) {
      newErrors.company_id = t('Company_selection_is_required');
    }
    
    // Password validation
    if (!form.password) {
      newErrors.password = t('password_required') || 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = t('password_min_length_8') || 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = t('confirm_password_required') || 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('passwords_do_not_match') || 'Passwords do not match';
    }
    
    // Terms and conditions validation (MANDATORY)
    if (!form.terms) {
      newErrors.terms = t('You_must_agree_to_the_Terms_&_Conditions_and_Privacy_Policy_to_proceed');
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
    
    // Clear any existing errors
    setErrors({});
    
    // Validate all required fields before proceeding
    if (!validate()) {
      // If validation fails, don't proceed with API call
      console.log('Form validation failed');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Double-check all mandatory fields are filled before API call
      if (!form.name.trim() || !form.email.trim() || !form.password || 
          !form.confirmPassword || !form.company_id || !form.terms) {
        throw new Error('All mandatory fields must be completed including terms acceptance');
      }

      // Prepare user data for API call
      const userData = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        company_id: form.company_id,
        terms_accepted: form.terms, // Required by backend API
        job_title: form.job_title.trim() || undefined // Optional field
      };

      console.log('Submitting registration data:', { 
        ...userData, 
        password: '[HIDDEN]',
        terms_accepted: userData.terms_accepted 
      });

      // Call registration API
      const response = await axios.post(`${API_BASE_URL}/api/register`, userData);

      // Handle successful registration
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

      // Handle API errors
      let errorMsg = 'Registration failed. Please try again.';

      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;

        // Handle specific error cases and set field-specific errors
        if (errorMsg.includes('Email already exists') || errorMsg.includes('email already registered')) {
          setErrors({ email: 'This email address is already registered. Please use a different email or try logging in.' });
          return; // Don't show general modal for field-specific errors
        } else if (errorMsg.includes('Invalid email')) {
          setErrors({ email: 'Please enter a valid email address' });
          return;
        } else if (errorMsg.includes('password') && errorMsg.includes('requirements')) {
          setErrors({ password: 'Password must meet the minimum requirements' });
          return;
        } else if (errorMsg.includes('name') && errorMsg.includes('required')) {
          setErrors({ name: 'Name is required and must be valid' });
          return;
        } else if (errorMsg.includes('company') || errorMsg.includes('Invalid company')) {
          setErrors({ company_id: 'Please select a valid company from the list' });
          return;
        } else if (errorMsg.includes('All fields required')) {
          // Handle validation errors from backend
          const fieldErrors = {};
          if (!form.name.trim()) fieldErrors.name = 'Name is required';
          if (!form.email.trim()) fieldErrors.email = 'Email is required';
          if (!form.password) fieldErrors.password = 'Password is required';
          if (!form.company_id) fieldErrors.company_id = t('Company_selection_is_required');
          if (!form.terms) fieldErrors.terms = 'You must agree to the terms and conditions';
          
          setErrors(fieldErrors);
          return;
        } else if (errorMsg.includes('terms') || errorMsg.includes('terms acceptance')) {
          setErrors({ terms: 'You must accept the Terms & Conditions and Privacy Policy to register' });
          return;
        }
      } else if (err.message === 'All mandatory fields must be completed including terms acceptance') {
        errorMsg = 'Please fill in all mandatory fields and accept the terms and conditions before submitting';
      }

      // Show general error modal for non-field-specific errors
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
              <label>{t('user_name')} *</label>
              <input
                type="text"
                name="name"
                placeholder={t('enter_user_name')}
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
              <label>{t('company')} *</label>
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
                  <option value="">{t('select_a_company')}</option>
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
              <label>{t('job_title')} ({t('optional')})</label>
              <input
                type="text"
                name="job_title"
                placeholder={t('enter_job_title')}
                value={form.job_title}
                onChange={handleChange}
                maxLength="100"
              /> 
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
                {t('password_must_be_at_least_8_characters_contain_uppercase_lowercase_and_numbers')}
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
                  <span className="required-indicator">*</span> {t('agree_terms')} <a href="#terms" onClick={openTermsModal}>{t('terms_conditions') || 'Terms & Conditions'}</a> {t('and') || 'and'} <a href="#privacy" onClick={openPrivacyModal}>{t('privacy_policy') || 'Privacy Policy'}</a>
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

        {/* Success/Error Modal */}
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

        {/* Terms & Conditions Modal */}
        {showTermsModal && (
          <div className="modal-overlay">
            <div className="terms-modal">
              <div className="modal-header">
                <h3>Terms & Conditions</h3>
                <button className="modal-close-button" onClick={closeTermsModal} aria-label="Close">
                  <FaTimes />
                </button>
              </div>
              <div className="modal-content">
                <div className="terms-content">
                  <h4>1. Acceptance of Terms</h4>
                  <p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p>
                  
                  <h4>2. Use License</h4>
                  <p>Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                  <ul>
                    <li>modify or copy the materials;</li>
                    <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial);</li>
                    <li>attempt to decompile or reverse engineer any software contained on our website;</li>
                    <li>remove any copyright or other proprietary notations from the materials.</li>
                  </ul>
                  
                  <h4>3. Disclaimer</h4>
                  <p>The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                  
                  <h4>4. Limitations</h4>
                  <p>In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.</p>
                  
                  <h4>5. Account Terms</h4>
                  <p>Users are responsible for maintaining the confidentiality of their account and password. You agree to accept responsibility for all activities that occur under your account or password.</p>
                  
                  <h4>6. Privacy Policy</h4>
                  <p>Your privacy is important to us. Please refer to our Privacy Policy, which also governs your use of the service, to understand our practices.</p>
                  
                  <h4>7. Prohibited Uses</h4>
                  <p>You may not use our service:</p>
                  <ul>
                    <li>for any unlawful purpose or to solicit others to unlawful acts;</li>
                    <li>to violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances;</li>
                    <li>to infringe upon or violate our intellectual property rights or the intellectual property rights of others;</li>
                    <li>to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate;</li>
                    <li>to submit false or misleading information.</li>
                  </ul>
                  
                  <h4>8. Termination</h4>
                  <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
                  
                  <h4>9. Governing Law</h4>
                  <p>These Terms shall be interpreted and governed by the laws of the State, without regard to its conflict of law provisions.</p>
                  
                  <h4>10. Changes to Terms</h4>
                  <p>We reserve the right to modify these terms at any time. We will always post the most current version on our website. By continuing to use the service after those revisions become effective, you agree to be bound by the revised terms.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Policy Modal */}
        {showPrivacyModal && (
          <div className="modal-overlay">
            <div className="terms-modal">
              <div className="modal-header">
                <h3>Privacy Policy</h3>
                <button className="modal-close-button" onClick={closePrivacyModal} aria-label="Close">
                  <FaTimes />
                </button>
              </div>
              <div className="modal-content">
                <div className="terms-content">
                  <h4>Information We Collect</h4>
                  <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p>
                  
                  <h4>Personal Information</h4>
                  <p>The types of personal information we may collect include:</p>
                  <ul>
                    <li>Name and contact information</li>
                    <li>Account credentials</li>
                    <li>Payment information</li>
                    <li>Communication preferences</li>
                    <li>Any other information you choose to provide</li>
                  </ul>
                  
                  <h4>How We Use Your Information</h4>
                  <p>We may use information about you for various purposes, including to:</p>
                  <ul>
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process transactions and send related information</li>
                    <li>Send technical notices, updates, security alerts, and support messages</li>
                    <li>Respond to your comments, questions, and provide customer service</li>
                    <li>Communicate with you about products, services, offers, and events</li>
                  </ul>
                  
                  <h4>Information Sharing</h4>
                  <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.</p>
                  
                  <h4>Data Security</h4>
                  <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                  
                  <h4>Data Retention</h4>
                  <p>We retain personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law.</p>
                  
                  <h4>Your Rights</h4>
                  <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
                  <ul>
                    <li>The right to access your personal information</li>
                    <li>The right to update or correct your personal information</li>
                    <li>The right to delete your personal information</li>
                    <li>The right to restrict or object to our use of your personal information</li>
                    <li>The right to data portability</li>
                  </ul>
                  
                  <h4>Cookies and Tracking</h4>
                  <p>We use cookies and similar tracking technologies to collect information about your browsing activities and to provide personalized content and advertising.</p>
                  
                  <h4>Third-Party Services</h4>
                  <p>Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties.</p>
                  
                  <h4>Children's Privacy</h4>
                  <p>Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.</p>
                  
                  <h4>Changes to Privacy Policy</h4>
                  <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.</p>
                  
                  <h4>Contact Us</h4>
                  <p>If you have any questions about this privacy policy, please contact us at privacy@company.com</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;