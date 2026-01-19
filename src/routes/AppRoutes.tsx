// src/routes/AppRoutes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Public
import { LoginScreen } from '../components/auth/LoginScreen';
import { OTPVerificationPage } from '../components/auth/OTPVerificationPage';
import { ResetPasswordPage } from '../components/auth/ResetPasswordPage';
import { ChangePasswordPage } from '../components/auth/ChangePasswordPage';

// Protected
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { DashboardLayout } from '../layout/DashboardLayout';
import { FeedsView } from '../components/dashboard/Feeds/FeedsView';
import { ForumsView } from '../components/dashboard/Forum/ForumsView';
import { TopicDetailPage } from '../components/dashboard/Forum/TopicDetailPage';
import { NooksView } from '../components/dashboard/Nooks/NooksView';
import { MessagesView } from '../components/dashboard/Message/MessagesView';
import { ProfileView } from '../components/dashboard/Profile/ProfileView';
import { MentorshipView } from '../components/dashboard/Mentorship/MentorshipView';
import { FindMentorshipView } from '../components/dashboard/Mentorship/FindMentorshipView';


import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './publicOnlyRoute';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();

  return (
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
        <Route path="messages" element={<MessagesView />} />
        <Route path="mentorship" element={<MentorshipView />} />
        <Route path="find-mentorship" element={<FindMentorshipView />} />
        <Route path="profile" element={<ProfileView />} />
      </Route>

      {/* ROOT REDIRECT */}
      <Route
        path="/"
        element={
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
        }
      />

      {/* CATCH ALL */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;