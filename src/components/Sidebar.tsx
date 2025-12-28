import { LayoutDashboard, Receipt, FileText, Settings, BarChart3, User, Sparkles, Bell, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import './Sidebar.css';

export function Sidebar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const fetchUnreadCount = async () => {
    try {
      if (!user?.id) return;
      
      const response = await api.get(`/notifications/${user.id}/unread-count`);
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      navigate('/login');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <img src="/logo.png" alt="AUDIT AI Logo" className="logo-img" />
        </div>
        <div className="logo-text">
          <h1>AUDIT AI</h1>
          <span className="subtitle">Smart Compliance</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/transactions" className={({ isActive }) => isActive ? 'active' : ''}>
              <Receipt size={20} />
              <span>Transactions</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
              <FileText size={20} />
              <span>Reports</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/analytics" className={({ isActive }) => isActive ? 'active' : ''}>
              <BarChart3 size={20} />
              <span>Analytics</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/ai-chat" className={({ isActive }) => isActive ? 'active' : ''}>
              <Sparkles size={20} />
              <span>AI Accountant</span>
            </NavLink>
          </li>
        </ul>

        <div className="nav-divider"></div>

        <ul>
          <li>
            <NavLink to="/notifications" className={({ isActive }) => isActive ? 'active' : ''}>
              <div className="notification-icon-wrapper">
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </div>
              <span>Notifications</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
              <User size={20} />
              <span>Profile</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      
      <div className="user-profile">
        <div className="user-info-container">
          <div className="avatar">{user?.email?.charAt(0).toUpperCase() || 'U'}</div>
          <div className="user-info">
            <span className="name">{user?.email?.split('@')[0] || 'User'}</span>
            <span className="role">Admin</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn" title="Sign Out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

