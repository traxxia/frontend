import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { initializeTranslations } from './utils/translations';

import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import SuperAdminPage from './pages/SuperAdminPage'; // NEW: Import Super Admin Panel
import ProtectedRoute from './components/ProtectedRoute';

import BusinessSetupPage from './pages/BusinessSetupPage';
import AcademyPage from './pages/AcademyPage'; // Traxxia Academy documentation


const App = () => {
  const useNewUI = process.env.REACT_APP_USE_NEW_UI === 'true';

  useEffect(() => {
    // Initialize translations when app starts
    initializeTranslations();

    // Check if user has a session language preference and apply it
    const sessionLang = sessionStorage.getItem('appLanguage');
    const localLang = localStorage.getItem('appLanguage');

    // Priority: session storage > local storage > default 'en'
    const preferredLang = sessionLang || localLang || 'en';

    // Set the language if it's different from current
    if (window.currentAppLanguage !== preferredLang) {
      window.currentAppLanguage = preferredLang;

      // Update the global translation function
      if (window.appTranslations) {
        window.getTranslation = function (key) {
          const result = window.appTranslations[window.currentAppLanguage][key] || key;
          return typeof result === 'string' ? result : String(key);
        };
      }

      // Dispatch language change event for components
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: preferredLang }
      }));
    }
  }, []);

  return (
    <Router>
      <div className={`App ${useNewUI ? 'new-ui' : ''}`}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/businesspage" element={<BusinessSetupPage />} />

          {/* Traxxia Academy Routes */}
          <Route path="/academy" element={<AcademyPage />} />
          <Route path="/academy/:category" element={<AcademyPage />} />
          <Route path="/academy/:category/:article" element={<AcademyPage />} />

          {/* Admin Route - renders unified SuperAdminPage */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <SuperAdminPage />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Route - accessible by both admins and super admins */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <SuperAdminPage />
              </ProtectedRoute>
            }
          />

        </Routes>
      </div>
    </Router>
  );
};

export default App;