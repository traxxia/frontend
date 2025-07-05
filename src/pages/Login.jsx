// Updated Login.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import logo from '../assets/01a2750def81a5872ec67b2b5ec01ff5e9d69d0e.png';
import facebook from '../assets/facebook (1).png';
import social from '../assets/social.png';
import apple from '../assets/apple.png';
import LanguageTranslator from '../components/LanguageTranslator';
import { useTranslation } from '../hooks/useTranslation';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  
  // Use the translation hook
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await axios.post(`${API_BASE_URL}/api/login`, {
        email,
        password,
      });
      
      // Store user session data
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('userId', res.data.user.id);
      sessionStorage.setItem('userName', res.data.user.name);
      sessionStorage.setItem('userEmail', res.data.user.email);
      sessionStorage.setItem('userRole', res.data.user.role);
      sessionStorage.setItem('latestVersion', res.data.latest_version || '');
      sessionStorage.setItem('isAdmin', res.data.user.role === 'admin' ? 'true' : 'false');
      
      // IMPORTANT: Store the current language in session storage for the application
      const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'en';
      sessionStorage.setItem('appLanguage', currentLang);
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.message || t('login_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      {/* Language Translator - Only on login page */}
      <LanguageTranslator isLoginPage={true} />
      
      <div className="login-left-section">
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
      
      <div className="login-right-section">
        <div className="login-box">
          <h2>{t('welcome')}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-container">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('email_address')}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <div className="input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('password')}
                  required
                />
                <button 
                  type="button"
                  className="toggle-password"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? t('hide_password') : t('show_password')}
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEye : faEyeSlash }
                    className="eye-icon"
                    style={{ color: '#8F9098', fontSize: '20px' }} 
                  />
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? t('signing_in') : t('login')}
            </button>
          </form>
          
          <div className="login-footer">
            <p>{t('not_member')} <a href="/register">{t('register_now')}</a></p>
          </div>
          <hr className='divider' />
          <p>{t('continue_with')}</p>
          <div className='social-login'>
            <a href="https://google.com" target="_blank" rel="noopener noreferrer">
              <img src={social} alt="Google" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <img src={apple} alt="Apple" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <img src={facebook} alt="Facebook" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;