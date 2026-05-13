import React from 'react';
import { ChevronDown } from "lucide-react";
import PDFExportButton from "./PDFExportButton";
import CustomTooltip from "./CustomTooltip";
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
    if (unlockedFeatures.analysis) {
      phases.push({
        key: 'initial',
        name: 'Initial Phase',
        unlocked: true
      });
    }
    if (unlockedFeatures.fullSwot) {
      phases.push({
        key: 'essential',
        name: 'Essential Phase',
        unlocked: true
      });
    }
    if (unlockedFeatures.goodPhase) {
      phases.push({
        key: 'good',
        name: 'Good Phase',
        unlocked: true
      });
    }
    return phases;
  };
  const getPhaseSpecificOptions = phase => {
    const baseOptions = {
      initial: ["swot_analysis", "Porters_Five_Forces", "PESTEL_Analysis", "Purchase_Criteria", "Loyalty_&_NPS"],
      essential: ["Productivity_Metrics", "Porters_Five_Forces", "PESTEL_Analysis", "Full_SWOT_Portfolio", "Strategic_Positioning_Radar", "Purchase_Criteria", "Loyalty_&_NPS", "Competitive_Advantage_Matrix", "Capability_Heatmap", "Maturity_Score", "Competitive_Landscape", "Core"],
      good: ["Profitability_Analysis", "Growth_Tracker", "Liquidity_Efficiency", "Investment_Performance", "Leverage_Risk"]
    };
    return baseOptions[phase] || [];
  };
  const availablePhases = getAvailablePhases();
  const currentPhaseOptions = getPhaseSpecificOptions(selectedPhase);
  if (availablePhases.length === 0) return null;
  return <>
      <div className="phase-tabs-container">
        <div className="phase-tabs-component--s1">
          {}
          <div className="phase-tabs-nav">
            {availablePhases.map(phase => <button key={phase.key} onClick={() => setSelectedPhase(phase.key)} className={`phase-tab ${selectedPhase === phase.key ? 'active' : ''} ${phase.key}-phase`}>
                {phase.name}
              </button>)}
          </div>

          {}
          <div className="phase-tabs-component--s2">
            {}
            <div ref={dropdownRef} className="dropdown-wrapper phase-tabs-component--s3">
              <button className="dropdown-button phase-tabs-component--s4" onClick={() => setShowDropdown(prev => !prev)} onMouseEnter={e => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.transform = "translateY(-1px)";
            }} onMouseLeave={e => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.transform = "translateY(0)";
            }}>
                <span>{t("Go_to_Section")}</span>
                <ChevronDown size={16} style={{
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
              }} className="phase-tabs-component--s5" />
              </button>

              {showDropdown && <div className="phase-tabs-component--s6">
                  {}
                  <div style={{
                backgroundColor: selectedPhase === 'good' ? "#f3e8ff" : selectedPhase === 'essential' ? "#fef3c7" : "#dbeafe",
                color: selectedPhase === 'good' ? "#7c3aed" : selectedPhase === 'essential' ? "#92400e" : "#1e40af"
              }} className="phase-tabs-component--s7">
                    {selectedPhase === 'initial' ? 'Initial Phase' : selectedPhase === 'essential' ? 'Essential Phase' : selectedPhase === 'good' ? 'Good Phase' : selectedPhase} Sections
                  </div>

                  {}
                  {currentPhaseOptions.map((item, index) => <div key={item} onClick={() => handleOptionClick(item)} style={{
                borderBottom: index < currentPhaseOptions.length - 1 ? "1px solid #f1f5f9" : "none"
              }} onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = selectedPhase === 'good' ? "#f3e8ff" : selectedPhase === 'essential' ? "#fef3c7" : "#dbeafe";
                e.currentTarget.style.color = selectedPhase === 'good' ? "#7c3aed" : selectedPhase === 'essential' ? "#92400e" : "#1e40af";
                e.currentTarget.style.paddingLeft = "20px";
              }} onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#374151";
                e.currentTarget.style.paddingLeft = "16px";
              }} className="phase-tabs-component--s8">
                      <span style={{
                  backgroundColor: selectedPhase === 'good' ? "#7c3aed" : selectedPhase === 'essential' ? "#f59e0b" : "#3b82f6"
                }} className="phase-tabs-component--s9"></span>
                      {t(item)}
                    </div>)}

                  {currentPhaseOptions.length === 0 && <div className="phase-tabs-component--s10">
                      No sections available for this phase
                    </div>}
                </div>}
            </div>

            {}
            <CustomTooltip align="right" message={t("download_insights_tooltip") || "Export the insights into PDF report."}>
              <PDFExportButton className="pdf-export-button phase-tabs-component--s11" businessName={businessData.name} onToastMessage={showToastMessage} currentPhase={selectedPhase} disabled={isAnalysisRegenerating} isChannelHeatmapReady={isChannelHeatmapReady} isCapabilityHeatmapReady={isCapabilityHeatmapReady} />
            </CustomTooltip>
          </div>
        </div>
      </div>
    </>;
};
export default PhaseTabsComponent;
