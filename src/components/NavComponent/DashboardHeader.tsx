// src/components/dashboard/DashboardHeader.tsx

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  MessageCircle,
  Zap,
  Target,
  Bell,
  User,
  Search,
  X,
} from "lucide-react";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { GetConnectableUsers } from "../../../api/messaging";

interface DashboardHeaderProps {
  activeTab: string;
  unreadCount: number;
  showNotificationsDropdown: boolean;
  setShowNotificationsDropdown: (open: boolean) => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (open: boolean) => void;
  onTabChange: (tab: string) => void;
  onUnreadCountChange: () => void;
}

// Static nav arrays hoisted outside component — avoids re-creation on every render
const desktopNavItems = [
  { id: "feeds", label: "Home", icon: Home },
  { id: "forums", label: "Forums", icon: Users },
  { id: "nooks", label: "Nooks", icon: Zap },
  { id: "mentorship", label: "Mentorship", icon: Target },
  { id: "messages", label: "Messages", icon: MessageCircle },
] as const;

const mobileNavItems = [
  ...desktopNavItems,
  { id: "profile" as const, label: "Profile" as const, icon: User },
];

interface SearchUser {
  id: string;
  username: string;
  display_name?: string;
  avatar?: string;
}

export function DashboardHeader({
  activeTab,
  unreadCount,
  showNotificationsDropdown,
  setShowNotificationsDropdown,
  showMobileMenu,
  setShowMobileMenu,
  onTabChange,
  onUnreadCountChange,
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    if (showMobileMenu) {
      setShowMobileMenu(false);
    }
  };

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearchDrop(false);
      return;
    }
    setSearching(true);
    try {
      const res = await GetConnectableUsers({ search: q, limit: 8 });
      const raw: { id?: string; user_id?: string; username: string; display_name?: string; displayName?: string; avatar?: string; avatar_emoji?: string }[] = res?.users || res?.data || (Array.isArray(res) ? res : []);
      const users: SearchUser[] = raw.map((u) => ({
        id: u.id || u.user_id,
        username: u.username,
        display_name: u.display_name || u.displayName,
        avatar: u.avatar || u.avatar_emoji,
      }));
      setSearchResults(users);
      setShowSearchDrop(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setSearchResults([]);
      setShowSearchDrop(false);
      return;
    }
    debounceRef.current = setTimeout(() => searchUsers(val), 300);
  };

  const handleSelectUser = (user: SearchUser) => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDrop(false);
    navigate(`/dashboard/profile/${user.id}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDrop(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      className="bg-white/95 backdrop-blur-xl border-b border-gray-200/50 px-3 py-3 sm:px-4 md:px-6 md:py-4 shadow-sm relative z-40 flex-shrink-0"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <img
            src="/affinity-echo-logo-hd.png"
            alt="Affinity Echo Logo"
            className="w-10 h-10 md:w-12 md:h-12 rounded-2xl shadow-lg object-contain"
          />
          <span className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent hidden sm:inline">
            Affinity Echo
          </span>
        </div>

        {/* Search bar — desktop */}
        <div ref={searchRef} className="relative hidden md:block flex-1 max-w-xs">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowSearchDrop(true)}
              placeholder="Search users..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 border border-transparent rounded-xl focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
            {searchQuery && (
              <button type="button" onClick={clearSearch} className="absolute right-2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showSearchDrop && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {searching ? (
                <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No users found</div>
              ) : (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-sm flex-shrink-0">
                      {user.avatar || user.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-2">
            {desktopNavItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  title={tab.label}
                  className={`nav-icon-btn flex items-center justify-center p-3 rounded-xl transition-all ${
                    isActive
                      ? "text-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </button>
              );
            })}
          </nav>

          <div className="hidden md:block h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent mx-2"></div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() =>
                  setShowNotificationsDropdown(!showNotificationsDropdown)
                }
                className="nav-icon-btn relative p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="w-7 h-7" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <NotificationsDropdown
                isOpen={showNotificationsDropdown}
                onClose={() => setShowNotificationsDropdown(false)}
                unreadCount={unreadCount}
                onUnreadCountChange={onUnreadCountChange}
              />
            </div>

            <button
              onClick={() => handleTabChange("profile")}
              title="Profile"
              className={`nav-icon-btn flex items-center justify-center p-3 rounded-xl transition-all ${
                activeTab === "profile"
                  ? "text-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200"
              }`}
            >
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
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
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Mobile search */}
            <div className="px-4 pt-3 pb-1" ref={searchRef}>
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search users..."
                  className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 border border-transparent rounded-xl focus:bg-white focus:border-gray-300 outline-none"
                />
                {searchQuery && (
                  <button type="button" onClick={clearSearch} className="absolute right-2 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {showSearchDrop && searchResults.length > 0 && (
                <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => { handleSelectUser(user); setShowMobileMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-sm flex-shrink-0">
                        {user.avatar || user.username?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.display_name || user.username}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <nav className="px-4 py-2">
              {mobileNavItems.map((tab) => {
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
                        ? "text-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200"
                        : "text-gray-600 active:text-gray-900 active:bg-gray-50 border border-transparent"
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
  );
}
