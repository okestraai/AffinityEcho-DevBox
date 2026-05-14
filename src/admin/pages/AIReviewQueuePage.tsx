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
  Eye,
  EyeOff,
} from "lucide-react";
import {
  GetAIReviewQueue,
  GetAIReviewStats,
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
  authorSignals: AuthorSignals;
  policyVersion: string;
}

interface ReviewItem {
  id: string;
  content_type: string;
  content_id: string;
  content_preview: string;
  content_title: string | null;
  author: { id: string; username: string };
  priority: string;
  reason: string;
  current_state: string;
  ai_verdict: AIVerdict;
  ai_payload?: AIPayload;
  available_actions: string[];
  status: string;
  resolved_by: string | null;
  resolved_by_username: string | null;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface QueueStats {
  queue: {
    pending: number;
    resolved: number;
    byPriority: Record<string, number>;
    byState: Record<string, number>;
  };
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  normal: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-gray-50 text-gray-600 border-gray-200",
};

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  urgent: <ShieldAlert className="w-3.5 h-3.5" />,
  high: <AlertTriangle className="w-3.5 h-3.5" />,
  normal: <Shield className="w-3.5 h-3.5" />,
  low: <Clock className="w-3.5 h-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  harassment: "bg-red-100 text-red-700",
  spam: "bg-gray-100 text-gray-600",
  hate_speech: "bg-red-200 text-red-800",
  threat: "bg-red-100 text-red-700",
  doxing: "bg-orange-100 text-orange-700",
  self_harm: "bg-purple-100 text-purple-700",
  crisis_signal: "bg-purple-100 text-purple-700",
  misinformation: "bg-orange-100 text-orange-700",
  legal_risk: "bg-amber-100 text-amber-700",
  names_individual: "bg-amber-100 text-amber-700",
};

const CONTENT_TYPES = [
  "all", "feed_post", "feed_comment", "forum_topic", "forum_comment",
  "nook", "nook_message", "referral_post", "referral_comment",
];

const STATUSES = ["pending", "resolved"];
const PRIORITIES = ["all", "urgent", "high", "normal", "low"];
const STATES = ["all", "hidden", "visible"];

export function AIReviewQueuePage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<{ item: ReviewItem; action: string } | null>(null);
  const [resolveReason, setResolveReason] = useState("");
  const limit = 20;

  const { hasPermission } = usePermission();
  const canResolve = hasPermission(PERMISSIONS.AI_REVIEW_RESOLVE);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit, status: statusFilter };
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (typeFilter !== "all") params.contentType = typeFilter;
      if (stateFilter !== "all") params.currentState = stateFilter;
      const res = await GetAIReviewQueue(params);
      setItems(res.data || []);
      setTotalPages(Math.ceil((res.pagination?.total || 0) / limit));
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      showToast("error", getApiError(err, MSG.ADMIN.AI_REVIEW_LOAD_FAILED));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, typeFilter, stateFilter]);

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

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  /** Refresh list without showing the full loading spinner */
  const refreshItems = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { page, limit, status: statusFilter };
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (typeFilter !== "all") params.contentType = typeFilter;
      if (stateFilter !== "all") params.currentState = stateFilter;
      const res = await GetAIReviewQueue(params);
      setItems(res.data || []);
      setTotalPages(Math.ceil((res.pagination?.total || 0) / limit));
      setTotal(res.pagination?.total || 0);
    } catch { /* silent — user already saw success toast */ }
  }, [page, statusFilter, priorityFilter, typeFilter, stateFilter]);

  const handleResolve = async () => {
    if (!resolveModal) return;
    const itemId = resolveModal.item.id;
    setActionLoading(itemId);
    try {
      const payload: { action: "reverse" | "confirm" | "hide"; reason?: string } = {
        action: resolveModal.action as "reverse" | "confirm" | "hide",
      };
      if (resolveReason.trim()) payload.reason = resolveReason.trim();
      await ResolveReviewItem(itemId, payload);
      // Close modal + clear form immediately
      setResolveModal(null);
      setResolveReason("");
      setActionLoading(null);
      // Optimistically remove item from list
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setTotal((prev) => Math.max(0, prev - 1));
      showToast("success", MSG.ADMIN.AI_REVIEW_RESOLVED);
      // Background refresh to sync with server
      refreshItems();
      fetchStats();
    } catch (err) {
      showToast("error", getApiError(err, MSG.ADMIN.AI_REVIEW_RESOLVE_FAILED));
      setActionLoading(null);
    }
  };

  const formatType = (t: string) => t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const confidenceColor = (c: number) => {
    const pct = c * 100;
    if (pct >= 90) return "text-green-700";
    if (pct >= 75) return "text-amber-700";
    return "text-red-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-violet-500" />
          AI Review Queue
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review AI moderation decisions that need human oversight
        </p>
      </div>

      <AIModerationTabs />

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-7 bg-gray-200 rounded w-10" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Pending"
            value={stats.queue.pending}
            sub={`${stats.queue.byPriority?.urgent || 0} urgent, ${stats.queue.byPriority?.high || 0} high`}
            color="amber"
          />
          <StatCard label="Resolved" value={stats.queue.resolved} color="green" />
          <StatCard
            label="Hidden by AI"
            value={stats.queue.byState?.hidden || 0}
            color="red"
            icon={<EyeOff className="w-4 h-4" />}
          />
          <StatCard
            label="Escalated"
            value={stats.queue.byState?.visible || 0}
            color="blue"
            icon={<Eye className="w-4 h-4" />}
          />
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filters:</span>
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          title="Filter by status" className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
          {STATUSES.map((s) => <option key={s} value={s}>{formatType(s)}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          title="Filter by priority" className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
          {PRIORITIES.map((p) => <option key={p} value={p}>{p === "all" ? "All Priorities" : formatType(p)}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          title="Filter by content type" className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
          {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t === "all" ? "All Types" : formatType(t)}</option>)}
        </select>
        <select value={stateFilter} onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
          title="Filter by state" className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
          {STATES.map((s) => <option key={s} value={s}>{s === "all" ? "All States" : formatType(s)}</option>)}
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Content</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Author</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">AI Verdict</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Confidence</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">State</th>
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
                        {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div>
                          {item.content_title && <p className="text-xs font-medium text-gray-700 truncate">{item.content_title}</p>}
                          <p className="text-xs text-gray-600 truncate">{item.content_preview}</p>
                          <span className="inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
                            {formatType(item.content_type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">@{item.author?.username}</td>
                      <td className="px-4 py-3">
                        <VerdictBadge verdict={item.ai_verdict?.verdict} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${confidenceColor(item.ai_verdict?.confidence || 0)}`}>
                          {Math.round((item.ai_verdict?.confidence || 0) * 100)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.normal}`}>
                          {PRIORITY_ICONS[item.priority]}
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StateBadge state={item.current_state} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {actionLoading === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-auto" />
                        ) : item.status === "resolved" ? (
                          <span className="text-xs text-gray-400 capitalize">{item.resolution}</span>
                        ) : canResolve ? (
                          <ActionButtons item={item} onAction={(action) => setResolveModal({ item, action })} />
                        ) : null}
                      </td>
                    </tr>
                    {expandedId === item.id && (
                      <tr>
                        <td colSpan={9} className="px-4 py-4 bg-gray-50/50 border-b border-gray-200">
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
            <span className="text-xs text-gray-500">Page {page} of {totalPages} ({total} items)</span>
            <div className="flex items-center gap-1">
              <button type="button" title="Previous page" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" title="Next page" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setResolveModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-violet-600" />
              {resolveModal.action === "reverse" ? "Reverse AI Decision" : resolveModal.action === "confirm" ? "Confirm Safe" : "Hide Content"}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {resolveModal.action === "reverse"
                ? "This will unhide the content and email the author that it was restored."
                : resolveModal.action === "confirm"
                  ? "This will close the review. Content stays visible."
                  : "This will hide the content and email the author."}
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-800 line-clamp-3">{resolveModal.item.content_preview}</p>
                <p className="text-[10px] text-gray-400 mt-1">by @{resolveModal.item.author?.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason <span className="text-gray-400">(optional)</span>
                </label>
                <textarea value={resolveReason} onChange={(e) => setResolveReason(e.target.value)}
                  placeholder="Why are you taking this action?" rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setResolveModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleResolve} disabled={actionLoading === resolveModal.item.id}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
                    resolveModal.action === "reverse" ? "bg-orange-600 hover:bg-orange-700"
                      : resolveModal.action === "hide" ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                  }`}>
                  {actionLoading === resolveModal.item.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  {resolveModal.action === "reverse" ? "Reverse" : resolveModal.action === "confirm" ? "Confirm Safe" : "Hide"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Renders action buttons per the docs:
 * - current_state = "hidden" → Reverse (orange)
 * - current_state = "visible" → Confirm Safe (green) + Hide (red)
 * Uses available_actions from API if present, falls back to current_state.
 */
function ActionButtons({ item, onAction }: { item: ReviewItem; onAction: (action: string) => void }) {
  const actions = item.available_actions?.length
    ? item.available_actions
    : item.current_state === "hidden"
      ? ["reverse"]
      : ["confirm", "hide"];

  return (
    <div className="flex items-center justify-end gap-1">
      {actions.includes("reverse") && (
        <button type="button" onClick={() => onAction("reverse")}
          className="px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded-md transition-colors">
          Reverse
        </button>
      )}
      {actions.includes("confirm") && (
        <button type="button" onClick={() => onAction("confirm")}
          className="px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors">
          Confirm Safe
        </button>
      )}
      {actions.includes("hide") && (
        <button type="button" onClick={() => onAction("hide")}
          className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors">
          Hide
        </button>
      )}
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

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon?: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    green: "text-green-700 bg-green-50 border-green-200",
    red: "text-red-700 bg-red-50 border-red-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.amber}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-medium opacity-70">{label}</p>
      </div>
      <p className="text-xl font-bold mt-1">{value}</p>
      {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles: Record<string, string> = {
    hide: "bg-red-100 text-red-800 border-red-200",
    remove: "bg-red-200 text-red-900 border-red-300",
    allow: "bg-green-50 text-green-700 border-green-200",
    escalate: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[verdict] || styles.escalate}`}>
      {verdict || "—"}
    </span>
  );
}

function StateBadge({ state }: { state: string }) {
  if (state === "hidden") {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"><EyeOff className="w-3 h-3" />Hidden</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"><Eye className="w-3 h-3" />Visible</span>;
}

function ExpandedDetail({ item }: { item: ReviewItem }) {
  const v = item.ai_verdict;
  const p = item.ai_payload;
  const categoryColor = (cat: string) => CATEGORY_COLORS[cat] || "bg-gray-100 text-gray-600";

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Left: AI Verdict */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Rationale</h4>
        <p className="text-xs text-gray-800 leading-relaxed bg-white rounded-lg p-3 border border-gray-100">
          {v?.rationale || "—"}
        </p>
        {v?.userFacingReason && (
          <p className="text-xs text-gray-500 italic">User-facing: {v.userFacingReason}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {(v?.categories || []).map((cat) => (
            <span key={cat} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${categoryColor(cat)}`}>{cat}</span>
          ))}
        </div>
        {item.status === "resolved" && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs font-medium text-green-700">
              Resolved: <span className="capitalize">{item.resolution}</span>
              {item.resolved_by_username && <span> by @{item.resolved_by_username}</span>}
            </p>
          </div>
        )}
      </div>

      {/* Right: Content + Author Signals */}
      <div className="space-y-3">
        {/* Flagged Content */}
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Flagged Content</h4>
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          {item.content_title && <p className="text-xs font-medium text-gray-700 mb-1">{item.content_title}</p>}
          <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
            {p?.subject?.content || item.content_preview}
          </p>
          <p className="text-[10px] text-gray-400 mt-2">
            {formatTypeShort(p?.subject?.type || item.content_type)} by @{item.author?.username}
            {p?.subject?.authorIsAnonymous && " (anonymous)"}
            {p?.subject?.createdAt && ` · ${formatDateShort(p.subject.createdAt)}`}
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
                <p className="text-[10px] text-gray-400 mt-1">{formatTypeShort(parent.type)}</p>
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

function formatTypeShort(t: string) {
  return t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
