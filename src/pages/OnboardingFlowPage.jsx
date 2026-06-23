import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MenuBar from '../components/MenuBar';
import { useAuthStore, useBusinessStore, useUIStore } from '../store';
import '../styles/onboarding-chat.css';
import '../styles/onboarding-flow.css';
import { AnalysisApiService } from '../services/analysisApiService';
import { ChevronDown, ChevronUp, Lock, File, ArrowRight, Check } from 'lucide-react';
import OnboardingChat from '../components/OnboardingChat';
import AiMessageRenderer from '../components/AiMessageRenderer';

const OnboardingFlowPage = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const business = location.state?.business || useBusinessStore.getState().selectedBusiness;
  const addToast = useUIStore(state => state.addToast);

  const userName = useAuthStore(state => state.userName) || 'User';
  const businessName = business?.business_name || 'your business';

  const pmfData = location.state?.pmfData;
  const [expandedSection, setExpandedSection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnboardingStarted, setIsOnboardingStarted] = useState(true);

  // Step 1
  const [purpose, setPurpose] = useState(pmfData?.businessPurpose?.purpose || pmfData?.purpose || '');
  const [description, setDescription] = useState(pmfData?.businessPurpose?.description || pmfData?.description || '');

  // Step 2
  const [country, setCountry] = useState(pmfData?.location?.country || pmfData?.country || '');
  const [city, setCity] = useState(pmfData?.location?.city || pmfData?.city || '');

  // Step 3
  const [primaryIndustry, setPrimaryIndustry] = useState(pmfData?.industry?.primaryIndustry || pmfData?.primaryIndustry || '');

  // Step 4
  const [geo1, setGeo1] = useState(pmfData?.core?.geographies?.[0] || pmfData?.geography1 || '');
  const [geo2, setGeo2] = useState(pmfData?.core?.geographies?.[1] || pmfData?.geography2 || '');
  const [geo3, setGeo3] = useState(pmfData?.core?.geographies?.[2] || pmfData?.geography3 || '');
  const [seg1, setSeg1] = useState(pmfData?.core?.customerSegments?.[0] || pmfData?.customerSegment1 || '');
  const [seg2, setSeg2] = useState(pmfData?.core?.customerSegments?.[1] || pmfData?.customerSegment2 || '');
  const [seg3, setSeg3] = useState(pmfData?.core?.customerSegments?.[2] || pmfData?.customerSegment3 || '');
  const [prod1, setProd1] = useState(pmfData?.core?.productsServices?.[0] || pmfData?.productService1 || '');
  const [prod2, setProd2] = useState(pmfData?.core?.productsServices?.[1] || pmfData?.productService2 || '');
  const [prod3, setProd3] = useState(pmfData?.core?.productsServices?.[2] || pmfData?.productService3 || '');
  const [chan1, setChan1] = useState(pmfData?.core?.channels?.[0] || pmfData?.channel1 || '');
  const [chan2, setChan2] = useState(pmfData?.core?.channels?.[1] || pmfData?.channel2 || '');
  const [chan3, setChan3] = useState(pmfData?.core?.channels?.[2] || pmfData?.channel3 || '');

  // Step 5
  const [competeOptions, setCompeteOptions] = useState(() => {
    const selected = pmfData?.competitiveDimensions?.selected || pmfData?.differentiation || [];
    const labelToKeyMap = {
      'price': 'price',
      'quality': 'quality',
      'speed': 'speed',
      'relationships': 'relationships',
      'customization': 'customization',
      'scale': 'scale',
      'brand': 'brand',
      'other': 'other'
    };

    let mappedState = {
      price: false,
      quality: false,
      speed: false,
      relationships: false,
      customization: false,
      scale: false,
      brand: false,
      other: false
    };

    selected.forEach(val => {
      const lowerVal = val.toLowerCase().trim();
      let matchedKey = null;

      for (const [label, key] of Object.entries(labelToKeyMap)) {
        if (lowerVal.includes(label)) {
          matchedKey = key;
          break;
        }
      }

      if (matchedKey) {
        mappedState[matchedKey] = true;
      } else {
        mappedState.other = true;
      }
    });

    return mappedState;
  });

  const [otherCompeteValue, setOtherCompeteValue] = useState(() => {
    const selected = pmfData?.competitiveDimensions?.selected || pmfData?.differentiation || [];
    const labelToKeyMap = ['price', 'quality', 'speed', 'relationships', 'customization', 'scale', 'brand', 'other'];
    let unmapped = [];
    selected.forEach(val => {
      const lowerVal = val.toLowerCase().trim();
      const matched = labelToKeyMap.some(label => lowerVal.includes(label));
      if (!matched) unmapped.push(val);
    });
    return unmapped.join(', ');
  });

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const historyFetchedRef = useRef(false);

  useEffect(() => {
    if (!historyFetchedRef.current) {
      historyFetchedRef.current = true;
      const fetchHistory = async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;
        try {
          const targetBusinessId = business?._id || business?.id || businessId;
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/ai-chat/history/${targetBusinessId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.data.history && response.data.history.length > 0) {
            setChatMessages(response.data.history.map((msg) => ({ role: msg.role, content: msg.text })));
          }
        } catch (error) {
          console.error("Error fetching AI chat history:", error);
        }
      };
      fetchHistory();
    }
  }, [business, businessId]);

  const saveMessageToHistory = async (role, text) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const targetBusinessId = business?._id || business?.id || businessId;
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/ai-chat/history`,
        { role, text, project_id: targetBusinessId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error saving AI chat message:", error);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);
    await saveMessageToHistory('user', userMessage);

    try {
      const targetBusinessId = business?._id || business?.id || businessId;
      const response = await fetch(import.meta.env.VITE_AI_CHAT_URL || 'http://localhost:4111/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': targetBusinessId || 'unknown'
        },
        body: JSON.stringify({
          message: userMessage,
          current_page: 'Onboarding Flow',
          page_description: 'User is filling out the 5-step PMF onboarding form to generate insights.',
          page_content: {
            purpose, description, country, city, primaryIndustry,
            geographies: [geo1, geo2, geo3].filter(Boolean),
            segments: [seg1, seg2, seg3].filter(Boolean),
            products: [prod1, prod2, prod3].filter(Boolean),
            channels: [chan1, chan2, chan3].filter(Boolean),
            differentiation: getSelectedDifferentiation()
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.response) {
        setChatMessages(prev => [...prev, { role: 'trax', content: data.response }]);
        await saveMessageToHistory('assistant', data.response);
      } else {
        setChatMessages(prev => [...prev, { role: 'trax', content: "Sorry, I encountered an error connecting to the AI assistant." }]);
        console.error("Chat API error:", data);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'trax', content: "Sorry, I couldn't reach the AI assistant." }]);
      console.error("Chat API fetch error:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCompeteToggle = (option) => {
    setCompeteOptions(prev => {
      const isChecked = prev[option];
      if (!isChecked) {
        // Enforce max 3
        const selectedCount = Object.values(prev).filter(Boolean).length;
        if (selectedCount >= 3) return prev;
      }
      return { ...prev, [option]: !isChecked };
    });
  };

  const handleGenerateInsights = async () => {
    setIsSubmitting(true);
    try {
      const ML_API_BASE_URL = import.meta.env.VITE_ML_BACKEND_URL;
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
      const getAuthToken = () => useAuthStore.getState().token;
      const analysisService = new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);

      const targetBusinessId = business?._id || business?.id || businessId;

      const rawPayload = {
        company: {
          name: businessName,
          website: business?.website || "N/A",
          location: {
            city: city || "N/A",
            country: country
          },
          industry: primaryIndustry,
          geographies: [geo1, geo2, geo3].filter(Boolean),
          profits: {
            source: {
              "Segments": [seg1, seg2, seg3].filter(Boolean),
              "Products": [prod1, prod2, prod3].filter(Boolean),
              "Channels": [chan1, chan2, chan3].filter(Boolean)
            }
          },
          objective: purpose,
          constraint: {
            primary: "N/A"
          },
          usp: getSelectedDifferentiation()
        }
      };

      const dataToSave = {
        companyName: businessName,
        purpose, description, country, city, primaryIndustry,
        geography1: geo1, geography2: geo2, geography3: geo3,
        customerSegment1: seg1, customerSegment2: seg2, customerSegment3: seg3,
        productService1: prod1, productService2: prod2, productService3: prod3,
        channel1: chan1, channel2: chan2, channel3: chan3,
        differentiation: getSelectedDifferentiation()
      };

      try {
        await analysisService.savePMFOnboardingData(targetBusinessId, dataToSave);
      } catch (err) {
        console.warn("Could not save pmf onboarding data, continuing...", err);
      }

      const [insightResult, summaryResult] = await Promise.all([
        analysisService.makeAPICall('aha-insight', null, null, targetBusinessId, null, null, null, businessName, rawPayload),
        analysisService.makeAPICall('executive-summary', null, null, targetBusinessId, null, null, null, businessName, rawPayload)
      ]);

      await analysisService.savePMFInsights(targetBusinessId, insightResult);
      await analysisService.savePMFExecutiveSummary(targetBusinessId, summaryResult);

      window.dispatchEvent(new CustomEvent('pmfOnboardingCompleted'));

      navigate(`/businesspage?business=${business?.business_slug || targetBusinessId}&tab=executive`, {
        state: { business, initialTab: 'executive' }
      });
    } catch (err) {
      console.error("Failed to generate insights:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const step4Completed =
    (geo1.trim() !== '' || geo2.trim() !== '' || geo3.trim() !== '') &&
    (seg1.trim() !== '' || seg2.trim() !== '' || seg3.trim() !== '') &&
    (prod1.trim() !== '' || prod2.trim() !== '' || prod3.trim() !== '') &&
    (chan1.trim() !== '' || chan2.trim() !== '' || chan3.trim() !== '');

  const step5SelectedCount = Object.values(competeOptions).filter(Boolean).length;
  const step5Completed = step5SelectedCount > 0 && (!(competeOptions.other && step5SelectedCount === 1) || otherCompeteValue.trim() !== '');

  const getSelectedDifferentiation = useCallback(() => {
    const selected = Object.keys(competeOptions).filter(k => k !== 'other' && competeOptions[k]);
    if (competeOptions.other && otherCompeteValue.trim()) {
      selected.push(otherCompeteValue.trim());
    }
    return selected;
  }, [competeOptions, otherCompeteValue]);

  const answeredCount = [
    purpose.trim() !== '',
    country.trim() !== '',
    primaryIndustry.trim() !== '',
    step4Completed,
    step5Completed
  ].filter(Boolean).length;

  const formDataRef = useRef({});
  const lastSavedDataRef = useRef(null);

  useEffect(() => {
    // Initialize on mount so we don't trigger an immediate save without changes
    lastSavedDataRef.current = JSON.stringify({
      companyName: businessName,
      purpose, description, country, city, primaryIndustry,
      geography1: geo1, geography2: geo2, geography3: geo3,
      customerSegment1: seg1, customerSegment2: seg2, customerSegment3: seg3,
      productService1: prod1, productService2: prod2, productService3: prod3,
      channel1: chan1, channel2: chan2, channel3: chan3,
      differentiation: getSelectedDifferentiation()
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAutoSave = useCallback(async () => {
    const currentData = formDataRef.current;
    if (Object.keys(currentData).length === 0) return;

    const currentDataStr = JSON.stringify(currentData);
    if (lastSavedDataRef.current === currentDataStr) return;

    try {
      const ML_API_BASE_URL = import.meta.env.VITE_ML_BACKEND_URL;
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
      const getAuthToken = () => useAuthStore.getState().token;
      const analysisService = new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);

      const targetBusinessId = business?._id || business?.id || businessId;
      await analysisService.savePMFOnboardingData(targetBusinessId, currentData);

      lastSavedDataRef.current = currentDataStr;
      addToast({ message: "Auto-saved successfully", type: "success" });
    } catch (err) {
      console.warn("Could not autosave pmf onboarding data...", err);
    }
  }, [business, businessId, addToast]);

  useEffect(() => {
    formDataRef.current = {
      companyName: businessName,
      purpose, description, country, city, primaryIndustry,
      geography1: geo1, geography2: geo2, geography3: geo3,
      customerSegment1: seg1, customerSegment2: seg2, customerSegment3: seg3,
      productService1: prod1, productService2: prod2, productService3: prod3,
      channel1: chan1, channel2: chan2, channel3: chan3,
      differentiation: getSelectedDifferentiation()
    };

    const timeoutId = setTimeout(() => {
      handleAutoSave();
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [
    businessName, purpose, description, country, city, primaryIndustry,
    geo1, geo2, geo3, seg1, seg2, seg3, prod1, prod2, prod3, chan1, chan2, chan3,
    getSelectedDifferentiation, handleAutoSave
  ]);

  const handleBackToDashboard = async () => {
    await handleAutoSave();
    navigate('/dashboard');
  };

  const handleStartOnboarding = async () => {
    setIsOnboardingStarted(true);
    try {
      const getAuthToken = () => useAuthStore.getState().token;
      const ML_API_BASE_URL = import.meta.env.VITE_ML_BACKEND_URL;
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
      const analysisService = new AnalysisApiService(ML_API_BASE_URL, API_BASE_URL, getAuthToken);
      const targetBusinessId = business?._id || business?.id || businessId;

      const dataToSave = {
        ...(pmfData || {}),
        letsBeginClicked: true
      };

      await analysisService.savePMFOnboardingData(targetBusinessId, dataToSave);
    } catch (err) {
      console.error("Failed to save letsBeginClicked state", err);
    }
  };

  if (!isOnboardingStarted) {
    return (
      <div className="dashboard-layout ob-flow-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <MenuBar />
        <div style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
          <OnboardingChat
            userName={userName}
            businessName={businessName}
            onBack={handleBackToDashboard}
            onStart={handleStartOnboarding}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout ob-flow-layout">
      <div style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <MenuBar />

        <div className="split-onboarding-header ob-flow-header" style={{ borderBottom: 'none' }}>
          <button
            onClick={handleBackToDashboard}
            className="ob-flow-back-btn"
          >
            &larr; Back to Dashboard
          </button>
          <span className="ob-flow-breadcrumb-sep">/</span>
          <span className="business-header-name ob-flow-business-name">
            {businessName}
          </span>
        </div>
      </div>

      <div className="split-onboarding-container ob-flow-container">
        <div className="split-onboarding-left">
          <div className="docked-onboarding-chat">
            <div className="onboarding-chat-header">
              <div className="avatar-wrapper">
                <div className="avatar-circle">TX</div>
              </div>
              <div className="header-info">
                <h2 className="header-title">Trax</h2>
              </div>
            </div>

            <div className="docked-chat-body">
              <div className="onboarding-chat-message">
                <div className="bubble-avatar">TX</div>
                <div className="bubble-content">
                  Hi {userName} — I'm Trax, your strategy consultant. To draft a real diagnosis for <strong>{businessName}</strong>, I'll need a feel for the business.
                </div>
              </div>

              {location.state?.uploadedFiles && location.state.uploadedFiles.length > 0 && (
                <div className="onboarding-chat-message">
                  <div className="bubble-avatar">TX</div>
                  <div className="bubble-content">
                    <div style={{ marginBottom: '8px' }}>I've received your documents and gone through them.</div>
                    {location.state.uploadedFiles.map((fileObj, idx) => {
                      const isString = typeof fileObj === 'string';
                      const fileName = isString ? fileObj : fileObj.name;
                      const fileMeta = isString ? null : fileObj.meta;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '6px', color: '#0f172a', fontWeight: '500', fontSize: '13px', width: '100%' }}>
                          <File size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                              {fileName}
                            </span>
                            {fileMeta && (
                              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                {fileMeta}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="onboarding-chat-message">
                <div className="bubble-avatar">TX</div>
                <div className="bubble-content">
                  Here are the 5 questions I need to draft your diagnosis. Take a look and review them in any order.
                </div>
              </div>
              {/* <div className="onboarding-chat-highlight-card">
                <strong>I value context.</strong> The more you share, the sharper the diagnosis. Upload anything you have.
              </div>
              <div className="onboarding-chat-message">
                <div className="bubble-avatar">TX</div>
                <div className="bubble-content">
                  Great. Here are the 5 questions I need to draft your diagnosis. Answer in any order — or add documents and I'll auto-fill what I can.
                </div>
              </div> */}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`onboarding-chat-message ${msg.role === 'user' ? 'user-message' : ''}`}>
                  <div className="bubble-avatar">
                    {msg.role === 'user' ? (userName?.charAt(0)?.toUpperCase() || 'U') : 'TX'}
                  </div>
                  <div className="bubble-content">
                    {msg.role === 'trax' || msg.role === 'assistant' ? (
                      <AiMessageRenderer text={msg.content} role={msg.role} isBare={true} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="onboarding-chat-message">
                  <div className="bubble-avatar">TX</div>
                  <div className="bubble-content">
                    <div className="typing-indicator" style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '100%', padding: '4px 0' }}>
                      <span style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0s' }}></span>
                      <span style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}></span>
                      <span style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="onboarding-chat-input-bar">
              <form onSubmit={handleSendMessage} className="onboarding-chat-input-wrapper">
                <textarea
                  className="onboarding-chat-input-field ai-textarea"
                  placeholder="Type a message to Trax..."
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  rows={1}
                  disabled={isSubmitting}
                  style={{
                    resize: 'none',
                    overflowY: 'auto'
                  }}
                />
                <button type="submit" className="onboarding-chat-send-btn" disabled={isSubmitting}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="split-onboarding-right ob-flow-right-panel">
          <div className="ob-flow-card">
            <div className="ob-flow-header-bar">
              <div className="ob-flow-header-top">
                <span className="ob-flow-header-label">ONBOARDING</span>
                <span className="ob-flow-header-count"><strong>{answeredCount}</strong> of <strong>5</strong> answered</span>
              </div>
              <div className="ob-progress-container ob-flow-progress-container">
                <div className="ob-progress-bar" style={{ width: `${Math.min((answeredCount / 5) * 100, 100)}%` }}></div>
              </div>
            </div>


            <div className="ob-flow-questions" style={{ pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>

              {/* Q1 */}
              <div className={`ob-question-card ${expandedSection === 1 ? 'expanded' : ''} ${(purpose) ? 'completed' : ''}`}>
                <div className="ob-question-header" onClick={() => setExpandedSection(expandedSection === 1 ? null : 1)}>
                  <div className="ob-question-left">
                    <div className={`ob-radio-circle ${(purpose) ? 'answered' : ''}`}>

                    </div>
                    <span className="ob-question-num">1</span>
                    <span className="ob-question-text">What does the business actually do?</span>
                  </div>
                  {expandedSection === 1 ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                </div>
                {expandedSection === 1 && (
                  <div className="ob-question-body">
                    <div className="ob-form-group ob-flow-form-group margin-b-20">
                      <label>Business purpose <span className="required">*</span></label>
                      <div className="ob-sublabel">One line — what you do and for whom.</div>
                      <textarea
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g. We make premium ice cream sold through grocery and convenience channels in the US."
                        rows={2}
                      />
                    </div>
                    <div className="ob-form-group">
                      <label>Description <span className="optional">(optional)</span></label>
                      <div className="ob-sublabel">Operations, goals, unique value — anything that gives Trax a fuller picture.</div>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What sets this business apart? Where is it headed?"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Q2 */}
              <div className={`ob-question-card ${expandedSection === 2 ? 'expanded' : ''} ${(country) ? 'completed' : ''}`}>
                <div className="ob-question-header" onClick={() => setExpandedSection(expandedSection === 2 ? null : 2)}>
                  <div className="ob-question-left">
                    <div className={`ob-radio-circle ${(country) ? 'answered' : ''}`}>

                    </div>
                    <span className="ob-question-num">2</span>
                    <span className="ob-question-text">Where is the business based?</span>
                  </div>
                  {expandedSection === 2 ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                </div>
                {expandedSection === 2 && (
                  <div className="ob-question-body">
                    <div className="ob-sublabel ob-flow-sublabel-mb">Tells Trax which regulatory, economic, and competitive context to consider.</div>
                    <div className="ob-flow-row">
                      <div className="ob-form-group ob-flow-col">
                        <label>Country <span className="required">*</span></label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="e.g. United States"
                        />
                      </div>
                      <div className="ob-form-group ob-flow-col">
                        <label>City <span className="optional">(optional)</span></label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Austin"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Q3 */}
              <div className={`ob-question-card ${expandedSection === 3 ? 'expanded' : ''} ${(primaryIndustry) ? 'completed' : ''}`}>
                <div className="ob-question-header" onClick={() => setExpandedSection(expandedSection === 3 ? null : 3)}>
                  <div className="ob-question-left">
                    <div className={`ob-radio-circle ${(primaryIndustry) ? 'answered' : ''}`}>

                    </div>
                    <span className="ob-question-num">3</span>
                    <span className="ob-question-text">What industry is the business in?</span>
                  </div>
                  {expandedSection === 3 ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                </div>
                {expandedSection === 3 && (
                  <div className="ob-question-body">
                    <div className="ob-sublabel ob-flow-sublabel-mb">Helps Trax map competitors, regulatory frameworks, and industry-specific dynamics.</div>
                    <div className="ob-form-group">
                      <label>Primary industry <span className="required">*</span></label>
                      <input
                        type="text"
                        value={primaryIndustry}
                        onChange={(e) => setPrimaryIndustry(e.target.value)}
                        placeholder="e.g. Food & Beverage"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Q4 */}
              <div className={`ob-question-card ${expandedSection === 4 ? 'expanded' : ''} ${step4Completed ? 'completed' : ''}`}>
                <div className="ob-question-header" onClick={() => setExpandedSection(expandedSection === 4 ? null : 4)}>
                  <div className="ob-question-left">
                    <div className={`ob-radio-circle ${step4Completed ? 'answered' : ''}`}>

                    </div>
                    <span className="ob-question-num">4</span>
                    <span className="ob-question-text">What is your core?</span>
                  </div>
                  {expandedSection === 4 ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                </div>
                {expandedSection === 4 && (
                  <div className="ob-question-body">
                    <div className="ob-sublabel ob-flow-sublabel-mb-24">The base of the business — where you sell, to whom, and what you offer. Trax uses this to ground every recommendation.</div>

                    <div className="ob-form-group ob-flow-form-group">
                      <label className="ob-flow-label-lg">Geographies (max 3)</label>
                      <div className="ob-sublabel ob-flow-sublabel-sm">e.g., United States, LATAM, Southeast Asia</div>
                      <input className="ob-flow-input-mb" type="text" value={geo1} onChange={(e) => setGeo1(e.target.value)} placeholder="Geography 1" />
                      <input className="ob-flow-input-mb" type="text" value={geo2} onChange={(e) => setGeo2(e.target.value)} placeholder="Geography 2 (optional)" />
                      <input type="text" value={geo3} onChange={(e) => setGeo3(e.target.value)} placeholder="Geography 3 (optional)" />
                    </div>

                    <div className="ob-form-group ob-flow-form-group">
                      <label className="ob-flow-label-lg">Customer segments (max 3)</label>
                      <div className="ob-sublabel ob-flow-sublabel-sm">e.g., young adults, SMEs, enterprise</div>
                      <input className="ob-flow-input-mb" type="text" value={seg1} onChange={(e) => setSeg1(e.target.value)} placeholder="Segment 1" />
                      <input className="ob-flow-input-mb" type="text" value={seg2} onChange={(e) => setSeg2(e.target.value)} placeholder="Segment 2 (optional)" />
                      <input type="text" value={seg3} onChange={(e) => setSeg3(e.target.value)} placeholder="Segment 3 (optional)" />
                    </div>

                    <div className="ob-form-group ob-flow-form-group">
                      <label className="ob-flow-label-lg">Products / services (max 3)</label>
                      <div className="ob-sublabel ob-flow-sublabel-sm">e.g., ice cream, M&A advisory</div>
                      <input className="ob-flow-input-mb" type="text" value={prod1} onChange={(e) => setProd1(e.target.value)} placeholder="Product/Service 1" />
                      <input className="ob-flow-input-mb" type="text" value={prod2} onChange={(e) => setProd2(e.target.value)} placeholder="Product/Service 2 (optional)" />
                      <input type="text" value={prod3} onChange={(e) => setProd3(e.target.value)} placeholder="Product/Service 3 (optional)" />
                    </div>

                    <div className="ob-form-group ob-flow-form-group">
                      <label className="ob-flow-label-lg">Channels (max 3)</label>
                      <div className="ob-sublabel ob-flow-sublabel-sm">e.g., convenience stores, direct sales</div>
                      <input className="ob-flow-input-mb" type="text" value={chan1} onChange={(e) => setChan1(e.target.value)} placeholder="Channel 1" />
                      <input className="ob-flow-input-mb" type="text" value={chan2} onChange={(e) => setChan2(e.target.value)} placeholder="Channel 2 (optional)" />
                      <input type="text" value={chan3} onChange={(e) => setChan3(e.target.value)} placeholder="Channel 3 (optional)" />
                    </div>
                  </div>
                )}
              </div>

              {/* Q5 */}
              <div className={`ob-question-card ${expandedSection === 5 ? 'expanded' : ''} ${step5Completed ? 'completed' : ''}`}>
                <div className="ob-question-header" onClick={() => setExpandedSection(expandedSection === 5 ? null : 5)}>
                  <div className="ob-question-left">
                    <div className={`ob-radio-circle ${step5Completed ? 'answered' : ''}`}>

                    </div>
                    <span className="ob-question-num">5</span>
                    <span className="ob-question-text">Where do you compete?</span>
                  </div>
                  {expandedSection === 5 ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                </div>
                {expandedSection === 5 && (
                  <div className="ob-question-body">
                    <div className="ob-sublabel ob-flow-sublabel-mb">Select up to 3. These are the dimensions you'd say you actually win on today — not aspirations.</div>
                    <div className="ob-flow-compete-list">
                      {Object.entries({
                        price: 'Price',
                        quality: 'Quality & expertise',
                        speed: 'Speed & responsiveness',
                        relationships: 'Relationships & trust',
                        customization: 'Customization',
                        scale: 'Scale',
                        brand: 'Brand',
                        other: 'Other'
                      }).map(([key, label]) => {
                        const isSelected = competeOptions[key];
                        const selectedCount = Object.values(competeOptions).filter(Boolean).length;
                        const isFaded = selectedCount >= 3 && !isSelected;

                        return (
                          <div key={key} className={`ob-flow-checkbox-wrapper ${isSelected ? 'selected' : ''}`} style={{ opacity: isFaded ? 0.4 : 1, pointerEvents: isFaded ? 'none' : 'auto' }}>
                            <label className="ob-flow-checkbox-label-container m-0">
                              <input
                                type="checkbox"
                                className="ob-flow-checkbox-input"
                                checked={competeOptions[key]}
                                onChange={() => handleCompeteToggle(key)}
                              />
                              <span className="ob-flow-checkbox-label">{label}</span>
                            </label>
                            {key === 'other' && competeOptions.other && (
                              <div className="ob-flow-other-input-container">
                                <input
                                  type="text"
                                  className="ob-flow-other-input"
                                  placeholder="Please specify"
                                  value={otherCompeteValue}
                                  onChange={(e) => setOtherCompeteValue(e.target.value)}
                                  required={selectedCount === 1}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="ob-flow-submit-section">
              <button
                className="ob-generate-btn ob-flow-generate-btn"
                onClick={handleGenerateInsights}
                style={{ opacity: isSubmitting ? 0.7 : 1 }}
                disabled={isSubmitting || answeredCount < 5}
              >
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%' }}>
                    Generating
                    <div className="typing-indicator" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ width: '4px', height: '4px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0s' }}></span>
                      <span style={{ width: '4px', height: '4px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}></span>
                      <span style={{ width: '4px', height: '4px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}></span>
                    </div>
                  </span>
                ) : (
                  <>Generate Insights <ArrowRight size={18} /></>
                )}
              </button>
              <p className="ob-flow-generate-subtext">Answer every question to generate your strategy draft.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlowPage;

