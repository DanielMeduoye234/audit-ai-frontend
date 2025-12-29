import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import './AdminDashboard.css';
import { Users, UserPlus, TrendingUp, Shield } from 'lucide-react';

interface User {
  id: number;
  user_id: string;
  name: string;
  email: string;
  company: string;
  created_at: string;
}

interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
}

export const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, statsRes] = await Promise.all([
                    api.get('/admin/users'),
                    api.get('/admin/stats')
                ]);
                
                if (usersRes.data.success) setUsers(usersRes.data.users);
                if (statsRes.data.success) setStats(statsRes.data.stats);
            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return (
        <div className="admin-loading">
            <div className="spinner"></div>
            <p>Loading Admin Dashboard...</p>
        </div>
    );

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div>
                    <h1>Admin Console</h1>
                    <p className="subtitle">System Monitoring & User Management</p>
                </div>
                <div className="admin-badge">
                    <Shield size={16} />
                    <span>Administrator Access</span>
                </div>
            </header>

            <div className="admin-stats-grid">
                <div className="admin-stat-card">
                    <div className="stat-icon total">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Total Users</span>
                        <span className="stat-value">{stats?.totalUsers || 0}</span>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon new">
                        <UserPlus size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">New Users (Today)</span>
                        <span className="stat-value">{stats?.newUsersToday || 0}</span>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon active">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">System Status</span>
                        <span className="stat-value healthy">Healthy</span>
                    </div>
                </div>
            </div>

            <div className="admin-table-container">
                <div className="table-header">
                    <div>
                        <h2>Registered Users</h2>
                        <span className="count-badge">{users.length} Total</span>
                    </div>
                    <button className="refresh-btn" onClick={() => window.location.reload()}>
                        Refresh Data
                    </button>
                </div>
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Organization</th>
                                <th>Joined Date</th>
                                <th>User ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.user_id}>
                                    <td>
                                        <div className="user-name-cell">
                                            <div className="avatar">{u.name.charAt(0)}</div>
                                            <span>{u.name}</span>
                                        </div>
                                    </td>
                                    <td>{u.email}</td>
                                    <td>{u.company}</td>
                                    <td>{new Date(u.created_at || '').toLocaleDateString()}</td>
                                    <td><code>{u.user_id.substring(0, 8)}...</code></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
