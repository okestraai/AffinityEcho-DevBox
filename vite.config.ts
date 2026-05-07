/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['app.affinityecho.com'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    testTimeout: 15000,
    include: ['src/test/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: [
        'src/contexts/AuthContext.tsx',
        'src/components/auth/LoginScreen.tsx',
        'src/components/auth/OTPVerificationPage.tsx',
        'src/components/dashboard/Message/MessagesView.tsx',
        'src/components/dashboard/Message/MentorshipRequestsView.tsx',
        'src/components/dashboard/Mentorship/MentorshipView.tsx',
        'src/components/dashboard/Mentorship/FindMentorshipView.tsx',
        'src/components/dashboard/Forum/ForumsView.tsx',
        'src/components/dashboard/Forum/TopicDetailPage.tsx',
        'src/components/dashboard/Forum/ForumDetailView.tsx',
        'src/components/dashboard/Feeds/FeedsView.tsx',
        'src/components/dashboard/Profile/EditProfilePanel.tsx',
        'src/components/dashboard/Profile/UserProfilePage.tsx',
        'src/components/dashboard/Nooks/NooksView.tsx',
        'src/components/dashboard/Nooks/NookDetails.tsx',
        'src/components/dashboard/Notification/NotificationsView.tsx',
        'src/services/websocket.service.ts',
        'src/utils/cookies.ts',
        'src/utils/tokenUtils.ts',
        'src/utils/forumUtils.ts',
        'src/Helper/ShowToast.tsx',
        'src/Helper/AxiosInterceptor.tsx',
        'api/authApis.ts',
        'api/feedApis.ts',
        'api/forumApis.ts',
        'api/messaging.ts',
        'api/mentorshipApis.ts',
        'api/nookApis.ts',
        'api/profileApis.ts',
        'api/notificationApis.ts',
      ],
      reporter: ['text', 'text-summary'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
});
