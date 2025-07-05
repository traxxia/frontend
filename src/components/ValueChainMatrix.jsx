import React, { useEffect, useState } from 'react';
import '../styles/dashboard.css';
import { detectLanguage, analysisPatterns } from '../utils/translations';

const ValueChainMatrix = ({ analysisResult }) => {
  const lang = detectLanguage(analysisResult);
  const t = analysisPatterns[lang]?.valueChain || analysisPatterns['en'].valueChain;
  
  const [sections, setSections] = useState({
    primaryActivities: {
      overview: '',
      inboundLogistics: '',
      operations: '',
      outboundLogistics: '',
      marketingSales: '',
      service: ''
    },
    supportActivities: {
      overview: '',
      firmInfrastructure: '',
      hrManagement: '',
      techDevelopment: '',
      procurement: ''
    },
    margin: { summary: '' },
    linkages: { summary: '' },
  });

  useEffect(() => {
    if (analysisResult) {
      const parsedData = parseValueChainAnalysis(analysisResult, t, lang);
      setSections(parsedData);
    }
  }, [analysisResult, lang]);

  const parseValueChainAnalysis = (text, t, language) => {
    const result = {
      primaryActivities: {
        overview: '',
        inboundLogistics: '',
        operations: '',
        outboundLogistics: '',
        marketingSales: '',
        service: ''
      },
      supportActivities: {
        overview: '',
        firmInfrastructure: '',
        hrManagement: '',
        techDevelopment: '',
        procurement: ''
      },
      margin: { summary: '' },
      linkages: { summary: '' },
    };

    // Helper function to escape regex special characters
    const escapeRegex = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Define patterns based on language
    const patterns = language === 'es' ? {
      // Spanish patterns
      primarySection: /\*\*Actividades Primarias\*\*([\s\S]*?)(?=\*\*Actividades de Apoyo\*\*|$)/i,
      supportSection: /\*\*Actividades de Apoyo\*\*([\s\S]*?)(?=\*\*Margen\*\*|$)/i,
      marginSection: /\*\*Margen\*\*([\s\S]*?)(?=\*\*Vínculos\*\*|$)/i,
      linkagesSection: /\*\*Vínculos\*\*([\s\S]*?)(?=\*\*Conclusión|En resumen|$)/i,
      
      // Individual activity patterns for Spanish
      activities: {
        inboundLogistics: [
          /\*\*Logística de Entrada\*\*:\s*([\s\S]*?)(?=\*\*Operaciones\*\*|$)/i,
          /-\s*\*\*Logística de Entrada\*\*:\s*([\s\S]*?)(?=-\s*\*\*Operaciones\*\*|$)/i,
          /Logística de Entrada[:\s]+([\s\S]*?)(?=Operaciones|$)/i
        ],
        operations: [
          /\*\*Operaciones\*\*:\s*([\s\S]*?)(?=\*\*Logística de Salida\*\*|$)/i,
          /-\s*\*\*Operaciones\*\*:\s*([\s\S]*?)(?=-\s*\*\*Logística de Salida\*\*|$)/i,
          /Operaciones[:\s]+([\s\S]*?)(?=Logística de Salida|$)/i
        ],
        outboundLogistics: [
          /\*\*Logística de Salida\*\*:\s*([\s\S]*?)(?=\*\*Marketing y Ventas\*\*|$)/i,
          /-\s*\*\*Logística de Salida\*\*:\s*([\s\S]*?)(?=-\s*\*\*Marketing y Ventas\*\*|$)/i,
          /Logística de Salida[:\s]+([\s\S]*?)(?=Marketing y Ventas|$)/i
        ],
        marketingSales: [
          /\*\*Marketing y Ventas\*\*:\s*([\s\S]*?)(?=\*\*Servicio\*\*|$)/i,
          /-\s*\*\*Marketing y Ventas\*\*:\s*([\s\S]*?)(?=-\s*\*\*Servicio\*\*|$)/i,
          /Marketing y Ventas[:\s]+([\s\S]*?)(?=Servicio|$)/i
        ],
        service: [
          /\*\*Servicio\*\*:\s*([\s\S]*?)(?=\*\*Actividades de Apoyo|$)/i,
          /-\s*\*\*Servicio\*\*:\s*([\s\S]*?)$/i,
          /Servicio[:\s]+([\s\S]*?)(?=Actividades de Apoyo|$)/i
        ],
        firmInfrastructure: [
          /\*\*Infraestructura de la Empresa\*\*:\s*([\s\S]*?)(?=\*\*Gestión de Recursos Humanos\*\*|$)/i,
          /-\s*\*\*Infraestructura de la Empresa\*\*:\s*([\s\S]*?)(?=-\s*\*\*Gestión de Recursos Humanos\*\*|$)/i,
          /Infraestructura de la Empresa[:\s]+([\s\S]*?)(?=Gestión de Recursos Humanos|$)/i
        ],
        hrManagement: [
          /\*\*Gestión de Recursos Humanos\*\*:\s*([\s\S]*?)(?=\*\*Desarrollo Tecnológico\*\*|$)/i,
          /-\s*\*\*Gestión de Recursos Humanos\*\*:\s*([\s\S]*?)(?=-\s*\*\*Desarrollo Tecnológico\*\*|$)/i,
          /Gestión de Recursos Humanos[:\s]+([\s\S]*?)(?=Desarrollo Tecnológico|$)/i
        ],
        techDevelopment: [
          /\*\*Desarrollo Tecnológico\*\*:\s*([\s\S]*?)(?=\*\*Adquisiciones\*\*|$)/i,
          /-\s*\*\*Desarrollo Tecnológico\*\*:\s*([\s\S]*?)(?=-\s*\*\*Adquisiciones\*\*|$)/i,
          /Desarrollo Tecnológico[:\s]+([\s\S]*?)(?=Adquisiciones|$)/i
        ],
        procurement: [
          /\*\*Adquisiciones\*\*:\s*([\s\S]*?)(?=\*\*Margen|$)/i,
          /-\s*\*\*Adquisiciones\*\*:\s*([\s\S]*?)$/i,
          /Adquisiciones[:\s]+([\s\S]*?)(?=Margen|$)/i
        ]
      }
    } : {
      // English patterns
      primarySection: /\*\*Primary Activities\*\*([\s\S]*?)(?=\*\*Support Activities\*\*|$)/i,
      supportSection: /\*\*Support Activities\*\*([\s\S]*?)(?=\*\*Margin\*\*|$)/i,
      marginSection: /\*\*Margin\*\*([\s\S]*?)(?=\*\*Linkages\*\*|$)/i,
      linkagesSection: /\*\*Linkages\*\*([\s\S]*?)(?=\*\*Conclusion|In conclusion|$)/i,
      
      // Individual activity patterns for English
      activities: {
        inboundLogistics: [
          /\*\*Inbound Logistics\*\*:\s*([\s\S]*?)(?=\*\*Operations\*\*|$)/i,
          /-\s*\*\*Inbound Logistics\*\*:\s*([\s\S]*?)(?=-\s*\*\*Operations\*\*|$)/i,
          /Inbound Logistics[:\s]+([\s\S]*?)(?=Operations|$)/i
        ],
        operations: [
          /\*\*Operations\*\*:\s*([\s\S]*?)(?=\*\*Outbound Logistics\*\*|$)/i,
          /-\s*\*\*Operations\*\*:\s*([\s\S]*?)(?=-\s*\*\*Outbound Logistics\*\*|$)/i,
          /Operations[:\s]+([\s\S]*?)(?=Outbound Logistics|$)/i
        ],
        outboundLogistics: [
          /\*\*Outbound Logistics\*\*:\s*([\s\S]*?)(?=\*\*Marketing (?:&|and) Sales\*\*|$)/i,
          /-\s*\*\*Outbound Logistics\*\*:\s*([\s\S]*?)(?=-\s*\*\*Marketing (?:&|and) Sales\*\*|$)/i,
          /Outbound Logistics[:\s]+([\s\S]*?)(?=Marketing (?:&|and) Sales|$)/i
        ],
        marketingSales: [
          /\*\*Marketing (?:&|and) Sales\*\*:\s*([\s\S]*?)(?=\*\*Service\*\*|$)/i,
          /-\s*\*\*Marketing (?:&|and) Sales\*\*:\s*([\s\S]*?)(?=-\s*\*\*Service\*\*|$)/i,
          /Marketing (?:&|and) Sales[:\s]+([\s\S]*?)(?=Service|$)/i
        ],
        service: [
          /\*\*Service\*\*:\s*([\s\S]*?)(?=\*\*Support Activities|$)/i,
          /-\s*\*\*Service\*\*:\s*([\s\S]*?)$/i,
          /Service[:\s]+([\s\S]*?)(?=Support Activities|$)/i
        ],
        firmInfrastructure: [
          /\*\*Firm Infrastructure\*\*:\s*([\s\S]*?)(?=\*\*Human Resource Management\*\*|$)/i,
          /-\s*\*\*Firm Infrastructure\*\*:\s*([\s\S]*?)(?=-\s*\*\*Human Resource Management\*\*|$)/i,
          /Firm Infrastructure[:\s]+([\s\S]*?)(?=Human Resource Management|$)/i
        ],
        hrManagement: [
          /\*\*Human Resource Management\*\*:\s*([\s\S]*?)(?=\*\*Technology Development\*\*|$)/i,
          /-\s*\*\*Human Resource Management\*\*:\s*([\s\S]*?)(?=-\s*\*\*Technology Development\*\*|$)/i,
          /Human Resource Management[:\s]+([\s\S]*?)(?=Technology Development|$)/i
        ],
        techDevelopment: [
          /\*\*Technology Development\*\*:\s*([\s\S]*?)(?=\*\*Procurement\*\*|$)/i,
          /-\s*\*\*Technology Development\*\*:\s*([\s\S]*?)(?=-\s*\*\*Procurement\*\*|$)/i,
          /Technology Development[:\s]+([\s\S]*?)(?=Procurement|$)/i
        ],
        procurement: [
          /\*\*Procurement\*\*:\s*([\s\S]*?)(?=\*\*Margin|$)/i,
          /-\s*\*\*Procurement\*\*:\s*([\s\S]*?)$/i,
          /Procurement[:\s]+([\s\S]*?)(?=Margin|$)/i
        ]
      }
    };

    // Extract activities using multiple pattern attempts
    const extractActivity = (activityPatterns) => {
      for (const pattern of activityPatterns) {
        const match = pattern.exec(text);
        if (match && match[1]) {
          let content = match[1].trim();
          // Clean up the content
          content = content
            .replace(/^\*+\s*/, '')
            .replace(/\s*\*+$/, '')
            .replace(/^-\s*/, '')
            .trim();
          
          if (content.length > 10) {
            return content;
          }
        }
      }
      return '';
    };

    // Extract all activities
    result.primaryActivities.inboundLogistics = extractActivity(patterns.activities.inboundLogistics);
    result.primaryActivities.operations = extractActivity(patterns.activities.operations);
    result.primaryActivities.outboundLogistics = extractActivity(patterns.activities.outboundLogistics);
    result.primaryActivities.marketingSales = extractActivity(patterns.activities.marketingSales);
    result.primaryActivities.service = extractActivity(patterns.activities.service);
    
    result.supportActivities.firmInfrastructure = extractActivity(patterns.activities.firmInfrastructure);
    result.supportActivities.hrManagement = extractActivity(patterns.activities.hrManagement);
    result.supportActivities.techDevelopment = extractActivity(patterns.activities.techDevelopment);
    result.supportActivities.procurement = extractActivity(patterns.activities.procurement);

    // Extract Margin and Linkages
    const marginMatch = patterns.marginSection.exec(text);
    if (marginMatch && marginMatch[1]) {
      result.margin.summary = marginMatch[1].trim()
        .replace(/^\*+\s*/, '')
        .replace(/\s*\*+$/, '');
    }

    const linkagesMatch = patterns.linkagesSection.exec(text);
    if (linkagesMatch && linkagesMatch[1]) {
      result.linkages.summary = linkagesMatch[1].trim()
        .replace(/^\*+\s*/, '')
        .replace(/\s*\*+$/, '');
    }

    return result;
  };

  const getConclusionText = () => {
    if (!analysisResult) return "";
    
    const patterns = [
      /\*\*Conclusión y Recomendaciones\*\*([\s\S]*?)$/i,
      /\*\*Conclusión\*\*([\s\S]*?)$/i,
      /En resumen[,:]\s*([\s\S]*?)$/i,
      /\*\*Conclusion and Recommendations\*\*([\s\S]*?)$/i,
      /\*\*Conclusion\*\*([\s\S]*?)$/i,
      /In summary[,:]\s*([\s\S]*?)$/i
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(analysisResult);
      if (match && match[1]) {
        let conclusion = match[1].trim();
        conclusion = conclusion
          .replace(/^\*+\s*/, '')
          .replace(/\s*\*+$/, '');
        
        if (conclusion.length > 20) {
          return conclusion;
        }
      }
    }
    return "";
  };

  const formatContent = (content) => {
    if (!content) return t.noAnalysis;
    
    // Convert content to HTML with proper line breaks
    return content
      .replace(/\n/g, '<br/>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div className="value-chain-static">
      <h4 className="text-center mb-4">{t.title}</h4>

      {/* Support Activities */}
      <div className="support-activities">
        <div className="support-row">
          <div className="support-block infrastructure">
            <strong>{t.sections.firmInfrastructure}</strong>
            <span dangerouslySetInnerHTML={{ 
              __html: formatContent(sections.supportActivities.firmInfrastructure) 
            }} />
          </div>
          <div className="support-block hr">
            <strong>{t.sections.hrManagement}</strong>
            <span dangerouslySetInnerHTML={{ 
              __html: formatContent(sections.supportActivities.hrManagement) 
            }} />
          </div>
          <div className="support-block tech">
            <strong>{t.sections.techDevelopment}</strong>
            <span dangerouslySetInnerHTML={{ 
              __html: formatContent(sections.supportActivities.techDevelopment) 
            }} />
          </div>
          <div className="support-block procurement">
            <strong>{t.sections.procurement}</strong>
            <span dangerouslySetInnerHTML={{ 
              __html: formatContent(sections.supportActivities.procurement) 
            }} />
          </div>
        </div>
      </div>

      {/* Primary Activities */}
      <div className="primary-activities">
        <div className="primary-block inbound">
          <strong>{t.sections.inboundLogistics}</strong>
          <span dangerouslySetInnerHTML={{ 
            __html: formatContent(sections.primaryActivities.inboundLogistics) 
          }} />
        </div>
        <div className="primary-block operations">
          <strong>{t.sections.operations}</strong>
          <span dangerouslySetInnerHTML={{ 
            __html: formatContent(sections.primaryActivities.operations) 
          }} />
        </div>
        <div className="primary-block outbound">
          <strong>{t.sections.outboundLogistics}</strong>
          <span dangerouslySetInnerHTML={{ 
            __html: formatContent(sections.primaryActivities.outboundLogistics) 
          }} />
        </div>
        <div className="primary-block marketing">
          <strong>{t.sections.marketingSales}</strong>
          <span dangerouslySetInnerHTML={{ 
            __html: formatContent(sections.primaryActivities.marketingSales) 
          }} />
        </div>
        <div className="primary-block service">
          <strong>{t.sections.service}</strong>
          <span dangerouslySetInnerHTML={{ 
            __html: formatContent(sections.primaryActivities.service) 
          }} />
        </div>
      </div>

      {/* Margin and Linkages Analysis */}
      <div className="blue-triangle-container">
        <div className="blue-triangle">
          <div className="margin-analysis left-slant">
            <h5>{t.margin}</h5>
            <div dangerouslySetInnerHTML={{ 
              __html: formatContent(sections.margin.summary) 
            }} />
          </div>
          
          <div className="linkages-analysis right-slant">
            <h5>{t.linkages}</h5>
            <div dangerouslySetInnerHTML={{ 
              __html: formatContent(sections.linkages.summary) 
            }} />
          </div>
        </div>
      </div>

      {getConclusionText() && (
        <div className="mt-4 conclusion-section">
          <h5><strong>{t.conclusion}</strong></h5>
          <div className="conclusion-text">
            <div dangerouslySetInnerHTML={{ 
              __html: String(getConclusionText()).replace(/\n/g, "<br/>") 
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ValueChainMatrix;