import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import '../styles/UserTour.css';

const CustomTooltip = ({ index, step, backProps, primaryProps, skipProps, tooltipProps, isLastStep, size }) => {
  const isWelcome = step.isWelcomeModal;

  const handlePrimaryClick = (e) => {
    if (primaryProps.onClick) primaryProps.onClick(e);
    if (isLastStep) {
      window.dispatchEvent(new CustomEvent('force-tour-complete', { detail: 'finished' }));
    }
  };

  const handleSkipClick = (e) => {
    if (skipProps.onClick) skipProps.onClick(e);
    window.dispatchEvent(new CustomEvent('force-tour-complete', { detail: 'skipped' }));
  };

  return (
    <div {...tooltipProps} className={`tooltip-container ${isWelcome ? 'welcome-modal' : ''}`}>
      {}
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
  const [completedStatus, setCompletedStatus] = useState(null);

  const tourCompleted = useAuthStore(state => state.tourCompleted);
  const userRole = useAuthStore(state => state.userRole);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  useEffect(() => {
    const handleForceComplete = (e) => {
      const explicitStatus = e.detail;
      setCompletedStatus(explicitStatus);
    };

    window.addEventListener('force-tour-complete', handleForceComplete);
    return () => window.removeEventListener('force-tour-complete', handleForceComplete);
  }, []);
  useEffect(() => {
    const performCompletion = async () => {
      if (!completedStatus) return;

      useAuthStore.getState().updateUser({ tourCompleted: true });

      try {
        const token = useAuthStore.getState().token;
        const finalUrl = `${API_BASE_URL}/api/complete-tour`;

        if (token) {
          const res = await axios.post(finalUrl, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
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
    if (tourCompleted === false) {
      const role = userRole?.toLowerCase() || 'user';
      let tourSteps = [];
      const howItWorksSelector = '.btn-how-it-works';
      const createBusinessSelector = '.btn-create-business';
      const businessesTableSelector = '.businesses-table-wrapper';
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
            target: howItWorksSelector,
            content: 'New here? Check out our quick visual guide to understand the complete journey of a project.',
            placement: 'bottom',
            title: 'How It Works'
          },
          {
            target: createBusinessSelector,
            content: 'Ready to start? Click here to formulate your first Business profile and kick off a project.',
            placement: 'bottom',
            title: 'Create Business'
          },
          {
            target: businessesTableSelector,
            content: 'As you create businesses or get assigned to projects, they will be organized right here!',
            placement: 'top',
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
            target: howItWorksSelector,
            content: 'Check out our quick visual guide to see how projects flow in Traxxia.',
            placement: 'bottom',
            title: 'Learning Center'
          },
          {
            target: businessesTableSelector,
            content: 'When an Admin assigns you to a project, it will appear right here under \'Collaborating Businesses\'.',
            placement: 'top',
            title: 'Your Businesses'
          }
        ];
      } else {
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
            target: howItWorksSelector,
            content: 'Learn how things work by clicking here.',
            placement: 'bottom'
          },
          {
            target: businessesTableSelector,
            content: 'You can view the progress of the businesses you have access to from here.',
            placement: 'top'
          }
        ];
      }

      if (steps.length === 0) {
        setSteps(tourSteps);
        setTimeout(() => setRun(true), 500);
      }
    }
  }, [steps.length, tourCompleted, userRole]);

  const handleJoyrideCallback = (data) => {
    const { status, type } = data;

    const isFinished = status === 'finished' || status === 'completed' || status === STATUS.FINISHED;
    const isSkipped = status === 'skipped' || status === STATUS.SKIPPED;

    if (isFinished || isSkipped) {
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
