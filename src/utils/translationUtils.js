// translationUtils.js
// External Translation Services - Works in ALL browsers including Safari
import React, { useState, useEffect } from 'react';
export const ExternalTranslationManager = {
  
  // Check if user needs translation prompt
  shouldShowTranslationPrompt() {
    const domain = window.location.hostname;
    const appName = 'traxxia';
    const sessionKey = `translation-dismissed-${domain}-${appName}`;
    const choiceKey = `user-language-choice-${domain}-${appName}`;
    
    const hasLanguageChoice = sessionStorage.getItem(choiceKey);
    const userDismissed = sessionStorage.getItem(sessionKey);
    const browserLanguage = navigator.language || navigator.languages?.[0] || 'en';
    
    // Don't show if user already made a choice or dismissed in this session
    if (hasLanguageChoice || userDismissed) {
      return false;
    }
    
    // Show only for Spanish, Portuguese, French browsers
    const targetLanguages = ['es', 'pt', 'fr'];
    const browserLang = browserLanguage.split('-')[0].toLowerCase();
    
    return targetLanguages.includes(browserLang);
  },

  // Get suggested language based on browser
  getSuggestedLanguage() {
    const browserLanguage = navigator.language || navigator.languages?.[0] || 'en';
    const browserLang = browserLanguage.split('-')[0].toLowerCase();
    
    const languageMap = {
      'es': 'es', // Spanish
      'pt': 'pt', // Portuguese  
      'fr': 'fr', // French
    };
    
    return languageMap[browserLang] || 'es';
  },

  // Handle user's language choice
  handleLanguageChoice(language, permanent = true) {
    const domain = window.location.hostname;
    const appName = 'traxxia';
    
    const sessionKey = `translation-dismissed-${domain}-${appName}`;
    const choiceKey = `user-language-choice-${domain}-${appName}`;
    const langKey = `preferred-language-${domain}-${appName}`;
    
    if (permanent) {
      // Store in sessionStorage to keep it session-specific
      sessionStorage.setItem(choiceKey, 'true');
      sessionStorage.setItem(langKey, language);
    } else {
      // Just dismiss for this session
      sessionStorage.setItem(sessionKey, 'true');
    }
    
    if (language !== 'en') {
      this.showTranslationOptions(language);
    }
  },

  // Show external translation options
  showTranslationOptions(targetLanguage) {
    const languageNames = {
      'es': 'Spanish (Español)',
      'pt': 'Portuguese (Português)',
      'fr': 'French (Français)'
    };

    const currentUrl = encodeURIComponent(window.location.href);
    const modal = document.createElement('div');
    modal.className = 'external-translation-modal';
    modal.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content">
          <div class="modal-header">
            <h3>🌐 Translate to ${languageNames[targetLanguage]}</h3>
            <button class="modal-close" onclick="this.closest('.external-translation-modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <p>Choose a translation service to view this page in <strong>${languageNames[targetLanguage]}</strong>:</p>
            
            <div class="translation-services">
              <div class="service-option" onclick="window.translateWithGoogle('${targetLanguage}')">
                <div class="service-icon">
                  <div class="google-icon">G</div>
                </div>
                <div class="service-details">
                  <strong>Google Translate</strong>
                  <small>Fast and accurate translation</small>
                </div>
                <div class="service-arrow">→</div>
              </div>
              
              <div class="service-option" onclick="window.translateWithBing('${targetLanguage}')">
                <div class="service-icon">
                  <div class="bing-icon">B</div>
                </div>
                <div class="service-details">
                  <strong>Bing Translator</strong>
                  <small>Microsoft's translation service</small>
                </div>
                <div class="service-arrow">→</div>
              </div>
              
              <div class="service-option" onclick="window.translateWithYandex('${targetLanguage}')">
                <div class="service-icon">
                  <div class="yandex-icon">Y</div>
                </div>
                <div class="service-details">
                  <strong>Yandex Translate</strong>
                  <small>Alternative translation option</small>
                </div>
                <div class="service-arrow">→</div>
              </div>
            </div>
            
            <div class="modal-note">
              <small>🔗 Translation will open in a new tab</small>
            </div>
            
            <div class="modal-actions">
              <button onclick="window.ExternalTranslationManager.dismissTranslation()" class="btn-keep-english">
                Keep English
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    if (!document.querySelector('.external-translation-styles')) {
      const styles = document.createElement('style');
      styles.className = 'external-translation-styles';
      styles.textContent = `
        .external-translation-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(3px);
        }
        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 450px;
          width: 90%;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          animation: modalAppear 0.3s ease-out;
        }
        @keyframes modalAppear {
          from { transform: scale(0.9) translateY(-20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px 20px;
          background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
          color: white;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
        .modal-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .modal-body {
          padding: 28px;
        }
        .modal-body p {
          margin: 0 0 24px;
          color: #374151;
          line-height: 1.6;
          font-size: 16px;
        }
        .translation-services {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .service-option {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fafbfc;
        }
        .service-option:hover {
          border-color: #4285f4;
          background: #f8faff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(66, 133, 244, 0.15);
        }
        .service-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }
        .google-icon {
          background: #4285f4;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
        }
        .bing-icon {
          background: #0078d4;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
        }
        .yandex-icon {
          background: #ff3333;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
        }
        .service-details {
          flex: 1;
        }
        .service-details strong {
          display: block;
          color: #111827;
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
        }
        .service-details small {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.4;
        }
        .service-arrow {
          color: #9ca3af;
          font-size: 20px;
          font-weight: bold;
          transition: all 0.2s;
        }
        .service-option:hover .service-arrow {
          color: #4285f4;
          transform: translateX(4px);
        }
        .modal-note {
          text-align: center;
          margin-bottom: 24px;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 8px;
        }
        .modal-note small {
          color: #6b7280;
          font-size: 13px;
        }
        .modal-actions {
          display: flex;
          justify-content: center;
          padding-top: 20px;
          border-top: 1px solid #f3f4f6;
        }
        .btn-keep-english {
          padding: 12px 24px;
          background: #f9fafb;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-keep-english:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        @media (max-width: 480px) {
          .modal-content {
            width: 95%;
            margin: 20px;
          }
          .modal-body {
            padding: 20px;
          }
          .service-option {
            padding: 12px;
          }
          .service-details strong {
            font-size: 15px;
          }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(modal);

    // Set up translation functions
    window.translateWithGoogle = (lang) => {
      const translateUrl = `https://translate.google.com/translate?sl=en&tl=${lang}&u=${currentUrl}`;
      window.open(translateUrl, '_blank');
      modal.remove();
      this.handleLanguageChoice(lang, true);
    };

    window.translateWithBing = (lang) => {
      const translateUrl = `https://www.bing.com/translator?from=en&to=${lang}&text=${currentUrl}`;
      window.open(translateUrl, '_blank');
      modal.remove();
      this.handleLanguageChoice(lang, true);
    };

    window.translateWithYandex = (lang) => {
      const translateUrl = `https://translate.yandex.com/translate?lang=en-${lang}&url=${currentUrl}`;
      window.open(translateUrl, '_blank');
      modal.remove();
      this.handleLanguageChoice(lang, true);
    };

    window.ExternalTranslationManager = this;
  },

  // Dismiss translation and remember choice
  dismissTranslation() {
    const modal = document.querySelector('.external-translation-modal');
    if (modal) {
      modal.remove();
    }
    this.handleLanguageChoice('en', true);
  },

  // Create simple notification banner
  createTranslationBanner(targetLanguage) {
    const languageNames = {
      'es': 'Spanish',
      'pt': 'Portuguese', 
      'fr': 'French'
    };

    const banner = document.createElement('div');
    banner.className = 'external-translation-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-left">
          <span class="banner-icon">🌐</span>
          <span class="banner-text">Translate this page to ${languageNames[targetLanguage]}?</span>
        </div>
        <div class="banner-actions">
          <button onclick="window.ExternalTranslationManager.handleLanguageChoice('${targetLanguage}', true)" class="banner-btn primary">
            Translate
          </button>
          <button onclick="window.ExternalTranslationManager.handleLanguageChoice('en', true)" class="banner-btn secondary">
            Keep English
          </button>
          <button onclick="window.ExternalTranslationManager.dismissForSession()" class="banner-close">×</button>
        </div>
      </div>
    `;

    // Add banner styles
    if (!document.querySelector('.external-banner-styles')) {
      const bannerStyles = document.createElement('style');
      bannerStyles.className = 'external-banner-styles';
      bannerStyles.textContent = `
        .external-translation-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
          color: white;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          animation: bannerSlideDown 0.4s ease-out;
        }
        @keyframes bannerSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .banner-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .banner-icon {
          font-size: 20px;
        }
        .banner-text {
          font-size: 15px;
          font-weight: 500;
        }
        .banner-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .banner-btn {
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .banner-btn.primary {
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          border-color: transparent;
        }
        .banner-btn.primary:hover {
          background: white;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .banner-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        .banner-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .banner-close {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          margin-left: 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .banner-close:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }
        @media (max-width: 768px) {
          .banner-content {
            flex-direction: column;
            gap: 12px;
            padding: 16px 20px;
          }
          .banner-actions {
            width: 100%;
            justify-content: center;
          }
          .banner-text {
            text-align: center;
          }
        }
      `;
      document.head.appendChild(bannerStyles);
    }

    document.body.insertAdjacentElement('afterbegin', banner);
    window.ExternalTranslationManager = this;

    // Auto-hide after 20 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.style.animation = 'bannerSlideUp 0.3s ease-out forwards';
        setTimeout(() => banner.remove(), 300);
        this.dismissForSession();
      }
    }, 20000);

    return banner;
  },

  // Dismiss for current session only
  dismissForSession() {
    const banner = document.querySelector('.external-translation-banner');
    if (banner) {
      banner.remove();
    }
    
    const domain = window.location.hostname;
    const appName = 'traxxia';
    const sessionKey = `translation-dismissed-${domain}-${appName}`;
    
    sessionStorage.setItem(sessionKey, 'true');
  },

  // Reset user preferences (for testing)
  resetPreferences() {
    const domain = window.location.hostname;
    const appName = 'traxxia';
    
    const sessionKey = `translation-dismissed-${domain}-${appName}`;
    const choiceKey = `user-language-choice-${domain}-${appName}`;
    const langKey = `preferred-language-${domain}-${appName}`;
    
    sessionStorage.removeItem(choiceKey);
    sessionStorage.removeItem(langKey);
    sessionStorage.removeItem(sessionKey);
  }
};

// React Hook for easy integration
export const useExternalTranslation = () => {
  const [showTranslatePrompt, setShowTranslatePrompt] = React.useState(false);
  const [currentLanguage, setCurrentLanguage] = React.useState('en');

  React.useEffect(() => {
    // Check if we should show translation prompt
    if (ExternalTranslationManager.shouldShowTranslationPrompt()) {
      // Delay to avoid interrupting initial page load
      const timer = setTimeout(() => {
        setShowTranslatePrompt(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    // Load saved language preference (session-specific)
    const domain = window.location.hostname;
    const appName = 'traxxia';
    const langKey = `preferred-language-${domain}-${appName}`;
    const savedLanguage = sessionStorage.getItem(langKey);
    
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageChoice = (language, permanent = true) => {
    setCurrentLanguage(language);
    setShowTranslatePrompt(false);
    ExternalTranslationManager.handleLanguageChoice(language, permanent);
  };

  const showTranslationBanner = () => {
    const targetLanguage = ExternalTranslationManager.getSuggestedLanguage();
    ExternalTranslationManager.createTranslationBanner(targetLanguage);
    setShowTranslatePrompt(false);
  };

  const showTranslationModal = () => {
    const targetLanguage = ExternalTranslationManager.getSuggestedLanguage();
    ExternalTranslationManager.showTranslationOptions(targetLanguage);
    setShowTranslatePrompt(false);
  };

  return {
    showTranslatePrompt,
    currentLanguage,
    handleLanguageChoice,
    showTranslationBanner,
    showTranslationModal,
    resetPreferences: ExternalTranslationManager.resetPreferences
  };
};