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
    <div className="executive-summary-container">
      {/* Content Sections */}
      <div className="executive-content">
        {/* WHERE TO COMPETE */}
        <div className="section-card">
          <div
            className="section-header"
            onClick={() => toggleSection("whereToCompete")}
          >
            <div className="section-title-wrapper">
              <div className="section-icon where-icon">
                <Target size={20} />
              </div>
              <div>
                <h2 className="section-title">WHERE TO COMPETE</h2>
                <p className="section-subtitle">
                  Current Core, Existing Adjacencies, and New Adjacencies to Explore
                </p>
              </div>
            </div>
            <button className="section-toggle">
              {expandedSections.whereToCompete ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>

          {expandedSections.whereToCompete && (
            <div className="section-body">
              {/* Current Core */}
              <div className="subsection current-core">
                <div className="subsection-header">
                  <div className="subsection-icon blue">
                    <Circle size={14} fill="currentColor" />
                  </div>
                  <h3 className="subsection-title">Current Core</h3>
                </div>
                <div className="subsection-content">
                  <p className="source-label">
                    <Info size={14} /> Profit arenas inferred from Q5
                  </p>
                  <p className="content-text"><strong>Segments:</strong> dfg</p>
                </div>
              </div>

              {/* Existing Adjacencies */}
              <div className="subsection existing-adjacencies">
                <div className="subsection-header">
                  <div className="subsection-icon orange">
                    <Star size={14} fill="currentColor" />
                  </div>
                  <h3 className="subsection-title">Existing Adjacencies</h3>
                </div>
                <div className="subsection-content">
                  <p className="source-label orange-text">
                    <Info size={14} /> AI-inferred from your core business data
                  </p>
                  <p className="content-text italic">No existing adjacencies inferred. Business appears focused on core.</p>
                </div>
              </div>

              {/* New Adjacencies to Explore */}
              <div className="subsection new-adjacencies">
                <div className="subsection-header">
                  <div className="subsection-icon green">
                    <Star size={14} fill="currentColor" />
                  </div>
                  <h3 className="subsection-title">New Adjacencies to Explore</h3>
                </div>
                <div className="subsection-content">
                  <p className="source-label green-text">
                    <Info size={14} /> AI-recommended based on industry and core business
                  </p>
                  <div className="option-block">
                    <p className="option-title"><strong>Option 1</strong></p>
                    <p className="content-text"><strong>Segments:</strong> Adjacent to dfg</p>
                    <p className="content-text"><strong>Products:</strong> Complementary products, Value-added services</p>
                    <p className="content-text"><strong>Channels:</strong> Multi-channel</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HOW TO COMPETE */}
        <div className="section-card">
          <div
            className="section-header"
            onClick={() => toggleSection("howToCompete")}
          >
            <div className="section-title-wrapper">
              <div className="section-icon how-icon">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="section-title">HOW TO COMPETE</h2>
                <p className="section-subtitle">
                  Differentiation strategy and what to focus on or exclude
                </p>
              </div>
            </div>
            <button className="section-toggle">
              {expandedSections.howToCompete ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>

          {expandedSections.howToCompete && (
            <div className="section-body">
              <div className="how-compete-box">
                <p className="box-title">This is how you should differentiate:</p>
                
                <div className="differentiation-section">
                  <p className="differentiation-label">Recommended differentiation levers (from Q8)</p>
                  <p className="differentiation-text"><strong>Relationships / trust + Speed / responsiveness</strong></p>
                </div>

                <div className="implications-section">
                  <div className="implication-item includes">
                    <div className="icon-label">
                      <CheckCircle2 size={16} />
                      <span>What this implies:</span>
                    </div>
                    <p className="implication-text">Focus all resources, messaging, and operations on excelling at relationships / trust speed / responsiveness</p>
                  </div>

                  <div className="implication-item excludes">
                    <div className="icon-label">
                      <AlertCircle size={16} />
                      <span>What this excludes:</span>
                    </div>
                    <p className="implication-text">Competing primarily on price or quality / expertise</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TOP 3-5 PRIORITIES */}
        <div className="section-card">
          <div
            className="section-header"
            onClick={() => toggleSection("topPriorities")}
          >
            <div className="section-title-wrapper">
              <div className="section-icon priorities-icon">
                <ListChecks size={20} />
              </div>
              <div>
                <h2 className="section-title">TOP 3-5 PRIORITIES</h2>
                <p className="section-subtitle">
                  Exactly 3-5 priorities • Priorities = workstreams • Each implies exclusion
                </p>
              </div>
            </div>
            <button className="section-toggle">
              {expandedSections.topPriorities ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>

          {expandedSections.topPriorities && (
            <div className="section-body">
              {/* Priority 1 */}
              <div className="priority-item">
                <div className="priority-header">
                  <span className="priority-number">1.</span>
                  <h4 className="priority-title">Strengthen core differentiation</h4>
                </div>
                <div className="priority-actions">
                  <div className="action-item">
                    <CheckCircle2 size={16} />
                    <span>Align all operations and marketing to reinforce Relationships / trust</span>
                  </div>
                  <div className="action-item">
                    <CheckCircle2 size={16} />
                    <span>Develop brand positioning that clearly communicates core differentiator</span>
                  </div>
                  <div className="action-item">
                    <CheckCircle2 size={16} />
                    <span>Train team on delivering consistent differentiated experience</span>
                  </div>
                </div>
              </div>

              {/* Priority 2 */}
              <div className="priority-item">
                <div className="priority-header">
                  <span className="priority-number">2.</span>
                  <h4 className="priority-title">Optimize profit pool concentration</h4>
                </div>
                <div className="priority-actions">
                  <div className="action-item">
                    <CheckCircle2 size={16} />
                    <span>Double down on highest-margin customer segments and products</span>
                  </div>
                  <div className="action-item">
                    <CheckCircle2 size={16} />
                    <span>Implement tiered pricing strategy for premium segments</span>
                  </div>
                  <div className="action-item">
                    <CheckCircle2 size={16} />
                    <span>Analyze and phase out unprofitable customer relationships</span>
                  </div>
                </div>
              </div>

              {/* Priority 3 */}
              <div className="priority-item">
                <div className="priority-header">
                  <span className="priority-number">3.</span>
                  <h4 className="priority-title">Evaluate and rationalize adjacencies</h4>
                </div>
                <div className="priority-actions">
                  <div className="action-item">
                    <CheckCircle2 size={16} />
                    <span>Exit low-ROI adjacencies, scale what reinforces the core</span>
                  </div>
                  <div className="action-item">
                    <CheckCircle2 size={16} />
                    <span>Conduct ROI analysis on all adjacent business lines</span>
                  </div>
                  <div className="action-item">
                    <CheckCircle2 size={16} />
                    <span>Develop exit strategy for underperforming initiatives</span>
                  </div>
                </div>
              </div>

              {/* Priority 4 */}
              <div className="priority-item">
                <div className="priority-header">
                  <span className="priority-number">4.</span>
                  <h4 className="priority-title">Address primary constraint</h4>
                </div>
                <div className="priority-actions">
                  <div className="action-item">
                    <CheckCircle2 size={16} />
                    <span>Tackle execution slippage</span>
                  </div>
                  <div className="action-item">
                    <CheckCircle2 size={16} />
                    <span>Establish metrics and monitoring system for constraint resolution</span>
                  </div>
                  <div className="action-item">
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
