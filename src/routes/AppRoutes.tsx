// src/routes/AppRoutes.tsx
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./publicOnlyRoute";
import { ProtectedAdminRoute } from "../admin/layout/AdminLayout";

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
const LoginScreen = React.lazy(() =>
  import("../components/auth/LoginScreen").then((m) => ({
    default: m.LoginScreen,
  })),
);
const OTPVerificationPage = React.lazy(() =>
  import("../components/auth/OTPVerificationPage").then((m) => ({
    default: m.OTPVerificationPage,
  })),
);
const ResetPasswordPage = React.lazy(() =>
  import("../components/auth/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const ChangePasswordPage = React.lazy(() =>
  import("../components/auth/ChangePasswordPage").then((m) => ({
    default: m.ChangePasswordPage,
  })),
);

// Onboarding
const OnboardingFlow = React.lazy(() =>
  import("../components/onboarding/OnboardingFlow").then((m) => ({
    default: m.OnboardingFlow,
  })),
);

// Dashboard shell
import { DashboardLayout } from "../layout/DashboardLayout";

// Dashboard child views
const FeedsView = React.lazy(() =>
  import("../components/dashboard/Feeds/FeedsView").then((m) => ({
    default: m.FeedsView,
  })),
);
const ForumsView = React.lazy(() =>
  import("../components/dashboard/Forum/ForumsView").then((m) => ({
    default: m.ForumsView,
  })),
);
const TopicDetailPage = React.lazy(() =>
  import("../components/dashboard/Forum/TopicDetailPage").then((m) => ({
    default: m.TopicDetailPage,
  })),
);
const NooksView = React.lazy(() =>
  import("../components/dashboard/Nooks/NooksView").then((m) => ({
    default: m.NooksView,
  })),
);
const NookDetailPage = React.lazy(() =>
  import("../components/dashboard/Nooks/NookDetailPage").then((m) => ({
    default: m.NookDetailPage,
  })),
);
const MessagesView = React.lazy(() =>
  import("../components/dashboard/Message/MessagesView").then((m) => ({
    default: m.MessagesView,
  })),
);
const ProfileView = React.lazy(() =>
  import("../components/dashboard/Profile/ProfileView").then((m) => ({
    default: m.ProfileView,
  })),
);
const MentorshipView = React.lazy(() =>
  import("../components/dashboard/Mentorship/MentorshipView").then((m) => ({
    default: m.MentorshipView,
  })),
);
const FindMentorshipView = React.lazy(() =>
  import("../components/dashboard/Mentorship/FindMentorshipView").then((m) => ({
    default: m.FindMentorshipView,
  })),
);
const NotificationsView = React.lazy(() =>
  import("../components/dashboard/Notification/NotificationsView").then(
    (m) => ({ default: m.NotificationsView }),
  ),
);
const SinglePostPage = React.lazy(() =>
  import("../components/dashboard/Feeds/SinglePostPage").then((m) => ({
    default: m.SinglePostPage,
  })),
);

// Profile subpages (rarely visited)
const CommunityGuidelinesPage = React.lazy(() =>
  import("../components/dashboard/Profile/CommunityGuidelinesPage").then(
    (m) => ({ default: m.CommunityGuidelinesPage }),
  ),
);
const CrisisResourcesPage = React.lazy(() =>
  import("../components/dashboard/Profile/CrisisResourcesPage").then((m) => ({
    default: m.CrisisResourcesPage,
  })),
);
const ReportHarassmentPage = React.lazy(() =>
  import("../components/dashboard/Profile/ReportHarassmentPage").then((m) => ({
    default: m.ReportHarassmentPage,
  })),
);
const ExportDataPage = React.lazy(() =>
  import("../components/dashboard/Profile/ExportDataPage").then((m) => ({
    default: m.ExportDataPage,
  })),
);
const MyCasesPage = React.lazy(() =>
  import("../components/dashboard/Profile/MyCasesPage").then((m) => ({
    default: m.MyCasesPage,
  })),
);
const UserProfilePage = React.lazy(() =>
  import("../components/dashboard/Profile/UserProfilePage").then((m) => ({
    default: m.UserProfilePage,
  })),
);

// Admin panel
import { AdminLayout } from "../admin/layout/AdminLayout";
const AdminDashboardPage = React.lazy(() =>
  import("../admin/pages/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const AdminUsersPage = React.lazy(() =>
  import("../admin/pages/UsersPage").then((m) => ({ default: m.UsersPage })),
);
const AdminUserDetailPage = React.lazy(() =>
  import("../admin/pages/UserDetailPage").then((m) => ({
    default: m.UserDetailPage,
  })),
);
const AdminReportsPage = React.lazy(() =>
  import("../admin/pages/ReportsPage").then((m) => ({
    default: m.ReportsPage,
  })),
);
const AdminModerationPage = React.lazy(() =>
  import("../admin/pages/ModerationPage").then((m) => ({
    default: m.ContentModerationPage,
  })),
);
const AdminForumsPage = React.lazy(() =>
  import("../admin/pages/ForumsPage").then((m) => ({ default: m.ForumsPage })),
);
const AdminNooksPage = React.lazy(() =>
  import("../admin/pages/NooksPage").then((m) => ({ default: m.NooksPage })),
);
const AdminNotificationsPage = React.lazy(() =>
  import("../admin/pages/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const AdminLogsPage = React.lazy(() =>
  import("../admin/pages/LogsPage").then((m) => ({ default: m.LogsPage })),
);
const AdminProfilePage = React.lazy(() =>
  import("../admin/pages/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  })),
);
const AdminSettingsPage = React.lazy(() =>
  import("../admin/pages/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);
const AdminContentDetailPage = React.lazy(() =>
  import("../admin/pages/ContentDetailPage").then((m) => ({
    default: m.ContentDetailPage,
  })),
);
const AdminPermissionsPage = React.lazy(() =>
  import("../admin/pages/AdminPermissionsPage").then((m) => ({
    default: m.AdminPermissionsPage,
  })),
);
const AdminNotificationsInboxPage = React.lazy(() =>
  import("../admin/pages/AdminNotificationsInboxPage").then((m) => ({
    default: m.AdminNotificationsInboxPage,
  })),
);

const AppRoutes: React.FC = () => {
  const { isAuthenticated, hasCompletedOnboarding, isLoading, user } =
    useAuth();

  // If still loading auth state, show loader
  if (isLoading) {
    return <PageLoader />;
  }

  // Check if user is admin
  const isAdmin =
    user && (user.role === "admin" || user.role === "super_admin");

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* PUBLIC ROUTES — ALWAYS accessible */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginScreen />
            </PublicOnlyRoute>
          }
        />
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
              <Navigate
                to={isAuthenticated ? "/dashboard" : "/login"}
                replace
              />
            )
          }
        />

        {/* ADMIN PANEL — protected with role-based access */}
        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:userId" element={<AdminUserDetailPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="moderation" element={<AdminModerationPage />} />
          <Route path="forums" element={<AdminForumsPage />} />
          <Route path="nooks" element={<AdminNooksPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="logs" element={<AdminLogsPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="content/:contentType/:contentId" element={<AdminContentDetailPage />} />
          <Route path="my-notifications" element={<AdminNotificationsInboxPage />} />
          <Route
            path="permissions"
            element={
              user?.role === "super_admin" ? (
                <AdminPermissionsPage />
              ) : (
                <Navigate to="/admin" replace />
              )
            }
          />
        </Route>

        {/* FULLY PROTECTED DASHBOARD */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="feeds" replace />} />
          <Route path="feeds" element={<FeedsView />} />
          <Route path="feeds/post/:postId" element={<SinglePostPage />} />
          <Route path="forums" element={<ForumsView />} />
          <Route path="forums/topic/:topicId" element={<TopicDetailPage />} />
          <Route path="nooks" element={<NooksView />} />
          <Route path="nooks/:nookId" element={<NookDetailPage />} />
          <Route path="messages" element={<MessagesView />} />
          <Route path="mentorship" element={<MentorshipView />} />
          <Route path="find-mentorship" element={<FindMentorshipView />} />
          <Route
            path="mentorship-chat"
            element={<Navigate to="messages" replace />}
          />
          <Route path="profile" element={<ProfileView />} />
          <Route path="profile/:userId" element={<UserProfilePage />} />
          <Route path="notifications" element={<NotificationsView />} />
          <Route path="my-cases" element={<MyCasesPage />} />
          <Route path="my-cases/:caseId" element={<MyCasesPage />} />
        </Route>

        {/* PROFILE SUBPAGES — standalone protected pages */}
        <Route
          path="/community-guidelines"
          element={
            <ProtectedRoute>
              <CommunityGuidelinesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crisis-resources"
          element={
            <ProtectedRoute>
              <CrisisResourcesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-harassment"
          element={
            <ProtectedRoute>
              <ReportHarassmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/export-data"
          element={
            <ProtectedRoute>
              <ExportDataPage />
            </ProtectedRoute>
          }
        />

        {/* ROOT REDIRECT - check for admin first */}
        <Route
          path="/"
          element={
            <Navigate
              to={
                isAuthenticated
                  ? isAdmin
                    ? "/admin"
                    : hasCompletedOnboarding
                      ? "/dashboard"
                      : "/onboarding"
                  : "/login"
              }
              replace
            />
          }
        />

        {/* CATCH ALL - redirect to root which will handle the redirect properly */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
