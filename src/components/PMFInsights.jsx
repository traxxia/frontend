import React from "react";
import '../styles/PMFInsights.css';

const PMFInsights = ({ onContinue }) => {
  return (
    <div className="pmf-insights-wrapper">
      <div className="pmf-insights-header">
        <span className="badge">✨ AHA Insights</span>
        <h2>Here's what we discovered</h2>
        <p>
          Based on your inputs, here are four critical insights about your
          strategic position.
        </p>
      </div>

      <div className="pmf-insights-grid">
        {/* Card 1 */}
        <div className="insight-card">
          <div className="card-header">
            <span className="icon">📈</span>
            <span className="confidence medium">Confidence: Medium</span>
          </div>
          <h4>
            In Payments / Fintech in your market, value concentrates in a few
            profit pools.
          </h4>
          <ul>
            <li>Market size typically ranges from $500M–$5B</li>
            <li>Operating margins concentrate between 8–15%</li>
            <li>Scale and regulatory compliance are key variables</li>
            <li>Digital transformation is a major trend</li>
          </ul>
        </div>

        {/* Card 2 */}
        <div className="insight-card">
          <div className="card-header">
            <span className="icon">🎯</span>
            <span className="confidence high">Confidence: High</span>
          </div>
          <h4>Your core is focused and economically coherent.</h4>
          <ul>
            <li>Value concentrates where focus is sustained.</li>
          </ul>
        </div>

        {/* Card 3 */}
        <div className="insight-card">
          <div className="card-header">
            <span className="icon">🧩</span>
            <span className="confidence medium">Confidence: Medium</span>
          </div>
          <h4>Your adjacencies vary widely in their fit with the core.</h4>
          <ul>
            <li>
              The question is not whether to expand, but where expansion
              reinforces the core.
            </li>
          </ul>
        </div>

        {/* Card 4 */}
        <div className="insight-card">
          <div className="card-header">
            <span className="icon">⚠️</span>
            <span className="confidence high">Confidence: High</span>
          </div>
          <h4>You are trying to enter a new market while constrained.</h4>
          <ul>
            <li>
              This usually requires sharper choices, not more initiatives.
            </li>
          </ul>
        </div>
      </div>

      <div className="pmf-insights-footer">
        <button className="continue-btn" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default PMFInsights;
