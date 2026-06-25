import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";
import logo from '../assets/traxxia-logo.png';
import { Sun, Moon, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useUIStore } from "../store/uiStore";
import { useTranslation } from "../hooks/useTranslation";
import PasswordStrengthTooltip from "../components/PasswordStrengthTooltip";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Status Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusConfig, setStatusConfig] = useState({ title: '', message: '', type: 'success' });

  const otpInputs = useRef([]);
  const navigate = useNavigate();
  const theme = useUIStore(state => state.theme);
  const toggleTheme = useUIStore(state => state.toggleTheme);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const { t } = useTranslation();

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otpArray];
    newOtp[index] = value.slice(-1);
    setOtpArray(newOtp);

    // Focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otpArray];
    pasteData.forEach((char, i) => {
      if (i < 6 && !isNaN(char)) newOtp[i] = char;
    });
    setOtpArray(newOtp);
    // Focus last box or the next empty one
    const nextIndex = pasteData.length < 6 ? pasteData.length : 5;
    otpInputs.current[nextIndex].focus();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/forgot-password`, { email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || t("failed_to_send_otp"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otpArray.join('');
    if (otpString.length < 6) {
      setError(t("enter_full_otp"));
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await axios.post(`${API_BASE_URL}/api/verify-otp`, { email, otp: otpString });
      setStatusConfig({
        title: t("otp_verified"),
        message: t("otp_verified_msg"),
        type: 'success'
      });
      setShowStatusModal(true);
      setError("");
    } catch (err) {
      const errMsg = err.response?.data?.error || t("invalid_otp");
      setError(errMsg);
      setStatusConfig({
        title: t("verification_failed"),
        message: errMsg,
        type: 'error'
      });
      setShowStatusModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowStatusModal(false);
    if (statusConfig.type === 'success') {
      if (step === 2) {
        setStep(3);
      } else if (step === 3) {
        navigate("/login");
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password) {
      setError(t('password_required') || 'Password is required');
      return;
    }
    if (
      password.length < 8 ||
      !/(?=.*[a-z])/.test(password) ||
      !/(?=.*[A-Z])/.test(password) ||
      !/(?=.*\d)/.test(password) ||
      !/(?=.*[^A-Za-z0-9])/.test(password)
    ) {
      setError(t("password_rule_missing"));
      return;
    }
    if (!confirmPassword) {
      setError(t('confirm_password_required') || 'Please confirm your password');
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passwords_do_not_match') || 'Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const otpString = otpArray.join('');
      const res = await axios.post(`${API_BASE_URL}/api/reset-password`, { email, otp: otpString, password });
      setStatusConfig({
        title: t("success"),
        message: res.data.message || t("password_reset_success"),
        type: 'success'
      });
      setShowStatusModal(true);
    } catch (err) {
      const errMsg = err.response?.data?.error || t("password_reset_failed");
      setError(errMsg);
      setStatusConfig({
        title: t("reset_failed"),
        message: errMsg,
        type: 'error'
      });
      setShowStatusModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container notranslate">
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
        <div className="theme-icon-toggle">
          <button onClick={toggleTheme} className="theme-toggle-button" disabled={isLoading}>
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <div className="login-box">
          <Link to="/login" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> {t("back_to_login")}
          </Link>

          <h2>{step === 1 ? (t("forgot_password_title")) : step === 2 ? t("verify_otp") : t("reset_password")}</h2>
          <p className="login-subtitle" style={{ marginBottom: step > 1 ? '12px' : '20px' }}>
            {step === 1 ? t("enter_email_for_otp") :
              step === 2 ? t("enter_otp_below") :
                t("enter_new_password_below")}
          </p>

          {step > 1 && (
            <div style={{ display: 'flex', width: '100%' }}>
              <div className="active-email-badge">
                {email}
              </div>
            </div>
          )}

          {message && step !== 3 && (
            <div className={`success-message ${step === 2 ? 'success-message-compact' : ''}`} style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #10b981' }}>
              {message}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} noValidate>
              <div className="form-group">
                <div className="input-container">
                  <input
                    type="email"
                    className={error ? "error" : ""}
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder={t("email_address")}
                    disabled={isLoading}
                  />
                </div>
                {error && <span className="error-message">{error}</span>}
              </div>
              <button type="submit" className={`login-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
                {isLoading ? t("sending") : t("send_otp")}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} noValidate>
              <div className="form-group">
                <div className="otp-container">
                  {otpArray.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      ref={el => otpInputs.current[index] = el}
                      className={`otp-box ${error ? "error" : ""}`}
                      value={digit}
                      onChange={e => handleOtpChange(index, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      maxLength={1}
                      disabled={isLoading}
                    />
                  ))}
                </div>
                {error && <span className="error-message" style={{ textAlign: 'center' }}>{error}</span>}
              </div>
              <button type="submit" className={`login-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
                {isLoading ? t("verifying") : t("verify_otp")}
              </button>
              <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
                {t("did_not_receive_code")} <button type="button" onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0 }}>{t("resend_otp")}</button>
              </p>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} noValidate>
              <div className="form-group">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  {t("new_password")}
                </label>
                <div className="input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={error && !confirmPassword ? "error" : ""}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    placeholder={t("new_password")}
                    disabled={isLoading}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <PasswordStrengthTooltip password={password} isFocused={isPasswordFocused} position="bottom" />
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  {t("confirm_new_password")}
                </label>
                <div className="input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={error && confirmPassword ? "error" : ""}
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder={t("confirm_new_password")}
                    disabled={isLoading}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && <span className="error-message">{error}</span>}
              </div>
              <button type="submit" className={`login-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
                {isLoading ? t("resetting") : t("reset_password")}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p>{t("remember_password")} <Link to="/login">{t("login")}</Link></p>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="status-modal-overlay">
          <div className="status-modal-content">
            <div className={`status-modal-icon ${statusConfig.type}`}>
              {statusConfig.type === 'success' ? <CheckCircle size={40} /> : <XCircle size={40} />}
            </div>
            <h3 className="status-modal-title">{statusConfig.title}</h3>
            <p className="status-modal-message">{statusConfig.message}</p>
            <button
              className={`status-modal-button ${statusConfig.type}`}
              onClick={handleModalClose}
            >
              {statusConfig.type === 'success' ? t("continue") : t("try_again")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
