import React, { useState, useEffect, useCallback } from "react";
import {
  FileSearch,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Bot,
  User,
  X,
  Clock,
  History,
  Scale,
} from "lucide-react";
import { GetAIAuditTrail, GetAIAuditItemHistory } from "../../../api/adminApis";
import { NavLink } from "react-router-dom";
import { showToast } from "../../Helper/ShowToast";
import { getApiError } from "../utils/apiError";
import { MSG } from "../../constants/messages";

interface AuditItem {
  id: string;
  content_type: string;
  content_id: string;
  content_preview: string;
  content_title: string | null;
  author: { id: string; username: string };
  moderation_status: string;
  moderation_reason: string;
  moderated_by: string;
  moderated_at: string;
  model_version: string;
  policy_version: string;
  ai_confidence: number;
  raw_response: {
    verdict: string;
    confidence: number;
    severity: string;
    categories: string[];
    rationale: string;
    userFacingReason: string | null;
  };
  was_reversed: boolean;
  created_at: string;
}

interface DetailContent {
  type: string;
  id: string;
  preview: string;
  title: string | null;
  author: { id: string; username: string };
  created_at: string;
  current_state: string;
}

interface ModerationEntry {
  action: string;
  by: string;
  by_username: string | null;
  reason: string;
  confidence: number;
  at: string;
}

interface ReviewEntry {
  id: string;
  priority: string;
  reason: string;
  status: string;
  resolution: string | null;
  resolution_reason: string | null;
  resolved_by_username: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface DisagreementEntry {
  ai_said: string;
  ai_confidence: number;
  ai_categories: string[];
  human_said: string;
  human_reason: string;
  reversed_by_username: string;
  created_at: string;
}

interface ItemHistoryData {
  content: DetailContent;
  moderation_history: ModerationEntry[];
  review_history: ReviewEntry[];
  disagreements: DisagreementEntry[];
}

const STATUS_STYLES: Record<string, string> = {
  allowed: "bg-green-50 text-green-700 border-green-200",
  visible: "bg-green-50 text-green-700 border-green-200",
  hidden: "bg-red-100 text-red-700 border-red-200",
  removed: "bg-red-200 text-red-800 border-red-300",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
};

const CONTENT_TYPES = [
  "all", "feed_post", "feed_comment", "forum_topic", "forum_comment",
  "nook", "nook_message", "referral_post", "referral_comment",
];

const AUDIT_STATUSES = ["all", "allowed", "hidden", "removed", "pending_review"];

export function AIAuditPage() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailModal, setDetailModal] = useState<{ contentType: string; contentId: string } | null>(null);
  const [detailData, setDetailData] = useState<ItemHistoryData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const limit = 20;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (typeFilter !== "all") params.contentType = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await GetAIAuditTrail(params);
      setItems(res.data || []);
      setTotalPages(Math.ceil((res.pagination?.total || 0) / limit));
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      showToast("error", getApiError(err, MSG.ADMIN.AI_AUDIT_LOAD_FAILED));
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openDetail = async (contentType: string, contentId: string) => {
    setDetailModal({ contentType, contentId });
    setDetailLoading(true);
    try {
      const res = await GetAIAuditItemHistory(contentType, contentId);
      setDetailData(res);
    } catch (err) {
      showToast("error", getApiError(err, MSG.ADMIN.AI_AUDIT_DETAIL_FAILED));
      setDetailModal(null);
    } finally {
      setDetailLoading(false);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSearch className="w-6 h-6 text-violet-500" />
          AI Audit Trail
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse all AI moderation decisions ({total.toLocaleString()} total)
        </p>
      </div>

      <AIModerationTabs />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filters:</span>
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          title="Filter by content type" className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
          {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t === "all" ? "All Types" : formatType(t)}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          title="Filter by status" className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
          {AUDIT_STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "All Statuses" : formatType(s)}</option>)}
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
            <p className="text-sm font-medium">No audit records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Content</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Author</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Verdict</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Confidence</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Categories</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reversed</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-gray-700 truncate">{item.content_preview}</p>
                      <span className="inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
                        {formatType(item.content_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">@{item.author?.username}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                        item.raw_response?.verdict === "hide" ? "bg-red-100 text-red-800 border-red-200"
                          : item.raw_response?.verdict === "allow" ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {item.raw_response?.verdict || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${confidenceColor(item.ai_confidence || 0)}`}>
                        {Math.round((item.ai_confidence || 0) * 100)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[item.moderation_status] || ""}`}>
                        {item.moderation_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {(item.raw_response?.categories || []).slice(0, 2).map((cat) => (
                          <span key={cat} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">{cat}</span>
                        ))}
                        {(item.raw_response?.categories || []).length > 2 && (
                          <span className="text-[10px] text-gray-400">+{item.raw_response.categories.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.was_reversed ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">Reversed</span>
                      ) : (
                        <span className="text-xs text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(item.moderated_at || item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => openDetail(item.content_type, item.content_id)}
                        className="px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-md transition-colors">
                        History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">Page {page} of {totalPages} ({total.toLocaleString()} records)</span>
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

      {/* Detail Modal — Timeline */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setDetailModal(null); setDetailData(null); }} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-violet-500" />
                Item History
              </h3>
              <button type="button" title="Close" onClick={() => { setDetailModal(null); setDetailData(null); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            ) : detailData ? (
              <div className="space-y-4">
                {/* Content Info */}
                {detailData.content && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    {detailData.content.title && <p className="text-xs font-medium text-gray-700 mb-1">{detailData.content.title}</p>}
                    <p className="text-xs text-gray-800">{detailData.content.preview}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatType(detailData.content.type)} by @{detailData.content.author?.username} &middot; Currently: {detailData.content.current_state}
                    </p>
                  </div>
                )}

                {/* Timeline */}
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />

                  {/* Content Created */}
                  {detailData.content && (
                    <TimelineItem icon="create" label={`Content created by @${detailData.content.author?.username}`} date={detailData.content.created_at} />
                  )}

                  {/* Moderation History */}
                  {(detailData.moderation_history || []).map((entry, i) => (
                    <TimelineItem key={`mod-${i}`}
                      icon={entry.by.startsWith("ai:") ? "ai" : "human"}
                      label={
                        entry.by.startsWith("ai:")
                          ? `AI: ${entry.action.toUpperCase()} (${Math.round(entry.confidence * 100)}% confidence)`
                          : `${entry.by_username || "Admin"}: ${entry.action.toUpperCase()}`
                      }
                      detail={entry.reason}
                      date={entry.at}
                    />
                  ))}

                  {/* Disagreements */}
                  {(detailData.disagreements || []).map((d, i) => (
                    <TimelineItem key={`dis-${i}`}
                      icon="disagree"
                      label={`${d.reversed_by_username} overruled AI (${d.ai_said} → ${d.human_said})`}
                      detail={d.human_reason}
                      date={d.created_at}
                    />
                  ))}
                </div>

                {(detailData.moderation_history?.length ?? 0) === 0 && (detailData.disagreements?.length ?? 0) === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No moderation history for this item.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineItem({ icon, label, detail, date }: { icon: string; label: string; detail?: string; date: string }) {
  const iconEl = icon === "ai" ? <Bot className="w-3.5 h-3.5 text-violet-500" />
    : icon === "human" ? <User className="w-3.5 h-3.5 text-blue-500" />
      : icon === "disagree" ? <Scale className="w-3.5 h-3.5 text-orange-500" />
        : <Clock className="w-3.5 h-3.5 text-gray-400" />;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="relative flex gap-3">
      <div className="absolute -left-4 top-1 w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center">
        {iconEl}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800">{label}</p>
        {detail && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
        <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(date)}</p>
      </div>
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
