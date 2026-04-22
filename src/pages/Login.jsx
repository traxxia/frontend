import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../styles/Login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/01a2750def81a5872ec67b2b5ec01ff5e9d69d0e.png";
import LanguageTranslator from "../components/LanguageTranslator";
import { useTranslation } from "../hooks/useTranslation";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import ErrorModal from "../components/ErrorModal";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const navigate = useNavigate();
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const { t } = useTranslation();

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = t("login_email_required");
    }
    if (!password.trim()) {
      newErrors.password = t("login_password_required");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/login`, {
        email,
        password,
      });

      // Use Zustand auth store instead of sessionStorage
      const setAuth = useAuthStore.getState().setAuth;
      setAuth(res.data);

      const currentLang = window.getCurrentLanguage
        ? window.getCurrentLanguage()
        : "en";

      if (res.data.user.role === "super_admin") {
        navigate("/super-admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      const errorData = err.response?.data;
      if (errorData?.error === 'incorrect_email') {
        setErrors({ email: t("incorrect_email") !== "incorrect_email" ? t("incorrect_email") : errorData.message || "Incorrect email address" });
      } else if (errorData?.error === 'incorrect_password') {
        setErrors({ password: t("incorrect_password") !== "incorrect_password" ? t("incorrect_password") : errorData.message || "Incorrect password" });
      } else {
        const errorMessage = errorData?.error || t("login_failed");
        setModalMessage(errorMessage);
        setShowErrorModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <LanguageTranslator disabled={isLoading} />

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
            <FontAwesomeIcon
              icon={theme === "dark" ? faSun : faMoon}
              style={{ fontSize: "20px" }}
            />
          </button>
        </div>
        <div className="login-box">
          <h2>{t("welcome")}</h2>
          <p className="login-subtitle">{t("login_subtitle")}</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <div className="input-container">
                <input
                  type="email"
                  className={errors.email ? "error" : ""}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder={t("email_address")}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <div className="input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  className={errors.password ? "error" : ""}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder={t("password")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                  aria-label={
                    showPassword ? t("hide_password") : t("show_password")
                  }
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEye : faEyeSlash}
                    className="eye-icon"
                    style={{ color: "#8F9098", fontSize: "20px" }}
                  />
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className={`login-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? t("signing_in") : t("login")}
            </button>
          </form>

          <div className="login-footer">
            <p>
              {t("not_member")} <a href="/register" className={isLoading ? "disabled-link" : ""} onClick={(e) => isLoading && e.preventDefault()}>{t("register_now")}</a>
            </p>
            <hr className="divider" />
            <p>
              <Link to="/academy" className={isLoading ? "disabled-link" : ""} onClick={(e) => isLoading && e.preventDefault()}>📚 {t("explore_traxxia_academy")}</Link>
            </p>
          </div>
        </div>
      </div>

      <ErrorModal
        show={showErrorModal}
        handleClose={() => setShowErrorModal(false)}
        title={t("login_failed_title")}
        message={modalMessage}
        buttonText={t("try_again")}
      />
    </div>
  );
};

export default Login;
