import React, { useState, useEffect, useCallback } from "react";
import {
  Flag,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { GetContentFlags, ReviewContentFlag } from "../../../api/adminApis";
import { showToast } from "../../Helper/ShowToast";
import { getApiError } from "../utils/apiError";
import { MSG } from "../../constants/messages";

type FlagStatus = "pending" | "reviewed" | "dismissed" | "actioned";

interface FlagItem {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  description?: string;
  status: FlagStatus;
  created_at: string;
  reporter: { id: string; username: string; avatar?: string };
  reviewer?: { id: string; username: string } | null;
  reviewed_at?: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  reviewed: "bg-blue-50 text-blue-700 border-blue-200",
  dismissed: "bg-gray-50 text-gray-600 border-gray-200",
  actioned: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  reviewed: <Eye className="w-3.5 h-3.5" />,
  dismissed: <XCircle className="w-3.5 h-3.5" />,
  actioned: <Shield className="w-3.5 h-3.5" />,
};

const CONTENT_TYPES = ["all", "post", "comment", "topic", "nook", "nook_message"];
const STATUSES = ["all", "pending", "reviewed", "dismissed", "actioned"];

export function ContentFlagsPage() {
  const [flags, setFlags] = useState<FlagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.content_type = typeFilter;
      const res = await GetContentFlags(params);
      setFlags(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      showToast("error", getApiError(err, MSG.ADMIN.CONTENT_LOAD_FAILED));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleAction = async (flagId: string, status: "reviewed" | "dismissed" | "actioned") => {
    setActionLoading(flagId);
    try {
      await ReviewContentFlag(flagId, status);
      showToast("success", `Flag ${status}`);
      setFlags((prev) => prev.map((f) => (f.id === flagId ? { ...f, status } : f)));
    } catch (err) {
      showToast("error", getApiError(err, MSG.ADMIN.ACTION_FAILED));
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = flags.filter((f) => f.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flag className="w-6 h-6 text-red-500" />
            Content Flags
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} total flags {statusFilter !== "all" && `(${statusFilter})`}
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {pendingCount} pending review
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filters:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All Types" : t.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
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
        ) : flags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CheckCircle className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">No flags found</p>
            <p className="text-xs mt-1">All clear!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reporter</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 capitalize">
                        {flag.content_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{flag.reason}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {flag.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {flag.reporter?.avatar && (
                          <span className="text-base">{flag.reporter.avatar}</span>
                        )}
                        <span className="text-gray-700">{flag.reporter?.username || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[flag.status] || STATUS_STYLES.pending}`}
                      >
                        {STATUS_ICONS[flag.status]}
                        {flag.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(flag.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {flag.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1">
                          {actionLoading === flag.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <>
                              <button
                                onClick={() => handleAction(flag.id, "reviewed")}
                                className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Mark as reviewed"
                              >
                                Review
                              </button>
                              <button
                                onClick={() => handleAction(flag.id, "dismissed")}
                                className="px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                                title="Dismiss this flag"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => handleAction(flag.id, "actioned")}
                                className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Take action (remove content)"
                              >
                                Action
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-right text-xs text-gray-400">
                          {flag.reviewer?.username && (
                            <span>by {flag.reviewer.username}</span>
                          )}
                        </div>
                      )}
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
              Page {page} of {totalPages} ({total} flags)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
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
    </div>
  );
}
