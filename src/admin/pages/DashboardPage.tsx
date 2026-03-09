import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Activity,
  Flag,
  EyeOff,
  Target,
  TrendingUp,
  AlertTriangle,
  Bell,
  Plus,
  Clock,
  Shield,
  FileText,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { GetAdminDashboard, GetAdminLogs } from "../../../api/adminApis";
import { showToast } from "../../Helper/ShowToast";
import { getApiError } from "../utils/apiError";
import { StatCardSkeleton, BarChartSkeleton, QuickActionsSkeleton, ActivitySkeleton } from "../components";

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatRelativeTime(s: string): string {
  const diff = Date.now() - new Date(s).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getLogIconBg(action: string): string {
  if (
    action.includes("suspend") ||
    action.includes("delete") ||
    action.includes("ban")
  )
    return "bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-md";
  if (
    action.includes("resolve") ||
    action.includes("unsuspend") ||
    action.includes("create")
  )
    return "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-md";
  if (action.includes("hide") || action.includes("decline"))
    return "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md";
  if (action.includes("broadcast") || action.includes("notify"))
    return "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md";
  if (action.includes("role") || action.includes("forum"))
    return "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md";
  return "bg-gradient-to-br from-gray-500 to-slate-500 text-white shadow-md";
}

function getLogIcon(action: string) {
  const cls = "w-4 h-4";
  if (action.includes("suspend") || action.includes("delete"))
    return <Shield className={cls} />;
  if (action.includes("resolve") || action.includes("unsuspend"))
    return <CheckCircle className={cls} />;
  if (action.includes("hide")) return <EyeOff className={cls} />;
  if (action.includes("forum") || action.includes("nook"))
    return <MessageSquare className={cls} />;
  if (action.includes("broadcast")) return <Bell className={cls} />;
  return <FileText className={cls} />;
}

function formatActionLabel(a: string) {
  return a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getAdminName(log: Record<string, unknown>): string {
  if (typeof log.admin === "object" && log.admin) return log.admin.username;
  return log.admin_username ?? String(log.admin ?? "Admin");
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  trend?: React.ReactNode;
}

function StatCard({ title, value, icon, iconBg, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 border border-gray-100/80 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {value}
          </p>
        </div>
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} shadow-lg transform hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>
      {trend && <div className="mt-2 sm:mt-3 md:mt-4">{trend}</div>}
    </div>
  );
}

function BarChart({
  values,
  labels,
  barColor,
  title,
}: {
  values: number[];
  labels: string[];
  barColor: string;
  title: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
      <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-3 sm:mb-4 md:mb-5 flex items-center gap-1 sm:gap-2">
        <span className="w-0.5 sm:w-1 h-3 sm:h-4 bg-purple-600 rounded-full"></span>
        {title}
      </h3>
      <div
        className="flex items-end justify-between gap-1"
        style={{ height: "100px" }}
      >
        {values.map((val, i) => {
          const pct = Math.max((val / max) * 100, val === 0 ? 0 : 5);
          return (
            <div
              key={i}
              className="flex flex-col items-center flex-1 gap-1 sm:gap-2"
            >
              <span className="text-[8px] sm:text-[10px] font-bold text-gray-700 bg-gray-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full">
                {val}
              </span>
              <div className="w-full relative flex-1 group">
                <div
                  className={`absolute bottom-0 w-full ${barColor} rounded-t-lg transition-all duration-500 group-hover:brightness-110 group-hover:shadow-lg`}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="text-[8px] sm:text-[10px] text-gray-500 font-semibold">
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const EMPTY = {
  users: {
    total: 0,
    active_today: 0,
    new_this_week: 0,
    suspended: 0,
    deactivated: 0,
    deleted: 0,
  },
  reports: {
    total: 0,
    submitted: 0,
    under_review: 0,
    resolved_this_week: 0,
    high_priority: 0,
  },
  content: {
    feed_posts_today: 0,
    forum_topics_today: 0,
    nook_messages_today: 0,
    hidden_content_total: 0,
  },
  forums: { total: 0, global: 0, company_based: 0 },
  mentorship: {
    active_sessions: 0,
    pending_requests: 0,
    completed_this_month: 0,
  },
  chart: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    user_signups_7d: [0, 0, 0, 0, 0, 0, 0],
    reports_7d: [0, 0, 0, 0, 0, 0, 0],
  },
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(EMPTY);
  const [recentLogs, setRecentLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([GetAdminDashboard(), GetAdminLogs({ limit: 5, page: 1 })])
      .then(([dash, logsEnv]) => {
        setData(dash ?? EMPTY);
        setRecentLogs(logsEnv?.data ?? []);
      })
      .catch((err: unknown) => {
        showToast(getApiError(err, "Failed to load dashboard"), "error");
      })
      .finally(() => setLoading(false));
  }, []);

  const { users, reports, content, mentorship, chart } = data;

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="h-6 sm:h-7 md:h-8 w-32 sm:w-40 md:w-48 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="mt-1 sm:mt-2 h-3 sm:h-4 w-40 sm:w-48 md:w-64 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="h-6 sm:h-7 md:h-8 w-24 sm:w-28 md:w-32 bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <BarChartSkeleton />
          <BarChartSkeleton />
        </div>

        {/* Quick Actions Skeleton */}
        <QuickActionsSkeleton />

        {/* Recent Activity Skeleton */}
        <ActivitySkeleton />
      </div>
    );
  }

  const stats: StatCardProps[] = [
    {
      title: "Total Users",
      value: formatNumber(users.total),
      icon: (
        <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
      ),
      iconBg: "bg-gradient-to-br from-blue-600 to-blue-400",
      trend: (
        <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold text-green-600 bg-green-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
          <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3" />+{users.new_this_week}{" "}
          this week
        </span>
      ),
    },
    {
      title: "Active Today",
      value: formatNumber(users.active_today),
      icon: (
        <Activity className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
      ),
      iconBg: "bg-gradient-to-br from-green-600 to-emerald-400",
    },
    {
      title: "Open Reports",
      value: formatNumber(reports.submitted + reports.under_review),
      icon: <Flag className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />,
      iconBg: "bg-gradient-to-br from-orange-600 to-amber-400",
      trend: (
        <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold text-red-600 bg-red-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
          <AlertTriangle className="w-2 h-2 sm:w-3 sm:h-3" />
          {reports.high_priority} high priority
        </span>
      ),
    },
    {
      title: "Content Hidden",
      value: formatNumber(content.hidden_content_total),
      icon: (
        <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
      ),
      iconBg: "bg-gradient-to-br from-red-600 to-rose-400",
    },
    {
      title: "Active Mentorship",
      value: formatNumber(mentorship.active_sessions),
      icon: (
        <Target className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
      ),
      iconBg: "bg-gradient-to-br from-purple-600 to-pink-400",
    },
    {
      title: "New This Week",
      value: formatNumber(users.new_this_week),
      icon: (
        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
      ),
      iconBg: "bg-gradient-to-br from-indigo-600 to-blue-400",
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-2">
            <span className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-purple-600 rounded-full"></span>
            <span className="truncate">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg self-start sm:self-auto">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
          <span className="text-[10px] sm:text-xs font-medium text-white">
            Live Dashboard
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <BarChart
          title="User Signups — Last 7 Days"
          values={chart.user_signups_7d}
          labels={chart.labels}
          barColor="bg-gradient-to-t from-blue-500 to-blue-400"
        />
        <BarChart
          title="Reports Submitted — Last 7 Days"
          values={chart.reports_7d}
          labels={chart.labels}
          barColor="bg-gradient-to-t from-orange-500 to-amber-400"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
        <h2 className="text-xs sm:text-sm font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-1 sm:gap-2">
          <span className="w-0.5 sm:w-1 h-3 sm:h-4 bg-purple-600 rounded-full"></span>
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/admin/reports")}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg shadow-purple-600/30 hover:shadow-xl hover:scale-105"
          >
            <Flag className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">View Pending Reports</span>
            <span className="xs:hidden">Reports</span>
            {reports.submitted > 0 && (
              <span className="bg-white text-purple-700 text-[10px] sm:text-xs font-bold px-1 sm:px-2 py-0.5 rounded-full">
                {reports.submitted}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/admin/forums")}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-lg hover:border-purple-200 hover:scale-105"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Create Forum</span>
            <span className="xs:hidden">Forum</span>
          </button>
          <button
            onClick={() => navigate("/admin/notifications")}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-lg hover:border-purple-200 hover:scale-105"
          >
            <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Broadcast</span>
            <span className="xs:hidden">Notify</span>
          </button>
          <button
            onClick={() => navigate("/admin/users")}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-lg hover:border-purple-200 hover:scale-105"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Manage Users</span>
            <span className="xs:hidden">Users</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-1 sm:gap-2">
            <span className="w-0.5 sm:w-1 h-3 sm:h-4 bg-purple-600 rounded-full"></span>
            Recent Activity
          </h2>
          <button
            onClick={() => navigate("/admin/logs")}
            className="text-[10px] sm:text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 group bg-purple-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full"
          >
            <span className="hidden xs:inline">View all logs</span>
            <span className="xs:hidden">All</span>
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </button>
        </div>
        {recentLogs.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
            <p className="text-xs sm:text-sm text-gray-400">
              No recent activity
            </p>
          </div>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {recentLogs.map((log) => (
              <li
                key={log.id}
                className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md border border-transparent hover:border-gray-100"
              >
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${getLogIconBg(log.action)} shadow-md`}
                >
                  {getLogIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                    {formatActionLabel(log.action)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">
                    {log.reason} · by {getAdminName(log)}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400 bg-gray-50 px-1.5 sm:px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
                  <Clock className="w-2 h-2 sm:w-3 sm:h-3" />
                  {formatRelativeTime(log.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
