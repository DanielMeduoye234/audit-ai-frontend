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
    businessName: '',
    industry: '',
    taxId: '',
    registrationNumber: '',
    email: '',
    phone: '+1 (555) 123-4567',
    businessAddress: '',
    contactPerson: ''
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
        businessName: localData.businessName || user.company || '',
        industry: localData.industry || '',
        taxId: localData.taxId || '',
        registrationNumber: localData.registrationNumber || '',
        email: user.email || '',
        phone: localData.phone || prev.phone,
        businessAddress: localData.businessAddress || '',
        contactPerson: localData.contactPerson || user.name || ''
      }));
    } else {
      // Fallback to auth data for new users
      setUserData(prev => ({
        ...prev,
        businessName: user.company || '',
        industry: '',
        taxId: '',
        registrationNumber: '',
        email: user.email || '',
        phone: prev.phone,
        businessAddress: '',
        contactPerson: user.name || ''
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
      businessName: userData.businessName,
      industry: userData.industry,
      taxId: userData.taxId,
      registrationNumber: userData.registrationNumber,
      phone: userData.phone,
      businessAddress: userData.businessAddress,
      contactPerson: userData.contactPerson
    };
    
    // Try Supabase first, but always save to localStorage as backup
    try {
      if (user) {
        await supabase
          .from('profiles')
          .update({
            id: user.id,
            business_name: userData.businessName,
            industry: userData.industry,
            tax_id: userData.taxId,
            registration_number: userData.registrationNumber,
            phone: userData.phone,
            business_address: userData.businessAddress,
            contact_person: userData.contactPerson,
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
    alert('Business profile updated successfully!');
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
                  {userData.businessName || userData.email}
                </h2>
                <span className="role-badge">Business Account</span>
              </div>
              <p className="text-secondary">{userData.industry || 'Business'} • {userData.contactPerson || 'Contact Person'}</p>
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
              <h3>Business Information</h3>
              <form className="profile-form" onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label>Business Name</label>
                  <div className="input-wrapper">
                    <Building size={18} />
                    <input 
                      type="text" 
                      value={userData.businessName}
                      onChange={(e) => handleInputChange(e, 'businessName')}
                      placeholder="Enter your business name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Industry</label>
                    <div className="input-wrapper">
                      <Activity size={18} />
                      <input 
                        type="text" 
                        value={userData.industry}
                        onChange={(e) => handleInputChange(e, 'industry')}
                        placeholder="e.g., Technology, Retail, Healthcare"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Tax ID / EIN</label>
                    <div className="input-wrapper">
                      <Shield size={18} />
                      <input 
                        type="text" 
                        value={userData.taxId}
                        onChange={(e) => handleInputChange(e, 'taxId')}
                        placeholder="XX-XXXXXXX"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Business Registration Number</label>
                  <div className="input-wrapper">
                    <Shield size={18} />
                    <input 
                      type="text" 
                      value={userData.registrationNumber}
                      onChange={(e) => handleInputChange(e, 'registrationNumber')}
                      placeholder="Enter registration number"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Business Email</label>
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
                  <label>Business Phone</label>
                  <div className="input-wrapper">
                    <Phone size={18} />
                    <input 
                      type="tel" 
                      value={userData.phone}
                      onChange={(e) => handleInputChange(e, 'phone')}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Business Address</label>
                  <div className="input-wrapper">
                    <MapPin size={18} />
                    <input 
                      type="text" 
                      value={userData.businessAddress}
                      onChange={(e) => handleInputChange(e, 'businessAddress')}
                      placeholder="Street, City, State, ZIP"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Contact Person</label>
                  <div className="input-wrapper">
                    <User size={18} />
                    <input 
                      type="text" 
                      value={userData.contactPerson}
                      onChange={(e) => handleInputChange(e, 'contactPerson')}
                      placeholder="Primary contact name"
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
