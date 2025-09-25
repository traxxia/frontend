import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Check, X, Info } from 'lucide-react';

const MissingMetricsDisplay = ({ 
  documentInfo,  
  className = "" 
}) => { 
  const [isExpanded, setIsExpanded] = useState(false);

  const TEMPLATE_METRICS = {
    simple: {
      name: "Simplified", 
      metrics: [
        { key: "revenue", name: "Revenue", required: true },
        { key: "net_income", name: "Net Income", required: true },
        { key: "operating_expenses", name: "Operating Expenses", required: true },
        { key: "gross_profit", name: "Gross Profit", required: true },
        { key: "revenue_trends", name: "Revenue Trends", required: true }
      ]
    },
    standard: {
      name: "Standard",
      metrics: [
        { key: "revenue", name: "Revenue", required: true },
        { key: "cogs", name: "Cost Of Goods", required: true },
        { key: "ebitda", name: "EBITDA", required: true },
        { key: "net_income", name: "Net Income", required: true },
        { key: "operating_income", name: "Operating Income", required: true },
        { key: "operating_expenses", name: "Operating Expenses", required: true },
        { key: "gross_profit", name: "Gross Profit", required: true },
        { key: "revenue_trends", name: "Revenue Trends", required: true },
        { key: "total_assets", name: "Total Assets", required: true },
        { key: "shareholder_equity", name: "Shareholder Equity", required: true },
        { key: "total_debt", name: "Total Debt", required: true }
      ]
    },
    detailed: {
      name: "Detailed",
      metrics: [
        { key: "revenue", name: "Revenue", required: true },
        { key: "cogs", name: "Cost Of Goods", required: true },
        { key: "ebitda", name: "EBITDA", required: true },
        { key: "net_income", name: "Net Income", required: true },
        { key: "operating_income", name: "Operating Income", required: true },
        { key: "operating_expenses", name: "Operating Expenses", required: true },
        { key: "gross_profit", name: "Gross Profit", required: true },
        { key: "revenue_trends", name: "Revenue Trends", required: true },
        { key: "current_assets", name: "Current Assets", required: true },
        { key: "current_liabilities", name: "Current Liabilities", required: true },
        { key: "cash", name: "Cash", required: true },
        { key: "inventory", name: "Inventory", required: true },
        { key: "total_assets", name: "Total Assets", required: true },
        { key: "shareholder_equity", name: "Shareholder Equity", required: true },
        { key: "total_debt", name: "Total Debt", required: true }
      ]
    }
  };

  // Determine current template type
  let currentTemplateType = "standard"; 
  if (documentInfo?.template_name) {
    const templateName = documentInfo.template_name.toLowerCase();
    if (templateName.includes("simplified") || templateName.includes("simple") || templateName.includes("basic")) {
      currentTemplateType = "simple";
    } else if (templateName.includes("detailed") || templateName.includes("advanced") || templateName.includes("comprehensive")) {
      currentTemplateType = "detailed";
    } 
  } else if (documentInfo?.template_type) { 
    const type = documentInfo.template_type.toLowerCase();
    if (type === "simple" || type === "basic") {
      currentTemplateType = "simple";
    } else if (type === "detailed" || type === "advanced") {
      currentTemplateType = "detailed";
    }
  }

  if (!documentInfo || documentInfo.has_document === false) {
    return null;
  }

  const currentTemplate = TEMPLATE_METRICS[currentTemplateType];

  return (
    <div className={`missing-metrics-display ${className}`}>
      {/* Header */}
      <div className="header">
        <AlertTriangle size={18} />
        <span>Template Requirements Missing</span>
      </div>

      {/* Main Message */}
      <div className="message-box">
        <div className="main-message">
          Some required metrics are missing for your selected template.
        </div> 
      </div>

      {/* Template Info */}
      <div className="template-info"> 
        <div className="template-details">
          <div className="template-name">Current Template: {currentTemplate.name}</div>
          <div className="template-desc">{currentTemplate.metrics.length} metrics required</div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px'
          }}
        >
          {isExpanded ? (
            <>
              <span>Hide</span>
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              <span>View All</span>
              <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>
 
      <div style={{ marginTop: '16px' }}>
        <div className="section-title">
          <span>Required Metrics for {currentTemplate.name}</span>
        </div>
        <div className="metrics-grid">
          {currentTemplate.metrics.map((metric) => (
            <div key={metric.key} className="metric required-metric"> 
              <span>{metric.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div style={{ marginTop: '16px' }}>
          <div className="section-title">
            All Template Comparison
          </div>
          
          {/* Comparison Table */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            marginTop: '12px'
          }}>
            <table style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '600' }}>Metric</th>
                  <th style={{ 
                    padding: '8px 12px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    backgroundColor: currentTemplateType === 'simple' ? '#fed7aa' : '#f8fafc',
                    color: currentTemplateType === 'simple' ? '#9a3412' : '#374151'
                  }}>
                    Simplified
                    {currentTemplateType === 'simple' && (
                      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>(Current)</div>
                    )}
                  </th>
                  <th style={{ 
                    padding: '8px 12px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    backgroundColor: currentTemplateType === 'standard' ? '#fed7aa' : '#f8fafc',
                    color: currentTemplateType === 'standard' ? '#9a3412' : '#374151'
                  }}>
                    Standard
                    {currentTemplateType === 'standard' && (
                      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>(Current)</div>
                    )}
                  </th>
                  <th style={{ 
                    padding: '8px 12px', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    backgroundColor: currentTemplateType === 'detailed' ? '#fed7aa' : '#f8fafc',
                    color: currentTemplateType === 'detailed' ? '#9a3412' : '#374151'
                  }}>
                    Detailed
                    {currentTemplateType === 'detailed' && (
                      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>(Current)</div>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Get all unique metrics
                  const allMetrics = [];
                  const metricSet = new Set();
                  
                  Object.values(TEMPLATE_METRICS).forEach(template => {
                    template.metrics.forEach(metric => {
                      if (!metricSet.has(metric.key)) {
                        metricSet.add(metric.key);
                        allMetrics.push(metric);
                      }
                    });
                  });

                  // Check if a metric is required for a specific template
                  const isMetricRequired = (metricKey, templateKey) => {
                    const template = TEMPLATE_METRICS[templateKey];
                    return template.metrics.some(m => m.key === metricKey && m.required);
                  };

                  return allMetrics.map((metric, index) => (
                    <tr key={metric.key} style={{ 
                      borderTop: index > 0 ? '1px solid #e2e8f0' : 'none',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc' 
                    }}>
                      <td style={{ padding: '8px 12px', fontWeight: '500' }}>{metric.name}</td>
                      <td style={{ 
                        padding: '8px 12px', 
                        textAlign: 'center',
                        backgroundColor: currentTemplateType === 'simple' ? '#fef3c7' : (index % 2 === 0 ? 'white' : '#f8fafc')
                      }}>
                        {isMetricRequired(metric.key, 'simple') ? (
                          <Check size={14} style={{ color: '#059669', margin: '0 auto', display: 'block' }} />
                        ) : (
                          <X size={14} style={{ color: '#d1d5db', margin: '0 auto', display: 'block' }} />
                        )}
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        textAlign: 'center',
                        backgroundColor: currentTemplateType === 'standard' ? '#fef3c7' : (index % 2 === 0 ? 'white' : '#f8fafc')
                      }}>
                        {isMetricRequired(metric.key, 'standard') ? (
                          <Check size={14} style={{ color: '#059669', margin: '0 auto', display: 'block' }} />
                        ) : (
                          <X size={14} style={{ color: '#d1d5db', margin: '0 auto', display: 'block' }} />
                        )}
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        textAlign: 'center',
                        backgroundColor: currentTemplateType === 'detailed' ? '#fef3c7' : (index % 2 === 0 ? 'white' : '#f8fafc')
                      }}>
                        {isMetricRequired(metric.key, 'detailed') ? (
                          <Check size={14} style={{ color: '#059669', margin: '0 auto', display: 'block' }} />
                        ) : (
                          <X size={14} style={{ color: '#d1d5db', margin: '0 auto', display: 'block' }} />
                        )}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div> 
        </div>
      )} 
    </div>
  );
};
 export default MissingMetricsDisplay;