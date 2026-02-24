import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge, Button, Spinner } from "react-bootstrap";
import {
  TrendingUp,
  Target,
  Puzzle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { AnalysisApiService } from "../services/analysisApiService";
import { useTranslation } from "../hooks/useTranslation";
import { useCallback } from "react";

const PMFInsightsTab = ({ selectedBusinessId, onStartOnboarding, refreshTrigger }) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // API Service setup
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL;
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem("token");
  const analysisService = new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);

  const fetchInsights = useCallback(async () => {
    let businessId = selectedBusinessId;
    if (!businessId) {
      businessId = sessionStorage.getItem('activeBusinessId');
    }

    if (!businessId) {
      console.warn("PMFInsightsTab: No business ID found, skipping fetch.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await analysisService.getPMFAnalysis(businessId);
      setData(result);
    } catch (error) {
      console.error("PMFInsightsTab: Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights, refreshTrigger]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-light py-5 min-vh-100 text-center">
        <Container>
          <h3>{t("noInsightsAvailable") || "No insights available yet."}</h3>
          <p>{t("completeOnboardingPrompt") || "Please complete the PMF Onboarding to see insights here."}</p>
          {onStartOnboarding && (
            <Button
              variant="primary"
              className="mt-3 rounded-pill px-4"
              onClick={onStartOnboarding}
            >
              Start PMF Onboarding
            </Button>
          )}
        </Container>
      </div>
    );
  }

  // Robustly extract insights from data
  let rawInsights = [];
  if (data) {
    if (Array.isArray(data)) {
      rawInsights = data;
    } else if (data.insights) {
      if (Array.isArray(data.insights)) {
        rawInsights = data.insights;
      } else if (data.insights.insights && Array.isArray(data.insights.insights)) {
        rawInsights = data.insights.insights;
      }
    }
  }

  // Ensure it's an array and handle fields like key_points vs details
  const insights = rawInsights.map(insight => ({
    ...insight,
    details: insight.details || insight.key_points || []
  }));

  if (insights.length === 0) {
    return (
      <div className="bg-light py-5 min-vh-100 text-center">
        <Container>
          <h3>{t("noInsightsAvailable") || "No insights available yet."}</h3>
          <p>{t("completeOnboardingPrompt") || "Please complete the PMF Onboarding to see insights here."}</p>
          {onStartOnboarding && (
            <Button
              variant="primary"
              className="mt-3 rounded-pill px-4"
              onClick={onStartOnboarding}
            >
              Start PMF Onboarding
            </Button>
          )}
        </Container>
      </div>
    );
  }

  const getIcon = (type, index) => {
    const iconType = type?.toLowerCase() || '';

    // First try keyword matching
    if (iconType.includes('market')) return <TrendingUp size={18} color="#2563eb" />;
    if (iconType.includes('core')) return <Target size={18} color="#2563eb" />;
    if (iconType.includes('adjacency')) return <Puzzle size={18} color="#2563eb" />;
    if (iconType.includes('risk') || iconType.includes('constraint')) return <AlertCircle size={18} color="#2563eb" />;

    // Fallback to index-based mapping
    switch (index % 4) {
      case 0: return <TrendingUp size={18} color="#2563eb" />;
      case 1: return <Target size={18} color="#2563eb" />;
      case 2: return <Puzzle size={18} color="#2563eb" />;
      case 3: default: return <AlertCircle size={18} color="#2563eb" />;
    }
  };

  const getBadgeProps = (confidence) => {
    const conf = confidence?.toLowerCase() || '';
    if (conf.includes('high')) {
      return { bg: 'success-subtle', text: 'success' };
    } else if (conf.includes('medium')) {
      return { bg: 'warning-subtle', text: 'warning' };
    } else if (conf.includes('low')) {
      return { bg: 'danger-subtle', text: 'danger' };
    }
    return { bg: 'secondary-subtle', text: 'secondary' };
  };

  return (
    <div className="bg-light py-5 min-vh-100">
      <StyleSheet />
      <Container style={{ maxWidth: "1080px" }}>
        <div className="text-center mb-5">
          <Badge
            bg="primary-subtle"
            text="primary"
            className="px-4 py-2 rounded-pill fw-bold fs-5"
          >
            {t("AHA Insights")}
          </Badge>

          <h2 className="fw-semibold mt-3 mb-2">
            {t("Key strategic insights based on your onboarding")}
          </h2>

        </div>

        <Row className="g-4">
          {Array.isArray(insights) ? insights.map((insight, index) => {
            const badgeProps = getBadgeProps(insight.confidence);
            return (
              <Col md={6} key={index}>
                <Card className="h-100 border-0 shadow-sm rounded-4">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-start gap-3">
                      <div className="icon-box d-flex align-items-center justify-content-center bg-primary-subtle rounded-3" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                        {getIcon(insight.type, index)}
                      </div>

                      <div>
                        <h6 className="fw-semibold mb-2">
                          {insight.title}
                        </h6>

                        {insight.confidence && (
                          <Badge
                            bg={badgeProps.bg}
                            text={badgeProps.text}
                            className="rounded-pill fw-semibold mb-3"
                          >
                            Confidence: {insight.confidence}
                          </Badge>
                        )}

                        <ul className="insight-list mb-0" style={{ paddingLeft: '1.2rem' }}>
                          {Array.isArray(insight.details) && insight.details.map((detail, dIndex) => (
                            <li key={dIndex} className="mb-1">{detail}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          }) : (
            <Col xs={12}>
              <p className="text-center text-muted">No specific insights found in the data structure.</p>
            </Col>
          )}
        </Row>
      </Container>
    </div>
  );
};

// Internal styles for the component
const StyleSheet = () => (
  <style>{`
    .insight-list {
      list-style-type: disc;
    }
    .insight-list li::marker {
      color: #2563eb;
    }
    .icon-box {
      transition: all 0.2s ease-in-out;
    }
    .icon-box:hover {
      transform: scale(1.1);
    }
    
    /* Ensure subtle badges look premium and are available */
    .bg-success-subtle {
      background-color: #d1fae5 !important;
      color: #065f46 !important;
    }
    .bg-warning-subtle {
      background-color: #fef3c7 !important;
      color: #92400e !important;
    }
    .bg-danger-subtle {
      background-color: #fee2e2 !important;
      color: #991b1b !important;
    }
    .bg-primary-subtle {
      background-color: #dbeafe !important;
      color: #1e40af !important;
    }
    .bg-secondary-subtle {
      background-color: #f3f4f6 !important;
      color: #374151 !important;
    }
    
    .text-success { color: #065f46 !important; }
    .text-warning { color: #92400e !important; }
    .text-danger { color: #991b1b !important; }
    .text-primary { color: #1e40af !important; }
  `}</style>
);

export default PMFInsightsTab;
