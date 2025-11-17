import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { OTPVerificationPage } from './components/auth/OTPVerificationPage';
import { ChangePasswordPage } from './components/auth/ChangePasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { Dashboard } from './components/dashboard/Dashboard';
import { FeedsView } from './components/dashboard/FeedsView';
import { ForumsView } from './components/dashboard/ForumsView';
import { TopicDetailPage } from './components/dashboard/TopicDetailPage';
import { NooksView } from './components/dashboard/NooksView';
import { MessagesView } from './components/dashboard/MessagesView';
import { ProfileView } from './components/dashboard/ProfileView';
import { MentorshipView } from './components/dashboard/MentorshipView';
import { FindMentorshipView } from './components/dashboard/FindMentorshipView';
import { ReferralsView } from './components/dashboard/ReferralsView';
import { ConnectionRequestsView } from './components/dashboard/ConnectionRequestsView';
import { ReportHarassmentPage } from './components/dashboard/ReportHarassmentPage';
import { CrisisResourcesPage } from './components/dashboard/CrisisResourcesPage';
import { ExportDataPage } from './components/dashboard/ExportDataPage';
import { CommunityGuidelinesPage } from './components/dashboard/CommunityGuidelinesPage';
import { useAuth } from './hooks/useAuth';

const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [App.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [App.${component}] ${message}`);
  }
};

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();

  if (!isAuthenticated) {
    log('PrivateRoute', 'User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!hasCompletedOnboarding) {
    log('PrivateRoute', 'User has not completed onboarding, redirecting to onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();

  React.useEffect(() => {
    log('AppContent', 'Authentication state changed', {
      isAuthenticated,
      hasCompletedOnboarding
    });
  }, [isAuthenticated, hasCompletedOnboarding]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            hasCompletedOnboarding ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          ) : (
            <LoginScreen />
          )
        }
      />

      <Route path="/verify-otp" element={<OTPVerificationPage />} />

      <Route path="/change-password" element={<ChangePasswordPage />} />

      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/onboarding"
        element={
          hasCompletedOnboarding ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <OnboardingFlow />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard/feeds" replace />} />
        <Route path="feeds" element={<FeedsView />} />
        <Route path="forums" element={<ForumsView />} />
        <Route path="forums/topic/:topicId" element={<TopicDetailPage />} />
        <Route path="nooks" element={<NooksView />} />
        <Route path="messages" element={<MessagesView />} />
        <Route path="mentorship" element={<MentorshipView />} />
        <Route path="find-mentorship" element={<FindMentorshipView />} />
        <Route path="referrals" element={<ReferralsView />} />
        <Route path="connections" element={<ConnectionRequestsView />} />
        <Route path="profile" element={<ProfileView />} />
      </Route>

      <Route
        path="/"
        element={
          isAuthenticated ? (
            hasCompletedOnboarding ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/report-harassment" element={<ReportHarassmentPage />} />
      <Route path="/crisis-resources" element={<CrisisResourcesPage />} />
      <Route path="/export-data" element={<ExportDataPage />} />
      <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  React.useEffect(() => {
    log('App', 'Application initialized');
    log('App', 'Environment info', {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50" style={{ position: 'relative' }}>
          <AppContent />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;