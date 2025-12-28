import { useState, useEffect } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import './MobileBlocker.css';

export function MobileBlocker({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check if screen width is less than 1024px (typical tablet/mobile breakpoint)
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="mobile-blocker">
        <div className="mobile-blocker-content">
          <div className="blocker-icon">
            <Smartphone className="phone-icon" />
            <div className="cross-line"></div>
          </div>
          
          <h1>Desktop Only</h1>
          <p>
            AUDIT AI is designed for desktop and laptop computers to provide 
            the best experience for financial management and analysis.
          </p>
          
          <div className="device-recommendation">
            <Monitor size={24} />
            <span>Please access from a laptop or desktop computer</span>
          </div>

          <div className="min-requirements">
            <p>Minimum screen width: 1024px</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
