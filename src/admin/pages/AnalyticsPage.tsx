import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  UserCheck,
  CalendarDays,
  CalendarRange,
  Calendar,
  ShieldCheck,
  Activity,
  UserPlus,
  BarChart3,
  MessageSquare,
  Heart,
  Eye,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ShieldOff,
  Flag,
  Clock,
  Zap,
  Hash,
  Send,
  Mail,
  Smartphone,
  Globe,
} from "lucide-react";
import {
  GetAdminAnalytics,
  GetAdminFunnel,
  GetAdminGrowth,
  GetAdminTopContent,
} from "../../../api/adminApis";
import { showToast } from "../../Helper/ShowToast";
import { MSG } from "../../constants/messages";
import { getApiError } from "../utils/apiError";
import {
  AnalyticsSkeleton,
  FunnelSkeleton,
  GrowthSkeleton,
  TopContentSkeleton,
} from "../components";
import { PERMISSIONS } from "../types/permissions";
import { usePermission } from "../hooks/usePermission";
import type {
  AnalyticsData,
  FunnelData,
  GrowthData,
  TopContentData,
} from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString();
}

// ── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  trend?: React.ReactNode;
}

function StatCard({ title, subtitle, value, icon, iconBg, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 border border-gray-100/80 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
            {title}
          </p>
          {subtitle && (
            <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 truncate">{subtitle}</p>
          )}
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

// ── TimeChart (clean bar chart for time-series data) ────────────────────────

function TimeChart({
  values,
  labels,
  color,
  title,
}: {
  values: number[];
  labels: string[];
  color: string;
  title: string;
}) {
  const max = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);
  const len = values.length;
  // Show ~6 evenly-spaced date labels so the axis stays readable
  const labelStep = Math.max(1, Math.ceil(len / 6));

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-1 sm:gap-2">
          <span className="w-0.5 sm:w-1 h-3 sm:h-4 bg-purple-600 rounded-full" />
          {title}
        </h3>
        <span className="text-[10px] sm:text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          Total: {formatNumber(total)}
        </span>
      </div>

      {/* Chart body with Y-axis */}
      <div className="flex gap-2">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between py-0" style={{ height: 140 }}>
          {[max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0].map((v, i) => (
            <span key={i} className="text-[9px] sm:text-[10px] text-gray-400 font-medium text-right w-6 sm:w-8 leading-none">
              {v}
            </span>
          ))}
        </div>

        {/* Bars */}
        <div className="flex-1">
          <div className="relative flex items-end gap-[2px] sm:gap-[3px]" style={{ height: 140 }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
              <div
                key={frac}
                className="absolute w-full border-t border-gray-100"
                style={{ bottom: `${frac * 100}%` }}
              />
            ))}

            {values.map((val, i) => {
              const pct = (val / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative z-10">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <span className="text-[9px] sm:text-[10px] font-bold text-white bg-gray-800 px-1.5 py-0.5 rounded whitespace-nowrap shadow">
                      {labels[i]}: {val}
                    </span>
                  </div>
                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-sm sm:rounded-t transition-all duration-300 group-hover:brightness-110 ${color}`}
                    style={{
                      height: val > 0 ? `${Math.max(pct, 4)}%` : '0%',
                      minHeight: val > 0 ? 4 : 0,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Date labels */}
          <div className="flex mt-2" style={{ gap: 0 }}>
            {values.map((_, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-[8px] sm:text-[10px] text-gray-400 font-medium">
                  {i % labelStep === 0 || i === len - 1 ? labels[i] : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab types ────────────────────────────────────────────────────────────────

type Tab = "overview" | "funnel" | "growth" | "top-content";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "funnel", label: "Funnel" },
  { key: "growth", label: "Growth" },
  { key: "top-content", label: "Top Content" },
];

// ── Funnel step config ───────────────────────────────────────────────────────

const FUNNEL_STEPS: { key: keyof Omit<FunnelData, "conversion_rates">; label: string }[] = [
  { key: "signup", label: "Signup" },
  { key: "otp_verified", label: "OTP Verified" },
  { key: "onboarding_completed", label: "Onboarding Completed" },
  { key: "first_post", label: "First Post" },
  { key: "first_message", label: "First Message" },
  { key: "first_mentorship", label: "First Mentorship" },
];

// ── Provider config ─────────────────────────────────────────────────────────

const providerIconCls = "w-4 h-4 text-white";

const PROVIDER_CONFIG: Record<string, { label: string; description: string; icon: React.ReactNode; bg: string; bar: string }> = {
  email: {
    label: "Email",
    description: "Email & password",
    icon: <Mail className={providerIconCls} />,
    bg: "bg-gradient-to-br from-blue-600 to-blue-400",
    bar: "bg-gradient-to-r from-blue-500 to-blue-400",
  },
  google: {
    label: "Google",
    description: "Google OAuth",
    icon: <Globe className={providerIconCls} />,
    bg: "bg-gradient-to-br from-red-500 to-orange-400",
    bar: "bg-gradient-to-r from-red-500 to-orange-400",
  },
  apple: {
    label: "Apple",
    description: "Apple Sign In",
    icon: <Smartphone className={providerIconCls} />,
    bg: "bg-gradient-to-br from-gray-800 to-gray-600",
    bar: "bg-gradient-to-r from-gray-800 to-gray-600",
  },
  _default: {
    label: "Other",
    description: "Other provider",
    icon: <Globe className={providerIconCls} />,
    bg: "bg-gradient-to-br from-purple-600 to-purple-400",
    bar: "bg-gradient-to-r from-purple-500 to-purple-400",
  },
};

// ── Main component ──────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const { hasPermission } = usePermission();

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Data state per tab
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);
  const [topContentData, setTopContentData] = useState<TopContentData | null>(null);

  // Loading state per tab
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingFunnel, setLoadingFunnel] = useState(false);
  const [loadingGrowth, setLoadingGrowth] = useState(false);
  const [loadingTopContent, setLoadingTopContent] = useState(false);

  // Track which tabs have been loaded
  const loaded = useRef<Set<Tab>>(new Set());

  // Growth period
  const [growthPeriod, setGrowthPeriod] = useState<30 | 60 | 90>(30);

  // ── Fetch overview on mount ────────────────────────────────────────────────

  useEffect(() => {
    if (!hasPermission(PERMISSIONS.ANALYTICS_VIEW)) return;
    loaded.current.add("overview");
    setLoadingOverview(true);
    GetAdminAnalytics()
      .then((data) => setAnalyticsData(data))
      .catch((err: unknown) => {
        showToast(getApiError(err, MSG.ADMIN.ANALYTICS_LOAD_FAILED), "error");
      })
      .finally(() => setLoadingOverview(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Lazy fetch when tab changes ────────────────────────────────────────────

  useEffect(() => {
    if (!hasPermission(PERMISSIONS.ANALYTICS_VIEW)) return;
    if (loaded.current.has(activeTab)) return;
    loaded.current.add(activeTab);

    if (activeTab === "funnel") {
      setLoadingFunnel(true);
      GetAdminFunnel()
        .then((data) => setFunnelData(data))
        .catch((err: unknown) => {
          showToast(getApiError(err, MSG.ADMIN.ANALYTICS_LOAD_FAILED), "error");
        })
        .finally(() => setLoadingFunnel(false));
    }

    if (activeTab === "growth") {
      setLoadingGrowth(true);
      GetAdminGrowth(growthPeriod)
        .then((data) => setGrowthData(data))
        .catch((err: unknown) => {
          showToast(getApiError(err, MSG.ADMIN.ANALYTICS_LOAD_FAILED), "error");
        })
        .finally(() => setLoadingGrowth(false));
    }

    if (activeTab === "top-content") {
      setLoadingTopContent(true);
      GetAdminTopContent()
        .then((data) => setTopContentData(data))
        .catch((err: unknown) => {
          showToast(getApiError(err, MSG.ADMIN.ANALYTICS_LOAD_FAILED), "error");
        })
        .finally(() => setLoadingTopContent(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Re-fetch growth when period changes ────────────────────────────────────

  useEffect(() => {
    if (!hasPermission(PERMISSIONS.ANALYTICS_VIEW)) return;
    if (activeTab !== "growth") return;
    setLoadingGrowth(true);
    GetAdminGrowth(growthPeriod)
      .then((data) => setGrowthData(data))
      .catch((err: unknown) => {
        showToast(getApiError(err, MSG.ADMIN.ANALYTICS_LOAD_FAILED), "error");
      })
      .finally(() => setLoadingGrowth(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [growthPeriod]);

  // ── Permission guard ───────────────────────────────────────────────────────

  if (!hasPermission(PERMISSIONS.ANALYTICS_VIEW)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            You don't have permission to view analytics
          </p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-2">
            <span className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-purple-600 rounded-full"></span>
            <span className="truncate">Platform insights and metrics</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg self-start sm:self-auto">
          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          <span className="text-[10px] sm:text-xs font-medium text-white">
            Analytics
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <>
          {loadingOverview ? (
            <AnalyticsSkeleton />
          ) : analyticsData ? (
            <OverviewTab data={analyticsData} />
          ) : null}
        </>
      )}

      {activeTab === "funnel" && (
        <>
          {loadingFunnel ? (
            <FunnelSkeleton />
          ) : funnelData ? (
            <FunnelTab data={funnelData} />
          ) : null}
        </>
      )}

      {activeTab === "growth" && (
        <>
          {loadingGrowth ? (
            <GrowthSkeleton />
          ) : growthData ? (
            <GrowthTab
              data={growthData}
              period={growthPeriod}
              onPeriodChange={(p) => setGrowthPeriod(p)}
            />
          ) : (
            /* Show period selector even while waiting for first load */
            <GrowthPeriodSelector
              period={growthPeriod}
              onPeriodChange={(p) => setGrowthPeriod(p)}
            />
          )}
        </>
      )}

      {activeTab === "top-content" && (
        <>
          {loadingTopContent ? (
            <TopContentSkeleton />
          ) : topContentData ? (
            <TopContentTab data={topContentData} />
          ) : null}
        </>
      )}
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: AnalyticsData }) {
  const { signups, engagement, retention, moderation, charts } = data;
  const iconCls = "w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white";

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Signups */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Signups</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <StatCard
            title="Total"
            value={formatNumber(signups.total)}
            icon={<Users className={iconCls} />}
            iconBg="bg-gradient-to-br from-blue-600 to-blue-400"
          />
          <StatCard
            title="Today"
            value={formatNumber(signups.today)}
            icon={<UserPlus className={iconCls} />}
            iconBg="bg-gradient-to-br from-green-600 to-emerald-400"
          />
          <StatCard
            title="This Week"
            value={formatNumber(signups.this_week)}
            icon={<CalendarDays className={iconCls} />}
            iconBg="bg-gradient-to-br from-indigo-600 to-indigo-400"
          />
          <StatCard
            title="This Month"
            value={formatNumber(signups.this_month)}
            icon={<CalendarRange className={iconCls} />}
            iconBg="bg-gradient-to-br from-purple-600 to-purple-400"
          />
          <StatCard
            title="Onboarding Rate"
            value={`${signups.onboarding_completion_rate}%`}
            icon={<Activity className={iconCls} />}
            iconBg="bg-gradient-to-br from-teal-600 to-teal-400"
          />
          <StatCard
            title="Verified Companies"
            value={formatNumber(signups.company_verified)}
            icon={<ShieldCheck className={iconCls} />}
            iconBg="bg-gradient-to-br from-cyan-600 to-cyan-400"
          />
        </div>

        {/* Signup by provider */}
        {signups.by_provider && Object.keys(signups.by_provider).length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Signup Methods</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {Object.entries(signups.by_provider).map(([provider, count]) => {
                const pct = signups.total > 0 ? ((count / signups.total) * 100).toFixed(1) : '0';
                const config = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG._default;
                return (
                  <div key={provider} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${config.bg}`}>
                        {config.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-800">{config.label}</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400">{config.description}</p>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        {formatNumber(count)}
                      </span>
                      <span className="text-[10px] sm:text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {pct}%
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${config.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Engagement */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Engagement</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <StatCard
            title="DAU"
            subtitle="Daily Active Users"
            value={formatNumber(engagement.dau)}
            icon={<Zap className={iconCls} />}
            iconBg="bg-gradient-to-br from-green-600 to-emerald-400"
          />
          <StatCard
            title="WAU"
            subtitle="Weekly Active Users"
            value={formatNumber(engagement.wau)}
            icon={<CalendarDays className={iconCls} />}
            iconBg="bg-gradient-to-br from-blue-600 to-blue-400"
          />
          <StatCard
            title="MAU"
            subtitle="Monthly Active Users"
            value={formatNumber(engagement.mau)}
            icon={<Calendar className={iconCls} />}
            iconBg="bg-gradient-to-br from-purple-600 to-purple-400"
          />
          <StatCard
            title="DAU/MAU Ratio"
            subtitle="Stickiness"
            value={`${engagement.dau_mau_ratio}%`}
            icon={<BarChart3 className={iconCls} />}
            iconBg="bg-gradient-to-br from-indigo-600 to-indigo-400"
          />
          <StatCard
            title="Posts This Week"
            value={formatNumber(engagement.posts_this_week)}
            icon={<Hash className={iconCls} />}
            iconBg="bg-gradient-to-br from-pink-600 to-pink-400"
          />
          <StatCard
            title="Topics This Week"
            value={formatNumber(engagement.topics_this_week)}
            icon={<MessageSquare className={iconCls} />}
            iconBg="bg-gradient-to-br from-orange-600 to-orange-400"
          />
          <StatCard
            title="Comments"
            value={formatNumber(engagement.comments_this_week)}
            icon={<MessageSquare className={iconCls} />}
            iconBg="bg-gradient-to-br from-amber-600 to-amber-400"
          />
          <StatCard
            title="Messages"
            value={formatNumber(engagement.messages_this_week)}
            icon={<Send className={iconCls} />}
            iconBg="bg-gradient-to-br from-teal-600 to-teal-400"
          />
        </div>
      </div>

      {/* Retention */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Retention</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <StatCard
            title="D7 Retention"
            subtitle="Users active after 7 days"
            value={`${retention.d7_retention}%`}
            icon={<TrendingUp className={iconCls} />}
            iconBg="bg-gradient-to-br from-green-600 to-emerald-400"
          />
          <StatCard
            title="D30 Retention"
            subtitle="Users active after 30 days"
            value={`${retention.d30_retention}%`}
            icon={<TrendingUp className={iconCls} />}
            iconBg="bg-gradient-to-br from-blue-600 to-blue-400"
          />
          <StatCard
            title="Churned Users"
            value={formatNumber(retention.churned_users)}
            icon={<TrendingDown className={iconCls} />}
            iconBg="bg-gradient-to-br from-red-600 to-rose-400"
          />
          <StatCard
            title="Total Active"
            value={formatNumber(retention.total_active)}
            icon={<UserCheck className={iconCls} />}
            iconBg="bg-gradient-to-br from-purple-600 to-purple-400"
          />
        </div>
      </div>

      {/* Moderation */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Moderation</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <StatCard
            title="Total Reports"
            value={formatNumber(moderation.reports_total)}
            icon={<Flag className={iconCls} />}
            iconBg="bg-gradient-to-br from-orange-600 to-amber-400"
          />
          <StatCard
            title="This Week"
            value={formatNumber(moderation.reports_this_week)}
            icon={<CalendarDays className={iconCls} />}
            iconBg="bg-gradient-to-br from-yellow-600 to-yellow-400"
          />
          <StatCard
            title="Pending"
            value={formatNumber(moderation.pending_reports)}
            icon={<Clock className={iconCls} />}
            iconBg="bg-gradient-to-br from-red-600 to-rose-400"
          />
          <StatCard
            title="Avg Resolve Time"
            value={`${moderation.avg_resolve_time_hours}h`}
            icon={<Clock className={iconCls} />}
            iconBg="bg-gradient-to-br from-indigo-600 to-indigo-400"
          />
        </div>
      </div>

      {/* Signups 30d chart */}
      {charts?.signups_30d && (
        <TimeChart
          title="Signups — Last 30 Days"
          values={charts.signups_30d.data}
          labels={charts.signups_30d.labels}
          color="bg-gradient-to-t from-blue-500 to-indigo-500"
        />
      )}
    </div>
  );
}

// ── Funnel Tab ───────────────────────────────────────────────────────────────

function FunnelTab({ data }: { data: FunnelData }) {
  const stepValues = FUNNEL_STEPS.map((s) => data[s.key] as number);
  const max = Math.max(...stepValues, 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
        <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <span className="w-0.5 sm:w-1 h-3 sm:h-4 bg-purple-600 rounded-full"></span>
          User Funnel
        </h3>

        <div className="space-y-1">
          {FUNNEL_STEPS.map((step, i) => {
            const value = stepValues[i];
            const widthPct = Math.max((value / max) * 100, value > 0 ? 4 : 0);
            const opacity = 1 - i * 0.12;
            const prevValue = i > 0 ? stepValues[i - 1] : null;
            const dropOff =
              prevValue && prevValue > 0
                ? (((prevValue - value) / prevValue) * 100).toFixed(1)
                : null;

            return (
              <React.Fragment key={step.key}>
                {/* Drop-off indicator */}
                {dropOff && (
                  <div className="flex items-center gap-2 pl-40 sm:pl-44 py-1">
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                      -{dropOff}% drop-off
                    </span>
                  </div>
                )}

                {/* Step row */}
                <div className="flex items-center gap-3">
                  <span className="w-36 sm:w-40 text-xs sm:text-sm font-medium text-gray-600 truncate flex-shrink-0">
                    {step.label}
                  </span>
                  <div className="flex-1 h-8 sm:h-9 bg-gray-50 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg transition-all duration-500"
                      style={{ width: `${widthPct}%`, opacity }}
                    />
                  </div>
                  <span className="w-14 sm:w-16 text-xs sm:text-sm font-bold text-gray-700 text-right flex-shrink-0">
                    {formatNumber(value)}
                  </span>
                  {prevValue && prevValue > 0 && (
                    <span className="w-14 sm:w-16 text-[10px] sm:text-xs font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full text-center flex-shrink-0">
                      {((value / prevValue) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Conversion rates summary */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Conversion Rates
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {Object.entries(data.conversion_rates).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full"
              >
                {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                : {value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Growth Period Selector ───────────────────────────────────────────────────

function GrowthPeriodSelector({
  period,
  onPeriodChange,
}: {
  period: 30 | 60 | 90;
  onPeriodChange: (p: 30 | 60 | 90) => void;
}) {
  return (
    <div className="flex gap-2">
      {([30, 60, 90] as const).map((p) => (
        <button
          key={p}
          onClick={() => onPeriodChange(p)}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
            period === p
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          {p}d
        </button>
      ))}
    </div>
  );
}

// ── Growth Tab ───────────────────────────────────────────────────────────────

function GrowthTab({
  data,
  period,
  onPeriodChange,
}: {
  data: GrowthData;
  period: 30 | 60 | 90;
  onPeriodChange: (p: 30 | 60 | 90) => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Period selector */}
      <GrowthPeriodSelector period={period} onPeriodChange={onPeriodChange} />

      {/* WoW growth badges */}
      {data.wow_growth && Object.keys(data.wow_growth).length > 0 && (
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {Object.entries(data.wow_growth).map(([key, value]) => {
            const numVal = parseFloat(value);
            const isPositive = numVal >= 0;
            return (
              <span
                key={key}
                className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${
                  isPositive
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                : {value}
              </span>
            );
          })}
        </div>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {data.charts.signups && (
          <TimeChart
            title="Signups"
            values={data.charts.signups.data}
            labels={data.charts.signups.labels}
            color="bg-gradient-to-t from-blue-500 to-indigo-500"
          />
        )}
        {data.charts.posts && (
          <TimeChart
            title="Posts"
            values={data.charts.posts.data}
            labels={data.charts.posts.labels}
            color="bg-gradient-to-t from-green-500 to-emerald-500"
          />
        )}
        {data.charts.topics && (
          <TimeChart
            title="Topics"
            values={data.charts.topics.data}
            labels={data.charts.topics.labels}
            color="bg-gradient-to-t from-purple-500 to-violet-500"
          />
        )}
        {data.charts.messages && (
          <TimeChart
            title="Messages"
            values={data.charts.messages.data}
            labels={data.charts.messages.labels}
            color="bg-gradient-to-t from-amber-500 to-orange-500"
          />
        )}
      </div>
    </div>
  );
}

// ── Top Content Tab ──────────────────────────────────────────────────────────

function TopContentTab({ data }: { data: TopContentData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {/* Top Posts */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
        <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-0.5 sm:w-1 h-3 sm:h-4 bg-purple-600 rounded-full"></span>
          Top Posts
        </h3>
        <div className="space-y-3">
          {data.top_posts.map((post, i) => (
            <div
              key={post.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                {i + 1}
              </div>
              <img
                src={post.author.avatar}
                alt={post.author.username}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate flex-1">
                {post.author.username}
              </span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                  <Heart className="w-3 h-3 text-red-400" />
                  {post.likes}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                  <MessageSquare className="w-3 h-3 text-blue-400" />
                  {post.comments}
                </span>
              </div>
            </div>
          ))}
          {data.top_posts.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No posts yet</p>
          )}
        </div>
      </div>

      {/* Top Topics */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
        <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-0.5 sm:w-1 h-3 sm:h-4 bg-purple-600 rounded-full"></span>
          Top Topics
        </h3>
        <div className="space-y-3">
          {data.top_topics.map((topic, i) => (
            <div
              key={topic.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                {i + 1}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate flex-1">
                {topic.title}
              </span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                  <MessageSquare className="w-3 h-3 text-blue-400" />
                  {topic.comments}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                  <Eye className="w-3 h-3 text-gray-400" />
                  {topic.views}
                </span>
              </div>
            </div>
          ))}
          {data.top_topics.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No topics yet</p>
          )}
        </div>
      </div>

      {/* Top Forums */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
        <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-0.5 sm:w-1 h-3 sm:h-4 bg-purple-600 rounded-full"></span>
          Top Forums
        </h3>
        <div className="space-y-3">
          {data.top_forums.map((forum, i) => (
            <div
              key={forum.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                {i + 1}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate flex-1">
                {forum.name}
              </span>
            </div>
          ))}
          {data.top_forums.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No forums yet</p>
          )}
        </div>
      </div>

      {/* Power Users */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
        <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-0.5 sm:w-1 h-3 sm:h-4 bg-purple-600 rounded-full"></span>
          Power Users
        </h3>
        <div className="space-y-3">
          {data.power_users.map((user, i) => (
            <div
              key={user.user_id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                {i + 1}
              </div>
              <img
                src={user.avatar}
                alt={user.username}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate flex-1">
                {user.username}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full flex-shrink-0">
                {user.count} posts
              </span>
            </div>
          ))}
          {data.power_users.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
