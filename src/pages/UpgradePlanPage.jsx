import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Check, X, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import MenuBar from '../components/MenuBar';
import { useBusinessStore, useAuthStore } from '../store';
import '../styles/upgradePlan.css';

/* ─── Pilot Feedback Modal ─────────────────────────────────────── */
const PilotFeedbackModal = ({ plan, onClose, onAccept }) => {
  const allPlans = [
    { label: 'Explorer — $0 / Free forever', value: 'explorer' },
    { label: 'Pro — $245/mo · Founding Member', value: 'pro' },
    { label: 'Strategist — $495/mo · Founding Member', value: 'strategist' },
    { label: 'Custom — Get a quote', value: 'custom' },
  ];
  const [selectedPlan, setSelectedPlan] = useState(plan);
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const token = useAuthStore((state) => state.token);

  const handleAccept = async () => {
    if (rating === '') {
      setError('Please select a rating to continue.');
      return;
    }
    setError('');
    try {
      setIsSubmitting(true);
      const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
      
      const response = await fetch(`${baseUrl}/api/pilot-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: selectedPlan,
          rating,
          feedback: comment
        })
      });

      if (!response.ok) {
        console.error('Failed to submit pilot feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
      onAccept();
    }
  };

  return (
    <div className="pfm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pfm-modal">
        <button className="pfm-close" onClick={onClose} aria-label="Close"><X size={18} /></button>

        <div className="pfm-emoji">🎉</div>
        <h2 className="pfm-title">Thanks for joining the Traxxia pilot</h2>
        <p className="pfm-subtitle">
          You're part of an early group helping shape Traxxia. This is a preview experience — nothing is charged today.
        </p>

        <div className="pfm-field">
          <label className="pfm-label">The plan you chose <span style={{ color: '#e11d48' }}>*</span></label>
          <div className="pfm-select-wrapper">
            <select
              className="pfm-select"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              {allPlans.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <p className="pfm-change-hint">Changed your mind? Pick a different plan here.</p>
        </div>

        <div className="pfm-field">
          <label className="pfm-label">How likely are you to recommend Traxxia to a colleague? <span style={{ color: '#e11d48' }}>*</span></label>
          <div className="pfm-nps-row">
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <button
                key={n}
                className={`pfm-nps-btn ${rating === n ? 'active' : ''}`}
                onClick={() => { setRating(n); setError(''); }}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="pfm-nps-labels">
            <span>1 · Not likely</span>
            <span>Extremely likely · 10</span>
          </div>
        </div>

        <div className="pfm-field">
          <label className="pfm-label">Anything you'd like to share? <span className="pfm-optional">(optional)</span></label>
          <textarea
            className="pfm-textarea"
            rows={4}
            placeholder="What would make Traxxia a must-have for you?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <div className="pfm-notice">
          <Bell size={19} className="pfm-notice-icon" />
          <span>The moment the product is ready, we'll notify you so you can try it with the launch discount you were offered.</span>
        </div>

        {error && <div style={{ color: '#e11d48', fontSize: '14px', marginBottom: '16px', textAlign: 'center', fontWeight: '500' }}>{error}</div>}

        <button className="pfm-accept-btn" onClick={handleAccept} disabled={isSubmitting}>
          {isSubmitting ? 'Accepting...' : 'Accept'}
        </button>
      </div>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────── */
const UpgradePlanPage = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(null); // null | plan.id
  const { selectedBusiness } = useBusinessStore();
  const businessName = selectedBusiness?.business_name || "Business";

  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const appElement = document.querySelector('.App');
      if (appElement) appElement.scrollTop = 0;
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const plans = [
    {
      id: 'explorer',
      name: 'EXPLORER',
      priceMonthly: 0,
      priceAnnual: 0,
      subtitle: 'forever',
      description: 'Generate your strategy. Free, no expiration.',
      buttonText: 'Stay free',
      buttonVariant: 'outline',
      features: [
        { text: '1 admin user', bold: true },
        { text: '1 business profile' },
        { text: 'Basic insights (AHA, Where, How, Top 5)' },
        { text: 'Trax with limited conversations' },
        { text: 'PDF export' },
      ],
    },
    {
      id: 'pro',
      name: 'PRO',
      badge: 'RECOMMENDED',
      tagline: '• FOUNDING MEMBER · FIRST 20',
      priceMonthly: 245,
      priceAnnual: 225,
      originalPriceMonthly: 325,
      originalPriceAnnual: 298,
      discountText: 'Billed {billing} · {discount} discount',
      description: 'Advanced insights and execution for your leadership team.',
      buttonText: 'Choose Pro',
      buttonVariant: 'primary',
      features: [
        { text: 'Everything in Explorer, plus:' },
        { text: 'Up to 5 users', bold: true },
        { text: 'Advanced Insights (PESTEL, Porter, NPS, BCG)' },
        { text: 'Execution module with Strategic Bets and Cadences' },
        { text: 'Standard Trax allowance' },
      ],
    },
    {
      id: 'strategist',
      name: 'STRATEGIST',
      tagline: '• FOUNDING MEMBER · FIRST 20',
      priceMonthly: 495,
      priceAnnual: 454,
      originalPriceMonthly: 660,
      originalPriceAnnual: 605,
      discountText: 'Billed {billing} · {discount} discount',
      description: "To manage multiple businesses and keep the committee's strategic rhythm.",
      buttonText: 'Choose Strategist',
      buttonVariant: 'outline',
      features: [
        { text: 'Everything in Pro, plus:' },
        { text: 'Up to 15 users', bold: true },
        { text: 'Up to 3 businesses' },
        { text: 'High Trax allowance · unlimited regenerations' },
      ],
    },
    {
      id: 'custom',
      name: 'CUSTOM',
      isQuote: true,
      priceText: 'Get a quote',
      subtitle: 'Custom pricing',
      description: 'For enterprise groups and enterprise needs.',
      buttonText: 'Contact sales',
      buttonVariant: 'outline',
      features: [
        { text: 'Unlimited users' },
        { text: 'Multiple businesses' },
        { text: 'Custom token packs' },
        { text: 'SSO + enterprise security' },
        { text: 'Custom integrations' },
        { text: 'Assisted onboarding + dedicated CSM' },
      ],
    },
  ];

  return (
    <div className="upgrade-page-container">
      <div className="adv-sticky-header">
        <MenuBar />
        <div className="adv-header-bar">
          <div className="adv-breadcrumbs">
            <Link to="/dashboard" className="adv-breadcrumb-link">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <span className="adv-breadcrumb-separator">/</span>
            <span className="adv-breadcrumb-current px-2 py-1 bg-light rounded">{businessName}</span>
            <span className="adv-breadcrumb-separator">/</span>
            <span className="adv-breadcrumb-active fw-bold">Upgrade</span>
          </div>
        </div>
      </div>

      <div className="upgrade-content">

        <div className="upgrade-header">
          <div className="upgrade-badge">
            <Lock size={12} className="me-1" /> UPGRADE
          </div>
          <h1 className="upgrade-title">Choose your plan</h1>
          <p className="upgrade-subtitle">
            Unlock Advanced Insights and the Execution workspace — Strategic Bets, Cadences, owners, and AI-assisted reviews.
          </p>
        </div>

        <div className="upgrade-billing-toggle-container">
          <div className="upgrade-billing-toggle">
            <button 
              className={`toggle-btn ${!isAnnual ? 'active' : ''}`}
              onClick={() => setIsAnnual(false)}
            >
              MONTHLY
            </button>
            <button 
              className={`toggle-btn ${isAnnual ? 'active' : ''}`}
              onClick={() => setIsAnnual(true)}
            >
              ANNUAL <span className="toggle-badge">-1 MONTH</span>
            </button>
          </div>
        </div>

        <div className="pricing-cards-container">
          {plans.map((plan) => (
            <div key={plan.id} className={`pricing-card ${plan.id === 'pro' ? 'recommended' : ''}`}>
              {plan.badge && <div className="card-top-badge">{plan.badge}</div>}
              
              <div className="card-inner">
                <h3 className="plan-name">{plan.name}</h3>
                
                {plan.tagline && (
                  <div className="plan-tagline">
                    {plan.tagline}
                  </div>
                )}

                <div className="plan-pricing">
                  {plan.isQuote ? (
                    <div>
                      <div className="price-display quote-text">{plan.priceText}</div>
                      <div className="price-subtitle">{plan.subtitle}</div>
                    </div>
                  ) : plan.id === 'explorer' ? (
                    <div>
                      <div className="price-display">
                        <span className="currency">$</span>
                        <span className="amount">0</span>
                        <span className="period">{plan.subtitle}</span>
                      </div>
                      <div className="price-subtitle text-muted mt-2">No credit card</div>
                    </div>
                  ) : (
                    <div>
                      <div className="price-display">
                        <span className="original-price">${isAnnual ? plan.originalPriceAnnual : plan.originalPriceMonthly}</span>
                        <span className="currency">$</span>
                        <span className="amount">{isAnnual ? plan.priceAnnual : plan.priceMonthly}</span>
                        <span className="period">/mo</span>
                      </div>
                      <div className="price-subtitle">
                        {plan.discountText
                          .replace('{billing}', isAnnual ? 'annually' : 'monthly')
                          .replace('{discount}', isAnnual ? '1 month free · 25%' : '25% launch')}
                      </div>
                    </div>
                  )}
                </div>

                <div className="plan-description" style={{ whiteSpace: 'pre-line' }}>
                  {plan.description}
                </div>

                <div className="plan-features">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <Check size={14} className="feature-icon" strokeWidth={3} />
                      <span className={`feature-text ${feature.bold ? 'fw-bold text-dark' : ''}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="card-action">
                  <button
                    className={`plan-action-btn ${plan.buttonVariant}`}
                    onClick={() => setFeedbackModal(plan.id)}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Comparison Section */}
        <div className="comparison-section">
          <div className="comparison-header-wrapper">
            <div className="comparison-badge">FEATURE COMPARISON</div>
            <h2 className="comparison-title">Detailed comparison</h2>
            <p className="comparison-subtitle">Everything each plan includes — no fine print.</p>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="feature-col"></th>
                  <th className="plan-col">
                    <div className="plan-name">EXPLORER</div>
                    <div className="plan-price">$0</div>
                  </th>
                  <th className="plan-col pro-col">
                    <div className="plan-name text-blue">PRO</div>
                    <div className="plan-price text-blue">
                      <span className="strike-price">${isAnnual ? 298 : 325}</span> ${isAnnual ? 225 : 245} <span className="period">/mo</span>
                    </div>
                  </th>
                  <th className="plan-col">
                    <div className="plan-name">STRATEGIST</div>
                    <div className="plan-price">
                      <span className="strike-price">${isAnnual ? 605 : 660}</span> ${isAnnual ? 454 : 495} <span className="period">/mo</span>
                    </div>
                  </th>
                  <th className="plan-col">
                    <div className="plan-name">CUSTOM</div>
                    <div className="plan-price quote">Get a quote</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* CAPACITY */}
                <tr className="comparison-section-header">
                  <td className="section-title">CAPACITY</td>
                  <td>&nbsp;</td>
                  <td className="pro-col">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
                <tr>
                  <td>Included users</td>
                  <td>1</td>
                  <td className="pro-col">Up to 5</td>
                  <td>Up to 15</td>
                  <td>Custom</td>
                </tr>
                <tr>
                  <td>Businesses (workspaces)</td>
                  <td>1</td>
                  <td className="pro-col">1</td>
                  <td>Up to 3</td>
                  <td>Custom</td>
                </tr>

                {/* INSIGHTS */}
                <tr className="comparison-section-header">
                  <td className="section-title">INSIGHTS</td>
                  <td>&nbsp;</td>
                  <td className="pro-col">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
                <tr>
                  <td>Executive Summary (AHA, Where, How)</td>
                  <td><span className="feature-check">✓</span></td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>
                <tr>
                  <td>Top 5 strategic priorities</td>
                  <td><span className="feature-check">✓</span></td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>
                <tr>
                  <td><span className="notranslate">S.T.R.A.T.E.G.I.C.</span> diagnostic</td>
                  <td><span className="feature-check">✓</span></td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>
                <tr>
                  <td>Basic SWOT</td>
                  <td><span className="feature-check">✓</span></td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>
                <tr>
                  <td>PESTEL Analysis</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>
                <tr>
                  <td>Porter's Five Forces</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>
                <tr>
                  <td>NPS & Customer Journey</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>
                <tr>
                  <td>BCG Matrix</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>
                <tr>
                  <td>Insights History (archived snapshots)</td>
                  <td>Current version</td>
                  <td className="pro-col">Full</td>
                  <td>Full</td>
                  <td>Full</td>
                </tr>
                <tr>
                  <td>PDF export</td>
                  <td><span className="feature-check">✓</span></td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>

                {/* EXECUTION */}
                <tr className="comparison-section-header">
                  <td className="section-title">EXECUTION</td>
                  <td>&nbsp;</td>
                  <td className="pro-col">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
                <tr>
                  <td>Strategic Bets with owners</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>
                <tr>
                  <td>Cadences (MBR, QBR, Annual Planning, Daily Briefing)</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>
                <tr>
                  <td>AI-assisted review</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>
                <tr>
                  <td>Progress history</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                  <td><span className="feature-check">✓</span></td>
                </tr>

                {/* COLLABORATION & SUPPORT */}
                <tr className="comparison-section-header">
                  <td className="section-title">COLLABORATION & SUPPORT</td>
                  <td>&nbsp;</td>
                  <td className="pro-col">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
                <tr>
                  <td>Chat iteration with Trax</td>
                  <td>To try</td>
                  <td className="pro-col">Regular use</td>
                  <td>Heavy use</td>
                  <td>Pay as you go</td>
                </tr>
                <tr>
                  <td>Dedicated CSM</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col feature-dash">—</td>
                  <td className="feature-dash">—</td>
                  <td><span className="check">✓</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="comparison-footer-text">
            The free tier gives you something you can copy into a deck. The paid tier gives you something the deck can't replace — an accountable cadence.
          </div>
        </div>

      </div>

      {feedbackModal && (
        <PilotFeedbackModal
          plan={feedbackModal}
          onClose={() => setFeedbackModal(null)}
          onAccept={() => navigate('/dashboard')}
        />
      )}
    </div>
  );
};

export default UpgradePlanPage;
