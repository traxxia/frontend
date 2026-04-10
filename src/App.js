import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

/* Global Styles Foundation */
import 'styles/variables.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'styles/index.css';
import 'styles/App.css';

/* Layout Component Styles */
import 'styles/menubar.css';
import 'styles/dashboard.css';
import 'styles/variables.css';

/* Page & Component Styles (Bulk Import) */
import 'styles/AdminTableStyles.css';
import 'styles/Ai.css';
import 'styles/AnalysisEmptyState.css';
import 'styles/Analytics.css';
import 'styles/ChatComponent.css';
import 'styles/CompanyManagement.css';
import 'styles/ConsensusButtonPopover.css';
import 'styles/ErrorModal.css';
import 'styles/EssentialPhase.css';
import 'styles/KickstartProjectsCard.css';
import 'styles/LanguageTranslator.css';
import 'styles/Login.css';
import 'styles/NewProjectPage.css';
import 'styles/PMFInsights.css';
import 'styles/PlanLimitModal.css';
import 'styles/PlanManagement.css';
import 'styles/PrioritiesProjects.css';
import 'styles/ProjectDetails.css';
import 'styles/ProjectReviewModal.css';
import 'styles/ProjectsSection.css';
import 'styles/RankProjectsPanel.css';
import 'styles/Register.css';
import 'styles/StrategicAnalysis.css';
import 'styles/SubscriptionTab.css';
import 'styles/UpgradeModal.css';
import 'styles/UserHistory.css';
import 'styles/academy.css';
import 'styles/accessmanagement.css';
import 'styles/analysis-components.css';
import 'styles/audittrail.css';
import 'styles/business-detail.css';
import 'styles/business.css';
import 'styles/businesspage.css';
import 'styles/executiveSummary.css';
import 'styles/goodPhase.css';
import 'styles/phaseunlocktoast.css';
import 'styles/pmf-onboarding.css';
import 'styles/question-management.css';
import 'styles/streaming.css';
import 'styles/superadmin.css';
import 'styles/usermanagement.css';

/* Core Logic */
import { initializeTranslations } from './utils/translations';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Aiassistant from './components/Aiassistant';
import ToastNotifications from './components/ToastNotifications';
import { useUIStore } from './store/uiStore';

// Pages where the AI assistant should NOT appear
const AI_EXCLUDED_EXACT_PATHS = ['/', '/login', '/register', '/dashboard', '/admin', '/super-admin'];
const AI_EXCLUDED_PREFIX_PATHS = ['/academy'];

const GlobalAiAssistant = () => {
  const location = useLocation();
  const [projectId, setProjectId] = useState(null);
  const [pageContext, setPageContext] = useState(null);
  const [isArchived, setIsArchived] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
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
    };

    window.addEventListener('ai_context_changed', handleContextChange);

    return () => {
      window.removeEventListener('ai_context_changed', handleContextChange);
    };
  }, []);

  // Reset project context and archived status on route change
  useEffect(() => {
    setProjectId(null);
    setPageContext(null);
    setIsArchived(false);
    setIsDisabled(false);
  }, [location.pathname]);

  const isExcluded =
    isArchived ||
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

const App = () => {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    // Initialize translations when app starts
    initializeTranslations();

    // Check if user has a session language preference and apply it
    const preferredLang = sessionStorage.getItem('appLanguage') || localStorage.getItem('appLanguage') || 'en';

    // Set the language if it's different from current
    if (window.currentAppLanguage !== preferredLang) {
      window.currentAppLanguage = preferredLang;
      if (window.appTranslations && window.appTranslations[preferredLang]) {
        window.getTranslation = (key) => window.appTranslations[preferredLang][key] || key;
      }
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: preferredLang } }));
    }
  }, []);

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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/businesspage" element={<BusinessSetupPage />} />
            <Route path="/academy" element={<AcademyPage />} />
            <Route path="/academy/:category" element={<AcademyPage />} />
            <Route path="/academy/:category/:article" element={<AcademyPage />} />
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
          </Routes>
        </React.Suspense>
      </div>
    </Router>
  );
};

export default App;