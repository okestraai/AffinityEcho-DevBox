// src/components/dashboard/DashboardLayout.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { BottomNavigation } from '../components/NavComponent/BottomNavigation';
import { MentorshipModal } from '../components/Modals/MentorShipModals/MentorshipModal';
import { DashboardHeader } from '../components/NavComponent/DashboardHeader';
import { useAuth } from '../hooks/useAuth';
import { GetUnreadCount } from '../../api/notificationApis';
import { GetConnectableUsers, GetMessageUnreadCount } from '../../api/messaging';
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
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  // Mobile search state
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [mobileSearchResults, setMobileSearchResults] = useState<{ id: string; username: string; display_name?: string; avatar?: string }[]>([]);
  const [mobileSearching, setMobileSearching] = useState(false);
  const [showMobileSearchDrop, setShowMobileSearchDrop] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const mobileInactivityRef = useRef<ReturnType<typeof setTimeout>>();

  const clearMobileSearch = () => {
    setMobileSearchQuery('');
    setMobileSearchResults([]);
    setShowMobileSearchDrop(false);
  };

  const handleMobileSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMobileSearchQuery(val);
    clearTimeout(mobileDebounceRef.current);
    clearTimeout(mobileInactivityRef.current);
    if (!val.trim()) {
      setMobileSearchResults([]);
      setShowMobileSearchDrop(false);
      return;
    }
    mobileDebounceRef.current = setTimeout(async () => {
      setMobileSearching(true);
      try {
        const res = await GetConnectableUsers({ search: val, limit: 8 });
        const raw: any[] = res?.users || res?.data || (Array.isArray(res) ? res : []);
        setMobileSearchResults(raw.map((u: any) => ({
          id: u.id || u.user_id,
          username: u.username,
          display_name: u.display_name || u.displayName,
          avatar: u.avatar || u.avatar_emoji,
        })));
        setShowMobileSearchDrop(true);
      } catch {
        setMobileSearchResults([]);
      } finally {
        setMobileSearching(false);
      }
    }, 300);
    // Auto-clear after 1 minute of inactivity
    mobileInactivityRef.current = setTimeout(() => clearMobileSearch(), 60000);
  };

  const handleMobileSelectUser = (userId: string) => {
    setMobileSearchQuery('');
    setMobileSearchResults([]);
    setShowMobileSearchDrop(false);
    navigate(`/dashboard/profile/${userId}`);
  };

  // Close mobile search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setShowMobileSearchDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeTab = location.pathname.split('/')[2] || 'feeds';

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await GetUnreadCount();
      let count = 0;
      if (typeof response === 'number') {
        count = response;
      } else if (response) {
        count = response?.count
          ?? response?.unread_count
          ?? 0;
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
    const handleNewNotification = () => {
      setUnreadCount((prev) => prev + 1);
    };

    const handleNewMessage = () => {
      // Only increment if user is not currently on messages page
      if (!location.pathname.includes('/messages')) {
        setMessageUnreadCount((prev) => prev + 1);
      }
    };

    webSocketService.on("new_notification", handleNewNotification);
    webSocketService.on("new_message", handleNewMessage);

    return () => {
      webSocketService.off("new_notification", handleNewNotification);
      webSocketService.off("new_message", handleNewMessage);
    };
  }, [location.pathname]);

  const handleTabChange = useCallback((tab: string) => {
    navigate(`/dashboard/${tab}`);
    clearMobileSearch();
    if (tab === 'messages') {
      setMessageUnreadCount(0);
    }
  }, [navigate]);

  const closeMentorshipModal = useCallback(() => setShowMentorshipModal(false), []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30 overflow-hidden">
      <DashboardHeader
        activeTab={activeTab}
        unreadCount={unreadCount}
        showNotificationsDropdown={showNotificationsDropdown}
        setShowNotificationsDropdown={setShowNotificationsDropdown}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        onTabChange={handleTabChange}
        onUnreadCountChange={fetchUnreadCount}
        messageUnreadCount={messageUnreadCount}
      />

      {/* Mobile search bar */}
      <div className="md:hidden flex-shrink-0 px-3 py-2 bg-white/95 backdrop-blur-xl border-b border-gray-200/50" ref={mobileSearchRef}>
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={mobileSearchQuery}
              onChange={handleMobileSearchChange}
              onFocus={() => mobileSearchResults.length > 0 && setShowMobileSearchDrop(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && mobileSearchResults.length > 0) {
                  handleMobileSelectUser(mobileSearchResults[0].id);
                }
              }}
              placeholder="Search users..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 border border-transparent rounded-xl focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
            {mobileSearchQuery && (
              <button
                type="button"
                title="Clear search"
                onClick={clearMobileSearch}
                className="absolute right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {showMobileSearchDrop && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {mobileSearching ? (
                <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
              ) : mobileSearchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No users found</div>
              ) : (
                mobileSearchResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleMobileSelectUser(u.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-sm flex-shrink-0">
                      {u.avatar || u.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.display_name || u.username}</p>
                      <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 md:px-6 md:py-8 pb-20 md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex-shrink-0">
        <BottomNavigation activeTab={activeTab} setActiveTab={handleTabChange} messageUnreadCount={messageUnreadCount} />
      </div>

      <MentorshipModal
        isOpen={showMentorshipModal}
        onClose={closeMentorshipModal}
      />

      {import.meta.env.DEV && <TestLLMButton />}
    </div>
  );
}