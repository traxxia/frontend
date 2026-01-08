import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

const PortfolioOverview = ({ portfolioData }) => {
  const { t } = useTranslation();

  return (
    <Card className="portfolio-card shadow-sm">
      <h5 className="portfolio-title fw-bold mb-4">{t("Portfolio_Overview")}</h5>

      <Row>
        <Col md={3}>
          <div className="portfolio-box">
            <p className="portfolio-label">{t("Total_Projects")}</p>
            <h3 className="fw-bold">{portfolioData.totalProjects}</h3>
          </div>
        </Col>

        <Col md={3}>
          <div className="portfolio-box">
            <p className="portfolio-label">{t("Impact_Distribution")}</p>
            <div className="impact-row">
              <div className="impact-item">
                <span className="impact-dot green"></span>
                <span>{portfolioData.impactDistribution.green}</span>
              </div>
              <div className="impact-item">
                <span className="impact-dot orange"></span>
                <span>{portfolioData.impactDistribution.orange}</span>
              </div>
              <div className="impact-item">
                <span className="impact-dot blue"></span>
                <span>{portfolioData.impactDistribution.blue}</span>
              </div>
            </div>
          </div>
        </Col>

        <Col md={3}>
          <div className="portfolio-box">
            <p className="portfolio-label">{t("Risk_Balance")}</p>
            <div className="risk-row">
              <div className="risk-item">
                <AlertTriangle size={18} color="#ff3b30" />
                <span>{portfolioData.riskBalance.high}</span>
              </div>
              <div className="risk-item">
                <AlertCircle size={18} color="#ff9500" />
                <span>{portfolioData.riskBalance.medium}</span>
              </div>
              <div className="risk-item">
                <CheckCircle size={18} color="#34c759" />
                <span>{portfolioData.riskBalance.low}</span>
              </div>
            </div>
          </div>
        </Col>

        <Col md={3}>
          <div className="portfolio-box">
            <p className="portfolio-label">{t("Completed_Details")}</p>
            <h3 className="fw-bold">{portfolioData.completedDetails}</h3>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default PortfolioOverview;