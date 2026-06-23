import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, FileText, ArrowLeft, Loader2, Check } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore, useUIStore, useAnalysisStore, useBusinessStore } from "../store";
import { AnalysisApiService } from "../services/analysisApiService";
import { BusinessSetupContext } from "../context/BusinessSetupContext";
import ExecutiveSummary from "../components/ExecutiveSummary";
import MenuBar from "../components/MenuBar";
import "../styles/executiveSummary.css";
import "../styles/businesspage.css";

const HistoryPage = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const token = useAuthStore(state => state.token);
  const getAuthToken = useCallback(() => token, [token]);
  const setStoreLoading = useUIStore(state => state.setLoading);
  const questionsLoaded = useAnalysisStore(state => state.questionsLoaded);
  const questions = useAnalysisStore(state => state.questions);
  const currentBusiness = useBusinessStore(state => state.selectedBusiness);
  const selectedBusinessName = currentBusiness?.business_name || "Business";

  const ML_API_BASE_URL = import.meta.env.VITE_ML_BACKEND_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const apiService = useMemo(() => new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken, setStoreLoading), [ML_API_BASE_URL, API_BASE_URL, getAuthToken, setStoreLoading]);

  const [expandedAccordion, setExpandedAccordion] = useState(true);
  const [expandedInputs, setExpandedInputs] = useState(true);
  const [loading, setLoading] = useState(true);
  const [answersData, setAnswersData] = useState([]);
  const [generatedDate, setGeneratedDate] = useState("");

  useEffect(() => {
    const fetchHistoryData = async () => {
      setLoading(true);
      try {
        const pmfDataResponse = await apiService.getPMFAnalysis(businessId);
        const pmfData = pmfDataResponse?.onboarding_data || pmfDataResponse?.onboardingData || pmfDataResponse || {};

        const mappedAnswers = [
          {
            id: 1,
            question: "What does the business actually do?",
            answer: pmfData?.purpose || pmfData?.businessPurpose?.purpose || "Not provided"
          },
          {
            id: 2,
            question: "Where is the business based?",
            answer: [pmfData?.city || pmfData?.location?.city, pmfData?.country || pmfData?.location?.country].filter(Boolean).join(", ") || "Not provided"
          },
          {
            id: 3,
            question: "What industry is the business in?",
            answer: pmfData?.primaryIndustry || pmfData?.industry?.primaryIndustry || "Not provided"
          },
          {
            id: 4,
            question: "What is your core?",
            answer: `Geographies: ${[pmfData?.geography1, pmfData?.geography2, pmfData?.geography3].filter(Boolean).join(", ") || "N/A"}
Customer Segments: ${[pmfData?.customerSegment1, pmfData?.customerSegment2, pmfData?.customerSegment3].filter(Boolean).join(", ") || "N/A"}
Products/Services: ${[pmfData?.productService1, pmfData?.productService2, pmfData?.productService3].filter(Boolean).join(", ") || "N/A"}
Channels: ${[pmfData?.channel1, pmfData?.channel2, pmfData?.channel3].filter(Boolean).join(", ") || "N/A"}`
          },
          {
            id: 5,
            question: "Where do you compete?",
            answer: (pmfData?.differentiation || pmfData?.competitiveDimensions?.selected || []).join(", ") || "Not provided"
          }
        ];

        setAnswersData(mappedAnswers);

        if (pmfDataResponse?.updatedAt || pmfDataResponse?.updated_at) {
          const dateStr = pmfDataResponse.updatedAt || pmfDataResponse.updated_at;
          setGeneratedDate(new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }));
        }
      } catch (err) {
        console.error("Failed to fetch inputs data", err);
      } finally {
        setLoading(false);
      }
    };
    if (businessId && token) {
      fetchHistoryData();
    }
  }, [businessId, token, API_BASE_URL, apiService]);

  const contextValue = {
    selectedBusinessId: businessId,
    openModal: () => { },
    pmfRefreshTrigger: 0,
    t,
    apiService,
    setActiveTab: () => { },
    handleKickstartSuccess: () => { },
    handleStayOnPriorities: () => { }
  };

  const renderInputs = () => {
    if (!answersData || answersData.length === 0) return <p className="text-muted p-3">No inputs found.</p>;

    return (
      <div className="p-4 pt-3" style={{ backgroundColor: '#fff' }}>
        <p className="hist-io-label" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>INPUTS • READ-ONLY</p>
        <div className="d-flex flex-column">
          {answersData.map((ans) => {
            return (
              <div className="hist-qa" key={ans.id}>
                <h6 className="hist-qa-q">{ans.question}</h6>
                <span className="hist-qa-a">{ans.answer}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="business-setup-container">
      <MenuBar />

      <div className="main-container analysis-expanded">
        <div className="info-panel expanded active">
          <div className="desktop-expanded-analysis" style={{ height: '100%' }}>
            <div className="expanded-analysis-view" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="desktop-tabs">
                <div className="desktop-tabs-main">
                  <div className="business-header-container">
                    <button
                      className="back-button"
                      onClick={() => navigate(`/dashboard`)}
                      aria-label="Go Back"
                    >
                      <ArrowLeft size={18} />
                      <span className="breadcrumb-back">
                        {t("backToDashboard_B3") || "Back to Dashboard"}
                      </span>
                    </button>
                    {selectedBusinessName && (
                      <div className="business-breadcrumb">
                        <span className="breadcrumb-separator">/</span>
                        <span className="business-header-name cursor-pointer text-muted hover-primary" style={{ cursor: 'pointer' }} onClick={() => navigate(`/businesspage`, { state: { businessId } })}>
                          {selectedBusinessName}
                        </span>
                        <span className="breadcrumb-separator">/</span>
                        <span className="business-header-name cursor-pointer text-muted hover-primary" style={{ cursor: 'pointer' }} onClick={() => navigate(`/businesspage`, { state: { businessId } })}>
                          Insights
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 flex-grow-1 overflow-auto" style={{ backgroundColor: '#fff' }}>
                <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>

                  <div className="mb-2 pt-2">
                    <button
                      className="btn btn-link text-decoration-none p-0 d-inline-flex align-items-center"
                      style={{ color: '#475569', fontWeight: '600', fontSize: '15px' }}
                      onClick={() => navigate(`/businesspage`, { state: { businessId, initialTab: 'insights' } })}
                    >
                      <ArrowLeft size={18} className="me-2" /> Back to analysis
                    </button>
                  </div>

                  <div className="mb-3">
                    <h3 className="fw-bold mb-2" style={{ color: '#0f172a' }}>History</h3>
                    <p className="text-muted">Your past analyses — read-only. Open one to see its inputs & outputs.</p>
                  </div>

                  <div className="accordion-item border mb-2 overflow-hidden" style={{ borderColor: '#0ea5e9', borderRadius: '12px' }}>
                    <div
                      className="d-flex justify-content-between align-items-center p-3 cursor-pointer"
                      onClick={() => setExpandedAccordion(!expandedAccordion)}
                      style={{ backgroundColor: '#f0f9ff', borderBottom: expandedAccordion ? '1px solid #e2e8f0' : 'none', padding: '16px 20px' }}
                    >
                      <div className="d-flex align-items-center">
                        <span className="hist-type-badge">BASIC</span>
                        <div className="row-title-div">
                          <h5 className="hist-row-title">Basic diagnosis</h5>
                          <span className="hist-row-date">Generated {generatedDate || "Recently"}</span>
                        </div>
                      </div>
                      {expandedAccordion ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
                    </div>

                    {expandedAccordion && (
                      <div className="p-3">

                        {/* Inputs Section */}
                        <div className="border rounded-3 mb-3 overflow-hidden bg-white">
                          <div
                            className="d-flex justify-content-between align-items-center p-3 cursor-pointer border-bottom"
                            onClick={() => setExpandedInputs(!expandedInputs)}
                          >
                            <div className="d-flex align-items-center">
                              <div className="bg-light p-2 rounded-3 me-3">
                                <FileText size={18} className="text-muted" />
                              </div>
                              <div>
                                <h6 className="hist-inputs-title">Inputs</h6>
                                <span className="hist-inputs-sub">The answers this diagnosis was built from</span>
                              </div>
                            </div>
                            {expandedInputs ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
                          </div>

                          {expandedInputs && (
                            <div>
                              {loading ? (
                                <div className="p-4 text-center">
                                  <Loader2 className="animate-spin text-primary" />
                                </div>
                              ) : (
                                renderInputs()
                              )}
                            </div>
                          )}
                        </div>

                        {/* Outputs Section */}
                        <p className="text-muted fw-bold mb-2 ms-2" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>OUTPUTS</p>
                        <BusinessSetupContext.Provider value={contextValue}>
                          <ExecutiveSummary hideNextStep={true} />
                        </BusinessSetupContext.Provider>

                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
