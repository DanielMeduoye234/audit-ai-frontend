import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Bell, Shield, Database, Mail, Lock, Download, ChevronRight, Sun, Moon, DollarSign, Globe } from 'lucide-react';
import { useCurrency, CURRENCIES } from '../contexts/CurrencyContext';
import './Settings.css';

export function Settings() {
  const { currency, setCurrency } = useCurrency();
  const [activeSection, setActiveSection] = useState('appearance');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [emailNotifications, setEmailNotifications] = useState(() => 
    JSON.parse(localStorage.getItem('emailNotifications') || 'true')
  );
  const [transactionAlerts, setTransactionAlerts] = useState(() =>
    JSON.parse(localStorage.getItem('transactionAlerts') || 'true')
  );
  const [spendingThreshold, setSpendingThreshold] = useState(() =>
    localStorage.getItem('spendingThreshold') || '1000'
  );

  useEffect(() => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('emailNotifications', JSON.stringify(emailNotifications));
  }, [emailNotifications]);

  useEffect(() => {
    localStorage.setItem('transactionAlerts', JSON.stringify(transactionAlerts));
  }, [transactionAlerts]);

  useEffect(() => {
    localStorage.setItem('spendingThreshold', spendingThreshold);
  }, [spendingThreshold]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['appearance', 'notifications', 'security', 'data', 'danger'];
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 300) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = CURRENCIES.find(c => c.code === e.target.value);
    if (selected) {
      setCurrency(selected);
    }
  };

  return (
    <div className="settings">
      <header className="settings-header">
        <div>
          <h2>Settings</h2>
          <p className="text-secondary">Manage your account and preferences</p>
        </div>
      </header>

      <div className="settings-content">
        <aside className="settings-sidebar">
          <nav className="settings-nav">
            <button 
              className={`nav-item ${activeSection === 'appearance' ? 'active' : ''}`}
              onClick={() => scrollToSection('appearance')}
            >
              <Sun size={18} />
              Appearance
              {activeSection === 'appearance' && <ChevronRight size={16} className="nav-arrow" />}
            </button>
            <button 
              className={`nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
              onClick={() => scrollToSection('notifications')}
            >
              <Bell size={18} />
              Notifications
              {activeSection === 'notifications' && <ChevronRight size={16} className="nav-arrow" />}
            </button>
            <button 
              className={`nav-item ${activeSection === 'security' ? 'active' : ''}`}
              onClick={() => scrollToSection('security')}
            >
              <Shield size={18} />
              Security
              {activeSection === 'security' && <ChevronRight size={16} className="nav-arrow" />}
            </button>
            <button 
              className={`nav-item ${activeSection === 'data' ? 'active' : ''}`}
              onClick={() => scrollToSection('data')}
            >
              <Database size={18} />
              Data & Privacy
              {activeSection === 'data' && <ChevronRight size={16} className="nav-arrow" />}
            </button>
            <button 
              className={`nav-item ${activeSection === 'danger' ? 'active' : ''}`}
              onClick={() => scrollToSection('danger')}
            >
              <div className="danger-icon-wrapper">
                <Shield size={18} />
              </div>
              Danger Zone
              {activeSection === 'danger' && <ChevronRight size={16} className="nav-arrow" />}
            </button>
          </nav>
        </aside>

        <div className="settings-main">
          <section id="appearance" className="settings-section">
            <h3>Appearance</h3>
            <Card className="settings-card">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon">
                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                  </div>
                  <div>
                    <h4>Theme</h4>
                    <p className="text-secondary">Switch between dark and light mode</p>
                  </div>
                </div>
                <div className="theme-toggle-wrapper">
                  <button 
                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    <Sun size={16} />
                    Light
                  </button>
                  <button 
                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    <Moon size={16} />
                    Dark
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h4>Currency</h4>
                    <p className="text-secondary">Choose your preferred currency for displaying amounts</p>
                  </div>
                </div>
                <select 
                  className="currency-select"
                  value={currency.code}
                  onChange={handleCurrencyChange}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </Card>
          </section>

          <section id="notifications" className="settings-section">
            <h3>Notification Preferences</h3>
            <Card className="settings-card">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4>Email Notifications</h4>
                    <p className="text-secondary">Receive email updates about your account activity</p>
                  </div>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h4>Transaction Alerts</h4>
                    <p className="text-secondary">Get notified about new transactions</p>
                  </div>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={transactionAlerts}
                    onChange={(e) => setTransactionAlerts(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h4>Spending Alert Threshold</h4>
                    <p className="text-secondary">Get notified when a single expense exceeds this amount</p>
                  </div>
                </div>
                <div className="threshold-input">
                  <span>$</span>
                  <input 
                    type="number" 
                    value={spendingThreshold}
                    onChange={(e) => setSpendingThreshold(e.target.value)}
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4>Security Alerts</h4>
                    <p className="text-secondary">Important security and login notifications</p>
                  </div>
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </Card>
          </section>

          <section id="security" className="settings-section">
            <h3>Security</h3>
            <Card className="settings-card">
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" placeholder="Enter current password" />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" placeholder="Enter new password" />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" placeholder="Confirm new password" />
              </div>
              <button className="btn-primary">Update Password</button>
            </Card>

            <Card className="settings-card">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h4>Two-Factor Authentication</h4>
                    <p className="text-secondary">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <button className="btn-secondary">Enable 2FA</button>
              </div>
            </Card>
          </section>

          <section id="data" className="settings-section">
            <h3>Data Management</h3>
            <Card className="settings-card">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon">
                    <Download size={20} />
                  </div>
                  <div>
                    <h4>Export Data</h4>
                    <p className="text-secondary">Download all your data in CSV format</p>
                  </div>
                </div>
                <button className="btn-secondary">Export</button>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-icon">
                    <Database size={20} />
                  </div>
                  <div>
                    <h4>Data Retention</h4>
                    <p className="text-secondary">Configure how long we keep your data</p>
                  </div>
                </div>
                <select className="data-select">
                  <option>1 Year</option>
                  <option>3 Years</option>
                  <option selected>5 Years</option>
                  <option>7 Years</option>
                </select>
              </div>
            </Card>
          </section>

          <section id="danger" className="settings-section danger-zone">
            <h3>Danger Zone</h3>
            <Card className="settings-card danger-card">
              <div className="setting-item">
                <div className="setting-info">
                  <div>
                    <h4>Delete Account</h4>
                    <p className="text-secondary">Permanently delete your account and all data</p>
                  </div>
                </div>
                <button className="btn-danger">Delete Account</button>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

