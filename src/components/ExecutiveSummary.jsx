import React, { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Info, Target, FileText, ListChecks, Circle, Star } from "lucide-react";
import "../styles/executiveSummary.css";

const ExecutiveSummary = () => {
  const [expandedSections, setExpandedSections] = useState({
    whereToCompete: true,
    howToCompete: true,
    topPriorities: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="exc-executive-summary-container">
      <div className="exc-executive-content">
        <div className="exc-section-card">
          <div
            className="exc-section-header"
            onClick={() => toggleSection("whereToCompete")}
          >
            <div className="exc-section-title-wrapper">
              <div className="exc-section-icon exc-where-icon">
                <Target size={20} />
              </div>
              <div>
                <h3 className="exc-section-title">WHERE TO COMPETE</h3>
                <p className="exc-section-subtitle">
                  Current Core, Existing Adjacencies, and New Adjacencies to Explore
                </p>
              </div>
            </div>
            <button className="exc-section-toggle">
              {expandedSections.whereToCompete ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>

          {expandedSections.whereToCompete && (
            <div className="exc-section-body">
              <div className="exc-subsection exc-current-core">
                <div className="exc-subsection-icon exc-blue">
                  <Target size={18} />
                </div>
                <div className="exc-subsection-body">
                  <h3 className="exc-subsection-title">Current Core</h3>
                  <p className="exc-source-label">
                    <Info size={14} /> Profit arenas inferred from Q5
                  </p>
                  <p className="exc-content-text"><b>Segments:</b> dfg</p>
                </div>
              </div>

              <div className="exc-subsection exc-existing-adjacencies">
                <div className="exc-subsection-icon exc-orange">
                  <FileText size={18} />
                </div>
                <div className="exc-subsection-body">
                  <h3 className="exc-subsection-title">Existing Adjacencies</h3>
                  <p className="exc-source-label exc-orange-text">
                    <Info size={14} /> AI-inferred from your core business data
                  </p>
                  <p className="exc-content-text exc-italic">No existing adjacencies inferred. Business appears focused on core.</p>
                </div>
              </div>

              <div className="exc-subsection exc-new-adjacencies">
                <div className="exc-subsection-icon exc-green">
                  <ListChecks size={18} />
                </div>
                <div className="exc-subsection-body">
                  <h3 className="exc-subsection-title">New Adjacencies to Explore</h3>
                  <p className="exc-source-label exc-green-text">
                    <Info size={14} /> AI-recommended based on industry and core business
                  </p>
                  <div className="exc-option-block">
                    <p className="exc-option-title"><strong>Option 1</strong></p>
                    <p className="exc-content-text"><strong>Segments:</strong> Adjacent to dfg</p>
                    <p className="exc-content-text"><strong>Products:</strong> Complementary products, Value-added services</p>
                    <p className="exc-content-text"><strong>Channels:</strong> Multi-channel</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="exc-section-card">
          <div
            className="exc-section-header"
            onClick={() => toggleSection("howToCompete")}
          >
            <div className="exc-section-title-wrapper">
              <div className="exc-section-icon exc-how-icon">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="exc-section-title">HOW TO COMPETE</h3>
                <p className="exc-section-subtitle">
                  Differentiation strategy and what to focus on or exclude
                </p>
              </div>
            </div>
            <button className="exc-section-toggle">
              {expandedSections.howToCompete ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>

          {expandedSections.howToCompete && (
            <div className="exc-section-body">
              <div className="exc-how-compete-box">
                <p className="exc-box-title">This is how you should differentiate:</p>
                
                <div className="exc-differentiation-section">
                  <p className="exc-differentiation-label">Recommended differentiation levers (from Q8)</p>
                  <p className="exc-differentiation-text"><strong>Relationships / trust + Speed / responsiveness</strong></p>
                </div>

                <div className="exc-implications-section">
                  <div className="exc-implication-item exc-includes">
                    <div className="exc-icon-label">
                      <CheckCircle2 size={16} />
                      <span>What this implies:</span>
                    </div>
                    <p className="exc-implication-text">Focus all resources, messaging, and operations on excelling at relationships / trust speed / responsiveness</p>
                  </div>

                  <div className="exc-implication-item exc-excludes">
                    <div className="exc-icon-label">
                      <AlertCircle size={16} />
                      <span>What this excludes:</span>
                    </div>
                    <p className="exc-implication-text">Competing primarily on price or quality / expertise</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="exc-section-card">
          <div
            className="exc-section-header"
            onClick={() => toggleSection("topPriorities")}
          >
            <div className="exc-section-title-wrapper">
              <div className="exc-section-icon exc-priorities-icon">
                <ListChecks size={20} />
              </div>
              <div>
                <h3 className="exc-section-title">TOP 3-5 PRIORITIES</h3>
                <p className="exc-section-subtitle">
                  Exactly 3-5 priorities • Priorities = workstreams • Each implies exclusion
                </p>
              </div>
            </div>
            <button className="exc-section-toggle">
              {expandedSections.topPriorities ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>

          {expandedSections.topPriorities && (
            <div className="exc-section-body">
              <div className="exc-priority-item">
                <div className="exc-priority-header">
                  <span className="exc-priority-number">1.</span>
                  <h4 className="exc-priority-title">Strengthen core differentiation</h4>
                </div>
                <div className="exc-priority-actions">
                  <div className="exc-action-item">
                    <CheckCircle2 size={16} />
                    <span>Align all operations and marketing to reinforce Relationships / trust</span>
                  </div>
                  <div className="exc-action-item">
                    <CheckCircle2 size={16} />
                    <span>Develop brand positioning that clearly communicates core differentiator</span>
                  </div>
                  <div className="exc-action-item">
                    <CheckCircle2 size={16} />
                    <span>Train team on delivering consistent differentiated experience</span>
                  </div>
                </div>
              </div>

              <div className="exc-priority-item">
                <div className="exc-priority-header">
                  <span className="exc-priority-number">2.</span>
                  <h4 className="exc-priority-title">Optimize profit pool concentration</h4>
                </div>
                <div className="exc-priority-actions">
                  <div className="exc-action-item">
                    <CheckCircle2 size={16} />
                    <span>Double down on highest-margin customer segments and products</span>
                  </div>
                  <div className="exc-action-item">
                    <CheckCircle2 size={16} />
                    <span>Implement tiered pricing strategy for premium segments</span>
                  </div>
                  <div className="exc-action-item">
                    <CheckCircle2 size={16} />
                    <span>Analyze and phase out unprofitable customer relationships</span>
                  </div>
                </div>
              </div>

              <div className="exc-priority-item">
                <div className="exc-priority-header">
                  <span className="exc-priority-number">3.</span>
                  <h4 className="exc-priority-title">Evaluate and rationalize adjacencies</h4>
                </div>
                <div className="exc-priority-actions">
                  <div className="exc-action-item">
                    <CheckCircle2 size={16} />
                    <span>Exit low-ROI adjacencies, scale what reinforces the core</span>
                  </div>
                  <div className="exc-action-item">
                    <CheckCircle2 size={16} />
                    <span>Conduct ROI analysis on all adjacent business lines</span>
                  </div>
                  <div className="exc-action-item">
                    <CheckCircle2 size={16} />
                    <span>Develop exit strategy for underperforming initiatives</span>
                  </div>
                </div>
              </div>

              <div className="exc-priority-item">
                <div className="exc-priority-header">
                  <span className="exc-priority-number">4.</span>
                  <h4 className="exc-priority-title">Address primary constraint</h4>
                </div>
                <div className="exc-priority-actions">
                  <div className="exc-action-item">
                    <CheckCircle2 size={16} />
                    <span>Tackle execution slippage</span>
                  </div>
                  <div className="exc-action-item">
                    <CheckCircle2 size={16} />
                    <span>Establish metrics and monitoring system for constraint resolution</span>
                  </div>
                  <div className="exc-action-item">
                    <CheckCircle2 size={16} />
                    <span>Allocate dedicated resources to resolve primary bottleneck</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;