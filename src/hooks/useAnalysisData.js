import { useState, useCallback } from 'react';
import { Groq } from 'groq-sdk';
import {
  getAnalysisSystemContent,
  buildUserPrompt,
  ANALYSIS_NAMES
} from '../utils/analysisHelpers';

export const useAnalysisData = () => {
  const [analysisData, setAnalysisData] = useState({});
  const [analysisLoading, setAnalysisLoading] = useState({});

  const groqClient = new Groq({
    apiKey: process.env.REACT_APP_GROQ_API_KEY,
    dangerouslyAllowBrowser: true
  });

  // Get current language
  const getCurrentLanguage = () => {
    return window.currentAppLanguage || 'en';
  };

  // Get translation function
  const getTranslation = (key) => {
    if (window.getTranslation) {
      return window.getTranslation(key);
    }
    return key;
  };

  // Get language-specific system content
  const getLocalizedSystemContent = (analysisType, language) => {
    const baseContent = getAnalysisSystemContent(analysisType);
    
    if (language === 'es') {
      return `${baseContent}

IMPORTANTE: Responde COMPLETAMENTE en ESPAÑOL. Todo el análisis, recomendaciones, ejemplos y conclusiones deben estar en español. No uses inglés en ninguna parte de tu respuesta.

Tu respuesta debe incluir:
- Introducción en español
- Análisis detallado en español
- Recomendaciones específicas en español
- Conclusiones en español

Asegúrate de que todo el contenido esté en español perfecto y sea culturalmente apropiado para hablantes de español.`;
    }
    
    return baseContent;
  };

  // Get language-specific user prompt
  const getLocalizedUserPrompt = (analysisType, businessData, strategicBooks, language) => {
    const basePrompt = buildUserPrompt(analysisType, businessData, strategicBooks);
    
    if (language === 'es') {
      return `${basePrompt}

INSTRUCCIONES ADICIONALES:
- Responde COMPLETAMENTE en español
- Todos los títulos, subtítulos y contenido deben estar en español
- Usa terminología de negocios apropiada para el mercado hispanohablante
- Los ejemplos y casos de estudio deben ser relevantes para empresas de habla hispana cuando sea posible
- Mantén un tono profesional en español

Por favor proporciona un análisis integral y detallado completamente en español.`;
    }
    
    return basePrompt;
  };

  // Get loading message based on language
  const getLoadingMessage = (analysisType, language) => {
    if (language === 'es') {
      return `Analizando respuestas con el marco ${getTranslation(`${analysisType}_analysis`)}...`;
    }
    return `Analyzing responses with ${analysisType.toUpperCase()} framework...`;
  };

  // Get error message based on language
  const getErrorMessage = (analysisType, error, language) => {
    if (language === 'es') {
      return `Error generando análisis ${getTranslation(`${analysisType}_analysis`)}: ${error.message}`;
    }
    return `Error generating ${analysisType} analysis: ${error.message}`;
  };

  // Updated generateAnalysis function with language support
  const generateAnalysis = useCallback(async (analysisType, frameworkId, businessData, strategicBooks, forceRefresh = false) => {
    const currentLanguage = getCurrentLanguage();
    const cacheKey = `${frameworkId}-${analysisType}-${currentLanguage}`; // Include language in cache key

    console.log(`🌐 Generating analysis in language: ${currentLanguage}`);

    // IMPORTANT: Only check cache if NOT forcing refresh
    if (!forceRefresh && analysisData[cacheKey] && !analysisLoading[cacheKey]) {
      console.log(`📋 Using cached analysis for ${cacheKey}`);
      return analysisData[cacheKey];
    }

    // Prevent multiple simultaneous calls for the same analysis
    if (analysisLoading[cacheKey]) {
      console.log(`⏳ Analysis already loading for ${cacheKey}`);
      return;
    }

    try {
      setAnalysisLoading(prev => ({ ...prev, [cacheKey]: true }));

      // Set initial loading message in appropriate language
      const loadingMessage = getLoadingMessage(analysisType, currentLanguage);
      setAnalysisData(prev => ({
        ...prev,
        [cacheKey]: loadingMessage
      }));

      console.log(`🚀 Starting ${analysisType} analysis in ${currentLanguage}`);

      // Get localized content
      const systemContent = getLocalizedSystemContent(analysisType, currentLanguage);
      const userPrompt = getLocalizedUserPrompt(analysisType, businessData, strategicBooks, currentLanguage);

      console.log(`📝 System content length: ${systemContent.length} characters`);
      console.log(`📝 User prompt length: ${userPrompt.length} characters`);

      const messages = [
        { role: "system", content: systemContent },
        { role: "user", content: userPrompt }
      ];

      // Enhanced parameters for better Spanish responses
      const chatCompletion = await groqClient.chat.completions.create({
        messages: messages,
        model: "llama-3.3-70b-versatile",
        temperature: currentLanguage === 'es' ? 0.8 : 0.7, // Slightly higher temperature for Spanish
        max_tokens: 31980,
        top_p: 1,
        stream: false,
        stop: null
      });

      const content = chatCompletion.choices[0].message.content;
      
      console.log(`✅ Analysis generated successfully in ${currentLanguage}`);
      console.log(`📊 Response length: ${content.length} characters`);

      setAnalysisData(prev => ({
        ...prev,
        [cacheKey]: content
      }));

      return content;
    } catch (error) {
      console.error('❌ Error generating analysis:', error);
      const errorMessage = getErrorMessage(analysisType, error, currentLanguage);

      setAnalysisData(prev => ({
        ...prev,
        [cacheKey]: errorMessage
      }));

      return errorMessage;
    } finally {
      setAnalysisLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [analysisData, analysisLoading, groqClient]);

  // Clear cache function with language support
  const clearAnalysisCache = useCallback((cacheKey = null, language = null) => {
    if (cacheKey && language) {
      // Clear specific analysis for specific language
      const fullCacheKey = `${cacheKey}-${language}`;
      setAnalysisData(prev => {
        const newData = { ...prev };
        delete newData[fullCacheKey];
        return newData;
      });
    } else if (cacheKey) {
      // Clear all language versions of specific analysis
      setAnalysisData(prev => {
        const newData = { ...prev };
        Object.keys(newData).forEach(key => {
          if (key.startsWith(cacheKey)) {
            delete newData[key];
          }
        });
        return newData;
      });
    } else {
      // Clear all cache
      setAnalysisData({});
    }
  }, []);

  // Clear cache when language changes
  const clearCacheForLanguageChange = useCallback(() => {
    const currentLanguage = getCurrentLanguage();
    console.log(`🌐 Language changed to ${currentLanguage}, clearing incompatible cache`);
    
    setAnalysisData(prev => {
      const newData = {};
      // Keep only analyses for current language
      Object.keys(prev).forEach(key => {
        if (key.endsWith(`-${currentLanguage}`)) {
          newData[key] = prev[key];
        }
      });
      return newData;
    });
  }, []);

  // Get analysis with language fallback
  const getAnalysisForCurrentLanguage = useCallback((frameworkId, analysisType) => {
    const currentLanguage = getCurrentLanguage();
    const cacheKey = `${frameworkId}-${analysisType}-${currentLanguage}`;
    
    return analysisData[cacheKey] || null;
  }, [analysisData]);

  return {
    analysisData,
    analysisLoading,
    generateAnalysis,
    clearAnalysisCache,
    clearCacheForLanguageChange,
    getAnalysisForCurrentLanguage,
    setAnalysisData,
    setAnalysisLoading
  };
};