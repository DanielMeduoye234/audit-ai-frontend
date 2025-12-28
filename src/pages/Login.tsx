import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import './Auth.css';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-grid"></div>
      <div className="auth-bg-effect"></div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-dot"></span>
            <span className="auth-logo-text">AUDIT AI</span>
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to access your financial intelligence</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                className="auth-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                type="password"
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight size={20} />}
          </button>
          
          <button 
            type="button" 
            onClick={async () => {
              if (confirm('Clear all stored data? This will log you out.')) {
                try {
                  // Import supabase
                  const { supabase } = await import('../lib/supabase');
                  
                  // Sign out from Supabase first
                  await supabase.auth.signOut();
                  
                  // Clear all storage
                  localStorage.clear();
                  sessionStorage.clear();
                  
                  // Clear IndexedDB
                  const dbs = await indexedDB.databases();
                  for (const db of dbs) {
                    if (db.name) {
                      indexedDB.deleteDatabase(db.name);
                    }
                  }
                  
                  // Reload after a delay
                  setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                  console.error('Clear error:', error);
                  alert('Error clearing storage. Please try again.');
                }
              }
            }}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🧹 Clear Corrupted Session
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? 
          <Link to="/register" className="auth-link">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
