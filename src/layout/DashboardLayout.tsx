// src/components/dashboard/DashboardLayout.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation } from '../components/NavComponent/BottomNavigation';
import { MentorshipModal } from '../components/Modals/MentorShipModals/MentorshipModal';
import { DashboardHeader } from '../components/NavComponent/DashboardHeader';
import { useAuth } from '../hooks/useAuth';
import { GetUnreadCount } from '../../api/notificationApis';
import { webSocketService } from '../services/websocket.service';
import { TestLLMButton } from '../components/dashboard/TestLLMButton';

export function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const activeTab = location.pathname.split('/')[2] || 'feeds';

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await GetUnreadCount();
      // Handle all possible response shapes from the API after unwrap:
      // - number directly: response = 5
      // - nested: response = { data: { count: 5 } }
      // - flat: response = { count: 5 } or { unread_count: 5 }
      let count = 0;
      if (typeof response === 'number') {
        count = response;
      } else if (response) {
        count = response?.data?.count
          ?? response?.data?.unread_count
          ?? response?.count
          ?? response?.unread_count
          ?? 0;
      }
      setUnreadCount(typeof count === 'number' ? count : Number(count) || 0);
    } catch {
      // Silent failure for unread count
    }
  }, [user?.id]);

  // Fetch initial unread count on mount
  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
    }
  }, [user?.id, fetchUnreadCount]);

  // Listen for real-time notifications via WebSocket instead of polling
  useEffect(() => {
    const handleNewNotification = () => {
      setUnreadCount((prev) => prev + 1);
    };

    webSocketService.on("new_notification", handleNewNotification);

    return () => {
      webSocketService.off("new_notification", handleNewNotification);
    };
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    navigate(`/dashboard/${tab}`);
  }, [navigate]);

  const closeMentorshipModal = useCallback(() => setShowMentorshipModal(false), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 relative">
      <DashboardHeader
        activeTab={activeTab}
        unreadCount={unreadCount}
        showNotificationsDropdown={showNotificationsDropdown}
        setShowNotificationsDropdown={setShowNotificationsDropdown}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        onTabChange={handleTabChange}
        onUnreadCountChange={fetchUnreadCount}
      />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8 pb-32 md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>

      <MentorshipModal
        isOpen={showMentorshipModal}
        onClose={closeMentorshipModal}
      />

      {import.meta.env.DEV && <TestLLMButton />}
    </div>
  );
}