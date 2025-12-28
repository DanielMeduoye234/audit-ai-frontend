import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on navigation
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  return (
    <div className="layout">
      <header className="mobile-header">
        <div className="mobile-logo">
          <img src="/logo.png" alt="AUDIT AI" className="mobile-logo-img" />
          <span>AUDIT AI</span>
        </div>
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
