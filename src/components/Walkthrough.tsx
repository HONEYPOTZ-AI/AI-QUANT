import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface WalkthroughProps {
  run: boolean;
  onClose: () => void;
}

const Walkthrough: React.FC<WalkthroughProps> = ({ run, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = [
  {
    target: '[data-tour="dashboard-overview"]',
    content: 'Welcome to your AI-Powered Trading Platform! This is your main dashboard where you can monitor all your trading activities and market insights.',
    placement: 'center',
    disableBeacon: true
  },
  {
    target: '[data-tour="market-overview"]',
    content: 'The Market Overview provides real-time data from your connected market sources. Monitor key metrics and market movements at a glance.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="anomaly-alerts"]',
    content: 'Anomaly Detection Alerts notify you of unusual market patterns and potential trading opportunities detected by our AI algorithms.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="predictive-insights"]',
    content: 'Predictive Insights use advanced analytics to forecast market trends and provide data-driven recommendations.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="sidebar-cfd"]',
    content: 'Access CFD Strategy Analysis to configure and monitor your Contract for Difference trading strategies.',
    placement: 'right'
  },
  {
    target: '[data-tour="sidebar-anomaly"]',
    content: 'Deep dive into Anomaly Detection for detailed analysis of market irregularities.',
    placement: 'right'
  },
  {
    target: '[data-tour="ibrk-config"]',
    content: 'Configure your Interactive Brokers (IBRK) API connection here. Set up your credentials and connection parameters.',
    placement: 'top'
  },
  {
    target: '[data-tour="user-profile"]',
    content: 'Manage your profile settings, preferences, and account information from the user profile section.',
    placement: 'left'
  },
  {
    target: '[data-tour="help-button"]',
    content: 'You can restart this tour anytime by clicking the help icon. Happy trading!',
    placement: 'right'
  }];


  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, action } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setStepIndex(0);
      onClose();
    } else if (action === 'next' || action === 'prev') {
      setStepIndex(index + (action === 'next' ? 1 : 0));
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#1f2937',
          backgroundColor: '#1f2937',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          primaryColor: '#3b82f6',
          textColor: '#e5e7eb',
          zIndex: 10000
        },
        tooltip: {
          borderRadius: 8,
          padding: 20
        },
        tooltipContainer: {
          textAlign: 'left'
        },
        tooltipTitle: {
          color: '#f9fafb',
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 10
        },
        tooltipContent: {
          color: '#d1d5db',
          fontSize: 14,
          lineHeight: 1.6
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          color: '#ffffff',
          fontSize: 14,
          fontWeight: 500,
          padding: '8px 16px',
          outline: 'none'
        },
        buttonBack: {
          color: '#9ca3af',
          fontSize: 14,
          marginRight: 10
        },
        buttonSkip: {
          color: '#9ca3af',
          fontSize: 14
        },
        buttonClose: {
          color: '#9ca3af',
          padding: 5
        }
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour'
      }} />);


};

export default Walkthrough;