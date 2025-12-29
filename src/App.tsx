import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Reports } from './pages/Reports';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { AIChat } from './pages/AIChat';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Notifications } from './pages/Notifications';
import { Complaint } from './pages/Complaint';
import Feedback from './pages/Feedback';
import { AdminDashboard } from './pages/AdminDashboard';

import { TransactionProvider } from './contexts/TransactionContext';
import { SupabaseDiagnostics } from './components/SupabaseDiagnostics';

function App() {
  const { user } = useAuth();

  const [onboardingCompleted, setOnboardingCompleted] =
    useState(() => localStorage.getItem('onboardingCompleted'));

  useEffect(() => {
    setOnboardingCompleted(
      localStorage.getItem('onboardingCompleted'),
    );
  }, [user]);

  return (
    <Router>
      <TransactionProvider>
        <Routes>

            {/* Onboarding */}
          <Route
            path="/"
            element={
              onboardingCompleted ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Onboarding />
              )
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Layout>
                  <Transactions />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            }
          />

          

          <Route
            path="/ai-chat"
            element={
              <ProtectedRoute>
                <Layout>
                  <AIChat />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Layout>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/complaint"
            element={
              <ProtectedRoute>
                <Layout>
                  <Complaint />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <Layout>
                  <Feedback />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="/diagnostics" element={<SupabaseDiagnostics />} />
          </Routes>
      </TransactionProvider>
    </Router>
  );
}

export default App;
