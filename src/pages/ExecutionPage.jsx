import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Lock, ArrowRight } from 'lucide-react';
import MenuBar from '../components/MenuBar';
import { useBusinessStore } from '../store';
import '../styles/execution.css';

const ExecutionPage = () => {
  const navigate = useNavigate();
  const { businessId } = useParams();
  const { selectedBusiness } = useBusinessStore();
  const businessName = selectedBusiness?.business_name || "Business";

  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="execution-page-container">
      <div className="adv-sticky-header">
        <MenuBar />
        
        {/* Secondary Header */}
        <div className="adv-header-bar">
          <div className="adv-breadcrumbs">
            <Link to="/dashboard" className="adv-breadcrumb-link">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <span className="adv-breadcrumb-separator">/</span>
            <span className="adv-breadcrumb-current px-2 py-1 bg-light rounded">{businessName}</span>
            <span className="adv-breadcrumb-separator">/</span>
            <span className="adv-breadcrumb-active fw-bold">Execution</span>
          </div>
          
          {/* Segmented Toggle (Mock) */}
          <div className="execution-segmented-toggle">
            <div className="toggle-option active">Bets</div>
            <div className="toggle-option">Cadences</div>
          </div>
        </div>
      </div>

      <div className="execution-content-wrapper">
        
        <div className="execution-hero text-center">
          <div className="execution-badge">
            <Lock size={12} className="me-1 icon-gold" /> EXECUTION · PAID TIER
          </div>
          <h1 className="execution-title">
            A draft on a slide is not a <span className="text-blue">strategy.</span>
          </h1>
          <p className="execution-subtitle">
            You've got priorities you trust. Execution turns each one into a tracked bet — owner, 
            health, hypothesis, and a review cadence. The part most companies never do, which 
            is why most strategies never land.
          </p>
        </div>

        <div className="execution-workspace-container">
          
          <div className="execution-columns d-flex gap-4">
            
            {/* Strategic Bets Column */}
            <div className="execution-column flex-1">
              <h4 className="column-header">STRATEGIC BETS</h4>
              
              <div className="blurred-content">
                <div className="mock-card">
                  <h5>#1 · Concentrate on the mid-market segment</h5>
                  <p>Decider: Sarah Chen, CMO · Continue if: pipeline +15% QoQ</p>
                  <p>Learning: Testing · Reviewed at MBR - Jun 2026</p>
                </div>
                <div className="mock-card">
                  <h5>#2 · Productize the implementation service</h5>
                  <p>Decider: Marcus Lee, COO · Stop if: NPS drops below 40</p>
                  <p>Learning: Validated · Reviewed at MBR - Jun 2026</p>
                </div>
                <div className="mock-card mock-opacity-low">
                  <div className="mock-line w-75 mb-2"></div>
                  <div className="mock-line w-50 mb-2"></div>
                  <div className="mock-line w-25"></div>
                </div>
              </div>
            </div>

            {/* Cadences Column */}
            <div className="execution-column flex-1">
              <h4 className="column-header">CADENCES</h4>
              
              <div className="blurred-content">
                <div className="mock-card">
                  <h5>MBR - Jun 2026</h5>
                  <p>In 14 days · 3 bets on the agenda</p>
                  <p>Audience: CEO, CMO, COO</p>
                </div>
                <div className="mock-card mock-opacity-low">
                  <div className="mock-line w-50 mb-2"></div>
                  <div className="mock-line w-75 mb-2"></div>
                </div>
                <div className="mock-card mock-opacity-lowest">
                  <div className="mock-line w-25 mb-2"></div>
                  <div className="mock-line w-50"></div>
                </div>
              </div>
            </div>

          </div>

          {/* Center Paywall Overlay */}
          <div className="execution-paywall-overlay">
            <div className="execution-paywall-box">
              <div className="lock-icon-container">
                <Lock size={24} color="#fff" />
              </div>
              <h3 className="paywall-title">Your live execution workspace</h3>
              <p className="paywall-desc">
                Strategic Bets, Cadences, owners, and AI-assisted reviews — unlock to make your strategy operational.
              </p>
              <button className="paywall-upgrade-btn" onClick={() => navigate('/upgrade')}>
                See plans & upgrade <ArrowRight size={16} className="ms-1" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExecutionPage;
