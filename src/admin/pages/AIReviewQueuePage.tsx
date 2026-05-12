import React, { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from "lucide-react";
import {
  GetAIReviewQueue,
  GetAIReviewStats,
  ClaimReviewItem,
  ResolveReviewItem,
} from "../../../api/adminApis";
import { showToast } from "../../Helper/ShowToast";
import { getApiError } from "../utils/apiError";
import { MSG } from "../../constants/messages";
import { usePermission } from "../hooks/usePermission";
import { PERMISSIONS } from "../types/permissions";
import { NavLink } from "react-router-dom";

interface AIVerdict {
  verdict: string;
  confidence: number;
  severity: string;
  categories: string[];
  rationale: string;
  userFacingReason: string | null;
}

interface AIPayloadSubject {
  type: string;
  id: string;
  authorId: string;
  authorIsAnonymous?: boolean;
  content: string;
  createdAt: string;
  mentions?: string[];
  attachments?: string[];
}

interface AIPayloadParent {
  type: string;
  id: string;
  authorId: string;
  title?: string | null;
  content: string;
  createdAt: string;
}

interface AuthorSignals {
  accountAgeDays: number;
  priorFlagsAgainstAuthor: number;
  priorRemovalsAgainstAuthor: number;
  postsLast24h: number;
}

interface AIPayload {
  subject: AIPayloadSubject;
  parentChain: AIPayloadParent[];
  container: unknown;
  authorSignals: AuthorSignals;
  policyVersion: string;
}

interface ReviewItem {
  id: string;
  content_type: string;
  content_id: string;
  priority: string;
  reason: string;
  ai_verdict: AIVerdict;
  ai_payload: AIPayload;
  current_state: string;
  status: string;
  claimed_by: string | null;
  claimed_by_username: string | null;
  resolved_by: string | null;
  resolved_by_username: string | null;
  resolution: string | null;
  resolution_reason: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface QueueStats {
  queue: {
    pending: number;
    claimed: number;
    resolved: number;
    byPriority: Record<string, number>;
  };
  aiPerformance: {
    totalDecisions: number;
    verdictDistribution: Record<string, number>;
    reversalRate: string;
    totalDisagreements: number;
  };
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  normal: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-gray-50 text-gray-600 border-gray-200",
};

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  urgent: <ShieldAlert className="w-3.5 h-3.5" />,
  high: <AlertTriangle className="w-3.5 h-3.5" />,
  normal: <Shield className="w-3.5 h-3.5" />,
  low: <Clock className="w-3.5 h-3.5" />,
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  claimed: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
};

const VERDICT_STYLES: Record<string, string> = {
  hide: "bg-red-50 text-red-700 border-red-200",
  remove: "bg-red-100 text-red-800 border-red-300",
  allow: "bg-green-50 text-green-700 border-green-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "text-red-700 bg-red-50",
  high: "text-orange-700 bg-orange-50",
  medium: "text-amber-700 bg-amber-50",
  low: "text-blue-700 bg-blue-50",
  none: "text-gray-500 bg-gray-50",
};

const CONTENT_TYPES = [
  "all",
  "feed_post",
  "feed_comment",
  "forum_topic",
  "forum_comment",
  "nook",
  "nook_message",
  "referral_post",
  "referral_comment",
];

const STATUSES = ["all", "pending", "claimed", "resolved"];
const PRIORITIES = ["all", "urgent", "high", "normal", "low"];

export function AIReviewQueuePage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<{ id: string; open: boolean } | null>(null);
  const [resolution, setResolution] = useState<"confirm" | "reverse" | "modify">("confirm");
  const [resolveReason, setResolveReason] = useState("");
  const limit = 20;

  const { hasPermission } = usePermission();
  const canClaim = hasPermission(PERMISSIONS.AI_REVIEW_CLAIM);
  const canResolve = hasPermission(PERMISSIONS.AI_REVIEW_RESOLVE);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (typeFilter !== "all") params.contentType = typeFilter;
      const res = await GetAIReviewQueue(params);
      setItems(res.data || []);
      setTotalPages(Math.ceil((res.pagination?.total || 0) / limit));
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      showToast("error", getApiError(err, MSG.ADMIN.AI_REVIEW_LOAD_FAILED));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, typeFilter]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await GetAIReviewStats();
      setStats(res);
    } catch (err) {
      showToast("error", getApiError(err, MSG.ADMIN.AI_REVIEW_STATS_FAILED));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleClaim = async (id: string) => {
    setActionLoading(id);
    try {
      await ClaimReviewItem(id);
      showToast("success", MSG.ADMIN.AI_REVIEW_CLAIMED);
      fetchItems();
      fetchStats();
    } catch (err) {
      showToast("error", getApiError(err, MSG.ADMIN.AI_REVIEW_CLAIM_FAILED));
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    setActionLoading(resolveModal.id);
    try {
      const payload: { resolution: "confirm" | "reverse" | "modify"; reason?: string } = {
        resolution,
      };
      if (resolveReason.trim()) payload.reason = resolveReason.trim();
      await ResolveReviewItem(resolveModal.id, payload);
      showToast("success", MSG.ADMIN.AI_REVIEW_RESOLVED);
      setResolveModal(null);
      setResolution("confirm");
      setResolveReason("");
      fetchItems();
      fetchStats();
    } catch (err) {
      showToast("error", getApiError(err, MSG.ADMIN.AI_REVIEW_RESOLVE_FAILED));
    } finally {
      setActionLoading(null);
    }
  };

  const formatType = (t: string) => t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-violet-500" />
            AI Review Queue
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review AI moderation decisions that need human oversight
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <AIModerationTabs />

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-7 bg-gray-200 rounded w-10" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard label="Pending" value={stats.queue.pending} color="amber" />
          <StatCard label="Claimed" value={stats.queue.claimed} color="blue" />
          <StatCard label="Resolved" value={stats.queue.resolved} color="green" />
          <StatCard label="Urgent" value={stats.queue.byPriority?.urgent || 0} color="red" />
          <StatCard label="Reversal Rate" value={stats.aiPerformance.reversalRate} color="violet" />
          <StatCard label="Total Decisions" value={stats.aiPerformance.totalDecisions.toLocaleString()} color="gray" />
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filters:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          title="Filter by status"
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : formatType(s)}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          title="Filter by priority"
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p === "all" ? "All Priorities" : formatType(p)}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          title="Filter by content type"
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All Types" : formatType(t)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CheckCircle className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">Queue is clear</p>
            <p className="text-xs mt-1">No items need review</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-8"><span className="sr-only">Expand</span></th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">AI Verdict</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Confidence</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Categories</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">State</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <td className="px-4 py-3">
                        {expandedId === item.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.normal}`}>
                          {PRIORITY_ICONS[item.priority]}
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                          {formatType(item.content_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${VERDICT_STYLES[item.ai_verdict?.verdict] || ""}`}>
                          {item.ai_verdict?.verdict || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ConfidenceBar value={item.ai_verdict?.confidence || 0} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(item.ai_verdict?.categories || []).slice(0, 3).map((cat) => (
                            <span key={cat} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                              {cat}
                            </span>
                          ))}
                          {(item.ai_verdict?.categories || []).length > 3 && (
                            <span className="text-[10px] text-gray-400">+{item.ai_verdict.categories.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 capitalize">{item.current_state}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[item.status] || STATUS_STYLES.pending}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {actionLoading === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <>
                              {item.status === "pending" && canClaim && (
                                <button
                                  onClick={() => handleClaim(item.id)}
                                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  Claim
                                </button>
                              )}
                              {item.status === "claimed" && canResolve && (
                                <button
                                  onClick={() => setResolveModal({ id: item.id, open: true })}
                                  className="px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                >
                                  Resolve
                                </button>
                              )}
                              {item.status === "resolved" && item.resolution && (
                                <span className="text-xs text-gray-400 capitalize">{item.resolution}</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Detail Row */}
                    {expandedId === item.id && (
                      <tr>
                        <td colSpan={10} className="px-4 py-4 bg-gray-50/50 border-b border-gray-200">
                          <ExpandedDetail item={item} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} ({total} items)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Previous page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Next page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {resolveModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setResolveModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Resolve Review Item
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Resolution</label>
                <div className="space-y-2">
                  {([
                    { value: "confirm" as const, label: "Confirm", desc: "AI decision stands. Close item." },
                    { value: "reverse" as const, label: "Reverse", desc: "Undo AI action. Restore if hidden, hide if visible." },
                    { value: "modify" as const, label: "Modify", desc: "Close with custom action/reason." },
                  ]).map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        resolution === opt.value
                          ? "border-violet-300 bg-violet-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="resolution"
                        value={opt.value}
                        checked={resolution === opt.value}
                        onChange={() => setResolution(opt.value)}
                        className="mt-0.5 accent-violet-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={resolveReason}
                  onChange={(e) => setResolveReason(e.target.value)}
                  placeholder="Why are you choosing this resolution?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={actionLoading === resolveModal.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === resolveModal.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AIModerationTabs() {
  const tabs = [
    { to: "/admin/ai-moderation", label: "Review Queue", end: true },
    { to: "/admin/ai-moderation/audit", label: "Audit Trail", end: false },
    { to: "/admin/ai-moderation/disagreements", label: "Disagreements", end: false },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 -mt-2">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? "border-violet-500 text-violet-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
    green: "text-green-700 bg-green-50 border-green-200",
    red: "text-red-700 bg-red-50 border-red-200",
    violet: "text-violet-700 bg-violet-50 border-violet-200",
    gray: "text-gray-700 bg-gray-50 border-gray-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.gray}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 font-medium">{pct}%</span>
    </div>
  );
}

function ExpandedDetail({ item }: { item: ReviewItem }) {
  const { ai_verdict: v, ai_payload: p } = item;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* AI Verdict */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Verdict</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 w-20">Severity:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_STYLES[v?.severity] || SEVERITY_STYLES.none}`}>
              {v?.severity || "—"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Rationale:</span>
            <p className="text-gray-800 mt-1 text-xs leading-relaxed bg-white rounded-lg p-3 border border-gray-100">
              {v?.rationale || "—"}
            </p>
          </div>
          {v?.userFacingReason && (
            <div>
              <span className="text-gray-500">User-facing reason:</span>
              <p className="text-gray-700 text-xs mt-1 italic">{v.userFacingReason}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {(v?.categories || []).map((cat) => (
              <span key={cat} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Resolution info */}
        {item.status === "resolved" && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs font-medium text-green-700">
              Resolved: <span className="capitalize">{item.resolution}</span>
              {item.resolved_by_username && <span> by {item.resolved_by_username}</span>}
            </p>
            {item.resolution_reason && (
              <p className="text-xs text-green-600 mt-1">{item.resolution_reason}</p>
            )}
          </div>
        )}

        {item.claimed_by_username && item.status !== "resolved" && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600">
            <UserCheck className="w-3.5 h-3.5" />
            Claimed by {item.claimed_by_username}
          </div>
        )}
      </div>

      {/* Content & Author Signals */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Flagged Content</h4>
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
            {p?.subject?.content || "—"}
          </p>
          <p className="text-[10px] text-gray-400 mt-2">
            {p?.subject?.type} &middot; {p?.subject?.createdAt ? formatDateShort(p.subject.createdAt) : ""}
            {p?.subject?.authorIsAnonymous && " (anonymous)"}
          </p>
        </div>

        {/* Parent Chain */}
        {p?.parentChain && p.parentChain.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Parent Context</h4>
            {p.parentChain.map((parent, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-100 p-3 mb-1.5">
                {parent.title && <p className="text-xs font-medium text-gray-700 mb-1">{parent.title}</p>}
                <p className="text-xs text-gray-600 line-clamp-3">{parent.content}</p>
                <p className="text-[10px] text-gray-400 mt-1">{parent.type}</p>
              </div>
            ))}
          </div>
        )}

        {/* Author Signals */}
        {p?.authorSignals && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Author Signals</h4>
            <div className="grid grid-cols-2 gap-2">
              <SignalCard label="Account Age" value={`${p.authorSignals.accountAgeDays}d`} />
              <SignalCard label="Prior Flags" value={p.authorSignals.priorFlagsAgainstAuthor} />
              <SignalCard label="Prior Removals" value={p.authorSignals.priorRemovalsAgainstAuthor} />
              <SignalCard label="Posts (24h)" value={p.authorSignals.postsLast24h} />
            </div>
          </div>
        )}

        {p?.policyVersion && (
          <p className="text-[10px] text-gray-400">Policy: {p.policyVersion}</p>
        )}
      </div>
    </div>
  );
}

function SignalCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
