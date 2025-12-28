import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../contexts/TransactionContext';
import { availableReports as reportTypes } from './Reports';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { User, Mail, Building, MapPin, Phone, Camera, Shield, Activity, LogOut, Check } from 'lucide-react';
import './Profile.css';

interface ActivityItem {
  action: string;
  date: string;
}

export function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { transactions } = useTransactions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY'
  });

  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    accountAge: 0,
    reportCount: 0,
    complianceScore: 100
  });

  useEffect(() => {
    // Calculate stats dynamically
    const totalTransactions = transactions.length;
    const reportCount = reportTypes.length;
    
    // Calculate compliance based on transactions with receipts
    // If no transactions, assume 100% compliance. If transactions exist, check receipt ratio.
    let complianceScore = 100;
    if (totalTransactions > 0) {
      const transactionsWithReceipts = transactions.filter(t => t.receipt).length;
      complianceScore = Math.round((transactionsWithReceipts / totalTransactions) * 100);
    }

    setStats(prev => ({
      ...prev,
      totalTransactions,
      reportCount,
      complianceScore
    }));
  }, [transactions]);

  useEffect(() => {
    if (!user) return;
    
    // Load from localStorage first (fast and reliable)
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const localData = JSON.parse(savedProfile);
      setUserData(prev => ({
        ...prev,
        firstName: localData.firstName || '',
        lastName: localData.lastName || '',
        email: user.email || '',
        company: localData.company || '',
        role: localData.role || 'Financial Controller',
        phone: localData.phone || prev.phone,
        location: localData.location || prev.location
      }));
    } else {
      // Fallback to auth metadata for new users
      const metadata = user.user_metadata || {};
      const fullName = metadata.full_name || '';
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ');
      
      setUserData(prev => ({
        ...prev,
        firstName: firstName || '',
        lastName: lastName || '',
        email: user.email || '',
        company: metadata.organization_name || '',
        role: metadata.role || 'Financial Controller',
        phone: metadata.phone || prev.phone,
        location: metadata.location || prev.location
      }));
    }
  }, [user]);

  // Fetch recent activity from audit logs
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user) return;
      
      try {
        setIsLoadingActivity(true);
        // Use direct fetch to avoid 431 error from large auth headers
        const response = await fetch(`http://localhost:5000/api/audit/logs?limit=5&userId=${user.id}`);
        const data = await response.json();
        
        if (data.success && data.data?.logs) {
          const formattedActivity = data.data.logs.map((log: any) => ({
            action: formatActivityAction(log),
            date: formatActivityDate(log.timestamp)
          }));
          setRecentActivity(formattedActivity);
        }
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        // Keep empty array on error
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchRecentActivity();
  }, [user]);

  // Format activity action based on log data
  const formatActivityAction = (log: any): string => {
    const { action, entity_type } = log;
    
    if (action === 'create' && entity_type === 'transaction') {
      return 'Created a new transaction';
    } else if (action === 'update' && entity_type === 'transaction') {
      return 'Updated a transaction';
    } else if (action === 'delete' && entity_type === 'transaction') {
      return 'Deleted a transaction';
    } else if (action === 'update' && entity_type === 'profile') {
      return 'Updated profile information';
    } else if (action === 'upload' && entity_type === 'document') {
      return 'Uploaded a document';
    } else if (action === 'ai_chat') {
      return 'Interacted with AI Assistant';
    } else if (action === 'login') {
      return 'Logged in';
    } else if (action === 'logout') {
      return 'Logged out';
    } else if (action === 'update' && entity_type === 'settings') {
      return 'Changed settings';
    }
    
    return `${action.charAt(0).toUpperCase() + action.slice(1)} ${entity_type}`;
  };

  // Format activity date
  const formatActivityDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // For older dates, show formatted date
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // In a real app, upload to storage bucket here.
      // For now, we'll just use FileReader for local preview and save as data URL
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setAvatarUrl(result);
        
        // Update user metadata with new avatar
        try {
          const { error } = await supabase.auth.updateUser({
            data: { avatar_url: result }
          });
          if (error) throw error;
        } catch (error) {
          console.error('Error updating avatar:', error);
        }
        
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const profileData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      company: userData.company,
      role: userData.role,
      phone: userData.phone,
      location: userData.location
    };
    
    // Try Supabase first, but always save to localStorage as backup
    try {
      if (user) {
        await supabase
          .from('profiles')
          .update({
            id: user.id,
            first_name: userData.firstName,
            last_name: userData.lastName,
            company: userData.company,
            role: userData.role,
            phone: userData.phone,
            location: userData.location,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }
    } catch (err) {
      console.log('Supabase update skipped, using local storage');
    }
    
    // Always save to localStorage
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    
    setIsSaving(false);
    alert('Profile updated successfully!');
  };

  return (
    <div className="profile">
      <div className="profile-banner"></div>
      
      <div className="profile-content-wrapper">
        <header className="profile-header">
          <div className="profile-header-content">
            <div className="avatar-container">
              <div className="avatar-wrapper">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={64} />
                  </div>
                )}
                <button 
                  className="avatar-upload-btn" 
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  title="Change Profile Picture"
                >
                  <Camera size={20} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>
            </div>
            
            <div className="profile-title-section">
              <div className="profile-name-row">
                <h2>
                  {(userData.firstName || userData.lastName) 
                    ? `${userData.firstName} ${userData.lastName}`.trim() 
                    : userData.email}
                </h2>
                <span className="role-badge">Admin</span>
              </div>
              <p className="text-secondary">{userData.role} at {userData.company}</p>
            </div>
          </div>

          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} />
            Log Out
          </button>
        </header>

        <div className="profile-grid">
          <div className="profile-left-col">
            <Card className="stats-card">
              <div className="stat-row">
                <div className="stat-item">
                  <span className="stat-value">{stats.totalTransactions}</span>
                  <span className="stat-label">Transactions</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-value">{stats.reportCount}</span>
                  <span className="stat-label">Reports</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-value">{stats.complianceScore}%</span>
                  <span className="stat-label">Compliance</span>
                </div>
              </div>
            </Card>

            <Card className="activity-card">
              <h4>
                <Activity size={18} />
                Recent Activity
              </h4>
              <div className="activity-list">
                {isLoadingActivity ? (
                  <div className="activity-loading">
                    <p className="text-secondary">Loading activity...</p>
                  </div>
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((item, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">
                        <Check size={14} />
                      </div>
                      <div className="activity-details">
                        <p>{item.action}</p>
                        <span className="text-secondary">{item.date}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="activity-empty">
                    <p className="text-secondary">No recent activity</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="profile-right-col">
            <Card className="form-card">
              <h3>Personal Information</h3>
              <form className="profile-form" onSubmit={handleSaveProfile}>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <div className="input-wrapper">
                      <User size={18} />
                      <input 
                        type="text" 
                        value={userData.firstName}
                        onChange={(e) => handleInputChange(e, 'firstName')}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <div className="input-wrapper">
                      <User size={18} />
                      <input 
                        type="text" 
                        value={userData.lastName}
                        onChange={(e) => handleInputChange(e, 'lastName')}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <Mail size={18} />
                    <input 
                      type="email" 
                      value={userData.email}
                      disabled
                      className="input-disabled"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-wrapper">
                    <Phone size={18} />
                    <input 
                      type="tel" 
                      value={userData.phone}
                      onChange={(e) => handleInputChange(e, 'phone')}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Company</label>
                    <div className="input-wrapper">
                      <Building size={18} />
                      <input 
                        type="text" 
                        value={userData.company}
                        onChange={(e) => handleInputChange(e, 'company')}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Job Title</label>
                    <div className="input-wrapper">
                      <User size={18} />
                      <input 
                        type="text" 
                        value={userData.role}
                        onChange={(e) => handleInputChange(e, 'role')}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <div className="input-wrapper">
                    <MapPin size={18} />
                    <input 
                      type="text" 
                      value={userData.location}
                      onChange={(e) => handleInputChange(e, 'location')}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-save" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </Card>

            <Card className="form-card">
              <h3>
                <Shield size={20} />
                Security Settings
              </h3>
              <form className="security-form" onSubmit={(e) => e.preventDefault()}>
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
                <button type="submit" className="btn-save">Update Password</button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
