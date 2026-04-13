import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import axios from 'axios';
import '../styles/UserTour.css';

const CustomTooltip = ({ index, step, backProps, primaryProps, skipProps, tooltipProps, isLastStep, size }) => {
  const isWelcome = step.isWelcomeModal;

  const handlePrimaryClick = (e) => {
    if (primaryProps.onClick) primaryProps.onClick(e);
    // Force completion if this is the last step
    if (isLastStep) {
      console.log('[UserTour] Explicit "Finish" click detected');
      window.dispatchEvent(new CustomEvent('force-tour-complete', { detail: 'finished' }));
    }
  };

  const handleSkipClick = (e) => {
    if (skipProps.onClick) skipProps.onClick(e);
    // Force completion on skip
    console.log('[UserTour] Explicit "Skip" click detected');
    window.dispatchEvent(new CustomEvent('force-tour-complete', { detail: 'skipped' }));
  };

  return (
    <div {...tooltipProps} className={`tooltip-container ${isWelcome ? 'welcome-modal' : ''}`}>
      {/* Hide progress bar on Welcome Modal */}
      {!isWelcome && (
        <div className="tooltip-progress-bar">
          {Array.from({ length: size }).map((_, i) => (
            <div key={i} className={`tooltip-progress-segment ${index >= i ? 'active' : ''}`} />
          ))}
        </div>
      )}

      {isWelcome && (
        <div className="welcome-banner">
          <span role="img" aria-label="sparkles">✨</span>
        </div>
      )}

      {step.title && <h4 className="tooltip-title">{step.title}</h4>}

      <div className="tooltip-content">
        {step.content}
      </div>

      <div className="tooltip-footer">
        <button {...skipProps} onClick={handleSkipClick} className="btn-skip">
          {isWelcome ? 'Maybe Later' : 'Skip Tour'}
        </button>
        <div className="tooltip-footer-buttons">
          {index > 0 && !isWelcome && (
            <button {...backProps} className="btn-back">
              Back
            </button>
          )}
          <button {...primaryProps} onClick={handlePrimaryClick} className={`btn-primary ${isWelcome ? 'btn-start-tour' : ''}`}>
            {isWelcome ? 'Start Tour' : isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserTour = () => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const [completedStatus, setCompletedStatus] = useState(null); // 'finished' or 'skipped'
  
  // Defensive check for backend URL
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Set up custom event listener to completely bypass react-joyride bugs
  useEffect(() => {
    const handleForceComplete = (e) => {
      const explicitStatus = e.detail;
      console.log(`[UserTour] Caught force-tour-complete event: ${explicitStatus}`);
      setCompletedStatus(explicitStatus);
    };

    window.addEventListener('force-tour-complete', handleForceComplete);
    return () => window.removeEventListener('force-tour-complete', handleForceComplete);
  }, []);

  // Effect to perform the backend completion API call
  // This is decoupled from the Joyride lifecycle to ensure it always finishes.
  useEffect(() => {
    const performCompletion = async () => {
      if (!completedStatus) return;

      console.log(`[UserTour] Completion API effect running. Requesting /api/complete-tour`);
      sessionStorage.setItem('tourCompleted', 'true');

      try {
        const token = sessionStorage.getItem('token');
        const finalUrl = `${API_BASE_URL}/api/complete-tour`;

        if (token) {
          const res = await axios.post(finalUrl, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("[UserTour] Backend update SUCCESS:", res.data);
        } else {
          console.warn("[UserTour] No token in sessionStorage available.");
        }
      } catch (err) {
        console.error('[UserTour] Backend update FAILED:', err.response?.data || err.message);
      } finally {
        setRun(false);
        setCompletedStatus(null); 
      }
    };

    performCompletion();
  }, [completedStatus, API_BASE_URL]);

  useEffect(() => {
    // We check string "true" because sessionStorage stores strings
    const isTourCompleted = sessionStorage.getItem('tourCompleted');

    // If it's explicitly "false", we run the tour. If it's "true", "undefined", or null, we don't.
    // Since only new users get "false".
    if (isTourCompleted === 'false') {
      const role = sessionStorage.getItem('userRole')?.toLowerCase() || 'user';
      let tourSteps = [];
      
      const isMobile = window.innerWidth < 768; // Bootstrap md breakpoint
      const cardSelector = isMobile ? '.mobile-view-card' : '.desktop-view-card';
      const accordionSelector = isMobile ? '.mobile-view-card .accordion' : '.desktop-view-card .businesses-section .accordion';

      // "user" and "company_admin" share the same primary creation interface.
      // super_admin has a different layout and doesn't hit UserTour
      if (['company_admin', 'user'].includes(role)) {
        tourSteps = [
          {
            target: 'body',
            content: 'Take a quick tour to explore your dashboard and get started.',
            placement: 'center',
            title: 'Welcome to your Dashboard!',
            disableBeacon: true,
            isWelcomeModal: true
          },
          {
            target: '#dropdown-notifications',
            content: 'Here you will receive important updates and alerts.',
            placement: 'bottom',
            title: 'Notifications'
          },
          {
            target: '#dropdown-user',
            content: 'Manage your profile, settings, and academy from your user menu.',
            placement: 'bottom',
            title: 'Your Profile'
          },
          {
            target: `${cardSelector} .create-business-btn:last-of-type`,
            content: 'New here? Check out our quick visual guide to understand the complete journey of a project.',
            placement: 'right',
            title: 'How It Works'
          },
          {
            target: `${cardSelector} .create-business-btn:first-of-type`,
            content: 'Ready to start? Click here to formulate your first Business profile and kick off a project.',
            placement: 'right',
            title: 'Create Business'
          },
          {
            target: accordionSelector,
            content: 'As you create businesses or get assigned to projects, they will be organized right here!',
            placement: 'bottom',
            title: 'Your Businesses'
          }
        ];
      } else if (role === 'collaborator') {
        tourSteps = [
          {
            target: 'body',
            content: 'Take a quick tour to explore your dashboard and get started with your team.',
            placement: 'center',
            title: 'Welcome to your Collaborator Dashboard!',
            disableBeacon: true,
            isWelcomeModal: true
          },
          {
            target: '#dropdown-notifications',
            content: 'Stay on top of updates from your team.',
            placement: 'bottom',
            title: 'Notifications'
          },
          {
            target: '#dropdown-user',
            content: 'Access your profile and preferences from here.',
            placement: 'bottom',
            title: 'Profile Settings'
          },
          {
            target: `${cardSelector} .create-business-btn`,
            content: 'Check out our quick visual guide to see how projects flow in Traxxia.',
            placement: 'right',
            title: 'Learning Center'
          },
          {
            target: accordionSelector,
            content: 'When an Admin assigns you to a project, it will appear right here under \'Collaborating Businesses\'.',
            placement: 'bottom',
            title: 'Your Businesses'
          }
        ];
      } else {
        // Fallback for viewer or any other edge case
        tourSteps = [
          {
            target: 'body',
            content: 'Take a quick tour of your dashboard.',
            placement: 'center',
            title: 'Welcome to Traxxia!',
            disableBeacon: true,
            isWelcomeModal: true
          },
          {
            target: '#dropdown-notifications',
            content: 'Check for new notifications here.',
            placement: 'bottom'
          },
          {
            target: '#dropdown-user',
            content: 'Access your profile from here.',
            placement: 'bottom'
          },
          {
            target: `${cardSelector} .create-business-btn`,
            content: 'Learn how things work by clicking here.',
            placement: 'right'
          },
          {
            target: accordionSelector,
            content: 'You can view the progress of the businesses you have access to from here.',
            placement: 'bottom'
          }
        ];
      }

      if (steps.length === 0) {
        setSteps(tourSteps);
        // add a small delay to ensure DOM is ready
        setTimeout(() => setRun(true), 500);
      }
    }
  }, [steps.length]);

  const handleJoyrideCallback = (data) => {
    const { status, type } = data;
    
    // Log the full data object for deep diagnostics
    console.log('[UserTour] Joyride Callback:', data);

    const isFinished = status === 'finished' || status === 'completed' || status === STATUS.FINISHED;
    const isSkipped = status === 'skipped' || status === STATUS.SKIPPED;

    if (isFinished || isSkipped) {
      console.log(`[UserTour] Termination detected (${status}). Setting completion status...`);
      setCompletedStatus(status);
    } else if (status === 'error') {
       console.error(`[UserTour] Joyride Error Event:`, data);
    }
  };

  if (!run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showSkipButton={true}
      showProgress={false}
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      disableOverlayClose={true}
      styles={{
        options: {
          arrowColor: '#ffffff',
          zIndex: 10000,
        }
      }}
    />
  );
};

export default UserTour;
