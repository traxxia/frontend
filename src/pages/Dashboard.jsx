import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  Row,
  Col,
  Card,
  Spinner,
} from "react-bootstrap";
import {
  ArrowRight,
} from "lucide-react";

// Components
import MenuBar from "../components/MenuBar"; 

// Styles
import "../styles/dashboard.css";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useTranslation } from '../hooks/useTranslation';

// Constants
const STEPS = {
  WELCOME: 1,
  INSIGHTS: 2,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    const isFirstVisit = !onboardingCompleted;
    
    if (isFirstVisit) {
      // Show onboarding after a brief delay for better UX
      setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
    }
    setHasSeenOnboarding(!!onboardingCompleted);
  }, []);

  // Handle onboarding completion
  const handleOnboardingClose = () => {
    setShowOnboarding(false);
  };

  const handleStartDemo = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setHasSeenOnboarding(true);
    setShowOnboarding(false);
    // Optionally navigate to business creation or show success message
    // navigate('/businesspage');
  };

  const handleShowOnboardingAgain = () => {
    setShowOnboarding(true);
  };

  // Hardcoded insights content translated as a single string
  const hardcodedInsights = `
${t('business_analysis_results')}:

1. ${t('market_position')}:
${t('market_position_details')}

2. ${t('strengths')}:
- ${t('strength_technical_foundation')}
- ${t('strength_experienced_team')}
- ${t('strength_innovative_products')}
- ${t('strength_established_customer_base')}

3. ${t('areas_for_improvement')}:
- ${t('improvement_marketing_reach')}
- ${t('improvement_customer_acquisition')}
- ${t('improvement_product_diversification')}

4. ${t('recommendations')}:
- ${t('recommendation_digital_marketing')}
- ${t('recommendation_customer_retention')}
- ${t('recommendation_partnerships')}
- ${t('recommendation_complementary_products')}

5. ${t('growth_projections')}:
${t('growth_projection_details')}
  `;

  const businesses = useMemo(() => {
    return [
      {
        name: "InsightForge Inc",
        progress: 60,
        answeredQuestions: 3,
        totalQuestions: 5,
        remaining: 2,
        total: 5,
      },
    ];
  }, []);

  const BusinessList = ({ businesses, viewType }) => (
    <div className={`business-list ${viewType}`}>
      {businesses.length === 0 && (
        <div className="text-center text-muted py-5">
          {t('no_businesses_found')}
          
        </div>
      )}
      {businesses.length > 0 && businesses.map((business, index) => (
        <div
          key={index}
          className="business-item d-flex align-items-center p-3 border-bottom"
          onClick={() => handleBusinessClick(business)}
          style={{ cursor: "pointer" }}
        >
          <div style={{ width: 60, height: 60 }} className="progress-circle me-3">
            <CircularProgressbar
              value={business.progress}
              text={`${business.progress}%`}
              styles={buildStyles({
                pathColor: "#28a745",
                textColor: "#000",
                trailColor: "#ffffff",
                textSize: "30px",
              })}
            />
          </div>
          <div className="flex-grow-1">
            <h6 className="mb-1">{business.name}</h6>
            <small className="text-muted">
              {t('questions_remaining')}: {business.remaining} {t('of')} {business.total}
            </small>
          </div>
          <ArrowRight size={16} className="text-muted" />
        </div>
      ))}
    </div>
  );

  // Event Handlers
  const handleBusinessClick = (business) => {
    navigate('/businesspage');
  };

  const goToInsights = () => {
    setCurrentStep(STEPS.INSIGHTS);
  };

  const goBackToWelcome = () => {
    setCurrentStep(STEPS.WELCOME);
    setAnalysisResult("");
  };

  const generateInsights = () => {
    setIsLoading(true);
    setTimeout(() => {
      setAnalysisResult(hardcodedInsights);
      setIsLoading(false);
    }, 2000);
  };

  const clearResults = () => {
    setAnalysisResult("");
  };

  const handleCreateBusiness = () => {
    navigate('/businesspage');
  };

  // Renderers
  const renderWelcomeLayout = () => {
    return (
      <Row className="h-100 justify-content-center">
        <Col xs={12} className="p-0">
          {/* Mobile View */}
          <Card className="mobile-view-card d-md-none">
            <Card.Body className="p-0">
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">{t('welcome')}</h5>
                  {hasSeenOnboarding && (
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={handleShowOnboardingAgain}
                      style={{ fontSize: '0.8rem' }}
                    >
                      📖 Tour
                    </Button>
                  )}
                </div>
                <p className="text-muted small mb-4">{t('welcome_message')}</p>
              </div>
              <div className="px-4 mb-4">
                <h6 className="mb-3">{t('my_businesses')}</h6>
                <BusinessList businesses={businesses} viewType="mobile" />
              </div>
              <div className="px-4 pb-4">
                <Button 
                  variant="primary" 
                  className="w-100 create-business-btn" 
                  onClick={handleCreateBusiness}
                >
                  {t('create_business')}
                </Button>
                 
              </div>
            </Card.Body>
          </Card>

          {/* Desktop View */}
          <Card className="desktop-view-card d-none d-md-block">
            <Card.Body className="p-0 h-100">
              <Row className="h-100 g-0">
                <Col md={6} className="welcome-section">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <div>
                        <h5 className="mb-2">{t('welcome')}</h5>
                         
                      </div>
                    </div>
                    <p className="text-muted mb-4">{t('welcome_message')}</p>
                    <Button 
                      variant="primary" 
                      className="create-business-btn" 
                      onClick={handleCreateBusiness}
                    >
                      {t('create_business')}
                    </Button>
                    
                     
                  </div>
                </Col>
                <Col md={6} className="businesses-section">
                  <div>
                    <h6 className="mb-4">{t('my_businesses')}</h6>
                    <BusinessList businesses={businesses} viewType="desktop" />
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderInsightsContent = () => {
    return (
      <div className="glass-card p-4">
        <div>
          <Button 
            variant="primary" 
            onClick={goBackToWelcome} 
            className="btn-back mb-4"
          >
            ← {t('back_to_welcome')}
          </Button>
        </div>

        <div className="analysis-section">
          <h5 className="mb-4">{t('business_insights')}</h5>
          
          <div className="insights-card p-4 border rounded">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="mb-1">{t('generate_insights')}</h6>
                <p className="text-muted mb-0">{t('generate_insights_desc')}</p>
              </div>
              <Button
                variant="primary"
                onClick={generateInsights}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    {t('analyzing')}
                  </>
                ) : (
                  t('generate_insights_btn')
                )}
              </Button>
            </div>

            {analysisResult && (
              <div className="analysis-result mt-4 p-3 bg-light rounded">
                <h6 className="mb-3">{t('analysis_results')}</h6>
                <div className="analysis-content">
                  {analysisResult}
                </div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="mt-3"
                  onClick={clearResults}
                >
                  {t('clear_results')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="dashboard-layout">
      <MenuBar /> 

      <Container fluid className="p-0 main-content">
        {currentStep === STEPS.WELCOME ? (
          <div className="responsive-view-container">
            {renderWelcomeLayout()}
          </div>
        ) : (
          <div className="px-4 py-4">
            <Row>
              <Col>
                {renderInsightsContent()}
              </Col>
            </Row>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Dashboard;