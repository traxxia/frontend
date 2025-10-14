// Updated PhaseTabsComponent.jsx with Good phase support
import React from 'react';
import { ChevronDown } from "lucide-react";
import PDFExportButton from "./PDFExportButton";

const PhaseTabsComponent = ({
  phaseManager,
  selectedPhase,
  setSelectedPhase,
  showDropdown,
  setShowDropdown,
  dropdownRef,
  handleOptionClick,
  businessData,
  showToastMessage,
  isAnalysisRegenerating,
  isChannelHeatmapReady,
  isCapabilityHeatmapReady,
  t
}) => {
  const getAvailablePhases = () => {
    const unlockedFeatures = phaseManager.getUnlockedFeatures();
    const phases = [];

    // Always show initial phase if analysis is unlocked
    if (unlockedFeatures.analysis) {
      phases.push({
        key: 'initial',
        name: 'Initial Phase',
        unlocked: true
      });
    }

    // Only show essential phase if it's actually unlocked
    if (unlockedFeatures.fullSwot) {
      phases.push({
        key: 'essential',
        name: 'Essential Phase',
        unlocked: true
      });
    }

    // Only show good phase if it's actually unlocked
    if (unlockedFeatures.goodPhase) {
      phases.push({
        key: 'good',
        name: 'Good Phase',
        unlocked: true
      });
    }

    return phases;
  };

  const getPhaseSpecificOptions = (phase) => {
    const baseOptions = {
      initial: [
        "SWOT",
        "Purchase Criteria",
        "Channel Heatmap",
        "Loyalty/NPS",
        "Capability Heatmap",
        "Porter's Five Forces",
        "PESTEL Analysis"
      ],
      essential: [
        "Full SWOT Portfolio",
        "Customer Segmentation",
        "Competitive Advantage",
        "Channel Effectiveness",
        "Capability Heatmap",
        "Strategic Goals",
        "Strategic Positioning Radar",
        "Organizational Culture Profile",
        "Productivity Metrics",
        "Maturity Score"
      ],
      good: [
        "Cost Efficiency Insight",
        "Financial Performance & Growth Trajectory",
        "Financial Health Insight",
        "Operational Efficiency Insight"
      ]
    };

    return baseOptions[phase] || [];
  };

  const availablePhases = getAvailablePhases();
  const currentPhaseOptions = getPhaseSpecificOptions(selectedPhase);

  if (availablePhases.length === 0) return null;

  return (
    <>
      <div className="phase-tabs-container">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}>
          {/* Left side - Phase tabs */}
          <div className="phase-tabs-nav">
            {availablePhases.map(phase => (
              <button
                key={phase.key}
                onClick={() => setSelectedPhase(phase.key)}
                className={`phase-tab ${selectedPhase === phase.key ? 'active' : ''} ${phase.key}-phase`}
              >
                {phase.name}
              </button>
            ))}
          </div>

          {/* Right side - Go to Section and PDF Download */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Go to Section dropdown */}
            <div ref={dropdownRef} className="dropdown-wrapper" style={{ position: "relative" }}>
              <button
                className="dropdown-button"
                onClick={() => setShowDropdown(prev => !prev)}
                style={{
                  backgroundColor: "#fff",
                  color: "#3b82f6",
                  border: "1px solid #e1e5e9",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.15)",
                  minWidth: "180px",
                  justifyContent: "space-between"
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                <span>Go to Section</span>
                <ChevronDown
                  size={16}
                  style={{
                    marginLeft: 8,
                    transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {showDropdown && (
                <div style={{
                  position: "absolute",
                  top: "110%",
                  right: 0,
                  backgroundColor: "#fff",
                  border: "2px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                  minWidth: "220px",
                  zIndex: 1000,
                  maxHeight: "300px",
                  overflowY: "scroll",
                  backdropFilter: "blur(20px)"
                }}>
                  {/* Phase Header */}
                  <div style={{
                    padding: "12px 16px",
                    backgroundColor:
                      selectedPhase === 'good' ? "#f3e8ff" :
                        selectedPhase === 'essential' ? "#fef3c7" : "#dbeafe",
                    borderBottom: "1px solid #e2e8f0",
                    fontSize: "12px",
                    fontWeight: 700,
                    color:
                      selectedPhase === 'good' ? "#7c3aed" :
                        selectedPhase === 'essential' ? "#92400e" : "#1e40af",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {selectedPhase === 'initial' ? 'Initial Phase' :
                      selectedPhase === 'essential' ? 'Essential Phase' :
                        selectedPhase === 'good' ? 'Good Phase' : selectedPhase} Sections
                  </div>

                  {/* Options */}
                  {currentPhaseOptions.map((item, index) => (
                    <div
                      key={item}
                      onClick={() => handleOptionClick(item)}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "#374151",
                        fontWeight: 500,
                        borderBottom: index < currentPhaseOptions.length - 1 ? "1px solid #f1f5f9" : "none",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          selectedPhase === 'good' ? "#f3e8ff" :
                            selectedPhase === 'essential' ? "#fef3c7" : "#dbeafe";
                        e.currentTarget.style.color =
                          selectedPhase === 'good' ? "#7c3aed" :
                            selectedPhase === 'essential' ? "#92400e" : "#1e40af";
                        e.currentTarget.style.paddingLeft = "20px";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#374151";
                        e.currentTarget.style.paddingLeft = "16px";
                      }}
                    >
                      <span style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor:
                          selectedPhase === 'good' ? "#7c3aed" :
                            selectedPhase === 'essential' ? "#f59e0b" : "#3b82f6",
                        flexShrink: 0
                      }}></span>
                      {item}
                    </div>
                  ))}

                  {currentPhaseOptions.length === 0 && (
                    <div style={{
                      padding: "16px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: "14px",
                      fontStyle: "italic"
                    }}>
                      No sections available for this phase
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PDF Export Button */}
            <PDFExportButton
              className="pdf-export-button"
              style={{
                marginRight: "10px"
              }}
              businessName={businessData.name}
              onToastMessage={showToastMessage}
              currentPhase={selectedPhase}
              disabled={isAnalysisRegenerating}
              isChannelHeatmapReady={isChannelHeatmapReady}
              isCapabilityHeatmapReady={isCapabilityHeatmapReady}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PhaseTabsComponent;