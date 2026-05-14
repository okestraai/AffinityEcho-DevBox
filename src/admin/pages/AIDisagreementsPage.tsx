import React, { useState, useEffect, useCallback } from "react";
import {
  Scale,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
} from "lucide-react";
import { GetAIDisagreements } from "../../../api/adminApis";
import { NavLink } from "react-router-dom";
import { showToast } from "../../Helper/ShowToast";
import { getApiError } from "../utils/apiError";
import { MSG } from "../../constants/messages";

interface AIVerdict {
  verdict: string;
  confidence: number;
  severity: string;
  categories: string[];
  rationale: string;
}

interface DisagreementItem {
  id: string;
  content_type: string;
  content_id: string;
  content_preview: string;
  content_title: string | null;
  author: { id: string; username: string };
  ai_verdict: AIVerdict;
  human_resolution: string;
  human_reason: string;
  reversed_by: { id: string; username: string };
  created_at: string;
}

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

export function AIDisagreementsPage() {
  const [items, setItems] = useState<DisagreementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 20;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (typeFilter !== "all") params.contentType = typeFilter;
      const res = await GetAIDisagreements(params);
      setItems(res.data || []);
      setTotalPages(Math.ceil((res.pagination?.total || 0) / limit));
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      showToast("error", getApiError(err, MSG.ADMIN.AI_DISAGREEMENTS_LOAD_FAILED));
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const formatType = (t: string) => t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const confidenceColor = (c: number) => {
    const pct = c * 100;
    if (pct >= 90) return "text-green-700";
    if (pct >= 75) return "text-amber-700";
    return "text-red-700";
  };

  const categoryColor = (cat: string) => CATEGORY_COLORS[cat] || "bg-gray-100 text-gray-600";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Scale className="w-6 h-6 text-orange-500" />
          AI Disagreements
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Cases where human moderators overruled AI decisions ({total} total)
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
            <p className="text-sm font-medium">No disagreements found</p>
            <p className="text-xs mt-1">AI and humans are aligned!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-8"><span className="sr-only">Expand</span></th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Content</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">AI Said</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">AI Confidence</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Human Said</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Human Reason</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reversed By</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                      <td className="px-4 py-3">
                        {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-xs text-gray-700 truncate">{item.content_preview}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-400">@{item.author?.username}</span>
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
                            {formatType(item.content_type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 capitalize">
                          {item.ai_verdict?.verdict || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${confidenceColor(item.ai_verdict?.confidence || 0)}`}>
                          {Math.round((item.ai_verdict?.confidence || 0) * 100)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 capitalize">
                          {item.human_resolution}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate text-xs">
                        {item.human_reason || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        @{item.reversed_by?.username}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                    {expandedId === item.id && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-gray-50/50 border-b border-gray-200">
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* AI Side */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Bot className="w-3.5 h-3.5 text-violet-500" />
                                AI Decision
                              </h4>
                              <div className="bg-white rounded-lg border border-gray-100 p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 text-xs w-16">Severity:</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                    item.ai_verdict?.severity === "high" || item.ai_verdict?.severity === "critical" ? "bg-red-100 text-red-700"
                                      : item.ai_verdict?.severity === "medium" ? "bg-amber-100 text-amber-700"
                                        : "bg-gray-100 text-gray-600"
                                  }`}>
                                    {item.ai_verdict?.severity || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 text-xs">Rationale:</span>
                                  <p className="text-xs text-gray-800 mt-1 leading-relaxed">{item.ai_verdict?.rationale || "—"}</p>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(item.ai_verdict?.categories || []).map((cat) => (
                                    <span key={cat} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryColor(cat)}`}>{cat}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {/* Human Side */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-blue-500" />
                                Human Override
                              </h4>
                              <div className="bg-white rounded-lg border border-orange-200 p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 text-xs w-16">Action:</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800 border border-orange-200 capitalize">
                                    {item.human_resolution}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 text-xs">Reason:</span>
                                  <p className="text-xs text-gray-800 mt-1 leading-relaxed">{item.human_reason || "—"}</p>
                                </div>
                                <p className="text-[10px] text-gray-400">by @{item.reversed_by?.username}</p>
                              </div>
                              {/* Content Preview */}
                              <div className="bg-white rounded-lg border border-gray-100 p-3">
                                {item.content_title && <p className="text-xs font-medium text-gray-700 mb-1">{item.content_title}</p>}
                                <p className="text-xs text-gray-600 line-clamp-4">{item.content_preview}</p>
                                <p className="text-[10px] text-gray-400 mt-1">by @{item.author?.username}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">Page {page} of {totalPages} ({total} disagreements)</span>
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
