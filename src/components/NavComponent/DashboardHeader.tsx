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
import { VerifiedBadge } from "../shared/VerifiedBadge";

interface DashboardHeaderProps {
  activeTab: string;
  unreadCount: number;
  messageUnreadCount?: number;
  showNotificationsDropdown: boolean;
  setShowNotificationsDropdown: (open: boolean) => void;
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

interface SearchUser {
  id: string;
  username: string;
  display_name?: string;
  avatar?: string;
  is_company_verified?: boolean;
}

export function DashboardHeader({
  activeTab,
  unreadCount,
  messageUnreadCount = 0,
  showNotificationsDropdown,
  setShowNotificationsDropdown,
  onTabChange,
  onUnreadCountChange,
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inactivityRef = useRef<ReturnType<typeof setTimeout>>();

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    clearSearch();
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
      const raw: { id?: string; user_id?: string; username: string; display_name?: string; displayName?: string; avatar?: string; avatar_emoji?: string; is_company_verified?: boolean }[] = res?.users || res?.data || (Array.isArray(res) ? res : []);
      const users: SearchUser[] = raw.map((u) => ({
        id: (u.id || u.user_id) as string,
        username: u.username,
        display_name: u.display_name || u.displayName,
        avatar: u.avatar || u.avatar_emoji,
        is_company_verified: u.is_company_verified ?? false,
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
    clearTimeout(inactivityRef.current);
    if (!val.trim()) {
      setSearchResults([]);
      setShowSearchDrop(false);
      return;
    }
    debounceRef.current = setTimeout(() => searchUsers(val), 300);
    // Auto-clear after 1 minute of inactivity
    inactivityRef.current = setTimeout(() => clearSearch(), 60000);
  };

  const handleSelectUser = (user: SearchUser) => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDrop(false);
    setShowMobileSearch(false);
    navigate(`/dashboard/profile/${user.id}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDrop(false);
  };

  const handleMobileSearchToggle = () => {
    if (showMobileSearch) {
      setShowMobileSearch(false);
      clearSearch();
    } else {
      setShowMobileSearch(true);
      // close notifications if open
      if (showNotificationsDropdown) setShowNotificationsDropdown(false);
    }
  };

  const handleNotificationsToggle = () => {
    if (!showNotificationsDropdown) {
      // close mobile search if open
      setShowMobileSearch(false);
      clearSearch();
    }
    setShowNotificationsDropdown(!showNotificationsDropdown);
  };

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDesktop = searchRef.current && searchRef.current.contains(target);
      const inMobile = mobileSearchRef.current && mobileSearchRef.current.contains(target);
      if (!inDesktop && !inMobile) {
        setShowSearchDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const renderSearchDropdown = () =>
    showSearchDrop ? (
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
                <p className="text-sm font-medium text-gray-900 truncate inline-flex items-center gap-1">
                  {user.display_name || user.username}
                  {user.is_company_verified && <VerifiedBadge size={16} />}
                </p>
                <p className="text-xs text-gray-500 truncate">@{user.username}</p>
              </div>
            </button>
          ))
        )}
      </div>
    ) : null;

  return (
    <header className="bg-white/95 backdrop-blur-xl border-b border-gray-200/50 px-3 py-3 sm:px-4 md:px-6 md:py-4 shadow-sm relative z-40 flex-shrink-0">
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

        {/* Search bar — desktop only */}
        <div ref={searchRef} className="relative hidden md:block flex-1 max-w-xs">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowSearchDrop(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchResults.length > 0) {
                  handleSelectUser(searchResults[0]);
                }
              }}
              placeholder="Search users..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 border border-transparent rounded-xl focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
            {searchQuery && (
              <button type="button" onClick={clearSearch} className="absolute right-2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {renderSearchDropdown()}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 md:gap-4">
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {desktopNavItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  title={tab.label}
                  className={`nav-icon-btn relative flex items-center justify-center p-3 rounded-xl transition-all ${
                    isActive
                      ? "text-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  {tab.id === "messages" && messageUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {messageUnreadCount > 9 ? "9+" : messageUnreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden md:block h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent mx-2"></div>

          {/* Mobile-only: Search icon */}
          <button
            onClick={handleMobileSearchToggle}
            className="md:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            title="Search"
          >
            {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Mobile-only: Messages icon */}
          <button
            onClick={() => handleTabChange("messages")}
            className="relative md:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            title="Messages"
          >
            <MessageCircle className="w-5 h-5" />
            {messageUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {messageUnreadCount > 9 ? "9+" : messageUnreadCount}
              </span>
            )}
          </button>

          {/* Bell — always visible */}
          <div className="relative">
            <button
              onClick={handleNotificationsToggle}
              className="nav-icon-btn relative p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 md:w-7 md:h-7" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center">
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

          {/* Profile — desktop only */}
          <button
            onClick={() => handleTabChange("profile")}
            title="Profile"
            className={`hidden md:flex nav-icon-btn items-center justify-center p-3 rounded-xl transition-all ${
              activeTab === "profile"
                ? "text-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200"
            }`}
          >
            <User className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile search bar — collapsible */}
      {showMobileSearch && (
        <div className="md:hidden pt-2 mt-2 border-t border-gray-100" ref={mobileSearchRef}>
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchResults.length > 0 && setShowSearchDrop(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults.length > 0) {
                    handleSelectUser(searchResults[0]);
                  }
                }}
                autoFocus
                placeholder="Search users..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 border border-transparent rounded-xl focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
              {searchQuery && (
                <button type="button" onClick={clearSearch} className="absolute right-2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {renderSearchDropdown()}
          </div>
        </div>
      )}
    </header>
  );
}
