import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Lock, Globe, Swords, BarChart2, Map, LayoutGrid, Target, FileDown } from 'lucide-react';
import MenuBar from '../components/MenuBar';
import { useBusinessStore } from '../store';
import { useUIStore } from '../store/uiStore';
import '../styles/advancedInsights.css';

const AdvancedInsightsPage = () => {
  const navigate = useNavigate();
  const { businessId } = useParams();
  
  const { selectedBusiness } = useBusinessStore();
  const addToast = useUIStore(state => state.addToast);
  
  // Use actual business name from store
  const businessName = selectedBusiness?.business_name || "Business"; 

  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="adv-insights-container">
      <div className="adv-sticky-header">
        <MenuBar />
        {/* Top Header / Breadcrumbs */}
        <div className="adv-header-bar">
        <div className="adv-breadcrumbs">
          <Link to="/dashboard" className="adv-breadcrumb-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <span className="adv-breadcrumb-separator">/</span>
          <span className="adv-breadcrumb-current px-2 py-1 bg-light rounded">{businessName}</span>
          <span className="adv-breadcrumb-separator">/</span>
          <span className="adv-breadcrumb-active fw-bold">Insights</span>
        </div>

      </div>
      </div>

      <div className="adv-content-wrapper">
        <button className="adv-back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back to Basic diagnosis
        </button>

        {/* Hero Card */}
        <div className="adv-hero-card">
          <div className="adv-badge">
            <span className="ms-1" style={{ fontSize: '13px' }}>🔒</span> ADVANCED INSIGHTS · PRO
          </div>
          <h1 className="adv-hero-title">Behind every priority, a framework.</h1>
          <p className="adv-hero-subtitle">
            Your Basic Summary tells you <i>what</i>. Advanced Insights tell you <i>why</i>. PESTEL for the macro context,
            Porter's Five Forces for the competitive dynamics, NPS analysis to validate the differentiation Trax
            inferred. Unlock to see the full reasoning.
          </p>
        </div>

        {/* PESTEL Analysis Card */}
        <div className="adv-framework-card">
          <div className="adv-framework-header">
            <div className="adv-framework-icon adv-icon-blue">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="adv-framework-title">PESTEL Analysis</h3>
              <p className="adv-framework-subtitle">Political, Economic, Social, Technological, Environmental, Legal</p>
            </div>
          </div>
          <div className="adv-framework-body adv-locked-container">
            <div className="adv-blurred-content">
              <div className="adv-mock-section">
                <div className="adv-mock-avatar">P</div>
                <div className="adv-mock-text">
                  <h4 className="text-uppercase text-secondary" style={{fontSize: '11px', letterSpacing: '1px'}}>Political</h4>
                  <p className="text-muted" style={{fontSize: '13px'}}>FDA's 2026 front-of-pack labeling rule directly affects "clean ingredient" claims. Your premium positioning is currently unregulated — that protection ends in 14 months. Three implications follow...</p>
                </div>
              </div>
              <div className="adv-mock-section">
                <div className="adv-mock-avatar bg-light text-transparent">E</div>
                <div className="adv-mock-text">
                  <div className="adv-mock-line w-75"></div>
                  <div className="adv-mock-line w-100"></div>
                  <div className="adv-mock-line w-50"></div>
                </div>
              </div>
              <div className="adv-mock-section">
                <div className="adv-mock-avatar bg-light text-transparent">S</div>
                <div className="adv-mock-text">
                  <div className="adv-mock-line w-50"></div>
                  <div className="adv-mock-line w-75"></div>
                </div>
              </div>
            </div>
            <div className="adv-lock-overlay">
              <div className="adv-lock-box">
                <span className="ms-1" style={{ fontSize: '20px' }}>🔒</span>
                <h3 className="adv-lock-title">Unlock PESTEL and 4 more frameworks</h3>
                <p className="adv-lock-desc">Full PESTEL · Porter's Five Forces · NPS Analysis · Competitive Positioning<br/>Map · BCG Matrix</p>
                <button className="adv-upgrade-btn" onClick={() => navigate('/upgrade')}>Upgrade to Pro &rarr;</button>
              </div>
            </div>
          </div>
        </div>

        {/* Porter's Five Forces Card */}
        <div className="adv-framework-card">
          <div className="adv-framework-header">
            <div className="adv-framework-icon adv-icon-grey">
              <Swords size={20} />
            </div>
            <div>
              <h3 className="adv-framework-title">Porter's Five Forces</h3>
              <p className="adv-framework-subtitle">Competitive dynamics in CPG snacks</p>
            </div>
          </div>
          <div className="adv-framework-body adv-locked-container">
            <div className="adv-blurred-content d-flex gap-3">
              <div className="adv-mock-box flex-1">
                <p className="text-uppercase text-secondary mb-1" style={{fontSize: '10px', letterSpacing: '1px'}}>New Entrants</p>
                <h4 className="text-primary mb-2">High</h4>
                <p className="text-muted" style={{fontSize: '12px'}}>Low capital intensity, established co-manufacturing infrastructure, and DTC channels have collapsed time-to-market from 18 to 6 months...</p>
              </div>
              <div className="adv-mock-box flex-1">
                <p className="text-uppercase text-secondary mb-1" style={{fontSize: '10px', letterSpacing: '1px'}}>Substitutes</p>
                <h4 className="text-primary mb-2">Medium</h4>
                <div className="adv-mock-line w-100"></div>
                <div className="adv-mock-line w-75"></div>
              </div>
            </div>
            <div className="adv-lock-overlay">
              <div className="adv-lock-box">
                <span className="ms-1" style={{ fontSize: '20px' }}>🔒</span>
                <h3 className="adv-lock-title">See the full competitive picture</h3>
                <p className="adv-lock-desc">All five forces scored, sourced, and tied back to your Top 5 Priorities</p>
                <button className="adv-upgrade-btn" onClick={() => navigate('/upgrade')}>Upgrade to Pro &rarr;</button>
              </div>
            </div>
          </div>
        </div>

        {/* Also Included Grid */}
        <div className="adv-included-section">
          <h4 className="adv-included-title">ALSO INCLUDED WITH PRO</h4>
          <div className="adv-grid-container">
            <div className="adv-grid-card">
              <div className="adv-grid-icon"><BarChart2 size={18} /></div>
              <div>
                <h5>NPS & Customer Voice Analysis</h5>
                <p>Validate the differentiation Trax inferred against actual customer signal.</p>
              </div>
            </div>
            <div className="adv-grid-card">
              <div className="adv-grid-icon"><Map size={18} /></div>
              <div>
                <h5>Competitive Positioning Map</h5>
                <p>Where Atlas sits versus the eight closest competitors on price, quality, and channel.</p>
              </div>
            </div>
            <div className="adv-grid-card">
              <div className="adv-grid-icon"><LayoutGrid size={18} /></div>
              <div>
                <h5>BCG Growth-Share Matrix</h5>
                <p>SKU-level portfolio analysis: stars, cash cows, question marks, dogs.</p>
              </div>
            </div>
            <div className="adv-grid-card">
              <div className="adv-grid-icon"><Target size={18} /></div>
              <div>
                <h5><span className="notranslate">S.T.R.A.T.E.G.I.C.</span> Scorecard</h5>
                <p>Our proprietary framework — the spine of every Bet you'll commit to.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdvancedInsightsPage;
