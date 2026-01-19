// src/components/dashboard/DashboardHeader.tsx

import {
  Home,
  Users,
  MessageCircle,
  Zap,
  Target,
  Briefcase,
  Bell,
  User,
} from "lucide-react";
import { NotificationsDropdown } from "./NotificationsDropdown";

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

const navItems = [
  { id: "feeds", label: "Home", icon: Home },
  { id: "forums", label: "Forums", icon: Users },
  { id: "nooks", label: "Nooks", icon: Zap },
  { id: "mentorship", label: "Mentorship", icon: Target },
  { id: "messages", label: "Messages", icon: MessageCircle },
] as const;

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
  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    // Close mobile menu on tab selection
    if (showMobileMenu) {
      setShowMobileMenu(false);
    }
  };

  const desktopNavItems = [
    { id: "feeds", label: "Home", icon: Home },
    { id: "forums", label: "Forums", icon: Users },
    { id: "nooks", label: "Nooks", icon: Zap },
    { id: "mentorship", label: "Mentorship", icon: Target },
    { id: "messages", label: "Messages", icon: MessageCircle },
  ];

  const mobileNavItems = [
    ...desktopNavItems,
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <header
      className="bg-white/95 backdrop-blur-xl border-b border-gray-200/50 px-4 py-4 md:px-6 md:py-6 shadow-sm sticky top-0 z-40"
      style={{ position: "sticky" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <span className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Affinity Echo
          </span>
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
                className="nav-icon-btn relative p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
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
                onUnreadCountChange={onUnreadCountChange} // Fixed: use the prop instead of undefined function
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
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
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
