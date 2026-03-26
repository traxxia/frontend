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
import { Modal } from "react-bootstrap";


const PMFInsightsTab = ({ selectedBusinessId, onStartOnboarding, refreshTrigger }) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [overwrittenBy, setOverwrittenBy] = useState("");
  const userRole = (
    sessionStorage.getItem("role") ||
    sessionStorage.getItem("userRole") ||
    ""
  ).toLowerCase();
  const isViewer = userRole === "viewer";

  // API Service setup
  const ML_API_BASE_URL = process.env.REACT_APP_ML_BACKEND_URL;
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem("token");
  const analysisService = new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);

  useEffect(() => {
    let cancelled = false;

    const fetchInsights = async () => {
      let businessId = selectedBusinessId;
      if (!businessId) {
        businessId = sessionStorage.getItem('activeBusinessId');
      }

      if (!businessId) {
        console.warn("PMFInsightsTab: No business ID found, skipping fetch.");
        return;
      }

      try {
        setLoading(prev => (data ? false : true)); // Only show spinner on first load
        const result = await analysisService.getPMFAnalysis(businessId);
        if (!cancelled) {
          setData(result);

          // --- OVERWRITE DETECTION (AHA Page) ---
          if (result && result.user_id) {
            const currentUserId = sessionStorage.getItem("userId");
            const bId = String(businessId);
            const expectedUserId = localStorage.getItem(`pmf_expecting_my_data_${bId}`);

            if (expectedUserId) {
              const getStrId = (val) => {
                if (!val) return "";
                if (typeof val === 'string') return val.toLowerCase().trim();
                if (val.$oid) return val.$oid.toLowerCase().trim();
                return String(val).toLowerCase().trim();
              };

              const dbUserId = getStrId(result.user_id);
              const expUserId = getStrId(expectedUserId);
              const currentUser = getStrId(currentUserId);

              // Condition for overwrite:
              // 1. We expected our own data (flag matches us)
              // 2. Data in DB belongs to someone else
              if (dbUserId && expUserId === currentUser && dbUserId !== currentUser) {
                console.info("PMF Overwrite TRIGGERED", { dbUserId, currentUser });
                try {
                  const eligibleRes = await analysisService.getEligibleOwners(bId);
                  const users = eligibleRes.eligible_owners || [];
                  const updater = users.find(u => getStrId(u._id || u.id) === dbUserId);
                  setOverwrittenBy(updater ? (updater.name || updater.email) : t("another user"));
                } catch (e) {
                  setOverwrittenBy(t("another user"));
                }
                setShowOverwriteModal(true);
              }
            }
          }
          // --- END OVERWRITE DETECTION ---
        }
      } catch (error) {
        console.error("PMFInsightsTab: Error fetching insights:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInsights();

    // Background check every 30 seconds for concurrent overwrites
    const interval = setInterval(() => {
      if (!showOverwriteModal) {
        fetchInsights();
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusinessId, refreshTrigger]);

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
          <p>{t("completeOnboardingPrompt") || "Please complete the PMF Onboarding to see results here."}</p>
          {onStartOnboarding && !isViewer && (
            <Button
              variant="primary"
              className="mt-3 rounded-pill px-4"
              onClick={onStartOnboarding}
            >
              {t("startPMFOnboarding")}
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
          <p>{t("completeOnboardingPrompt") || "Please complete the PMF Onboarding to see results here."}</p>
          {onStartOnboarding && !isViewer && (
            <Button
              variant="primary"
              className="mt-3 rounded-pill px-4"
              onClick={onStartOnboarding}
            >
              {t("startPMFOnboarding")}
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
    <div className="bg-light">
      <StyleSheet />
      <Container style={{ maxWidth: "100%" }}>
        <div className="text-center mb-3">
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
                            {t("Confidence")}: {insight.confidence}
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

      {/* Overwrite Notification Modal */}
      <Modal
        show={showOverwriteModal}
        onHide={() => setShowOverwriteModal(false)}
        centered
        size="sm"
        className="pmf-overwrite-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-6 text-dark">
            {t("Update Notification")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 pb-3 px-3">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="icon-box bg-warning-subtle rounded-circle p-2 flex-shrink-0">
              <AlertCircle size={20} color="#92400e" />
            </div>
            <p className="mb-0 fs-6 text-dark" style={{ lineHeight: '1.4' }}>
              {t("Your PMF onboarding was updated by")} <strong>{overwrittenBy}</strong>
            </p>
          </div>
          <div className="text-center">
            <Button
              variant="primary"
              size="sm"
              className="px-4 rounded-3 fw-semibold"
              onClick={() => {
                setShowOverwriteModal(false);
                const bId = String(selectedBusinessId || sessionStorage.getItem('activeBusinessId'));
                if (bId) {
                  localStorage.removeItem(`pmf_expecting_my_data_${bId}`);
                  localStorage.removeItem(`pmf_last_submission_${bId}`);
                }
              }}
            >
              {t("OK")}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
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

    /* Compact Overwrite Modal Styles */
    .pmf-overwrite-modal .modal-content {
      border-radius: 12px;
      border: none;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      width: 100%;
      margin: 0 auto;
    }
    
    @media (min-width: 576px) {
      .pmf-overwrite-modal .modal-dialog {
        max-width: 380px;
      }
    }

    /* Compact Overwrite Modal Styles */
.pmf-overwrite-modal .modal-dialog {
  max-width: 380px;
}

.pmf-overwrite-modal .modal-content {
  border-radius: 12px;
  border: none;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  overflow: hidden;
}

.pmf-overwrite-modal .modal-body {
  height: auto !important;
  min-height: unset !important;
}

.pmf-overwrite-modal .modal-header {
  padding-bottom: 0.5rem;
}

.pmf-overwrite-modal .modal-body p {
  margin-bottom: 0;
}
  `}</style>
);

export default PMFInsightsTab;
