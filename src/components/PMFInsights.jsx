import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Badge, Button, Spinner } from "react-bootstrap";
import { useTranslation } from "../hooks/useTranslation";
import {
  TrendingUp,
  Target,
  Puzzle,
  AlertCircle
} from "lucide-react";
import { AnalysisApiService } from "../services/analysisApiService";

const PMFInsights = ({ businessId, onContinue }) => {
  const { t } = useTranslation();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  // API Service setup
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL;
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem("token");
  const analysisService = new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);

  const fetchInsights = useCallback(async () => {
    if (!businessId) {
      console.warn("PMFInsights: No business ID provided.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await analysisService.getPMFAnalysis(businessId);

      let rawInsights = [];
      if (result) {
        if (Array.isArray(result)) {
          rawInsights = result;
        } else if (result.insights) {
          if (Array.isArray(result.insights)) {
            rawInsights = result.insights;
          } else if (result.insights.insights && Array.isArray(result.insights.insights)) {
            rawInsights = result.insights.insights;
          }
        }
      }

      // Format insights for consistency
      const formattedInsights = rawInsights.map(insight => ({
        ...insight,
        details: insight.details || insight.key_points || []
      }));

      setInsights(formattedInsights);
    } catch (error) {
      console.error("PMFInsights: Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const getIcon = (type, index) => {
    const iconType = type?.toLowerCase() || '';

    // First try keyword matching
    if (iconType.includes('market')) return <TrendingUp size={18} color="#2563eb" />;
    if (iconType.includes('core')) return <Target size={18} color="#2563eb" />;
    if (iconType.includes('adjacency')) return <Puzzle size={18} color="#2563eb" />;
    if (iconType.includes('risk') || iconType.includes('constraint')) return <AlertCircle size={18} color="#2563eb" />;

    // Fallback to index-based mapping (Market, Core, Adjacency, Risk/Constraint)
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

  if (loading) {
    return (
      <div className="bg-light py-5 min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">{t("Loading your insights...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light py-5 min-vh-100">
      <StyleSheet />
      <Container style={{ maxWidth: "1080px" }}>
        <div className="text-center mb-5">
          <Badge
            bg="primary-subtle"
            text="primary"
            className="px-3 py-2 rounded-pill fw-semibold"
          >
            ✨ {t("AHA Insights")}
          </Badge>

          <h2 className="fw-bold mt-3 mb-2">
            {t("Heres what we discovered")}
          </h2>

          <p className="text-muted fs-6">
            {insights.length > 0
              ? t("Based on your inputs, here are the critical insights about your strategic position.")
              : t("No specific insights found for your inputs. Please check your onboarding data.")}
          </p>
        </div>

        <Row className="g-4">
          {insights.length > 0 ? (
            insights.map((insight, index) => {
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
                              {t('Confidence')}: {t(insight.confidence) || insight.confidence}
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
            })
          ) : (
            <Col xs={12} className="text-center py-5">
              <p className="text-muted">{t("No insights currently available.")}</p>
            </Col>
          )}
        </Row>

        <div className="d-flex justify-content-center mt-5">
          <Button
            size="lg"
            className="px-5 rounded-3 fw-semibold"
            onClick={onContinue}
          >
            {t("Continue")}
          </Button>
        </div>
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

export default PMFInsights;
