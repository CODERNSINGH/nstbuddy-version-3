// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReactGA from 'react-ga4';
import usePageTracking from './hooks/usePageTracking';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DisclaimerNotice from './components/layout/DisclaimerNotice';

// Pages
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import CampusSelection from './pages/CampusSelection';
import SemesterSelection from './pages/SemesterSelection';
import Questions from './pages/Questions';
import ContributePage from './pages/ContributePage';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import Days100 from './pages/Days100';
import TestAIPopup from './pages/TestAIPopup';
import ExtensionInstall from './pages/ExtensionInstall';

// Initialize Google Analytics
ReactGA.initialize('G-P95H63YPVW');

const AppRoutes: React.FC = () => {
  usePageTracking(); // Track page views

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes - New NST Buddy 2.0 Structure */}
      <Route path="/" element={<ProtectedRoute><CampusSelection /></ProtectedRoute>} />
      <Route path="/campus/:campusSlug" element={<ProtectedRoute><SemesterSelection /></ProtectedRoute>} />
      <Route path="/campus/:campusSlug/semester/:semesterId" element={<ProtectedRoute><Questions /></ProtectedRoute>} />
      <Route path="/contribute" element={<ProtectedRoute><ContributePage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/100days" element={<ProtectedRoute><Days100 /></ProtectedRoute>} />
      <Route path="/extension-install" element={<ProtectedRoute><ExtensionInstall /></ProtectedRoute>} />
      <Route path="/test-popup" element={<TestAIPopup />} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<ProtectedRoute><CampusSelection /></ProtectedRoute>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <DisclaimerNotice />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
