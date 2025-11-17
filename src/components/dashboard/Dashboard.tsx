import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { MentorshipModal } from './MentorshipModal';
import { NotificationsDropdown } from './NotificationsDropdown';
import { Home, Users, MessageCircle, Zap, User, Target, Briefcase, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getUnreadCount } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [Dashboard.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [Dashboard.${component}] ${message}`);
  }
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const activeTab = location.pathname.split('/')[2] || 'feeds';

  React.useEffect(() => {
    log('Dashboard', 'Component initialized');
    if (user?.id) {
      fetchUnreadCount();
      subscribeToNotifications();
    }
  }, [user?.id]);

  React.useEffect(() => {
    log('Dashboard', 'Active route changed', { activeTab, path: location.pathname });
  }, [activeTab, location.pathname]);

  React.useEffect(() => {
    log('Dashboard', 'Mentorship modal state changed', { showMentorshipModal });
  }, [showMentorshipModal]);

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    const count = await getUnreadCount(user.id);
    setUnreadCount(count);
  };

  const subscribeToNotifications = () => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleTabChange = (tab: string) => {
    log('handleTabChange', 'Navigating to tab', { tab });
    navigate(`/dashboard/${tab}`);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 relative">
      {/* Desktop Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-gray-200/50 px-4 py-4 md:px-6 md:py-6 shadow-sm sticky top-0 z-40" style={{ position: 'sticky' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">Affinity Echo</span>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-2">
              {[
                { id: 'feeds', label: 'Home', icon: Home },
                { id: 'forums', label: 'Forums', icon: Users },
                { id: 'nooks', label: 'Nooks', icon: Zap },
                { id: 'mentorship', label: 'Mentorship', icon: Target },
                { id: 'referrals', label: 'Referrals', icon: Briefcase },
                { id: 'messages', label: 'Messages', icon: MessageCircle }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all font-medium ${
                      isActive
                        ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationsDropdown
                  isOpen={showNotificationsDropdown}
                  onClose={() => setShowNotificationsDropdown(false)}
                  unreadCount={unreadCount}
                  onUnreadCountChange={fetchUnreadCount}
                />
              </div>

              <button
                onClick={() => handleTabChange('profile')}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all font-medium ${
                  activeTab === 'profile'
                    ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline">Profile</span>
              </button>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <>
            <div
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
              <nav className="px-4 py-2">
                {[
                  { id: 'feeds', label: 'Home', icon: Home },
                  { id: 'forums', label: 'Forums', icon: Users },
                  { id: 'nooks', label: 'Nooks', icon: Zap },
                  { id: 'mentorship', label: 'Mentorship', icon: Target },
                  { id: 'referrals', label: 'Referrals', icon: Briefcase },
                  { id: 'messages', label: 'Messages', icon: MessageCircle },
                  { id: 'profile', label: 'Profile', icon: User }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        handleTabChange(tab.id);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium active:scale-95 ${
                        isActive
                          ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200'
                          : 'text-gray-600 active:text-gray-900 active:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </>
        )}
      </header>

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