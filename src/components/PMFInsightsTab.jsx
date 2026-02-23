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
  const [isRegenerating, setIsRegenerating] = useState(false);

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

    console.log("PMFInsightsTab: fetchInsights called for business:", businessId);
    if (!businessId) {
      console.warn("PMFInsightsTab: No business ID found, skipping fetch.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await analysisService.getPMFAnalysis(businessId);
      console.log("PMFInsightsTab: API Result:", result);
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

  const handleRegenerate = async () => {
    if (!data?.onboarding_data) {
      alert("No onboarding data found. Please complete the onboarding first.");
      return;
    }

    try {
      setIsRegenerating(true);

      const formData = data.onboarding_data;
      const questionsArray = [
        "Company Name", "Website", "Country", "City", "Primary Industry",
        "Geographies", "Customer Segments", "Products/Services", "Channels",
        "Strategic Objective", "Key Challenge", "Differentiation", "Usage Context"
      ];

      const answersArray = [
        formData.companyName,
        formData.website || "N/A",
        formData.country,
        formData.city || "N/A",
        formData.primaryIndustry,
        [formData.geography1, formData.geography2, formData.geography3].filter(Boolean).join(", "),
        [formData.customerSegment1, formData.customerSegment2, formData.customerSegment3].filter(Boolean).join(", "),
        [formData.productService1, formData.productService2, formData.productService3].filter(Boolean).join(", "),
        [formData.channel1, formData.channel2, formData.channel3].filter(Boolean).join(", "),
        formData.strategicObjective === "Other" ? formData.strategicObjectiveOther : formData.strategicObjective,
        formData.keyChallenge === "Other" ? formData.keyChallengeOther : formData.keyChallenge,
        [...formData.differentiation, formData.differentiationOther].filter(Boolean).join(", "),
        formData.usageContext
      ];

      const insightResult = await analysisService.makeAPICall(
        'aha-insight',
        questionsArray,
        answersArray,
        selectedBusinessId,
        null,
        null,
        null,
        formData.companyName
      );

      await analysisService.savePMFInsights(selectedBusinessId, insightResult);
      await fetchInsights(); // Refresh data
    } catch (error) {
      console.error("Error regenerating PMF insights:", error);
      alert("Failed to regenerate insights. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

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
  // The API might return insights as: 
  // 1. { insights: [...] }
  // 2. { insights: { insights: [...] } }
  // 3. [...] directly
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

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'market': return <TrendingUp size={18} color="#2563eb" />;
      case 'core': return <Target size={18} color="#2563eb" />;
      case 'adjacency': return <Puzzle size={18} color="#2563eb" />;
      case 'risk': return <AlertCircle size={18} color="#2563eb" />;
      default: return <AlertCircle size={18} color="#2563eb" />;
    }
  };

  return (
    <div className="bg-light py-5 min-vh-100">
      <Container style={{ maxWidth: "1080px" }}>
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div className="text-center flex-grow-1">
            <Badge
              bg="primary-subtle"
              text="primary"
              className="px-3 py-2 rounded-pill fw-semibold"
            >
              ✨ AHA Insights
            </Badge>

            <h2 className="fw-bold mt-3 mb-2">
              Here's what we discovered
            </h2>

            <p className="text-muted fs-6">
              Based on your inputs, here are the critical insights about your
              strategic position.
            </p>
          </div>

          <Button
            variant="outline-primary"
            className="d-flex align-items-center gap-2"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? <Spinner size="sm" /> : <RefreshCw size={16} />}
            {isRegenerating ? "Generating (60-90s)..." : "Regenerate"}
          </Button>
        </div>

        <Row className="g-4">
          {Array.isArray(insights) ? insights.map((insight, index) => (
            <Col md={6} key={index}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-start gap-3">
                    <div className="icon-box">
                      {getIcon(insight.type)}
                    </div>

                    <div>
                      <h6 className="fw-semibold mb-2">
                        {insight.title}
                      </h6>

                      {insight.confidence && (
                        <Badge
                          bg={insight.confidence.toLowerCase() === 'high' ? 'success-subtle' : 'warning-subtle'}
                          text={insight.confidence.toLowerCase() === 'high' ? 'success' : 'warning'}
                          className="rounded-pill fw-semibold mb-3"
                        >
                          Confidence: {insight.confidence}
                        </Badge>
                      )}

                      <ul className="insight-list mb-0">
                        {Array.isArray(insight.details) && insight.details.map((detail, dIndex) => (
                          <li key={dIndex}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )) : (
            <Col xs={12}>
              <p className="text-center text-muted">No specific insights found in the data structure.</p>
            </Col>
          )}
        </Row>
      </Container>
    </div>
  );
};

export default PMFInsightsTab;
