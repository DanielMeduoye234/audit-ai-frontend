import { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import './OnboardingTour.css';

interface OnboardingTourProps {
  run?: boolean;
  onComplete?: () => void;
}

export function OnboardingTour({ run = false, onComplete }: OnboardingTourProps) {
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    // Check if user has completed the tour before
    const hasCompletedTour = localStorage.getItem('onboardingCompleted');
    
    if (!hasCompletedTour && run) {
      // Small delay to ensure DOM elements are rendered
      setTimeout(() => {
        setRunTour(true);
      }, 1000);
    }
  }, [run]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="tour-welcome">
          <h2>Welcome to AUDIT AI! 🎉</h2>
          <p>Let's take a quick tour to help you get started with your AI-powered financial assistant.</p>
          <p className="tour-duration">This will only take about 2 minutes.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.metrics-grid',
      content: (
        <div>
          <h3>Financial Metrics Overview</h3>
          <p>Track your key financial metrics at a glance - Total Revenue, Expenses, and Net Profit.</p>
          <p>The percentage changes show your performance compared to last week.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.main-chart-card',
      content: (
        <div>
          <h3>Revenue Trends</h3>
          <p>Visualize your income trends over time with this interactive chart.</p>
          <p>Hover over data points to see detailed information.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.recent-transactions',
      content: (
        <div>
          <h3>Recent Transactions</h3>
          <p>View your latest financial transactions here.</p>
          <p>Click "View All" to see your complete transaction history and manage them.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[href="/ai-chat"]',
      content: (
        <div>
          <h3>AI Accountant ✨</h3>
          <p>Your intelligent financial assistant is here to help!</p>
          <p>Ask questions, get insights, create transactions, and receive personalized financial advice.</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[href="/transactions"]',
      content: (
        <div>
          <h3>Manage Transactions</h3>
          <p>Add, edit, and categorize all your business transactions.</p>
          <p>Upload receipts and keep everything organized in one place.</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[href="/reports"]',
      content: (
        <div>
          <h3>Financial Reports</h3>
          <p>Generate comprehensive financial reports including P&L statements, tax summaries, and more.</p>
          <p>Export reports for your accountant or tax filing.</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[href="/profile"]',
      content: (
        <div>
          <h3>Business Profile</h3>
          <p>Update your business information, tax details, and contact information here.</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: 'body',
      content: (
        <div className="tour-complete">
          <h2>You're All Set! 🚀</h2>
          <p>You now know the basics of AUDIT AI.</p>
          <p>Start by adding your first transaction or chatting with your AI Accountant!</p>
          <p className="tour-tip">💡 Tip: You can restart this tour anytime from the Settings page.</p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('onboardingCompleted', 'true');
      onComplete?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#3b82f6',
          textColor: '#e2e8f0',
          backgroundColor: '#1e293b',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          arrowColor: '#1e293b',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
        },
        buttonBack: {
          color: '#94a3b8',
          marginRight: '10px',
        },
        buttonSkip: {
          color: '#94a3b8',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}
