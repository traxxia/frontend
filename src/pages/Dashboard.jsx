import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import {
  ArrowRight, Info, X
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

  // Business management state
  const [businesses, setBusinesses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false);
  const [businessFormData, setBusinessFormData] = useState({
    business_name: '',
    business_purpose: '',
    description: ''
  });
  const [businessError, setBusinessError] = useState('');
  const [businessSuccess, setBusinessSuccess] = useState('');

  // Dynamic insights state
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [phaseAnalysis, setPhaseAnalysis] = useState([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [showHowModal, setShowHowModal] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Check if user has seen onboarding
  useEffect(() => {
    const onboardingCompleted = sessionStorage.getItem('onboarding_completed');
    const isFirstVisit = !onboardingCompleted;

    if (isFirstVisit) {
      // Show onboarding after a brief delay for better UX
      setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
    }
    setHasSeenOnboarding(!!onboardingCompleted);
  }, []);

  // Fetch businesses on component mount
  useEffect(() => {
    fetchBusinesses();
  }, []);

  // API Functions
  const fetchBusinesses = async () => {
    try {
      const token = sessionStorage.getItem('token');

      if (!token) {
        console.error('No token found in sessionStorage');
        setBusinessError('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }

      console.log('Token exists:', token ? 'Yes' : 'No');
      console.log('API URL:', `${API_BASE_URL}/api/businesses`);

      const response = await fetch(`${API_BASE_URL}/api/businesses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Businesses data:', data);
        setBusinesses(data.businesses || []);
        setBusinessError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch businesses:', errorData);

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          sessionStorage.clear(); // Clear session data
          navigate('/login');
        } else {
          setBusinessError(errorData.error || 'Failed to load businesses');
        }
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setBusinessError('Network error. Please check your connection and try again.');
    }
  };

  const fetchPhaseAnalysis = async (businessId = null, phase = null) => {
    try {
      setIsLoadingAnalysis(true);
      const token = sessionStorage.getItem('token');
      let url = API_BASE_URL + '/api/phase-analysis?';

      const params = new URLSearchParams();
      if (businessId) params.append('business_id', businessId);
      if (phase) params.append('phase', phase);

      const response = await fetch(url + params.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPhaseAnalysis(data.analysis_results || []);
        return data.analysis_results;
      } else {
        console.error('Failed to fetch phase analysis');
        if (response.status === 401 || response.status === 403) {
          sessionStorage.clear();
          navigate('/login');
        }
        return [];
      }
    } catch (error) {
      console.error('Error fetching phase analysis:', error);
      return [];
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const fetchConversations = async (businessId = null, phase = null) => {
    try {
      const token = sessionStorage.getItem('token');
      let url = API_BASE_URL + '/api/conversations?';

      const params = new URLSearchParams();
      if (businessId) params.append('business_id', businessId);
      if (phase) params.append('phase', phase);

      const response = await fetch(url + params.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.error('Failed to fetch conversations');
        if (response.status === 401 || response.status === 403) {
          sessionStorage.clear();
          navigate('/login');
        }
        return null;
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return null;
    }
  };

  const createBusiness = async () => {
    try {
      setIsCreatingBusiness(true);
      setBusinessError('');
      setBusinessSuccess('');

      const token = sessionStorage.getItem('token');

      if (!token) {
        setBusinessError('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/businesses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(businessFormData)
      });

      const data = await response.json();

      if (response.ok) {
        setBusinessSuccess('Business created successfully!');
        setBusinessFormData({
          business_name: '',
          business_purpose: '',
          description: ''
        });

        // Refresh the business list
        await fetchBusinesses();

        // Close modal after a brief delay
        setTimeout(() => {
          setShowCreateModal(false);
          setBusinessSuccess('');
        }, 1500);
      } else {
        console.error('Create business error:', data);

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          sessionStorage.clear();
          navigate('/login');
        } else {
          setBusinessError(data.error || 'Failed to create business');
        }
      }
    } catch (error) {
      setBusinessError('Network error. Please try again.');
      console.error('Error creating business:', error);
    } finally {
      setIsCreatingBusiness(false);
    }
  };

  // Handle onboarding completion
  const handleOnboardingClose = () => {
    setShowOnboarding(false);
  };

  const handleStartDemo = () => {
    sessionStorage.setItem('onboarding_completed', 'true');
    setHasSeenOnboarding(true);
    setShowOnboarding(false);
  };

  const handleShowOnboardingAgain = () => {
    setShowOnboarding(true);
  };

  // Business Modal Functions
  const handleShowCreateModal = () => {
    setShowCreateModal(true);
    setBusinessError('');
    setBusinessSuccess('');
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setBusinessFormData({
      business_name: '',
      business_purpose: '',
      description: ''
    });
    setBusinessError('');
    setBusinessSuccess('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setBusinessFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitBusiness = (e) => {
    e.preventDefault();

    if (!businessFormData.business_name.trim() || !businessFormData.business_purpose.trim()) {
      setBusinessError('Business name and purpose are required');
      return;
    }

    createBusiness();
  };

  const BusinessList = ({ businesses, viewType }) => (
    <div className={`business-list ${viewType}`}>
      {businesses.length === 0 && (
        <div className="text-center text-muted py-5">
          {t('no_businesses_found')}
        </div>
      )}
      {businesses.length > 0 && businesses.map((business, index) => {
        // Extract progress data from question_statistics
        const stats = business.question_statistics || {};
        const progress = stats.progress_percentage || 0;
        const completedQuestions = stats.completed_questions || 0;
        const totalQuestions = stats.total_questions || 0;
        const remainingQuestions = stats.pending_questions || 0;

        return (
          <div
            key={business._id || index}
            className="business-item d-flex align-items-center p-3 border-bottom"
            onClick={() => handleBusinessClick(business)}
            style={{ cursor: "pointer" }}
          >
            {/* Progress Circle */}
            <div style={{ width: 60, height: 60 }} className="progress-circle me-3">
              <CircularProgressbar
                value={progress}
                text={`${Math.round(progress)}%`}
                styles={buildStyles({
                  pathColor: progress === 100 ? "#28a745" : progress > 50 ? "#ffc107" : "#17a2b8",
                  textColor: "#000",
                  trailColor: "#e9ecef",
                  textSize: "28px",
                  pathTransitionDuration: 0.5,
                })}
              />
            </div>

            <div className="flex-grow-1">
              <h6 className="mb-1">{business.business_name}</h6>
              <small className="text-muted">
                {completedQuestions}/{totalQuestions} questions completed
                {remainingQuestions > 0 && (
                  <span className="text-warning ms-2">
                    • {remainingQuestions} remaining
                  </span>
                )}
              </small>
            </div>
            <ArrowRight size={16} className="text-muted" />
          </div>
        );
      })}
    </div>
  );

  // Event Handlers
  const handleBusinessClick = (business) => {
    navigate('/businesspage', { state: { business } });
  };

  const handleViewInsights = async (business) => {
    setSelectedBusiness(business);
    setCurrentStep(STEPS.INSIGHTS);

    // Fetch existing analysis for this business
    await fetchPhaseAnalysis(business._id);
  };

  const goToInsights = () => {
    setCurrentStep(STEPS.INSIGHTS);
  };

  const goBackToWelcome = () => {
    setCurrentStep(STEPS.WELCOME);
    setAnalysisResult("");
    setSelectedBusiness(null);
    setPhaseAnalysis([]);
  };

  const generateInsights = async () => {
    if (!selectedBusiness) {
      setBusinessError('Please select a business first');
      return;
    }

    setIsLoading(true);
    setAnalysisResult("");

    try {
      // Fetch conversations and existing analysis
      const [conversationsData, analysisData] = await Promise.all([
        fetchConversations(selectedBusiness._id),
        fetchPhaseAnalysis(selectedBusiness._id)
      ]);

      if (conversationsData && conversationsData.conversations) {
        // Generate dynamic insights based on conversations
        const insights = generateDynamicInsights(conversationsData, analysisData);
        setAnalysisResult(insights);
      } else {
        setAnalysisResult("No data available for analysis. Please complete the business assessment first.");
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      setAnalysisResult("Failed to generate insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateDynamicInsights = (conversationsData, analysisData) => {
    const { conversations, phase_analysis } = conversationsData;

    let insights = `Business Analysis Report for ${selectedBusiness.business_name}\n\n`;

    // Overview
    insights += `📊 Assessment Overview:\n`;
    insights += `• Total Questions: ${conversations.length}\n`;
    insights += `• Completed: ${conversations.filter(c => c.completion_status === 'complete').length}\n`;
    insights += `• Analysis Reports: ${phase_analysis.length}\n\n`;

    // Phase Analysis Results
    if (phase_analysis && phase_analysis.length > 0) {
      insights += `🔍 Generated Analysis:\n\n`;

      phase_analysis.forEach((analysis, index) => {
        insights += `${index + 1}. ${analysis.analysis_name}\n`;
        insights += `   Phase: ${analysis.phase || 'General'}\n`;
        insights += `   Type: ${analysis.analysis_type || 'Unknown'}\n`;

        if (typeof analysis.analysis_data === 'object') {
          insights += `   Results: ${JSON.stringify(analysis.analysis_data, null, 2)}\n`;
        } else {
          insights += `   Results: ${analysis.analysis_data}\n`;
        }
        insights += `   Generated: ${new Date(analysis.created_at).toLocaleDateString()}\n\n`;
      });
    }

    // Conversation Summary
    if (conversations && conversations.length > 0) {
      insights += `💬 Question & Answer Summary:\n\n`;

      conversations.forEach((conv, index) => {
        if (conv.completion_status === 'complete') {
          insights += `${index + 1}. ${conv.question_text}\n`;
          insights += `   Status: ✅ Complete\n`;
          insights += `   Answers: ${conv.total_answers}\n`;
          insights += `   Last Updated: ${new Date(conv.last_updated).toLocaleDateString()}\n\n`;
        }
      });

      const incompleteQuestions = conversations.filter(c => c.completion_status !== 'complete');
      if (incompleteQuestions.length > 0) {
        insights += `⚠️ Pending Questions (${incompleteQuestions.length}):\n`;
        incompleteQuestions.forEach((conv, index) => {
          insights += `${index + 1}. ${conv.question_text}\n`;
        });
        insights += `\n`;
      }
    }

    // Recommendations
    insights += `🎯 Next Steps:\n`;
    const completedCount = conversations.filter(c => c.completion_status === 'complete').length;
    const totalCount = conversations.length;

    if (completedCount === 0) {
      insights += `• Start by completing the business assessment questions\n`;
      insights += `• Focus on providing detailed answers for better insights\n`;
    } else if (completedCount < totalCount) {
      insights += `• Complete remaining ${totalCount - completedCount} questions\n`;
      insights += `• Review and expand on previous answers if needed\n`;
    } else {
      insights += `• All assessment questions completed! 🎉\n`;
      insights += `• Consider conducting periodic reviews to track progress\n`;
      insights += `• Implement recommendations from the analysis reports\n`;
    }

    if (phase_analysis.length === 0) {
      insights += `• Request detailed analysis reports for strategic planning\n`;
    }

    return insights;
  };

  const clearResults = () => {
    setAnalysisResult("");
  };

  const handleCloseModal = () => {
    setShowHowModal(false);
  };

  // Renderers - Always show split view
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
                  onClick={handleShowCreateModal}
                >
                  {t('create_business')}
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Desktop View - Always show split layout */}
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
                      className="create-business-btn me-3"
                      onClick={handleShowCreateModal}
                    >
                      {t('create_business')}
                    </Button>

                    <Button
                      variant="primary"
                      className="create-business-btn"
                      onClick={() => setShowHowModal(true)}
                    >
                      <Info size={18} className="me-2" />
                      How It Works
                    </Button>

                    {/* How It Works Modal */}
                    {showHowModal && (
                      <div className="popup-overlay" onClick={handleCloseModal}>
                        <div className="popup-content large" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="close-button"
                            onClick={handleCloseModal}
                            aria-label="Close modal"
                          >
                            <X size={20} />
                          </button>

                          <h2 className="mb-4">How This Application Works</h2>

                          <div id="howItWorksCarousel" className="carousel slide" data-bs-ride="carousel" data-bs-interval="5000">
                            {/* Indicators */}
                            <div className="carousel-indicators">
                              <button
                                type="button"
                                data-bs-target="#howItWorksCarousel"
                                data-bs-slide-to="0"
                                className="active"
                                aria-label="Slide 1"
                              ></button>
                              <button
                                type="button"
                                data-bs-target="#howItWorksCarousel"
                                data-bs-slide-to="1"
                                aria-label="Slide 2"
                              ></button>
                              <button
                                type="button"
                                data-bs-target="#howItWorksCarousel"
                                data-bs-slide-to="2"
                                aria-label="Slide 3"
                              ></button>
                              <button
                                type="button"
                                data-bs-target="#howItWorksCarousel"
                                data-bs-slide-to="3"
                                aria-label="Slide 4"
                              ></button>
                            </div>

                            {/* Slides */}
                            <div className="carousel-inner">
                              <div className="carousel-item active">
                                <img
                                  src="/slides/slide1.jpeg"
                                  className="d-block w-100"
                                  alt="Step 1: Create your business profile"
                                />
                                <div className="carousel-caption d-none d-md-block">
                                  <h5>Step 1: Create Your Business</h5>
                                  <p>Start by setting up your business profile with basic information.</p>
                                </div>
                              </div>
                              <div className="carousel-item">
                                <img
                                  src="/slides/slide2.jpeg"
                                  className="d-block w-100"
                                  alt="Step 2: Answer assessment questions"
                                />
                                <div className="carousel-caption d-none d-md-block">
                                  <h5>Step 2: Complete Assessment</h5>
                                  <p>Answer questions about your business to get personalized insights.</p>
                                </div>
                              </div>
                              <div className="carousel-item">
                                <img
                                  src="/slides/slide3.jpeg"
                                  className="d-block w-100"
                                  alt="Step 3: Get insights and recommendations"
                                />
                                <div className="carousel-caption d-none d-md-block">
                                  <h5>Step 3: Get Insights</h5>
                                  <p>Receive detailed analysis and actionable recommendations.</p>
                                </div>
                              </div>
                              <div className="carousel-item">
                                <img
                                  src="/slides/slide4.PNG"
                                  className="d-block w-100"
                                  alt="Step 4: Track progress and optimize"
                                />
                                <div className="carousel-caption d-none d-md-block">
                                  <h5>Step 4: Track & Optimize</h5>
                                  <p>Monitor your progress and continuously improve your business performance.</p>
                                </div>
                              </div>
                            </div>

                            {/* Navigation Arrows */}
                            <button
                              className="carousel-control-prev"
                              type="button"
                              data-bs-target="#howItWorksCarousel"
                              data-bs-slide="prev"
                              aria-label="Previous slide"
                            >
                              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                              <span className="visually-hidden">Previous</span>
                            </button>
                            <button
                              className="carousel-control-next"
                              type="button"
                              data-bs-target="#howItWorksCarousel"
                              data-bs-slide="next"
                              aria-label="Next slide"
                            >
                              <span className="carousel-control-next-icon" aria-hidden="true"></span>
                              <span className="visually-hidden">Next</span>
                            </button>
                          </div>

                          <div className="text-center mt-4">
                            <Button
                              variant="primary"
                              onClick={handleCloseModal}
                              className="px-4"
                            >
                              Got it!
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Col>

                {/* RIGHT SIDE - ALWAYS VISIBLE */}
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
                <p className="text-muted mb-0">
                  {selectedBusiness
                    ? `Generate analysis for ${selectedBusiness.business_name}`
                    : t('generate_insights_desc')
                  }
                </p>
              </div>
              <Button
                variant="primary"
                onClick={generateInsights}
                disabled={isLoading || !selectedBusiness}
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
                <div className="analysis-content" style={{ whiteSpace: 'pre-line' }}>
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

      {/* Create Business Modal */}
      <Modal show={showCreateModal} onHide={handleCloseCreateModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Business</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitBusiness}>
          <Modal.Body>
            {businessError && (
              <Alert variant="danger" className="mb-3">
                {businessError}
              </Alert>
            )}
            {businessSuccess && (
              <Alert variant="success" className="mb-3">
                {businessSuccess}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Business Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="business_name"
                value={businessFormData.business_name}
                onChange={handleFormChange}
                placeholder="Enter your business name"
                required
                disabled={isCreatingBusiness}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Business Purpose <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="business_purpose"
                value={businessFormData.business_purpose}
                onChange={handleFormChange}
                placeholder="Brief description of what your business does"
                required
                disabled={isCreatingBusiness}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={businessFormData.description}
                onChange={handleFormChange}
                placeholder="Detailed description of your business..."
                disabled={isCreatingBusiness}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseCreateModal}
              disabled={isCreatingBusiness}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isCreatingBusiness}
            >
              {isCreatingBusiness ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Creating...
                </>
              ) : (
                'Create Business'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;