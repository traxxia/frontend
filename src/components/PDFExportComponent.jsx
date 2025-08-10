import React, { useState } from 'react';
import { FileDown, Loader, ChevronDown } from 'lucide-react';

const PDFExportComponent = ({ 
  user, 
  userDetails, 
  onToast,
  buttonText = "Export PDF",
  buttonSize = "medium",
  className = ""
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Parse analysis data from userDetails
  const parseAnalysisData = () => {
    if (!userDetails) return null;

    const analysisData = {
      // Initial Phase Components
      swot: null,
      purchaseCriteria: null,
      channelHeatmap: null,
      loyaltyNPS: null,
      capabilityHeatmap: null,
      porters: null,
      pestel: null,
      strategic: null,
      
      // Essential Phase Components
      fullSwot: null,
      customerSegmentation: null,
      competitiveAdvantage: null,
      channelEffectiveness: null,
      expandedCapability: null,
      strategicGoals: null,
      strategicRadar: null,
      cultureProfile: null,
      productivityMetrics: null,
      maturityScore: null,
      
      businessName: user?.name || 'Business',
      userAnswers: {},
      questions: []
    };

    // Parse conversation data
    if (userDetails.conversation?.length > 0) {
      userDetails.conversation.forEach(phase => {
        phase.questions?.forEach(qa => {
          const questionId = qa.question || `q_${Math.random()}`;
          analysisData.questions.push({
            _id: questionId,
            question_id: questionId,
            question_text: qa.question,
            phase: phase.phase,
            severity: phase.severity
          });
          analysisData.userAnswers[questionId] = qa.answer;
        });
      });
    }

    // Parse system analysis data
    userDetails.system?.forEach(result => {
      try {
        const analysisResult = typeof result.analysis_result === 'string'
          ? JSON.parse(result.analysis_result)
          : result.analysis_result;

        const analysisType = result.analysis_type?.toLowerCase() || result.name?.toLowerCase() || '';

        // Map analysis types to data properties
        switch (analysisType) {
          case 'swot':
            analysisData.swot = analysisResult;
            break;
          case 'purchasecriteria':
          case 'purchase_criteria':
            analysisData.purchaseCriteria = analysisResult;
            break;
          case 'channelheatmap':
          case 'channel_heatmap':
            analysisData.channelHeatmap = analysisResult;
            break;
          case 'loyaltynps':
          case 'loyalty_nps':
          case 'loyalty_metrics':
            analysisData.loyaltyNPS = analysisResult;
            break;
          case 'capabilityheatmap':
          case 'capability_heatmap':
            analysisData.capabilityHeatmap = analysisResult;
            break;
          case 'porters':
          case 'porter_analysis':
            analysisData.porters = analysisResult;
            break;
          case 'pestel':
          case 'pestel_analysis':
            analysisData.pestel = analysisResult;
            break;
          case 'strategic':
          case 'strategic_analysis':
            analysisData.strategic = analysisResult;
            break;
          case 'fullswot':
          case 'full_swot':
            analysisData.fullSwot = analysisResult;
            break;
          case 'customersegmentation':
          case 'customer_segmentation':
            analysisData.customerSegmentation = analysisResult;
            break;
          case 'competitiveadvantage':
          case 'competitive_advantage':
            analysisData.competitiveAdvantage = analysisResult;
            break;
          case 'channeleffectiveness':
          case 'channel_effectiveness':
            analysisData.channelEffectiveness = analysisResult;
            break;
          case 'expandedcapability':
          case 'expanded_capability':
            analysisData.expandedCapability = analysisResult;
            break;
          case 'strategicgoals':
          case 'strategic_goals':
            analysisData.strategicGoals = analysisResult;
            break;
          case 'strategicradar':
          case 'strategic_radar':
            analysisData.strategicRadar = analysisResult;
            break;
          case 'cultureprofile':
          case 'culture_profile':
            analysisData.cultureProfile = analysisResult;
            break;
          case 'productivitymetrics':
          case 'productivity_metrics':
            analysisData.productivityMetrics = analysisResult;
            break;
          case 'maturityscore':
          case 'maturity_score':
            analysisData.maturityScore = analysisResult;
            break;
        }
      } catch (error) {
        console.error('Error parsing analysis result:', error);
      }
    });

    return analysisData;
  };

  // Helper functions
  const formatPhaseName = (phaseKey) => {
    return phaseKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatPillarName = (pillarKey) => {
    return pillarKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Generate conversation content
  const generateConversationContent = () => {
    if (!userDetails?.conversation || userDetails.conversation.length === 0) {
      return '<div class="section"><h2>No Conversation Data</h2><p>No completed conversations found.</p></div>';
    }

    let conversationHtml = '<div class="section"><h1>📋 Conversation History</h1>';
    
    // Add summary stats
    const totalQuestions = userDetails.conversation.reduce((sum, phase) => sum + phase.questions.length, 0);
    conversationHtml += `
      <div class="summary-stats">
        <div class="stat-item">
          <strong>Total Phases:</strong> ${userDetails.conversation.length}
        </div>
        <div class="stat-item">
          <strong>Total Questions Completed:</strong> ${totalQuestions}
        </div>
        <div class="stat-item">
          <strong>Completion Date:</strong> ${new Date().toLocaleDateString()}
        </div>
      </div>
    `;
    
    userDetails.conversation.forEach((phase, phaseIndex) => {
      conversationHtml += `
        <div class="phase-section">
          <h2>📊 ${phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1)} Phase</h2>
          <div class="phase-meta">
            <span class="severity-badge ${phase.severity}">${phase.severity}</span>
            <span class="question-count">${phase.questions.length} questions completed</span>
          </div>
      `;
      
      phase.questions?.forEach((qa, qaIndex) => {
        conversationHtml += `
          <div class="qa-item">
            <div class="question">
              <h4>❓ Q${qaIndex + 1}: ${qa.question}</h4>
            </div>
            <div class="answer">
              <p><strong>💬 Answer:</strong> ${qa.answer}</p>
            </div>
          </div>
        `;
      });
      
      conversationHtml += '</div>';
    });
    
    conversationHtml += '</div>';
    return conversationHtml;
  };

  // Generate SWOT Analysis content
  const generateSWOTContent = (analysisData) => {
    if (!analysisData?.swot) return '';
    
    try {
      const swotData = typeof analysisData.swot === 'string' 
        ? JSON.parse(analysisData.swot) 
        : analysisData.swot;
      
      return `
        <div class="analysis-section">
          <h2>🎯 SWOT Analysis</h2>
          <div class="swot-grid">
            <div class="swot-quadrant strengths">
              <h3>💪 Strengths</h3>
              <ul>
                ${swotData.strengths?.map(item => `<li>✅ ${item}</li>`).join('') || '<li>No data available</li>'}
              </ul>
            </div>
            <div class="swot-quadrant weaknesses">
              <h3>⚠️ Weaknesses</h3>
              <ul>
                ${swotData.weaknesses?.map(item => `<li>❌ ${item}</li>`).join('') || '<li>No data available</li>'}
              </ul>
            </div>
            <div class="swot-quadrant opportunities">
              <h3>🚀 Opportunities</h3>
              <ul>
                ${swotData.opportunities?.map(item => `<li>🌟 ${item}</li>`).join('') || '<li>No data available</li>'}
              </ul>
            </div>
            <div class="swot-quadrant threats">
              <h3>⚡ Threats</h3>
              <ul>
                ${swotData.threats?.map(item => `<li>⛔ ${item}</li>`).join('') || '<li>No data available</li>'}
              </ul>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      return '<div class="analysis-section"><h2>🎯 SWOT Analysis</h2><p>Error parsing SWOT data</p></div>';
    }
  };

  // Generate Customer Segmentation content
  const generateCustomerSegmentationContent = (analysisData) => {
    if (!analysisData?.customerSegmentation) return '';
    
    const data = analysisData.customerSegmentation;
    let content = `
      <div class="analysis-section">
        <h2>👥 Customer Segmentation</h2>
    `;
    
    if (data.segments) {
      content += '<div class="segments-grid">';
      data.segments.forEach((segment, index) => {
        content += `
          <div class="segment-card">
            <h3>🎯 ${segment.name || `Segment ${index + 1}`}</h3>
            <p><strong>📝 Description:</strong> ${segment.description || 'N/A'}</p>
            <p><strong>📊 Size:</strong> ${segment.size || 'N/A'}</p>
            <p><strong>💰 Value:</strong> ${segment.value || 'N/A'}</p>
            <p><strong>🔍 Characteristics:</strong> ${segment.characteristics?.join(', ') || 'N/A'}</p>
          </div>
        `;
      });
      content += '</div>';
    }
    
    content += '</div>';
    return content;
  };

  // Generate Strategic Analysis content
  const generateStrategicContent = (analysisData) => {
    if (!analysisData?.strategic) return '';
    
    const strategicContent = analysisData.strategic.strategic_analysis || analysisData.strategic;
    let content = `
      <div class="section">
        <h1>🎯 Strategic Analysis</h1>
    `;
    
    // Executive Summary
    if (strategicContent.executive_summary) {
      const summary = strategicContent.executive_summary;
      content += `
        <div class="strategic-section">
          <h2>📋 Executive Summary</h2>
          <div class="summary-content">
            <p><strong>📊 Situation Overview:</strong> ${summary.situation_overview || 'N/A'}</p>
            <p><strong>⏰ Urgency Level:</strong> <span class="urgency-badge ${summary.urgency_level?.toLowerCase()}">${summary.urgency_level || 'N/A'}</span></p>
            <p><strong>📈 Strategic Maturity Assessment:</strong> ${summary.strategic_maturity_assessment || 'N/A'}</p>
            ${summary.key_strategic_themes ? `
              <div class="themes">
                <strong>🎯 Key Strategic Themes:</strong>
                <ul>${summary.key_strategic_themes.map(theme => `<li>🔹 ${theme}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${summary.primary_vuca_factors ? `
              <div class="vuca-factors">
                <strong>🌪️ Primary VUCA Factors:</strong>
                <ul>${summary.primary_vuca_factors.map(factor => `<li>⚠️ ${factor}</li>`).join('')}</ul>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }
    
    // Strategic Pillars
    if (strategicContent.strategic_pillars_analysis) {
      content += `
        <div class="strategic-section">
          <h2>🏛️ Strategic Pillars Analysis</h2>
          <div class="pillars-content">
      `;
      
      Object.entries(strategicContent.strategic_pillars_analysis).forEach(([pillarKey, pillar]) => {
        const score = pillar.current_state?.assessment_score || 0;
        const scoreEmoji = score >= 7 ? '🟢' : score >= 5 ? '🟡' : '🔴';
        
        content += `
          <div class="pillar-section">
            <h3>🏗️ ${formatPillarName(pillarKey)}</h3>
            <div class="pillar-scores">
              <p><strong>📊 Assessment Score:</strong> ${scoreEmoji} ${score}/10</p>
              <p><strong>⭐ Relevance Score:</strong> ${pillar.relevance_score || 0}/10</p>
            </div>
            
            ${pillar.current_state?.strengths ? `
              <div class="strengths">
                <strong>💪 Strengths:</strong>
                <ul>${pillar.current_state.strengths.map(strength => `<li>✅ ${strength}</li>`).join('')}</ul>
              </div>
            ` : ''}
            
            ${pillar.current_state?.weaknesses ? `
              <div class="weaknesses">
                <strong>⚠️ Weaknesses:</strong>
                <ul>${pillar.current_state.weaknesses.map(weakness => `<li>❌ ${weakness}</li>`).join('')}</ul>
              </div>
            ` : ''}
            
            ${pillar.recommendations ? `
              <div class="recommendations">
                <strong>💡 Recommendations:</strong>
                <ul>
                  ${pillar.recommendations.map(rec => {
                    const priorityEmoji = rec.priority?.toLowerCase() === 'high' ? '🔴' : 
                                         rec.priority?.toLowerCase() === 'medium' ? '🟡' : '🟢';
                    return `
                      <li>
                        <strong>${priorityEmoji} ${rec.action}</strong> (Priority: ${rec.priority})
                        ${rec.timeline ? `<br><em>⏱️ Timeline: ${rec.timeline}</em>` : ''}
                        ${rec.expected_impact ? `<br><em>📈 Expected Impact: ${rec.expected_impact}</em>` : ''}
                        ${rec.resources_required ? `<br><em>👥 Resources: ${rec.resources_required.join(', ')}</em>` : ''}
                      </li>
                    `;
                  }).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${pillar.success_metrics ? `
              <div class="success-metrics">
                <strong>📏 Success Metrics:</strong>
                <ul>
                  ${pillar.success_metrics.map(metric => `
                    <li>
                      <strong>📊 ${metric.metric}</strong><br>
                      🎯 Target: ${metric.target}<br>
                      📅 Frequency: ${metric.measurement_frequency}
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `;
      });
      
      content += '</div></div>';
    }
    
    // Implementation Roadmap
    if (strategicContent.implementation_roadmap) {
      content += `
        <div class="strategic-section">
          <h2>🗺️ Implementation Roadmap</h2>
          <div class="roadmap-content">
      `;
      
      Object.entries(strategicContent.implementation_roadmap).forEach(([phaseKey, phase], index) => {
        content += `
          <div class="roadmap-phase">
            <h3>📍 Phase ${index + 1}: ${formatPhaseName(phaseKey)}</h3>
            <div class="phase-details">
              <p><strong>⏱️ Duration:</strong> ${phase.duration || 'N/A'}</p>
              <p><strong>💰 Budget:</strong> ${phase.budget || 'N/A'}</p>
              <p><strong>🎯 Focus:</strong> ${phase.focus || 'N/A'}</p>
            </div>
            
            ${phase.key_initiatives ? `
              <div class="initiatives">
                <strong>🚀 Key Initiatives:</strong>
                <ul>${phase.key_initiatives.map(initiative => `<li>▶️ ${initiative}</li>`).join('')}</ul>
              </div>
            ` : ''}
            
            ${phase.success_criteria ? `
              <div class="success-criteria">
                <strong>✅ Success Criteria:</strong>
                <ul>${phase.success_criteria.map(criteria => `<li>🎯 ${criteria}</li>`).join('')}</ul>
              </div>
            ` : ''}
          </div>
        `;
      });
      
      content += '</div></div>';
    }
    
    // Risk Assessment
    if (strategicContent.risk_assessment) {
      content += `
        <div class="strategic-section">
          <h2>⚠️ Risk Assessment</h2>
          <div class="risk-content">
      `;
      
      if (strategicContent.risk_assessment.strategic_risks) {
        content += `
          <div class="risks-section">
            <h3>🚨 Strategic Risks</h3>
            <div class="risks-grid">
        `;
        
        strategicContent.risk_assessment.strategic_risks.forEach(risk => {
          const probabilityEmoji = risk.probability?.toLowerCase() === 'high' ? '🔴' : 
                                  risk.probability?.toLowerCase() === 'medium' ? '🟡' : '🟢';
          const impactEmoji = risk.impact?.toLowerCase() === 'high' ? '🔴' : 
                             risk.impact?.toLowerCase() === 'medium' ? '🟡' : '🟢';
          
          content += `
            <div class="risk-item">
              <h4>⚠️ ${risk.risk}</h4>
              <p><strong>📊 Probability:</strong> ${probabilityEmoji} ${risk.probability}</p>
              <p><strong>💥 Impact:</strong> ${impactEmoji} ${risk.impact}</p>
              <p><strong>🛡️ Mitigation:</strong> ${risk.mitigation || 'N/A'}</p>
              ${risk.owner ? `<p><strong>👤 Owner:</strong> ${risk.owner}</p>` : ''}
            </div>
          `;
        });
        
        content += '</div></div>';
      }
      
      content += '</div></div>';
    }
    
    content += '</div>';
    return content;
  };

  // Generate Essential Phase content
  const generateEssentialPhaseContent = (analysisData) => {
    let content = '<div class="section"><h1>🔬 Essential Phase Analysis</h1>';
    
    let hasEssentialContent = false;
    
    // Full SWOT Portfolio
    if (analysisData?.fullSwot) {
      hasEssentialContent = true;
      content += `
        <div class="analysis-section">
          <h2>📊 Full SWOT Portfolio</h2>
          <p>Comprehensive SWOT analysis with strategic portfolio insights and cross-functional analysis.</p>
        </div>
      `;
    }
    
    // Competitive Advantage Matrix
    if (analysisData?.competitiveAdvantage) {
      hasEssentialContent = true;
      content += `
        <div class="analysis-section">
          <h2>⚔️ Competitive Advantage Matrix</h2>
          <p>Strategic positioning analysis and competitive advantage mapping across key business dimensions.</p>
        </div>
      `;
    }
    
    // Strategic Goals
    if (analysisData?.strategicGoals) {
      hasEssentialContent = true;
      content += `
        <div class="analysis-section">
          <h2>🎯 Strategic Goals Framework</h2>
          <p>Defined strategic objectives, goal hierarchy, and measurable outcomes framework.</p>
        </div>
      `;
    }
    
    // Channel Effectiveness
    if (analysisData?.channelEffectiveness) {
      hasEssentialContent = true;
      content += `
        <div class="analysis-section">
          <h2>📈 Channel Effectiveness Map</h2>
          <p>Analysis of channel performance, effectiveness metrics, and optimization opportunities.</p>
        </div>
      `;
    }
    
    // Expanded Capability Heatmap
    if (analysisData?.expandedCapability) {
      hasEssentialContent = true;
      content += `
        <div class="analysis-section">
          <h2>🔥 Expanded Capability Heatmap</h2>
          <p>Comprehensive organizational capabilities assessment with performance heat mapping.</p>
        </div>
      `;
    }
    
    // Strategic Positioning Radar
    if (analysisData?.strategicRadar) {
      hasEssentialContent = true;
      content += `
        <div class="analysis-section">
          <h2>📡 Strategic Positioning Radar</h2>
          <p>Multi-dimensional strategic positioning analysis and competitive landscape mapping.</p>
        </div>
      `;
    }
    
    // Organizational Culture Profile
    if (analysisData?.cultureProfile) {
      hasEssentialContent = true;
      content += `
        <div class="analysis-section">
          <h2>🏢 Organizational Culture Profile</h2>
          <p>Cultural assessment, organizational dynamics analysis, and culture alignment insights.</p>
        </div>
      `;
    }
    
    // Productivity Metrics
    if (analysisData?.productivityMetrics) {
      hasEssentialContent = true;
      content += `
        <div class="analysis-section">
          <h2>⚡ Productivity Metrics Dashboard</h2>
          <p>Performance indicators, productivity benchmarks, and efficiency optimization analysis.</p>
        </div>
      `;
    }
    
    // Maturity Score
    if (analysisData?.maturityScore) {
      hasEssentialContent = true;
      content += `
        <div class="analysis-section">
          <h2>📊 Organizational Maturity Assessment</h2>
          <p>Comprehensive maturity evaluation, scoring framework, and development roadmap.</p>
        </div>
      `;
    }
    
    if (!hasEssentialContent) {
      content += `
        <div class="analysis-section">
          <h2>🔒 Essential Phase Analysis</h2>
          <p>Essential phase analysis will be available once all essential questions are completed.</p>
        </div>
      `;
    }
    
    content += '</div>';
    return content;
  };

  // Generate additional initial phase analysis
  const generateAdditionalInitialAnalysis = (analysisData) => {
    let content = '';
    
    // Purchase Criteria
    if (analysisData?.purchaseCriteria) {
      content += `
        <div class="analysis-section">
          <h2>🛒 Purchase Criteria Analysis</h2>
          <p>Customer decision-making factors, purchase drivers, and buying behavior insights.</p>
        </div>
      `;
    }
    
    // Channel Heatmap
    if (analysisData?.channelHeatmap) {
      content += `
        <div class="analysis-section">
          <h2>📊 Channel Heatmap</h2>
          <p>Distribution channel analysis, performance mapping, and optimization opportunities.</p>
        </div>
      `;
    }
    
    // Loyalty NPS
    if (analysisData?.loyaltyNPS) {
      content += `
        <div class="analysis-section">
          <h2>❤️ Loyalty & NPS Analysis</h2>
          <p>Customer loyalty metrics, Net Promoter Score analysis, and retention insights.</p>
        </div>
      `;
    }
    
    // Capability Heatmap
    if (analysisData?.capabilityHeatmap) {
      content += `
        <div class="analysis-section">
          <h2>🔥 Capability Heatmap</h2>
          <p>Organizational capabilities assessment with performance heat mapping and gap analysis.</p>
        </div>
      `;
    }
    
    // Porter's Five Forces
    if (analysisData?.porters) {
      content += `
        <div class="analysis-section">
          <h2>⚔️ Porter's Five Forces</h2>
          <p>Competitive forces analysis including supplier power, buyer power, competitive rivalry, threat of substitution, and barriers to entry.</p>
        </div>
      `;
    }
    
    // PESTEL Analysis
    if (analysisData?.pestel) {
      content += `
        <div class="analysis-section">
          <h2>🌍 PESTEL Analysis</h2>
          <p>Political, Economic, Social, Technological, Environmental, and Legal factors analysis affecting business environment.</p>
        </div>
      `;
    }
    
    return content;
  };

  // CSS Styles for PDF
  const getPDFStyles = () => {
    return `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background: #fff;
        }
        
        .header {
          text-align: center;
          border-bottom: 4px solid #3b82f6;
          padding-bottom: 30px;
          margin-bottom: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          border-radius: 12px;
          margin: -20px -20px 40px -20px;
        }
        
        .header h1 {
          font-size: 32px;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
          font-size: 16px;
          opacity: 0.9;
          line-height: 1.8;
        }
        
        .section {
          margin-bottom: 50px;
          page-break-inside: avoid;
        }
        
        .section h1 {
          color: #1e40af;
          border-bottom: 3px solid #e5e7eb;
          padding-bottom: 15px;
          font-size: 28px;
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .section h2 {
          color: #374151;
          font-size: 22px;
          margin: 30px 0 20px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .summary-stats {
          display: flex;
          justify-content: space-around;
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
          border: 1px solid #e2e8f0;
        }
        
        .stat-item {
          text-align: center;
          padding: 10px;
        }
        
        .phase-section {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-left: 6px solid #3b82f6;
          padding: 30px;
          margin: 30px 0;
          border-radius: 0 12px 12px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .phase-section h2 {
          color: #1e40af;
          margin-bottom: 20px;
        }
        
        .phase-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }
        
        .severity-badge {
          padding: 8px 16px;
          border-radius: 25px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .severity-badge.mandatory {
          background: #fecaca;
          color: #991b1b;
        }
        
        .severity-badge.optional {
          background: #fed7aa;
          color: #9a3412;
        }
        
        .question-count {
          background: #dbeafe;
          color: #1e40af;
          padding: 8px 16px;
          border-radius: 25px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .qa-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s ease;
        }
        
        .qa-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .question h4 {
          color: #1f2937;
          margin-bottom: 15px;
          font-size: 18px;
          line-height: 1.4;
        }
        
        .answer p {
          color: #4b5563;
          line-height: 1.7;
          font-size: 16px;
        }
        
        .analysis-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 30px;
          margin: 25px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .swot-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 25px;
          margin-top: 25px;
        }
        
        .swot-quadrant {
          border: 2px solid;
          border-radius: 12px;
          padding: 25px;
          position: relative;
          overflow: hidden;
        }
        
        .swot-quadrant::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: inherit;
        }
        
        .swot-quadrant.strengths {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-color: #22c55e;
        }
        
        .swot-quadrant.weaknesses {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border-color: #ef4444;
        }
        
        .swot-quadrant.opportunities {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border-color: #f59e0b;
        }
        
        .swot-quadrant.threats {
          background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
          border-color: #ec4899;
        }
        
        .swot-quadrant h3 {
          margin-bottom: 20px;
          font-size: 20px;
          font-weight: 700;
        }
        
        .swot-quadrant ul {
          list-style: none;
          padding: 0;
        }
        
        .swot-quadrant li {
          padding: 12px 0;
          border-bottom: 1px solid rgba(0,0,0,0.1);
          font-size: 15px;
          line-height: 1.5;
        }
        
        .swot-quadrant li:last-child {
          border-bottom: none;
        }
        
        .segments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
          margin-top: 25px;
        }
        
        .segment-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 25px;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .segment-card h3 {
          color: #1f2937;
          margin-bottom: 20px;
          font-size: 18px;
        }
        
        .strategic-section {
          margin: 30px 0;
          padding: 25px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          border: 1px solid #cbd5e1;
        }
        
        .strategic-section h2 {
          color: #1e40af;
          margin-bottom: 20px;
        }
        
        .pillar-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .pillar-section h3 {
          color: #1f2937;
          margin-bottom: 20px;
          font-size: 20px;
        }
        
        .pillar-scores {
          display: flex;
          gap: 30px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .roadmap-phase {
          background: white;
          border-left: 6px solid #3b82f6;
          padding: 25px;
          margin: 20px 0;
          border-radius: 0 12px 12px 0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        
        .roadmap-phase h3 {
          color: #1e40af;
          margin-bottom: 20px;
        }
        
        .phase-details {
          display: flex;
          gap: 30px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .risk-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 15px 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .risk-item h4 {
          color: #1f2937;
          margin-bottom: 15px;
        }
        
        .summary-content p {
          margin: 15px 0;
          line-height: 1.7;
        }
        
        .themes, .vuca-factors, .initiatives, .success-criteria, 
        .strengths, .weaknesses, .recommendations, .success-metrics {
          margin: 20px 0;
        }
        
        .themes ul, .vuca-factors ul, .initiatives ul, .success-criteria ul, 
        .strengths ul, .weaknesses ul, .recommendations ul, .success-metrics ul {
          margin: 15px 0;
          padding-left: 0;
          list-style: none;
        }
        
        .themes li, .vuca-factors li, .initiatives li, .success-criteria li, 
        .strengths li, .weaknesses li, .success-metrics li {
          margin: 10px 0;
          padding: 8px 0;
          line-height: 1.6;
        }
        
        .recommendations li {
          margin: 15px 0;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          line-height: 1.6;
        }
        
        .urgency-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .urgency-badge.high {
          background: #fecaca;
          color: #991b1b;
        }
        
        .urgency-badge.medium {
          background: #fed7aa;
          color: #9a3412;
        }
        
        .urgency-badge.low {
          background: #dcfce7;
          color: #166534;
        }
        
        .footer {
          text-align: center;
          margin-top: 60px;
          padding: 30px;
          border-top: 2px solid #e5e7eb;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          color: #6b7280;
        }
        
        .footer p {
          margin: 10px 0;
        }
        
        .footer .company-info {
          font-weight: 600;
          color: #374151;
          font-size: 16px;
        }
        
        @media print {
          .section {
            page-break-after: always;
          }
          .section:last-child {
            page-break-after: auto;
          }
          .phase-section {
            page-break-inside: avoid;
          }
          .qa-item {
            page-break-inside: avoid;
          }
          .pillar-section {
            page-break-inside: avoid;
          }
          .roadmap-phase {
            page-break-inside: avoid;
          }
        }
        
        @media screen and (max-width: 768px) {
          .swot-grid {
            grid-template-columns: 1fr;
          }
          .segments-grid {
            grid-template-columns: 1fr;
          }
          .phase-meta {
            flex-direction: column;
            gap: 10px;
          }
          .pillar-scores {
            flex-direction: column;
            gap: 15px;
          }
          .phase-details {
            flex-direction: column;
            gap: 15px;
          }
        }
      </style>
    `;
  };

  // Export options
  const exportOptions = [
    {
      id: 'comprehensive',
      title: 'Complete Report',
      description: 'All conversations, analysis, and strategic insights',
      icon: '📊'
    },
    {
      id: 'conversations',
      title: 'Conversations Only',
      description: 'Question and answer history',
      icon: '💬'
    },
    {
      id: 'analysis',
      title: 'Analysis Only',
      description: 'Initial and essential phase analysis',
      icon: '🔬'
    },
    {
      id: 'strategic',
      title: 'Strategic Only',
      description: 'Strategic analysis and roadmap',
      icon: '🎯'
    }
  ];

  const handleExport = async (exportType = 'comprehensive') => {
    if (!user || !userDetails) {
      onToast('No data available for export', 'error');
      return;
    }

    try {
      setIsExporting(true);
      setShowOptions(false);
      
      const analysisData = parseAnalysisData();
      let htmlContent = '';
      let reportTitle = '';
      
      // Generate content based on export type
      switch (exportType) {
        case 'comprehensive':
          reportTitle = 'Complete Business Analysis Report';
          htmlContent = `
            ${generateConversationContent()}
            <div class="section">
              <h1>🔬 Initial Phase Analysis</h1>
              ${generateSWOTContent(analysisData)}
              ${generateCustomerSegmentationContent(analysisData)}
              ${generateAdditionalInitialAnalysis(analysisData)}
            </div>
            ${generateEssentialPhaseContent(analysisData)}
            ${generateStrategicContent(analysisData)}
          `;
          break;
          
        case 'conversations':
          reportTitle = 'Conversation History Report';
          htmlContent = generateConversationContent();
          break;
          
        case 'analysis':
          reportTitle = 'Business Analysis Report';
          htmlContent = `
            <div class="section">
              <h1>🔬 Initial Phase Analysis</h1>
              ${generateSWOTContent(analysisData)}
              ${generateCustomerSegmentationContent(analysisData)}
              ${generateAdditionalInitialAnalysis(analysisData)}
            </div>
            ${generateEssentialPhaseContent(analysisData)}
          `;
          break;
          
        case 'strategic':
          reportTitle = 'Strategic Analysis Report';
          htmlContent = generateStrategicContent(analysisData);
          break;
          
        default:
          reportTitle = 'Business Analysis Report';
          htmlContent = generateConversationContent();
      }

      // Generate complete HTML document
      const completeHtmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${reportTitle} - ${user.name}</title>
          ${getPDFStyles()}
        </head>
        <body>
          <div class="header">
            <h1>📋 ${reportTitle}</h1>
            <div class="subtitle">
              <div class="company-info">${user.name}</div>
              <div>
                <strong>📧 Contact:</strong> ${user.email} |
                <strong>📅 Generated:</strong> ${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} |
                <strong>👤 Role:</strong> ${user.role?.role_name || 'User'}
              </div>
              ${user.company?.company_name ? `<div><strong>🏢 Company:</strong> ${user.company.company_name}</div>` : ''}
            </div>
          </div>
          
          ${htmlContent}
          
          <div class="footer">
            <div class="company-info">Business Analysis Platform</div>
            <p>📊 This report contains comprehensive business insights generated from your responses.</p>
            <p>🔒 Confidential business analysis - Generated on ${new Date().toLocaleDateString()}</p>
            <p>© ${new Date().getFullYear()} Business Analysis Platform. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      // Create and download the file
      const blob = new Blob([completeHtmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${user.name.replace(/\s+/g, '_')}_${exportType}_analysis_${new Date().toISOString().split('T')[0]}.html`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      onToast(`${reportTitle} exported successfully! 🎉`, 'success');
      
    } catch (error) {
      console.error('Export error:', error);
      onToast('Failed to export analysis ❌', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const buttonSizes = {
    small: { padding: '8px 16px', fontSize: '14px' },
    medium: { padding: '10px 20px', fontSize: '16px' },
    large: { padding: '12px 24px', fontSize: '18px' }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Main Export Button */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting || !user || !userDetails}
        className={`export-button ${className}`}
        style={{
          backgroundColor: isExporting ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          ...buttonSizes[buttonSize],
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: isExporting ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          if (!isExporting) {
            e.target.style.backgroundColor = '#2563eb';
            e.target.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExporting) {
            e.target.style.backgroundColor = '#3b82f6';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        {isExporting ? (
          <>
            <Loader size={16} className="animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <FileDown size={16} />
            {buttonText}
            <ChevronDown size={14} />
          </>
        )}
      </button>

      {/* Export Options Dropdown */}
      {showOptions && !isExporting && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setShowOptions(false)}
          />
          
          {/* Dropdown Menu */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              minWidth: '320px',
              zIndex: 1000,
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f8fafc'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                📊 Export Options
              </h3>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Choose what to include in your export
              </p>
            </div>
            
            {exportOptions.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleExport(option.id)}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: index < exportOptions.length - 1 ? '1px solid #f3f4f6' : 'none',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '20px' }}>{option.icon}</span>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '15px',
                      color: '#1f2937',
                      marginBottom: '4px'
                    }}>
                      {option.title}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      lineHeight: '1.4'
                    }}>
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e5e7eb'
            }}>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                💡 Files will be exported as HTML documents that can be opened in any browser or converted to PDF
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PDFExportComponent;