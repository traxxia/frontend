import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

import './styles/styles-index';

import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Aiassistant from './components/Aiassistant';
import ToastNotifications from './components/ToastNotifications';
import { useUIStore } from './store/uiStore';
import { useLanguageStore } from './store/languageStore';
const AI_EXCLUDED_EXACT_PATHS = ['/', '/login', '/register', '/dashboard', '/admin', '/super-admin', '/super-admin/observatory', '/forgot-password', '/reset-password'];
const AI_EXCLUDED_PREFIX_PATHS = ['/academy', '/onboarding'];

const GlobalAiAssistant = () => {
  const location = useLocation();
  const [projectId, setProjectId] = useState(null);
  const [pageContext, setPageContext] = useState(null);
  const [isArchived, setIsArchived] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  useEffect(() => {
    const handleContextChange = (event) => {
      if (event.detail && event.detail.projectId !== undefined) {
        setProjectId(event.detail.projectId);
      }
      if (event.detail && event.detail.pageContext !== undefined) {
        setPageContext(event.detail.pageContext);
      }
      if (event.detail && event.detail.isArchived !== undefined) {
        setIsArchived(event.detail.isArchived);
      }
      if (event.detail && event.detail.isDisabled !== undefined) {
        setIsDisabled(event.detail.isDisabled);
      }
      if (event.detail && event.detail.isHidden !== undefined) {
        setIsHidden(event.detail.isHidden);
      }
    };

    window.addEventListener('ai_context_changed', handleContextChange);

    return () => {
      window.removeEventListener('ai_context_changed', handleContextChange);
    };
  }, []);
  useEffect(() => {
    setProjectId(null);
    setPageContext(null);
    setIsArchived(false);
    setIsDisabled(false);
    setIsHidden(false);
  }, [location.pathname]);

  const isExcluded =
    isArchived || isHidden ||
    AI_EXCLUDED_EXACT_PATHS.includes(location.pathname) ||
    AI_EXCLUDED_PREFIX_PATHS.some((prefix) => location.pathname.startsWith(prefix));

  if (isExcluded) return null;

  return <Aiassistant projectId={projectId} pageContext={pageContext} isDisabled={isDisabled} />;
};

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const BusinessSetupPage = React.lazy(() => import('./pages/BusinessSetupPage'));
const SuperAdminPage = React.lazy(() => import('./pages/SuperAdminPage'));
const Register = React.lazy(() => import('./pages/Register'));
const AcademyPage = React.lazy(() => import('./pages/AcademyPage'));
const AllDecisionLogs = React.lazy(() => import('./components/AllDecisionLogs'));
const ObservatoryPage = React.lazy(() => import('./pages/ObservatoryPage'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const OnboardingFlowPage = React.lazy(() => import('./pages/OnboardingFlowPage'));
const AdvancedInsightsPage = React.lazy(() => import('./pages/AdvancedInsightsPage'));
const UpgradePlanPage = React.lazy(() => import('./pages/UpgradePlanPage'));
const ExecutionPage = React.lazy(() => import('./pages/ExecutionPage'));
const HistoryPage = React.lazy(() => import('./pages/HistoryPage'));

const App = () => {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const { setLanguage, currentLanguage } = useLanguageStore();

  useEffect(() => {
    setLanguage(currentLanguage);
  }, [setLanguage, currentLanguage]);

  return (
    <Router>
      <div className="App">
        <ToastNotifications />
        <GlobalAiAssistant />
        <React.Suspense fallback={<div className="p-5 text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <React.Suspense fallback={null}>
                    <Dashboard />
                  </React.Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/businesspage"
              element={
                <ProtectedRoute>
                  <BusinessSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/:businessId"
              element={
                <ProtectedRoute>
                  <OnboardingFlowPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/:businessId/advanced-insights"
              element={
                <ProtectedRoute>
                  <React.Suspense fallback={<div className="p-5 text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
                    <AdvancedInsightsPage />
                  </React.Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upgrade"
              element={
                <ProtectedRoute>
                  <React.Suspense fallback={<div className="p-5 text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
                    <UpgradePlanPage />
                  </React.Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/:businessId/execution"
              element={
                <ProtectedRoute>
                  <React.Suspense fallback={<div className="p-5 text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
                    <ExecutionPage />
                  </React.Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/:businessId/history"
              element={
                <ProtectedRoute>
                  <React.Suspense fallback={<div className="p-5 text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
                    <HistoryPage />
                  </React.Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/academy"
              element={
                <AcademyPage />
              }
            />
            <Route
              path="/academy/:category"
              element={
                <AcademyPage />
              }
            />
            <Route
              path="/academy/:category/:article"
              element={
                <AcademyPage />
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <SuperAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <SuperAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/decision-logs"
              element={
                <ProtectedRoute>
                  <React.Suspense fallback={null}>
                    <AllDecisionLogs />
                  </React.Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/observatory"
              element={
                <ProtectedRoute observatoryOnly={true}>
                  <React.Suspense fallback={null}>
                    <ObservatoryPage />
                  </React.Suspense>
                </ProtectedRoute>
              }
            />
          </Routes>
        </React.Suspense>
      </div>
    </Router>
  );
};

export default App;
