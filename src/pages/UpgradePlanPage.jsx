import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import MenuBar from '../components/MenuBar';
import { useBusinessStore } from '../store';
import '../styles/upgradePlan.css';

const UpgradePlanPage = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const { selectedBusiness } = useBusinessStore();
  const businessName = selectedBusiness?.business_name || "Business";

  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 0);
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
      tagline: 'FOUNDING MEMBER - FIRST 20',
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
      tagline: 'FOUNDING MEMBER - FIRST 20',
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

        <div className="pricing-cards-container">
          {plans.map((plan) => (
            <div key={plan.id} className={`pricing-card ${plan.id === 'pro' ? 'recommended' : ''}`}>
              {plan.badge && <div className="card-top-badge">{plan.badge}</div>}
              
              <div className="card-inner">
                <h3 className="plan-name">{plan.name}</h3>
                
                {plan.tagline && (
                  <div className="plan-tagline">
                    <span className="dot"></span> {plan.tagline}
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
                  <button className={`plan-action-btn ${plan.buttonVariant}`}>
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
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                </tr>
                <tr>
                  <td>Top 5 strategic priorities</td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                </tr>
                <tr>
                  <td>S.T.R.A.T.E.G.I.C. diagnostic</td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                </tr>
                <tr>
                  <td>Basic SWOT</td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                </tr>
                <tr>
                  <td>PESTEL Analysis</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                </tr>
                <tr>
                  <td>Porter's Five Forces</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                </tr>
                <tr>
                  <td>NPS & Customer Journey</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                </tr>
                <tr>
                  <td>BCG Matrix</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
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
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
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
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                </tr>
                <tr>
                  <td>Cadences (MBR, QBR, Annual Planning, Daily Briefing)</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                </tr>
                <tr>
                  <td>AI-assisted review</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                </tr>
                <tr>
                  <td>Progress history</td>
                  <td className="feature-dash">—</td>
                  <td className="pro-col"><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
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
                  <td><Check size={16} className="feature-check" strokeWidth={3} /></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="comparison-footer-text">
            The free tier gives you something you can copy into a deck. The paid tier gives you something the deck can't replace — an accountable cadence.
          </div>
        </div>

      </div>
    </div>
  );
};

export default UpgradePlanPage;
