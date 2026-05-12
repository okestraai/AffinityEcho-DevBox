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
  AlertTriangle,
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
  moderation_status: string;
  moderation_reason: string;
  reports_count: number;
  moderated_by: string;
  moderated_at: string;
  model_version: string;
  policy_version: string;
  raw_response: {
    verdict: string;
    confidence: number;
    severity: string;
    categories: string[];
    rationale: string;
    userFacingReason: string | null;
  };
  ai_confidence: number;
  created_at: string;
  updated_at: string;
}

interface ItemHistoryData {
  moderation: AuditItem[];
  reviews: Array<{
    id: string;
    content_type: string;
    content_id: string;
    priority: string;
    reason: string;
    ai_verdict: Record<string, unknown>;
    current_state: string;
    status: string;
    claimed_by: string | null;
    resolved_by: string | null;
    resolution: string | null;
    resolution_reason: string | null;
    resolved_at: string | null;
    created_at: string;
  }>;
  disagreements: Array<{
    id: string;
    content_type: string;
    content_id: string;
    ai_verdict: Record<string, unknown>;
    human_resolution: string;
    human_reason: string;
    resolved_by: string;
    created_at: string;
  }>;
}

const STATUS_STYLES: Record<string, string> = {
  allowed: "bg-green-50 text-green-700 border-green-200",
  visible: "bg-green-50 text-green-700 border-green-200",
  hidden: "bg-amber-50 text-amber-700 border-amber-200",
  removed: "bg-red-50 text-red-700 border-red-200",
  pending_review: "bg-blue-50 text-blue-700 border-blue-200",
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

export function AIAuditPage() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
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
      const res = await GetAIAuditTrail(params);
      setItems(res.data || []);
      setTotalPages(Math.ceil((res.pagination?.total || 0) / limit));
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      showToast("error", getApiError(err, MSG.ADMIN.AI_AUDIT_LOAD_FAILED));
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const isAI = (by: string) => by?.startsWith("ai:");
  const moderatorLabel = (by: string) => {
    if (!by) return "—";
    if (by.startsWith("ai:")) return by.replace("ai:", "AI: ");
    if (by.startsWith("human:")) return by.replace("human:", "Admin: ");
    return by;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSearch className="w-6 h-6 text-violet-500" />
          AI Audit Trail
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse all AI moderation decisions ({total.toLocaleString()} total)
        </p>
      </div>

      {/* Tab Navigation */}
      <AIModerationTabs />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filters:</span>
        </div>
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
            <p className="text-sm font-medium">No audit records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Confidence</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Moderated By</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Model</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                        {formatType(item.content_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[item.moderation_status] || STATUS_STYLES.allowed}`}>
                        {item.moderation_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ConfidenceBar value={item.ai_confidence || 0} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate text-xs">
                      {item.moderation_reason || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${isAI(item.moderated_by) ? "text-violet-600" : "text-blue-600"}`}>
                        {isAI(item.moderated_by) ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {moderatorLabel(item.moderated_by)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {item.model_version || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(item.moderated_at || item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(item.content_type, item.content_id)}
                        className="px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                      >
                        History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} ({total.toLocaleString()} records)
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

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setDetailModal(null); setDetailData(null); }} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-violet-500" />
                Item History
              </h3>
              <button
                type="button"
                title="Close"
                onClick={() => { setDetailModal(null); setDetailData(null); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4 font-mono">
              {formatType(detailModal.contentType)} &middot; {detailModal.contentId}
            </p>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            ) : detailData ? (
              <div className="space-y-6">
                {/* Moderation Timeline */}
                {detailData.moderation.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Moderation History
                    </h4>
                    <div className="space-y-2">
                      {detailData.moderation.map((entry, idx) => (
                        <div key={idx} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex-shrink-0 mt-0.5">
                            {isAI(entry.moderated_by) ? (
                              <Bot className="w-4 h-4 text-violet-500" />
                            ) : (
                              <User className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${STATUS_STYLES[entry.moderation_status] || ""}`}>
                                {entry.moderation_status}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {moderatorLabel(entry.moderated_by)}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {formatDate(entry.moderated_at || entry.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{entry.moderation_reason}</p>
                            {entry.ai_confidence > 0 && (
                              <p className="text-[10px] text-gray-400 mt-1">
                                Confidence: {Math.round(entry.ai_confidence * 100)}%
                                {entry.model_version && ` · ${entry.model_version}`}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {detailData.reviews.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Review Queue Items
                    </h4>
                    <div className="space-y-2">
                      {detailData.reviews.map((review) => (
                        <div key={review.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${STATUS_STYLES[review.status === "resolved" ? (review.resolution === "reverse" ? "hidden" : "allowed") : "pending_review"] || ""}`}>
                              {review.status}
                            </span>
                            {review.resolution && (
                              <span className="text-[10px] font-medium text-gray-600 capitalize">
                                ({review.resolution})
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">{formatDate(review.created_at)}</span>
                          </div>
                          {review.resolution_reason && (
                            <p className="text-xs text-gray-600 mt-1">{review.resolution_reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disagreements */}
                {detailData.disagreements.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" />
                      Disagreements
                    </h4>
                    <div className="space-y-2">
                      {detailData.disagreements.map((d) => (
                        <div key={d.id} className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-orange-700 capitalize">
                              Human: {d.human_resolution}
                            </span>
                            <span className="text-[10px] text-orange-500">{formatDate(d.created_at)}</span>
                          </div>
                          <p className="text-xs text-orange-700 mt-1">{d.human_reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailData.moderation.length === 0 && detailData.reviews.length === 0 && detailData.disagreements.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">No history found for this item.</p>
                )}
              </div>
            ) : null}
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
