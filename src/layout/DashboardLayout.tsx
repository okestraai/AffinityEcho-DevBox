// src/components/dashboard/DashboardLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation } from '../components/NavComponent/BottomNavigation';
import { MentorshipModal } from '../components/Modals/MentorShipModals/MentorshipModal';
import { DashboardHeader } from '../components/NavComponent/DashboardHeader';
import { useAuth } from '../hooks/useAuth';
import { getUnreadCount } from '../lib/notifications';
import { supabase } from '../lib/supabase';

export function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const activeTab = location.pathname.split('/')[2] || 'feeds';

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    const count = await getUnreadCount(user.id);
    setUnreadCount(count);
  };

  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();

      const subscription = supabase
        .channel('notifications-count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          fetchUnreadCount
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id]);

  const handleTabChange = (tab: string) => {
    navigate(`/dashboard/${tab}`);
  };

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
        onClose={() => setShowMentorshipModal(false)}
      />
    </div>
  );
}