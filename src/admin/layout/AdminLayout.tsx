// src/layouts/AdminLayout.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Flag,
  EyeOff,
  MessageSquare,
  Hash,
  Bell,
  FileText,
  ChevronRight,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Settings,
  User,
  ShieldCheck,
  BarChart3,
  HeartPulse,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { PERMISSIONS } from "../types/permissions";
import { usePermission } from "../hooks/usePermission";
import { GetUnreadCount } from "../../../api/notificationApis";
import { NotificationsDropdown } from "../../components/NavComponent/NotificationsDropdown";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
  superAdminOnly?: boolean;
  section: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4.5 h-4.5" />,
    permission: PERMISSIONS.DASHBOARD_VIEW,
    section: "Overview",
  },
  {
    to: "/admin/analytics",
    label: "Analytics",
    icon: <BarChart3 className="w-4.5 h-4.5" />,
    permission: PERMISSIONS.ANALYTICS_VIEW,
    section: "Insights",
  },
  {
    to: "/admin/health",
    label: "System Health",
    icon: <HeartPulse className="w-4.5 h-4.5" />,
    permission: PERMISSIONS.HEALTH_VIEW,
    section: "Insights",
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: <Users className="w-4.5 h-4.5" />,
    permission: PERMISSIONS.USERS_VIEW,
    section: "Management",
  },
  {
    to: "/admin/reports",
    label: "Reports",
    icon: <Flag className="w-4.5 h-4.5" />,
    permission: PERMISSIONS.REPORTS_VIEW,
    section: "Management",
  },
  {
    to: "/admin/moderation",
    label: "Moderation",
    icon: <EyeOff className="w-4.5 h-4.5" />,
    permission: PERMISSIONS.CONTENT_VIEW,
    section: "Management",
  },
  {
    to: "/admin/forums",
    label: "Forums",
    icon: <MessageSquare className="w-4.5 h-4.5" />,
    permission: PERMISSIONS.FORUMS_VIEW,
    section: "Management",
  },
  {
    to: "/admin/nooks",
    label: "Nooks",
    icon: <Hash className="w-4.5 h-4.5" />,
    permission: PERMISSIONS.NOOKS_VIEW,
    section: "Management",
  },
  {
    to: "/admin/notifications",
    label: "Notifications",
    icon: <Bell className="w-4.5 h-4.5" />,
    permission: PERMISSIONS.NOTIFICATIONS_VIEW,
    section: "Communication",
  },
  {
    to: "/admin/logs",
    label: "Audit Logs",
    icon: <FileText className="w-4.5 h-4.5" />,
    permission: PERMISSIONS.LOGS_VIEW,
    section: "System",
  },
  {
    to: "/admin/permissions",
    label: "Permissions",
    icon: <ShieldCheck className="w-4.5 h-4.5" />,
    superAdminOnly: true,
    section: "System",
  },
];

const ADMIN_ROLES = ["admin", "super_admin"];

function getBreadcrumb(pathname: string): string {
  const segments = pathname.replace("/admin", "").split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";

  const lastSegment = segments[segments.length - 1];
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      lastSegment,
    );

  if (isUUID && segments[0] === "users") {
    const storedId = sessionStorage.getItem("currentViewedUserId");
    const storedName = sessionStorage.getItem("currentViewedUserName");
    if (storedId === lastSegment && storedName) {
      return `Users › ${storedName}`;
    }
    return `Users › User Details`;
  }

  return segments
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace("-", " "))
    .join(" › ");
}

export function ProtectedAdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/login", { state: { from: location }, replace: true });
      } else if (!ADMIN_ROLES.includes(user?.role || "")) {
        navigate(
          user?.has_completed_onboarding ? "/dashboard" : "/onboarding",
          { replace: true },
        );
      }
    }
  }, [isLoading, isAuthenticated, user, navigate, location]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            Loading admin panel…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !ADMIN_ROLES.includes(user?.role || "")) {
    return null;
  }

  return <>{children}</>;
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermission();

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (item.permission)
      return hasPermission(
        item.permission as Parameters<typeof hasPermission>[0],
      );
    return true;
  });

  // Group visible items by section, preserving order
  const navSections = visibleNavItems.reduce<
    { label: string; items: NavItem[] }[]
  >((acc, item) => {
    const existing = acc.find((s) => s.label === item.section);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ label: item.section, items: [item] });
    }
    return acc;
  }, []);

  const breadcrumb = getBreadcrumb(location.pathname);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await GetUnreadCount();
      setUnreadCount(data?.count ?? 0);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const getUserInitials = () =>
    user?.username?.substring(0, 2).toUpperCase() || "AD";

  const getUserDisplayName = () => user?.username || "Admin";

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const toggleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  const getRoleBadgeStyle = () => {
    if (isSuperAdmin)
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    return "bg-purple-500/15 text-purple-400 border border-purple-500/30";
  };

  const getRoleLabel = () =>
    user?.role === "super_admin" ? "Super Admin" : "Admin";

  const NavSection = ({
    section,
    mobile,
  }: {
    section: { label: string; items: NavItem[] };
    mobile?: boolean;
  }) => (
    <div className="mb-1">
      <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 select-none">
        {section.label}
      </p>
      {section.items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/admin"}
          onClick={() => mobile && setSidebarOpen(false)}
          className={({ isActive }) =>
            `group relative flex items-center gap-3 pl-3 pr-3 py-2 mx-1 rounded-lg text-[13px] font-medium transition-all duration-150 border-l-2 ${
              isActive
                ? "bg-purple-500/10 text-white border-purple-500"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex-shrink-0 transition-colors duration-150 ${
                  isActive
                    ? "text-purple-400"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`relative flex flex-col h-full bg-slate-950 border-r border-white/[0.06] ${
        mobile ? "w-72" : "w-60"
      } flex-shrink-0`}
    >
      {/* Subtle purple ambient glow at top */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-purple-600/8 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="relative flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-md" />
            <div className="relative w-8 h-8 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
              <img
                src="/affinity-echo-logo-hd.png"
                alt="AffinityEcho"
                className="w-6 h-6 object-contain"
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight leading-none">
              AffinityEcho
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium tracking-wide uppercase">
              Admin Portal
            </p>
          </div>
        </div>
        {mobile && (
          <button
            type="button"
            title="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mobile: user profile card */}
      {mobile && user && (
        <div className="relative mx-3 mt-3 mb-1 rounded-xl bg-white/[0.04] border border-white/[0.07] p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-purple-500/25 flex-shrink-0">
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.username}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getRoleBadgeStyle()}`}
            >
              {getRoleLabel()}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto px-2 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {navSections.map((section) => (
          <NavSection key={section.label} section={section} mobile={mobile} />
        ))}
      </nav>

      {/* Back to app */}
      <div className="relative px-3 py-3 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="group flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5" />
          Back to App
        </button>
      </div>
    </aside>
  );

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 animate-slide-right">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 sm:px-6 bg-white border-b border-gray-200/80 flex-shrink-0 h-14 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              type="button"
              title="Open sidebar"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 md:hidden transition-all duration-150"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-gray-400 font-medium hidden sm:block">
                Admin
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:block flex-shrink-0" />
              <span className="font-semibold text-gray-800">{breadcrumb}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Role badge — desktop only */}
            <span
              className={`hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${getRoleBadgeStyle()}`}
            >
              {getRoleLabel()}
            </span>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                title="Notifications"
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-red-500/30">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationsDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                unreadCount={unreadCount}
                onUnreadCountChange={fetchUnreadCount}
                viewAllRoute="/admin/my-notifications"
              />
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={toggleUserMenu}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-gray-100 transition-all duration-150 group"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-purple-500/30 flex-shrink-0">
                  {getUserInitials()}
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                  {getUserDisplayName()}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
                />
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl shadow-black/10 border border-gray-100 py-1.5 z-[200] animate-fade-down">
                  <div className="px-3.5 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {user.email}
                    </p>
                    <span
                      className={`inline-flex mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${getRoleBadgeStyle()}`}
                    >
                      {getRoleLabel()}
                    </span>
                  </div>

                  <div className="py-1 px-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/admin/profile");
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      <User className="w-4 h-4 flex-shrink-0" />
                      Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/admin/settings");
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      <Settings className="w-4 h-4 flex-shrink-0" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-gray-100 mt-1 pt-1 px-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
