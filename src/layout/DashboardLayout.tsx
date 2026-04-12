// src/components/dashboard/DashboardLayout.tsx
import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation } from '../components/NavComponent/BottomNavigation';
import { DashboardHeader } from '../components/NavComponent/DashboardHeader';
import { useAuth } from '../hooks/useAuth';
import { GetUnreadCount } from '../../api/notificationApis';
import { GetMessageUnreadCount } from '../../api/messaging';
import { webSocketService } from '../services/websocket.service';
import { TestLLMButton } from '../components/dashboard/TestLLMButton';

export function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  const activeTab = location.pathname.split('/')[2] || 'feeds';

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await GetUnreadCount();
      let count = 0;
      if (typeof response === 'number') {
        count = response;
      } else if (response) {
        count = response?.count ?? response?.unread_count ?? 0;
      }
      setUnreadCount(typeof count === 'number' ? count : Number(count) || 0);
    } catch {
      // Silent failure for unread count
    }
  }, [user?.id]);

  const fetchMessageUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await GetMessageUnreadCount({ chat_type: 'all' });
      const count = response?.unread_count ?? response?.count ?? (typeof response === 'number' ? response : 0);
      setMessageUnreadCount(typeof count === 'number' ? count : Number(count) || 0);
    } catch {
      // Silent failure
    }
  }, [user?.id]);

  // Fetch initial unread counts on mount
  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
      fetchMessageUnreadCount();
    }
  }, [user?.id, fetchUnreadCount, fetchMessageUnreadCount]);

  // Listen for real-time notifications via WebSocket instead of polling
  useEffect(() => {
    const playNotificationSound = () => {
      try {
        const audio = new Audio('/sounds/notification.wav');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch { /* autoplay blocked */ }
    };

    const handleNewNotification = () => {
      setUnreadCount((prev) => prev + 1);
      playNotificationSound();
    };

    const handleNewMessage = () => {
      if (!location.pathname.includes('/messages')) {
        setMessageUnreadCount((prev) => prev + 1);
        playNotificationSound();
      }
    };

    webSocketService.on("new_notification", handleNewNotification);
    webSocketService.on("new_message", handleNewMessage);

    // Listen for manual read events from NotificationsView full page
    const handleNotificationsUpdated = () => fetchUnreadCount();
    window.addEventListener("notifications:updated", handleNotificationsUpdated);

    return () => {
      webSocketService.off("new_notification", handleNewNotification);
      webSocketService.off("new_message", handleNewMessage);
      window.removeEventListener("notifications:updated", handleNotificationsUpdated);
    };
  }, [location.pathname, fetchUnreadCount]);

  const handleTabChange = useCallback((tab: string) => {
    navigate(`/dashboard/${tab}`);
    if (tab === 'messages') {
      setMessageUnreadCount(0);
    }
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30 overflow-hidden">
      <DashboardHeader
        activeTab={activeTab}
        unreadCount={unreadCount}
        showNotificationsDropdown={showNotificationsDropdown}
        setShowNotificationsDropdown={setShowNotificationsDropdown}
        onTabChange={handleTabChange}
        onUnreadCountChange={fetchUnreadCount}
        messageUnreadCount={messageUnreadCount}
      />

      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 md:px-6 md:py-8 pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex-shrink-0">
        <BottomNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>

      {import.meta.env.DEV && <TestLLMButton />}
    </div>
  );
}
