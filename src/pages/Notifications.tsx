import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import './Notifications.css';

interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: number;
  created_at: string;
}

export function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      if (!user?.id) return;
      
      const response = await api.get(`/notifications/${user.id}`);
      setNotifications(response.data.notifications || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: 1 } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      case 'error': return <AlertCircle size={20} />;
      default: return <Info size={20} />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr.replace(' ', 'T'));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  const groupByDate = (notifications: Notification[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: Notification[] } = {
      Today: [],
      Yesterday: [],
      Earlier: []
    };

    notifications.forEach(notif => {
      const notifDate = new Date(notif.created_at.replace(' ', 'T'));
      if (notifDate.toDateString() === today.toDateString()) {
        groups.Today.push(notif);
      } else if (notifDate.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(notif);
      } else {
        groups.Earlier.push(notif);
      }
    });

    return groups;
  };

  const groupedNotifications = groupByDate(notifications);

  if (loading) {
    return (
      <div className="notifications">
        <div className="notifications-header">
          <h2>Notifications</h2>
        </div>
        <div className="loading">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="notifications">
      <div className="notifications-header">
        <div>
          <h2>Notifications</h2>
          <p className="text-secondary">Stay updated with your latest activities</p>
        </div>
        {notifications.some(n => n.read === 0) && (
          <button 
            className="btn-secondary"
            onClick={() => notifications.filter(n => n.read === 0).forEach(n => markAsRead(n.id))}
          >
            <Check size={18} />
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: '#f44336', padding: '16px', background: '#ffebee', borderRadius: '8px', marginBottom: '16px' }}>
          Error: {error}
        </div>
      )}

      <div className="notifications-content">
        {Object.entries(groupedNotifications).map(([group, notifs]) => (
          notifs.length > 0 && (
            <div key={group} className="notification-group">
              <h3 className="group-title">{group}</h3>
              <div className="notifications-list">
                {notifs.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-card ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className={`notification-icon ${notification.type}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    {!notification.read && <div className="unread-dot"></div>}
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {notifications.length === 0 && !error && (
          <div className="empty-state">
            <Bell size={48} />
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
