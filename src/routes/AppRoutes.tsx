// src/routes/AppRoutes.tsx
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './publicOnlyRoute';

// Branded loading screen with animated logo
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
    <div className="animate-logo-pulse">
      <img
        src="/affinity-echo-logo-hd.png"
        alt="Affinity Echo"
        className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-xl object-contain"
      />
    </div>
    <div className="mt-4 flex items-center gap-1.5">
      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce bounce-delay-150" />
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce bounce-delay-300" />
    </div>
  </div>
);

// --- Lazy-loaded routes ---

// Auth (only needed before login)
const LoginScreen = React.lazy(() => import('../components/auth/LoginScreen').then(m => ({ default: m.LoginScreen })));
const OTPVerificationPage = React.lazy(() => import('../components/auth/OTPVerificationPage').then(m => ({ default: m.OTPVerificationPage })));
const ResetPasswordPage = React.lazy(() => import('../components/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const ChangePasswordPage = React.lazy(() => import('../components/auth/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })));

// Onboarding
const OnboardingFlow = React.lazy(() => import('../components/onboarding/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));

// Dashboard shell (eager — always needed once authenticated)
import { DashboardLayout } from '../layout/DashboardLayout';

// Dashboard child views
const FeedsView = React.lazy(() => import('../components/dashboard/Feeds/FeedsView').then(m => ({ default: m.FeedsView })));
const ForumsView = React.lazy(() => import('../components/dashboard/Forum/ForumsView').then(m => ({ default: m.ForumsView })));
const TopicDetailPage = React.lazy(() => import('../components/dashboard/Forum/TopicDetailPage').then(m => ({ default: m.TopicDetailPage })));
const NooksView = React.lazy(() => import('../components/dashboard/Nooks/NooksView').then(m => ({ default: m.NooksView })));
const NookDetailPage = React.lazy(() => import('../components/dashboard/Nooks/NookDetailPage').then(m => ({ default: m.NookDetailPage })));
const MessagesView = React.lazy(() => import('../components/dashboard/Message/MessagesView').then(m => ({ default: m.MessagesView })));
const ProfileView = React.lazy(() => import('../components/dashboard/Profile/ProfileView').then(m => ({ default: m.ProfileView })));
const MentorshipView = React.lazy(() => import('../components/dashboard/Mentorship/MentorshipView').then(m => ({ default: m.MentorshipView })));
const FindMentorshipView = React.lazy(() => import('../components/dashboard/Mentorship/FindMentorshipView').then(m => ({ default: m.FindMentorshipView })));
const NotificationsView = React.lazy(() => import('../components/dashboard/Notification/NotificationsView').then(m => ({ default: m.NotificationsView })));

// Profile subpages (rarely visited)
const CommunityGuidelinesPage = React.lazy(() => import('../components/dashboard/Profile/CommunityGuidelinesPage').then(m => ({ default: m.CommunityGuidelinesPage })));
const CrisisResourcesPage = React.lazy(() => import('../components/dashboard/Profile/CrisisResourcesPage').then(m => ({ default: m.CrisisResourcesPage })));
const ReportHarassmentPage = React.lazy(() => import('../components/dashboard/Profile/ReportHarassmentPage').then(m => ({ default: m.ReportHarassmentPage })));
const ExportDataPage = React.lazy(() => import('../components/dashboard/Profile/ExportDataPage').then(m => ({ default: m.ExportDataPage })));
const MyCasesPage = React.lazy(() => import('../components/dashboard/Profile/MyCasesPage').then(m => ({ default: m.MyCasesPage })));

const AppRoutes: React.FC = () => {
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* PUBLIC ROUTES — ALWAYS accessible */}
        <Route path="/login" element={<PublicOnlyRoute><LoginScreen /></PublicOnlyRoute>} />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />
        <Route path="/verify-otp/*" element={<OTPVerificationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* ONBOARDING — only for logged-in users who haven't completed it */}
        <Route
          path="/onboarding"
          element={
            isAuthenticated && !hasCompletedOnboarding ? (
              <OnboardingFlow />
            ) : (
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            )
          }
        />

        {/* FULLY PROTECTED DASHBOARD */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="" element={<Navigate to="feeds" replace />} />
          <Route path="feeds" element={<FeedsView />} />
          <Route path="forums" element={<ForumsView />} />
          <Route path="forums/topic/:topicId" element={<TopicDetailPage />} />
          <Route path="nooks" element={<NooksView />} />
          <Route path="nooks/:nookId" element={<NookDetailPage />} />
          <Route path="messages" element={<MessagesView />} />
          <Route path="mentorship" element={<MentorshipView />} />
          <Route path="find-mentorship" element={<FindMentorshipView />} />
          <Route path="mentorship-chat" element={<Navigate to="messages" replace />} />
          <Route path="profile" element={<ProfileView />} />
          <Route path="notifications" element={<NotificationsView />} />
          <Route path="my-cases" element={<MyCasesPage />} />
        </Route>

        {/* PROFILE SUBPAGES — standalone protected pages */}
        <Route path="/community-guidelines" element={<ProtectedRoute><CommunityGuidelinesPage /></ProtectedRoute>} />
        <Route path="/crisis-resources" element={<ProtectedRoute><CrisisResourcesPage /></ProtectedRoute>} />
        <Route path="/report-harassment" element={<ProtectedRoute><ReportHarassmentPage /></ProtectedRoute>} />
        <Route path="/export-data" element={<ProtectedRoute><ExportDataPage /></ProtectedRoute>} />

        {/* ROOT REDIRECT */}
        <Route
          path="/"
          element={
            isLoading ? (
              <PageLoader />
            ) : (
              <Navigate
                to={
                  isAuthenticated
                    ? hasCompletedOnboarding
                      ? "/dashboard"
                      : "/onboarding"
                    : "/login"
                }
                replace
              />
            )
          }
        />

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
