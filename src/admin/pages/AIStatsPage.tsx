import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Loader2,
  Bot,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { GetAIModerationStats } from "../../../api/adminApis";
import { NavLink } from "react-router-dom";
import { showToast } from "../../Helper/ShowToast";
import { getApiError } from "../utils/apiError";
import { MSG } from "../../constants/messages";

interface StatsData {
  totalDecisions: number;
  verdictDistribution: Record<string, number>;
  averageConfidence: number;
  hiddenByCategory: Record<string, number>;
  reversals: { total: number; reversalRate: string };
  reviewQueue: { pending: number; resolvedToday: number };
  contentTypeBreakdown: Record<string, number>;
}

const VERDICT_COLORS: Record<string, string> = {
  allowed: "#22c55e",
  hidden: "#ef4444",
  pending_review: "#f59e0b",
  removed: "#991b1b",
};

const CATEGORY_COLORS: Record<string, string> = {
  harassment: "#ef4444",
  spam: "#6b7280",
  hate_speech: "#b91c1c",
  threat: "#dc2626",
  doxing: "#f97316",
  self_harm: "#a855f7",
  crisis_signal: "#7c3aed",
  misinformation: "#ea580c",
  legal_risk: "#d97706",
  names_individual: "#ca8a04",
};

export function AIStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await GetAIModerationStats();
        setStats(res);
      } catch (err) {
        showToast("error", getApiError(err, MSG.ADMIN.AI_STATS_LOAD_FAILED));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatType = (t: string) => t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-violet-500" />
          AI Stats
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overall AI moderation performance
        </p>
      </div>

      <AIModerationTabs />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      ) : !stats ? (
        <p className="text-sm text-gray-400 text-center py-10">No data available</p>
      ) : (
        <>
          {/* Top Row Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Total Decisions"
              value={stats.totalDecisions.toLocaleString()}
              icon={<Bot className="w-4 h-4" />}
              color="violet"
            />
            <StatCard
              label="Avg Confidence"
              value={`${Math.round(stats.averageConfidence * 100)}%`}
              icon={<ShieldCheck className="w-4 h-4" />}
              color={stats.averageConfidence >= 0.9 ? "green" : stats.averageConfidence >= 0.75 ? "amber" : "red"}
            />
            <StatCard
              label="Reversal Rate"
              value={stats.reversals.reversalRate}
              sub={`${stats.reversals.total} reversed`}
              icon={<AlertTriangle className="w-4 h-4" />}
              color="orange"
            />
            <StatCard
              label="Queue Pending"
              value={stats.reviewQueue.pending}
              sub={`${stats.reviewQueue.resolvedToday} resolved today`}
              icon={<TrendingUp className="w-4 h-4" />}
              color="blue"
            />
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Verdict Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Verdict Distribution</h3>
              <div className="space-y-3">
                {Object.entries(stats.verdictDistribution).map(([key, count]) => {
                  const pct = stats.totalDecisions > 0 ? (count / stats.totalDecisions) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600 capitalize">{formatType(key)}</span>
                        <span className="text-xs text-gray-500">{count.toLocaleString()} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: VERDICT_COLORS[key] || "#6b7280" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hidden by Category */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Hidden by Category</h3>
              {Object.keys(stats.hiddenByCategory).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No hidden content</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.hiddenByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => {
                      const maxCount = Math.max(...Object.values(stats.hiddenByCategory));
                      const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600">{cat.replace(/_/g, " ")}</span>
                            <span className="text-xs text-gray-500">{count}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat] || "#6b7280" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Content Type Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Decisions by Content Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.contentTypeBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <span className="text-xs text-gray-600">{formatType(type)}</span>
                    <span className="text-sm font-semibold text-gray-800">{count.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon?: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    violet: "text-violet-700 bg-violet-50 border-violet-200",
    green: "text-green-700 bg-green-50 border-green-200",
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    red: "text-red-700 bg-red-50 border-red-200",
    orange: "text-orange-700 bg-orange-50 border-orange-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.violet}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-medium opacity-70">{label}</p>
      </div>
      <p className="text-xl font-bold mt-1">{value}</p>
      {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

function AIModerationTabs() {
  const tabs = [
    { to: "/admin/ai-moderation", label: "Stats", end: true },
    { to: "/admin/ai-moderation/review", label: "Review Queue", end: false },
    { to: "/admin/ai-moderation/audit", label: "Audit Trail", end: false },
    { to: "/admin/ai-moderation/disagreements", label: "Disagreements", end: false },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 -mt-2">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end}
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${isActive ? "border-violet-500 text-violet-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`
          }>
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
