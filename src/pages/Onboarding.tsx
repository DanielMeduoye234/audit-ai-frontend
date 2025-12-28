import { useNavigate } from 'react-router-dom';
import './Onboarding.css';

export function Onboarding() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Mark onboarding as completed
    localStorage.setItem('onboardingCompleted', 'true');
    
    // Add transition class for smooth exit
    document.querySelector('.onboarding-container')?.classList.add('exiting');
    
    // Navigate to register page after animation
    setTimeout(() => {
      navigate('/register');
    }, 800);
  };

  return (
    <div className="onboarding-container">
      {/* Ambient Background */}
      <div className="ambient-background">
        <div className="aurora-1"></div>
        <div className="aurora-2"></div>
        <div className="aurora-3"></div>
      </div>
      
      {/* Main Content */}
      <div className="onboarding-content">
        <div className="content-wrapper">
          <div className="brand-pill">
            <span className="pill-dot"></span>
            <span className="pill-text">AUDIT AI INTELLIGENCE</span>
          </div>
          
          <h1 className="hero-title">
            Financial clarity,
            <br />
            <span className="text-highlight">perfected by AI.</span>
          </h1>
          
          <p className="hero-subtitle">
            Transform your auditing process with enterprise-grade artificial intelligence. 
            Precision, speed, and insight in one unified platform.
          </p>

          <div className="action-area">
            <button className="premium-button" onClick={handleGetStarted}>
              Initialize System
            </button>
          </div>
          
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-value">99.9%</span>
              <span className="stat-label">Accuracy</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">24/7</span>
              <span className="stat-label">Monitoring</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">SOC2</span>
              <span className="stat-label">Certified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
